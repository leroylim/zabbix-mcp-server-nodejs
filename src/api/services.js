/**
 * Enhanced Services API Module
 * 
 * This module provides comprehensive functionality for managing Zabbix services
 * with enhanced capabilities using the professional zabbix-utils library.
 * 
 * Phase 6 Enhancement Features:
 * - Advanced service management with filtering and search
 * - SLA monitoring and reporting
 * - Service dependency management
 * - Business service hierarchy analysis
 * - Performance analytics and statistics
 * - Bulk operations and batch processing
 * 
 * @author Zabbix MCP Server
 * @version 3.0.0 - Phase 6
 * @since 2025-06-24
 */

const { request } = require('./zabbix-client');

// =============================================================================
// SERVICE MANAGEMENT
// =============================================================================

/**
 * Get services with enhanced filtering options
 * @param {Object} options - Service retrieval options
 * @returns {Promise<Array>} Array of services with enhanced data
 */
async function getServices(options = {}) {
    const defaultOptions = {
        output: 'extend',
        selectParents: 'extend',
        selectChildren: 'extend',
        selectProblemTags: 'extend',
        selectStatusRules: 'extend',
        selectTags: 'extend',
        sortfield: ['name'],
        sortorder: 'ASC'
    };
    
    const params = { ...defaultOptions, ...options };
    const services = await request('service.get', params);
    
    // Enhance service data with additional information
    return services.map(service => ({
        ...service,
        parentCount: service.parents ? service.parents.length : 0,
        childCount: service.children ? service.children.length : 0,
        hasParents: service.parents && service.parents.length > 0,
        hasChildren: service.children && service.children.length > 0,
        isRootService: !service.parents || service.parents.length === 0,
        isLeafService: !service.children || service.children.length === 0,
        statusName: getServiceStatusName(service.status),
        algorithmName: getServiceAlgorithmName(service.algorithm),
        tagCount: service.tags ? service.tags.length : 0,
        problemTagCount: service.problem_tags ? service.problem_tags.length : 0,
        ruleCount: service.status_rules ? service.status_rules.length : 0,
        weight: service.weight || '0',
        propagationRule: service.propagation_rule || '0'
    }));
}

/**
 * Get services by name pattern
 * @param {string} namePattern - Name pattern to search for
 * @param {Object} [options] - Additional search options
 * @returns {Promise<Array>} Array of matching services
 */
async function getServicesByName(namePattern, options = {}) {
    return await getServices({
        ...options,
        search: {
            name: namePattern,
            ...options.search
        }
    });
}

/**
 * Get services by status
 * @param {Array<number>} statusCodes - Status codes to filter by
 * @param {Object} [options] - Additional filter options
 * @returns {Promise<Array>} Array of services with specified status
 */
async function getServicesByStatus(statusCodes, options = {}) {
    return await getServices({
        ...options,
        filter: {
            status: statusCodes,
            ...options.filter
        }
    });
}

/**
 * Get root services (services without parents)
 * @param {Object} [options] - Additional filter options
 * @returns {Promise<Array>} Array of root services
 */
async function getRootServices(options = {}) {
    const services = await getServices({
        ...options,
        selectParents: true
    });
    
    return services.filter(service => service.isRootService);
}

/**
 * Get leaf services (services without children)
 * @param {Object} [options] - Additional filter options
 * @returns {Promise<Array>} Array of leaf services
 */
async function getLeafServices(options = {}) {
    const services = await getServices({
        ...options,
        selectChildren: true
    });
    
    return services.filter(service => service.isLeafService);
}

/**
 * Get service hierarchy (tree structure)
 * @param {string} [rootServiceId] - Root service ID (optional)
 * @returns {Promise<Array>} Service hierarchy tree
 */
