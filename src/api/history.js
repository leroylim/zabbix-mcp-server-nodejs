const { zabbixRequest } = require('./client');

/**
 * Get history data from Zabbix
 * @param {Object} params - Parameters for history.get
 * @returns {Promise<Array>} Array of history records
 */
async function getHistory(params = {}) {
    return await zabbixRequest('history.get', params);
}

/**
 * Get trends data from Zabbix
 * @param {Object} params - Parameters for trends.get
 * @returns {Promise<Array>} Array of trends records
 */
async function getTrends(params = {}) {
    return await zabbixRequest('trends.get', params);
}

module.exports = {
    historyApi: {
        getHistory,
        getTrends
    }
}; 