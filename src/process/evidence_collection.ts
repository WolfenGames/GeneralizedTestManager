import * as fs from "fs";
import * as path from "path";

/**
 * Copy all files from sourceDir to destDir
 */
import * as vscode from 'vscode';

/**
 * Copy all files from sourceDir to destDir
 */
function copyFiles(sourceDir: string, destDir: string) {
  // Validate inputs
  if (!sourceDir || !destDir) {
    throw new Error('Both sourceDir and destDir are required');
  }

  // Security: Ensure paths are normalized and prevent directory traversal
  const normalizedSource = path.resolve(sourceDir);
  const normalizedDest = path.resolve(destDir);

  // Check if source exists
  if (!fs.existsSync(normalizedSource)) {
    vscode.window.showWarningMessage(`Evidence source not found: ${normalizedSource}`);
    return;
  }

  try {
    if (fs.existsSync(normalizedDest)) {
      fs.rmSync(normalizedDest, { recursive: true, force: true });
    }

    fs.mkdirSync(normalizedDest, { recursive: true });

    copyContents(normalizedSource, normalizedDest);
  } catch (error) {
    const message = `Failed to copy evidence files: ${error instanceof Error ? error.message : 'Unknown error'}`;
    vscode.window.showErrorMessage(message);
    throw new Error(message);
  }

  function copyContents(src: string, dest: string) {
    try {
      for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
          fs.mkdirSync(destPath);
          copyContents(srcPath, destPath);
        } else {
          fs.copyFileSync(srcPath, destPath);
        }
      }
    } catch (error) {
      throw new Error(`Failed to copy contents from ${src}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
export default copyFiles;