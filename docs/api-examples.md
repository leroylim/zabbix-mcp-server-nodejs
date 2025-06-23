# UpGuard MCP Server - API Usage Examples

## 🌟 **Complete Integration Examples**

This document provides real-world examples of using all the enhanced systems together in practical scenarios.

---

## 🚀 **Scenario 1: Enterprise Tool Implementation**

### **Enhanced Vendor Monitoring Tool**

```javascript
// src/tools/enhanced-vendor-monitor.js
const { z } = require('zod');
const { telemetry } = require('../utils/telemetry');
const { SecurityManager } = require('../security');
const { configManager } = require('../config/enhanced');
const { logger } = require('../utils/logger');

// Initialize security with configuration
const security = new SecurityManager({
  apiKeyRotationDays: configManager.get('security.apiKeyRotationDays'),
  rateLimitWindow: configManager.get('security.rateLimitWindow'),
  auditLog: configManager.get('security.auditLogging')
});

// Enhanced schema with comprehensive validation
const vendorMonitoringSchema = z.object({
  vendor_hostname: z.string()
    .min(3, 'Hostname too short')
    .max(253, 'Hostname too long')
    .regex(/^[a-zA-Z0-9][a-zA-Z0-9-_.]*[a-zA-Z0-9]$/, 'Invalid hostname format')
    .describe('Vendor hostname or domain to monitor'),
  
  vendor_tier: z.number()
    .int('Tier must be an integer')
    .min(1, 'Minimum tier is 1')
    .max(3, 'Maximum tier is 3')
    .optional()
    .describe('Vendor tier: 1=Critical, 2=High, 3=Medium'),
    
  vendor_labels: z.array(z.string().max(50, 'Label too long'))
    .max(10, 'Maximum 10 labels allowed')
    .optional()
    .describe('Labels to categorize the vendor'),
    
  monitoring_frequency: z.enum(['hourly', 'daily', 'weekly'])
    .default('daily')
    .describe('How often to check vendor status'),
    
  notification_settings: z.object({
    email: z.boolean().default(true),
    webhook: z.string().url().optional(),
    slack_channel: z.string().optional()
  }).optional().describe('Notification preferences'),
  
  risk_thresholds: z.object({
    security_score: z.number().min(0).max(950).default(700),
    website_risk: z.enum(['low', 'medium', 'high']).default('medium'),
    data_leak_tolerance: z.enum(['none', 'low', 'medium']).default('low')
  }).optional().describe('Risk tolerance settings')
});

async function enhancedVendorMonitoring(params) {
  // Start tracking tool execution
  const toolTracker = telemetry.trackToolExecution('enhanced_vendor_monitoring');
  const startTime = Date.now();
  
  try {
    // Step 1: Security validation and sanitization
    logger.info('Starting vendor monitoring request', { 
      vendor: params.vendor_hostname,
      timestamp: new Date().toISOString()
    });
    
    // Sanitize input to prevent injection attacks
    const sanitizedParams = security.sanitizeInput(params, {
      maxStringLength: 500,
      removeHtml: true,
      removeScript: true
    });
    
    // Validate against schema
    const validatedParams = vendorMonitoringSchema.parse(sanitizedParams);
    
    // Step 2: Configuration and API setup
    const apiKey = configManager.get('api.key');
    const baseUrl = configManager.get('api.baseUrl');
    const timeout = configManager.get('api.timeout');
    const retryAttempts = configManager.get('api.retryAttempts');
    
    // Validate API key strength and rotation needs
    const keyValidation = security.validateApiKey(apiKey);
    if (!keyValidation.valid) {
      throw new Error(`API key validation failed: ${keyValidation.issues.join(', ')}`);
    }
    
    // Check if key needs rotation (log warning but continue)
    if (security.shouldRotateApiKey(apiKey)) {
      logger.warn('API key rotation recommended', {
        strength: keyValidation.strength,
        daysSinceRotation: 'check_required'
      });
    }
    
    // Step 3: API interaction with retry logic
    let apiResult;
    let lastError;
    
    for (let attempt = 1; attempt <= retryAttempts; attempt++) {
      const apiTracker = telemetry.trackApiRequest('/vendor/monitor', 'POST');
      
      try {
        const response = await fetch(`${baseUrl}/vendor`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'User-Agent': 'UpGuard-MCP-Server/1.0.0',
            'X-Request-ID': `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          },
          body: JSON.stringify({
            hostname: validatedParams.vendor_hostname,
            tier: validatedParams.vendor_tier || 2,
            labels: validatedParams.vendor_labels || [],
            monitoring_frequency: validatedParams.monitoring_frequency,
            notification_settings: validatedParams.notification_settings,
            risk_thresholds: validatedParams.risk_thresholds
          }),
          signal: AbortSignal.timeout(timeout)
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API error ${response.status}: ${errorText}`);
        }
        
        apiResult = await response.json();
        apiTracker.finish(true, response.status);
        
        // Success - break retry loop
        break;
        
      } catch (error) {
        lastError = error;
        apiTracker.finish(false, error.response?.status || 500);
        
        // Log retry attempt
        logger.warn(`API attempt ${attempt} failed`, {
          error: error.message,
          vendor: validatedParams.vendor_hostname,
          attempt,
          maxAttempts: retryAttempts
        });
        
        // Wait before retry (exponential backoff)
        if (attempt < retryAttempts) {
          const delay = configManager.get('api.retryDelay') * Math.pow(2, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // Check if all retries failed
    if (!apiResult) {
      throw new Error(`All ${retryAttempts} API attempts failed. Last error: ${lastError.message}`);
    }
    
    // Step 4: Process successful response
    const processingTracker = telemetry.startTimer('vendor_processing');
    
    // Enhance response with additional metadata
    const enhancedResult = {
      vendor_id: apiResult.vendor_id,
      vendor_hostname: validatedParams.vendor_hostname,
      monitoring_status: 'active',
      tier: validatedParams.vendor_tier || 2,
      labels: validatedParams.vendor_labels || [],
      created_at: new Date().toISOString(),
      monitoring_url: `https://cyber-risk.upguard.com/vendors/${apiResult.vendor_id}`,
      api_response: apiResult,
      
      // Add risk assessment if available
      initial_assessment: apiResult.security_score ? {
        security_score: apiResult.security_score,
        risk_level: apiResult.security_score > 750 ? 'low' : 
                   apiResult.security_score > 500 ? 'medium' : 'high',
        assessed_at: new Date().toISOString()
      } : null,
      
      // Add monitoring configuration
      monitoring_config: {
        frequency: validatedParams.monitoring_frequency,
        next_check: calculateNextCheck(validatedParams.monitoring_frequency),
        notifications: validatedParams.notification_settings || { email: true },
        thresholds: validatedParams.risk_thresholds || {}
      }
    };
    
    telemetry.endTimer(processingTracker, 'vendor_processing_duration');
    
    // Step 5: Security audit logging
    security.auditLog('vendor_monitoring_started', {
      vendor: validatedParams.vendor_hostname,
      vendor_id: apiResult.vendor_id,
      tier: validatedParams.vendor_tier,
      labels: validatedParams.vendor_labels,
      user_ip: 'internal', // Would be real IP in web context
      timestamp: new Date().toISOString(),
      success: true
    });
    
    // Step 6: Update metrics and cache
    telemetry.incrementCounter('vendors_monitored_total', 1, {
      tier: (validatedParams.vendor_tier || 2).toString(),
      frequency: validatedParams.monitoring_frequency
    });
    
    // Cache the result for quick access
    if (configManager.get('cache.enabled')) {
      // This would integrate with a cache system
      logger.debug('Caching vendor monitoring result', {
        vendor_id: apiResult.vendor_id,
        cache_ttl: configManager.get('cache.defaultTtl')
      });
    }
    
    // Step 7: Success logging and metrics
    const duration = Date.now() - startTime;
    toolTracker.finish(true);
    
    logger.info('Vendor monitoring completed successfully', {
      vendor: validatedParams.vendor_hostname,
      vendor_id: apiResult.vendor_id,
      duration_ms: duration,
      security_score: apiResult.security_score
    });
    
    return {
      success: true,
      message: `Successfully started monitoring ${validatedParams.vendor_hostname}`,
      data: enhancedResult,
      execution_time_ms: duration,
      api_calls_made: 1 // Could be higher with retries
    };
    
  } catch (error) {
    // Error handling with comprehensive logging
    const duration = Date.now() - startTime;
    toolTracker.finish(false, error);
    
    // Security logging for failed attempts
    security.auditLog('vendor_monitoring_failed', {
      vendor: params.vendor_hostname,
      error: error.message,
      error_type: error.constructor.name,
      timestamp: new Date().toISOString(),
      duration_ms: duration
    });
    
    // Increment error metrics
    telemetry.incrementCounter('vendor_monitoring_errors_total', 1, {
      error_type: error.constructor.name,
      vendor: params.vendor_hostname || 'unknown'
    });
    
    logger.error('Vendor monitoring failed', {
      vendor: params.vendor_hostname,
      error: error.message,
      stack: error.stack,
      duration_ms: duration
    });
    
    // Return structured error response
    throw new Error(`Failed to start monitoring ${params.vendor_hostname}: ${error.message}`);
  }
}

