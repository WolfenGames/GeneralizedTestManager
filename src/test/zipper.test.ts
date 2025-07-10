import * as fs from 'fs';
import * as vscode from 'vscode';
import AdmZip from 'adm-zip';
import zipFolder from '../process/zipper'; 

jest.mock('fs');
jest.mock('adm-zip');
jest.mock('vscode', () => ({
  window: {
    showInformationMessage: jest.fn(),
    showErrorMessage: jest.fn(),
  }
}));

const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedAdmZip = AdmZip as jest.MockedClass<typeof AdmZip>;
const mockedVscode = vscode as jest.Mocked<typeof vscode>;

describe('zipFolder', () => {
  const folderPath = '/path/to/folder';
  const zipPath = '/path/to/output.zip';

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('throws an error if folderPath or zipPath is missing', () => {
    expect(() => zipFolder('', zipPath)).toThrow('Both folderPath and zipPath are required');
    expect(() => zipFolder(folderPath, '')).toThrow('Both folderPath and zipPath are required');
  });

  it('throws an error if folder does not exist', () => {
    mockedFs.existsSync.mockReturnValue(false);

    expect(() => zipFolder(folderPath, zipPath)).toThrow(`Source folder does not exist: ${folderPath}`);
    expect(mockedFs.existsSync).toHaveBeenCalledWith(folderPath);
  });

  it('zips the folder and shows success message', () => {
    mockedFs.existsSync.mockReturnValue(true);

    const addLocalFolder = jest.fn();
    const writeZip = jest.fn();

    mockedAdmZip.mockImplementation(() => ({
      addLocalFolder,
      writeZip,
    }) as unknown as AdmZip);

    zipFolder(folderPath, zipPath);

    expect(addLocalFolder).toHaveBeenCalledWith(folderPath);
    expect(writeZip).toHaveBeenCalledWith(zipPath);
    expect(mockedVscode.window.showInformationMessage).toHaveBeenCalledWith(`Evidence zipped: ${zipPath}`);
  });

  it('shows error and throws if zip fails', () => {
    mockedFs.existsSync.mockReturnValue(true);

    const failingWriteZip = jest.fn(() => {
      throw new Error('Boom!');
    });

    mockedAdmZip.mockImplementation(() => ({
      addLocalFolder: jest.fn(),
      writeZip: failingWriteZip,
    }) as unknown as AdmZip);

    expect(() => zipFolder(folderPath, zipPath)).toThrow(/Failed to zip folder/);
    expect(mockedVscode.window.showErrorMessage).toHaveBeenCalledWith(expect.stringContaining('Boom!'));
  });
});
