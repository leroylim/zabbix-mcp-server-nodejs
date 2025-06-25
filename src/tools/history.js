const { logger } = require('../utils/logger');
const api = require('../api');
const { z } = require('zod');
const { handleZabbixError } = require('../utils/errors');

// Helper functions for enhanced history formatting
function getHistoryTypeName(historyType) {
    const typeNames = {
        0: 'float',
        1: 'character', 
        2: 'log',
        3: 'unsigned_integer',
        4: 'text'
    };
    return typeNames[historyType] || 'unknown';
}

function getSeverityName(severity) {
    const severityNames = {
        0: 'Success',
        1: 'Information', 
        2: 'Warning',
        3: 'Error',
        4: 'Critical'
    };
    return severityNames[severity] || `Level ${severity}`;
}

function registerTools(server) {
    // Get history data with enhanced type-specific support
    server.tool(
        'zabbix_get_history',
        'Get historical data for items from Zabbix with type-specific formatting',
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

                const history = await api.getHistory(apiParams);
                
                logger.info(`Retrieved ${history.length} history records`);
                
                // Enhanced type-specific formatting based on history type
                const historyType = params.history;
                const formattedHistory = history.map(record => {
                    const baseFormatting = {
                        ...record,
                        clock_readable: new Date(record.clock * 1000).toISOString(),
                        ns_readable: record.ns ? `${record.ns}ns` : undefined,
                        history_type: getHistoryTypeName(historyType)
                    };
                    
                    // Type-specific enhancements based on official Zabbix history object types
                    if (historyType === 2) {
                        // Log history - enhance with Windows event log properties
                        return {
                            ...baseFormatting,
                            logeventid_info: record.logeventid ? `Event ID: ${record.logeventid}` : undefined,
                            severity_readable: record.severity !== undefined ? getSeverityName(record.severity) : undefined,
                            source_info: record.source ? `Source: ${record.source}` : undefined,
                            timestamp_readable: record.timestamp ? new Date(record.timestamp * 1000).toISOString() : undefined,
                            value_type: 'log_entry'
                        };
                    } else if (historyType === 4) {
                        // Text history - enhance with text-specific properties
                        return {
                            ...baseFormatting,
                            value_type: 'text',
                            text_length: record.value ? record.value.length : 0,
                            has_unique_id: record.id ? true : false
                        };
                    } else if (historyType === 0) {
                        // Float history - enhance with numeric formatting
                        return {
                            ...baseFormatting,
                            value_type: 'float',
                            value_formatted: typeof record.value === 'number' ? record.value.toFixed(4) : record.value
                        };
                    } else if (historyType === 3) {
                        // Integer history - enhance with integer formatting
                        return {
                            ...baseFormatting,
                            value_type: 'unsigned_integer',
                            value_formatted: record.value
                        };
                    } else if (historyType === 1) {
                        // String history - enhance with string-specific properties
                        return {
                            ...baseFormatting,
                            value_type: 'character',
                            string_length: record.value ? record.value.length : 0
                        };
                    }
                    
                    return baseFormatting;
                });
                
                return {
                    content: [{
                        type: 'text',
                        text: `Found ${history.length} history records (type: ${getHistoryTypeName(historyType)}):\n\n${JSON.stringify(formattedHistory, null, 2)}`
                    }]
                };
            } catch (error) {
                const enhancedError = handleZabbixError(error, 'error_getting_history_data', args);
                logger.error('Error getting history data::', enhancedError.message);
                logger.debug('Full error details:', enhancedError.details);
                throw new Error(enhancedError.message);
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

                const trends = await api.getTrends(apiParams);
                
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
                const enhancedError = handleZabbixError(error, 'error_getting_trends_data', args);
                logger.error('Error getting trends data::', enhancedError.message);
                logger.debug('Full error details:', enhancedError.details);
                throw new Error(enhancedError.message);
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
                    const items = await api.getItems({
                        itemids: [itemid],
                        output: ['itemid', 'name', 'key_', 'value_type', 'units', 'hostid'],
                        selectHosts: ['host', 'name']
                    });
                    
                    if (items.length === 0) {
                        throw new Error(`Item with ID ${itemid} not found`);
                    }
                    
                    itemInfo = items[0];
                }
                
                // Get history data with automatic type detection
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
                
                const history = await api.getHistory(apiParams);
                
                logger.info(`Retrieved ${history.length} history records for item ${itemid}`);
                
                // Enhanced formatting with type-specific properties
                const historyType = apiParams.history;
                const enhancedHistory = history.map(record => {
                    const baseRecord = {
                        ...record,
                        timestamp: new Date(record.clock * 1000).toISOString(),
                        value_formatted: itemInfo && itemInfo.units ? `${record.value} ${itemInfo.units}` : record.value,
                        ns_precision: record.ns ? `${record.ns}ns` : undefined,
                        history_type: getHistoryTypeName(historyType)
                    };
                    
                    // Add type-specific enhancements
                    if (historyType === 2 && record.logeventid) {
                        // Log history enhancements
                        baseRecord.log_details = {
                            event_id: record.logeventid,
                            severity: getSeverityName(record.severity),
                            source: record.source,
                            event_timestamp: record.timestamp ? new Date(record.timestamp * 1000).toISOString() : undefined
                        };
                    } else if (historyType === 4 && record.id) {
                        // Text history enhancements
                        baseRecord.text_details = {
                            unique_id: record.id,
                            content_length: record.value ? record.value.length : 0
                        };
                    }
                    
                    return baseRecord;
                });
                
                // Format response with enhanced metadata
                const response = {
                    item_info: itemInfo,
                    history_type_info: {
                        type_code: historyType,
                        type_name: getHistoryTypeName(historyType),
                        supports_nanoseconds: true,
                        supports_unique_id: historyType === 2 || historyType === 4
                    },
                    time_range: {
                        from: new Date(time_from * 1000).toISOString(),
                        to: new Date(now * 1000).toISOString(),
                        hours_back: hours_back
                    },
                    records_count: history.length,
                    history: enhancedHistory
                };
                
                return {
                    content: [{
                        type: 'text',
                        text: `Historical data for item ${itemid} (last ${hours_back} hours, type: ${getHistoryTypeName(historyType)}):\n\n${JSON.stringify(response, null, 2)}`
                    }]
                };
            } catch (error) {
                const enhancedError = handleZabbixError(error, 'error_getting_item_history_range', args);
                logger.error('Error getting item history range::', enhancedError.message);
                logger.debug('Full error details:', enhancedError.details);
                throw new Error(enhancedError.message);
            }
        }
    );

    logger.info('History tools registered successfully');
}

module.exports = { registerTools }; 