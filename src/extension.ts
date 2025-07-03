// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import Monitor from "./data/monitor";
import { exec } from "child_process";
import * as util from "util";

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
        childrenToRun = await processTestItemArray(request.include, run);
      } else if (controller.items) {
        childrenToRun = await processTestItemCollection(controller.items, run);
      } else {
        throw new Error("No items to run");
      }
      for (const item of childrenToRun) {
        try {
          await runner(item as vscode.TestItem, item.id);
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

async function processTestItemArray(toRun: readonly vscode.TestItem[], run: vscode.TestRun) {
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
        if (!path.endsWith(".py")) {
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
        if (!path.endsWith(".py")) {
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

async function runner(item: vscode.TestItem, path: string) {
  const parentItem = (item as vscode.TestItem).parent;
  const folder = (parentItem as vscode.TestItem).id;
  console.log(
    `Running test for item: ${
      (item as vscode.TestItem).id
    } in folder: ${folder}`
  );
  // Get python_path from config
  const config = vscode.workspace.getConfiguration("gtm");
  let refItems: Monitor[] = config.get("folders_to_monitor", []);

  const monitorItem =
    refItems.find((i) => i.path === folder)?.python_path || "";

  await runUnittest(folder, monitorItem, path);
}

async function refreshTests(controller: vscode.TestController) {
  const config = vscode.workspace.getConfiguration("gtm");
  let newItems: Monitor[] = config.get("folders_to_monitor", []);
  controller.items.replace([]);

  for (const item of newItems) {
    const projectName = item.path.split("\\").pop() || item.path;
    const testItem = controller.createTestItem(item.path, projectName);
    item.test_files?.forEach((file) => {
      const testFileItem = controller.createTestItem(
        `${item.path}${file}`,
        file
      );
      testItem.children.add(testFileItem);
    });
    controller.items.add(testItem);
  }
}

async function runUnittest(
  folder: string,
  pythonPath: string,
  file: string
): Promise<void> {
  console.log(`Running unittest in folder: ${folder} for file: ${file}`);
  console.log(`Using Python executable: ${pythonPath}`);
  console.log(`Full command: ${folder}${pythonPath} ${file}`);
  const res = await execPromise(`${folder}${pythonPath} ${file}`, {
    cwd: folder,
  });
  const lines = res.stderr.split("\n").filter((line) => line.trim() !== "");
  const status = lines.pop()?.trim() || "Unknown status";
  if (!status.startsWith("OK")) {
    throw new Error(`${status}`);
  }
}

// This method is called when your extension is deactivated
export function deactivate() {}
