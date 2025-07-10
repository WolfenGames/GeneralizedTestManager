// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import Monitor from "./data/monitor";
import { exec } from "child_process";
import * as util from "util";
import copyFiles from "./process/evidence_collection";
import zipFolder from "./process/zipper";
import RunnerType from "./data/runner_type";

const execPromise = util.promisify(exec);

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  const controller = vscode.tests.createTestController(
    "generalizedTestManager",
    "Generalized Test Manager"
  );
  context.subscriptions.push(controller);

  controller.resolveHandler = async () => {
    await refreshTests(controller);
  };

  vscode.workspace.onDidChangeConfiguration((event) => {
    if (event.affectsConfiguration("gtm.folders_to_monitor")) {
      refreshTests(controller);
    }
  });

  const runProfile = controller.createRunProfile(
    "Run Tests",
    vscode.TestRunProfileKind.Run,
    async (request, token) => {
      const run = controller.createTestRun(request);
      let x: vscode.TestItemCollection;
      let childrenToRun: vscode.TestItem[] = [];
      if (request.include) {
        console.log(`Running tests for included items: ${request.include}`);
        childrenToRun = await processTestItemArray(request.include, run);
      } else if (controller.items) {
        console.log(`Running tests for controller items: ${controller.items}`);
        childrenToRun = await processTestItemCollection(controller.items, run);
      } else {
        throw new Error("No items to run");
      }
      for (const item of childrenToRun) {
        try {
          await runner(item as vscode.TestItem);
          run.passed(item as vscode.TestItem);
        } catch (error) {
          console.error(`Error running test: ${error}`);
          run.failed(
            item as vscode.TestItem,
            error instanceof Error ? error : new Error("Unknown error")
          );
        }
      }
      run.end();
    },
    true
  );
  context.subscriptions.push(runProfile);
}

export async function processTestItemArray(toRun: readonly vscode.TestItem[], run: vscode.TestRun) {
  let childrenToRun: vscode.TestItem[] = [];
  for (const parent of toRun) {
    run.started(parent as vscode.TestItem);
    const hasChildren = (parent as vscode.TestItem).children.size > 0;
    console.log(`Parent: ${parent.id}, Has Children: ${hasChildren}`);
    if (!hasChildren) {
      run.started(parent as vscode.TestItem);
      childrenToRun.push(parent as vscode.TestItem);
    } else {
      for (const [id, child] of (parent as vscode.TestItem).children) {
        run.started(child as vscode.TestItem);
        const path = (child as vscode.TestItem).id;
        const splitPath= path.split(".");
        splitPath.pop();
        const valid=splitPath.find((p) => p === "py") || splitPath.find((p) => p === "feature");
        if (!valid) {
          const children = (child as vscode.TestItem).children;
          for (const [childId, childItem] of children) {
            run.started(childItem as vscode.TestItem);
            childrenToRun.push(childItem as vscode.TestItem);
          }
        } else {
          run.started(child as vscode.TestItem);
          childrenToRun.push(child as vscode.TestItem);
        }
      }
    }
  }
  return childrenToRun;
}

async function processTestItemCollection(toRun: vscode.TestItemCollection, run: vscode.TestRun) {
  let childrenToRun: vscode.TestItem[] = [];
  for (const [id, parent] of toRun) {
    run.started(parent as vscode.TestItem);
    const hasChildren = (parent as vscode.TestItem).children.size > 0;
    console.log(`Parent: ${parent.id}, Has Children: ${hasChildren}`);
    if (!hasChildren) {
      run.started(parent as vscode.TestItem);
      childrenToRun.push(parent as vscode.TestItem);
    } else {
      for (const [id, child] of (parent as vscode.TestItem).children) {
        run.started(child as vscode.TestItem);
        const path = (child as vscode.TestItem).id;
        const splitPath= path.split(".");
        splitPath.pop();
        const valid=splitPath.find((p) => p === "py") || splitPath.find((p) => p === "feature");
        if (!valid) {
          const children = (child as vscode.TestItem).children;
          for (const [childId, childItem] of children) {
            run.started(childItem as vscode.TestItem);
            childrenToRun.push(childItem as vscode.TestItem);
          }
        } else {
          run.started(child as vscode.TestItem);
          childrenToRun.push(child as vscode.TestItem);
        }
      }
    }
  }
  return childrenToRun;
}

