const { logger } = require('../utils/logger');
const api = require('../api');
const { z } = require('zod');
const { handleZabbixError } = require('../utils/errors');

function registerTools(server) {
    // Get dashboards
    server.tool(
        'zabbix_get_dashboards',
        'Get dashboards from Zabbix with filtering and output options',
        {
            dashboardids: z.array(z.string()).optional().describe('Return only dashboards with the given IDs'),
            output: z.array(z.string()).optional().default(['dashboardid', 'name', 'userid', 'private', 'display_period', 'auto_start']).describe('Object properties to be returned'),
            selectPages: z.array(z.string()).optional().describe('Return dashboard pages'),
            selectUsers: z.array(z.string()).optional().describe('Return users that have access to the dashboard'),
            selectUserGroups: z.array(z.string()).optional().describe('Return user groups that have access to the dashboard'),
            filter: z.record(z.any()).optional().describe('Return only dashboards that match the given filter'),
            search: z.record(z.any()).optional().describe('Return only dashboards that match the given wildcard search'),
            sortfield: z.array(z.string()).optional().default(['name']).describe('Sort the result by the given properties'),
            sortorder: z.enum(['ASC', 'DESC']).optional().default('ASC').describe('Sort order'),
            limit: z.number().int().positive().optional().describe('Limit the number of records returned')
        },
        async (args) => {
            try {
                const params = { ...args };
                
                const apiParams = {
                    output: params.output || ['dashboardid', 'name', 'userid', 'private', 'display_period', 'auto_start'],
                    sortfield: params.sortfield || ['name'],
                    sortorder: params.sortorder || 'ASC'
                };

                if (params.dashboardids) apiParams.dashboardids = params.dashboardids;
                if (params.selectPages) apiParams.selectPages = params.selectPages;
                if (params.selectUsers) apiParams.selectUsers = params.selectUsers;
                if (params.selectUserGroups) apiParams.selectUserGroups = params.selectUserGroups;
                if (params.filter) apiParams.filter = params.filter;
                if (params.search) apiParams.search = params.search;
                if (params.limit) apiParams.limit = params.limit;

                const dashboards = await api.getDashboards(apiParams);
                
                logger.info(`Retrieved ${dashboards.length} dashboards`);
                return {
                    content: [{
                        type: 'text',
                        text: `Found ${dashboards.length} dashboards:\n\n${JSON.stringify(dashboards, null, 2)}`
                    }]
                };
            } catch (error) {
                const enhancedError = handleZabbixError(error, 'error_getting_dashboards', args);
                logger.error('Error getting dashboards::', enhancedError.message);
                logger.debug('Full error details:', enhancedError.details);
                throw new Error(enhancedError.message);
            }
        }
    );

    // Create dashboard
    server.tool(
        'zabbix_create_dashboard',
        'Create a new dashboard in Zabbix for data visualization',
        {
            name: z.string().min(1).describe('Name of the dashboard'),
            userid: z.string().optional().describe('ID of the user that owns the dashboard. Defaults to the current API user if not set by a SuperAdmin'),
            private: z.number().int().min(0).max(1).optional().default(1).describe('Dashboard sharing type: 0 (public), 1 (private)'),
            display_period: z.union([
                z.literal(0), z.literal(10), z.literal(30), z.literal(60),
                z.literal(120), z.literal(600), z.literal(1800), z.literal(3600)
            ]).optional().default(30).describe('Dashboard page display period in seconds (allowed values: 0,10,30,60,120,600,1800,3600)'),
            auto_start: z.number().int().min(0).max(1).optional().default(1).describe('Automatically start dashboard slideshow: 0 (disabled), 1 (enabled)'),
            
            // Dashboard pages (optional per API)
            pages: z.array(z.object({
                name: z.string().optional().describe('Page name'),
                display_period: z.number().int().min(0).max(31536000).optional().describe('Page refresh interval in seconds (0 = use dashboard default)'),
                
                // Page widgets
                widgets: z.array(z.object({
                    type: z.string().describe('Widget type (e.g., "clock", "graph", "plaintext", "url")'),
                    name: z.string().optional().describe('Widget name'),
                    x: z.number().int().min(0).max(71).describe('Horizontal position of the widget (0-71)'),
                    y: z.number().int().min(0).max(63).describe('Vertical position of the widget (0-63)'),
                    width: z.number().int().min(1).max(72).describe('Width of the widget (1-72)'),
                    height: z.number().int().min(1).max(64).describe('Height of the widget (1-64)'),
                    view_mode: z.number().int().min(0).max(1).optional().default(0).describe('Widget view mode: 0 (default), 1 (hidden header)'),
                    
                    // Widget fields (configuration)
                    fields: z.array(z.object({
                        type: z.number().int().min(0).max(13).describe('Field type: 0 (integer), 1 (string), 2 (host group), 3 (host), 4 (item), 5 (item prototype), 6 (graph), 7 (graph prototype), 8 (map), 9 (service), 10 (SLA), 11 (user), 12 (action), 13 (media type)'),
                        name: z.string().describe('Field name'),
                        value: z.union([z.string(), z.number()]).describe('Field value')
                    })).optional().describe('Widget configuration fields')
                })).optional().describe('Page widgets')
            })).optional().describe('Dashboard pages (optional; if omitted Zabbix creates an empty page)'),
            
            // User permissions
            users: z.array(z.object({
                userid: z.string().describe('User ID'),
                permission: z.number().int().min(2).max(3).describe('Access level: 2 (read-only), 3 (read-write)')
            })).optional().describe('Dashboard user permissions'),
            
            userGroups: z.array(z.object({
                usrgrpid: z.string().describe('User group ID'),
                permission: z.number().int().min(2).max(3).describe('Access level: 2 (read-only), 3 (read-write)')
            })).optional().describe('Dashboard user group permissions')
        },
        async (args) => {
            try {
                const params = { ...args };
                
                const result = await api.createDashboard(params);
                
                logger.info(`Created dashboard: ${params.name} (ID: ${result.dashboardids[0]})`);
                return {
                    content: [{
                        type: 'text',
                        text: `Successfully created dashboard "${params.name}" with ID: ${result.dashboardids[0]}`
                    }]
                };
            } catch (error) {
                const enhancedError = handleZabbixError(error, 'error_creating_dashboard', args);
                logger.error('Error creating dashboard::', enhancedError.message);
                logger.debug('Full error details:', enhancedError.details);
                throw new Error(enhancedError.message);
            }
        }
    );

    // Update dashboard
    server.tool(
        'zabbix_update_dashboard',
        'Update an existing dashboard in Zabbix',
        {
            dashboardid: z.string().describe('ID of the dashboard to update'),
            name: z.string().optional().describe('New name for the dashboard'),
            userid: z.string().optional().describe('ID of the user that owns the dashboard'),
            private: z.number().int().min(0).max(1).optional().describe('Dashboard sharing type: 0 (public), 1 (private)'),
            display_period: z.union([
                z.literal(0), z.literal(10), z.literal(30), z.literal(60),
                z.literal(120), z.literal(600), z.literal(1800), z.literal(3600)
            ]).optional().describe('Dashboard display period (same allowed values as create)'),
            auto_start: z.number().int().min(0).max(1).optional().describe('Automatically start dashboard slideshow'),
            pages: z.array(z.object({
                dashboard_pageid: z.string().optional().describe('ID of existing page to update'),
                name: z.string().optional().describe('Page name'),
                display_period: z.number().int().min(0).max(31536000).optional().describe('Page refresh interval'),
                widgets: z.array(z.object({
                    widgetid: z.string().optional().describe('ID of existing widget to update'),
                    type: z.string().describe('Widget type'),
                    name: z.string().optional().describe('Widget name'),
                    x: z.number().int().min(0).max(71).describe('Horizontal position'),
                    y: z.number().int().min(0).max(63).describe('Vertical position'),
                    width: z.number().int().min(1).max(72).describe('Width'),
                    height: z.number().int().min(1).max(64).describe('Height'),
                    view_mode: z.number().int().min(0).max(1).optional().describe('Widget view mode'),
                    fields: z.array(z.object({
                        type: z.number().int().min(0).max(13).describe('Field type: 0 (integer), 1 (string), 2 (host group), 3 (host), 4 (item), 5 (item prototype), 6 (graph), 7 (graph prototype), 8 (map), 9 (service), 10 (SLA), 11 (user), 12 (action), 13 (media type)'),
                        name: z.string().describe('Field name'),
                        value: z.union([z.string(), z.number()]).describe('Field value')
                    })).optional().describe('Widget fields')
                })).optional().describe('Page widgets')
            })).optional().describe('Dashboard pages (replaces all existing pages)'),
            users: z.array(z.record(z.any())).optional().describe('Dashboard user permissions (replaces all existing permissions)'),
            userGroups: z.array(z.record(z.any())).optional().describe('Dashboard user group permissions (replaces all existing permissions)')
        },
        async (args) => {
            try {
                const params = { ...args };
                
                const result = await api.updateDashboard(params);
                
                logger.info(`Updated dashboard ID ${params.dashboardid}`);
                return {
                    content: [{
                        type: 'text',
                        text: `Successfully updated dashboard ID ${params.dashboardid}`
                    }]
                };
            } catch (error) {
                const enhancedError = handleZabbixError(error, 'error_updating_dashboard', args);
                logger.error('Error updating dashboard::', enhancedError.message);
                logger.debug('Full error details:', enhancedError.details);
                throw new Error(enhancedError.message);
            }
        }
    );

    // Delete dashboards
    server.tool(
        'zabbix_delete_dashboards',
        'Delete dashboards from Zabbix',
        {
            dashboardids: z.array(z.string()).min(1).describe('Array of dashboard IDs to delete')
        },
        async (args) => {
            try {
                const { dashboardids } = args;
                
                const result = await api.deleteDashboards(dashboardids);
                
                logger.info(`Deleted ${dashboardids.length} dashboards`);
                return {
                    content: [{
                        type: 'text',
                        text: `Successfully deleted ${dashboardids.length} dashboards: ${dashboardids.join(', ')}`
                    }]
                };
            } catch (error) {
                const enhancedError = handleZabbixError(error, 'error_deleting_dashboards', args);
                logger.error('Error deleting dashboards::', enhancedError.message);
                logger.debug('Full error details:', enhancedError.details);
                throw new Error(enhancedError.message);
            }
        }
    );

    logger.info('Dashboards tools registered successfully');
}

module.exports = { registerTools }; 