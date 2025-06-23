const config = require('../config');
const { logger } = require('../utils/logger');

describe('Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('Default Configuration', () => {
    test('should have correct default API configuration', () => {
      expect(config.api.baseUrl).toBe('https://cyber-risk.upguard.com/api/public');
      expect(config.api.timeout).toBe(120000);
      expect(config.api.key).toBe('test-api-key-for-testing');
    });

    test('should have correct default transport configuration', () => {
      expect(config.transport.mode).toBe('stdio');
      expect(config.transport.http.port).toBe(3000);
      expect(config.transport.http.host).toBe('localhost');
      expect(config.transport.http.sessionManagement).toBe(true);
    });

    test('should have logging configuration', () => {
      expect(config.logging.prefix).toBe('[Upguard API Client]');
    });
  });

  describe('Environment Variable Override', () => {
    test('should override API configuration from environment', () => {
      process.env.UPGUARD_API_URL = 'https://custom.api.url';
      process.env.UPGUARD_API_KEY = 'custom-key';
      process.env.UPGUARD_REQUEST_TIMEOUT = '60000';

      delete require.cache[require.resolve('../config')];
      const customConfig = require('../config');

      expect(customConfig.api.baseUrl).toBe('https://custom.api.url');
      expect(customConfig.api.key).toBe('custom-key');
      expect(customConfig.api.timeout).toBe(60000);
    });

    test('should override transport configuration from environment', () => {
      process.env.MCP_TRANSPORT_MODE = 'http';
      process.env.MCP_HTTP_PORT = '8080';
      process.env.MCP_HTTP_HOST = '0.0.0.0';
      process.env.MCP_SESSION_MANAGEMENT = 'true';

      delete require.cache[require.resolve('../config')];
      const customConfig = require('../config');

      expect(customConfig.transport.mode).toBe('http');
      expect(customConfig.transport.http.port).toBe(8080);
      expect(customConfig.transport.http.host).toBe('0.0.0.0');
      expect(customConfig.transport.http.sessionManagement).toBe(true);
    });

    test('should handle invalid timeout gracefully', () => {
      process.env.UPGUARD_REQUEST_TIMEOUT = 'invalid';

      delete require.cache[require.resolve('../config')];
      const customConfig = require('../config');

      expect(customConfig.api.timeout).toBe(120000); // Should fallback to default
    });

    test('should handle invalid port gracefully', () => {
      process.env.MCP_HTTP_PORT = 'invalid';

      delete require.cache[require.resolve('../config')];
      const customConfig = require('../config');

      expect(customConfig.transport.http.port).toBe(3000); // Should fallback to default
    });
  });

  test('should have valid API configuration', () => {
    expect(config).toBeDefined();
    expect(config.api).toBeDefined();
    expect(config.api.baseUrl).toBeDefined();
    expect(config.api.timeout).toBeDefined();
    expect(typeof config.api.timeout).toBe('number');
  });

  test('should have API key configured', () => {
    expect(config.api.key).toBeDefined();
    expect(typeof config.api.key).toBe('string');
    expect(config.api.key.length).toBeGreaterThan(0);
  });

  test('should have valid base URL', () => {
    expect(config.api.baseUrl).toMatch(/^https?:\/\//);
  });

  test('should have reasonable timeout value', () => {
    expect(config.api.timeout).toBeGreaterThan(0);
    expect(config.api.timeout).toBeLessThanOrEqual(180000); // Max 180 seconds (3 minutes)
  });
});

describe('Logger', () => {
  test('should create logger instance', () => {
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.debug).toBe('function');
    expect(typeof logger.warn).toBe('function');
  });

  test('should log messages without throwing', () => {
    expect(() => {
      logger.info('Test info message');
      logger.debug('Test debug message');
      logger.warn('Test warning message');
    }).not.toThrow();
  });

  test('should handle error logging', () => {
    expect(() => {
      logger.error('Test error message');
      logger.error('Test error with object', { error: 'test' });
    }).not.toThrow();
  });
}); 
