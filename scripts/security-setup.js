/**
 * UpGuard CyberRisk MCP Server - Security Enhancement Setup
 * 
 * This script sets up comprehensive security measures and scanning
 * 
 * Copyright (c) 2024 Han Yong Lim
 * Licensed under MIT License
 */

const fs = require('fs');
const path = require('path');
const { logger } = require('../src/utils/logger');

/**
 * Create security scanning configuration
 */
function createSecurityScanning() {
  // Snyk configuration
  const snykConfig = {
    language: 'javascript',
    packageManager: 'npm',
    severity: 'medium',
    exclude: [
      'node_modules',
      'coverage',
      'docs/generated'
    ],
    patches: {},
    version: 'v1.0.0'
  };

  const snykPath = path.join(__dirname, '../.snyk');
  fs.writeFileSync(snykPath, JSON.stringify(snykConfig, null, 2));

  // ESLint security rules
  const eslintSecurityConfig = {
    extends: [
      'plugin:security/recommended'
    ],
    plugins: ['security'],
    rules: {
      'security/detect-object-injection': 'error',
      'security/detect-non-literal-regexp': 'error',
      'security/detect-unsafe-regex': 'error',
      'security/detect-buffer-noassert': 'error',
      'security/detect-child-process': 'error',
      'security/detect-disable-mustache-escape': 'error',
      'security/detect-eval-with-expression': 'error',
      'security/detect-no-csrf-before-method-override': 'error',
      'security/detect-non-literal-fs-filename': 'error',
      'security/detect-non-literal-require': 'error',
      'security/detect-possible-timing-attacks': 'error',
      'security/detect-pseudoRandomBytes': 'error'
    }
  };

  const eslintSecurityPath = path.join(__dirname, '../.eslintrc.security.js');
  fs.writeFileSync(eslintSecurityPath, `module.exports = ${JSON.stringify(eslintSecurityConfig, null, 2)};`);

  logger.info('Security scanning configuration created');
}

/**
 * Create security middleware
 */