async function getServiceHierarchy(rootServiceId = null) {
    const services = await getServices({
        selectParents: true,
        selectChildren: true
    });
    
    if (rootServiceId) {
        // Get hierarchy starting from specific service
        const rootService = services.find(s => s.serviceid === rootServiceId);
        if (!rootService) {
            throw new Error(`Service with ID ${rootServiceId} not found`);
        }
        return buildServiceTree([rootService], services);
    }
    
    // Get all root services and build complete hierarchy
    const rootServices = services.filter(service => service.isRootService);
    return buildServiceTree(rootServices, services);
}

/**
 * Create a new service
 * @param {Object} params - Service creation parameters
 * @returns {Promise<Object>} Creation result with serviceids
 */
async function createService(params) {
    if (!params.name) {
        throw new Error('Service name is required');
    }
    
    if (!params.algorithm) {
        throw new Error('Service algorithm is required');
    }
    
    const defaultParams = {
        sortorder: 0,
        weight: 0,
        propagation_rule: 0,
        propagation_value: 0,
        status: -1, // Not calculated
        readonly: 0,
        ...params
    };
    
    return await request('service.create', defaultParams);
}

/**
 * Update an existing service
 * @param {Object} params - Service update parameters (must include serviceid)
 * @returns {Promise<Object>} Update result with serviceids
 */
async function updateService(params) {
    if (!params.serviceid) {
        throw new Error('Service ID (serviceid) is required for updating');
    }
    
    return await request('service.update', params);
}

/**
 * Delete services
 * @param {Array<string>} serviceIds - Array of service IDs to delete
 * @returns {Promise<Object>} Deletion result with serviceids
 */
async function deleteServices(serviceIds) {
    if (!Array.isArray(serviceIds) || serviceIds.length === 0) {
        throw new Error('Array of service IDs is required for deletion');
    }
    
    return await request('service.delete', serviceIds);
}

// =============================================================================
// SLA MANAGEMENT
// =============================================================================

/**
 * Get service SLA data with enhanced formatting
 * @param {Array<string>} serviceIds - Array of service IDs
 * @param {Array<Object>} intervals - Array of time intervals
 * @returns {Promise<Array>} Array of SLA data with enhanced formatting
 */
async function getServiceSLA(serviceIds, intervals) {
    if (!Array.isArray(serviceIds) || serviceIds.length === 0) {
        throw new Error('Array of service IDs is required');
    }
    
    if (!Array.isArray(intervals) || intervals.length === 0) {
        throw new Error('Array of time intervals is required');
    }
    
    const slaData = await request('service.getsla', { 
        serviceids: serviceIds, 
        intervals: intervals 
    });
    
    // Enhance SLA data with additional formatting
    return slaData.map(sla => ({
        ...sla,
        uptimePercentage: sla.uptime ? (parseFloat(sla.uptime) * 100).toFixed(2) + '%' : 'N/A',
        downtimePercentage: sla.downtime ? (parseFloat(sla.downtime) * 100).toFixed(2) + '%' : 'N/A',
        slaStatus: getSLAStatus(sla.sla),
        intervalDuration: sla.to - sla.from,
        intervalDays: Math.round((sla.to - sla.from) / 86400)
    }));
}

/**
 * Get SLA summary for multiple services
 * @param {Array<string>} serviceIds - Array of service IDs
 * @param {Object} timeRange - Time range for SLA calculation
 * @returns {Promise<Object>} SLA summary with statistics
 */
