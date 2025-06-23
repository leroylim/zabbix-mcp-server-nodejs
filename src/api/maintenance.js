const { zabbixRequest } = require('./client');

/**
 * Get maintenance periods from Zabbix
 * @param {Object} params - Parameters for maintenance.get
 * @returns {Promise<Array>} Array of maintenance periods
 */
async function get(params = {}) {
    return await zabbixRequest('maintenance.get', params);
}

/**
 * Create a new maintenance period
 * @param {Object} params - Maintenance creation parameters
 * @returns {Promise<Object>} Creation result with maintenanceids
 */
async function create(params) {
    return await zabbixRequest('maintenance.create', params);
}

/**
 * Update an existing maintenance period
 * @param {Object} params - Maintenance update parameters (must include maintenanceid)
 * @returns {Promise<Object>} Update result with maintenanceids
 */
async function update(params) {
    return await zabbixRequest('maintenance.update', params);
}

/**
 * Delete maintenance periods
 * @param {Array<string>} maintenanceIds - Array of maintenance IDs to delete
 * @returns {Promise<Object>} Deletion result with maintenanceids
 */
async function deleteMaintenance(maintenanceIds) {
    return await zabbixRequest('maintenance.delete', maintenanceIds);
}

module.exports = {
    maintenanceApi: {
        get,
        create,
        update,
        delete: deleteMaintenance
    }
}; 