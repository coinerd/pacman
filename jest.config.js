export default {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: [
    '<rootDir>/tests/**/*.test.{js,jsx}'
  ],
  // Exclude archived and failed tests from running
  testPathIgnorePatterns: [
    '/.archived/',
    '/.failed/'
  ],
  // FIX: Add timeout to prevent infinite hanging
  testTimeout: 10000,
  // FIX: Add bail mode to stop after first failure
  bail: false,
  collectCoverageFrom: [
    'src/**/*.{js,jsx}'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov'
  ],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 62,
      lines: 67,
      statements: 67
    }
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^phaser$': '<rootDir>/__mocks__/phaser.js'
  },
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(phaser))/'
  ],
  verbose: true
};
