// zabbixApiClient.js
// Module for interacting with the Zabbix API.

const https = require('https'); // For custom HTTPS agent (self-signed certs)
const axios = require('axios');

// --- Zabbix API Client Configuration ---
// These should be configured appropriately before use.
const ZABBIX_API_URL = 'https://monitoring.sipef.com/api_jsonrpc.php'; // Using your confirmed URL
const ZABBIX_USER = 'Admin'; // This will be the value for the 'username' parameter
const ZABBIX_PASSWORD = 'zabbix'; // Replace with your actual Zabbix API password
const ZABBIX_IGNORE_SELFSIGNED_CERT = true; // SET TO TRUE TO IGNORE SELF-SIGNED CERT ERRORS (USE WITH CAUTION)

let authToken = null;

// Custom HTTPS agent for ignoring self-signed certificates
const httpsAgent = ZABBIX_IGNORE_SELFSIGNED_CERT && ZABBIX_API_URL.startsWith('https://')
    ? new https.Agent({ rejectUnauthorized: false })
    : undefined;

/**
 * Makes a generic request to the Zabbix API.
 * This is the core function for all API interactions.
 * @param {string} method - The Zabbix API method (e.g., 'host.get', 'item.create').
 * @param {object|Array} params - The parameters for the API method.
 * @param {string|null} token - The authentication token. If null, uses the module's cached authToken.
 * @returns {Promise<object>} - The result part of the Zabbix API response.
 * @throws {Error} If the API call fails or returns an error.
 */
async function zabbixRequest(method, params, token = null) {
    const currentToken = token || authToken; 
    const requestId = Date.now() + Math.random().toString(36).substring(2,7);

    const requestBody = {
        jsonrpc: '2.0',
        method: method,
        params: params,
        id: requestId,
    };

    if (currentToken && method !== 'apiinfo.version' && method !== 'user.login') {
        requestBody.auth = currentToken;
    }

    const loggedParams = method === 'user.login' ? { username: params.username, password: '***' } : params;
    // Basic logging; avoid logging potentially very large data like full history.get responses
    if (method === 'history.get' && params.itemids && Array.isArray(params.itemids) && params.itemids.length > 5) {
        console.error(`[Zabbix API Client] Sending Request (${requestId}): ${method}, itemids: [${params.itemids.slice(0,3).join(',')}, ... (${params.itemids.length} total)], other params:`, JSON.stringify({...params, itemids: `Array[${params.itemids.length}]`}));
    } else if (method === 'history.push' && Array.isArray(params) && params.length > 5) {
         console.error(`[Zabbix API Client] Sending Request (${requestId}): ${method}, data points: ${params.length}`);
    } else {
        console.error(`[Zabbix API Client] Sending Request (${requestId}): ${method}`, JSON.stringify(loggedParams, null, 2));
    }

    try {
        const response = await axios.post(ZABBIX_API_URL, requestBody, {
            headers: { 'Content-Type': 'application/json-rpc' },
            timeout: 120000, 
            httpsAgent: httpsAgent 
        });

        if (response.data.error) {
            throw new Error(`Zabbix API Error (Method: ${method}, ID: ${requestId}): ${response.data.error.message} - ${response.data.error.data} (Code: ${response.data.error.code})`);
        }
        return response.data.result;
    } catch (error) {
        let errorMessage = `Error for Zabbix API method ${method} (ID: ${requestId}): `;
        if (error.response) { 
            errorMessage += `HTTP Error: ${error.response.status}. Response Data: ${JSON.stringify(error.response.data)}`;
        } else if (error.request) { 
            errorMessage += `No Response from server. Check network, ZABBIX_API_URL, or SSL settings (ZABBIX_IGNORE_SELFSIGNED_CERT).`;
        } else if (error.message && error.message.startsWith('Zabbix API Error:')) { 
             errorMessage = error.message;
        } else { 
            errorMessage += `Request Setup Error: ${error.message}`;
        }
        console.error(`[Zabbix API Client] Full error for ${method}:`, error.message, error.stack); 
        throw new Error(errorMessage); 
    }
}

/**
 * Ensures the user is logged in and the authToken is valid.
 * Attempts to re-login if the token is found to be invalid.
 * @returns {Promise<string>} The authentication token.
 */
async function ensureLogin() {
    if (!authToken) {
        console.error('[Zabbix API Client] No auth token found, attempting initial login.');
        await login();
    } else {
        try {
            await zabbixRequest('apiinfo.version', {}, authToken); 
        } catch (error) {
            if (error.message && (error.message.toLowerCase().includes("not authorised") || error.message.toLowerCase().includes("session id is not known") || error.message.toLowerCase().includes("no permissions"))) {
                console.error('[Zabbix API Client] Auth token seems invalid or insufficient permissions, attempting to re-login.');
                await login(); 
            } else {
                // Don't log a warning for every apiinfo check if the error is not auth-related, could be spammy.
                // console.warn(`[Zabbix API Client] apiinfo.version check failed with non-auth error: ${error.message}. Proceeding with existing token.`);
            }
        }
    }
    return authToken;
}


// --- Specific Zabbix API Wrapper Functions ---

async function login() {
    console.error('[Zabbix API Client] Attempting to log in to Zabbix...');
    const params = { username: ZABBIX_USER, password: ZABBIX_PASSWORD };
    try {
        const result = await zabbixRequest('user.login', params); 
        authToken = result; 
        console.error('[Zabbix API Client] Successfully logged in. Auth token obtained.');
        return authToken;
    } catch (error) {
        console.error('[Zabbix API Client] Login failed:', error.message);
        authToken = null; 
        throw error;
    }
}

async function logout() {
    if (!authToken) {
        console.error('[Zabbix API Client] Not logged in, no need to logout.');
        return true;
    }
    console.error('[Zabbix API Client] Attempting to log out from Zabbix...');
    try {
        const result = await zabbixRequest('user.logout', [], authToken);
        if (result === true || (typeof result === 'object' && Object.keys(result).length === 0) || (Array.isArray(result) && result.length === 0) ) {
            console.error('[Zabbix API Client] Successfully logged out.');
            authToken = null;
            return true;
        }
        console.warn('[Zabbix API Client] Logout might not have been fully successful, unexpected response:', result);
        authToken = null; 
        return false; 
    } catch (error) {
        console.error('[Zabbix API Client] Logout failed:', error.message);
        authToken = null; 
        throw error;
    }
}

async function getApiVersion() {
    console.error('[Zabbix API Client] Fetching Zabbix API version...');
    try {
        const version = await zabbixRequest('apiinfo.version', {});
        console.error(`[Zabbix API Client] Zabbix API Version: ${version}`);
        return version;
    } catch (error) {
        console.error('[Zabbix API Client] Failed to get API version:', error.message);
        throw error;
    }
}

// --- Host Group Functions (Ensure full CRUD) ---
async function getHostGroups(options = { output: "extend" }) {
    await ensureLogin();
    return zabbixRequest('hostgroup.get', options, authToken);
}

async function createHostGroup(params) { // Changed to accept a params object
    await ensureLogin();
    if (!params || !params.name) {
        throw new Error("Parameter 'name' is required for creating a host group.");
    }
    return zabbixRequest('hostgroup.create', params, authToken);
}

async function updateHostGroup(params) { // Expects params like { groupid: "ID", name: "New Name", ... }
    await ensureLogin();
    if (!params || !params.groupid) {
        throw new Error("Parameter 'groupid' is required for updating a host group.");
    }
    return zabbixRequest('hostgroup.update', params, authToken);
}

async function deleteHostGroups(groupIds) { // Expects an array of group IDs
    await ensureLogin();
    if (!Array.isArray(groupIds) || groupIds.length === 0 || !groupIds.every(id => typeof id === 'string')) {
        throw new Error("deleteHostGroups expects a non-empty array of string group IDs.");
    }
    return zabbixRequest('hostgroup.delete', groupIds, authToken);
}

