const { logger } = require('./logger');
const EventEmitter = require('events');

class TelemetryCollector extends EventEmitter {
  constructor() {
    super();
    this.metrics = new Map();
    this.counters = new Map();
    this.histograms = new Map();
    this.gauges = new Map();
    this.timers = new Map();
    this.alerts = new Map();
    this.startTime = Date.now();
    
    // Initialize default metrics
    this.initializeDefaultMetrics();
    
    // Start periodic collection
    this.startPeriodicCollection();
  }

  initializeDefaultMetrics() {
    // API Metrics
    this.createCounter('api_requests_total', 'Total API requests');
    this.createCounter('api_requests_errors', 'Total API request errors');
    this.createHistogram('api_request_duration', 'API request duration in ms');
    this.createGauge('api_requests_active', 'Currently active API requests');
    
    // Tool Metrics
    this.createCounter('tools_executed_total', 'Total tool executions');
    this.createCounter('tools_failed_total', 'Total tool failures');
    this.createHistogram('tool_execution_duration', 'Tool execution duration in ms');
    
    // Cache Metrics
    this.createCounter('cache_hits_total', 'Total cache hits');
    this.createCounter('cache_misses_total', 'Total cache misses');
    this.createGauge('cache_size_bytes', 'Current cache size in bytes');
    this.createGauge('cache_entries_count', 'Number of cache entries');
    
    // System Metrics
    this.createGauge('memory_usage_bytes', 'Memory usage in bytes');
    this.createGauge('cpu_usage_percent', 'CPU usage percentage');
    this.createGauge('event_loop_lag_ms', 'Event loop lag in milliseconds');
    
    // Circuit Breaker Metrics
    this.createCounter('circuit_breaker_opened', 'Circuit breaker opened count');
    this.createCounter('circuit_breaker_closed', 'Circuit breaker closed count');
    this.createGauge('circuit_breaker_state', 'Circuit breaker state (0=closed, 1=open, 2=half-open)');
  }

  createCounter(name, description) {
    this.counters.set(name, { value: 0, description, type: 'counter' });
    return this;
  }

  createGauge(name, description) {
    this.gauges.set(name, { value: 0, description, type: 'gauge' });
    return this;
  }

  createHistogram(name, description) {
    this.histograms.set(name, { 
      values: [], 
      description, 
      type: 'histogram',
      buckets: [1, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000],
      sum: 0,
      count: 0
    });
    return this;
  }

  // Counter operations
  incrementCounter(name, value = 1, labels = {}) {
    const counter = this.counters.get(name);
    if (counter) {
      counter.value += value;
      counter.lastUpdated = Date.now();
      counter.labels = { ...counter.labels, ...labels };
      this.emit('metric_updated', { name, type: 'counter', value: counter.value, labels });
    }
  }

  // Gauge operations
  setGauge(name, value, labels = {}) {
    const gauge = this.gauges.get(name);
    if (gauge) {
      gauge.value = value;
      gauge.lastUpdated = Date.now();
      gauge.labels = { ...gauge.labels, ...labels };
      this.emit('metric_updated', { name, type: 'gauge', value, labels });
    }
  }

  incrementGauge(name, value = 1, labels = {}) {
    const gauge = this.gauges.get(name);
    if (gauge) {
      gauge.value += value;
      gauge.lastUpdated = Date.now();
      gauge.labels = { ...gauge.labels, ...labels };
      this.emit('metric_updated', { name, type: 'gauge', value: gauge.value, labels });
    }
  }

  decrementGauge(name, value = 1, labels = {}) {
    this.incrementGauge(name, -value, labels);
  }

  // Histogram operations
  recordHistogram(name, value, labels = {}) {
    const histogram = this.histograms.get(name);
    if (histogram) {
      histogram.values.push(value);
      histogram.sum += value;
      histogram.count += 1;
      histogram.lastUpdated = Date.now();
      histogram.labels = { ...histogram.labels, ...labels };
      
      // Keep only last 1000 values for memory efficiency
      if (histogram.values.length > 1000) {
        histogram.values = histogram.values.slice(-1000);
      }
      
      this.emit('metric_updated', { name, type: 'histogram', value, labels });
    }
  }

