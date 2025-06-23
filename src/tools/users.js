const { logger } = require('../utils/logger');
const api = require('../api');
const { z } = require('zod');

function registerTools(server) {
    // Get users
    server.tool(
        'zabbix_get_users',
        'Get users from Zabbix with filtering and output options',
        {
            userids: z.array(z.string()).optional().describe('Return only users with the given user IDs'),
            usrgrpids: z.array(z.string()).optional().describe('Return only users that belong to the given user groups'),
            output: z.array(z.string()).optional().default(['userid', 'username', 'name', 'surname', 'type', 'autologin', 'autologout']).describe('Object properties to be returned'),
            selectUsrgrps: z.array(z.string()).optional().describe('Return user groups that the user belongs to'),
            selectMedias: z.array(z.string()).optional().describe('Return media used by the user'),
            selectMediatypes: z.array(z.string()).optional().describe('Return media types used by the user'),
            filter: z.record(z.any()).optional().describe('Return only users that match the given filter'),
            search: z.record(z.any()).optional().describe('Return only users that match the given wildcard search'),
            sortfield: z.array(z.string()).optional().default(['username']).describe('Sort the result by the given properties'),
            sortorder: z.enum(['ASC', 'DESC']).optional().default('ASC').describe('Sort order'),
            limit: z.number().int().positive().optional().describe('Limit the number of records returned')
        },
        async (args) => {
            try {
                const params = { ...args };
                
                const apiParams = {
                    output: params.output || ['userid', 'username', 'name', 'surname', 'type', 'autologin', 'autologout'],
                    sortfield: params.sortfield || ['username'],
                    sortorder: params.sortorder || 'ASC'
                };

                if (params.userids) apiParams.userids = params.userids;
                if (params.usrgrpids) apiParams.usrgrpids = params.usrgrpids;
                if (params.selectUsrgrps) apiParams.selectUsrgrps = params.selectUsrgrps;
                if (params.selectMedias) apiParams.selectMedias = params.selectMedias;
                if (params.selectMediatypes) apiParams.selectMediatypes = params.selectMediatypes;
                if (params.filter) apiParams.filter = params.filter;
                if (params.search) apiParams.search = params.search;
                if (params.limit) apiParams.limit = params.limit;

                const users = await api.usersApi.get(apiParams);
                
                logger.info(`Retrieved ${users.length} users`);
                return {
                    content: [{
                        type: 'text',
                        text: `Found ${users.length} users:\n\n${JSON.stringify(users, null, 2)}`
                    }]
                };
            } catch (error) {
                logger.error('Error getting users:', error.message);
                throw error;
            }
        }
    );

    // Create user
    server.tool(
        'zabbix_create_user',
        'Create a new user in Zabbix',
        {
            username: z.string().min(1).describe('Username for the user'),
            passwd: z.string().min(1).describe('Password for the user'),
            name: z.string().optional().describe('First name of the user'),
            surname: z.string().optional().describe('Last name of the user'),
            type: z.number().int().min(1).max(3).optional().default(1).describe('Type of the user (1 - Zabbix user, 2 - Zabbix admin, 3 - Zabbix super admin)'),
            autologin: z.number().int().min(0).max(1).optional().default(0).describe('Whether to enable auto-login (0 - disabled, 1 - enabled)'),
            autologout: z.string().optional().default('15m').describe('User session life time (0 - disable auto-logout)'),
            lang: z.string().optional().default('en_US').describe('Language code of the user'),
            theme: z.string().optional().default('default').describe('User theme'),
            refresh: z.string().optional().default('30s').describe('Refresh rate'),
            rows_per_page: z.number().int().positive().optional().default(50).describe('Amount of object rows to show per page'),
            url: z.string().optional().describe('URL of the page to redirect the user to after logging in'),
            usrgrps: z.array(z.object({
                usrgrpid: z.string()
            })).min(1).describe('User groups that the user belongs to'),
            medias: z.array(z.object({
                mediatypeid: z.string(),
                sendto: z.string(),
                active: z.number().int().min(0).max(1).optional().default(0),
                severity: z.number().int().min(0).max(63).optional().default(63),
                period: z.string().optional().default('1-7,00:00-24:00')
            })).optional().describe('Media for the user')
        },
        async (args) => {
            try {
                const params = { ...args };
                
                const result = await api.usersApi.create(params);
                
                logger.info(`Created user: ${params.username} (ID: ${result.userids[0]})`);
                return {
                    content: [{
                        type: 'text',
                        text: `Successfully created user "${params.username}" with ID: ${result.userids[0]}`
                    }]
                };
            } catch (error) {
                logger.error('Error creating user:', error.message);
                throw error;
            }
        }
    );

    // Update user
    server.tool(
        'zabbix_update_user',
        'Update an existing user in Zabbix',
        {
            userid: z.string().describe('ID of the user to update'),
            username: z.string().optional().describe('Username for the user'),
            passwd: z.string().optional().describe('Password for the user'),
            name: z.string().optional().describe('First name of the user'),
            surname: z.string().optional().describe('Last name of the user'),
            type: z.number().int().min(1).max(3).optional().describe('Type of the user (1 - Zabbix user, 2 - Zabbix admin, 3 - Zabbix super admin)'),
            autologin: z.number().int().min(0).max(1).optional().describe('Whether to enable auto-login (0 - disabled, 1 - enabled)'),
            autologout: z.string().optional().describe('User session life time (0 - disable auto-logout)'),
            lang: z.string().optional().describe('Language code of the user'),
            theme: z.string().optional().describe('User theme'),
            refresh: z.string().optional().describe('Refresh rate'),
            rows_per_page: z.number().int().positive().optional().describe('Amount of object rows to show per page'),
            url: z.string().optional().describe('URL of the page to redirect the user to after logging in')
        },
        async (args) => {
            try {
                const params = { ...args };
                
                const result = await api.usersApi.update(params);
                
                logger.info(`Updated user ID ${params.userid}`);
                return {
                    content: [{
                        type: 'text',
                        text: `Successfully updated user ID ${params.userid}`
                    }]
                };
            } catch (error) {
                logger.error('Error updating user:', error.message);
                throw error;
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
                
                const result = await api.usersApi.delete(userids);
                
                logger.info(`Deleted ${userids.length} users`);
                return {
                    content: [{
                        type: 'text',
                        text: `Successfully deleted ${userids.length} users: ${userids.join(', ')}`
                    }]
                };
            } catch (error) {
                logger.error('Error deleting users:', error.message);
                throw error;
            }
        }
    );

    // Get user groups
    server.tool(
        'zabbix_get_usergroups',
        'Get user groups from Zabbix with filtering and output options',
        {
            usrgrpids: z.array(z.string()).optional().describe('Return only user groups with the given IDs'),
            userids: z.array(z.string()).optional().describe('Return only user groups that contain the given users'),
            output: z.array(z.string()).optional().default(['usrgrpid', 'name', 'gui_access', 'users_status', 'debug_mode']).describe('Object properties to be returned'),
            selectUsers: z.array(z.string()).optional().describe('Return users that belong to the user group'),
            selectRights: z.array(z.string()).optional().describe('Return permissions of the user group'),
            filter: z.record(z.any()).optional().describe('Return only user groups that match the given filter'),
            search: z.record(z.any()).optional().describe('Return only user groups that match the given wildcard search'),
            sortfield: z.array(z.string()).optional().default(['name']).describe('Sort the result by the given properties'),
            sortorder: z.enum(['ASC', 'DESC']).optional().default('ASC').describe('Sort order'),
            limit: z.number().int().positive().optional().describe('Limit the number of records returned')
        },
        async (args) => {
            try {
                const params = { ...args };
                
                const apiParams = {
                    output: params.output || ['usrgrpid', 'name', 'gui_access', 'users_status', 'debug_mode'],
                    sortfield: params.sortfield || ['name'],
                    sortorder: params.sortorder || 'ASC'
                };

                if (params.usrgrpids) apiParams.usrgrpids = params.usrgrpids;
                if (params.userids) apiParams.userids = params.userids;
                if (params.selectUsers) apiParams.selectUsers = params.selectUsers;
                if (params.selectRights) apiParams.selectRights = params.selectRights;
                if (params.filter) apiParams.filter = params.filter;
                if (params.search) apiParams.search = params.search;
                if (params.limit) apiParams.limit = params.limit;

                const userGroups = await api.usersApi.getUserGroups(apiParams);
                
                logger.info(`Retrieved ${userGroups.length} user groups`);
                return {
                    content: [{
                        type: 'text',
                        text: `Found ${userGroups.length} user groups:\n\n${JSON.stringify(userGroups, null, 2)}`
                    }]
                };
            } catch (error) {
                logger.error('Error getting user groups:', error.message);
                throw error;
            }
        }
    );

    // Create user group
    server.tool(
        'zabbix_create_usergroup',
        'Create a new user group in Zabbix',
        {
            name: z.string().min(1).describe('Name of the user group'),
            gui_access: z.number().int().min(0).max(3).optional().default(0).describe('Frontend access (0 - System default, 1 - Internal, 2 - LDAP, 3 - Disabled)'),
            users_status: z.number().int().min(0).max(1).optional().default(0).describe('Whether the user group is enabled (0 - enabled, 1 - disabled)'),
            debug_mode: z.number().int().min(0).max(1).optional().default(0).describe('Whether debug mode is enabled (0 - disabled, 1 - enabled)'),
            rights: z.array(z.object({
                permission: z.number().int().min(0).max(3),
                id: z.string()
            })).optional().describe('Permissions of the user group')
        },
        async (args) => {
            try {
                const params = { ...args };
                
                const result = await api.usersApi.createUserGroup(params);
                
                logger.info(`Created user group: ${params.name} (ID: ${result.usrgrpids[0]})`);
                return {
                    content: [{
                        type: 'text',
                        text: `Successfully created user group "${params.name}" with ID: ${result.usrgrpids[0]}`
                    }]
                };
            } catch (error) {
                logger.error('Error creating user group:', error.message);
                throw error;
            }
        }
    );

    logger.info('Users tools registered successfully');
}

module.exports = { registerTools }; 