const { logger } = require('../utils/logger');
const api = require('../api');
const { z } = require('zod');

function registerTools(server) {
    // Export configuration
    server.tool(
        'zabbix_export_configuration',
        'Export Zabbix configuration as XML or JSON',
        {
            format: z.enum(['xml', 'json']).describe('Export format'),
            options: z.object({
                hosts: z.array(z.string()).optional().describe('Array of host IDs to export'),
                templates: z.array(z.string()).optional().describe('Array of template IDs to export'),
                host_groups: z.array(z.string()).optional().describe('Array of host group IDs to export'),
                value_maps: z.array(z.string()).optional().describe('Array of value map IDs to export'),
                maps: z.array(z.string()).optional().describe('Array of map IDs to export'),
                images: z.array(z.string()).optional().describe('Array of image IDs to export'),
                media_types: z.array(z.string()).optional().describe('Array of media type IDs to export'),
                dashboards: z.array(z.string()).optional().describe('Array of dashboard IDs to export'),
                actions: z.array(z.string()).optional().describe('Array of action IDs to export'),
                triggers: z.array(z.string()).optional().describe('Array of trigger IDs to export'),
                items: z.array(z.string()).optional().describe('Array of item IDs to export'),
                graphs: z.array(z.string()).optional().describe('Array of graph IDs to export'),
                services: z.array(z.string()).optional().describe('Array of service IDs to export'),
                proxy_groups: z.array(z.string()).optional().describe('Array of proxy group IDs to export'),
                proxies: z.array(z.string()).optional().describe('Array of proxy IDs to export')
            }).refine(data => Object.keys(data).length > 0, {
                message: "At least one entity type must be specified for export"
            }).describe('Specifies which configuration objects to export')
        },
        async (args) => {
            try {
                const { format, options } = args;
                
                const params = {
                    format,
                    options
                };

                const exportedConfig = await api.configurationApi.exportConfiguration(params);
                
                logger.info(`Exported configuration in ${format} format`);
                return {
                    content: [{
                        type: 'text',
                        text: `Successfully exported configuration in ${format} format:\n\n${exportedConfig}`
                    }]
                };
            } catch (error) {
                logger.error('Error exporting configuration:', error.message);
                throw error;
            }
        }
    );

    // Import configuration
    server.tool(
        'zabbix_import_configuration',
        'Import Zabbix configuration from XML or JSON',
        {
            format: z.enum(['xml', 'json']).describe('Import format'),
            source: z.string().min(1).describe('The XML or JSON string containing the configuration to import'),
            rules: z.object({
                // Host rules
                hosts: z.object({
                    createMissing: z.boolean().optional().describe('Create missing hosts'),
                    updateExisting: z.boolean().optional().describe('Update existing hosts'),
                    deleteMissing: z.boolean().optional().describe('Delete missing hosts')
                }).optional(),
                
                // Template rules
                templates: z.object({
                    createMissing: z.boolean().optional().describe('Create missing templates'),
                    updateExisting: z.boolean().optional().describe('Update existing templates'),
                    deleteMissing: z.boolean().optional().describe('Delete missing templates')
                }).optional(),
                
                // Host group rules
                groups: z.object({
                    createMissing: z.boolean().optional().describe('Create missing host groups'),
                    updateExisting: z.boolean().optional().describe('Update existing host groups')
                }).optional(),
                
                // Item rules
                items: z.object({
                    createMissing: z.boolean().optional().describe('Create missing items'),
                    updateExisting: z.boolean().optional().describe('Update existing items'),
                    deleteMissing: z.boolean().optional().describe('Delete missing items')
                }).optional(),
                
                // Trigger rules
                triggers: z.object({
                    createMissing: z.boolean().optional().describe('Create missing triggers'),
                    updateExisting: z.boolean().optional().describe('Update existing triggers'),
                    deleteMissing: z.boolean().optional().describe('Delete missing triggers')
                }).optional(),
                
                // Graph rules
                graphs: z.object({
                    createMissing: z.boolean().optional().describe('Create missing graphs'),
                    updateExisting: z.boolean().optional().describe('Update existing graphs'),
                    deleteMissing: z.boolean().optional().describe('Delete missing graphs')
                }).optional(),
                
                // Value map rules
                valueMaps: z.object({
                    createMissing: z.boolean().optional().describe('Create missing value maps'),
                    updateExisting: z.boolean().optional().describe('Update existing value maps'),
                    deleteMissing: z.boolean().optional().describe('Delete missing value maps')
                }).optional(),
                
                // Map rules
                maps: z.object({
                    createMissing: z.boolean().optional().describe('Create missing maps'),
                    updateExisting: z.boolean().optional().describe('Update existing maps')
                }).optional(),
                
                // Image rules
                images: z.object({
                    createMissing: z.boolean().optional().describe('Create missing images'),
                    updateExisting: z.boolean().optional().describe('Update existing images')
                }).optional(),
                
                // Media type rules
                mediaTypes: z.object({
                    createMissing: z.boolean().optional().describe('Create missing media types'),
                    updateExisting: z.boolean().optional().describe('Update existing media types')
                }).optional(),
                
                // Dashboard rules
                dashboards: z.object({
                    createMissing: z.boolean().optional().describe('Create missing dashboards'),
                    updateExisting: z.boolean().optional().describe('Update existing dashboards'),
                    deleteMissing: z.boolean().optional().describe('Delete missing dashboards')
                }).optional(),
                
                // Template dashboard rules
                templateDashboards: z.object({
                    createMissing: z.boolean().optional().describe('Create missing template dashboards'),
                    updateExisting: z.boolean().optional().describe('Update existing template dashboards'),
                    deleteMissing: z.boolean().optional().describe('Delete missing template dashboards')
                }).optional()
            }).describe('Rules for how to import (e.g., createMissing, updateExisting)')
        },
        async (args) => {
            try {
                const { format, source, rules } = args;
                
                const params = {
                    format,
                    source,
                    rules
                };

                const result = await api.configurationApi.importConfiguration(params);
                
                logger.info(`Imported configuration from ${format} format`);
                return {
                    content: [{
                        type: 'text',
                        text: `Successfully imported configuration:\n\n${JSON.stringify(result, null, 2)}`
                    }]
                };
            } catch (error) {
                logger.error('Error importing configuration:', error.message);
                throw error;
            }
        }
    );

    // Import compare configuration
    server.tool(
        'zabbix_import_compare_configuration',
        'Compare configuration for import without actually importing',
        {
            format: z.enum(['xml', 'json']).describe('Import format'),
            source: z.string().min(1).describe('The XML or JSON string containing the configuration to compare'),
            rules: z.object({
                hosts: z.object({
                    createMissing: z.boolean().optional().describe('Create missing hosts'),
                    updateExisting: z.boolean().optional().describe('Update existing hosts'),
                    deleteMissing: z.boolean().optional().describe('Delete missing hosts')
                }).optional(),
                templates: z.object({
                    createMissing: z.boolean().optional().describe('Create missing templates'),
                    updateExisting: z.boolean().optional().describe('Update existing templates'),
                    deleteMissing: z.boolean().optional().describe('Delete missing templates')
                }).optional(),
                groups: z.object({
                    createMissing: z.boolean().optional().describe('Create missing host groups'),
                    updateExisting: z.boolean().optional().describe('Update existing host groups')
                }).optional(),
                items: z.object({
                    createMissing: z.boolean().optional().describe('Create missing items'),
                    updateExisting: z.boolean().optional().describe('Update existing items'),
                    deleteMissing: z.boolean().optional().describe('Delete missing items')
                }).optional(),
                triggers: z.object({
                    createMissing: z.boolean().optional().describe('Create missing triggers'),
                    updateExisting: z.boolean().optional().describe('Update existing triggers'),
                    deleteMissing: z.boolean().optional().describe('Delete missing triggers')
                }).optional(),
                graphs: z.object({
                    createMissing: z.boolean().optional().describe('Create missing graphs'),
                    updateExisting: z.boolean().optional().describe('Update existing graphs'),
                    deleteMissing: z.boolean().optional().describe('Delete missing graphs')
                }).optional(),
                valueMaps: z.object({
                    createMissing: z.boolean().optional().describe('Create missing value maps'),
                    updateExisting: z.boolean().optional().describe('Update existing value maps'),
                    deleteMissing: z.boolean().optional().describe('Delete missing value maps')
                }).optional(),
                maps: z.object({
                    createMissing: z.boolean().optional().describe('Create missing maps'),
                    updateExisting: z.boolean().optional().describe('Update existing maps')
                }).optional(),
                images: z.object({
                    createMissing: z.boolean().optional().describe('Create missing images'),
                    updateExisting: z.boolean().optional().describe('Update existing images')
                }).optional(),
                mediaTypes: z.object({
                    createMissing: z.boolean().optional().describe('Create missing media types'),
                    updateExisting: z.boolean().optional().describe('Update existing media types')
                }).optional(),
                dashboards: z.object({
                    createMissing: z.boolean().optional().describe('Create missing dashboards'),
                    updateExisting: z.boolean().optional().describe('Update existing dashboards'),
                    deleteMissing: z.boolean().optional().describe('Delete missing dashboards')
                }).optional(),
                templateDashboards: z.object({
                    createMissing: z.boolean().optional().describe('Create missing template dashboards'),
                    updateExisting: z.boolean().optional().describe('Update existing template dashboards'),
                    deleteMissing: z.boolean().optional().describe('Delete missing template dashboards')
                }).optional()
            }).describe('Rules defining how to compare (e.g., createMissing, updateExisting)')
        },
        async (args) => {
            try {
                const { format, source, rules } = args;
                
                const params = {
                    format,
                    source,
                    rules
                };

                const result = await api.configurationApi.importCompare(params);
                
                logger.info(`Compared configuration from ${format} format`);
                return {
                    content: [{
                        type: 'text',
                        text: `Configuration comparison results:\n\n${JSON.stringify(result, null, 2)}`
                    }]
                };
            } catch (error) {
                logger.error('Error comparing configuration:', error.message);
                throw error;
            }
        }
    );

    logger.info('Configuration tools registered successfully');
}

module.exports = { registerTools }; 