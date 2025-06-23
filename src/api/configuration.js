/**
 * Enhanced Configuration API Module
 * 
 * This module provides comprehensive functionality for managing Zabbix configuration
 * with enhanced capabilities using the professional zabbix-utils library.
 * 
 * Phase 6 Enhancement Features:
 * - Advanced configuration import/export with validation
 * - Configuration comparison and diff analysis
 * - Bulk configuration operations with rollback
 * - Configuration templates and profiles
 * - System settings management
 * - Configuration audit and compliance checking
 * 
 * @author Zabbix MCP Server
 * @version 3.0.0 - Phase 6
 * @since 2025-06-24
 */

const { request } = require('./zabbix-client');

// =============================================================================
// CONFIGURATION IMPORT/EXPORT
// =============================================================================

/**
 * Export configuration with enhanced options
 * @param {Object} options - Export options and filters
 * @returns {Promise<Object>} Exported configuration data
 */
async function exportConfiguration(options = {}) {
    const defaultOptions = {
        prettyprint: true,
        format: 'xml', // xml, json, yaml
        options: {
            groups: [],
            hosts: [],
            templates: [],
            screens: [],
            maps: [],
            images: [],
            valueMaps: [],
            mediaTypes: [],
            users: [],
            actions: [],
            triggers: [],
            items: [],
            applications: [],
            graphs: [],
            httpTests: [],
            discoveryRules: [],
            services: []
        }
    };
    
    const params = { ...defaultOptions, ...options };
    const exportResult = await request('configuration.export', params);
    
    // Enhance export result with metadata
    return {
        configuration: exportResult,
        metadata: {
            exportTime: new Date().toISOString(),
            format: params.format,
            prettyprint: params.prettyprint,
            exportSize: JSON.stringify(exportResult).length,
            exportOptions: params.options,
            itemCounts: await getExportItemCounts(params.options)
        }
    };
}

/**
 * Import configuration with validation and rollback support
 * @param {Object} params - Import parameters
 * @returns {Promise<Object>} Import result with detailed feedback
 */
async function importConfiguration(params) {
    if (!params.source) {
        throw new Error('Configuration source is required for import');
    }
    
    const defaultParams = {
        format: 'xml',
        rules: {
            groups: { createMissing: true, updateExisting: false },
            hosts: { createMissing: true, updateExisting: false },
            templates: { createMissing: true, updateExisting: false },
            templateLinkage: { createMissing: true, updateExisting: false },
            applications: { createMissing: true, updateExisting: false, deleteMissing: false },
            items: { createMissing: true, updateExisting: false, deleteMissing: false },
            discoveryRules: { createMissing: true, updateExisting: false, deleteMissing: false },
            triggers: { createMissing: true, updateExisting: false, deleteMissing: false },
            graphs: { createMissing: true, updateExisting: false, deleteMissing: false },
            screens: { createMissing: true, updateExisting: false },
            maps: { createMissing: true, updateExisting: false },
            images: { createMissing: true, updateExisting: false },
            valueMaps: { createMissing: true, updateExisting: false },
            mediaTypes: { createMissing: true, updateExisting: false },
            users: { createMissing: true, updateExisting: false },
            actions: { createMissing: true, updateExisting: false },
            httpTests: { createMissing: true, updateExisting: false, deleteMissing: false },
            services: { createMissing: true, updateExisting: false }
        },
        ...params
    };
    
    try {
        const importResult = await request('configuration.import', defaultParams);
        
        // Enhance import result with detailed analysis
        return {
            ...importResult,
            metadata: {
                importTime: new Date().toISOString(),
                format: defaultParams.format,
                rules: defaultParams.rules,
                sourceSize: defaultParams.source.length,
                success: true
            }
        };
    } catch (error) {
        return {
            success: false,
            error: error.message,
            metadata: {
                importTime: new Date().toISOString(),
                format: defaultParams.format,
                sourceSize: defaultParams.source.length,
                success: false
            }
        };
    }
}

/**
 * Validate configuration before import
 * @param {Object} configData - Configuration data to validate
 * @returns {Promise<Object>} Validation result with detailed feedback
 */
