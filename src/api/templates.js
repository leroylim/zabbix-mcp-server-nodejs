/**
 * Templates API Module - Refactored to use zabbix-utils
 * 
 * This module provides template management functionality using the zabbix-utils library
 * for improved type safety, automatic authentication, and better error handling.
 */

const { getClient, request } = require('./zabbix-client');
const { logger } = require('../utils/logger');
const config = require('../config');

/**
 * Get templates from Zabbix
 * @param {Object} options - Parameters for template.get
 * @returns {Promise<Array>} Array of templates
 */
async function getTemplates(options = {}) {
    try {
        logger.debug(`${config.logging.prefix} Getting templates with options:`, options);
        return await request('template.get', options);
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get templates:`, error.message);
        throw new Error(`Failed to retrieve templates: ${error.message}`);
    }
}

/**
 * Create a new template in Zabbix
 * @param {Object} params - Template creation parameters
 * @returns {Promise<Object>} Created template information
 */
async function createTemplate(params) {
    // Validate required parameters
    if (!params.host || !params.name || !params.groups) {
        throw new Error("Parameters 'host' (technical name), 'name' (display name), and 'groups' are required for creating a template.");
    }

    try {
        logger.info(`${config.logging.prefix} Creating template: ${params.name} (${params.host})`);
        const result = await request('template.create', params);
        logger.info(`${config.logging.prefix} Successfully created template with ID: ${result.templateids?.[0]}`);
        return result;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to create template ${params.name}:`, error.message);
        throw new Error(`Failed to create template: ${error.message}`);
    }
}

/**
 * Update an existing template in Zabbix
 * @param {Object} params - Template update parameters (must include templateid)
 * @returns {Promise<Object>} Update result
 */
async function updateTemplate(params) {
    if (!params || !params.templateid) {
        throw new Error("Parameter 'templateid' is required for updating a template.");
    }

    try {
        logger.info(`${config.logging.prefix} Updating template ID: ${params.templateid}`);
        const result = await request('template.update', params);
        logger.info(`${config.logging.prefix} Successfully updated template ID: ${params.templateid}`);
        return result;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to update template ${params.templateid}:`, error.message);
        throw new Error(`Failed to update template: ${error.message}`);
    }
}

/**
 * Delete templates from Zabbix
 * @param {Array<string>} templateIds - Array of template IDs to delete
 * @returns {Promise<Object>} Deletion result
 */
async function deleteTemplates(templateIds) {
    if (!Array.isArray(templateIds) || templateIds.length === 0 || !templateIds.every(id => typeof id === 'string')) {
        throw new Error("deleteTemplates expects a non-empty array of string template IDs.");
    }

    try {
        logger.info(`${config.logging.prefix} Deleting templates: ${templateIds.join(', ')}`);
        const result = await request('template.delete', templateIds);
        logger.info(`${config.logging.prefix} Successfully deleted ${templateIds.length} templates`);
        return result;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to delete templates:`, error.message);
        throw new Error(`Failed to delete templates: ${error.message}`);
    }
}

/**
 * Get templates by group IDs
 * @param {Array<string>} groupIds - Array of group IDs
 * @param {Object} additionalOptions - Additional options for the query
 * @returns {Promise<Array>} Array of templates in the specified groups
 */
async function getTemplatesByGroups(groupIds, additionalOptions = {}) {
    if (!Array.isArray(groupIds) || groupIds.length === 0) {
        throw new Error("getTemplatesByGroups expects a non-empty array of group IDs.");
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
        logger.error(`${config.logging.prefix} Failed to get templates by groups:`, error.message);
        throw new Error(`Failed to retrieve templates by groups: ${error.message}`);
    }
}

/**
 * Get templates by name or pattern
 * @param {string|Array<string>} templateNames - Template name(s) or pattern(s)
 * @param {Object} additionalOptions - Additional options for the query
 * @returns {Promise<Array>} Array of matching templates
 */
async function getTemplatesByName(templateNames, additionalOptions = {}) {
    const names = Array.isArray(templateNames) ? templateNames : [templateNames];
    
    try {
        logger.debug(`${config.logging.prefix} Getting templates by name: ${names.join(', ')}`);
        
        const options = {
            output: ['templateid', 'host', 'name', 'description'],
            filter: {
                host: names
            },
            selectGroups: ['groupid', 'name'],
            ...additionalOptions
        };
        
        return await request('template.get', options);
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get templates by name:`, error.message);
        throw new Error(`Failed to retrieve templates by name: ${error.message}`);
    }
}

/**
 * Get template items
 * @param {Array<string>} templateIds - Array of template IDs
 * @param {Object} additionalOptions - Additional options for the query
 * @returns {Promise<Array>} Array of items from the specified templates
 */
async function getTemplateItems(templateIds, additionalOptions = {}) {
    if (!Array.isArray(templateIds) || templateIds.length === 0) {
        throw new Error("getTemplateItems expects a non-empty array of template IDs.");
    }

    try {
        logger.debug(`${config.logging.prefix} Getting items for templates: ${templateIds.join(', ')}`);
        
        const options = {
            output: ['itemid', 'name', 'key_', 'type', 'value_type', 'delay'],
            templateids: templateIds,
            selectHosts: ['hostid', 'host', 'name'],
            ...additionalOptions
        };
        
        return await request('item.get', options);
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get template items:`, error.message);
        throw new Error(`Failed to retrieve template items: ${error.message}`);
    }
}