async function getServiceSLASummary(serviceIds, timeRange) {
    const now = Math.floor(Date.now() / 1000);
    const intervals = [{
        from: timeRange.from || (now - 2592000), // Default: last 30 days
        to: timeRange.to || now
    }];
    
    const slaData = await getServiceSLA(serviceIds, intervals);
    
    // Calculate summary statistics
    const summary = {
        totalServices: serviceIds.length,
        slaData: slaData,
        statistics: {
            averageUptime: 0,
            averageDowntime: 0,
            servicesWithSLA: 0,
            servicesWithoutSLA: 0,
            highestUptime: 0,
            lowestUptime: 100
        }
    };
    
    if (slaData.length > 0) {
        const validSLAs = slaData.filter(sla => sla.uptime !== undefined);
        
        if (validSLAs.length > 0) {
            const uptimes = validSLAs.map(sla => parseFloat(sla.uptime) * 100);
            summary.statistics.averageUptime = (uptimes.reduce((sum, val) => sum + val, 0) / uptimes.length).toFixed(2);
            summary.statistics.highestUptime = Math.max(...uptimes).toFixed(2);
            summary.statistics.lowestUptime = Math.min(...uptimes).toFixed(2);
            summary.statistics.servicesWithSLA = validSLAs.length;
            summary.statistics.servicesWithoutSLA = serviceIds.length - validSLAs.length;
            
            const downtimes = validSLAs.map(sla => parseFloat(sla.downtime || 0) * 100);
            summary.statistics.averageDowntime = (downtimes.reduce((sum, val) => sum + val, 0) / downtimes.length).toFixed(2);
        }
    }
    
    return summary;
}

// =============================================================================
// ANALYTICS AND STATISTICS
// =============================================================================

/**
 * Get comprehensive service statistics
 * @param {Object} [options] - Statistics options
 * @returns {Promise<Object>} Service statistics and analytics
 */
async function getServiceStatistics(options = {}) {
    const services = await getServices({ 
        output: 'extend',
        selectParents: true,
        selectChildren: true,
        selectTags: true,
        selectStatusRules: true
    });
    
    return {
        services: {
            total: services.length,
            rootServices: services.filter(s => s.isRootService).length,
            leafServices: services.filter(s => s.isLeafService).length,
            withChildren: services.filter(s => s.hasChildren).length,
            withParents: services.filter(s => s.hasParents).length,
            withTags: services.filter(s => s.tagCount > 0).length,
            withRules: services.filter(s => s.ruleCount > 0).length
        },
        hierarchy: {
            maxDepth: calculateMaxDepth(services),
            averageChildren: services.length > 0 ? 
                Math.round(services.reduce((sum, s) => sum + s.childCount, 0) / services.length) : 0,
            totalRelationships: services.reduce((sum, s) => sum + s.childCount, 0)
        },
        statusDistribution: getServiceStatusDistribution(services),
        algorithmDistribution: getServiceAlgorithmDistribution(services)
    };
}

/**
 * Search services with flexible criteria
 * @param {Object} criteria - Search criteria
 * @returns {Promise<Object>} Search results with metadata
 */
