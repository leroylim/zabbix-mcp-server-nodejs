# UpGuard CyberRisk MCP Server - Implementation Guide

## 📚 **Overview**

This guide documents the enhanced implementations added to the UpGuard CyberRisk MCP Server, including configuration management, telemetry, security, and documentation systems. Each section provides usage examples, configuration options, and best practices.

---

## 🔧 **Enhanced Configuration Management**

### **Location:** `src/config/enhanced.js`

The enhanced configuration system provides centralized, validated configuration management with environment-specific overrides and security-first defaults.

### **Key Features:**
- **Zod Schema Validation**: Compile-time configuration validation
- **Environment Variable Support**: Load settings from env vars
- **File-based Configuration**: JSON config file support
- **Deep Merging**: Environment overrides file settings
- **Security Redaction**: Safe config export for logging

### **Basic Usage:**

```javascript
const { configManager } = require('./src/config/enhanced');

// Load configuration
const config = configManager.load('./config/production.json');

// Access configuration values
const apiTimeout = configManager.get('api.timeout');
const isProduction = configManager.isProduction();
const logLevel = configManager.get('logging.level');

// Get safe config for logging (sensitive data redacted)
const safeConfig = configManager.getSafeConfig();
console.log('Loaded config:', safeConfig);
```

### **Environment Variables:**

```bash
# Required
export UPGUARD_API_KEY="your-api-key-here"

# API Configuration
export UPGUARD_API_BASE_URL="https://cyber-risk.upguard.com/api/public"
export UPGUARD_API_TIMEOUT="120000"
export API_RETRY_ATTEMPTS="3"
export API_RETRY_DELAY="1000"

# Transport Configuration
export MCP_TRANSPORT_MODE="stdio"  # or "http"
export MCP_HTTP_PORT="3000"
export MCP_HTTP_HOST="localhost"

# Logging Configuration
export LOG_LEVEL="info"  # error, warn, info, debug
export LOG_FILE="./logs/app.log"
export LOG_CONSOLE="true"

# Cache Configuration
export CACHE_ENABLED="true"
export CACHE_DEFAULT_TTL="3600"
export CACHE_MAX_SIZE="1000"

# Monitoring Configuration
export MONITORING_ENABLED="true"
export HEALTH_CHECK_INTERVAL="30000"
export METRICS_ENABLED="true"

# Security Configuration
export API_KEY_ROTATION_DAYS="90"
export ENCRYPT_SENSITIVE_DATA="true"
export AUDIT_LOGGING="true"
export RATE_LIMIT_BY_IP="true"
```

### **Configuration File Example:**

```json
{
  "nodeEnv": "production",
  "api": {
    "baseUrl": "https://cyber-risk.upguard.com/api/public",
    "timeout": 120000,
    "retryAttempts": 3,
    "retryDelay": 1000
  },
  "transport": {
    "mode": "http",
    "http": {
      "port": 3000,
      "host": "0.0.0.0",
      "sessionManagement": false,
      "corsEnabled": false,
      "rateLimiting": {
        "enabled": true,
        "windowMs": 900000,
        "maxRequests": 100
      }
    }
  },
  "logging": {
    "level": "info",
    "file": "./logs/production.log",
    "console": true,
    "structured": true,
    "maxFiles": 5,
    "maxSize": "10m"
  },
  "cache": {
    "enabled": true,
    "defaultTtl": 3600,
    "maxSize": 1000,
    "checkPeriod": 600
  },
  "monitoring": {
    "enabled": true,
    "healthCheckInterval": 30000,
    "metricsEnabled": true,
    "alerting": {
      "enabled": true,
      "webhookUrl": "https://hooks.slack.com/your-webhook",
      "errorThreshold": 5
    }
  },
  "security": {
    "apiKeyRotationDays": 90,
    "encryptSensitiveData": true,
    "auditLogging": true,
    "rateLimitByIp": true
  }
}
```

### **Integration Example:**

