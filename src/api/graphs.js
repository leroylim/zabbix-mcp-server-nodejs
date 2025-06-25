const { getClient, request } = require('./zabbix-client');
const { logger } = require('../utils/logger');
const config = require('../config');

/**
 * Get graphs from Zabbix
 * @param {Object} params - Graph filter parameters
 * @returns {Promise<Array>} Array of graph objects
 */
async function getGraphs(params = {}) {
    try {
        logger.debug(`${config.logging.prefix} Getting graphs with params:`, params);
        const response = await request('graph.get', params);
        logger.debug(`${config.logging.prefix} Retrieved ${response.length} graphs`);
        return response;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get graphs:`, error.message);
        throw new Error(`Failed to retrieve graphs: ${error.message}`);
    }
}

/**
 * Create a new graph in Zabbix
 * @param {Object} graphData - Graph object data
 * @returns {Promise<Object>} Created graph IDs
 */
async function createGraph(graphData) {
    try {
        logger.debug(`${config.logging.prefix} Creating graph:`, graphData);
        const response = await request('graph.create', graphData);
        logger.info(`${config.logging.prefix} Created graph with ID: ${response.graphids[0]}`);
        return response;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to create graph:`, error.message);
        throw new Error(`Failed to create graph: ${error.message}`);
    }
}

/**
 * Update an existing graph in Zabbix
 * @param {Object} graphData - Graph object data with graphid
 * @returns {Promise<Object>} Updated graph IDs
 */
async function updateGraph(graphData) {
    try {
        logger.debug(`${config.logging.prefix} Updating graph:`, graphData);
        const response = await request('graph.update', graphData);
        logger.info(`${config.logging.prefix} Updated graph with ID: ${response.graphids[0]}`);
        return response;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to update graph:`, error.message);
        throw new Error(`Failed to update graph: ${error.message}`);
    }
}

/**
 * Delete graphs from Zabbix
 * @param {Array<string>} graphIds - Array of graph IDs to delete
 * @returns {Promise<Object>} Deleted graph IDs
 */
async function deleteGraphs(graphIds) {
    try {
        logger.debug(`${config.logging.prefix} Deleting graphs:`, graphIds);
        const response = await request('graph.delete', graphIds);
        logger.info(`${config.logging.prefix} Deleted ${response.graphids.length} graphs`);
        return response;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to delete graphs:`, error.message);
        throw new Error(`Failed to delete graphs: ${error.message}`);
    }
}

/**
 * Get graph items from Zabbix
 * @param {Object} params - Graph item filter parameters
 * @returns {Promise<Array>} Array of graph item objects
 */
async function getGraphItems(params = {}) {
    try {
        logger.debug(`${config.logging.prefix} Getting graph items with params:`, params);
        const response = await request('graphitem.get', params);
        logger.debug(`${config.logging.prefix} Retrieved ${response.length} graph items`);
        return response;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get graph items:`, error.message);
        throw new Error(`Failed to retrieve graph items: ${error.message}`);
    }
}

/**
 * Get graph prototypes from Zabbix
 * @param {Object} params - Graph prototype filter parameters
 * @returns {Promise<Array>} Array of graph prototype objects
 */
async function getGraphPrototypes(params = {}) {
    try {
        logger.debug(`${config.logging.prefix} Getting graph prototypes with params:`, params);
        const response = await request('graphprototype.get', params);
        logger.debug(`${config.logging.prefix} Retrieved ${response.length} graph prototypes`);
        return response;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get graph prototypes:`, error.message);
        throw new Error(`Failed to retrieve graph prototypes: ${error.message}`);
    }
}

/**
 * Create a new graph prototype in Zabbix
 * @param {Object} prototypeData - Graph prototype object data
 * @returns {Promise<Object>} Created graph prototype IDs
 */
async function createGraphPrototype(prototypeData) {
    try {
        logger.debug(`${config.logging.prefix} Creating graph prototype:`, prototypeData);
        const response = await request('graphprototype.create', prototypeData);
        logger.info(`${config.logging.prefix} Created graph prototype with ID: ${response.graphids[0]}`);
        return response;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to create graph prototype:`, error.message);
        throw new Error(`Failed to create graph prototype: ${error.message}`);
    }
}

/**
 * Update an existing graph prototype in Zabbix
 * @param {Object} prototypeData - Graph prototype object data with graphid
 * @returns {Promise<Object>} Updated graph prototype IDs
 */
async function updateGraphPrototype(prototypeData) {
    try {
        logger.debug(`${config.logging.prefix} Updating graph prototype:`, prototypeData);
        const response = await request('graphprototype.update', prototypeData);
        logger.info(`${config.logging.prefix} Updated graph prototype with ID: ${response.graphids[0]}`);
        return response;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to update graph prototype:`, error.message);
        throw new Error(`Failed to update graph prototype: ${error.message}`);
    }
}

/**
 * Delete graph prototypes from Zabbix
 * @param {Array<string>} prototypeIds - Array of graph prototype IDs to delete
 * @returns {Promise<Object>} Deleted graph prototype IDs
 */
async function deleteGraphPrototypes(prototypeIds) {
    try {
        logger.debug(`${config.logging.prefix} Deleting graph prototypes:`, prototypeIds);
        const response = await request('graphprototype.delete', prototypeIds);
        logger.info(`${config.logging.prefix} Deleted ${response.graphids.length} graph prototypes`);
        return response;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to delete graph prototypes:`, error.message);
        throw new Error(`Failed to delete graph prototypes: ${error.message}`);
    }
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
