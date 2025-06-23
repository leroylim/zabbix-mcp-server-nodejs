const { logger } = require('../utils/logger');
const { ZabbixClient } = require('./zabbix-client');
const config = require('../config');

// Initialize client
const client = new ZabbixClient();

/**
 * Make a request using the zabbix-utils client
 * @param {string} method - API method name
 * @param {Object} params - Request parameters
 * @returns {Promise<any>} API response
 */
async function request(method, params = {}) {
    return await client.request(method, params);
}

/**
 * Get discovery rules from Zabbix
 * @param {Object} options - Parameters for discoveryrule.get
 * @returns {Promise<Array>} Array of discovery rules
 */
async function getDiscoveryRules(options = {}) {
    try {
        logger.debug(`${config.logging.prefix} Getting discovery rules`);
        const defaultOptions = {
            output: 'extend',
            selectHosts: ['hostid', 'name'],
            selectItems: ['itemid', 'name', 'key_'],
            selectTriggers: ['triggerid', 'description'],
            selectGraphs: ['graphid', 'name'],
            selectHostPrototypes: ['hostid', 'name'],
            selectFilter: 'extend',
            selectLLDMacroPaths: 'extend',
            selectPreprocessing: 'extend',
            selectOverrides: 'extend'
        };
        
        const params = { ...defaultOptions, ...options };
        return await request('discoveryrule.get', params);
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get discovery rules:`, error.message);
        throw new Error(`Failed to retrieve discovery rules: ${error.message}`);
    }
}

/**
 * Create a new discovery rule
 * @param {Object} ruleData - Discovery rule creation parameters
 * @returns {Promise<Object>} Creation result with itemids
 */
async function createDiscoveryRule(ruleData) {
    try {
        logger.debug(`${config.logging.prefix} Creating discovery rule: ${ruleData.name}`);
        
        // Validate required fields
        if (!ruleData.name || !ruleData.key_ || !ruleData.hostid || typeof ruleData.type === 'undefined') {
            throw new Error("Parameters 'name', 'key_', 'hostid', and 'type' are required");
        }
        
        const result = await request('discoveryrule.create', ruleData);
        logger.info(`${config.logging.prefix} Created discovery rule: ${ruleData.name} (ID: ${result.itemids[0]})`);
        return result;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to create discovery rule:`, error.message);
        throw new Error(`Failed to create discovery rule: ${error.message}`);
    }
}

/**
 * Update an existing discovery rule
 * @param {Object} updateData - Discovery rule update parameters (must include itemid)
 * @returns {Promise<Object>} Update result with itemids
 */
async function updateDiscoveryRule(updateData) {
    try {
        logger.debug(`${config.logging.prefix} Updating discovery rule: ${updateData.itemid}`);
        
        if (!updateData.itemid) {
            throw new Error("Parameter 'itemid' is required for updating discovery rule");
        }
        
        const result = await request('discoveryrule.update', updateData);
        logger.info(`${config.logging.prefix} Updated discovery rule: ${updateData.itemid}`);
        return result;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to update discovery rule:`, error.message);
        throw new Error(`Failed to update discovery rule: ${error.message}`);
    }
}

/**
 * Delete discovery rules
 * @param {Array<string>} ruleIds - Array of discovery rule IDs to delete
 * @returns {Promise<Object>} Deletion result with itemids
 */
async function deleteDiscoveryRules(ruleIds) {
    try {
        logger.debug(`${config.logging.prefix} Deleting ${ruleIds.length} discovery rules`);
        
        if (!Array.isArray(ruleIds) || ruleIds.length === 0) {
            throw new Error("Parameter 'ruleIds' must be a non-empty array");
        }
        
        const result = await request('discoveryrule.delete', ruleIds);
        logger.info(`${config.logging.prefix} Deleted ${ruleIds.length} discovery rules`);
        return result;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to delete discovery rules:`, error.message);
        throw new Error(`Failed to delete discovery rules: ${error.message}`);
    }
}

