const { logger } = require('../utils/logger');
const api = require('../api');
const { z } = require('zod');

function registerTools(server) {
    // Get discovery rules
    server.tool(
        'zabbix_get_discovery_rules',
        'Get Low-Level Discovery (LLD) rules from Zabbix with filtering and output options',
        {
            itemids: z.array(z.string()).optional().describe('Return only discovery rules with the given item IDs'),
            hostids: z.array(z.string()).optional().describe('Return only discovery rules that belong to the given hosts'),
            templateids: z.array(z.string()).optional().describe('Return only discovery rules that belong to the given templates'),
            interfaceids: z.array(z.string()).optional().describe('Return only discovery rules that use the given host interfaces'),
            output: z.array(z.string()).optional().default(['itemid', 'name', 'key_', 'type', 'delay', 'status']).describe('Object properties to be returned'),
            selectHosts: z.array(z.string()).optional().describe('Return hosts that the discovery rule belongs to'),
            selectItems: z.array(z.string()).optional().describe('Return item prototypes that belong to the discovery rule'),
            selectTriggers: z.array(z.string()).optional().describe('Return trigger prototypes that belong to the discovery rule'),
            selectGraphs: z.array(z.string()).optional().describe('Return graph prototypes that belong to the discovery rule'),
            selectHostPrototypes: z.array(z.string()).optional().describe('Return host prototypes that belong to the discovery rule'),
            filter: z.record(z.any()).optional().describe('Return only discovery rules that match the given filter'),
            search: z.record(z.any()).optional().describe('Return only discovery rules that match the given wildcard search'),
            sortfield: z.array(z.string()).optional().default(['name']).describe('Sort the result by the given properties'),
            sortorder: z.enum(['ASC', 'DESC']).optional().default('ASC').describe('Sort order'),
            limit: z.number().int().positive().optional().describe('Limit the number of records returned')
        },
        async (args) => {
            try {
                const params = { ...args };
                
                const apiParams = {
                    output: params.output || ['itemid', 'name', 'key_', 'type', 'delay', 'status'],
                    sortfield: params.sortfield || ['name'],
                    sortorder: params.sortorder || 'ASC'
                };

                if (params.itemids) apiParams.itemids = params.itemids;
                if (params.hostids) apiParams.hostids = params.hostids;
                if (params.templateids) apiParams.templateids = params.templateids;
                if (params.interfaceids) apiParams.interfaceids = params.interfaceids;
                if (params.selectHosts) apiParams.selectHosts = params.selectHosts;
                if (params.selectItems) apiParams.selectItems = params.selectItems;
                if (params.selectTriggers) apiParams.selectTriggers = params.selectTriggers;
                if (params.selectGraphs) apiParams.selectGraphs = params.selectGraphs;
                if (params.selectHostPrototypes) apiParams.selectHostPrototypes = params.selectHostPrototypes;
                if (params.filter) apiParams.filter = params.filter;
                if (params.search) apiParams.search = params.search;
                if (params.limit) apiParams.limit = params.limit;

                const rules = await api.discoveryApi.get(apiParams);
                
                logger.info(`Retrieved ${rules.length} discovery rules`);
                return {
                    content: [{
                        type: 'text',
                        text: `Found ${rules.length} discovery rules:\n\n${JSON.stringify(rules, null, 2)}`
                    }]
                };
            } catch (error) {
                logger.error('Error getting discovery rules:', error.message);
                throw error;
            }
        }
    );

    // Create discovery rule
    server.tool(
        'zabbix_create_discovery_rule',
        'Create a new Low-Level Discovery (LLD) rule in Zabbix',
        {
            name: z.string().min(1).describe('Name of the discovery rule'),
            key_: z.string().min(1).describe('Discovery rule key'),
            hostid: z.string().describe('ID of the host that the discovery rule belongs to'),
            type: z.number().int().min(0).max(19).describe('Type of the discovery rule (0 - Zabbix agent, 2 - Zabbix trapper, 3 - simple check, etc.)'),
            delay: z.string().optional().default('30s').describe('Update interval of the discovery rule'),
            status: z.number().int().min(0).max(1).optional().default(0).describe('Status of the discovery rule (0 - enabled, 1 - disabled)'),
            interfaceid: z.string().optional().describe('ID of the host interface to use'),
            description: z.string().optional().describe('Description of the discovery rule'),
            lifetime: z.string().optional().default('30d').describe('Time period after which items that are no longer discovered will be deleted'),
            filter: z.object({
                evaltype: z.number().int().min(0).max(2).optional().default(0),
                conditions: z.array(z.object({
                    macro: z.string(),
                    value: z.string(),
                    operator: z.number().int().min(8).max(12).optional().default(8),
                    formulaid: z.string().optional()
                })).optional()
            }).optional().describe('Discovery rule filter'),
            lld_macro_paths: z.array(z.object({
                lld_macro: z.string(),
                path: z.string()
            })).optional().describe('LLD macro paths for JSON/XML discovery'),
            preprocessing: z.array(z.object({
                type: z.number().int(),
                params: z.string().optional(),
                error_handler: z.number().int().optional(),
                error_handler_params: z.string().optional()
            })).optional().describe('Discovery rule preprocessing steps')
        },
        async (args) => {
            try {
                const params = { ...args };
                
                const result = await api.discoveryApi.create(params);
                
                logger.info(`Created discovery rule: ${params.name} (ID: ${result.itemids[0]})`);
                return {
                    content: [{
                        type: 'text',
                        text: `Successfully created discovery rule "${params.name}" with ID: ${result.itemids[0]}`
                    }]
                };
            } catch (error) {
                logger.error('Error creating discovery rule:', error.message);
                throw error;
            }
        }
    );

    // Update discovery rule
    server.tool(
        'zabbix_update_discovery_rule',
        'Update an existing Low-Level Discovery (LLD) rule in Zabbix',
        {
            itemid: z.string().describe('ID of the discovery rule to update'),
            name: z.string().optional().describe('Name of the discovery rule'),
            key_: z.string().optional().describe('Discovery rule key'),
            type: z.number().int().min(0).max(19).optional().describe('Type of the discovery rule'),
            delay: z.string().optional().describe('Update interval of the discovery rule'),
            status: z.number().int().min(0).max(1).optional().describe('Status of the discovery rule (0 - enabled, 1 - disabled)'),
            interfaceid: z.string().optional().describe('ID of the host interface to use'),
            description: z.string().optional().describe('Description of the discovery rule'),
            lifetime: z.string().optional().describe('Time period after which items that are no longer discovered will be deleted')
        },
        async (args) => {
            try {
                const params = { ...args };
                
                const result = await api.discoveryApi.update(params);
                
                logger.info(`Updated discovery rule ID ${params.itemid}`);
                return {
                    content: [{
                        type: 'text',
                        text: `Successfully updated discovery rule ID ${params.itemid}`
                    }]
                };
            } catch (error) {
                logger.error('Error updating discovery rule:', error.message);
                throw error;
            }
        }
    );

    // Delete discovery rules
    server.tool(
        'zabbix_delete_discovery_rules',
        'Delete Low-Level Discovery (LLD) rules from Zabbix',
        {
            itemids: z.array(z.string()).min(1).describe('Array of discovery rule IDs to delete')
        },
        async (args) => {
            try {
                const { itemids } = args;
                
                const result = await api.discoveryApi.delete(itemids);
                
                logger.info(`Deleted ${itemids.length} discovery rules`);
                return {
                    content: [{
                        type: 'text',
                        text: `Successfully deleted ${itemids.length} discovery rules: ${itemids.join(', ')}`
                    }]
                };
            } catch (error) {
                logger.error('Error deleting discovery rules:', error.message);
                throw error;
            }
        }
    );

    // Get discovered hosts
    server.tool(
        'zabbix_get_discovered_hosts',
        'Get hosts discovered by network discovery or LLD rules',
        {
            dhostids: z.array(z.string()).optional().describe('Return only discovered hosts with the given IDs'),
            druleids: z.array(z.string()).optional().describe('Return only discovered hosts that were discovered by the given discovery rules'),
            output: z.array(z.string()).optional().default(['dhostid', 'druleid', 'ip', 'dns', 'status', 'lastup', 'lastdown']).describe('Object properties to be returned'),
            selectDRules: z.array(z.string()).optional().describe('Return discovery rules that discovered the host'),
            selectDServices: z.array(z.string()).optional().describe('Return discovered services of the host'),
            filter: z.record(z.any()).optional().describe('Return only discovered hosts that match the given filter'),
            search: z.record(z.any()).optional().describe('Return only discovered hosts that match the given wildcard search'),
            sortfield: z.array(z.string()).optional().default(['ip']).describe('Sort the result by the given properties'),
            sortorder: z.enum(['ASC', 'DESC']).optional().default('ASC').describe('Sort order'),
            limit: z.number().int().positive().optional().describe('Limit the number of records returned')
        },
        async (args) => {
            try {
                const params = { ...args };
                
                const apiParams = {
                    output: params.output || ['dhostid', 'druleid', 'ip', 'dns', 'status', 'lastup', 'lastdown'],
                    sortfield: params.sortfield || ['ip'],
                    sortorder: params.sortorder || 'ASC'
                };

                if (params.dhostids) apiParams.dhostids = params.dhostids;
                if (params.druleids) apiParams.druleids = params.druleids;
                if (params.selectDRules) apiParams.selectDRules = params.selectDRules;
                if (params.selectDServices) apiParams.selectDServices = params.selectDServices;
                if (params.filter) apiParams.filter = params.filter;
                if (params.search) apiParams.search = params.search;
                if (params.limit) apiParams.limit = params.limit;

                const hosts = await api.discoveryApi.getDiscoveredHosts(apiParams);
                
                // Format timestamps for readability
                const formattedHosts = hosts.map(host => ({
                    ...host,
                    lastup_readable: host.lastup ? new Date(host.lastup * 1000).toISOString() : 'Never',
                    lastdown_readable: host.lastdown ? new Date(host.lastdown * 1000).toISOString() : 'Never'
                }));
                
                logger.info(`Retrieved ${hosts.length} discovered hosts`);
                return {
                    content: [{
                        type: 'text',
                        text: `Found ${hosts.length} discovered hosts:\n\n${JSON.stringify(formattedHosts, null, 2)}`
                    }]
                };
            } catch (error) {
                logger.error('Error getting discovered hosts:', error.message);
                throw error;
            }
        }
    );

    // Get discovered services
    server.tool(
        'zabbix_get_discovered_services',
        'Get services discovered by network discovery rules',
        {
            dserviceids: z.array(z.string()).optional().describe('Return only discovered services with the given IDs'),
            dhostids: z.array(z.string()).optional().describe('Return only discovered services that belong to the given discovered hosts'),
            druleids: z.array(z.string()).optional().describe('Return only discovered services that were discovered by the given discovery rules'),
            output: z.array(z.string()).optional().default(['dserviceid', 'dhostid', 'type', 'key_', 'port', 'status', 'value']).describe('Object properties to be returned'),
            selectDRules: z.array(z.string()).optional().describe('Return discovery rules that discovered the service'),
            selectDHosts: z.array(z.string()).optional().describe('Return discovered hosts that the service belongs to'),
            filter: z.record(z.any()).optional().describe('Return only discovered services that match the given filter'),
            search: z.record(z.any()).optional().describe('Return only discovered services that match the given wildcard search'),
            sortfield: z.array(z.string()).optional().default(['port']).describe('Sort the result by the given properties'),
            sortorder: z.enum(['ASC', 'DESC']).optional().default('ASC').describe('Sort order'),
            limit: z.number().int().positive().optional().describe('Limit the number of records returned')
        },
        async (args) => {
            try {
                const params = { ...args };
                
                const apiParams = {
                    output: params.output || ['dserviceid', 'dhostid', 'type', 'key_', 'port', 'status', 'value'],
                    sortfield: params.sortfield || ['port'],
                    sortorder: params.sortorder || 'ASC'
                };

                if (params.dserviceids) apiParams.dserviceids = params.dserviceids;
                if (params.dhostids) apiParams.dhostids = params.dhostids;
                if (params.druleids) apiParams.druleids = params.druleids;
                if (params.selectDRules) apiParams.selectDRules = params.selectDRules;
                if (params.selectDHosts) apiParams.selectDHosts = params.selectDHosts;
                if (params.filter) apiParams.filter = params.filter;
                if (params.search) apiParams.search = params.search;
                if (params.limit) apiParams.limit = params.limit;

                const services = await api.discoveryApi.getDiscoveredServices(apiParams);
                
                logger.info(`Retrieved ${services.length} discovered services`);
                return {
                    content: [{
                        type: 'text',
                        text: `Found ${services.length} discovered services:\n\n${JSON.stringify(services, null, 2)}`
                    }]
                };
            } catch (error) {
                logger.error('Error getting discovered services:', error.message);
                throw error;
            }
        }
    );

    logger.info('Discovery tools registered successfully');
}

module.exports = { registerTools }; 