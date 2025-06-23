const { zabbixRequest } = require('./client');

/**
 * Export configuration from Zabbix
 * @param {Object} params - Parameters for configuration.export
 * @returns {Promise<string>} Exported configuration as XML/JSON string
 */
async function exportConfiguration(params) {
    return await zabbixRequest('configuration.export', params);
}

/**
 * Import configuration to Zabbix
 * @param {Object} params - Parameters for configuration.import
 * @returns {Promise<Object>} Import result
 */
async function importConfiguration(params) {
    return await zabbixRequest('configuration.import', params);
}

/**
 * Compare configuration for import
 * @param {Object} params - Parameters for configuration.importcompare
 * @returns {Promise<Object>} Import comparison result
 */
async function importCompare(params) {
    return await zabbixRequest('configuration.importcompare', params);
}

module.exports = {
    configurationApi: {
        exportConfiguration,
        importConfiguration,
        importCompare
    }
}; 