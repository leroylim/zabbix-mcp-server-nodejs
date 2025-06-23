# 📚 Zabbix MCP Server - Complete API Reference

This document provides comprehensive API reference for all 19 tool categories and 90+ individual tools in the Zabbix MCP Server.

## 🎯 Overview

The Zabbix MCP Server provides complete access to Zabbix monitoring functionality through a standardized Model Context Protocol interface. This reference documents all available tools, their parameters, return values, and usage examples.

## 📊 Quick Reference

- **19 Tool Categories** covering all Zabbix functionality
- **90+ Individual Tools** for granular control
- **100% Type Safe** with Zod schema validation
- **Comprehensive Coverage** of Zabbix API endpoints
- **Production Ready** with robust error handling

## 🔐 Authentication Tools (3 tools)

### `zabbix_login`
Authenticate with Zabbix server and establish session.

**Parameters:**
- `username` (string, required): Zabbix username
- `password` (string, required): Zabbix password

**Returns:** Authentication token and session information

**Example:**
```json
{
  "username": "admin",
  "password": "zabbix"
}
```

### `zabbix_logout`
Terminate current Zabbix session.

**Parameters:** None (uses current session)

**Returns:** Logout confirmation

### `zabbix_get_api_info`
Get Zabbix API version and server information.

**Parameters:** None

**Returns:** API version, server details, supported features

## 🖥️ Host Management Tools (3 tools)

### `zabbix_get_hosts`
Retrieve hosts with comprehensive filtering options.

**Parameters:**
- `hostids` (array, optional): Specific host IDs
- `groupids` (array, optional): Filter by host group IDs
- `output` (string/array, optional): Output fields
- `selectGroups` (string/array, optional): Include group information
- `selectInterfaces` (string/array, optional): Include interface details
- `selectInventory` (string/array, optional): Include inventory data
- `selectMacros` (string/array, optional): Include macro information
- `selectParentTemplates` (string/array, optional): Include template links
- `filter` (object, optional): Filter conditions
- `search` (object, optional): Search conditions
- `sortfield` (array, optional): Sort fields
- `sortorder` (array, optional): Sort order
- `limit` (integer, optional): Result limit

**Returns:** Array of host objects with detailed information

### `zabbix_create_host`
Create new host with interfaces and group assignments.

**Parameters:**
- `host` (string, required): Technical host name
- `name` (string, optional): Visible host name
- `groups` (array, required): Host group assignments
- `interfaces` (array, optional): Network interfaces
- `templates` (array, optional): Template links
- `inventory` (object, optional): Inventory data
- `macros` (array, optional): Host macros
- `proxy_hostid` (string, optional): Proxy assignment
- `status` (integer, optional): Host status (0=monitored, 1=unmonitored)
- `description` (string, optional): Host description

**Returns:** Created host ID and confirmation

### `zabbix_update_host`
Update existing host configuration.

**Parameters:**
- `hostid` (string, required): Host ID to update
- `host` (string, optional): Technical host name
- `name` (string, optional): Visible host name
- `groups` (array, optional): Host group assignments
- `interfaces` (array, optional): Network interfaces
- `templates` (array, optional): Template links
- `inventory` (object, optional): Inventory data
- `macros` (array, optional): Host macros
- `proxy_hostid` (string, optional): Proxy assignment
- `status` (integer, optional): Host status

**Returns:** Update confirmation

## 👥 Host Groups Tools (4 tools)

### `zabbix_get_hostgroups`
Get host groups with filtering and host information.

**Parameters:**
- `groupids` (array, optional): Specific group IDs
- `output` (string/array, optional): Output fields
- `selectHosts` (string/array, optional): Include host information
- `filter` (object, optional): Filter conditions
- `search` (object, optional): Search conditions
- `sortfield` (array, optional): Sort fields
- `sortorder` (array, optional): Sort order
- `limit` (integer, optional): Result limit

**Returns:** Array of host group objects

### `zabbix_create_hostgroup`
Create new host group.

**Parameters:**
- `name` (string, required): Group name

**Returns:** Created group ID

### `zabbix_update_hostgroup`
Update host group properties.

**Parameters:**
- `groupid` (string, required): Group ID to update
- `name` (string, required): New group name

**Returns:** Update confirmation

### `zabbix_delete_hostgroups`
Delete multiple host groups.

**Parameters:**
- `groupids` (array, required): Group IDs to delete

**Returns:** Deletion confirmation

## 📊 Items Management Tools (5 tools)

### `zabbix_get_items`
Retrieve monitoring items with comprehensive options.

**Parameters:**
- `itemids` (array, optional): Specific item IDs
- `hostids` (array, optional): Filter by host IDs
- `groupids` (array, optional): Filter by group IDs
- `templateids` (array, optional): Filter by template IDs
- `output` (string/array, optional): Output fields
- `selectHosts` (string/array, optional): Include host information
- `selectTriggers` (string/array, optional): Include trigger information
- `selectApplications` (string/array, optional): Include applications
- `selectDiscoveryRule` (string/array, optional): Include discovery rule
- `selectItemDiscovery` (string/array, optional): Include item discovery
- `selectPreprocessing` (string/array, optional): Include preprocessing
- `filter` (object, optional): Filter conditions
- `search` (object, optional): Search conditions
- `monitored` (boolean, optional): Only monitored items
- `templated` (boolean, optional): Only templated items
- `inherited` (boolean, optional): Only inherited items
- `webitems` (boolean, optional): Include web items
- `sortfield` (array, optional): Sort fields
- `sortorder` (array, optional): Sort order
- `limit` (integer, optional): Result limit

**Returns:** Array of item objects with monitoring data

### `zabbix_create_item`
Create new monitoring item.

**Parameters:**
- `hostid` (string, required): Host ID for the item
- `name` (string, required): Item name
- `key_` (string, required): Item key
- `type` (integer, required): Item type (0=Zabbix agent, 2=Zabbix trapper, etc.)
- `value_type` (integer, required): Value type (0=float, 1=character, 3=numeric unsigned, 4=text)
- `delay` (string, required): Update interval
- `history` (string, optional): History storage period
- `trends` (string, optional): Trend storage period
- `status` (integer, optional): Item status (0=enabled, 1=disabled)
- `units` (string, optional): Value units
- `description` (string, optional): Item description
- `preprocessing` (array, optional): Preprocessing steps
- `interfaceid` (string, optional): Interface ID for network items

**Returns:** Created item ID

### `zabbix_update_item`
Update existing item configuration.

