const { zabbixRequest, ensureLogin } = require('./client');

// Problem Functions
async function getProblems(options = { output: "extend", recent: true, sortfield: "eventid", sortorder: "DESC" }) {
    await ensureLogin();
    return zabbixRequest('problem.get', options);
}

async function getEvents(options = { output: "extend", sortfield: ["clock", "eventid"], sortorder: "DESC", limit: 100 }) {
    await ensureLogin();
    return zabbixRequest('event.get', options);
}

async function acknowledgeEvent(eventIds, message, actionOptions = { action: 0 }) {
    await ensureLogin();
    if (!Array.isArray(eventIds) || eventIds.length === 0) {
        throw new Error("acknowledgeEvent expects a non-empty array of event IDs.");
    }
    const params = {
        eventids: eventIds,
        message: message || "Acknowledged via MCP",
        ...actionOptions
    };
    return zabbixRequest('event.acknowledge', params);
}

module.exports = {
    getProblems,
    getEvents,
    acknowledgeEvent
}; 