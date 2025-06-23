const { logger } = require('../utils/logger');
const { ZabbixClient } = require('./zabbix-client');
const config = require('../config');

// Initialize client
const client = new ZabbixClient();

/**
 * Make a request using the zabbix-utils client
 * @param {string} method - API method name
 * @param {Object} params - Request parameters
 * @returns {Promise<any>} API response
 */
async function request(method, params = {}) {
    return await client.request(method, params);
}

/**
 * Get scripts from Zabbix
 * @param {Object} options - Parameters for script.get
 * @returns {Promise<Array>} Array of scripts
 */
async function getScripts(options = {}) {
    try {
        logger.debug(`${config.logging.prefix} Getting scripts`);
        const defaultOptions = {
            output: 'extend',
            selectHosts: ['hostid', 'name'],
            selectHostGroups: ['groupid', 'name']
        };
        
        const params = { ...defaultOptions, ...options };
        return await request('script.get', params);
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get scripts:`, error.message);
        throw new Error(`Failed to retrieve scripts: ${error.message}`);
    }
}

/**
 * Create a new script
 * @param {Object} scriptData - Script creation parameters
 * @returns {Promise<Object>} Creation result with scriptids
 */
async function createScript(scriptData) {
    try {
        logger.debug(`${config.logging.prefix} Creating script: ${scriptData.name}`);
        
        // Validate required fields
        if (!scriptData.name || !scriptData.command) {
            throw new Error("Parameters 'name' and 'command' are required");
        }
        
        const result = await request('script.create', scriptData);
        logger.info(`${config.logging.prefix} Created script: ${scriptData.name} (ID: ${result.scriptids[0]})`);
        return result;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to create script:`, error.message);
        throw new Error(`Failed to create script: ${error.message}`);
    }
}

/**
 * Update an existing script
 * @param {Object} updateData - Script update parameters (must include scriptid)
 * @returns {Promise<Object>} Update result with scriptids
 */
async function updateScript(updateData) {
    try {
        logger.debug(`${config.logging.prefix} Updating script: ${updateData.scriptid}`);
        
        if (!updateData.scriptid) {
            throw new Error("Parameter 'scriptid' is required for updating script");
        }
        
        const result = await request('script.update', updateData);
        logger.info(`${config.logging.prefix} Updated script: ${updateData.scriptid}`);
        return result;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to update script:`, error.message);
        throw new Error(`Failed to update script: ${error.message}`);
    }
}

/**
 * Delete scripts
 * @param {Array<string>} scriptIds - Array of script IDs to delete
 * @returns {Promise<Object>} Deletion result with scriptids
 */
async function deleteScripts(scriptIds) {
    try {
        logger.debug(`${config.logging.prefix} Deleting ${scriptIds.length} scripts`);
        
        if (!Array.isArray(scriptIds) || scriptIds.length === 0) {
            throw new Error("Parameter 'scriptIds' must be a non-empty array");
        }
        
        const result = await request('script.delete', scriptIds);
        logger.info(`${config.logging.prefix} Deleted ${scriptIds.length} scripts`);
        return result;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to delete scripts:`, error.message);
        throw new Error(`Failed to delete scripts: ${error.message}`);
    }
}

/**
 * Execute a script on a host
 * @param {Object} executionData - Script execution parameters
 * @returns {Promise<Object>} Execution result
 */
