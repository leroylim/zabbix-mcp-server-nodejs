const api = require('../api');
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
                const version = await api.getApiVersion();
                return { content: [{ type: 'text', text: `Zabbix API Version: ${version}` }] };
            } catch (error) {
                logger.error('Error getting API version:', error);
                throw error;
            }
        }
    );

    // Tool: Login
    server.tool(
        'zabbix_login',
        'Establishes an authenticated session with the Zabbix API. The API client module handles token caching and re-login on demand.',
        {},
        async () => {
            try {
                await api.login(); 
                return { content: [{ type: 'text', text: `Successfully logged into Zabbix (or session refreshed).` }] };
            } catch (error) {
                logger.error('Error logging in:', error);
                throw error;
            }
        }
    );

    // Tool: Logout
    server.tool(
        'zabbix_logout',
        'Terminates the current Zabbix API session within the API client module.',
        {},
        async () => {
            try {
                await api.logout();
                return { content: [{ type: 'text', text: 'Successfully logged out from Zabbix API.' }] };
            } catch (error) {
                logger.error('Error logging out:', error);
                throw error;
            }
        }
    );
}

module.exports = { registerTools }; 