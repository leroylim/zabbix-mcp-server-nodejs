const { RetryPolicy, CircuitBreaker, withResilience } = require('../utils/retry');

describe('RetryPolicy', () => {
    let retryPolicy;
    let mockFn;

    beforeEach(() => {
        retryPolicy = new RetryPolicy({
            maxAttempts: 3,
            baseDelay: 100,
            maxDelay: 1000,
            backoffFactor: 2
        });
        mockFn = jest.fn();
    });

    describe('Successful execution', () => {
        test('should return result on first attempt', async () => {
            mockFn.mockResolvedValue('success');

            const result = await retryPolicy.execute(mockFn, 'test-operation');

            expect(result).toBe('success');
            expect(mockFn).toHaveBeenCalledTimes(1);
        });

        test('should return result after retry', async () => {
            const error = new Error('temporary failure');
            error.code = 'ECONNRESET'; // Make it retryable
            
            mockFn
                .mockRejectedValueOnce(error)
                .mockResolvedValue('success');

            const result = await retryPolicy.execute(mockFn, 'test-operation');

            expect(result).toBe('success');
            expect(mockFn).toHaveBeenCalledTimes(2);
        });
    });

    describe('Retry logic', () => {
        test('should retry on retryable error codes', async () => {
            const error = new Error('Connection reset');
            error.code = 'ECONNRESET';
            mockFn.mockRejectedValue(error);

            await expect(retryPolicy.execute(mockFn, 'test')).rejects.toThrow('Connection reset');
            expect(mockFn).toHaveBeenCalledTimes(3);
        });

        test('should retry on retryable HTTP status codes', async () => {
            const error = new Error('Server error');
            error.response = { status: 500 };
            mockFn.mockRejectedValue(error);

            await expect(retryPolicy.execute(mockFn, 'test')).rejects.toThrow('Server error');
            expect(mockFn).toHaveBeenCalledTimes(3);
        });

        test('should retry on rate limit errors', async () => {
            const error = new Error('Rate limit exceeded');
            mockFn.mockRejectedValue(error);

            await expect(retryPolicy.execute(mockFn, 'test')).rejects.toThrow('Rate limit exceeded');
            expect(mockFn).toHaveBeenCalledTimes(3);
        });

        test('should not retry on non-retryable errors', async () => {
            const error = new Error('Invalid input');
            error.response = { status: 400 };
            mockFn.mockRejectedValue(error);

            await expect(retryPolicy.execute(mockFn, 'test')).rejects.toThrow('Invalid input');
            expect(mockFn).toHaveBeenCalledTimes(1);
        });
    });

    describe('Delay calculation', () => {
        test('should calculate exponential backoff delays', () => {
            expect(retryPolicy.calculateDelay(1)).toBe(100);
            expect(retryPolicy.calculateDelay(2)).toBe(200);
            expect(retryPolicy.calculateDelay(3)).toBe(400);
        });

        test('should respect maximum delay', () => {
            const policy = new RetryPolicy({ baseDelay: 1000, maxDelay: 2000, backoffFactor: 3 });
            expect(policy.calculateDelay(5)).toBe(2000);
        });
    });

    describe('Should retry logic', () => {
        test('should not retry after max attempts', () => {
            const error = new Error('test');
            error.code = 'ECONNRESET';

            expect(retryPolicy.shouldRetry(error, 3)).toBe(false);
            expect(retryPolicy.shouldRetry(error, 4)).toBe(false);
        });

        test('should identify retryable conditions', () => {
            const networkError = new Error('test');
            networkError.code = 'ECONNRESET';

            const httpError = new Error('test');
            httpError.response = { status: 503 };

            const rateLimitError = new Error('Rate limit exceeded');

            expect(retryPolicy.shouldRetry(networkError, 1)).toBe(true);
            expect(retryPolicy.shouldRetry(httpError, 1)).toBe(true);
            expect(retryPolicy.shouldRetry(rateLimitError, 1)).toBe(true);
        });
    });
});