async function searchServices(criteria = {}) {
    const results = {
        services: [],
        summary: {
            totalFound: 0,
            searchQuery: criteria.query || 'All services'
        }
    };
    
    let searchOptions = {};
    
    if (criteria.query) {
        searchOptions.search = { name: criteria.query };
    }
    
    if (criteria.status && Array.isArray(criteria.status)) {
        searchOptions.filter = { status: criteria.status };
    }
    
    if (criteria.algorithm && Array.isArray(criteria.algorithm)) {
        searchOptions.filter = { 
            ...searchOptions.filter,
            algorithm: criteria.algorithm 
        };
    }
    
    results.services = await getServices(searchOptions);
    
    // Apply additional filters
    if (criteria.serviceType === 'root') {
        results.services = results.services.filter(s => s.isRootService);
    } else if (criteria.serviceType === 'leaf') {
        results.services = results.services.filter(s => s.isLeafService);
    }
    
    results.summary.totalFound = results.services.length;
    
    return results;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get service status name from status code
 * @param {number} statusCode - Service status code
 * @returns {string} Human-readable status name
 */
function getServiceStatusName(statusCode) {
    const statusNames = {
        '-1': 'Not calculated',
        '0': 'OK',
        '1': 'Problem',
        '2': 'Major',
        '3': 'Minor',
        '4': 'Warning',
        '5': 'Information'
    };
    
    return statusNames[statusCode] || `Unknown status (${statusCode})`;
}

/**
 * Get service algorithm name from algorithm code
 * @param {number} algorithmCode - Service algorithm code
 * @returns {string} Human-readable algorithm name
 */
function getServiceAlgorithmName(algorithmCode) {
    const algorithmNames = {
        '0': 'Do not calculate',
        '1': 'Problem if at least one child has a problem',
        '2': 'Problem if all children have problems'
    };
    
    return algorithmNames[algorithmCode] || `Unknown algorithm (${algorithmCode})`;
}

/**
 * Get SLA status based on SLA value
 * @param {string} slaValue - SLA value
 * @returns {string} SLA status description
 */
function getSLAStatus(slaValue) {
    if (!slaValue) return 'No SLA data';
    
    const sla = parseFloat(slaValue) * 100;
    
    if (sla >= 99.9) return 'Excellent';
    if (sla >= 99.5) return 'Very Good';
    if (sla >= 99.0) return 'Good';
    if (sla >= 95.0) return 'Acceptable';
    return 'Poor';
}

/**
 * Build service tree structure
 * @param {Array} rootServices - Root services
 * @param {Array} allServices - All services
 * @returns {Array} Tree structure
 */
function buildServiceTree(rootServices, allServices) {
    return rootServices.map(service => ({
        ...service,
        children: service.children ? 
            buildServiceTree(
                service.children.map(child => 
                    allServices.find(s => s.serviceid === child.serviceid)
                ).filter(Boolean),
                allServices
            ) : []
    }));
}

/**
 * Calculate maximum depth of service hierarchy
 * @param {Array} services - Array of services
 * @returns {number} Maximum depth
 */
function calculateMaxDepth(services) {
    const rootServices = services.filter(s => s.isRootService);
    let maxDepth = 0;
    
    function getDepth(service, depth = 0) {
        if (!service.children || service.children.length === 0) {
            return depth;
        }
        
        let childMaxDepth = depth;
        service.children.forEach(child => {
            const childService = services.find(s => s.serviceid === child.serviceid);
            if (childService) {
                childMaxDepth = Math.max(childMaxDepth, getDepth(childService, depth + 1));
            }
        });
        
        return childMaxDepth;
    }
    
    rootServices.forEach(service => {
        maxDepth = Math.max(maxDepth, getDepth(service));
    });
    
    return maxDepth;
}

/**
 * Get service status distribution
 * @param {Array} services - Array of services
 * @returns {Object} Status distribution
 */
function getServiceStatusDistribution(services) {
    const distribution = {};
    
    services.forEach(service => {
        const statusName = getServiceStatusName(service.status);
        distribution[statusName] = (distribution[statusName] || 0) + 1;
    });
    
    return distribution;
}

/**
 * Get service algorithm distribution
 * @param {Array} services - Array of services
 * @returns {Object} Algorithm distribution
 */
function getServiceAlgorithmDistribution(services) {
    const distribution = {};
    
    services.forEach(service => {
        const algorithmName = getServiceAlgorithmName(service.algorithm);
        distribution[algorithmName] = (distribution[algorithmName] || 0) + 1;
    });
    
    return distribution;
}

// =============================================================================
// MODULE EXPORTS
// =============================================================================

module.exports = {
    // Service Management
    getServices,
    getServicesByName,
    getServicesByStatus,
    getRootServices,
    getLeafServices,
    getServiceHierarchy,
    createService,
    updateService,
    deleteServices,
    
    // SLA Management
    getServiceSLA,
    getServiceSLASummary,
    
    // Analytics and Search
    getServiceStatistics,
    searchServices,
    
    // Legacy compatibility export
    servicesApi: {
        get: getServices,
        create: createService,
        update: updateService,
        delete: deleteServices,
        getSLA: getServiceSLA
    }
}; 