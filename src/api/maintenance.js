/**
 * Maintenance API Module - Refactored to use zabbix-utils
 * 
 * This module provides maintenance window management functionality using the zabbix-utils library
 * for improved type safety, automatic authentication, and better error handling.
 */

const { getClient, request } = require('./zabbix-client');
const { logger } = require('../utils/logger');
const config = require('../config');

/**
 * Get maintenance windows from Zabbix
 * @param {Object} options - Parameters for maintenance.get
 * @returns {Promise<Array>} Array of maintenance windows
 */
async function getMaintenanceWindows(options = {}) {
    try {
        logger.debug(`${config.logging.prefix} Getting maintenance windows with options:`, options);
        return await request('maintenance.get', options);
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get maintenance windows:`, error.message);
        throw new Error(`Failed to retrieve maintenance windows: ${error.message}`);
    }
}

/**
 * Create a new maintenance window in Zabbix
 * @param {Object} params - Maintenance window creation parameters
 * @returns {Promise<Object>} Created maintenance window information
 */
async function createMaintenanceWindow(params) {
    // Validate required parameters
    if (!params.name || !params.active_since || !params.active_till) {
        throw new Error("Parameters 'name', 'active_since', and 'active_till' are required for creating a maintenance window.");
    }

    try {
        logger.info(`${config.logging.prefix} Creating maintenance window: ${params.name}`);
        const result = await request('maintenance.create', params);
        logger.info(`${config.logging.prefix} Successfully created maintenance window with ID: ${result.maintenanceids?.[0]}`);
        return result;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to create maintenance window ${params.name}:`, error.message);
        throw new Error(`Failed to create maintenance window: ${error.message}`);
    }
}

/**
 * Update an existing maintenance window in Zabbix
 * @param {Object} params - Maintenance window update parameters (must include maintenanceid)
 * @returns {Promise<Object>} Update result
 */
async function updateMaintenanceWindow(params) {
    if (!params || !params.maintenanceid) {
        throw new Error("Parameter 'maintenanceid' is required for updating a maintenance window.");
    }

    try {
        logger.info(`${config.logging.prefix} Updating maintenance window ID: ${params.maintenanceid}`);
        const result = await request('maintenance.update', params);
        logger.info(`${config.logging.prefix} Successfully updated maintenance window ID: ${params.maintenanceid}`);
        return result;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to update maintenance window ${params.maintenanceid}:`, error.message);
        throw new Error(`Failed to update maintenance window: ${error.message}`);
    }
}

/**
 * Delete maintenance windows from Zabbix
 * @param {Array<string>} maintenanceIds - Array of maintenance window IDs to delete
 * @returns {Promise<Object>} Deletion result
 */
async function deleteMaintenanceWindows(maintenanceIds) {
    if (!Array.isArray(maintenanceIds) || maintenanceIds.length === 0 || !maintenanceIds.every(id => typeof id === 'string')) {
        throw new Error("deleteMaintenanceWindows expects a non-empty array of string maintenance IDs.");
    }

    try {
        logger.info(`${config.logging.prefix} Deleting maintenance windows: ${maintenanceIds.join(', ')}`);
        const result = await request('maintenance.delete', maintenanceIds);
        logger.info(`${config.logging.prefix} Successfully deleted ${maintenanceIds.length} maintenance windows`);
        return result;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to delete maintenance windows:`, error.message);
        throw new Error(`Failed to delete maintenance windows: ${error.message}`);
    }
}

/**
 * Get active maintenance windows
 * @param {Object} additionalOptions - Additional options for the query
 * @returns {Promise<Array>} Array of currently active maintenance windows
 */
