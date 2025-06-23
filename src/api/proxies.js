const { zabbixRequest } = require('./client');

/**
 * Get proxies from Zabbix
 * @param {Object} params - Parameters for proxy.get
 * @returns {Promise<Array>} Array of proxies
 */
async function get(params = {}) {
    return await zabbixRequest('proxy.get', params);
}

/**
 * Create a new proxy
 * @param {Object} params - Proxy creation parameters
 * @returns {Promise<Object>} Creation result with proxyids
 */
async function create(params) {
    return await zabbixRequest('proxy.create', params);
}

/**
 * Update an existing proxy
 * @param {Object} params - Proxy update parameters (must include proxyid)
 * @returns {Promise<Object>} Update result with proxyids
 */
async function update(params) {
    return await zabbixRequest('proxy.update', params);
}

/**
 * Delete proxies
 * @param {Array<string>} proxyIds - Array of proxy IDs to delete
 * @returns {Promise<Object>} Deletion result with proxyids
 */
async function deleteProxies(proxyIds) {
    return await zabbixRequest('proxy.delete', proxyIds);
}

module.exports = {
    proxiesApi: {
        get,
        create,
        update,
        delete: deleteProxies
    }
};