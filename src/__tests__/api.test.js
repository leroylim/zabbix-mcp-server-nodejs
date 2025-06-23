const api = require('../api');

// Mock the entire API client module
jest.mock('../api/client', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  getAvailableRisksV2: jest.fn(),
  getRiskDetails: jest.fn(),
  getAccountRisks: jest.fn()
}));

const client = require('../api/client');

describe('API Module', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('Risk Management', () => {
    test('getAvailableRisksV2 should make correct API call', async () => {
      const mockResponse = { risks: ['domain_expired', 'exposed_service:FTP'] };
      client.getAvailableRisksV2.mockResolvedValue(mockResponse);

      const result = await api.getAvailableRisksV2();

      expect(client.getAvailableRisksV2).toHaveBeenCalledWith();
      expect(result).toEqual(mockResponse);
    });

    test('getRiskDetails should make correct API call with parameters', async () => {
      const mockResponse = { risk_id: 'domain_expired', severity: 'high' };
      client.getRiskDetails.mockResolvedValue(mockResponse);

      const params = { risk_id: 'domain_expired' };
      const result = await api.getRiskDetails(params);

      expect(client.getRiskDetails).toHaveBeenCalledWith(params);
      expect(result).toEqual(mockResponse);
    });

    test('getAccountRisks should handle optional parameters', async () => {
      const mockResponse = { risks: [] };
      client.getAccountRisks.mockResolvedValue(mockResponse);

      const params = { min_severity: 'medium', include_meta: true };
      const result = await api.getAccountRisks(params);

      expect(client.getAccountRisks).toHaveBeenCalledWith(params);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Vendor Management', () => {
    test('listMonitoredVendors should make correct API call', async () => {
      const mockResponse = { vendors: [] };
      client.get.mockResolvedValue(mockResponse);

      const result = await api.listMonitoredVendors();

      expect(client.get).toHaveBeenCalledWith('/vendors', undefined);
      expect(result).toEqual(mockResponse);
    });

    test('startMonitoringVendor should make POST request', async () => {
      const mockResponse = { success: true };
      client.post.mockResolvedValue(mockResponse);

      const params = { vendor_hostname: 'example.com' };
      const result = await api.startMonitoringVendor(params);

      expect(client.post).toHaveBeenCalledWith('/vendor/monitor', params);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Domain Management', () => {
    test('getDomains should make correct API call', async () => {
      const mockResponse = { domains: [] };
      client.get.mockResolvedValue(mockResponse);

      const result = await api.getDomains();

      expect(client.get).toHaveBeenCalledWith('/domains', undefined);
      expect(result).toEqual(mockResponse);
    });

    test('addCustomDomains should make PUT request', async () => {
      const mockResponse = { success: true };
      client.put.mockResolvedValue(mockResponse);

      const params = { hostnames: ['example.com'] };
      const result = await api.addCustomDomains(params);

      expect(client.put).toHaveBeenCalledWith('/domains', params);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Error Handling', () => {
    test('should handle API errors gracefully', async () => {
      const mockError = new Error('Network Error');
      client.getAvailableRisksV2.mockRejectedValue(mockError);

      await expect(api.getAvailableRisksV2()).rejects.toThrow('Network Error');
      expect(client.getAvailableRisksV2).toHaveBeenCalled();
    });

    test('should handle timeout errors', async () => {
      const mockError = new Error('timeout of 30000ms exceeded');
      mockError.code = 'ECONNABORTED';
      client.getAccountRisks.mockRejectedValue(mockError);

      await expect(api.getAccountRisks()).rejects.toThrow('timeout of 30000ms exceeded');
    });
  });

  describe('Tool Integration', () => {
    test('all API functions should be exportable', () => {
      // Test that key API functions are exported
      expect(typeof api.getAvailableRisksV2).toBe('function');
      expect(typeof api.getRiskDetails).toBe('function');
      expect(typeof api.getAccountRisks).toBe('function');
      expect(typeof api.listMonitoredVendors).toBe('function');
      expect(typeof api.getDomains).toBe('function');
      expect(typeof api.addCustomDomains).toBe('function');
    });
  });
}); 
