/**
 * Actions API Module - Refactored to use zabbix-utils
 * 
 * This module provides action management functionality using the zabbix-utils library
 * for improved type safety, automatic authentication, and better error handling.
 */

const { getClient, request } = require('./zabbix-client');
const { logger } = require('../utils/logger');
const config = require('../config');

/**
 * Get actions from Zabbix
 * @param {Object} options - Parameters for action.get
 * @returns {Promise<Array>} Array of actions
 */
async function getActions(options = {}) {
    try {
        logger.debug(`${config.logging.prefix} Getting actions with options:`, options);
        return await request('action.get', options);
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get actions:`, error.message);
        throw new Error(`Failed to retrieve actions: ${error.message}`);
    }
}

/**
 * Create a new action in Zabbix
 * @param {Object} params - Action creation parameters
 * @returns {Promise<Object>} Created action information
 */
async function createAction(params) {
    // Validate required parameters
    if (!params.name || !params.eventsource) {
        throw new Error("Parameters 'name' and 'eventsource' are required for creating an action.");
    }

    try {
        logger.info(`${config.logging.prefix} Creating action: ${params.name}`);
        const result = await request('action.create', params);
        logger.info(`${config.logging.prefix} Successfully created action with ID: ${result.actionids?.[0]}`);
        return result;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to create action ${params.name}:`, error.message);
        throw new Error(`Failed to create action: ${error.message}`);
    }
}

/**
 * Update an existing action in Zabbix
 * @param {Object} params - Action update parameters (must include actionid)
 * @returns {Promise<Object>} Update result
 */
async function updateAction(params) {
    if (!params || !params.actionid) {
        throw new Error("Parameter 'actionid' is required for updating an action.");
    }

    try {
        logger.info(`${config.logging.prefix} Updating action ID: ${params.actionid}`);
        const result = await request('action.update', params);
        logger.info(`${config.logging.prefix} Successfully updated action ID: ${params.actionid}`);
        return result;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to update action ${params.actionid}:`, error.message);
        throw new Error(`Failed to update action: ${error.message}`);
    }
}

/**
 * Delete actions from Zabbix
 * @param {Array<string>} actionIds - Array of action IDs to delete
 * @returns {Promise<Object>} Deletion result
 */
async function deleteActions(actionIds) {
    if (!Array.isArray(actionIds) || actionIds.length === 0 || !actionIds.every(id => typeof id === 'string')) {
        throw new Error("deleteActions expects a non-empty array of string action IDs.");
    }

    try {
        logger.info(`${config.logging.prefix} Deleting actions: ${actionIds.join(', ')}`);
        const result = await request('action.delete', actionIds);
        logger.info(`${config.logging.prefix} Successfully deleted ${actionIds.length} actions`);
        return result;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to delete actions:`, error.message);
        throw new Error(`Failed to delete actions: ${error.message}`);
    }
}

/**
 * Get actions by name pattern
 * @param {string|Array<string>} namePatterns - Action name pattern(s)
 * @param {Object} additionalOptions - Additional options for the query
 * @returns {Promise<Array>} Array of matching actions
 */
async function getActionsByName(namePatterns, additionalOptions = {}) {
    const patterns = Array.isArray(namePatterns) ? namePatterns : [namePatterns];
    
    try {
        logger.debug(`${config.logging.prefix} Getting actions by name patterns: ${patterns.join(', ')}`);
        
        const options = {
            output: ['actionid', 'name', 'eventsource', 'status', 'esc_period'],
            search: {
                name: patterns
            },
            searchWildcardsEnabled: true,
            selectOperations: ['operationid', 'operationtype', 'esc_period', 'esc_step_from', 'esc_step_to'],
            selectRecoveryOperations: ['operationid', 'operationtype'],
            selectAcknowledgeOperations: ['operationid', 'operationtype'],
            ...additionalOptions
        };
        
        return await request('action.get', options);
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get actions by name:`, error.message);
        throw new Error(`Failed to retrieve actions by name: ${error.message}`);
    }
}

/**
 * Get actions by event source
 * @param {string|Array<string>} eventSources - Event source(s) (0=trigger, 1=discovery, 2=auto registration, 3=internal)
 * @param {Object} additionalOptions - Additional options for the query
 * @returns {Promise<Array>} Array of actions for the specified event sources
 */
async function getActionsByEventSource(eventSources, additionalOptions = {}) {
    const sources = Array.isArray(eventSources) ? eventSources : [eventSources];
    
    try {
        logger.debug(`${config.logging.prefix} Getting actions by event sources: ${sources.join(', ')}`);
        
        const options = {
            output: ['actionid', 'name', 'eventsource', 'status', 'esc_period'],
            filter: {
                eventsource: sources
            },
            selectOperations: ['operationid', 'operationtype', 'esc_period', 'esc_step_from', 'esc_step_to'],
            selectRecoveryOperations: ['operationid', 'operationtype'],
            selectFilter: ['conditions'],
            ...additionalOptions
        };
        
        return await request('action.get', options);
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get actions by event source:`, error.message);
        throw new Error(`Failed to retrieve actions by event source: ${error.message}`);
    }
}