```javascript
// server.js
const { configManager } = require('./src/config/enhanced');
const { logger } = require('./src/utils/logger');

async function startServer() {
  try {
    // Load configuration
    const config = configManager.load(process.env.CONFIG_FILE);
    
    // Validate API connection
    const isConnected = await configManager.validateApiConnection();
    if (!isConnected) {
      throw new Error('Cannot connect to UpGuard API');
    }
    
    // Start server with config
    const port = configManager.get('transport.http.port');
    const host = configManager.get('transport.http.host');
    
    logger.info('Server starting', { 
      port, 
      host, 
      env: configManager.get('nodeEnv') 
    });
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}
```

---

## 📊 **Advanced Telemetry System**

### **Location:** `src/utils/telemetry.js`

Comprehensive metrics collection and monitoring system with Prometheus compatibility, custom alerts, and system performance tracking.

### **Key Features:**
- **Prometheus-Compatible Metrics**: Counters, gauges, histograms
- **System Metrics**: CPU, memory, event loop lag
- **Custom Alerts**: Configurable alerting system
- **Performance Tracking**: API requests, tool execution, cache performance
- **Automatic Collection**: Periodic metrics gathering

### **Basic Usage:**

```javascript
const { telemetry } = require('./src/utils/telemetry');

// Track API requests
const apiTracker = telemetry.trackApiRequest('/vendor/monitor', 'POST');
try {
  // Your API call
  const result = await api.call();
  apiTracker.finish(true, 200); // success, status code
} catch (error) {
  apiTracker.finish(false, 500); // failure, status code
}

// Track tool execution
const toolTracker = telemetry.trackToolExecution('upguard_start_monitoring_vendor');
try {
  // Your tool logic
  const result = await executeTool();
  toolTracker.finish(true);
} catch (error) {
  toolTracker.finish(false, error);
}

// Track cache performance
telemetry.trackCacheHit('vendor_cache');
telemetry.trackCacheMiss('vendor_cache');
telemetry.updateCacheStats(1024000, 150, 'vendor_cache'); // size, entries, type

// Custom metrics
telemetry.incrementCounter('custom_events_total', 1, { event_type: 'user_action' });
telemetry.setGauge('queue_size', 42, { queue_name: 'processing' });
telemetry.recordHistogram('response_time_ms', 250, { endpoint: '/api/vendors' });
```

### **Custom Alerts:**

```javascript
// Define custom alerts
telemetry.defineAlert('high_error_rate', 
  (metrics) => {
    const errors = metrics.counters.api_requests_errors?.value || 0;
    const total = metrics.counters.api_requests_total?.value || 1;
    return (errors / total) > 0.1; // 10% error rate threshold
  },
  (alertName, metrics) => {
    logger.error(`ALERT: ${alertName}`, { 
      errorRate: (metrics.counters.api_requests_errors?.value / metrics.counters.api_requests_total?.value * 100).toFixed(2) + '%'
    });
    // Send to webhook, email, etc.
  }
);

telemetry.defineAlert('high_memory_usage',
  (metrics) => {
    const heapUsed = metrics.gauges.memory_usage_bytes?.value || 0;
    return heapUsed > 500 * 1024 * 1024; // 500MB threshold
  },
  (alertName, metrics) => {
    const memoryMB = Math.round(metrics.gauges.memory_usage_bytes?.value / 1024 / 1024);
    logger.warn(`ALERT: ${alertName}`, { memoryUsage: `${memoryMB}MB` });
  }
);
```

### **Metrics Export:**

```javascript
// Get metrics snapshot
const snapshot = telemetry.getMetricsSnapshot();
console.log('Current metrics:', JSON.stringify(snapshot, null, 2));

// Export Prometheus format
const prometheusMetrics = telemetry.exportPrometheusMetrics();
console.log(prometheusMetrics);

// Expose metrics endpoint
app.get('/metrics', (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.send(telemetry.exportPrometheusMetrics());
});
```

### **Integration with Express:**

