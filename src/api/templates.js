const { zabbixRequest } = require('./client');

/**
 * Get templates from Zabbix
 * @param {Object} params - Parameters for template.get
 * @returns {Promise<Array>} Array of templates
 */
async function get(params = {}) {
    return await zabbixRequest('template.get', params);
}

/**
 * Create a new template
 * @param {Object} params - Template creation parameters
 * @returns {Promise<Object>} Creation result with templateids
 */
async function create(params) {
    return await zabbixRequest('template.create', params);
}

/**
 * Update an existing template
 * @param {Object} params - Template update parameters (must include templateid)
 * @returns {Promise<Object>} Update result with templateids
 */
async function update(params) {
    return await zabbixRequest('template.update', params);
}

/**
 * Delete templates
 * @param {Array<string>} templateIds - Array of template IDs to delete
 * @returns {Promise<Object>} Deletion result with templateids
 */
async function deleteTemplates(templateIds) {
    return await zabbixRequest('template.delete', templateIds);
}

/**
 * Link templates to a host
 * @param {string} hostId - Host ID to link templates to
 * @param {Array<string>} templateIds - Array of template IDs to link
 * @returns {Promise<Object>} Link result
 */
async function linkToHost(hostId, templateIds) {
    const templates = templateIds.map(id => ({ templateid: id }));
    return await zabbixRequest('host.update', {
        hostid: hostId,
        templates: templates
    });
}

/**
 * Unlink templates from a host
 * @param {string} hostId - Host ID to unlink templates from
 * @param {Array<string>} templateIds - Array of template IDs to unlink
 * @returns {Promise<Object>} Unlink result
 */
async function unlinkFromHost(hostId, templateIds) {
    const templates = templateIds.map(id => ({ templateid: id }));
    return await zabbixRequest('host.update', {
        hostid: hostId,
        templates_clear: templates
    });
}

module.exports = {
    templatesApi: {
        get,
        create,
        update,
        delete: deleteTemplates,
        linkToHost,
        unlinkFromHost
    }
}; 