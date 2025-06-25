const { logger } = require('../utils/logger');
const api = require('../api');
const { z } = require('zod');
const { handleZabbixError } = require('../utils/errors');

// Helper functions for script management
function getScriptTypeName(type) {
    const typeNames = {
        0: 'Script',
        1: 'IPMI', 
        2: 'SSH',
        3: 'Telnet',
        4: 'Global script',
        5: 'URL',
        6: 'Webhook'
    };
    return typeNames[type] || `Unknown (${type})`;
}

function getScriptScopeName(scope) {
    const scopeNames = {
        1: 'Action operation',
        2: 'Manual host action', 
        4: 'Manual event action',
        6: 'Manual host and event action' // 2 + 4
    };
    return scopeNames[scope] || `Unknown (${scope})`;
}

function getExecutionLocationName(executeOn) {
    const locations = {
        0: 'Zabbix agent',
        1: 'Zabbix server', 
        2: 'Zabbix server (proxy)'
    };
    return locations[executeOn] || `Unknown (${executeOn})`;
}

function getHostAccessName(hostAccess) {
    const accessNames = {
        2: 'Read',
        3: 'Write'
    };
    return accessNames[hostAccess] || `Unknown (${hostAccess})`;
}

function getAuthTypeName(authType) {
    const authNames = {
        0: 'Password',
        1: 'Public key'
    };
    return authNames[authType] || `Unknown (${authType})`;
}

function getManualInputValidatorTypeName(validatorType) {
    const typeNames = {
        0: 'Regular expression',
        1: 'List of values'
    };
    return typeNames[validatorType] || `Unknown (${validatorType})`;
}

// Enhanced script formatting with human-readable information
function formatScriptInfo(script) {
    const formatted = {
        ...script,
        type_name: getScriptTypeName(parseInt(script.type || 0)),
        scope_name: getScriptScopeName(parseInt(script.scope || 2)),
        execute_on_name: getExecutionLocationName(parseInt(script.execute_on || 1)),
        host_access_name: getHostAccessName(parseInt(script.host_access || 2)),
        manual_input_enabled: script.manualinput === '1' || script.manualinput === 1,
        new_window_enabled: script.new_window === '1' || script.new_window === 1
    };

    // Add authentication type name for SSH scripts
    if (script.authtype !== undefined) {
        formatted.auth_type_name = getAuthTypeName(parseInt(script.authtype));
    }

    // Add manual input validator type name
    if (script.manualinput_validator_type !== undefined) {
        formatted.manualinput_validator_type_name = getManualInputValidatorTypeName(parseInt(script.manualinput_validator_type));
    }

    // Enhanced parameter formatting for webhooks
    if (script.parameters && Array.isArray(script.parameters)) {
        formatted.parameters_formatted = script.parameters.map(param => ({
            ...param,
            supports_macros: true,
            description: `Parameter '${param.name}' with value '${param.value || '(empty)'}'`
        }));
    }

    // Add timeout formatting for webhooks
    if (script.timeout) {
        formatted.timeout_formatted = script.timeout.includes('s') ? script.timeout : `${script.timeout}s`;
    }

    return formatted;
}

// Webhook parameter schema
const WebhookParameterSchema = z.object({
    name: z.string().min(1, "Parameter name is required"),
    value: z.string().optional().describe("Parameter value supporting macros")
});