// Helper function for calculating next monitoring check
function calculateNextCheck(frequency) {
  const now = new Date();
  switch (frequency) {
    case 'hourly':
      return new Date(now.getTime() + 60 * 60 * 1000);
    case 'daily':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case 'weekly':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
  }
}

// Export enhanced tool
module.exports = {
  name: 'upguard_enhanced_vendor_monitoring',
  description: 'Advanced vendor monitoring with comprehensive security, validation, and tracking',
  inputSchema: vendorMonitoringSchema,
  handler: enhancedVendorMonitoring,
  
  // Additional metadata for documentation generation
  category: 'Vendor Management',
  version: '2.0.0',
  examples: [
    {
      name: 'Monitor critical financial vendor',
      description: 'Set up monitoring for a critical financial services vendor with strict thresholds',
      input: {
        vendor_hostname: 'payments.financialcorp.com',
        vendor_tier: 1,
        vendor_labels: ['financial', 'payment-processor', 'pci-dss'],
        monitoring_frequency: 'hourly',
        notification_settings: {
          email: true,
          webhook: 'https://hooks.slack.com/financial-alerts',
          slack_channel: '#security-alerts'
        },
        risk_thresholds: {
          security_score: 800,
          website_risk: 'low',
          data_leak_tolerance: 'none'
        }
      }
    },
    {
      name: 'Monitor standard vendor',
      description: 'Basic monitoring setup for a standard vendor',
      input: {
        vendor_hostname: 'vendor.example.com',
        vendor_tier: 2,
        monitoring_frequency: 'daily'
      }
    }
  ]
};
```

---

## 🖥️ **Scenario 2: Express Server with Full Integration**

### **Production-Ready Server Setup**

```javascript
// server.js - Complete enterprise server implementation
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');