**Parameters:**
- `itemid` (string, required): Item ID to update
- `name` (string, optional): Item name
- `key_` (string, optional): Item key
- `delay` (string, optional): Update interval
- `history` (string, optional): History storage period
- `trends` (string, optional): Trend storage period
- `status` (integer, optional): Item status
- `units` (string, optional): Value units
- `description` (string, optional): Item description
- `preprocessing` (array, optional): Preprocessing steps

**Returns:** Update confirmation

### `zabbix_delete_items`
Delete multiple items.

**Parameters:**
- `itemids` (array, required): Item IDs to delete

**Returns:** Deletion confirmation

### `zabbix_get_item_history`
Retrieve historical data for items.

**Parameters:**
- `itemids` (array, required): Item IDs
- `history` (integer, required): History type (0=float, 1=character, 2=log, 3=numeric unsigned, 4=text)
- `time_from` (timestamp, optional): Start time
- `time_till` (timestamp, optional): End time
- `limit` (integer, optional): Result limit
- `sortfield` (array, optional): Sort fields
- `sortorder` (array, optional): Sort order

**Returns:** Historical data points

## ⚠️ Triggers Management Tools (4 tools)

### `zabbix_get_triggers`
Get triggers with filtering and dependency information.

**Parameters:**
- `triggerids` (array, optional): Specific trigger IDs
- `hostids` (array, optional): Filter by host IDs
- `groupids` (array, optional): Filter by group IDs
- `templateids` (array, optional): Filter by template IDs
- `output` (string/array, optional): Output fields
- `selectHosts` (string/array, optional): Include host information
- `selectItems` (string/array, optional): Include item information
- `selectFunctions` (string/array, optional): Include function information
- `selectDependencies` (string/array, optional): Include dependencies
- `selectDiscoveryRule` (string/array, optional): Include discovery rule
- `selectLastEvent` (string/array, optional): Include last event
- `filter` (object, optional): Filter conditions
- `search` (object, optional): Search conditions
- `monitored` (boolean, optional): Only monitored triggers
- `active` (boolean, optional): Only active triggers
- `maintenance` (boolean, optional): Include maintenance status
- `withUnacknowledgedEvents` (boolean, optional): With unacknowledged events
- `withAcknowledgedEvents` (boolean, optional): With acknowledged events
- `withLastEventUnacknowledged` (boolean, optional): Last event unacknowledged
- `skipDependent` (boolean, optional): Skip dependent triggers
- `sortfield` (array, optional): Sort fields
- `sortorder` (array, optional): Sort order
- `limit` (integer, optional): Result limit

**Returns:** Array of trigger objects

### `zabbix_create_trigger`
Create new trigger with expression and dependencies.

**Parameters:**
- `description` (string, required): Trigger description
- `expression` (string, required): Trigger expression
- `priority` (integer, optional): Severity (0=not classified, 1=information, 2=warning, 3=average, 4=high, 5=disaster)
- `status` (integer, optional): Trigger status (0=enabled, 1=disabled)
- `comments` (string, optional): Trigger comments
- `url` (string, optional): URL for additional information
- `recovery_mode` (integer, optional): Recovery mode
- `recovery_expression` (string, optional): Recovery expression
- `correlation_mode` (integer, optional): Correlation mode
- `correlation_tag` (string, optional): Correlation tag
- `manual_close` (integer, optional): Manual close option
- `dependencies` (array, optional): Trigger dependencies

**Returns:** Created trigger ID

### `zabbix_update_trigger`
Update trigger configuration.

**Parameters:**
- `triggerid` (string, required): Trigger ID to update
- `description` (string, optional): Trigger description
- `expression` (string, optional): Trigger expression
- `priority` (integer, optional): Severity level
- `status` (integer, optional): Trigger status
- `comments` (string, optional): Trigger comments
- `url` (string, optional): URL for additional information
- `recovery_mode` (integer, optional): Recovery mode
- `recovery_expression` (string, optional): Recovery expression
- `dependencies` (array, optional): Trigger dependencies

**Returns:** Update confirmation

### `zabbix_delete_triggers`
Delete multiple triggers.

**Parameters:**
- `triggerids` (array, required): Trigger IDs to delete

**Returns:** Deletion confirmation

## 🚨 Problems Management Tools (2 tools)

### `zabbix_get_problems`
Get current problems with filtering options.

**Parameters:**
- `eventids` (array, optional): Specific event IDs
- `hostids` (array, optional): Filter by host IDs
- `groupids` (array, optional): Filter by group IDs
- `objectids` (array, optional): Filter by object IDs
- `applicationids` (array, optional): Filter by application IDs
- `severities` (array, optional): Filter by severities
- `evaltype` (integer, optional): Tag evaluation type
- `tags` (array, optional): Problem tags
- `recent` (boolean, optional): Recent problems only
- `eventid_from` (string, optional): Event ID range start
- `eventid_till` (string, optional): Event ID range end
- `time_from` (timestamp, optional): Time range start
- `time_till` (timestamp, optional): Time range end
- `acknowledged` (boolean, optional): Acknowledgment status
- `suppressed` (boolean, optional): Suppression status
- `symptoms` (boolean, optional): Include symptoms
- `selectAcknowledges` (string/array, optional): Include acknowledgments
- `selectTags` (string/array, optional): Include tags
- `selectSuppressionData` (string/array, optional): Include suppression data
- `sortfield` (array, optional): Sort fields
- `sortorder` (array, optional): Sort order
- `limit` (integer, optional): Result limit

**Returns:** Array of current problems

### `zabbix_acknowledge_problems`
Acknowledge problems with messages and actions.

**Parameters:**
- `eventids` (array, required): Event IDs to acknowledge
- `message` (string, optional): Acknowledgment message
- `action` (integer, optional): Action flags (1=close, 2=acknowledge, 4=add message, 8=change severity, 16=unacknowledge, 32=suppress, 64=unsuppress)
- `severity` (integer, optional): New severity level
- `suppress_until` (timestamp, optional): Suppression end time

**Returns:** Acknowledgment confirmation

## 📈 History Tools (3 tools)

### `zabbix_get_history`
Retrieve historical monitoring data.

**Parameters:**
- `history` (integer, required): History type (0=float, 1=character, 2=log, 3=numeric unsigned, 4=text)
- `itemids` (array, required): Item IDs
- `time_from` (timestamp, optional): Start time
- `time_till` (timestamp, optional): End time
- `sortfield` (array, optional): Sort fields
- `sortorder` (array, optional): Sort order
- `limit` (integer, optional): Result limit

**Returns:** Historical data points

### `zabbix_get_trends`
Get trend data for long-term analysis.

