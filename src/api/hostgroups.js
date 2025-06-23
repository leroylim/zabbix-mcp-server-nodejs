/**
 * Host Groups API Module - Refactored to use zabbix-utils
 * 
 * This module provides host group management functionality using the zabbix-utils library
 * for improved type safety, automatic authentication, and better error handling.
 */

const { getClient, request } = require('./zabbix-client');
const { logger } = require('../utils/logger');
const config = require('../config');

/**
 * Get host groups from Zabbix
 * @param {Object} options - Parameters for hostgroup.get
 * @returns {Promise<Array>} Array of host groups
 */
async function getHostGroups(options = {}) {
    try {
        logger.debug(`${config.logging.prefix} Getting host groups with options:`, options);
        return await request('hostgroup.get', options);
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get host groups:`, error.message);
        throw new Error(`Failed to retrieve host groups: ${error.message}`);
    }
}

/**
 * Create a new host group in Zabbix
 * @param {Object} params - Host group creation parameters
 * @returns {Promise<Object>} Created host group information
 */
async function createHostGroup(params) {
    // Validate required parameters
    if (!params.name) {
        throw new Error("Parameter 'name' is required for creating a host group.");
    }

    try {
        logger.info(`${config.logging.prefix} Creating host group: ${params.name}`);
        const result = await request('hostgroup.create', params);
        logger.info(`${config.logging.prefix} Successfully created host group with ID: ${result.groupids?.[0]}`);
        return result;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to create host group ${params.name}:`, error.message);
        throw new Error(`Failed to create host group: ${error.message}`);
    }
}

/**
 * Update an existing host group in Zabbix
 * @param {Object} params - Host group update parameters (must include groupid)
 * @returns {Promise<Object>} Update result
 */
async function updateHostGroup(params) {
    if (!params || !params.groupid) {
        throw new Error("Parameter 'groupid' is required for updating a host group.");
    }

    try {
        logger.info(`${config.logging.prefix} Updating host group ID: ${params.groupid}`);
        const result = await request('hostgroup.update', params);
        logger.info(`${config.logging.prefix} Successfully updated host group ID: ${params.groupid}`);
        return result;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to update host group ${params.groupid}:`, error.message);
        throw new Error(`Failed to update host group: ${error.message}`);
    }
}

/**
 * Delete host groups from Zabbix
 * @param {Array<string>} groupIds - Array of host group IDs to delete
 * @returns {Promise<Object>} Deletion result
 */
async function deleteHostGroups(groupIds) {
    if (!Array.isArray(groupIds) || groupIds.length === 0 || !groupIds.every(id => typeof id === 'string')) {
        throw new Error("deleteHostGroups expects a non-empty array of string group IDs.");
    }

    try {
        logger.info(`${config.logging.prefix} Deleting host groups: ${groupIds.join(', ')}`);
        const result = await request('hostgroup.delete', groupIds);
        logger.info(`${config.logging.prefix} Successfully deleted ${groupIds.length} host groups`);
        return result;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to delete host groups:`, error.message);
        throw new Error(`Failed to delete host groups: ${error.message}`);
    }
}

/**
 * Get host groups by name pattern
 * @param {string|Array<string>} namePatterns - Group name pattern(s)
 * @param {Object} additionalOptions - Additional options for the query
 * @returns {Promise<Array>} Array of matching host groups
 */
async function getHostGroupsByName(namePatterns, additionalOptions = {}) {
    const patterns = Array.isArray(namePatterns) ? namePatterns : [namePatterns];
    
    try {
        logger.debug(`${config.logging.prefix} Getting host groups by name patterns: ${patterns.join(', ')}`);
        
        const options = {
            output: ['groupid', 'name', 'flags'],
            search: {
                name: patterns
            },
            searchWildcardsEnabled: true,
            ...additionalOptions
        };
        
        return await request('hostgroup.get', options);
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get host groups by name:`, error.message);
        throw new Error(`Failed to retrieve host groups by name: ${error.message}`);
    }
}

/**
 * Get hosts in specific host groups
 * @param {Array<string>} groupIds - Array of host group IDs
 * @param {Object} additionalOptions - Additional options for the query
 * @returns {Promise<Array>} Array of hosts in the specified groups
 */
async function getHostsInGroups(groupIds, additionalOptions = {}) {
    if (!Array.isArray(groupIds) || groupIds.length === 0) {
        throw new Error("getHostsInGroups expects a non-empty array of group IDs.");
    }

    try {
        logger.debug(`${config.logging.prefix} Getting hosts in groups: ${groupIds.join(', ')}`);
        
        const options = {
            output: ['hostid', 'host', 'name', 'status'],
            groupids: groupIds,
            selectGroups: ['groupid', 'name'],
            ...additionalOptions
        };
        
        return await request('host.get', options);
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get hosts in groups:`, error.message);
        throw new Error(`Failed to retrieve hosts in groups: ${error.message}`);
    }
}

/**
 * Get templates in specific host groups
 * @param {Array<string>} groupIds - Array of host group IDs
 * @param {Object} additionalOptions - Additional options for the query
 * @returns {Promise<Array>} Array of templates in the specified groups
 */