/**
 * Get template triggers
 * @param {Array<string>} templateIds - Array of template IDs
 * @param {Object} additionalOptions - Additional options for the query
 * @returns {Promise<Array>} Array of triggers from the specified templates
 */
async function getTemplateTriggers(templateIds, additionalOptions = {}) {
    if (!Array.isArray(templateIds) || templateIds.length === 0) {
        throw new Error("getTemplateTriggers expects a non-empty array of template IDs.");
    }

    try {
        logger.debug(`${config.logging.prefix} Getting triggers for templates: ${templateIds.join(', ')}`);
        
        const options = {
            output: ['triggerid', 'description', 'expression', 'priority', 'status'],
            templateids: templateIds,
            selectHosts: ['hostid', 'host', 'name'],
            ...additionalOptions
        };
        
        return await request('trigger.get', options);
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get template triggers:`, error.message);
        throw new Error(`Failed to retrieve template triggers: ${error.message}`);
    }
}

/**
 * Get hosts linked to templates
 * @param {Array<string>} templateIds - Array of template IDs
 * @param {Object} additionalOptions - Additional options for the query
 * @returns {Promise<Array>} Array of hosts linked to the specified templates
 */
async function getTemplateHosts(templateIds, additionalOptions = {}) {
    if (!Array.isArray(templateIds) || templateIds.length === 0) {
        throw new Error("getTemplateHosts expects a non-empty array of template IDs.");
    }

    try {
        logger.debug(`${config.logging.prefix} Getting hosts for templates: ${templateIds.join(', ')}`);
        
        const options = {
            output: ['hostid', 'host', 'name', 'status'],
            templateids: templateIds,
            selectTemplates: ['templateid', 'host', 'name'],
            ...additionalOptions
        };
        
        return await request('host.get', options);
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get template hosts:`, error.message);
        throw new Error(`Failed to retrieve template hosts: ${error.message}`);
    }
}

/**
 * Link templates to hosts
 * @param {Array<string>} hostIds - Array of host IDs
 * @param {Array<string>} templateIds - Array of template IDs to link
 * @returns {Promise<Object>} Link result
 */
async function linkTemplatesToHosts(hostIds, templateIds) {
    if (!Array.isArray(hostIds) || hostIds.length === 0) {
        throw new Error("linkTemplatesToHosts expects a non-empty array of host IDs.");
    }
    if (!Array.isArray(templateIds) || templateIds.length === 0) {
        throw new Error("linkTemplatesToHosts expects a non-empty array of template IDs.");
    }

    try {
        logger.info(`${config.logging.prefix} Linking templates ${templateIds.join(', ')} to hosts ${hostIds.join(', ')}`);
        
        const updateParams = hostIds.map(hostid => ({
            hostid,
            templates: templateIds.map(templateid => ({ templateid }))
        }));
        
        const result = await request('host.massupdate', {
            hosts: updateParams,
            templates: templateIds.map(templateid => ({ templateid }))
        });
        
        logger.info(`${config.logging.prefix} Successfully linked templates to ${hostIds.length} hosts`);
        return result;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to link templates to hosts:`, error.message);
        throw new Error(`Failed to link templates to hosts: ${error.message}`);
    }
}

/**
 * Unlink templates from hosts
 * @param {Array<string>} hostIds - Array of host IDs
 * @param {Array<string>} templateIds - Array of template IDs to unlink
 * @returns {Promise<Object>} Unlink result
 */
async function unlinkTemplatesFromHosts(hostIds, templateIds) {
    if (!Array.isArray(hostIds) || hostIds.length === 0) {
        throw new Error("unlinkTemplatesFromHosts expects a non-empty array of host IDs.");
    }
    if (!Array.isArray(templateIds) || templateIds.length === 0) {
        throw new Error("unlinkTemplatesFromHosts expects a non-empty array of template IDs.");
    }

    try {
        logger.info(`${config.logging.prefix} Unlinking templates ${templateIds.join(', ')} from hosts ${hostIds.join(', ')}`);
        
        const updateParams = hostIds.map(hostid => ({
            hostid,
            templates_clear: templateIds.map(templateid => ({ templateid }))
        }));
        
        const result = await request('host.massupdate', {
            hosts: updateParams,
            templates_clear: templateIds.map(templateid => ({ templateid }))
        });
        
        logger.info(`${config.logging.prefix} Successfully unlinked templates from ${hostIds.length} hosts`);
        return result;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to unlink templates from hosts:`, error.message);
        throw new Error(`Failed to unlink templates from hosts: ${error.message}`);
    }
}