**Parameters:**
- `itemids` (array, required): Item IDs
- `time_from` (timestamp, optional): Start time
- `time_till` (timestamp, optional): End time
- `limit` (integer, optional): Result limit

**Returns:** Aggregated trend data (min, max, avg values)

### `zabbix_get_events`
Retrieve system events and alerts.

**Parameters:**
- `eventids` (array, optional): Specific event IDs
- `hostids` (array, optional): Filter by host IDs
- `groupids` (array, optional): Filter by group IDs
- `objectids` (array, optional): Filter by object IDs
- `applicationids` (array, optional): Filter by application IDs
- `source` (integer, optional): Event source
- `object` (integer, optional): Event object type
- `acknowledged` (boolean, optional): Acknowledgment status
- `severities` (array, optional): Filter by severities
- `evaltype` (integer, optional): Tag evaluation type
- `tags` (array, optional): Event tags
- `eventid_from` (string, optional): Event ID range start
- `eventid_till` (string, optional): Event ID range end
- `time_from` (timestamp, optional): Time range start
- `time_till` (timestamp, optional): Time range end
- `value` (array, optional): Event values
- `selectHosts` (string/array, optional): Include host information
- `selectRelatedObject` (string/array, optional): Include related object
- `selectAcknowledges` (string/array, optional): Include acknowledgments
- `selectTags` (string/array, optional): Include tags
- `selectSuppressionData` (string/array, optional): Include suppression data
- `sortfield` (array, optional): Sort fields
- `sortorder` (array, optional): Sort order
- `limit` (integer, optional): Result limit

**Returns:** Array of events

## 🔧 Maintenance Tools (4 tools)

### `zabbix_get_maintenances`
Get maintenance periods with host and group information.

**Parameters:**
- `maintenanceids` (array, optional): Specific maintenance IDs
- `hostids` (array, optional): Filter by host IDs
- `groupids` (array, optional): Filter by group IDs
- `output` (string/array, optional): Output fields
- `selectHosts` (string/array, optional): Include host information
- `selectGroups` (string/array, optional): Include group information
- `selectTimeperiods` (string/array, optional): Include time periods
- `filter` (object, optional): Filter conditions
- `search` (object, optional): Search conditions
- `sortfield` (array, optional): Sort fields
- `sortorder` (array, optional): Sort order
- `limit` (integer, optional): Result limit

**Returns:** Array of maintenance periods

### `zabbix_create_maintenance`
Create new maintenance window.

**Parameters:**
- `name` (string, required): Maintenance name
- `active_since` (timestamp, required): Start time
- `active_till` (timestamp, required): End time
- `hosts` (array, optional): Host assignments
- `groups` (array, optional): Group assignments
- `timeperiods` (array, required): Time periods
- `maintenance_type` (integer, optional): Maintenance type (0=with data collection, 1=without data collection)
- `description` (string, optional): Maintenance description
- `tags_evaltype` (integer, optional): Tag evaluation type
- `tags` (array, optional): Maintenance tags

**Returns:** Created maintenance ID

### `zabbix_update_maintenance`
Update maintenance period configuration.

**Parameters:**
- `maintenanceid` (string, required): Maintenance ID to update
- `name` (string, optional): Maintenance name
- `active_since` (timestamp, optional): Start time
- `active_till` (timestamp, optional): End time
- `hosts` (array, optional): Host assignments
- `groups` (array, optional): Group assignments
- `timeperiods` (array, optional): Time periods
- `maintenance_type` (integer, optional): Maintenance type
- `description` (string, optional): Maintenance description
- `tags_evaltype` (integer, optional): Tag evaluation type
- `tags` (array, optional): Maintenance tags

**Returns:** Update confirmation

### `zabbix_delete_maintenances`
Delete maintenance periods.

**Parameters:**
- `maintenanceids` (array, required): Maintenance IDs to delete

**Returns:** Deletion confirmation

## 👤 User Management Tools (6 tools)

### `zabbix_get_users`
Get users with group and media information.

**Parameters:**
- `userids` (array, optional): Specific user IDs
- `output` (string/array, optional): Output fields
- `selectUsrgrps` (string/array, optional): Include user groups
- `selectMedias` (string/array, optional): Include media settings
- `selectMediatypes` (string/array, optional): Include media types
- `getAccess` (boolean, optional): Include access information
- `filter` (object, optional): Filter conditions
- `search` (object, optional): Search conditions
- `sortfield` (array, optional): Sort fields
- `sortorder` (array, optional): Sort order
- `limit` (integer, optional): Result limit

**Returns:** Array of user objects

### `zabbix_create_user`
Create new user account.

**Parameters:**
- `username` (string, required): Username
- `passwd` (string, required): Password
- `name` (string, optional): First name
- `surname` (string, optional): Last name
- `usrgrps` (array, required): User group assignments
- `medias` (array, optional): Media settings
- `type` (integer, optional): User type (1=Zabbix user, 2=Zabbix admin, 3=Zabbix super admin)
- `autologin` (integer, optional): Auto-login setting
- `autologout` (string, optional): Auto-logout time
- `lang` (string, optional): Language
- `refresh` (string, optional): Refresh interval
- `theme` (string, optional): Theme
- `url` (string, optional): URL after login
- `rows_per_page` (integer, optional): Rows per page

**Returns:** Created user ID

### `zabbix_update_user`
Update user account information.

**Parameters:**
- `userid` (string, required): User ID to update
- `username` (string, optional): Username
- `name` (string, optional): First name
- `surname` (string, optional): Last name
- `passwd` (string, optional): Password
- `usrgrps` (array, optional): User group assignments
- `medias` (array, optional): Media settings
- `type` (integer, optional): User type
- `autologin` (integer, optional): Auto-login setting
- `autologout` (string, optional): Auto-logout time
- `lang` (string, optional): Language
- `refresh` (string, optional): Refresh interval
- `theme` (string, optional): Theme
- `url` (string, optional): URL after login
- `rows_per_page` (integer, optional): Rows per page

**Returns:** Update confirmation

### `zabbix_delete_users`
Delete user accounts.

**Parameters:**
- `userids` (array, required): User IDs to delete

**Returns:** Deletion confirmation

### `zabbix_get_usergroups`
Get user groups with permissions.

**Parameters:**
- `usrgrpids` (array, optional): Specific group IDs
- `output` (string/array, optional): Output fields
- `selectUsers` (string/array, optional): Include user information
- `selectRights` (string/array, optional): Include permissions
- `selectTagFilters` (string/array, optional): Include tag filters
- `status` (integer, optional): Group status
- `filter` (object, optional): Filter conditions
- `search` (object, optional): Search conditions
- `sortfield` (array, optional): Sort fields
- `sortorder` (array, optional): Sort order
- `limit` (integer, optional): Result limit

