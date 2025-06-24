/**
 * Items API Module - Refactored to use zabbix-utils
 * 
 * This module provides item management functionality using the zabbix-utils library
 * for improved type safety, automatic authentication, and better error handling.
 */

const { getClient, request } = require('./zabbix-client');
const { logger } = require('../utils/logger');
const config = require('../config');

/**
 * Get items from Zabbix
 * @param {Object} options - Parameters for item.get
 * @returns {Promise<Array>} Array of items
 */
async function getItems(options = {}) {
    try {
        logger.debug(`${config.logging.prefix} Getting items with options:`, options);
        return await request('item.get', options);
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get items:`, error.message);
        throw new Error(`Failed to retrieve items: ${error.message}`);
    }
}

/**
 * Create a new item in Zabbix
 * @param {Object} params - Item creation parameters
 * @returns {Promise<Object>} Created item information
 */
async function createItem(params) {
    // Validate required parameters
    if (!params.name || !params.key_ || !params.hostid || 
        typeof params.type === 'undefined' || typeof params.value_type === 'undefined') {
        throw new Error("Parameters 'name', 'key_', 'hostid', 'type', and 'value_type' are required for creating an item.");
    }

    try {
        logger.info(`${config.logging.prefix} Creating item: ${params.name} on host ${params.hostid}`);
        
        // Ensure applications are in the correct format if provided as array of strings
        if (params.applications && Array.isArray(params.applications) && 
            params.applications.every(app => typeof app === 'string')) {
            params.applications = params.applications.map(appId => ({ applicationid: appId }));
        }
        
        const result = await request('item.create', params);
        logger.info(`${config.logging.prefix} Successfully created item with ID: ${result.itemids?.[0]}`);
        return result;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to create item ${params.name}:`, error.message);
        throw new Error(`Failed to create item: ${error.message}`);
    }
}

/**
 * Update an existing item in Zabbix
 * @param {Object} params - Item update parameters (must include itemid)
 * @returns {Promise<Object>} Update result
 */
async function updateItem(params) {
    if (!params || !params.itemid) {
        throw new Error("Parameter 'itemid' is required for updating an item.");
    }

    try {
        logger.info(`${config.logging.prefix} Updating item ID: ${params.itemid}`);
        const result = await request('item.update', params);
        logger.info(`${config.logging.prefix} Successfully updated item ID: ${params.itemid}`);
        return result;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to update item ${params.itemid}:`, error.message);
        throw new Error(`Failed to update item: ${error.message}`);
    }
}

/**
 * Delete items from Zabbix
 * @param {Array<string>} itemIds - Array of item IDs to delete
 * @returns {Promise<Object>} Deletion result
 */
async function deleteItems(itemIds) {
    if (!Array.isArray(itemIds) || itemIds.length === 0 || !itemIds.every(id => typeof id === 'string')) {
        throw new Error("deleteItems expects a non-empty array of string item IDs.");
    }

    try {
        logger.info(`${config.logging.prefix} Deleting items: ${itemIds.join(', ')}`);
        const result = await request('item.delete', itemIds);
        logger.info(`${config.logging.prefix} Successfully deleted ${itemIds.length} items`);
        return result;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to delete items:`, error.message);
        throw new Error(`Failed to delete items: ${error.message}`);
    }
}

/**
 * Get items by single host ID
 * @param {string} hostId - Single host ID
 * @param {Object} additionalOptions - Additional options for the query
 * @returns {Promise<Array>} Array of items for the specified host
 */
async function getItemsByHost(hostId, additionalOptions = {}) {
    if (!hostId) {
        throw new Error("getItemsByHost expects a host ID.");
    }

    try {
        logger.debug(`${config.logging.prefix} Getting items for host: ${hostId}`);
        
        const options = {
            output: ['itemid', 'name', 'key_', 'type', 'value_type', 'status', 'units', 'lastvalue', 'lastclock'],
            hostids: [hostId],
            selectHosts: ['hostid', 'host', 'name'],
            ...additionalOptions
        };
        
        return await request('item.get', options);
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get items by host:`, error.message);
        throw new Error(`Failed to retrieve items by host: ${error.message}`);
    }
}

/**
 * Get items by host IDs
 * @param {Array<string>} hostIds - Array of host IDs
 * @param {Object} additionalOptions - Additional options for the query
 * @returns {Promise<Array>} Array of items for the specified hosts
 */
async function getItemsByHosts(hostIds, additionalOptions = {}) {
    if (!Array.isArray(hostIds) || hostIds.length === 0) {
        throw new Error("getItemsByHosts expects a non-empty array of host IDs.");
    }

    try {
        logger.debug(`${config.logging.prefix} Getting items for hosts: ${hostIds.join(', ')}`);
        
        const options = {
            output: ['itemid', 'name', 'key_', 'type', 'value_type', 'status'],
            hostids: hostIds,
            ...additionalOptions
        };
        
        return await request('item.get', options);
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get items by hosts:`, error.message);
        throw new Error(`Failed to retrieve items by hosts: ${error.message}`);
    }
}

/**
 * Get items by key pattern
 * @param {string|Array<string>} keyPatterns - Item key pattern(s)
 * @param {Object} additionalOptions - Additional options for the query
 * @returns {Promise<Array>} Array of matching items
 */