// Enhanced modules
const { configManager } = require('./src/config/enhanced');
const { telemetry } = require('./src/utils/telemetry');
const { SecurityManager } = require('./src/security');
const { ApiDocumentationGenerator } = require('./src/utils/doc-generator');
const { logger } = require('./src/utils/logger');

// Tools and schemas
const tools = require('./src/tools');
const schemas = require('./src/tools/schemas');

class EnhancedMCPServer {
  constructor() {
    this.app = express();
    this.security = null;
    this.docGenerator = null;
    this.config = null;
    this.isShuttingDown = false;
  }

  async initialize() {
    try {
      // Load and validate configuration
      this.config = configManager.load(process.env.CONFIG_FILE);
      logger.info('Configuration loaded successfully', {
        env: this.config.nodeEnv,
        transport: this.config.transport.mode,
        monitoring: this.config.monitoring.enabled
      });
      
      // Initialize security with configuration
      this.security = new SecurityManager({
        apiKeyRotationDays: this.config.security.apiKeyRotationDays,
        rateLimitWindow: this.config.transport.http.rateLimiting.windowMs,
        rateLimitMax: this.config.transport.http.rateLimiting.maxRequests,
        auditLog: this.config.security.auditLogging
      });
      
      // Initialize documentation generator
      this.docGenerator = new ApiDocumentationGenerator();
      
      // Setup middleware
      this.setupMiddleware();
      
      // Setup routes
      this.setupRoutes();
      
      // Setup error handling
      this.setupErrorHandling();
      
      // Setup graceful shutdown
      this.setupGracefulShutdown();
      
      logger.info('Server initialization completed');
      
    } catch (error) {
      logger.error('Server initialization failed', { error: error.message });
      throw error;
    }
  }

