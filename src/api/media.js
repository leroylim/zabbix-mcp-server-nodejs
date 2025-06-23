const { zabbixRequest } = require('./client');

/**
 * Get media types from Zabbix
 * @param {Object} params - Parameters for mediatype.get
 * @returns {Promise<Array>} Array of media types
 */
async function get(params = {}) {
    return await zabbixRequest('mediatype.get', params);
}

/**
 * Create a new media type
 * @param {Object} params - Media type creation parameters
 * @returns {Promise<Object>} Creation result with mediatypeids
 */
async function create(params) {
    return await zabbixRequest('mediatype.create', params);
}

/**
 * Update an existing media type
 * @param {Object} params - Media type update parameters (must include mediatypeid)
 * @returns {Promise<Object>} Update result with mediatypeids
 */
async function update(params) {
    return await zabbixRequest('mediatype.update', params);
}

/**
 * Delete media types
 * @param {Array<string>} mediaTypeIds - Array of media type IDs to delete
 * @returns {Promise<Object>} Deletion result with mediatypeids
 */
async function deleteMediaTypes(mediaTypeIds) {
    return await zabbixRequest('mediatype.delete', mediaTypeIds);
}

/**
 * Test media type delivery
 * @param {Object} params - Media type test parameters
 * @returns {Promise<Object>} Test result
 */
async function test(params) {
    return await zabbixRequest('mediatype.test', params);
}

/**
 * Get user media (notification settings)
 * @param {Object} params - Parameters for usermedia.get
 * @returns {Promise<Array>} Array of user media
 */
async function getUserMedia(params = {}) {
    return await zabbixRequest('usermedia.get', params);
}

/**
 * Get alerts (sent notifications)
 * @param {Object} params - Parameters for alert.get
 * @returns {Promise<Array>} Array of alerts
 */
async function getAlerts(params = {}) {
    return await zabbixRequest('alert.get', params);
}

module.exports = {
    mediaApi: {
        get,
        create,
        update,
        delete: deleteMediaTypes,
        test,
        getUserMedia,
        getAlerts
    }
}; 