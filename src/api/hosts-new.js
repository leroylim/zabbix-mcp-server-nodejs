/**
 * Hosts API Module - Refactored to use zabbix-utils
 * 
 * This module provides host management functionality using the zabbix-utils library
 * for improved type safety, automatic authentication, and better error handling.
 */

const { getClient, request } = require('./zabbix-client');
const { logger } = require('../utils/logger');
const config = require('../config');

/**
 * Get hosts from Zabbix
 * @param {Object} options - Parameters for host.get
 * @returns {Promise<Array>} Array of hosts
 */
async function getHosts(options = { 
    output: ['hostid', 'host', 'name', 'status'], 
    selectInterfaces: ['ip', 'port', 'type', 'main'] 
}) {
    try {
        logger.debug(`${config.logging.prefix} Getting hosts with options:`, options);
        return await request('host.get', options);
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get hosts:`, error.message);
        throw new Error(`Failed to retrieve hosts: ${error.message}`);
    }
}

/**
 * Create a new host in Zabbix
 * @param {Object} params - Host creation parameters
 * @returns {Promise<Object>} Created host information
 */
async function createHost(params) {
    // Validate required parameters
    if (!params.host || !params.groups || !params.interfaces) {
        throw new Error("Parameters 'host' (technical name), 'groups', and 'interfaces' are required for creating a host.");
    }

    try {
        logger.info(`${config.logging.prefix} Creating host: ${params.host}`);
        const result = await request('host.create', params);
        logger.info(`${config.logging.prefix} Successfully created host with ID: ${result.hostids?.[0]}`);
        return result;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to create host ${params.host}:`, error.message);
        throw new Error(`Failed to create host: ${error.message}`);
    }
}

/**
 * Update an existing host in Zabbix
 * @param {Object} params - Host update parameters (must include hostid)
 * @returns {Promise<Object>} Update result
 */
async function updateHost(params) {
    if (!params || !params.hostid) {
        throw new Error("Parameter 'hostid' is required for updating a host.");
    }

    try {
        logger.info(`${config.logging.prefix} Updating host ID: ${params.hostid}`);
        const result = await request('host.update', params);
        logger.info(`${config.logging.prefix} Successfully updated host ID: ${params.hostid}`);
        return result;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to update host ${params.hostid}:`, error.message);
        throw new Error(`Failed to update host: ${error.message}`);
    }
}

/**
 * Delete hosts from Zabbix
 * @param {Array<string>} hostIds - Array of host IDs to delete
 * @returns {Promise<Object>} Deletion result
 */
async function deleteHosts(hostIds) {
    if (!Array.isArray(hostIds) || hostIds.length === 0 || !hostIds.every(id => typeof id === 'string')) {
        throw new Error("deleteHosts expects a non-empty array of string host IDs.");
    }

    try {
        logger.info(`${config.logging.prefix} Deleting hosts: ${hostIds.join(', ')}`);
        const result = await request('host.delete', hostIds);
        logger.info(`${config.logging.prefix} Successfully deleted ${hostIds.length} hosts`);
        return result;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to delete hosts:`, error.message);
        throw new Error(`Failed to delete hosts: ${error.message}`);
    }
}

/**
 * Get host interfaces
 * @param {Object} options - Parameters for hostinterface.get
 * @returns {Promise<Array>} Array of host interfaces
 */
async function getHostInterfaces(options = { output: "extend" }) {
    try {
        logger.debug(`${config.logging.prefix} Getting host interfaces`);
        return await request('hostinterface.get', options);
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get host interfaces:`, error.message);
        throw new Error(`Failed to retrieve host interfaces: ${error.message}`);
    }
}

/**
 * Get host macros
 * @param {Array<string>} hostIds - Array of host IDs
 * @returns {Promise<Array>} Array of host macros
 */
async function getHostMacros(hostIds) {
    if (!Array.isArray(hostIds) || hostIds.length === 0) {
        throw new Error("getHostMacros expects a non-empty array of host IDs.");
    }

    try {
        logger.debug(`${config.logging.prefix} Getting macros for hosts: ${hostIds.join(', ')}`);
        return await request('usermacro.get', { 
            hostids: hostIds, 
            output: "extend" 
        });
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get host macros:`, error.message);
        throw new Error(`Failed to retrieve host macros: ${error.message}`);
    }
}

/**
 * Update host macros
 * @param {string} hostId - Host ID
 * @param {Array} macros - Array of macros to update
 * @returns {Promise<Object>} Update result
 */