async function executeScript(executionData) {
    try {
        logger.debug(`${config.logging.prefix} Executing script: ${executionData.scriptid} on host: ${executionData.hostid}`);
        
        // Validate required fields
        if (!executionData.scriptid || !executionData.hostid) {
            throw new Error("Parameters 'scriptid' and 'hostid' are required");
        }
        
        const result = await request('script.execute', executionData);
        logger.info(`${config.logging.prefix} Executed script: ${executionData.scriptid} on host: ${executionData.hostid}`);
        return result;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to execute script:`, error.message);
        throw new Error(`Failed to execute script: ${error.message}`);
    }
}

/**
 * Get scripts by name pattern
 * @param {string} namePattern - Name pattern to search for
 * @param {Object} options - Additional options
 * @returns {Promise<Array>} Array of scripts
 */
async function getScriptsByName(namePattern, options = {}) {
    try {
        logger.debug(`${config.logging.prefix} Getting scripts by name pattern: ${namePattern}`);
        
        if (!namePattern || typeof namePattern !== 'string') {
            throw new Error("Parameter 'namePattern' must be a non-empty string");
        }
        
        const params = {
            search: { name: namePattern },
            searchWildcardsEnabled: true,
            output: 'extend',
            selectHosts: ['hostid', 'name'],
            selectHostGroups: ['groupid', 'name'],
            ...options
        };
        
        return await request('script.get', params);
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get scripts by name:`, error.message);
        throw new Error(`Failed to retrieve scripts by name: ${error.message}`);
    }
}

/**
 * Get scripts by type
 * @param {number} scriptType - Script type (0=script, 1=IPMI, 2=SSH, 3=Telnet, 4=global script, 5=webhook)
 * @param {Object} options - Additional options
 * @returns {Promise<Array>} Array of scripts
 */
async function getScriptsByType(scriptType, options = {}) {
    try {
        logger.debug(`${config.logging.prefix} Getting scripts by type: ${scriptType}`);
        
        if (typeof scriptType !== 'number') {
            throw new Error("Parameter 'scriptType' must be a number");
        }
        
        const params = {
            filter: { type: scriptType },
            output: 'extend',
            selectHosts: ['hostid', 'name'],
            selectHostGroups: ['groupid', 'name'],
            ...options
        };
        
        return await request('script.get', params);
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get scripts by type:`, error.message);
        throw new Error(`Failed to retrieve scripts by type: ${error.message}`);
    }
}

/**
 * Get scripts by scope
 * @param {number} scope - Script scope (1=action operation, 2=manual host action, 4=manual event action)
 * @param {Object} options - Additional options
 * @returns {Promise<Array>} Array of scripts
 */
async function getScriptsByScope(scope, options = {}) {
    try {
        logger.debug(`${config.logging.prefix} Getting scripts by scope: ${scope}`);
        
        if (typeof scope !== 'number') {
            throw new Error("Parameter 'scope' must be a number");
        }
        
        const params = {
            filter: { scope: scope },
            output: 'extend',
            selectHosts: ['hostid', 'name'],
            selectHostGroups: ['groupid', 'name'],
            ...options
        };
        
        return await request('script.get', params);
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get scripts by scope:`, error.message);
        throw new Error(`Failed to retrieve scripts by scope: ${error.message}`);
    }
}

/**
 * Get scripts available for specific hosts
 * @param {Array<string>} hostIds - Array of host IDs
 * @param {Object} options - Additional options
 * @returns {Promise<Array>} Array of scripts
 */
async function getScriptsForHosts(hostIds, options = {}) {
    try {
        logger.debug(`${config.logging.prefix} Getting scripts for ${hostIds.length} hosts`);
        
        if (!Array.isArray(hostIds) || hostIds.length === 0) {
            throw new Error("Parameter 'hostIds' must be a non-empty array");
        }
        
        const params = {
            hostids: hostIds,
            output: 'extend',
            selectHosts: ['hostid', 'name'],
            selectHostGroups: ['groupid', 'name'],
            ...options
        };
        
        return await request('script.get', params);
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get scripts for hosts:`, error.message);
        throw new Error(`Failed to retrieve scripts for hosts: ${error.message}`);
    }
}

/**
 * Get scripts available for specific host groups
 * @param {Array<string>} groupIds - Array of host group IDs
 * @param {Object} options - Additional options
 * @returns {Promise<Array>} Array of scripts
 */
async function getScriptsForHostGroups(groupIds, options = {}) {
    try {
        logger.debug(`${config.logging.prefix} Getting scripts for ${groupIds.length} host groups`);
        
        if (!Array.isArray(groupIds) || groupIds.length === 0) {
            throw new Error("Parameter 'groupIds' must be a non-empty array");
        }
        
        const params = {
            groupids: groupIds,
            output: 'extend',
            selectHosts: ['hostid', 'name'],
            selectHostGroups: ['groupid', 'name'],
            ...options
        };
        
        return await request('script.get', params);
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get scripts for host groups:`, error.message);
        throw new Error(`Failed to retrieve scripts for host groups: ${error.message}`);
    }
}

