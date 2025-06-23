/**
 * API Contract Tests
 * 
 * These tests verify that the API contracts are maintained
 * and that the expected interfaces are preserved.
 */

const api = require('../api');

describe('API Contract Tests', () => {
  describe('API Function Signatures', () => {
    test('should export expected API functions', () => {
      // Verify core API functions exist
      expect(typeof api.getAccountRisks).toBe('function');
      expect(typeof api.getVendorRisks).toBe('function');
      expect(typeof api.getAvailableRisksV2).toBe('function');
      expect(typeof api.listMonitoredVendors).toBe('function');
      expect(typeof api.startMonitoringVendor).toBe('function');
      expect(typeof api.stopMonitoringVendor).toBe('function');
    });

    test('should have consistent parameter patterns', () => {
      // Most API functions should accept an options object
      expect(api.getAccountRisks).toHaveLength(1);
      expect(api.getVendorRisks).toHaveLength(1);
      expect(api.listMonitoredVendors).toHaveLength(1);
    });
  });

  describe('Response Structure Contracts', () => {
    test('should maintain consistent error handling', async () => {
      // Mock a network error to test error contract
      const originalRequest = require('axios').request;
      require('axios').request = jest.fn().mockRejectedValue(new Error('Network error'));

      await expect(api.getAccountRisks({})).rejects.toThrow('Network error');

      // Restore original function
      require('axios').request = originalRequest;
    });

    test('should return promises for async operations', () => {
      // Mock successful response
      require('axios').request = jest.fn().mockResolvedValue({
        status: 200,
        data: { test: 'data' }
      });

      const result = api.getAccountRisks({});
      expect(result).toBeInstanceOf(Promise);
    });
  });

  describe('Configuration Contracts', () => {
    test('should respect configuration options', () => {
      const config = require('../config');
      
      // Verify config structure matches actual implementation
      expect(config).toHaveProperty('api');
      expect(config.api).toHaveProperty('key');
      expect(config.api).toHaveProperty('baseUrl');
      expect(config).toHaveProperty('transport');
      expect(config).toHaveProperty('cache');
      expect(config).toHaveProperty('logging');
    });
  });
}); 