async function updateHostMacros(hostId, macros) {
    if (!hostId || !Array.isArray(macros)) {
        throw new Error("updateHostMacros expects a hostId and an array of macros.");
    }

    try {
        logger.info(`${config.logging.prefix} Updating macros for host: ${hostId}`);
        const result = await request('usermacro.update', { 
            hostid: hostId, 
            macros: macros 
        });
        logger.info(`${config.logging.prefix} Successfully updated macros for host: ${hostId}`);
        return result;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to update host macros:`, error.message);
        throw new Error(`Failed to update host macros: ${error.message}`);
    }
}

/**
 * Get hosts by name or pattern
 * @param {string|Array<string>} hostNames - Host name(s) or pattern(s)
 * @param {Object} additionalOptions - Additional options for the query
 * @returns {Promise<Array>} Array of matching hosts
 */
async function getHostsByName(hostNames, additionalOptions = {}) {
    const names = Array.isArray(hostNames) ? hostNames : [hostNames];
    
    try {
        logger.debug(`${config.logging.prefix} Getting hosts by name: ${names.join(', ')}`);
        
        const options = {
            output: ['hostid', 'host', 'name', 'status'],
            filter: {
                host: names
            },
            ...additionalOptions
        };
        
        return await request('host.get', options);
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get hosts by name:`, error.message);
        throw new Error(`Failed to retrieve hosts by name: ${error.message}`);
    }
}

/**
 * Get hosts in specific groups
 * @param {Array<string>} groupIds - Array of group IDs
 * @param {Object} additionalOptions - Additional options for the query
 * @returns {Promise<Array>} Array of hosts in the specified groups
 */
async function getHostsByGroups(groupIds, additionalOptions = {}) {
    if (!Array.isArray(groupIds) || groupIds.length === 0) {
        throw new Error("getHostsByGroups expects a non-empty array of group IDs.");
    }

    try {
        logger.debug(`${config.logging.prefix} Getting hosts in groups: ${groupIds.join(', ')}`);
        
        const options = {
            output: ['hostid', 'host', 'name', 'status'],
            groupids: groupIds,
            ...additionalOptions
        };
        
        return await request('host.get', options);
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get hosts by groups:`, error.message);
        throw new Error(`Failed to retrieve hosts by groups: ${error.message}`);
    }
}

/**
 * Enable hosts
 * @param {Array<string>} hostIds - Array of host IDs to enable
 * @returns {Promise<Object>} Update result
 */
async function enableHosts(hostIds) {
    if (!Array.isArray(hostIds) || hostIds.length === 0) {
        throw new Error("enableHosts expects a non-empty array of host IDs.");
    }

    try {
        logger.info(`${config.logging.prefix} Enabling hosts: ${hostIds.join(', ')}`);
        
        const updateParams = hostIds.map(hostid => ({
            hostid,
            status: 0 // 0 = enabled
        }));
        
        const result = await request('host.massupdate', {
            hosts: updateParams,
            status: 0
        });
        
        logger.info(`${config.logging.prefix} Successfully enabled ${hostIds.length} hosts`);
        return result;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to enable hosts:`, error.message);
        throw new Error(`Failed to enable hosts: ${error.message}`);
    }
}

/**
 * Disable hosts
 * @param {Array<string>} hostIds - Array of host IDs to disable
 * @returns {Promise<Object>} Update result
 */
async function disableHosts(hostIds) {
    if (!Array.isArray(hostIds) || hostIds.length === 0) {
        throw new Error("disableHosts expects a non-empty array of host IDs.");
    }

    try {
        logger.info(`${config.logging.prefix} Disabling hosts: ${hostIds.join(', ')}`);
        
        const updateParams = hostIds.map(hostid => ({
            hostid,
            status: 1 // 1 = disabled
        }));
        
        const result = await request('host.massupdate', {
            hosts: updateParams,
            status: 1
        });
        
        logger.info(`${config.logging.prefix} Successfully disabled ${hostIds.length} hosts`);
        return result;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to disable hosts:`, error.message);
        throw new Error(`Failed to disable hosts: ${error.message}`);
    }
}

module.exports = {
    getHosts,
    createHost,
    updateHost,
    deleteHosts,
    getHostInterfaces,
    getHostMacros,
    updateHostMacros,
    getHostsByName,
    getHostsByGroups,
    enableHosts,
    disableHosts
}; 