/**
 * Get discovery rules by host IDs
 * @param {Array<string>} hostIds - Array of host IDs
 * @param {Object} options - Additional options
 * @returns {Promise<Array>} Array of discovery rules
 */
async function getDiscoveryRulesByHosts(hostIds, options = {}) {
    try {
        logger.debug(`${config.logging.prefix} Getting discovery rules for ${hostIds.length} hosts`);
        
        if (!Array.isArray(hostIds) || hostIds.length === 0) {
            throw new Error("Parameter 'hostIds' must be a non-empty array");
        }
        
        const params = {
            hostids: hostIds,
            output: 'extend',
            selectHosts: ['hostid', 'name'],
            selectItems: 'count',
            selectTriggers: 'count',
            selectGraphs: 'count',
            ...options
        };
        
        return await request('discoveryrule.get', params);
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get discovery rules by hosts:`, error.message);
        throw new Error(`Failed to retrieve discovery rules by hosts: ${error.message}`);
    }
}

/**
 * Get discovery rules by template IDs
 * @param {Array<string>} templateIds - Array of template IDs
 * @param {Object} options - Additional options
 * @returns {Promise<Array>} Array of discovery rules
 */
async function getDiscoveryRulesByTemplates(templateIds, options = {}) {
    try {
        logger.debug(`${config.logging.prefix} Getting discovery rules for ${templateIds.length} templates`);
        
        if (!Array.isArray(templateIds) || templateIds.length === 0) {
            throw new Error("Parameter 'templateIds' must be a non-empty array");
        }
        
        const params = {
            templateids: templateIds,
            output: 'extend',
            selectHosts: ['hostid', 'name'],
            selectItems: 'count',
            selectTriggers: 'count',
            selectGraphs: 'count',
            ...options
        };
        
        return await request('discoveryrule.get', params);
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get discovery rules by templates:`, error.message);
        throw new Error(`Failed to retrieve discovery rules by templates: ${error.message}`);
    }
}

/**
 * Get discovery rules by name pattern
 * @param {string} namePattern - Name pattern to search for
 * @param {Object} options - Additional options
 * @returns {Promise<Array>} Array of discovery rules
 */
async function getDiscoveryRulesByName(namePattern, options = {}) {
    try {
        logger.debug(`${config.logging.prefix} Getting discovery rules by name pattern: ${namePattern}`);
        
        if (!namePattern || typeof namePattern !== 'string') {
            throw new Error("Parameter 'namePattern' must be a non-empty string");
        }
        
        const params = {
            search: { name: namePattern },
            searchWildcardsEnabled: true,
            output: 'extend',
            selectHosts: ['hostid', 'name'],
            selectItems: 'count',
            selectTriggers: 'count',
            selectGraphs: 'count',
            ...options
        };
        
        return await request('discoveryrule.get', params);
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get discovery rules by name:`, error.message);
        throw new Error(`Failed to retrieve discovery rules by name: ${error.message}`);
    }
}

/**
 * Get enabled discovery rules
 * @param {Object} options - Additional options
 * @returns {Promise<Array>} Array of enabled discovery rules
 */
async function getEnabledDiscoveryRules(options = {}) {
    try {
        logger.debug(`${config.logging.prefix} Getting enabled discovery rules`);
        
        const params = {
            filter: { status: 0 }, // 0 = enabled
            output: 'extend',
            selectHosts: ['hostid', 'name'],
            selectItems: 'count',
            selectTriggers: 'count',
            selectGraphs: 'count',
            ...options
        };
        
        return await request('discoveryrule.get', params);
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get enabled discovery rules:`, error.message);
        throw new Error(`Failed to retrieve enabled discovery rules: ${error.message}`);
    }
}

/**
 * Get disabled discovery rules
 * @param {Object} options - Additional options
 * @returns {Promise<Array>} Array of disabled discovery rules
 */
