/**
 * Enhanced Maps API Module
 * 
 * This module provides comprehensive functionality for managing Zabbix network maps,
 * value maps, and icon maps with enhanced capabilities using the professional zabbix-utils library.
 * 
 * Phase 6 Enhancement Features:
 * - Advanced map management with filtering and search
 * - Network topology analysis and mapping
 * - Value and icon mapping with enhanced configuration
 * - Map sharing and access control
 * - Advanced analytics and statistics
 * - Bulk operations and batch processing
 * 
 * @author Zabbix MCP Server
 * @version 3.0.0 - Phase 6
 * @since 2025-06-24
 */

const { request } = require('./zabbix-client');

// =============================================================================
// NETWORK MAPS MANAGEMENT
// =============================================================================

/**
 * Get network maps with enhanced filtering options
 * @param {Object} options - Map retrieval options
 * @returns {Promise<Array>} Array of network maps with enhanced data
 */
async function getMaps(options = {}) {
    const defaultOptions = {
        output: 'extend',
        selectElements: true,
        selectLinks: true,
        selectUsers: true,
        selectUserGroups: true,
        sortfield: ['name'],
        sortorder: 'ASC'
    };
    
    const params = { ...defaultOptions, ...options };
    const maps = await request('map.get', params);
    
    // Enhance map data with additional information
    return maps.map(map => ({
        ...map,
        elementCount: map.selements ? map.selements.length : 0,
        linkCount: map.links ? map.links.length : 0,
        hasElements: map.selements && map.selements.length > 0,
        hasLinks: map.links && map.links.length > 0,
        isPublic: map.private === '0',
        isPrivate: map.private === '1',
        lastModified: map.label_format ? 'Custom format' : 'Default format',
        accessLevel: map.userid ? 'Owner' : 'Shared'
    }));
}

/**
 * Get network maps by name pattern
 * @param {string} namePattern - Name pattern to search for
 * @param {Object} [options] - Additional search options
 * @returns {Promise<Array>} Array of matching network maps
 */
async function getMapsByName(namePattern, options = {}) {
    return await getMaps({
        ...options,
        search: {
            name: namePattern,
            ...options.search
        }
    });
}

/**
 * Get network maps by user/owner
 * @param {Array<string>} userIds - User IDs to filter by
 * @param {Object} [options] - Additional filter options
 * @returns {Promise<Array>} Array of user's network maps
 */
async function getMapsByUsers(userIds, options = {}) {
    return await getMaps({
        ...options,
        userids: userIds
    });
}

/**
 * Get public network maps (shared maps)
 * @param {Object} [options] - Additional filter options
 * @returns {Promise<Array>} Array of public network maps
 */
async function getPublicMaps(options = {}) {
    return await getMaps({
        ...options,
        filter: {
            private: 0,
            ...options.filter
        }
    });
}

/**
 * Get private network maps
 * @param {Object} [options] - Additional filter options
 * @returns {Promise<Array>} Array of private network maps
 */
async function getPrivateMaps(options = {}) {
    return await getMaps({
        ...options,
        filter: {
            private: 1,
            ...options.filter
        }
    });
}

/**
 * Get network maps with specific elements
 * @param {Array<string>} elementTypes - Element types to filter by
 * @param {Object} [options] - Additional filter options
 * @returns {Promise<Array>} Array of maps containing specified elements
 */
async function getMapsWithElements(elementTypes = [], options = {}) {
    const maps = await getMaps({
        ...options,
        selectElements: true
    });
    
    if (elementTypes.length === 0) {
        return maps.filter(map => map.selements && map.selements.length > 0);
    }
    
    return maps.filter(map => {
        if (!map.selements) return false;
        return map.selements.some(element => 
            elementTypes.includes(element.elementtype)
        );
    });
}

/**
 * Create a new network map
 * @param {Object} params - Map creation parameters
 * @param {string} params.name - Map name
 * @param {number} [params.width] - Map width (default: 800)
 * @param {number} [params.height] - Map height (default: 600)
 * @param {string} [params.label_type] - Label type
 * @param {string} [params.label_location] - Label location
 * @param {string} [params.private] - Privacy setting (0=public, 1=private)
 * @param {Array} [params.selements] - Map elements
 * @param {Array} [params.links] - Map links
 * @param {Array} [params.users] - User permissions
 * @param {Array} [params.userGroups] - User group permissions
 * @returns {Promise<Object>} Creation result with sysmapids
 */
