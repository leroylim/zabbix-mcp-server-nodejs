const { logger } = require('../utils/logger');
const api = require('../api');
const { z } = require('zod');
const { handleZabbixError } = require('../utils/errors');

// Helper functions for discovery management
function getServiceTypeName(type) {
    const typeNames = {
        0: 'SSH',
        1: 'LDAP',
        2: 'SMTP',
        3: 'FTP',
        4: 'HTTP',
        5: 'POP',
        6: 'NNTP',
        7: 'IMAP',
        8: 'TCP',
        9: 'Zabbix agent',
        10: 'SNMPv1 agent',
        11: 'SNMPv2 agent',
        12: 'ICMP ping',
        13: 'SNMPv3 agent',
        14: 'HTTPS',
        15: 'Telnet'
    };
    return typeNames[type] || `Unknown (${type})`;
}

function getDiscoveryStatusName(status) {
    const statusNames = {
        0: 'Up',
        1: 'Down'
    };
    return statusNames[status] || `Unknown (${status})`;
}

function getHostSourceName(source) {
    const sourceNames = {
        1: 'DNS',
        2: 'IP',
        3: 'Discovery value'
    };
    return sourceNames[source] || `Unknown (${source})`;
}

function getNameSourceName(source) {
    const sourceNames = {
        0: 'Not specified',
        1: 'DNS',
        2: 'IP', 
        3: 'Discovery value'
    };
    return sourceNames[source] || `Unknown (${source})`;
}

function getSNMPSecurityLevelName(level) {
    const levelNames = {
        0: 'noAuthNoPriv',
        1: 'authNoPriv', 
        2: 'authPriv'
    };
    return levelNames[level] || `Unknown (${level})`;
}

function getSNMPAuthProtocolName(protocol) {
    const protocolNames = {
        0: 'MD5',
        1: 'SHA1',
        2: 'SHA224',
        3: 'SHA256',
        4: 'SHA384',
        5: 'SHA512'
    };
    return protocolNames[protocol] || `Unknown (${protocol})`;
}

function getSNMPPrivProtocolName(protocol) {
    const protocolNames = {
        0: 'DES',
        1: 'AES128',
        2: 'AES192',
        3: 'AES256',
        4: 'AES192C',
        5: 'AES256C'
    };
    return protocolNames[protocol] || `Unknown (${protocol})`;
}

// Enhanced schema definitions for discovery checks
const DiscoveryCheckSchema = z.object({
    type: z.number().int().min(0).max(15).describe('Type of check (0=SSH, 1=LDAP, 2=SMTP, 3=FTP, 4=HTTP, 5=POP, 6=NNTP, 7=IMAP, 8=TCP, 9=Zabbix agent, 10=SNMPv1, 11=SNMPv2, 12=ICMP ping, 13=SNMPv3, 14=HTTPS, 15=Telnet)'),
    key_: z.string().optional().describe('Item key (for Zabbix agent) or SNMP OID (for SNMP agents)'),
    ports: z.string().optional().default('0').describe('Port ranges to check (comma-separated)'),
    snmp_community: z.string().optional().describe('SNMP community (required for SNMPv1/v2)'),
    snmpv3_securityname: z.string().optional().describe('SNMPv3 security name'),
    snmpv3_securitylevel: z.number().int().min(0).max(2).optional().default(0).describe('SNMPv3 security level (0=noAuthNoPriv, 1=authNoPriv, 2=authPriv)'),
    snmpv3_authprotocol: z.number().int().min(0).max(5).optional().default(0).describe('SNMPv3 auth protocol (0=MD5, 1=SHA1, 2=SHA224, 3=SHA256, 4=SHA384, 5=SHA512)'),
    snmpv3_authpassphrase: z.string().optional().describe('SNMPv3 authentication passphrase'),
    snmpv3_privprotocol: z.number().int().min(0).max(5).optional().default(0).describe('SNMPv3 privacy protocol (0=DES, 1=AES128, 2=AES192, 3=AES256, 4=AES192C, 5=AES256C)'),
    snmpv3_privpassphrase: z.string().optional().describe('SNMPv3 privacy passphrase'),
    snmpv3_contextname: z.string().optional().describe('SNMPv3 context name'),
    uniq: z.number().int().min(0).max(1).optional().default(0).describe('Use as uniqueness criteria (0=no, 1=yes)'),
    host_source: z.number().int().min(1).max(3).optional().default(1).describe('Host name source (1=DNS, 2=IP, 3=discovery value)'),
    name_source: z.number().int().min(0).max(3).optional().default(0).describe('Visible name source (0=not specified, 1=DNS, 2=IP, 3=discovery value)'),
    allow_redirect: z.number().int().min(0).max(1).optional().default(0).describe('Allow ICMP redirects (0=fail, 1=success)')
});

