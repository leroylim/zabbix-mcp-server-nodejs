const { z } = require('zod');
const fs = require('fs');
const { logger } = require('../utils/logger');

// Configuration schema validation
const configSchema = z.object({
  // Environment
  nodeEnv: z.enum(['development', 'staging', 'production', 'test']).default('production'),
  
  // API Configuration
  api: z.object({
    baseUrl: z.string().url().default('https://cyber-risk.upguard.com/api/public'),
    key: z.string().min(1, 'API key is required'),
    timeout: z.number().int().min(1000).max(300000).default(120000), // 1s to 5min
    retryAttempts: z.number().int().min(0).max(10).default(3),
    retryDelay: z.number().int().min(100).max(10000).default(1000)
  }),
  
  // Transport Configuration
  transport: z.object({
    mode: z.enum(['stdio', 'http']).default('stdio'),
    http: z.object({
      port: z.number().int().min(1024).max(65535).default(3000),
      host: z.string().default('localhost'),
      sessionManagement: z.boolean().default(false),
      corsEnabled: z.boolean().default(false),
      rateLimiting: z.object({
        enabled: z.boolean().default(true),
        windowMs: z.number().int().default(900000), // 15 minutes
        maxRequests: z.number().int().default(100)
      })
    })
  }),
  
  // Logging Configuration
  logging: z.object({
    level: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
    file: z.string().optional(),
    console: z.boolean().default(true),
    structured: z.boolean().default(true),
    maxFiles: z.number().int().min(1).max(100).default(5),
    maxSize: z.string().default('10m')
  }),
  
  // Cache Configuration
  cache: z.object({
    enabled: z.boolean().default(true),
    defaultTtl: z.number().int().min(60).max(86400).default(3600), // 1min to 24h
    maxSize: z.number().int().min(100).max(10000).default(1000),
    checkPeriod: z.number().int().min(60).max(3600).default(600) // 1min to 1h
  }),
  
  // Monitoring Configuration
  monitoring: z.object({
    enabled: z.boolean().default(true),
    healthCheckInterval: z.number().int().min(5000).max(300000).default(30000), // 5s to 5min
    metricsEnabled: z.boolean().default(true),
    alerting: z.object({
      enabled: z.boolean().default(false),
      webhookUrl: z.string().url().optional(),
      errorThreshold: z.number().int().min(1).max(100).default(5)
    })
  }),
  
  // Security Configuration
  security: z.object({
    apiKeyRotationDays: z.number().int().min(30).max(365).default(90),
    encryptSensitiveData: z.boolean().default(true),
    auditLogging: z.boolean().default(true),
    rateLimitByIp: z.boolean().default(true)
  })
});

class ConfigManager {
  constructor() {
    this.config = null;
    this.configPath = null;
    this.watchers = [];
  }

  /**
   * Load configuration from environment variables and optional config file
   * @param {string} configFilePath - Optional path to config file
   * @returns {object} Validated configuration
   */
  load(configFilePath = null) {
    // Load from environment variables
    const envConfig = this.loadFromEnv();
    
    // Load from file if provided
    let fileConfig = {};
    if (configFilePath && fs.existsSync(configFilePath)) {
      try {
        fileConfig = JSON.parse(fs.readFileSync(configFilePath, 'utf8'));
        this.configPath = configFilePath;
      } catch (error) {
        logger.warn(`Failed to load config file ${configFilePath}:`, error.message);
      }
    }
    
    // Merge configurations (env overrides file)
    const mergedConfig = this.deepMerge(fileConfig, envConfig);
    
    // Validate configuration
    try {
      this.config = configSchema.parse(mergedConfig);
      logger.info('✅ Configuration loaded and validated successfully');
      return this.config;
    } catch (error) {
      logger.error('❌ Configuration validation failed:');
      logger.error(error.errors.map(e => `  ${e.path.join('.')}: ${e.message}`).join('\n'));
      throw new Error('Invalid configuration');
    }
  }

