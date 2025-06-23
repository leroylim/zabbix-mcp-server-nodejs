const { zabbixRequest } = require('./client');

/**
 * Get value maps from Zabbix
 * @param {Object} params - Parameters for valuemap.get
 * @returns {Promise<Array>} Array of value maps
 */
async function getValueMaps(params = {}) {
    return await zabbixRequest('valuemap.get', params);
}

/**
 * Create a new value map
 * @param {Object} params - Value map creation parameters
 * @returns {Promise<Object>} Creation result with valuemapids
 */
async function createValueMap(params) {
    return await zabbixRequest('valuemap.create', params);
}

/**
 * Update an existing value map
 * @param {Object} params - Value map update parameters (must include valuemapid)
 * @returns {Promise<Object>} Update result with valuemapids
 */
async function updateValueMap(params) {
    return await zabbixRequest('valuemap.update', params);
}

/**
 * Delete value maps
 * @param {Array<string>} valueMapIds - Array of value map IDs to delete
 * @returns {Promise<Object>} Deletion result with valuemapids
 */
async function deleteValueMaps(valueMapIds) {
    return await zabbixRequest('valuemap.delete', valueMapIds);
}

/**
 * Get icon maps from Zabbix
 * @param {Object} params - Parameters for iconmap.get
 * @returns {Promise<Array>} Array of icon maps
 */
async function getIconMaps(params = {}) {
    return await zabbixRequest('iconmap.get', params);
}

/**
 * Create a new icon map
 * @param {Object} params - Icon map creation parameters
 * @returns {Promise<Object>} Creation result with iconmapids
 */
async function createIconMap(params) {
    return await zabbixRequest('iconmap.create', params);
}

/**
 * Update an existing icon map
 * @param {Object} params - Icon map update parameters (must include iconmapid)
 * @returns {Promise<Object>} Update result with iconmapids
 */
async function updateIconMap(params) {
    return await zabbixRequest('iconmap.update', params);
}

/**
 * Delete icon maps
 * @param {Array<string>} iconMapIds - Array of icon map IDs to delete
 * @returns {Promise<Object>} Deletion result with iconmapids
 */
async function deleteIconMaps(iconMapIds) {
    return await zabbixRequest('iconmap.delete', iconMapIds);
}

/**
 * Get network maps from Zabbix
 * @param {Object} params - Parameters for map.get
 * @returns {Promise<Array>} Array of network maps
 */
async function getMaps(params = {}) {
    return await zabbixRequest('map.get', params);
}

/**
 * Create a new network map
 * @param {Object} params - Network map creation parameters
 * @returns {Promise<Object>} Creation result with sysmapids
 */
async function createMap(params) {
    return await zabbixRequest('map.create', params);
}

/**
 * Update an existing network map
 * @param {Object} params - Network map update parameters (must include sysmapid)
 * @returns {Promise<Object>} Update result with sysmapids
 */
async function updateMap(params) {
    return await zabbixRequest('map.update', params);
}

/**
 * Delete network maps
 * @param {Array<string>} mapIds - Array of network map IDs to delete
 * @returns {Promise<Object>} Deletion result with sysmapids
 */
async function deleteMaps(mapIds) {
    return await zabbixRequest('map.delete', mapIds);
}

module.exports = {
    mapsApi: {
        getValueMaps,
        createValueMap,
        updateValueMap,
        deleteValueMaps,
        getIconMaps,
        createIconMap,
        updateIconMap,
        deleteIconMaps,
        getMaps,
        createMap,
        updateMap,
        deleteMaps
    }
}; 