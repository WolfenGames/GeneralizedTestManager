class Monitor {
  /**
   * The path to the folder to monitor.
   * Can be absolute or workspace-relative.
   */
  path: string;

  /**
   * The type of folder. Currently only 'python' is supported.
   */
  type: "python";

  /**
   * Optional path to the Python executable.
   * If not provided, the extension will try to find it in the folder's .env or .venv directories.
   */
  python_path?: string;

  /**
   * Optional path to a specific test file to run.
   * If not provided, the extension will run all tests in the folder.
   */
  test_files: string[];

  evidence_collector?: string[];

  constructor(data: Partial<Monitor> = {}) {
    this.path = data.path ?? "";
    this.type = data.type ?? "python";
    this.python_path = data.python_path ?? "";
    this.test_files = data.test_files ?? [];
    this.evidence_collector = data.evidence_collector ?? [];
  }
}

export default Monitor;