// Manual input validation schema
const ManualInputSchema = z.object({
    manualinput: z.union([z.enum(['0', '1']), z.number().int().min(0).max(1)]).optional(),
    manualinput_prompt: z.string().optional(),
    manualinput_validator: z.string().optional(),
    manualinput_validator_type: z.union([z.enum(['0', '1']), z.number().int().min(0).max(1)]).optional(),
    manualinput_default_value: z.string().optional()
}).refine((data) => {
    const manualInputEnabled = data.manualinput === '1' || data.manualinput === 1;
    if (manualInputEnabled) {
        return data.manualinput_prompt && data.manualinput_validator;
    }
    return true;
}, {
    message: "Manual input requires prompt and validator when enabled",
    path: ["manualinput"]
});

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
                
                // Enhanced formatting for scripts
                const formattedScripts = scripts.map(script => formatScriptInfo(script));
                
                logger.info(`Retrieved ${scripts.length} scripts`);
                return {
                    content: [{
                        type: 'text',
                        text: `Found ${scripts.length} scripts:\n\n${JSON.stringify(formattedScripts, null, 2)}`
                    }]
                };
            } catch (error) {
                const enhancedError = handleZabbixError(error, 'error_getting_scripts', args);
                logger.error('Error getting scripts::', enhancedError.message);
                logger.debug('Full error details:', enhancedError.details);
                throw new Error(enhancedError.message);
            }
        }
    );

    // Create script
    server.tool(
        'zabbix_create_script',
        'Create a new script in Zabbix with full support for all script types',
        {
            name: z.string().min(1).describe('Name of the script'),
            command: z.string().optional().describe('Command to execute (for script/webhook type) - not required for URL type'),
            type: z.number().int().min(0).max(6).describe('Type of script (0 - script, 1 - IPMI, 2 - SSH, 3 - Telnet, 4 - global script, 5 - URL, 6 - webhook)'),
            scope: z.number().int().min(1).max(7).describe('Script scope (1 - action operation, 2 - manual host action, 4 - manual event action, 6 - manual host and event)'),
            execute_on: z.number().int().min(0).max(2).optional().default(1).describe('Where to execute the script (0 - Zabbix agent, 1 - Zabbix server, 2 - Zabbix server (proxy))'),
            description: z.string().optional().describe('Description of the script'),
            groupid: z.string().optional().describe('Host group ID that the script can be run on (0 for all groups)'),
            host_access: z.number().int().min(2).max(3).optional().default(2).describe('Host permissions needed (2 - read, 3 - write)'),
            usrgrpid: z.string().optional().describe('User group ID that can execute the script (0 for all groups)'),
            confirmation: z.string().optional().describe('Confirmation text to display before executing the script'),
            
            // URL type properties
            url: z.string().url().optional().describe('URL for URL-type scripts'),
            new_window: z.number().int().min(0).max(1).optional().default(1).describe('Open URL in new window (0 - No, 1 - Yes)'),
            
            // Webhook type properties
            timeout: z.string().regex(/^\d+s?$/).optional().describe('Webhook execution timeout (1-60s, e.g. "30s")'),
            parameters: z.array(WebhookParameterSchema).optional().describe('Webhook parameters with name/value pairs'),
            
            // Manual input properties
            manualinput: z.number().int().min(0).max(1).optional().describe('Accept manual input (0 - Disabled, 1 - Enabled)'),
            manualinput_prompt: z.string().optional().describe('Manual input prompt text'),
            manualinput_validator: z.string().optional().describe('Manual input validation pattern (regex or comma-separated list)'),
            manualinput_validator_type: z.number().int().min(0).max(1).optional().describe('Validator type (0 - regex, 1 - list)'),
            manualinput_default_value: z.string().optional().describe('Default value for manual input'),
            
            // SSH/Telnet authentication properties
            username: z.string().optional().describe('Username for SSH/Telnet scripts'),
            password: z.string().optional().describe('Password for SSH/Telnet scripts'),
            publickey: z.string().optional().describe('Public key file name for SSH scripts'),
            privatekey: z.string().optional().describe('Private key file name for SSH scripts'),
            port: z.string().optional().describe('Port for SSH/Telnet scripts'),
            authtype: z.number().int().min(0).max(1).optional().describe('Authentication type for SSH scripts (0 - password, 1 - public key)')
        },
        async (args) => {
            try {
                const params = { ...args };
                
                // Type-specific validation
                if (params.type === 5 && !params.url) {
                    throw new Error('URL type scripts require a url parameter');
                }
                if (params.type === 6) {
                    if (!params.command) {
                        throw new Error('Webhook type scripts require a command parameter');
                    }
                    if (!params.timeout) {
                        params.timeout = '30s'; // Default webhook timeout
                    }
                }
                if (params.manualinput === 1) {
                    if (!params.manualinput_prompt || !params.manualinput_validator) {
                        throw new Error('Manual input requires both prompt and validator parameters');
                    }
                }
                
                const result = await api.createScript(params);
                
                logger.info(`Created script: ${params.name} (ID: ${result.scriptids[0]})`);
                return {
                    content: [{
                        type: 'text',
                        text: `Successfully created script "${params.name}" with ID: ${result.scriptids[0]}`
                    }]
                };
            } catch (error) {
                const enhancedError = handleZabbixError(error, 'error_creating_script', args);
                logger.error('Error creating script::', enhancedError.message);
                logger.debug('Full error details:', enhancedError.details);
                throw new Error(enhancedError.message);
            }
        }
    );

    // Update script
    server.tool(
        'zabbix_update_script',
        'Update an existing script in Zabbix with full support for all script types',
        {
            scriptid: z.string().describe('ID of the script to update'),
            name: z.string().optional().describe('Name of the script'),
            command: z.string().optional().describe('Command to execute (for script/webhook type)'),
            type: z.number().int().min(0).max(6).optional().describe('Type of script (0 - script, 1 - IPMI, 2 - SSH, 3 - Telnet, 4 - global script, 5 - URL, 6 - webhook)'),
            scope: z.number().int().min(1).max(7).optional().describe('Script scope (1 - action operation, 2 - manual host action, 4 - manual event action, 6 - manual host and event)'),
            execute_on: z.number().int().min(0).max(2).optional().describe('Where to execute the script (0 - Zabbix agent, 1 - Zabbix server, 2 - Zabbix server (proxy))'),
            description: z.string().optional().describe('Description of the script'),
            groupid: z.string().optional().describe('Host group ID that the script can be run on (0 for all groups)'),
            host_access: z.number().int().min(2).max(3).optional().describe('Host permissions needed (2 - read, 3 - write)'),
            usrgrpid: z.string().optional().describe('User group ID that can execute the script (0 for all groups)'),
            confirmation: z.string().optional().describe('Confirmation text to display before executing the script'),
            
            // URL type properties
            url: z.string().url().optional().describe('URL for URL-type scripts'),
            new_window: z.number().int().min(0).max(1).optional().describe('Open URL in new window (0 - No, 1 - Yes)'),
            
            // Webhook type properties
            timeout: z.string().regex(/^\d+s?$/).optional().describe('Webhook execution timeout (1-60s, e.g. "30s")'),
            parameters: z.array(WebhookParameterSchema).optional().describe('Webhook parameters with name/value pairs'),
            
            // Manual input properties
            manualinput: z.number().int().min(0).max(1).optional().describe('Accept manual input (0 - Disabled, 1 - Enabled)'),
            manualinput_prompt: z.string().optional().describe('Manual input prompt text'),
            manualinput_validator: z.string().optional().describe('Manual input validation pattern (regex or comma-separated list)'),
            manualinput_validator_type: z.number().int().min(0).max(1).optional().describe('Validator type (0 - regex, 1 - list)'),
            manualinput_default_value: z.string().optional().describe('Default value for manual input'),
            
            // SSH/Telnet authentication properties
            username: z.string().optional().describe('Username for SSH/Telnet scripts'),
            password: z.string().optional().describe('Password for SSH/Telnet scripts'),
            publickey: z.string().optional().describe('Public key file name for SSH scripts'),
            privatekey: z.string().optional().describe('Private key file name for SSH scripts'),
            port: z.string().optional().describe('Port for SSH/Telnet scripts'),
            authtype: z.number().int().min(0).max(1).optional().describe('Authentication type for SSH scripts (0 - password, 1 - public key)')
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
                const enhancedError = handleZabbixError(error, 'error_updating_script', args);
                logger.error('Error updating script::', enhancedError.message);
                logger.debug('Full error details:', enhancedError.details);
                throw new Error(enhancedError.message);
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
                const enhancedError = handleZabbixError(error, 'error_deleting_scripts', args);
                logger.error('Error deleting scripts::', enhancedError.message);
                logger.debug('Full error details:', enhancedError.details);
                throw new Error(enhancedError.message);
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
                const enhancedError = handleZabbixError(error, 'error_executing_script', args);
                logger.error('Error executing script::', enhancedError.message);
                logger.debug('Full error details:', enhancedError.details);
                throw new Error(enhancedError.message);
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
                const enhancedError = handleZabbixError(error, 'error_getting_script_execution_history', args);
                logger.error('Error getting script execution history::', enhancedError.message);
                logger.debug('Full error details:', enhancedError.details);
                throw new Error(enhancedError.message);
            }
        }
    );

    logger.info('Scripts tools registered successfully');
}

module.exports = { registerTools }; 