async function getTemplatesInGroups(groupIds, additionalOptions = {}) {
    if (!Array.isArray(groupIds) || groupIds.length === 0) {
        throw new Error("getTemplatesInGroups expects a non-empty array of group IDs.");
    }

    try {
        logger.debug(`${config.logging.prefix} Getting templates in groups: ${groupIds.join(', ')}`);
        
        const options = {
            output: ['templateid', 'host', 'name', 'description'],
            groupids: groupIds,
            selectGroups: ['groupid', 'name'],
            ...additionalOptions
        };
        
        return await request('template.get', options);
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get templates in groups:`, error.message);
        throw new Error(`Failed to retrieve templates in groups: ${error.message}`);
    }
}

/**
 * Add hosts to host groups
 * @param {Array<string>} hostIds - Array of host IDs
 * @param {Array<string>} groupIds - Array of group IDs to add hosts to
 * @returns {Promise<Object>} Update result
 */
async function addHostsToGroups(hostIds, groupIds) {
    if (!Array.isArray(hostIds) || hostIds.length === 0) {
        throw new Error("addHostsToGroups expects a non-empty array of host IDs.");
    }
    if (!Array.isArray(groupIds) || groupIds.length === 0) {
        throw new Error("addHostsToGroups expects a non-empty array of group IDs.");
    }

    try {
        logger.info(`${config.logging.prefix} Adding hosts ${hostIds.join(', ')} to groups ${groupIds.join(', ')}`);
        
        // Get current groups for each host to preserve existing memberships
        const hostsWithGroups = await request('host.get', {
            output: ['hostid'],
            hostids: hostIds,
            selectGroups: ['groupid']
        });
        
        const updateParams = hostsWithGroups.map(host => {
            const currentGroupIds = host.groups.map(g => g.groupid);
            const allGroupIds = [...new Set([...currentGroupIds, ...groupIds])]; // Merge and deduplicate
            
            return {
                hostid: host.hostid,
                groups: allGroupIds.map(groupid => ({ groupid }))
            };
        });
        
        const result = await request('host.massupdate', {
            hosts: updateParams
        });
        
        logger.info(`${config.logging.prefix} Successfully added ${hostIds.length} hosts to ${groupIds.length} groups`);
        return result;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to add hosts to groups:`, error.message);
        throw new Error(`Failed to add hosts to groups: ${error.message}`);
    }
}

/**
 * Remove hosts from host groups
 * @param {Array<string>} hostIds - Array of host IDs
 * @param {Array<string>} groupIds - Array of group IDs to remove hosts from
 * @returns {Promise<Object>} Update result
 */
async function removeHostsFromGroups(hostIds, groupIds) {
    if (!Array.isArray(hostIds) || hostIds.length === 0) {
        throw new Error("removeHostsFromGroups expects a non-empty array of host IDs.");
    }
    if (!Array.isArray(groupIds) || groupIds.length === 0) {
        throw new Error("removeHostsFromGroups expects a non-empty array of group IDs.");
    }

    try {
        logger.info(`${config.logging.prefix} Removing hosts ${hostIds.join(', ')} from groups ${groupIds.join(', ')}`);
        
        // Get current groups for each host
        const hostsWithGroups = await request('host.get', {
            output: ['hostid'],
            hostids: hostIds,
            selectGroups: ['groupid']
        });
        
        const updateParams = hostsWithGroups.map(host => {
            const currentGroupIds = host.groups.map(g => g.groupid);
            const remainingGroupIds = currentGroupIds.filter(id => !groupIds.includes(id));
            
            // Ensure at least one group remains (Zabbix requirement)
            if (remainingGroupIds.length === 0) {
                throw new Error(`Cannot remove host ${host.hostid} from all groups. At least one group is required.`);
            }
            
            return {
                hostid: host.hostid,
                groups: remainingGroupIds.map(groupid => ({ groupid }))
            };
        });
        
        const result = await request('host.massupdate', {
            hosts: updateParams
        });
        
        logger.info(`${config.logging.prefix} Successfully removed ${hostIds.length} hosts from ${groupIds.length} groups`);
        return result;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to remove hosts from groups:`, error.message);
        throw new Error(`Failed to remove hosts from groups: ${error.message}`);
    }
}

/**
 * Get host group statistics
 * @param {Array<string>} groupIds - Array of group IDs (optional)
 * @returns {Promise<Object>} Host group statistics
 */
async function getHostGroupStatistics(groupIds = null) {
    try {
        logger.debug(`${config.logging.prefix} Getting host group statistics`);
        
        const groupOptions = groupIds ? { groupids: groupIds } : {};
        
        // Get host groups
        const groups = await request('hostgroup.get', {
            output: ['groupid', 'name', 'flags'],
            ...groupOptions
        });
        
        // Get host count for each group
        const hostCountPromises = groups.map(group => 
            request('host.get', {
                countOutput: true,
                groupids: [group.groupid]
            })
        );
        
        // Get template count for each group
        const templateCountPromises = groups.map(group => 
            request('template.get', {
                countOutput: true,
                groupids: [group.groupid]
            })
        );
        
        const [hostCounts, templateCounts] = await Promise.all([
            Promise.all(hostCountPromises),
            Promise.all(templateCountPromises)
        ]);
        
        const stats = {
            totalGroups: groups.length,
            groups: groups.map((group, index) => ({
                groupid: group.groupid,
                name: group.name,
                flags: group.flags,
                isInternal: group.flags === '4', // Internal groups have flags = 4
                hostsCount: parseInt(hostCounts[index], 10),
                templatesCount: parseInt(templateCounts[index], 10)
            })),
            totalHosts: hostCounts.reduce((sum, count) => sum + parseInt(count, 10), 0),
            totalTemplates: templateCounts.reduce((sum, count) => sum + parseInt(count, 10), 0)
        };
        
        return stats;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get host group statistics:`, error.message);
        throw new Error(`Failed to retrieve host group statistics: ${error.message}`);
    }
}

