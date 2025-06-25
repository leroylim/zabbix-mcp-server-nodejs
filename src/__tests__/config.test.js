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
    test('should have correct default Zabbix configuration', () => {
      expect(config.api.url).toBeDefined();
      expect(config.api.timeout).toBe(120000);
      expect(config.api.ignoreSelfSignedCert).toBe(true);
      expect(config.api.authMethod).toBe('none');
    });

    test('should have correct default transport configuration', () => {
      expect(config.transport.mode).toBe('stdio');
      expect(config.transport.http.port).toBe(3000);
      expect(config.transport.http.host).toBe('localhost');
      expect(config.transport.http.sessionManagement).toBe(false);
    });

    test('should have logging configuration', () => {
      expect(config.logging.prefix).toBe('[Zabbix API Client]');
    });
  });

  describe('Environment Variable Override', () => {
    test('should override Zabbix configuration from environment', () => {
      process.env.ZABBIX_API_URL = 'https://custom.zabbix.server/api_jsonrpc.php';
      process.env.ZABBIX_API_TOKEN = 'custom-token';
      process.env.ZABBIX_REQUEST_TIMEOUT = '60000';

      delete require.cache[require.resolve('../config')];
      const customConfig = require('../config');

      expect(customConfig.api.url).toBe('https://custom.zabbix.server/api_jsonrpc.php');
      expect(customConfig.api.apiToken).toBe('custom-token');
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
      process.env.ZABBIX_REQUEST_TIMEOUT = 'invalid';

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

  test('should have valid Zabbix configuration', () => {
    expect(config).toBeDefined();
    expect(config.api).toBeDefined();
    expect(config.api.url).toBeDefined();
    expect(config.api.timeout).toBeDefined();
    expect(typeof config.api.timeout).toBe('number');
  });

  test('should have valid Zabbix URL', () => {
    expect(config.api.url).toMatch(/^https?:\/\//);
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
