const { logger } = require('../utils/logger');
const api = require('../api');
const { z } = require('zod');

function registerTools(server) {
    // Get maintenance periods
    server.tool(
        'zabbix_get_maintenance',
        'Get maintenance periods from Zabbix with filtering and output options',
        {
            maintenanceids: z.array(z.string()).optional().describe('Return only maintenance periods with the given IDs'),
            hostids: z.array(z.string()).optional().describe('Return only maintenance periods that affect the given hosts'),
            groupids: z.array(z.string()).optional().describe('Return only maintenance periods that affect hosts in the given groups'),
            output: z.array(z.string()).optional().default(['maintenanceid', 'name', 'active_since', 'active_till', 'maintenance_type']).describe('Object properties to be returned'),
            selectHosts: z.array(z.string()).optional().describe('Return hosts affected by the maintenance'),
            selectGroups: z.array(z.string()).optional().describe('Return host groups affected by the maintenance'),
            selectTimeperiods: z.array(z.string()).optional().describe('Return time periods of the maintenance'),
            filter: z.record(z.any()).optional().describe('Return only maintenance periods that match the given filter'),
            search: z.record(z.any()).optional().describe('Return only maintenance periods that match the given wildcard search'),
            sortfield: z.array(z.string()).optional().default(['name']).describe('Sort the result by the given properties'),
            sortorder: z.enum(['ASC', 'DESC']).optional().default('ASC').describe('Sort order'),
            limit: z.number().int().positive().optional().describe('Limit the number of records returned')
        },
        async (args) => {
            try {
                const params = { ...args };
                
                const apiParams = {
                    output: params.output || ['maintenanceid', 'name', 'active_since', 'active_till', 'maintenance_type'],
                    sortfield: params.sortfield || ['name'],
                    sortorder: params.sortorder || 'ASC'
                };

                if (params.maintenanceids) apiParams.maintenanceids = params.maintenanceids;
                if (params.hostids) apiParams.hostids = params.hostids;
                if (params.groupids) apiParams.groupids = params.groupids;
                if (params.selectHosts) apiParams.selectHosts = params.selectHosts;
                if (params.selectGroups) apiParams.selectGroups = params.selectGroups;
                if (params.selectTimeperiods) apiParams.selectTimeperiods = params.selectTimeperiods;
                if (params.filter) apiParams.filter = params.filter;
                if (params.search) apiParams.search = params.search;
                if (params.limit) apiParams.limit = params.limit;

                const maintenance = await api.maintenanceApi.get(apiParams);
                
                logger.info(`Retrieved ${maintenance.length} maintenance periods`);
                return {
                    content: [{
                        type: 'text',
                        text: `Found ${maintenance.length} maintenance periods:\n\n${JSON.stringify(maintenance, null, 2)}`
                    }]
                };
            } catch (error) {
                logger.error('Error getting maintenance periods:', error.message);
                throw error;
            }
        }
    );

    // Create maintenance period
    server.tool(
        'zabbix_create_maintenance',
        'Create a new maintenance period in Zabbix',
        {
            name: z.string().min(1).describe('Name of the maintenance period'),
            active_since: z.number().int().describe('Start time of the maintenance period (Unix timestamp)'),
            active_till: z.number().int().describe('End time of the maintenance period (Unix timestamp)'),
            maintenance_type: z.number().int().min(0).max(1).optional().default(0).describe('Type of maintenance (0 - with data collection, 1 - without data collection)'),
            description: z.string().optional().describe('Description of the maintenance period'),
            hostids: z.array(z.string()).optional().describe('IDs of hosts to put in maintenance'),
            groupids: z.array(z.string()).optional().describe('IDs of host groups to put in maintenance'),
            timeperiods: z.array(z.object({
                timeperiod_type: z.number().int().min(0).max(4).describe('Type of time period (0 - one time only, 2 - daily, 3 - weekly, 4 - monthly)'),
                start_time: z.number().int().optional().describe('Start time of the time period in seconds since the beginning of the day'),
                period: z.number().int().optional().describe('Duration of the maintenance period in seconds'),
                start_date: z.number().int().optional().describe('Date when the maintenance period becomes active (Unix timestamp)'),
                every: z.number().int().optional().describe('For weekly and monthly periods - how often the maintenance should be repeated'),
                dayofweek: z.number().int().optional().describe('Day of the week when the maintenance should be performed (for weekly periods)'),
                day: z.number().int().optional().describe('Day of the month when the maintenance should be performed (for monthly periods)'),
                month: z.number().int().optional().describe('Months when the maintenance should be performed (bitmask)')
            })).min(1).describe('Time periods when the maintenance should be active'),
            tags: z.array(z.object({
                tag: z.string(),
                operator: z.number().int().min(0).max(5).optional().default(2),
                value: z.string().optional()
            })).optional().describe('Problem tags to match for maintenance')
        },
        async (args) => {
            try {
                const params = { ...args };
                
                // Ensure at least hosts or groups are specified
                if (!params.hostids && !params.groupids) {
                    throw new Error('Either hostids or groupids must be specified for maintenance');
                }

                const result = await api.maintenanceApi.create(params);
                
                logger.info(`Created maintenance period: ${params.name} (ID: ${result.maintenanceids[0]})`);
                return {
                    content: [{
                        type: 'text',
                        text: `Successfully created maintenance period "${params.name}" with ID: ${result.maintenanceids[0]}`
                    }]
                };
            } catch (error) {
                logger.error('Error creating maintenance period:', error.message);
                throw error;
            }
        }
    );

    // Update maintenance period
    server.tool(
        'zabbix_update_maintenance',
        'Update an existing maintenance period in Zabbix',
        {
            maintenanceid: z.string().describe('ID of the maintenance period to update'),
            name: z.string().optional().describe('Name of the maintenance period'),
            active_since: z.number().int().optional().describe('Start time of the maintenance period (Unix timestamp)'),
            active_till: z.number().int().optional().describe('End time of the maintenance period (Unix timestamp)'),
            maintenance_type: z.number().int().min(0).max(1).optional().describe('Type of maintenance (0 - with data collection, 1 - without data collection)'),
            description: z.string().optional().describe('Description of the maintenance period'),
            hostids: z.array(z.string()).optional().describe('IDs of hosts to put in maintenance'),
            groupids: z.array(z.string()).optional().describe('IDs of host groups to put in maintenance')
        },
        async (args) => {
            try {
                const params = { ...args };
                
                const result = await api.maintenanceApi.update(params);
                
                logger.info(`Updated maintenance period ID ${params.maintenanceid}`);
                return {
                    content: [{
                        type: 'text',
                        text: `Successfully updated maintenance period ID ${params.maintenanceid}`
                    }]
                };
            } catch (error) {
                logger.error('Error updating maintenance period:', error.message);
                throw error;
            }
        }
    );

    // Delete maintenance periods
    server.tool(
        'zabbix_delete_maintenance',
        'Delete maintenance periods from Zabbix',
        {
            maintenanceids: z.array(z.string()).min(1).describe('Array of maintenance period IDs to delete')
        },
        async (args) => {
            try {
                const { maintenanceids } = args;
                
                const result = await api.maintenanceApi.delete(maintenanceids);
                
                logger.info(`Deleted ${maintenanceids.length} maintenance periods`);
                return {
                    content: [{
                        type: 'text',
                        text: `Successfully deleted ${maintenanceids.length} maintenance periods: ${maintenanceids.join(', ')}`
                    }]
                };
            } catch (error) {
                logger.error('Error deleting maintenance periods:', error.message);
                throw error;
            }
        }
    );

    logger.info('Maintenance tools registered successfully');
}

module.exports = { registerTools }; 