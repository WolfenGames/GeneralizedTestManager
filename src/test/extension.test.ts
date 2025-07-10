// extension.test.ts
import * as vscode from "vscode";
import { activate, refreshTests, runner } from "../extension";

jest.mock("vscode");
jest.mock("../process/evidence_collection");
jest.mock("../process/zipper");

// Mock TestRunProfileKind for tests
(vscode as any).TestRunProfileKind = { Run: "run" };

describe("VSCode Extension", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    
    // Mock workspace configuration
    (vscode.workspace.getConfiguration as jest.Mock).mockReturnValue({
      get: jest
        .fn()
        .mockImplementationOnce(() => [
          {
            path: "/my/project/",
            test_files: ["tests/test1.py", "tests/test2.py"],
            python_path: "/env/bin/python",
            evidence_collector: ["/collector"],
          },
        ])
        .mockImplementationOnce(() => "C:\\evidence"),
    });

    // Reset vscode tests mocks
    (vscode.tests.createTestController as jest.Mock).mockImplementation(
      (id, label) => ({
        id,
        label,
        createRunProfile: jest.fn(() => ({
          run: jest.fn(),
        })),
        createTestRun: jest.fn(() => ({
          started: jest.fn(),
          passed: jest.fn(),
          failed: jest.fn(),
          end: jest.fn(),
        })),
        createTestItem: jest.fn((itemId, itemLabel) => ({
          id: itemId,
          label: itemLabel,
          children: {
            add: jest.fn(),
            get: jest.fn(),
          },
        })),
        items: {
          add: jest.fn((id, label) => ({
            id,
            label,
            children: {
              add: jest.fn(),
              get: jest.fn(),
            },
          })),
          replace: jest.fn(),
        },
      })
    );
  });

  test("activate registers test controller and run profile", () => {
    const context = { subscriptions: [] } as unknown as vscode.ExtensionContext;
    activate(context);

    expect(vscode.tests.createTestController).toHaveBeenCalledWith(
      "generalizedTestManager",
      "Generalized Test Manager"
    );

    const controller = (vscode.tests.createTestController as jest.Mock).mock
      .results[0].value;
    expect(controller.createRunProfile).toHaveBeenCalledWith(
      "Run Tests",
      vscode.TestRunProfileKind.Run,
      expect.any(Function),
      true
    );
    expect(context.subscriptions).toContain(controller);
  });

  test("refreshTests updates test items", () => {
    const context = { subscriptions: [] } as unknown as vscode.ExtensionContext;
    activate(context);
    const controller = (vscode.tests.createTestController as jest.Mock).mock
      .results[0].value;

    refreshTests(controller);

    expect(controller.items.add).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "/my/project/",
        label: "/my/project/",
      })
    );
  });

  test("runner executes tests and handles results", async () => {
    const context = { subscriptions: [] } as unknown as vscode.ExtensionContext;
    activate(context);
    const controller = (vscode.tests.createTestController as jest.Mock).mock
      .results[0].value;
    const runProfile = controller.createRunProfile.mock.results[0].value;

    const run = controller.createTestRun();
    run.started();

    // Simulate test execution
    const testItem = controller.items.add("test1", "Test 1");
    run.passed(testItem);

    run.end();

    // Simulate calling the run handler as VSCode would
    if (runProfile.run.mock.calls.length === 0) {
      // The run handler is registered as the third argument to createRunProfile
      const runHandler = controller.createRunProfile.mock.calls[0][2];
      runProfile.run(runHandler);
    }

    expect(runProfile.run).toHaveBeenCalledWith(expect.any(Function));
    expect(run.passed).toHaveBeenCalledWith(testItem);
  });
});
