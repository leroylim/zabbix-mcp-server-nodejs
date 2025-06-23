/**
 * Enhanced Dashboards API Module
 * 
 * This module provides comprehensive functionality for managing Zabbix dashboards
 * and widgets with enhanced capabilities using the professional zabbix-utils library.
 * 
 * Phase 6 Enhancement Features:
 * - Advanced dashboard management with filtering and search
 * - Widget configuration and management
 * - Dashboard sharing and access control
 * - Template dashboard operations
 * - Advanced analytics and statistics
 * - Bulk operations and batch processing
 * 
 * @author Zabbix MCP Server
 * @version 3.0.0 - Phase 6
 * @since 2025-06-24
 */

const { request } = require('./zabbix-client');

// =============================================================================
// DASHBOARD MANAGEMENT
// =============================================================================

/**
 * Get dashboards with enhanced filtering options
 * @param {Object} options - Dashboard retrieval options
 * @returns {Promise<Array>} Array of dashboards with enhanced data
 */
async function getDashboards(options = {}) {
    const defaultOptions = {
        output: 'extend',
        selectPages: true,
        selectUsers: true,
        selectUserGroups: true,
        sortfield: ['name'],
        sortorder: 'ASC'
    };
    
    const params = { ...defaultOptions, ...options };
    const dashboards = await request('dashboard.get', params);
    
    // Enhance dashboard data with additional information
    return dashboards.map(dashboard => ({
        ...dashboard,
        pageCount: dashboard.pages ? dashboard.pages.length : 0,
        hasPages: dashboard.pages && dashboard.pages.length > 0,
        isPrivate: dashboard.private === '1',
        isPublic: dashboard.private === '0',
        isTemplate: dashboard.templateid && dashboard.templateid !== '0',
        widgetCount: dashboard.pages ? 
            dashboard.pages.reduce((sum, page) => sum + (page.widgets ? page.widgets.length : 0), 0) : 0,
        accessLevel: dashboard.userid ? 'Owner' : 'Shared'
    }));
}

/**
 * Get dashboards by name pattern
 * @param {string} namePattern - Name pattern to search for
 * @param {Object} [options] - Additional search options
 * @returns {Promise<Array>} Array of matching dashboards
 */
async function getDashboardsByName(namePattern, options = {}) {
    return await getDashboards({
        ...options,
        search: {
            name: namePattern,
            ...options.search
        }
    });
}

/**
 * Get dashboards by user/owner
 * @param {Array<string>} userIds - User IDs to filter by
 * @param {Object} [options] - Additional filter options
 * @returns {Promise<Array>} Array of user's dashboards
 */
async function getDashboardsByUsers(userIds, options = {}) {
    return await getDashboards({
        ...options,
        userids: userIds
    });
}

/**
 * Get public dashboards (shared dashboards)
 * @param {Object} [options] - Additional filter options
 * @returns {Promise<Array>} Array of public dashboards
 */
async function getPublicDashboards(options = {}) {
    return await getDashboards({
        ...options,
        filter: {
            private: 0,
            ...options.filter
        }
    });
}

/**
 * Get private dashboards
 * @param {Object} [options] - Additional filter options
 * @returns {Promise<Array>} Array of private dashboards
 */
async function getPrivateDashboards(options = {}) {
    return await getDashboards({
        ...options,
        filter: {
            private: 1,
            ...options.filter
        }
    });
}

/**
 * Get template dashboards
 * @param {Array<string>} [templateIds] - Template IDs to filter by
 * @param {Object} [options] - Additional filter options
 * @returns {Promise<Array>} Array of template dashboards
 */
async function getTemplateDashboards(templateIds = [], options = {}) {
    const filterOptions = { ...options };
    
    if (templateIds.length > 0) {
        filterOptions.templateids = templateIds;
    } else {
        // Get all template dashboards (those with templateid set)
        filterOptions.filter = {
            ...filterOptions.filter
        };
        filterOptions.search = {
            templateid: ['0'], // Not equal to 0
            ...filterOptions.search
        };
    }
    
    return await getDashboards(filterOptions);
}

