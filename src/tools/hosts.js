const api = require('../api');
const { z } = require('zod');
const schemas = require('./schemas');

// Enhanced interface schema with all official properties
const interfaceSchema = z.object({
    interfaceid: z.string().optional().describe("Interface ID (for updates)."),
    hostid: z.string().optional().describe("Host ID (read-only)."),
    type: z.number().int().min(1).max(4).describe("Interface type: 1 (agent), 2 (SNMP), 3 (IPMI), 4 (JMX)."),
    main: z.number().int().min(0).max(1).describe("Default interface: 0 (not default), 1 (default)."),
    useip: z.number().int().min(0).max(1).describe("Connection method: 0 (DNS), 1 (IP)."),
    ip: z.string().optional().describe("IP address for connection."),
    dns: z.string().optional().describe("DNS name for connection."),
    port: z.string().describe("Port number for connection."),
    available: z.number().int().min(0).max(2).optional().describe("Interface availability: 0 (unknown), 1 (available), 2 (unavailable). Read-only."),
    error: z.string().optional().describe("Error message. Read-only."),
    errors_from: z.number().int().optional().describe("Time when errors started. Read-only."),
    disable_until: z.number().int().optional().describe("Time until interface is disabled. Read-only."),
    details: z.object({
        version: z.number().int().optional().describe("SNMP version."),
        bulk: z.number().int().optional().describe("SNMP bulk requests."),
        community: z.string().optional().describe("SNMP community."),
        securityname: z.string().optional().describe("SNMPv3 security name."),
        securitylevel: z.number().int().optional().describe("SNMPv3 security level."),
        authpassphrase: z.string().optional().describe("SNMPv3 auth passphrase."),
        privpassphrase: z.string().optional().describe("SNMPv3 priv passphrase."),
        authprotocol: z.number().int().optional().describe("SNMPv3 auth protocol."),
        privprotocol: z.number().int().optional().describe("SNMPv3 priv protocol."),
        contextname: z.string().optional().describe("SNMPv3 context name."),
        max_repetitions: z.number().int().optional().describe("Max repetitions for SNMP bulk requests.")
    }).optional().describe("Interface specific details (mainly for SNMP).")
});

// Enhanced tag schema
const tagSchema = z.object({
    tag: z.string().min(1).describe("Tag name."),
    value: z.string().describe("Tag value."),
    automatic: z.number().int().min(0).max(1).optional().describe("Tag type: 0 (manual), 1 (automatic). Read-only.")
});

