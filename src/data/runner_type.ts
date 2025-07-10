type runnerType = "python" | "behave";

export default class RunnerType {
    type: runnerType;

    executable_path?: string;

    use_python_path: boolean;

    test_files: string[];

    constructor(data: Partial<RunnerType> = {}) {
        this.type = data.type ?? "python";
        this.executable_path = data.executable_path ?? "";
        this.test_files = data.test_files ?? [];
        this.use_python_path = data.use_python_path ?? false;
    }
}