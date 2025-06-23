/**
 * Triggers API Module - Refactored to use zabbix-utils
 * 
 * This module provides trigger management functionality using the zabbix-utils library
 * for improved type safety, automatic authentication, and better error handling.
 */

const { getClient, request } = require('./zabbix-client');
const { logger } = require('../utils/logger');
const config = require('../config');

/**
 * Get triggers from Zabbix
 * @param {Object} options - Parameters for trigger.get
 * @returns {Promise<Array>} Array of triggers
 */
async function getTriggers(options = {}) {
    try {
        logger.debug(`${config.logging.prefix} Getting triggers with options:`, options);
        return await request('trigger.get', options);
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get triggers:`, error.message);
        throw new Error(`Failed to retrieve triggers: ${error.message}`);
    }
}

/**
 * Create a new trigger in Zabbix
 * @param {Object} params - Trigger creation parameters
 * @returns {Promise<Object>} Created trigger information
 */
async function createTrigger(params) {
    // Validate required parameters
    if (!params.description || !params.expression) {
        throw new Error("Parameters 'description' and 'expression' are required for creating a trigger.");
    }

    try {
        logger.info(`${config.logging.prefix} Creating trigger: ${params.description}`);
        const result = await request('trigger.create', params);
        logger.info(`${config.logging.prefix} Successfully created trigger with ID: ${result.triggerids?.[0]}`);
        return result;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to create trigger ${params.description}:`, error.message);
        throw new Error(`Failed to create trigger: ${error.message}`);
    }
}

/**
 * Update an existing trigger in Zabbix
 * @param {Object} params - Trigger update parameters (must include triggerid)
 * @returns {Promise<Object>} Update result
 */
async function updateTrigger(params) {
    if (!params || !params.triggerid) {
        throw new Error("Parameter 'triggerid' is required for updating a trigger.");
    }

    try {
        logger.info(`${config.logging.prefix} Updating trigger ID: ${params.triggerid}`);
        const result = await request('trigger.update', params);
        logger.info(`${config.logging.prefix} Successfully updated trigger ID: ${params.triggerid}`);
        return result;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to update trigger ${params.triggerid}:`, error.message);
        throw new Error(`Failed to update trigger: ${error.message}`);
    }
}

/**
 * Delete triggers from Zabbix
 * @param {Array<string>} triggerIds - Array of trigger IDs to delete
 * @returns {Promise<Object>} Deletion result
 */
async function deleteTriggers(triggerIds) {
    if (!Array.isArray(triggerIds) || triggerIds.length === 0 || !triggerIds.every(id => typeof id === 'string')) {
        throw new Error("deleteTriggers expects a non-empty array of string trigger IDs.");
    }

    try {
        logger.info(`${config.logging.prefix} Deleting triggers: ${triggerIds.join(', ')}`);
        const result = await request('trigger.delete', triggerIds);
        logger.info(`${config.logging.prefix} Successfully deleted ${triggerIds.length} triggers`);
        return result;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to delete triggers:`, error.message);
        throw new Error(`Failed to delete triggers: ${error.message}`);
    }
}

/**
 * Get triggers by host IDs
 * @param {Array<string>} hostIds - Array of host IDs
 * @param {Object} additionalOptions - Additional options for the query
 * @returns {Promise<Array>} Array of triggers for the specified hosts
 */
async function getTriggersByHosts(hostIds, additionalOptions = {}) {
    if (!Array.isArray(hostIds) || hostIds.length === 0) {
        throw new Error("getTriggersByHosts expects a non-empty array of host IDs.");
    }

    try {
        logger.debug(`${config.logging.prefix} Getting triggers for hosts: ${hostIds.join(', ')}`);
        
        const options = {
            output: ['triggerid', 'description', 'expression', 'priority', 'status', 'value'],
            hostids: hostIds,
            selectHosts: ['hostid', 'host', 'name'],
            ...additionalOptions
        };
        
        return await request('trigger.get', options);
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get triggers by hosts:`, error.message);
        throw new Error(`Failed to retrieve triggers by hosts: ${error.message}`);
    }
}

/**
 * Get triggers by priority
 * @param {Array<number>} priorities - Array of priority levels (0-5)
 * @param {Object} additionalOptions - Additional options for the query
 * @returns {Promise<Array>} Array of triggers with specified priorities
 */
async function getTriggersByPriority(priorities, additionalOptions = {}) {
    if (!Array.isArray(priorities) || priorities.length === 0) {
        throw new Error("getTriggersByPriority expects a non-empty array of priority levels.");
    }

    try {
        logger.debug(`${config.logging.prefix} Getting triggers with priorities: ${priorities.join(', ')}`);
        
        const options = {
            output: ['triggerid', 'description', 'expression', 'priority', 'status', 'value'],
            filter: {
                priority: priorities
            },
            selectHosts: ['hostid', 'host', 'name'],
            ...additionalOptions
        };
        
        return await request('trigger.get', options);
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get triggers by priority:`, error.message);
        throw new Error(`Failed to retrieve triggers by priority: ${error.message}`);
    }
}

/**
 * Get active triggers (in problem state)
 * @param {Object} additionalOptions - Additional options for the query
 * @returns {Promise<Array>} Array of active triggers
 */
