const { logger } = require('../utils/logger');
const api = require('../api');
const { z } = require('zod');

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
                
                logger.info(`Retrieved ${services.length} services`);
                return {
                    content: [{
                        type: 'text',
                        text: `Found ${services.length} services:\n\n${JSON.stringify(services, null, 2)}`
                    }]
                };
            } catch (error) {
                logger.error('Error getting services:', error.message);
                throw error;
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
                operator: z.number().int().min(0).max(7).optional().default(0).describe('Tag operator: 0 (equals), 1 (like), 2 (not equals), 3 (not like), 4 (exists), 5 (not exists)'),
                value: z.string().optional().describe('Problem tag value')
            })).optional().describe('Problem tags that link problems to this service'),
            
            // Status rules
            status_rules: z.array(z.object({
                type: z.number().int().min(0).max(1).describe('Status rule type: 0 (at least N child services have status), 1 (at least N% of child services have status)'),
                limit_value: z.number().int().min(1).describe('Limit value (N or N%)'),
                limit_status: z.number().int().min(0).max(5).describe('Trigger status: 0 (OK), 1 (not classified), 2 (information), 3 (warning), 4 (average), 5 (high)'),
                new_status: z.number().int().min(0).max(5).describe('New service status: 0 (OK), 1 (not classified), 2 (information), 3 (warning), 4 (average), 5 (high)')
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
                logger.error('Error creating service:', error.message);
                throw error;
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
                type: z.number().int().min(0).max(1).describe('Status rule type'),
                limit_value: z.number().int().min(1).describe('Limit value'),
                limit_status: z.number().int().min(0).max(5).describe('Trigger status'),
                new_status: z.number().int().min(0).max(5).describe('New service status')
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
                logger.error('Error updating service:', error.message);
                throw error;
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
                logger.error('Error deleting services:', error.message);
                throw error;
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
                logger.error('Error getting service SLA:', error.message);
                throw error;
            }
        }
    );

    logger.info('Services tools registered successfully');
}

module.exports = { registerTools }; 