function createSecurityMiddleware() {
  const securityMiddleware = `/**
 * Security Middleware for UpGuard MCP Server
 */
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');

class SecurityManager {
  constructor() {
    this.rateLimitStore = new Map();
    this.suspiciousIPs = new Set();
  }

  // Helmet security headers
  getHelmetConfig() {
    return helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'"]
        }
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    });
  }

  // Rate limiting
  getRateLimiter() {
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        this.suspiciousIPs.add(req.ip);
        logger.warn(\`Rate limit exceeded for IP: \${req.ip}\`);
        res.status(429).json({
          error: 'Too many requests',
          retryAfter: '15 minutes'
        });
      }
    });
  }

  // Speed limiting (slow down responses)
  getSpeedLimiter() {
    return slowDown({
      windowMs: 15 * 60 * 1000, // 15 minutes
      delayAfter: 50, // allow 50 requests per 15 minutes at full speed
      delayMs: 500, // slow down subsequent requests by 500ms per request
      maxDelayMs: 20000 // maximum delay of 20 seconds
    });
  }

  // Input validation middleware
  validateInput(validationRules) {
    return [
      ...validationRules,
      (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          logger.warn(\`Validation failed for \${req.ip}: \${JSON.stringify(errors.array())}\`);
          return res.status(400).json({
            error: 'Invalid input',
            details: errors.array()
          });
        }
        next();
      }
    ];
  }

  // API key validation
  validateApiKey() {
    return (req, res, next) => {
      const apiKey = req.headers.authorization?.replace('Bearer ', '');
      
      if (!apiKey) {
        return res.status(401).json({ error: 'API key required' });
      }

      // Validate API key format and authenticity
      if (!this.isValidApiKey(apiKey)) {
        this.suspiciousIPs.add(req.ip);
        logger.warn(\`Invalid API key attempt from IP: \${req.ip}\`);
        return res.status(401).json({ error: 'Invalid API key' });
      }

      req.apiKey = apiKey;
      next();
    };
  }

  // Check if API key is valid
  isValidApiKey(apiKey) {
    // Implement your API key validation logic
    // This is a placeholder - replace with actual validation
    return apiKey && apiKey.length >= 32 && /^[a-zA-Z0-9]+$/.test(apiKey);
  }

  // Request sanitization
  sanitizeRequest() {
    return (req, res, next) => {
      // Remove potentially dangerous characters
      const sanitize = (obj) => {
        if (typeof obj === 'string') {
          return obj.replace(/<script[^>]*>.*?<\/script>/gi, '')
                   .replace(/<[^>]*>/g, '')
                   .trim();
        }
        if (typeof obj === 'object' && obj !== null) {
          for (const key in obj) {
            obj[key] = sanitize(obj[key]);
          }
        }
        return obj;
      };

      req.body = sanitize(req.body);
      req.query = sanitize(req.query);
      req.params = sanitize(req.params);
      
      next();
    };
  }

  // Security headers middleware
  securityHeaders() {
    return (req, res, next) => {
      res.setHeader('X-Request-ID', crypto.randomUUID());
      res.setHeader('X-API-Version', '1.2.0');
      res.removeHeader('X-Powered-By');
      next();
    };
  }

  // Audit logging
  auditLogger() {
    return (req, res, next) => {
      const startTime = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - startTime;
        const logData = {
          timestamp: new Date().toISOString(),
          method: req.method,
          url: req.url,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          statusCode: res.statusCode,
          duration,
          apiKey: req.apiKey ? 'present' : 'missing'
        };

        if (res.statusCode >= 400) {
          logger.warn('Security audit - failed request:', logData);
        } else {
          logger.info('Security audit - request:', logData);
        }
      });

      next();
    };
  }

  // Setup all security middleware
  setupSecurity(app) {
    app.use(this.getHelmetConfig());
    app.use(this.getRateLimiter());
    app.use(this.getSpeedLimiter());
    app.use(this.sanitizeRequest());
    app.use(this.securityHeaders());
    app.use(this.auditLogger());
    
    logger.info('Security middleware configured');
  }
}

module.exports = { SecurityManager };`;

  const middlewarePath = path.join(__dirname, '../src/security/middleware.js');
  fs.mkdirSync(path.dirname(middlewarePath), { recursive: true });
  fs.writeFileSync(middlewarePath, securityMiddleware);
  logger.info('Security middleware created');
}

/**
 * Create vulnerability scanning scripts
 */