/**
 * Get global scripts (available for all hosts)
 * @param {Object} options - Additional options
 * @returns {Promise<Array>} Array of global scripts
 */
async function getGlobalScripts(options = {}) {
    try {
        logger.debug(`${config.logging.prefix} Getting global scripts`);
        
        const params = {
            filter: { type: 4 }, // 4 = global script
            output: 'extend',
            selectHosts: ['hostid', 'name'],
            selectHostGroups: ['groupid', 'name'],
            ...options
        };
        
        return await request('script.get', params);
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get global scripts:`, error.message);
        throw new Error(`Failed to retrieve global scripts: ${error.message}`);
    }
}

/**
 * Get webhook scripts
 * @param {Object} options - Additional options
 * @returns {Promise<Array>} Array of webhook scripts
 */
async function getWebhookScripts(options = {}) {
    try {
        logger.debug(`${config.logging.prefix} Getting webhook scripts`);
        
        const params = {
            filter: { type: 5 }, // 5 = webhook
            output: 'extend',
            selectHosts: ['hostid', 'name'],
            selectHostGroups: ['groupid', 'name'],
            ...options
        };
        
        return await request('script.get', params);
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get webhook scripts:`, error.message);
        throw new Error(`Failed to retrieve webhook scripts: ${error.message}`);
    }
}

/**
 * Execute script on multiple hosts
 * @param {string} scriptId - Script ID to execute
 * @param {Array<string>} hostIds - Array of host IDs
 * @param {Object} options - Additional execution options
 * @returns {Promise<Array>} Array of execution results
 */
async function executeScriptOnHosts(scriptId, hostIds, options = {}) {
    try {
        logger.debug(`${config.logging.prefix} Executing script ${scriptId} on ${hostIds.length} hosts`);
        
        if (!scriptId || !Array.isArray(hostIds) || hostIds.length === 0) {
            throw new Error("Parameters 'scriptId' and 'hostIds' (non-empty array) are required");
        }
        
        const results = [];
        for (const hostId of hostIds) {
            try {
                const executionData = {
                    scriptid: scriptId,
                    hostid: hostId,
                    ...options
                };
                
                const result = await executeScript(executionData);
                results.push({
                    hostid: hostId,
                    success: true,
                    result: result
                });
            } catch (error) {
                results.push({
                    hostid: hostId,
                    success: false,
                    error: error.message
                });
            }
        }
        
        logger.info(`${config.logging.prefix} Executed script ${scriptId} on ${hostIds.length} hosts`);
        return results;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to execute script on hosts:`, error.message);
        throw new Error(`Failed to execute script on hosts: ${error.message}`);
    }
}

/**
 * Get script execution history from events
 * @param {Object} options - Filtering options
 * @returns {Promise<Array>} Array of execution history events
 */
async function getScriptExecutionHistory(options = {}) {
    try {
        logger.debug(`${config.logging.prefix} Getting script execution history`);
        
        const params = {
            source: 0, // Trigger events
            object: 0, // Trigger object
            value: 1, // Problem events
            output: 'extend',
            selectHosts: ['hostid', 'name'],
            selectRelatedObject: 'extend',
            sortfield: ['clock'],
            sortorder: 'DESC',
            limit: 100,
            ...options
        };
        
        // Filter for script execution events if possible
        if (options.hostids) {
            params.hostids = options.hostids;
        }
        
        if (options.time_from) {
            params.time_from = options.time_from;
        }
        
        if (options.time_till) {
            params.time_till = options.time_till;
        }
        
        const events = await request('event.get', params);
        
        // Format timestamps for readability
        const formattedEvents = events.map(event => ({
            ...event,
            clock_readable: new Date(event.clock * 1000).toISOString(),
            ns_readable: `${event.ns}ns`
        }));
        
        return formattedEvents;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get script execution history:`, error.message);
        throw new Error(`Failed to retrieve script execution history: ${error.message}`);
    }
}

