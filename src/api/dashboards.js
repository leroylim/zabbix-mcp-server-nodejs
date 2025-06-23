const { zabbixRequest } = require('./client');

/**
 * Get dashboards from Zabbix
 * @param {Object} params - Parameters for dashboard.get
 * @returns {Promise<Array>} Array of dashboards
 */
async function get(params = {}) {
    return await zabbixRequest('dashboard.get', params);
}

/**
 * Create a new dashboard
 * @param {Object} params - Dashboard creation parameters
 * @returns {Promise<Object>} Creation result with dashboardids
 */
async function create(params) {
    return await zabbixRequest('dashboard.create', params);
}

/**
 * Update an existing dashboard
 * @param {Object} params - Dashboard update parameters (must include dashboardid)
 * @returns {Promise<Object>} Update result with dashboardids
 */
async function update(params) {
    return await zabbixRequest('dashboard.update', params);
}

/**
 * Delete dashboards
 * @param {Array<string>} dashboardIds - Array of dashboard IDs to delete
 * @returns {Promise<Object>} Deletion result with dashboardids
 */
async function deleteDashboards(dashboardIds) {
    return await zabbixRequest('dashboard.delete', dashboardIds);
}

module.exports = {
    dashboardsApi: {
        get,
        create,
        update,
        delete: deleteDashboards
    }
}; 