function registerTools(server) {
    // Get network discovery rules (drule)
    server.tool(
        'zabbix_get_network_discovery_rules',
        'Get network discovery rules from Zabbix with filtering and output options',
        {
            druleids: z.array(z.string()).optional().describe('Return only network discovery rules with the given IDs'),
            output: z.array(z.string()).optional().default(['druleid', 'name', 'iprange', 'delay', 'status']).describe('Object properties to be returned'),
            selectDChecks: z.array(z.string()).optional().describe('Return discovery checks for the rules'),
            filter: z.record(z.any()).optional().describe('Return only rules that match the given filter'),
            search: z.record(z.any()).optional().describe('Return only rules that match the given wildcard search'),
            sortfield: z.array(z.string()).optional().default(['name']).describe('Sort the result by the given properties'),
            sortorder: z.enum(['ASC', 'DESC']).optional().default('ASC').describe('Sort order'),
            limit: z.number().int().positive().optional().describe('Limit the number of records returned')
        },
        async (args) => {
            try {
                const params = { ...args };
                
                const apiParams = {
                    output: params.output || ['druleid', 'name', 'iprange', 'delay', 'status'],
                    sortfield: params.sortfield || ['name'],
                    sortorder: params.sortorder || 'ASC'
                };

                if (params.druleids) apiParams.druleids = params.druleids;
                if (params.selectDChecks) apiParams.selectDChecks = params.selectDChecks;
                if (params.filter) apiParams.filter = params.filter;
                if (params.search) apiParams.search = params.search;
                if (params.limit) apiParams.limit = params.limit;

                const rules = await api.getNetworkDiscoveryRules(apiParams);
                
                // Enhanced formatting for discovery rules
                const formattedRules = rules.map(rule => ({
                    ...rule,
                    status_name: rule.status === '0' ? 'Enabled' : 'Disabled',
                    dchecks: rule.dchecks ? rule.dchecks.map(check => ({
                        ...check,
                        type_name: getServiceTypeName(parseInt(check.type)),
                        host_source_name: getHostSourceName(parseInt(check.host_source)),
                        name_source_name: getNameSourceName(parseInt(check.name_source)),
                        snmpv3_securitylevel_name: check.snmpv3_securitylevel ? getSNMPSecurityLevelName(parseInt(check.snmpv3_securitylevel)) : undefined,
                        snmpv3_authprotocol_name: check.snmpv3_authprotocol ? getSNMPAuthProtocolName(parseInt(check.snmpv3_authprotocol)) : undefined,
                        snmpv3_privprotocol_name: check.snmpv3_privprotocol ? getSNMPPrivProtocolName(parseInt(check.snmpv3_privprotocol)) : undefined
                    })) : undefined
                }));
                
                logger.info(`Retrieved ${rules.length} network discovery rules`);
                return {
                    content: [{
                        type: 'text',
                        text: `Found ${rules.length} network discovery rules:\n\n${JSON.stringify(formattedRules, null, 2)}`
                    }]
                };
            } catch (error) {
                const enhancedError = handleZabbixError(error, 'error_getting_network_discovery_rules', args);
                logger.error('Error getting network discovery rules::', enhancedError.message);
                logger.debug('Full error details:', enhancedError.details);
                throw new Error(enhancedError.message);
            }
        }
    );

    // Create network discovery rule (drule)
    server.tool(
        'zabbix_create_network_discovery_rule',
        'Create a new network discovery rule in Zabbix',
        {
            name: z.string().min(1).describe('Name of the discovery rule'),
            iprange: z.string().min(1).describe('IP address ranges to scan (e.g., "192.168.1.1-255", "10.0.0.0/24")'),
            delay: z.string().optional().default('1h').describe('Discovery frequency (e.g., "1h", "30m", "3600")'),
            status: z.number().int().min(0).max(1).optional().default(0).describe('Discovery rule status (0=enabled, 1=disabled)'),
            proxy_hostid: z.string().optional().describe('ID of the proxy to use for discovery'),
            concurrency_max: z.number().int().min(0).max(1000).optional().default(1).describe('Maximum number of concurrent checks'),
            dchecks: z.array(DiscoveryCheckSchema).min(1).describe('Discovery checks to perform')
        },
        async (args) => {
            try {
                const params = { ...args };
                
                // Validate discovery checks based on their types
                if (params.dchecks) {
                    for (const check of params.dchecks) {
                        const type = check.type;
                        
                        // Validate required fields based on check type
                        if ([9, 10, 11, 13].includes(type) && !check.key_) {
                            throw new Error(`key_ is required for service type ${getServiceTypeName(type)}`);
                        }
                        
                        if ([10, 11].includes(type) && !check.snmp_community) {
                            throw new Error(`snmp_community is required for ${getServiceTypeName(type)}`);
                        }
                        
                        if (type === 13) {
                            if (!check.snmpv3_securityname) {
                                throw new Error('snmpv3_securityname is required for SNMPv3 agent');
                            }
                            
                            if ([1, 2].includes(check.snmpv3_securitylevel) && !check.snmpv3_authpassphrase) {
                                throw new Error('snmpv3_authpassphrase is required when using authentication');
                            }
                            
                            if (check.snmpv3_securitylevel === 2 && !check.snmpv3_privpassphrase) {
                                throw new Error('snmpv3_privpassphrase is required when using privacy');
                            }
                        }
                    }
                }

                const result = await api.createNetworkDiscoveryRule(params);
                
                logger.info(`Created network discovery rule: ${params.name} (ID: ${result.druleids[0]})`);
                return {
                    content: [{
                        type: 'text',
                        text: `Successfully created network discovery rule "${params.name}" with ID: ${result.druleids[0]}`
                    }]
                };
            } catch (error) {
                const enhancedError = handleZabbixError(error, 'error_creating_network_discovery_rule', args);
                logger.error('Error creating network discovery rule::', enhancedError.message);
                logger.debug('Full error details:', enhancedError.details);
                throw new Error(enhancedError.message);
            }
        }
    );

    // Get discovery rules
    server.tool(
        'zabbix_get_discovery_rules',
        'Get Low-Level Discovery (LLD) rules from Zabbix with filtering and output options',
        {
            itemids: z.array(z.string()).optional().describe('Return only discovery rules with the given item IDs'),
            hostids: z.array(z.string()).optional().describe('Return only discovery rules that belong to the given hosts'),
            templateids: z.array(z.string()).optional().describe('Return only discovery rules that belong to the given templates'),
            interfaceids: z.array(z.string()).optional().describe('Return only discovery rules that use the given host interfaces'),
            output: z.array(z.string()).optional().default(['itemid', 'name', 'key_', 'type', 'delay', 'status']).describe('Object properties to be returned'),
            selectHosts: z.array(z.string()).optional().describe('Return hosts that the discovery rule belongs to'),
            selectItems: z.array(z.string()).optional().describe('Return item prototypes that belong to the discovery rule'),
            selectTriggers: z.array(z.string()).optional().describe('Return trigger prototypes that belong to the discovery rule'),
            selectGraphs: z.array(z.string()).optional().describe('Return graph prototypes that belong to the discovery rule'),
            selectHostPrototypes: z.array(z.string()).optional().describe('Return host prototypes that belong to the discovery rule'),
            filter: z.record(z.any()).optional().describe('Return only discovery rules that match the given filter'),
            search: z.record(z.any()).optional().describe('Return only discovery rules that match the given wildcard search'),
            sortfield: z.array(z.string()).optional().default(['name']).describe('Sort the result by the given properties'),
            sortorder: z.enum(['ASC', 'DESC']).optional().default('ASC').describe('Sort order'),
            limit: z.number().int().positive().optional().describe('Limit the number of records returned')
        },
        async (args) => {
            try {
                const params = { ...args };
                
                const apiParams = {
                    output: params.output || ['itemid', 'name', 'key_', 'type', 'delay', 'status'],
                    sortfield: params.sortfield || ['name'],
                    sortorder: params.sortorder || 'ASC'
                };

                if (params.itemids) apiParams.itemids = params.itemids;
                if (params.hostids) apiParams.hostids = params.hostids;
                if (params.templateids) apiParams.templateids = params.templateids;
                if (params.interfaceids) apiParams.interfaceids = params.interfaceids;
                if (params.selectHosts) apiParams.selectHosts = params.selectHosts;
                if (params.selectItems) apiParams.selectItems = params.selectItems;
                if (params.selectTriggers) apiParams.selectTriggers = params.selectTriggers;
                if (params.selectGraphs) apiParams.selectGraphs = params.selectGraphs;
                if (params.selectHostPrototypes) apiParams.selectHostPrototypes = params.selectHostPrototypes;
                if (params.filter) apiParams.filter = params.filter;
                if (params.search) apiParams.search = params.search;
                if (params.limit) apiParams.limit = params.limit;

                const rules = await api.getDiscoveryRules(apiParams);
                
                logger.info(`Retrieved ${rules.length} discovery rules`);
                return {
                    content: [{
                        type: 'text',
                        text: `Found ${rules.length} discovery rules:\n\n${JSON.stringify(rules, null, 2)}`
                    }]
                };
            } catch (error) {
                const enhancedError = handleZabbixError(error, 'error_getting_discovery_rules', args);
                logger.error('Error getting discovery rules::', enhancedError.message);
                logger.debug('Full error details:', enhancedError.details);
                throw new Error(enhancedError.message);
            }
        }
    );

    // Create discovery rule
    server.tool(
        'zabbix_create_discovery_rule',
        'Create a new Low-Level Discovery (LLD) rule in Zabbix',
        {
            name: z.string().min(1).describe('Name of the discovery rule'),
            key_: z.string().min(1).describe('Discovery rule key'),
            hostid: z.string().describe('ID of the host that the discovery rule belongs to'),
            type: z.number().int().min(0).max(19).describe('Type of the discovery rule (0 - Zabbix agent, 2 - Zabbix trapper, 3 - simple check, etc.)'),
            delay: z.string().optional().default('30s').describe('Update interval of the discovery rule'),
            status: z.number().int().min(0).max(1).optional().default(0).describe('Status of the discovery rule (0 - enabled, 1 - disabled)'),
            interfaceid: z.string().optional().describe('ID of the host interface to use'),
            description: z.string().optional().describe('Description of the discovery rule'),
            lifetime: z.string().optional().default('30d').describe('Time period after which items that are no longer discovered will be deleted'),
            filter: z.object({
                evaltype: z.number().int().min(0).max(2).optional().default(0),
                conditions: z.array(z.object({
                    macro: z.string(),
                    value: z.string(),
                    operator: z.number().int().min(8).max(12).optional().default(8),
                    formulaid: z.string().optional()
                })).optional()
            }).optional().describe('Discovery rule filter'),
            lld_macro_paths: z.array(z.object({
                lld_macro: z.string(),
                path: z.string()
            })).optional().describe('LLD macro paths for JSON/XML discovery'),
            preprocessing: z.array(z.object({
                type: z.number().int(),
                params: z.string().optional(),
                error_handler: z.number().int().optional(),
                error_handler_params: z.string().optional()
            })).optional().describe('Discovery rule preprocessing steps')
        },
        async (args) => {
            try {
                const params = { ...args };
                
                const result = await api.createDiscoveryRule(params);
                
                logger.info(`Created discovery rule: ${params.name} (ID: ${result.itemids[0]})`);
                return {
                    content: [{
                        type: 'text',
                        text: `Successfully created discovery rule "${params.name}" with ID: ${result.itemids[0]}`
                    }]
                };
            } catch (error) {
                const enhancedError = handleZabbixError(error, 'error_creating_discovery_rule', args);
                logger.error('Error creating discovery rule::', enhancedError.message);
                logger.debug('Full error details:', enhancedError.details);
                throw new Error(enhancedError.message);
            }
        }
    );

    // Update discovery rule
    server.tool(
        'zabbix_update_discovery_rule',
        'Update an existing Low-Level Discovery (LLD) rule in Zabbix',
        {
            itemid: z.string().describe('ID of the discovery rule to update'),
            name: z.string().optional().describe('Name of the discovery rule'),
            key_: z.string().optional().describe('Discovery rule key'),
            type: z.number().int().min(0).max(19).optional().describe('Type of the discovery rule'),
            delay: z.string().optional().describe('Update interval of the discovery rule'),
            status: z.number().int().min(0).max(1).optional().describe('Status of the discovery rule (0 - enabled, 1 - disabled)'),
            interfaceid: z.string().optional().describe('ID of the host interface to use'),
            description: z.string().optional().describe('Description of the discovery rule'),
            lifetime: z.string().optional().describe('Time period after which items that are no longer discovered will be deleted')
        },
        async (args) => {
            try {
                const params = { ...args };
                
                const result = await api.updateDiscoveryRule(params);
                
                logger.info(`Updated discovery rule ID ${params.itemid}`);
                return {
                    content: [{
                        type: 'text',
                        text: `Successfully updated discovery rule ID ${params.itemid}`
                    }]
                };
            } catch (error) {
                const enhancedError = handleZabbixError(error, 'error_updating_discovery_rule', args);
                logger.error('Error updating discovery rule::', enhancedError.message);
                logger.debug('Full error details:', enhancedError.details);
                throw new Error(enhancedError.message);
            }
        }
    );

    // Delete discovery rules
    server.tool(
        'zabbix_delete_discovery_rules',
        'Delete Low-Level Discovery (LLD) rules from Zabbix',
        {
            itemids: z.array(z.string()).min(1).describe('Array of discovery rule IDs to delete')
        },
        async (args) => {
            try {
                const { itemids } = args;
                
                const result = await api.deleteDiscoveryRules(itemids);
                
                logger.info(`Deleted ${itemids.length} discovery rules`);
                return {
                    content: [{
                        type: 'text',
                        text: `Successfully deleted ${itemids.length} discovery rules: ${itemids.join(', ')}`
                    }]
                };
            } catch (error) {
                const enhancedError = handleZabbixError(error, 'error_deleting_discovery_rules', args);
                logger.error('Error deleting discovery rules::', enhancedError.message);
                logger.debug('Full error details:', enhancedError.details);
                throw new Error(enhancedError.message);
            }
        }
    );

    // Get discovered hosts
    server.tool(
        'zabbix_get_discovered_hosts',
        'Get hosts discovered by network discovery or LLD rules',
        {
            dhostids: z.array(z.string()).optional().describe('Return only discovered hosts with the given IDs'),
            druleids: z.array(z.string()).optional().describe('Return only discovered hosts that were discovered by the given discovery rules'),
            output: z.array(z.string()).optional().default(['dhostid', 'druleid', 'ip', 'dns', 'status', 'lastup', 'lastdown']).describe('Object properties to be returned'),
            selectDRules: z.array(z.string()).optional().describe('Return discovery rules that discovered the host'),
            selectDServices: z.array(z.string()).optional().describe('Return discovered services of the host'),
            filter: z.record(z.any()).optional().describe('Return only discovered hosts that match the given filter'),
            search: z.record(z.any()).optional().describe('Return only discovered hosts that match the given wildcard search'),
            sortfield: z.array(z.string()).optional().default(['ip']).describe('Sort the result by the given properties'),
            sortorder: z.enum(['ASC', 'DESC']).optional().default('ASC').describe('Sort order'),
            limit: z.number().int().positive().optional().describe('Limit the number of records returned')
        },
        async (args) => {
            try {
                const params = { ...args };
                
                const apiParams = {
                    output: params.output || ['dhostid', 'druleid', 'ip', 'dns', 'status', 'lastup', 'lastdown'],
                    sortfield: params.sortfield || ['ip'],
                    sortorder: params.sortorder || 'ASC'
                };

                if (params.dhostids) apiParams.dhostids = params.dhostids;
                if (params.druleids) apiParams.druleids = params.druleids;
                if (params.selectDRules) apiParams.selectDRules = params.selectDRules;
                if (params.selectDServices) apiParams.selectDServices = params.selectDServices;
                if (params.filter) apiParams.filter = params.filter;
                if (params.search) apiParams.search = params.search;
                if (params.limit) apiParams.limit = params.limit;

                const hosts = await api.getDiscoveredHosts(apiParams);
                
                // Enhanced formatting for discovered hosts
                const formattedHosts = hosts.map(host => ({
                    ...host,
                    lastup_readable: host.lastup ? new Date(host.lastup * 1000).toISOString() : 'Never',
                    lastdown_readable: host.lastdown ? new Date(host.lastdown * 1000).toISOString() : 'Never',
                    status_name: getDiscoveryStatusName(parseInt(host.status || '0')),
                    // Enhanced discovery services formatting
                    dservices: host.dservices ? host.dservices.map(service => ({
                        ...service,
                        type_name: getServiceTypeName(parseInt(service.type)),
                        status_name: getDiscoveryStatusName(parseInt(service.status || '0')),
                        lastup_readable: service.lastup ? new Date(service.lastup * 1000).toISOString() : 'Never',
                        lastdown_readable: service.lastdown ? new Date(service.lastdown * 1000).toISOString() : 'Never'
                    })) : undefined
                }));
                
                logger.info(`Retrieved ${hosts.length} discovered hosts`);
                return {
                    content: [{
                        type: 'text',
                        text: `Found ${hosts.length} discovered hosts:\n\n${JSON.stringify(formattedHosts, null, 2)}`
                    }]
                };
            } catch (error) {
                const enhancedError = handleZabbixError(error, 'error_getting_discovered_hosts', args);
                logger.error('Error getting discovered hosts::', enhancedError.message);
                logger.debug('Full error details:', enhancedError.details);
                throw new Error(enhancedError.message);
            }
        }
    );

    // Get discovered services
    server.tool(
        'zabbix_get_discovered_services',
        'Get services discovered by network discovery rules',
        {
            dserviceids: z.array(z.string()).optional().describe('Return only discovered services with the given IDs'),
            dhostids: z.array(z.string()).optional().describe('Return only discovered services that belong to the given discovered hosts'),
            druleids: z.array(z.string()).optional().describe('Return only discovered services that were discovered by the given discovery rules'),
            output: z.array(z.string()).optional().default(['dserviceid', 'dhostid', 'type', 'key_', 'port', 'status', 'value']).describe('Object properties to be returned'),
            selectDRules: z.array(z.string()).optional().describe('Return discovery rules that discovered the service'),
            selectDHosts: z.array(z.string()).optional().describe('Return discovered hosts that the service belongs to'),
            filter: z.record(z.any()).optional().describe('Return only discovered services that match the given filter'),
            search: z.record(z.any()).optional().describe('Return only discovered services that match the given wildcard search'),
            sortfield: z.array(z.string()).optional().default(['port']).describe('Sort the result by the given properties'),
            sortorder: z.enum(['ASC', 'DESC']).optional().default('ASC').describe('Sort order'),
            limit: z.number().int().positive().optional().describe('Limit the number of records returned')
        },
        async (args) => {
            try {
                const params = { ...args };
                
                const apiParams = {
                    output: params.output || ['dserviceid', 'dhostid', 'type', 'key_', 'port', 'status', 'value'],
                    sortfield: params.sortfield || ['port'],
                    sortorder: params.sortorder || 'ASC'
                };

                if (params.dserviceids) apiParams.dserviceids = params.dserviceids;
                if (params.dhostids) apiParams.dhostids = params.dhostids;
                if (params.druleids) apiParams.druleids = params.druleids;
                if (params.selectDRules) apiParams.selectDRules = params.selectDRules;
                if (params.selectDHosts) apiParams.selectDHosts = params.selectDHosts;
                if (params.filter) apiParams.filter = params.filter;
                if (params.search) apiParams.search = params.search;
                if (params.limit) apiParams.limit = params.limit;

                const services = await api.getDiscoveredServices(apiParams);
                
                // Enhanced formatting for discovered services
                const formattedServices = services.map(service => ({
                    ...service,
                    type_name: getServiceTypeName(parseInt(service.type)),
                    status_name: getDiscoveryStatusName(parseInt(service.status || '0')),
                    lastup_readable: service.lastup ? new Date(service.lastup * 1000).toISOString() : 'Never',
                    lastdown_readable: service.lastdown ? new Date(service.lastdown * 1000).toISOString() : 'Never'
                }));
                
                logger.info(`Retrieved ${services.length} discovered services`);
                return {
                    content: [{
                        type: 'text',
                        text: `Found ${services.length} discovered services:\n\n${JSON.stringify(formattedServices, null, 2)}`
                    }]
                };
            } catch (error) {
                const enhancedError = handleZabbixError(error, 'error_getting_discovered_services', args);
                logger.error('Error getting discovered services::', enhancedError.message);
                logger.debug('Full error details:', enhancedError.details);
                throw new Error(enhancedError.message);
            }
        }
    );

    logger.info('Discovery tools registered successfully');
}

module.exports = { registerTools }; 