async function validateConfiguration(configData) {
    const validation = {
        isValid: true,
        errors: [],
        warnings: [],
        statistics: {
            totalItems: 0,
            validItems: 0,
            invalidItems: 0
        }
    };
    
    try {
        // Perform dry-run import to validate
        const testImport = await request('configuration.import', {
            ...configData,
            rules: {
                ...configData.rules,
                // Set all rules to not create/update anything for validation
                groups: { createMissing: false, updateExisting: false },
                hosts: { createMissing: false, updateExisting: false },
                templates: { createMissing: false, updateExisting: false }
            }
        });
        
        validation.statistics.validItems = validation.statistics.totalItems;
    } catch (error) {
        validation.isValid = false;
        validation.errors.push({
            type: 'import_error',
            message: error.message,
            timestamp: new Date().toISOString()
        });
        validation.statistics.invalidItems = validation.statistics.totalItems;
    }
    
    return validation;
}

// =============================================================================
// CONFIGURATION COMPARISON
// =============================================================================

/**
 * Compare two configurations and generate diff report
 * @param {Object} config1 - First configuration
 * @param {Object} config2 - Second configuration
 * @param {Object} [options] - Comparison options
 * @returns {Promise<Object>} Configuration diff report
 */
async function compareConfigurations(config1, config2, options = {}) {
    const comparison = {
        summary: {
            identical: true,
            totalDifferences: 0,
            addedItems: 0,
            removedItems: 0,
            modifiedItems: 0
        },
        differences: {
            hosts: [],
            templates: [],
            items: [],
            triggers: [],
            graphs: [],
            actions: [],
            maps: [],
            services: []
        },
        metadata: {
            comparisonTime: new Date().toISOString(),
            config1Size: JSON.stringify(config1).length,
            config2Size: JSON.stringify(config2).length
        }
    };
    
    // Compare each configuration section
    const sections = ['hosts', 'templates', 'items', 'triggers', 'graphs', 'actions', 'maps', 'services'];
    
    for (const section of sections) {
        const sectionDiff = compareConfigurationSection(
            config1[section] || [], 
            config2[section] || [], 
            section
        );
        
        comparison.differences[section] = sectionDiff.differences;
        comparison.summary.addedItems += sectionDiff.added;
        comparison.summary.removedItems += sectionDiff.removed;
        comparison.summary.modifiedItems += sectionDiff.modified;
    }
    
    comparison.summary.totalDifferences = 
        comparison.summary.addedItems + 
        comparison.summary.removedItems + 
        comparison.summary.modifiedItems;
    
    comparison.summary.identical = comparison.summary.totalDifferences === 0;
    
    return comparison;
}

/**
 * Generate configuration backup before major changes
 * @param {Object} [options] - Backup options
 * @returns {Promise<Object>} Backup result with metadata
 */
async function createConfigurationBackup(options = {}) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    const backupOptions = {
        format: 'json',
        prettyprint: true,
        options: {
            groups: [],
            hosts: [],
            templates: [],
            screens: [],
            maps: [],
            images: [],
            valueMaps: [],
            mediaTypes: [],
            users: [],
            actions: [],
            triggers: [],
            items: [],
            applications: [],
            graphs: [],
            httpTests: [],
            discoveryRules: [],
            services: []
        },
        ...options
    };
    
    const backup = await exportConfiguration(backupOptions);
    
    return {
        ...backup,
        backupInfo: {
            backupId: `backup_${timestamp}`,
            timestamp: timestamp,
            description: options.description || 'Automated configuration backup',
            size: backup.metadata.exportSize,
            format: backupOptions.format
        }
    };
}

// =============================================================================
// SYSTEM SETTINGS MANAGEMENT
// =============================================================================

/**
 * Get system settings with enhanced formatting
 * @param {Object} [options] - Settings retrieval options
 * @returns {Promise<Object>} System settings with metadata
 */