  // Timer utilities
  startTimer(name) {
    const timerId = `${name}_${Date.now()}_${Math.random()}`;
    this.timers.set(timerId, Date.now());
    return timerId;
  }

  endTimer(timerId, metricName, labels = {}) {
    const startTime = this.timers.get(timerId);
    if (startTime) {
      const duration = Date.now() - startTime;
      this.recordHistogram(metricName, duration, labels);
      this.timers.delete(timerId);
      return duration;
    }
    return null;
  }

  // Performance tracking
  trackApiRequest(endpoint, method = 'GET') {
    const timerId = this.startTimer('api_request');
    this.incrementCounter('api_requests_total', 1, { endpoint, method });
    this.incrementGauge('api_requests_active');
    
    return {
      finish: (success = true, statusCode = 200) => {
        const duration = this.endTimer(timerId, 'api_request_duration', { endpoint, method, success: success.toString() });
        this.decrementGauge('api_requests_active');
        
        if (!success) {
          this.incrementCounter('api_requests_errors', 1, { endpoint, method, statusCode: statusCode.toString() });
        }
        
        return duration;
      }
    };
  }

  trackToolExecution(toolName) {
    const timerId = this.startTimer('tool_execution');
    this.incrementCounter('tools_executed_total', 1, { tool: toolName });
    
    return {
      finish: (success = true, error = null) => {
        const duration = this.endTimer(timerId, 'tool_execution_duration', { tool: toolName, success: success.toString() });
        
        if (!success) {
          this.incrementCounter('tools_failed_total', 1, { tool: toolName, error: error?.name || 'unknown' });
        }
        
        return duration;
      }
    };
  }

  // Cache tracking
  trackCacheHit(cacheType = 'default') {
    this.incrementCounter('cache_hits_total', 1, { cache_type: cacheType });
  }

  trackCacheMiss(cacheType = 'default') {
    this.incrementCounter('cache_misses_total', 1, { cache_type: cacheType });
  }

  updateCacheStats(size, entries, cacheType = 'default') {
    this.setGauge('cache_size_bytes', size, { cache_type: cacheType });
    this.setGauge('cache_entries_count', entries, { cache_type: cacheType });
  }

  // System metrics collection
  collectSystemMetrics() {
    try {
      const memUsage = process.memoryUsage();
      this.setGauge('memory_usage_bytes', memUsage.heapUsed, { type: 'heap_used' });
      this.setGauge('memory_usage_bytes', memUsage.heapTotal, { type: 'heap_total' });
      this.setGauge('memory_usage_bytes', memUsage.rss, { type: 'rss' });
      this.setGauge('memory_usage_bytes', memUsage.external, { type: 'external' });

      // CPU usage (simplified - in real implementation, use a proper CPU monitoring library)
      const cpuUsage = process.cpuUsage();
      this.setGauge('cpu_usage_percent', (cpuUsage.user + cpuUsage.system) / 1000000); // Convert to seconds
      
      // Event loop lag measurement
      const start = process.hrtime.bigint();
      setImmediate(() => {
        const lag = Number(process.hrtime.bigint() - start) / 1000000; // Convert to milliseconds
        this.setGauge('event_loop_lag_ms', lag);
      });
      
    } catch (error) {
      logger.warn('Failed to collect system metrics:', error.message);
    }
  }

  // Alert system
  defineAlert(name, condition, action) {
    this.alerts.set(name, { condition, action, lastTriggered: 0, cooldown: 300000 }); // 5 min cooldown
  }

  checkAlerts() {
    const now = Date.now();
    
    for (const [alertName, alert] of this.alerts) {
      try {
        if (now - alert.lastTriggered < alert.cooldown) continue;
        
        if (alert.condition(this.getMetricsSnapshot())) {
          alert.lastTriggered = now;
          alert.action(alertName, this.getMetricsSnapshot());
        }
      } catch (error) {
        logger.warn(`Alert ${alertName} check failed:`, error.message);
      }
    }
  }