```javascript
const express = require('express');
const { telemetry } = require('./src/utils/telemetry');

const app = express();

// Middleware for automatic request tracking
app.use((req, res, next) => {
  const tracker = telemetry.trackApiRequest(req.path, req.method);
  
  res.on('finish', () => {
    const success = res.statusCode < 400;
    tracker.finish(success, res.statusCode);
  });
  
  next();
});

// Health check with metrics
app.get('/health', (req, res) => {
  const snapshot = telemetry.getMetricsSnapshot();
  res.json({
    status: 'ok',
    uptime: snapshot.uptime,
    timestamp: new Date().toISOString(),
    metrics: {
      totalRequests: snapshot.counters.api_requests_total?.value || 0,
      errorRate: (snapshot.counters.api_requests_errors?.value || 0) / (snapshot.counters.api_requests_total?.value || 1),
      memoryUsage: snapshot.gauges.memory_usage_bytes?.value || 0
    }
  });
});

// Metrics endpoint
app.get('/metrics', (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.send(telemetry.exportPrometheusMetrics());
});
```

---

## 🔒 **Security Framework**

### **Location:** `src/security/index.js`

Enterprise-grade security framework providing API key validation, input sanitization, rate limiting, and comprehensive audit logging.

### **Key Features:**
- **API Key Security**: Validation, entropy analysis, rotation tracking
- **Input Sanitization**: XSS, SQL injection, command injection protection
- **Rate Limiting**: IP-based throttling with automatic blocking
- **Data Encryption**: AES-256-GCM encryption for sensitive data
- **Audit Logging**: Comprehensive security event tracking

### **Basic Usage:**

```javascript
const { SecurityManager } = require('./src/security');

// Initialize with configuration
const security = new SecurityManager({
  apiKeyRotationDays: 90,
  rateLimitWindow: 900000, // 15 minutes
  rateLimitMax: 100,
  encryptionKey: 'your-encryption-key', // or auto-generated
  auditLog: true
});

// API key validation
const keyValidation = security.validateApiKey(apiKey);
if (!keyValidation.valid) {
  console.error('Invalid API key:', keyValidation.issues);
  return;
}

// Check if API key needs rotation
const shouldRotate = security.shouldRotateApiKey(apiKey, lastRotatedDate);
if (shouldRotate) {
  console.warn('API key should be rotated');
}

// Input sanitization
const sanitizedInput = security.sanitizeInput(userInput, {
  maxStringLength: 1000,
  removeHtml: true,
  removeScript: true,
  allowedTags: ['b', 'i', 'em', 'strong']
});

// Rate limiting
const rateLimitResult = security.checkRateLimit(clientIp, {
  windowMs: 900000, // 15 minutes
  maxRequests: 100
});

if (!rateLimitResult.allowed) {
  console.log(`Rate limit exceeded. Retry after ${rateLimitResult.retryAfter} seconds`);
  return;
}

// Data encryption
const encrypted = security.encrypt('sensitive-data');
console.log('Encrypted:', encrypted); // { encrypted, iv, tag }

const decrypted = security.decrypt(encrypted);
console.log('Decrypted:', decrypted);
```

### **Express Middleware Integration:**

