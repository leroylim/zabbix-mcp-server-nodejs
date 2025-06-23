/**
 * Problems API Module - Refactored to use zabbix-utils
 * 
 * This module provides problem management functionality using the zabbix-utils library
 * for improved type safety, automatic authentication, and better error handling.
 */

const { getClient, request } = require('./zabbix-client');
const { logger } = require('../utils/logger');
const config = require('../config');

/**
 * Get problems from Zabbix
 * @param {Object} options - Parameters for problem.get
 * @returns {Promise<Array>} Array of problems
 */
async function getProblems(options = {}) {
    try {
        logger.debug(`${config.logging.prefix} Getting problems with options:`, options);
        return await request('problem.get', options);
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get problems:`, error.message);
        throw new Error(`Failed to retrieve problems: ${error.message}`);
    }
}

/**
 * Get active problems (unresolved)
 * @param {Object} additionalOptions - Additional options for the query
 * @returns {Promise<Array>} Array of active problems
 */
async function getActiveProblems(additionalOptions = {}) {
    try {
        logger.debug(`${config.logging.prefix} Getting active problems`);
        
        const options = {
            output: ['eventid', 'objectid', 'name', 'severity', 'clock', 'acknowledged'],
            selectHosts: ['hostid', 'host', 'name'],
            selectTriggers: ['triggerid', 'description', 'priority'],
            recent: false, // Only unresolved problems
            sortfield: ['severity', 'clock'],
            sortorder: 'DESC',
            ...additionalOptions
        };
        
        return await request('problem.get', options);
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get active problems:`, error.message);
        throw new Error(`Failed to retrieve active problems: ${error.message}`);
    }
}

/**
 * Get problems by host IDs
 * @param {Array<string>} hostIds - Array of host IDs
 * @param {Object} additionalOptions - Additional options for the query
 * @returns {Promise<Array>} Array of problems for the specified hosts
 */
async function getProblemsByHosts(hostIds, additionalOptions = {}) {
    if (!Array.isArray(hostIds) || hostIds.length === 0) {
        throw new Error("getProblemsByHosts expects a non-empty array of host IDs.");
    }

    try {
        logger.debug(`${config.logging.prefix} Getting problems for hosts: ${hostIds.join(', ')}`);
        
        const options = {
            output: ['eventid', 'objectid', 'name', 'severity', 'clock', 'acknowledged'],
            hostids: hostIds,
            selectHosts: ['hostid', 'host', 'name'],
            selectTriggers: ['triggerid', 'description', 'priority'],
            sortfield: ['severity', 'clock'],
            sortorder: 'DESC',
            ...additionalOptions
        };
        
        return await request('problem.get', options);
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get problems by hosts:`, error.message);
        throw new Error(`Failed to retrieve problems by hosts: ${error.message}`);
    }
}

/**
 * Get problems by severity
 * @param {Array<number>} severities - Array of severity levels (0-5)
 * @param {Object} additionalOptions - Additional options for the query
 * @returns {Promise<Array>} Array of problems with specified severities
 */
async function getProblemsBySeverity(severities, additionalOptions = {}) {
    if (!Array.isArray(severities) || severities.length === 0) {
        throw new Error("getProblemsBySeverity expects a non-empty array of severity levels.");
    }

    try {
        logger.debug(`${config.logging.prefix} Getting problems with severities: ${severities.join(', ')}`);
        
        const options = {
            output: ['eventid', 'objectid', 'name', 'severity', 'clock', 'acknowledged'],
            severities: severities,
            selectHosts: ['hostid', 'host', 'name'],
            selectTriggers: ['triggerid', 'description', 'priority'],
            sortfield: ['severity', 'clock'],
            sortorder: 'DESC',
            ...additionalOptions
        };
        
        return await request('problem.get', options);
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get problems by severity:`, error.message);
        throw new Error(`Failed to retrieve problems by severity: ${error.message}`);
    }
}

/**
 * Get unacknowledged problems
 * @param {Object} additionalOptions - Additional options for the query
 * @returns {Promise<Array>} Array of unacknowledged problems
 */
async function getUnacknowledgedProblems(additionalOptions = {}) {
    try {
        logger.debug(`${config.logging.prefix} Getting unacknowledged problems`);
        
        const options = {
            output: ['eventid', 'objectid', 'name', 'severity', 'clock'],
            acknowledged: false,
            selectHosts: ['hostid', 'host', 'name'],
            selectTriggers: ['triggerid', 'description', 'priority'],
            sortfield: ['severity', 'clock'],
            sortorder: 'DESC',
            ...additionalOptions
        };
        
        return await request('problem.get', options);
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get unacknowledged problems:`, error.message);
        throw new Error(`Failed to retrieve unacknowledged problems: ${error.message}`);
    }
}

/**
 * Get recent problems (within specified time range)
 * @param {number} timeFrom - Start time (Unix timestamp)
 * @param {number} timeTill - End time (Unix timestamp, optional)
 * @param {Object} additionalOptions - Additional options for the query
 * @returns {Promise<Array>} Array of recent problems
 */
async function getRecentProblems(timeFrom, timeTill = null, additionalOptions = {}) {
    if (!timeFrom || typeof timeFrom !== 'number') {
        throw new Error("getRecentProblems expects a valid timeFrom Unix timestamp.");
    }

    try {
        logger.debug(`${config.logging.prefix} Getting recent problems from ${new Date(timeFrom * 1000).toISOString()}`);
        
        const options = {
            output: ['eventid', 'objectid', 'name', 'severity', 'clock', 'acknowledged'],
            time_from: timeFrom,
            selectHosts: ['hostid', 'host', 'name'],
            selectTriggers: ['triggerid', 'description', 'priority'],
            sortfield: ['clock'],
            sortorder: 'DESC',
            ...additionalOptions
        };
        
        if (timeTill) {
            options.time_till = timeTill;
        }
        
        return await request('problem.get', options);
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get recent problems:`, error.message);
        throw new Error(`Failed to retrieve recent problems: ${error.message}`);
    }
}

