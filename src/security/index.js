const crypto = require('crypto');
const { logger } = require('../utils/logger');
const { telemetry } = require('../utils/telemetry');

class SecurityManager {
  constructor(config = {}) {
    this.config = {
      apiKeyRotationDays: config.apiKeyRotationDays || 90,
      maxRequestSize: config.maxRequestSize || '10mb',
      rateLimitWindow: config.rateLimitWindow || 900000, // 15 minutes
      rateLimitMax: config.rateLimitMax || 100,
      encryptionKey: config.encryptionKey || this.generateEncryptionKey(),
      auditLog: config.auditLog !== false,
      ...config
    };
    
    this.ipAttempts = new Map();
    this.suspiciousIps = new Set();
    this.encryptionAlgorithm = 'aes-256-gcm';
    
    // Initialize security monitoring
    this.initializeSecurityMonitoring();
  }

  initializeSecurityMonitoring() {
    // Security metrics
    telemetry.createCounter('security_events_total', 'Total security events');
    telemetry.createCounter('auth_failures_total', 'Total authentication failures');
    telemetry.createCounter('rate_limit_hits_total', 'Total rate limit violations');
    telemetry.createGauge('suspicious_ips_count', 'Number of suspicious IP addresses');
    
    // Clean up old attempts every hour
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldAttempts();
    }, 3600000);
  }

  /**
   * Validate API key format and strength
   * @param {string} apiKey - API key to validate
   * @returns {object} Validation result
   */
  validateApiKey(apiKey) {
    const result = {
      valid: false,
      issues: [],
      strength: 'weak'
    };

    if (!apiKey) {
      result.issues.push('API key is required');
      return result;
    }

    if (typeof apiKey !== 'string') {
      result.issues.push('API key must be a string');
      return result;
    }

    // Check minimum length
    if (apiKey.length < 32) {
      result.issues.push('API key too short (minimum 32 characters)');
    }

    // Check for UUID format (common in UpGuard)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(apiKey)) {
      result.issues.push('API key should be in UUID format');
    }

    // Calculate entropy
    const entropy = this.calculateEntropy(apiKey);
    if (entropy < 3.5) {
      result.issues.push('API key has low entropy');
      result.strength = 'weak';
    } else if (entropy < 4.0) {
      result.strength = 'medium';
    } else {
      result.strength = 'strong';
    }

    result.valid = result.issues.length === 0;
    return result;
  }

  /**
   * Calculate string entropy
   * @param {string} str - String to analyze
   * @returns {number} Entropy value
   */
  calculateEntropy(str) {
    const freq = new Map();
    for (const char of str) {
      freq.set(char, (freq.get(char) || 0) + 1);
    }

    let entropy = 0;
    const len = str.length;
    for (const count of freq.values()) {
      const p = count / len;
      entropy -= p * Math.log2(p);
    }

    return entropy;
  }

  /**
   * Check if API key needs rotation
   * @param {string} apiKey - API key to check
   * @param {Date} lastRotated - Last rotation date
   * @returns {boolean} True if rotation needed
   */
  shouldRotateApiKey(apiKey, lastRotated = null) {
    if (!lastRotated) return true;
    
    const daysSince = (Date.now() - lastRotated.getTime()) / (1000 * 60 * 60 * 24);
    return daysSince >= this.config.apiKeyRotationDays;
  }

  /**
   * Sanitize input to prevent injection attacks
   * @param {any} input - Input to sanitize
   * @param {object} options - Sanitization options
   * @returns {any} Sanitized input
   */
  sanitizeInput(input, options = {}) {
    const config = {
      maxStringLength: options.maxStringLength || 1000,
      allowedTags: options.allowedTags || [],
      removeHtml: options.removeHtml !== false,
      removeScript: options.removeScript !== false,
      ...options
    };

    if (typeof input === 'string') {
      let sanitized = input;

      // Limit string length
      if (sanitized.length > config.maxStringLength) {
        sanitized = sanitized.substring(0, config.maxStringLength);
        this.auditLog('input_truncated', { originalLength: input.length, truncatedLength: config.maxStringLength });
      }

      // Remove potentially dangerous patterns
      if (config.removeScript) {
        // Use safer regex patterns to prevent ReDoS attacks
        sanitized = sanitized.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
        sanitized = sanitized.replace(/javascript:/gi, '');
        sanitized = sanitized.replace(/on\w+\s*=/gi, '');
      }

      // Remove HTML if not allowed
      if (config.removeHtml && config.allowedTags.length === 0) {
        sanitized = sanitized.replace(/<[^>]*>/g, '');
      }

      // SQL injection protection
      sanitized = sanitized.replace(/(['";]|--|\*\/|\bUNION\b|\bSELECT\b|\bINSERT\b|\bDELETE\b|\bDROP\b)/gi, '');

      // Command injection protection
      sanitized = sanitized.replace(/[;&|`$(){}[\]\\]/g, '');

      return sanitized;
    }

    if (Array.isArray(input)) {
      return input.map(item => this.sanitizeInput(item, config));
    }

    if (typeof input === 'object' && input !== null) {
      const sanitized = {};
      for (const [key, value] of Object.entries(input)) {
        // Validate key is safe before using it
        if (typeof key === 'string' && key.length <= 100) {
          const sanitizedKey = this.sanitizeInput(key, { ...config, maxStringLength: 100 });
          // Use Object.defineProperty for safer property assignment
          Object.defineProperty(sanitized, sanitizedKey, {
            value: this.sanitizeInput(value, config),
            writable: true,
            enumerable: true,
            configurable: true
          });
        }
      }
      return sanitized;
    }

    return input;
  }

  /**
   * Rate limiting implementation
   * @param {string} identifier - Client identifier (IP, user ID, etc.)
   * @param {object} options - Rate limiting options
   * @returns {object} Rate limit result
   */
  checkRateLimit(identifier, options = {}) {
    const config = {
      windowMs: options.windowMs || this.config.rateLimitWindow,
      maxRequests: options.maxRequests || this.config.rateLimitMax,
      ...options
    };

    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Get or initialize attempt tracking
    if (!this.ipAttempts.has(identifier)) {
      this.ipAttempts.set(identifier, []);
    }

    const attempts = this.ipAttempts.get(identifier);
    
    // Remove old attempts outside the window
    const recentAttempts = attempts.filter(timestamp => timestamp > windowStart);
    this.ipAttempts.set(identifier, recentAttempts);

    // Check if limit exceeded
    if (recentAttempts.length >= config.maxRequests) {
      this.handleRateLimitViolation(identifier);
      
      telemetry.incrementCounter('rate_limit_hits_total', 1, { identifier_type: 'ip' });
      
      return {
        allowed: false,
        remaining: 0,
        resetTime: new Date(Math.min(...recentAttempts) + config.windowMs),
        retryAfter: Math.ceil((Math.min(...recentAttempts) + config.windowMs - now) / 1000)
      };
    }

    // Record this attempt
    recentAttempts.push(now);
    this.ipAttempts.set(identifier, recentAttempts);

    return {
      allowed: true,
      remaining: config.maxRequests - recentAttempts.length,
      resetTime: new Date(recentAttempts[0] + config.windowMs),
      retryAfter: 0
    };
  }

  /**
   * Handle rate limit violations
   * @param {string} identifier - Client identifier
   */
  handleRateLimitViolation(identifier) {
    this.suspiciousIps.add(identifier);
    telemetry.setGauge('suspicious_ips_count', this.suspiciousIps.size);
    
    this.auditLog('rate_limit_violation', {
      identifier,
      timestamp: new Date().toISOString(),
      action: 'blocked'
    });

    // Automatic IP blocking after repeated violations
    const violations = this.getViolationCount(identifier);
    if (violations >= 5) {
      this.auditLog('ip_blocked', {
        identifier,
        violationCount: violations,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get violation count for an identifier
   * @param {string} identifier - Client identifier
   * @returns {number} Number of violations
   */
  getViolationCount(identifier) {
    // This would typically be stored in a database
    // For now, use in-memory tracking
    return this.suspiciousIps.has(identifier) ? 1 : 0;
  }

  /**
   * Encrypt sensitive data
   * @param {string} data - Data to encrypt
   * @returns {object} Encrypted data with IV and tag
   */
  encrypt(data) {
    if (!this.config.encryptionKey) {
      throw new Error('Encryption key not configured');
    }

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(this.config.encryptionKey, 'base64'), iv);
    cipher.setAAD(Buffer.from('upguard-mcp-server'));

    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    };
  }

  /**
   * Decrypt sensitive data
   * @param {object} encryptedData - Encrypted data object
   * @returns {string} Decrypted data
   */
  decrypt(encryptedData) {
    if (!this.config.encryptionKey) {
      throw new Error('Encryption key not configured');
    }

    const { encrypted, tag } = encryptedData;
    const iv = Buffer.from(encryptedData.iv, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(this.config.encryptionKey, 'base64'), iv);
    
    decipher.setAAD(Buffer.from('upguard-mcp-server'));
    decipher.setAuthTag(Buffer.from(tag, 'hex'));

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Generate secure encryption key
   * @returns {string} Base64 encoded key
   */
  generateEncryptionKey() {
    return crypto.randomBytes(32).toString('base64');
  }

  /**
   * Audit logging for security events
   * @param {string} event - Event type
   * @param {object} details - Event details
   */
  auditLog(event, details = {}) {
    if (!this.config.auditLog) return;

    const auditEntry = {
      timestamp: new Date().toISOString(),
      event,
      details,
      severity: this.getEventSeverity(event),
      source: 'security-manager'
    };

    logger.info('Security audit', auditEntry);
    telemetry.incrementCounter('security_events_total', 1, { event_type: event });
  }

  /**
   * Get severity level for security events
   * @param {string} event - Event type
   * @returns {string} Severity level
   */
  getEventSeverity(event) {
    const severityMap = {
      'rate_limit_violation': 'warning',
      'ip_blocked': 'critical',
      'auth_failure': 'warning',
      'input_truncated': 'info',
      'api_key_rotation': 'info',
      'suspicious_activity': 'warning'
    };

    return severityMap[event] || 'info';
  }

  /**
   * Clean up old attempt records
   */
  cleanupOldAttempts() {
    const cutoff = Date.now() - this.config.rateLimitWindow;
    
    for (const [identifier, attempts] of this.ipAttempts.entries()) {
      const recentAttempts = attempts.filter(timestamp => timestamp > cutoff);
      
      if (recentAttempts.length === 0) {
        this.ipAttempts.delete(identifier);
      } else {
        this.ipAttempts.set(identifier, recentAttempts);
      }
    }

    // Clean up suspicious IPs after 24 hours
    // This would need proper timestamp tracking in a real implementation
  }

  /**
   * Validate request headers for security
   * @param {object} headers - Request headers
   * @returns {object} Validation result
   */
  validateHeaders(headers) {
    const issues = [];
    const warnings = [];

    // Check Content-Type
    if (headers['content-type'] && !headers['content-type'].includes('application/json')) {
      warnings.push('Unexpected content type');
    }

    // Check User-Agent
    if (!headers['user-agent']) {
      warnings.push('Missing User-Agent header');
    }

    // Check for suspicious headers
    const suspiciousHeaders = ['x-forwarded-for', 'x-real-ip', 'x-cluster-client-ip'];
    for (const header of suspiciousHeaders) {
      if (headers[header]) {
        warnings.push(`Suspicious header detected: ${header}`);
      }
    }

    return {
      valid: issues.length === 0,
      issues,
      warnings
    };
  }

  /**
   * Generate security report
   * @returns {object} Security status report
   */
  generateSecurityReport() {
    return {
      timestamp: new Date().toISOString(),
      rateLimiting: {
        activeIps: this.ipAttempts.size,
        suspiciousIps: this.suspiciousIps.size
      },
      config: {
        apiKeyRotationDays: this.config.apiKeyRotationDays,
        rateLimitWindow: this.config.rateLimitWindow,
        rateLimitMax: this.config.rateLimitMax,
        auditLogging: this.config.auditLog
      },
      metrics: telemetry.getMetricsSnapshot()
    };
  }

  /**
   * Cleanup resources
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

module.exports = {
  SecurityManager
}; 
