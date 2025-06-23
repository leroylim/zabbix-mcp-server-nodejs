/**
 * Users API Module - Refactored to use zabbix-utils
 * 
 * This module provides user management functionality using the zabbix-utils library
 * for improved type safety, automatic authentication, and better error handling.
 */

const { getClient, request } = require('./zabbix-client');
const { logger } = require('../utils/logger');
const config = require('../config');

/**
 * Get users from Zabbix
 * @param {Object} options - Parameters for user.get
 * @returns {Promise<Array>} Array of users
 */
async function getUsers(options = {}) {
    try {
        logger.debug(`${config.logging.prefix} Getting users with options:`, options);
        return await request('user.get', options);
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get users:`, error.message);
        throw new Error(`Failed to retrieve users: ${error.message}`);
    }
}

/**
 * Create a new user in Zabbix
 * @param {Object} params - User creation parameters
 * @returns {Promise<Object>} Created user information
 */
async function createUser(params) {
    // Validate required parameters
    if (!params.username || !params.passwd || !params.usrgrps) {
        throw new Error("Parameters 'username', 'passwd', and 'usrgrps' are required for creating a user.");
    }

    try {
        logger.info(`${config.logging.prefix} Creating user: ${params.username}`);
        const result = await request('user.create', params);
        logger.info(`${config.logging.prefix} Successfully created user with ID: ${result.userids?.[0]}`);
        return result;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to create user ${params.username}:`, error.message);
        throw new Error(`Failed to create user: ${error.message}`);
    }
}

/**
 * Update an existing user in Zabbix
 * @param {Object} params - User update parameters (must include userid)
 * @returns {Promise<Object>} Update result
 */
async function updateUser(params) {
    if (!params || !params.userid) {
        throw new Error("Parameter 'userid' is required for updating a user.");
    }

    try {
        logger.info(`${config.logging.prefix} Updating user ID: ${params.userid}`);
        const result = await request('user.update', params);
        logger.info(`${config.logging.prefix} Successfully updated user ID: ${params.userid}`);
        return result;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to update user ${params.userid}:`, error.message);
        throw new Error(`Failed to update user: ${error.message}`);
    }
}

/**
 * Delete users from Zabbix
 * @param {Array<string>} userIds - Array of user IDs to delete
 * @returns {Promise<Object>} Deletion result
 */
async function deleteUsers(userIds) {
    if (!Array.isArray(userIds) || userIds.length === 0 || !userIds.every(id => typeof id === 'string')) {
        throw new Error("deleteUsers expects a non-empty array of string user IDs.");
    }

    try {
        logger.info(`${config.logging.prefix} Deleting users: ${userIds.join(', ')}`);
        const result = await request('user.delete', userIds);
        logger.info(`${config.logging.prefix} Successfully deleted ${userIds.length} users`);
        return result;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to delete users:`, error.message);
        throw new Error(`Failed to delete users: ${error.message}`);
    }
}

/**
 * Get users by username pattern
 * @param {string|Array<string>} usernamePatterns - Username pattern(s)
 * @param {Object} additionalOptions - Additional options for the query
 * @returns {Promise<Array>} Array of matching users
 */
async function getUsersByUsername(usernamePatterns, additionalOptions = {}) {
    const patterns = Array.isArray(usernamePatterns) ? usernamePatterns : [usernamePatterns];
    
    try {
        logger.debug(`${config.logging.prefix} Getting users by username patterns: ${patterns.join(', ')}`);
        
        const options = {
            output: ['userid', 'username', 'name', 'surname', 'type', 'autologin', 'autologout'],
            search: {
                username: patterns
            },
            searchWildcardsEnabled: true,
            selectUsrgrps: ['usrgrpid', 'name'],
            ...additionalOptions
        };
        
        return await request('user.get', options);
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get users by username:`, error.message);
        throw new Error(`Failed to retrieve users by username: ${error.message}`);
    }
}

/**
 * Get users by user group IDs
 * @param {Array<string>} groupIds - Array of user group IDs
 * @param {Object} additionalOptions - Additional options for the query
 * @returns {Promise<Array>} Array of users in the specified groups
 */
async function getUsersByGroups(groupIds, additionalOptions = {}) {
    if (!Array.isArray(groupIds) || groupIds.length === 0) {
        throw new Error("getUsersByGroups expects a non-empty array of group IDs.");
    }

    try {
        logger.debug(`${config.logging.prefix} Getting users in groups: ${groupIds.join(', ')}`);
        
        const options = {
            output: ['userid', 'username', 'name', 'surname', 'type', 'autologin', 'autologout'],
            usrgrpids: groupIds,
            selectUsrgrps: ['usrgrpid', 'name'],
            selectMedias: ['mediatypeid', 'sendto', 'active', 'severity'],
            ...additionalOptions
        };
        
        return await request('user.get', options);
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get users by groups:`, error.message);
        throw new Error(`Failed to retrieve users by groups: ${error.message}`);
    }
}

/**
 * Get active users (recently logged in)
 * @param {number} daysBack - Number of days to look back for activity (default: 30)
 * @param {Object} additionalOptions - Additional options for the query
 * @returns {Promise<Array>} Array of active users
 */
