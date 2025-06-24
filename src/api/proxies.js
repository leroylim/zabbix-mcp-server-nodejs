/**
 * Enhanced Proxies API Module
 * 
 * This module provides comprehensive functionality for managing Zabbix proxies
 * with enhanced capabilities using the professional zabbix-utils library.
 * 
 * Phase 6 Enhancement Features:
 * - Advanced proxy management with filtering and search
 * - Proxy health monitoring and statistics
 * - Host assignment and distribution management
 * - Network monitoring and performance analysis
 * - Bulk operations and batch processing
 * 
 * @author Zabbix MCP Server
 * @version 3.0.0 - Phase 6
 * @since 2025-06-24
 */

const { request } = require('./zabbix-client');

// =============================================================================
// PROXY MANAGEMENT
// =============================================================================

/**
 * Get proxies with enhanced filtering options
 * @param {Object} options - Proxy retrieval options
 * @returns {Promise<Array>} Array of proxies with enhanced data
 */
async function getProxies(options = {}) {
    const defaultOptions = {
        output: 'extend',
        selectHosts: 'extend',
        sortfield: ['name'],
        sortorder: 'ASC'
    };
    
    const params = { ...defaultOptions, ...options };
    const proxies = await request('proxy.get', params);
    
    // Enhance proxy data with additional information
    return proxies.map(proxy => ({
        ...proxy,
        hostCount: proxy.hosts ? proxy.hosts.length : 0,
        hasHosts: proxy.hosts && proxy.hosts.length > 0,
        isActive: proxy.status === '5', // Active proxy
        isPassive: proxy.status === '6', // Passive proxy
        statusName: proxy.status === '5' ? 'Active proxy' : 'Passive proxy',
        connectionType: proxy.status === '5' ? 'Active' : 'Passive',
        lastAccess: proxy.lastaccess ? new Date(proxy.lastaccess * 1000).toISOString() : 'Never',
        isReachable: proxy.lastaccess && (Date.now() / 1000 - proxy.lastaccess) < 3600
    }));
}

/**
 * Get proxies by name pattern
 * @param {string} namePattern - Name pattern to search for
 * @param {Object} [options] - Additional search options
 * @returns {Promise<Array>} Array of matching proxies
 */
async function getProxiesByName(namePattern, options = {}) {
    return await getProxies({
        ...options,
        search: {
            host: namePattern,
            ...options.search
        }
    });
}

/**
 * Get active proxies
 * @param {Object} [options] - Additional filter options
 * @returns {Promise<Array>} Array of active proxies
 */
async function getActiveProxies(options = {}) {
    return await getProxies({
        ...options,
        filter: {
            status: 5,
            ...options.filter
        }
    });
}

/**
 * Get passive proxies
 * @param {Object} [options] - Additional filter options
 * @returns {Promise<Array>} Array of passive proxies
 */
async function getPassiveProxies(options = {}) {
    return await getProxies({
        ...options,
        filter: {
            status: 6,
            ...options.filter
        }
    });
}

/**
 * Get proxies with host assignments
 * @param {Object} [options] - Additional filter options
 * @returns {Promise<Array>} Array of proxies that have hosts assigned
 */
async function getProxiesWithHosts(options = {}) {
    const proxies = await getProxies({
        ...options,
        selectHosts: true
    });
    
    return proxies.filter(proxy => proxy.hostCount > 0);
}

/**
 * Get proxies without host assignments
 * @param {Object} [options] - Additional filter options
 * @returns {Promise<Array>} Array of proxies with no hosts assigned
 */
async function getProxiesWithoutHosts(options = {}) {
    const proxies = await getProxies({
        ...options,
        selectHosts: true
    });
    
    return proxies.filter(proxy => proxy.hostCount === 0);
}

/**
 * Get proxies by availability status
 * @param {boolean} isAvailable - True for available, false for unavailable
 * @param {Object} [options] - Additional filter options
 * @returns {Promise<Array>} Array of proxies by availability
 */
async function getProxiesByAvailability(isAvailable, options = {}) {
    const proxies = await getProxies(options);
    
    return proxies.filter(proxy => {
        const available = proxy.isReachable;
        return isAvailable ? available : !available;
    });
}

/**
 * Create a new proxy
 * @param {Object} params - Proxy creation parameters
 * @returns {Promise<Object>} Creation result with proxyids
 */
async function createProxy(params) {
    if (!params.host) {
        throw new Error('Proxy host name is required');
    }
    
    if (!params.status) {
        throw new Error('Proxy status is required (5=Active, 6=Passive)');
    }
    
    const defaultParams = {
        description: '',
        tls_connect: 1,
        tls_accept: 1,
        ...params
    };
    
    return await request('proxy.create', defaultParams);
}

/**
 * Update an existing proxy
 * @param {Object} params - Proxy update parameters (must include proxyid)
 * @returns {Promise<Object>} Update result with proxyids
 */
async function updateProxy(params) {
    if (!params.proxyid) {
        throw new Error('Proxy ID (proxyid) is required for updating');
    }
    
    return await request('proxy.update', params);
}

/**
 * Delete proxies
 * @param {Array<string>} proxyIds - Array of proxy IDs to delete
 * @returns {Promise<Object>} Deletion result with proxyids
 */
async function deleteProxies(proxyIds) {
    if (!Array.isArray(proxyIds) || proxyIds.length === 0) {
        throw new Error('Array of proxy IDs is required for deletion');
    }
    
    return await request('proxy.delete', proxyIds);
}

// =============================================================================
// PROXY HOST MANAGEMENT
// =============================================================================

