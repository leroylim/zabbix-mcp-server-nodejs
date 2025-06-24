# Zabbix MCP Server - Testing Guide

This document provides comprehensive information about testing the Zabbix MCP Server, including unit tests, integration tests, and examples.

## 🧪 Test Structure

The testing framework is organized into several categories:

### **1. Unit Tests** (`src/__tests__/`)
- **API Module Tests**: Individual API module testing
- **Configuration Tests**: Environment and configuration validation
- **Cache Tests**: Redis caching functionality
- **Retry Logic Tests**: Error handling and retry mechanisms
- **Health Check Tests**: Server health monitoring

### **2. Integration Tests** (`examples/integration-test.js`)
- **End-to-end Testing**: Complete workflow testing
- **Authentication Testing**: Both API token and username/password
- **Tool Functionality**: All 90+ MCP tools
- **Error Handling**: Graceful failure scenarios

### **3. Example Clients** (`examples/`)
- **MCP Client Example**: Comprehensive tool demonstration
- **HTTP Client**: HTTP transport testing
- **Integration Test**: Automated test suite

## 🚀 Running Tests

### **Prerequisites**

1. **Node.js**: Version 18 or higher
2. **Zabbix Server**: Running and accessible
3. **Environment Variables**: Properly configured

### **Environment Setup**

Create a `.env` file or set environment variables:

```bash
# API Token Authentication (Recommended)
export ZABBIX_API_URL="https://your-zabbix-server/api_jsonrpc.php"
export ZABBIX_API_TOKEN="your_api_token_here"

# Or Username/Password Authentication
export ZABBIX_API_URL="https://your-zabbix-server/api_jsonrpc.php"
export ZABBIX_USERNAME="Admin"
export ZABBIX_PASSWORD="your_password"

# Optional
export LOG_LEVEL="info"
export ZABBIX_REQUEST_TIMEOUT="120000"
```

### **Running Unit Tests**

```bash
# Install dependencies
npm install

# Run all unit tests
npm test

# Run specific test categories
npm run test:api
npm run test:config
npm run test:cache
npm run test:health

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### **Running Integration Tests**

```bash
# Run complete integration test suite
node examples/integration-test.js

# Run with debug logging
LOG_LEVEL=debug node examples/integration-test.js

# Run with specific timeout
ZABBIX_REQUEST_TIMEOUT=180000 node examples/integration-test.js
```

### **Running Example Clients**

```bash
# Run comprehensive MCP client example
node examples/mcp-client-example.js

# Run HTTP client test
node examples/http-client.js

# Run all examples
npm run examples
```

## 📋 Test Categories

### **1. Authentication Tests**

Tests both authentication methods and validates API connectivity:

```javascript
// API Token Authentication Test
describe('API Token Authentication', () => {
    test('should authenticate with valid API token', async () => {
        const result = await client.callTool('zabbix_get_api_info', {});
        expect(result).toBeDefined();
        expect(result.content[0].text).toContain('version');
    });
});

// Username/Password Authentication Test
describe('Username/Password Authentication', () => {
    test('should authenticate with valid credentials', async () => {
        const login = await client.callTool('zabbix_login', {
            username: process.env.ZABBIX_USERNAME,
            password: process.env.ZABBIX_PASSWORD
        });
        expect(login).toBeDefined();
    });
});
```

### **2. Host Management Tests**

Validates host-related operations:

```javascript
describe('Host Management', () => {
    test('should retrieve hosts', async () => {
        const hosts = await client.callTool('zabbix_get_hosts', {
            output: ['hostid', 'host', 'name'],
            limit: 5
        });
        expect(Array.isArray(JSON.parse(hosts.content[0].text))).toBe(true);
    });

    test('should retrieve host groups', async () => {
        const groups = await client.callTool('zabbix_get_hostgroups', {
            output: ['groupid', 'name'],
            limit: 5
        });
        expect(Array.isArray(JSON.parse(groups.content[0].text))).toBe(true);
    });
});
```

### **3. Monitoring Tests**

Tests monitoring capabilities:

```javascript
describe('Monitoring', () => {
    test('should retrieve items', async () => {
        const items = await client.callTool('zabbix_get_items', {
            output: ['itemid', 'name', 'key_'],
            filter: { status: 0 },
            limit: 5
        });
        expect(JSON.parse(items.content[0].text)).toBeDefined();
    });

    test('should retrieve triggers', async () => {
        const triggers = await client.callTool('zabbix_get_triggers', {
            output: ['triggerid', 'description'],
            filter: { status: 0 },
            limit: 5
        });
        expect(JSON.parse(triggers.content[0].text)).toBeDefined();
    });

    test('should retrieve problems', async () => {
        const problems = await client.callTool('zabbix_get_problems', {
            output: 'extend',
            recent: true,
            limit: 5
        });
        expect(JSON.parse(problems.content[0].text)).toBeDefined();
    });
});
```

### **4. Historical Data Tests**

Validates historical data retrieval:

```javascript
describe('Historical Data', () => {
    test('should retrieve events', async () => {
        const events = await client.callTool('zabbix_get_events', {
            output: ['eventid', 'source', 'object'],
            time_from: Math.floor(Date.now() / 1000) - 3600,
            limit: 5
        });
        expect(JSON.parse(events.content[0].text)).toBeDefined();
    });

    test('should retrieve trends', async () => {
        const trends = await client.callTool('zabbix_get_trends', {
            itemids: [],
            time_from: Math.floor(Date.now() / 1000) - 86400,
            limit: 10
        });
        expect(JSON.parse(trends.content[0].text)).toBeDefined();
    });
});
```

### **5. User Management Tests**

Tests user and permission operations:

```javascript
describe('User Management', () => {
    test('should retrieve users', async () => {
        const users = await client.callTool('zabbix_get_users', {
            output: ['userid', 'username', 'name'],
            limit: 5
        });
        expect(Array.isArray(JSON.parse(users.content[0].text))).toBe(true);
    });

    test('should retrieve user groups', async () => {
        const userGroups = await client.callTool('zabbix_get_usergroups', {
            output: ['usrgrpid', 'name'],
            status: 0
        });
        expect(Array.isArray(JSON.parse(userGroups.content[0].text))).toBe(true);
    });
});
```

## 🔧 Test Configuration

### **Jest Configuration** (`jest.config.js`)

```javascript
module.exports = {
    testEnvironment: 'node',
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/**/*.test.js',
        '!src/__tests__/**'
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    testMatch: [
        '**/__tests__/**/*.test.js'
    ],
    setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.js'],
    testTimeout: 30000
};
```

### **Test Setup** (`src/__tests__/setup.js`)

```javascript
// Global test configuration
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';

