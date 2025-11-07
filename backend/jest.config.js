module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js',
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
  ],
  testMatch: [
    '**/__tests__/**/*.js',
    '**/tests/**/*.test.js',
  ],
  verbose: true,
  detectOpenHandles: true,
  forceExit: true,
  testTimeout: 10000,
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup.js',
  ],
};