/**
 * Get dashboards with specific widget types
 * @param {Array<string>} widgetTypes - Widget types to filter by
 * @param {Object} [options] - Additional filter options
 * @returns {Promise<Array>} Array of dashboards containing specified widgets
 */
async function getDashboardsWithWidgetTypes(widgetTypes = [], options = {}) {
    const dashboards = await getDashboards({
        ...options,
        selectPages: true
    });
    
    if (widgetTypes.length === 0) {
        return dashboards.filter(dashboard => dashboard.widgetCount > 0);
    }
    
    return dashboards.filter(dashboard => {
        if (!dashboard.pages) return false;
        return dashboard.pages.some(page => {
            if (!page.widgets) return false;
            return page.widgets.some(widget => 
                widgetTypes.includes(widget.type)
            );
        });
    });
}

/**
 * Create a new dashboard
 * @param {Object} params - Dashboard creation parameters
 * @returns {Promise<Object>} Creation result with dashboardids
 */
async function createDashboard(params) {
    if (!params.name) {
        throw new Error('Dashboard name is required');
    }
    
    const defaultParams = {
        private: 0,
        auto_start: 0,
        pages: [{
            name: 'Page 1',
            display_period: 30,
            widgets: []
        }],
        ...params
    };
    
    return await request('dashboard.create', defaultParams);
}

/**
 * Update an existing dashboard
 * @param {Object} params - Dashboard update parameters (must include dashboardid)
 * @returns {Promise<Object>} Update result with dashboardids
 */
async function updateDashboard(params) {
    if (!params.dashboardid) {
        throw new Error('Dashboard ID (dashboardid) is required for updating');
    }
    
    return await request('dashboard.update', params);
}

/**
 * Delete dashboards
 * @param {Array<string>} dashboardIds - Array of dashboard IDs to delete
 * @returns {Promise<Object>} Deletion result with dashboardids
 */
async function deleteDashboards(dashboardIds) {
    if (!Array.isArray(dashboardIds) || dashboardIds.length === 0) {
        throw new Error('Array of dashboard IDs is required for deletion');
    }
    
    return await request('dashboard.delete', dashboardIds);
}

/**
 * Clone/copy dashboards
 * @param {Array<string>} dashboardIds - Array of dashboard IDs to clone
 * @param {string} [namePrefix] - Prefix for cloned dashboard names
 * @returns {Promise<Array>} Array of cloned dashboards
 */
async function cloneDashboards(dashboardIds, namePrefix = 'Copy of ') {
    const sourceDashboards = await getDashboards({
        dashboardids: dashboardIds,
        selectPages: true,
        selectUsers: true,
        selectUserGroups: true
    });
    
    const clonedDashboards = [];
    
    for (const dashboard of sourceDashboards) {
        const cloneParams = {
            ...dashboard,
            name: namePrefix + dashboard.name,
            dashboardid: undefined // Remove ID for creation
        };
        
        const result = await createDashboard(cloneParams);
        clonedDashboards.push(result);
    }
    
    return clonedDashboards;
}

// =============================================================================
// WIDGET MANAGEMENT
// =============================================================================

/**
 * Get widgets from specific dashboard pages
 * @param {string} dashboardId - Dashboard ID
 * @param {number} [pageIndex] - Specific page index (optional)
 * @returns {Promise<Array>} Array of widgets with enhanced data
 */
async function getDashboardWidgets(dashboardId, pageIndex = null) {
    const dashboards = await getDashboards({
        dashboardids: [dashboardId],
        selectPages: true
    });
    
    if (dashboards.length === 0) {
        throw new Error(`Dashboard with ID ${dashboardId} not found`);
    }
    
    const dashboard = dashboards[0];
    if (!dashboard.pages) {
        return [];
    }
    
    let pages = dashboard.pages;
    if (pageIndex !== null) {
        pages = dashboard.pages.filter((page, index) => index === pageIndex);
    }
    
    const widgets = [];
    pages.forEach((page, pIndex) => {
        if (page.widgets) {
            page.widgets.forEach(widget => {
                widgets.push({
                    ...widget,
                    pageIndex: pIndex,
                    pageName: page.name || `Page ${pIndex + 1}`,
                    hasFields: widget.fields && widget.fields.length > 0,
                    fieldCount: widget.fields ? widget.fields.length : 0,
                    widgetTypeName: getWidgetTypeName(widget.type)
                });
            });
        }
    });
    
    return widgets;
}