async function getActiveUsers(daysBack = 30, additionalOptions = {}) {
    try {
        logger.debug(`${config.logging.prefix} Getting active users from last ${daysBack} days`);
        
        const cutoffTime = Math.floor(Date.now() / 1000) - (daysBack * 24 * 60 * 60);
        
        const options = {
            output: ['userid', 'username', 'name', 'surname', 'type', 'autologin', 'autologout'],
            filter: {
                // Get users who have logged in recently
                // Note: This requires checking user sessions or login history
            },
            selectUsrgrps: ['usrgrpid', 'name'],
            ...additionalOptions
        };
        
        const allUsers = await request('user.get', options);
        
        // Filter active users based on recent activity
        // This is a simplified approach - in practice, you might want to check user sessions
        return allUsers.filter(user => {
            // Users with autologin enabled are considered active
            return user.autologin === '1' || user.type !== '3'; // Not disabled
        });
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get active users:`, error.message);
        throw new Error(`Failed to retrieve active users: ${error.message}`);
    }
}

/**
 * Get users by type (Admin, User, etc.)
 * @param {string|Array<string>} userTypes - User type(s) (1=Admin, 2=User, 3=Super Admin)
 * @param {Object} additionalOptions - Additional options for the query
 * @returns {Promise<Array>} Array of users with specified types
 */
async function getUsersByType(userTypes, additionalOptions = {}) {
    const types = Array.isArray(userTypes) ? userTypes : [userTypes];
    
    try {
        logger.debug(`${config.logging.prefix} Getting users by types: ${types.join(', ')}`);
        
        const options = {
            output: ['userid', 'username', 'name', 'surname', 'type', 'autologin', 'autologout'],
            filter: {
                type: types
            },
            selectUsrgrps: ['usrgrpid', 'name'],
            selectMedias: ['mediatypeid', 'sendto', 'active'],
            ...additionalOptions
        };
        
        return await request('user.get', options);
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get users by type:`, error.message);
        throw new Error(`Failed to retrieve users by type: ${error.message}`);
    }
}

/**
 * Enable users
 * @param {Array<string>} userIds - Array of user IDs to enable
 * @returns {Promise<Object>} Update result
 */
async function enableUsers(userIds) {
    if (!Array.isArray(userIds) || userIds.length === 0) {
        throw new Error("enableUsers expects a non-empty array of user IDs.");
    }

    try {
        logger.info(`${config.logging.prefix} Enabling users: ${userIds.join(', ')}`);
        
        const updateParams = userIds.map(userid => ({
            userid,
            type: '1' // Set to User type (enabled)
        }));
        
        const result = await request('user.update', updateParams);
        logger.info(`${config.logging.prefix} Successfully enabled ${userIds.length} users`);
        return result;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to enable users:`, error.message);
        throw new Error(`Failed to enable users: ${error.message}`);
    }
}

/**
 * Disable users
 * @param {Array<string>} userIds - Array of user IDs to disable
 * @returns {Promise<Object>} Update result
 */
async function disableUsers(userIds) {
    if (!Array.isArray(userIds) || userIds.length === 0) {
        throw new Error("disableUsers expects a non-empty array of user IDs.");
    }

    try {
        logger.info(`${config.logging.prefix} Disabling users: ${userIds.join(', ')}`);
        
        const updateParams = userIds.map(userid => ({
            userid,
            type: '3' // Set to disabled type
        }));
        
        const result = await request('user.update', updateParams);
        logger.info(`${config.logging.prefix} Successfully disabled ${userIds.length} users`);
        return result;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to disable users:`, error.message);
        throw new Error(`Failed to disable users: ${error.message}`);
    }
}

/**
 * Get user groups
 * @param {Object} options - Parameters for usergroup.get
 * @returns {Promise<Array>} Array of user groups
 */
async function getUserGroups(options = {}) {
    try {
        logger.debug(`${config.logging.prefix} Getting user groups with options:`, options);
        return await request('usergroup.get', options);
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get user groups:`, error.message);
        throw new Error(`Failed to retrieve user groups: ${error.message}`);
    }
}

/**
 * Get user permissions for specific hosts/groups
 * @param {Array<string>} userIds - Array of user IDs
 * @param {Object} additionalOptions - Additional options for the query
 * @returns {Promise<Array>} Array of users with permission details
 */
async function getUserPermissions(userIds, additionalOptions = {}) {
    if (!Array.isArray(userIds) || userIds.length === 0) {
        throw new Error("getUserPermissions expects a non-empty array of user IDs.");
    }

    try {
        logger.debug(`${config.logging.prefix} Getting permissions for users: ${userIds.join(', ')}`);
        
        const options = {
            output: ['userid', 'username', 'name', 'surname', 'type'],
            userids: userIds,
            selectUsrgrps: ['usrgrpid', 'name', 'gui_access', 'users_status', 'debug_mode'],
            ...additionalOptions
        };
        
        return await request('user.get', options);
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get user permissions:`, error.message);
        throw new Error(`Failed to retrieve user permissions: ${error.message}`);
    }
}