```javascript
const express = require('express');
const { SecurityManager } = require('./src/security');

const app = express();
const security = new SecurityManager();

// Security headers middleware
app.use((req, res, next) => {
  // Validate headers
  const headerValidation = security.validateHeaders(req.headers);
  if (headerValidation.warnings.length > 0) {
    security.auditLog('suspicious_headers', { 
      ip: req.ip, 
      warnings: headerValidation.warnings 
    });
  }
  
  next();
});

// Rate limiting middleware
app.use((req, res, next) => {
  const clientIp = req.ip || req.connection.remoteAddress;
  const rateLimitResult = security.checkRateLimit(clientIp);
  
  if (!rateLimitResult.allowed) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      retryAfter: rateLimitResult.retryAfter
    });
  }
  
  // Add rate limit headers
  res.set({
    'X-RateLimit-Limit': '100',
    'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
    'X-RateLimit-Reset': rateLimitResult.resetTime.toISOString()
  });
  
  next();
});

// Input sanitization middleware
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    // Sanitize request body
    if (req.body && typeof req.body === 'object') {
      req.body = security.sanitizeInput(req.body, {
        maxStringLength: 1000,
        removeScript: true,
        removeHtml: true
      });
    }
  }
}));

// API key validation middleware
app.use('/api', (req, res, next) => {
  const apiKey = req.headers.authorization?.replace('Bearer ', '');
  
  if (!apiKey) {
    security.auditLog('auth_failure', { ip: req.ip, reason: 'missing_api_key' });
    return res.status(401).json({ error: 'API key required' });
  }
  
  const validation = security.validateApiKey(apiKey);
  if (!validation.valid) {
    security.auditLog('auth_failure', { 
      ip: req.ip, 
      reason: 'invalid_api_key',
      issues: validation.issues 
    });
    return res.status(401).json({ 
      error: 'Invalid API key', 
      issues: validation.issues 
    });
  }
  
  // Check if key needs rotation
  if (security.shouldRotateApiKey(apiKey)) {
    res.set('X-API-Key-Rotation-Recommended', 'true');
  }
  
  next();
});
```

### **Security Monitoring:**

```javascript
// Generate security report
const securityReport = security.generateSecurityReport();
console.log('Security Status:', JSON.stringify(securityReport, null, 2));

// Example output:
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "rateLimiting": {
    "activeIps": 15,
    "suspiciousIps": 2
  },
  "config": {
    "apiKeyRotationDays": 90,
    "rateLimitWindow": 900000,
    "rateLimitMax": 100,
    "auditLogging": true
  },
  "metrics": {
    "counters": {
      "security_events_total": { "value": 42 },
      "auth_failures_total": { "value": 3 },
      "rate_limit_hits_total": { "value": 8 }
    }
  }
}
```

---

## 📖 **API Documentation Generator**

### **Location:** `src/utils/doc-generator.js`

Automatic API documentation generation from tool definitions and schemas, producing OpenAPI 3.0 specifications and interactive documentation.

### **Key Features:**
- **OpenAPI 3.0 Generation**: Machine-readable API specifications
- **Schema Conversion**: Zod schemas to OpenAPI schemas
- **Interactive Documentation**: Swagger UI integration
- **Multiple Output Formats**: JSON, Markdown, HTML
- **Automatic Examples**: Generated request/response samples

### **Basic Usage:**

```javascript
const { ApiDocumentationGenerator } = require('./src/utils/doc-generator');
const tools = require('./src/tools');
const schemas = require('./src/tools/schemas');

// Initialize generator
const docGenerator = new ApiDocumentationGenerator();

// Generate documentation
const openApiSpec = docGenerator.generateDocumentation(tools, schemas);

// Save to files
await docGenerator.saveDocumentation('./docs', {
  generateOpenApi: true,
  generateMarkdown: true,
  generateHtml: false
});

console.log('Documentation generated in ./docs/');
```

### **Integration with Express:**

```javascript
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const { ApiDocumentationGenerator } = require('./src/utils/doc-generator');

const app = express();
const docGenerator = new ApiDocumentationGenerator();

// Generate documentation
const tools = [
  {
    name: 'upguard_start_monitoring_vendor',
    description: 'Start monitoring a new vendor',
    inputSchema: vendorSchema
  },
  // ... other tools
];

const openApiSpec = docGenerator.generateDocumentation(tools, schemas);

// Serve interactive documentation
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'UpGuard CyberRisk MCP API'
}));

// Serve OpenAPI spec
app.get('/openapi.json', (req, res) => {
  res.json(openApiSpec);
});

// Generate markdown documentation
app.get('/docs/markdown', (req, res) => {
  const markdown = docGenerator.generateMarkdown(openApiSpec);
  res.set('Content-Type', 'text/markdown');
  res.send(markdown);
});
```