// --- Host Functions ---
async function getHosts(options = { output: ['hostid', 'host', 'name', 'status'], selectInterfaces: ['ip', 'port', 'type', 'main'] }) {
    await ensureLogin();
    return zabbixRequest('host.get', options, authToken);
}

async function createHost(params) { // Changed to accept a single params object
    await ensureLogin();
    if (!params.host || !params.groups || !params.interfaces) {
        throw new Error("Parameters 'host' (technical name), 'groups', and 'interfaces' are required for creating a host.");
    }
    // Ensure groups and templates are array of objects if present
    if (params.groups && Array.isArray(params.groups) && params.groups.every(id => typeof id === 'string')) {
        params.groups = params.groups.map(id => ({ groupid: id }));
    }
    if (params.templates && Array.isArray(params.templates) && params.templates.every(id => typeof id === 'string')) {
        params.templates = params.templates.map(id => ({ templateid: id }));
    }
    // Interfaces array of objects is expected by Zod schema in MCP tool
    return zabbixRequest('host.create', params, authToken);
}

async function updateHost(params) { // Changed to accept a single params object including hostid
    await ensureLogin();
    if (!params.hostid) {
        throw new Error("Parameter 'hostid' is required for updating a host.");
    }
    // Ensure groups and templates are array of objects if present and being updated
    if (params.groups && Array.isArray(params.groups) && params.groups.every(id => typeof id === 'string')) {
        params.groups = params.groups.map(id => ({ groupid: id }));
    }
    if (params.templates && Array.isArray(params.templates) && params.templates.every(id => typeof id === 'string')) {
        params.templates = params.templates.map(id => ({ templateid: id }));
    }
    // For templates_clear, Zabbix API expects an array of objects like [{templateid: "ID"}]
    if (params.templates_clear && Array.isArray(params.templates_clear) && params.templates_clear.every(id => typeof id === 'string')) {
        params.templates_clear = params.templates_clear.map(id => ({ templateid: id }));
    }
    // Interfaces array of objects is expected by Zod schema in MCP tool for updates
    return zabbixRequest('host.update', params, authToken);
}

async function deleteHosts(hostIds) { // Expects an array of host IDs
    await ensureLogin();
    if (!Array.isArray(hostIds) || hostIds.length === 0 || !hostIds.every(id => typeof id === 'string')) {
        throw new Error("deleteHosts expects a non-empty array of string host IDs.");
    }
    return zabbixRequest('host.delete', hostIds, authToken);
}

// --- Item Functions (Ensure full CRUD, including single update/delete) ---
async function getItems(params = { output: "extend" }) { // Renamed options to params
    await ensureLogin();
    return zabbixRequest('item.get', params, authToken);
}

async function createItemDetailed(params) { // Expects a single item object as params
    await ensureLogin();
    if (!params.name || !params.key_ || !params.hostid || typeof params.type === 'undefined' || typeof params.value_type === 'undefined') {
        throw new Error("Parameters 'name', 'key_', 'hostid', 'type', and 'value_type' are required for creating an item.");
    }
    // Ensure applications are in the correct format if provided as array of strings
    if (params.applications && Array.isArray(params.applications) && params.applications.every(app => typeof app === 'string')) {
        params.applications = params.applications.map(appId => ({ applicationid: appId }));
    }
    // Preprocessing and tags are expected as arrays of objects by the API.
    return zabbixRequest('item.create', params, authToken);
}

async function updateItem(params) { // Expects a single item object with itemid and fields to update
    await ensureLogin();
    if (!params.itemid) {
        throw new Error("Parameter 'itemid' is required for updating an item.");
    }
    // Ensure applications are in the correct format if provided as array of strings for update
    if (params.applications && Array.isArray(params.applications) && params.applications.every(app => typeof app === 'string')) {
        params.applications = params.applications.map(appId => ({ applicationid: appId }));
    }
    // Preprocessing and tags are expected as arrays of objects by the API for update as well.
    return zabbixRequest('item.update', params, authToken);
}

async function deleteItems(itemIds) { // Expects an array of item IDs
    await ensureLogin();
    if (!Array.isArray(itemIds) || itemIds.length === 0 || !itemIds.every(id => typeof id === 'string')) {
        throw new Error("deleteItems expects a non-empty array of string item IDs.");
    }
    return zabbixRequest('item.delete', itemIds, authToken);
}

async function massUpdateItems(params) {
    await ensureLogin();
    // Ensure 'items', 'hosts', 'groups', 'templates' arrays are correctly formatted if provided
    if (params.items && Array.isArray(params.items) && params.items.every(id => typeof id === 'string')) {
        params.items = params.items.map(id => ({ itemid: id }));
    }
    if (params.hosts && Array.isArray(params.hosts) && params.hosts.every(id => typeof id === 'string')) {
        params.hosts = params.hosts.map(id => ({ hostid: id }));
    }
    // ... similar checks for groups, templates if your massUpdate tool supports them as flat ID arrays
    return zabbixRequest('item.massupdate', params, authToken); // Note: API method is item.massupdate
}

async function getLatestDataForItems(itemGetParams) {
    await ensureLogin();
    return zabbixRequest('item.get', itemGetParams, authToken);
}

// --- Trigger Functions ---
async function getTriggers(options = { output: "extend", selectHosts: ["host"], sortfield: "priority", sortorder: "DESC", filter: { value: 1 }, skipDependent: true, expandDescription: true }) {
    await ensureLogin();
    return zabbixRequest('trigger.get', options, authToken);
}
async function createTriggerDetailed(triggerParams) { 
    await ensureLogin();
    return zabbixRequest('trigger.create', triggerParams, authToken);
}
async function updateTrigger(triggerId, updateParams) {
    await ensureLogin();
    return zabbixRequest('trigger.update', { triggerid: triggerId, ...updateParams }, authToken);
}
async function deleteTriggers(triggerIds) {
    await ensureLogin();
    return zabbixRequest('trigger.delete', triggerIds, authToken);
}

// --- Event & Problem Functions ---
async function getProblems(options = { output: "extend", recent: true, sortfield: "eventid", sortorder: "DESC" }) { // Corrected default sortfield
    await ensureLogin();
    if (options.hasOwnProperty('recent')) {
        if (typeof options.recent === 'string') options.recent = (options.recent.toLowerCase() === 'true');
        else if (typeof options.recent !== 'boolean') {
            console.warn(`[Zabbix API Client] problem.get: 'recent' parameter was not boolean or string "true"/"false", defaulting to true. Received: ${options.recent}`);
            options.recent = true; 
        }
    } else if (options.recent === undefined) {
         options.recent = true;
    }
    // Ensure sortorder matches sortfield structure if sortfield is an array
    if (Array.isArray(options.sortfield) && typeof options.sortorder === 'string' && options.sortfield.length > 1) {
        options.sortorder = options.sortfield.map(() => options.sortorder);
    }
    return zabbixRequest('problem.get', options, authToken);
}
async function getEvents(options = { output: "extend", sortfield: ["clock", "eventid"], sortorder: "DESC", limit: 100 }) {
    await ensureLogin();
    return zabbixRequest('event.get', options, authToken);
}
async function acknowledgeEvent(eventIds, message, actionOptions = { action: 0 }) {
    await ensureLogin();
    const params = {
        eventids: Array.isArray(eventIds) ? eventIds : [eventIds], 
        message: message,
        ...actionOptions
    };
    return zabbixRequest('event.acknowledge', params, authToken);
}

// --- History & Trend Functions ---
async function getHistory(options) { 
    await ensureLogin();
    return zabbixRequest('history.get', options, authToken);
}
async function getTrends(options) { 
    await ensureLogin();
    return zabbixRequest('trend.get', options, authToken);
}
async function pushHistoryData(data) { 
    await ensureLogin(); 
    return zabbixRequest('history.push', data, authToken);
}

// --- Maintenance Functions (CRUD Wrappers - Refined) ---
async function getMaintenances(params = { output: "extend" }) { // Renamed options to params
    await ensureLogin();
    return zabbixRequest('maintenance.get', params, authToken);
}