/**
 * Get template macros
 * @param {Array<string>} templateIds - Array of template IDs
 * @param {Object} additionalOptions - Additional options for the query
 * @returns {Promise<Array>} Array of template macros
 */
async function getTemplateMacros(templateIds, additionalOptions = {}) {
    if (!Array.isArray(templateIds) || templateIds.length === 0) {
        throw new Error("getTemplateMacros expects a non-empty array of template IDs.");
    }

    try {
        logger.debug(`${config.logging.prefix} Getting macros for templates: ${templateIds.join(', ')}`);
        
        const options = {
            output: 'extend',
            hostids: templateIds, // Templates are treated as hosts in macro context
            ...additionalOptions
        };
        
        return await request('usermacro.get', options);
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get template macros:`, error.message);
        throw new Error(`Failed to retrieve template macros: ${error.message}`);
    }
}

/**
 * Export templates
 * @param {Array<string>} templateIds - Array of template IDs to export
 * @param {Object} options - Export options
 * @returns {Promise<string>} Exported template configuration (XML/JSON)
 */
async function exportTemplates(templateIds, options = {}) {
    if (!Array.isArray(templateIds) || templateIds.length === 0) {
        throw new Error("exportTemplates expects a non-empty array of template IDs.");
    }

    try {
        logger.info(`${config.logging.prefix} Exporting templates: ${templateIds.join(', ')}`);
        
        const exportOptions = {
            format: 'xml', // Default to XML format
            options: {
                templates: templateIds
            },
            ...options
        };
        
        const result = await request('configuration.export', exportOptions);
        logger.info(`${config.logging.prefix} Successfully exported ${templateIds.length} templates`);
        return result;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to export templates:`, error.message);
        throw new Error(`Failed to export templates: ${error.message}`);
    }
}

/**
 * Import templates
 * @param {string} source - Template configuration data (XML/JSON)
 * @param {Object} options - Import options
 * @returns {Promise<Object>} Import result
 */
async function importTemplates(source, options = {}) {
    if (!source || typeof source !== 'string') {
        throw new Error("importTemplates expects a valid source configuration string.");
    }

    try {
        logger.info(`${config.logging.prefix} Importing templates from configuration`);
        
        const importOptions = {
            format: 'xml', // Default to XML format
            source: source,
            rules: {
                templates: {
                    createMissing: true,
                    updateExisting: true
                },
                items: {
                    createMissing: true,
                    updateExisting: true
                },
                triggers: {
                    createMissing: true,
                    updateExisting: true
                },
                ...options.rules
            },
            ...options
        };
        
        const result = await request('configuration.import', importOptions);
        logger.info(`${config.logging.prefix} Successfully imported templates`);
        return result;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to import templates:`, error.message);
        throw new Error(`Failed to import templates: ${error.message}`);
    }
}

/**
 * Get template statistics
 * @param {Array<string>} templateIds - Array of template IDs (optional)
 * @returns {Promise<Object>} Template statistics
 */
async function getTemplateStatistics(templateIds = null) {
    try {
        logger.debug(`${config.logging.prefix} Getting template statistics`);
        
        const templateOptions = templateIds ? { templateids: templateIds } : {};
        
        // Get templates
        const templates = await request('template.get', {
            output: ['templateid', 'host', 'name'],
            selectGroups: ['groupid', 'name'],
            ...templateOptions
        });
        
        // Get items count for each template
        const itemsPromises = templates.map(template => 
            request('item.get', {
                countOutput: true,
                templateids: [template.templateid]
            })
        );
        
        // Get triggers count for each template
        const triggersPromises = templates.map(template => 
            request('trigger.get', {
                countOutput: true,
                templateids: [template.templateid]
            })
        );
        
        const [itemsCounts, triggersCounts] = await Promise.all([
            Promise.all(itemsPromises),
            Promise.all(triggersPromises)
        ]);
        
        const stats = {
            totalTemplates: templates.length,
            templates: templates.map((template, index) => ({
                templateid: template.templateid,
                name: template.name,
                host: template.host,
                groups: template.groups,
                itemsCount: parseInt(itemsCounts[index], 10),
                triggersCount: parseInt(triggersCounts[index], 10)
            })),
            totalItems: itemsCounts.reduce((sum, count) => sum + parseInt(count, 10), 0),
            totalTriggers: triggersCounts.reduce((sum, count) => sum + parseInt(count, 10), 0)
        };
        
        return stats;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get template statistics:`, error.message);
        throw new Error(`Failed to retrieve template statistics: ${error.message}`);
    }
}

module.exports = {
    getTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplates,
    getTemplatesByGroups,
    getTemplatesByName,
    getTemplateItems,
    getTemplateTriggers,
    getTemplateHosts,
    linkTemplatesToHosts,
    unlinkTemplatesFromHosts,
    getTemplateMacros,
    exportTemplates,
    importTemplates,
    getTemplateStatistics
}; 