// Mock external dependencies if needed
jest.setTimeout(30000);

// Global test utilities
global.testConfig = {
    apiUrl: process.env.ZABBIX_API_URL || 'https://demo.zabbix.com/api_jsonrpc.php',
    timeout: 30000
};
```

## 📊 Performance Testing

### **Load Testing**

Test server performance under load:

```javascript
describe('Performance Tests', () => {
    test('should handle concurrent requests', async () => {
        const promises = [];
        for (let i = 0; i < 10; i++) {
            promises.push(client.callTool('zabbix_get_api_info', {}));
        }
        
        const results = await Promise.all(promises);
        expect(results).toHaveLength(10);
        results.forEach(result => {
            expect(result.content[0].text).toBeDefined();
        });
    });

    test('should respond within acceptable time', async () => {
        const start = Date.now();
        await client.callTool('zabbix_get_hosts', { limit: 10 });
        const duration = Date.now() - start;
        
        expect(duration).toBeLessThan(5000); // 5 seconds max
    });
});
```

### **Memory Testing**

Monitor memory usage during tests:

```javascript
describe('Memory Tests', () => {
    test('should not leak memory', async () => {
        const initialMemory = process.memoryUsage().heapUsed;
        
        // Perform multiple operations
        for (let i = 0; i < 100; i++) {
            await client.callTool('zabbix_get_api_info', {});
        }
        
        // Force garbage collection
        if (global.gc) global.gc();
        
        const finalMemory = process.memoryUsage().heapUsed;
        const memoryIncrease = finalMemory - initialMemory;
        
        // Memory increase should be reasonable
        expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // 50MB max
    });
});
```

## 🚨 Error Testing

### **Authentication Errors**

```javascript
describe('Authentication Error Handling', () => {
    test('should handle invalid API token', async () => {
        const invalidClient = createClientWithToken('invalid_token');
        
        await expect(
            invalidClient.callTool('zabbix_get_api_info', {})
        ).rejects.toThrow(/authentication/i);
    });

    test('should handle invalid credentials', async () => {
        await expect(
            client.callTool('zabbix_login', {
                username: 'invalid',
                password: 'invalid'
            })
        ).rejects.toThrow(/login/i);
    });
});
```

### **Network Errors**

```javascript
describe('Network Error Handling', () => {
    test('should handle connection timeout', async () => {
        const timeoutClient = createClientWithTimeout(100); // 100ms timeout
        
        await expect(
            timeoutClient.callTool('zabbix_get_hosts', {})
        ).rejects.toThrow(/timeout/i);
    });

    test('should handle server unavailable', async () => {
        const invalidUrlClient = createClientWithUrl('http://invalid-server/api');
        
        await expect(
            invalidUrlClient.callTool('zabbix_get_api_info', {})
        ).rejects.toThrow(/connection/i);
    });
});
```

## 📈 Continuous Integration

### **GitHub Actions** (`.github/workflows/test.yml`)

```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18, 20]
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    
    - run: npm ci
    - run: npm test
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
```

## 🔍 Debugging Tests

### **Debug Mode**

Run tests with detailed logging:

```bash
# Enable debug logging
DEBUG=* npm test

# Enable specific debug categories
DEBUG=zabbix:* npm test

# Run with Node.js inspector
node --inspect-brk node_modules/.bin/jest
```

### **Test Isolation**

Run specific tests:

```bash
# Run specific test file
npm test -- --testPathPattern=api.test.js

# Run specific test case
npm test -- --testNamePattern="should authenticate"

# Run in band (no parallel execution)
npm test -- --runInBand
```

## 📝 Best Practices

### **Test Organization**

1. **Group related tests** using `describe` blocks
2. **Use descriptive test names** that explain what's being tested
3. **Keep tests independent** - each test should be able to run in isolation
4. **Use setup and teardown** for common initialization/cleanup

### **Assertions**

1. **Test both success and failure cases**
2. **Verify response structure** not just existence
3. **Use appropriate matchers** for different data types
4. **Test edge cases** and boundary conditions

### **Performance**

1. **Set reasonable timeouts** for different types of tests
2. **Use mocks** for external dependencies when appropriate
3. **Run expensive tests** in separate suites
4. **Monitor test execution time** and optimize slow tests

### **Maintenance**

1. **Keep tests up to date** with API changes
2. **Remove obsolete tests** when features are deprecated
3. **Document complex test scenarios**
4. **Review test coverage** regularly

## 🎯 Test Coverage Goals

- **Unit Tests**: 90%+ code coverage
- **Integration Tests**: 100% tool coverage
- **Error Handling**: 100% error path coverage
- **Performance**: Response time benchmarks
- **Security**: Authentication and authorization testing

This comprehensive testing strategy ensures the Zabbix MCP Server maintains high quality, reliability, and performance across all supported features and use cases. 