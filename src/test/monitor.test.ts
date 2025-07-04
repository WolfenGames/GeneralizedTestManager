import Monitor from "../data/monitor";
import { expect } from '@jest/globals';

describe("Monitor", () => {
    it("should initialize with default values when no data is provided", () => {
        const monitor = new Monitor();
        expect(monitor.path).toBe("");
        expect(monitor.type).toBe("python");
        expect(monitor.python_path).toBe("");
        expect(monitor.test_files).toEqual([]);
        expect(monitor.evidence_collector).toEqual([]);
    });

    it("should initialize with provided values", () => {
        const data = {
            path: "/some/path",
            type: "python" as const,
            python_path: "/usr/bin/python3",
            test_files: ["test1.py", "test2.py"],
            evidence_collector: ["collector1", "collector2"]
        };
        const monitor = new Monitor(data);
        expect(monitor.path).toBe(data.path);
        expect(monitor.type).toBe("python");
        expect(monitor.python_path).toBe(data.python_path);
        expect(monitor.test_files).toEqual(data.test_files);
        expect(monitor.evidence_collector).toEqual(data.evidence_collector);
    });

    it("should use default values for missing optional fields", () => {
        const data = {
            path: "/another/path",
            type: "python" as const,
            test_files: ["test3.py"]
        };
        const monitor = new Monitor(data);
        expect(monitor.path).toBe(data.path);
        expect(monitor.type).toBe("python");
        expect(monitor.python_path).toBe("");
        expect(monitor.test_files).toEqual(data.test_files);
        expect(monitor.evidence_collector).toEqual([]);
    });

    it("should handle undefined fields in the input object", () => {
        const data = {
            path: undefined,
            type: undefined,
            python_path: undefined,
            test_files: undefined,
            evidence_collector: undefined
        };
        const monitor = new Monitor(data);
        expect(monitor.path).toBe("");
        expect(monitor.type).toBe("python");
        expect(monitor.python_path).toBe("");
        expect(monitor.test_files).toEqual([]);
        expect(monitor.evidence_collector).toEqual([]);
    });
});