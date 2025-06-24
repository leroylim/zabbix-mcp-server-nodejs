const api = require('../api');
const config = require('../config');
const { logger } = require('../utils/logger');
const { z } = require('zod');

function registerTools(server) {
    // Tool: Get API Version
    server.tool(
        'zabbix_get_api_version',
        'Retrieves the version of the Zabbix API.',
        {},
        async () => {
            try {
                // First check configuration
                const configStatus = checkConfiguration();
                if (!configStatus.valid) {
                    return { 
                        content: [{ 
                            type: 'text', 
                            text: `Configuration Error: ${configStatus.error}\n\nRequired environment variables:\n${configStatus.requirements}` 
                        }] 
                    };
                }

                const version = await api.getVersion();
                return { content: [{ type: 'text', text: `Zabbix API Version: ${version}` }] };
            } catch (error) {
                logger.error('Error getting API version:', error);
                
                // Provide helpful diagnostic information
                const configStatus = checkConfiguration();
                const errorMsg = `Error: ${error.message}\n\nConfiguration Status:\n${configStatus.diagnosis}`;
                
                return { content: [{ type: 'text', text: errorMsg }] };
            }
        }
    );

    // Tool: Login (modernized to use getClient)
    server.tool(
        'zabbix_login',
        'Establishes an authenticated session with the Zabbix API. The API client module handles token caching and re-login on demand.',
        {},
        async () => {
            try {
                // First check configuration
                const configStatus = checkConfiguration();
                if (!configStatus.valid) {
                    return { 
                        content: [{ 
                            type: 'text', 
                            text: `Configuration Error: ${configStatus.error}\n\nRequired environment variables:\n${configStatus.requirements}` 
                        }] 
                    };
                }

                // Use getClient() instead of login() - this handles authentication automatically
                await api.getClient();
                const isConnected = await api.checkConnection();
                if (isConnected) {
                    return { content: [{ type: 'text', text: `Successfully connected to Zabbix API (session established).` }] };
                } else {
                    throw new Error('Failed to establish connection to Zabbix API');
                }
            } catch (error) {
                logger.error('Error connecting to Zabbix:', error);
                
                // Provide helpful diagnostic information
                const configStatus = checkConfiguration();
                const errorMsg = `Error: ${error.message}\n\nConfiguration Status:\n${configStatus.diagnosis}`;
                
                return { content: [{ type: 'text', text: errorMsg }] };
            }
        }
    );

    // Tool: Logout (modernized to use disconnect)
    server.tool(
        'zabbix_logout',
        'Terminates the current Zabbix API session within the API client module.',
        {},
        async () => {
            try {
                await api.disconnect();
                return { content: [{ type: 'text', text: 'Successfully disconnected from Zabbix API.' }] };
            } catch (error) {
                logger.error('Error disconnecting from Zabbix:', error);
                throw error;
            }
        }
    );
}

/**
 * Check the current configuration and provide diagnostic information
 */
function checkConfiguration() {
    const hasApiUrl = !!process.env.ZABBIX_API_URL;
    const hasApiToken = !!process.env.ZABBIX_API_TOKEN;
    const hasUsername = !!process.env.ZABBIX_USERNAME;
    const hasPassword = !!process.env.ZABBIX_PASSWORD;
    
    const diagnosis = [
        `Environment Variables Status:`,
        `- ZABBIX_API_URL: ${hasApiUrl ? '✓ Set' : '✗ Missing'} ${hasApiUrl ? `(${process.env.ZABBIX_API_URL})` : ''}`,
        `- ZABBIX_API_TOKEN: ${hasApiToken ? '✓ Set' : '✗ Missing'} ${hasApiToken ? '(***hidden***)' : ''}`,
        `- ZABBIX_USERNAME: ${hasUsername ? '✓ Set' : '✗ Missing'} ${hasUsername ? `(${process.env.ZABBIX_USERNAME})` : ''}`,
        `- ZABBIX_PASSWORD: ${hasPassword ? '✓ Set' : '✗ Missing'} ${hasPassword ? '(***hidden***)' : ''}`,
        ``,
        `Configuration Status:`,
        `- API URL: ${config.api.url}`,
        `- Auth Method: ${config.api.authMethod}`,
        `- Timeout: ${config.api.timeout}ms`,
        `- Ignore Self-Signed Cert: ${config.api.ignoreSelfSignedCert}`
    ].join('\n');

    const requirements = [
        `Required Environment Variables:`,
        ``,
        `Option 1 - API Token Authentication (Recommended for Zabbix 5.4+):`,
        `  ZABBIX_API_URL=https://your-zabbix-server/api_jsonrpc.php`,
        `  ZABBIX_API_TOKEN=your-api-token`,
        ``,
        `Option 2 - Username/Password Authentication:`,
        `  ZABBIX_API_URL=https://your-zabbix-server/api_jsonrpc.php`,
        `  ZABBIX_USERNAME=your-username`,
        `  ZABBIX_PASSWORD=your-password`,
        ``,
        `Optional:`,
        `  ZABBIX_IGNORE_SELFSIGNED_CERT=true  # For self-signed certificates`,
        `  ZABBIX_REQUEST_TIMEOUT=120000       # Request timeout in milliseconds`
    ].join('\n');

    if (!hasApiUrl) {
        return {
            valid: false,
            error: 'ZABBIX_API_URL environment variable is required',
            diagnosis,
            requirements
        };
    }

    if (!hasApiToken && (!hasUsername || !hasPassword)) {
        return {
            valid: false,
            error: 'Authentication credentials required. Set either ZABBIX_API_TOKEN or both ZABBIX_USERNAME and ZABBIX_PASSWORD',
            diagnosis,
            requirements
        };
    }

    return {
        valid: true,
        diagnosis,
        requirements
    };
}

/**
 * Tool for authentication and API version checking
 */
async function checkApiVersion() {
    try {
        logger.info('Checking Zabbix API version...');
        
        // First check configuration
        const configStatus = checkConfiguration();
        if (!configStatus.valid) {
            return {
                success: false,
                error: configStatus.error,
                message: 'Configuration validation failed',
                diagnosis: configStatus.diagnosis
            };
        }
        
        const version = await api.getVersion();
        
        return {
            success: true,
            version: version,
            message: `Connected to Zabbix API version: ${version}`
        };
    } catch (error) {
        logger.error('Failed to check API version:', error.message);
        
        const configStatus = checkConfiguration();
        return {
            success: false,
            error: error.message,
            message: 'Failed to connect to Zabbix API',
            diagnosis: configStatus.diagnosis
        };
    }
}

module.exports = { registerTools, checkApiVersion }; 