/**
 * Add widget to dashboard page
 * @param {string} dashboardId - Dashboard ID
 * @param {number} pageIndex - Page index
 * @param {Object} widgetConfig - Widget configuration
 * @returns {Promise<Object>} Update result
 */
async function addWidgetToDashboard(dashboardId, pageIndex, widgetConfig) {
    if (!widgetConfig.type) {
        throw new Error('Widget type is required');
    }
    
    const dashboards = await getDashboards({
        dashboardids: [dashboardId],
        selectPages: true
    });
    
    if (dashboards.length === 0) {
        throw new Error(`Dashboard with ID ${dashboardId} not found`);
    }
    
    const dashboard = dashboards[0];
    if (!dashboard.pages || !dashboard.pages[pageIndex]) {
        throw new Error(`Page index ${pageIndex} not found in dashboard`);
    }
    
    // Add widget to the specified page
    const updatedPages = [...dashboard.pages];
    if (!updatedPages[pageIndex].widgets) {
        updatedPages[pageIndex].widgets = [];
    }
    
    const newWidget = {
        type: widgetConfig.type,
        name: widgetConfig.name || `${getWidgetTypeName(widgetConfig.type)} Widget`,
        x: widgetConfig.x || 0,
        y: widgetConfig.y || 0,
        width: widgetConfig.width || 12,
        height: widgetConfig.height || 5,
        fields: widgetConfig.fields || []
    };
    
    updatedPages[pageIndex].widgets.push(newWidget);
    
    return await updateDashboard({
        dashboardid: dashboardId,
        pages: updatedPages
    });
}

// =============================================================================
// ANALYTICS AND STATISTICS
// =============================================================================

/**
 * Get comprehensive dashboard statistics
 * @param {Object} [options] - Statistics options
 * @returns {Promise<Object>} Dashboard statistics and analytics
 */
async function getDashboardStatistics(options = {}) {
    const dashboards = await getDashboards({ 
        output: 'extend',
        selectPages: true 
    });
    
    return {
        dashboards: {
            total: dashboards.length,
            public: dashboards.filter(d => d.private === '0').length,
            private: dashboards.filter(d => d.private === '1').length,
            template: dashboards.filter(d => d.isTemplate).length,
            withPages: dashboards.filter(d => d.pageCount > 0).length,
            withWidgets: dashboards.filter(d => d.widgetCount > 0).length,
            averagePages: dashboards.length > 0 ? 
                Math.round(dashboards.reduce((sum, d) => sum + d.pageCount, 0) / dashboards.length) : 0,
            averageWidgets: dashboards.length > 0 ? 
                Math.round(dashboards.reduce((sum, d) => sum + d.widgetCount, 0) / dashboards.length) : 0
        },
        widgets: {
            total: dashboards.reduce((sum, d) => sum + d.widgetCount, 0),
            averagePerDashboard: dashboards.length > 0 ? 
                Math.round(dashboards.reduce((sum, d) => sum + d.widgetCount, 0) / dashboards.length) : 0
        }
    };
}

/**
 * Search dashboards with flexible criteria
 * @param {Object} criteria - Search criteria
 * @returns {Promise<Object>} Search results with metadata
 */
async function searchDashboards(criteria = {}) {
    const results = {
        dashboards: [],
        summary: {
            totalFound: 0,
            searchQuery: criteria.query || 'All dashboards'
        }
    };
    
    let searchOptions = {};
    
    if (criteria.query) {
        searchOptions.search = { name: criteria.query };
    }
    
    if (criteria.accessLevel === 'public') {
        searchOptions.filter = { private: 0 };
    } else if (criteria.accessLevel === 'private') {
        searchOptions.filter = { private: 1 };
    }
    
    results.dashboards = await getDashboards(searchOptions);
    results.summary.totalFound = results.dashboards.length;
    
    return results;
}