async function getItemsByKey(keyPatterns, additionalOptions = {}) {
    const patterns = Array.isArray(keyPatterns) ? keyPatterns : [keyPatterns];
    
    try {
        logger.debug(`${config.logging.prefix} Getting items by key patterns: ${patterns.join(', ')}`);
        
        const options = {
            output: ['itemid', 'name', 'key_', 'hostid', 'type', 'value_type', 'status'],
            search: {
                key_: patterns
            },
            searchWildcardsEnabled: true,
            ...additionalOptions
        };
        
        return await request('item.get', options);
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get items by key:`, error.message);
        throw new Error(`Failed to retrieve items by key: ${error.message}`);
    }
}

/**
 * Get latest data for items
 * @param {Array<string>} itemIds - Array of item IDs
 * @param {Object} additionalOptions - Additional options for the query
 * @returns {Promise<Array>} Array of items with latest data
 */
async function getLatestData(itemIds, additionalOptions = {}) {
    if (!Array.isArray(itemIds) || itemIds.length === 0) {
        throw new Error("getLatestData expects a non-empty array of item IDs.");
    }

    try {
        logger.debug(`${config.logging.prefix} Getting latest data for ${itemIds.length} items`);
        
        const options = {
            output: ['itemid', 'name', 'key_', 'lastvalue', 'lastclock', 'prevvalue'],
            itemids: itemIds,
            selectHosts: ['hostid', 'host', 'name'],
            ...additionalOptions
        };
        
        return await request('item.get', options);
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get latest data:`, error.message);
        throw new Error(`Failed to retrieve latest data: ${error.message}`);
    }
}

/**
 * Enable items
 * @param {Array<string>} itemIds - Array of item IDs to enable
 * @returns {Promise<Object>} Update result
 */
async function enableItems(itemIds) {
    if (!Array.isArray(itemIds) || itemIds.length === 0) {
        throw new Error("enableItems expects a non-empty array of item IDs.");
    }

    try {
        logger.info(`${config.logging.prefix} Enabling items: ${itemIds.join(', ')}`);
        
        const updateParams = itemIds.map(itemid => ({
            itemid,
            status: 0 // 0 = enabled
        }));
        
        const result = await request('item.massupdate', {
            items: updateParams,
            status: 0
        });
        
        logger.info(`${config.logging.prefix} Successfully enabled ${itemIds.length} items`);
        return result;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to enable items:`, error.message);
        throw new Error(`Failed to enable items: ${error.message}`);
    }
}

/**
 * Disable items
 * @param {Array<string>} itemIds - Array of item IDs to disable
 * @returns {Promise<Object>} Update result
 */
async function disableItems(itemIds) {
    if (!Array.isArray(itemIds) || itemIds.length === 0) {
        throw new Error("disableItems expects a non-empty array of item IDs.");
    }

    try {
        logger.info(`${config.logging.prefix} Disabling items: ${itemIds.join(', ')}`);
        
        const updateParams = itemIds.map(itemid => ({
            itemid,
            status: 1 // 1 = disabled
        }));
        
        const result = await request('item.massupdate', {
            items: updateParams,
            status: 1
        });
        
        logger.info(`${config.logging.prefix} Successfully disabled ${itemIds.length} items`);
        return result;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to disable items:`, error.message);
        throw new Error(`Failed to disable items: ${error.message}`);
    }
}

/**
 * Get item prototypes (for discovery rules)
 * @param {Object} options - Parameters for itemprototype.get
 * @returns {Promise<Array>} Array of item prototypes
 */
async function getItemPrototypes(options = {}) {
    try {
        logger.debug(`${config.logging.prefix} Getting item prototypes`);
        return await request('itemprototype.get', options);
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get item prototypes:`, error.message);
        throw new Error(`Failed to retrieve item prototypes: ${error.message}`);
    }
}

/**
 * Create item prototype
 * @param {Object} params - Item prototype creation parameters
 * @returns {Promise<Object>} Created item prototype information
 */
async function createItemPrototype(params) {
    if (!params.name || !params.key_ || !params.ruleid || 
        typeof params.type === 'undefined' || typeof params.value_type === 'undefined') {
        throw new Error("Parameters 'name', 'key_', 'ruleid', 'type', and 'value_type' are required for creating an item prototype.");
    }

    try {
        logger.info(`${config.logging.prefix} Creating item prototype: ${params.name}`);
        const result = await request('itemprototype.create', params);
        logger.info(`${config.logging.prefix} Successfully created item prototype with ID: ${result.itemids?.[0]}`);
        return result;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to create item prototype ${params.name}:`, error.message);
        throw new Error(`Failed to create item prototype: ${error.message}`);
    }
}

/**
 * Get items with specific value types
 * @param {Array<number>} valueTypes - Array of value type IDs (0=float, 1=char, 2=log, 3=unsigned, 4=text)
 * @param {Object} additionalOptions - Additional options for the query
 * @returns {Promise<Array>} Array of items with specified value types
 */
async function getItemsByValueType(valueTypes, additionalOptions = {}) {
    if (!Array.isArray(valueTypes) || valueTypes.length === 0) {
        throw new Error("getItemsByValueType expects a non-empty array of value type IDs.");
    }

    try {
        logger.debug(`${config.logging.prefix} Getting items with value types: ${valueTypes.join(', ')}`);
        
        const options = {
            output: ['itemid', 'name', 'key_', 'type', 'value_type', 'units'],
            filter: {
                value_type: valueTypes
            },
            ...additionalOptions
        };
        
        return await request('item.get', options);
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get items by value type:`, error.message);
        throw new Error(`Failed to retrieve items by value type: ${error.message}`);
    }
}

module.exports = {
    getItems,
    createItem,
    updateItem,
    deleteItems,
    getItemsByHost,
    getItemsByHosts,
    getItemsByKey,
    getLatestData,
    enableItems,
    disableItems,
    getItemPrototypes,
    createItemPrototype,
    getItemsByValueType
}; 