const { zabbixRequest } = require('./zabbix-client');
const { logger } = require('../utils/logger');

/**
 * Get history data from Zabbix
 * @param {Object} params - Parameters for history.get
 * @returns {Promise<Array>} Array of history records
 */
async function getHistory(options = { itemids: [], history: 0, output: 'extend', limit: 100 }) {
    try {
        return await zabbixRequest('history.get', options);
    } catch (error) {
        logger.error('Error getting history:', error);
        throw error;
    }
}

/**
 * Get trends data from Zabbix
 * @param {Object} params - Parameters for trends.get
 * @returns {Promise<Array>} Array of trends records
 */
async function getTrends(options = { itemids: [], time_from: Math.floor(Date.now() / 1000) - 3600, time_till: Math.floor(Date.now() / 1000), output: 'extend' }) {
    try {
        return await zabbixRequest('trend.get', options);
    } catch (error) {
        logger.error('Error getting trends:', error);
        throw error;
    }
}

async function getLatestData(options = { itemids: [], output: 'extend', limit: 1 }) {
    try {
        return await zabbixRequest('history.get', { ...options, sortfield: 'clock', sortorder: 'DESC' });
    } catch (error) {
        logger.error('Error getting latest data:', error);
        throw error;
    }
}

module.exports = {
    getHistory,
    getTrends,
    getLatestData
}; 