**Returns:** Array of user group objects

### `zabbix_create_usergroup`
Create new user group.

**Parameters:**
- `name` (string, required): Group name
- `gui_access` (integer, optional): GUI access level
- `users_status` (integer, optional): Users status
- `debug_mode` (integer, optional): Debug mode
- `rights` (array, optional): Host group permissions
- `tag_filters` (array, optional): Tag-based filters

**Returns:** Created group ID

## 📋 Template Management Tools (6 tools)

### `zabbix_get_templates`
Get templates with items, triggers, and graphs.

**Parameters:**
- `templateids` (array, optional): Specific template IDs
- `hostids` (array, optional): Filter by linked host IDs
- `groupids` (array, optional): Filter by group IDs
- `parentTemplateids` (array, optional): Filter by parent template IDs
- `output` (string/array, optional): Output fields
- `selectHosts` (string/array, optional): Include linked hosts
- `selectTemplates` (string/array, optional): Include linked templates
- `selectParentTemplates` (string/array, optional): Include parent templates
- `selectItems` (string/array, optional): Include items
- `selectTriggers` (string/array, optional): Include triggers
- `selectGraphs` (string/array, optional): Include graphs
- `selectApplications` (string/array, optional): Include applications
- `selectMacros` (string/array, optional): Include macros
- `selectScreens` (string/array, optional): Include screens
- `selectDiscoveries` (string/array, optional): Include discovery rules
- `selectHttpTests` (string/array, optional): Include web scenarios
- `selectTags` (string/array, optional): Include tags
- `filter` (object, optional): Filter conditions
- `search` (object, optional): Search conditions
- `sortfield` (array, optional): Sort fields
- `sortorder` (array, optional): Sort order
- `limit` (integer, optional): Result limit

**Returns:** Array of template objects

### `zabbix_create_template`
Create new template.

**Parameters:**
- `host` (string, required): Template technical name
- `name` (string, optional): Template visible name
- `groups` (array, required): Template group assignments
- `description` (string, optional): Template description
- `macros` (array, optional): Template macros
- `templates` (array, optional): Linked templates
- `tags` (array, optional): Template tags

**Returns:** Created template ID

### `zabbix_update_template`
Update template configuration.

**Parameters:**
- `templateid` (string, required): Template ID to update
- `host` (string, optional): Template technical name
- `name` (string, optional): Template visible name
- `groups` (array, optional): Template group assignments
- `description` (string, optional): Template description
- `macros` (array, optional): Template macros
- `templates` (array, optional): Linked templates
- `tags` (array, optional): Template tags

**Returns:** Update confirmation

### `zabbix_delete_templates`
Delete templates.

**Parameters:**
- `templateids` (array, required): Template IDs to delete

**Returns:** Deletion confirmation

### `zabbix_link_templates`
Link templates to hosts.

**Parameters:**
- `hostids` (array, required): Host IDs
- `templateids` (array, required): Template IDs to link

**Returns:** Link confirmation

### `zabbix_unlink_templates`
Unlink templates from hosts.

**Parameters:**
- `hostids` (array, required): Host IDs
- `templateids` (array, required): Template IDs to unlink

**Returns:** Unlink confirmation

## 🔧 Scripts Management Tools (6 tools)

### `zabbix_get_scripts`
Get scripts with filtering by type and scope.

**Parameters:**
- `scriptids` (array, optional): Specific script IDs
- `hostids` (array, optional): Filter by host IDs
- `groupids` (array, optional): Filter by group IDs
- `usrgrpids` (array, optional): Filter by user group IDs
- `output` (string/array, optional): Output fields
- `selectHosts` (string/array, optional): Include host information
- `selectGroups` (string/array, optional): Include group information
- `filter` (object, optional): Filter conditions
- `search` (object, optional): Search conditions
- `sortfield` (array, optional): Sort fields
- `sortorder` (array, optional): Sort order
- `limit` (integer, optional): Result limit

**Returns:** Array of script objects

### `zabbix_create_script`
Create script for remote execution.

**Parameters:**
- `name` (string, required): Script name
- `command` (string, required): Script command
- `type` (integer, optional): Script type (0=script, 1=IPMI, 2=SSH, 3=Telnet, 4=global script, 5=webhook)
- `scope` (integer, optional): Execution scope (2=action operation, 4=manual host action, 8=manual event action)
- `execute_on` (integer, optional): Execution target (0=Zabbix agent, 1=Zabbix server, 2=Zabbix server (proxy))
- `host_access` (integer, optional): Host permissions (2=read, 3=write)
- `usrgrpid` (string, optional): User group ID
- `groupid` (string, optional): Host group ID
- `description` (string, optional): Script description
- `confirmation` (string, optional): Confirmation text
- `timeout` (string, optional): Execution timeout
- `parameters` (array, optional): Script parameters
- `authtype` (integer, optional): Authentication type for SSH/Telnet
- `username` (string, optional): Username for SSH/Telnet
- `password` (string, optional): Password for SSH/Telnet
- `publickey` (string, optional): Public key for SSH
- `privatekey` (string, optional): Private key for SSH
- `port` (string, optional): Port for SSH/Telnet

**Returns:** Created script ID

### `zabbix_update_script`
Update script configuration.

**Parameters:**
- `scriptid` (string, required): Script ID to update
- `name` (string, optional): Script name
- `command` (string, optional): Script command
- `type` (integer, optional): Script type
- `scope` (integer, optional): Execution scope
- `execute_on` (integer, optional): Execution target
- `host_access` (integer, optional): Host permissions
- `usrgrpid` (string, optional): User group ID
- `groupid` (string, optional): Host group ID
- `description` (string, optional): Script description
- `confirmation` (string, optional): Confirmation text
- `timeout` (string, optional): Execution timeout
- `parameters` (array, optional): Script parameters

**Returns:** Update confirmation

### `zabbix_delete_scripts`
Delete scripts.

**Parameters:**
- `scriptids` (array, required): Script IDs to delete

**Returns:** Deletion confirmation

### `zabbix_execute_script`
Execute script on hosts.

**Parameters:**
- `scriptid` (string, required): Script ID to execute
- `hostid` (string, required): Target host ID
- `manualinput` (string, optional): Manual input for interactive scripts

**Returns:** Execution result including output and error information

### `zabbix_get_script_execution_history`
Get script execution history from events.