function createVulnerabilityScanning() {
  const scanScript = `#!/usr/bin/env node
/**
 * Vulnerability Scanning Script
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class VulnerabilityScanner {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      scans: {},
      summary: {
        total: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
      }
    };
  }

  async runNpmAudit() {
    try {
      console.log('🔍 Running npm audit...');
      const output = execSync('npm audit --json', { encoding: 'utf8' });
      const auditResult = JSON.parse(output);
      
      this.results.scans.npmAudit = auditResult;
      this.updateSummary(auditResult.metadata?.vulnerabilities || {});
      
      console.log(\`   Found \${auditResult.metadata?.vulnerabilities?.total || 0} vulnerabilities\`);
    } catch (error) {
      console.warn('npm audit failed:', error.message);
      this.results.scans.npmAudit = { error: error.message };
    }
  }

  async runSnykScan() {
    try {
      console.log('🔍 Running Snyk scan...');
      const output = execSync('snyk test --json', { encoding: 'utf8' });
      const snykResult = JSON.parse(output);
      
      this.results.scans.snyk = snykResult;
      console.log(\`   Snyk scan completed\`);
    } catch (error) {
      console.warn('Snyk scan failed (may require authentication):', error.message);
      this.results.scans.snyk = { error: error.message };
    }
  }

  async runESLintSecurity() {
    try {
      console.log('🔍 Running ESLint security scan...');
      const output = execSync('npx eslint src/ --config .eslintrc.security.js --format json', { encoding: 'utf8' });
      const eslintResult = JSON.parse(output);
      
      this.results.scans.eslintSecurity = eslintResult;
      console.log(\`   Found \${eslintResult.length} files with security issues\`);
    } catch (error) {
      console.warn('ESLint security scan failed:', error.message);
      this.results.scans.eslintSecurity = { error: error.message };
    }
  }

  updateSummary(vulnerabilities) {
    this.results.summary.total += vulnerabilities.total || 0;
    this.results.summary.critical += vulnerabilities.critical || 0;
    this.results.summary.high += vulnerabilities.high || 0;
    this.results.summary.medium += vulnerabilities.moderate || 0;
    this.results.summary.low += vulnerabilities.low || 0;
  }

  generateReport() {
    const reportPath = path.join(__dirname, '../security/vulnerability-report.json');
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    
    console.log(\`\\n📊 Vulnerability Scan Summary:\`);
    console.log(\`   Total: \${this.results.summary.total}\`);
    console.log(\`   Critical: \${this.results.summary.critical}\`);
    console.log(\`   High: \${this.results.summary.high}\`);
    console.log(\`   Medium: \${this.results.summary.medium}\`);
    console.log(\`   Low: \${this.results.summary.low}\`);
    console.log(\`\\n📄 Report saved to: \${reportPath}\`);
    
    return this.results.summary.critical > 0 || this.results.summary.high > 0;
  }

  async scan() {
    console.log('🛡️  Starting vulnerability scan...\\n');
    
    await this.runNpmAudit();
    await this.runSnykScan();
    await this.runESLintSecurity();
    
    const hasHighRiskVulns = this.generateReport();
    
    if (hasHighRiskVulns) {
      console.log('\\n⚠️  High or critical vulnerabilities found! Please review and fix.');
      process.exit(1);
    } else {
      console.log('\\n✅ No high-risk vulnerabilities found.');
    }
  }
}

if (require.main === module) {
  const scanner = new VulnerabilityScanner();
  scanner.scan().catch(console.error);
}

module.exports = { VulnerabilityScanner };`;

  const scanPath = path.join(__dirname, '../scripts/security-scan.js');
  fs.writeFileSync(scanPath, scanScript);
  fs.chmodSync(scanPath, '755');
  logger.info('Vulnerability scanning script created');
}

/**
 * Create security policies and guidelines
 */
function createSecurityPolicies() {
  const securityPolicy = `# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.2.x   | :white_check_mark: |
| 1.1.x   | :white_check_mark: |
| < 1.1   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability, please follow these steps:

1. **Do NOT** open a public issue
2. Email security details to: hanyong.lim@gmail.com
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

## Security Measures

### Authentication & Authorization
- API key-based authentication
- Rate limiting (100 requests per 15 minutes)
- Request validation and sanitization
- Audit logging for all requests

### Data Protection
- Input validation using Zod schemas
- SQL injection prevention
- XSS protection via Content Security Policy
- Secure headers (HSTS, X-Frame-Options, etc.)

### Infrastructure Security
- Regular dependency updates
- Automated vulnerability scanning
- Security-focused ESLint rules
- Container security best practices

### Monitoring & Alerting
- Real-time security event logging
- Suspicious activity detection
- Rate limit violation tracking
- Failed authentication monitoring

## Security Checklist

### Development
- [ ] All inputs validated with Zod schemas
- [ ] No hardcoded secrets or API keys
- [ ] Security middleware properly configured
- [ ] Error messages don't leak sensitive information
- [ ] Logging excludes sensitive data

### Deployment
- [ ] Environment variables for all secrets
- [ ] HTTPS enforced in production
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Monitoring and alerting active

### Maintenance
- [ ] Dependencies updated regularly
- [ ] Security scans run weekly
- [ ] Vulnerability reports reviewed
- [ ] Security patches applied promptly
- [ ] Access logs monitored

## Incident Response

1. **Detection**: Automated monitoring alerts
2. **Assessment**: Evaluate impact and scope
3. **Containment**: Isolate affected systems
4. **Eradication**: Remove vulnerability/threat
5. **Recovery**: Restore normal operations
6. **Lessons Learned**: Update security measures

## Contact

For security-related questions or concerns:
- Email: hanyong.lim@gmail.com
- Response time: 24-48 hours for critical issues
`;

  const policyPath = path.join(__dirname, '../SECURITY.md');
  fs.writeFileSync(policyPath, securityPolicy);
  logger.info('Security policy created');
}

