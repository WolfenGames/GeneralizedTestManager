export const window = {
  showInformationMessage: jest.fn(),
  showErrorMessage: jest.fn(),
};
export const workspace = {
  getConfiguration: jest.fn(),
  onDidChangeConfiguration: jest.fn(),
};
export const tests = {
  createTestController: jest.fn(() => ({
    createRunProfile: jest.fn(),
    createTestRun: jest.fn(() => ({
      started: jest.fn(),
      passed: jest.fn(),
      failed: jest.fn(),
      end: jest.fn(),
    })),
    createTestItem: jest.fn((id, label) => ({
      id,
      label,
      children: new Map(),
    })),
    items: {
      add: jest.fn(),
      replace: jest.fn(),
    },
  })),
};
