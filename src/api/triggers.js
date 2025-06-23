const { zabbixRequest } = require('./client');

/**
 * Get triggers from Zabbix
 * @param {Object} params - Parameters for trigger.get
 * @returns {Promise<Array>} Array of triggers
 */
async function get(params = {}) {
    return await zabbixRequest('trigger.get', params);
}

/**
 * Create a new trigger
 * @param {Object} params - Trigger creation parameters
 * @returns {Promise<Object>} Creation result with triggerids
 */
async function create(params) {
    return await zabbixRequest('trigger.create', params);
}

/**
 * Update an existing trigger
 * @param {Object} params - Trigger update parameters (must include triggerid)
 * @returns {Promise<Object>} Update result with triggerids
 */
async function update(params) {
    return await zabbixRequest('trigger.update', params);
}

/**
 * Delete triggers
 * @param {Array<string>} triggerIds - Array of trigger IDs to delete
 * @returns {Promise<Object>} Deletion result with triggerids
 */
async function deleteTriggers(triggerIds) {
    return await zabbixRequest('trigger.delete', triggerIds);
}

module.exports = {
    triggersApi: {
        get,
        create,
        update,
        delete: deleteTriggers
    }
}; 