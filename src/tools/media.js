const { logger } = require('../utils/logger');
const api = require('../api');
const { z } = require('zod');
const schemas = require('./schemas');

function registerTools(server) {
    // Get media types
    server.tool(
        'zabbix_get_media_types',
        'Get media types from Zabbix with filtering and output options',
        {
            mediatypeids: z.array(z.string()).optional().describe('Return only media types with the given IDs'),
            output: schemas.outputFields.optional().default('extend').describe('Object properties to be returned'),
            selectMessageTemplates: schemas.outputFields.optional().describe('Return message templates used by the media type'),
            selectUsers: schemas.outputFields.optional().describe('Return users that use the media type'),
            filter: z.record(z.any()).optional().describe('Return only media types that match the given filter'),
            search: z.record(z.any()).optional().describe('Return only media types that match the given wildcard search'),
            sortfield: z.union([z.string(), z.array(z.string())]).optional().describe('Field(s) to sort by (e.g., "name", ["type", "name"])'),
            sortorder: schemas.sortOrder.optional().describe('Sort order'),
            limit: z.number().int().positive().optional().describe('Limit the number of records returned')
        },
        async (args) => {
            try {
                const params = { ...args };
                
                const apiParams = {
                    output: params.output || 'extend',
                    sortfield: params.sortfield || 'name',
                    sortorder: params.sortorder || 'ASC'
                };

                if (params.mediatypeids) apiParams.mediatypeids = params.mediatypeids;
                if (params.selectMessageTemplates) apiParams.selectMessageTemplates = params.selectMessageTemplates;
                if (params.selectUsers) apiParams.selectUsers = params.selectUsers;
                if (params.filter) apiParams.filter = params.filter;
                if (params.search) apiParams.search = params.search;
                if (params.limit) apiParams.limit = params.limit;

                const mediaTypes = await api.getMediaTypes(apiParams);
                
                logger.info(`Retrieved ${mediaTypes.length} media types`);
                return {
                    content: [{
                        type: 'text',
                        text: `Found ${mediaTypes.length} media types:\n\n${JSON.stringify(mediaTypes, null, 2)}`
                    }]
                };
            } catch (error) {
                logger.error('Error getting media types:', error.message);
                throw error;
            }
        }
    );

    // Create media type
    server.tool(
        'zabbix_create_media_type',
        'Create a new media type in Zabbix (Email, SMS, Webhook, Script, etc.)',
        {
            name: z.string().min(1).describe('Name of the media type'),
            type: z.number().int().min(0).max(4).describe('Media type: 0 (Email), 1 (Script), 2 (SMS), 3 (Webhook), 4 (Jabber)'),
            description: z.string().optional().describe('Description of the media type'),
            status: z.number().int().min(0).max(1).optional().default(0).describe('Status: 0 (enabled), 1 (disabled)'),
            
            // Email specific parameters
            smtp_server: z.string().optional().describe('SMTP server for email media type'),
            smtp_port: z.number().int().optional().default(25).describe('SMTP port'),
            smtp_helo: z.string().optional().describe('SMTP HELO'),
            smtp_email: z.string().email().optional().describe('Email address to send from'),
            smtp_security: z.number().int().min(0).max(2).optional().describe('SMTP security: 0 (none), 1 (STARTTLS), 2 (SSL/TLS)'),
            smtp_verify_peer: z.number().int().min(0).max(1).optional().describe('Verify SSL peer certificate'),
            smtp_verify_host: z.number().int().min(0).max(1).optional().describe('Verify SSL host certificate'),
            smtp_authentication: z.number().int().min(0).max(1).optional().describe('SMTP authentication: 0 (none), 1 (normal password)'),
            username: z.string().optional().describe('Username for SMTP authentication'),
            passwd: z.string().optional().describe('Password for SMTP authentication'),
            
            // Script specific parameters
            exec_path: z.string().optional().describe('Script path for script media type'),
            exec_params: z.string().optional().describe('Script parameters'),
            
            // SMS specific parameters
            gsm_modem: z.string().optional().describe('GSM modem for SMS media type'),
            
            // Webhook specific parameters
            webhook_url: z.string().url().optional().describe('Webhook URL'),
            webhook_params: z.string().optional().describe('Webhook parameters (JSON)'),
            webhook_script: z.string().optional().describe('Webhook script'),
            webhook_timeout: z.string().optional().default('30s').describe('Webhook timeout'),
            webhook_process_tags: z.number().int().min(0).max(1).optional().describe('Process tags in webhook'),
            webhook_http_proxy: z.string().optional().describe('HTTP proxy for webhook'),
            
            // Message templates
            message_templates: z.array(z.object({
                eventsource: z.number().int().min(0).max(3).describe('Event source: 0 (trigger), 1 (discovery), 2 (auto registration), 3 (internal)'),
                recovery: z.number().int().min(0).max(2).describe('Operation mode: 0 (problem), 1 (recovery), 2 (update)'),
                subject: z.string().describe('Message subject template'),
                message: z.string().describe('Message body template')
            })).optional().describe('Message templates for different event types'),
            
            // Additional parameters
            parameters: z.array(z.object({
                name: z.string(),
                value: z.string()
            })).optional().describe('Additional media type parameters'),
            
            // Concurrent sessions
            maxsessions: z.number().int().min(0).max(100).optional().default(1).describe('Maximum concurrent sessions'),
            maxattempts: z.number().int().min(1).max(10).optional().default(3).describe('Maximum attempts')
        },
        async (args) => {
            try {
                const params = { ...args };
                
                const result = await api.createMediaType(params);
                
                logger.info(`Created media type: ${params.name} (ID: ${result.mediatypeids[0]})`);
                return {
                    content: [{
                        type: 'text',
                        text: `Successfully created media type "${params.name}" with ID: ${result.mediatypeids[0]}`
                    }]
                };
            } catch (error) {
                logger.error('Error creating media type:', error.message);
                throw error;
            }
        }
    );

    // Update media type
    server.tool(
        'zabbix_update_media_type',
        'Update an existing media type in Zabbix',
        {
            mediatypeid: z.string().describe('ID of the media type to update'),
            name: z.string().optional().describe('Name of the media type'),
            type: z.number().int().min(0).max(4).optional().describe('Media type: 0 (Email), 1 (Script), 2 (SMS), 3 (Webhook), 4 (Jabber)'),
            description: z.string().optional().describe('Description of the media type'),
            status: z.number().int().min(0).max(1).optional().describe('Status: 0 (enabled), 1 (disabled)'),
            smtp_server: z.string().optional().describe('SMTP server for email media type'),
            smtp_port: z.number().int().optional().describe('SMTP port'),
            smtp_email: z.string().email().optional().describe('Email address to send from'),
            username: z.string().optional().describe('Username for authentication'),
            passwd: z.string().optional().describe('Password for authentication')
        },
        async (args) => {
            try {
                const params = { ...args };
                
                const result = await api.updateMediaType(params);
                
                logger.info(`Updated media type ID ${params.mediatypeid}`);
                return {
                    content: [{
                        type: 'text',
                        text: `Successfully updated media type ID ${params.mediatypeid}`
                    }]
                };
            } catch (error) {
                logger.error('Error updating media type:', error.message);
                throw error;
            }
        }
    );

    // Delete media types
    server.tool(
        'zabbix_delete_media_types',
        'Delete media types from Zabbix',
        {
            mediatypeids: z.array(z.string()).min(1).describe('Array of media type IDs to delete')
        },
        async (args) => {
            try {
                const { mediatypeids } = args;
                
                const result = await api.deleteMediaTypes(mediatypeids);
                
                logger.info(`Deleted ${mediatypeids.length} media types`);
                return {
                    content: [{
                        type: 'text',
                        text: `Successfully deleted ${mediatypeids.length} media types: ${mediatypeids.join(', ')}`
                    }]
                };
            } catch (error) {
                logger.error('Error deleting media types:', error.message);
                throw error;
            }
        }
    );

    // Test media type
    server.tool(
        'zabbix_test_media_type',
        'Test media type delivery in Zabbix',
        {
            mediatypeid: z.string().describe('ID of the media type to test'),
            sendto: z.string().describe('Recipient address (email, phone number, webhook URL, etc.)'),
            subject: z.string().optional().default('Zabbix Test Message').describe('Test message subject'),
            message: z.string().optional().default('This is a test message from Zabbix API.').describe('Test message body')
        },
        async (args) => {
            try {
                const params = { 
                    ...args,
                    subject: args.subject || 'Zabbix Test Message',
                    message: args.message || 'This is a test message from Zabbix API.'
                };
                
                const result = await api.testMediaType(params);
                
                logger.info(`Tested media type ID ${params.mediatypeid} to ${params.sendto}`);
                return {
                    content: [{
                        type: 'text',
                        text: `Media type test completed:\n\n${JSON.stringify(result, null, 2)}`
                    }]
                };
            } catch (error) {
                logger.error('Error testing media type:', error.message);
                throw error;
            }
        }
    );

    // Get user media (notification settings)
    server.tool(
        'zabbix_get_user_media',
        'Get user media (notification settings) from Zabbix',
        {
            usrgrpids: z.array(z.string()).optional().describe('Return only user media for the given user group IDs'),
            userids: z.array(z.string()).optional().describe('Return only user media for the given user IDs'),
            mediatypeids: z.array(z.string()).optional().describe('Return only user media for the given media type IDs'),
            output: z.array(z.string()).optional().default(['mediaid', 'userid', 'mediatypeid', 'sendto', 'active', 'severity', 'period']).describe('Object properties to be returned'),
            selectUsers: z.array(z.string()).optional().describe('Return users that the media belongs to'),
            selectMediatypes: z.array(z.string()).optional().describe('Return media types used by the user media'),
            filter: z.record(z.any()).optional().describe('Return only user media that match the given filter'),
            sortfield: z.array(z.string()).optional().default(['userid']).describe('Sort the result by the given properties'),
            sortorder: z.enum(['ASC', 'DESC']).optional().default('ASC').describe('Sort order'),
            limit: z.number().int().positive().optional().describe('Limit the number of records returned')
        },
        async (args) => {
            try {
                const params = { ...args };
                
                const apiParams = {
                    output: params.output || ['mediaid', 'userid', 'mediatypeid', 'sendto', 'active', 'severity', 'period'],
                    sortfield: params.sortfield || ['userid'],
                    sortorder: params.sortorder || 'ASC'
                };

                if (params.usrgrpids) apiParams.usrgrpids = params.usrgrpids;
                if (params.userids) apiParams.userids = params.userids;
                if (params.mediatypeids) apiParams.mediatypeids = params.mediatypeids;
                if (params.selectUsers) apiParams.selectUsers = params.selectUsers;
                if (params.selectMediatypes) apiParams.selectMediatypes = params.selectMediatypes;
                if (params.filter) apiParams.filter = params.filter;
                if (params.limit) apiParams.limit = params.limit;

                const userMedia = await api.getUserMedia(apiParams);
                
                logger.info(`Retrieved ${userMedia.length} user media configurations`);
                return {
                    content: [{
                        type: 'text',
                        text: `Found ${userMedia.length} user media configurations:\n\n${JSON.stringify(userMedia, null, 2)}`
                    }]
                };
            } catch (error) {
                logger.error('Error getting user media:', error.message);
                throw error;
            }
        }
    );

    // Get alerts (sent notifications)
    server.tool(
        'zabbix_get_alerts',
        'Get alerts (sent notifications) from Zabbix',
        {
            alertids: z.array(z.string()).optional().describe('Return only alerts with the given IDs'),
            actionids: z.array(z.string()).optional().describe('Return only alerts generated by the given actions'),
            eventids: z.array(z.string()).optional().describe('Return only alerts generated by the given events'),
            hostids: z.array(z.string()).optional().describe('Return only alerts generated by events on the given hosts'),
            mediatypeids: z.array(z.string()).optional().describe('Return only alerts that used the given media types'),
            userids: z.array(z.string()).optional().describe('Return only alerts sent to the given users'),
            output: z.array(z.string()).optional().default(['alertid', 'actionid', 'eventid', 'userid', 'mediatypeid', 'sendto', 'subject', 'message', 'status', 'retries', 'error', 'esc_step', 'alerttype', 'clock']).describe('Object properties to be returned'),
            selectHosts: z.array(z.string()).optional().describe('Return hosts that generated the events that triggered the alerts'),
            selectMediatypes: z.array(z.string()).optional().describe('Return media types used to send the alerts'),
            selectUsers: z.array(z.string()).optional().describe('Return users that the alerts were sent to'),
            time_from: z.number().int().optional().describe('Return only alerts sent after this time (Unix timestamp)'),
            time_till: z.number().int().optional().describe('Return only alerts sent before this time (Unix timestamp)'),
            filter: z.record(z.any()).optional().describe('Return only alerts that match the given filter'),
            search: z.record(z.any()).optional().describe('Return only alerts that match the given wildcard search'),
            sortfield: z.array(z.string()).optional().default(['clock']).describe('Sort the result by the given properties'),
            sortorder: z.enum(['ASC', 'DESC']).optional().default('DESC').describe('Sort order'),
            limit: z.number().int().positive().optional().default(100).describe('Limit the number of records returned')
        },
        async (args) => {
            try {
                const params = { ...args };
                
                const apiParams = {
                    output: params.output || ['alertid', 'actionid', 'eventid', 'userid', 'mediatypeid', 'sendto', 'subject', 'message', 'status', 'retries', 'error', 'esc_step', 'alerttype', 'clock'],
                    sortfield: params.sortfield || ['clock'],
                    sortorder: params.sortorder || 'DESC',
                    limit: params.limit || 100
                };

                if (params.alertids) apiParams.alertids = params.alertids;
                if (params.actionids) apiParams.actionids = params.actionids;
                if (params.eventids) apiParams.eventids = params.eventids;
                if (params.hostids) apiParams.hostids = params.hostids;
                if (params.mediatypeids) apiParams.mediatypeids = params.mediatypeids;
                if (params.userids) apiParams.userids = params.userids;
                if (params.selectHosts) apiParams.selectHosts = params.selectHosts;
                if (params.selectMediatypes) apiParams.selectMediatypes = params.selectMediatypes;
                if (params.selectUsers) apiParams.selectUsers = params.selectUsers;
                if (params.time_from) apiParams.time_from = params.time_from;
                if (params.time_till) apiParams.time_till = params.time_till;
                if (params.filter) apiParams.filter = params.filter;
                if (params.search) apiParams.search = params.search;

                const alerts = await api.getAlerts(apiParams);
                
                // Format the results with readable timestamps
                const formattedAlerts = alerts.map(alert => ({
                    ...alert,
                    timestamp: new Date(alert.clock * 1000).toISOString(),
                    status_text: alert.status === '0' ? 'Not sent' : 
                                alert.status === '1' ? 'Sent' : 
                                alert.status === '2' ? 'Failed' : 'Unknown'
                }));
                
                logger.info(`Retrieved ${alerts.length} alerts`);
                return {
                    content: [{
                        type: 'text',
                        text: `Found ${alerts.length} alerts:\n\n${JSON.stringify(formattedAlerts, null, 2)}`
                    }]
                };
            } catch (error) {
                logger.error('Error getting alerts:', error.message);
                throw error;
            }
        }
    );

    logger.info('Media tools registered successfully');
}

module.exports = { registerTools }; 