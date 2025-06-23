const api = require('../api');
const { logger } = require('../utils/logger');
const { z } = require('zod');
const schemas = require('./schemas');

// Helper function to resolve host identifiers (ID, technical name, visible name, or IP) to host IDs
async function resolveHostIdentifiers(identifiers) {
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

function registerTools(server) {
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
                    const { resolvedHostIds, errors } = await resolveHostIdentifiers(args.hostIdentifiers);
                    
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
            host: z.string().min(1).describe('Technical name of the host (e.g., srv-app-01).'),
            name: z.string().optional().describe('Visible name of the host. Defaults to technical name if not provided.'),
            groups: z.array(schemas.hostGroup).min(1)
                .describe('Array of host group objects to assign this host to. Each object must have "groupid".'),
            interfaces: z.array(schemas.interface).min(1)
                .describe('Array of interface objects for the host.'),
            templates: z.array(schemas.template).optional()
                .describe('Array of template objects to link to the host. Each object must have "templateid".'),
            macros: z.array(schemas.macro).optional()
                .describe('Array of host macros (UserMacros).'),
            inventory_mode: z.number().int().min(-1).max(1).optional().describe("Host inventory mode: -1 (disabled), 0 (manual), 1 (automatic)."),
            description: z.string().optional().describe('Host description.'),
            status: z.number().int().min(0).max(1).optional().default(0).describe('Host status: 0 (monitored), 1 (unmonitored).'),
            proxy_hostid: z.string().optional().describe("ID of the proxy that monitors the host. Use '0' if monitored by server."),
            tls_connect: z.number().int().optional().describe("Connections TO host: 1-No enc, 2-PSK, 4-Cert."),
            tls_accept: z.number().int().optional().describe("Connections FROM host: 1-No enc, 2-PSK, 4-Cert (bitmask)."),
            tls_issuer: z.string().optional(),
            tls_subject: z.string().optional(),
            tls_psk_identity: z.string().optional(),
            tls_psk: z.string().optional().describe("PSK value (write-only).")
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
            host: z.string().optional().describe('New technical name of the host.'),
            name: z.string().optional().describe('New visible name of the host.'),
            groups: z.array(schemas.hostGroup).optional()
                .describe('Replaces ALL existing host group memberships. Array of objects with "groupid".'),
            interfaces: z.array(z.object({
                interfaceid: z.string().optional().describe("ID of existing interface to update. If omitted, new interface is created (and old ones removed)."),
                type: z.number().int().min(1).max(4), 
                main: z.number().int().min(0).max(1),
                useip: z.number().int().min(0).max(1), 
                ip: z.string().ip().optional(), 
                dns: z.string().optional(), 
                port: z.string(),
                details: z.any().optional()
            })).optional().describe('Replaces ALL existing interfaces for the host.'),
            templates: z.array(schemas.template).optional()
                .describe('Replaces ALL currently linked templates. Array of objects with "templateid".'),
            templates_clear: z.array(schemas.template).optional()
                .describe('Templates to unlink and clear. Array of objects with "templateid".'),
            macros: z.array(z.object({
                hostmacroid: z.string().optional(),
                macro: z.string(),
                value: z.string(),
                description: z.string().optional(),
                type: z.number().int().min(0).max(2).optional()
            })).optional().describe('Replaces ALL existing host macros. Provide hostmacroid to update specific macro.'),
            inventory_mode: z.number().int().min(-1).max(1).optional(),
            inventory: z.record(z.string(), z.any()).optional().describe("Object with inventory fields to update, e.g., { os: 'New OS', type: 'Server X' }."),
            description: z.string().optional(),
            status: z.number().int().min(0).max(1).optional().describe('Host status: 0 (monitored), 1 (unmonitored).'),
            proxy_hostid: z.string().optional().describe("ID of the proxy. Use '0' for Zabbix server."),
            tls_connect: z.number().int().optional(), 
            tls_accept: z.number().int().optional()
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