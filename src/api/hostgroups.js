const { zabbixRequest, ensureLogin } = require('./client');

// Host Group Functions
async function getHostGroups(options = { output: "extend" }) {
    await ensureLogin();
    return zabbixRequest('hostgroup.get', options);
}

async function createHostGroup(params) {
    await ensureLogin();
    if (!params || !params.name) {
        throw new Error("Parameter 'name' is required for creating a host group.");
    }
    return zabbixRequest('hostgroup.create', params);
}

async function updateHostGroup(params) {
    await ensureLogin();
    if (!params || !params.groupid) {
        throw new Error("Parameter 'groupid' is required for updating a host group.");
    }
    return zabbixRequest('hostgroup.update', params);
}

async function deleteHostGroups(groupIds) {
    await ensureLogin();
    if (!Array.isArray(groupIds) || groupIds.length === 0 || !groupIds.every(id => typeof id === 'string')) {
        throw new Error("deleteHostGroups expects a non-empty array of string group IDs.");
    }
    return zabbixRequest('hostgroup.delete', groupIds);
}

module.exports = {
    getHostGroups,
    createHostGroup,
    updateHostGroup,
    deleteHostGroups
}; 