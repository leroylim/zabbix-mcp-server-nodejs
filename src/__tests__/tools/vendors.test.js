const vendorsModule = require('../../tools/vendors');
const api = require('../../api');

// Mock the API module
jest.mock('../../api');

describe('Vendors Tool Registration', () => {
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
    test('should register all vendor-related tools', () => {
      vendorsModule.registerTools(mockServer);

      // Check that vendor tools are registered
      const toolNames = mockServer.registeredTools.map(t => t.name);
      expect(toolNames).toContain('upguard_list_monitored_vendors');
      expect(toolNames).toContain('upguard_start_monitoring_vendor');
      expect(toolNames).toContain('upguard_stop_monitoring_vendor');
      expect(toolNames).toContain('upguard_get_vendor');
    });

    test('should register tools with correct descriptions', () => {
      vendorsModule.registerTools(mockServer);

      const monitoredVendorsTool = mockServer.registeredTools.find(t => t.name === 'upguard_list_monitored_vendors');
      expect(monitoredVendorsTool.description).toContain('monitored vendors');

      const startMonitoringTool = mockServer.registeredTools.find(t => t.name === 'upguard_start_monitoring_vendor');
      expect(startMonitoringTool.description).toContain('Begin continuous');
    });
  });

  describe('Tool Handlers', () => {
    test('should handle list_monitored_vendors successfully', async () => {
      const mockResult = { vendors: [{ hostname: 'vendor1.com' }, { hostname: 'vendor2.com' }] };
      api.listMonitoredVendors.mockResolvedValue(mockResult);

      vendorsModule.registerTools(mockServer);
      
      const tool = mockServer.registeredTools.find(t => t.name === 'upguard_list_monitored_vendors');
      const result = await tool.handler({});

      expect(api.listMonitoredVendors).toHaveBeenCalled();
      expect(result.content[0].text).toContain('vendor1.com');
    });

    test('should handle start_monitoring_vendor with hostname parameter', async () => {
      const mockResult = { success: true, vendor_hostname: 'newvendor.com' };
      api.startMonitoringVendor.mockResolvedValue(mockResult);

      vendorsModule.registerTools(mockServer);
      
      const tool = mockServer.registeredTools.find(t => t.name === 'upguard_start_monitoring_vendor');
      const params = { hostname: 'newvendor.com' };
      
      await tool.handler(params);

      expect(api.startMonitoringVendor).toHaveBeenCalledWith(params);
    });

    test('should handle API errors gracefully', async () => {
      const error = new Error('Vendor API Error');
      api.listMonitoredVendors.mockRejectedValue(error);

      vendorsModule.registerTools(mockServer);
      
      const tool = mockServer.registeredTools.find(t => t.name === 'upguard_list_monitored_vendors');
      
      await expect(tool.handler({})).rejects.toThrow('Vendor API Error');
    });

    test('should handle vendor details with hostname parameter', async () => {
      const mockResult = { 
        hostname: 'vendor.com',
        score: 850,
        risks: []
      };
      api.getVendorDetails.mockResolvedValue(mockResult);

      vendorsModule.registerTools(mockServer);
      
      const tool = mockServer.registeredTools.find(t => t.name === 'upguard_get_vendor');
      const params = { hostname: 'vendor.com' };
      
      await tool.handler(params);

      expect(api.getVendorDetails).toHaveBeenCalledWith(params);
    });
  });

  describe('Schema Validation', () => {
    test('should have proper schema for start monitoring tool', () => {
      vendorsModule.registerTools(mockServer);
      
      const tool = mockServer.registeredTools.find(t => t.name === 'upguard_start_monitoring_vendor');
      
      expect(tool.schema).toHaveProperty('hostname');
    });

    test('should have proper schema for vendor details tool', () => {
      vendorsModule.registerTools(mockServer);
      
      const tool = mockServer.registeredTools.find(t => t.name === 'upguard_get_vendor');
      
      expect(tool.schema).toHaveProperty('hostname');
    });
  });
}); 
