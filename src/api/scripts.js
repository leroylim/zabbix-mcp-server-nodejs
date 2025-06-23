const { zabbixRequest } = require('./client');

/**
 * Get scripts from Zabbix
 * @param {Object} params - Parameters for script.get
 * @returns {Promise<Array>} Array of scripts
 */
async function get(params = {}) {
    return await zabbixRequest('script.get', params);
}

/**
 * Create a new script
 * @param {Object} params - Script creation parameters
 * @returns {Promise<Object>} Creation result with scriptids
 */
async function create(params) {
    return await zabbixRequest('script.create', params);
}

/**
 * Update an existing script
 * @param {Object} params - Script update parameters (must include scriptid)
 * @returns {Promise<Object>} Update result with scriptids
 */
async function update(params) {
    return await zabbixRequest('script.update', params);
}

/**
 * Delete scripts
 * @param {Array<string>} scriptIds - Array of script IDs to delete
 * @returns {Promise<Object>} Deletion result with scriptids
 */
async function deleteScripts(scriptIds) {
    return await zabbixRequest('script.delete', scriptIds);
}

/**
 * Execute a script
 * @param {Object} params - Script execution parameters
 * @returns {Promise<Object>} Execution result
 */
async function execute(params) {
    return await zabbixRequest('script.execute', params);
}

module.exports = {
    scriptsApi: {
        get,
        create,
        update,
        delete: deleteScripts,
        execute
    }
}; 