async function createMaintenance(params) { // Expects a single maintenance object
    await ensureLogin();
    // Required: name, active_since, active_till, timeperiods
    // Also, either hosts or groups (not hostids/groupids directly as top-level in API params object)
    if (!params.name || typeof params.active_since === 'undefined' || typeof params.active_till === 'undefined' || !params.timeperiods) {
        throw new Error("Parameters 'name', 'active_since', 'active_till', and 'timeperiods' are required for creating maintenance.");
    }
    if (!params.hosts && !params.groups) {
        throw new Error("Either 'hosts' (array of {hostid:'ID'}) or 'groups' (array of {groupid:'ID'}) must be provided for creating maintenance.");
    }
    // Ensure hosts/groups are array of objects if provided
    if (params.hosts && Array.isArray(params.hosts) && params.hosts.every(h => typeof h === 'string')) {
        params.hosts = params.hosts.map(id => ({ hostid: id }));
    }
    if (params.groups && Array.isArray(params.groups) && params.groups.every(g => typeof g === 'string')) {
        params.groups = params.groups.map(id => ({ groupid: id }));
    }
    // The Zabbix API 'maintenance.create' takes an array of maintenance objects,
    // but our MCP tool will create one at a time, so we send a single object.
    // If the API strictly needs an array, it would be [params].
    // However, typically for create, if you send a single object, it's accepted.
    // Let's assume params IS the single maintenance object.
    return zabbixRequest('maintenance.create', params, authToken);
}

async function updateMaintenance(params) { // Expects a single maintenance object with maintenanceid
    await ensureLogin();
    if (!params.maintenanceid) {
        throw new Error("Parameter 'maintenanceid' is required for updating maintenance.");
    }
    // Similar mapping for hosts/groups if they are being updated
    if (params.hosts && Array.isArray(params.hosts) && params.hosts.every(h => typeof h === 'string')) {
        params.hosts = params.hosts.map(id => ({ hostid: id }));
    }
    if (params.groups && Array.isArray(params.groups) && params.groups.every(g => typeof g === 'string')) {
        params.groups = params.groups.map(id => ({ groupid: id }));
    }
    // When updating, providing hosts/groups/timeperiods/tags replaces the existing set.
    return zabbixRequest('maintenance.update', params, authToken);
}

async function deleteMaintenance(maintenanceIds) { // Expects an array of maintenance IDs
    await ensureLogin();
    if (!Array.isArray(maintenanceIds) || maintenanceIds.length === 0 || !maintenanceIds.every(id => typeof id === 'string')) {
        throw new Error("deleteMaintenance expects a non-empty array of string maintenance IDs.");
    }
    return zabbixRequest('maintenance.delete', maintenanceIds, authToken);
}

// --- Media Type Functions (CRUD Wrappers & Test) ---
async function getMediaTypes(params = { output: "extend" }) { // Renamed options to params
    await ensureLogin();
    // Common select options: selectMessageTemplates, selectUsers (SuperAdmin only for users of other types)
    return zabbixRequest('mediatype.get', params, authToken);
}

async function createMediaType(params) { // Expects a single media type object as params
    await ensureLogin();
    if (!params.name || typeof params.type === 'undefined') {
        throw new Error("Parameters 'name' and 'type' are required for creating a media type.");
    }
    // Specific parameters like exec_path, gsm_modem, script, smtp_server, etc.,
    // are expected to be directly in the params object based on the 'type'.
    // message_templates and parameters (for webhook/script) are arrays of objects.
    return zabbixRequest('mediatype.create', params, authToken);
}

async function updateMediaType(params) { // Expects a single media type object with mediatypeid
    await ensureLogin();
    if (!params.mediatypeid) {
        throw new Error("Parameter 'mediatypeid' is required for updating a media type.");
    }
    // message_templates and parameters (for webhook/script) will replace existing if provided.
    return zabbixRequest('mediatype.update', params, authToken);
}

async function deleteMediaTypes(mediaTypeIds) { // Expects an array of media type IDs
    await ensureLogin();
    if (!Array.isArray(mediaTypeIds) || mediaTypeIds.length === 0 || !mediaTypeIds.every(id => typeof id === 'string')) {
        throw new Error("deleteMediaTypes expects a non-empty array of string media type IDs.");
    }
    return zabbixRequest('mediatype.delete', mediaTypeIds, authToken);
}

async function testMediaType(params) { // Expects { mediatypeid, sendto, subject, message, ... }
    await ensureLogin();
    if (!params.mediatypeid || !params.sendto) {
        throw new Error("Parameters 'mediatypeid' and 'sendto' are required for testing media type delivery.");
    }
    // Ensure subject and message have defaults if not provided, as API might require them.
    params.subject = params.subject || "Zabbix Test Message";
    params.message = params.message || "This is a test message from Zabbix API.";
    return zabbixRequest('mediatype.test', params, authToken);
}

// --- User & User Group Functions ---

// --- User Functions (CRUD Wrappers) ---
async function getUsers(params = { output: "extend" }) {
    await ensureLogin();
    // If filter or search by 'username' is intended to mean login/alias,
    // and Zabbix API user.get strictly uses 'alias' for that, map it here.
    // Based on Zabbix 7.0 user.create example, user.get filter likely uses 'username' directly for login name.
    // For now, assume params are correctly structured for 'username' as login name.
    // if (params.filter && params.filter.username) {
    //     params.filter.alias = params.filter.username;
    //     delete params.filter.username;
    // }
    // if (params.search && params.search.username) {
    //     params.search.alias = params.search.username;
    //     delete params.search.username;
    // }
    return zabbixRequest('user.get', params, authToken);
}

async function createUser(params) { // Expects a single user object as params
    await ensureLogin();
    // Zabbix 7.0 API user.create expects 'username' for the login name (alias).
    // Ensure 'usrgrps' is an array of objects [{usrgrpid: "ID"}]
    if (params.usrgrps && Array.isArray(params.usrgrps) && params.usrgrps.every(id => typeof id === 'string')) {
        params.usrgrps = params.usrgrps.map(id => ({ usrgrpid: id }));
    } else if (params.usrgrps && Array.isArray(params.usrgrps) && !params.usrgrps.every(obj => obj && typeof obj.usrgrpid === 'string')) {
        throw new Error("Invalid 'usrgrps' format for createUser; expected array of objects like [{usrgrpid: 'ID'}].");
    }
    // Ensure 'medias' if provided is an array of objects
    if (params.medias && Array.isArray(params.medias)) {
        // Further validation of media object structure could be added here if needed
    }
    return zabbixRequest('user.create', params, authToken);
}

async function updateUser(params) { // Expects a single user object with userid and fields to update
    await ensureLogin();
    if (!params.userid) {
        throw new Error("userid is required for updateUser.");
    }
    // Zabbix API user.update expects 'username' for changing the login name.
    // Ensure 'usrgrps' is an array of objects [{usrgrpid: "ID"}] if being updated
    if (params.usrgrps && Array.isArray(params.usrgrps) && params.usrgrps.every(id => typeof id === 'string')) {
        params.usrgrps = params.usrgrps.map(id => ({ usrgrpid: id }));
    } else if (params.usrgrps && Array.isArray(params.usrgrps) && !params.usrgrps.every(obj => obj && typeof obj.usrgrpid === 'string')) {
        throw new Error("Invalid 'usrgrps' format for updateUser; expected array of objects like [{usrgrpid: 'ID'}].");
    }
    // Ensure 'medias' if provided is an array of objects
    if (params.medias && Array.isArray(params.medias)) {
        // Further validation of media object structure could be added here if needed
    }
    return zabbixRequest('user.update', params, authToken);
}

async function deleteUsers(userIds) { // Expects an array of user IDs
    await ensureLogin();
    if (!Array.isArray(userIds) || userIds.length === 0 || !userIds.every(id => typeof id === 'string')) {
        throw new Error("deleteUsers expects a non-empty array of string user IDs.");
    }
    return zabbixRequest('user.delete', userIds, authToken);
}