/**
 * Get empty host groups (groups with no hosts or templates)
 * @param {Object} additionalOptions - Additional options for the query
 * @returns {Promise<Array>} Array of empty host groups
 */
async function getEmptyHostGroups(additionalOptions = {}) {
    try {
        logger.debug(`${config.logging.prefix} Getting empty host groups`);
        
        // Get all groups
        const allGroups = await request('hostgroup.get', {
            output: ['groupid', 'name', 'flags'],
            ...additionalOptions
        });
        
        // Check each group for hosts and templates
        const emptyGroups = [];
        
        for (const group of allGroups) {
            const [hostCount, templateCount] = await Promise.all([
                request('host.get', {
                    countOutput: true,
                    groupids: [group.groupid]
                }),
                request('template.get', {
                    countOutput: true,
                    groupids: [group.groupid]
                })
            ]);
            
            if (parseInt(hostCount, 10) === 0 && parseInt(templateCount, 10) === 0) {
                emptyGroups.push({
                    ...group,
                    hostsCount: 0,
                    templatesCount: 0
                });
            }
        }
        
        logger.debug(`${config.logging.prefix} Found ${emptyGroups.length} empty host groups`);
        return emptyGroups;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get empty host groups:`, error.message);
        throw new Error(`Failed to retrieve empty host groups: ${error.message}`);
    }
}

/**
 * Get host groups with most hosts
 * @param {number} limit - Number of top groups to return (default: 10)
 * @param {Object} additionalOptions - Additional options for the query
 * @returns {Promise<Array>} Array of host groups sorted by host count
 */
async function getTopHostGroups(limit = 10, additionalOptions = {}) {
    try {
        logger.debug(`${config.logging.prefix} Getting top ${limit} host groups by host count`);
        
        const stats = await getHostGroupStatistics();
        
        // Sort by host count and take top N
        const topGroups = stats.groups
            .sort((a, b) => b.hostsCount - a.hostsCount)
            .slice(0, limit);
        
        return topGroups;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get top host groups:`, error.message);
        throw new Error(`Failed to retrieve top host groups: ${error.message}`);
    }
}

/**
 * Search host groups by multiple criteria
 * @param {Object} criteria - Search criteria
 * @param {Object} additionalOptions - Additional options for the query
 * @returns {Promise<Array>} Array of matching host groups
 */
async function searchHostGroups(criteria = {}, additionalOptions = {}) {
    try {
        logger.debug(`${config.logging.prefix} Searching host groups with criteria:`, criteria);
        
        const options = {
            output: ['groupid', 'name', 'flags'],
            ...additionalOptions
        };
        
        // Add search criteria
        if (criteria.name) {
            options.search = { name: criteria.name };
            options.searchWildcardsEnabled = true;
        }
        
        if (criteria.groupids) {
            options.groupids = criteria.groupids;
        }
        
        if (criteria.excludeInternal) {
            options.filter = { flags: '0' }; // Exclude internal groups
        }
        
        const groups = await request('hostgroup.get', options);
        
        // Apply additional filtering if needed
        let filteredGroups = groups;
        
        if (criteria.minHosts || criteria.maxHosts) {
            const groupsWithCounts = await Promise.all(
                groups.map(async (group) => {
                    const hostCount = await request('host.get', {
                        countOutput: true,
                        groupids: [group.groupid]
                    });
                    return {
                        ...group,
                        hostsCount: parseInt(hostCount, 10)
                    };
                })
            );
            
            filteredGroups = groupsWithCounts.filter(group => {
                if (criteria.minHosts && group.hostsCount < criteria.minHosts) return false;
                if (criteria.maxHosts && group.hostsCount > criteria.maxHosts) return false;
                return true;
            });
        }
        
        return filteredGroups;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to search host groups:`, error.message);
        throw new Error(`Failed to search host groups: ${error.message}`);
    }
}

module.exports = {
    getHostGroups,
    createHostGroup,
    updateHostGroup,
    deleteHostGroups,
    getHostGroupsByName,
    getHostsInGroups,
    getTemplatesInGroups,
    addHostsToGroups,
    removeHostsFromGroups,
    getHostGroupStatistics,
    getEmptyHostGroups,
    getTopHostGroups,
    searchHostGroups
}; 