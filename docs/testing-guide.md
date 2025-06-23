# Testing Guide

## Overview

This document provides comprehensive information about testing the UpGuard CyberRisk MCP Server, including unit tests, integration tests, and examples.

## Test Structure

### Current Test Coverage

- **Configuration Tests** (`src/__tests__/config.test.js`)
  - Environment variable handling
  - Default configuration validation
  - Configuration overrides

- **API Client Tests** (`src/__tests__/api/client.test.js`)
  - HTTP method testing (GET, POST, PUT, DELETE)
  - Error handling and resilience
  - Request/response data handling

- **Tool Registration Tests** (`src/__tests__/tools/risks.test.js`)
  - Tool registration validation
  - Handler function testing
  - Schema validation

- **MCP Server Tests** (`src/__tests__/mcp-server.test.js`)
  - Server initialization
  - Tool registration flow
  - Logger integration

- **Integration Tests** (`src/__tests__/integration.test.js`)
  - End-to-end API workflows
  - Caching behavior
  - Error handling patterns
  - Performance and resilience testing

- **Utility Tests**
  - Cache implementation (`src/__tests__/cache.test.js`)
  - Retry and circuit breaker logic (`src/__tests__/retry.test.js`)
  - API module (`src/__tests__/api.test.js`)

## Running Tests

### Basic Test Commands

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- src/__tests__/config.test.js

# Run tests matching pattern
npm test -- --testNamePattern="should handle errors"
```

### Test Environment Setup

Tests use a dedicated test environment with:
- Mock API key: `test-api-key-for-testing`
- Isolated configuration
- Mocked external dependencies

## Writing Tests

### Unit Test Example

```javascript
const { someFunction } = require('../src/module');

describe('Module Name', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should perform expected behavior', async () => {
    // Arrange
    const input = { param: 'value' };
    const expectedOutput = { result: 'expected' };

    // Act
    const result = await someFunction(input);

    // Assert
    expect(result).toEqual(expectedOutput);
  });
});
```

### Integration Test Example

```javascript
describe('Integration Test', () => {
  test('should handle complete workflow', async () => {
    // Test real API interactions with proper mocking
    const mockResponse = { data: 'test' };
    api.someMethod.mockResolvedValue(mockResponse);

    const result = await performWorkflow();

    expect(api.someMethod).toHaveBeenCalledWith(expectedParams);
    expect(result).toMatchObject(expectedResult);
  });
});
```

## Test Categories

### 1. Configuration Tests
- **Purpose**: Validate configuration loading and environment variable handling
- **Coverage**: Default values, overrides, validation
- **Key Tests**:
  - Default API configuration
  - Environment variable overrides
  - Invalid input handling

### 2. API Client Tests
- **Purpose**: Test HTTP client functionality and resilience
- **Coverage**: All HTTP methods, error handling, circuit breaker
- **Key Tests**:
  - Request/response handling
  - Network error scenarios
  - Timeout and retry logic

### 3. Tool Registration Tests
- **Purpose**: Validate MCP tool registration and execution
- **Coverage**: Tool schemas, handlers, error handling
- **Key Tests**:
  - Tool registration count and names
  - Handler parameter validation
  - Error propagation

### 4. Integration Tests
- **Purpose**: End-to-end testing of complete workflows
- **Coverage**: API interactions, caching, resilience patterns
- **Key Tests**:
  - Complete tool execution flows
  - Caching behavior validation
  - Error recovery patterns

## Test Data and Mocking

### API Mocking Strategy

```javascript
// Mock entire API module
jest.mock('../../api');

