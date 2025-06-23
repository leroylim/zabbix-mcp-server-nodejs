const { zabbixRequest } = require('./client');

/**
 * Get discovery rules from Zabbix
 * @param {Object} params - Parameters for discoveryrule.get
 * @returns {Promise<Array>} Array of discovery rules
 */
async function get(params = {}) {
    return await zabbixRequest('discoveryrule.get', params);
}

/**
 * Create a new discovery rule
 * @param {Object} params - Discovery rule creation parameters
 * @returns {Promise<Object>} Creation result with itemids
 */
async function create(params) {
    return await zabbixRequest('discoveryrule.create', params);
}

/**
 * Update an existing discovery rule
 * @param {Object} params - Discovery rule update parameters (must include itemid)
 * @returns {Promise<Object>} Update result with itemids
 */
async function update(params) {
    return await zabbixRequest('discoveryrule.update', params);
}

/**
 * Delete discovery rules
 * @param {Array<string>} ruleIds - Array of discovery rule IDs to delete
 * @returns {Promise<Object>} Deletion result with itemids
 */
async function deleteRules(ruleIds) {
    return await zabbixRequest('discoveryrule.delete', ruleIds);
}

/**
 * Get discovered hosts from discovery rules
 * @param {Object} params - Parameters for dhost.get
 * @returns {Promise<Array>} Array of discovered hosts
 */
async function getDiscoveredHosts(params = {}) {
    return await zabbixRequest('dhost.get', params);
}

/**
 * Get discovered services from discovery rules
 * @param {Object} params - Parameters for dservice.get
 * @returns {Promise<Array>} Array of discovered services
 */
async function getDiscoveredServices(params = {}) {
    return await zabbixRequest('dservice.get', params);
}

module.exports = {
    discoveryApi: {
        get,
        create,
        update,
        delete: deleteRules,
        getDiscoveredHosts,
        getDiscoveredServices
    }
}; 