async function createMap(params) {
    // Validate required parameters
    if (!params.name) {
        throw new Error('Map name is required');
    }
    
    // Set default values
    const defaultParams = {
        width: 800,
        height: 600,
        label_type: 0,
        label_location: 0,
        private: 0,
        highlight: 1,
        markelements: 0,
        show_unack: 0,
        grid_size: 50,
        grid_show: 1,
        grid_align: 1,
        label_format: 0,
        label_type_host: 2,
        label_type_hostgroup: 2,
        label_type_trigger: 2,
        label_type_map: 2,
        label_type_image: 2,
        label_string_host: '',
        label_string_hostgroup: '',
        label_string_trigger: '',
        label_string_map: '',
        label_string_image: '',
        ...params
    };
    
    return await request('map.create', defaultParams);
}

/**
 * Update an existing network map
 * @param {Object} params - Map update parameters (must include sysmapid)
 * @returns {Promise<Object>} Update result with sysmapids
 */
async function updateMap(params) {
    if (!params.sysmapid) {
        throw new Error('Map ID (sysmapid) is required for updating');
    }
    
    return await request('map.update', params);
}

/**
 * Delete network maps
 * @param {Array<string>} mapIds - Array of map IDs to delete
 * @returns {Promise<Object>} Deletion result with sysmapids
 */
async function deleteMaps(mapIds) {
    if (!Array.isArray(mapIds) || mapIds.length === 0) {
        throw new Error('Array of map IDs is required for deletion');
    }
    
    return await request('map.delete', mapIds);
}

/**
 * Copy/clone network maps
 * @param {Array<string>} mapIds - Array of map IDs to clone
 * @param {string} [namePrefix] - Prefix for cloned map names
 * @returns {Promise<Array>} Array of cloned maps
 */
async function cloneMaps(mapIds, namePrefix = 'Copy of ') {
    const sourceMaps = await getMaps({
        sysmapids: mapIds,
        selectElements: true,
        selectLinks: true,
        selectUsers: true,
        selectUserGroups: true
    });
    
    const clonedMaps = [];
    
    for (const map of sourceMaps) {
        const cloneParams = {
            ...map,
            name: namePrefix + map.name,
            sysmapid: undefined // Remove ID for creation
        };
        
        const result = await createMap(cloneParams);
        clonedMaps.push(result);
    }
    
    return clonedMaps;
}

// =============================================================================
// VALUE MAPS MANAGEMENT
// =============================================================================

/**
 * Get value maps with enhanced filtering
 * @param {Object} options - Value map retrieval options
 * @returns {Promise<Array>} Array of value maps with enhanced data
 */
async function getValueMaps(options = {}) {
    const defaultOptions = {
        output: 'extend',
        selectMappings: true,
        sortfield: ['name'],
        sortorder: 'ASC'
    };
    
    const params = { ...defaultOptions, ...options };
    const valuemaps = await request('valuemap.get', params);
    
    // Enhance value map data
    return valuemaps.map(valuemap => ({
        ...valuemap,
        mappingCount: valuemap.mappings ? valuemap.mappings.length : 0,
        hasMappings: valuemap.mappings && valuemap.mappings.length > 0,
        mappingTypes: valuemap.mappings ? 
            [...new Set(valuemap.mappings.map(m => m.type || 'exact'))] : []
    }));
}

/**
 * Get value maps by name pattern
 * @param {string} namePattern - Name pattern to search for
 * @param {Object} [options] - Additional search options
 * @returns {Promise<Array>} Array of matching value maps
 */
async function getValueMapsByName(namePattern, options = {}) {
    return await getValueMaps({
        ...options,
        search: {
            name: namePattern,
            ...options.search
        }
    });
}

/**
 * Get value maps by host IDs
 * @param {Array<string>} hostIds - Host IDs to filter by
 * @param {Object} [options] - Additional filter options
 * @returns {Promise<Array>} Array of value maps used by hosts
 */
async function getValueMapsByHosts(hostIds, options = {}) {
    return await getValueMaps({
        ...options,
        hostids: hostIds
    });
}

/**
 * Create a new value map
 * @param {Object} params - Value map creation parameters
 * @param {string} params.name - Value map name
 * @param {Array} params.mappings - Value mappings array
 * @returns {Promise<Object>} Creation result with valuemapids
 */
