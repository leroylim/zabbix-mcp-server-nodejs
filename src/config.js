/**
 * Zabbix MCP Server - Configuration Module
 * 
 * Copyright (c) 2024 Han Yong Lim
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

const dotenv = require('dotenv');
const { logger } = require('./utils/logger');

// Load environment variables
dotenv.config();

// Determine authentication method
function determineAuthMethod() {
    const hasApiToken = !!process.env.ZABBIX_API_TOKEN;
    const hasPassword = !!process.env.ZABBIX_PASSWORD;
    
    if (hasApiToken && hasPassword) {
        logger.warn('Both ZABBIX_API_TOKEN and ZABBIX_PASSWORD are set. Using API token (more secure).');
        return 'token';
    } else if (hasApiToken) {
        return 'token';
    } else if (hasPassword) {
        return 'password';
    } else {
        return 'none';
    }
}

const authMethod = determineAuthMethod();

const config = {
    api: {
        url: process.env.ZABBIX_API_URL || 'https://monitoring.sipef.com/api_jsonrpc.php',
        
        // Authentication configuration
        authMethod: authMethod,
        
        // API Token authentication (Zabbix 5.4+, recommended)
        apiToken: process.env.ZABBIX_API_TOKEN,
        
        // Username/Password authentication (traditional)
        username: process.env.ZABBIX_USERNAME || 'Admin',
        password: process.env.ZABBIX_PASSWORD,
        
        // Connection settings
        timeout: parseInt(process.env.ZABBIX_REQUEST_TIMEOUT, 10) || 120000,
        ignoreSelfSignedCert: process.env.ZABBIX_IGNORE_SELFSIGNED_CERT === 'true' || true
    },
    transport: {
        mode: process.env.MCP_TRANSPORT_MODE || 'stdio', // 'stdio' or 'http'
        http: {
            port: parseInt(process.env.MCP_HTTP_PORT, 10) || 3000,
            host: process.env.MCP_HTTP_HOST || 'localhost',
            sessionManagement: process.env.MCP_SESSION_MANAGEMENT === 'true' || false
        }
    },
    cache: {
        enabled: process.env.CACHE_ENABLED === 'true' || true,
        ttl: parseInt(process.env.CACHE_TTL, 10) || 300,
        maxSize: parseInt(process.env.CACHE_MAX_SIZE, 10) || 1000
    },
    logging: {
        prefix: '[Zabbix API Client]'
    },
    environment: process.env.NODE_ENV || 'development'
};

// Validate authentication configuration
if (config.api.authMethod === 'none') {
    const warningMsg = 'CRITICAL: No authentication credentials provided. Set either ZABBIX_API_TOKEN or ZABBIX_PASSWORD environment variable.';
    if (process.env.NODE_ENV !== 'test') {
        logger.error(`${config.logging.prefix} ${warningMsg}`);
    }
} else if (config.api.authMethod === 'token') {
    logger.info(`${config.logging.prefix} Using API token authentication (Zabbix 5.4+)`);
} else if (config.api.authMethod === 'password') {
    logger.info(`${config.logging.prefix} Using username/password authentication`);
}

// Validate transport mode
if (!['stdio', 'http'].includes(config.transport.mode)) {
    const error = new Error(`Invalid transport mode: ${config.transport.mode}. Must be 'stdio' or 'http'.`);
    if (process.env.NODE_ENV !== 'test') {
        logger.error(`${config.logging.prefix} ${error.message}`);
    }
    throw error;
}

// Validate required configuration
if (!config.api.url) {
    const error = new Error('ZABBIX_API_URL environment variable is required');
    if (process.env.NODE_ENV !== 'test') {
        logger.error('Configuration Error:', error.message);
    }
    throw error;
}

// Additional validation warnings
if (config.api.authMethod === 'none') {
    logger.warn('No authentication credentials found in environment variables');
}

if (config.transport.mode === 'http' && !config.transport.http.port) {
    logger.warn('HTTP_PORT not specified, using default port 3000');
}

if (config.cache.enabled && !config.cache.ttl) {
    logger.warn('CACHE_TTL not specified, using default 300 seconds');
    config.cache.ttl = 300;
}

module.exports = config; 
