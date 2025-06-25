const { logger } = require('../utils/logger');

/**
 * Get graphs from Zabbix
 * @param {Object} params - Graph filter parameters
 * @returns {Promise<Array>} Array of graph objects
 */
async function getGraphs(params = {}) {
    logger.debug('Getting graphs with params:', params);
    
    const response = await this.makeApiCall('graph.get', params);
    
    logger.debug(`Retrieved ${response.length} graphs`);
    return response;
}

/**
 * Create a new graph in Zabbix
 * @param {Object} graphData - Graph object data
 * @returns {Promise<Object>} Created graph IDs
 */
async function createGraph(graphData) {
    logger.debug('Creating graph:', graphData);
    
    const response = await this.makeApiCall('graph.create', graphData);
    
    logger.info(`Created graph with ID: ${response.graphids[0]}`);
    return response;
}

/**
 * Update an existing graph in Zabbix
 * @param {Object} graphData - Graph object data with graphid
 * @returns {Promise<Object>} Updated graph IDs
 */
async function updateGraph(graphData) {
    logger.debug('Updating graph:', graphData);
    
    const response = await this.makeApiCall('graph.update', graphData);
    
    logger.info(`Updated graph with ID: ${response.graphids[0]}`);
    return response;
}

/**
 * Delete graphs from Zabbix
 * @param {Array<string>} graphIds - Array of graph IDs to delete
 * @returns {Promise<Object>} Deleted graph IDs
 */
async function deleteGraphs(graphIds) {
    logger.debug('Deleting graphs:', graphIds);
    
    const response = await this.makeApiCall('graph.delete', graphIds);
    
    logger.info(`Deleted ${response.graphids.length} graphs`);
    return response;
}

/**
 * Get graph items from Zabbix
 * @param {Object} params - Graph item filter parameters
 * @returns {Promise<Array>} Array of graph item objects
 */
async function getGraphItems(params = {}) {
    logger.debug('Getting graph items with params:', params);
    
    const response = await this.makeApiCall('graphitem.get', params);
    
    logger.debug(`Retrieved ${response.length} graph items`);
    return response;
}

/**
 * Get graph prototypes from Zabbix
 * @param {Object} params - Graph prototype filter parameters
 * @returns {Promise<Array>} Array of graph prototype objects
 */
async function getGraphPrototypes(params = {}) {
    logger.debug('Getting graph prototypes with params:', params);
    
    const response = await this.makeApiCall('graphprototype.get', params);
    
    logger.debug(`Retrieved ${response.length} graph prototypes`);
    return response;
}

/**
 * Create a new graph prototype in Zabbix
 * @param {Object} prototypeData - Graph prototype object data
 * @returns {Promise<Object>} Created graph prototype IDs
 */
async function createGraphPrototype(prototypeData) {
    logger.debug('Creating graph prototype:', prototypeData);
    
    const response = await this.makeApiCall('graphprototype.create', prototypeData);
    
    logger.info(`Created graph prototype with ID: ${response.graphids[0]}`);
    return response;
}

/**
 * Update an existing graph prototype in Zabbix
 * @param {Object} prototypeData - Graph prototype object data with graphid
 * @returns {Promise<Object>} Updated graph prototype IDs
 */
async function updateGraphPrototype(prototypeData) {
    logger.debug('Updating graph prototype:', prototypeData);
    
    const response = await this.makeApiCall('graphprototype.update', prototypeData);
    
    logger.info(`Updated graph prototype with ID: ${response.graphids[0]}`);
    return response;
}

/**
 * Delete graph prototypes from Zabbix
 * @param {Array<string>} prototypeIds - Array of graph prototype IDs to delete
 * @returns {Promise<Object>} Deleted graph prototype IDs
 */
async function deleteGraphPrototypes(prototypeIds) {
    logger.debug('Deleting graph prototypes:', prototypeIds);
    
    const response = await this.makeApiCall('graphprototype.delete', prototypeIds);
    
    logger.info(`Deleted ${response.graphids.length} graph prototypes`);
    return response;
}

module.exports = {
    getGraphs,
    createGraph,
    updateGraph,
    deleteGraphs,
    getGraphItems,
    getGraphPrototypes,
    createGraphPrototype,
    updateGraphPrototype,
    deleteGraphPrototypes
};