**Parameters:**
- `hostids` (array, optional): Filter by host IDs
- `time_from` (timestamp, optional): Start time
- `time_till` (timestamp, optional): End time
- `limit` (integer, optional): Result limit

**Returns:** Execution history with timestamps and results

## 🔍 Discovery Tools (6 tools)

### `zabbix_get_discovery_rules`
Get low-level discovery rules.

**Parameters:**
- `itemids` (array, optional): Specific rule IDs
- `hostids` (array, optional): Filter by host IDs
- `templateids` (array, optional): Filter by template IDs
- `output` (string/array, optional): Output fields
- `selectHosts` (string/array, optional): Include host information
- `selectItems` (string/array, optional): Include items
- `selectTriggers` (string/array, optional): Include triggers
- `selectGraphs` (string/array, optional): Include graphs
- `selectHostPrototypes` (string/array, optional): Include host prototypes
- `selectFilter` (string/array, optional): Include filter information
- `selectLLDMacroPaths` (string/array, optional): Include LLD macro paths
- `selectPreprocessing` (string/array, optional): Include preprocessing
- `selectOverrides` (string/array, optional): Include overrides
- `filter` (object, optional): Filter conditions
- `search` (object, optional): Search conditions
- `sortfield` (array, optional): Sort fields
- `sortorder` (array, optional): Sort order
- `limit` (integer, optional): Result limit

**Returns:** Array of LLD rules

### `zabbix_create_discovery_rule`
Create LLD rule with prototypes.

**Parameters:**
- `hostid` (string, required): Host ID for the rule
- `name` (string, required): Rule name
- `key_` (string, required): Rule key
- `type` (integer, required): Item type
- `delay` (string, required): Update interval
- `interfaceid` (string, optional): Interface ID
- `description` (string, optional): Rule description
- `status` (integer, optional): Rule status
- `filter` (object, optional): Discovery filter
- `lifetime` (string, optional): Lost resource lifetime
- `preprocessing` (array, optional): Preprocessing steps
- `lld_macro_paths` (array, optional): LLD macro paths
- `overrides` (array, optional): Discovery overrides

**Returns:** Created rule ID

### `zabbix_update_discovery_rule`
Update LLD rule configuration.

**Parameters:**
- `itemid` (string, required): Rule ID to update
- `name` (string, optional): Rule name
- `key_` (string, optional): Rule key
- `delay` (string, optional): Update interval
- `description` (string, optional): Rule description
- `status` (integer, optional): Rule status
- `filter` (object, optional): Discovery filter
- `lifetime` (string, optional): Lost resource lifetime
- `preprocessing` (array, optional): Preprocessing steps
- `lld_macro_paths` (array, optional): LLD macro paths
- `overrides` (array, optional): Discovery overrides

**Returns:** Update confirmation

### `zabbix_delete_discovery_rules`
Delete LLD rules.

**Parameters:**
- `ruleids` (array, required): Rule IDs to delete

**Returns:** Deletion confirmation

### `zabbix_get_discovered_hosts`
Get hosts discovered by network discovery.

**Parameters:**
- `dhostids` (array, optional): Specific discovered host IDs
- `druleids` (array, optional): Filter by discovery rule IDs
- `output` (string/array, optional): Output fields
- `selectDRules` (string/array, optional): Include discovery rules
- `selectDServices` (string/array, optional): Include discovered services
- `selectHosts` (string/array, optional): Include created hosts
- `filter` (object, optional): Filter conditions
- `search` (object, optional): Search conditions
- `sortfield` (array, optional): Sort fields
- `sortorder` (array, optional): Sort order
- `limit` (integer, optional): Result limit

**Returns:** Array of discovered hosts

### `zabbix_get_discovered_services`
Get services discovered by network discovery.

**Parameters:**
- `dserviceids` (array, optional): Specific service IDs
- `dhostids` (array, optional): Filter by discovered host IDs
- `druleids` (array, optional): Filter by discovery rule IDs
- `output` (string/array, optional): Output fields
- `selectDRules` (string/array, optional): Include discovery rules
- `selectDHosts` (string/array, optional): Include discovered hosts
- `selectHosts` (string/array, optional): Include created hosts
- `filter` (object, optional): Filter conditions
- `search` (object, optional): Search conditions
- `sortfield` (array, optional): Sort fields
- `sortorder` (array, optional): Sort order
- `limit` (integer, optional): Result limit

**Returns:** Array of discovered services

## 📢 Media & Notifications Tools (7 tools)

### `zabbix_get_media_types`
Get media types with filtering.

**Parameters:**
- `mediatypeids` (array, optional): Specific media type IDs
- `output` (string/array, optional): Output fields
- `selectUsers` (string/array, optional): Include user information
- `selectMessageTemplates` (string/array, optional): Include message templates
- `filter` (object, optional): Filter conditions
- `search` (object, optional): Search conditions
- `sortfield` (array, optional): Sort fields
- `sortorder` (array, optional): Sort order
- `limit` (integer, optional): Result limit

**Returns:** Array of media type objects

### `zabbix_create_media_type`
Create media type for notifications.

**Parameters:**
- `name` (string, required): Media type name
- `type` (integer, required): Media type (0=email, 1=script, 2=SMS, 3=webhook, 4=Jabber)
- `smtp_server` (string, optional): SMTP server for email
- `smtp_port` (integer, optional): SMTP port
- `smtp_helo` (string, optional): SMTP HELO
- `smtp_email` (string, optional): SMTP email address
- `smtp_security` (integer, optional): SMTP security
- `smtp_verify_peer` (integer, optional): SMTP verify peer
- `smtp_verify_host` (integer, optional): SMTP verify host
- `smtp_authentication` (integer, optional): SMTP authentication
- `username` (string, optional): Username for authentication
- `passwd` (string, optional): Password for authentication
- `content_type` (integer, optional): Content type
- `script_name` (string, optional): Script name for script type
- `parameters` (array, optional): Script parameters
- `gsm_modem` (string, optional): GSM modem for SMS
- `status` (integer, optional): Media type status
- `max_sessions` (integer, optional): Maximum concurrent sessions
- `attempts` (integer, optional): Delivery attempts
- `attempt_interval` (string, optional): Attempt interval
- `description` (string, optional): Description
- `message_templates` (array, optional): Message templates

**Returns:** Created media type ID

### `zabbix_update_media_type`
Update media type configuration.

**Parameters:**
- `mediatypeid` (string, required): Media type ID to update
- `name` (string, optional): Media type name
- `type` (integer, optional): Media type
- `smtp_server` (string, optional): SMTP server
- `smtp_port` (integer, optional): SMTP port
- `status` (integer, optional): Media type status
- `description` (string, optional): Description
- `message_templates` (array, optional): Message templates

