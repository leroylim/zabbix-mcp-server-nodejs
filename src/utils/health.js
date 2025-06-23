const os = require('os');

class HealthMonitor {
    constructor() {
        this.startTime = Date.now();
        this.healthChecks = new Map();
        this.metrics = {
            requests: 0,
            errors: 0,
            apiCalls: 0
        };
        this.resetTimer = null;
    }

    registerHealthCheck(name, checkFn) {
        this.healthChecks.set(name, checkFn);
    }

    incrementMetric(metric) {
        if (metric in this.metrics) {
            this.metrics[metric]++;
        }
    }

    async getHealth() {
        const health = {
            status: 'ok',
            uptime: Math.floor((Date.now() - this.startTime) / 1000),
            timestamp: new Date().toISOString(),
            system: {
                memory: {
                    total: os.totalmem(),
                    free: os.freemem(),
                    used: os.totalmem() - os.freemem()
                },
                cpu: os.loadavg(),
                platform: os.platform(),
                version: os.version()
            },
            metrics: this.metrics
        };

        // Run all registered health checks
        const checks = {};
        for (const [name, checkFn] of this.healthChecks) {
            try {
                checks[name] = await checkFn();
            } catch (error) {
                checks[name] = {
                    status: 'error',
                    error: error.message
                };
                health.status = 'degraded';
            }
        }

        health.checks = checks;
        return health;
    }

    // Reset metrics (can be called periodically)
    resetMetrics() {
        Object.keys(this.metrics).forEach(key => {
            this.metrics[key] = 0;
        });
    }

    destroy() {
        if (this.resetTimer) {
            clearInterval(this.resetTimer);
            this.resetTimer = null;
        }
    }
}

const healthMonitor = new HealthMonitor();

// Register some basic health checks
healthMonitor.registerHealthCheck('memory', () => {
    const usedMemory = process.memoryUsage();
    return {
        status: 'ok',
        heap: {
            used: usedMemory.heapUsed,
            total: usedMemory.heapTotal
        },
        rss: usedMemory.rss
    };
});

healthMonitor.registerHealthCheck('system', () => {
    return {
        status: 'ok',
        load: os.loadavg(),
        uptime: os.uptime()
    };
});

// Reset metrics every hour - only in non-test environments
if (process.env.NODE_ENV !== 'test') {
    healthMonitor.resetTimer = setInterval(() => {
        healthMonitor.resetMetrics();
    }, 3600000);
}

module.exports = healthMonitor; 
