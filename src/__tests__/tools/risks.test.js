const risksModule = require('../../tools/risks');
const api = require('../../api');

// Mock the API module
jest.mock('../../api');

describe('Risks Tool Registration', () => {
  let mockServer;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create a mock server with a tool method
    mockServer = {
      tool: jest.fn(),
      registeredTools: []
    };
    
    // Store registered tools for verification
    mockServer.tool.mockImplementation((name, description, schema, handler) => {
      mockServer.registeredTools.push({ name, description, schema, handler });
    });
  });

  describe('Tool Registration', () => {
    test('should register all risk-related tools', () => {
      risksModule.registerTools(mockServer);

      expect(mockServer.tool).toHaveBeenCalledTimes(10);
      
      const toolNames = mockServer.registeredTools.map(t => t.name);
      expect(toolNames).toContain('upguard_get_available_risks');
      expect(toolNames).toContain('upguard_get_available_risks_v2');
      expect(toolNames).toContain('upguard_get_risk_details');
      expect(toolNames).toContain('upguard_get_account_risks');
      expect(toolNames).toContain('upguard_get_vendor_risks');
    });

    test('should register tools with correct descriptions', () => {
      risksModule.registerTools(mockServer);

      const availableRisksTool = mockServer.registeredTools.find(t => t.name === 'upguard_get_available_risks');
      expect(availableRisksTool.description).toBe('Get a list of available risk types that can be detected by UpGuard');

      const accountRisksTool = mockServer.registeredTools.find(t => t.name === 'upguard_get_account_risks');
      expect(accountRisksTool.description).toContain('comprehensive list of active security risks');
    });
  });

  describe('Tool Handlers', () => {
    test('should handle get_available_risks successfully', async () => {
      const mockResult = { risks: ['risk1', 'risk2'] };
      api.getAvailableRisks.mockResolvedValue(mockResult);

      risksModule.registerTools(mockServer);
      
      const tool = mockServer.registeredTools.find(t => t.name === 'upguard_get_available_risks');
      const result = await tool.handler({});

      expect(api.getAvailableRisks).toHaveBeenCalled();
      expect(result.content[0].text).toContain('risk1');
    });

    test('should handle get_account_risks with parameters', async () => {
      const mockResult = { risks: [], pagination: {} };
      api.getAccountRisks.mockResolvedValue(mockResult);

      risksModule.registerTools(mockServer);
      
      const tool = mockServer.registeredTools.find(t => t.name === 'upguard_get_account_risks');
      const params = { min_severity: 'high', page_size: 100 };
      
      await tool.handler(params);

      expect(api.getAccountRisks).toHaveBeenCalledWith(params);
    });

    test('should handle API errors gracefully', async () => {
      const error = new Error('API Error');
      api.getAvailableRisks.mockRejectedValue(error);

      risksModule.registerTools(mockServer);
      
      const tool = mockServer.registeredTools.find(t => t.name === 'upguard_get_available_risks');
      
      await expect(tool.handler({})).rejects.toThrow('API Error');
    });

    test('should handle vendor risks with hostname parameter', async () => {
      const mockResult = { vendor_risks: [] };
      api.getVendorRisks.mockResolvedValue(mockResult);

      risksModule.registerTools(mockServer);
      
      const tool = mockServer.registeredTools.find(t => t.name === 'upguard_get_vendor_risks');
      const params = { primary_hostname: 'example.com' };
      
      await tool.handler(params);

      expect(api.getVendorRisks).toHaveBeenCalledWith(params);
    });

    test('should handle risk details with risk_id parameter', async () => {
      const mockResult = { risk_details: {} };
      api.getRiskDetails.mockResolvedValue(mockResult);

      risksModule.registerTools(mockServer);
      
      const tool = mockServer.registeredTools.find(t => t.name === 'upguard_get_risk_details');
      const params = { risk_id: 'domain_expired' };
      
      await tool.handler(params);

      expect(api.getRiskDetails).toHaveBeenCalledWith(params);
    });
  });

  describe('Schema Validation', () => {
    test('should have proper schema for account risks tool', () => {
      risksModule.registerTools(mockServer);
      
      const tool = mockServer.registeredTools.find(t => t.name === 'upguard_get_account_risks');
      
      expect(tool.schema).toHaveProperty('min_severity');
      expect(tool.schema).toHaveProperty('page_token');
      expect(tool.schema).toHaveProperty('page_size');
      expect(tool.schema).toHaveProperty('sort_by');
      expect(tool.schema).toHaveProperty('sort_desc');
    });

    test('should have proper schema for vendor risks tool', () => {
      risksModule.registerTools(mockServer);
      
      const tool = mockServer.registeredTools.find(t => t.name === 'upguard_get_vendor_risks');
      
      expect(tool.schema).toHaveProperty('primary_hostname');
      expect(tool.schema).toHaveProperty('min_severity');
    });

    test('should have proper schema for risk details tool', () => {
      risksModule.registerTools(mockServer);
      
      const tool = mockServer.registeredTools.find(t => t.name === 'upguard_get_risk_details');
      
      expect(tool.schema).toHaveProperty('risk_id');
    });
  });
}); 
