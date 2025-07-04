module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/src/test/**/*.test.ts'],
  moduleNameMapper: {
    '^vscode$': 'jest-mock-vscode',
  },
};