async function getActiveTriggers(additionalOptions = {}) {
    try {
        logger.debug(`${config.logging.prefix} Getting active triggers`);
        
        const options = {
            output: ['triggerid', 'description', 'expression', 'priority', 'lastchange'],
            filter: {
                value: 1 // 1 = PROBLEM state
            },
            selectHosts: ['hostid', 'host', 'name'],
            selectLastEvent: ['eventid', 'clock', 'acknowledged'],
            sortfield: ['priority', 'lastchange'],
            sortorder: 'DESC',
            ...additionalOptions
        };
        
        return await request('trigger.get', options);
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get active triggers:`, error.message);
        throw new Error(`Failed to retrieve active triggers: ${error.message}`);
    }
}

/**
 * Enable triggers
 * @param {Array<string>} triggerIds - Array of trigger IDs to enable
 * @returns {Promise<Object>} Update result
 */
async function enableTriggers(triggerIds) {
    if (!Array.isArray(triggerIds) || triggerIds.length === 0) {
        throw new Error("enableTriggers expects a non-empty array of trigger IDs.");
    }

    try {
        logger.info(`${config.logging.prefix} Enabling triggers: ${triggerIds.join(', ')}`);
        
        const updateParams = triggerIds.map(triggerid => ({
            triggerid,
            status: 0 // 0 = enabled
        }));
        
        const result = await request('trigger.massupdate', {
            triggers: updateParams,
            status: 0
        });
        
        logger.info(`${config.logging.prefix} Successfully enabled ${triggerIds.length} triggers`);
        return result;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to enable triggers:`, error.message);
        throw new Error(`Failed to enable triggers: ${error.message}`);
    }
}

/**
 * Disable triggers
 * @param {Array<string>} triggerIds - Array of trigger IDs to disable
 * @returns {Promise<Object>} Update result
 */
async function disableTriggers(triggerIds) {
    if (!Array.isArray(triggerIds) || triggerIds.length === 0) {
        throw new Error("disableTriggers expects a non-empty array of trigger IDs.");
    }

    try {
        logger.info(`${config.logging.prefix} Disabling triggers: ${triggerIds.join(', ')}`);
        
        const updateParams = triggerIds.map(triggerid => ({
            triggerid,
            status: 1 // 1 = disabled
        }));
        
        const result = await request('trigger.massupdate', {
            triggers: updateParams,
            status: 1
        });
        
        logger.info(`${config.logging.prefix} Successfully disabled ${triggerIds.length} triggers`);
        return result;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to disable triggers:`, error.message);
        throw new Error(`Failed to disable triggers: ${error.message}`);
    }
}

/**
 * Get trigger prototypes (for discovery rules)
 * @param {Object} options - Parameters for triggerprototype.get
 * @returns {Promise<Array>} Array of trigger prototypes
 */
async function getTriggerPrototypes(options = {}) {
    try {
        logger.debug(`${config.logging.prefix} Getting trigger prototypes`);
        return await request('triggerprototype.get', options);
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get trigger prototypes:`, error.message);
        throw new Error(`Failed to retrieve trigger prototypes: ${error.message}`);
    }
}

/**
 * Create trigger prototype
 * @param {Object} params - Trigger prototype creation parameters
 * @returns {Promise<Object>} Created trigger prototype information
 */
async function createTriggerPrototype(params) {
    if (!params.description || !params.expression) {
        throw new Error("Parameters 'description' and 'expression' are required for creating a trigger prototype.");
    }

    try {
        logger.info(`${config.logging.prefix} Creating trigger prototype: ${params.description}`);
        const result = await request('triggerprototype.create', params);
        logger.info(`${config.logging.prefix} Successfully created trigger prototype with ID: ${result.triggerids?.[0]}`);
        return result;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to create trigger prototype ${params.description}:`, error.message);
        throw new Error(`Failed to create trigger prototype: ${error.message}`);
    }
}

/**
 * Get triggers by template IDs
 * @param {Array<string>} templateIds - Array of template IDs
 * @param {Object} additionalOptions - Additional options for the query
 * @returns {Promise<Array>} Array of triggers from the specified templates
 */
async function getTriggersByTemplates(templateIds, additionalOptions = {}) {
    if (!Array.isArray(templateIds) || templateIds.length === 0) {
        throw new Error("getTriggersByTemplates expects a non-empty array of template IDs.");
    }

    try {
        logger.debug(`${config.logging.prefix} Getting triggers for templates: ${templateIds.join(', ')}`);
        
        const options = {
            output: ['triggerid', 'description', 'expression', 'priority', 'status'],
            templateids: templateIds,
            selectHosts: ['hostid', 'host', 'name'],
            ...additionalOptions
        };
        
        return await request('trigger.get', options);
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get triggers by templates:`, error.message);
        throw new Error(`Failed to retrieve triggers by templates: ${error.message}`);
    }
}

/**
 * Get triggers with dependencies
 * @param {Object} additionalOptions - Additional options for the query
 * @returns {Promise<Array>} Array of triggers with their dependencies
 */
async function getTriggersWithDependencies(additionalOptions = {}) {
    try {
        logger.debug(`${config.logging.prefix} Getting triggers with dependencies`);
        
        const options = {
            output: ['triggerid', 'description', 'expression', 'priority', 'status'],
            selectDependencies: ['triggerid', 'description'],
            selectHosts: ['hostid', 'host', 'name'],
            ...additionalOptions
        };
        
        return await request('trigger.get', options);
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get triggers with dependencies:`, error.message);
        throw new Error(`Failed to retrieve triggers with dependencies: ${error.message}`);
    }
}

module.exports = {
    getTriggers,
    createTrigger,
    updateTrigger,
    deleteTriggers,
    getTriggersByHosts,
    getTriggersByPriority,
    getActiveTriggers,
    enableTriggers,
    disableTriggers,
    getTriggerPrototypes,
    createTriggerPrototype,
    getTriggersByTemplates,
    getTriggersWithDependencies
}; 