async function createValueMap(params) {
    if (!params.name) {
        throw new Error('Value map name is required');
    }
    
    if (!params.mappings || !Array.isArray(params.mappings)) {
        throw new Error('Value map mappings array is required');
    }
    
    return await request('valuemap.create', params);
}

/**
 * Update an existing value map
 * @param {Object} params - Value map update parameters (must include valuemapid)
 * @returns {Promise<Object>} Update result with valuemapids
 */
async function updateValueMap(params) {
    if (!params.valuemapid) {
        throw new Error('Value map ID (valuemapid) is required for updating');
    }
    
    return await request('valuemap.update', params);
}

/**
 * Delete value maps
 * @param {Array<string>} valueMapIds - Array of value map IDs to delete
 * @returns {Promise<Object>} Deletion result with valuemapids
 */
async function deleteValueMaps(valueMapIds) {
    if (!Array.isArray(valueMapIds) || valueMapIds.length === 0) {
        throw new Error('Array of value map IDs is required for deletion');
    }
    
    return await request('valuemap.delete', valueMapIds);
}

// =============================================================================
// ICON MAPS MANAGEMENT
// =============================================================================

/**
 * Get icon maps with enhanced filtering
 * @param {Object} options - Icon map retrieval options
 * @returns {Promise<Array>} Array of icon maps with enhanced data
 */
async function getIconMaps(options = {}) {
    const defaultOptions = {
        output: 'extend',
        selectMappings: true,
        sortfield: ['name'],
        sortorder: 'ASC'
    };
    
    const params = { ...defaultOptions, ...options };
    const iconmaps = await request('iconmap.get', params);
    
    // Enhance icon map data
    return iconmaps.map(iconmap => ({
        ...iconmap,
        mappingCount: iconmap.mappings ? iconmap.mappings.length : 0,
        hasMappings: iconmap.mappings && iconmap.mappings.length > 0,
        defaultIcon: iconmap.default_iconid || 'No default icon',
        inventoryLinks: iconmap.mappings ? 
            iconmap.mappings.filter(m => m.inventory_link !== '0').length : 0
    }));
}

/**
 * Get icon maps by name pattern
 * @param {string} namePattern - Name pattern to search for
 * @param {Object} [options] - Additional search options
 * @returns {Promise<Array>} Array of matching icon maps
 */
async function getIconMapsByName(namePattern, options = {}) {
    return await getIconMaps({
        ...options,
        search: {
            name: namePattern,
            ...options.search
        }
    });
}

/**
 * Create a new icon map
 * @param {Object} params - Icon map creation parameters
 * @param {string} params.name - Icon map name
 * @param {string} params.default_iconid - Default icon ID
 * @param {Array} [params.mappings] - Icon mappings array
 * @returns {Promise<Object>} Creation result with iconmapids
 */
async function createIconMap(params) {
    if (!params.name) {
        throw new Error('Icon map name is required');
    }
    
    if (!params.default_iconid) {
        throw new Error('Default icon ID is required');
    }
    
    return await request('iconmap.create', params);
}

/**
 * Update an existing icon map
 * @param {Object} params - Icon map update parameters (must include iconmapid)
 * @returns {Promise<Object>} Update result with iconmapids
 */
async function updateIconMap(params) {
    if (!params.iconmapid) {
        throw new Error('Icon map ID (iconmapid) is required for updating');
    }
    
    return await request('iconmap.update', params);
}

/**
 * Delete icon maps
 * @param {Array<string>} iconMapIds - Array of icon map IDs to delete
 * @returns {Promise<Object>} Deletion result with iconmapids
 */
async function deleteIconMaps(iconMapIds) {
    if (!Array.isArray(iconMapIds) || iconMapIds.length === 0) {
        throw new Error('Array of icon map IDs is required for deletion');
    }
    
    return await request('iconmap.delete', iconMapIds);
}

// =============================================================================
// MAP ANALYTICS AND STATISTICS
// =============================================================================

/**
 * Get comprehensive maps statistics
 * @param {Object} [options] - Statistics options
 * @returns {Promise<Object>} Maps statistics and analytics
 */