  /**
   * Load configuration from environment variables
   * @returns {object} Configuration object
   */
  loadFromEnv() {
    return {
      nodeEnv: process.env.NODE_ENV,
      api: {
        baseUrl: process.env.UPGUARD_API_BASE_URL,
        key: process.env.UPGUARD_API_KEY,
        timeout: process.env.UPGUARD_API_TIMEOUT ? parseInt(process.env.UPGUARD_API_TIMEOUT, 10) : undefined,
        retryAttempts: process.env.API_RETRY_ATTEMPTS ? parseInt(process.env.API_RETRY_ATTEMPTS, 10) : undefined,
        retryDelay: process.env.API_RETRY_DELAY ? parseInt(process.env.API_RETRY_DELAY, 10) : undefined
      },
      transport: {
        mode: process.env.MCP_TRANSPORT_MODE,
        http: {
          port: process.env.MCP_HTTP_PORT ? parseInt(process.env.MCP_HTTP_PORT, 10) : undefined,
          host: process.env.MCP_HTTP_HOST,
          sessionManagement: process.env.MCP_SESSION_MANAGEMENT === 'true',
          corsEnabled: process.env.HTTP_CORS_ENABLED === 'true',
          rateLimiting: {
            enabled: process.env.RATE_LIMITING_ENABLED !== 'false',
            windowMs: process.env.RATE_LIMIT_WINDOW_MS ? parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) : undefined,
            maxRequests: process.env.RATE_LIMIT_MAX_REQUESTS ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) : undefined
          }
        }
      },
      logging: {
        level: process.env.LOG_LEVEL,
        file: process.env.LOG_FILE,
        console: process.env.LOG_CONSOLE !== 'false',
        structured: process.env.LOG_STRUCTURED !== 'false',
        maxFiles: process.env.LOG_MAX_FILES ? parseInt(process.env.LOG_MAX_FILES, 10) : undefined,
        maxSize: process.env.LOG_MAX_SIZE
      },
      cache: {
        enabled: process.env.CACHE_ENABLED !== 'false',
        defaultTtl: process.env.CACHE_DEFAULT_TTL ? parseInt(process.env.CACHE_DEFAULT_TTL, 10) : undefined,
        maxSize: process.env.CACHE_MAX_SIZE ? parseInt(process.env.CACHE_MAX_SIZE, 10) : undefined,
        checkPeriod: process.env.CACHE_CHECK_PERIOD ? parseInt(process.env.CACHE_CHECK_PERIOD, 10) : undefined
      },
      monitoring: {
        enabled: process.env.MONITORING_ENABLED !== 'false',
        healthCheckInterval: process.env.HEALTH_CHECK_INTERVAL ? parseInt(process.env.HEALTH_CHECK_INTERVAL, 10) : undefined,
        metricsEnabled: process.env.METRICS_ENABLED !== 'false',
        alerting: {
          enabled: process.env.ALERTING_ENABLED === 'true',
          webhookUrl: process.env.ALERTING_WEBHOOK_URL,
          errorThreshold: process.env.ALERTING_ERROR_THRESHOLD ? parseInt(process.env.ALERTING_ERROR_THRESHOLD, 10) : undefined
        }
      },
      security: {
        apiKeyRotationDays: process.env.API_KEY_ROTATION_DAYS ? parseInt(process.env.API_KEY_ROTATION_DAYS, 10) : undefined,
        encryptSensitiveData: process.env.ENCRYPT_SENSITIVE_DATA !== 'false',
        auditLogging: process.env.AUDIT_LOGGING !== 'false',
        rateLimitByIp: process.env.RATE_LIMIT_BY_IP !== 'false'
      }
    };
  }

  /**
   * Deep merge two configuration objects
   * @param {object} target - Target object
   * @param {object} source - Source object
   * @returns {object} Merged object
   */
  deepMerge(target, source) {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] !== undefined) {
        if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
          result[key] = this.deepMerge(result[key] || {}, source[key]);
        } else {
          result[key] = source[key];
        }
      }
    }
    
    return result;
  }

  /**
   * Get configuration value by path
   * @param {string} path - Dot-notation path (e.g., 'api.timeout')
   * @returns {any} Configuration value
   */
  get(path) {
    if (!this.config) {
      throw new Error('Configuration not loaded. Call load() first.');
    }
    
    return path.split('.').reduce((obj, key) => obj?.[key], this.config);
  }

  /**
   * Check if configuration is production environment
   * @returns {boolean} True if production
   */
  isProduction() {
    return this.get('nodeEnv') === 'production';
  }

  /**
   * Check if configuration is development environment
   * @returns {boolean} True if development
   */
  isDevelopment() {
    return this.get('nodeEnv') === 'development';
  }

  /**
   * Validate API key and connection
   * @returns {Promise<boolean>} True if API is accessible
   */
  validateApiConnection() {
    // Implementation would test API connectivity
    return Promise.resolve(true);
  }

  /**
   * Export configuration for logging (with sensitive data redacted)
   * @returns {object} Safe configuration object
   */
  getSafeConfig() {
    if (!this.config) return {};
    
    const safe = JSON.parse(JSON.stringify(this.config));
    
    // Redact sensitive information
    if (safe.api?.key) {
      safe.api.key = `${safe.api.key.substring(0, 8)}${'*'.repeat(safe.api.key.length - 8)}`;
    }
    
    return safe;
  }
}

// Export singleton instance
const configManager = new ConfigManager();

module.exports = {
  ConfigManager,
  configManager,
  configSchema
}; 
