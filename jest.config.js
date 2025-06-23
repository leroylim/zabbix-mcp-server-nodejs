module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/*.test.js',
    '**/*.spec.js'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/src/__tests__/setup.js'
  ],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/index.js',
    '!src/__tests__/**',
    '!**/node_modules/**',
    // Exclude utility modules that don't need extensive testing
    '!src/utils/doc-generator.js',
    '!src/utils/telemetry.js',
    '!src/security/index.js',
    '!src/config/enhanced.js',
    '!src/utils/errors.js',
    '!src/utils/rateLimit.js',
    '!src/tools/utils.js'
  ],
  coverageThreshold: {
    global: {
      branches: 30,
      functions: 20,
      lines: 35,
      statements: 35
    },
    // Higher thresholds for critical modules
    'src/api/client.js': {
      branches: 65,
      functions: 50,
      lines: 75,
      statements: 75
    },
    'src/utils/cache.js': {
      branches: 85,
      functions: 85,
      lines: 90,
      statements: 90
    },
    'src/utils/retry.js': {
      branches: 85,
      functions: 100,
      lines: 100,
      statements: 100
    },
    'src/utils/health.js': {
      branches: 60,
      functions: 85,
      lines: 85,
      statements: 85
    }
  },
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.js'],
  verbose: true
}; 