### **Custom Tool Documentation:**

```javascript
// Define tools with rich documentation
const tools = [
  {
    name: 'upguard_start_monitoring_vendor',
    description: 'Start monitoring a new vendor for security risks',
    inputSchema: z.object({
      vendor_hostname: z.string()
        .regex(/^[a-zA-Z0-9][a-zA-Z0-9-_.]*[a-zA-Z0-9]$/)
        .describe('Vendor hostname or domain to monitor'),
      vendor_tier: z.number().int().min(1).max(3).optional()
        .describe('Vendor tier (1=Critical, 2=High, 3=Medium)'),
      vendor_labels: z.array(z.string()).max(10).optional()
        .describe('Labels to categorize the vendor')
    }),
    examples: [
      {
        name: 'Monitor critical vendor',
        input: {
          vendor_hostname: 'example.com',
          vendor_tier: 1,
          vendor_labels: ['financial', 'payment-processor']
        }
      },
      {
        name: 'Monitor basic vendor',
        input: {
          vendor_hostname: 'vendor.example.com'
        }
      }
    ]
  }
];
```

### **Generated Documentation Structure:**

```
docs/
├── openapi.json          # OpenAPI 3.0 specification
├── API.md               # Markdown documentation
└── interactive/         # Interactive HTML docs
    ├── index.html
    └── assets/
```

### **Automated Documentation Updates:**

```javascript
// scripts/generate-docs.js
const fs = require('fs');
const { ApiDocumentationGenerator } = require('../src/utils/doc-generator');

async function generateDocs() {
  const docGenerator = new ApiDocumentationGenerator();
  
  // Load tools dynamically
  const tools = await loadAllTools();
  const schemas = await loadAllSchemas();
  
  // Generate documentation
  const openApiSpec = docGenerator.generateDocumentation(tools, schemas);
  
  // Save to multiple formats
  await docGenerator.saveDocumentation('./docs', {
    generateOpenApi: true,
    generateMarkdown: true,
    generateHtml: true
  });
  
  // Update version in package.json
  const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  openApiSpec.info.version = packageJson.version;
  
  console.log(`✅ Documentation generated for version ${packageJson.version}`);
}

// Run if called directly
if (require.main === module) {
  generateDocs().catch(console.error);
}

module.exports = { generateDocs };
```

---

## 🔄 **Integration Examples**

### **Complete Server Setup:**

```javascript
// server.js
const express = require('express');
const { configManager } = require('./src/config/enhanced');
const { telemetry } = require('./src/utils/telemetry');
const { SecurityManager } = require('./src/security');
const { ApiDocumentationGenerator } = require('./src/utils/doc-generator');
const { logger } = require('./src/utils/logger');

async function createServer() {
  // Load configuration
  const config = configManager.load(process.env.CONFIG_FILE);
  
  // Initialize security
  const security = new SecurityManager({
    apiKeyRotationDays: config.get('security.apiKeyRotationDays'),
    rateLimitWindow: config.get('security.rateLimitWindow'),
    auditLog: config.get('security.auditLogging')
  });
  
  // Initialize Express
  const app = express();
  
  // Security middleware
  app.use(express.json({ limit: '10mb' }));
  app.use((req, res, next) => {
    const tracker = telemetry.trackApiRequest(req.path, req.method);
    res.on('finish', () => {
      tracker.finish(res.statusCode < 400, res.statusCode);
    });
    next();
  });
  
  // Rate limiting
  app.use((req, res, next) => {
    const rateLimitResult = security.checkRateLimit(req.ip);
    if (!rateLimitResult.allowed) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        retryAfter: rateLimitResult.retryAfter
      });
    }
    next();
  });
  
  // Health check
  app.get('/health', (req, res) => {
    const snapshot = telemetry.getMetricsSnapshot();
    res.json({
      status: 'ok',
      uptime: snapshot.uptime,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version
    });
  });
  
  // Metrics endpoint
  app.get('/metrics', (req, res) => {
    res.set('Content-Type', 'text/plain');
    res.send(telemetry.exportPrometheusMetrics());
  });
  
  // API documentation
  const docGenerator = new ApiDocumentationGenerator();
  const tools = await loadTools();
  const schemas = await loadSchemas();
  const openApiSpec = docGenerator.generateDocumentation(tools, schemas);
  
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));
  app.get('/openapi.json', (req, res) => res.json(openApiSpec));
  
  // Start server
  const port = config.get('transport.http.port');
  const host = config.get('transport.http.host');
  
  app.listen(port, host, () => {
    logger.info('Server started', { port, host, env: config.get('nodeEnv') });
  });
  
  return app;
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('Shutting down gracefully...');
  telemetry.destroy();
  security.destroy();
  process.exit(0);
});

// Start server
if (require.main === module) {
  createServer().catch(error => {
    logger.error('Failed to start server:', error);
    process.exit(1);
  });
}
```