**Returns:** Update confirmation

### `zabbix_delete_media_types`
Delete media types.

**Parameters:**
- `mediatypeids` (array, required): Media type IDs to delete

**Returns:** Deletion confirmation

### `zabbix_test_media_type`
Test media type delivery.

**Parameters:**
- `mediatypeid` (string, required): Media type ID to test
- `sendto` (string, required): Test recipient
- `subject` (string, optional): Test subject
- `message` (string, optional): Test message

**Returns:** Test result with delivery status

### `zabbix_get_user_media`
Get user notification settings.

**Parameters:**
- `userids` (array, optional): Filter by user IDs
- `mediatypeids` (array, optional): Filter by media type IDs
- `output` (string/array, optional): Output fields
- `selectUsers` (string/array, optional): Include user information
- `selectMediatypes` (string/array, optional): Include media type information
- `filter` (object, optional): Filter conditions
- `search` (object, optional): Search conditions
- `sortfield` (array, optional): Sort fields
- `sortorder` (array, optional): Sort order
- `limit` (integer, optional): Result limit

**Returns:** User media configurations

### `zabbix_get_alerts`
Get sent notifications and alerts.

**Parameters:**
- `alertids` (array, optional): Specific alert IDs
- `actionids` (array, optional): Filter by action IDs
- `eventids` (array, optional): Filter by event IDs
- `hostids` (array, optional): Filter by host IDs
- `mediatypeids` (array, optional): Filter by media type IDs
- `userids` (array, optional): Filter by user IDs
- `output` (string/array, optional): Output fields
- `selectHosts` (string/array, optional): Include host information
- `selectMediatypes` (string/array, optional): Include media type information
- `selectUsers` (string/array, optional): Include user information
- `time_from` (timestamp, optional): Start time
- `time_till` (timestamp, optional): End time
- `filter` (object, optional): Filter conditions
- `search` (object, optional): Search conditions
- `sortfield` (array, optional): Sort fields
- `sortorder` (array, optional): Sort order
- `limit` (integer, optional): Result limit

**Returns:** Array of alert records

## ⚡ Actions & Escalations Tools (6 tools)

### `zabbix_get_actions`
Get actions with comprehensive filtering.

**Parameters:**
- `actionids` (array, optional): Specific action IDs
- `hostids` (array, optional): Filter by host IDs
- `groupids` (array, optional): Filter by group IDs
- `triggerids` (array, optional): Filter by trigger IDs
- `mediatypeids` (array, optional): Filter by media type IDs
- `usrgrpids` (array, optional): Filter by user group IDs
- `userids` (array, optional): Filter by user IDs
- `scriptids` (array, optional): Filter by script IDs
- `output` (string/array, optional): Output fields
- `selectOperations` (string/array, optional): Include operations
- `selectRecoveryOperations` (string/array, optional): Include recovery operations
- `selectUpdateOperations` (string/array, optional): Include update operations
- `selectFilter` (string/array, optional): Include filter conditions
- `filter` (object, optional): Filter conditions
- `search` (object, optional): Search conditions
- `sortfield` (array, optional): Sort fields
- `sortorder` (array, optional): Sort order
- `limit` (integer, optional): Result limit

**Returns:** Array of action objects

### `zabbix_create_action`
Create automated response action.

**Parameters:**
- `name` (string, required): Action name
- `eventsource` (integer, required): Event source (0=trigger, 1=discovery, 2=auto registration, 3=internal, 4=service)
- `status` (integer, optional): Action status (0=enabled, 1=disabled)
- `esc_period` (string, optional): Escalation period
- `def_shortdata` (string, optional): Default subject
- `def_longdata` (string, optional): Default message
- `r_shortdata` (string, optional): Recovery subject
- `r_longdata` (string, optional): Recovery message
- `ack_shortdata` (string, optional): Update subject
- `ack_longdata` (string, optional): Update message
- `filter` (object, required): Filter conditions
- `operations` (array, required): Action operations
- `recovery_operations` (array, optional): Recovery operations
- `update_operations` (array, optional): Update operations
- `pause_suppressed` (integer, optional): Pause if suppressed

**Returns:** Created action ID

### `zabbix_update_action`
Update action configuration.

**Parameters:**
- `actionid` (string, required): Action ID to update
- `name` (string, optional): Action name
- `status` (integer, optional): Action status
- `esc_period` (string, optional): Escalation period
- `def_shortdata` (string, optional): Default subject
- `def_longdata` (string, optional): Default message
- `filter` (object, optional): Filter conditions
- `operations` (array, optional): Action operations
- `recovery_operations` (array, optional): Recovery operations
- `update_operations` (array, optional): Update operations

**Returns:** Update confirmation

### `zabbix_delete_actions`
Delete actions.

**Parameters:**
- `actionids` (array, required): Action IDs to delete

**Returns:** Deletion confirmation

### `zabbix_get_correlations`
Get event correlations.

**Parameters:**
- `correlationids` (array, optional): Specific correlation IDs
- `output` (string/array, optional): Output fields
- `selectFilter` (string/array, optional): Include filter conditions
- `selectOperations` (string/array, optional): Include operations
- `filter` (object, optional): Filter conditions
- `search` (object, optional): Search conditions
- `sortfield` (array, optional): Sort fields
- `sortorder` (array, optional): Sort order
- `limit` (integer, optional): Result limit

**Returns:** Array of correlation objects

### `zabbix_create_correlation`
Create event correlation rule.

**Parameters:**
- `name` (string, required): Correlation name
- `filter` (object, required): Correlation filter
- `operations` (array, required): Correlation operations
- `status` (integer, optional): Correlation status (0=enabled, 1=disabled)
- `description` (string, optional): Description

**Returns:** Created correlation ID

## 🗺️ Maps Management Tools (12 tools)

### Value Maps (4 tools)

#### `zabbix_get_value_maps`
Get value maps for numeric-to-text conversion.

**Parameters:**
- `valuemapids` (array, optional): Specific value map IDs
- `output` (string/array, optional): Output fields
- `selectMappings` (string/array, optional): Include mappings
- `filter` (object, optional): Filter conditions
- `search` (object, optional): Search conditions
- `sortfield` (array, optional): Sort fields
- `sortorder` (array, optional): Sort order
- `limit` (integer, optional): Result limit

**Returns:** Array of value map objects

#### `zabbix_create_value_map`
Create value mapping rules.