describe('CircuitBreaker', () => {
    let circuitBreaker;
    let mockFn;

    beforeEach(() => {
        circuitBreaker = new CircuitBreaker({
            failureThreshold: 3,
            recoveryTimeout: 1000
        });
        mockFn = jest.fn();
    });

    describe('CLOSED state', () => {
        test('should execute function normally when CLOSED', async () => {
            mockFn.mockResolvedValue('success');

            const result = await circuitBreaker.execute(mockFn, 'test');

            expect(result).toBe('success');
            expect(circuitBreaker.getState().state).toBe('CLOSED');
        });

        test('should transition to OPEN after failure threshold', async () => {
            mockFn.mockRejectedValue(new Error('failure'));

            // First 3 failures should keep circuit closed but increment failure count
            for (let i = 0; i < 3; i++) {
                try {
                    await circuitBreaker.execute(mockFn, 'test');
                } catch (error) {
                    // Expected to fail
                }
            }

            expect(circuitBreaker.getState().state).toBe('OPEN');
        });
    });

    describe('OPEN state', () => {
        beforeEach(async () => {
            // Force circuit to OPEN state
            mockFn.mockRejectedValue(new Error('failure'));
            for (let i = 0; i < 3; i++) {
                try {
                    await circuitBreaker.execute(mockFn, 'test');
                } catch (error) {
                    // Expected to fail
                }
            }
            expect(circuitBreaker.getState().state).toBe('OPEN');
        });

        test('should reject immediately when OPEN', async () => {
            await expect(circuitBreaker.execute(mockFn, 'test'))
                .rejects.toThrow('Circuit breaker test is OPEN');
        });

        test('should transition to HALF_OPEN after recovery timeout', async () => {
            // Wait for recovery timeout
            await new Promise(resolve => setTimeout(resolve, 1100));

            mockFn.mockResolvedValue('success');
            await circuitBreaker.execute(mockFn, 'test');

            expect(circuitBreaker.getState().state).toBe('HALF_OPEN');
        });
    });

    describe('HALF_OPEN state', () => {
        beforeEach(async () => {
            // Force to OPEN then to HALF_OPEN
            mockFn.mockRejectedValue(new Error('failure'));
            for (let i = 0; i < 3; i++) {
                try {
                    await circuitBreaker.execute(mockFn, 'test');
                } catch (error) {
                    // Expected to fail
                }
            }
            
            // Wait for recovery timeout
            await new Promise(resolve => setTimeout(resolve, 1100));
            
            // Trigger transition to HALF_OPEN
            mockFn.mockResolvedValue('success');
            await circuitBreaker.execute(mockFn, 'test');
            
            expect(circuitBreaker.getState().state).toBe('HALF_OPEN');
        });

        test('should transition to CLOSED after 3 successes', async () => {
            mockFn.mockResolvedValue('success');

            // Need 2 more successes (already had 1 to get to HALF_OPEN)
            await circuitBreaker.execute(mockFn, 'test');
            await circuitBreaker.execute(mockFn, 'test');

            expect(circuitBreaker.getState().state).toBe('CLOSED');
        });

        test('should transition to OPEN on failure', async () => {
            mockFn.mockRejectedValue(new Error('failure'));

            try {
                await circuitBreaker.execute(mockFn, 'test');
            } catch (error) {
                // Expected to fail
            }

            expect(circuitBreaker.getState().state).toBe('OPEN');
        });
    });

    describe('State information', () => {
        test('should provide accurate state information', () => {
            const state = circuitBreaker.getState();

            expect(state).toHaveProperty('state');
            expect(state).toHaveProperty('failureCount');
            expect(state).toHaveProperty('lastFailureTime');
        });
    });
});

describe('withResilience', () => {
    let mockFn;

    beforeEach(() => {
        mockFn = jest.fn();
    });

    test('should combine retry and circuit breaker', async () => {
        mockFn.mockResolvedValue('success');

        const result = await withResilience(mockFn, {
            context: 'integration-test'
        });

        expect(result).toBe('success');
        expect(mockFn).toHaveBeenCalledTimes(1);
    });

    test('should use custom retry policy and circuit breaker', async () => {
        const customRetry = new RetryPolicy({ maxAttempts: 2 });
        const customCircuit = new CircuitBreaker({ failureThreshold: 2 });

        const error = new Error('temporary failure');
        error.code = 'ECONNRESET'; // Make it retryable
        
        mockFn
            .mockRejectedValueOnce(error)
            .mockResolvedValue('success');

        const result = await withResilience(mockFn, {
            retryPolicy: customRetry,
            circuitBreaker: customCircuit,
            context: 'custom-test'
        });

        expect(result).toBe('success');
        expect(mockFn).toHaveBeenCalledTimes(2);
    });

    test('should handle failures with both retry and circuit breaker', async () => {
        const error = new Error('persistent failure');
        error.code = 'ECONNRESET';
        mockFn.mockRejectedValue(error);

        await expect(withResilience(mockFn, { context: 'failure-test' }))
            .rejects.toThrow('persistent failure');

        // Should have retried the configured number of times
        expect(mockFn).toHaveBeenCalledTimes(3);
    });
});

describe('Integration scenarios', () => {
    test('should handle network timeout scenarios', async () => {
        const policy = new RetryPolicy({
            maxAttempts: 2,
            baseDelay: 50,
            retryableErrors: ['ETIMEDOUT']
        });

        const mockFn = jest.fn();
        const error = new Error('timeout');
        error.code = 'ETIMEDOUT';
        mockFn.mockRejectedValue(error);

        await expect(policy.execute(mockFn, 'timeout-test')).rejects.toThrow('timeout');
        expect(mockFn).toHaveBeenCalledTimes(2);
    });

    test('should handle rate limiting scenarios', async () => {
        const policy = new RetryPolicy({
            maxAttempts: 3,
            baseDelay: 50
        });

        const mockFn = jest.fn();
        mockFn
            .mockRejectedValueOnce(new Error('Rate limit exceeded'))
            .mockRejectedValueOnce(new Error('Rate limit exceeded'))
            .mockResolvedValue('success');

        const result = await policy.execute(mockFn, 'rate-limit-test');
        expect(result).toBe('success');
        expect(mockFn).toHaveBeenCalledTimes(3);
    });
}); 