### **Tool Implementation with All Features:**

```javascript
// src/tools/enhanced-vendor-tool.js
const { z } = require('zod');
const { telemetry } = require('../utils/telemetry');
const { SecurityManager } = require('../security');
const { configManager } = require('../config/enhanced');
const { logger } = require('../utils/logger');

const security = new SecurityManager();

// Schema definition
const vendorMonitoringSchema = z.object({
  vendor_hostname: z.string()
    .regex(/^[a-zA-Z0-9][a-zA-Z0-9-_.]*[a-zA-Z0-9]$/)
    .describe('Vendor hostname or domain to monitor'),
  vendor_tier: z.number().int().min(1).max(3).optional()
    .describe('Vendor tier (1=Critical, 2=High, 3=Medium)'),
  vendor_labels: z.array(z.string()).max(10).optional()
    .describe('Labels to categorize the vendor'),
  notify_on_changes: z.boolean().default(true)
    .describe('Send notifications when vendor status changes')
});

async function startMonitoringVendor(params) {
  const toolTracker = telemetry.trackToolExecution('upguard_start_monitoring_vendor');
  
  try {
    // Validate and sanitize input
    const sanitizedParams = security.sanitizeInput(params);
    const validatedParams = vendorMonitoringSchema.parse(sanitizedParams);
    
    // Get API configuration
    const apiKey = configManager.get('api.key');
    const baseUrl = configManager.get('api.baseUrl');
    const timeout = configManager.get('api.timeout');
    
    // Validate API key
    const keyValidation = security.validateApiKey(apiKey);
    if (!keyValidation.valid) {
      throw new Error(`Invalid API key: ${keyValidation.issues.join(', ')}`);
    }
    
    // Track API request
    const apiTracker = telemetry.trackApiRequest('/vendor/monitor', 'POST');
    
    try {
      // Make API call with configuration
      const response = await fetch(`${baseUrl}/vendor`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          hostname: validatedParams.vendor_hostname,
          tier: validatedParams.vendor_tier,
          labels: validatedParams.vendor_labels,
          notify: validatedParams.notify_on_changes
        }),
        signal: AbortSignal.timeout(timeout)
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // Track successful API call
      apiTracker.finish(true, response.status);
      
      // Track successful tool execution
      toolTracker.finish(true);
      
      // Audit log
      security.auditLog('vendor_monitoring_started', {
        vendor: validatedParams.vendor_hostname,
        tier: validatedParams.vendor_tier,
        timestamp: new Date().toISOString()
      });
      
      logger.info('Vendor monitoring started', {
        vendor: validatedParams.vendor_hostname,
        vendorId: result.vendor_id
      });
      
      return {
        success: true,
        vendor_id: result.vendor_id,
        message: `Started monitoring ${validatedParams.vendor_hostname}`,
        monitoring_url: `https://cyber-risk.upguard.com/vendors/${result.vendor_id}`
      };
      
    } catch (apiError) {
      apiTracker.finish(false, apiError.response?.status || 500);
      throw apiError;
    }
    
  } catch (error) {
    // Track failed tool execution
    toolTracker.finish(false, error);
    
    // Log error
    logger.error('Failed to start vendor monitoring', {
      error: error.message,
      params: sanitizedParams
    });
    
    throw error;
  }
}