  // Metrics retrieval
  getMetricsSnapshot() {
    return {
      counters: Object.fromEntries(this.counters),
      gauges: Object.fromEntries(this.gauges),
      histograms: Object.fromEntries(
        Array.from(this.histograms.entries()).map(([name, hist]) => [
          name,
          {
            ...hist,
            statistics: this.calculateHistogramStats(hist)
          }
        ])
      ),
      timestamp: Date.now(),
      uptime: Date.now() - this.startTime
    };
  }

  calculateHistogramStats(histogram) {
    if (histogram.values.length === 0) {
      return { min: 0, max: 0, mean: 0, p50: 0, p95: 0, p99: 0 };
    }

    const sorted = [...histogram.values].sort((a, b) => a - b);
    const len = sorted.length;
    
    return {
      min: sorted[0],
      max: sorted[len - 1],
      mean: histogram.sum / histogram.count,
      p50: sorted[Math.floor(len * 0.5)],
      p95: sorted[Math.floor(len * 0.95)],
      p99: sorted[Math.floor(len * 0.99)]
    };
  }

  // Prometheus-style metrics export
  exportPrometheusMetrics() {
    let output = '';
    
    // Export counters
    for (const [name, counter] of this.counters) {
      output += `# HELP ${name} ${counter.description}\n`;
      output += `# TYPE ${name} counter\n`;
      output += `${name} ${counter.value}\n\n`;
    }
    
    // Export gauges
    for (const [name, gauge] of this.gauges) {
      output += `# HELP ${name} ${gauge.description}\n`;
      output += `# TYPE ${name} gauge\n`;
      output += `${name} ${gauge.value}\n\n`;
    }
    
    // Export histograms
    for (const [name, histogram] of this.histograms) {
      output += `# HELP ${name} ${histogram.description}\n`;
      output += `# TYPE ${name} histogram\n`;
      
      for (const bucket of histogram.buckets) {
        const count = histogram.values.filter(v => v <= bucket).length;
        output += `${name}_bucket{le="${bucket}"} ${count}\n`;
      }
      output += `${name}_bucket{le="+Inf"} ${histogram.count}\n`;
      output += `${name}_count ${histogram.count}\n`;
      output += `${name}_sum ${histogram.sum}\n\n`;
    }
    
    return output;
  }

  // Periodic collection
  startPeriodicCollection() {
    // Collect system metrics every 30 seconds
    this.systemMetricsInterval = setInterval(() => {
      this.collectSystemMetrics();
    }, 30000);
    
    // Check alerts every 60 seconds
    this.alertsInterval = setInterval(() => {
      this.checkAlerts();
    }, 60000);
    
    // Initial collection
    this.collectSystemMetrics();
  }

  // Cleanup
  destroy() {
    if (this.systemMetricsInterval) {
      clearInterval(this.systemMetricsInterval);
    }
    if (this.alertsInterval) {
      clearInterval(this.alertsInterval);
    }
    this.removeAllListeners();
  }
}

// Export singleton instance
const telemetry = new TelemetryCollector();

// Define some default alerts
telemetry.defineAlert('high_error_rate', 
  (metrics) => {
    const errors = metrics.counters.api_requests_errors?.value || 0;
    const total = metrics.counters.api_requests_total?.value || 1;
    return (errors / total) > 0.1; // 10% error rate
  },
  (alertName, metrics) => {
    logger.error(`ALERT: ${alertName}`, { metrics: metrics.counters });
  }
);

telemetry.defineAlert('high_memory_usage',
  (metrics) => {
    const heapUsed = metrics.gauges.memory_usage_bytes?.value || 0;
    return heapUsed > 500 * 1024 * 1024; // 500MB
  },
  (alertName, metrics) => {
    logger.warn(`ALERT: ${alertName}`, { 
      heapUsed: `${Math.round(metrics.gauges.memory_usage_bytes?.value / 1024 / 1024)}MB`
    });
  }
);

module.exports = {
  TelemetryCollector,
  telemetry
}; 
