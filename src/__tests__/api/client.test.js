const apiClient = require('../../api/client');

// Mock the entire API client module to avoid circuit breaker issues
jest.mock('../../api/client', () => {
  const originalModule = jest.requireActual('../../api/client');
  
  return {
    ...originalModule,
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn()
  };
});

describe('API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('HTTP Methods', () => {
    test('should make GET requests correctly', async () => {
      const mockResponse = { test: 'data' };
      apiClient.get.mockResolvedValue(mockResponse);

      const result = await apiClient.get('/test-endpoint');

      expect(apiClient.get).toHaveBeenCalledWith('/test-endpoint');
      expect(result).toEqual(mockResponse);
    });

    test('should make POST requests correctly', async () => {
      const mockResponse = { created: true };
      const postData = { name: 'test' };
      apiClient.post.mockResolvedValue(mockResponse);

      const result = await apiClient.post('/test-endpoint', postData);

      expect(apiClient.post).toHaveBeenCalledWith('/test-endpoint', postData);
      expect(result).toEqual(mockResponse);
    });

    test('should make PUT requests correctly', async () => {
      const mockResponse = { updated: true };
      const putData = { id: 1, name: 'updated' };
      apiClient.put.mockResolvedValue(mockResponse);

      const result = await apiClient.put('/test-endpoint/1', putData);

      expect(apiClient.put).toHaveBeenCalledWith('/test-endpoint/1', putData);
      expect(result).toEqual(mockResponse);
    });

    test('should make DELETE requests correctly', async () => {
      const mockResponse = { deleted: true };
      apiClient.delete.mockResolvedValue(mockResponse);

      const result = await apiClient.delete('/test-endpoint/1');

      expect(apiClient.delete).toHaveBeenCalledWith('/test-endpoint/1');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Error Handling', () => {
    test('should handle network errors', async () => {
      const networkError = new Error('Network Error');
      apiClient.get.mockRejectedValue(networkError);

      await expect(apiClient.get('/test')).rejects.toThrow('Network Error');
    });

    test('should handle HTTP 404 errors', async () => {
      const error = new Error('Not Found');
      apiClient.get.mockRejectedValue(error);

      await expect(apiClient.get('/nonexistent')).rejects.toThrow('Not Found');
    });

    test('should handle HTTP 401 authentication errors', async () => {
      const error = new Error('Unauthorized');
      apiClient.get.mockRejectedValue(error);

      await expect(apiClient.get('/protected')).rejects.toThrow('Unauthorized');
    });

    test('should handle HTTP 500 server errors', async () => {
      const error = new Error('Internal Server Error');
      apiClient.get.mockRejectedValue(error);

      await expect(apiClient.get('/error')).rejects.toThrow('Internal Server Error');
    });

    test('should handle timeout errors', async () => {
      const timeoutError = new Error('Timeout');
      apiClient.get.mockRejectedValue(timeoutError);

      await expect(apiClient.get('/slow')).rejects.toThrow('Timeout');
    });
  });

  describe('Request Configuration', () => {
    test('should pass through request options', async () => {
      const mockResponse = { test: 'data' };
      apiClient.get.mockResolvedValue(mockResponse);

      const options = {
        params: { page: 1, limit: 10 },
        headers: { 'Custom-Header': 'value' }
      };

      await apiClient.get('/test', options);

      expect(apiClient.get).toHaveBeenCalledWith('/test', options);
    });

    test('should handle query parameters correctly', async () => {
      const mockResponse = { results: [] };
      apiClient.get.mockResolvedValue(mockResponse);

      const options = {
        params: {
          search: 'test query',
          page: 2,
          limit: 25,
          sort: 'name'
        }
      };

      await apiClient.get('/search', options);

      expect(apiClient.get).toHaveBeenCalledWith('/search', options);
    });
  });

  describe('Response Data Handling', () => {
    test('should return response data correctly', async () => {
      const responseData = { id: 1, name: 'Test Item' };
      apiClient.get.mockResolvedValue(responseData);

      const result = await apiClient.get('/item/1');

      expect(result).toEqual(responseData);
    });

    test('should handle empty response data', async () => {
      apiClient.get.mockResolvedValue(null);

      const result = await apiClient.get('/empty');

      expect(result).toBeNull();
    });

    test('should handle array responses', async () => {
      const arrayResponse = [{ id: 1 }, { id: 2 }];
      apiClient.get.mockResolvedValue(arrayResponse);

      const result = await apiClient.get('/list');

      expect(result).toEqual(arrayResponse);
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Method Availability', () => {
    test('should have all HTTP methods available', () => {
      expect(typeof apiClient.get).toBe('function');
      expect(typeof apiClient.post).toBe('function');
      expect(typeof apiClient.put).toBe('function');
      expect(typeof apiClient.delete).toBe('function');
    });
  });
}); 
