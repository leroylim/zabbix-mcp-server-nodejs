const { logger } = require('../utils/logger');
const api = require('../api');
const { z } = require('zod');

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
                logger.error('Error getting dashboards:', error.message);
                throw error;
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
            display_period: z.number().int().min(10).max(31536000).optional().default(30).describe('Dashboard refresh interval in seconds'),
            auto_start: z.number().int().min(0).max(1).optional().default(1).describe('Automatically start dashboard slideshow: 0 (disabled), 1 (enabled)'),
            
            // Dashboard pages
            pages: z.array(z.object({
                name: z.string().optional().describe('Page name'),
                display_period: z.number().int().min(0).max(31536000).optional().describe('Page refresh interval in seconds (0 = use dashboard default)'),
                
                // Page widgets
                widgets: z.array(z.object({
                    type: z.string().describe('Widget type (e.g., "clock", "graph", "plaintext", "url")'),
                    name: z.string().optional().describe('Widget name'),
                    x: z.number().int().min(0).max(23).describe('Horizontal position of the widget (0-23)'),
                    y: z.number().int().min(0).max(62).describe('Vertical position of the widget (0-62)'),
                    width: z.number().int().min(1).max(24).describe('Width of the widget (1-24)'),
                    height: z.number().int().min(2).max(32).describe('Height of the widget (2-32)'),
                    view_mode: z.number().int().min(0).max(1).optional().default(0).describe('Widget view mode: 0 (default), 1 (hidden header)'),
                    
                    // Widget fields (configuration)
                    fields: z.array(z.object({
                        type: z.number().int().min(0).max(7).describe('Field type: 0 (integer), 1 (string), 2 (host group), 3 (host), 4 (item), 5 (item prototype), 6 (graph), 7 (graph prototype)'),
                        name: z.string().describe('Field name'),
                        value: z.union([z.string(), z.number()]).describe('Field value')
                    })).optional().describe('Widget configuration fields')
                })).optional().describe('Page widgets')
            })).min(1).describe('Dashboard pages'),
            
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
                logger.error('Error creating dashboard:', error.message);
                throw error;
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
            display_period: z.number().int().min(10).max(31536000).optional().describe('Dashboard refresh interval in seconds'),
            auto_start: z.number().int().min(0).max(1).optional().describe('Automatically start dashboard slideshow'),
            pages: z.array(z.object({
                dashboard_pageid: z.string().optional().describe('ID of existing page to update'),
                name: z.string().optional().describe('Page name'),
                display_period: z.number().int().min(0).max(31536000).optional().describe('Page refresh interval'),
                widgets: z.array(z.object({
                    widgetid: z.string().optional().describe('ID of existing widget to update'),
                    type: z.string().describe('Widget type'),
                    name: z.string().optional().describe('Widget name'),
                    x: z.number().int().min(0).max(23).describe('Horizontal position'),
                    y: z.number().int().min(0).max(62).describe('Vertical position'),
                    width: z.number().int().min(1).max(24).describe('Width'),
                    height: z.number().int().min(2).max(32).describe('Height'),
                    view_mode: z.number().int().min(0).max(1).optional().describe('Widget view mode'),
                    fields: z.array(z.object({
                        type: z.number().int().min(0).max(7).describe('Field type'),
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
                logger.error('Error updating dashboard:', error.message);
                throw error;
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
                logger.error('Error deleting dashboards:', error.message);
                throw error;
            }
        }
    );

    logger.info('Dashboards tools registered successfully');
}

module.exports = { registerTools }; 