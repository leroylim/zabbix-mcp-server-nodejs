const { logger } = require('../utils/logger');
const api = require('../api');
const { z } = require('zod');

function registerTools(server) {
    // Get scripts
    server.tool(
        'zabbix_get_scripts',
        'Get scripts from Zabbix with filtering and output options',
        {
            scriptids: z.array(z.string()).optional().describe('Return only scripts with the given script IDs'),
            groupids: z.array(z.string()).optional().describe('Return only scripts that can be run on the given host groups'),
            hostids: z.array(z.string()).optional().describe('Return only scripts that can be run on the given hosts'),
            output: z.array(z.string()).optional().default(['scriptid', 'name', 'command', 'type', 'scope', 'execute_on']).describe('Object properties to be returned'),
            selectGroups: z.array(z.string()).optional().describe('Return host groups that the script can be run on'),
            selectHosts: z.array(z.string()).optional().describe('Return hosts that the script can be run on'),
            filter: z.record(z.any()).optional().describe('Return only scripts that match the given filter'),
            search: z.record(z.any()).optional().describe('Return only scripts that match the given wildcard search'),
            sortfield: z.array(z.string()).optional().default(['name']).describe('Sort the result by the given properties'),
            sortorder: z.enum(['ASC', 'DESC']).optional().default('ASC').describe('Sort order'),
            limit: z.number().int().positive().optional().describe('Limit the number of records returned')
        },
        async (args) => {
            try {
                const params = { ...args };
                
                const apiParams = {
                    output: params.output || ['scriptid', 'name', 'command', 'type', 'scope', 'execute_on'],
                    sortfield: params.sortfield || ['name'],
                    sortorder: params.sortorder || 'ASC'
                };

                if (params.scriptids) apiParams.scriptids = params.scriptids;
                if (params.groupids) apiParams.groupids = params.groupids;
                if (params.hostids) apiParams.hostids = params.hostids;
                if (params.selectGroups) apiParams.selectGroups = params.selectGroups;
                if (params.selectHosts) apiParams.selectHosts = params.selectHosts;
                if (params.filter) apiParams.filter = params.filter;
                if (params.search) apiParams.search = params.search;
                if (params.limit) apiParams.limit = params.limit;

                const scripts = await api.getScripts(apiParams);
                
                logger.info(`Retrieved ${scripts.length} scripts`);
                return {
                    content: [{
                        type: 'text',
                        text: `Found ${scripts.length} scripts:\n\n${JSON.stringify(scripts, null, 2)}`
                    }]
                };
            } catch (error) {
                logger.error('Error getting scripts:', error.message);
                throw error;
            }
        }
    );

    // Create script
    server.tool(
        'zabbix_create_script',
        'Create a new script in Zabbix',
        {
            name: z.string().min(1).describe('Name of the script'),
            command: z.string().min(1).describe('Command to execute (for script type) or URL (for URL type)'),
            type: z.number().int().min(0).max(5).describe('Type of script (0 - script, 1 - IPMI, 2 - SSH, 3 - Telnet, 4 - global script, 5 - URL)'),
            scope: z.number().int().min(1).max(4).describe('Script scope (1 - action operation, 2 - manual host action, 4 - manual event action)'),
            execute_on: z.number().int().min(0).max(2).optional().default(1).describe('Where to execute the script (0 - Zabbix agent, 1 - Zabbix server, 2 - Zabbix server (proxy))'),
            description: z.string().optional().describe('Description of the script'),
            groupid: z.string().optional().describe('Host group ID that the script can be run on (0 for all groups)'),
            host_access: z.number().int().min(2).max(3).optional().default(2).describe('Host permissions needed (2 - read, 3 - write)'),
            usrgrpid: z.string().optional().describe('User group ID that can execute the script (0 for all groups)'),
            confirmation: z.string().optional().describe('Confirmation text to display before executing the script'),
            username: z.string().optional().describe('Username for SSH/Telnet scripts'),
            password: z.string().optional().describe('Password for SSH/Telnet scripts'),
            publickey: z.string().optional().describe('Public key file name for SSH scripts'),
            privatekey: z.string().optional().describe('Private key file name for SSH scripts'),
            port: z.string().optional().describe('Port for SSH/Telnet scripts'),
            authtype: z.number().int().min(0).max(1).optional().describe('Authentication type for SSH scripts (0 - password, 1 - public key)'),
            parameters: z.array(z.object({
                name: z.string(),
                value: z.string().optional()
            })).optional().describe('Script parameters for webhook scripts')
        },
        async (args) => {
            try {
                const params = { ...args };
                
                const result = await api.createScript(params);
                
                logger.info(`Created script: ${params.name} (ID: ${result.scriptids[0]})`);
                return {
                    content: [{
                        type: 'text',
                        text: `Successfully created script "${params.name}" with ID: ${result.scriptids[0]}`
                    }]
                };
            } catch (error) {
                logger.error('Error creating script:', error.message);
                throw error;
            }
        }
    );

    // Update script
    server.tool(
        'zabbix_update_script',
        'Update an existing script in Zabbix',
        {
            scriptid: z.string().describe('ID of the script to update'),
            name: z.string().optional().describe('Name of the script'),
            command: z.string().optional().describe('Command to execute (for script type) or URL (for URL type)'),
            type: z.number().int().min(0).max(5).optional().describe('Type of script (0 - script, 1 - IPMI, 2 - SSH, 3 - Telnet, 4 - global script, 5 - URL)'),
            scope: z.number().int().min(1).max(4).optional().describe('Script scope (1 - action operation, 2 - manual host action, 4 - manual event action)'),
            execute_on: z.number().int().min(0).max(2).optional().describe('Where to execute the script (0 - Zabbix agent, 1 - Zabbix server, 2 - Zabbix server (proxy))'),
            description: z.string().optional().describe('Description of the script'),
            groupid: z.string().optional().describe('Host group ID that the script can be run on (0 for all groups)'),
            host_access: z.number().int().min(2).max(3).optional().describe('Host permissions needed (2 - read, 3 - write)'),
            usrgrpid: z.string().optional().describe('User group ID that can execute the script (0 for all groups)'),
            confirmation: z.string().optional().describe('Confirmation text to display before executing the script')
        },
        async (args) => {
            try {
                const params = { ...args };
                
                const result = await api.updateScript(params);
                
                logger.info(`Updated script ID ${params.scriptid}`);
                return {
                    content: [{
                        type: 'text',
                        text: `Successfully updated script ID ${params.scriptid}`
                    }]
                };
            } catch (error) {
                logger.error('Error updating script:', error.message);
                throw error;
            }
        }
    );

    // Delete scripts
    server.tool(
        'zabbix_delete_scripts',
        'Delete scripts from Zabbix',
        {
            scriptids: z.array(z.string()).min(1).describe('Array of script IDs to delete')
        },
        async (args) => {
            try {
                const { scriptids } = args;
                
                const result = await api.deleteScripts(scriptids);
                
                logger.info(`Deleted ${scriptids.length} scripts`);
                return {
                    content: [{
                        type: 'text',
                        text: `Successfully deleted ${scriptids.length} scripts: ${scriptids.join(', ')}`
                    }]
                };
            } catch (error) {
                logger.error('Error deleting scripts:', error.message);
                throw error;
            }
        }
    );

    // Execute script
    server.tool(
        'zabbix_execute_script',
        'Execute a script on a host in Zabbix',
        {
            scriptid: z.string().describe('ID of the script to execute'),
            hostid: z.string().optional().describe('ID of the host to execute the script on (required for host-context scripts)'),
            eventid: z.string().optional().describe('ID of the event to execute the script on (for event-context scripts)'),
            manualinput: z.string().optional().describe('Manual input for scripts that require it')
        },
        async (args) => {
            try {
                const params = { ...args };
                
                const result = await api.executeScript(params);
                
                logger.info(`Executed script ID ${params.scriptid} on host ${params.hostid || 'N/A'}`);
                
                // Format the execution result
                const response = {
                    script_id: params.scriptid,
                    host_id: params.hostid,
                    execution_result: result
                };
                
                return {
                    content: [{
                        type: 'text',
                        text: `Script execution completed:\n\n${JSON.stringify(response, null, 2)}`
                    }]
                };
            } catch (error) {
                logger.error('Error executing script:', error.message);
                throw error;
            }
        }
    );

    // Get script execution history (using event.get for script execution events)
    server.tool(
        'zabbix_get_script_execution_history',
        'Get history of script executions from Zabbix events',
        {
            scriptids: z.array(z.string()).optional().describe('Filter by specific script IDs'),
            hostids: z.array(z.string()).optional().describe('Filter by specific host IDs'),
            time_from: z.number().int().optional().describe('Return only events from this time (Unix timestamp)'),
            time_till: z.number().int().optional().describe('Return only events until this time (Unix timestamp)'),
            limit: z.number().int().positive().optional().default(100).describe('Limit the number of records returned'),
            sortorder: z.enum(['ASC', 'DESC']).optional().default('DESC').describe('Sort order by time')
        },
        async (args) => {
            try {
                const params = { ...args };
                
                // Get events related to script execution
                const apiParams = {
                    output: ['eventid', 'clock', 'ns', 'value', 'acknowledged'],
                    selectHosts: ['hostid', 'host', 'name'],
                    source: 0, // Trigger events
                    object: 0, // Trigger object
                    sortfield: ['clock'],
                    sortorder: params.sortorder || 'DESC',
                    limit: params.limit || 100
                };

                if (params.hostids) apiParams.hostids = params.hostids;
                if (params.time_from) apiParams.time_from = params.time_from;
                if (params.time_till) apiParams.time_till = params.time_till;

                const events = await api.getEvents(apiParams);
                
                // Format the results with readable timestamps
                const formattedEvents = events.map(event => ({
                    ...event,
                    timestamp: new Date(event.clock * 1000).toISOString(),
                    execution_time: event.ns ? `${event.ns}ns` : undefined
                }));
                
                logger.info(`Retrieved ${events.length} script execution events`);
                return {
                    content: [{
                        type: 'text',
                        text: `Found ${events.length} script execution events:\n\n${JSON.stringify(formattedEvents, null, 2)}`
                    }]
                };
            } catch (error) {
                logger.error('Error getting script execution history:', error.message);
                throw error;
            }
        }
    );

    logger.info('Scripts tools registered successfully');
}

module.exports = { registerTools }; 