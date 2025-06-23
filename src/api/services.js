const { zabbixRequest } = require('./client');

/**
 * Get services from Zabbix
 * @param {Object} params - Parameters for service.get
 * @returns {Promise<Array>} Array of services
 */
async function get(params = {}) {
    return await zabbixRequest('service.get', params);
}

/**
 * Create a new service
 * @param {Object} params - Service creation parameters
 * @returns {Promise<Object>} Creation result with serviceids
 */
async function create(params) {
    return await zabbixRequest('service.create', params);
}

/**
 * Update an existing service
 * @param {Object} params - Service update parameters (must include serviceid)
 * @returns {Promise<Object>} Update result with serviceids
 */
async function update(params) {
    return await zabbixRequest('service.update', params);
}

/**
 * Delete services
 * @param {Array<string>} serviceIds - Array of service IDs to delete
 * @returns {Promise<Object>} Deletion result with serviceids
 */
async function deleteServices(serviceIds) {
    return await zabbixRequest('service.delete', serviceIds);
}

/**
 * Get service SLA data
 * @param {Array<string>} serviceIds - Array of service IDs
 * @param {Array<Object>} intervals - Array of time intervals
 * @returns {Promise<Array>} Array of SLA data
 */
async function getSLA(serviceIds, intervals) {
    return await zabbixRequest('service.getsla', { serviceids: serviceIds, intervals: intervals });
}

module.exports = {
    servicesApi: {
        get,
        create,
        update,
        delete: deleteServices,
        getSLA
    }
}; 