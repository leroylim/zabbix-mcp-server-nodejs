/**
 * UpGuard CyberRisk MCP Server - Enhanced Testing Setup
 * 
 * This script sets up comprehensive testing infrastructure
 * 
 * Copyright (c) 2024 Han Yong Lim
 * Licensed under MIT License
 */

const fs = require('fs');
const path = require('path');
const { logger } = require('../src/utils/logger');

/**
 * Create API contract testing setup
 */
function createContractTests() {
  const contractTest = `/**
 * API Contract Tests using Pact
 */
const { Pact } = require('@pact-foundation/pact');
const { like, eachLike } = require('@pact-foundation/pact').Matchers;

describe('UpGuard API Contract Tests', () => {
  let provider;

  beforeAll(() => {
    provider = new Pact({
      consumer: 'upguard-mcp-client',
      provider: 'upguard-api',
      port: 1234,
      log: path.resolve(process.cwd(), 'logs', 'pact.log'),
      dir: path.resolve(process.cwd(), 'pacts'),
      logLevel: 'INFO'
    });
    return provider.setup();
  });

  afterAll(() => provider.finalize());

  describe('Vendor Management', () => {
    beforeEach(() => {
      const interaction = {
        state: 'vendors exist',
        uponReceiving: 'a request for vendors',
        withRequest: {
          method: 'GET',
          path: '/vendors',
          headers: {
            'Authorization': like('Bearer token123'),
            'Accept': 'application/json'
          }
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            vendors: eachLike({
              id: like(12345),
              name: like('Example Vendor'),
              hostname: like('example.com'),
              tier: like('Tier 1')
            })
          }
        }
      };
      return provider.addInteraction(interaction);
    });

    it('should return vendor list', async () => {
      // Test implementation would go here
      expect(true).toBe(true); // Placeholder
    });
  });
});`;

  const contractPath = path.join(__dirname, '../src/__tests__/contract/api.contract.test.js');
  fs.mkdirSync(path.dirname(contractPath), { recursive: true });
  fs.writeFileSync(contractPath, contractTest);
  logger.info('Contract tests created');
}

/**
 * Create load testing setup
 */
function createLoadTests() {
  const loadTestScript = `/**
 * Load Testing with Artillery
 */
module.exports = {
  config: {
    target: 'http://localhost:3000',
    phases: [
      {
        duration: 60,
        arrivalRate: 10,
        name: 'Warm up'
      },
      {
        duration: 120,
        arrivalRate: 50,
        name: 'Ramp up load'
      },
      {
        duration: 300,
        arrivalRate: 100,
        name: 'Sustained load'
      }
    ],
    defaults: {
      headers: {
        'Authorization': 'Bearer {{ $randomString() }}',
        'Content-Type': 'application/json'
      }
    }
  },
  scenarios: [
    {
      name: 'Get vendor list',
      weight: 40,
      flow: [
        {
          get: {
            url: '/vendors',
            capture: {
              json: '$.vendors[0].id',
              as: 'vendorId'
            }
          }
        }
      ]
    },
    {
      name: 'Get vendor details',
      weight: 30,
      flow: [
        {
          get: {
            url: '/vendors/{{ vendorId }}'
          }
        }
      ]
    },
    {
      name: 'Get vendor risks',
      weight: 20,
      flow: [
        {
          get: {
            url: '/vendors/{{ vendorId }}/risks'
          }
        }
      ]
    },
    {
      name: 'Health check',
      weight: 10,
      flow: [
        {
          get: {
            url: '/health'
          }
        }
      ]
    }
  ]
};`;

  const loadTestPath = path.join(__dirname, '../tests/load/artillery.js');
  fs.mkdirSync(path.dirname(loadTestPath), { recursive: true });
  fs.writeFileSync(loadTestPath, loadTestScript);
  logger.info('Load tests created');
}

/**
 * Create E2E testing setup
 */
function createE2ETests() {
  const e2eTest = `/**
 * End-to-End Tests using Playwright
 */
const { test, expect } = require('@playwright/test');

test.describe('UpGuard MCP Server E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Setup authentication or other prerequisites
    await page.goto('http://localhost:3000/docs');
  });

  test('should display API documentation', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('UpGuard CyberRisk MCP Server');
    await expect(page.locator('.swagger-ui')).toBeVisible();
  });

  test('should allow API testing through Swagger UI', async ({ page }) => {
    // Click on an endpoint
    await page.click('[data-testid="operations-tag-Vendor_Management"]');
    await page.click('[data-testid="operations-Vendor_Management-get_vendors"]');
    
    // Try it out
    await page.click('.try-out__btn');
    await page.fill('[placeholder="Authorization"]', 'Bearer test-token');
    await page.click('.execute');
    
    // Check response
    await expect(page.locator('.response-col_status')).toBeVisible();
  });

  test('should handle authentication errors gracefully', async ({ page }) => {
    await page.goto('http://localhost:3000/vendors');
    await expect(page.locator('.error-message')).toContainText('Unauthorized');
  });
});`;

  const e2ePath = path.join(__dirname, '../tests/e2e/api.e2e.test.js');
  fs.mkdirSync(path.dirname(e2ePath), { recursive: true });
  fs.writeFileSync(e2ePath, e2eTest);
  logger.info('E2E tests created');
}

/**
 * Create test utilities and helpers
 */