**Parameters:**
- `name` (string, required): Value map name
- `mappings` (array, required): Value mappings

**Returns:** Created value map ID

#### `zabbix_update_value_map`
Update value map configuration.

**Parameters:**
- `valuemapid` (string, required): Value map ID to update
- `name` (string, optional): Value map name
- `mappings` (array, optional): Value mappings

**Returns:** Update confirmation

#### `zabbix_delete_value_maps`
Delete value maps.

**Parameters:**
- `valuemapids` (array, required): Value map IDs to delete

**Returns:** Deletion confirmation

### Icon Maps (4 tools)

#### `zabbix_get_icon_maps`
Get icon maps for inventory-based icons.

**Parameters:**
- `iconmapids` (array, optional): Specific icon map IDs
- `output` (string/array, optional): Output fields
- `selectMappings` (string/array, optional): Include mappings
- `filter` (object, optional): Filter conditions
- `search` (object, optional): Search conditions
- `sortfield` (array, optional): Sort fields
- `sortorder` (array, optional): Sort order
- `limit` (integer, optional): Result limit

**Returns:** Array of icon map objects

#### `zabbix_create_icon_map`
Create icon mapping rules.

**Parameters:**
- `name` (string, required): Icon map name
- `default_iconid` (string, required): Default icon ID
- `mappings` (array, required): Icon mappings

**Returns:** Created icon map ID

#### `zabbix_update_icon_map`
Update icon map configuration.

**Parameters:**
- `iconmapid` (string, required): Icon map ID to update
- `name` (string, optional): Icon map name
- `default_iconid` (string, optional): Default icon ID
- `mappings` (array, optional): Icon mappings

**Returns:** Update confirmation

#### `zabbix_delete_icon_maps`
Delete icon maps.

**Parameters:**
- `iconmapids` (array, required): Icon map IDs to delete

**Returns:** Deletion confirmation

### Network Maps (4 tools)

#### `zabbix_get_maps`
Get network topology maps.

**Parameters:**
- `sysmapids` (array, optional): Specific map IDs
- `output` (string/array, optional): Output fields
- `selectSelements` (string/array, optional): Include map elements
- `selectLinks` (string/array, optional): Include map links
- `selectIconMap` (string/array, optional): Include icon map
- `selectUrls` (string/array, optional): Include URLs
- `selectUsers` (string/array, optional): Include users
- `selectUserGroups` (string/array, optional): Include user groups
- `selectShapes` (string/array, optional): Include shapes
- `selectLines` (string/array, optional): Include lines
- `filter` (object, optional): Filter conditions
- `search` (object, optional): Search conditions
- `sortfield` (array, optional): Sort fields
- `sortorder` (array, optional): Sort order
- `limit` (integer, optional): Result limit

**Returns:** Array of network map objects

#### `zabbix_create_map`
Create network map with elements and links.

**Parameters:**
- `name` (string, required): Map name
- `width` (integer, required): Map width
- `height` (integer, required): Map height
- `backgroundid` (string, optional): Background image ID
- `label_type` (integer, optional): Label type
- `label_location` (integer, optional): Label location
- `highlight` (integer, optional): Highlight option
- `expandproblem` (integer, optional): Expand single problem
- `markelements` (integer, optional): Mark elements on trigger status change
- `show_unack` (integer, optional): Show unacknowledged problems
- `grid_size` (integer, optional): Grid size
- `grid_show` (integer, optional): Show grid
- `grid_align` (integer, optional): Grid align
- `label_format` (integer, optional): Label format
- `iconmapid` (string, optional): Icon map ID
- `expand_macros` (integer, optional): Expand macros
- `severity_min` (integer, optional): Minimum severity
- `userid` (string, optional): Owner user ID
- `private` (integer, optional): Private map
- `selements` (array, optional): Map elements
- `links` (array, optional): Map links
- `users` (array, optional): User permissions
- `userGroups` (array, optional): User group permissions
- `shapes` (array, optional): Map shapes
- `lines` (array, optional): Map lines
- `urls` (array, optional): Map URLs

**Returns:** Created map ID

#### `zabbix_update_map`
Update map configuration.

**Parameters:**
- `sysmapid` (string, required): Map ID to update
- `name` (string, optional): Map name
- `width` (integer, optional): Map width
- `height` (integer, optional): Map height
- `backgroundid` (string, optional): Background image ID
- `iconmapid` (string, optional): Icon map ID
- `selements` (array, optional): Map elements
- `links` (array, optional): Map links
- `users` (array, optional): User permissions
- `userGroups` (array, optional): User group permissions
- `shapes` (array, optional): Map shapes
- `lines` (array, optional): Map lines
- `urls` (array, optional): Map URLs

**Returns:** Update confirmation

#### `zabbix_delete_maps`
Delete network maps.

**Parameters:**
- `sysmapids` (array, required): Map IDs to delete

**Returns:** Deletion confirmation

## 📊 Dashboard Management Tools (4 tools)

### `zabbix_get_dashboards`
Get dashboards with pages and widgets.

**Parameters:**
- `dashboardids` (array, optional): Specific dashboard IDs
- `output` (string/array, optional): Output fields
- `selectPages` (string/array, optional): Include pages
- `selectUsers` (string/array, optional): Include users
- `selectUserGroups` (string/array, optional): Include user groups
- `filter` (object, optional): Filter conditions
- `search` (object, optional): Search conditions
- `sortfield` (array, optional): Sort fields
- `sortorder` (array, optional): Sort order
- `limit` (integer, optional): Result limit

**Returns:** Array of dashboard objects

### `zabbix_create_dashboard`
Create dashboard with pages and widgets.

**Parameters:**
- `name` (string, required): Dashboard name
- `userid` (string, optional): Owner user ID
- `private` (integer, optional): Private dashboard
- `pages` (array, required): Dashboard pages
- `users` (array, optional): User permissions
- `userGroups` (array, optional): User group permissions

**Returns:** Created dashboard ID

### `zabbix_update_dashboard`
Update dashboard configuration.

**Parameters:**
- `dashboardid` (string, required): Dashboard ID to update
- `name` (string, optional): Dashboard name
- `userid` (string, optional): Owner user ID
- `private` (integer, optional): Private dashboard
- `pages` (array, optional): Dashboard pages
- `users` (array, optional): User permissions
- `userGroups` (array, optional): User group permissions

**Returns:** Update confirmation

### `zabbix_delete_dashboards`
Delete dashboards.

**Parameters:**
- `dashboardids` (array, required): Dashboard IDs to delete

**Returns:** Deletion confirmation

