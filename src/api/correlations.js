/**
 * Correlations API Module
 * 
 * This module provides event correlation management functionality using the zabbix-client
 * for improved type safety, automatic authentication, and better error handling.
 */

const { getClient, request } = require('./zabbix-client');
const { logger } = require('../utils/logger');
const config = require('../config');

/**
 * Get correlations from Zabbix
 * @param {Object} options - Parameters for correlation.get
 * @returns {Promise<Array>} Array of correlations
 */
async function getCorrelations(options = {}) {
    try {
        logger.debug(`${config.logging.prefix} Getting correlations with options:`, options);
        return await request('correlation.get', options);
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get correlations:`, error.message);
        throw new Error(`Failed to retrieve correlations: ${error.message}`);
    }
}

/**
 * Create a new correlation in Zabbix
 * @param {Object} params - Correlation creation parameters
 * @returns {Promise<Object>} Created correlation information
 */
async function createCorrelation(params) {
    // Validate required parameters
    if (!params.name || !params.filter || !params.filter.conditions || !params.operations) {
        throw new Error("Parameters 'name', 'filter' (with conditions), and a non-empty 'operations' array are required for creating a correlation.");
    }

    try {
        logger.info(`${config.logging.prefix} Creating correlation: ${params.name}`);
        const result = await request('correlation.create', params);
        logger.info(`${config.logging.prefix} Successfully created correlation with ID: ${result.correlationids?.[0]}`);
        return result;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to create correlation ${params.name}:`, error.message);
        throw new Error(`Failed to create correlation: ${error.message}`);
    }
}

/**
 * Update an existing correlation in Zabbix
 * @param {Object} params - Correlation update parameters (must include correlationid)
 * @returns {Promise<Object>} Update result
 */
async function updateCorrelation(params) {
    if (!params || !params.correlationid) {
        throw new Error("Parameter 'correlationid' is required for updating a correlation.");
    }

    try {
        logger.info(`${config.logging.prefix} Updating correlation ID: ${params.correlationid}`);
        const result = await request('correlation.update', params);
        logger.info(`${config.logging.prefix} Successfully updated correlation ID: ${params.correlationid}`);
        return result;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to update correlation ${params.correlationid}:`, error.message);
        throw new Error(`Failed to update correlation: ${error.message}`);
    }
}

/**
 * Delete correlations from Zabbix
 * @param {Array<string>} correlationIds - Array of correlation IDs to delete
 * @returns {Promise<Object>} Deletion result
 */
async function deleteCorrelations(correlationIds) {
    if (!Array.isArray(correlationIds) || correlationIds.length === 0 || !correlationIds.every(id => typeof id === 'string')) {
        throw new Error("deleteCorrelations expects a non-empty array of string correlation IDs.");
    }

    try {
        logger.info(`${config.logging.prefix} Deleting correlations: ${correlationIds.join(', ')}`);
        const result = await request('correlation.delete', correlationIds);
        logger.info(`${config.logging.prefix} Successfully deleted ${correlationIds.length} correlations`);
        return result;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to delete correlations:`, error.message);
        throw new Error(`Failed to delete correlations: ${error.message}`);
    }
}

module.exports = {
    getCorrelations,
    createCorrelation,
    updateCorrelation,
    deleteCorrelations
};
