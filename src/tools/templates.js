const { logger } = require('../utils/logger');
const api = require('../api');
const { z } = require('zod');
const { handleZabbixError } = require('../utils/errors');

// Template tag schema based on official API
const templateTagSchema = z.object({
    tag: z.string().min(1).describe('Template tag name'),
    value: z.string().optional().default('').describe('Template tag value')
});

// Enhanced template schema with all official properties
const templateSchema = z.object({
    templateid: z.string().optional().describe('ID of the template (read-only for updates)'),
    host: z.string().min(1).describe('Technical name of the template'),
    description: z.string().optional().default('').describe('Description of the template'),
    name: z.string().optional().describe('Visible name of the template (defaults to host property value)'),
    uuid: z.string().optional().describe('Universal unique identifier for template linking and imports'),
    vendor_name: z.string().optional().describe('Template vendor name for enterprise template management'),
    vendor_version: z.string().optional().describe('Template vendor version for version control'),
    
    // Template groups relationship
    groups: z.array(z.object({
        groupid: z.string().describe('Host group ID')
    })).optional().describe('Host groups that the template belongs to'),
    
    // Template tags for organization
    tags: z.array(templateTagSchema).optional().describe('Template tags for organization and filtering')
});

function registerTools(server) {
    // Get templates with comprehensive filtering and selection
    server.tool(
        'zabbix_get_templates',
        'Get templates from Zabbix with filtering and output options',
        {
            templateids: z.array(z.string()).optional().describe('Return only templates with the given template IDs'),
            hostids: z.array(z.string()).optional().describe('Return only templates that are linked to the given hosts'),
            groupids: z.array(z.string()).optional().describe('Return only templates that belong to the given host groups'),
            
            // Enhanced output options
            output: z.array(z.string()).optional().default(['templateid', 'host', 'name', 'description']).describe('Object properties to be returned'),
            
            // Advanced selection options
            selectGroups: z.array(z.string()).optional().describe('Return host groups that the template belongs to'),
            selectHosts: z.array(z.string()).optional().describe('Return hosts that are linked to the template'),
            selectTags: z.array(z.string()).optional().describe('Return template tags'),
            selectParentTemplates: z.array(z.string()).optional().describe('Return templates that this template inherits from'),
            selectTemplates: z.array(z.string()).optional().describe('Return templates that inherit from this template'),
            selectItems: z.array(z.string()).optional().describe('Return items from the template'),
            selectTriggers: z.array(z.string()).optional().describe('Return triggers from the template'),
            selectGraphs: z.array(z.string()).optional().describe('Return graphs from the template'),
            selectDiscoveryRules: z.array(z.string()).optional().describe('Return discovery rules from the template'),
            selectWebScenarios: z.array(z.string()).optional().describe('Return web scenarios from the template'),
            selectMacros: z.array(z.string()).optional().describe('Return macros from the template'),
            
            // Enhanced filtering options
            filter: z.record(z.any()).optional().describe('Return only templates that match the given filter'),
            search: z.record(z.any()).optional().describe('Return only templates that match the given wildcard search'),
            
            // Tag-based filtering
            tags: z.array(z.object({
                tag: z.string().describe('Tag name'),
                value: z.string().optional().describe('Tag value'),
                operator: z.enum(['0', '1', '2', '3']).optional().describe('Tag operator: 0 (like), 1 (equal), 2 (not like), 3 (not equal)')
            })).optional().describe('Return only templates with given tags'),
            evaltype: z.enum(['0', '2']).optional().describe('Tag evaluation type: 0 (AND/OR), 2 (OR)'),
            
            // Inheritance filtering
            inherited: z.boolean().optional().describe('Return templates inherited from parent templates'),
            
            // Sorting and limiting
            sortfield: z.array(z.string()).optional().default(['name']).describe('Sort the result by the given properties'),
            sortorder: z.enum(['ASC', 'DESC']).optional().default('ASC').describe('Sort order'),
            limit: z.number().int().positive().optional().describe('Limit the number of records returned'),
            
            // Search options
            searchByAny: z.boolean().optional().describe('Return results that match any of the criteria in search'),
            startSearch: z.boolean().optional().describe('Return results that start with the criteria in search'),
            excludeSearch: z.boolean().optional().describe('Return results that do not match the criteria in search'),
            searchWildcardsEnabled: z.boolean().optional().describe('Return results that contain wildcards'),
            
            // Count option
            countOutput: z.boolean().optional().describe('Return count of templates instead of template data'),
            preservekeys: z.boolean().optional().describe('Use template IDs as keys in the resulting array')
        },
        async (args) => {
            try {
                const params = { ...args };
                
                const apiParams = {
                    output: params.output || ['templateid', 'host', 'name', 'description'],
                    sortfield: params.sortfield || ['name'],
                    sortorder: params.sortorder || 'ASC'
                };

                // Basic filtering
                if (params.templateids) apiParams.templateids = params.templateids;
                if (params.hostids) apiParams.hostids = params.hostids;
                if (params.groupids) apiParams.groupids = params.groupids;
                
                // Selection options
                if (params.selectGroups) apiParams.selectGroups = params.selectGroups;
                if (params.selectHosts) apiParams.selectHosts = params.selectHosts;
                if (params.selectTags) apiParams.selectTags = params.selectTags;
                if (params.selectParentTemplates) apiParams.selectParentTemplates = params.selectParentTemplates;
                if (params.selectTemplates) apiParams.selectTemplates = params.selectTemplates;
                if (params.selectItems) apiParams.selectItems = params.selectItems;
                if (params.selectTriggers) apiParams.selectTriggers = params.selectTriggers;
                if (params.selectGraphs) apiParams.selectGraphs = params.selectGraphs;
                if (params.selectDiscoveryRules) apiParams.selectDiscoveryRules = params.selectDiscoveryRules;
                if (params.selectWebScenarios) apiParams.selectWebScenarios = params.selectWebScenarios;
                if (params.selectMacros) apiParams.selectMacros = params.selectMacros;
                
                // Filtering options
                if (params.filter) apiParams.filter = params.filter;
                if (params.search) apiParams.search = params.search;
                if (params.tags) apiParams.tags = params.tags;
                if (params.evaltype) apiParams.evaltype = params.evaltype;
                if (params.inherited !== undefined) apiParams.inherited = params.inherited;
                
                // Search options
                if (params.searchByAny !== undefined) apiParams.searchByAny = params.searchByAny;
                if (params.startSearch !== undefined) apiParams.startSearch = params.startSearch;
                if (params.excludeSearch !== undefined) apiParams.excludeSearch = params.excludeSearch;
                if (params.searchWildcardsEnabled !== undefined) apiParams.searchWildcardsEnabled = params.searchWildcardsEnabled;
                
                // Output options
                if (params.countOutput) apiParams.countOutput = params.countOutput;
                if (params.preservekeys !== undefined) apiParams.preservekeys = params.preservekeys;
                if (params.limit) apiParams.limit = params.limit;

                const templates = await api.getTemplates(apiParams);
                
                if (params.countOutput) {
                    logger.info(`Template count: ${templates}`);
                    return {
                        content: [{
                            type: 'text',
                            text: `Template count: ${templates}`
                        }]
                    };
                } else {
                    logger.info(`Retrieved ${templates.length} templates`);
                    return {
                        content: [{
                            type: 'text',
                            text: `Found ${templates.length} templates:\n\n${JSON.stringify(templates, null, 2)}`
                        }]
                    };
                }
            } catch (error) {
                const enhancedError = handleZabbixError(error, 'error_getting_templates', args);
                logger.error('Error getting templates:', enhancedError.message);
                logger.debug('Full error details:', enhancedError.details);
                throw new Error(enhancedError.message);
            }
        }
    );

    // Create template with enhanced properties
    server.tool(
        'zabbix_create_template',
        'Create a new template in Zabbix with comprehensive properties',
        {
            host: z.string().min(1).describe('Technical name of the template'),
            name: z.string().optional().describe('Visible name of the template'),
            description: z.string().optional().describe('Description of the template'),
            uuid: z.string().optional().describe('Universal unique identifier for template linking'),
            vendor_name: z.string().optional().describe('Template vendor name'),
            vendor_version: z.string().optional().describe('Template vendor version'),
            groups: z.array(z.object({
                groupid: z.string()
            })).min(1).describe('Host groups that the template belongs to'),
            tags: z.array(templateTagSchema).optional().describe('Template tags for organization'),
            templates: z.array(z.object({
                templateid: z.string()
            })).optional().describe('Templates that this template should inherit from')
        },
        async (args) => {
            try {
                const params = { ...args };
                
                // Validate vendor information consistency
                if ((params.vendor_name && !params.vendor_version) || (!params.vendor_name && params.vendor_version)) {
                    throw new Error('Both vendor_name and vendor_version must be provided together or both left empty');
                }
                
                const result = await api.createTemplate(params);
                
                logger.info(`Created template: ${params.host} (ID: ${result.templateids[0]})`);
                return {
                    content: [{
                        type: 'text',
                        text: `Successfully created template "${params.host}" with ID: ${result.templateids[0]}`
                    }]
                };
            } catch (error) {
                const enhancedError = handleZabbixError(error, 'error_creating_template', args);
                logger.error('Error creating template:', enhancedError.message);
                logger.debug('Full error details:', enhancedError.details);
                throw new Error(enhancedError.message);
            }
        }
    );

    // Update template with enhanced properties
    server.tool(
        'zabbix_update_template',
        'Update an existing template in Zabbix with comprehensive properties',
        {
            templateid: z.string().describe('ID of the template to update'),
            host: z.string().optional().describe('Technical name of the template'),
            name: z.string().optional().describe('Visible name of the template'),
            description: z.string().optional().describe('Description of the template'),
            uuid: z.string().optional().describe('Universal unique identifier for template linking'),
            vendor_name: z.string().optional().describe('Template vendor name'),
            vendor_version: z.string().optional().describe('Template vendor version'),
            groups: z.array(z.object({
                groupid: z.string()
            })).optional().describe('Host groups that the template belongs to'),
            tags: z.array(templateTagSchema).optional().describe('Template tags for organization'),
            templates: z.array(z.object({
                templateid: z.string()
            })).optional().describe('Templates that this template should inherit from'),
            templates_clear: z.array(z.object({
                templateid: z.string()
            })).optional().describe('Templates to unlink from this template')
        },
        async (args) => {
            try {
                const params = { ...args };
                
                const result = await api.updateTemplate(params);
                
                logger.info(`Updated template ID ${params.templateid}`);
                return {
                    content: [{
                        type: 'text',
                        text: `Successfully updated template ID ${params.templateid}`
                    }]
                };
            } catch (error) {
                const enhancedError = handleZabbixError(error, 'error_updating_template', args);
                logger.error('Error updating template:', enhancedError.message);
                logger.debug('Full error details:', enhancedError.details);
                throw new Error(enhancedError.message);
            }
        }
    );

    // Delete templates
    server.tool(
        'zabbix_delete_templates',
        'Delete templates from Zabbix',
        {
            templateids: z.array(z.string()).min(1).describe('Array of template IDs to delete')
        },
        async (args) => {
            try {
                const { templateids } = args;
                
                const result = await api.deleteTemplates(templateids);
                
                logger.info(`Deleted ${templateids.length} templates`);
                return {
                    content: [{
                        type: 'text',
                        text: `Successfully deleted ${templateids.length} templates: ${templateids.join(', ')}`
                    }]
                };
            } catch (error) {
                const enhancedError = handleZabbixError(error, 'error_deleting_templates', args);
                logger.error('Error deleting templates:', enhancedError.message);
                logger.debug('Full error details:', enhancedError.details);
                throw new Error(enhancedError.message);
            }
        }
    );

    // Link templates to host
    server.tool(
        'zabbix_link_templates_to_host',
        'Link templates to a host in Zabbix',
        {
            hostid: z.string().describe('ID of the host to link templates to'),
            templateids: z.array(z.string()).min(1).describe('Array of template IDs to link to the host')
        },
        async (args) => {
            try {
                const { hostid, templateids } = args;
                
                const result = await api.linkTemplatesToHost(hostid, templateids);
                
                logger.info(`Linked ${templateids.length} templates to host ${hostid}`);
                return {
                    content: [{
                        type: 'text',
                        text: `Successfully linked ${templateids.length} templates to host ${hostid}: ${templateids.join(', ')}`
                    }]
                };
            } catch (error) {
                const enhancedError = handleZabbixError(error, 'error_linking_templates_to_host', args);
                logger.error('Error linking templates to host:', enhancedError.message);
                logger.debug('Full error details:', enhancedError.details);
                throw new Error(enhancedError.message);
            }
        }
    );

    // Unlink templates from host
    server.tool(
        'zabbix_unlink_templates_from_host',
        'Unlink templates from a host in Zabbix',
        {
            hostid: z.string().describe('ID of the host to unlink templates from'),
            templateids: z.array(z.string()).min(1).describe('Array of template IDs to unlink from the host')
        },
        async (args) => {
            try {
                const { hostid, templateids } = args;
                
                const result = await api.unlinkTemplatesFromHost(hostid, templateids);
                
                logger.info(`Unlinked ${templateids.length} templates from host ${hostid}`);
                return {
                    content: [{
                        type: 'text',
                        text: `Successfully unlinked ${templateids.length} templates from host ${hostid}: ${templateids.join(', ')}`
                    }]
                };
            } catch (error) {
                const enhancedError = handleZabbixError(error, 'error_unlinking_templates_from_host', args);
                logger.error('Error unlinking templates from host:', enhancedError.message);
                logger.debug('Full error details:', enhancedError.details);
                throw new Error(enhancedError.message);
            }
        }
    );

    logger.info('Enhanced templates tools registered successfully');
}

module.exports = { registerTools }; 