## 🌐 Proxy Management Tools (4 tools)

### `zabbix_get_proxies`
Get proxies with host and group information.

**Parameters:**
- `proxyids` (array, optional): Specific proxy IDs
- `output` (string/array, optional): Output fields
- `selectHosts` (string/array, optional): Include host information
- `selectInterface` (string/array, optional): Include interface information
- `filter` (object, optional): Filter conditions
- `search` (object, optional): Search conditions
- `sortfield` (array, optional): Sort fields
- `sortorder` (array, optional): Sort order
- `limit` (integer, optional): Result limit

**Returns:** Array of proxy objects

### `zabbix_create_proxy`
Create proxy for distributed monitoring.

**Parameters:**
- `name` (string, required): Proxy name
- `operating_mode` (integer, required): Operating mode (0=active, 1=passive)
- `description` (string, optional): Proxy description
- `address` (string, optional): Proxy address (for passive mode)
- `port` (string, optional): Proxy port (for passive mode)
- `proxy_groupid` (string, optional): Proxy group ID
- `local_address` (string, optional): Local address
- `local_port` (string, optional): Local port
- `tls_connect` (integer, optional): TLS connection type
- `tls_accept` (integer, optional): TLS accept type
- `tls_issuer` (string, optional): TLS issuer
- `tls_subject` (string, optional): TLS subject
- `tls_psk_identity` (string, optional): TLS PSK identity
- `tls_psk` (string, optional): TLS PSK
- `custom_timeouts` (integer, optional): Custom timeouts enabled
- `timeout_zabbix_agent` (string, optional): Zabbix agent timeout
- `timeout_simple_check` (string, optional): Simple check timeout
- `timeout_snmp_agent` (string, optional): SNMP agent timeout
- `timeout_external_check` (string, optional): External check timeout
- `timeout_db_monitor` (string, optional): Database monitor timeout
- `timeout_http_agent` (string, optional): HTTP agent timeout
- `timeout_ssh_agent` (string, optional): SSH agent timeout
- `timeout_telnet_agent` (string, optional): Telnet agent timeout
- `timeout_script` (string, optional): Script timeout

**Returns:** Created proxy ID

### `zabbix_update_proxy`
Update proxy configuration.

**Parameters:**
- `proxyid` (string, required): Proxy ID to update
- `name` (string, optional): Proxy name
- `operating_mode` (integer, optional): Operating mode
- `description` (string, optional): Proxy description
- `address` (string, optional): Proxy address
- `port` (string, optional): Proxy port
- `tls_connect` (integer, optional): TLS connection type
- `tls_accept` (integer, optional): TLS accept type
- `custom_timeouts` (integer, optional): Custom timeouts enabled

**Returns:** Update confirmation

### `zabbix_delete_proxies`
Delete proxies.

**Parameters:**
- `proxyids` (array, required): Proxy IDs to delete

**Returns:** Deletion confirmation

## 🔄 Configuration Management Tools (3 tools)

### `zabbix_export_configuration`
Export Zabbix configuration as XML/JSON.

**Parameters:**
- `format` (string, required): Export format (xml or json)
- `options` (object, required): Export options containing entity types and IDs

**Returns:** Exported configuration string

### `zabbix_import_configuration`
Import configuration from XML/JSON.

**Parameters:**
- `format` (string, required): Import format (xml or json)
- `source` (string, required): Configuration data to import
- `rules` (object, required): Import rules

**Returns:** Import result with created/updated/failed counts

### `zabbix_import_compare_configuration`
Compare configuration without importing.

**Parameters:**
- `format` (string, required): Configuration format (xml or json)
- `source` (string, required): Configuration data to compare
- `rules` (object, required): Comparison rules

**Returns:** Comparison results showing what would be created/updated

## 🏢 Business Services Tools (5 tools)

### `zabbix_get_services`
Get business services with hierarchy.

**Parameters:**
- `serviceids` (array, optional): Specific service IDs
- `parentids` (array, optional): Filter by parent service IDs
- `childids` (array, optional): Filter by child service IDs
- `output` (string/array, optional): Output fields
- `selectParents` (string/array, optional): Include parent services
- `selectChildren` (string/array, optional): Include child services
- `selectTags` (string/array, optional): Include service tags
- `selectProblemTags` (string/array, optional): Include problem tags
- `selectStatusRules` (string/array, optional): Include status rules
- `filter` (object, optional): Filter conditions
- `search` (object, optional): Search conditions
- `sortfield` (array, optional): Sort fields
- `sortorder` (array, optional): Sort order
- `limit` (integer, optional): Result limit

**Returns:** Array of service objects

### `zabbix_create_service`
Create business service for IT service monitoring.

**Parameters:**
- `name` (string, required): Service name
- `algorithm` (integer, required): Status calculation algorithm
- `sortorder` (integer, optional): Sort order
- `weight` (integer, optional): Service weight
- `propagation_rule` (integer, optional): Status propagation rule
- `propagation_value` (integer, optional): Status propagation value
- `description` (string, optional): Service description
- `parents` (array, optional): Parent service links
- `children` (array, optional): Child service links
- `tags` (array, optional): Service tags
- `problem_tags` (array, optional): Problem tags for status calculation
- `status_rules` (array, optional): Status calculation rules

**Returns:** Created service ID

### `zabbix_update_service`
Update service configuration.

**Parameters:**
- `serviceid` (string, required): Service ID to update
- `name` (string, optional): Service name
- `algorithm` (integer, optional): Status calculation algorithm
- `sortorder` (integer, optional): Sort order
- `weight` (integer, optional): Service weight
- `propagation_rule` (integer, optional): Status propagation rule
- `propagation_value` (integer, optional): Status propagation value
- `description` (string, optional): Service description
- `parents` (array, optional): Parent service links
- `children` (array, optional): Child service links
- `tags` (array, optional): Service tags
- `problem_tags` (array, optional): Problem tags
- `status_rules` (array, optional): Status calculation rules

**Returns:** Update confirmation

### `zabbix_delete_services`
Delete business services.

**Parameters:**
- `serviceids` (array, required): Service IDs to delete

**Returns:** Deletion confirmation

### `zabbix_get_service_sla`
Get SLA data for services.

**Parameters:**
- `serviceids` (array, required): Service IDs
- `intervals` (array, required): Time intervals for SLA calculation

**Returns:** SLA calculation results with uptime percentages and problem times

---

**This API reference provides complete documentation for all 90+ tools across 19 categories in the Zabbix MCP Server. Each tool includes detailed parameter descriptions, requirements, and return value information for effective integration and usage.** 