async function getMapStatistics(options = {}) {
    const maps = await getMaps({ 
        output: 'extend',
        selectElements: true,
        selectLinks: true,
        selectUsers: true,
        selectUserGroups: true 
    });
    
    const valuemaps = await getValueMaps({ output: 'extend', selectMappings: true });
    const iconmaps = await getIconMaps({ output: 'extend', selectMappings: true });
    
    // Calculate statistics
    const stats = {
        networkMaps: {
            total: maps.length,
            public: maps.filter(m => m.private === '0').length,
            private: maps.filter(m => m.private === '1').length,
            withElements: maps.filter(m => m.elementCount > 0).length,
            withLinks: maps.filter(m => m.linkCount > 0).length,
            averageElements: maps.length > 0 ? 
                Math.round(maps.reduce((sum, m) => sum + m.elementCount, 0) / maps.length) : 0,
            averageLinks: maps.length > 0 ? 
                Math.round(maps.reduce((sum, m) => sum + m.linkCount, 0) / maps.length) : 0
        },
        valueMaps: {
            total: valuemaps.length,
            withMappings: valuemaps.filter(vm => vm.mappingCount > 0).length,
            totalMappings: valuemaps.reduce((sum, vm) => sum + vm.mappingCount, 0),
            averageMappings: valuemaps.length > 0 ? 
                Math.round(valuemaps.reduce((sum, vm) => sum + vm.mappingCount, 0) / valuemaps.length) : 0
        },
        iconMaps: {
            total: iconmaps.length,
            withMappings: iconmaps.filter(im => im.mappingCount > 0).length,
            totalMappings: iconmaps.reduce((sum, im) => sum + im.mappingCount, 0),
            withInventoryLinks: iconmaps.filter(im => im.inventoryLinks > 0).length
        },
        distributions: {
            mapSizes: getMapsDistribution(maps, 'size'),
            elementTypes: getElementTypesDistribution(maps),
            userAccess: getUserAccessDistribution(maps)
        }
    };
    
    return stats;
}

/**
 * Search maps across all types with flexible criteria
 * @param {Object} criteria - Search criteria
 * @param {string} [criteria.query] - General search query
 * @param {Array<string>} [criteria.types] - Map types to search in
 * @param {string} [criteria.accessibility] - Accessibility filter (public/private)
 * @returns {Promise<Object>} Search results grouped by type
 */
async function searchMaps(criteria = {}) {
    const results = {
        networkMaps: [],
        valueMaps: [],
        iconMaps: [],
        summary: {
            totalFound: 0,
            searchQuery: criteria.query || 'All maps',
            searchTypes: criteria.types || ['network', 'value', 'icon']
        }
    };
    
    const searchTypes = criteria.types || ['network', 'value', 'icon'];
    
    // Search network maps
    if (searchTypes.includes('network')) {
        let networkOptions = {};
        
        if (criteria.query) {
            networkOptions.search = { name: criteria.query };
        }
        
        if (criteria.accessibility === 'public') {
            networkOptions.filter = { private: 0 };
        } else if (criteria.accessibility === 'private') {
            networkOptions.filter = { private: 1 };
        }
        
        results.networkMaps = await getMaps(networkOptions);
    }
    
    // Search value maps
    if (searchTypes.includes('value')) {
        let valueOptions = {};
        
        if (criteria.query) {
            valueOptions.search = { name: criteria.query };
        }
        
        results.valueMaps = await getValueMaps(valueOptions);
    }
    
    // Search icon maps
    if (searchTypes.includes('icon')) {
        let iconOptions = {};
        
        if (criteria.query) {
            iconOptions.search = { name: criteria.query };
        }
        
        results.iconMaps = await getIconMaps(iconOptions);
    }
    
    results.summary.totalFound = 
        results.networkMaps.length + 
        results.valueMaps.length + 
        results.iconMaps.length;
    
    return results;
}

// =============================================================================
// BULK OPERATIONS
// =============================================================================

/**
 * Enable/disable multiple network maps
 * @param {Array<string>} mapIds - Array of map IDs
 * @param {boolean} enabled - True to enable, false to disable
 * @returns {Promise<Object>} Bulk operation result
 */
async function setMapsEnabled(mapIds, enabled) {
    if (!Array.isArray(mapIds) || mapIds.length === 0) {
        throw new Error('Array of map IDs is required');
    }
    
    const updates = mapIds.map(sysmapid => ({
        sysmapid,
        show_unack: enabled ? 1 : 0
    }));
    
    const results = [];
    for (const update of updates) {
        try {
            const result = await updateMap(update);
            results.push({ sysmapid: update.sysmapid, success: true, result });
        } catch (error) {
            results.push({ sysmapid: update.sysmapid, success: false, error: error.message });
        }
    }
    
    return {
        total: mapIds.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results
    };
}