module.exports = {
  name: 'upguard_start_monitoring_vendor',
  description: 'Start monitoring a new vendor for security risks',
  inputSchema: vendorMonitoringSchema,
  handler: startMonitoringVendor
};
```

---

## 🚀 **Deployment and Operations**

### **Docker Integration:**

```dockerfile
# Dockerfile
FROM node:18-alpine

# Install security tools
RUN apk add --no-cache dumb-init

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Set ownership
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
```

### **Docker Compose:**

```yaml
# docker-compose.yml
version: '3.8'

services:
  upguard-mcp:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - UPGUARD_API_KEY=${UPGUARD_API_KEY}
      - LOG_LEVEL=info
      - MONITORING_ENABLED=true
      - METRICS_ENABLED=true
    volumes:
      - ./logs:/app/logs
      - ./config:/app/config
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana-storage:/var/lib/grafana
      - ./monitoring/grafana/dashboards:/etc/grafana/provisioning/dashboards
    restart: unless-stopped

volumes:
  grafana-storage:
```

### **Monitoring Configuration:**

```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'upguard-mcp'
    static_configs:
      - targets: ['upguard-mcp:3000']
    metrics_path: '/metrics'
    scrape_interval: 10s

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']
```

---

## 📊 **Best Practices**

### **Configuration Management:**
1. **Environment-Specific Configs**: Use different config files for dev/staging/prod
2. **Secret Management**: Store sensitive values in environment variables
3. **Validation**: Always validate configuration on startup
4. **Documentation**: Document all configuration options

### **Telemetry and Monitoring:**
1. **Consistent Labeling**: Use consistent labels across metrics
2. **Appropriate Granularity**: Don't over-instrument, focus on key metrics
3. **Alert Thresholds**: Set meaningful alert thresholds based on SLAs
4. **Dashboard Design**: Create focused dashboards for different audiences

### **Security:**
1. **Defense in Depth**: Layer multiple security controls
2. **Least Privilege**: Grant minimum necessary permissions
3. **Regular Audits**: Review security logs and configurations regularly
4. **Key Rotation**: Implement automated key rotation

### **Documentation:**
1. **Keep Updated**: Regenerate docs with each release
2. **Include Examples**: Provide realistic usage examples
3. **Version Control**: Track documentation changes
4. **User Testing**: Test documentation with new users

---

## 🔍 **Troubleshooting**

### **Common Issues:**

**Configuration Loading Fails:**
```bash
# Check environment variables
env | grep UPGUARD

# Validate config file
node -e "console.log(JSON.parse(require('fs').readFileSync('./config/production.json')))"

# Test configuration loading
node -e "const {configManager} = require('./src/config/enhanced'); console.log(configManager.load())"
```

**Metrics Not Collecting:**
```bash
# Check telemetry endpoint
curl http://localhost:3000/metrics

# Check system metrics
node -e "const {telemetry} = require('./src/utils/telemetry'); console.log(telemetry.getMetricsSnapshot())"
```

**Security Issues:**
```bash
# Check API key validation
node -e "const {SecurityManager} = require('./src/security'); const s = new SecurityManager(); console.log(s.validateApiKey(process.env.UPGUARD_API_KEY))"

# Check rate limits
curl -I http://localhost:3000/health
```

### **Debug Mode:**

```bash
# Enable debug logging
export LOG_LEVEL=debug
export DEBUG=upguard:*

# Start with additional logging
NODE_ENV=development LOG_LEVEL=debug node server.js
```

---

This implementation guide provides comprehensive documentation for all enhanced systems. Each system can be used independently or in combination for maximum effectiveness. 