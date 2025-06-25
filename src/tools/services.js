const { logger } = require('../utils/logger');
const api = require('../api');
const { z } = require('zod');
const { handleZabbixError } = require('../utils/errors');

// =============================================================================
// HELPER FUNCTIONS FOR HUMAN-READABLE FORMATTING
// =============================================================================

/**
 * Convert service status code to human-readable name
 * @param {string|number} status - Service status code
 * @returns {string} Human-readable status name
 */
function getServiceStatusName(status) {
    const statusNum = parseInt(status);
    const statuses = {
        '-1': 'OK',
        '0': 'Not classified',
        '1': 'Information',
        '2': 'Warning',
        '3': 'Average',
        '4': 'High',
        '5': 'Disaster'
    };
    return statuses[statusNum] || `Unknown (${status})`;
}

/**
 * Convert service algorithm code to human-readable name
 * @param {string|number} algorithm - Algorithm code
 * @returns {string} Human-readable algorithm name
 */
function getServiceAlgorithmName(algorithm) {
    const algorithmNum = parseInt(algorithm);
    const algorithms = {
        0: 'Do not calculate',
        1: 'Problem, if at least one child has a problem',
        2: 'Problem, if all children have problems'
    };
    return algorithms[algorithmNum] || `Unknown (${algorithm})`;
}

/**
 * Convert propagation rule code to human-readable name
 * @param {string|number} rule - Propagation rule code
 * @returns {string} Human-readable propagation rule name
 */
function getPropagationRuleName(rule) {
    const ruleNum = parseInt(rule);
    const rules = {
        0: 'Propagate as is',
        1: 'Increase by one',
        2: 'Decrease by one',
        3: 'Ignore this service'
    };
    return rules[ruleNum] || `Unknown (${rule})`;
}

/**
 * Convert status rule type to human-readable description
 * @param {string|number} type - Status rule type code
 * @returns {string} Human-readable status rule description
 */
function getStatusRuleTypeName(type) {
    const typeNum = parseInt(type);
    const types = {
        0: 'At least N child services have status or above',
        1: 'At least N% of child services have status or above',
        2: 'Less than N child services have status or below',
        3: 'Less than N% of child services have status or below',
        4: 'Weight of child services with status or above is at least W',
        5: 'Weight of child services with status or above is at least N%',
        6: 'Weight of child services with status or below is less than W',
        7: 'Weight of child services with status or below is less than N%'
    };
    return types[typeNum] || `Unknown (${type})`;
}

/**
 * Convert problem tag operator to human-readable name
 * @param {string|number} operator - Operator code
 * @returns {string} Human-readable operator name
 */
function getProblemTagOperatorName(operator) {
    const operatorNum = parseInt(operator);
    const operators = {
        0: 'Equals',
        2: 'Like'
    };
    return operators[operatorNum] || `Unknown (${operator})`;
}

/**
 * Format service information with human-readable values
 * @param {Object} service - Service object
 * @returns {Object} Enhanced service object with human-readable formatting
 */
function formatServiceInfo(service) {
    const formatted = { ...service };
    
    // Add human-readable status
    if (service.status !== undefined) {
        formatted.status_name = getServiceStatusName(service.status);
    }
    
    // Add human-readable algorithm
    if (service.algorithm !== undefined) {
        formatted.algorithm_name = getServiceAlgorithmName(service.algorithm);
    }
    
    // Add human-readable propagation rule
    if (service.propagation_rule !== undefined) {
        formatted.propagation_rule_name = getPropagationRuleName(service.propagation_rule);
    }
    
    // Format status rules
    if (service.status_rules && Array.isArray(service.status_rules)) {
        formatted.status_rules = service.status_rules.map(rule => ({
            ...rule,
            type_name: getStatusRuleTypeName(rule.type),
            limit_status_name: getServiceStatusName(rule.limit_status),
            new_status_name: getServiceStatusName(rule.new_status)
        }));
    }
    
    // Format problem tags
    if (service.problem_tags && Array.isArray(service.problem_tags)) {
        formatted.problem_tags = service.problem_tags.map(tag => ({
            ...tag,
            operator_name: getProblemTagOperatorName(tag.operator)
        }));
    }
    
    // Add calculated fields
    formatted.parent_count = service.parents ? service.parents.length : 0;
    formatted.child_count = service.children ? service.children.length : 0;
    formatted.is_root_service = !service.parents || service.parents.length === 0;
    formatted.is_leaf_service = !service.children || service.children.length === 0;
    formatted.readonly_name = service.readonly === '1' ? 'Read-only' : 'Read-write';
    
    return formatted;
}

