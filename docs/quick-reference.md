# UpGuard MCP Server - Quick Reference Guide

## 🚀 **Quick Start**

### **1. Load Configuration**
```javascript
const { configManager } = require('./src/config/enhanced');
const config = configManager.load('./config/production.json');
```

### **2. Track Performance**
```javascript
const { telemetry } = require('./src/utils/telemetry');

// API requests
const tracker = telemetry.trackApiRequest('/api/vendors', 'GET');
// ... do work ...
tracker.finish(true, 200);

// Tool execution
const toolTracker = telemetry.trackToolExecution('vendor_tool');
// ... execute tool ...
toolTracker.finish(true);
```

### **3. Secure Operations**
```javascript
const { SecurityManager } = require('./src/security');
const security = new SecurityManager();

// Validate API key
const validation = security.validateApiKey(apiKey);
if (!validation.valid) throw new Error('Invalid API key');

// Sanitize input
const clean = security.sanitizeInput(userInput);

// Check rate limits
const rateLimit = security.checkRateLimit(clientIp);
if (!rateLimit.allowed) throw new Error('Rate limited');
```

### **4. Generate Documentation**
```javascript
const { ApiDocumentationGenerator } = require('./src/utils/doc-generator');
const generator = new ApiDocumentationGenerator();

const spec = generator.generateDocumentation(tools, schemas);
await generator.saveDocumentation('./docs');
```

---

## ⚡ **Common Patterns**

### **Tool Implementation Template**
```javascript
const { z } = require('zod');
const { telemetry } = require('../utils/telemetry');
const { SecurityManager } = require('../security');
const { configManager } = require('../config/enhanced');

const security = new SecurityManager();

const schema = z.object({
  param: z.string().describe('Parameter description')
});

async function toolHandler(params) {
  const tracker = telemetry.trackToolExecution('tool_name');
  
  try {
    // Sanitize and validate
    const clean = security.sanitizeInput(params);
    const validated = schema.parse(clean);
    
    // Get config
    const apiKey = configManager.get('api.key');
    
    // Execute logic
    const result = await doWork(validated);
    
    tracker.finish(true);
    return result;
    
  } catch (error) {
    tracker.finish(false, error);
    throw error;
  }
}

module.exports = {
  name: 'tool_name',
  description: 'Tool description',
  inputSchema: schema,
  handler: toolHandler
};
```

### **Express Route Template**
```javascript
app.post('/api/endpoint', async (req, res) => {
  const tracker = telemetry.trackApiRequest(req.path, req.method);
  
  try {
    // Rate limiting
    const rateLimit = security.checkRateLimit(req.ip);
    if (!rateLimit.allowed) {
      tracker.finish(false, 429);
      return res.status(429).json({ error: 'Rate limited' });
    }
    
    // Sanitize input
    const clean = security.sanitizeInput(req.body);
    
    // Process request
    const result = await processRequest(clean);
    
    tracker.finish(true, 200);
    res.json(result);
    
  } catch (error) {
    tracker.finish(false, 500);
    res.status(500).json({ error: error.message });
  }
});
```

---

## 📊 **Key Metrics to Monitor**

| Metric | Description | Alert Threshold |
|--------|-------------|----------------|
| `api_requests_total` | Total API requests | N/A |
| `api_requests_errors` | Failed API requests | >10% error rate |
| `api_request_duration` | Request latency | P95 >2s |
| `memory_usage_bytes` | Memory consumption | >500MB |
| `cpu_usage_percent` | CPU utilization | >80% |
| `cache_hits_total` | Cache performance | <70% hit rate |
| `security_events_total` | Security incidents | Any critical event |

---

## 🔧 **Configuration Checklist**

### **Required Environment Variables**
```bash
export UPGUARD_API_KEY="your-api-key"
export NODE_ENV="production"
export LOG_LEVEL="info"
```

### **Optional Configuration**
```bash
export MCP_TRANSPORT_MODE="http"          # or "stdio"
export MCP_HTTP_PORT="3000"
export CACHE_ENABLED="true"
export MONITORING_ENABLED="true"
export RATE_LIMITING_ENABLED="true"
```

### **Security Settings**
```bash
export API_KEY_ROTATION_DAYS="90"
export ENCRYPT_SENSITIVE_DATA="true"
export AUDIT_LOGGING="true"
export RATE_LIMIT_BY_IP="true"
```

---

## 🛠️ **Useful Commands**