/**
 * Get hosts monitored by specific proxy
 * @param {string} proxyId - Proxy ID
 * @param {Object} [options] - Additional options for host retrieval
 * @returns {Promise<Array>} Array of hosts monitored by the proxy
 */
async function getProxyHosts(proxyId, options = {}) {
    const hosts = await request('host.get', {
        output: 'extend',
        proxyids: [proxyId],
        selectGroups: true,
        selectInterfaces: true,
        ...options
    });
    
    return hosts.map(host => ({
        ...host,
        groupCount: host.groups ? host.groups.length : 0,
        interfaceCount: host.interfaces ? host.interfaces.length : 0,
        isEnabled: host.status === '0',
        isDisabled: host.status === '1'
    }));
}

/**
 * Assign hosts to proxy
 * @param {string} proxyId - Proxy ID
 * @param {Array<string>} hostIds - Array of host IDs to assign
 * @returns {Promise<Object>} Assignment result
 */
async function assignHostsToProxy(proxyId, hostIds) {
    if (!Array.isArray(hostIds) || hostIds.length === 0) {
        throw new Error('Array of host IDs is required');
    }
    
    const results = [];
    
    for (const hostid of hostIds) {
        try {
            const result = await request('host.update', {
                hostid,
                proxy_hostid: proxyId
            });
            results.push({ hostid, success: true, result });
        } catch (error) {
            results.push({ hostid, success: false, error: error.message });
        }
    }
    
    return {
        total: hostIds.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results
    };
}

/**
 * Remove hosts from proxy (assign to server)
 * @param {Array<string>} hostIds - Array of host IDs to remove from proxy
 * @returns {Promise<Object>} Removal result
 */
async function removeHostsFromProxy(hostIds) {
    if (!Array.isArray(hostIds) || hostIds.length === 0) {
        throw new Error('Array of host IDs is required');
    }
    
    const results = [];
    
    for (const hostid of hostIds) {
        try {
            const result = await request('host.update', {
                hostid,
                proxy_hostid: '0' // Assign to server
            });
            results.push({ hostid, success: true, result });
        } catch (error) {
            results.push({ hostid, success: false, error: error.message });
        }
    }
    
    return {
        total: hostIds.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results
    };
}

// =============================================================================
// ANALYTICS AND STATISTICS
// =============================================================================

/**
 * Get comprehensive proxy statistics
 * @param {Object} [options] - Statistics options
 * @returns {Promise<Object>} Proxy statistics and analytics
 */
async function getProxyStatistics(options = {}) {
    const proxies = await getProxies({ 
        output: 'extend',
        selectHosts: true 
    });
    
    return {
        proxies: {
            total: proxies.length,
            active: proxies.filter(p => p.status === '5').length,
            passive: proxies.filter(p => p.status === '6').length,
            reachable: proxies.filter(p => p.isReachable).length,
            unreachable: proxies.filter(p => !p.isReachable).length,
            withHosts: proxies.filter(p => p.hostCount > 0).length,
            withoutHosts: proxies.filter(p => p.hostCount === 0).length
        },
        hosts: {
            total: proxies.reduce((sum, p) => sum + p.hostCount, 0),
            averagePerProxy: proxies.length > 0 ? 
                Math.round(proxies.reduce((sum, p) => sum + p.hostCount, 0) / proxies.length) : 0
        }
    };
}

/**
 * Search proxies with flexible criteria
 * @param {Object} criteria - Search criteria
 * @returns {Promise<Object>} Search results with metadata
 */
async function searchProxies(criteria = {}) {
    const results = {
        proxies: [],
        summary: {
            totalFound: 0,
            searchQuery: criteria.query || 'All proxies'
        }
    };
    
    let searchOptions = {};
    
    if (criteria.query) {
        searchOptions.search = { host: criteria.query };
    }
    
    if (criteria.type === 'active') {
        searchOptions.filter = { status: 5 };
    } else if (criteria.type === 'passive') {
        searchOptions.filter = { status: 6 };
    }
    
    results.proxies = await getProxies(searchOptions);
    results.summary.totalFound = results.proxies.length;
    
    return results;
}

// =============================================================================
// BULK OPERATIONS
// =============================================================================

/**
 * Update proxy configuration for multiple proxies
 * @param {Array<string>} proxyIds - Array of proxy IDs
 * @param {Object} configUpdates - Configuration updates to apply
 * @returns {Promise<Object>} Bulk operation result
 */
async function updateProxiesConfiguration(proxyIds, configUpdates) {
    if (!Array.isArray(proxyIds) || proxyIds.length === 0) {
        throw new Error('Array of proxy IDs is required');
    }
    
    const results = [];
    
    for (const proxyid of proxyIds) {
        try {
            const result = await updateProxy({
                proxyid,
                ...configUpdates
            });
            results.push({ proxyid, success: true, result });
        } catch (error) {
            results.push({ proxyid, success: false, error: error.message });
        }
    }
    
    return {
        total: proxyIds.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results
    };
}

// =============================================================================
// MODULE EXPORTS
// =============================================================================

module.exports = {
    // Proxy Management
    getProxies,
    getProxiesByName,
    getActiveProxies,
    getPassiveProxies,
    getProxiesWithHosts,
    getProxiesWithoutHosts,
    getProxiesByAvailability,
    createProxy,
    updateProxy,
    deleteProxies,
    
    // Host Management
    getProxyHosts,
    assignHostsToProxy,
    removeHostsFromProxy,
    
    // Analytics and Search
    getProxyStatistics,
    searchProxies,
    
    // Bulk Operations
    updateProxiesConfiguration,
    
    // Legacy compatibility export
    proxiesApi: {
        get: getProxies,
        create: createProxy,
        update: updateProxy,
        delete: deleteProxies
    }
}; 