async function getActiveMaintenanceWindows(additionalOptions = {}) {
    try {
        logger.debug(`${config.logging.prefix} Getting active maintenance windows`);
        
        const currentTime = Math.floor(Date.now() / 1000);
        
        const options = {
            output: ['maintenanceid', 'name', 'active_since', 'active_till', 'description'],
            selectHosts: ['hostid', 'host', 'name'],
            selectGroups: ['groupid', 'name'],
            selectTimeperiods: ['timeperiodid', 'timeperiod_type', 'start_time', 'period'],
            filter: {
                // Active maintenance windows
                active_since: { '<=': currentTime },
                active_till: { '>=': currentTime }
            },
            ...additionalOptions
        };
        
        return await request('maintenance.get', options);
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get active maintenance windows:`, error.message);
        throw new Error(`Failed to retrieve active maintenance windows: ${error.message}`);
    }
}

/**
 * Get maintenance windows by name pattern
 * @param {string|Array<string>} namePatterns - Maintenance window name pattern(s)
 * @param {Object} additionalOptions - Additional options for the query
 * @returns {Promise<Array>} Array of matching maintenance windows
 */
async function getMaintenanceWindowsByName(namePatterns, additionalOptions = {}) {
    const patterns = Array.isArray(namePatterns) ? namePatterns : [namePatterns];
    
    try {
        logger.debug(`${config.logging.prefix} Getting maintenance windows by name patterns: ${patterns.join(', ')}`);
        
        const options = {
            output: ['maintenanceid', 'name', 'active_since', 'active_till', 'description'],
            search: {
                name: patterns
            },
            searchWildcardsEnabled: true,
            selectHosts: ['hostid', 'host', 'name'],
            selectGroups: ['groupid', 'name'],
            ...additionalOptions
        };
        
        return await request('maintenance.get', options);
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get maintenance windows by name:`, error.message);
        throw new Error(`Failed to retrieve maintenance windows by name: ${error.message}`);
    }
}

/**
 * Get maintenance windows for specific hosts
 * @param {Array<string>} hostIds - Array of host IDs
 * @param {Object} additionalOptions - Additional options for the query
 * @returns {Promise<Array>} Array of maintenance windows affecting the specified hosts
 */
async function getMaintenanceWindowsByHosts(hostIds, additionalOptions = {}) {
    if (!Array.isArray(hostIds) || hostIds.length === 0) {
        throw new Error("getMaintenanceWindowsByHosts expects a non-empty array of host IDs.");
    }

    try {
        logger.debug(`${config.logging.prefix} Getting maintenance windows for hosts: ${hostIds.join(', ')}`);
        
        const options = {
            output: ['maintenanceid', 'name', 'active_since', 'active_till', 'description'],
            hostids: hostIds,
            selectHosts: ['hostid', 'host', 'name'],
            selectGroups: ['groupid', 'name'],
            selectTimeperiods: ['timeperiodid', 'timeperiod_type', 'start_time', 'period'],
            ...additionalOptions
        };
        
        return await request('maintenance.get', options);
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get maintenance windows by hosts:`, error.message);
        throw new Error(`Failed to retrieve maintenance windows by hosts: ${error.message}`);
    }
}

/**
 * Get maintenance windows for specific host groups
 * @param {Array<string>} groupIds - Array of host group IDs
 * @param {Object} additionalOptions - Additional options for the query
 * @returns {Promise<Array>} Array of maintenance windows affecting the specified groups
 */
async function getMaintenanceWindowsByGroups(groupIds, additionalOptions = {}) {
    if (!Array.isArray(groupIds) || groupIds.length === 0) {
        throw new Error("getMaintenanceWindowsByGroups expects a non-empty array of group IDs.");
    }

    try {
        logger.debug(`${config.logging.prefix} Getting maintenance windows for groups: ${groupIds.join(', ')}`);
        
        const options = {
            output: ['maintenanceid', 'name', 'active_since', 'active_till', 'description'],
            groupids: groupIds,
            selectHosts: ['hostid', 'host', 'name'],
            selectGroups: ['groupid', 'name'],
            selectTimeperiods: ['timeperiodid', 'timeperiod_type', 'start_time', 'period'],
            ...additionalOptions
        };
        
        return await request('maintenance.get', options);
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get maintenance windows by groups:`, error.message);
        throw new Error(`Failed to retrieve maintenance windows by groups: ${error.message}`);
    }
}

/**
 * Get upcoming maintenance windows
 * @param {number} hoursAhead - Number of hours to look ahead (default: 24)
 * @param {Object} additionalOptions - Additional options for the query
 * @returns {Promise<Array>} Array of upcoming maintenance windows
 */