/**
 * Get enabled actions
 * @param {Object} additionalOptions - Additional options for the query
 * @returns {Promise<Array>} Array of enabled actions
 */
async function getEnabledActions(additionalOptions = {}) {
    try {
        logger.debug(`${config.logging.prefix} Getting enabled actions`);
        
        const options = {
            output: ['actionid', 'name', 'eventsource', 'status', 'esc_period'],
            filter: {
                status: '0' // Enabled
            },
            selectOperations: ['operationid', 'operationtype', 'esc_period'],
            selectRecoveryOperations: ['operationid', 'operationtype'],
            selectAcknowledgeOperations: ['operationid', 'operationtype'],
            ...additionalOptions
        };
        
        return await request('action.get', options);
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get enabled actions:`, error.message);
        throw new Error(`Failed to retrieve enabled actions: ${error.message}`);
    }
}

/**
 * Get disabled actions
 * @param {Object} additionalOptions - Additional options for the query
 * @returns {Promise<Array>} Array of disabled actions
 */
async function getDisabledActions(additionalOptions = {}) {
    try {
        logger.debug(`${config.logging.prefix} Getting disabled actions`);
        
        const options = {
            output: ['actionid', 'name', 'eventsource', 'status', 'esc_period'],
            filter: {
                status: '1' // Disabled
            },
            selectOperations: ['operationid', 'operationtype'],
            selectRecoveryOperations: ['operationid', 'operationtype'],
            ...additionalOptions
        };
        
        return await request('action.get', options);
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get disabled actions:`, error.message);
        throw new Error(`Failed to retrieve disabled actions: ${error.message}`);
    }
}

/**
 * Enable actions
 * @param {Array<string>} actionIds - Array of action IDs to enable
 * @returns {Promise<Object>} Update result
 */
async function enableActions(actionIds) {
    if (!Array.isArray(actionIds) || actionIds.length === 0) {
        throw new Error("enableActions expects a non-empty array of action IDs.");
    }

    try {
        logger.info(`${config.logging.prefix} Enabling actions: ${actionIds.join(', ')}`);
        
        const updateParams = actionIds.map(actionid => ({
            actionid,
            status: '0' // Enabled
        }));
        
        const result = await request('action.update', updateParams);
        logger.info(`${config.logging.prefix} Successfully enabled ${actionIds.length} actions`);
        return result;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to enable actions:`, error.message);
        throw new Error(`Failed to enable actions: ${error.message}`);
    }
}

/**
 * Disable actions
 * @param {Array<string>} actionIds - Array of action IDs to disable
 * @returns {Promise<Object>} Update result
 */
async function disableActions(actionIds) {
    if (!Array.isArray(actionIds) || actionIds.length === 0) {
        throw new Error("disableActions expects a non-empty array of action IDs.");
    }

    try {
        logger.info(`${config.logging.prefix} Disabling actions: ${actionIds.join(', ')}`);
        
        const updateParams = actionIds.map(actionid => ({
            actionid,
            status: '1' // Disabled
        }));
        
        const result = await request('action.update', updateParams);
        logger.info(`${config.logging.prefix} Successfully disabled ${actionIds.length} actions`);
        return result;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to disable actions:`, error.message);
        throw new Error(`Failed to disable actions: ${error.message}`);
    }
}

/**
 * Get actions with escalations
 * @param {Object} additionalOptions - Additional options for the query
 * @returns {Promise<Array>} Array of actions that have escalation steps
 */