async function getDisabledDiscoveryRules(options = {}) {
    try {
        logger.debug(`${config.logging.prefix} Getting disabled discovery rules`);
        
        const params = {
            filter: { status: 1 }, // 1 = disabled
            output: 'extend',
            selectHosts: ['hostid', 'name'],
            selectItems: 'count',
            selectTriggers: 'count',
            selectGraphs: 'count',
            ...options
        };
        
        return await request('discoveryrule.get', params);
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get disabled discovery rules:`, error.message);
        throw new Error(`Failed to retrieve disabled discovery rules: ${error.message}`);
    }
}

/**
 * Enable discovery rules
 * @param {Array<string>} ruleIds - Array of discovery rule IDs to enable
 * @returns {Promise<Object>} Update result
 */
async function enableDiscoveryRules(ruleIds) {
    try {
        logger.debug(`${config.logging.prefix} Enabling ${ruleIds.length} discovery rules`);
        
        if (!Array.isArray(ruleIds) || ruleIds.length === 0) {
            throw new Error("Parameter 'ruleIds' must be a non-empty array");
        }
        
        const updates = ruleIds.map(itemid => ({ itemid, status: 0 }));
        const result = await request('discoveryrule.massupdate', {
            rules: updates,
            status: 0
        });
        
        logger.info(`${config.logging.prefix} Enabled ${ruleIds.length} discovery rules`);
        return result;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to enable discovery rules:`, error.message);
        throw new Error(`Failed to enable discovery rules: ${error.message}`);
    }
}

/**
 * Disable discovery rules
 * @param {Array<string>} ruleIds - Array of discovery rule IDs to disable
 * @returns {Promise<Object>} Update result
 */
async function disableDiscoveryRules(ruleIds) {
    try {
        logger.debug(`${config.logging.prefix} Disabling ${ruleIds.length} discovery rules`);
        
        if (!Array.isArray(ruleIds) || ruleIds.length === 0) {
            throw new Error("Parameter 'ruleIds' must be a non-empty array");
        }
        
        const updates = ruleIds.map(itemid => ({ itemid, status: 1 }));
        const result = await request('discoveryrule.massupdate', {
            rules: updates,
            status: 1
        });
        
        logger.info(`${config.logging.prefix} Disabled ${ruleIds.length} discovery rules`);
        return result;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to disable discovery rules:`, error.message);
        throw new Error(`Failed to disable discovery rules: ${error.message}`);
    }
}

/**
 * Get discovered hosts from discovery rules
 * @param {Object} options - Parameters for dhost.get
 * @returns {Promise<Array>} Array of discovered hosts
 */
async function getDiscoveredHosts(options = {}) {
    try {
        logger.debug(`${config.logging.prefix} Getting discovered hosts`);
        
        const defaultOptions = {
            output: 'extend',
            selectDRules: ['druleid', 'name'],
            selectDServices: 'count'
        };
        
        const params = { ...defaultOptions, ...options };
        const hosts = await request('dhost.get', params);
        
        // Format timestamps for readability
        const formattedHosts = hosts.map(host => ({
            ...host,
            lastup_readable: host.lastup ? new Date(host.lastup * 1000).toISOString() : 'Never',
            lastdown_readable: host.lastdown ? new Date(host.lastdown * 1000).toISOString() : 'Never'
        }));
        
        return formattedHosts;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get discovered hosts:`, error.message);
        throw new Error(`Failed to retrieve discovered hosts: ${error.message}`);
    }
}

/**
 * Get discovered services from discovery rules
 * @param {Object} options - Parameters for dservice.get
 * @returns {Promise<Array>} Array of discovered services
 */
