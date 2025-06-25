const { logger } = require('../utils/logger');
const api = require('../api');
const { z } = require('zod');
const { handleZabbixError } = require('../utils/errors');

// Media object schema based on official API
const mediaSchema = z.object({
    mediatypeid: z.string().describe('ID of the media type used by the media'),
    sendto: z.union([
        z.string(),
        z.array(z.string())
    ]).describe('Address, user name or other identifier of the recipient. Array for email, string for others'),
    active: z.number().int().min(0).max(1).optional().default(0).describe('Whether the media is enabled (0 - enabled, 1 - disabled)'),
    severity: z.number().int().min(0).max(63).optional().default(63).describe('Trigger severities bitmask (1-Not classified, 2-Information, 4-Warning, 8-Average, 16-High, 32-Disaster)'),
    period: z.string().optional().default('1-7,00:00-24:00').describe('Time period when notifications can be sent'),
    provisioned: z.number().int().min(0).max(1).optional().describe('Whether the media has been provisioned (0 - not provisioned, 1 - provisioned)'),
    userdirectory_mediaid: z.string().optional().describe('User directory media mapping ID for provisioned media')
});

// Enhanced user schema with all official properties
const userSchema = z.object({
    userid: z.string().optional().describe('ID of the user (read-only for updates)'),
    username: z.string().min(1).describe('Username of the user'),
    name: z.string().optional().default('').describe('First name of the user'),
    surname: z.string().optional().default('').describe('Last name of the user'),
    passwd: z.string().optional().describe('User password (write-only)'),
    type: z.number().int().min(1).max(3).optional().default(1).describe('Type of user: 1 - Zabbix user, 2 - Zabbix admin, 3 - Zabbix super admin'),
    roleid: z.string().optional().describe('ID of the user role'),
    autologin: z.number().int().min(0).max(1).optional().default(0).describe('Whether auto-login is enabled (0 - disabled, 1 - enabled)'),
    autologout: z.string().optional().default('15m').describe('User session life time (0 - disable auto-logout)'),
    lang: z.string().optional().default('en_US').describe('Language code of the user'),
    refresh: z.string().optional().default('30s').describe('Refresh rate'),
    rows_per_page: z.number().int().positive().optional().default(50).describe('Number of object rows to show per page'),
    theme: z.string().optional().default('default').describe('User theme (default, blue-theme, dark-theme)'),
    attempt_clock: z.string().optional().describe('Time of the last unsuccessful login attempt'),
    attempt_failed: z.string().optional().describe('Number of consecutive unsuccessful login attempts'),
    attempt_ip: z.string().optional().describe('IP address from which the last unsuccessful login attempt originated'),
    ts_provisioned: z.string().optional().describe('Timestamp when the latest provisioning operation was made'),
    url: z.string().optional().describe('URL to redirect the user to after logging in'),
    userdirectoryid: z.string().optional().default('0').describe('ID of the user directory that the user is linked to'),
    timezone: z.string().optional().default('default').describe('User timezone (e.g., Europe/London, UTC)')
});

// User group object schema
const userGroupSchema = z.object({
    usrgrpid: z.string().describe('ID of the user group'),
    name: z.string().optional().describe('Name of the user group'),
    gui_access: z.number().int().min(0).max(3).optional().describe('Frontend access (0 - system default, 1 - internal, 2 - LDAP, 3 - disabled)'),
    users_status: z.number().int().min(0).max(1).optional().describe('Whether the user group is enabled (0 - enabled, 1 - disabled)'),
    debug_mode: z.number().int().min(0).max(1).optional().describe('Whether debug mode is enabled (0 - disabled, 1 - enabled)')
});

