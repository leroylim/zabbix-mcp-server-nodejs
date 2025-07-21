const api = require('../api');
const { logger } = require('../utils/logger');
const { z } = require('zod');
const schemas = require('./schemas');
const diff = require('diff');

// Helper function to resolve host identifiers (ID, technical name, visible name, or IP) to host IDs
async function resolveHostIdentifier(identifier) {
    if (!identifier) {
        return { hostId: null, error: "No host identifier provided." };
    }

    // Check if it's a numeric ID
    if (/^\d+$/.test(identifier)) {
        const hostById = await api.getHosts({ hostids: [identifier], output: ["hostid"] });
        if (hostById && hostById.length > 0) {
            return { hostId: identifier, error: null };
        }
    }

    // Check if it's an IP address
    if (/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$|([0-9a-fA-F]{0,4}:){1,7}[0-9a-fA-F]{0,4}/.test(identifier)) {
        const interfaces = await api.getHostInterfaces({
            filter: { ip: identifier },
            output: ["hostid"]
        });
        if (interfaces && interfaces.length > 0) {
            return { hostId: interfaces[0].hostid, error: null };
        }
    }

    // Check by technical name or visible name
    let hosts = await api.getHosts({
        filter: { host: [identifier] },
        output: ["hostid"]
    });
    if (hosts && hosts.length > 0) {
        return { hostId: hosts[0].hostid, error: null };
    }

    hosts = await api.getHosts({
        filter: { name: [identifier] },
        output: ["hostid"]
    });
    if (hosts && hosts.length > 0) {
        return { hostId: hosts[0].hostid, error: null };
    }

    return { hostId: null, error: `Could not resolve identifier '${identifier}' to a host ID.` };
}


