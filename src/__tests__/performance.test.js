const api = require('../api');
const { performance } = require('perf_hooks');

// Mock the API module for performance testing
jest.mock('../api');

describe('Performance Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock API responses with realistic delays
    api.getAvailableRisksV2.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ risks: [] }), 50))
    );
    
    api.getAccountRisks.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ risks: [] }), 100))
    );
    
    api.listMonitoredVendors.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ vendors: [] }), 75))
    );
  });

  describe('Load Testing', () => {
    test('should handle 10 concurrent API calls efficiently', async () => {
      const startTime = performance.now();
      
      const promises = Array(10).fill().map(() => api.getAvailableRisksV2());
      const results = await Promise.all(promises);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(results).toHaveLength(10);
      expect(results.every(r => r.risks)).toBe(true);
      
      // Should complete within reasonable time (allowing for mock delays)
      expect(duration).toBeLessThan(200); // 10 * 50ms + overhead
    });

    test('should handle mixed API calls concurrently', async () => {
      const startTime = performance.now();
      
      const promises = [
        ...Array(5).fill().map(() => api.getAvailableRisksV2()),
        ...Array(3).fill().map(() => api.getAccountRisks()),
        ...Array(2).fill().map(() => api.listMonitoredVendors())
      ];
      
      const results = await Promise.all(promises);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      expect(results).toHaveLength(10);
      
      // Should complete efficiently with concurrent execution
      expect(duration).toBeLessThan(150);
    });

    test('should handle sequential vs parallel performance difference', async () => {
      // Sequential execution
      const sequentialStart = performance.now();
      await api.getAvailableRisksV2();
      await api.getAccountRisks();
      await api.listMonitoredVendors();
      const sequentialEnd = performance.now();
      const sequentialDuration = sequentialEnd - sequentialStart;
      
      // Parallel execution
      const parallelStart = performance.now();
      await Promise.all([
        api.getAvailableRisksV2(),
        api.getAccountRisks(),
        api.listMonitoredVendors()
      ]);
      const parallelEnd = performance.now();
      const parallelDuration = parallelEnd - parallelStart;
      
      // Parallel should be significantly faster
      expect(parallelDuration).toBeLessThan(sequentialDuration * 0.7);
    });
  });

  describe('Memory Usage', () => {
    test('should not leak memory with repeated API calls', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Perform many API calls
      for (let i = 0; i < 100; i++) {
        await api.getAvailableRisksV2();
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });

  describe('Response Time Monitoring', () => {
    test('should track API response times', async () => {
      const responseTimes = [];
      
      for (let i = 0; i < 5; i++) {
        const start = performance.now();
        await api.getAvailableRisksV2();
        const end = performance.now();
        responseTimes.push(end - start);
      }
      
      const averageTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxTime = Math.max(...responseTimes);
      const minTime = Math.min(...responseTimes);
      
      expect(averageTime).toBeLessThan(100); // Average under 100ms
      expect(maxTime).toBeLessThan(200); // Max under 200ms
      expect(minTime).toBeGreaterThan(0); // Minimum time should be positive
      
      // Consistency check - max shouldn't be more than 3x average
      expect(maxTime).toBeLessThan(averageTime * 3);
    });
  });

  describe('Stress Testing', () => {
    test('should handle burst of requests without failing', async () => {
      const burstSize = 50;
      const promises = [];
      
      // Create burst of requests
      for (let i = 0; i < burstSize; i++) {
        promises.push(api.getAvailableRisksV2().catch(err => ({ error: err.message })));
      }
      
      const results = await Promise.all(promises);
      
      // Count successful vs failed requests
      const successful = results.filter(r => !r.error).length;
      const failed = results.filter(r => r.error).length;
      
      expect(successful).toBeGreaterThan(0);
      expect(successful + failed).toBe(burstSize);
      
      // At least 80% should succeed
      expect(successful / burstSize).toBeGreaterThan(0.8);
    });
  });

  describe('Timeout Handling', () => {
    test('should handle slow API responses gracefully', async () => {
      // Mock a slow API response
      api.getAccountRisks.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ risks: [] }), 1000))
      );
      
      const startTime = performance.now();
      const result = await api.getAccountRisks();
      const endTime = performance.now();
      
      expect(result).toBeDefined();
      expect(endTime - startTime).toBeGreaterThan(900); // Should wait for slow response
    });
  });

  describe('Throughput Testing', () => {
    test('should maintain throughput under sustained load', async () => {
      const duration = 2000; // 2 seconds
      const startTime = performance.now();
      const requests = [];
      let requestCount = 0;
      
      // Send requests continuously for the duration
      while (performance.now() - startTime < duration) {
        requests.push(
          api.getAvailableRisksV2().then(() => {
            requestCount++;
          }).catch(() => {
            // Count failed requests too
            requestCount++;
          })
        );
        
        // Small delay to prevent overwhelming
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      await Promise.all(requests);
      
      const actualDuration = performance.now() - startTime;
      const throughput = requestCount / (actualDuration / 1000); // requests per second
      
      expect(throughput).toBeGreaterThan(5); // At least 5 requests per second
      expect(requestCount).toBeGreaterThan(10); // Should have made multiple requests
    });
  });
}); 