async function getUpcomingMaintenanceWindows(hoursAhead = 24, additionalOptions = {}) {
    try {
        logger.debug(`${config.logging.prefix} Getting upcoming maintenance windows for next ${hoursAhead} hours`);
        
        const currentTime = Math.floor(Date.now() / 1000);
        const futureTime = currentTime + (hoursAhead * 60 * 60);
        
        const options = {
            output: ['maintenanceid', 'name', 'active_since', 'active_till', 'description'],
            selectHosts: ['hostid', 'host', 'name'],
            selectGroups: ['groupid', 'name'],
            selectTimeperiods: ['timeperiodid', 'timeperiod_type', 'start_time', 'period'],
            filter: {
                active_since: { '>=': currentTime, '<=': futureTime }
            },
            ...additionalOptions
        };
        
        return await request('maintenance.get', options);
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get upcoming maintenance windows:`, error.message);
        throw new Error(`Failed to retrieve upcoming maintenance windows: ${error.message}`);
    }
}

/**
 * Get expired maintenance windows
 * @param {number} daysBack - Number of days to look back (default: 7)
 * @param {Object} additionalOptions - Additional options for the query
 * @returns {Promise<Array>} Array of expired maintenance windows
 */
async function getExpiredMaintenanceWindows(daysBack = 7, additionalOptions = {}) {
    try {
        logger.debug(`${config.logging.prefix} Getting expired maintenance windows from last ${daysBack} days`);
        
        const currentTime = Math.floor(Date.now() / 1000);
        const pastTime = currentTime - (daysBack * 24 * 60 * 60);
        
        const options = {
            output: ['maintenanceid', 'name', 'active_since', 'active_till', 'description'],
            selectHosts: ['hostid', 'host', 'name'],
            selectGroups: ['groupid', 'name'],
            filter: {
                active_till: { '>=': pastTime, '<': currentTime }
            },
            ...additionalOptions
        };
        
        return await request('maintenance.get', options);
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get expired maintenance windows:`, error.message);
        throw new Error(`Failed to retrieve expired maintenance windows: ${error.message}`);
    }
}

/**
 * Create a scheduled maintenance window
 * @param {Object} params - Maintenance window parameters with scheduling
 * @returns {Promise<Object>} Created maintenance window information
 */
async function createScheduledMaintenance(params) {
    // Validate required parameters
    if (!params.name || !params.hosts && !params.hostgroups) {
        throw new Error("Parameters 'name' and either 'hosts' or 'hostgroups' are required.");
    }

    try {
        logger.info(`${config.logging.prefix} Creating scheduled maintenance: ${params.name}`);
        
        // Set default values for scheduled maintenance
        const maintenanceParams = {
            maintenance_type: '0', // With data collection
            active_since: params.active_since || Math.floor(Date.now() / 1000),
            active_till: params.active_till || (Math.floor(Date.now() / 1000) + 3600), // 1 hour default
            ...params
        };
        
        const result = await request('maintenance.create', maintenanceParams);
        logger.info(`${config.logging.prefix} Successfully created scheduled maintenance with ID: ${result.maintenanceids?.[0]}`);
        return result;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to create scheduled maintenance ${params.name}:`, error.message);
        throw new Error(`Failed to create scheduled maintenance: ${error.message}`);
    }
}

/**
 * Get maintenance window statistics
 * @param {Array<string>} maintenanceIds - Array of maintenance IDs (optional)
 * @returns {Promise<Object>} Maintenance window statistics
 */
async function getMaintenanceStatistics(maintenanceIds = null) {
    try {
        logger.debug(`${config.logging.prefix} Getting maintenance statistics`);
        
        const maintenanceOptions = maintenanceIds ? { maintenanceids: maintenanceIds } : {};
        
        // Get maintenance windows
        const maintenances = await request('maintenance.get', {
            output: ['maintenanceid', 'name', 'active_since', 'active_till', 'maintenance_type'],
            selectHosts: ['hostid'],
            selectGroups: ['groupid'],
            selectTimeperiods: ['timeperiodid'],
            ...maintenanceOptions
        });
        
        const currentTime = Math.floor(Date.now() / 1000);
        
        const stats = {
            totalMaintenanceWindows: maintenances.length,
            activeMaintenanceWindows: maintenances.filter(m => 
                parseInt(m.active_since) <= currentTime && parseInt(m.active_till) >= currentTime
            ).length,
            upcomingMaintenanceWindows: maintenances.filter(m => 
                parseInt(m.active_since) > currentTime
            ).length,
            expiredMaintenanceWindows: maintenances.filter(m => 
                parseInt(m.active_till) < currentTime
            ).length,
            maintenancesByType: {
                withDataCollection: maintenances.filter(m => m.maintenance_type === '0').length,
                withoutDataCollection: maintenances.filter(m => m.maintenance_type === '1').length
            },
            maintenances: maintenances.map(maintenance => ({
                maintenanceid: maintenance.maintenanceid,
                name: maintenance.name,
                active_since: maintenance.active_since,
                active_till: maintenance.active_till,
                maintenance_type: maintenance.maintenance_type,
                typeLabel: maintenance.maintenance_type === '0' ? 'With data collection' : 'Without data collection',
                hostsCount: maintenance.hosts ? maintenance.hosts.length : 0,
                groupsCount: maintenance.groups ? maintenance.groups.length : 0,
                timeperiodsCount: maintenance.timeperiods ? maintenance.timeperiods.length : 0,
                status: parseInt(maintenance.active_since) <= currentTime && parseInt(maintenance.active_till) >= currentTime 
                    ? 'Active' 
                    : parseInt(maintenance.active_since) > currentTime 
                        ? 'Upcoming' 
                        : 'Expired'
            }))
        };
        
        return stats;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get maintenance statistics:`, error.message);
        throw new Error(`Failed to retrieve maintenance statistics: ${error.message}`);
    }
}