async function getActionsWithEscalations(additionalOptions = {}) {
    try {
        logger.debug(`${config.logging.prefix} Getting actions with escalations`);
        
        const options = {
            output: ['actionid', 'name', 'eventsource', 'status', 'esc_period'],
            selectOperations: ['operationid', 'operationtype', 'esc_period', 'esc_step_from', 'esc_step_to'],
            ...additionalOptions
        };
        
        const actions = await request('action.get', options);
        
        // Filter actions that have escalation operations
        const actionsWithEscalations = actions.filter(action => {
            return action.operations && action.operations.some(op => 
                op.esc_step_from && parseInt(op.esc_step_from) > 1 || 
                op.esc_step_to && parseInt(op.esc_step_to) > 1
            );
        });
        
        return actionsWithEscalations;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get actions with escalations:`, error.message);
        throw new Error(`Failed to retrieve actions with escalations: ${error.message}`);
    }
}

/**
 * Get action operations
 * @param {Array<string>} actionIds - Array of action IDs
 * @param {Object} additionalOptions - Additional options for the query
 * @returns {Promise<Array>} Array of actions with detailed operation information
 */
async function getActionOperations(actionIds, additionalOptions = {}) {
    if (!Array.isArray(actionIds) || actionIds.length === 0) {
        throw new Error("getActionOperations expects a non-empty array of action IDs.");
    }

    try {
        logger.debug(`${config.logging.prefix} Getting operations for actions: ${actionIds.join(', ')}`);
        
        const options = {
            output: ['actionid', 'name', 'eventsource', 'status'],
            actionids: actionIds,
            selectOperations: ['operationid', 'operationtype', 'esc_period', 'esc_step_from', 'esc_step_to', 'evaltype'],
            selectRecoveryOperations: ['operationid', 'operationtype'],
            selectAcknowledgeOperations: ['operationid', 'operationtype'],
            selectFilter: ['conditions'],
            ...additionalOptions
        };
        
        return await request('action.get', options);
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get action operations:`, error.message);
        throw new Error(`Failed to retrieve action operations: ${error.message}`);
    }
}

/**
 * Get actions by operation type
 * @param {string|Array<string>} operationTypes - Operation type(s) (0=message, 1=command, 2=host add, 3=host remove, etc.)
 * @param {Object} additionalOptions - Additional options for the query
 * @returns {Promise<Array>} Array of actions with the specified operation types
 */
async function getActionsByOperationType(operationTypes, additionalOptions = {}) {
    const types = Array.isArray(operationTypes) ? operationTypes : [operationTypes];
    
    try {
        logger.debug(`${config.logging.prefix} Getting actions by operation types: ${types.join(', ')}`);
        
        const options = {
            output: ['actionid', 'name', 'eventsource', 'status'],
            selectOperations: ['operationid', 'operationtype', 'esc_period'],
            ...additionalOptions
        };
        
        const actions = await request('action.get', options);
        
        // Filter actions that have operations of the specified types
        const filteredActions = actions.filter(action => {
            return action.operations && action.operations.some(op => 
                types.includes(op.operationtype)
            );
        });
        
        return filteredActions;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get actions by operation type:`, error.message);
        throw new Error(`Failed to retrieve actions by operation type: ${error.message}`);
    }
}

/**
 * Get action statistics
 * @param {Array<string>} actionIds - Array of action IDs (optional)
 * @returns {Promise<Object>} Action statistics
 */
async function getActionStatistics(actionIds = null) {
    try {
        logger.debug(`${config.logging.prefix} Getting action statistics`);
        
        const actionOptions = actionIds ? { actionids: actionIds } : {};
        
        // Get actions with operations
        const actions = await request('action.get', {
            output: ['actionid', 'name', 'eventsource', 'status', 'esc_period'],
            selectOperations: ['operationid', 'operationtype', 'esc_step_from', 'esc_step_to'],
            selectRecoveryOperations: ['operationid', 'operationtype'],
            selectAcknowledgeOperations: ['operationid', 'operationtype'],
            ...actionOptions
        });
        
        // Calculate statistics
        const stats = {
            totalActions: actions.length,
            actionsByStatus: {
                enabled: actions.filter(a => a.status === '0').length,
                disabled: actions.filter(a => a.status === '1').length
            },
            actionsByEventSource: {
                trigger: actions.filter(a => a.eventsource === '0').length,
                discovery: actions.filter(a => a.eventsource === '1').length,
                autoRegistration: actions.filter(a => a.eventsource === '2').length,
                internal: actions.filter(a => a.eventsource === '3').length
            },
            actionsWithEscalations: actions.filter(a => 
                a.operations && a.operations.some(op => 
                    op.esc_step_from && parseInt(op.esc_step_from) > 1
                )
            ).length,
            actionsWithRecoveryOperations: actions.filter(a => 
                a.recoveryOperations && a.recoveryOperations.length > 0
            ).length,
            actionsWithAcknowledgeOperations: actions.filter(a => 
                a.acknowledgeOperations && a.acknowledgeOperations.length > 0
            ).length,
            actions: actions.map(action => ({
                actionid: action.actionid,
                name: action.name,
                eventsource: action.eventsource,
                eventSourceLabel: action.eventsource === '0' ? 'Trigger' : 
                                action.eventsource === '1' ? 'Discovery' :
                                action.eventsource === '2' ? 'Auto registration' : 'Internal',
                status: action.status,
                statusLabel: action.status === '0' ? 'Enabled' : 'Disabled',
                esc_period: action.esc_period,
                operationsCount: action.operations ? action.operations.length : 0,
                recoveryOperationsCount: action.recoveryOperations ? action.recoveryOperations.length : 0,
                acknowledgeOperationsCount: action.acknowledgeOperations ? action.acknowledgeOperations.length : 0,
                hasEscalations: action.operations ? action.operations.some(op => 
                    op.esc_step_from && parseInt(op.esc_step_from) > 1
                ) : false
            }))
        };
        
        return stats;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get action statistics:`, error.message);
        throw new Error(`Failed to retrieve action statistics: ${error.message}`);
    }
}