// --- User Group Functions (CRUD Wrappers) ---
async function getUserGroups(params = { output: "extend" }) {
    await ensureLogin();
    // Common select options: selectUsers, selectRights, selectTagFilters
    return zabbixRequest('usergroup.get', params, authToken);
}

async function createUserGroup(params) { // Expects a single user group object as params
    await ensureLogin();
    // Required by Zabbix API: name
    if (!params.name) {
        throw new Error("Parameter 'name' is required for creating a user group.");
    }
    // The API expects 'users' as an array of objects like [{userid: "ID"}]
    // The client function will ensure this mapping if a flat array of user IDs is passed for 'users'.
    if (params.users && Array.isArray(params.users) && params.users.every(id => typeof id === 'string')) {
        params.users = params.users.map(id => ({ userid: id }));
    } else if (params.users && Array.isArray(params.users) && !params.users.every(user => user && typeof user.userid === 'string')) {
        throw new Error("Invalid 'users' format for createUserGroup; expected array of objects like [{userid: 'ID'}] or array of string IDs.");
    }
    // hostgroup_rights, templategroup_rights, tag_filters are complex arrays/objects.
    // The Zod schema in the MCP tool should guide their structure.
    return zabbixRequest('usergroup.create', params, authToken);
}

async function updateUserGroup(params) { // Expects a single user group object with usrgrpid and fields to update
    await ensureLogin();
    if (!params.usrgrpid) {
        throw new Error("Parameter 'usrgrpid' is required for updating a user group.");
    }
    // Similar mapping for 'users' if provided as flat ID array for update
    if (params.users && Array.isArray(params.users) && params.users.every(id => typeof id === 'string')) {
        params.users = params.users.map(id => ({ userid: id }));
    }
    // When updating, users, hostgroup_rights, templategroup_rights, tag_filters replace existing.
    return zabbixRequest('usergroup.update', params, authToken);
}

async function deleteUserGroups(userGroupIds) { // Expects an array of user group IDs
    await ensureLogin();
    if (!Array.isArray(userGroupIds) || userGroupIds.length === 0 || !userGroupIds.every(id => typeof id === 'string')) {
        throw new Error("deleteUserGroups expects a non-empty array of string user group IDs.");
    }
    return zabbixRequest('usergroup.delete', userGroupIds, authToken);
}

// --- Template Functions (CRUD Wrappers) ---
async function getTemplates(params = { output: "extend" }) { // Renamed options to params for consistency
    await ensureLogin();
    return zabbixRequest('template.get', params, authToken);
}

async function createTemplate(params) { // Expects a single template object as params
    await ensureLogin();
    // Zabbix API template.create expects 'host' for the template's technical name
    // and 'groups' as an array of objects [{groupid: "ID"}]
    if (!params.host || !params.groups) {
        throw new Error("Parameters 'host' (template technical name) and 'groups' are required for creating a template.");
    }
    if (params.groups && Array.isArray(params.groups) && params.groups.every(id => typeof id === 'string')) {
        params.groups = params.groups.map(id => ({ groupid: id }));
    } else if (params.groups && Array.isArray(params.groups) && !params.groups.every(obj => obj && typeof obj.groupid === 'string')) {
        throw new Error("Invalid 'groups' format for createTemplate; expected array of objects like [{groupid: 'ID'}].");
    }

    // If 'templates' (to link other templates) is provided as array of IDs, map it
    if (params.templates && Array.isArray(params.templates) && params.templates.every(id => typeof id === 'string')) {
        params.templates = params.templates.map(id => ({ templateid: id }));
    }

    return zabbixRequest('template.create', params, authToken);
}

async function updateTemplate(params) { // Expects a single template object with templateid and fields to update
    await ensureLogin();
    if (!params.templateid) {
        throw new Error("Parameter 'templateid' is required for updating a template.");
    }
    // Similar mappings for groups, templates, templates_clear if provided as flat ID arrays
    if (params.groups && Array.isArray(params.groups) && params.groups.every(id => typeof id === 'string')) {
        params.groups = params.groups.map(id => ({ groupid: id }));
    }
    if (params.templates && Array.isArray(params.templates) && params.templates.every(id => typeof id === 'string')) {
        params.templates = params.templates.map(id => ({ templateid: id }));
    }
    if (params.templates_clear && Array.isArray(params.templates_clear) && params.templates_clear.every(id => typeof id === 'string')) {
        params.templates_clear = params.templates_clear.map(id => ({ templateid: id }));
    }
    return zabbixRequest('template.update', params, authToken);
}

async function deleteTemplates(templateIds) { // Expects an array of template IDs
    await ensureLogin();
    if (!Array.isArray(templateIds) || templateIds.length === 0 || !templateIds.every(id => typeof id === 'string')) {
        throw new Error("deleteTemplates expects a non-empty array of string template IDs.");
    }
    return zabbixRequest('template.delete', templateIds, authToken);
}

async function linkTemplatesToHost(hostId, templateIdsToLink) {
    await ensureLogin();
    return updateHost(hostId, { templates: templateIdsToLink.map(id => ({ templateid: id })) });
}
async function unlinkTemplatesFromHost(hostId, templateIdsToUnlink) {
    await ensureLogin();
    return updateHost(hostId, { templates_clear: templateIdsToUnlink.map(id => ({ templateid: id })) });
}

// --- Script Functions (CRUD Wrappers for Global Scripts) ---
async function getScripts(params = { output: "extend" }) { // Renamed options to params
    await ensureLogin();
    return zabbixRequest('script.get', params, authToken);
}

async function createScript(params) { // Expects a single script object as params
    await ensureLogin();
    if (!params.name || !params.command || typeof params.type === 'undefined' || typeof params.scope === 'undefined') {
        throw new Error("Parameters 'name', 'command', 'type', and 'scope' are required for creating a script.");
    }
    // Parameters like 'parameters' for webhook/script types should be handled by Zod schema in MCP tool
    return zabbixRequest('script.create', params, authToken);
}

async function updateScript(params) { // Expects a single script object with scriptid and fields to update
    await ensureLogin();
    if (!params.scriptid) {
        throw new Error("Parameter 'scriptid' is required for updating a script.");
    }
    return zabbixRequest('script.update', params, authToken);
}

async function deleteScripts(scriptIds) { // Expects an array of script IDs
    await ensureLogin();
    if (!Array.isArray(scriptIds) || scriptIds.length === 0 || !scriptIds.every(id => typeof id === 'string')) {
        throw new Error("deleteScripts expects a non-empty array of string script IDs.");
    }
    return zabbixRequest('script.delete', scriptIds, authToken);
}

// executeScript function (already exists, ensure it's robust)
async function executeScript(scriptid, hostid, manualinput) { // Added manualinput
    await ensureLogin();
    const params = { scriptid };
    if (hostid) params.hostid = hostid; // hostid is for host-context scripts
    // eventid would be for event-context scripts, not handled here for simplicity but could be added
    if (typeof manualinput !== 'undefined') params.manualinput = manualinput; // For scripts expecting manual input

    // Note: The API 'script.execute' doesn't directly take 'eventid' in its main params object in most docs.
    // If a script is event-scoped, its execution context is usually derived when run from the frontend.
    // For direct API execution, hostid is the common target identifier.
    // URL type scripts are not executable via this API method.
    return zabbixRequest('script.execute', params, authToken);
}

// --- Service (Business Service) Functions (CRUD Wrappers) ---
async function getServices(params = { output: "extend" }) { // Renamed options to params
    await ensureLogin();
    // Common select options: selectChildren, selectParents, selectTags, selectProblemTags, selectStatusRules, selectAlarms
    return zabbixRequest('service.get', params, authToken);
}