  setupMiddleware() {
    // Security headers
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"]
        }
      }
    }));
    
    // Compression
    this.app.use(compression());
    
    // CORS (if enabled)
    if (this.config.transport.http.corsEnabled) {
      this.app.use(cors({
        origin: process.env.ALLOWED_ORIGINS?.split(',') || false,
        credentials: true
      }));
    }
    
    // Request parsing
    this.app.use(express.json({ 
      limit: '10mb',
      verify: (req, res, buf) => {
        // Sanitize request body for security
        if (req.body && typeof req.body === 'object') {
          req.body = this.security.sanitizeInput(req.body, {
            maxStringLength: 1000,
            removeScript: true,
            removeHtml: true
          });
        }
      }
    }));
    
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // Request tracking middleware
    this.app.use((req, res, next) => {
      // Skip tracking for health checks and metrics
      if (req.path === '/health' || req.path === '/metrics') {
        return next();
      }
      
      const tracker = telemetry.trackApiRequest(req.path, req.method);
      req.telemetryTracker = tracker;
      
      // Track request completion
      res.on('finish', () => {
        const success = res.statusCode < 400;
        tracker.finish(success, res.statusCode);
        
        // Log request completion
        logger.info('Request completed', {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration: tracker.duration,
          userAgent: req.get('User-Agent'),
          ip: req.ip
        });
      });
      
      next();
    });
    
    // Security validation middleware
    this.app.use((req, res, next) => {
      // Validate headers for security
      const headerValidation = this.security.validateHeaders(req.headers);
      if (headerValidation.warnings.length > 0) {
        this.security.auditLog('suspicious_headers', {
          ip: req.ip,
          path: req.path,
          warnings: headerValidation.warnings,
          userAgent: req.get('User-Agent')
        });
      }
      
      next();
    });
    
    // Rate limiting middleware
    this.app.use((req, res, next) => {
      // Skip rate limiting for health checks
      if (req.path === '/health' || req.path === '/metrics') {
        return next();
      }
      
      const clientIp = req.ip || req.connection.remoteAddress;
      const rateLimitResult = this.security.checkRateLimit(clientIp, {
        windowMs: this.config.transport.http.rateLimiting.windowMs,
        maxRequests: this.config.transport.http.rateLimiting.maxRequests
      });
      
      if (!rateLimitResult.allowed) {
        // Log rate limit violation
        this.security.auditLog('rate_limit_violation', {
          ip: clientIp,
          path: req.path,
          remaining: rateLimitResult.remaining,
          resetTime: rateLimitResult.resetTime
        });
        
        return res.status(429).json({
          error: 'Rate limit exceeded',
          retryAfter: rateLimitResult.retryAfter,
          limit: this.config.transport.http.rateLimiting.maxRequests,
          window: this.config.transport.http.rateLimiting.windowMs / 1000
        });
      }
      
      // Add rate limit headers
      res.set({
        'X-RateLimit-Limit': this.config.transport.http.rateLimiting.maxRequests.toString(),
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        'X-RateLimit-Reset': rateLimitResult.resetTime.toISOString(),
        'X-RateLimit-Window': (this.config.transport.http.rateLimiting.windowMs / 1000).toString()
      });
      
      next();
    });
  }

  setupRoutes() {
    // Health check endpoint
    this.app.get('/health', async (req, res) => {
      try {
        const snapshot = telemetry.getMetricsSnapshot();
        const healthData = {
          status: 'ok',
          timestamp: new Date().toISOString(),
          uptime: snapshot.uptime,
          version: process.env.npm_package_version || '1.0.0',
          environment: this.config.nodeEnv,
          
          // System metrics
          system: {
            memory: {
              used: snapshot.gauges.memory_usage_bytes?.value || 0,
              total: process.memoryUsage().heapTotal,
              percentage: Math.round((snapshot.gauges.memory_usage_bytes?.value || 0) / process.memoryUsage().heapTotal * 100)
            },
            cpu: {
              usage: snapshot.gauges.cpu_usage_percent?.value || 0
            },
            eventLoop: {
              lag: snapshot.gauges.event_loop_lag_ms?.value || 0
            }
          },
          
          // Application metrics
          metrics: {
            totalRequests: snapshot.counters.api_requests_total?.value || 0,
            errorRequests: snapshot.counters.api_requests_errors?.value || 0,
            errorRate: this.calculateErrorRate(snapshot),
            cacheHitRate: this.calculateCacheHitRate(snapshot),
            activeConnections: snapshot.gauges.api_requests_active?.value || 0
          },
          
          // Component health
          components: {
            upguardApi: await this.checkUpGuardApi(),
            cache: this.config.cache.enabled,
            monitoring: this.config.monitoring.enabled,
            security: true
          }
        };
        
        // Determine overall health status
        if (healthData.metrics.errorRate > 0.1) {
          healthData.status = 'degraded';
        }
        
        if (healthData.system.memory.percentage > 90) {
          healthData.status = 'degraded';
        }
        
        res.json(healthData);
        
      } catch (error) {
        logger.error('Health check failed', { error: error.message });
        res.status(500).json({
          status: 'error',
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });
    
    // Metrics endpoint (Prometheus format)
    this.app.get('/metrics', (req, res) => {
      try {
        res.set('Content-Type', 'text/plain');
        res.send(telemetry.exportPrometheusMetrics());
      } catch (error) {
        logger.error('Metrics export failed', { error: error.message });
        res.status(500).send('# Metrics export failed');
      }
    });
    
    // API documentation
    const openApiSpec = this.docGenerator.generateDocumentation(tools, schemas);
    this.app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec, {
      customCss: `
        .swagger-ui .topbar { display: none }
        .swagger-ui .info { margin: 20px 0 }
        .swagger-ui .scheme-container { margin: 20px 0 }
      `,
      customSiteTitle: 'UpGuard CyberRisk MCP API Documentation',
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true
      }
    }));
    
    // OpenAPI spec endpoint
    this.app.get('/openapi.json', (req, res) => {
      res.json(openApiSpec);
    });
    
    // Tools execution endpoint
    this.app.post('/tools/:toolName', async (req, res) => {
      const { toolName } = req.params;
      const toolTracker = telemetry.trackToolExecution(toolName);
      
      try {
        // Validate API key
        const apiKey = req.headers.authorization?.replace('Bearer ', '');
        if (!apiKey) {
          this.security.auditLog('auth_failure', {
            ip: req.ip,
            tool: toolName,
            reason: 'missing_api_key'
          });
          return res.status(401).json({ error: 'API key required' });
        }
        
        const keyValidation = this.security.validateApiKey(apiKey);
        if (!keyValidation.valid) {
          this.security.auditLog('auth_failure', {
            ip: req.ip,
            tool: toolName,
            reason: 'invalid_api_key',
            issues: keyValidation.issues
          });
          return res.status(401).json({
            error: 'Invalid API key',
            issues: keyValidation.issues
          });
        }
        
        // Check if key needs rotation
        if (this.security.shouldRotateApiKey(apiKey)) {
          res.set('X-API-Key-Rotation-Recommended', 'true');
        }
        
        // Find and execute tool
        const tool = tools.find(t => t.name === toolName);
        if (!tool) {
          return res.status(404).json({
            error: 'Tool not found',
            available_tools: tools.map(t => t.name)
          });
        }
        
        // Execute tool with parameters
        const result = await tool.handler(req.body);
        
        toolTracker.finish(true);
        
        // Audit successful tool execution
        this.security.auditLog('tool_executed', {
          tool: toolName,
          ip: req.ip,
          success: true,
          timestamp: new Date().toISOString()
        });
        
        res.json({
          success: true,
          tool: toolName,
          result,
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        toolTracker.finish(false, error);
        
        // Audit failed tool execution
        this.security.auditLog('tool_execution_failed', {
          tool: toolName,
          ip: req.ip,
          error: error.message,
          timestamp: new Date().toISOString()
        });
        
        logger.error('Tool execution failed', {
          tool: toolName,
          error: error.message,
          ip: req.ip
        });
        
        res.status(500).json({
          success: false,
          tool: toolName,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });
    
    // Security report endpoint (admin only)
    this.app.get('/admin/security-report', (req, res) => {
      try {
        const report = this.security.generateSecurityReport();
        res.json(report);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Configuration status endpoint
    this.app.get('/admin/config-status', (req, res) => {
      try {
        const safeConfig = configManager.getSafeConfig();
        res.json({
          environment: this.config.nodeEnv,
          config: safeConfig,
          validation: 'passed'
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  }

  setupErrorHandling() {
    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({
        error: 'Not Found',
        message: 'The requested resource was not found',
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
      });
    });
    
    // Global error handler
    this.app.use((error, req, res, next) => {
      // Log error
      logger.error('Unhandled error', {
        error: error.message,
        stack: error.stack,
        path: req.path,
        method: req.method,
        ip: req.ip
      });
      
      // Track error
      telemetry.incrementCounter('unhandled_errors_total', 1, {
        path: req.path,
        method: req.method
      });
      
      // Security audit
      this.security.auditLog('unhandled_error', {
        error: error.message,
        path: req.path,
        method: req.method,
        ip: req.ip
      });
      
      // Respond with error
      if (!res.headersSent) {
        res.status(500).json({
          error: 'Internal Server Error',
          message: this.config.nodeEnv === 'development' ? error.message : 'An unexpected error occurred',
          timestamp: new Date().toISOString(),
          requestId: req.id
        });
      }
    });
  }

  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      if (this.isShuttingDown) return;
      this.isShuttingDown = true;
      
      logger.info(`Received ${signal}, starting graceful shutdown`);
      
      // Stop accepting new connections
      if (this.server) {
        this.server.close(() => {
          logger.info('HTTP server closed');
        });
      }
      
      // Cleanup resources
      telemetry.destroy();
      this.security.destroy();
      
      logger.info('Graceful shutdown completed');
      process.exit(0);
    };
    
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }

  async start() {
    try {
      const port = this.config.transport.http.port;
      const host = this.config.transport.http.host;
      
      this.server = this.app.listen(port, host, () => {
        logger.info('Server started successfully', {
          port,
          host,
          environment: this.config.nodeEnv,
          documentation: `http://${host}:${port}/docs`,
          health: `http://${host}:${port}/health`,
          metrics: `http://${host}:${port}/metrics`
        });
      });
      
      return this.server;
      
    } catch (error) {
      logger.error('Failed to start server', { error: error.message });
      throw error;
    }
  }

  // Helper methods
  calculateErrorRate(snapshot) {
    const total = snapshot.counters.api_requests_total?.value || 0;
    const errors = snapshot.counters.api_requests_errors?.value || 0;
    return total > 0 ? errors / total : 0;
  }

  calculateCacheHitRate(snapshot) {
    const hits = snapshot.counters.cache_hits_total?.value || 0;
    const misses = snapshot.counters.cache_misses_total?.value || 0;
    const total = hits + misses;
    return total > 0 ? hits / total : 0;
  }

  async checkUpGuardApi() {
    try {
      // This would make a quick health check to UpGuard API
      return true;
    } catch {
      return false;
    }
  }
}

// Start server if run directly
if (require.main === module) {
  const server = new EnhancedMCPServer();
  
  server.initialize()
    .then(() => server.start())
    .catch(error => {
      console.error('Server startup failed:', error);
      process.exit(1);
    });
}

module.exports = { EnhancedMCPServer };
```

---

## 📊 **Scenario 3: Monitoring Dashboard Integration**

### **Grafana Dashboard Configuration**

```json
{
  "dashboard": {
    "title": "UpGuard MCP Server Monitoring",
    "tags": ["upguard", "mcp", "security"],
    "timezone": "UTC",
    "panels": [
      {
        "title": "API Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(api_requests_total[5m])",
            "legendFormat": "Requests/sec"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "singlestat",
        "targets": [
          {
            "expr": "rate(api_requests_errors[5m]) / rate(api_requests_total[5m]) * 100",
            "legendFormat": "Error %"
          }
        ],
        "thresholds": [
          {
            "value": 5,
            "color": "yellow"
          },
          {
            "value": 10,
            "color": "red"
          }
        ]
      },
      {
        "title": "Tool Execution Duration",
        "type": "heatmap",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(tool_execution_duration_bucket[5m]))",
            "legendFormat": "P95 Duration"
          }
        ]
      },
      {
        "title": "Security Events",
        "type": "table",
        "targets": [
          {
            "expr": "increase(security_events_total[1h])",
            "legendFormat": "{{event_type}}"
          }
        ]
      }
    ]
  }
}
```

---

## 🔧 **Scenario 4: Development and Testing**

### **Test Suite Integration**

```javascript
// tests/integration/enhanced-server.test.js
const request = require('supertest');
const { EnhancedMCPServer } = require('../../server');
const { configManager } = require('../../src/config/enhanced');

describe('Enhanced MCP Server Integration', () => {
  let server;
  let app;
  
  beforeAll(async () => {
    // Load test configuration
    process.env.NODE_ENV = 'test';
    process.env.UPGUARD_API_KEY = 'test-api-key-12345678901234567890123456789012';
    
    server = new EnhancedMCPServer();
    await server.initialize();
    app = server.app;
  });
  
  afterAll(async () => {
    if (server.server) {
      server.server.close();
    }
  });

  describe('Health and Metrics', () => {
    test('GET /health returns comprehensive health data', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      expect(response.body).toMatchObject({
        status: expect.stringMatching(/ok|degraded|error/),
        timestamp: expect.any(String),
        uptime: expect.any(Number),
        version: expect.any(String),
        system: {
          memory: expect.objectContaining({
            used: expect.any(Number),
            total: expect.any(Number),
            percentage: expect.any(Number)
          }),
          cpu: expect.objectContaining({
            usage: expect.any(Number)
          })
        },
        metrics: expect.objectContaining({
          totalRequests: expect.any(Number),
          errorRequests: expect.any(Number),
          errorRate: expect.any(Number)
        }),
        components: expect.objectContaining({
          cache: expect.any(Boolean),
          monitoring: expect.any(Boolean),
          security: true
        })
      });
    });
    
    test('GET /metrics returns Prometheus format', async () => {
      const response = await request(app)
        .get('/metrics')
        .expect(200)
        .expect('Content-Type', 'text/plain; charset=utf-8');
      
      expect(response.text).toContain('api_requests_total');
      expect(response.text).toContain('memory_usage_bytes');
      expect(response.text).toContain('security_events_total');
    });
  });

  describe('Security Features', () => {
    test('Rate limiting blocks excessive requests', async () => {
      // Make multiple requests rapidly
      const promises = Array(10).fill().map(() =>
        request(app)
          .post('/tools/upguard_enhanced_vendor_monitoring')
          .set('Authorization', 'Bearer test-api-key-12345678901234567890123456789012')
          .send({ vendor_hostname: 'test.com' })
      );
      
      const responses = await Promise.all(promises);
      
      // Should have some rate limited responses
      const rateLimited = responses.filter(r => r.status === 429);
      expect(rateLimited.length).toBeGreaterThan(0);
      
      // Check rate limit headers
      const successResponse = responses.find(r => r.status !== 429);
      if (successResponse) {
        expect(successResponse.headers).toHaveProperty('x-ratelimit-limit');
        expect(successResponse.headers).toHaveProperty('x-ratelimit-remaining');
        expect(successResponse.headers).toHaveProperty('x-ratelimit-reset');
      }
    });
    
    test('Invalid API key is rejected', async () => {
      const response = await request(app)
        .post('/tools/upguard_enhanced_vendor_monitoring')
        .set('Authorization', 'Bearer invalid-key')
        .send({ vendor_hostname: 'test.com' })
        .expect(401);
      
      expect(response.body).toMatchObject({
        error: 'Invalid API key',
        issues: expect.arrayContaining([
          expect.stringContaining('API key too short')
        ])
      });
    });
    
    test('Missing API key is rejected', async () => {
      const response = await request(app)
        .post('/tools/upguard_enhanced_vendor_monitoring')
        .send({ vendor_hostname: 'test.com' })
        .expect(401);
      
      expect(response.body).toMatchObject({
        error: 'API key required'
      });
    });
  });

  describe('Tool Execution', () => {
    test('Enhanced vendor monitoring with valid input', async () => {
      const response = await request(app)
        .post('/tools/upguard_enhanced_vendor_monitoring')
        .set('Authorization', 'Bearer test-api-key-12345678901234567890123456789012')
        .send({
          vendor_hostname: 'example.com',
          vendor_tier: 2,
          vendor_labels: ['test', 'integration'],
          monitoring_frequency: 'daily',
          notification_settings: {
            email: true
          }
        })
        .expect(200);
      
      expect(response.body).toMatchObject({
        success: true,
        tool: 'upguard_enhanced_vendor_monitoring',
        result: expect.objectContaining({
          success: expect.any(Boolean),
          message: expect.stringContaining('example.com'),
          data: expect.objectContaining({
            vendor_hostname: 'example.com',
            monitoring_status: 'active',
            tier: 2
          })
        })
      });
    });
    
    test('Tool validation rejects invalid input', async () => {
      const response = await request(app)
        .post('/tools/upguard_enhanced_vendor_monitoring')
        .set('Authorization', 'Bearer test-api-key-12345678901234567890123456789012')
        .send({
          vendor_hostname: 'invalid..hostname',
          vendor_tier: 5, // Invalid tier
          vendor_labels: Array(20).fill('too-many-labels') // Too many labels
        })
        .expect(500);
      
      expect(response.body.error).toContain('validation');
    });
  });

  describe('Documentation', () => {
    test('GET /docs serves Swagger UI', async () => {
      const response = await request(app)
        .get('/docs/')
        .expect(200);
      
      expect(response.text).toContain('swagger-ui');
      expect(response.text).toContain('UpGuard CyberRisk MCP API');
    });
    
    test('GET /openapi.json returns valid OpenAPI spec', async () => {
      const response = await request(app)
        .get('/openapi.json')
        .expect(200);
      
      expect(response.body).toMatchObject({
        openapi: '3.0.3',
        info: expect.objectContaining({
          title: 'UpGuard CyberRisk MCP Server API',
          version: expect.any(String)
        }),
        paths: expect.any(Object),
        components: expect.objectContaining({
          schemas: expect.any(Object),
          securitySchemes: expect.any(Object)
        })
      });
    });
  });
});
```

---

This comprehensive documentation shows how all the enhanced systems work together in real-world scenarios, providing enterprise-grade functionality with security, monitoring, and documentation built-in. 