/**
 * Zabbix API Client using zabbix-utils library
 * 
 * This replaces the custom axios-based client with the professional zabbix-utils library
 * providing better type safety, automatic authentication, and robust error handling.
 */

const { AsyncZabbixAPI } = require('zabbix-utils');
const config = require('../config');
const { logger } = require('../utils/logger');

class ZabbixClient {
    constructor() {
        this.api = null;
        this.isConnected = false;
        this.lastConnectionAttempt = null;
        this.connectionRetryDelay = 5000; // 5 seconds
    }

    /**
     * Initialize the Zabbix API client
     */
    async initialize() {
        if (this.api && this.isConnected) {
            return this.api;
        }

        try {
            logger.info(`${config.logging.prefix} Initializing Zabbix API client...`);
            
            this.api = new AsyncZabbixAPI({
                url: config.api.url,
                user: config.api.username,
                password: config.api.password,
                validateCerts: !config.api.ignoreSelfSignedCert,
                timeout: Math.floor(config.api.timeout / 1000), // Convert to seconds
                skipVersionCheck: false
            });

            // Login and verify connection
            await this.api.login();
            
            // Get API version to verify connection
            const version = await this.api.apiVersion();
            logger.info(`${config.logging.prefix} Connected to Zabbix API version: ${version}`);
            
            this.isConnected = true;
            this.lastConnectionAttempt = Date.now();
            
            return this.api;
        } catch (error) {
            this.isConnected = false;
            this.lastConnectionAttempt = Date.now();
            logger.error(`${config.logging.prefix} Failed to initialize Zabbix API client:`, error.message);
            throw new Error(`Zabbix API initialization failed: ${error.message}`);
        }
    }

    /**
     * Get the API client instance, initializing if necessary
     */
    async getClient() {
        if (!this.api || !this.isConnected) {
            await this.initialize();
        }

        // Check if we need to retry connection after a failure
        if (!this.isConnected && this.lastConnectionAttempt) {
            const timeSinceLastAttempt = Date.now() - this.lastConnectionAttempt;
            if (timeSinceLastAttempt > this.connectionRetryDelay) {
                await this.initialize();
            } else {
                throw new Error('Zabbix API client not connected. Retry in progress.');
            }
        }

        return this.api;
    }

    /**
     * Check if the client is authenticated and connected
     */
    async checkConnection() {
        try {
            if (!this.api) {
                return false;
            }
            
            const isAuth = await this.api.checkAuth();
            this.isConnected = isAuth;
            return isAuth;
        } catch (error) {
            logger.warn(`${config.logging.prefix} Connection check failed:`, error.message);
            this.isConnected = false;
            return false;
        }
    }

    /**
     * Logout and cleanup
     */
    async disconnect() {
        if (this.api && this.isConnected) {
            try {
                await this.api.logout();
                logger.info(`${config.logging.prefix} Disconnected from Zabbix API`);
            } catch (error) {
                logger.warn(`${config.logging.prefix} Error during logout:`, error.message);
            }
        }
        
        this.api = null;
        this.isConnected = false;
    }

    /**
     * Get API version information
     */
    async getVersion() {
        const client = await this.getClient();
        return await client.apiVersion();
    }

    /**
     * Generic method to make API calls with automatic error handling
     */
    async request(method, params = {}) {
        const client = await this.getClient();
        
        try {
            // Parse method to object.method format for dynamic calling
            const [object, methodName] = method.split('.');
            
            if (!object || !methodName) {
                throw new Error(`Invalid API method format: ${method}. Expected format: 'object.method'`);
            }

            // Use dynamic method calling
            const result = await client[object][methodName](params);
            
            logger.debug(`${config.logging.prefix} API call successful: ${method}`);
            return result;
        } catch (error) {
            logger.error(`${config.logging.prefix} API call failed: ${method}`, error.message);
            
            // Check if it's an authentication error and try to reconnect
            if (error.message && (
                error.message.includes('not authorised') ||
                error.message.includes('Session terminated') ||
                error.message.includes('Not authorized')
            )) {
                logger.info(`${config.logging.prefix} Authentication error detected, attempting to reconnect...`);
                this.isConnected = false;
                await this.initialize();
                
                // Retry the request once
                const retryClient = await this.getClient();
                const result = await retryClient[object][methodName](params);
                return result;
            }
            
            throw error;
        }
    }
}

// Create singleton instance
const zabbixClient = new ZabbixClient();

// Export both the class and singleton instance
module.exports = {
    ZabbixClient,
    zabbixClient,
    
    // Convenience methods for backward compatibility
    async getClient() {
        return await zabbixClient.getClient();
    },
    
    async request(method, params) {
        return await zabbixClient.request(method, params);
    },
    
    async checkConnection() {
        return await zabbixClient.checkConnection();
    },
    
    async disconnect() {
        return await zabbixClient.disconnect();
    },
    
    async getVersion() {
        return await zabbixClient.getVersion();
    }
}; 