async function createService(params) { // Expects a single service object as params
    await ensureLogin();
    // Required: name, algorithm
    if (!params.name || typeof params.algorithm === 'undefined') {
        throw new Error("Parameters 'name' and 'algorithm' are required for creating a service.");
    }
    // Children, parents, tags, problem_tags, status_rules are complex arrays/objects.
    // The Zod schema in the MCP tool should guide their structure.
    // Client function can add mapping if flat arrays of IDs are sent for children/parents.
    if (params.children && Array.isArray(params.children) && params.children.every(s => typeof s === 'string')) {
        params.children = params.children.map(id => ({ serviceid: id }));
    }
    if (params.parents && Array.isArray(params.parents) && params.parents.every(s => typeof s === 'string')) {
        params.parents = params.parents.map(id => ({ serviceid: id }));
    }
    return zabbixRequest('service.create', params, authToken);
}

async function updateService(params) { // Expects a single service object with serviceid and fields to update
    await ensureLogin();
    if (!params.serviceid) {
        throw new Error("Parameter 'serviceid' is required for updating a service.");
    }
    // Similar mapping for children, parents if provided as flat ID arrays for update
    if (params.children && Array.isArray(params.children) && params.children.every(s => typeof s === 'string')) {
        params.children = params.children.map(id => ({ serviceid: id }));
    }
    if (params.parents && Array.isArray(params.parents) && params.parents.every(s => typeof s === 'string')) {
        params.parents = params.parents.map(id => ({ serviceid: id }));
    }
    return zabbixRequest('service.update', params, authToken);
}

async function deleteServices(serviceIds) { // Expects an array of service IDs
    await ensureLogin();
    if (!Array.isArray(serviceIds) || serviceIds.length === 0 || !serviceIds.every(id => typeof id === 'string')) {
        throw new Error("deleteServices expects a non-empty array of string service IDs.");
    }
    return zabbixRequest('service.delete', serviceIds, authToken);
}

// getServiceSLA function (already exists, ensure it's robust)
async function getServiceSLA(serviceIds, intervals) {
    await ensureLogin();
    if (!serviceIds || !intervals) {
        throw new Error("serviceIds and intervals are required for getServiceSLA.");
    }
    return zabbixRequest('service.getsla', { serviceids: serviceIds, intervals: intervals }, authToken); // API method is service.getsla
}

// --- LLD Rule (Discovery Rule) Functions (CRUD Wrappers) ---
async function getDiscoveryRules(params = { output: "extend" }) { // Renamed options to params
    await ensureLogin();
    return zabbixRequest('discoveryrule.get', params, authToken);
}

async function createDiscoveryRule(params) { // Expects a single LLD rule object as params
    await ensureLogin();
    // Zabbix API discoveryrule.create expects 'name', 'key_', 'hostid', 'type'
    if (!params.name || !params.key_ || !params.hostid || typeof params.type === 'undefined') {
        throw new Error("Parameters 'name', 'key_', 'hostid', and 'type' are required for creating an LLD rule.");
    }
    // filter, lld_macro_paths, preprocessing, overrides are complex objects/arrays
    // The Zod schema in the MCP tool should guide their structure.
    return zabbixRequest('discoveryrule.create', params, authToken);
}

async function updateDiscoveryRule(params) { // Expects a single LLD rule object with itemid (LLD rule ID) and fields to update
    await ensureLogin();
    if (!params.itemid) { // 'itemid' is the ID of the LLD rule
        throw new Error("Parameter 'itemid' (LLD rule ID) is required for updating an LLD rule.");
    }
    return zabbixRequest('discoveryrule.update', params, authToken);
}

async function deleteDiscoveryRules(lldRuleIds) { // Expects an array of LLD rule IDs (which are 'itemid' in the API)
    await ensureLogin();
    if (!Array.isArray(lldRuleIds) || lldRuleIds.length === 0 || !lldRuleIds.every(id => typeof id === 'string')) {
        throw new Error("deleteDiscoveryRules expects a non-empty array of string LLD rule IDs.");
    }
    return zabbixRequest('discoveryrule.delete', lldRuleIds, authToken);
}

// --- Proxy Functions (CRUD Wrappers - Refined) ---
async function getProxies(params = { output: "extend" }) { // Renamed options to params
    await ensureLogin();
    // Common select options: selectHosts, selectInterface
    return zabbixRequest('proxy.get', params, authToken);
}

async function createProxy(params) { // Expects a single proxy object as params
    await ensureLogin();
    // Required by Zabbix API: name, operating_mode
    // If passive (operating_mode: 1), 'address' is also required. 'port' is often good to specify too.
    if (!params.name || typeof params.operating_mode === 'undefined') {
        throw new Error("Parameters 'name' and 'operating_mode' are required for creating a proxy.");
    }
    if (params.operating_mode === 1 && !params.address) { // Passive proxy
        throw new Error("Parameter 'address' is required for creating a passive proxy (operating_mode: 1).");
    }

    // The Zabbix API expects 'hosts' to be an array of objects like [{hostid: "ID"}]
    if (params.hosts && Array.isArray(params.hosts) && params.hosts.every(h => typeof h === 'string')) {
        params.hosts = params.hosts.map(hostid => ({ hostid: hostid }));
    } else if (params.hosts && Array.isArray(params.hosts) && !params.hosts.every(host => host && typeof host.hostid === 'string')) {
        throw new Error("Invalid 'hosts' format for createProxy; expected array of objects like [{hostid: 'ID'}] or array of string IDs.");
    }
    // 'interface' is an object for active proxies if specific interface details are needed.
    return zabbixRequest('proxy.create', params, authToken);
}

async function updateProxy(params) { // Expects a single proxy object with proxyid and fields to update
    await ensureLogin();
    if (!params.proxyid) {
        throw new Error("Parameter 'proxyid' is required for updating a proxy.");
    }
    // Similar mapping for 'hosts' if provided as flat ID array for update
    if (params.hosts && Array.isArray(params.hosts) && params.hosts.every(h => typeof h === 'string')) {
        params.hosts = params.hosts.map(hostid => ({ hostid: hostid }));
    }
    // When updating, providing 'hosts' or 'interface' replaces the existing set.
    return zabbixRequest('proxy.update', params, authToken);
}

async function deleteProxies(proxyIds) { // Expects an array of proxy IDs
    await ensureLogin();
    if (!Array.isArray(proxyIds) || proxyIds.length === 0 || !proxyIds.every(id => typeof id === 'string')) {
        throw new Error("deleteProxies expects a non-empty array of string proxy IDs.");
    }
    // Note: Proxies that monitor hosts cannot be deleted unless those hosts are reassigned or deleted first.
    // The API call will fail if dependencies exist.
    return zabbixRequest('proxy.delete', proxyIds, authToken);
}

// --- Audit Log Functions ---
async function getAuditLogs(options = { output: "extend", sortfield: "clock", sortorder: "DESC", limit: 100 }) {
    await ensureLogin();
    return zabbixRequest('auditlog.get', options, authToken);
}

// --- Host Interface Functions ---
async function getHostInterfaces(options = { output: "extend" }) {
    await ensureLogin();
    return zabbixRequest('hostinterface.get', options, authToken);
}

// --- Macro Functions (using existing host.get/host.update) ---
async function getHostMacros(hostIds) { // Correctly defined
    await ensureLogin();
    return getHosts({ hostids: hostIds, selectMacros: "extend", output: ["hostid", "host"] });
}

async function updateHostMacros(hostId, macros) { // Correctly defined
    await ensureLogin();
    return updateHost(hostId, { macros: macros });
}

// --- Action Functions (CRUD Wrappers) ---
async function getActions(params = { output: "extend" }) { // Renamed options to params
    await ensureLogin();
    // The selectFilter, selectOperations, etc. are passed directly if in params
    return zabbixRequest('action.get', params, authToken);
}

async function createAction(params) { // Expects a single action object as params
    await ensureLogin();
    // Required: name, eventsource, filter (object with conditions), operations (array of operation objects)
    if (!params.name || typeof params.eventsource === 'undefined' || !params.filter || !params.filter.conditions || !params.operations) {
        throw new Error("Parameters 'name', 'eventsource', 'filter' (with conditions), and 'operations' are required for creating an action.");
    }
    // Further validation of filter and operation object structures can be done here or relied upon Zod in MCP tool
    return zabbixRequest('action.create', params, authToken);
}

