const { logger } = require('../utils/logger');
const api = require('../api');
const { z } = require('zod');

function registerTools(server) {
    // Get actions
    server.tool(
        'zabbix_get_actions',
        'Get actions from Zabbix with filtering and output options',
        {
            actionids: z.array(z.string()).optional().describe('Return only actions with the given IDs'),
            groupids: z.array(z.string()).optional().describe('Return only actions that are configured for the given host groups'),
            hostids: z.array(z.string()).optional().describe('Return only actions that are configured for the given hosts'),
            triggerids: z.array(z.string()).optional().describe('Return only actions that are configured for the given triggers'),
            mediatypeids: z.array(z.string()).optional().describe('Return only actions that use the given media types'),
            usrgrpids: z.array(z.string()).optional().describe('Return only actions that are configured to send messages to the given user groups'),
            userids: z.array(z.string()).optional().describe('Return only actions that are configured to send messages to the given users'),
            output: z.array(z.string()).optional().default(['actionid', 'name', 'eventsource', 'status', 'esc_period', 'def_shortdata', 'def_longdata']).describe('Object properties to be returned'),
            selectFilter: z.array(z.string()).optional().describe('Return action filter in the filter property'),
            selectOperations: z.array(z.string()).optional().describe('Return action operations in the operations property'),
            selectRecoveryOperations: z.array(z.string()).optional().describe('Return action recovery operations'),
            selectUpdateOperations: z.array(z.string()).optional().describe('Return action update operations'),
            filter: z.record(z.any()).optional().describe('Return only actions that match the given filter'),
            search: z.record(z.any()).optional().describe('Return only actions that match the given wildcard search'),
            sortfield: z.array(z.string()).optional().default(['name']).describe('Sort the result by the given properties'),
            sortorder: z.enum(['ASC', 'DESC']).optional().default('ASC').describe('Sort order'),
            limit: z.number().int().positive().optional().describe('Limit the number of records returned')
        },
        async (args) => {
            try {
                const params = { ...args };
                
                const apiParams = {
                    output: params.output || ['actionid', 'name', 'eventsource', 'status', 'esc_period', 'def_shortdata', 'def_longdata'],
                    sortfield: params.sortfield || ['name'],
                    sortorder: params.sortorder || 'ASC'
                };

                if (params.actionids) apiParams.actionids = params.actionids;
                if (params.groupids) apiParams.groupids = params.groupids;
                if (params.hostids) apiParams.hostids = params.hostids;
                if (params.triggerids) apiParams.triggerids = params.triggerids;
                if (params.mediatypeids) apiParams.mediatypeids = params.mediatypeids;
                if (params.usrgrpids) apiParams.usrgrpids = params.usrgrpids;
                if (params.userids) apiParams.userids = params.userids;
                if (params.selectFilter) apiParams.selectFilter = params.selectFilter;
                if (params.selectOperations) apiParams.selectOperations = params.selectOperations;
                if (params.selectRecoveryOperations) apiParams.selectRecoveryOperations = params.selectRecoveryOperations;
                if (params.selectUpdateOperations) apiParams.selectUpdateOperations = params.selectUpdateOperations;
                if (params.filter) apiParams.filter = params.filter;
                if (params.search) apiParams.search = params.search;
                if (params.limit) apiParams.limit = params.limit;

                const actions = await api.getActions(apiParams);
                
                logger.info(`Retrieved ${actions.length} actions`);
                return {
                    content: [{
                        type: 'text',
                        text: `Found ${actions.length} actions:\n\n${JSON.stringify(actions, null, 2)}`
                    }]
                };
            } catch (error) {
                logger.error('Error getting actions:', error.message);
                throw error;
            }
        }
    );

    // Create action
    server.tool(
        'zabbix_create_action',
        'Create a new action in Zabbix for automated responses to events',
        {
            name: z.string().min(1).describe('Name of the action'),
            eventsource: z.number().int().min(0).max(4).describe('Event source: 0 (trigger), 1 (discovery), 2 (auto registration), 3 (internal), 4 (service)'),
            status: z.number().int().min(0).max(1).optional().default(0).describe('Status: 0 (enabled), 1 (disabled)'),
            esc_period: z.string().optional().default('1h').describe('Default escalation period'),
            def_shortdata: z.string().optional().describe('Default short message template'),
            def_longdata: z.string().optional().describe('Default long message template'),
            r_shortdata: z.string().optional().describe('Recovery short message template'),
            r_longdata: z.string().optional().describe('Recovery long message template'),
            ack_shortdata: z.string().optional().describe('Update short message template'),
            ack_longdata: z.string().optional().describe('Update long message template'),
            
            // Filter conditions
            filter: z.object({
                evaltype: z.number().int().min(0).max(3).optional().default(0).describe('Filter evaluation type: 0 (and/or), 1 (and), 2 (or), 3 (custom expression)'),
                formula: z.string().optional().describe('Custom expression formula (when evaltype=3)'),
                conditions: z.array(z.object({
                    conditiontype: z.number().int().min(0).max(26).describe('Condition type (e.g., 1=host group, 2=host, 3=trigger, 4=trigger name, 5=trigger severity, etc.)'),
                    operator: z.number().int().min(0).max(8).describe('Condition operator (0=equals, 1=not equals, 2=like, 3=not like, 4=in, 5=>=, 6=<=, 7=not in, 8=matches)'),
                    value: z.string().describe('Value to compare with'),
                    value2: z.string().optional().describe('Second value for range operators'),
                    formulaid: z.string().optional().describe('Formula ID for custom expressions')
                })).min(1).describe('Array of filter conditions')
            }).describe('Action filter configuration'),
            
            // Operations (what to do when conditions are met)
            operations: z.array(z.object({
                operationtype: z.number().int().min(0).max(12).describe('Operation type: 0 (send message), 1 (remote command), 2 (add host), 3 (remove host), 4 (add to host group), 5 (remove from host group), 6 (link to template), 7 (unlink from template), 8 (enable host), 9 (disable host), 10 (set host inventory mode), 11 (send recovery message), 12 (send update message)'),
                esc_period: z.string().optional().describe('Escalation period for this operation'),
                esc_step_from: z.number().int().optional().default(1).describe('Step to start escalation from'),
                esc_step_to: z.number().int().optional().default(1).describe('Step to escalate to'),
                evaltype: z.number().int().min(0).max(1).optional().describe('Operation condition evaluation type'),
                
                // Message operation specific
                opmessage: z.object({
                    default_msg: z.number().int().min(0).max(1).optional().default(1).describe('Use default message'),
                    subject: z.string().optional().describe('Message subject'),
                    message: z.string().optional().describe('Message body'),
                    mediatypeid: z.string().optional().describe('Media type ID (0 for all)')
                }).optional().describe('Message operation configuration'),
                
                // Message targets
                opmessage_grp: z.array(z.object({
                    usrgrpid: z.string().describe('User group ID')
                })).optional().describe('User groups to send message to'),
                
                opmessage_usr: z.array(z.object({
                    userid: z.string().describe('User ID')
                })).optional().describe('Users to send message to'),
                
                // Command operation specific
                opcommand: z.object({
                    type: z.number().int().min(0).max(6).describe('Command type: 0 (custom script), 1 (IPMI), 2 (SSH), 3 (Telnet), 4 (global script), 5 (user script), 6 (user script on Zabbix agent)'),
                    command: z.string().describe('Command to execute'),
                    execute_on: z.number().int().min(0).max(2).optional().describe('Where to execute: 0 (Zabbix agent), 1 (Zabbix server), 2 (Zabbix server (proxy))')
                }).optional().describe('Command operation configuration'),
                
                // Command targets
                opcommand_hst: z.array(z.object({
                    hostid: z.string().describe('Host ID')
                })).optional().describe('Hosts to execute command on'),
                
                opcommand_grp: z.array(z.object({
                    groupid: z.string().describe('Host group ID')
                })).optional().describe('Host groups to execute command on'),
                
                // Host/group operations
                opgroup: z.array(z.object({
                    groupid: z.string().describe('Host group ID')
                })).optional().describe('Host groups for group operations'),
                
                optemplate: z.array(z.object({
                    templateid: z.string().describe('Template ID')
                })).optional().describe('Templates for template operations'),
                
                // Conditions for this operation
                opconditions: z.array(z.object({
                    conditiontype: z.number().int().min(14).max(16).describe('Operation condition type: 14 (event acknowledged), 15 (application), 16 (suppressed)'),
                    operator: z.number().int().min(0).max(7).describe('Condition operator'),
                    value: z.string().describe('Value to compare with')
                })).optional().describe('Operation-specific conditions')
            })).min(1).describe('Array of operations to perform'),
            
            // Recovery operations (what to do when problem is resolved)
            recovery_operations: z.array(z.object({
                operationtype: z.number().int().min(0).max(12).describe('Recovery operation type'),
                opmessage: z.object({
                    default_msg: z.number().int().min(0).max(1).optional().default(1),
                    subject: z.string().optional(),
                    message: z.string().optional(),
                    mediatypeid: z.string().optional()
                }).optional(),
                opmessage_grp: z.array(z.object({
                    usrgrpid: z.string()
                })).optional(),
                opmessage_usr: z.array(z.object({
                    userid: z.string()
                })).optional()
            })).optional().describe('Recovery operations'),
            
            // Update operations (what to do when problem is updated)
            update_operations: z.array(z.object({
                operationtype: z.number().int().min(0).max(12).describe('Update operation type'),
                opmessage: z.object({
                    default_msg: z.number().int().min(0).max(1).optional().default(1),
                    subject: z.string().optional(),
                    message: z.string().optional(),
                    mediatypeid: z.string().optional()
                }).optional(),
                opmessage_grp: z.array(z.object({
                    usrgrpid: z.string()
                })).optional(),
                opmessage_usr: z.array(z.object({
                    userid: z.string()
                })).optional()
            })).optional().describe('Update operations'),
            
            // Pause operations during maintenance
            pause_suppressed: z.number().int().min(0).max(1).optional().default(1).describe('Pause operations during maintenance')
        },
        async (args) => {
            try {
                const params = { ...args };
                
                const result = await api.createAction(params);
                
                logger.info(`Created action: ${params.name} (ID: ${result.actionids[0]})`);
                return {
                    content: [{
                        type: 'text',
                        text: `Successfully created action "${params.name}" with ID: ${result.actionids[0]}`
                    }]
                };
            } catch (error) {
                logger.error('Error creating action:', error.message);
                throw error;
            }
        }
    );

    // Update action
    server.tool(
        'zabbix_update_action',
        'Update an existing action in Zabbix',
        {
            actionid: z.string().describe('ID of the action to update'),
            name: z.string().optional().describe('Name of the action'),
            eventsource: z.number().int().min(0).max(4).optional().describe('Event source'),
            status: z.number().int().min(0).max(1).optional().describe('Status: 0 (enabled), 1 (disabled)'),
            esc_period: z.string().optional().describe('Default escalation period'),
            def_shortdata: z.string().optional().describe('Default short message template'),
            def_longdata: z.string().optional().describe('Default long message template'),
            filter: z.record(z.any()).optional().describe('Action filter configuration'),
            operations: z.array(z.record(z.any())).optional().describe('Action operations'),
            recovery_operations: z.array(z.record(z.any())).optional().describe('Recovery operations'),
            update_operations: z.array(z.record(z.any())).optional().describe('Update operations')
        },
        async (args) => {
            try {
                const params = { ...args };
                
                const result = await api.updateAction(params);
                
                logger.info(`Updated action ID ${params.actionid}`);
                return {
                    content: [{
                        type: 'text',
                        text: `Successfully updated action ID ${params.actionid}`
                    }]
                };
            } catch (error) {
                logger.error('Error updating action:', error.message);
                throw error;
            }
        }
    );

    // Delete actions
    server.tool(
        'zabbix_delete_actions',
        'Delete actions from Zabbix',
        {
            actionids: z.array(z.string()).min(1).describe('Array of action IDs to delete')
        },
        async (args) => {
            try {
                const { actionids } = args;
                
                const result = await api.deleteActions(actionids);
                
                logger.info(`Deleted ${actionids.length} actions`);
                return {
                    content: [{
                        type: 'text',
                        text: `Successfully deleted ${actionids.length} actions: ${actionids.join(', ')}`
                    }]
                };
            } catch (error) {
                logger.error('Error deleting actions:', error.message);
                throw error;
            }
        }
    );

    // Get correlations
    server.tool(
        'zabbix_get_correlations',
        'Get event correlations from Zabbix',
        {
            correlationids: z.array(z.string()).optional().describe('Return only correlations with the given IDs'),
            output: z.array(z.string()).optional().default(['correlationid', 'name', 'description', 'status']).describe('Object properties to be returned'),
            selectFilter: z.array(z.string()).optional().describe('Return correlation filter'),
            selectOperations: z.array(z.string()).optional().describe('Return correlation operations'),
            filter: z.record(z.any()).optional().describe('Return only correlations that match the given filter'),
            search: z.record(z.any()).optional().describe('Return only correlations that match the given wildcard search'),
            sortfield: z.array(z.string()).optional().default(['name']).describe('Sort the result by the given properties'),
            sortorder: z.enum(['ASC', 'DESC']).optional().default('ASC').describe('Sort order'),
            limit: z.number().int().positive().optional().describe('Limit the number of records returned')
        },
        async (args) => {
            try {
                const params = { ...args };
                
                const apiParams = {
                    output: params.output || ['correlationid', 'name', 'description', 'status'],
                    sortfield: params.sortfield || ['name'],
                    sortorder: params.sortorder || 'ASC'
                };

                if (params.correlationids) apiParams.correlationids = params.correlationids;
                if (params.selectFilter) apiParams.selectFilter = params.selectFilter;
                if (params.selectOperations) apiParams.selectOperations = params.selectOperations;
                if (params.filter) apiParams.filter = params.filter;
                if (params.search) apiParams.search = params.search;
                if (params.limit) apiParams.limit = params.limit;

                const correlations = await api.getCorrelations(apiParams);
                
                logger.info(`Retrieved ${correlations.length} correlations`);
                return {
                    content: [{
                        type: 'text',
                        text: `Found ${correlations.length} correlations:\n\n${JSON.stringify(correlations, null, 2)}`
                    }]
                };
            } catch (error) {
                logger.error('Error getting correlations:', error.message);
                throw error;
            }
        }
    );

    // Create correlation
    server.tool(
        'zabbix_create_correlation',
        'Create a new event correlation in Zabbix',
        {
            name: z.string().min(1).describe('Name of the correlation'),
            description: z.string().optional().describe('Description of the correlation'),
            status: z.number().int().min(0).max(1).optional().default(0).describe('Status: 0 (enabled), 1 (disabled)'),
            
            filter: z.object({
                evaltype: z.number().int().min(0).max(3).optional().default(0).describe('Filter evaluation type'),
                formula: z.string().optional().describe('Custom expression formula'),
                conditions: z.array(z.object({
                    type: z.number().int().min(0).max(5).describe('Condition type: 0 (old event tag), 1 (new event tag), 2 (new event host group), 3 (event tag pair), 4 (old event tag value), 5 (new event tag value)'),
                    operator: z.number().int().min(0).max(3).describe('Condition operator: 0 (equals), 1 (not equals), 2 (like), 3 (not like)'),
                    tag: z.string().optional().describe('Event tag name'),
                    oldtag: z.string().optional().describe('Old event tag name'),
                    newtag: z.string().optional().describe('New event tag name'),
                    value: z.string().optional().describe('Tag value'),
                    groupid: z.string().optional().describe('Host group ID'),
                    formulaid: z.string().optional().describe('Formula ID')
                })).min(1).describe('Array of filter conditions')
            }).describe('Correlation filter'),
            
            operations: z.array(z.object({
                type: z.number().int().min(0).max(1).describe('Operation type: 0 (close old events), 1 (close new event)')
            })).min(1).describe('Array of correlation operations')
        },
        async (args) => {
            try {
                const params = { ...args };
                
                const result = await api.createCorrelation(params);
                
                logger.info(`Created correlation: ${params.name} (ID: ${result.correlationids[0]})`);
                return {
                    content: [{
                        type: 'text',
                        text: `Successfully created correlation "${params.name}" with ID: ${result.correlationids[0]}`
                    }]
                };
            } catch (error) {
                logger.error('Error creating correlation:', error.message);
                throw error;
            }
        }
    );

    // Delete correlations
    server.tool(
        'zabbix_delete_correlations',
        'Delete event correlations from Zabbix',
        {
            correlationids: z.array(z.string()).min(1).describe('Array of correlation IDs to delete')
        },
        async (args) => {
            try {
                const { correlationids } = args;
                
                const result = await api.deleteCorrelations(correlationids);
                
                logger.info(`Deleted ${correlationids.length} correlations`);
                return {
                    content: [{
                        type: 'text',
                        text: `Successfully deleted ${correlationids.length} correlations: ${correlationids.join(', ')}`
                    }]
                };
            } catch (error) {
                logger.error('Error deleting correlations:', error.message);
                throw error;
            }
        }
    );

    logger.info('Actions tools registered successfully');
}

module.exports = { registerTools }; 