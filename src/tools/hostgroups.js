const { logger } = require('../utils/logger');
const api = require('../api');
const { z } = require('zod');

function registerTools(server) {
    // Get host groups
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
            limit: z.number().int().positive().optional().describe('Limit the number of records returned')
        },
        async (args) => {
            try {
                const params = { ...args };
                
                // Build API parameters
                const apiParams = {
                    output: params.output || ['groupid', 'name'],
                    sortfield: params.sortfield || ['name'],
                    sortorder: params.sortorder || 'ASC'
                };

                if (params.groupids) apiParams.groupids = params.groupids;
                if (params.groupnames) apiParams.filter = { name: params.groupnames };
                if (params.selectHosts) apiParams.selectHosts = params.selectHosts;
                if (params.selectTemplates) apiParams.selectTemplates = params.selectTemplates;
                if (params.limit) apiParams.limit = params.limit;

                const hostGroups = await api.hostGroupsApi.get(apiParams);
                
                logger.info(`Retrieved ${hostGroups.length} host groups`);
                return {
                    content: [{
                        type: 'text',
                        text: `Found ${hostGroups.length} host groups:\n\n${JSON.stringify(hostGroups, null, 2)}`
                    }]
                };
            } catch (error) {
                logger.error('Error getting host groups:', error.message);
                throw error;
            }
        }
    );

    // Create host group
    server.tool(
        'zabbix_create_hostgroup',
        'Create a new host group in Zabbix',
        {
            name: z.string().min(1).describe('Name of the host group')
        },
        async (args) => {
            try {
                const { name } = args;
                
                const result = await api.hostGroupsApi.create({ name });
                
                logger.info(`Created host group: ${name} (ID: ${result.groupids[0]})`);
                return {
                    content: [{
                        type: 'text',
                        text: `Successfully created host group "${name}" with ID: ${result.groupids[0]}`
                    }]
                };
            } catch (error) {
                logger.error('Error creating host group:', error.message);
                throw error;
            }
        }
    );

    // Update host group
    server.tool(
        'zabbix_update_hostgroup',
        'Update an existing host group in Zabbix',
        {
            groupid: z.string().describe('ID of the host group to update'),
            name: z.string().min(1).describe('New name for the host group')
        },
        async (args) => {
            try {
                const { groupid, name } = args;
                
                const result = await api.hostGroupsApi.update({ groupid, name });
                
                logger.info(`Updated host group ID ${groupid} with new name: ${name}`);
                return {
                    content: [{
                        type: 'text',
                        text: `Successfully updated host group ID ${groupid} with new name: "${name}"`
                    }]
                };
            } catch (error) {
                logger.error('Error updating host group:', error.message);
                throw error;
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
                
                const result = await api.hostGroupsApi.delete(groupids);
                
                logger.info(`Deleted ${groupids.length} host groups`);
                return {
                    content: [{
                        type: 'text',
                        text: `Successfully deleted ${groupids.length} host groups: ${groupids.join(', ')}`
                    }]
                };
            } catch (error) {
                logger.error('Error deleting host groups:', error.message);
                throw error;
            }
        }
    );

    logger.info('Host groups tools registered successfully');
}

module.exports = { registerTools }; 