async function updateAction(params) { // Expects a single action object with actionid and fields to update
    await ensureLogin();
    if (!params.actionid) {
        throw new Error("Parameter 'actionid' is required for updating an action.");
    }
    // Filter, operations, recovery_operations, update_operations will replace existing if provided.
    return zabbixRequest('action.update', params, authToken);
}

async function deleteActions(actionIds) { // Expects an array of action IDs
    await ensureLogin();
    if (!Array.isArray(actionIds) || actionIds.length === 0 || !actionIds.every(id => typeof id === 'string')) {
        throw new Error("deleteActions expects a non-empty array of string action IDs.");
    }
    return zabbixRequest('action.delete', actionIds, authToken);
}


// --- Regular Expression Functions (CRUD Wrappers) ---
async function getRegularExpressions(params = { output: "extend" }) { // Renamed options to params
    await ensureLogin();
    // Common select options: selectExpressions
    return zabbixRequest('regexp.get', params, authToken);
}

async function createRegularExpression(params) { // Expects a single regexp object as params
    await ensureLogin();
    // Required: name, expressions (array of expression objects)
    if (!params.name || !params.expressions || !Array.isArray(params.expressions) || params.expressions.length === 0) {
        throw new Error("Parameters 'name' and a non-empty 'expressions' array are required for creating a regular expression.");
    }
    // Each object in 'expressions' needs 'expression' and 'expression_type'
    for (const exp of params.expressions) {
        if (typeof exp.expression === 'undefined' || typeof exp.expression_type === 'undefined') {
            throw new Error("Each object in 'expressions' array must have 'expression' and 'expression_type' properties.");
        }
    }
    return zabbixRequest('regexp.create', params, authToken);
}

async function updateRegularExpression(params) { // Expects a single regexp object with regexpid and fields to update
    await ensureLogin();
    if (!params.regexpid) {
        throw new Error("Parameter 'regexpid' is required for updating a regular expression.");
    }
    // 'expressions' if provided will replace existing.
    if (params.expressions && Array.isArray(params.expressions)) {
        for (const exp of params.expressions) {
            if (typeof exp.expression === 'undefined' || typeof exp.expression_type === 'undefined') {
                // If expressionid is provided, it's an update to an existing sub-expression.
                // If not, it's a new sub-expression to be added (replacing all old ones).
                if (!exp.expressionid && (typeof exp.expression === 'undefined' || typeof exp.expression_type === 'undefined')) {
                     throw new Error("Each new object in 'expressions' array for update must have 'expression' and 'expression_type'.");
                }
            }
        }
    }
    return zabbixRequest('regexp.update', params, authToken);
}

async function deleteRegularExpressions(regexpIds) { // Expects an array of regexp IDs
    await ensureLogin();
    if (!Array.isArray(regexpIds) || regexpIds.length === 0 || !regexpIds.every(id => typeof id === 'string')) {
        throw new Error("deleteRegularExpressions expects a non-empty array of string regexp IDs.");
    }
    return zabbixRequest('regexp.delete', regexpIds, authToken);
}

// --- NEW API CLIENT FUNCTIONS for additional features ---

// --- API Token Functions ---
async function getTokens(params = { output: "extend" }) {
    await ensureLogin();
    return zabbixRequest('token.get', params, authToken);
}

async function createToken(params) { // Expects a single token object as params
    await ensureLogin();
    // Required: name. Optional: userid, description, expires_at, status
    if (!params.name) {
        throw new Error("Parameter 'name' is required for creating an API token.");
    }
    // Note: A token created via token.create is not usable until token.generate is called for it.
    return zabbixRequest('token.create', params, authToken);
}

async function updateToken(params) { // Expects a single token object with tokenid and fields to update
    await ensureLogin();
    if (!params.tokenid) {
        throw new Error("Parameter 'tokenid' is required for updating an API token.");
    }
    return zabbixRequest('token.update', params, authToken);
}

async function deleteTokens(tokenIds) { // Expects an array of token IDs
    await ensureLogin();
    if (!Array.isArray(tokenIds) || tokenIds.length === 0 || !tokenIds.every(id => typeof id === 'string')) {
        throw new Error("deleteTokens expects a non-empty array of string token IDs.");
    }
    return zabbixRequest('token.delete', tokenIds, authToken);
}

async function generateTokens(tokenIds) { // Expects an array of token IDs
    await ensureLogin();
    if (!Array.isArray(tokenIds) || tokenIds.length === 0 || !tokenIds.every(id => typeof id === 'string')) {
        throw new Error("generateTokens expects a non-empty array of string token IDs.");
    }
    // This method returns an object with tokenids as keys and the generated token strings as values.
    return zabbixRequest('token.generate', tokenIds, authToken);
}

// --- Configuration Import/Export Functions ---
async function exportConfiguration(params) {
    await ensureLogin();
    return zabbixRequest('configuration.export', params, authToken);
}

async function importConfiguration(params) {
    await ensureLogin();
    return zabbixRequest('configuration.import', params, authToken);
}

async function importCompareConfiguration(params) { // NEW FUNCTION
    await ensureLogin();
    // Required: format, rules, source
    if (!params.format || !params.rules || !params.source) {
        throw new Error("Parameters 'format', 'rules', and 'source' are required for configuration.importcompare.");
    }
    return zabbixRequest('configuration.importcompare', params, authToken);
}

// --- Value Map Functions (CRUD Wrappers) ---
async function getValueMaps(params = { output: "extend" }) {
    await ensureLogin();
    // Common select options: selectMappings
    return zabbixRequest('valuemap.get', params, authToken);
}

async function createValueMap(params) { // Expects a single value map object as params
    await ensureLogin();
    // Required: name, mappings (array of mapping objects)
    // hostid is optional (for host-specific value maps, otherwise global if omitted)
    if (!params.name || !params.mappings || !Array.isArray(params.mappings) || params.mappings.length === 0) {
        throw new Error("Parameters 'name' and a non-empty 'mappings' array are required for creating a value map.");
    }
    // Each object in 'mappings' needs 'value' and 'newvalue'. 'type' is optional.
    for (const mapping of params.mappings) {
        if (typeof mapping.value === 'undefined' || typeof mapping.newvalue === 'undefined') {
            throw new Error("Each object in 'mappings' array must have 'value' and 'newvalue' properties.");
        }
    }
    return zabbixRequest('valuemap.create', params, authToken);
}

async function updateValueMap(params) { // Expects a single value map object with valuemapid and fields to update
    await ensureLogin();
    if (!params.valuemapid) {
        throw new Error("Parameter 'valuemapid' is required for updating a value map.");
    }
    // 'mappings' if provided will replace ALL existing mappings.
    if (params.mappings && Array.isArray(params.mappings)) {
        for (const mapping of params.mappings) {
            // If mappingid is provided, it's an update to an existing mapping within the value map.
            // If not, it's a new mapping (and all old ones are removed).
            if (!mapping.mappingid && (typeof mapping.value === 'undefined' || typeof mapping.newvalue === 'undefined')) {
                 throw new Error("Each new object in 'mappings' array for update must have 'value' and 'newvalue'.");
            }
        }
    }
    return zabbixRequest('valuemap.update', params, authToken);
}

async function deleteValueMaps(valueMapIds) { // Expects an array of value map IDs
    await ensureLogin();
    if (!Array.isArray(valueMapIds) || valueMapIds.length === 0 || !valueMapIds.every(id => typeof id === 'string')) {
        throw new Error("deleteValueMaps expects a non-empty array of string value map IDs.");
    }
    return zabbixRequest('valuemap.delete', valueMapIds, authToken);
}

// Queue
async function getQueue(options = { scope: "overview" }) { await ensureLogin(); return zabbixRequest('queue.get', options, authToken); }