// =============================================================================
// BULK OPERATIONS
// =============================================================================

/**
 * Set dashboard privacy for multiple dashboards
 * @param {Array<string>} dashboardIds - Array of dashboard IDs
 * @param {boolean} isPrivate - True for private, false for public
 * @returns {Promise<Object>} Bulk operation result
 */
async function setDashboardsPrivacy(dashboardIds, isPrivate) {
    if (!Array.isArray(dashboardIds) || dashboardIds.length === 0) {
        throw new Error('Array of dashboard IDs is required');
    }
    
    const results = [];
    
    for (const dashboardid of dashboardIds) {
        try {
            const result = await updateDashboard({
                dashboardid,
                private: isPrivate ? 1 : 0
            });
            results.push({ dashboardid, success: true, result });
        } catch (error) {
            results.push({ dashboardid, success: false, error: error.message });
        }
    }
    
    return {
        total: dashboardIds.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results
    };
}

/**
 * Update dashboard permissions for multiple dashboards
 * @param {Array<string>} dashboardIds - Array of dashboard IDs
 * @param {Array} users - User permissions array
 * @param {Array} userGroups - User group permissions array
 * @returns {Promise<Object>} Bulk permission update result
 */
async function updateDashboardsPermissions(dashboardIds, users = [], userGroups = []) {
    if (!Array.isArray(dashboardIds) || dashboardIds.length === 0) {
        throw new Error('Array of dashboard IDs is required');
    }
    
    const results = [];
    
    for (const dashboardid of dashboardIds) {
        try {
            const updateParams = { dashboardid };
            
            if (users.length > 0) {
                updateParams.users = users;
            }
            
            if (userGroups.length > 0) {
                updateParams.userGroups = userGroups;
            }
            
            const result = await updateDashboard(updateParams);
            results.push({ dashboardid, success: true, result });
        } catch (error) {
            results.push({ dashboardid, success: false, error: error.message });
        }
    }
    
    return {
        total: dashboardIds.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results
    };
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get widget type name from widget type code
 * @param {string} typeCode - Widget type code
 * @returns {string} Human-readable widget type name
 */
function getWidgetTypeName(typeCode) {
    const typeNames = {
        'clock': 'Clock',
        'graph': 'Graph (classic)',
        'graphprototype': 'Graph prototype',
        'item': 'Item',
        'plaintext': 'Plain text',
        'url': 'URL',
        'map': 'Map',
        'navtree': 'Map navigation tree',
        'favgraphs': 'Favourite graphs',
        'favmaps': 'Favourite maps',
        'favscreens': 'Favourite screens',
        'dataover': 'Data overview',
        'trigover': 'Trigger overview',
        'systeminfo': 'System information',
        'hostinfo': 'Host info',
        'discovery': 'Discovery status',
        'webinfo': 'Web monitoring',
        'problemhosts': 'Problem hosts',
        'problems': 'Problems',
        'problemsbysv': 'Problems by severity',
        'actionlog': 'Action log',
        'topN': 'Top N'
    };
    
    return typeNames[typeCode] || `Unknown (${typeCode})`;
}

// =============================================================================
// MODULE EXPORTS
// =============================================================================

module.exports = {
    // Dashboard Management
    getDashboards,
    getDashboardsByName,
    getDashboardsByUsers,
    getPublicDashboards,
    getPrivateDashboards,
    getTemplateDashboards,
    getDashboardsWithWidgetTypes,
    createDashboard,
    updateDashboard,
    deleteDashboards,
    cloneDashboards,
    
    // Widget Management
    getDashboardWidgets,
    addWidgetToDashboard,
    
    // Analytics and Search
    getDashboardStatistics,
    searchDashboards,
    
    // Bulk Operations
    setDashboardsPrivacy,
    updateDashboardsPermissions,
    
    // Legacy compatibility export
    dashboardsApi: {
        get: getDashboards,
        create: createDashboard,
        update: updateDashboard,
        delete: deleteDashboards
    }
}; 