// Enhanced inventory schema with specific fields
const inventorySchema = z.object({
    alias: z.string().max(64).optional().describe("Alias."),
    asset_tag: z.string().max(64).optional().describe("Asset tag."),
    chassis: z.string().max(64).optional().describe("Chassis."),
    contact: z.string().max(65535).optional().describe("Contact person."),
    contract_number: z.string().max(64).optional().describe("Contract number."),
    date_hw_decomm: z.string().max(64).optional().describe("HW decommissioning date."),
    date_hw_expiry: z.string().max(64).optional().describe("HW expiry date."),
    date_hw_install: z.string().max(64).optional().describe("HW installation date."),
    date_hw_purchase: z.string().max(64).optional().describe("HW purchase date."),
    deployment_status: z.string().max(64).optional().describe("Deployment status."),
    hardware: z.string().max(255).optional().describe("Hardware."),
    hardware_full: z.string().max(65535).optional().describe("Detailed hardware info."),
    host_netmask: z.string().max(39).optional().describe("Host subnet mask."),
    host_networks: z.string().max(65535).optional().describe("Host networks."),
    host_router: z.string().max(39).optional().describe("Host router."),
    hw_arch: z.string().max(32).optional().describe("HW architecture."),
    installer_name: z.string().max(64).optional().describe("Installer name."),
    location: z.string().max(65535).optional().describe("Location."),
    location_lat: z.string().max(16).optional().describe("Location latitude."),
    location_lon: z.string().max(16).optional().describe("Location longitude."),
    macaddress_a: z.string().max(64).optional().describe("MAC address A."),
    macaddress_b: z.string().max(64).optional().describe("MAC address B."),
    model: z.string().max(64).optional().describe("Model."),
    name: z.string().max(128).optional().describe("Name."),
    notes: z.string().max(65535).optional().describe("Notes."),
    oob_ip: z.string().max(39).optional().describe("OOB IP address."),
    oob_netmask: z.string().max(39).optional().describe("OOB subnet mask."),
    oob_router: z.string().max(39).optional().describe("OOB router."),
    os: z.string().max(128).optional().describe("OS name."),
    os_full: z.string().max(255).optional().describe("Detailed OS name."),
    os_short: z.string().max(128).optional().describe("Short OS name."),
    poc_1_cell: z.string().max(64).optional().describe("Primary POC mobile number."),
    poc_1_email: z.string().max(128).optional().describe("Primary email."),
    poc_1_name: z.string().max(128).optional().describe("Primary POC name."),
    poc_1_notes: z.string().max(65535).optional().describe("Primary POC notes."),
    poc_1_phone_a: z.string().max(64).optional().describe("Primary POC phone A."),
    poc_1_phone_b: z.string().max(64).optional().describe("Primary POC phone B."),
    poc_1_screen: z.string().max(64).optional().describe("Primary POC screen name."),
    poc_2_cell: z.string().max(64).optional().describe("Secondary POC mobile number."),
    poc_2_email: z.string().max(128).optional().describe("Secondary POC email."),
    poc_2_name: z.string().max(128).optional().describe("Secondary POC name."),
    poc_2_notes: z.string().max(65535).optional().describe("Secondary POC notes."),
    poc_2_phone_a: z.string().max(64).optional().describe("Secondary POC phone A."),
    poc_2_phone_b: z.string().max(64).optional().describe("Secondary POC phone B."),
    poc_2_screen: z.string().max(64).optional().describe("Secondary POC screen name."),
    serialno_a: z.string().max(64).optional().describe("Serial number A."),
    serialno_b: z.string().max(64).optional().describe("Serial number B."),
    site_address_a: z.string().max(128).optional().describe("Site address A."),
    site_address_b: z.string().max(128).optional().describe("Site address B."),
    site_address_c: z.string().max(128).optional().describe("Site address C."),
    site_city: z.string().max(128).optional().describe("Site city."),
    site_country: z.string().max(64).optional().describe("Site country."),
    site_notes: z.string().max(65535).optional().describe("Site notes."),
    site_rack: z.string().max(128).optional().describe("Site rack location."),
    site_state: z.string().max(64).optional().describe("Site state."),
    site_zip: z.string().max(64).optional().describe("Site ZIP/postal code."),
    software: z.string().max(255).optional().describe("Software."),
    software_app_a: z.string().max(64).optional().describe("Software application A."),
    software_app_b: z.string().max(64).optional().describe("Software application B."),
    software_app_c: z.string().max(64).optional().describe("Software application C."),
    software_app_d: z.string().max(64).optional().describe("Software application D."),
    software_app_e: z.string().max(64).optional().describe("Software application E."),
    software_full: z.string().max(65535).optional().describe("Software details."),
    tag: z.string().max(64).optional().describe("Tag."),
    type: z.string().max(64).optional().describe("Type."),
    type_full: z.string().max(64).optional().describe("Type details."),
    url_a: z.string().max(2048).optional().describe("URL A."),
    url_b: z.string().max(2048).optional().describe("URL B."),
    url_c: z.string().max(2048).optional().describe("URL C."),
    vendor: z.string().max(64).optional().describe("Vendor.")
});

// Helper function to resolve host identifiers (ID, technical name, visible name, or IP) to host IDs
async function resolveHostIdentifiers(identifiers, logger) {
    if (!identifiers || identifiers.length === 0) {
        return { resolvedHostIds: [], errors: ["No host identifiers provided."] };
    }

    const resolvedHostIds = new Set();
    const localErrors = [];
    const notFoundIdentifiers = [];

    for (const identifier of identifiers) {
        let found = false;
        try {
            // Check if it's a numeric ID
            if (/^\d+$/.test(identifier)) { 
                const hostById = await api.getHosts({ hostids: [identifier], output: ["hostid"] });
                if (hostById && hostById.length > 0) {
                    resolvedHostIds.add(identifier);
                    found = true;
                }
            }
            
            // Check if it's an IP address
            if (!found && (/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$|([0-9a-fA-F]{0,4}:){1,7}[0-9a-fA-F]{0,4}/.test(identifier))) { 
                const interfaces = await api.getHostInterfaces({ 
                    filter: { ip: identifier }, 
                    output: ["hostid"] 
                });
                if (interfaces && interfaces.length > 0) {
                    interfaces.forEach(iface => resolvedHostIds.add(iface.hostid));
                    found = true;
                }
            }
            
            // Check by technical name or visible name
            if (!found) { 
                let hosts = await api.getHosts({
                    filter: { host: [identifier] }, 
                    output: ["hostid"]
                });
                if (hosts && hosts.length > 0) {
                    hosts.forEach(h => resolvedHostIds.add(h.hostid));
                    found = true;
                } else {
                    hosts = await api.getHosts({
                        filter: { name: [identifier] }, 
                        output: ["hostid"]
                    });
                    if (hosts && hosts.length > 0) {
                       hosts.forEach(h => resolvedHostIds.add(h.hostid));
                       found = true;
                    }
                }
            }
            
            if (!found) {
                notFoundIdentifiers.push(identifier);
            }

        } catch (e) {
            localErrors.push(`Error resolving identifier '${identifier}': ${e.message}`);
            logger.error(`Error resolving identifier '${identifier}':`, e);
        }
    }

    if (notFoundIdentifiers.length > 0) {
        localErrors.push(`Could not resolve the following identifiers to host IDs: ${notFoundIdentifiers.join(', ')}`);
    }
    return { resolvedHostIds: Array.from(resolvedHostIds), errors: localErrors };
}

