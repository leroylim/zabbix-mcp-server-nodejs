/**
 * UpGuard CyberRisk MCP Server - Monitoring Setup Script
 * 
 * This script sets up comprehensive monitoring and observability
 * 
 * Copyright (c) 2024 Han Yong Lim
 * Licensed under MIT License
 */

const fs = require('fs');
const path = require('path');
const { logger } = require('../src/utils/logger');

/**
 * Create Prometheus metrics configuration
 */
function createPrometheusConfig() {
  const prometheusConfig = {
    global: {
      scrape_interval: '15s',
      evaluation_interval: '15s'
    },
    scrape_configs: [
      {
        job_name: 'upguard-mcp-server',
        static_configs: [
          {
            targets: ['localhost:3000']
          }
        ],
        metrics_path: '/metrics',
        scrape_interval: '10s'
      }
    ]
  };

  const configPath = path.join(__dirname, '../monitoring/prometheus.yml');
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(configPath, require('yaml').stringify(prometheusConfig));
  logger.info('Prometheus configuration created');
}

/**
 * Create Grafana dashboard configuration
 */
function createGrafanaDashboard() {
  const dashboard = {
    dashboard: {
      id: null,
      title: 'UpGuard CyberRisk MCP Server',
      tags: ['upguard', 'mcp', 'api'],
      timezone: 'browser',
      panels: [
        {
          id: 1,
          title: 'API Request Rate',
          type: 'graph',
          targets: [
            {
              expr: 'rate(http_requests_total[5m])',
              legendFormat: 'Requests/sec'
            }
          ]
        },
        {
          id: 2,
          title: 'Response Time',
          type: 'graph',
          targets: [
            {
              expr: 'histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))',
              legendFormat: '95th percentile'
            }
          ]
        },
        {
          id: 3,
          title: 'Error Rate',
          type: 'singlestat',
          targets: [
            {
              expr: 'rate(http_requests_total{status=~"5.."}[5m])',
              legendFormat: 'Error Rate'
            }
          ]
        }
      ],
      time: {
        from: 'now-1h',
        to: 'now'
      },
      refresh: '5s'
    }
  };

  const dashboardPath = path.join(__dirname, '../monitoring/grafana-dashboard.json');
  fs.mkdirSync(path.dirname(dashboardPath), { recursive: true });
  fs.writeFileSync(dashboardPath, JSON.stringify(dashboard, null, 2));
  logger.info('Grafana dashboard created');
}

/**
 * Create health check endpoints
 */
function createHealthChecks() {
  const healthCheckScript = `/**
 * Enhanced Health Check System
 */
const express = require('express');
const { logger } = require('../utils/logger');

class HealthCheckManager {
  constructor() {
    this.checks = new Map();
    this.metrics = {
      uptime: process.uptime(),
      requests: 0,
      errors: 0,
      lastError: null
    };
  }

  addCheck(name, checkFunction) {
    this.checks.set(name, checkFunction);
  }

  async runChecks() {
    const results = {};
    let allHealthy = true;

    for (const [name, checkFn] of this.checks) {
      try {
        const result = await checkFn();
        results[name] = { status: 'healthy', ...result };
      } catch (error) {
        results[name] = { status: 'unhealthy', error: error.message };
        allHealthy = false;
      }
    }

    return {
      status: allHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks: results,
      metrics: this.metrics
    };
  }

  setupRoutes(app) {
    // Basic health check
    app.get('/health', async (req, res) => {
      const health = await this.runChecks();
      res.status(health.status === 'healthy' ? 200 : 503).json(health);
    });

    // Readiness check
    app.get('/ready', async (req, res) => {
      const health = await this.runChecks();
      res.status(health.status === 'healthy' ? 200 : 503).json({
        ready: health.status === 'healthy',
        timestamp: health.timestamp
      });
    });

    // Liveness check
    app.get('/live', (req, res) => {
      res.status(200).json({
        alive: true,
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    });

    // Metrics endpoint
    app.get('/metrics', (req, res) => {
      res.set('Content-Type', 'text/plain');
      res.send(\`
# HELP upguard_mcp_requests_total Total number of requests
# TYPE upguard_mcp_requests_total counter
upguard_mcp_requests_total \${this.metrics.requests}

# HELP upguard_mcp_errors_total Total number of errors
# TYPE upguard_mcp_errors_total counter
upguard_mcp_errors_total \${this.metrics.errors}

# HELP upguard_mcp_uptime_seconds Server uptime in seconds
# TYPE upguard_mcp_uptime_seconds gauge
upguard_mcp_uptime_seconds \${process.uptime()}
\`);
    });
  }
}

module.exports = { HealthCheckManager };`;

  const healthPath = path.join(__dirname, '../src/utils/health-enhanced.js');
  fs.writeFileSync(healthPath, healthCheckScript);
  logger.info('Enhanced health check system created');
}

/**
 * Main setup function
 */
async function main() {
  try {
    logger.info('Setting up monitoring and observability...');
    
    createPrometheusConfig();
    createGrafanaDashboard();
    createHealthChecks();
    
    console.log('\n🔍 Monitoring Setup Complete!');
    console.log('\n📊 Created Components:');
    console.log('   📈 Prometheus configuration (monitoring/prometheus.yml)');
    console.log('   📊 Grafana dashboard (monitoring/grafana-dashboard.json)');
    console.log('   🏥 Enhanced health checks (src/utils/health-enhanced.js)');
    console.log('\n🚀 Next Steps:');
    console.log('   1. Install monitoring dependencies: npm install prom-client yaml');
    console.log('   2. Set up Prometheus and Grafana containers');
    console.log('   3. Import Grafana dashboard');
    console.log('   4. Configure alerting rules');
    console.log('\n⚠️  Note: File paths are case-sensitive on Unix/Linux systems');
    
  } catch (error) {
    logger.error('Monitoring setup failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { createPrometheusConfig, createGrafanaDashboard, createHealthChecks }; 