/**
 * Search maintenance windows by multiple criteria
 * @param {Object} criteria - Search criteria
 * @param {Object} additionalOptions - Additional options for the query
 * @returns {Promise<Array>} Array of matching maintenance windows
 */
async function searchMaintenanceWindows(criteria = {}, additionalOptions = {}) {
    try {
        logger.debug(`${config.logging.prefix} Searching maintenance windows with criteria:`, criteria);
        
        const options = {
            output: ['maintenanceid', 'name', 'active_since', 'active_till', 'description', 'maintenance_type'],
            selectHosts: ['hostid', 'host', 'name'],
            selectGroups: ['groupid', 'name'],
            selectTimeperiods: ['timeperiodid', 'timeperiod_type'],
            ...additionalOptions
        };
        
        // Add search criteria
        if (criteria.name) {
            options.search = { name: criteria.name };
            options.searchWildcardsEnabled = true;
        }
        
        if (criteria.maintenanceids) {
            options.maintenanceids = criteria.maintenanceids;
        }
        
        if (criteria.hostids) {
            options.hostids = criteria.hostids;
        }
        
        if (criteria.groupids) {
            options.groupids = criteria.groupids;
        }
        
        if (criteria.maintenance_type) {
            options.filter = { maintenance_type: criteria.maintenance_type };
        }
        
        const maintenances = await request('maintenance.get', options);
        
        // Apply additional filtering if needed
        let filteredMaintenances = maintenances;
        const currentTime = Math.floor(Date.now() / 1000);
        
        if (criteria.status) {
            filteredMaintenances = filteredMaintenances.filter(maintenance => {
                const activeSince = parseInt(maintenance.active_since);
                const activeTill = parseInt(maintenance.active_till);
                
                switch (criteria.status) {
                    case 'active':
                        return activeSince <= currentTime && activeTill >= currentTime;
                    case 'upcoming':
                        return activeSince > currentTime;
                    case 'expired':
                        return activeTill < currentTime;
                    default:
                        return true;
                }
            });
        }
        
        if (criteria.minDuration || criteria.maxDuration) {
            filteredMaintenances = filteredMaintenances.filter(maintenance => {
                const duration = parseInt(maintenance.active_till) - parseInt(maintenance.active_since);
                if (criteria.minDuration && duration < criteria.minDuration) return false;
                if (criteria.maxDuration && duration > criteria.maxDuration) return false;
                return true;
            });
        }
        
        return filteredMaintenances;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to search maintenance windows:`, error.message);
        throw new Error(`Failed to search maintenance windows: ${error.message}`);
    }
}

module.exports = {
    getMaintenanceWindows,
    createMaintenanceWindow,
    updateMaintenanceWindow,
    deleteMaintenanceWindows,
    getActiveMaintenanceWindows,
    getMaintenanceWindowsByName,
    getMaintenanceWindowsByHosts,
    getMaintenanceWindowsByGroups,
    getUpcomingMaintenanceWindows,
    getExpiredMaintenanceWindows,
    createScheduledMaintenance,
    getMaintenanceStatistics,
    searchMaintenanceWindows
}; 