// Mock specific methods
api.getAvailableRisks.mockResolvedValue(mockData);
api.getAccountRisks.mockRejectedValue(new Error('API Error'));
```

### Test Data Patterns

```javascript
// Standard mock response structure
const mockApiResponse = {
  data: [
    { id: 1, name: 'Test Item', severity: 'high' },
    { id: 2, name: 'Another Item', severity: 'medium' }
  ],
  pagination: {
    total: 2,
    page: 1,
    limit: 50
  }
};
```

## Performance Testing

### Load Testing Example

```javascript
test('should handle concurrent requests efficiently', async () => {
  const promises = Array(10).fill().map(() => 
    performApiCall()
  );
  
  const results = await Promise.all(promises);
  
  expect(results).toHaveLength(10);
  expect(results.every(r => r.success)).toBe(true);
});
```

## Error Testing Patterns

### Network Errors

```javascript
test('should handle network timeouts', async () => {
  const timeoutError = new Error('Timeout');
  timeoutError.code = 'ECONNABORTED';
  
  api.method.mockRejectedValue(timeoutError);
  
  await expect(performAction()).rejects.toThrow('Timeout');
});
```

### API Errors

```javascript
test('should handle API rate limiting', async () => {
  const rateLimitError = new Error('Rate Limited');
  rateLimitError.response = { status: 429 };
  
  api.method.mockRejectedValue(rateLimitError);
  
  await expect(performAction()).rejects.toThrow('Rate Limited');
});
```

## Test Coverage Goals

### Current Coverage Metrics
- **Statements**: ~54%
- **Branches**: ~73%
- **Functions**: ~36%
- **Lines**: ~54%

### Coverage Targets (Realistic)
- **Statements**: 60%+
- **Branches**: 75%+
- **Functions**: 50%+
- **Lines**: 60%+

### Coverage Targets (Aspirational)
- **Statements**: 80%+
- **Branches**: 85%+
- **Functions**: 70%+
- **Lines**: 80%+

## Continuous Integration

### Test Pipeline
1. **Lint Check**: ESLint validation
2. **Unit Tests**: Fast, isolated tests
3. **Integration Tests**: API interaction tests
4. **Coverage Report**: Coverage threshold validation

### Test Commands in CI

```bash
# CI test command
npm run test:ci

# Coverage validation (current realistic thresholds)
npm run test:coverage -- --coverageThreshold='{"global":{"statements":50,"branches":70,"functions":30,"lines":50}}'
```

## Debugging Tests

### Common Issues

1. **Mock Not Working**
   ```javascript
   // Ensure proper mock setup
   jest.clearAllMocks(); // in beforeEach
   ```

2. **Async Test Failures**
   ```javascript
   // Always await async operations
   await expect(asyncFunction()).rejects.toThrow();
   ```

3. **Environment Variables**
   ```javascript
   // Reset environment in tests
   const originalEnv = process.env;
   afterAll(() => { process.env = originalEnv; });
   ```

### Debug Commands

```bash
# Run tests with debug output
npm test -- --verbose

# Run single test with debugging
npm test -- --testNamePattern="specific test" --verbose
```

## Best Practices

### Test Organization
- Group related tests in `describe` blocks
- Use descriptive test names
- Follow Arrange-Act-Assert pattern
- Clean up after tests

### Mocking Guidelines
- Mock external dependencies
- Use realistic test data
- Test both success and failure scenarios
- Verify mock calls with proper parameters

### Performance Considerations
- Keep tests fast and focused
- Use appropriate timeouts
- Avoid unnecessary async operations
- Clean up resources properly

## Examples and Templates

### Tool Test Template

```javascript
const toolModule = require('../../tools/toolName');
const api = require('../../api');

jest.mock('../../api');

describe('Tool Name', () => {
  let mockServer;

  beforeEach(() => {
    jest.clearAllMocks();
    mockServer = {
      tool: jest.fn(),
      registeredTools: []
    };
    mockServer.tool.mockImplementation((name, desc, schema, handler) => {
      mockServer.registeredTools.push({ name, desc, schema, handler });
    });
  });

  test('should register tool correctly', () => {
    toolModule.registerTools(mockServer);
    
    expect(mockServer.tool).toHaveBeenCalled();
    expect(mockServer.registeredTools).toHaveLength(1);
  });
});
```

### API Test Template

```javascript
const apiModule = require('../../api');
const client = require('../../api/client');

jest.mock('../../api/client');

describe('API Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should make correct API call', async () => {
    const mockResponse = { data: 'test' };
    client.get.mockResolvedValue(mockResponse);

    const result = await apiModule.someMethod();

    expect(client.get).toHaveBeenCalledWith('/expected/endpoint');
    expect(result).toEqual(mockResponse);
  });
});
```

## Troubleshooting

### Common Test Failures

1. **Rate Limiting**: Tests may fail due to API rate limits
   - Solution: Use proper mocking for external API calls

2. **Timing Issues**: Async tests may have race conditions
   - Solution: Use proper async/await patterns

3. **Environment Conflicts**: Tests may interfere with each other
   - Solution: Proper cleanup in beforeEach/afterEach

### Getting Help

- Check test logs for detailed error messages
- Use `--verbose` flag for more detailed output
- Review mock setup and ensure proper isolation
- Verify environment variable configuration 