/**
 * Format service hierarchy with enhanced information
 * @param {Array} services - Array of service objects
 * @returns {Array} Enhanced services with hierarchy information
 */
function formatServiceHierarchy(services) {
    return services.map(service => {
        const formatted = formatServiceInfo(service);
        
        // Format parent services
        if (service.parents && Array.isArray(service.parents)) {
            formatted.parents = service.parents.map(parent => formatServiceInfo(parent));
        }
        
        // Format child services
        if (service.children && Array.isArray(service.children)) {
            formatted.children = service.children.map(child => formatServiceInfo(child));
        }
        
        return formatted;
    });
}

function registerTools(server) {
    // Get services
    server.tool(
        'zabbix_get_services',
        'Get business services from Zabbix with filtering and output options',
        {
            serviceids: z.array(z.string()).optional().describe('Return only services with the given IDs'),
            parentids: z.array(z.string()).optional().describe('Return only services that are children of the given services'),
            childids: z.array(z.string()).optional().describe('Return only services that are parents of the given services'),
            output: z.array(z.string()).optional().default(['serviceid', 'name', 'algorithm', 'status', 'weight', 'propagation_rule', 'propagation_value']).describe('Object properties to be returned'),
            selectParents: z.array(z.string()).optional().describe('Return parent services'),
            selectChildren: z.array(z.string()).optional().describe('Return child services'),
            selectProblemTags: z.array(z.string()).optional().describe('Return problem tags linked to the service'),
            selectStatusRules: z.array(z.string()).optional().describe('Return status rules'),
            selectTags: z.array(z.string()).optional().describe('Return service tags'),
            selectProblemEvents: z.array(z.string()).optional().describe('Return current problem events for the service'),
            filter: z.record(z.any()).optional().describe('Return only services that match the given filter'),
            search: z.record(z.any()).optional().describe('Return only services that match the given wildcard search'),
            sortfield: z.array(z.string()).optional().default(['name']).describe('Sort the result by the given properties'),
            sortorder: z.enum(['ASC', 'DESC']).optional().default('ASC').describe('Sort order'),
            limit: z.number().int().positive().optional().describe('Limit the number of records returned')
        },
        async (args) => {
            try {
                const params = { ...args };
                
                const apiParams = {
                    output: params.output || ['serviceid', 'name', 'algorithm', 'status', 'weight', 'propagation_rule', 'propagation_value'],
                    sortfield: params.sortfield || ['name'],
                    sortorder: params.sortorder || 'ASC'
                };

                if (params.serviceids) apiParams.serviceids = params.serviceids;
                if (params.parentids) apiParams.parentids = params.parentids;
                if (params.childids) apiParams.childids = params.childids;
                if (params.selectParents) apiParams.selectParents = params.selectParents;
                if (params.selectChildren) apiParams.selectChildren = params.selectChildren;
                if (params.selectProblemTags) apiParams.selectProblemTags = params.selectProblemTags;
                if (params.selectStatusRules) apiParams.selectStatusRules = params.selectStatusRules;
                if (params.selectTags) apiParams.selectTags = params.selectTags;
                if (params.selectProblemEvents) apiParams.selectProblemEvents = params.selectProblemEvents;
                if (params.filter) apiParams.filter = params.filter;
                if (params.search) apiParams.search = params.search;
                if (params.limit) apiParams.limit = params.limit;

                const services = await api.getServices(apiParams);
                
                // Enhance services with human-readable formatting
                const enhancedServices = formatServiceHierarchy(services);
                
                logger.info(`Retrieved ${services.length} services`);
                return {
                    content: [{
                        type: 'text',
                        text: `Found ${services.length} services:\n\n${JSON.stringify(enhancedServices, null, 2)}`
                    }]
                };
            } catch (error) {
                const enhancedError = handleZabbixError(error, 'error_getting_services', args);
                logger.error('Error getting services::', enhancedError.message);
                logger.debug('Full error details:', enhancedError.details);
                throw new Error(enhancedError.message);
            }
        }
    );

    // Create service
    server.tool(
        'zabbix_create_service',
        'Create a new business service in Zabbix for IT service monitoring',
        {
            name: z.string().min(1).describe('Name of the service'),
            algorithm: z.number().int().min(0).max(2).describe('Status calculation algorithm: 0 (set status to OK), 1 (most critical of child services), 2 (most critical if all children have problems)'),
            sortorder: z.number().int().min(0).optional().default(0).describe('Position of the service used for sorting'),
            weight: z.number().int().min(0).max(1000000).optional().default(0).describe('Service weight'),
            propagation_rule: z.number().int().min(0).max(3).optional().default(0).describe('Status propagation rule: 0 (propagate as is), 1 (increase by one), 2 (decrease by one), 3 (ignore this service)'),
            propagation_value: z.number().int().min(0).max(5).optional().describe('Status propagation value'),
            description: z.string().optional().describe('Description of the service'),
            
            // Parent services
            parents: z.array(z.object({
                serviceid: z.string().describe('Parent service ID')
            })).optional().describe('Parent services'),
            
            // Child services
            children: z.array(z.object({
                serviceid: z.string().describe('Child service ID')
            })).optional().describe('Child services'),
            
            // Problem tags
            problem_tags: z.array(z.object({
                tag: z.string().describe('Problem tag name'),
                operator: z.number().int().refine(val => val === 0 || val === 2, {
                    message: "Problem tag operator must be 0 (equals) or 2 (like)"
                }).optional().default(0).describe('Tag operator: 0 (equals), 2 (like)'),
                value: z.string().optional().describe('Problem tag value')
            })).optional().describe('Problem tags that link problems to this service'),
            
            // Status rules
            status_rules: z.array(z.object({
                type: z.number().int().min(0).max(7).describe('Status rule type: 0-7 (different algorithms for status calculation based on child services)'),
                limit_value: z.number().int().min(1).max(100000).describe('Limit value (N, N%, or W weight)'),
                limit_status: z.number().int().min(-1).max(5).describe('Limit status: -1 (OK), 0 (Not classified), 1 (Information), 2 (Warning), 3 (Average), 4 (High), 5 (Disaster)'),
                new_status: z.number().int().min(0).max(5).describe('New status: 0 (Not classified), 1 (Information), 2 (Warning), 3 (Average), 4 (High), 5 (Disaster)')
            })).optional().describe('Status calculation rules'),
            
            // Service tags
            tags: z.array(z.object({
                tag: z.string().describe('Service tag name'),
                value: z.string().optional().describe('Service tag value')
            })).optional().describe('Service tags')
        },
        async (args) => {
            try {
                const params = { ...args };
                
                const result = await api.createService(params);
                
                logger.info(`Created service: ${params.name} (ID: ${result.serviceids[0]})`);
                return {
                    content: [{
                        type: 'text',
                        text: `Successfully created service "${params.name}" with ID: ${result.serviceids[0]}`
                    }]
                };
            } catch (error) {
                const enhancedError = handleZabbixError(error, 'error_creating_service', args);
                logger.error('Error creating service::', enhancedError.message);
                logger.debug('Full error details:', enhancedError.details);
                throw new Error(enhancedError.message);
            }
        }
    );

    // Update service
    server.tool(
        'zabbix_update_service',
        'Update an existing business service in Zabbix',
        {
            serviceid: z.string().describe('ID of the service to update'),
            name: z.string().optional().describe('New name for the service'),
            algorithm: z.number().int().min(0).max(2).optional().describe('Status calculation algorithm'),
            sortorder: z.number().int().min(0).optional().describe('Position of the service used for sorting'),
            weight: z.number().int().min(0).max(1000000).optional().describe('Service weight'),
            propagation_rule: z.number().int().min(0).max(3).optional().describe('Status propagation rule'),
            propagation_value: z.number().int().min(0).max(5).optional().describe('Status propagation value'),
            description: z.string().optional().describe('Description of the service'),
            parents: z.array(z.object({
                serviceid: z.string().describe('Parent service ID')
            })).optional().describe('Parent services (replaces all existing parents)'),
            children: z.array(z.object({
                serviceid: z.string().describe('Child service ID')
            })).optional().describe('Child services (replaces all existing children)'),
            problem_tags: z.array(z.object({
                tag: z.string().describe('Problem tag name'),
                operator: z.number().int().min(0).max(7).optional().describe('Tag operator'),
                value: z.string().optional().describe('Problem tag value')
            })).optional().describe('Problem tags (replaces all existing problem tags)'),
            status_rules: z.array(z.object({
                type: z.number().int().min(0).max(7).describe('Status rule type: 0-7 (different algorithms for status calculation based on child services)'),
                limit_value: z.number().int().min(1).max(100000).describe('Limit value (N, N%, or W weight)'),
                limit_status: z.number().int().min(-1).max(5).describe('Limit status: -1 (OK), 0 (Not classified), 1 (Information), 2 (Warning), 3 (Average), 4 (High), 5 (Disaster)'),
                new_status: z.number().int().min(0).max(5).describe('New status: 0 (Not classified), 1 (Information), 2 (Warning), 3 (Average), 4 (High), 5 (Disaster)')
            })).optional().describe('Status calculation rules (replaces all existing rules)'),
            tags: z.array(z.object({
                tag: z.string().describe('Service tag name'),
                value: z.string().optional().describe('Service tag value')
            })).optional().describe('Service tags (replaces all existing tags)')
        },
        async (args) => {
            try {
                const params = { ...args };
                
                const result = await api.updateService(params);
                
                logger.info(`Updated service ID ${params.serviceid}`);
                return {
                    content: [{
                        type: 'text',
                        text: `Successfully updated service ID ${params.serviceid}`
                    }]
                };
            } catch (error) {
                const enhancedError = handleZabbixError(error, 'error_updating_service', args);
                logger.error('Error updating service::', enhancedError.message);
                logger.debug('Full error details:', enhancedError.details);
                throw new Error(enhancedError.message);
            }
        }
    );

    // Delete services
    server.tool(
        'zabbix_delete_services',
        'Delete business services from Zabbix',
        {
            serviceids: z.array(z.string()).min(1).describe('Array of service IDs to delete')
        },
        async (args) => {
            try {
                const { serviceids } = args;
                
                const result = await api.deleteServices(serviceids);
                
                logger.info(`Deleted ${serviceids.length} services`);
                return {
                    content: [{
                        type: 'text',
                        text: `Successfully deleted ${serviceids.length} services: ${serviceids.join(', ')}`
                    }]
                };
            } catch (error) {
                const enhancedError = handleZabbixError(error, 'error_deleting_services', args);
                logger.error('Error deleting services::', enhancedError.message);
                logger.debug('Full error details:', enhancedError.details);
                throw new Error(enhancedError.message);
            }
        }
    );

    // Get service SLA
    server.tool(
        'zabbix_get_service_sla',
        'Get SLA (Service Level Agreement) data for business services',
        {
            serviceids: z.array(z.string()).min(1).describe('Array of service IDs to get SLA data for'),
            intervals: z.array(z.object({
                from: z.number().int().describe('Start time of the interval as Unix timestamp'),
                to: z.number().int().describe('End time of the interval as Unix timestamp')
            })).min(1).describe('Array of time intervals for SLA calculation')
        },
        async (args) => {
            try {
                const { serviceids, intervals } = args;
                
                const slaData = await api.getServiceSLA(serviceids, intervals);
                
                logger.info(`Retrieved SLA data for ${serviceids.length} services`);
                return {
                    content: [{
                        type: 'text',
                        text: `SLA data for services:\n\n${JSON.stringify(slaData, null, 2)}`
                    }]
                };
            } catch (error) {
                const enhancedError = handleZabbixError(error, 'error_getting_service_sla', args);
                logger.error('Error getting service SLA::', enhancedError.message);
                logger.debug('Full error details:', enhancedError.details);
                throw new Error(enhancedError.message);
            }
        }
    );

    logger.info('Services tools registered successfully');
}

module.exports = { registerTools }; 