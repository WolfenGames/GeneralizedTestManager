import * as vscode from "vscode";
import copyFiles from "../process/evidence_collection";
const fs = require("fs") as jest.Mocked<typeof import("fs")>;
const path = require("path");

jest.mock("fs");
jest.mock("vscode", () => ({
  window: {
    showWarningMessage: jest.fn(),
    showErrorMessage: jest.fn(),
  }
}));

const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedVscode = vscode as jest.Mocked<typeof vscode>;

describe("copyFiles", () => {
    const sourceDir = "/tmp/source";
    const destDir = "/tmp/dest";

    beforeEach(() => {
        jest.resetAllMocks();
        // Default: source exists, dest does not
        mockedFs.existsSync.mockImplementation((p: any) => p === path.resolve(sourceDir));
        mockedFs.readdirSync.mockReturnValue([]);
        mockedFs.mkdirSync.mockImplementation(() => undefined);
        mockedFs.rmSync.mockImplementation(() => undefined);
        mockedFs.copyFileSync.mockImplementation(() => undefined);
    });

    it("throws if sourceDir or destDir is missing", () => {
        expect(() => copyFiles("", destDir)).toThrow("Both sourceDir and destDir are required");
        expect(() => copyFiles(sourceDir, "")).toThrow("Both sourceDir and destDir are required");
    });

    it("shows warning and returns if sourceDir does not exist", () => {
        mockedFs.existsSync.mockReturnValue(false);
        copyFiles(sourceDir, destDir);
        expect(mockedVscode.window.showWarningMessage).toHaveBeenCalledWith(
            expect.stringContaining("Evidence source not found")
        );
        expect(mockedFs.mkdirSync).not.toHaveBeenCalled();
    });

    it("removes destDir if it exists", () => {
        mockedFs.existsSync.mockImplementation((p: any) => p === path.resolve(sourceDir) || p === path.resolve(destDir));
        copyFiles(sourceDir, destDir);
        expect(mockedFs.rmSync).toHaveBeenCalledWith(path.resolve(destDir), { recursive: true, force: true });
        expect(mockedFs.mkdirSync).toHaveBeenCalledWith(path.resolve(destDir), { recursive: true });
    });

    it("creates destDir if it does not exist", () => {
        copyFiles(sourceDir, destDir);
        expect(mockedFs.mkdirSync).toHaveBeenCalledWith(path.resolve(destDir), { recursive: true });
    });

    it("copies files from source to dest", () => {
        const fileEntry = { name: "file.txt", isDirectory: () => false };
        mockedFs.readdirSync.mockReturnValue([fileEntry as any]);
        copyFiles(sourceDir, destDir);
        expect(mockedFs.copyFileSync).toHaveBeenCalledWith(
            path.join(path.resolve(sourceDir), "file.txt"),
            path.join(path.resolve(destDir), "file.txt")
        );
    });

    it("recursively copies directories", () => {
        const dirEntry = { name: "subdir", isDirectory: () => true };
        const fileEntry = { name: "file.txt", isDirectory: () => false };
        mockedFs.readdirSync
            .mockReturnValueOnce([dirEntry as any])
            .mockReturnValueOnce([fileEntry as any]);
        copyFiles(sourceDir, destDir);
        expect(mockedFs.mkdirSync).toHaveBeenCalledWith(path.join(path.resolve(destDir), "subdir"));
        expect(mockedFs.copyFileSync).toHaveBeenCalledWith(
            path.join(path.resolve(sourceDir), "subdir", "file.txt"),
            path.join(path.resolve(destDir), "subdir", "file.txt")
        );
    });

    it("shows error and throws if an error occurs", () => {
        mockedFs.mkdirSync.mockImplementation(() => { throw new Error("fail"); });
        expect(() => copyFiles(sourceDir, destDir)).toThrow("Failed to copy evidence files: fail");
        expect(mockedVscode.window.showErrorMessage).toHaveBeenCalledWith(
            expect.stringContaining("Failed to copy evidence files: fail")
        );
    });

    it("throws and shows error if copyContents fails", () => {
        mockedFs.readdirSync.mockImplementation(() => { throw new Error("readdir fail"); });
        expect(() => copyFiles(sourceDir, destDir)).toThrow("Failed to copy evidence files: Failed to copy contents from");
        expect(mockedVscode.window.showErrorMessage).toHaveBeenCalledWith(
            expect.stringContaining("Failed to copy evidence files: Failed to copy contents from")
        );
    });
});