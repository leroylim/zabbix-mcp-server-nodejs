const { zabbixRequest, ensureLogin } = require('./client');

// Host Functions
async function getHosts(options = { output: ['hostid', 'host', 'name', 'status'], selectInterfaces: ['ip', 'port', 'type', 'main'] }) {
    await ensureLogin();
    return zabbixRequest('host.get', options);
}

async function createHost(params) {
    await ensureLogin();
    if (!params.host || !params.groups || !params.interfaces) {
        throw new Error("Parameters 'host' (technical name), 'groups', and 'interfaces' are required for creating a host.");
    }
    return zabbixRequest('host.create', params);
}

async function updateHost(params) {
    await ensureLogin();
    if (!params || !params.hostid) {
        throw new Error("Parameter 'hostid' is required for updating a host.");
    }
    return zabbixRequest('host.update', params);
}

async function deleteHosts(hostIds) {
    await ensureLogin();
    if (!Array.isArray(hostIds) || hostIds.length === 0 || !hostIds.every(id => typeof id === 'string')) {
        throw new Error("deleteHosts expects a non-empty array of string host IDs.");
    }
    return zabbixRequest('host.delete', hostIds);
}

async function getHostInterfaces(options = { output: "extend" }) {
    await ensureLogin();
    return zabbixRequest('hostinterface.get', options);
}

async function getHostMacros(hostIds) {
    await ensureLogin();
    if (!Array.isArray(hostIds) || hostIds.length === 0) {
        throw new Error("getHostMacros expects a non-empty array of host IDs.");
    }
    return zabbixRequest('usermacro.get', { hostids: hostIds, output: "extend" });
}

async function updateHostMacros(hostId, macros) {
    await ensureLogin();
    if (!hostId || !Array.isArray(macros)) {
        throw new Error("updateHostMacros expects a hostId and an array of macros.");
    }
    return zabbixRequest('usermacro.update', { hostid: hostId, macros: macros });
}

module.exports = {
    getHosts,
    createHost,
    updateHost,
    deleteHosts,
    getHostInterfaces,
    getHostMacros,
    updateHostMacros
}; 