function registerTools(server) {
    // Tool: Get Host Diagnostics
    server.tool(
        'zabbix_get_host_diagnostics',
        'Retrieves a comprehensive diagnostic report for a single host, including its properties, problems, and recent history for key items.',
        {
            hostIdentifier: z.string().describe("The technical name, visible name, IP address, or ID of the host to diagnose."),
            historyItemKeys: z.array(z.string()).optional().describe("An array of item keys (e.g., system.cpu.load[,avg1]) to retrieve history for. Defaults to common CPU, memory, and network items if not provided.")
        },
        async ({ hostIdentifier, historyItemKeys }) => {
            try {
                const { hostId, error } = await resolveHostIdentifier(hostIdentifier);

                if (error) {
                    return { content: [{ type: 'text', text: error }] };
                }

                // 1. Get Host Details
                const hosts = await api.getHosts({
                    hostids: [hostId],
                    selectInterfaces: 'extend',
                    selectParentTemplates: 'extend',
                    selectMacros: 'extend',
                    selectInventory: 'extend',
                    selectTriggers: 'count',
                    selectItems: 'count'
                });

                if (!hosts || hosts.length === 0) {
                    return { content: [{ type: 'text', text: `Host with ID '${hostId}' not found.` }] };
                }
                const hostDetails = hosts[0];

                // 2. Get Active Problems for the host
                const problems = await api.getProblems({
                    hostids: [hostId],
                    sortfield: ["clock"],
                    sortorder: "DESC"
                });

                // 3. Get History for specified (or default) items
                let history = {};
                const itemKeysToFetch = historyItemKeys || [
                    'system.cpu.load[,avg1]',
                    'vm.memory.size[pavailable]',
                    'net.if.in[eth0]',
                    'net.if.out[eth0]'
                ];

                const items = await api.getItems({
                    hostids: [hostId],
                    search: {
                        key_: itemKeysToFetch
                    },
                    output: ['itemid', 'key_', 'value_type']
                });

                for (const item of items) {
                    const itemHistory = await api.getHistory({
                        itemids: [item.itemid],
                        history: item.value_type,
                        limit: 10,
                        sortfield: "clock",
                        sortorder: "DESC"
                    });
                    history[item.key_] = itemHistory;
                }

                // 4. Assemble the report
                const report = {
                    host: hostDetails,
                    activeProblems: problems,
                    recentHistory: history
                };

                return { content: [{ type: 'text', text: `Host Diagnostics Report for ${hostDetails.name}:\n${JSON.stringify(report, null, 2)}` }] };

            } catch (e) {
                logger.error('Error in zabbix_get_host_diagnostics:', e);
                throw e;
            }
        }
    );

    // Tool: Compare Hosts
    server.tool(
        'zabbix_compare_hosts',
        'Compares the configuration of two hosts and highlights the differences.',
        {
            hostIdentifierA: z.string().describe("The identifier for the first host (name, IP, or ID)."),
            hostIdentifierB: z.string().describe("The identifier for the second host (name, IP, or ID).")
        },
        async ({ hostIdentifierA, hostIdentifierB }) => {
            try {
                const { hostId: hostIdA, error: errorA } = await resolveHostIdentifier(hostIdentifierA);
                if (errorA) return { content: [{ type: 'text', text: `Error for Host A: ${errorA}` }] };

                const { hostId: hostIdB, error: errorB } = await resolveHostIdentifier(hostIdentifierB);
                if (errorB) return { content: [{ type: 'text', text: `Error for Host B: ${errorB}` }] };

                const [hostA] = await api.getHosts({
                    hostids: [hostIdA],
                    selectParentTemplates: ['templateid', 'name'],
                    selectMacros: 'extend',
                    selectInterfaces: 'extend'
                });

                const [hostB] = await api.getHosts({
                    hostids: [hostIdB],
                    selectParentTemplates: ['templateid', 'name'],
                    selectMacros: 'extend',
                    selectInterfaces: 'extend'
                });

                if (!hostA || !hostB) {
                    return { content: [{ type: 'text', text: "Could not find one or both hosts." }] };
                }

                // Normalize and sort for consistent comparison
                const normalize = (host) => {
                    // Sort arrays of objects by a key to ensure consistent order
                    if (host.parentTemplates) host.parentTemplates.sort((a, b) => a.name.localeCompare(b.name));
                    if (host.macros) host.macros.sort((a, b) => a.macro.localeCompare(b.macro));
                    if (host.interfaces) host.interfaces.sort((a, b) => a.ip.localeCompare(b.ip));
                    return host;
                };

                const strA = JSON.stringify(normalize(hostA), null, 2);
                const strB = JSON.stringify(normalize(hostB), null, 2);

                const differences = diff.createPatch('HostComparison.json', strA, strB, hostA.name, hostB.name);

                return { content: [{ type: 'text', text: `Configuration difference between ${hostA.name} and ${hostB.name}:\n${differences}` }] };

            } catch (e) {
                logger.error('Error in zabbix_compare_hosts:', e);
                throw e;
            }
        }
    );

    // Tool: Audit Unmonitored Hosts
    server.tool(
        'zabbix_audit_unmonitored_hosts',
        'Finds and reports hosts that are not being monitored correctly, including those set to unmonitored status or with availability errors.',
        {
            hostGroupIds: z.array(z.string()).optional().describe('Optional array of host group IDs to limit the audit to.')
        },
        async ({ hostGroupIds }) => {
            try {
                const params = {
                    output: ['hostid', 'name', 'status', 'error', 'available'],
                    ...(hostGroupIds && { groupids: hostGroupIds })
                };

                const allHosts = await api.getHosts(params);

                const unmonitoredHosts = allHosts.filter(h => h.status === '1');
                const availabilityErrors = allHosts.filter(h => h.available === '2');

                const report = {
                    unmonitoredHosts: unmonitoredHosts.map(h => ({ name: h.name, hostid: h.hostid, error: h.error })),
                    hostsWithAvailabilityErrors: availabilityErrors.map(h => ({ name: h.name, hostid: h.hostid, error: h.error })),
                    summary: {
                        totalHostsChecked: allHosts.length,
                        unmonitoredCount: unmonitoredHosts.length,
                        availabilityErrorCount: availabilityErrors.length
                    }
                };

                return { content: [{ type: 'text', text: `Unmonitored Hosts Audit Report:\n${JSON.stringify(report, null, 2)}` }] };

            } catch (e) {
                logger.error('Error in zabbix_audit_unmonitored_hosts:', e);
                throw e;
            }
        }
    );

    // Tool: Template Audit
    server.tool(
        'zabbix_template_audit',
        'Analyzes template usage to find unlinked templates, hosts without templates, and potentially oversized templates.',
        {
            itemThreshold: z.number().int().optional().default(100).describe("The threshold for the number of items to consider a template 'oversized'."),
            triggerThreshold: z.number().int().optional().default(50).describe("The threshold for the number of triggers to consider a template 'oversized'.")
        },
        async ({ itemThreshold, triggerThreshold }) => {
            try {
                const [allTemplates, allHosts] = await Promise.all([
                    api.getTemplates({
                        output: ['templateid', 'name'],
                        selectHosts: ['hostid'],
                        selectItems: 'count',
                        selectTriggers: 'count'
                    }),
                    api.getHosts({
                        output: ['hostid', 'name'],
                        selectParentTemplates: ['templateid']
                    })
                ]);

                const unlinkedTemplates = allTemplates.filter(t => t.hosts.length === 0);
                const hostsWithoutTemplates = allHosts.filter(h => h.parentTemplates.length === 0);
                const oversizedTemplates = allTemplates.filter(t => t.items > itemThreshold || t.triggers > triggerThreshold);

                const report = {
                    unlinkedTemplates: unlinkedTemplates.map(t => ({ name: t.name, templateid: t.templateid })),
                    hostsWithoutTemplates: hostsWithoutTemplates.map(h => ({ name: h.name, hostid: h.hostid })),
                    oversizedTemplates: oversizedTemplates.map(t => ({ name: t.name, templateid: t.templateid, itemCount: t.items, triggerCount: t.triggers })),
                    summary: {
                        totalTemplatesChecked: allTemplates.length,
                        totalHostsChecked: allHosts.length,
                        unlinkedTemplateCount: unlinkedTemplates.length,
                        hostsWithoutTemplateCount: hostsWithoutTemplates.length,
                        oversizedTemplateCount: oversizedTemplates.length
                    }
                };

                return { content: [{ type: 'text', text: `Template Audit Report:\n${JSON.stringify(report, null, 2)}` }] };

            } catch (e) {
                logger.error('Error in zabbix_template_audit:', e);
                throw e;
            }
        }
    );
}

module.exports = { registerTools };
