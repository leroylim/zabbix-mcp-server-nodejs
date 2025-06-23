const { zabbixRequest } = require('./client');

/**
 * Get actions from Zabbix
 * @param {Object} params - Parameters for action.get
 * @returns {Promise<Array>} Array of actions
 */
async function get(params = {}) {
    return await zabbixRequest('action.get', params);
}

/**
 * Create a new action
 * @param {Object} params - Action creation parameters
 * @returns {Promise<Object>} Creation result with actionids
 */
async function create(params) {
    return await zabbixRequest('action.create', params);
}

/**
 * Update an existing action
 * @param {Object} params - Action update parameters (must include actionid)
 * @returns {Promise<Object>} Update result with actionids
 */
async function update(params) {
    return await zabbixRequest('action.update', params);
}

/**
 * Delete actions
 * @param {Array<string>} actionIds - Array of action IDs to delete
 * @returns {Promise<Object>} Deletion result with actionids
 */
async function deleteActions(actionIds) {
    return await zabbixRequest('action.delete', actionIds);
}

/**
 * Get correlations from Zabbix
 * @param {Object} params - Parameters for correlation.get
 * @returns {Promise<Array>} Array of correlations
 */
async function getCorrelations(params = {}) {
    return await zabbixRequest('correlation.get', params);
}

/**
 * Create a new correlation
 * @param {Object} params - Correlation creation parameters
 * @returns {Promise<Object>} Creation result with correlationids
 */
async function createCorrelation(params) {
    return await zabbixRequest('correlation.create', params);
}

/**
 * Update an existing correlation
 * @param {Object} params - Correlation update parameters (must include correlationid)
 * @returns {Promise<Object>} Update result with correlationids
 */
async function updateCorrelation(params) {
    return await zabbixRequest('correlation.update', params);
}

/**
 * Delete correlations
 * @param {Array<string>} correlationIds - Array of correlation IDs to delete
 * @returns {Promise<Object>} Deletion result with correlationids
 */
async function deleteCorrelations(correlationIds) {
    return await zabbixRequest('correlation.delete', correlationIds);
}

module.exports = {
    actionsApi: {
        get,
        create,
        update,
        delete: deleteActions,
        getCorrelations,
        createCorrelation,
        updateCorrelation,
        deleteCorrelations
    }
}; 