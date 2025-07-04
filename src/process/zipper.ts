import * as fs from 'fs';
import * as vscode from 'vscode';
import AdmZip from 'adm-zip';

function zipFolder(folderPath: string, zipPath: string) {
  // Validate inputs
  if (!folderPath || !zipPath) {
    throw new Error('Both folderPath and zipPath are required');
  }

  // Check if source folder exists
  if (!fs.existsSync(folderPath)) {
    throw new Error(`Source folder does not exist: ${folderPath}`);
  }

  try {
    const zip = new AdmZip();
    zip.addLocalFolder(folderPath);
    zip.writeZip(zipPath);
    vscode.window.showInformationMessage(`Evidence zipped: ${zipPath}`);
  } catch (error) {
    const message = `Failed to zip folder ${folderPath}: ${
      error instanceof Error ? error.message : 'Unknown error'
    }`;
    vscode.window.showErrorMessage(message);
    throw new Error(message);
  }
}
export default zipFolder;