function registerTools(server, { logger }) {
    // Tool: Get Hosts
    server.tool(
        'zabbix_host_get',
        'Retrieves Zabbix host information. Can filter by various criteria including direct IDs or by resolving host identifiers (names, IPs).',
        {
            hostIdentifiers: z.array(z.string()).optional()
                .describe("Array of host technical names, visible names, or IP addresses to resolve to IDs for filtering. Use this OR direct filter options like 'hostids' or 'filter'."),
            hostids: z.array(z.string()).optional().describe("Array of direct Zabbix Host IDs to retrieve."),
            groupids: z.array(z.string()).optional().describe("Array of group IDs to filter hosts by."),
            templateids: z.array(z.string()).optional().describe("Array of template IDs to filter hosts by."),
            filter: z.record(z.any()).optional().describe("Filter criteria (e.g., { status: 0, host: 'webserver01' })."),
            search: z.record(z.any()).optional().describe("Wildcard search criteria (e.g., { host: 'web*' }). Will search in 'host' (technical name) and 'name' (visible name) fields primarily."),
            output: schemas.outputFields.optional().default("extend")
                .describe("Properties to return. Defaults to 'extend'. Common options: ['hostid', 'host', 'name', 'status', 'error', 'available']."),
            selectGroups: schemas.outputFields.optional().default("extend")
                .describe("Include host group information. Use 'extend' for all group fields or specify an array like ['groupid', 'name']."),
            selectInterfaces: schemas.outputFields.optional().default("extend")
                .describe("Include host interface information. Use 'extend' for all interface fields or specify an array like ['interfaceid', 'ip', 'port', 'type']."),
            selectParentTemplates: schemas.outputFields.optional().default("extend")
                .describe("Include linked parent template information. Use 'extend' for all template fields or specify an array like ['templateid', 'name']."),
            selectMacros: schemas.outputFields.optional().describe("Include host macros. Use 'extend' for all macro fields or specify an array like ['macro', 'value']."),
            selectInventory: schemas.outputFields.optional()
                .describe("Include host inventory data. Use 'extend' for all inventory fields or specify an array of inventory property names (e.g. ['os', 'type'])."),
            selectItems: schemas.outputFields.optional().describe("Include items from the host."),
            selectTriggers: schemas.outputFields.optional().describe("Include triggers from the host."),
            selectTags: schemas.outputFields.optional().describe("Include host tags. Use 'extend' for all tag fields or specify an array like ['tag', 'value']."),
            selectValueMaps: schemas.outputFields.optional().describe("Include value maps used by the host. Use 'extend' for all value map fields."),
            selectHostDiscovery: schemas.outputFields.optional().describe("Include host discovery information. Use 'extend' for all discovery fields."),
            selectDiscoveryRule: schemas.outputFields.optional().describe("Include discovery rule that created the host. Use 'extend' for all rule fields."),
            limit: z.number().int().positive().optional().describe("Maximum number of hosts to return."),
            sortfield: z.union([z.string(), z.array(z.string())]).optional().describe("Field(s) to sort by (e.g., 'name', ['status', 'host'])."),
            sortorder: schemas.sortOrder.optional().describe("Sort order ('ASC' or 'DESC').")
        },
        async (args) => {
            try {
                let clientParams = { ...args };
                delete clientParams.hostIdentifiers;

                let resolutionMessages = [];

                if (args.hostIdentifiers && args.hostIdentifiers.length > 0) {
                    const { resolvedHostIds, errors } = await resolveHostIdentifiers(args.hostIdentifiers, logger);
                    
                    if (errors.length > 0) {
                        resolutionMessages.push(...errors.map(e => `Resolution error: ${e}`));
                    }

                    if (resolvedHostIds.length > 0) {
                        const existingHostIds = clientParams.hostids ? (Array.isArray(clientParams.hostids) ? clientParams.hostids : [clientParams.hostids]) : [];
                        clientParams.hostids = [...new Set([...existingHostIds, ...resolvedHostIds])];
                    } else if (args.hostIdentifiers.length > 0 && (!clientParams.hostids || clientParams.hostids.length === 0) && !Object.keys(clientParams).some(k => ['groupids', 'templateids', 'filter', 'search'].includes(k) && clientParams[k])) {
                        let message = `None of the provided host identifiers [${args.hostIdentifiers.join(', ')}] could be resolved to existing host IDs.`;
                        if (resolutionMessages.length > 0) message += `\n\nIdentifier Resolution Notes:\n- ${resolutionMessages.join('\n- ')}`;
                        return { content: [{ type: 'text', text: message }] };
                    }
                }
                
                const result = await api.getHosts(clientParams);
                
                let responseText = `Retrieved hosts:\n${JSON.stringify(result, null, 2)}`;
                if (resolutionMessages.length > 0) {
                    responseText += `\n\nIdentifier Resolution Notes:\n- ${resolutionMessages.join('\n- ')}`;
                }

                return { content: [{ type: 'text', text: responseText }] };
            } catch (error) {
                logger.error('Error getting hosts:', error);
                throw error;
            }
        }
    );

    // Tool: Create Host
    server.tool(
        'zabbix_host_create',
        'Creates a new host in Zabbix with specified groups, interfaces, and optional templates/macros.',
        {
            host: z.string().min(1).max(128).describe('Technical name of the host (e.g., srv-app-01).'),
            name: z.string().max(128).optional().describe('Visible name of the host. Defaults to technical name if not provided.'),
            groups: z.array(schemas.hostGroup).min(1)
                .describe('Array of host group objects to assign this host to. Each object must have "groupid".'),
            interfaces: z.array(interfaceSchema).min(1)
                .describe('Array of interface objects for the host.'),
            templates: z.array(schemas.template).optional()
                .describe('Array of template objects to link to the host. Each object must have "templateid".'),
            macros: z.array(schemas.macro).optional()
                .describe('Array of host macros (UserMacros).'),
            tags: z.array(tagSchema).optional()
                .describe('Array of host tags.'),
            inventory_mode: z.number().int().min(-1).max(1).optional().describe("Host inventory mode: -1 (disabled), 0 (manual), 1 (automatic)."),
            inventory: inventorySchema.optional().describe("Host inventory data."),
            description: z.string().max(65535).optional().describe('Host description.'),
            status: z.number().int().min(0).max(1).optional().default(0).describe('Host status: 0 (monitored), 1 (unmonitored).'),
            monitored_by: z.number().int().min(0).max(2).optional().describe("What monitors the host: 0 (server), 1 (proxy), 2 (proxy group)."),
            proxy_hostid: z.string().optional().describe("ID of the proxy that monitors the host. Use '0' if monitored by server."),
            proxy_groupid: z.string().optional().describe("ID of the proxy group that monitors the host."),
            tls_connect: z.number().int().min(1).max(4).optional().describe("Connections TO host: 1 (no encryption), 2 (PSK), 4 (certificate)."),
            tls_accept: z.number().int().min(1).max(7).optional().describe("Connections FROM host (bitmask): 1 (no encryption), 2 (PSK), 4 (certificate)."),
            tls_issuer: z.string().max(1024).optional().describe("Certificate issuer."),
            tls_subject: z.string().max(1024).optional().describe("Certificate subject."),
            tls_psk_identity: z.string().max(128).optional().describe("PSK identity."),
            tls_psk: z.string().max(512).optional().describe("PSK value (write-only)."),
            ipmi_authtype: z.number().int().min(-1).max(6).optional().describe("IPMI authentication algorithm: -1 (default), 0 (none), 1 (MD2), 2 (MD5), 4 (straight), 5 (OEM), 6 (RMCP+)."),
            ipmi_privilege: z.number().int().min(1).max(5).optional().describe("IPMI privilege level: 1 (callback), 2 (user), 3 (operator), 4 (admin), 5 (OEM)."),
            ipmi_username: z.string().max(16).optional().describe("IPMI username."),
            ipmi_password: z.string().max(20).optional().describe("IPMI password."),
            uuid: z.string().optional().describe("UUID of the host.")
        },
        async (args) => {
            try {
                const paramsForClient = { ...args };
                if (!paramsForClient.name) {
                    paramsForClient.name = paramsForClient.host;
                }

                const result = await api.createHost(paramsForClient);
                return { content: [{ type: 'text', text: `Host '${paramsForClient.host}' creation result:\n${JSON.stringify(result, null, 2)}` }] };
            } catch (error) {
                logger.error('Error creating host:', error);
                throw error;
            }
        }
    );

    // Tool: Update Host
    server.tool(
        'zabbix_host_update',
        'Updates properties of an existing Zabbix host. Provide only the hostid and the properties to change.',
        {
            hostid: schemas.hostId.describe("ID of the host to update."),
            host: z.string().max(128).optional().describe('New technical name of the host.'),
            name: z.string().max(128).optional().describe('New visible name of the host.'),
            groups: z.array(schemas.hostGroup).optional()
                .describe('Replaces ALL existing host group memberships. Array of objects with "groupid".'),
            interfaces: z.array(interfaceSchema).optional()
                .describe('Replaces ALL existing interfaces for the host.'),
            templates: z.array(schemas.template).optional()
                .describe('Replaces ALL currently linked templates. Array of objects with "templateid".'),
            templates_clear: z.array(schemas.template).optional()
                .describe('Templates to unlink and clear. Array of objects with "templateid".'),
            macros: z.array(z.object({
                hostmacroid: z.string().optional().describe("Macro ID for updating existing macro."),
                macro: z.string().describe("Macro name (including {$ and })."),
                value: z.string().describe("Macro value."),
                description: z.string().optional().describe("Macro description."),
                type: z.number().int().min(0).max(2).optional().describe("Macro type: 0 (text), 1 (secret), 2 (vault).")
            })).optional().describe('Replaces ALL existing host macros. Provide hostmacroid to update specific macro.'),
            tags: z.array(tagSchema).optional()
                .describe('Replaces ALL existing host tags.'),
            inventory_mode: z.number().int().min(-1).max(1).optional().describe("Host inventory mode: -1 (disabled), 0 (manual), 1 (automatic)."),
            inventory: inventorySchema.optional().describe("Host inventory data to update."),
            description: z.string().max(65535).optional().describe('New host description.'),
            status: z.number().int().min(0).max(1).optional().describe('Host status: 0 (monitored), 1 (unmonitored).'),
            monitored_by: z.number().int().min(0).max(2).optional().describe("What monitors the host: 0 (server), 1 (proxy), 2 (proxy group)."),
            proxy_hostid: z.string().optional().describe("ID of the proxy. Use '0' for Zabbix server."),
            proxy_groupid: z.string().optional().describe("ID of the proxy group."),
            tls_connect: z.number().int().min(1).max(4).optional().describe("Connections TO host: 1 (no encryption), 2 (PSK), 4 (certificate)."),
            tls_accept: z.number().int().min(1).max(7).optional().describe("Connections FROM host (bitmask): 1 (no encryption), 2 (PSK), 4 (certificate)."),
            tls_issuer: z.string().max(1024).optional().describe("Certificate issuer."),
            tls_subject: z.string().max(1024).optional().describe("Certificate subject."),
            tls_psk_identity: z.string().max(128).optional().describe("PSK identity."),
            tls_psk: z.string().max(512).optional().describe("PSK value (write-only)."),
            ipmi_authtype: z.number().int().min(-1).max(6).optional().describe("IPMI authentication algorithm: -1 (default), 0 (none), 1 (MD2), 2 (MD5), 4 (straight), 5 (OEM), 6 (RMCP+)."),
            ipmi_privilege: z.number().int().min(1).max(5).optional().describe("IPMI privilege level: 1 (callback), 2 (user), 3 (operator), 4 (admin), 5 (OEM)."),
            ipmi_username: z.string().max(16).optional().describe("IPMI username."),
            ipmi_password: z.string().max(20).optional().describe("IPMI password."),
            uuid: z.string().optional().describe("UUID of the host.")
        },
        async (args) => {
            try {
                const result = await api.updateHost(args);
                return { content: [{ type: 'text', text: `Host update result:\n${JSON.stringify(result, null, 2)}` }] };
            } catch (error) {
                logger.error('Error updating host:', error);
                throw error;
            }
        }
    );

    // Tool: Delete Hosts
    server.tool(
        'zabbix_host_delete',
        'Deletes one or more hosts from Zabbix.',
        {
            hostids: z.array(schemas.hostId).min(1).describe("Array of host IDs to delete.")
        },
        async (args) => {
            try {
                const result = await api.deleteHosts(args.hostids);
                return { content: [{ type: 'text', text: `Host deletion result:\n${JSON.stringify(result, null, 2)}` }] };
            } catch (error) {
                logger.error('Error deleting hosts:', error);
                throw error;
            }
        }
    );
}

module.exports = { registerTools }; 