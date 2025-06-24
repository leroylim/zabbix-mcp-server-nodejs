const { logger } = require('../utils/logger');
const api = require('../api');
const { z } = require('zod');

function registerTools(server) {
    // Get items
    server.tool(
        'zabbix_get_items',
        'Get items from Zabbix with filtering and output options',
        {
            itemids: z.array(z.string()).optional().describe('Return only items with the given item IDs'),
            hostids: z.array(z.string()).optional().describe('Return only items that belong to the given hosts'),
            groupids: z.array(z.string()).optional().describe('Return only items that belong to hosts in the given host groups'),
            templateids: z.array(z.string()).optional().describe('Return only items that belong to the given templates'),
            output: z.array(z.string()).optional().default(['itemid', 'name', 'key_', 'hostid', 'status', 'value_type']).describe('Object properties to be returned'),
            selectHosts: z.array(z.string()).optional().describe('Return hosts that the item belongs to'),
            selectTriggers: z.array(z.string()).optional().describe('Return triggers that the item is used in'),
            filter: z.record(z.any()).optional().describe('Return only items that match the given filter'),
            search: z.record(z.any()).optional().describe('Return only items that match the given wildcard search'),
            sortfield: z.array(z.string()).optional().default(['name']).describe('Sort the result by the given properties'),
            sortorder: z.enum(['ASC', 'DESC']).optional().default('ASC').describe('Sort order'),
            limit: z.number().int().positive().optional().describe('Limit the number of records returned'),
            monitored: z.boolean().optional().describe('Return only enabled items that belong to monitored hosts')
        },
        async (args) => {
            try {
                const params = { ...args };
                
                // Build API parameters
                const apiParams = {
                    output: params.output || ['itemid', 'name', 'key_', 'hostid', 'status', 'value_type'],
                    sortfield: params.sortfield || ['name'],
                    sortorder: params.sortorder || 'ASC'
                };

                if (params.itemids) apiParams.itemids = params.itemids;
                if (params.hostids) apiParams.hostids = params.hostids;
                if (params.groupids) apiParams.groupids = params.groupids;
                if (params.templateids) apiParams.templateids = params.templateids;
                if (params.selectHosts) apiParams.selectHosts = params.selectHosts;
                if (params.selectTriggers) apiParams.selectTriggers = params.selectTriggers;
                if (params.filter) apiParams.filter = params.filter;
                if (params.search) apiParams.search = params.search;
                if (params.limit) apiParams.limit = params.limit;
                if (params.monitored !== undefined) apiParams.monitored = params.monitored;

                const items = await api.getItems(apiParams);
                
                logger.info(`Retrieved ${items.length} items`);
                return {
                    content: [{
                        type: 'text',
                        text: `Found ${items.length} items:\n\n${JSON.stringify(items, null, 2)}`
                    }]
                };
            } catch (error) {
                logger.error('Error getting items:', error.message);
                throw error;
            }
        }
    );

    // Create item
    server.tool(
        'zabbix_create_item',
        'Create a new item in Zabbix',
        {
            name: z.string().min(1).describe('Name of the item'),
            key_: z.string().min(1).describe('Item key'),
            hostid: z.string().describe('ID of the host that the item belongs to'),
            type: z.number().int().optional().default(0).describe('Type of the item (0 - Zabbix agent, 2 - Zabbix trapper, etc.)'),
            value_type: z.number().int().optional().default(3).describe('Type of information of the item (0 - numeric float, 1 - character, 3 - numeric unsigned, 4 - text)'),
            delay: z.string().optional().default('30s').describe('Update interval of the item'),
            history: z.string().optional().default('90d').describe('A time unit of how long the history data should be stored'),
            trends: z.string().optional().default('365d').describe('A time unit of how long the trends data should be stored'),
            status: z.number().int().optional().default(0).describe('Status of the item (0 - enabled, 1 - disabled)'),
            description: z.string().optional().describe('Description of the item'),
            units: z.string().optional().describe('Value units'),
            params: z.string().optional().describe('Additional parameters depending on the type of the item'),
            username: z.string().optional().describe('Username for authentication'),
            password: z.string().optional().describe('Password for authentication')
        },
        async (args) => {
            try {
                const params = { ...args };
                
                const result = await api.createItem(params);
                
                logger.info(`Created item: ${params.name} (ID: ${result.itemids[0]})`);
                return {
                    content: [{
                        type: 'text',
                        text: `Successfully created item "${params.name}" with ID: ${result.itemids[0]}`
                    }]
                };
            } catch (error) {
                logger.error('Error creating item:', error.message);
                throw error;
            }
        }
    );

    // Update item
    server.tool(
        'zabbix_update_item',
        'Update an existing item in Zabbix',
        {
            itemid: z.string().describe('ID of the item to update'),
            name: z.string().optional().describe('Name of the item'),
            key_: z.string().optional().describe('Item key'),
            type: z.number().int().optional().describe('Type of the item'),
            value_type: z.number().int().optional().describe('Type of information of the item'),
            delay: z.string().optional().describe('Update interval of the item'),
            history: z.string().optional().describe('A time unit of how long the history data should be stored'),
            trends: z.string().optional().describe('A time unit of how long the trends data should be stored'),
            status: z.number().int().optional().describe('Status of the item (0 - enabled, 1 - disabled)'),
            description: z.string().optional().describe('Description of the item'),
            units: z.string().optional().describe('Value units')
        },
        async (args) => {
            try {
                const params = { ...args };
                
                const result = await api.updateItem(params);
                
                logger.info(`Updated item ID ${params.itemid}`);
                return {
                    content: [{
                        type: 'text',
                        text: `Successfully updated item ID ${params.itemid}`
                    }]
                };
            } catch (error) {
                logger.error('Error updating item:', error.message);
                throw error;
            }
        }
    );

    // Delete items
    server.tool(
        'zabbix_delete_items',
        'Delete items from Zabbix',
        {
            itemids: z.array(z.string()).min(1).describe('Array of item IDs to delete')
        },
        async (args) => {
            try {
                const { itemids } = args;
                
                const result = await api.deleteItems(itemids);
                
                logger.info(`Deleted ${itemids.length} items`);
                return {
                    content: [{
                        type: 'text',
                        text: `Successfully deleted ${itemids.length} items: ${itemids.join(', ')}`
                    }]
                };
            } catch (error) {
                logger.error('Error deleting items:', error.message);
                throw error;
            }
        }
    );

    // Get latest data for items
    server.tool(
        'zabbix_get_latest_data',
        'Get latest data for items from Zabbix',
        {
            itemids: z.array(z.string()).optional().describe('Array of item IDs to get latest data for'),
            hostids: z.array(z.string()).optional().describe('Return only items that belong to the given hosts'),
            output: z.array(z.string()).optional().default(['itemid', 'name', 'lastvalue', 'lastclock', 'units']).describe('Object properties to be returned'),
            selectHosts: z.array(z.string()).optional().describe('Return hosts that the item belongs to'),
            limit: z.number().int().positive().optional().describe('Limit the number of records returned')
        },
        async (args) => {
            try {
                const params = { ...args };
                
                // Build API parameters for getting items with latest data
                const apiParams = {
                    output: params.output || ['itemid', 'name', 'lastvalue', 'lastclock', 'units'],
                    monitored: true
                };

                if (params.itemids) apiParams.itemids = params.itemids;
                if (params.hostids) apiParams.hostids = params.hostids;
                if (params.selectHosts) apiParams.selectHosts = params.selectHosts;
                if (params.limit) apiParams.limit = params.limit;

                const latestData = await api.getLatestData(apiParams);
                
                logger.info(`Retrieved latest data for ${latestData.length} items`);
                return {
                    content: [{
                        type: 'text',
                        text: `Found latest data for ${latestData.length} items:\n\n${JSON.stringify(latestData, null, 2)}`
                    }]
                };
            } catch (error) {
                logger.error('Error getting latest data:', error.message);
                throw error;
            }
        }
    );

    logger.info('Items tools registered successfully');
}

module.exports = { registerTools }; 