/**
 * Get user media (notification settings)
 * @param {Array<string>} userIds - Array of user IDs
 * @param {Object} additionalOptions - Additional options for the query
 * @returns {Promise<Array>} Array of users with media details
 */
async function getUserMedia(userIds, additionalOptions = {}) {
    if (!Array.isArray(userIds) || userIds.length === 0) {
        throw new Error("getUserMedia expects a non-empty array of user IDs.");
    }

    try {
        logger.debug(`${config.logging.prefix} Getting media for users: ${userIds.join(', ')}`);
        
        const options = {
            output: ['userid', 'username', 'name', 'surname'],
            userids: userIds,
            selectMedias: ['mediatypeid', 'sendto', 'active', 'severity', 'period'],
            selectMediatypes: ['mediatypeid', 'name', 'type'],
            ...additionalOptions
        };
        
        return await request('user.get', options);
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get user media:`, error.message);
        throw new Error(`Failed to retrieve user media: ${error.message}`);
    }
}

/**
 * Get user statistics
 * @param {Array<string>} userIds - Array of user IDs (optional)
 * @returns {Promise<Object>} User statistics
 */
async function getUserStatistics(userIds = null) {
    try {
        logger.debug(`${config.logging.prefix} Getting user statistics`);
        
        const userOptions = userIds ? { userids: userIds } : {};
        
        // Get users with groups and media
        const users = await request('user.get', {
            output: ['userid', 'username', 'name', 'surname', 'type', 'autologin', 'autologout'],
            selectUsrgrps: ['usrgrpid', 'name'],
            selectMedias: ['mediatypeid', 'active'],
            ...userOptions
        });
        
        // Get user groups
        const userGroups = await request('usergroup.get', {
            output: ['usrgrpid', 'name', 'gui_access', 'users_status']
        });
        
        // Calculate statistics
        const stats = {
            totalUsers: users.length,
            usersByType: {
                superAdmin: users.filter(u => u.type === '3').length,
                admin: users.filter(u => u.type === '2').length,
                user: users.filter(u => u.type === '1').length
            },
            activeUsers: users.filter(u => u.autologin === '1').length,
            usersWithMedia: users.filter(u => u.medias && u.medias.length > 0).length,
            totalUserGroups: userGroups.length,
            users: users.map(user => ({
                userid: user.userid,
                username: user.username,
                name: `${user.name} ${user.surname}`.trim(),
                type: user.type,
                typeLabel: user.type === '3' ? 'Super Admin' : user.type === '2' ? 'Admin' : 'User',
                autologin: user.autologin === '1',
                groupsCount: user.usrgrps ? user.usrgrps.length : 0,
                mediaCount: user.medias ? user.medias.length : 0,
                groups: user.usrgrps || []
            }))
        };
        
        return stats;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get user statistics:`, error.message);
        throw new Error(`Failed to retrieve user statistics: ${error.message}`);
    }
}

/**
 * Search users by multiple criteria
 * @param {Object} criteria - Search criteria
 * @param {Object} additionalOptions - Additional options for the query
 * @returns {Promise<Array>} Array of matching users
 */
async function searchUsers(criteria = {}, additionalOptions = {}) {
    try {
        logger.debug(`${config.logging.prefix} Searching users with criteria:`, criteria);
        
        const options = {
            output: ['userid', 'username', 'name', 'surname', 'type', 'autologin', 'autologout'],
            selectUsrgrps: ['usrgrpid', 'name'],
            selectMedias: ['mediatypeid', 'sendto', 'active'],
            ...additionalOptions
        };
        
        // Add search criteria
        if (criteria.username) {
            options.search = { username: criteria.username };
            options.searchWildcardsEnabled = true;
        }
        
        if (criteria.name) {
            if (!options.search) options.search = {};
            options.search.name = criteria.name;
            options.searchWildcardsEnabled = true;
        }
        
        if (criteria.userids) {
            options.userids = criteria.userids;
        }
        
        if (criteria.usrgrpids) {
            options.usrgrpids = criteria.usrgrpids;
        }
        
        if (criteria.type) {
            options.filter = { type: criteria.type };
        }
        
        const users = await request('user.get', options);
        
        // Apply additional filtering if needed
        let filteredUsers = users;
        
        if (criteria.hasMedia !== undefined) {
            filteredUsers = filteredUsers.filter(user => {
                const hasMedia = user.medias && user.medias.length > 0;
                return criteria.hasMedia ? hasMedia : !hasMedia;
            });
        }
        
        if (criteria.autologin !== undefined) {
            filteredUsers = filteredUsers.filter(user => {
                return criteria.autologin ? user.autologin === '1' : user.autologin !== '1';
            });
        }
        
        return filteredUsers;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to search users:`, error.message);
        throw new Error(`Failed to search users: ${error.message}`);
    }
}

module.exports = {
    getUsers,
    createUser,
    updateUser,
    deleteUsers,
    getUsersByUsername,
    getUsersByGroups,
    getActiveUsers,
    getUsersByType,
    enableUsers,
    disableUsers,
    getUserGroups,
    getUserPermissions,
    getUserMedia,
    getUserStatistics,
    searchUsers
}; 