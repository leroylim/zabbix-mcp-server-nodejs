const { McpServer } = require('../../node_modules/@modelcontextprotocol/sdk/dist/cjs/server/mcp.js');
const { registerAllTools } = require('../tools');
const { logger } = require('../utils/logger');

describe('MCP Server', () => {
  let server;

  beforeEach(() => {
    // Create a fresh server instance for each test
    server = new McpServer({
      name: 'upguard_cyberrisk_mcp_server_test',
      version: '1.2.0',
      description: 'Test MCP server for UpGuard CyberRisk API'
    });
  });

  describe('Server Initialization', () => {
    test('should create server instance successfully', () => {
      expect(server).toBeDefined();
      // Note: In new MCP SDK, server info is stored in _serverInfo
      expect(server.server._serverInfo.name).toBe('upguard_cyberrisk_mcp_server_test');
      expect(server.server._serverInfo.version).toBe('1.2.0');
      expect(server.server._serverInfo.description).toBe('Test MCP server for UpGuard CyberRisk API');
    });

    test('should have registerTools method', () => {
      expect(typeof registerAllTools).toBe('function');
    });
  });

  describe('Tool Registration', () => {
    test('should register all tools without errors', () => {
      // The registration should complete without throwing
      expect(() => registerAllTools(server)).not.toThrow();
    });

    test('should register tools only once per server instance', () => {
      // First registration should work
      expect(() => registerAllTools(server)).not.toThrow();
      
      // Second registration on same server should throw (tools already registered)
      expect(() => registerAllTools(server)).toThrow();
    });

    test('should be able to register tools on fresh server instance', () => {
      const freshServer = new McpServer({
        name: 'fresh_test_server',
        version: '1.0.0',
        description: 'Fresh test server'
      });
      
      expect(() => registerAllTools(freshServer)).not.toThrow();
    });
  });

  describe('Logger Integration', () => {
    test('should have logger available', () => {
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.debug).toBe('function');
      expect(typeof logger.warn).toBe('function');
    });
  });
}); 