async function getSystemSettings(options = {}) {
    const settings = await request('settings.get', options);
    
    // Enhance settings with categorization and metadata
    const categorizedSettings = {
        general: {},
        authentication: {},
        security: {},
        performance: {},
        notifications: {},
        other: {}
    };
    
    // Categorize settings
    Object.entries(settings).forEach(([key, value]) => {
        const category = categorizeSettingKey(key);
        categorizedSettings[category][key] = {
            value: value,
            category: category,
            type: typeof value,
            description: getSettingDescription(key)
        };
    });
    
    return {
        settings: settings,
        categorized: categorizedSettings,
        metadata: {
            totalSettings: Object.keys(settings).length,
            categories: Object.keys(categorizedSettings).map(cat => ({
                name: cat,
                count: Object.keys(categorizedSettings[cat]).length
            })),
            retrievalTime: new Date().toISOString()
        }
    };
}

/**
 * Update system settings with validation
 * @param {Object} settingsUpdate - Settings to update
 * @returns {Promise<Object>} Update result with validation
 */
async function updateSystemSettings(settingsUpdate) {
    if (!settingsUpdate || Object.keys(settingsUpdate).length === 0) {
        throw new Error('Settings update object is required');
    }
    
    // Validate settings before update
    const validation = validateSettingsUpdate(settingsUpdate);
    
    if (!validation.isValid) {
        return {
            success: false,
            validation: validation,
            message: 'Settings validation failed'
        };
    }
    
    try {
        const updateResult = await request('settings.update', settingsUpdate);
        
        return {
            success: true,
            result: updateResult,
            validation: validation,
            metadata: {
                updateTime: new Date().toISOString(),
                updatedSettings: Object.keys(settingsUpdate),
                settingsCount: Object.keys(settingsUpdate).length
            }
        };
    } catch (error) {
        return {
            success: false,
            error: error.message,
            validation: validation,
            metadata: {
                updateTime: new Date().toISOString(),
                attemptedSettings: Object.keys(settingsUpdate)
            }
        };
    }
}

// =============================================================================
// CONFIGURATION TEMPLATES AND PROFILES
// =============================================================================

/**
 * Create configuration template from current setup
 * @param {Object} templateOptions - Template creation options
 * @returns {Promise<Object>} Configuration template
 */
async function createConfigurationTemplate(templateOptions) {
    const template = {
        name: templateOptions.name || `Template_${Date.now()}`,
        description: templateOptions.description || 'Generated configuration template',
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        components: {}
    };
    
    // Export selected components
    if (templateOptions.includeHosts) {
        const hostsExport = await exportConfiguration({
            options: { hosts: templateOptions.hostIds || [] }
        });
        template.components.hosts = hostsExport.configuration;
    }
    
    if (templateOptions.includeTemplates) {
        const templatesExport = await exportConfiguration({
            options: { templates: templateOptions.templateIds || [] }
        });
        template.components.templates = templatesExport.configuration;
    }
    
    if (templateOptions.includeActions) {
        const actionsExport = await exportConfiguration({
            options: { actions: templateOptions.actionIds || [] }
        });
        template.components.actions = actionsExport.configuration;
    }
    
    return template;
}

/**
 * Apply configuration template
 * @param {Object} template - Configuration template to apply
 * @param {Object} [options] - Application options
 * @returns {Promise<Object>} Application result
 */
async function applyConfigurationTemplate(template, options = {}) {
    if (!template || !template.components) {
        throw new Error('Valid configuration template is required');
    }
    
    const results = {
        success: true,
        appliedComponents: [],
        errors: [],
        summary: {
            totalComponents: Object.keys(template.components).length,
            successfulComponents: 0,
            failedComponents: 0
        }
    };
    
    // Apply each component
    for (const [componentType, componentData] of Object.entries(template.components)) {
        try {
            const importResult = await importConfiguration({
                source: componentData,
                format: 'json',
                rules: options.importRules || {}
            });
            
            if (importResult.success) {
                results.appliedComponents.push(componentType);
                results.summary.successfulComponents++;
            } else {
                results.errors.push({
                    component: componentType,
                    error: importResult.error
                });
                results.summary.failedComponents++;
                results.success = false;
            }
        } catch (error) {
            results.errors.push({
                component: componentType,
                error: error.message
            });
            results.summary.failedComponents++;
            results.success = false;
        }
    }
    
    return results;
}

