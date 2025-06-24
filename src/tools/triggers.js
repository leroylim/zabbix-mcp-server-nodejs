const { logger } = require('../utils/logger');
const api = require('../api');
const { z } = require('zod');

function registerTools(server) {
    // Get triggers
    server.tool(
        'zabbix_get_triggers',
        'Get triggers from Zabbix with filtering and output options',
        {
            triggerids: z.array(z.string()).optional().describe('Return only triggers with the given trigger IDs'),
            hostids: z.array(z.string()).optional().describe('Return only triggers that belong to the given hosts'),
            groupids: z.array(z.string()).optional().describe('Return only triggers that belong to hosts in the given host groups'),
            templateids: z.array(z.string()).optional().describe('Return only triggers that belong to the given templates'),
            output: z.array(z.string()).optional().default(['triggerid', 'description', 'expression', 'priority', 'status', 'value']).describe('Object properties to be returned'),
            selectHosts: z.array(z.string()).optional().describe('Return hosts that the trigger belongs to'),
            selectItems: z.array(z.string()).optional().describe('Return items that are used in the trigger'),
            filter: z.record(z.any()).optional().describe('Return only triggers that match the given filter'),
            search: z.record(z.any()).optional().describe('Return only triggers that match the given wildcard search'),
            sortfield: z.array(z.string()).optional().default(['priority']).describe('Sort the result by the given properties'),
            sortorder: z.enum(['ASC', 'DESC']).optional().default('DESC').describe('Sort order'),
            limit: z.number().int().positive().optional().describe('Limit the number of records returned'),
            monitored: z.boolean().optional().describe('Return only enabled triggers that belong to monitored hosts'),
            only_true: z.boolean().optional().describe('Return only triggers that are in problem state'),
            min_severity: z.number().int().min(0).max(5).optional().describe('Return only triggers with severity greater or equal'),
            expandDescription: z.boolean().optional().default(true).describe('Expand macros in the trigger description')
        },
        async (args) => {
            try {
                const params = { ...args };
                
                const apiParams = {
                    output: params.output || ['triggerid', 'description', 'expression', 'priority', 'status', 'value'],
                    sortfield: params.sortfield || ['priority'],
                    sortorder: params.sortorder || 'DESC',
                    expandDescription: params.expandDescription !== undefined ? params.expandDescription : true
                };

                if (params.triggerids) apiParams.triggerids = params.triggerids;
                if (params.hostids) apiParams.hostids = params.hostids;
                if (params.groupids) apiParams.groupids = params.groupids;
                if (params.templateids) apiParams.templateids = params.templateids;
                if (params.selectHosts) apiParams.selectHosts = params.selectHosts;
                if (params.selectItems) apiParams.selectItems = params.selectItems;
                if (params.filter) apiParams.filter = params.filter;
                if (params.search) apiParams.search = params.search;
                if (params.limit) apiParams.limit = params.limit;
                if (params.monitored !== undefined) apiParams.monitored = params.monitored;
                if (params.only_true !== undefined) apiParams.only_true = params.only_true;
                if (params.min_severity !== undefined) apiParams.min_severity = params.min_severity;

                const triggers = await api.getTriggers(apiParams);
                
                logger.info(`Retrieved ${triggers.length} triggers`);
                return {
                    content: [{
                        type: 'text',
                        text: `Found ${triggers.length} triggers:\n\n${JSON.stringify(triggers, null, 2)}`
                    }]
                };
            } catch (error) {
                logger.error('Error getting triggers:', error.message);
                throw error;
            }
        }
    );

    // Create trigger
    server.tool(
        'zabbix_create_trigger',
        'Create a new trigger in Zabbix',
        {
            description: z.string().min(1).describe('Name of the trigger'),
            expression: z.string().min(1).describe('Reduced trigger expression'),
            priority: z.number().int().min(0).max(5).optional().default(0).describe('Severity of the trigger (0-5: Not classified, Information, Warning, Average, High, Disaster)'),
            status: z.number().int().optional().default(0).describe('Status of the trigger (0 - enabled, 1 - disabled)'),
            comments: z.string().optional().describe('Additional comments to the trigger'),
            url: z.string().optional().describe('URL associated with the trigger')
        },
        async (args) => {
            try {
                const params = { ...args };
                
                const result = await api.createTrigger(params);
                
                logger.info(`Created trigger: ${params.description} (ID: ${result.triggerids[0]})`);
                return {
                    content: [{
                        type: 'text',
                        text: `Successfully created trigger "${params.description}" with ID: ${result.triggerids[0]}`
                    }]
                };
            } catch (error) {
                logger.error('Error creating trigger:', error.message);
                throw error;
            }
        }
    );

    // Update trigger
    server.tool(
        'zabbix_update_trigger',
        'Update an existing trigger in Zabbix',
        {
            triggerid: z.string().describe('ID of the trigger to update'),
            description: z.string().optional().describe('Name of the trigger'),
            expression: z.string().optional().describe('Reduced trigger expression'),
            priority: z.number().int().min(0).max(5).optional().describe('Severity of the trigger (0-5)'),
            status: z.number().int().optional().describe('Status of the trigger (0 - enabled, 1 - disabled)'),
            comments: z.string().optional().describe('Additional comments to the trigger'),
            url: z.string().optional().describe('URL associated with the trigger')
        },
        async (args) => {
            try {
                const params = { ...args };
                
                const result = await api.updateTrigger(params);
                
                logger.info(`Updated trigger ID ${params.triggerid}`);
                return {
                    content: [{
                        type: 'text',
                        text: `Successfully updated trigger ID ${params.triggerid}`
                    }]
                };
            } catch (error) {
                logger.error('Error updating trigger:', error.message);
                throw error;
            }
        }
    );

    // Delete triggers
    server.tool(
        'zabbix_delete_triggers',
        'Delete triggers from Zabbix',
        {
            triggerids: z.array(z.string()).min(1).describe('Array of trigger IDs to delete')
        },
        async (args) => {
            try {
                const { triggerids } = args;
                
                const result = await api.deleteTriggers(triggerids);
                
                logger.info(`Deleted ${triggerids.length} triggers`);
                return {
                    content: [{
                        type: 'text',
                        text: `Successfully deleted ${triggerids.length} triggers: ${triggerids.join(', ')}`
                    }]
                };
            } catch (error) {
                logger.error('Error deleting triggers:', error.message);
                throw error;
            }
        }
    );

    logger.info('Triggers tools registered successfully');
}

module.exports = { registerTools }; 