function registerTools(server) {
    // Get users with enhanced schema
    server.tool(
        'zabbix_get_users',
        'Get users from Zabbix with filtering and output options',
        {
            userids: z.array(z.string()).optional().describe('Return only users with the given user IDs'),
            usrgrpids: z.array(z.string()).optional().describe('Return only users that belong to the given user groups'),
            output: z.union([
                z.enum(['extend', 'count']),
                z.array(z.string())
            ]).optional().default(['userid', 'username', 'name', 'surname', 'type', 'autologin', 'autologout']).describe('Object properties to be returned'),
            selectUsrgrps: z.union([
                z.enum(['extend']),
                z.array(z.string())
            ]).optional().describe('Return user groups that the user belongs to'),
            selectMedias: z.union([
                z.enum(['extend']),
                z.array(z.string())
            ]).optional().describe('Return media used by the user'),
            selectMediatypes: z.union([
                z.enum(['extend']),
                z.array(z.string())
            ]).optional().describe('Return media types used by the user'),
            selectRole: z.union([
                z.enum(['extend']),
                z.array(z.string())
            ]).optional().describe('Return user role information'),
            filter: z.record(z.any()).optional().describe('Return only users that match the given filter'),
            search: z.record(z.any()).optional().describe('Return only users that match the given wildcard search'),
            searchByAny: z.boolean().optional().describe('Return results that match any of the criteria in search'),
            startSearch: z.boolean().optional().describe('Return results that start with the criteria in search'),
            excludeSearch: z.boolean().optional().describe('Return results that do not match the criteria in search'),
            searchWildcardsEnabled: z.boolean().optional().describe('Return results that contain wildcards'),
            sortfield: z.union([
                z.string(),
                z.array(z.string())
            ]).optional().default(['username']).describe('Sort the result by the given properties'),
            sortorder: z.enum(['ASC', 'DESC']).optional().default('ASC').describe('Sort order'),
            limit: z.number().int().positive().optional().describe('Limit the number of records returned'),
            preservekeys: z.boolean().optional().describe('Use user IDs as keys in the resulting array')
        },
        async (args) => {
            try {
                const params = { ...args };
                
                const apiParams = {
                    output: params.output || ['userid', 'username', 'name', 'surname', 'type', 'autologin', 'autologout'],
                    sortfield: params.sortfield || ['username'],
                    sortorder: params.sortorder || 'ASC'
                };

                // Add all supported parameters
                const supportedParams = [
                    'userids', 'usrgrpids', 'selectUsrgrps', 'selectMedias', 'selectMediatypes', 'selectRole',
                    'filter', 'search', 'searchByAny', 'startSearch', 'excludeSearch', 'searchWildcardsEnabled',
                    'limit', 'preservekeys'
                ];

                supportedParams.forEach(param => {
                    if (params[param] !== undefined) {
                        apiParams[param] = params[param];
                    }
                });

                const users = await api.getUsers(apiParams);
                
                logger.info(`Retrieved ${users.length} users`);
                return {
                    content: [{
                        type: 'text',
                        text: `Found ${users.length} users:\n\n${JSON.stringify(users, null, 2)}`
                    }]
                };
            } catch (error) {
                const enhancedError = handleZabbixError(error, 'error_getting_users', args);
                logger.error('Error getting users::', enhancedError.message);
                logger.debug('Full error details:', enhancedError.details);
                throw new Error(enhancedError.message);
            }
        }
    );

    // Create user with enhanced schema
    server.tool(
        'zabbix_create_user',
        'Create a new user in Zabbix with comprehensive options',
        {
            username: z.string().min(1).describe('Username for the user'),
            passwd: z.string().min(1).describe('Password for the user'),
            name: z.string().optional().describe('First name of the user'),
            surname: z.string().optional().describe('Last name of the user'),
            type: z.number().int().min(1).max(3).optional().default(1).describe('Type of the user (1 - Zabbix user, 2 - Zabbix admin, 3 - Zabbix super admin)'),
            roleid: z.string().optional().describe('ID of the user role for RBAC'),
            autologin: z.number().int().min(0).max(1).optional().default(0).describe('Whether to enable auto-login (0 - disabled, 1 - enabled)'),
            autologout: z.string().optional().default('15m').describe('User session life time (0 - disable auto-logout)'),
            lang: z.string().optional().default('en_US').describe('Language code of the user'),
            theme: z.string().optional().default('default').describe('User theme (default, blue-theme, dark-theme)'),
            refresh: z.string().optional().default('30s').describe('Refresh rate'),
            rows_per_page: z.number().int().positive().optional().default(50).describe('Amount of object rows to show per page'),
            url: z.string().optional().describe('URL of the page to redirect the user to after logging in'),
            userdirectoryid: z.string().optional().default('0').describe('ID of the user directory for external authentication'),
            timezone: z.string().optional().default('default').describe('User timezone (e.g., Europe/London, UTC)'),
            usrgrps: z.array(z.object({
                usrgrpid: z.string()
            })).min(1).describe('User groups that the user belongs to'),
            medias: z.array(mediaSchema).optional().describe('Media for the user')
        },
        async (args) => {
            try {
                const params = { ...args };
                
                const result = await api.createUser(params);
                
                logger.info(`Created user: ${params.username} (ID: ${result.userids[0]})`);
                return {
                    content: [{
                        type: 'text',
                        text: `Successfully created user "${params.username}" with ID: ${result.userids[0]}`
                    }]
                };
            } catch (error) {
                const enhancedError = handleZabbixError(error, 'error_creating_user', args);
                logger.error('Error creating user::', enhancedError.message);
                logger.debug('Full error details:', enhancedError.details);
                throw new Error(enhancedError.message);
            }
        }
    );

    // Update user with enhanced schema
    server.tool(
        'zabbix_update_user',
        'Update an existing user in Zabbix with comprehensive options',
        {
            userid: z.string().describe('ID of the user to update'),
            username: z.string().optional().describe('Username for the user'),
            passwd: z.string().optional().describe('Password for the user'),
            name: z.string().optional().describe('First name of the user'),
            surname: z.string().optional().describe('Last name of the user'),
            type: z.number().int().min(1).max(3).optional().describe('Type of the user (1 - Zabbix user, 2 - Zabbix admin, 3 - Zabbix super admin)'),
            roleid: z.string().optional().describe('ID of the user role for RBAC'),
            autologin: z.number().int().min(0).max(1).optional().describe('Whether to enable auto-login (0 - disabled, 1 - enabled)'),
            autologout: z.string().optional().describe('User session life time (0 - disable auto-logout)'),
            lang: z.string().optional().describe('Language code of the user'),
            theme: z.string().optional().describe('User theme (default, blue-theme, dark-theme)'),
            refresh: z.string().optional().describe('Refresh rate'),
            rows_per_page: z.number().int().positive().optional().describe('Amount of object rows to show per page'),
            url: z.string().optional().describe('URL of the page to redirect the user to after logging in'),
            userdirectoryid: z.string().optional().describe('ID of the user directory for external authentication'),
            timezone: z.string().optional().describe('User timezone (e.g., Europe/London, UTC)')
        },
        async (args) => {
            try {
                const params = { ...args };
                
                const result = await api.updateUser(params);
                
                logger.info(`Updated user ID ${params.userid}`);
                return {
                    content: [{
                        type: 'text',
                        text: `Successfully updated user ID ${params.userid}`
                    }]
                };
            } catch (error) {
                const enhancedError = handleZabbixError(error, 'error_updating_user', args);
                logger.error('Error updating user::', enhancedError.message);
                logger.debug('Full error details:', enhancedError.details);
                throw new Error(enhancedError.message);
            }
        }
    );

    // Delete users
    server.tool(
        'zabbix_delete_users',
        'Delete users from Zabbix',
        {
            userids: z.array(z.string()).min(1).describe('Array of user IDs to delete')
        },
        async (args) => {
            try {
                const { userids } = args;
                
                const result = await api.deleteUsers(userids);
                
                logger.info(`Deleted ${userids.length} users`);
                return {
                    content: [{
                        type: 'text',
                        text: `Successfully deleted ${userids.length} users: ${userids.join(', ')}`
                    }]
                };
            } catch (error) {
                const enhancedError = handleZabbixError(error, 'error_deleting_users', args);
                logger.error('Error deleting users::', enhancedError.message);
                logger.debug('Full error details:', enhancedError.details);
                throw new Error(enhancedError.message);
            }
        }
    );

    // Get user groups with enhanced schema
    server.tool(
        'zabbix_get_usergroups',
        'Get user groups from Zabbix with filtering and output options',
        {
            usrgrpids: z.array(z.string()).optional().describe('Return only user groups with the given IDs'),
            userids: z.array(z.string()).optional().describe('Return only user groups that contain the given users'),
            output: z.union([
                z.enum(['extend', 'count']),
                z.array(z.string())
            ]).optional().default(['usrgrpid', 'name', 'gui_access', 'users_status', 'debug_mode']).describe('Object properties to be returned'),
            selectUsers: z.union([
                z.enum(['extend']),
                z.array(z.string())
            ]).optional().describe('Return users that belong to the user group'),
            selectRights: z.union([
                z.enum(['extend']),
                z.array(z.string())
            ]).optional().describe('Return permissions of the user group'),
            selectTagFilters: z.union([
                z.enum(['extend']),
                z.array(z.string())
            ]).optional().describe('Return tag-based permissions of the user group'),
            filter: z.record(z.any()).optional().describe('Return only user groups that match the given filter'),
            search: z.record(z.any()).optional().describe('Return only user groups that match the given wildcard search'),
            searchByAny: z.boolean().optional().describe('Return results that match any of the criteria in search'),
            startSearch: z.boolean().optional().describe('Return results that start with the criteria in search'),
            excludeSearch: z.boolean().optional().describe('Return results that do not match the criteria in search'),
            searchWildcardsEnabled: z.boolean().optional().describe('Return results that contain wildcards'),
            sortfield: z.union([
                z.string(),
                z.array(z.string())
            ]).optional().default(['name']).describe('Sort the result by the given properties'),
            sortorder: z.enum(['ASC', 'DESC']).optional().default('ASC').describe('Sort order'),
            limit: z.number().int().positive().optional().describe('Limit the number of records returned'),
            preservekeys: z.boolean().optional().describe('Use user group IDs as keys in the resulting array')
        },
        async (args) => {
            try {
                const params = { ...args };
                
                const apiParams = {
                    output: params.output || ['usrgrpid', 'name', 'gui_access', 'users_status', 'debug_mode'],
                    sortfield: params.sortfield || ['name'],
                    sortorder: params.sortorder || 'ASC'
                };

                // Add all supported parameters
                const supportedParams = [
                    'usrgrpids', 'userids', 'selectUsers', 'selectRights', 'selectTagFilters',
                    'filter', 'search', 'searchByAny', 'startSearch', 'excludeSearch', 'searchWildcardsEnabled',
                    'limit', 'preservekeys'
                ];

                supportedParams.forEach(param => {
                    if (params[param] !== undefined) {
                        apiParams[param] = params[param];
                    }
                });

                const usergroups = await api.getUserGroups(apiParams);
                
                logger.info(`Retrieved ${usergroups.length} user groups`);
                return {
                    content: [{
                        type: 'text',
                        text: `Found ${usergroups.length} user groups:\n\n${JSON.stringify(usergroups, null, 2)}`
                    }]
                };
            } catch (error) {
                const enhancedError = handleZabbixError(error, 'error_getting_usergroups', args);
                logger.error('Error getting user groups::', enhancedError.message);
                logger.debug('Full error details:', enhancedError.details);
                throw new Error(enhancedError.message);
            }
        }
    );

    logger.info('Enhanced users tools registered successfully');
}

module.exports = { registerTools }; 