// Housekeeping
async function getHousekeepingSettings() { await ensureLogin(); return zabbixRequest('housekeeping.get', { output: "extend" }, authToken); }
async function updateHousekeepingSettings(params) { await ensureLogin(); return zabbixRequest('housekeeping.update', params, authToken); }

// --- User Role Functions (CRUD Wrappers) ---
async function getUserRoles(params = { output: "extend" }) {
    await ensureLogin();
    // Common select options: selectUsers, selectRules
    return zabbixRequest('role.get', params, authToken);
}

async function createUserRole(params) { // Expects a single role object as params
    await ensureLogin();
    // Required by Zabbix API: name, type
    // 'rules' object is also typically required to define any permissions.
    if (!params.name || typeof params.type === 'undefined') {
        throw new Error("Parameters 'name' and 'type' are required for creating a user role.");
    }
    if (!params.rules) { // While API might create with empty rules, it's usually not useful
        console.warn("[zabbixApiClient.createUserRole] Warning: Creating role without a 'rules' object. Default permissions will apply or it might be very restrictive.");
    }
    // The 'rules' object should be structured as per Zabbix API (nested for api, actions, services)
    return zabbixRequest('role.create', params, authToken);
}

async function updateUserRole(params) { // Expects a single role object with roleid and fields to update
    await ensureLogin();
    if (!params.roleid) {
        throw new Error("Parameter 'roleid' is required for updating a user role.");
    }
    // 'rules' if provided will replace ALL existing rules.
    return zabbixRequest('role.update', params, authToken);
}

async function deleteUserRoles(roleIds) { // Expects an array of role IDs
    await ensureLogin();
    if (!Array.isArray(roleIds) || roleIds.length === 0 || !roleIds.every(id => typeof id === 'string')) {
        throw new Error("deleteUserRoles expects a non-empty array of string role IDs.");
    }
    // Note: Cannot delete built-in roles or roles currently assigned to users.
    return zabbixRequest('role.delete', roleIds, authToken);
}

// --- Icon Map Functions (CRUD Wrappers) ---
async function getIconMaps(params = { output: "extend" }) {
    await ensureLogin();
    // Common select options: selectMappings
    return zabbixRequest('iconmap.get', params, authToken);
}

async function createIconMap(params) { // Expects a single icon map object as params
    await ensureLogin();
    // Required by Zabbix API: name, default_iconid, mappings (array of mapping objects)
    if (!params.name || !params.default_iconid || !params.mappings || !Array.isArray(params.mappings)) {
        throw new Error("Parameters 'name', 'default_iconid', and 'mappings' (array) are required for creating an icon map.");
    }
    // Each object in 'mappings' needs 'iconid', 'expression', 'inventory_link'
    for (const mapping of params.mappings) {
        if (typeof mapping.iconid === 'undefined' || typeof mapping.expression === 'undefined' || typeof mapping.inventory_link === 'undefined') {
            throw new Error("Each object in 'mappings' array must have 'iconid', 'expression', and 'inventory_link' properties.");
        }
    }
    return zabbixRequest('iconmap.create', params, authToken);
}

async function updateIconMap(params) { // Expects a single icon map object with iconmapid and fields to update
    await ensureLogin();
    if (!params.iconmapid) {
        throw new Error("Parameter 'iconmapid' is required for updating an icon map.");
    }
    // 'mappings' if provided will replace ALL existing mappings.
    if (params.mappings && Array.isArray(params.mappings)) {
        for (const mapping of params.mappings) {
            // If iconmappingid is provided, it's an update to an existing mapping.
            // If not, it's a new mapping (and all old ones are removed).
            if (!mapping.iconmappingid && (typeof mapping.iconid === 'undefined' || typeof mapping.expression === 'undefined' || typeof mapping.inventory_link === 'undefined')) {
                 throw new Error("Each new object in 'mappings' array for update must have 'iconid', 'expression', and 'inventory_link'.");
            }
        }
    }
    return zabbixRequest('iconmap.update', params, authToken);
}

async function deleteIconMaps(iconMapIds) { // Expects an array of icon map IDs
    await ensureLogin();
    if (!Array.isArray(iconMapIds) || iconMapIds.length === 0 || !iconMapIds.every(id => typeof id === 'string')) {
        throw new Error("deleteIconMaps expects a non-empty array of string icon map IDs.");
    }
    return zabbixRequest('iconmap.delete', iconMapIds, authToken);
}

// --- Image Functions (CRUD Wrappers) ---
async function getImages(params = { output: "extend" }) { // Renamed options to params
    await ensureLogin();
    // Common select options: select_image (to get the image data itself)
    return zabbixRequest('image.get', params, authToken);
}

async function createImage(params) { // Expects a single image object as params
    await ensureLogin();
    // Required by Zabbix API: name, imagetype, image (Base64 encoded string)
    if (!params.name || typeof params.imagetype === 'undefined' || !params.image) {
        throw new Error("Parameters 'name', 'imagetype' (1-icon, 2-background), and 'image' (Base64 data) are required for creating an image.");
    }
    return zabbixRequest('image.create', params, authToken);
}

async function updateImage(params) { // Expects a single image object with imageid and fields to update
    await ensureLogin();
    if (!params.imageid) {
        throw new Error("Parameter 'imageid' is required for updating an image.");
    }
    // Only 'name' and 'image' (Base64 data) can be updated. 'imagetype' is constant.
    const updatePayload = { imageid: params.imageid };
    if (params.name) updatePayload.name = params.name;
    if (params.image) updatePayload.image = params.image; // New Base64 image data

    if (Object.keys(updatePayload).length <= 1) {
        throw new Error("At least one property (name or image) must be provided to update an image besides imageid.");
    }

    return zabbixRequest('image.update', updatePayload, authToken);
}

async function deleteImages(imageIds) { // Expects an array of image IDs
    await ensureLogin();
    if (!Array.isArray(imageIds) || imageIds.length === 0 || !imageIds.every(id => typeof id === 'string')) {
        throw new Error("deleteImages expects a non-empty array of string image IDs.");
    }
    // Note: Images in use (e.g., as map backgrounds or icons in icon maps) might not be deletable or deletion might have consequences.
    return zabbixRequest('image.delete', imageIds, authToken);
}

// --- Connector Functions (CRUD Wrappers) ---
async function getConnectors(params = { output: "extend" }) {
    await ensureLogin();
    // Common select options: selectTags
    return zabbixRequest('connector.get', params, authToken);
}

async function createConnector(params) { // Expects a single connector object as params
    await ensureLogin();
    // Required by Zabbix API: name, url, data_type, protocol
    if (!params.name || !params.url || typeof params.data_type === 'undefined' || typeof params.protocol === 'undefined') {
        throw new Error("Parameters 'name', 'url', 'data_type', and 'protocol' are required for creating a connector.");
    }
    // 'tags' is an array of tag filter objects for data_type "Item values" or "Events"
    return zabbixRequest('connector.create', params, authToken);
}

async function updateConnector(params) { // Expects a single connector object with connectorid and fields to update
    await ensureLogin();
    if (!params.connectorid) {
        throw new Error("Parameter 'connectorid' is required for updating a connector.");
    }
    // 'tags' if provided will replace ALL existing tags.
    return zabbixRequest('connector.update', params, authToken);
}

async function deleteConnectors(connectorIds) { // Expects an array of connector IDs
    await ensureLogin();
    if (!Array.isArray(connectorIds) || connectorIds.length === 0 || !connectorIds.every(id => typeof id === 'string')) {
        throw new Error("deleteConnectors expects a non-empty array of string connector IDs.");
    }
    return zabbixRequest('connector.delete', connectorIds, authToken);
}

// --- Correlation Functions (CRUD Wrappers) ---
async function getCorrelations(params = { output: "extend" }) {
    await ensureLogin();
    // Common select options: selectFilter, selectOperations
    return zabbixRequest('correlation.get', params, authToken);
}

