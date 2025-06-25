const { logger } = require('../utils/logger');
const api = require('../api');
const { z } = require('zod');
const { handleZabbixError } = require('../utils/errors');

// HTTP header schema
const httpHeaderSchema = z.object({
    name: z.string().describe("HTTP header name."),
    value: z.string().describe("HTTP header value.")
});

// Query field schema for HTTP agent items
const queryFieldSchema = z.object({
    name: z.string().describe("Query parameter name."),
    value: z.string().describe("Query parameter value.")
});

// Preprocessing step schema
const preprocessingStepSchema = z.object({
    type: z.number().int().min(0).max(30).describe("Preprocessing type: 0-30 (see official docs for complete list)."),
    params: z.array(z.string()).describe("Preprocessing step parameters."),
    error_handler: z.number().int().min(0).max(3).optional().describe("Error handling: 0 (original error), 1 (discard value), 2 (set custom value), 3 (set custom error)."),
    error_handler_params: z.string().optional().describe("Error handler parameters.")
});

// Item tag schema
const itemTagSchema = z.object({
    tag: z.string().describe("Item tag name."),
    value: z.string().describe("Item tag value.")
});

// Complete Item Object schema
const itemObjectSchema = z.object({
    itemid: z.string().describe("Item ID (read-only)."),
    type: z.number().int().min(0).max(21).describe("Item type: 0 (Zabbix agent), 1 (SNMPv1), 2 (trapper), 3 (simple check), 4 (SNMPv2), 5 (internal), 6 (SNMPv3), 7 (agent active), 8 (aggregate), 9 (web item), 10 (external check), 11 (database monitor), 12 (IPMI), 13 (SSH), 14 (TELNET), 15 (calculated), 16 (JMX), 17 (SNMP trap), 18 (dependent), 19 (HTTP agent), 20 (SNMP agent), 21 (script)."),
    snmp_community: z.string().optional().describe("SNMP community string."),
    snmp_oid: z.string().optional().describe("SNMP OID."),
    hostid: z.string().describe("Host ID that the item belongs to."),
    name: z.string().describe("Name of the item."),
    key_: z.string().describe("Item key."),
    delay: z.string().optional().describe("Update interval. Supports time suffixes, custom intervals, flexible intervals."),
    history: z.string().optional().describe("History storage period. Time unit or 0 to disable."),
    trends: z.string().optional().describe("Trend storage period. Time unit or 0 to disable."),
    status: z.number().int().min(0).max(1).describe("Item status: 0 (enabled), 1 (disabled)."),
    value_type: z.number().int().min(0).max(4).describe("Value type: 0 (numeric float), 1 (character), 2 (log), 3 (numeric unsigned), 4 (text)."),
    trapper_hosts: z.string().optional().describe("Allowed hosts for trapper items. Comma-separated list."),
    units: z.string().optional().describe("Value units."),
    formula: z.string().optional().describe("Custom multiplier formula."),
    error: z.string().optional().describe("Item error text (read-only)."),
    lastlogsize: z.number().int().optional().describe("Last log size (read-only)."),
    logtimefmt: z.string().optional().describe("Log time format for log items."),
    templateid: z.string().optional().describe("Parent template item ID (read-only)."),
    valuemapid: z.string().optional().describe("Value map ID."),
    params: z.string().optional().describe("Additional parameters depending on item type."),
    ipmi_sensor: z.string().optional().describe("IPMI sensor."),
    authtype: z.number().int().min(0).max(4).optional().describe("Authentication type: 0 (none), 1 (basic), 2 (NTLM), 3 (Kerberos), 4 (digest)."),
    username: z.string().optional().describe("Username for authentication."),
    password: z.string().optional().describe("Password for authentication."),
    publickey: z.string().optional().describe("Public key file path for SSH items."),
    privatekey: z.string().optional().describe("Private key file path for SSH items."),
    mtime: z.number().int().optional().describe("Last modification time (read-only)."),
    flags: z.number().int().optional().describe("Origin flags (read-only)."),
    interfaceid: z.string().optional().describe("Host interface ID."),
    description: z.string().optional().describe("Item description."),
    inventory_link: z.number().int().min(0).max(70).optional().describe("Host inventory field ID (0-70)."),
    lifetime: z.string().optional().describe("Lifetime for LLD items."),
    snmp_version: z.number().int().min(1).max(3).optional().describe("SNMP version: 1 (SNMPv1), 2 (SNMPv2c), 3 (SNMPv3)."),
    snmpv3_contextname: z.string().optional().describe("SNMPv3 context name."),
    snmpv3_securityname: z.string().optional().describe("SNMPv3 security name."),
    snmpv3_securitylevel: z.number().int().min(0).max(2).optional().describe("SNMPv3 security level: 0 (noAuthNoPriv), 1 (authNoPriv), 2 (authPriv)."),
    snmpv3_authprotocol: z.number().int().min(0).max(5).optional().describe("SNMPv3 auth protocol: 0 (MD5), 1 (SHA1), 2 (SHA224), 3 (SHA256), 4 (SHA384), 5 (SHA512)."),
    snmpv3_authpassphrase: z.string().optional().describe("SNMPv3 authentication passphrase."),
    snmpv3_privprotocol: z.number().int().min(0).max(3).optional().describe("SNMPv3 privacy protocol: 0 (DES), 1 (AES128), 2 (AES192), 3 (AES256)."),
    snmpv3_privpassphrase: z.string().optional().describe("SNMPv3 privacy passphrase."),
    jmx_endpoint: z.string().optional().describe("JMX endpoint."),
    master_itemid: z.string().optional().describe("Master item ID for dependent items."),
    timeout: z.string().optional().describe("Request timeout."),
    url: z.string().optional().describe("URL for HTTP agent items."),
    query_fields: z.array(queryFieldSchema).optional().describe("Query fields for HTTP items."),
    posts: z.string().optional().describe("HTTP POST data."),
    status_codes: z.string().optional().describe("Acceptable HTTP status codes."),
    follow_redirects: z.number().int().min(0).max(1).optional().describe("Follow HTTP redirects: 0 (no), 1 (yes)."),
    post_type: z.number().int().min(0).max(2).optional().describe("HTTP POST data type: 0 (raw), 1 (JSON), 2 (XML)."),
    http_proxy: z.string().optional().describe("HTTP proxy."),
    headers: z.array(httpHeaderSchema).optional().describe("HTTP headers."),
    retrieve_mode: z.number().int().min(0).max(2).optional().describe("Retrieve mode: 0 (body), 1 (headers), 2 (both)."),
    request_method: z.number().int().min(0).max(3).optional().describe("HTTP request method: 0 (GET), 1 (POST), 2 (PUT), 3 (HEAD)."),
    output_format: z.number().int().min(0).max(1).optional().describe("Output format: 0 (store as is), 1 (convert to JSON)."),
    ssl_cert_file: z.string().optional().describe("SSL certificate file path."),
    ssl_key_file: z.string().optional().describe("SSL key file path."),
    ssl_key_password: z.string().optional().describe("SSL key password."),
    verify_peer: z.number().int().min(0).max(1).optional().describe("Verify SSL peer: 0 (no), 1 (yes)."),
    verify_host: z.number().int().min(0).max(1).optional().describe("Verify SSL host: 0 (no), 1 (yes)."),
    allow_traps: z.number().int().min(0).max(1).optional().describe("Allow traps: 0 (no), 1 (yes)."),
    preprocessing: z.array(preprocessingStepSchema).optional().describe("Preprocessing steps."),
    tags: z.array(itemTagSchema).optional().describe("Item tags.")
});