### **Health Checks**
```bash
# Check server health
curl http://localhost:3000/health

# Get metrics
curl http://localhost:3000/metrics

# View documentation
open http://localhost:3000/docs
```

### **Testing**
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Test specific module
npm test -- --testNamePattern="security"
```

### **Development**
```bash
# Start in development mode
NODE_ENV=development LOG_LEVEL=debug npm start

# Generate documentation
npm run docs:generate

# Lint code
npm run lint

# Format code
npm run format
```

---

## 🚨 **Emergency Procedures**

### **High Error Rate**
1. Check `/health` endpoint
2. Review error logs: `tail -f logs/app.log`
3. Check API connectivity: `curl -I ${UPGUARD_API_BASE_URL}`
4. Verify API key: Check `X-API-Key-Rotation-Recommended` header

### **High Memory Usage**
1. Check metrics: `curl localhost:3000/metrics | grep memory`
2. Restart application if needed
3. Review cache settings in configuration
4. Check for memory leaks in recent deployments

### **Rate Limiting Issues**
1. Check suspicious IPs in logs
2. Review rate limit settings
3. Temporarily increase limits if needed:
   ```bash
   export RATE_LIMIT_MAX_REQUESTS="200"
   export RATE_LIMIT_WINDOW_MS="1800000"  # 30 min
   ```

### **Security Incidents**
1. Check audit logs: `grep "security_events" logs/app.log`
2. Review suspicious activity: `grep "suspicious" logs/app.log`
3. Block problematic IPs if needed
4. Rotate API keys if compromised

---

## 📝 **Code Examples**

### **Custom Alert**
```javascript
telemetry.defineAlert('custom_business_metric',
  (metrics) => {
    const processed = metrics.counters.items_processed?.value || 0;
    const errors = metrics.counters.processing_errors?.value || 0;
    return (errors / processed) > 0.05; // 5% error rate
  },
  (alertName) => {
    console.log(`ALERT: ${alertName} - Processing error rate too high`);
    // Send notification
  }
);
```

### **Custom Middleware**
```javascript
function createSecurityMiddleware() {
  const security = new SecurityManager();
  
  return (req, res, next) => {
    // Validate headers
    const headerValidation = security.validateHeaders(req.headers);
    if (!headerValidation.valid) {
      return res.status(400).json({ error: 'Invalid headers' });
    }
    
    // Rate limiting
    const rateLimit = security.checkRateLimit(req.ip);
    if (!rateLimit.allowed) {
      return res.status(429).json({ 
        error: 'Rate limited',
        retryAfter: rateLimit.retryAfter 
      });
    }
    
    next();
  };
}

app.use(createSecurityMiddleware());
```

### **Configuration Override**
```javascript
// Load base config then override specific values
const baseConfig = configManager.load('./config/base.json');

// Override for testing
const testOverrides = {
  api: { timeout: 5000 },
  logging: { level: 'debug' },
  cache: { enabled: false }
};

const testConfig = configManager.deepMerge(baseConfig, testOverrides);
```

---

## 🔍 **Debugging Tips**

### **Enable Debug Logging**
```bash
DEBUG=upguard:* LOG_LEVEL=debug node server.js
```

### **Check Schema Validation**
```javascript
try {
  const result = schema.parse(input);
} catch (error) {
  console.log('Validation errors:', error.errors);
}
```

### **Test Security Functions**
```javascript
const security = new SecurityManager();

// Test API key
console.log(security.validateApiKey('test-key'));

// Test input sanitization
console.log(security.sanitizeInput('<script>alert("xss")</script>'));

// Test rate limiting
console.log(security.checkRateLimit('127.0.0.1'));
```

### **Monitor Real-time Metrics**
```javascript
telemetry.on('metric_updated', (event) => {
  console.log(`Metric updated: ${event.name} = ${event.value}`);
});
```

---

## 📚 **Additional Resources**

- **Full Implementation Guide**: [`implementation-guide.md`](./implementation-guide.md)
- **Improvement Roadmap**: [`recommended-improvements.md`](./recommended-improvements.md)
- **Schema Documentation**: [`src/tools/schemas/index.js`](./src/tools/schemas/index.js)
- **API Documentation**: `http://localhost:3000/docs` (when server running)

---

**💡 Pro Tip**: Use the telemetry system to identify performance bottlenecks and the security framework to prevent common vulnerabilities. Always validate inputs and monitor key metrics! 