async function createCorrelation(params) { // Expects a single correlation object as params
    await ensureLogin();
    // Required by Zabbix API: name, filter (object with conditions), operations (array of operation objects)
    if (!params.name || !params.filter || !params.filter.conditions || !params.operations || !Array.isArray(params.operations) || params.operations.length === 0) {
        throw new Error("Parameters 'name', 'filter' (with conditions), and a non-empty 'operations' array are required for creating a correlation.");
    }
    // Each operation object needs 'type'
    for (const op of params.operations) {
        if (typeof op.type === 'undefined') {
            throw new Error("Each object in 'operations' array must have a 'type' property.");
        }
    }
    // Filter conditions also need validation, typically done by Zod in MCP tool
    return zabbixRequest('correlation.create', params, authToken);
}

async function updateCorrelation(params) { // Expects a single correlation object with correlationid and fields to update
    await ensureLogin();
    if (!params.correlationid) {
        throw new Error("Parameter 'correlationid' is required for updating a correlation.");
    }
    // 'filter' and 'operations' if provided will replace ALL existing ones.
    if (params.operations && Array.isArray(params.operations)) {
        for (const op of params.operations) {
            if (typeof op.type === 'undefined') { // And potentially opid if updating existing operation
                 throw new Error("Each object in 'operations' array for update must have a 'type'.");
            }
        }
    }
    return zabbixRequest('correlation.update', params, authToken);
}

async function deleteCorrelations(correlationIds) { // Expects an array of correlation IDs
    await ensureLogin();
    if (!Array.isArray(correlationIds) || correlationIds.length === 0 || !correlationIds.every(id => typeof id === 'string')) {
        throw new Error("deleteCorrelations expects a non-empty array of string correlation IDs.");
    }
    return zabbixRequest('correlation.delete', correlationIds, authToken);
}

// --- Dashboard Functions (CRUD Wrappers) ---
async function getDashboards(params = { output: "extend" }) {
    await ensureLogin();
    // Common select options: selectPages, selectUsers, selectUserGroups
    return zabbixRequest('dashboard.get', params, authToken);
}

async function createDashboard(params) { // Expects a single dashboard object as params
    await ensureLogin();
    // Required by Zabbix API: name
    // 'pages' array with widgets is usually provided for a useful dashboard.
    if (!params.name) {
        throw new Error("Parameter 'name' is required for creating a dashboard.");
    }
    // Further validation for pages and widgets structure can be complex and is
    // often best handled by Zabbix API's own validation.
    // The Zod schema in MCP tool will guide the structure.
    return zabbixRequest('dashboard.create', params, authToken);
}

async function updateDashboard(params) { // Expects a single dashboard object with dashboardid
    await ensureLogin();
    if (!params.dashboardid) {
        throw new Error("Parameter 'dashboardid' is required for updating a dashboard.");
    }
    // 'pages' if provided will replace ALL existing pages and their widgets.
    // To update specific widgets, you need to provide the full 'pages' structure with modified widgets.
    return zabbixRequest('dashboard.update', params, authToken);
}

async function deleteDashboards(dashboardIds) { // Expects an array of dashboard IDs
    await ensureLogin();
    if (!Array.isArray(dashboardIds) || dashboardIds.length === 0 || !dashboardIds.every(id => typeof id === 'string')) {
        throw new Error("deleteDashboards expects a non-empty array of string dashboard IDs.");
    }
    return zabbixRequest('dashboard.delete', dashboardIds, authToken);
}

// --- Map (Network Map) Functions (CRUD Wrappers) ---
async function getMaps(params = { output: "extend" }) {
    await ensureLogin();
    // Common select options: selectSelements, selectLinks, selectUrls, selectUsers, selectUserGroups, selectShapes, selectLines
    return zabbixRequest('map.get', params, authToken);
}

async function createMap(params) { // Expects a single map object as params
    await ensureLogin();
    // Required by Zabbix API: name, width, height
    if (!params.name || typeof params.width === 'undefined' || typeof params.height === 'undefined') {
        throw new Error("Parameters 'name', 'width', and 'height' are required for creating a map.");
    }
    // selements, links, urls, users, userGroups, shapes, lines are complex arrays/objects.
    // The Zod schema in the MCP tool will guide their structure.
    return zabbixRequest('map.create', params, authToken);
}

async function updateMap(params) { // Expects a single map object with sysmapid and fields to update
    await ensureLogin();
    if (!params.sysmapid) {
        throw new Error("Parameter 'sysmapid' is required for updating a map.");
    }
    // When updating, providing selements, links, urls, users, userGroups, shapes, lines
    // REPLACES the existing set for that map.
    return zabbixRequest('map.update', params, authToken);
}

async function deleteMaps(mapIds) { // Expects an array of map IDs (sysmapid)
    await ensureLogin();
    if (!Array.isArray(mapIds) || mapIds.length === 0 || !mapIds.every(id => typeof id === 'string')) {
        throw new Error("deleteMaps expects a non-empty array of string map IDs.");
    }
    return zabbixRequest('map.delete', mapIds, authToken);
}

async function getAlerts(params = { output: "extend" }) {
    await ensureLogin();
    // Common select options: selectHosts, selectEvents, selectUsers, selectMediatypes
    // The Zabbix API for alert.get uses 'eventids' to filter by the original event that caused the alert,
    // and 'actionids' to filter by the action that generated the alert.
    return zabbixRequest('alert.get', params, authToken);
}

module.exports = {
    // Core
    login, logout, getApiVersion, zabbixRequest, ensureLogin,
    // Host Groups
    getHostGroups, createHostGroup, updateHostGroup, deleteHostGroups,
    // Hosts
    getHosts, createHost, updateHost, deleteHosts,
    // Items
    getItems, createItemDetailed, updateItem, deleteItems, massUpdateItems, getLatestDataForItems,
    // Triggers
    getTriggers, createTriggerDetailed, updateTrigger, deleteTriggers,
    // Events & Problems
    getProblems, getEvents, acknowledgeEvent,
    // History & Trends
    getHistory, getTrends, pushHistoryData,
    // Maintenance
    getMaintenances, createMaintenance, updateMaintenance, deleteMaintenance,
	// Media Types
    getMediaTypes, createMediaType, updateMediaType, deleteMediaTypes, testMediaType,
    // Users & User Groups
    getUsers, createUser, updateUser, deleteUsers,
    getUserGroups, createUserGroup, updateUserGroup, deleteUserGroups,
    // Templates
    getTemplates, createTemplate, updateTemplate, deleteTemplates,
    linkTemplatesToHost, unlinkTemplatesFromHost,
    // Scripts
    getScripts, executeScript,
    // Services (BAM/SLA)
    getServices, createService, updateService, deleteServices, getServiceSLA,
    // Discovery
    getDiscoveryRules, createDiscoveryRule, updateDiscoveryRule, deleteDiscoveryRules,
    // Proxies
    getProxies, createProxy, updateProxy, deleteProxies,
    // Audit
    getAuditLogs,
    // Host Interfaces
    getHostInterfaces,
    // Macros
    getHostMacros, updateHostMacros,
    // Actions
    getActions, createAction, updateAction, deleteActions,
    // Token Management
    getTokens, createToken, updateToken, deleteTokens, generateTokens,
    // Configuration Import/Export
    exportConfiguration, importConfiguration, importCompareConfiguration,
    // Value Maps
    getValueMaps, createValueMap, updateValueMap, deleteValueMaps,
    // Queue
    getQueue,
    // Housekeeping
    getHousekeepingSettings, updateHousekeepingSettings,
    // User Roles
    getUserRoles, createUserRole, updateUserRole, deleteUserRoles,
    // Icon Map
    getIconMaps, createIconMap, updateIconMap, deleteIconMaps,
    // Image
    getImages, createImage, updateImage, deleteImages,
    // Connector
    getConnectors, createConnector, updateConnector, deleteConnectors,
    // Correlation
    getCorrelations, createCorrelation, updateCorrelation, deleteCorrelations,
	// Dashboards
	getDashboards, createDashboard, updateDashboard, deleteDashboards,
	// Maps
	getMaps, createMap, updateMap, deleteMaps,
	// Alerts
	getAlerts,
};