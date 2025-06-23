const { logger } = require('../utils/logger');
const api = require('../api');
const { z } = require('zod');

function registerTools(server) {
    // Get value maps
    server.tool(
        'zabbix_get_value_maps',
        'Get value maps from Zabbix with filtering and output options',
        {
            valuemapids: z.array(z.string()).optional().describe('Return only value maps with the given IDs'),
            output: z.array(z.string()).optional().default(['valuemapid', 'name', 'hostid']).describe('Object properties to be returned'),
            selectMappings: z.array(z.string()).optional().describe('Return value mappings used by the value map'),
            filter: z.record(z.any()).optional().describe('Return only value maps that match the given filter'),
            search: z.record(z.any()).optional().describe('Return only value maps that match the given wildcard search'),
            sortfield: z.array(z.string()).optional().default(['name']).describe('Sort the result by the given properties'),
            sortorder: z.enum(['ASC', 'DESC']).optional().default('ASC').describe('Sort order'),
            limit: z.number().int().positive().optional().describe('Limit the number of records returned')
        },
        async (args) => {
            try {
                const params = { ...args };
                
                const apiParams = {
                    output: params.output || ['valuemapid', 'name', 'hostid'],
                    sortfield: params.sortfield || ['name'],
                    sortorder: params.sortorder || 'ASC'
                };

                if (params.valuemapids) apiParams.valuemapids = params.valuemapids;
                if (params.selectMappings) apiParams.selectMappings = params.selectMappings;
                if (params.filter) apiParams.filter = params.filter;
                if (params.search) apiParams.search = params.search;
                if (params.limit) apiParams.limit = params.limit;

                const valueMaps = await api.mapsApi.getValueMaps(apiParams);
                
                logger.info(`Retrieved ${valueMaps.length} value maps`);
                return {
                    content: [{
                        type: 'text',
                        text: `Found ${valueMaps.length} value maps:\n\n${JSON.stringify(valueMaps, null, 2)}`
                    }]
                };
            } catch (error) {
                logger.error('Error getting value maps:', error.message);
                throw error;
            }
        }
    );

    // Create value map
    server.tool(
        'zabbix_create_value_map',
        'Create a new value map in Zabbix for mapping numeric values to text',
        {
            name: z.string().min(1).describe('Name of the value map'),
            hostid: z.string().optional().describe('ID of the host or template to associate this value map with. If omitted, creates a global value map'),
            mappings: z.array(z.object({
                value: z.string().describe('Original value to be mapped'),
                newvalue: z.string().describe('Value to which the original value is mapped to'),
                type: z.number().int().min(0).max(4).optional().default(0).describe('Mapping type: 0 (exact match), 1 (greater than or equal), 2 (less than or equal), 3 (in range), 4 (regexp)')
            })).min(1).describe('Array of value mappings')
        },
        async (args) => {
            try {
                const params = { ...args };
                
                const result = await api.mapsApi.createValueMap(params);
                
                logger.info(`Created value map: ${params.name} (ID: ${result.valuemapids[0]})`);
                return {
                    content: [{
                        type: 'text',
                        text: `Successfully created value map "${params.name}" with ID: ${result.valuemapids[0]}`
                    }]
                };
            } catch (error) {
                logger.error('Error creating value map:', error.message);
                throw error;
            }
        }
    );

    // Update value map
    server.tool(
        'zabbix_update_value_map',
        'Update an existing value map in Zabbix',
        {
            valuemapid: z.string().describe('ID of the value map to update'),
            name: z.string().optional().describe('New name for the value map'),
            hostid: z.string().optional().describe('ID of the host or template to associate this value map with'),
            mappings: z.array(z.object({
                mappingid: z.string().optional().describe('ID of existing mapping to update'),
                value: z.string().describe('Original value to be mapped'),
                newvalue: z.string().describe('Value to which the original value is mapped to'),
                type: z.number().int().min(0).max(4).optional().default(0).describe('Mapping type')
            })).optional().describe('Array of value mappings (replaces all existing mappings)')
        },
        async (args) => {
            try {
                const params = { ...args };
                
                const result = await api.mapsApi.updateValueMap(params);
                
                logger.info(`Updated value map ID ${params.valuemapid}`);
                return {
                    content: [{
                        type: 'text',
                        text: `Successfully updated value map ID ${params.valuemapid}`
                    }]
                };
            } catch (error) {
                logger.error('Error updating value map:', error.message);
                throw error;
            }
        }
    );

    // Delete value maps
    server.tool(
        'zabbix_delete_value_maps',
        'Delete value maps from Zabbix',
        {
            valuemapids: z.array(z.string()).min(1).describe('Array of value map IDs to delete')
        },
        async (args) => {
            try {
                const { valuemapids } = args;
                
                const result = await api.mapsApi.deleteValueMaps(valuemapids);
                
                logger.info(`Deleted ${valuemapids.length} value maps`);
                return {
                    content: [{
                        type: 'text',
                        text: `Successfully deleted ${valuemapids.length} value maps: ${valuemapids.join(', ')}`
                    }]
                };
            } catch (error) {
                logger.error('Error deleting value maps:', error.message);
                throw error;
            }
        }
    );

    // Get icon maps
    server.tool(
        'zabbix_get_icon_maps',
        'Get icon maps from Zabbix with filtering and output options',
        {
            iconmapids: z.array(z.string()).optional().describe('Return only icon maps with the given IDs'),
            output: z.array(z.string()).optional().default(['iconmapid', 'name', 'default_iconid']).describe('Object properties to be returned'),
            selectMappings: z.array(z.string()).optional().describe('Return icon mappings used by the icon map'),
            filter: z.record(z.any()).optional().describe('Return only icon maps that match the given filter'),
            search: z.record(z.any()).optional().describe('Return only icon maps that match the given wildcard search'),
            sortfield: z.array(z.string()).optional().default(['name']).describe('Sort the result by the given properties'),
            sortorder: z.enum(['ASC', 'DESC']).optional().default('ASC').describe('Sort order'),
            limit: z.number().int().positive().optional().describe('Limit the number of records returned')
        },
        async (args) => {
            try {
                const params = { ...args };
                
                const apiParams = {
                    output: params.output || ['iconmapid', 'name', 'default_iconid'],
                    sortfield: params.sortfield || ['name'],
                    sortorder: params.sortorder || 'ASC'
                };

                if (params.iconmapids) apiParams.iconmapids = params.iconmapids;
                if (params.selectMappings) apiParams.selectMappings = params.selectMappings;
                if (params.filter) apiParams.filter = params.filter;
                if (params.search) apiParams.search = params.search;
                if (params.limit) apiParams.limit = params.limit;

                const iconMaps = await api.mapsApi.getIconMaps(apiParams);
                
                logger.info(`Retrieved ${iconMaps.length} icon maps`);
                return {
                    content: [{
                        type: 'text',
                        text: `Found ${iconMaps.length} icon maps:\n\n${JSON.stringify(iconMaps, null, 2)}`
                    }]
                };
            } catch (error) {
                logger.error('Error getting icon maps:', error.message);
                throw error;
            }
        }
    );

    // Create icon map
    server.tool(
        'zabbix_create_icon_map',
        'Create a new icon map in Zabbix for mapping inventory fields to icons',
        {
            name: z.string().min(1).describe('Name of the icon map'),
            default_iconid: z.string().describe('ID of the default icon'),
            mappings: z.array(z.object({
                inventory_link: z.number().int().min(1).max(70).describe('Host inventory field number (1-70)'),
                expression: z.string().describe('Expression to match against the inventory field'),
                iconid: z.string().describe('ID of the icon to use when expression matches')
            })).min(1).describe('Array of icon mappings')
        },
        async (args) => {
            try {
                const params = { ...args };
                
                const result = await api.mapsApi.createIconMap(params);
                
                logger.info(`Created icon map: ${params.name} (ID: ${result.iconmapids[0]})`);
                return {
                    content: [{
                        type: 'text',
                        text: `Successfully created icon map "${params.name}" with ID: ${result.iconmapids[0]}`
                    }]
                };
            } catch (error) {
                logger.error('Error creating icon map:', error.message);
                throw error;
            }
        }
    );

    // Update icon map
    server.tool(
        'zabbix_update_icon_map',
        'Update an existing icon map in Zabbix',
        {
            iconmapid: z.string().describe('ID of the icon map to update'),
            name: z.string().optional().describe('New name for the icon map'),
            default_iconid: z.string().optional().describe('ID of the default icon'),
            mappings: z.array(z.object({
                iconmappingid: z.string().optional().describe('ID of existing mapping to update'),
                inventory_link: z.number().int().min(1).max(70).describe('Host inventory field number'),
                expression: z.string().describe('Expression to match against the inventory field'),
                iconid: z.string().describe('ID of the icon to use when expression matches')
            })).optional().describe('Array of icon mappings (replaces all existing mappings)')
        },
        async (args) => {
            try {
                const params = { ...args };
                
                const result = await api.mapsApi.updateIconMap(params);
                
                logger.info(`Updated icon map ID ${params.iconmapid}`);
                return {
                    content: [{
                        type: 'text',
                        text: `Successfully updated icon map ID ${params.iconmapid}`
                    }]
                };
            } catch (error) {
                logger.error('Error updating icon map:', error.message);
                throw error;
            }
        }
    );

    // Delete icon maps
    server.tool(
        'zabbix_delete_icon_maps',
        'Delete icon maps from Zabbix',
        {
            iconmapids: z.array(z.string()).min(1).describe('Array of icon map IDs to delete')
        },
        async (args) => {
            try {
                const { iconmapids } = args;
                
                const result = await api.mapsApi.deleteIconMaps(iconmapids);
                
                logger.info(`Deleted ${iconmapids.length} icon maps`);
                return {
                    content: [{
                        type: 'text',
                        text: `Successfully deleted ${iconmapids.length} icon maps: ${iconmapids.join(', ')}`
                    }]
                };
            } catch (error) {
                logger.error('Error deleting icon maps:', error.message);
                throw error;
            }
        }
    );

    // Get network maps
    server.tool(
        'zabbix_get_maps',
        'Get network maps from Zabbix with filtering and output options',
        {
            sysmapids: z.array(z.string()).optional().describe('Return only maps with the given IDs'),
            userids: z.array(z.string()).optional().describe('Return only maps that belong to the given users'),
            output: z.array(z.string()).optional().default(['sysmapid', 'name', 'width', 'height', 'backgroundid', 'label_type', 'label_location']).describe('Object properties to be returned'),
            selectSelements: z.array(z.string()).optional().describe('Return map elements'),
            selectLinks: z.array(z.string()).optional().describe('Return map links'),
            selectIconMap: z.array(z.string()).optional().describe('Return icon map used by the map'),
            selectUrls: z.array(z.string()).optional().describe('Return map URLs'),
            selectUsers: z.array(z.string()).optional().describe('Return users that have access to the map'),
            selectUserGroups: z.array(z.string()).optional().describe('Return user groups that have access to the map'),
            selectShapes: z.array(z.string()).optional().describe('Return map shapes'),
            selectLines: z.array(z.string()).optional().describe('Return map lines'),
            filter: z.record(z.any()).optional().describe('Return only maps that match the given filter'),
            search: z.record(z.any()).optional().describe('Return only maps that match the given wildcard search'),
            sortfield: z.array(z.string()).optional().default(['name']).describe('Sort the result by the given properties'),
            sortorder: z.enum(['ASC', 'DESC']).optional().default('ASC').describe('Sort order'),
            limit: z.number().int().positive().optional().describe('Limit the number of records returned')
        },
        async (args) => {
            try {
                const params = { ...args };
                
                const apiParams = {
                    output: params.output || ['sysmapid', 'name', 'width', 'height', 'backgroundid', 'label_type', 'label_location'],
                    sortfield: params.sortfield || ['name'],
                    sortorder: params.sortorder || 'ASC'
                };

                if (params.sysmapids) apiParams.sysmapids = params.sysmapids;
                if (params.userids) apiParams.userids = params.userids;
                if (params.selectSelements) apiParams.selectSelements = params.selectSelements;
                if (params.selectLinks) apiParams.selectLinks = params.selectLinks;
                if (params.selectIconMap) apiParams.selectIconMap = params.selectIconMap;
                if (params.selectUrls) apiParams.selectUrls = params.selectUrls;
                if (params.selectUsers) apiParams.selectUsers = params.selectUsers;
                if (params.selectUserGroups) apiParams.selectUserGroups = params.selectUserGroups;
                if (params.selectShapes) apiParams.selectShapes = params.selectShapes;
                if (params.selectLines) apiParams.selectLines = params.selectLines;
                if (params.filter) apiParams.filter = params.filter;
                if (params.search) apiParams.search = params.search;
                if (params.limit) apiParams.limit = params.limit;

                const maps = await api.mapsApi.getMaps(apiParams);
                
                logger.info(`Retrieved ${maps.length} network maps`);
                return {
                    content: [{
                        type: 'text',
                        text: `Found ${maps.length} network maps:\n\n${JSON.stringify(maps, null, 2)}`
                    }]
                };
            } catch (error) {
                logger.error('Error getting network maps:', error.message);
                throw error;
            }
        }
    );

    // Create network map
    server.tool(
        'zabbix_create_map',
        'Create a new network map in Zabbix for network topology visualization',
        {
            name: z.string().min(1).describe('Name of the map'),
            width: z.number().int().min(1).describe('Width of the map in pixels'),
            height: z.number().int().min(1).describe('Height of the map in pixels'),
            backgroundid: z.string().optional().describe('ID of the background image'),
            iconmapid: z.string().optional().describe('ID of the icon map'),
            label_type: z.number().int().min(0).max(4).optional().default(2).describe('Map element label type: 0 (label), 1 (IP address), 2 (element name), 3 (status only), 4 (nothing)'),
            label_location: z.number().int().min(0).max(3).optional().default(0).describe('Map element label location: 0 (bottom), 1 (left), 2 (right), 3 (top)'),
            highlight: z.number().int().min(0).max(1).optional().default(1).describe('Whether to highlight map elements: 0 (disabled), 1 (enabled)'),
            markelements: z.number().int().min(0).max(1).optional().default(0).describe('Whether to mark map elements: 0 (disabled), 1 (enabled)'),
            expandproblem: z.number().int().min(0).max(1).optional().default(1).describe('Whether to expand single problem: 0 (disabled), 1 (enabled)'),
            show_unack: z.number().int().min(0).max(2).optional().default(0).describe('How to show unacknowledged problems: 0 (disabled), 1 (separated), 2 (unacknowledged count)'),
            grid_size: z.number().int().min(0).max(100).optional().default(50).describe('Size of the grid'),
            grid_show: z.number().int().min(0).max(1).optional().default(1).describe('Whether to show grid: 0 (disabled), 1 (enabled)'),
            grid_align: z.number().int().min(0).max(1).optional().default(1).describe('Whether to align to grid: 0 (disabled), 1 (enabled)'),
            label_format: z.number().int().min(0).max(1).optional().default(0).describe('Advanced label formatting: 0 (disabled), 1 (enabled)'),
            label_type_host: z.number().int().min(0).max(4).optional().describe('Host label type'),
            label_type_hostgroup: z.number().int().min(0).max(4).optional().describe('Host group label type'),
            label_type_trigger: z.number().int().min(0).max(4).optional().describe('Trigger label type'),
            label_type_map: z.number().int().min(0).max(4).optional().describe('Map label type'),
            label_type_image: z.number().int().min(0).max(4).optional().describe('Image label type'),
            label_string_host: z.string().optional().describe('Host label string'),
            label_string_hostgroup: z.string().optional().describe('Host group label string'),
            label_string_trigger: z.string().optional().describe('Trigger label string'),
            label_string_map: z.string().optional().describe('Map label string'),
            label_string_image: z.string().optional().describe('Image label string'),
            userid: z.string().optional().describe('ID of the user that owns the map'),
            private: z.number().int().min(0).max(1).optional().default(1).describe('Map sharing type: 0 (public), 1 (private)'),
            
            // Map elements
            selements: z.array(z.object({
                elementtype: z.number().int().min(0).max(4).describe('Element type: 0 (host), 1 (map), 2 (trigger), 3 (host group), 4 (image)'),
                iconid_off: z.string().describe('ID of the icon used to display the element in default state'),
                iconid_on: z.string().optional().describe('ID of the icon used to display the element in problem state'),
                iconid_disabled: z.string().optional().describe('ID of the icon used to display disabled element'),
                iconid_maintenance: z.string().optional().describe('ID of the icon used to display element in maintenance'),
                label: z.string().optional().describe('Label of the element'),
                label_location: z.number().int().min(-1).max(3).optional().describe('Label location relative to element'),
                x: z.number().int().min(0).describe('X coordinate of the element'),
                y: z.number().int().min(0).describe('Y coordinate of the element'),
                elementid: z.string().optional().describe('ID of the object represented by the element'),
                areatype: z.number().int().min(0).max(1).optional().describe('How the element area is defined: 0 (automatic), 1 (custom)'),
                width: z.number().int().optional().describe('Width of the element area'),
                height: z.number().int().optional().describe('Height of the element area'),
                viewtype: z.number().int().min(0).max(1).optional().describe('Element placement algorithm: 0 (automatic), 1 (manual)'),
                use_iconmap: z.number().int().min(0).max(1).optional().describe('Whether to use icon mapping: 0 (disabled), 1 (enabled)'),
                
                // Element URLs
                urls: z.array(z.object({
                    name: z.string().describe('Link caption'),
                    url: z.string().describe('Link URL'),
                    elementtype: z.number().int().min(0).max(4).optional().describe('Type of map element the URL belongs to')
                })).optional().describe('Element URLs'),
                
                // Element tags
                evaltype: z.number().int().min(0).max(2).optional().describe('Tag evaluation type: 0 (and/or), 1 (or), 2 (and)'),
                tags: z.array(z.object({
                    tag: z.string().describe('Tag name'),
                    value: z.string().optional().describe('Tag value'),
                    operator: z.number().int().min(0).max(7).optional().describe('Tag operator')
                })).optional().describe('Element tags for filtering')
            })).optional().describe('Map elements'),
            
            // Map links
            links: z.array(z.object({
                selementid1: z.string().describe('ID of the first map element'),
                selementid2: z.string().describe('ID of the second map element'),
                drawtype: z.number().int().min(0).max(4).optional().default(0).describe('Link line draw type: 0 (line), 1 (bold line), 2 (dot), 3 (dashed line), 4 (bold dashed line)'),
                color: z.string().optional().default('000000').describe('Link line color as a hexadecimal color code'),
                label: z.string().optional().describe('Link label'),
                
                // Link triggers
                linktriggers: z.array(z.object({
                    triggerid: z.string().describe('ID of the trigger'),
                    drawtype: z.number().int().min(0).max(4).optional().describe('Link line draw type when trigger is in problem state'),
                    color: z.string().optional().describe('Link line color when trigger is in problem state')
                })).optional().describe('Link triggers')
            })).optional().describe('Map links'),
            
            // Map shapes
            shapes: z.array(z.object({
                type: z.number().int().min(0).max(1).describe('Shape type: 0 (rectangle), 1 (ellipse)'),
                x: z.number().int().min(0).describe('X coordinate of the shape'),
                y: z.number().int().min(0).describe('Y coordinate of the shape'),
                width: z.number().int().min(0).describe('Width of the shape'),
                height: z.number().int().min(0).describe('Height of the shape'),
                text: z.string().optional().describe('Shape text'),
                font: z.number().int().min(0).max(5).optional().default(9).describe('Shape text font'),
                font_size: z.number().int().min(1).max(100).optional().default(11).describe('Shape text font size'),
                font_color: z.string().optional().default('000000').describe('Shape text color'),
                text_halign: z.number().int().min(0).max(2).optional().default(0).describe('Horizontal text alignment: 0 (center), 1 (left), 2 (right)'),
                text_valign: z.number().int().min(0).max(2).optional().default(0).describe('Vertical text alignment: 0 (center), 1 (top), 2 (bottom)'),
                border_type: z.number().int().min(0).max(4).optional().default(0).describe('Shape border line type'),
                border_width: z.number().int().min(0).max(100).optional().default(1).describe('Shape border width'),
                border_color: z.string().optional().default('000000').describe('Shape border color'),
                background_color: z.string().optional().describe('Shape background color'),
                zindex: z.number().int().min(0).optional().default(0).describe('Shape z-index')
            })).optional().describe('Map shapes'),
            
            // Map lines
            lines: z.array(z.object({
                x1: z.number().int().min(0).describe('X coordinate of the first point'),
                y1: z.number().int().min(0).describe('Y coordinate of the first point'),
                x2: z.number().int().min(0).describe('X coordinate of the second point'),
                y2: z.number().int().min(0).describe('Y coordinate of the second point'),
                line_type: z.number().int().min(0).max(4).optional().default(0).describe('Line type'),
                line_width: z.number().int().min(0).max(100).optional().default(1).describe('Line width'),
                line_color: z.string().optional().default('000000').describe('Line color'),
                zindex: z.number().int().min(0).optional().default(0).describe('Line z-index')
            })).optional().describe('Map lines'),
            
            // Map URLs
            urls: z.array(z.object({
                name: z.string().describe('URL caption'),
                url: z.string().describe('URL'),
                elementtype: z.number().int().min(0).max(4).optional().describe('Type of map element the URL belongs to')
            })).optional().describe('Map URLs'),
            
            // User permissions
            users: z.array(z.object({
                userid: z.string().describe('User ID'),
                permission: z.number().int().min(2).max(3).describe('Access level: 2 (read-only), 3 (read-write)')
            })).optional().describe('Map user permissions'),
            
            userGroups: z.array(z.object({
                usrgrpid: z.string().describe('User group ID'),
                permission: z.number().int().min(2).max(3).describe('Access level: 2 (read-only), 3 (read-write)')
            })).optional().describe('Map user group permissions')
        },
        async (args) => {
            try {
                const params = { ...args };
                
                const result = await api.mapsApi.createMap(params);
                
                logger.info(`Created network map: ${params.name} (ID: ${result.sysmapids[0]})`);
                return {
                    content: [{
                        type: 'text',
                        text: `Successfully created network map "${params.name}" with ID: ${result.sysmapids[0]}`
                    }]
                };
            } catch (error) {
                logger.error('Error creating network map:', error.message);
                throw error;
            }
        }
    );

    // Update network map
    server.tool(
        'zabbix_update_map',
        'Update an existing network map in Zabbix',
        {
            sysmapid: z.string().describe('ID of the map to update'),
            name: z.string().optional().describe('New name for the map'),
            width: z.number().int().min(1).optional().describe('New width of the map in pixels'),
            height: z.number().int().min(1).optional().describe('New height of the map in pixels'),
            backgroundid: z.string().optional().describe('ID of the background image'),
            iconmapid: z.string().optional().describe('ID of the icon map'),
            label_type: z.number().int().min(0).max(4).optional().describe('Map element label type'),
            label_location: z.number().int().min(0).max(3).optional().describe('Map element label location'),
            selements: z.array(z.record(z.any())).optional().describe('Map elements (replaces all existing elements)'),
            links: z.array(z.record(z.any())).optional().describe('Map links (replaces all existing links)'),
            shapes: z.array(z.record(z.any())).optional().describe('Map shapes (replaces all existing shapes)'),
            lines: z.array(z.record(z.any())).optional().describe('Map lines (replaces all existing lines)'),
            urls: z.array(z.record(z.any())).optional().describe('Map URLs (replaces all existing URLs)'),
            users: z.array(z.record(z.any())).optional().describe('Map user permissions (replaces all existing permissions)'),
            userGroups: z.array(z.record(z.any())).optional().describe('Map user group permissions (replaces all existing permissions)')
        },
        async (args) => {
            try {
                const params = { ...args };
                
                const result = await api.mapsApi.updateMap(params);
                
                logger.info(`Updated network map ID ${params.sysmapid}`);
                return {
                    content: [{
                        type: 'text',
                        text: `Successfully updated network map ID ${params.sysmapid}`
                    }]
                };
            } catch (error) {
                logger.error('Error updating network map:', error.message);
                throw error;
            }
        }
    );

    // Delete network maps
    server.tool(
        'zabbix_delete_maps',
        'Delete network maps from Zabbix',
        {
            sysmapids: z.array(z.string()).min(1).describe('Array of network map IDs to delete')
        },
        async (args) => {
            try {
                const { sysmapids } = args;
                
                const result = await api.mapsApi.deleteMaps(sysmapids);
                
                logger.info(`Deleted ${sysmapids.length} network maps`);
                return {
                    content: [{
                        type: 'text',
                        text: `Successfully deleted ${sysmapids.length} network maps: ${sysmapids.join(', ')}`
                    }]
                };
            } catch (error) {
                logger.error('Error deleting network maps:', error.message);
                throw error;
            }
        }
    );

    logger.info('Maps tools registered successfully');
}

module.exports = { registerTools }; 