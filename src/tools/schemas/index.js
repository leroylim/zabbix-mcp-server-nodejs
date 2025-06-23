const { z } = require('zod');

// Defensive function to ensure schema is valid
function validateSchema(schema, name) {
    if (!schema || typeof schema._parse !== 'function') {
        throw new Error(`Invalid schema for ${name}: missing _parse method. Schema type: ${typeof schema}`);
    }
    return schema;
}

// Common schemas that are reused across different Zabbix tools
const schemas = {
    // Host identifier - can be ID, hostname, visible name, or IP
    hostIdentifier: validateSchema(z.string()
        .min(1, 'Host identifier cannot be empty')
        .describe("Host identifier: ID, technical name, visible name, or IP address."), 'hostIdentifier'),
    
    // Host identifiers array
    hostIdentifiers: validateSchema(z.array(z.string().min(1))
        .min(1, 'At least one host identifier required')
        .describe("Array of host identifiers (IDs, names, or IP addresses)."), 'hostIdentifiers'),
    
    // Zabbix host status
    hostStatus: validateSchema(z.enum(['0', '1'])
        .describe('Host status: 0 (monitored), 1 (unmonitored).'), 'hostStatus'),
    
    // Zabbix severity levels
    severity: validateSchema(z.enum(['not_classified', 'information', 'warning', 'average', 'high', 'disaster'])
        .describe('Problem severity level: not_classified (0), information (1), warning (2), average (3), high (4), disaster (5).'), 'severity'),
    
    // Interface types
    interfaceType: validateSchema(z.enum(['1', '2', '3', '4'])
        .describe('Interface type: 1 (agent), 2 (SNMP), 3 (IPMI), 4 (JMX).'), 'interfaceType'),
    
    // Item types
    itemType: validateSchema(z.enum(['0', '2', '3', '5', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21'])
        .describe('Item type: 0 (Zabbix agent), 2 (Zabbix trapper), 3 (simple check), 5 (Zabbix internal), 7 (Zabbix agent active), etc.'), 'itemType'),
    
    // Value types
    valueType: validateSchema(z.enum(['0', '1', '2', '3', '4'])
        .describe('Value type: 0 (numeric float), 1 (character), 2 (log), 3 (numeric unsigned), 4 (text).'), 'valueType'),
    
    // Trigger priority/severity
    triggerPriority: validateSchema(z.enum(['0', '1', '2', '3', '4', '5'])
        .describe('Trigger priority: 0 (not classified), 1 (information), 2 (warning), 3 (average), 4 (high), 5 (disaster).'), 'triggerPriority'),
    
    // Maintenance type
    maintenanceType: validateSchema(z.enum(['0', '1'])
        .describe('Maintenance type: 0 (with data collection), 1 (without data collection).'), 'maintenanceType'),
    
    // Date formats
    dateYYYYMMDD: validateSchema(z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
        .refine(val => !isNaN(Date.parse(val)), 'Invalid date')
        .describe("Date in YYYY-MM-DD format (e.g., '2024-03-20')."), 'dateYYYYMMDD'),
    
    dateTimeISO: validateSchema(z.string()
        .datetime('Must be valid ISO 8601 datetime')
        .describe("Date and time in ISO 8601 format (e.g., '2024-03-20T15:30:00Z')."), 'dateTimeISO'),
    
    // Unix timestamp
    unixTimestamp: validateSchema(z.number()
        .int('Must be an integer')
        .min(0, 'Timestamp must be positive')
        .describe('Unix timestamp (seconds since epoch).'), 'unixTimestamp'),
    
    // IP Address validation
    ipAddress: validateSchema(z.string()
        .ip('Invalid IP address format')
        .describe("IP address (IPv4 or IPv6)."), 'ipAddress'),
    
    // Pagination - commonly used across list endpoints
    pagination: validateSchema(z.object({
        page: z.number().int().min(1).optional().default(1)
            .describe('Page number for paginated results.'),
        limit: z.number().int().min(1).max(1000).optional().default(100)
            .describe('Number of items per page (max 1000).')
    }), 'pagination'),
    
    // Time range for historical data
    timeRange: validateSchema(z.object({
        time_from: z.number().int().min(0)
            .describe('Start time as Unix timestamp.'),
        time_till: z.number().int().min(0).optional()
            .describe('End time as Unix timestamp (defaults to current time).')
    }), 'timeRange'),
    
    // Host group object
    hostGroup: validateSchema(z.object({
        groupid: z.string().describe('Host group ID.')
    }), 'hostGroup'),
    
    // Template object
    template: validateSchema(z.object({
        templateid: z.string().describe('Template ID.')
    }), 'template'),
    
    // Interface object
    interface: validateSchema(z.object({
        type: z.number().int().min(1).max(4).describe('Interface type: 1 (agent), 2 (SNMP), 3 (IPMI), 4 (JMX).'),
        main: z.number().int().min(0).max(1).describe('Whether this is the default interface: 0 (no), 1 (yes).'),
        useip: z.number().int().min(0).max(1).describe('Connect using: 0 (DNS), 1 (IP).'),
        ip: z.string().ip().optional().describe('IP address (if useip is 1).'),
        dns: z.string().optional().describe('DNS name (if useip is 0).'),
        port: z.string().min(1).describe('Port number.'),
        details: z.any().optional().describe('Additional interface details (e.g., SNMP community).')
    }), 'interface'),
    
    // Macro object
    macro: validateSchema(z.object({
        macro: z.string().min(1).describe('Macro name (e.g., {$MACRO_NAME}).'),
        value: z.string().describe('Macro value.'),
        description: z.string().optional().describe('Macro description.'),
        type: z.number().int().min(0).max(2).optional().describe('Macro type: 0 (text), 1 (secret), 2 (vault).')
    }), 'macro'),
    
    // Output fields specification
    outputFields: validateSchema(z.union([
        z.literal('extend'),
        z.literal('count'),
        z.array(z.string())
    ]).describe('Output fields: "extend" (all fields), "count" (count only), or array of specific field names.'), 'outputFields'),
    
    // Sort order
    sortOrder: validateSchema(z.enum(['ASC', 'DESC'])
        .describe('Sort order: ASC (ascending) or DESC (descending).'), 'sortOrder'),
    
    // Common IDs
    hostId: validateSchema(z.string()
        .min(1, 'Host ID cannot be empty')
        .describe('Unique identifier for a host.'), 'hostId'),
    
    itemId: validateSchema(z.string()
        .min(1, 'Item ID cannot be empty')
        .describe('Unique identifier for an item.'), 'itemId'),
    
    triggerId: validateSchema(z.string()
        .min(1, 'Trigger ID cannot be empty')
        .describe('Unique identifier for a trigger.'), 'triggerId'),
    
    eventId: validateSchema(z.string()
        .min(1, 'Event ID cannot be empty')
        .describe('Unique identifier for an event.'), 'eventId'),
    
    groupId: validateSchema(z.string()
        .min(1, 'Group ID cannot be empty')
        .describe('Unique identifier for a host group.'), 'groupId'),
    
    templateId: validateSchema(z.string()
        .min(1, 'Template ID cannot be empty')
        .describe('Unique identifier for a template.'), 'templateId'),
    
    maintenanceId: validateSchema(z.string()
        .min(1, 'Maintenance ID cannot be empty')
        .describe('Unique identifier for a maintenance period.'), 'maintenanceId'),
    
    // Problem acknowledgment actions
    ackAction: validateSchema(z.object({
        action: z.number().int().min(0).max(63).optional().default(0)
            .describe('Acknowledgment action bitmask: 1 (close problem), 2 (acknowledge), 4 (add message), 8 (change severity), 16 (unacknowledge), 32 (suppress for).'),
        message: z.string().optional().describe('Acknowledgment message.'),
        severity: z.number().int().min(0).max(5).optional().describe('New severity level (0-5).')
    }), 'ackAction')
};

// Validate all schemas on module load
for (const [name, schema] of Object.entries(schemas)) {
    if (!schema || typeof schema._parse !== 'function') {
        throw new Error(`Schema validation failed for ${name}: missing _parse method`);
    }
}

module.exports = schemas; 