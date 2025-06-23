const { logger } = require('../utils/logger');
const api = require('../api');
const { z } = require('zod');

function registerTools(server) {
    // Get proxies
    server.tool(
        'zabbix_get_proxies',
        'Get proxies from Zabbix with filtering and output options',
        {
            proxyids: z.array(z.string()).optional().describe('Return only proxies with the given IDs'),
            output: z.array(z.string()).optional().default(['proxyid', 'name', 'operating_mode', 'address', 'port', 'description']).describe('Object properties to be returned'),
            selectHosts: z.array(z.string()).optional().describe('Return hosts monitored by the proxy'),
            selectProxyGroups: z.array(z.string()).optional().describe('Return proxy groups the proxy belongs to'),
            filter: z.record(z.any()).optional().describe('Return only proxies that match the given filter'),
            search: z.record(z.any()).optional().describe('Return only proxies that match the given wildcard search'),
            sortfield: z.array(z.string()).optional().default(['name']).describe('Sort the result by the given properties'),
            sortorder: z.enum(['ASC', 'DESC']).optional().default('ASC').describe('Sort order'),
            limit: z.number().int().positive().optional().describe('Limit the number of records returned')
        },
        async (args) => {
            try {
                const params = { ...args };
                
                const apiParams = {
                    output: params.output || ['proxyid', 'name', 'operating_mode', 'address', 'port', 'description'],
                    sortfield: params.sortfield || ['name'],
                    sortorder: params.sortorder || 'ASC'
                };

                if (params.proxyids) apiParams.proxyids = params.proxyids;
                if (params.selectHosts) apiParams.selectHosts = params.selectHosts;
                if (params.selectProxyGroups) apiParams.selectProxyGroups = params.selectProxyGroups;
                if (params.filter) apiParams.filter = params.filter;
                if (params.search) apiParams.search = params.search;
                if (params.limit) apiParams.limit = params.limit;

                const proxies = await api.proxiesApi.get(apiParams);
                
                logger.info(`Retrieved ${proxies.length} proxies`);
                return {
                    content: [{
                        type: 'text',
                        text: `Found ${proxies.length} proxies:\n\n${JSON.stringify(proxies, null, 2)}`
                    }]
                };
            } catch (error) {
                logger.error('Error getting proxies:', error.message);
                throw error;
            }
        }
    );

    // Create proxy
    server.tool(
        'zabbix_create_proxy',
        'Create a new proxy in Zabbix for distributed monitoring',
        {
            name: z.string().min(1).describe('Name of the proxy'),
            operating_mode: z.number().int().min(0).max(1).describe('Proxy operating mode: 0 (active), 1 (passive)'),
            address: z.string().optional().describe('IP address or DNS name of the passive proxy. Required if operating_mode is 1'),
            port: z.string().optional().describe('Port number of the passive proxy. Defaults to 10051 if not set and operating_mode is 1'),
            description: z.string().optional().describe('Description of the proxy'),
            tls_connect: z.number().int().min(1).max(4).optional().default(1).describe('How to connect to proxy: 1 (no encryption), 2 (PSK), 4 (certificate)'),
            tls_accept: z.number().int().min(1).max(7).optional().default(1).describe('What connections to accept from proxy: 1 (no encryption), 2 (PSK), 4 (certificate)'),
            tls_issuer: z.string().optional().describe('Certificate issuer'),
            tls_subject: z.string().optional().describe('Certificate subject'),
            tls_psk_identity: z.string().optional().describe('PSK identity'),
            tls_psk: z.string().optional().describe('PSK value'),
            custom_timeouts: z.number().int().min(0).max(1).optional().default(0).describe('Whether to use custom timeouts: 0 (disabled), 1 (enabled)'),
            timeout_zabbix_agent: z.string().optional().describe('Zabbix agent timeout'),
            timeout_simple_check: z.string().optional().describe('Simple check timeout'),
            timeout_snmp_agent: z.string().optional().describe('SNMP agent timeout'),
            timeout_external_check: z.string().optional().describe('External check timeout'),
            timeout_db_monitor: z.string().optional().describe('Database monitor timeout'),
            timeout_http_agent: z.string().optional().describe('HTTP agent timeout'),
            timeout_ssh_agent: z.string().optional().describe('SSH agent timeout'),
            timeout_telnet_agent: z.string().optional().describe('Telnet agent timeout'),
            timeout_script: z.string().optional().describe('Script timeout'),
            
            // Hosts to be monitored by this proxy
            hosts: z.array(z.union([
                z.object({ hostid: z.string().describe('Host ID') }),
                z.string().describe('Host ID')
            ])).optional().describe('Hosts to be monitored by this proxy')
        },
        async (args) => {
            try {
                const params = { ...args };
                
                const result = await api.proxiesApi.create(params);
                
                logger.info(`Created proxy: ${params.name} (ID: ${result.proxyids[0]})`);
                return {
                    content: [{
                        type: 'text',
                        text: `Successfully created proxy "${params.name}" with ID: ${result.proxyids[0]}`
                    }]
                };
            } catch (error) {
                logger.error('Error creating proxy:', error.message);
                throw error;
            }
        }
    );

    // Update proxy
    server.tool(
        'zabbix_update_proxy',
        'Update an existing proxy in Zabbix',
        {
            proxyid: z.string().describe('ID of the proxy to update'),
            name: z.string().optional().describe('New name for the proxy'),
            operating_mode: z.number().int().min(0).max(1).optional().describe('Proxy operating mode: 0 (active), 1 (passive)'),
            address: z.string().optional().describe('IP address or DNS name of the passive proxy'),
            port: z.string().optional().describe('Port number of the passive proxy'),
            description: z.string().optional().describe('Description of the proxy'),
            tls_connect: z.number().int().min(1).max(4).optional().describe('How to connect to proxy'),
            tls_accept: z.number().int().min(1).max(7).optional().describe('What connections to accept from proxy'),
            tls_issuer: z.string().optional().describe('Certificate issuer'),
            tls_subject: z.string().optional().describe('Certificate subject'),
            tls_psk_identity: z.string().optional().describe('PSK identity'),
            tls_psk: z.string().optional().describe('PSK value'),
            custom_timeouts: z.number().int().min(0).max(1).optional().describe('Whether to use custom timeouts'),
            timeout_zabbix_agent: z.string().optional().describe('Zabbix agent timeout'),
            timeout_simple_check: z.string().optional().describe('Simple check timeout'),
            timeout_snmp_agent: z.string().optional().describe('SNMP agent timeout'),
            timeout_external_check: z.string().optional().describe('External check timeout'),
            timeout_db_monitor: z.string().optional().describe('Database monitor timeout'),
            timeout_http_agent: z.string().optional().describe('HTTP agent timeout'),
            timeout_ssh_agent: z.string().optional().describe('SSH agent timeout'),
            timeout_telnet_agent: z.string().optional().describe('Telnet agent timeout'),
            timeout_script: z.string().optional().describe('Script timeout'),
            
            // Hosts to be monitored by this proxy (replaces all existing hosts)
            hosts: z.array(z.union([
                z.object({ hostid: z.string().describe('Host ID') }),
                z.string().describe('Host ID')
            ])).optional().describe('Hosts to be monitored by this proxy (replaces all existing hosts)')
        },
        async (args) => {
            try {
                const params = { ...args };
                
                const result = await api.proxiesApi.update(params);
                
                logger.info(`Updated proxy ID ${params.proxyid}`);
                return {
                    content: [{
                        type: 'text',
                        text: `Successfully updated proxy ID ${params.proxyid}`
                    }]
                };
            } catch (error) {
                logger.error('Error updating proxy:', error.message);
                throw error;
            }
        }
    );

    // Delete proxies
    server.tool(
        'zabbix_delete_proxies',
        'Delete proxies from Zabbix',
        {
            proxyids: z.array(z.string()).min(1).describe('Array of proxy IDs to delete')
        },
        async (args) => {
            try {
                const { proxyids } = args;
                
                const result = await api.proxiesApi.delete(proxyids);
                
                logger.info(`Deleted ${proxyids.length} proxies`);
                return {
                    content: [{
                        type: 'text',
                        text: `Successfully deleted ${proxyids.length} proxies: ${proxyids.join(', ')}`
                    }]
                };
            } catch (error) {
                logger.error('Error deleting proxies:', error.message);
                throw error;
            }
        }
    );

    logger.info('Proxies tools registered successfully');
}

module.exports = { registerTools }; 