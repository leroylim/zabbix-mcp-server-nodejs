const { zabbixRequest } = require('./client');

/**
 * Get users from Zabbix
 * @param {Object} params - Parameters for user.get
 * @returns {Promise<Array>} Array of users
 */
async function get(params = {}) {
    return await zabbixRequest('user.get', params);
}

/**
 * Create a new user
 * @param {Object} params - User creation parameters
 * @returns {Promise<Object>} Creation result with userids
 */
async function create(params) {
    return await zabbixRequest('user.create', params);
}

/**
 * Update an existing user
 * @param {Object} params - User update parameters (must include userid)
 * @returns {Promise<Object>} Update result with userids
 */
async function update(params) {
    return await zabbixRequest('user.update', params);
}

/**
 * Delete users
 * @param {Array<string>} userIds - Array of user IDs to delete
 * @returns {Promise<Object>} Deletion result with userids
 */
async function deleteUsers(userIds) {
    return await zabbixRequest('user.delete', userIds);
}

/**
 * Get user groups from Zabbix
 * @param {Object} params - Parameters for usergroup.get
 * @returns {Promise<Array>} Array of user groups
 */
async function getUserGroups(params = {}) {
    return await zabbixRequest('usergroup.get', params);
}

/**
 * Create a new user group
 * @param {Object} params - User group creation parameters
 * @returns {Promise<Object>} Creation result with usrgrpids
 */
async function createUserGroup(params) {
    return await zabbixRequest('usergroup.create', params);
}

/**
 * Update an existing user group
 * @param {Object} params - User group update parameters (must include usrgrpid)
 * @returns {Promise<Object>} Update result with usrgrpids
 */
async function updateUserGroup(params) {
    return await zabbixRequest('usergroup.update', params);
}

/**
 * Delete user groups
 * @param {Array<string>} userGroupIds - Array of user group IDs to delete
 * @returns {Promise<Object>} Deletion result with usrgrpids
 */
async function deleteUserGroups(userGroupIds) {
    return await zabbixRequest('usergroup.delete', userGroupIds);
}

module.exports = {
    usersApi: {
        get,
        create,
        update,
        delete: deleteUsers,
        getUserGroups,
        createUserGroup,
        updateUserGroup,
        deleteUserGroups
    }
}; 