function registerTools(server) {
    // Get items
    server.tool(
        'zabbix_get_items',
        'Get items from Zabbix with filtering and output options',
        {
            itemids: z.array(z.string()).optional().describe('Return only items with the given item IDs'),
            hostids: z.array(z.string()).optional().describe('Return only items that belong to the given hosts'),
            groupids: z.array(z.string()).optional().describe('Return only items that belong to hosts in the given host groups'),
            templateids: z.array(z.string()).optional().describe('Return only items that belong to the given templates'),
            interfaceids: z.array(z.string()).optional().describe('Return only items that use the given host interfaces'),
            graphids: z.array(z.string()).optional().describe('Return only items that are used in the given graphs'),
            triggerids: z.array(z.string()).optional().describe('Return only items that are used in the given triggers'),
            webitems: z.boolean().optional().describe('Include web items in the result'),
            inherited: z.boolean().optional().describe('Return items inherited from templates'),
            templated: z.boolean().optional().describe('Return items that belong to templates'),
            monitored: z.boolean().optional().describe('Return only enabled items that belong to monitored hosts'),
            output: z.array(z.string()).optional().default(['itemid', 'name', 'key_', 'hostid', 'status', 'value_type']).describe('Object properties to be returned'),
            selectHosts: z.array(z.string()).optional().describe('Return hosts that the item belongs to'),
            selectTriggers: z.array(z.string()).optional().describe('Return triggers that the item is used in'),
            selectGraphs: z.array(z.string()).optional().describe('Return graphs that the item is used in'),
            selectDiscoveryRule: z.array(z.string()).optional().describe('Return discovery rule that created the item'),
            selectItemDiscovery: z.array(z.string()).optional().describe('Return item discovery data'),
            selectPreprocessing: z.array(z.string()).optional().describe('Return preprocessing steps'),
            selectTags: z.array(z.string()).optional().describe('Return item tags'),
            selectValueMap: z.array(z.string()).optional().describe('Return value map'),
            filter: z.record(z.any()).optional().describe('Return only items that match the given filter'),
            search: z.record(z.any()).optional().describe('Return only items that match the given wildcard search'),
            searchByAny: z.boolean().optional().describe('Return results that match any of the criteria in the search parameter'),
            startSearch: z.boolean().optional().describe('Return results that start with the criteria in the search parameter'),
            excludeSearch: z.boolean().optional().describe('Return results that do not match the criteria in the search parameter'),
            searchWildcardsEnabled: z.boolean().optional().describe('Return results that contain wildcards'),
            sortfield: z.array(z.string()).optional().default(['name']).describe('Sort the result by the given properties'),
            sortorder: z.enum(['ASC', 'DESC']).optional().default('ASC').describe('Sort order'),
            limit: z.number().int().positive().optional().describe('Limit the number of records returned'),
            preservekeys: z.boolean().optional().describe('Use item IDs as keys in the resulting array')
        },
        async (args) => {
            try {
                const params = { ...args };
                
                // Build API parameters
                const apiParams = {
                    output: params.output || ['itemid', 'name', 'key_', 'hostid', 'status', 'value_type'],
                    sortfield: params.sortfield || ['name'],
                    sortorder: params.sortorder || 'ASC'
                };

                // Add all supported parameters
                if (params.itemids) apiParams.itemids = params.itemids;
                if (params.hostids) apiParams.hostids = params.hostids;
                if (params.groupids) apiParams.groupids = params.groupids;
                if (params.templateids) apiParams.templateids = params.templateids;
                if (params.interfaceids) apiParams.interfaceids = params.interfaceids;
                if (params.graphids) apiParams.graphids = params.graphids;
                if (params.triggerids) apiParams.triggerids = params.triggerids;
                if (params.webitems !== undefined) apiParams.webitems = params.webitems;
                if (params.inherited !== undefined) apiParams.inherited = params.inherited;
                if (params.templated !== undefined) apiParams.templated = params.templated;
                if (params.monitored !== undefined) apiParams.monitored = params.monitored;
                if (params.selectHosts) apiParams.selectHosts = params.selectHosts;
                if (params.selectTriggers) apiParams.selectTriggers = params.selectTriggers;
                if (params.selectGraphs) apiParams.selectGraphs = params.selectGraphs;
                if (params.selectDiscoveryRule) apiParams.selectDiscoveryRule = params.selectDiscoveryRule;
                if (params.selectItemDiscovery) apiParams.selectItemDiscovery = params.selectItemDiscovery;
                if (params.selectPreprocessing) apiParams.selectPreprocessing = params.selectPreprocessing;
                if (params.selectTags) apiParams.selectTags = params.selectTags;
                if (params.selectValueMap) apiParams.selectValueMap = params.selectValueMap;
                if (params.filter) apiParams.filter = params.filter;
                if (params.search) apiParams.search = params.search;
                if (params.searchByAny !== undefined) apiParams.searchByAny = params.searchByAny;
                if (params.startSearch !== undefined) apiParams.startSearch = params.startSearch;
                if (params.excludeSearch !== undefined) apiParams.excludeSearch = params.excludeSearch;
                if (params.searchWildcardsEnabled !== undefined) apiParams.searchWildcardsEnabled = params.searchWildcardsEnabled;
                if (params.limit) apiParams.limit = params.limit;
                if (params.preservekeys !== undefined) apiParams.preservekeys = params.preservekeys;

                const items = await api.getItems(apiParams);
                
                logger.info(`Retrieved ${items.length} items`);
                return {
                    content: [{
                        type: 'text',
                        text: `Found ${items.length} items:\n\n${JSON.stringify(items, null, 2)}`
                    }]
                };
            } catch (error) {
                const enhancedError = handleZabbixError(error, 'error_getting_items', args);
                logger.error('Error getting items::', enhancedError.message);
                logger.debug('Full error details:', enhancedError.details);
                throw new Error(enhancedError.message);
            }
        }
    );

    // Create item
    server.tool(
        'zabbix_create_item',
        'Create a new item in Zabbix',
        {
            name: z.string().min(1).max(255).describe('Name of the item'),
            key_: z.string().min(1).max(2048).describe('Item key'),
            hostid: z.string().describe('ID of the host that the item belongs to'),
            type: z.number().int().min(0).max(21).optional().default(0).describe('Type of the item: 0 (Zabbix agent), 1 (SNMPv1), 2 (trapper), 3 (simple check), 4 (SNMPv2), 5 (internal), 6 (SNMPv3), 7 (agent active), 8 (aggregate), 9 (web item), 10 (external check), 11 (database monitor), 12 (IPMI), 13 (SSH), 14 (TELNET), 15 (calculated), 16 (JMX), 17 (SNMP trap), 18 (dependent), 19 (HTTP agent), 20 (SNMP agent), 21 (script)'),
            value_type: z.number().int().min(0).max(4).optional().default(3).describe('Type of information: 0 (numeric float), 1 (character), 2 (log), 3 (numeric unsigned), 4 (text)'),
            interfaceid: z.string().optional().describe('Host interface ID'),
            delay: z.string().optional().default('30s').describe('Update interval'),
            history: z.string().optional().default('90d').describe('History storage period'),
            trends: z.string().optional().default('365d').describe('Trend storage period'),
            status: z.number().int().min(0).max(1).optional().default(0).describe('Status: 0 (enabled), 1 (disabled)'),
            description: z.string().max(65535).optional().describe('Description of the item'),
            units: z.string().max(255).optional().describe('Value units'),
            params: z.string().max(65535).optional().describe('Additional parameters'),
            username: z.string().max(255).optional().describe('Username for authentication'),
            password: z.string().max(255).optional().describe('Password for authentication'),
            publickey: z.string().max(64).optional().describe('Public key file path'),
            privatekey: z.string().max(64).optional().describe('Private key file path'),
            authtype: z.number().int().min(0).max(4).optional().describe('Authentication type: 0 (none), 1 (basic), 2 (NTLM), 3 (Kerberos), 4 (digest)'),
            valuemapid: z.string().optional().describe('Value map ID'),
            inventory_link: z.number().int().min(0).max(70).optional().describe('Host inventory field ID'),
            logtimefmt: z.string().max(64).optional().describe('Log time format'),
            preprocessing: z.array(preprocessingStepSchema).optional().describe('Preprocessing steps'),
            tags: z.array(itemTagSchema).optional().describe('Item tags'),
            // SNMP-specific properties
            snmp_community: z.string().max(64).optional().describe('SNMP community'),
            snmp_oid: z.string().max(512).optional().describe('SNMP OID'),
            snmp_version: z.number().int().min(1).max(3).optional().describe('SNMP version: 1 (v1), 2 (v2c), 3 (v3)'),
            snmpv3_contextname: z.string().max(255).optional().describe('SNMPv3 context name'),
            snmpv3_securityname: z.string().max(64).optional().describe('SNMPv3 security name'),
            snmpv3_securitylevel: z.number().int().min(0).max(2).optional().describe('SNMPv3 security level: 0 (noAuthNoPriv), 1 (authNoPriv), 2 (authPriv)'),
            snmpv3_authprotocol: z.number().int().min(0).max(5).optional().describe('SNMPv3 auth protocol: 0 (MD5), 1 (SHA1), 2 (SHA224), 3 (SHA256), 4 (SHA384), 5 (SHA512)'),
            snmpv3_authpassphrase: z.string().max(64).optional().describe('SNMPv3 authentication passphrase'),
            snmpv3_privprotocol: z.number().int().min(0).max(3).optional().describe('SNMPv3 privacy protocol: 0 (DES), 1 (AES128), 2 (AES192), 3 (AES256)'),
            snmpv3_privpassphrase: z.string().max(64).optional().describe('SNMPv3 privacy passphrase'),
            // HTTP agent properties
            url: z.string().max(2048).optional().describe('URL for HTTP agent items'),
            query_fields: z.array(queryFieldSchema).optional().describe('Query fields'),
            posts: z.string().max(65535).optional().describe('HTTP POST data'),
            status_codes: z.string().max(255).optional().describe('Acceptable HTTP status codes'),
            follow_redirects: z.number().int().min(0).max(1).optional().describe('Follow redirects: 0 (no), 1 (yes)'),
            post_type: z.number().int().min(0).max(2).optional().describe('POST data type: 0 (raw), 1 (JSON), 2 (XML)'),
            http_proxy: z.string().max(255).optional().describe('HTTP proxy'),
            headers: z.array(httpHeaderSchema).optional().describe('HTTP headers'),
            retrieve_mode: z.number().int().min(0).max(2).optional().describe('Retrieve mode: 0 (body), 1 (headers), 2 (both)'),
            request_method: z.number().int().min(0).max(3).optional().describe('Request method: 0 (GET), 1 (POST), 2 (PUT), 3 (HEAD)'),
            output_format: z.number().int().min(0).max(1).optional().describe('Output format: 0 (store as is), 1 (convert to JSON)'),
            ssl_cert_file: z.string().max(255).optional().describe('SSL certificate file'),
            ssl_key_file: z.string().max(255).optional().describe('SSL key file'),
            ssl_key_password: z.string().max(64).optional().describe('SSL key password'),
            verify_peer: z.number().int().min(0).max(1).optional().describe('Verify SSL peer: 0 (no), 1 (yes)'),
            verify_host: z.number().int().min(0).max(1).optional().describe('Verify SSL host: 0 (no), 1 (yes)'),
            timeout: z.string().max(255).optional().describe('Request timeout'),
            // Other properties
            master_itemid: z.string().optional().describe('Master item ID for dependent items'),
            jmx_endpoint: z.string().max(255).optional().describe('JMX endpoint'),
            ipmi_sensor: z.string().max(128).optional().describe('IPMI sensor'),
            trapper_hosts: z.string().max(255).optional().describe('Allowed hosts for trapper items'),
            formula: z.string().max(255).optional().describe('Custom multiplier formula'),
            allow_traps: z.number().int().min(0).max(1).optional().describe('Allow traps: 0 (no), 1 (yes)'),
            lifetime: z.string().max(255).optional().describe('Lifetime for LLD items')
        },
        async (args) => {
            try {
                const params = { ...args };
                
                const result = await api.createItem(params);
                
                logger.info(`Created item: ${params.name} (ID: ${result.itemids[0]})`);
                return {
                    content: [{
                        type: 'text',
                        text: `Successfully created item "${params.name}" with ID: ${result.itemids[0]}`
                    }]
                };
            } catch (error) {
                const enhancedError = handleZabbixError(error, 'error_creating_item', args);
                logger.error('Error creating item::', enhancedError.message);
                logger.debug('Full error details:', enhancedError.details);
                throw new Error(enhancedError.message);
            }
        }
    );

    // Update item
    server.tool(
        'zabbix_update_item',
        'Update an existing item in Zabbix',
        {
            itemid: z.string().describe('ID of the item to update'),
            name: z.string().min(1).max(255).optional().describe('Name of the item'),
            key_: z.string().min(1).max(2048).optional().describe('Item key'),
            type: z.number().int().min(0).max(21).optional().describe('Type of the item'),
            value_type: z.number().int().min(0).max(4).optional().describe('Type of information'),
            interfaceid: z.string().optional().describe('Host interface ID'),
            delay: z.string().optional().describe('Update interval'),
            history: z.string().optional().describe('History storage period'),
            trends: z.string().optional().describe('Trend storage period'),
            status: z.number().int().min(0).max(1).optional().describe('Status: 0 (enabled), 1 (disabled)'),
            description: z.string().max(65535).optional().describe('Description'),
            units: z.string().max(255).optional().describe('Value units'),
            params: z.string().max(65535).optional().describe('Additional parameters'),
            username: z.string().max(255).optional().describe('Username for authentication'),
            password: z.string().max(255).optional().describe('Password for authentication'),
            publickey: z.string().max(64).optional().describe('Public key file path'),
            privatekey: z.string().max(64).optional().describe('Private key file path'),
            authtype: z.number().int().min(0).max(4).optional().describe('Authentication type'),
            valuemapid: z.string().optional().describe('Value map ID'),
            inventory_link: z.number().int().min(0).max(70).optional().describe('Host inventory field ID'),
            logtimefmt: z.string().max(64).optional().describe('Log time format'),
            preprocessing: z.array(preprocessingStepSchema).optional().describe('Preprocessing steps'),
            tags: z.array(itemTagSchema).optional().describe('Item tags'),
            // SNMP properties
            snmp_community: z.string().max(64).optional().describe('SNMP community'),
            snmp_oid: z.string().max(512).optional().describe('SNMP OID'),
            snmp_version: z.number().int().min(1).max(3).optional().describe('SNMP version'),
            snmpv3_contextname: z.string().max(255).optional().describe('SNMPv3 context name'),
            snmpv3_securityname: z.string().max(64).optional().describe('SNMPv3 security name'),
            snmpv3_securitylevel: z.number().int().min(0).max(2).optional().describe('SNMPv3 security level'),
            snmpv3_authprotocol: z.number().int().min(0).max(5).optional().describe('SNMPv3 auth protocol'),
            snmpv3_authpassphrase: z.string().max(64).optional().describe('SNMPv3 auth passphrase'),
            snmpv3_privprotocol: z.number().int().min(0).max(3).optional().describe('SNMPv3 privacy protocol'),
            snmpv3_privpassphrase: z.string().max(64).optional().describe('SNMPv3 privacy passphrase'),
            // HTTP agent properties
            url: z.string().max(2048).optional().describe('URL for HTTP agent items'),
            query_fields: z.array(queryFieldSchema).optional().describe('Query fields'),
            posts: z.string().max(65535).optional().describe('HTTP POST data'),
            status_codes: z.string().max(255).optional().describe('Acceptable HTTP status codes'),
            follow_redirects: z.number().int().min(0).max(1).optional().describe('Follow redirects'),
            post_type: z.number().int().min(0).max(2).optional().describe('POST data type'),
            http_proxy: z.string().max(255).optional().describe('HTTP proxy'),
            headers: z.array(httpHeaderSchema).optional().describe('HTTP headers'),
            retrieve_mode: z.number().int().min(0).max(2).optional().describe('Retrieve mode'),
            request_method: z.number().int().min(0).max(3).optional().describe('Request method'),
            output_format: z.number().int().min(0).max(1).optional().describe('Output format'),
            ssl_cert_file: z.string().max(255).optional().describe('SSL certificate file'),
            ssl_key_file: z.string().max(255).optional().describe('SSL key file'),
            ssl_key_password: z.string().max(64).optional().describe('SSL key password'),
            verify_peer: z.number().int().min(0).max(1).optional().describe('Verify SSL peer'),
            verify_host: z.number().int().min(0).max(1).optional().describe('Verify SSL host'),
            timeout: z.string().max(255).optional().describe('Request timeout'),
            // Other properties
            master_itemid: z.string().optional().describe('Master item ID for dependent items'),
            jmx_endpoint: z.string().max(255).optional().describe('JMX endpoint'),
            ipmi_sensor: z.string().max(128).optional().describe('IPMI sensor'),
            trapper_hosts: z.string().max(255).optional().describe('Allowed hosts for trapper items'),
            formula: z.string().max(255).optional().describe('Custom multiplier formula'),
            allow_traps: z.number().int().min(0).max(1).optional().describe('Allow traps'),
            lifetime: z.string().max(255).optional().describe('Lifetime for LLD items')
        },
        async (args) => {
            try {
                const params = { ...args };
                
                const result = await api.updateItem(params);
                
                logger.info(`Updated item ID ${params.itemid}`);
                return {
                    content: [{
                        type: 'text',
                        text: `Successfully updated item ID ${params.itemid}`
                    }]
                };
            } catch (error) {
                const enhancedError = handleZabbixError(error, 'error_updating_item', args);
                logger.error('Error updating item::', enhancedError.message);
                logger.debug('Full error details:', enhancedError.details);
                throw new Error(enhancedError.message);
            }
        }
    );

    // Delete items
    server.tool(
        'zabbix_delete_items',
        'Delete items from Zabbix',
        {
            itemids: z.array(z.string()).min(1).describe('Array of item IDs to delete')
        },
        async (args) => {
            try {
                const { itemids } = args;
                
                const result = await api.deleteItems(itemids);
                
                logger.info(`Deleted ${itemids.length} items`);
                return {
                    content: [{
                        type: 'text',
                        text: `Successfully deleted ${itemids.length} items: ${itemids.join(', ')}`
                    }]
                };
            } catch (error) {
                const enhancedError = handleZabbixError(error, 'error_deleting_items', args);
                logger.error('Error deleting items::', enhancedError.message);
                logger.debug('Full error details:', enhancedError.details);
                throw new Error(enhancedError.message);
            }
        }
    );

    // Get latest data for items
    server.tool(
        'zabbix_get_latest_data',
        'Get latest data for items from Zabbix',
        {
            itemids: z.array(z.string()).optional().describe('Array of item IDs to get latest data for'),
            hostids: z.array(z.string()).optional().describe('Return only items that belong to the given hosts'),
            output: z.array(z.string()).optional().default(['itemid', 'name', 'lastvalue', 'lastclock', 'units']).describe('Object properties to be returned'),
            selectHosts: z.array(z.string()).optional().describe('Return hosts that the item belongs to'),
            limit: z.number().int().positive().optional().describe('Limit the number of records returned')
        },
        async (args) => {
            try {
                const params = { ...args };
                
                // Build API parameters for getting items with latest data
                const apiParams = {
                    output: params.output || ['itemid', 'name', 'lastvalue', 'lastclock', 'units'],
                    monitored: true
                };

                if (params.itemids) apiParams.itemids = params.itemids;
                if (params.hostids) apiParams.hostids = params.hostids;
                if (params.selectHosts) apiParams.selectHosts = params.selectHosts;
                if (params.limit) apiParams.limit = params.limit;

                const latestData = await api.getLatestData(apiParams);
                
                logger.info(`Retrieved latest data for ${latestData.length} items`);
                return {
                    content: [{
                        type: 'text',
                        text: `Found latest data for ${latestData.length} items:\n\n${JSON.stringify(latestData, null, 2)}`
                    }]
                };
            } catch (error) {
                const enhancedError = handleZabbixError(error, 'error_getting_latest_data', args);
                logger.error('Error getting latest data::', enhancedError.message);
                logger.debug('Full error details:', enhancedError.details);
                throw new Error(enhancedError.message);
            }
        }
    );

    logger.info('Items tools registered successfully');
}

module.exports = { registerTools }; 