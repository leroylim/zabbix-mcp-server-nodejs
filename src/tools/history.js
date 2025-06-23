const { logger } = require('../utils/logger');
const api = require('../api');
const { z } = require('zod');

function registerTools(server) {
    // Get history data
    server.tool(
        'zabbix_get_history',
        'Get historical data for items from Zabbix',
        {
            itemids: z.array(z.string()).min(1).describe('Array of item IDs to get history for'),
            history: z.number().int().min(0).max(4).optional().describe('Object type to return (0 - numeric float, 1 - character, 2 - log, 3 - numeric unsigned, 4 - text)'),
            time_from: z.number().int().optional().describe('Return only values that have been received after or at the given time (Unix timestamp)'),
            time_till: z.number().int().optional().describe('Return only values that have been received before or at the given time (Unix timestamp)'),
            sortfield: z.array(z.string()).optional().default(['clock']).describe('Sort the result by the given properties'),
            sortorder: z.enum(['ASC', 'DESC']).optional().default('DESC').describe('Sort order'),
            limit: z.number().int().positive().optional().default(100).describe('Limit the number of records returned (default: 100, max recommended: 1000)'),
            output: z.enum(['extend', 'count']).optional().default('extend').describe('Type of output (extend - all fields, count - number of records)')
        },
        async (args) => {
            try {
                const params = { ...args };
                
                // Build API parameters
                const apiParams = {
                    itemids: params.itemids,
                    sortfield: params.sortfield || ['clock'],
                    sortorder: params.sortorder || 'DESC',
                    limit: params.limit || 100,
                    output: params.output || 'extend'
                };

                if (params.history !== undefined) apiParams.history = params.history;
                if (params.time_from) apiParams.time_from = params.time_from;
                if (params.time_till) apiParams.time_till = params.time_till;

                const history = await api.historyApi.getHistory(apiParams);
                
                logger.info(`Retrieved ${history.length} history records`);
                
                // Format timestamps for readability
                const formattedHistory = history.map(record => ({
                    ...record,
                    clock_readable: new Date(record.clock * 1000).toISOString(),
                    ns_readable: record.ns ? `${record.ns}ns` : undefined
                }));
                
                return {
                    content: [{
                        type: 'text',
                        text: `Found ${history.length} history records:\n\n${JSON.stringify(formattedHistory, null, 2)}`
                    }]
                };
            } catch (error) {
                logger.error('Error getting history data:', error.message);
                throw error;
            }
        }
    );

    // Get trends data
    server.tool(
        'zabbix_get_trends',
        'Get trends data (aggregated historical data) for items from Zabbix',
        {
            itemids: z.array(z.string()).min(1).describe('Array of item IDs to get trends for'),
            time_from: z.number().int().optional().describe('Return only values that have been received after or at the given time (Unix timestamp)'),
            time_till: z.number().int().optional().describe('Return only values that have been received before or at the given time (Unix timestamp)'),
            sortfield: z.array(z.string()).optional().default(['clock']).describe('Sort the result by the given properties'),
            sortorder: z.enum(['ASC', 'DESC']).optional().default('DESC').describe('Sort order'),
            limit: z.number().int().positive().optional().default(100).describe('Limit the number of records returned (default: 100)'),
            output: z.enum(['extend', 'count']).optional().default('extend').describe('Type of output (extend - all fields, count - number of records)')
        },
        async (args) => {
            try {
                const params = { ...args };
                
                // Build API parameters
                const apiParams = {
                    itemids: params.itemids,
                    sortfield: params.sortfield || ['clock'],
                    sortorder: params.sortorder || 'DESC',
                    limit: params.limit || 100,
                    output: params.output || 'extend'
                };

                if (params.time_from) apiParams.time_from = params.time_from;
                if (params.time_till) apiParams.time_till = params.time_till;

                const trends = await api.historyApi.getTrends(apiParams);
                
                logger.info(`Retrieved ${trends.length} trends records`);
                
                // Format timestamps and values for readability
                const formattedTrends = trends.map(record => ({
                    ...record,
                    clock_readable: new Date(record.clock * 1000).toISOString(),
                    value_min_readable: record.value_min ? parseFloat(record.value_min).toFixed(4) : undefined,
                    value_avg_readable: record.value_avg ? parseFloat(record.value_avg).toFixed(4) : undefined,
                    value_max_readable: record.value_max ? parseFloat(record.value_max).toFixed(4) : undefined
                }));
                
                return {
                    content: [{
                        type: 'text',
                        text: `Found ${trends.length} trends records:\n\n${JSON.stringify(formattedTrends, null, 2)}`
                    }]
                };
            } catch (error) {
                logger.error('Error getting trends data:', error.message);
                throw error;
            }
        }
    );

    // Get history data for time range with automatic type detection
    server.tool(
        'zabbix_get_item_history_range',
        'Get historical data for a specific item over a time range with automatic value type detection',
        {
            itemid: z.string().describe('Item ID to get history for'),
            hours_back: z.number().int().positive().optional().default(24).describe('Number of hours back from now to retrieve data (default: 24)'),
            limit: z.number().int().positive().optional().default(100).describe('Maximum number of records to return (default: 100)'),
            include_item_info: z.boolean().optional().default(true).describe('Include item information in the response')
        },
        async (args) => {
            try {
                const { itemid, hours_back = 24, limit = 100, include_item_info = true } = args;
                
                // Calculate time range
                const now = Math.floor(Date.now() / 1000);
                const time_from = now - (hours_back * 3600);
                
                let itemInfo = null;
                if (include_item_info) {
                    // Get item information to determine value type
                    const items = await api.itemsApi.get({
                        itemids: [itemid],
                        output: ['itemid', 'name', 'key_', 'value_type', 'units', 'hostid'],
                        selectHosts: ['host', 'name']
                    });
                    
                    if (items.length === 0) {
                        throw new Error(`Item with ID ${itemid} not found`);
                    }
                    
                    itemInfo = items[0];
                }
                
                // Get history data
                const apiParams = {
                    itemids: [itemid],
                    time_from: time_from,
                    time_till: now,
                    sortfield: ['clock'],
                    sortorder: 'DESC',
                    limit: limit,
                    output: 'extend'
                };
                
                // Set history type based on item value type if available
                if (itemInfo) {
                    apiParams.history = parseInt(itemInfo.value_type);
                }
                
                const history = await api.historyApi.getHistory(apiParams);
                
                logger.info(`Retrieved ${history.length} history records for item ${itemid}`);
                
                // Format response
                const response = {
                    item_info: itemInfo,
                    time_range: {
                        from: new Date(time_from * 1000).toISOString(),
                        to: new Date(now * 1000).toISOString(),
                        hours_back: hours_back
                    },
                    records_count: history.length,
                    history: history.map(record => ({
                        ...record,
                        timestamp: new Date(record.clock * 1000).toISOString(),
                        value_formatted: itemInfo && itemInfo.units ? `${record.value} ${itemInfo.units}` : record.value
                    }))
                };
                
                return {
                    content: [{
                        type: 'text',
                        text: `Historical data for item ${itemid} (last ${hours_back} hours):\n\n${JSON.stringify(response, null, 2)}`
                    }]
                };
            } catch (error) {
                logger.error('Error getting item history range:', error.message);
                throw error;
            }
        }
    );

    logger.info('History tools registered successfully');
}

module.exports = { registerTools }; 