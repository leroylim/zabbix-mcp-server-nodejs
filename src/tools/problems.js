const api = require('../api');
const { logger } = require('../utils/logger');
const { z } = require('zod');
const schemas = require('./schemas');

function registerTools(server) {
    // Tool: Get Problems
    server.tool(
        'zabbix_get_problems',
        'Retrieves current problems from Zabbix with filtering options.',
        {
            hostids: z.array(schemas.hostId).optional().describe("Array of host IDs to filter problems by."),
            groupids: z.array(schemas.groupId).optional().describe("Array of host group IDs to filter problems by."),
            objectids: z.array(z.string()).optional().describe("Array of object IDs (trigger IDs) to filter problems by."),
            severities: z.array(z.number().int().min(0).max(5)).optional().describe("Array of severity levels to filter by (0-5)."),
            evaltype: z.enum(['0', '2']).optional().describe("Evaluation type: 0 (AND/OR), 2 (OR)."),
            tags: z.array(z.object({
                tag: z.string().describe("Tag name."),
                value: z.string().optional().describe("Tag value."),
                operator: z.enum(['0', '1', '2', '3']).optional().describe("Tag operator: 0 (like), 1 (equal), 2 (not like), 3 (not equal).")
            })).optional().describe("Array of tag filters."),
            recent: z.boolean().optional().default(true).describe("Show recent problems."),
            suppressed: z.boolean().optional().describe("Include suppressed problems."),
            acknowledged: z.enum(['0', '1']).optional().describe("Filter by acknowledgment: 0 (unacknowledged), 1 (acknowledged)."),
            time_from: schemas.unixTimestamp.optional().describe("Start time for problem filtering."),
            time_till: schemas.unixTimestamp.optional().describe("End time for problem filtering."),
            output: schemas.outputFields.optional().default("extend").describe("Output fields."),
            selectAcknowledges: schemas.outputFields.optional().describe("Include acknowledgment information."),
            selectTags: schemas.outputFields.optional().describe("Include problem tags."),
            selectSuppressionData: schemas.outputFields.optional().describe("Include suppression data."),
            sortfield: z.array(z.string()).optional().describe("Fields to sort by."),
            sortorder: schemas.sortOrder.optional().describe("Sort order."),
            limit: z.number().int().positive().optional().describe("Maximum number of problems to return.")
        },
        async (args) => {
            try {
                const result = await api.getProblems(args);
                return { content: [{ type: 'text', text: `Current problems:\n${JSON.stringify(result, null, 2)}` }] };
            } catch (error) {
                logger.error('Error getting problems:', error);
                throw error;
            }
        }
    );

    // Tool: Get Events
    server.tool(
        'zabbix_get_events',
        'Retrieves events from Zabbix with filtering options.',
        {
            hostids: z.array(schemas.hostId).optional().describe("Array of host IDs to filter events by."),
            groupids: z.array(schemas.groupId).optional().describe("Array of host group IDs to filter events by."),
            objectids: z.array(z.string()).optional().describe("Array of object IDs (trigger IDs) to filter events by."),
            eventids: z.array(schemas.eventId).optional().describe("Array of event IDs to retrieve."),
            source: z.enum(['0', '1', '2', '3']).optional().describe("Event source: 0 (trigger), 1 (discovery), 2 (auto registration), 3 (internal)."),
            object: z.enum(['0', '1', '2', '3', '4', '5']).optional().describe("Event object type."),
            acknowledged: z.enum(['0', '1']).optional().describe("Filter by acknowledgment: 0 (unacknowledged), 1 (acknowledged)."),
            severities: z.array(z.number().int().min(0).max(5)).optional().describe("Array of severity levels to filter by (0-5)."),
            evaltype: z.enum(['0', '2']).optional().describe("Evaluation type: 0 (AND/OR), 2 (OR)."),
            tags: z.array(z.object({
                tag: z.string().describe("Tag name."),
                value: z.string().optional().describe("Tag value."),
                operator: z.enum(['0', '1', '2', '3']).optional().describe("Tag operator.")
            })).optional().describe("Array of tag filters."),
            time_from: schemas.unixTimestamp.optional().describe("Start time for event filtering."),
            time_till: schemas.unixTimestamp.optional().describe("End time for event filtering."),
            value: z.array(z.enum(['0', '1'])).optional().describe("Event values: 0 (OK), 1 (problem)."),
            output: schemas.outputFields.optional().default("extend").describe("Output fields."),
            selectHosts: schemas.outputFields.optional().describe("Include host information."),
            selectRelatedObject: schemas.outputFields.optional().describe("Include related object information."),
            selectTags: schemas.outputFields.optional().describe("Include event tags."),
            selectSuppressionData: schemas.outputFields.optional().describe("Include suppression data."),
            sortfield: z.array(z.string()).optional().default(["clock", "eventid"]).describe("Fields to sort by."),
            sortorder: schemas.sortOrder.optional().default("DESC").describe("Sort order."),
            limit: z.number().int().positive().optional().default(100).describe("Maximum number of events to return.")
        },
        async (args) => {
            try {
                const result = await api.getEvents(args);
                return { content: [{ type: 'text', text: `Events:\n${JSON.stringify(result, null, 2)}` }] };
            } catch (error) {
                logger.error('Error getting events:', error);
                throw error;
            }
        }
    );

    // Tool: Acknowledge Event
    server.tool(
        'zabbix_acknowledge_event',
        'Acknowledges one or more events/problems in Zabbix.',
        {
            eventids: z.array(schemas.eventId).min(1).describe("Array of event IDs to acknowledge."),
            message: z.string().optional().default("Acknowledged via MCP").describe("Acknowledgment message."),
            action: z.number().int().min(0).max(63).optional().default(6)
                .describe("Acknowledgment action bitmask: 1 (close problem), 2 (acknowledge), 4 (add message), 8 (change severity), 16 (unacknowledge), 32 (suppress for). Default: 6 (acknowledge + add message)."),
            severity: z.number().int().min(0).max(5).optional().describe("New severity level (0-5) if changing severity."),
            suppress_until: schemas.unixTimestamp.optional().describe("Suppress until timestamp if suppressing.")
        },
        async (args) => {
            try {
                const actionOptions = {
                    action: args.action,
                    ...(args.severity !== undefined && { severity: args.severity }),
                    ...(args.suppress_until !== undefined && { suppress_until: args.suppress_until })
                };
                
                const result = await api.acknowledgeEvent(args.eventids, args.message, actionOptions);
                return { content: [{ type: 'text', text: `Event acknowledgment result:\n${JSON.stringify(result, null, 2)}` }] };
            } catch (error) {
                logger.error('Error acknowledging event:', error);
                throw error;
            }
        }
    );
}

module.exports = { registerTools }; 