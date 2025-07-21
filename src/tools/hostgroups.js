const api = require('../api');
const { z } = require('zod');
const { handleZabbixError } = require('../utils/errors');

// Enhanced hostgroup schema with all official properties
const hostgroupSchema = z.object({
    groupid: z.string().optional().describe('ID of the host group (read-only for updates)'),
    name: z.string().min(1).describe('Name of the host group'),
    flags: z.number().int().min(0).max(4).optional().describe('Origin of the host group (0=plain, 4=discovered)'),
    uuid: z.string().optional().describe('Universal unique identifier for linking imported host groups')
});

function registerTools(server, { logger }) {
    // Get host groups with enhanced schema
    server.tool(
        'zabbix_get_hostgroups',
        'Get host groups from Zabbix with filtering and output options',
        {
            groupids: z.array(z.string()).optional().describe('Return only host groups with the given group IDs'),
            groupnames: z.array(z.string()).optional().describe('Return only host groups with the given group names'),
            output: z.array(z.string()).optional().default(['groupid', 'name']).describe('Object properties to be returned'),
            selectHosts: z.array(z.string()).optional().describe('Return hosts that belong to the host group'),
            selectTemplates: z.array(z.string()).optional().describe('Return templates that belong to the host group'),
            sortfield: z.array(z.string()).optional().default(['name']).describe('Sort the result by the given properties'),
            sortorder: z.enum(['ASC', 'DESC']).optional().default('ASC').describe('Sort order'),
            limit: z.number().int().positive().optional().describe('Limit the number of records returned'),
            // Enhanced filtering options
            filter: z.record(z.any()).optional().describe('Return only host groups that match the given filter'),
            search: z.record(z.any()).optional().describe('Return only host groups that match the given wildcard search'),
            searchWildcardsEnabled: z.boolean().optional().describe('Return results that contain wildcards'),
            searchByAny: z.boolean().optional().describe('Return results that match any of the criteria in search'),
            startSearch: z.boolean().optional().describe('Return results that start with the criteria in search'),
            excludeSearch: z.boolean().optional().describe('Return results that do not match the criteria in search'),
            preservekeys: z.boolean().optional().describe('Use host group IDs as keys in the resulting array')
        },
        async (args) => {
            try {
                const params = { ...args };
                
                // Build API parameters with enhanced filtering
                const apiParams = {
                    output: params.output || ['groupid', 'name'],
                    sortfield: params.sortfield || ['name'],
                    sortorder: params.sortorder || 'ASC'
                };

                // Basic filtering
                if (params.groupids) apiParams.groupids = params.groupids;
                if (params.groupnames) apiParams.filter = { name: params.groupnames };
                if (params.selectHosts) apiParams.selectHosts = params.selectHosts;
                if (params.selectTemplates) apiParams.selectTemplates = params.selectTemplates;
                if (params.limit) apiParams.limit = params.limit;

                // Enhanced filtering options
                if (params.filter) apiParams.filter = { ...apiParams.filter, ...params.filter };
                if (params.search) apiParams.search = params.search;
                if (params.searchWildcardsEnabled !== undefined) apiParams.searchWildcardsEnabled = params.searchWildcardsEnabled;
                if (params.searchByAny !== undefined) apiParams.searchByAny = params.searchByAny;
                if (params.startSearch !== undefined) apiParams.startSearch = params.startSearch;
                if (params.excludeSearch !== undefined) apiParams.excludeSearch = params.excludeSearch;
                if (params.preservekeys !== undefined) apiParams.preservekeys = params.preservekeys;

                const hostGroups = await api.getHostGroups(apiParams);
                
                logger.info(`Retrieved ${hostGroups.length} host groups`);
                return {
                    content: [{
                        type: 'text',
                        text: `Found ${hostGroups.length} host groups:\n\n${JSON.stringify(hostGroups, null, 2)}`
                    }]
                };
            } catch (error) {
                const enhancedError = handleZabbixError(error, 'error_getting_host_groups', args);
                logger.error('Error getting host groups::', enhancedError.message);
                logger.debug('Full error details:', enhancedError.details);
                throw new Error(enhancedError.message);
            }
        }
    );

    // Create host group with enhanced schema
    server.tool(
        'zabbix_create_hostgroup',
        'Create a new host group in Zabbix',
        {
            name: z.string().min(1).describe('Name of the host group'),
            uuid: z.string().optional().describe('Universal unique identifier (auto-generated if not provided)')
        },
        async (args) => {
            try {
                const { name, uuid } = args;
                
                const params = { name };
                if (uuid) params.uuid = uuid;
                
                const result = await api.createHostGroup(params);
                
                logger.info(`Created host group: ${name} (ID: ${result.groupids[0]})`);
                return {
                    content: [{
                        type: 'text',
                        text: `Successfully created host group "${name}" with ID: ${result.groupids[0]}${uuid ? ` and UUID: ${uuid}` : ''}`
                    }]
                };
            } catch (error) {
                const enhancedError = handleZabbixError(error, 'error_creating_host_group', args);
                logger.error('Error creating host group::', enhancedError.message);
                logger.debug('Full error details:', enhancedError.details);
                throw new Error(enhancedError.message);
            }
        }
    );

    // Update host group with enhanced schema
    server.tool(
        'zabbix_update_hostgroup',
        'Update an existing host group in Zabbix',
        {
            groupid: z.string().describe('ID of the host group to update'),
            name: z.string().min(1).optional().describe('New name for the host group'),
            uuid: z.string().optional().describe('Universal unique identifier')
        },
        async (args) => {
            try {
                const { groupid, name, uuid } = args;
                
                const params = { groupid };
                if (name) params.name = name;
                if (uuid) params.uuid = uuid;
                
                const result = await api.updateHostGroup(params);
                
                logger.info(`Updated host group ID ${groupid}`);
                return {
                    content: [{
                        type: 'text',
                        text: `Successfully updated host group ID ${groupid}${name ? ` with new name: "${name}"` : ''}${uuid ? ` and UUID: ${uuid}` : ''}`
                    }]
                };
            } catch (error) {
                const enhancedError = handleZabbixError(error, 'error_updating_host_group', args);
                logger.error('Error updating host group::', enhancedError.message);
                logger.debug('Full error details:', enhancedError.details);
                throw new Error(enhancedError.message);
            }
        }
    );

    // Delete host groups
    server.tool(
        'zabbix_delete_hostgroups',
        'Delete host groups from Zabbix',
        {
            groupids: z.array(z.string()).min(1).describe('Array of host group IDs to delete')
        },
        async (args) => {
            try {
                const { groupids } = args;
                
                const result = await api.deleteHostGroups(groupids);
                
                logger.info(`Deleted ${groupids.length} host groups`);
                return {
                    content: [{
                        type: 'text',
                        text: `Successfully deleted ${groupids.length} host groups: ${groupids.join(', ')}`
                    }]
                };
            } catch (error) {
                const enhancedError = handleZabbixError(error, 'error_deleting_host_groups', args);
                logger.error('Error deleting host groups::', enhancedError.message);
                logger.debug('Full error details:', enhancedError.details);
                throw new Error(enhancedError.message);
            }
        }
    );

    // Get discovered host groups (enhanced feature)
    server.tool(
        'zabbix_get_discovered_hostgroups',
        'Get discovered host groups from Zabbix (auto-discovery)',
        {
            output: z.array(z.string()).optional().default(['groupid', 'name', 'flags']).describe('Object properties to be returned'),
            selectHosts: z.array(z.string()).optional().describe('Return hosts that belong to the discovered host group'),
            limit: z.number().int().positive().optional().describe('Limit the number of records returned')
        },
        async (args) => {
            try {
                const params = {
                    output: args.output || ['groupid', 'name', 'flags'],
                    filter: { flags: [4] }, // Discovered host groups only
                    sortfield: ['name'],
                    sortorder: 'ASC'
                };

                if (args.selectHosts) params.selectHosts = args.selectHosts;
                if (args.limit) params.limit = args.limit;

                const discoveredGroups = await api.getHostGroups(params);
                
                logger.info(`Retrieved ${discoveredGroups.length} discovered host groups`);
                return {
                    content: [{
                        type: 'text',
                        text: `Found ${discoveredGroups.length} discovered host groups:\n\n${JSON.stringify(discoveredGroups, null, 2)}`
                    }]
                };
            } catch (error) {
                const enhancedError = handleZabbixError(error, 'error_getting_discovered_host_groups', args);
                logger.error('Error getting discovered host groups::', enhancedError.message);
                logger.debug('Full error details:', enhancedError.details);
                throw new Error(enhancedError.message);
            }
        }
    );

    // Get plain host groups (enhanced feature)
    server.tool(
        'zabbix_get_plain_hostgroups',
        'Get plain (manually created) host groups from Zabbix',
        {
            output: z.array(z.string()).optional().default(['groupid', 'name', 'flags', 'uuid']).describe('Object properties to be returned'),
            selectHosts: z.array(z.string()).optional().describe('Return hosts that belong to the host group'),
            selectTemplates: z.array(z.string()).optional().describe('Return templates that belong to the host group'),
            limit: z.number().int().positive().optional().describe('Limit the number of records returned')
        },
        async (args) => {
            try {
                const params = {
                    output: args.output || ['groupid', 'name', 'flags', 'uuid'],
                    filter: { flags: [0] }, // Plain host groups only
                    sortfield: ['name'],
                    sortorder: 'ASC'
                };

                if (args.selectHosts) params.selectHosts = args.selectHosts;
                if (args.selectTemplates) params.selectTemplates = args.selectTemplates;
                if (args.limit) params.limit = args.limit;

                const plainGroups = await api.getHostGroups(params);
                
                logger.info(`Retrieved ${plainGroups.length} plain host groups`);
                return {
                    content: [{
                        type: 'text',
                        text: `Found ${plainGroups.length} plain host groups:\n\n${JSON.stringify(plainGroups, null, 2)}`
                    }]
                };
            } catch (error) {
                const enhancedError = handleZabbixError(error, 'error_getting_plain_host_groups', args);
                logger.error('Error getting plain host groups::', enhancedError.message);
                logger.debug('Full error details:', enhancedError.details);
                throw new Error(enhancedError.message);
            }
        }
    );

    logger.info('Enhanced host groups tools registered successfully');
}

module.exports = { registerTools }; 