async function getDiscoveredServices(options = {}) {
    try {
        logger.debug(`${config.logging.prefix} Getting discovered services`);
        
        const defaultOptions = {
            output: 'extend',
            selectDRules: ['druleid', 'name'],
            selectDHosts: ['dhostid', 'ip', 'dns']
        };
        
        const params = { ...defaultOptions, ...options };
        return await request('dservice.get', params);
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get discovered services:`, error.message);
        throw new Error(`Failed to retrieve discovered services: ${error.message}`);
    }
}

/**
 * Get discovery rule statistics
 * @param {Object} options - Additional filtering options
 * @returns {Promise<Object>} Discovery rule statistics
 */
async function getDiscoveryRuleStatistics(options = {}) {
    try {
        logger.debug(`${config.logging.prefix} Getting discovery rule statistics`);
        
        const rules = await getDiscoveryRules({
            output: ['itemid', 'name', 'status', 'type'],
            selectHosts: ['hostid', 'name'],
            selectItems: 'count',
            selectTriggers: 'count',
            selectGraphs: 'count',
            ...options
        });
        
        const stats = {
            total: rules.length,
            enabled: rules.filter(rule => rule.status === '0').length,
            disabled: rules.filter(rule => rule.status === '1').length,
            byType: {},
            totalItems: 0,
            totalTriggers: 0,
            totalGraphs: 0,
            byHost: {}
        };
        
        // Calculate type distribution
        rules.forEach(rule => {
            const type = rule.type;
            stats.byType[type] = (stats.byType[type] || 0) + 1;
            
            // Sum up prototypes
            stats.totalItems += parseInt(rule.items || 0);
            stats.totalTriggers += parseInt(rule.triggers || 0);
            stats.totalGraphs += parseInt(rule.graphs || 0);
            
            // Group by host
            if (rule.hosts && rule.hosts.length > 0) {
                const hostName = rule.hosts[0].name;
                if (!stats.byHost[hostName]) {
                    stats.byHost[hostName] = { count: 0, rules: [] };
                }
                stats.byHost[hostName].count++;
                stats.byHost[hostName].rules.push({
                    itemid: rule.itemid,
                    name: rule.name,
                    status: rule.status
                });
            }
        });
        
        return stats;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get discovery rule statistics:`, error.message);
        throw new Error(`Failed to retrieve discovery rule statistics: ${error.message}`);
    }
}

/**
 * Search discovery rules with multiple criteria
 * @param {Object} criteria - Search criteria
 * @returns {Promise<Array>} Array of matching discovery rules
 */
async function searchDiscoveryRules(criteria = {}) {
    try {
        logger.debug(`${config.logging.prefix} Searching discovery rules with criteria`);
        
        const params = {
            output: 'extend',
            selectHosts: ['hostid', 'name'],
            selectItems: 'count',
            selectTriggers: 'count',
            selectGraphs: 'count'
        };
        
        // Apply search criteria
        if (criteria.name) {
            params.search = { ...params.search, name: criteria.name };
            params.searchWildcardsEnabled = true;
        }
        
        if (criteria.key) {
            params.search = { ...params.search, key_: criteria.key };
            params.searchWildcardsEnabled = true;
        }
        
        if (criteria.status !== undefined) {
            params.filter = { ...params.filter, status: criteria.status };
        }
        
        if (criteria.type !== undefined) {
            params.filter = { ...params.filter, type: criteria.type };
        }
        
        if (criteria.hostIds) {
            params.hostids = criteria.hostIds;
        }
        
        if (criteria.templateIds) {
            params.templateids = criteria.templateIds;
        }
        
        return await request('discoveryrule.get', params);
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to search discovery rules:`, error.message);
        throw new Error(`Failed to search discovery rules: ${error.message}`);
    }
}

module.exports = {
    // Core CRUD operations
    getDiscoveryRules,
    createDiscoveryRule,
    updateDiscoveryRule,
    deleteDiscoveryRules,
    
    // Enhanced query functions
    getDiscoveryRulesByHosts,
    getDiscoveryRulesByTemplates,
    getDiscoveryRulesByName,
    getEnabledDiscoveryRules,
    getDisabledDiscoveryRules,
    
    // Management functions
    enableDiscoveryRules,
    disableDiscoveryRules,
    
    // Discovery results
    getDiscoveredHosts,
    getDiscoveredServices,
    
    // Analytics and search
    getDiscoveryRuleStatistics,
    searchDiscoveryRules,
    
    // Backward compatibility
    discoveryApi: {
        get: getDiscoveryRules,
        create: createDiscoveryRule,
        update: updateDiscoveryRule,
        delete: deleteDiscoveryRules,
        getDiscoveredHosts,
        getDiscoveredServices
    }
}; 