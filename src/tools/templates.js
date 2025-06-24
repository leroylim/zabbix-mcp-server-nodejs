const { logger } = require('../utils/logger');
const api = require('../api');
const { z } = require('zod');

function registerTools(server) {
    // Get templates
    server.tool(
        'zabbix_get_templates',
        'Get templates from Zabbix with filtering and output options',
        {
            templateids: z.array(z.string()).optional().describe('Return only templates with the given template IDs'),
            hostids: z.array(z.string()).optional().describe('Return only templates that are linked to the given hosts'),
            groupids: z.array(z.string()).optional().describe('Return only templates that belong to the given host groups'),
            output: z.array(z.string()).optional().default(['templateid', 'host', 'name', 'description']).describe('Object properties to be returned'),
            selectGroups: z.array(z.string()).optional().describe('Return host groups that the template belongs to'),
            selectHosts: z.array(z.string()).optional().describe('Return hosts that are linked to the template'),
            filter: z.record(z.any()).optional().describe('Return only templates that match the given filter'),
            search: z.record(z.any()).optional().describe('Return only templates that match the given wildcard search'),
            sortfield: z.array(z.string()).optional().default(['name']).describe('Sort the result by the given properties'),
            sortorder: z.enum(['ASC', 'DESC']).optional().default('ASC').describe('Sort order'),
            limit: z.number().int().positive().optional().describe('Limit the number of records returned')
        },
        async (args) => {
            try {
                const params = { ...args };
                
                const apiParams = {
                    output: params.output || ['templateid', 'host', 'name', 'description'],
                    sortfield: params.sortfield || ['name'],
                    sortorder: params.sortorder || 'ASC'
                };

                if (params.templateids) apiParams.templateids = params.templateids;
                if (params.hostids) apiParams.hostids = params.hostids;
                if (params.groupids) apiParams.groupids = params.groupids;
                if (params.selectGroups) apiParams.selectGroups = params.selectGroups;
                if (params.selectHosts) apiParams.selectHosts = params.selectHosts;
                if (params.filter) apiParams.filter = params.filter;
                if (params.search) apiParams.search = params.search;
                if (params.limit) apiParams.limit = params.limit;

                const templates = await api.getTemplates(apiParams);
                
                logger.info(`Retrieved ${templates.length} templates`);
                return {
                    content: [{
                        type: 'text',
                        text: `Found ${templates.length} templates:\n\n${JSON.stringify(templates, null, 2)}`
                    }]
                };
            } catch (error) {
                logger.error('Error getting templates:', error.message);
                throw error;
            }
        }
    );

    // Create template
    server.tool(
        'zabbix_create_template',
        'Create a new template in Zabbix',
        {
            host: z.string().min(1).describe('Technical name of the template'),
            name: z.string().optional().describe('Visible name of the template'),
            description: z.string().optional().describe('Description of the template'),
            groups: z.array(z.object({
                groupid: z.string()
            })).min(1).describe('Host groups that the template belongs to')
        },
        async (args) => {
            try {
                const params = { ...args };
                
                const result = await api.createTemplate(params);
                
                logger.info(`Created template: ${params.host} (ID: ${result.templateids[0]})`);
                return {
                    content: [{
                        type: 'text',
                        text: `Successfully created template "${params.host}" with ID: ${result.templateids[0]}`
                    }]
                };
            } catch (error) {
                logger.error('Error creating template:', error.message);
                throw error;
            }
        }
    );

    // Update template
    server.tool(
        'zabbix_update_template',
        'Update an existing template in Zabbix',
        {
            templateid: z.string().describe('ID of the template to update'),
            host: z.string().optional().describe('Technical name of the template'),
            name: z.string().optional().describe('Visible name of the template'),
            description: z.string().optional().describe('Description of the template'),
            groups: z.array(z.object({
                groupid: z.string()
            })).optional().describe('Host groups that the template belongs to')
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
                logger.error('Error updating template:', error.message);
                throw error;
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
                logger.error('Error deleting templates:', error.message);
                throw error;
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
                logger.error('Error linking templates to host:', error.message);
                throw error;
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
                logger.error('Error unlinking templates from host:', error.message);
                throw error;
            }
        }
    );

    logger.info('Templates tools registered successfully');
}

module.exports = { registerTools }; 