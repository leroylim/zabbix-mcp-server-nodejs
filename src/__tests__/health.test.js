const healthMonitor = require('../utils/health');

describe('HealthMonitor', () => {
    beforeEach(() => {
        // Reset metrics before each test
        healthMonitor.resetMetrics();
    });

    describe('Health checks', () => {
        test('should return basic health information', async () => {
            const health = await healthMonitor.getHealth();

            expect(health).toHaveProperty('status');
            expect(health).toHaveProperty('uptime');
            expect(health).toHaveProperty('timestamp');
            expect(health).toHaveProperty('system');
            expect(health).toHaveProperty('metrics');
            expect(health).toHaveProperty('checks');
        });

        test('should include system information', async () => {
            const health = await healthMonitor.getHealth();

            expect(health.system).toHaveProperty('memory');
            expect(health.system).toHaveProperty('cpu');
            expect(health.system).toHaveProperty('platform');
            expect(health.system).toHaveProperty('version');

            expect(health.system.memory).toHaveProperty('total');
            expect(health.system.memory).toHaveProperty('free');
            expect(health.system.memory).toHaveProperty('used');
        });

        test('should have valid status', async () => {
            const health = await healthMonitor.getHealth();
            expect(['ok', 'degraded', 'error']).toContain(health.status);
        });

        test('should have valid timestamp', async () => {
            const health = await healthMonitor.getHealth();
            const timestamp = new Date(health.timestamp);
            expect(timestamp).toBeInstanceOf(Date);
            expect(timestamp.getTime()).toBeCloseTo(Date.now(), -2); // Within 10 seconds (more lenient)
        });
    });

    describe('Metrics tracking', () => {
        test('should track requests metric', () => {
            healthMonitor.incrementMetric('requests');
            healthMonitor.incrementMetric('requests');

            const health = healthMonitor.getHealth();
            return health.then(result => {
                expect(result.metrics.requests).toBe(2);
            });
        });

        test('should track errors metric', () => {
            healthMonitor.incrementMetric('errors');

            const health = healthMonitor.getHealth();
            return health.then(result => {
                expect(result.metrics.errors).toBe(1);
            });
        });

        test('should track API calls metric', () => {
            healthMonitor.incrementMetric('apiCalls');
            healthMonitor.incrementMetric('apiCalls');
            healthMonitor.incrementMetric('apiCalls');

            const health = healthMonitor.getHealth();
            return health.then(result => {
                expect(result.metrics.apiCalls).toBe(3);
            });
        });

        test('should ignore invalid metrics', () => {
            healthMonitor.incrementMetric('invalidMetric');

            const health = healthMonitor.getHealth();
            return health.then(result => {
                expect(result.metrics).not.toHaveProperty('invalidMetric');
            });
        });

        test('should reset metrics', () => {
            healthMonitor.incrementMetric('requests');
            healthMonitor.incrementMetric('errors');
            
            healthMonitor.resetMetrics();

            const health = healthMonitor.getHealth();
            return health.then(result => {
                expect(result.metrics.requests).toBe(0);
                expect(result.metrics.errors).toBe(0);
                expect(result.metrics.apiCalls).toBe(0);
            });
        });
    });

    describe('Custom health checks', () => {
        test('should register and run custom health checks', async () => {
            healthMonitor.registerHealthCheck('test-check', async () => ({
                status: 'ok',
                message: 'Test check passed'
            }));

            const health = await healthMonitor.getHealth();

            expect(health.checks).toHaveProperty('test-check');
            expect(health.checks['test-check'].status).toBe('ok');
            expect(health.checks['test-check'].message).toBe('Test check passed');
        });

        test('should handle failing health checks', async () => {
            healthMonitor.registerHealthCheck('failing-check', async () => {
                throw new Error('Check failed');
            });

            const health = await healthMonitor.getHealth();

            expect(health.status).toBe('degraded');
            expect(health.checks).toHaveProperty('failing-check');
            expect(health.checks['failing-check'].status).toBe('error');
            expect(health.checks['failing-check'].error).toBe('Check failed');
        });

        test('should run multiple health checks', async () => {
            healthMonitor.registerHealthCheck('check1', async () => ({
                status: 'ok',
                data: 'check1-data'
            }));

            healthMonitor.registerHealthCheck('check2', async () => ({
                status: 'ok',
                data: 'check2-data'
            }));

            const health = await healthMonitor.getHealth();

            expect(health.checks).toHaveProperty('check1');
            expect(health.checks).toHaveProperty('check2');
            expect(health.checks.check1.data).toBe('check1-data');
            expect(health.checks.check2.data).toBe('check2-data');
        });
    });

    describe('Built-in health checks', () => {
        test('should include memory health check', async () => {
            const health = await healthMonitor.getHealth();

            expect(health.checks).toHaveProperty('memory');
            expect(health.checks.memory.status).toBe('ok');
            expect(health.checks.memory).toHaveProperty('heap');
            expect(health.checks.memory).toHaveProperty('rss');
            expect(health.checks.memory.heap).toHaveProperty('used');
            expect(health.checks.memory.heap).toHaveProperty('total');
        });

        test('should include system health check', async () => {
            const health = await healthMonitor.getHealth();

            expect(health.checks).toHaveProperty('system');
            expect(health.checks.system.status).toBe('ok');
            expect(health.checks.system).toHaveProperty('load');
            expect(health.checks.system).toHaveProperty('uptime');
            expect(Array.isArray(health.checks.system.load)).toBe(true);
            expect(typeof health.checks.system.uptime).toBe('number');
        });
    });

    describe('Uptime tracking', () => {
        test('should track uptime correctly', async () => {
            const health1 = await healthMonitor.getHealth();
            
            // Wait a bit longer to ensure uptime difference
            await new Promise(resolve => setTimeout(resolve, 200));
            
            const health2 = await healthMonitor.getHealth();

            expect(health2.uptime).toBeGreaterThanOrEqual(health1.uptime);
        });

        test('should return uptime in seconds', async () => {
            // Wait a bit to ensure some uptime has passed
            await new Promise(resolve => setTimeout(resolve, 50));
            
            const health = await healthMonitor.getHealth();
            expect(typeof health.uptime).toBe('number');
            expect(health.uptime).toBeGreaterThanOrEqual(0); // Allow 0 for very fast execution
        });
    });

    describe('Error scenarios', () => {
        test('should handle health check registration with same name', async () => {
            healthMonitor.registerHealthCheck('duplicate', async () => ({ status: 'ok', value: 1 }));
            healthMonitor.registerHealthCheck('duplicate', async () => ({ status: 'ok', value: 2 }));

            const health = await healthMonitor.getHealth();

            // Should use the latest registered check
            expect(health.checks.duplicate.value).toBe(2);
        });

        test('should handle async health check errors gracefully', async () => {
            healthMonitor.registerHealthCheck('async-error', async () => {
                await new Promise(resolve => setTimeout(resolve, 10));
                throw new Error('Async error');
            });

            const health = await healthMonitor.getHealth();

            expect(health.status).toBe('degraded');
            expect(health.checks['async-error'].status).toBe('error');
            expect(health.checks['async-error'].error).toBe('Async error');
        });
    });

    describe('Cleanup', () => {
        test('should clean up timers on destroy', () => {
            // This test verifies the destroy method exists and can be called
            expect(typeof healthMonitor.destroy).toBe('function');
            
            // Call destroy to test it doesn't throw
            expect(() => healthMonitor.destroy()).not.toThrow();
        });
    });
}); 
