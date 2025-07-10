import Monitor from "../data/monitor";

describe("Monitor", () => {
    it("should initialize with default values when no data is provided", () => {
        const monitor = new Monitor();
        expect(monitor.path).toBe("");
        expect(monitor.runners).toEqual([]);
    });

    it("should initialize with provided values", () => {
        const data = {
            path: "/some/path",
            runners: [
                {
                    type: "python" as const,
                    executable_path: "/usr/bin/python3",
                    test_files: ["test1.py", "test2.py"],
                    use_python_path: true
                }
            ],
            evidence_collector: ["collector1", "collector2"],
        };
        const monitor = new Monitor(data);
        expect(monitor.path).toBe(data.path);
        expect(monitor.runners.length).toBe(1);
        expect(monitor.runners[0].type).toBe("python");
        expect(monitor.runners[0].executable_path).toBe(data.runners[0].executable_path);
        expect(monitor.runners[0].test_files).toEqual(data.runners[0].test_files);
        expect(monitor.evidence_collector).toEqual(data.evidence_collector);
        expect(monitor.runners[0].use_python_path).toBe(data.runners[0].use_python_path);
    });

    it("should use default values for missing optional fields", () => {
        const data = {
            path: "/some/path",
            runners: [
                {
                    type: "python" as const,
                    test_files: [],
                    executable_path: undefined,
                    evidence_collector: undefined,
                    use_python_path: true
                }
            ]
        };
        const monitor = new Monitor(data);
        expect(monitor.path).toBe(data.path);
        expect(monitor.runners.length).toBe(1);
        expect(monitor.runners[0].type).toBe("python");
        expect(monitor.runners[0].executable_path).toBe(undefined);
        expect(monitor.runners[0].test_files).toEqual(data.runners[0].test_files);
        expect(monitor.evidence_collector).toEqual([]);
        expect(monitor.runners[0].use_python_path).toBe(data.runners[0].use_python_path);
    });

    it("should handle undefined fields in the input object", () => {
        const data = {
            path: undefined,
            runners: [
                {
                    type: "python" as const,
                    test_files: [],
                    executable_path: undefined,
                    evidence_collector: undefined,
                    use_python_path: true
                }
            ]
        };
        const monitor = new Monitor(data);
        expect(monitor.path).toBe("");
        expect(monitor.runners.length).toBe(1);
        expect(monitor.runners[0].type).toBe("python");
        expect(monitor.runners[0].executable_path).toBe(undefined);
        expect(monitor.runners[0].test_files).toEqual([]);
        expect(monitor.evidence_collector).toEqual([]);
        expect(monitor.runners[0].use_python_path).toBe(true);
    });
});