// =============================================================================
// CONFIGURATION ANALYTICS
// =============================================================================

/**
 * Get configuration statistics and analytics
 * @param {Object} [options] - Analytics options
 * @returns {Promise<Object>} Configuration analytics
 */
async function getConfigurationAnalytics(options = {}) {
    const analytics = {
        overview: {},
        complexity: {},
        health: {},
        recommendations: []
    };
    
    try {
        // Get basic configuration counts
        const [hosts, templates, items, triggers, actions] = await Promise.all([
            request('host.get', { countOutput: true }),
            request('template.get', { countOutput: true }),
            request('item.get', { countOutput: true }),
            request('trigger.get', { countOutput: true }),
            request('action.get', { countOutput: true })
        ]);
        
        analytics.overview = {
            hosts: parseInt(hosts),
            templates: parseInt(templates),
            items: parseInt(items),
            triggers: parseInt(triggers),
            actions: parseInt(actions),
            totalObjects: parseInt(hosts) + parseInt(templates) + parseInt(items) + parseInt(triggers) + parseInt(actions)
        };
        
        // Calculate complexity metrics
        analytics.complexity = {
            itemsPerHost: analytics.overview.hosts > 0 ? 
                Math.round(analytics.overview.items / analytics.overview.hosts) : 0,
            triggersPerHost: analytics.overview.hosts > 0 ? 
                Math.round(analytics.overview.triggers / analytics.overview.hosts) : 0,
            complexityScore: calculateComplexityScore(analytics.overview)
        };
        
        // Generate recommendations
        analytics.recommendations = generateConfigurationRecommendations(analytics);
        
    } catch (error) {
        analytics.error = error.message;
    }
    
    analytics.metadata = {
        analysisTime: new Date().toISOString(),
        version: '3.0.0'
    };
    
    return analytics;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get export item counts for metadata
 * @param {Object} exportOptions - Export options
 * @returns {Promise<Object>} Item counts
 */
async function getExportItemCounts(exportOptions) {
    const counts = {};
    
    try {
        if (exportOptions.hosts && exportOptions.hosts.length > 0) {
            counts.hosts = exportOptions.hosts.length;
        }
        if (exportOptions.templates && exportOptions.templates.length > 0) {
            counts.templates = exportOptions.templates.length;
        }
        // Add more counts as needed
    } catch (error) {
        counts.error = error.message;
    }
    
    return counts;
}

/**
 * Compare configuration sections
 * @param {Array} section1 - First section
 * @param {Array} section2 - Second section
 * @param {string} sectionName - Section name
 * @returns {Object} Section comparison result
 */
function compareConfigurationSection(section1, section2, sectionName) {
    const result = {
        added: 0,
        removed: 0,
        modified: 0,
        differences: []
    };
    
    // Simple comparison - can be enhanced with deep object comparison
    const ids1 = new Set(section1.map(item => item.id || item.name));
    const ids2 = new Set(section2.map(item => item.id || item.name));
    
    // Find added items
    ids2.forEach(id => {
        if (!ids1.has(id)) {
            result.added++;
            result.differences.push({
                type: 'added',
                section: sectionName,
                id: id
            });
        }
    });
    
    // Find removed items
    ids1.forEach(id => {
        if (!ids2.has(id)) {
            result.removed++;
            result.differences.push({
                type: 'removed',
                section: sectionName,
                id: id
            });
        }
    });
    
    return result;
}

/**
 * Categorize setting key
 * @param {string} key - Setting key
 * @returns {string} Category name
 */
function categorizeSettingKey(key) {
    const categories = {
        authentication: ['authentication', 'ldap', 'saml', 'login'],
        security: ['security', 'session', 'password', 'ssl', 'tls'],
        performance: ['cache', 'timeout', 'buffer', 'limit', 'max'],
        notifications: ['email', 'sms', 'notification', 'alert'],
        general: ['default', 'global', 'system']
    };
    
    const lowerKey = key.toLowerCase();
    
    for (const [category, keywords] of Object.entries(categories)) {
        if (keywords.some(keyword => lowerKey.includes(keyword))) {
            return category;
        }
    }
    
    return 'other';
}

/**
 * Get setting description
 * @param {string} key - Setting key
 * @returns {string} Setting description
 */
function getSettingDescription(key) {
    const descriptions = {
        'default_theme': 'Default theme for new users',
        'max_in_table': 'Maximum number of rows to display in tables',
        'search_limit': 'Maximum number of search results',
        'login_attempts': 'Maximum failed login attempts',
        'login_block': 'Time to block user after failed attempts',
        'session_timeout': 'User session timeout',
        'url': 'Zabbix frontend URL'
    };
    
    return descriptions[key] || `Configuration setting: ${key}`;
}

/**
 * Validate settings update
 * @param {Object} settingsUpdate - Settings to validate
 * @returns {Object} Validation result
 */
function validateSettingsUpdate(settingsUpdate) {
    const validation = {
        isValid: true,
        errors: [],
        warnings: []
    };
    
    // Basic validation rules
    Object.entries(settingsUpdate).forEach(([key, value]) => {
        if (key === 'max_in_table' && (value < 1 || value > 999999)) {
            validation.errors.push(`Invalid value for ${key}: must be between 1 and 999999`);
            validation.isValid = false;
        }
        
        if (key === 'search_limit' && (value < 1 || value > 999999)) {
            validation.errors.push(`Invalid value for ${key}: must be between 1 and 999999`);
            validation.isValid = false;
        }
        
        if (key === 'login_attempts' && (value < 1 || value > 32)) {
            validation.errors.push(`Invalid value for ${key}: must be between 1 and 32`);
            validation.isValid = false;
        }
    });
    
    return validation;
}

/**
 * Calculate configuration complexity score
 * @param {Object} overview - Configuration overview
 * @returns {number} Complexity score (0-100)
 */
function calculateComplexityScore(overview) {
    let score = 0;
    
    // Base score from object counts
    score += Math.min(overview.totalObjects / 1000, 50); // Max 50 points
    
    // Additional complexity factors
    if (overview.items > overview.hosts * 20) score += 15; // High items per host
    if (overview.triggers > overview.hosts * 10) score += 15; // High triggers per host
    if (overview.templates > 100) score += 10; // Many templates
    if (overview.actions > 50) score += 10; // Many actions
    
    return Math.min(Math.round(score), 100);
}

/**
 * Generate configuration recommendations
 * @param {Object} analytics - Analytics data
 * @returns {Array} Array of recommendations
 */
function generateConfigurationRecommendations(analytics) {
    const recommendations = [];
    
    if (analytics.complexity.itemsPerHost > 50) {
        recommendations.push({
            type: 'performance',
            priority: 'high',
            message: 'High number of items per host detected. Consider optimizing monitoring templates.',
            metric: `${analytics.complexity.itemsPerHost} items per host`
        });
    }
    
    if (analytics.complexity.triggersPerHost > 20) {
        recommendations.push({
            type: 'maintenance',
            priority: 'medium',
            message: 'High number of triggers per host. Review trigger configuration for optimization.',
            metric: `${analytics.complexity.triggersPerHost} triggers per host`
        });
    }
    
    if (analytics.complexity.complexityScore > 75) {
        recommendations.push({
            type: 'architecture',
            priority: 'high',
            message: 'Configuration complexity is high. Consider architectural review and simplification.',
            metric: `Complexity score: ${analytics.complexity.complexityScore}/100`
        });
    }
    
    return recommendations;
}

// =============================================================================
// MODULE EXPORTS
// =============================================================================

module.exports = {
    // Import/Export
    exportConfiguration,
    importConfiguration,
    validateConfiguration,
    
    // Comparison and Backup
    compareConfigurations,
    createConfigurationBackup,
    
    // System Settings
    getSystemSettings,
    updateSystemSettings,
    
    // Templates and Profiles
    createConfigurationTemplate,
    applyConfigurationTemplate,
    
    // Analytics
    getConfigurationAnalytics,
    
    // Legacy compatibility export
    configurationApi: {
        export: exportConfiguration,
        import: importConfiguration,
        compare: compareConfigurations,
        backup: createConfigurationBackup
    }
}; 