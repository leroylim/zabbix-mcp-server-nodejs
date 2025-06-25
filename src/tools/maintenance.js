const { logger } = require('../utils/logger');
const api = require('../api');
const { z } = require('zod');
const { handleZabbixError } = require('../utils/errors');

// Helper functions for maintenance management
function getMaintenanceTypeName(type) {
    const typeNames = {
        0: 'with_data_collection',
        1: 'without_data_collection'
    };
    return typeNames[type] || 'unknown';
}

function getTimePeriodTypeName(type) {
    const typeNames = {
        0: 'one_time_only',
        2: 'daily',
        3: 'weekly', 
        4: 'monthly'
    };
    return typeNames[type] || 'unknown';
}

function parseDayOfWeekBitmask(bitmask) {
    const days = [];
    const dayNames = {
        1: 'Monday',
        2: 'Tuesday', 
        4: 'Wednesday',
        8: 'Thursday',
        16: 'Friday',
        32: 'Saturday',
        64: 'Sunday'
    };
    
    for (const [bit, name] of Object.entries(dayNames)) {
        if (bitmask & parseInt(bit)) {
            days.push(name);
        }
    }
    return days;
}

function parseMonthBitmask(bitmask) {
    const months = [];
    const monthNames = {
        1: 'January',
        2: 'February',
        4: 'March', 
        8: 'April',
        16: 'May',
        32: 'June',
        64: 'July',
        128: 'August',
        256: 'September',
        512: 'October',
        1024: 'November',
        2048: 'December'
    };
    
    for (const [bit, name] of Object.entries(monthNames)) {
        if (bitmask & parseInt(bit)) {
            months.push(name);
        }
    }
    return months;
}

function getProblemTagOperatorName(operator) {
    const operatorNames = {
        0: 'equals',
        2: 'contains'
    };
    return operatorNames[operator] || 'unknown';
}

// Enhanced schema definitions
const TimePeriodSchema = z.object({
    timeperiod_type: z.number().int().min(0).max(4).describe('Type of time period: 0 (one time only), 2 (daily), 3 (weekly), 4 (monthly)'),
    period: z.number().int().min(60).optional().default(3600).describe('Duration of the maintenance period in seconds (rounded down to minutes)'),
    start_date: z.number().int().optional().describe('Date when maintenance must come into effect (Unix timestamp, for one-time only)'),
    start_time: z.number().int().min(0).max(86399).optional().default(0).describe('Time of day when maintenance starts in seconds (for daily/weekly/monthly)'),
    every: z.number().int().min(1).optional().default(1).describe('Interval frequency (day/week intervals or month day/week)'),
    dayofweek: z.number().int().min(1).max(127).optional().describe('Days of week bitmask (1=Mon, 2=Tue, 4=Wed, 8=Thu, 16=Fri, 32=Sat, 64=Sun)'),
    day: z.number().int().min(1).max(31).optional().describe('Day of month (1-31, for monthly periods)'),
    month: z.number().int().min(1).max(4095).optional().describe('Months bitmask (1=Jan, 2=Feb, 4=Mar, etc.)')
});

const ProblemTagSchema = z.object({
    tag: z.string().min(1).describe('Problem tag name (required)'),
    operator: z.number().int().min(0).max(2).optional().default(2).describe('Condition operator: 0 (equals), 2 (contains)'),
    value: z.string().optional().default('').describe('Problem tag value')
});

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

                const maintenance = await api.getMaintenanceWindows(apiParams);
                
                // Enhanced formatting for maintenance periods
                const formattedMaintenance = maintenance.map(m => ({
                    ...m,
                    active_since_readable: new Date(m.active_since * 1000).toISOString(),
                    active_till_readable: new Date(m.active_till * 1000).toISOString(),
                    maintenance_type_name: getMaintenanceTypeName(parseInt(m.maintenance_type)),
                    timeperiods: m.timeperiods ? m.timeperiods.map(tp => ({
                        ...tp,
                        timeperiod_type_name: getTimePeriodTypeName(parseInt(tp.timeperiod_type)),
                        start_date_readable: tp.start_date ? new Date(tp.start_date * 1000).toISOString() : undefined,
                        start_time_readable: tp.start_time ? `${Math.floor(tp.start_time / 3600)}:${Math.floor((tp.start_time % 3600) / 60).toString().padStart(2, '0')}` : undefined,
                        dayofweek_readable: tp.dayofweek ? parseDayOfWeekBitmask(parseInt(tp.dayofweek)) : undefined,
                        month_readable: tp.month ? parseMonthBitmask(parseInt(tp.month)) : undefined,
                        period_readable: tp.period ? `${Math.floor(tp.period / 3600)}h ${Math.floor((tp.period % 3600) / 60)}m` : undefined
                    })) : undefined,
                    tags: m.tags ? m.tags.map(tag => ({
                        ...tag,
                        operator_name: getProblemTagOperatorName(parseInt(tag.operator))
                    })) : undefined
                }));
                
                logger.info(`Retrieved ${maintenance.length} maintenance periods`);
                return {
                    content: [{
                        type: 'text',
                        text: `Found ${maintenance.length} maintenance periods:\n\n${JSON.stringify(formattedMaintenance, null, 2)}`
                    }]
                };
            } catch (error) {
                const enhancedError = handleZabbixError(error, 'error_getting_maintenance_periods', args);
                logger.error('Error getting maintenance periods::', enhancedError.message);
                logger.debug('Full error details:', enhancedError.details);
                throw new Error(enhancedError.message);
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

                const result = await api.createMaintenanceWindow(params);
                
                logger.info(`Created maintenance period: ${params.name} (ID: ${result.maintenanceids[0]})`);
                return {
                    content: [{
                        type: 'text',
                        text: `Successfully created maintenance period "${params.name}" with ID: ${result.maintenanceids[0]}`
                    }]
                };
            } catch (error) {
                const enhancedError = handleZabbixError(error, 'error_creating_maintenance_period', args);
                logger.error('Error creating maintenance period::', enhancedError.message);
                logger.debug('Full error details:', enhancedError.details);
                throw new Error(enhancedError.message);
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
                
                const result = await api.updateMaintenanceWindow(params);
                
                logger.info(`Updated maintenance period ID ${params.maintenanceid}`);
                return {
                    content: [{
                        type: 'text',
                        text: `Successfully updated maintenance period ID ${params.maintenanceid}`
                    }]
                };
            } catch (error) {
                const enhancedError = handleZabbixError(error, 'error_updating_maintenance_period', args);
                logger.error('Error updating maintenance period::', enhancedError.message);
                logger.debug('Full error details:', enhancedError.details);
                throw new Error(enhancedError.message);
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
                
                const result = await api.deleteMaintenanceWindows(maintenanceids);
                
                logger.info(`Deleted ${maintenanceids.length} maintenance periods`);
                return {
                    content: [{
                        type: 'text',
                        text: `Successfully deleted ${maintenanceids.length} maintenance periods: ${maintenanceids.join(', ')}`
                    }]
                };
            } catch (error) {
                const enhancedError = handleZabbixError(error, 'error_deleting_maintenance_periods', args);
                logger.error('Error deleting maintenance periods::', enhancedError.message);
                logger.debug('Full error details:', enhancedError.details);
                throw new Error(enhancedError.message);
            }
        }
    );

    logger.info('Maintenance tools registered successfully');
}

module.exports = { registerTools }; 