/**
 * Search actions by multiple criteria
 * @param {Object} criteria - Search criteria
 * @param {Object} additionalOptions - Additional options for the query
 * @returns {Promise<Array>} Array of matching actions
 */
async function searchActions(criteria = {}, additionalOptions = {}) {
    try {
        logger.debug(`${config.logging.prefix} Searching actions with criteria:`, criteria);
        
        const options = {
            output: ['actionid', 'name', 'eventsource', 'status', 'esc_period'],
            selectOperations: ['operationid', 'operationtype', 'esc_period'],
            selectRecoveryOperations: ['operationid', 'operationtype'],
            selectFilter: ['conditions'],
            ...additionalOptions
        };
        
        // Add search criteria
        if (criteria.name) {
            options.search = { name: criteria.name };
            options.searchWildcardsEnabled = true;
        }
        
        if (criteria.actionids) {
            options.actionids = criteria.actionids;
        }
        
        if (criteria.eventsource) {
            options.filter = { eventsource: criteria.eventsource };
        }
        
        if (criteria.status) {
            if (!options.filter) options.filter = {};
            options.filter.status = criteria.status;
        }
        
        const actions = await request('action.get', options);
        
        // Apply additional filtering if needed
        let filteredActions = actions;
        
        if (criteria.hasEscalations !== undefined) {
            filteredActions = filteredActions.filter(action => {
                const hasEscalations = action.operations && action.operations.some(op => 
                    op.esc_step_from && parseInt(op.esc_step_from) > 1
                );
                return criteria.hasEscalations ? hasEscalations : !hasEscalations;
            });
        }
        
        if (criteria.hasRecoveryOperations !== undefined) {
            filteredActions = filteredActions.filter(action => {
                const hasRecovery = action.recoveryOperations && action.recoveryOperations.length > 0;
                return criteria.hasRecoveryOperations ? hasRecovery : !hasRecovery;
            });
        }
        
        if (criteria.operationType) {
            filteredActions = filteredActions.filter(action => {
                return action.operations && action.operations.some(op => 
                    op.operationtype === criteria.operationType
                );
            });
        }
        
        return filteredActions;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to search actions:`, error.message);
        throw new Error(`Failed to search actions: ${error.message}`);
    }
}

module.exports = {
    getActions,
    createAction,
    updateAction,
    deleteActions,
    getActionsByName,
    getActionsByEventSource,
    getEnabledActions,
    getDisabledActions,
    enableActions,
    disableActions,
    getActionsWithEscalations,
    getActionOperations,
    getActionsByOperationType,
    getActionStatistics,
    searchActions
}; 