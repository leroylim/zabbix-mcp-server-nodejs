const https = require('https');
const axios = require('axios');
const config = require('../config');
const { logger } = require('../utils/logger');
const { withResilience } = require('../utils/retry');
const { apiCache } = require('../utils/cache');

let authToken = null;

// Custom HTTPS agent for ignoring self-signed certificates
const httpsAgent = config.api.ignoreSelfSignedCert && config.api.url.startsWith('https://')
    ? new https.Agent({ rejectUnauthorized: false })
    : undefined;

/**
 * Makes a generic request to the Zabbix API.
 * This is the core function for all API interactions.
 * @param {string} method - The Zabbix API method (e.g., 'host.get', 'item.create').
 * @param {object|Array} params - The parameters for the API method.
 * @param {string|null} token - The authentication token. If null, uses the module's cached authToken.
 * @returns {Promise<object>} - The result part of the Zabbix API response.
 * @throws {Error} If the API call fails or returns an error.
 */
async function zabbixRequest(method, params, token = null) {
    const currentToken = token || authToken; 
    const requestId = Date.now() + Math.random().toString(36).substring(2,7);

    const requestBody = {
        jsonrpc: '2.0',
        method: method,
        params: params,
        id: requestId,
    };

    if (currentToken && method !== 'apiinfo.version' && method !== 'user.login') {
        requestBody.auth = currentToken;
    }

    const loggedParams = method === 'user.login' ? { username: params.username, password: '***' } : params;
    
    // Basic logging; avoid logging potentially very large data like full history.get responses
    if (method === 'history.get' && params.itemids && Array.isArray(params.itemids) && params.itemids.length > 5) {
        logger.info(`${config.logging.prefix} Sending Request (${requestId}): ${method}, itemids: [${params.itemids.slice(0,3).join(',')}, ... (${params.itemids.length} total)], other params:`, JSON.stringify({...params, itemids: `Array[${params.itemids.length}]`}));
    } else if (method === 'history.push' && Array.isArray(params) && params.length > 5) {
        logger.info(`${config.logging.prefix} Sending Request (${requestId}): ${method}, data points: ${params.length}`);
    } else {
        logger.info(`${config.logging.prefix} Sending Request (${requestId}): ${method}`, JSON.stringify(loggedParams, null, 2));
    }

    try {
        const response = await axios.post(config.api.url, requestBody, {
            headers: { 'Content-Type': 'application/json-rpc' },
            timeout: config.api.timeout, 
            httpsAgent: httpsAgent 
        });

        if (response.data.error) {
            throw new Error(`Zabbix API Error (Method: ${method}, ID: ${requestId}): ${response.data.error.message} - ${response.data.error.data} (Code: ${response.data.error.code})`);
        }
        return response.data.result;
    } catch (error) {
        let errorMessage = `Error for Zabbix API method ${method} (ID: ${requestId}): `;
        if (error.response) { 
            errorMessage += `HTTP Error: ${error.response.status}. Response Data: ${JSON.stringify(error.response.data)}`;
        } else if (error.request) { 
            errorMessage += `No Response from server. Check network, ZABBIX_API_URL, or SSL settings (ZABBIX_IGNORE_SELFSIGNED_CERT).`;
        } else if (error.message && error.message.startsWith('Zabbix API Error:')) { 
             errorMessage = error.message;
        } else { 
            errorMessage += `Request Setup Error: ${error.message}`;
        }
        logger.error(`${config.logging.prefix} Full error for ${method}:`, error.message, error.stack); 
        throw new Error(errorMessage); 
    }
}

/**
 * Ensures the user is logged in and the authToken is valid.
 * Attempts to re-login if the token is found to be invalid.
 * @returns {Promise<string>} The authentication token.
 */
async function ensureLogin() {
    if (!authToken) {
        logger.info(`${config.logging.prefix} No auth token found, attempting initial login.`);
        await login();
    } else {
        try {
            await zabbixRequest('apiinfo.version', {}, authToken); 
        } catch (error) {
            if (error.message && (error.message.toLowerCase().includes("not authorised") || error.message.toLowerCase().includes("session id is not known") || error.message.toLowerCase().includes("no permissions"))) {
                logger.info(`${config.logging.prefix} Auth token seems invalid or insufficient permissions, attempting to re-login.`);
                await login(); 
            }
        }
    }
    return authToken;
}

// Authentication functions
async function login() {
    logger.info(`${config.logging.prefix} Attempting to log in to Zabbix...`);
    const params = { username: config.api.username, password: config.api.password };
    try {
        const result = await zabbixRequest('user.login', params); 
        authToken = result; 
        logger.info(`${config.logging.prefix} Successfully logged in. Auth token obtained.`);
        return authToken;
    } catch (error) {
        logger.error(`${config.logging.prefix} Login failed:`, error.message);
        authToken = null; 
        throw error;
    }
}

async function logout() {
    if (!authToken) {
        logger.info(`${config.logging.prefix} Not logged in, no need to logout.`);
        return true;
    }
    logger.info(`${config.logging.prefix} Attempting to log out from Zabbix...`);
    try {
        const result = await zabbixRequest('user.logout', [], authToken);
        if (result === true || (typeof result === 'object' && Object.keys(result).length === 0) || (Array.isArray(result) && result.length === 0) ) {
            logger.info(`${config.logging.prefix} Successfully logged out.`);
            authToken = null;
            return true;
        }
        logger.warn(`${config.logging.prefix} Logout might not have been fully successful, unexpected response:`, result);
        authToken = null; 
        return false; 
    } catch (error) {
        logger.error(`${config.logging.prefix} Logout failed:`, error.message);
        authToken = null; 
        throw error;
    }
}

async function getApiVersion() {
    logger.info(`${config.logging.prefix} Fetching Zabbix API version...`);
    try {
        const version = await zabbixRequest('apiinfo.version', {});
        logger.info(`${config.logging.prefix} Zabbix API Version: ${version}`);
        return version;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get API version:`, error.message);
        throw error;
    }
}

// Export the core functions and request method
module.exports = {
    zabbixRequest,
    ensureLogin,
    login,
    logout,
    getApiVersion
}; 