export async function runner(item: vscode.TestItem) {
  const parentItem = (item as vscode.TestItem).parent;
  const folder = (parentItem as vscode.TestItem).id.split(".")[0];
  const projectType = (parentItem as vscode.TestItem).id.split(".")[1] || "python";
  const config = vscode.workspace.getConfiguration("gtm");
  let refItems: Monitor[] = config.get("folders_to_monitor", []);
 
  console.log(
    `Running test for item: ${
      (item as vscode.TestItem).id
    } in folder: ${folder} for ${projectType}`
  );

  const MonitorItemParent=refItems.find((i) => i.path === folder); 
  if (!MonitorItemParent) {
    throw new Error(`No monitor item found for folder: ${folder}`);
  }
  const EffectiveRunner = MonitorItemParent.runners.find((r) => r.type === projectType);
  if (!EffectiveRunner) {
    throw new Error(
      `No runner found for type: ${projectType} in folder: ${folder}`
    );
  }

  console.log(
    `Effective runner for item: ${item.id} is ${EffectiveRunner.type} with path: ${MonitorItemParent.path}`
  );

  switch (EffectiveRunner.type) {
    case "python":
      console.log("Running python unittest");
      await runUnittest(
        MonitorItemParent,
        EffectiveRunner,
        item as vscode.TestItem // Pass the test item to update its message
      );
      break;
    case "behave":
      console.log("Running behave tests");
      await runBehave(
        MonitorItemParent,
        EffectiveRunner,
        item as vscode.TestItem // Pass the test item to update its message
      );
      break;
    default:
      throw new Error(
        `Unsupported type: ${EffectiveRunner.type}. Only 'python' and 'behave' are supported.`
      );
  }

  const evidenceLocation = config.get("evidence_location", "");
  if (evidenceLocation === "") {
    return;
  }

  for (const collector of MonitorItemParent?.evidence_collector || []) {
    const collectorPath = `${folder}${collector}`;
    const folderName = MonitorItemParent?.path.split("\\").pop() || MonitorItemParent?.path;
    const dest = `${evidenceLocation}\\${folderName}`;
    console.log(`Running evidence collector: ${collectorPath} to ${dest}`);
    copyFiles(collectorPath, dest);
    // get timestamp for the folder
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    zipFolder(
      dest,
      `${evidenceLocation}\\zips\\${folderName}_${timestamp}.zip`
    );
  }
}

export async function refreshTests(controller: vscode.TestController) {
  const config = vscode.workspace.getConfiguration("gtm");
  let newItems: Monitor[] = config.get("folders_to_monitor", []);
  controller.items.replace([]);

  for (const item of newItems) {
    const projectName = item.path.split("\\").pop() || item.path;
    for (const runner of item.runners) {
      const controllerItem = controller.createTestItem(
        `${item.path}.${runner.type}`,
        `${projectName} (${runner.type})`
      );
      runner.test_files?.forEach((file) => {
        const testFileItem = controller.createTestItem(
          `${item.path}${file}.${runner.type}`,
          file
        );
        controllerItem.children.add(testFileItem);
      });
      controller.items.add(controllerItem);
    }
  }
}

export async function runBehave(
  MonitorItemParent: Monitor,
  EffectiveRunner: RunnerType,
  testItem: vscode.TestItem // Pass the test item to update its message
): Promise<void> {
  const folder = MonitorItemParent.path;
  const splitId = (testItem.id as string).split(".");
  splitId.pop(); // a identifier thing
  const testfile = splitId.join(".");
  let runString = EffectiveRunner.executable_path;
  if (EffectiveRunner.use_python_path) {
    runString = folder + EffectiveRunner.executable_path;
  }
  console.log(`${runString} ${testfile}`);
  let stdout = "";
  try {
    const res = await execPromise(`${runString} ${testfile}`, {
      cwd: folder,
    });
    stdout = res.stdout.trim();
  } catch (error) {
    if (typeof error === "object" && error !== null && "stdout" in error) {
      stdout = (error as { stdout: string }).stdout;
    } else {
      console.error(`Error running behave: ${error}`);
      if (!testItem.error) {
        testItem.error = `Error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`;
      }
      throw error;
    }
  }
  const splitOutput = stdout.trim().split("\n");
  const effectiveLine=splitOutput[splitOutput.length - 4];
  const regex=/(\d+) features? passed, (\d+) failed, (\d+) skipped/;
  const match = effectiveLine.match(regex);
  const passed = match ? parseInt(match[1]) : 0;
  const failed = match ? parseInt(match[2]) : 0;
  const skipped = match ? parseInt(match[3]) : 0;
  if (skipped+failed>0) {
    throw new Error(
      `Behave tests failed or skipped: ${failed} failed, ${skipped} skipped, ${passed} passed`
    );
  }
  if (passed === 0) {
    throw new Error("No tests passed");
  }
}

export async function runUnittest(
  MonitorItemParent: Monitor,
  EffectiveRunner: RunnerType,
  testItem: vscode.TestItem // Pass the test item to update its message
): Promise<void> {
  const folder = MonitorItemParent.path;
  const splitId = (testItem.id as string).split(".");
  splitId.pop(); // a identifier thing
  const testfile = splitId.join(".");
  let runString = EffectiveRunner.executable_path;
  if (EffectiveRunner.use_python_path) {
    runString = folder + EffectiveRunner.executable_path;
  }
  console.log(`${runString} ${testfile}`);
  try {
    const res = await execPromise(`${runString} ${testfile}`, {
      cwd: folder,
    });
    const stdoutOutput = res.stderr.trim().split("\n").pop();
    if (!stdoutOutput?.startsWith("OK")) {
      testItem.error = res.stderr.trim() || stdoutOutput;
      throw new Error(stdoutOutput || "Test failed with no output");
    }
  } catch (error) {
    console.error(`Error running unittest: ${error}`);
    throw error;
  }
}

// This method is called when your extension is deactivated
export function deactivate() {}