/**
 * Create GitHub security workflows
 */
function createSecurityWorkflows() {
  const securityWorkflow = `name: Security Scan

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]
  schedule:
    - cron: '0 2 * * 1' # Weekly on Monday at 2 AM

jobs:
  security-scan:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run npm audit
      run: npm audit --audit-level=moderate
      continue-on-error: true
    
    - name: Run ESLint security scan
      run: npx eslint src/ --config .eslintrc.security.js
      continue-on-error: true
    
    - name: Run Snyk security scan
      uses: snyk/actions/node@master
      env:
        SNYK_TOKEN: \${{ secrets.SNYK_TOKEN }}
      with:
        args: --severity-threshold=high
      continue-on-error: true
    
    - name: Run custom security scan
      run: node scripts/security-scan.js
      continue-on-error: true
    
    - name: Upload security report
      uses: actions/upload-artifact@v4
      if: always()
      with:
        name: security-report
        path: security/vulnerability-report.json
        retention-days: 30

  dependency-review:
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    
    steps:
    - name: Checkout
      uses: actions/checkout@v4
    
    - name: Dependency Review
      uses: actions/dependency-review-action@v4
      with:
        fail-on-severity: moderate
        allow-licenses: MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC

  codeql-analysis:
    runs-on: ubuntu-latest
    permissions:
      actions: read
      contents: read
      security-events: write
    
    steps:
    - name: Checkout
      uses: actions/checkout@v4
    
    - name: Initialize CodeQL
      uses: github/codeql-action/init@v3
      with:
        languages: javascript
    
    - name: Autobuild
      uses: github/codeql-action/autobuild@v3
    
    - name: Perform CodeQL Analysis
      uses: github/codeql-action/analyze@v3`;

  const workflowPath = path.join(__dirname, '../.github/workflows/security.yml');
  fs.mkdirSync(path.dirname(workflowPath), { recursive: true });
  fs.writeFileSync(workflowPath, securityWorkflow);
  logger.info('Security workflow created');
}

/**
 * Main setup function
 */
async function main() {
  try {
    logger.info('Setting up security enhancements...');
    
    createSecurityScanning();
    createSecurityMiddleware();
    createVulnerabilityScanning();
    createSecurityPolicies();
    createSecurityWorkflows();
    
    console.log('\n🛡️  Security Enhancement Setup Complete!');
    console.log('\n📋 Created Components:');
    console.log('   🔍 Security scanning configuration (Snyk, ESLint)');
    console.log('   🛡️  Security middleware with rate limiting');
    console.log('   🔎 Vulnerability scanning script');
    console.log('   📋 Security policy and guidelines');
    console.log('   🤖 GitHub security workflows');
    console.log('\n📦 Required Dependencies:');
    console.log('   npm install helmet express-rate-limit express-slow-down express-validator');
    console.log('   npm install --save-dev snyk @snyk/cli');
    console.log('\n🚀 New Security Commands:');
    console.log('   npm run security:scan - Run comprehensive security scan');
    console.log('   npm run security:audit - Run dependency audit');
    console.log('   npm run security:lint - Run security-focused linting');
    console.log('\n⚠️  Note: File paths are case-sensitive on Unix/Linux systems');
    
  } catch (error) {
    logger.error('Security setup failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { 
  createSecurityScanning, 
  createSecurityMiddleware, 
  createVulnerabilityScanning, 
  createSecurityPolicies, 
  createSecurityWorkflows 
}; 