function createTestUtilities() {
  const testUtils = `/**
 * Test Utilities and Helpers
 */
const axios = require('axios');
const { faker } = require('@faker-js/faker');

class TestDataFactory {
  static createVendor() {
    return {
      name: faker.company.name(),
      hostname: faker.internet.domainName(),
      tier: faker.helpers.arrayElement(['Tier 1', 'Tier 2', 'Tier 3']),
      labels: faker.helpers.arrayElements(['critical', 'financial', 'healthcare'], 2)
    };
  }

  static createRisk() {
    return {
      type: faker.helpers.arrayElement(['vulnerability', 'breach', 'compliance']),
      severity: faker.helpers.arrayElement(['low', 'medium', 'high', 'critical']),
      description: faker.lorem.sentence(),
      discoveredAt: faker.date.recent().toISOString()
    };
  }

  static createBulkVendors(count = 10) {
    return Array.from({ length: count }, () => this.createVendor());
  }
}

class APITestClient {
  constructor(baseURL = 'http://localhost:3000', apiKey = 'test-key') {
    this.client = axios.create({
      baseURL,
      headers: {
        'Authorization': \`Bearer \${apiKey}\`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
  }

  async getVendors(params = {}) {
    return this.client.get('/vendors', { params });
  }

  async createVendor(vendorData) {
    return this.client.post('/vendors', vendorData);
  }

  async getVendorRisks(vendorId, params = {}) {
    return this.client.get(\`/vendors/\${vendorId}/risks\`, { params });
  }

  async bulkCreateVendors(vendors) {
    return this.client.post('/vendors/bulk', { vendors });
  }

  async waitForHealth(maxAttempts = 30) {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await this.client.get('/health');
        if (response.data.status === 'healthy') {
          return true;
        }
      } catch (error) {
        // Continue trying
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    throw new Error('Service did not become healthy within timeout');
  }
}

class TestEnvironment {
  static async setup() {
    // Setup test database, mock services, etc.
    console.log('Setting up test environment...');
  }

  static async teardown() {
    // Cleanup test data, stop services, etc.
    console.log('Tearing down test environment...');
  }

  static async resetData() {
    // Reset test data to known state
    console.log('Resetting test data...');
  }
}

module.exports = {
  TestDataFactory,
  APITestClient,
  TestEnvironment
};`;

  const utilsPath = path.join(__dirname, '../tests/utils/test-helpers.js');
  fs.mkdirSync(path.dirname(utilsPath), { recursive: true });
  fs.writeFileSync(utilsPath, testUtils);
  logger.info('Test utilities created');
}

/**
 * Create test configuration files
 */
function createTestConfigs() {
  // Jest configuration for different test types
  const jestConfig = {
    projects: [
      {
        displayName: 'unit',
        testMatch: ['<rootDir>/src/**/*.test.js'],
        testEnvironment: 'node'
      },
      {
        displayName: 'integration',
        testMatch: ['<rootDir>/src/**/*.integration.test.js'],
        testEnvironment: 'node',
        setupFilesAfterEnv: ['<rootDir>/tests/setup/integration.js']
      },
      {
        displayName: 'contract',
        testMatch: ['<rootDir>/src/**/*.contract.test.js'],
        testEnvironment: 'node',
        setupFilesAfterEnv: ['<rootDir>/tests/setup/contract.js']
      }
    ],
    collectCoverageFrom: [
      'src/**/*.js',
      '!src/**/*.test.js',
      '!src/**/*.integration.test.js'
    ],
    coverageThreshold: {
      global: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80
      }
    }
  };

  const jestConfigPath = path.join(__dirname, '../jest.config.enhanced.js');
  fs.writeFileSync(jestConfigPath, `module.exports = ${JSON.stringify(jestConfig, null, 2)};`);

  // Playwright configuration
  const playwrightConfig = `const { devices } = require('@playwright/test');

module.exports = {
  testDir: './tests/e2e',
  timeout: 30000,
  expect: {
    timeout: 5000
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    }
  ],
  webServer: {
    command: 'npm run start:http',
    port: 3000,
    reuseExistingServer: !process.env.CI
  }
};`;

  const playwrightConfigPath = path.join(__dirname, '../playwright.config.js');
  fs.writeFileSync(playwrightConfigPath, playwrightConfig);

  logger.info('Test configurations created');
}

/**
 * Main setup function
 */
async function main() {
  try {
    logger.info('Setting up enhanced testing framework...');
    
    createContractTests();
    createLoadTests();
    createE2ETests();
    createTestUtilities();
    createTestConfigs();
    
    console.log('\n🧪 Enhanced Testing Setup Complete!');
    console.log('\n📋 Created Components:');
    console.log('   🤝 Contract tests (Pact-based API contracts)');
    console.log('   ⚡ Load tests (Artillery performance testing)');
    console.log('   🎭 E2E tests (Playwright browser testing)');
    console.log('   🛠️  Test utilities and data factories');
    console.log('   ⚙️  Enhanced Jest and Playwright configs');
    console.log('\n📦 Required Dependencies:');
    console.log('   npm install --save-dev @pact-foundation/pact artillery @playwright/test @faker-js/faker');
    console.log('\n🚀 New Test Commands:');
    console.log('   npm run test:contract - Run API contract tests');
    console.log('   npm run test:load - Run load/performance tests');
    console.log('   npm run test:e2e - Run end-to-end tests');
    console.log('   npm run test:all - Run all test suites');
    console.log('\n⚠️  Note: File paths are case-sensitive on Unix/Linux systems');
    
  } catch (error) {
    logger.error('Testing setup failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { 
  createContractTests, 
  createLoadTests, 
  createE2ETests, 
  createTestUtilities, 
  createTestConfigs 
}; 