/**
 * Get problem statistics by severity
 * @param {Object} additionalOptions - Additional options for the query
 * @returns {Promise<Object>} Problem statistics grouped by severity
 */
async function getProblemStatistics(additionalOptions = {}) {
    try {
        logger.debug(`${config.logging.prefix} Getting problem statistics`);
        
        const problems = await request('problem.get', {
            output: ['eventid', 'severity', 'acknowledged'],
            recent: false, // Only unresolved problems
            countOutput: false,
            ...additionalOptions
        });
        
        // Group by severity and acknowledgment status
        const stats = {
            total: problems.length,
            bySeverity: {},
            acknowledged: 0,
            unacknowledged: 0
        };
        
        problems.forEach(problem => {
            const severity = problem.severity;
            if (!stats.bySeverity[severity]) {
                stats.bySeverity[severity] = { total: 0, acknowledged: 0, unacknowledged: 0 };
            }
            
            stats.bySeverity[severity].total++;
            
            if (problem.acknowledged === '1') {
                stats.acknowledged++;
                stats.bySeverity[severity].acknowledged++;
            } else {
                stats.unacknowledged++;
                stats.bySeverity[severity].unacknowledged++;
            }
        });
        
        return stats;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get problem statistics:`, error.message);
        throw new Error(`Failed to retrieve problem statistics: ${error.message}`);
    }
}

/**
 * Get problems with tags
 * @param {Array<Object>} tags - Array of tag objects with 'tag' and optionally 'value' properties
 * @param {Object} additionalOptions - Additional options for the query
 * @returns {Promise<Array>} Array of problems with specified tags
 */
async function getProblemsWithTags(tags, additionalOptions = {}) {
    if (!Array.isArray(tags) || tags.length === 0) {
        throw new Error("getProblemsWithTags expects a non-empty array of tag objects.");
    }

    try {
        logger.debug(`${config.logging.prefix} Getting problems with tags:`, tags);
        
        const options = {
            output: ['eventid', 'objectid', 'name', 'severity', 'clock', 'acknowledged'],
            tags: tags,
            selectHosts: ['hostid', 'host', 'name'],
            selectTriggers: ['triggerid', 'description', 'priority'],
            selectTags: ['tag', 'value'],
            sortfield: ['severity', 'clock'],
            sortorder: 'DESC',
            ...additionalOptions
        };
        
        return await request('problem.get', options);
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get problems with tags:`, error.message);
        throw new Error(`Failed to retrieve problems with tags: ${error.message}`);
    }
}

/**
 * Get problem count
 * @param {Object} options - Filter options for counting problems
 * @returns {Promise<number>} Number of problems matching the criteria
 */
async function getProblemCount(options = {}) {
    try {
        logger.debug(`${config.logging.prefix} Getting problem count`);
        
        const countOptions = {
            countOutput: true,
            ...options
        };
        
        const result = await request('problem.get', countOptions);
        return parseInt(result, 10);
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get problem count:`, error.message);
        throw new Error(`Failed to retrieve problem count: ${error.message}`);
    }
}

/**
 * Get problems by trigger IDs
 * @param {Array<string>} triggerIds - Array of trigger IDs
 * @param {Object} additionalOptions - Additional options for the query
 * @returns {Promise<Array>} Array of problems for the specified triggers
 */
async function getProblemsByTriggers(triggerIds, additionalOptions = {}) {
    if (!Array.isArray(triggerIds) || triggerIds.length === 0) {
        throw new Error("getProblemsByTriggers expects a non-empty array of trigger IDs.");
    }

    try {
        logger.debug(`${config.logging.prefix} Getting problems for triggers: ${triggerIds.join(', ')}`);
        
        const options = {
            output: ['eventid', 'objectid', 'name', 'severity', 'clock', 'acknowledged'],
            objectids: triggerIds,
            selectHosts: ['hostid', 'host', 'name'],
            selectTriggers: ['triggerid', 'description', 'priority'],
            sortfield: ['severity', 'clock'],
            sortorder: 'DESC',
            ...additionalOptions
        };
        
        return await request('problem.get', options);
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get problems by triggers:`, error.message);
        throw new Error(`Failed to retrieve problems by triggers: ${error.message}`);
    }
}

module.exports = {
    getProblems,
    getActiveProblems,
    getProblemsByHosts,
    getProblemsBySeverity,
    getUnacknowledgedProblems,
    getRecentProblems,
    getProblemStatistics,
    getProblemsWithTags,
    getProblemCount,
    getProblemsByTriggers
}; 