/**
 * Update map permissions for multiple maps
 * @param {Array<string>} mapIds - Array of map IDs
 * @param {Array} users - User permissions array
 * @param {Array} userGroups - User group permissions array
 * @returns {Promise<Object>} Bulk permission update result
 */
async function updateMapsPermissions(mapIds, users = [], userGroups = []) {
    if (!Array.isArray(mapIds) || mapIds.length === 0) {
        throw new Error('Array of map IDs is required');
    }
    
    const results = [];
    
    for (const sysmapid of mapIds) {
        try {
            const updateParams = { sysmapid };
            
            if (users.length > 0) {
                updateParams.users = users;
            }
            
            if (userGroups.length > 0) {
                updateParams.userGroups = userGroups;
            }
            
            const result = await updateMap(updateParams);
            results.push({ sysmapid, success: true, result });
        } catch (error) {
            results.push({ sysmapid, success: false, error: error.message });
        }
    }
    
    return {
        total: mapIds.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results
    };
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get distribution of maps by specified criteria
 * @param {Array} maps - Array of maps
 * @param {string} criteria - Distribution criteria
 * @returns {Object} Distribution object
 */
function getMapsDistribution(maps, criteria) {
    const distribution = {};
    
    maps.forEach(map => {
        let key;
        
        switch (criteria) {
            case 'size':
                if (map.elementCount === 0) key = 'Empty';
                else if (map.elementCount <= 5) key = 'Small (1-5)';
                else if (map.elementCount <= 20) key = 'Medium (6-20)';
                else key = 'Large (20+)';
                break;
            default:
                key = 'Unknown';
        }
        
        distribution[key] = (distribution[key] || 0) + 1;
    });
    
    return distribution;
}

/**
 * Get distribution of element types across maps
 * @param {Array} maps - Array of maps with elements
 * @returns {Object} Element types distribution
 */
function getElementTypesDistribution(maps) {
    const distribution = {};
    const elementTypeNames = {
        '0': 'Host',
        '1': 'Map',
        '2': 'Trigger',
        '3': 'Host group',
        '4': 'Image'
    };
    
    maps.forEach(map => {
        if (map.selements) {
            map.selements.forEach(element => {
                const typeName = elementTypeNames[element.elementtype] || `Type ${element.elementtype}`;
                distribution[typeName] = (distribution[typeName] || 0) + 1;
            });
        }
    });
    
    return distribution;
}

/**
 * Get user access distribution for maps
 * @param {Array} maps - Array of maps with user data
 * @returns {Object} User access distribution
 */
function getUserAccessDistribution(maps) {
    const distribution = {
        'Public Maps': 0,
        'Private Maps': 0,
        'Shared with Users': 0,
        'Shared with Groups': 0
    };
    
    maps.forEach(map => {
        if (map.private === '0') {
            distribution['Public Maps']++;
        } else {
            distribution['Private Maps']++;
        }
        
        if (map.users && map.users.length > 0) {
            distribution['Shared with Users']++;
        }
        
        if (map.userGroups && map.userGroups.length > 0) {
            distribution['Shared with Groups']++;
        }
    });
    
    return distribution;
}

// =============================================================================
// MODULE EXPORTS
// =============================================================================

module.exports = {
    // Network Maps
    getMaps,
    getMapsByName,
    getMapsByUsers,
    getPublicMaps,
    getPrivateMaps,
    getMapsWithElements,
    createMap,
    updateMap,
    deleteMaps,
    cloneMaps,
    
    // Value Maps
    getValueMaps,
    getValueMapsByName,
    getValueMapsByHosts,
    createValueMap,
    updateValueMap,
    deleteValueMaps,
    
    // Icon Maps
    getIconMaps,
    getIconMapsByName,
    createIconMap,
    updateIconMap,
    deleteIconMaps,
    
    // Analytics and Search
    getMapStatistics,
    searchMaps,
    
    // Bulk Operations
    setMapsEnabled,
    updateMapsPermissions,
    
    // Legacy compatibility export
    mapsApi: {
        getMaps,
        createMap,
        updateMap,
        deleteMaps,
        getValueMaps,
        createValueMap,
        updateValueMap,
        deleteValueMaps,
        getIconMaps,
        createIconMap,
        updateIconMap,
        deleteIconMaps
    }
}; 