/**
 * Get script statistics
 * @param {Object} options - Additional filtering options
 * @returns {Promise<Object>} Script statistics
 */
async function getScriptStatistics(options = {}) {
    try {
        logger.debug(`${config.logging.prefix} Getting script statistics`);
        
        const scripts = await getScripts({
            output: ['scriptid', 'name', 'type', 'scope', 'execute_on'],
            selectHosts: 'count',
            selectHostGroups: 'count',
            ...options
        });
        
        const stats = {
            total: scripts.length,
            byType: {},
            byScope: {},
            byExecuteOn: {},
            totalHosts: 0,
            totalHostGroups: 0
        };
        
        // Calculate distributions
        scripts.forEach(script => {
            // Type distribution
            const type = script.type;
            stats.byType[type] = (stats.byType[type] || 0) + 1;
            
            // Scope distribution
            const scope = script.scope;
            stats.byScope[scope] = (stats.byScope[scope] || 0) + 1;
            
            // Execute on distribution
            const executeOn = script.execute_on;
            stats.byExecuteOn[executeOn] = (stats.byExecuteOn[executeOn] || 0) + 1;
            
            // Sum up associations
            stats.totalHosts += parseInt(script.hosts || 0);
            stats.totalHostGroups += parseInt(script.hostGroups || 0);
        });
        
        return stats;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get script statistics:`, error.message);
        throw new Error(`Failed to retrieve script statistics: ${error.message}`);
    }
}

/**
 * Search scripts with multiple criteria
 * @param {Object} criteria - Search criteria
 * @returns {Promise<Array>} Array of matching scripts
 */
async function searchScripts(criteria = {}) {
    try {
        logger.debug(`${config.logging.prefix} Searching scripts with criteria`);
        
        const params = {
            output: 'extend',
            selectHosts: ['hostid', 'name'],
            selectHostGroups: ['groupid', 'name']
        };
        
        // Apply search criteria
        if (criteria.name) {
            params.search = { ...params.search, name: criteria.name };
            params.searchWildcardsEnabled = true;
        }
        
        if (criteria.command) {
            params.search = { ...params.search, command: criteria.command };
            params.searchWildcardsEnabled = true;
        }
        
        if (criteria.type !== undefined) {
            params.filter = { ...params.filter, type: criteria.type };
        }
        
        if (criteria.scope !== undefined) {
            params.filter = { ...params.filter, scope: criteria.scope };
        }
        
        if (criteria.execute_on !== undefined) {
            params.filter = { ...params.filter, execute_on: criteria.execute_on };
        }
        
        if (criteria.hostIds) {
            params.hostids = criteria.hostIds;
        }
        
        if (criteria.groupIds) {
            params.groupids = criteria.groupIds;
        }
        
        return await request('script.get', params);
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to search scripts:`, error.message);
        throw new Error(`Failed to search scripts: ${error.message}`);
    }
}

module.exports = {
    // Core CRUD operations
    getScripts,
    createScript,
    updateScript,
    deleteScripts,
    executeScript,
    
    // Enhanced query functions
    getScriptsByName,
    getScriptsByType,
    getScriptsByScope,
    getScriptsForHosts,
    getScriptsForHostGroups,
    getGlobalScripts,
    getWebhookScripts,
    
    // Execution functions
    executeScriptOnHosts,
    getScriptExecutionHistory,
    
    // Analytics and search
    getScriptStatistics,
    searchScripts,
    
    // Backward compatibility
    scriptsApi: {
        get: getScripts,
        create: createScript,
        update: updateScript,
        delete: deleteScripts,
        execute: executeScript
    }
}; 