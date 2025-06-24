# Zabbix MCP Server

A comprehensive Model Context Protocol (MCP) server for integrating with Zabbix monitoring systems. This server provides complete Zabbix API functionality through a standardized interface, enabling seamless monitoring, alerting, and infrastructure management with **modern authentication** and a **clean, professional interface**.

## 🚀 Features

- **🔐 Modern Authentication** - API Token (Zabbix 5.4+) and Username/Password support
- **🧹 Clean Interface** - Professional, modern API without legacy baggage
- **90+ API Tools** across 19 categories for comprehensive monitoring management
- **Complete Zabbix Integration** with all major API endpoints
- **Enterprise-Grade Functionality** including maps, dashboards, proxies, and services
- **Comprehensive Schema Validation** with Zod type safety
- **Modular Architecture** with clean separation of concerns
- **Production Ready** with robust error handling and logging

## 📊 Quick Stats

- **🔑 Dual Authentication** - API Token (recommended) + Username/Password
- **19 Tool Categories** covering all Zabbix functionality
- **90+ Individual Tools** for granular control
- **100% Type Safe** with Zod schema validation
- **Modular Design** with API and tools layers
- **Enterprise Features** including business services and SLA monitoring

## 🔐 Authentication Methods

### **🎫 API Token Authentication (Recommended)**

**Best for**: Production environments, CI/CD, automated systems

```env
ZABBIX_API_URL=https://your-zabbix-server/api_jsonrpc.php
ZABBIX_API_TOKEN=your_api_token_here
```

**Benefits:**
- ✅ **More secure** (no password exposure)
- ✅ **No login/logout** required (direct token usage)
- ✅ **Easy revocation** (token management in Zabbix UI)
- ✅ **Long-lived** (configurable expiration)
- ✅ **Audit-friendly** (token usage tracking)

### **🔐 Username/Password Authentication (Traditional)**

**Best for**: Development, testing, legacy systems

```env
ZABBIX_API_URL=https://your-zabbix-server/api_jsonrpc.php
ZABBIX_USERNAME=Admin
ZABBIX_PASSWORD=your_password
```

**Features:**
- ✅ **Session-based** authentication with auto-refresh
- ✅ **Automatic login/logout** handling
- ✅ **Compatible** with all Zabbix versions
- ✅ **Familiar** authentication flow

## 🏗️ Tool Categories Overview

### 🔐 **Authentication & Core** (3 tools)
- Session management and API authentication
- User login/logout functionality
- API version information

### 🖥️ **Infrastructure Management**
- **Hosts** (3 tools) - Host discovery, creation, and management
- **Host Groups** (4 tools) - Logical host organization and grouping
- **Proxies** (4 tools) - Distributed monitoring with active/passive proxies
- **Items** (5 tools) - Data collection configuration and monitoring
- **Triggers** (4 tools) - Alert condition definition and management

### 📊 **Monitoring & Alerting**
- **Problems** (2 tools) - Active issue tracking and resolution
- **History** (3 tools) - Historical data retrieval and analysis
- **Maintenance** (4 tools) - Scheduled maintenance window management
- **Actions** (6 tools) - Automated response and escalation workflows

### 🎯 **Advanced Features**
- **Templates** (6 tools) - Reusable monitoring configurations
- **Scripts** (6 tools) - Remote script execution and management
- **Discovery** (6 tools) - Low-level discovery and auto-registration
- **Services** (5 tools) - Business service monitoring and SLA tracking

### 🎨 **Visualization & Reporting**
- **Maps** (12 tools) - Network topology and value/icon mapping
- **Dashboards** (4 tools) - Custom visualization and widget management

### 📢 **Communication & Integration**
- **Media** (7 tools) - Notification channels and alert delivery
- **Users** (6 tools) - User and user group management
- **Configuration** (3 tools) - Import/export and backup functionality

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Zabbix server with API access
- Valid Zabbix credentials (API token or username/password)

### Installation

```bash
git clone <repository-url>
cd zabbix-mcp-server
npm install
```

### Configuration

#### **Option 1: API Token Authentication (Recommended)**

1. **Generate API token** in Zabbix UI: `Administration → General → Tokens → Create token`
2. **Create `.env` file**:

```env
ZABBIX_API_URL=https://your-zabbix-server/api_jsonrpc.php
ZABBIX_API_TOKEN=your_api_token_here
```

#### **Option 2: Username/Password Authentication**

**Create `.env` file**:

```env
ZABBIX_API_URL=https://your-zabbix-server/api_jsonrpc.php
ZABBIX_USERNAME=Admin
ZABBIX_PASSWORD=your_password
```

### Running the Server

```bash
# Start the MCP server (stdio mode)
npm start

# Or run directly
node src/index.js

# HTTP mode (for development)
MCP_TRANSPORT_MODE=http npm start
```

**Log output:**
```
[INFO] [Zabbix API Client] Using API token authentication (Zabbix 5.4+)
[INFO] [Zabbix API Client] Connected to Zabbix API version: 6.0.0
[INFO] MCP Server started successfully
```

## 🔌 MCP Configuration

To use this server with Claude Desktop, Cursor IDE, or other MCP-compatible clients, you need to add it to your MCP configuration file.

### For Claude Desktop (Windows/Mac/Linux)

Add the following configuration to your `claude_desktop_config.json` file:

- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Mac**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

#### **API Token Authentication (Recommended)**
```json
{
  "mcpServers": {
    "zabbix-mcp": {
      "command": "node",
      "args": [
        "/path/to/your/zabbix-mcp-server/src/index.js"
      ],
      "env": {
        "ZABBIX_API_URL": "https://your-zabbix-server/api_jsonrpc.php",
        "ZABBIX_API_TOKEN": "your_api_token_here"
      }
    }
  }
}
```

#### **Username/Password Authentication**
```json
{
  "mcpServers": {
    "zabbix-mcp": {
      "command": "node",
      "args": [
        "/path/to/your/zabbix-mcp-server/src/index.js"
      ],
      "env": {
        "ZABBIX_API_URL": "https://your-zabbix-server/api_jsonrpc.php",
        "ZABBIX_USERNAME": "Admin",
        "ZABBIX_PASSWORD": "your_password"
      }
    }
  }
}
```

### For Cursor IDE

Add the following configuration to your `mcp.json` file in your Cursor settings directory:

- **Windows**: `%APPDATA%\Cursor\User\mcp.json`
- **Mac**: `~/Library/Application Support/Cursor/User/mcp.json`
- **Linux**: `~/.config/Cursor/User/mcp.json`

#### **API Token Authentication (Recommended)**
```json
{
  "mcpServers": {
    "zabbix-mcp": {
      "command": "node",
      "args": [
        "/path/to/your/zabbix-mcp-server/src/index.js"
      ],
      "env": {
        "ZABBIX_API_URL": "https://your-zabbix-server/api_jsonrpc.php",
        "ZABBIX_API_TOKEN": "your_api_token_here"
      }
    }
  }
}
```

#### **Username/Password Authentication**
```json
{
  "mcpServers": {
    "zabbix-mcp": {
      "command": "node",
      "args": [
        "/path/to/your/zabbix-mcp-server/src/index.js"
      ],
      "env": {
        "ZABBIX_API_URL": "https://your-zabbix-server/api_jsonrpc.php",
        "ZABBIX_USERNAME": "Admin",
        "ZABBIX_PASSWORD": "your_password"
      }
    }
  }
}
```

### Configuration Notes

- **Replace the path**: Update `/path/to/your/zabbix-mcp-server/src/index.js` with the actual path to your installation
- **Replace credentials**: Update with your actual Zabbix server URL and credentials
- **Server name**: You can change `zabbix-mcp` to any name you prefer
- **Additional variables**: Add any other environment variables as needed (e.g., `LOG_LEVEL=debug`)

### Getting Your Zabbix Credentials

#### **For API Token Authentication (Recommended)**

**Prerequisites:**
- Zabbix server version 5.4 or higher
- User account with appropriate permissions
- Access to Zabbix web interface

**Step-by-step instructions:**
1. **Log in** to your Zabbix web interface
2. **Navigate** to `Administration → General → Tokens`
3. **Click** `Create token` button
4. **Configure** your token:
   - **Name**: `MCP Server Token` (or any descriptive name)
   - **User**: Select the user account
   - **Expires at**: Set expiration date (optional, recommended for security)
   - **Description**: Optional description
5. **Click** `Add` to create the token
6. **Copy** the generated token (you won't be able to see it again)
7. **Paste** the token into your MCP configuration file

#### **For Username/Password Authentication**

**Prerequisites:**
- Zabbix server version 5.0 or higher
- Valid user account with API access permissions

**Required information:**
- **ZABBIX_API_URL**: Your Zabbix server API endpoint (usually `https://your-server/api_jsonrpc.php`)
- **ZABBIX_USERNAME**: Your Zabbix username (e.g., `Admin`)
- **ZABBIX_PASSWORD**: Your Zabbix password

### Testing Your Configuration

You can verify your configuration works by testing it with curl:

#### **API Token Test**
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "apiinfo.version",
    "params": {},
    "auth": "your_api_token_here",
    "id": 1
  }' \
  https://your-zabbix-server/api_jsonrpc.php
```

#### **Username/Password Test**
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "user.login",
    "params": {
      "username": "Admin",
      "password": "your_password"
    },
    "id": 1
  }' \
  https://your-zabbix-server/api_jsonrpc.php
```

### Security Notes

- **Keep credentials secure** and don't share them publicly
- **Use API tokens** in production environments for better security
- **Set token expiration** dates for enhanced security
- **Use HTTPS** for your Zabbix server to encrypt communication
- **Limit user permissions** to only what's needed for monitoring
- **Regularly rotate** API tokens and passwords

### Restart Required

After updating your MCP configuration, **restart Claude Desktop or your IDE** for the changes to take effect.

### Troubleshooting MCP Configuration

#### **Common Issues**

1. **Server not appearing in client**
   - Verify the path to `src/index.js` is correct
   - Check that Node.js is installed and accessible
   - Restart your MCP client

2. **Authentication errors**
   - Verify your Zabbix server URL is correct
   - Check that your API token or credentials are valid
   - Ensure your user has API access permissions

3. **Connection timeouts**
   - Check network connectivity to your Zabbix server
   - Verify firewall settings allow the connection
   - Test with curl commands above

#### **Debug Mode**

Add debug logging to troubleshoot issues:
```json
{
  "mcpServers": {
    "zabbix-mcp": {
      "command": "node",
      "args": ["/path/to/your/zabbix-mcp-server/src/index.js"],
      "env": {
        "ZABBIX_API_URL": "https://your-zabbix-server/api_jsonrpc.php",
        "ZABBIX_API_TOKEN": "your_api_token_here",
        "LOG_LEVEL": "debug"
      }
    }
  }
}
```

## 🔧 Modern API Interface

The server provides a **clean, modern interface** for programmatic access:

```javascript
const { request, getVersion, checkConnection } = require('./src/api/zabbix-client');

// Get API version
const version = await getVersion();
console.log(`Zabbix API Version: ${version}`);

// Check connection
const connected = await checkConnection();
console.log(`Connected: ${connected}`);

// Make API calls
const hosts = await request('host.get', {
    output: ['hostid', 'host', 'name'],
    selectInterfaces: ['interfaceid', 'ip']
});

const problems = await request('problem.get', {
    output: 'extend',
    selectTags: 'extend',
    recent: true
});
```

**Available Methods:**
- `getClient()` - Get authenticated client instance
- `request(method, params)` - Make API calls
- `checkConnection()` - Check connection status
- `disconnect()` - Disconnect and cleanup
- `getVersion()` - Get API version

## 📚 Comprehensive Tool Reference

### 🔐 Authentication Tools (3 tools)

#### `zabbix_login`
Authenticate with Zabbix server and establish session
- **Parameters**: `username`, `password`
- **Returns**: Authentication token and session info
- **Note**: Automatic with API token authentication

#### `zabbix_logout`
Terminate current Zabbix session
- **Parameters**: None (uses current session)
- **Returns**: Logout confirmation

#### `zabbix_get_api_info`
Get Zabbix API version and server information
- **Parameters**: None
- **Returns**: API version, server details

### 🖥️ Host Management Tools (3 tools)

#### `zabbix_get_hosts`
Retrieve hosts with comprehensive filtering options
- **Parameters**: `hostids`, `groupids`, `output`, `selectGroups`, `selectInterfaces`, etc.
- **Returns**: Array of host objects with detailed information

#### `zabbix_create_host`
Create new host with interfaces and group assignments
- **Parameters**: `host`, `name`, `groups`, `interfaces`, `templates`, `inventory`, etc.
- **Returns**: Created host ID and confirmation

#### `zabbix_update_host`
Update existing host configuration
- **Parameters**: `hostid`, `host`, `name`, `groups`, `interfaces`, `status`, etc.
- **Returns**: Update confirmation

### 👥 Host Groups Tools (4 tools)

#### `zabbix_get_hostgroups`
Get host groups with filtering and host information
- **Parameters**: `groupids`, `output`, `selectHosts`, `filter`, `search`, etc.
- **Returns**: Array of host group objects

#### `zabbix_create_hostgroup`
Create new host group
- **Parameters**: `name`
- **Returns**: Created group ID

#### `zabbix_update_hostgroup`
Update host group properties
- **Parameters**: `groupid`, `name`
- **Returns**: Update confirmation

#### `zabbix_delete_hostgroups`
Delete multiple host groups
- **Parameters**: `groupids` (array)
- **Returns**: Deletion confirmation

### 📊 Items Management Tools (5 tools)

#### `zabbix_get_items`
Retrieve monitoring items with comprehensive options
- **Parameters**: `itemids`, `hostids`, `groupids`, `output`, `selectHosts`, etc.
- **Returns**: Array of item objects with monitoring data

#### `zabbix_create_item`
Create new monitoring item
- **Parameters**: `hostid`, `name`, `key_`, `type`, `value_type`, `delay`, etc.
- **Returns**: Created item ID

#### `zabbix_update_item`
Update existing item configuration
- **Parameters**: `itemid`, `name`, `key_`, `delay`, `status`, etc.
- **Returns**: Update confirmation

#### `zabbix_delete_items`
Delete multiple items
- **Parameters**: `itemids` (array)
- **Returns**: Deletion confirmation

#### `zabbix_get_item_history`
Retrieve historical data for items
- **Parameters**: `itemids`, `history`, `time_from`, `time_till`, `limit`, etc.
- **Returns**: Historical data points

### ⚠️ Triggers Management Tools (4 tools)

#### `zabbix_get_triggers`
Get triggers with filtering and dependency information
- **Parameters**: `triggerids`, `hostids`, `groupids`, `output`, `selectHosts`, etc.
- **Returns**: Array of trigger objects

#### `zabbix_create_trigger`
Create new trigger with expression and dependencies
- **Parameters**: `description`, `expression`, `priority`, `status`, etc.
- **Returns**: Created trigger ID

#### `zabbix_update_trigger`
Update trigger configuration
- **Parameters**: `triggerid`, `description`, `expression`, `priority`, etc.
- **Returns**: Update confirmation

#### `zabbix_delete_triggers`
Delete multiple triggers
- **Parameters**: `triggerids` (array)
- **Returns**: Deletion confirmation

### 🚨 Problems Management Tools (2 tools)

#### `zabbix_get_problems`
Get current problems with filtering options
- **Parameters**: `hostids`, `groupids`, `objectids`, `severities`, `time_from`, etc.
- **Returns**: Array of current problems

#### `zabbix_acknowledge_problems`
Acknowledge problems with messages and actions
- **Parameters**: `eventids`, `message`, `action`, `severity`, etc.
- **Returns**: Acknowledgment confirmation

### 📈 History Tools (3 tools)

#### `zabbix_get_history`
Retrieve historical monitoring data
- **Parameters**: `history`, `itemids`, `time_from`, `time_till`, `limit`, etc.
- **Returns**: Historical data points

#### `zabbix_get_trends`
Get trend data for long-term analysis
- **Parameters**: `itemids`, `time_from`, `time_till`, `limit`
- **Returns**: Aggregated trend data

#### `zabbix_get_events`
Retrieve system events and alerts
- **Parameters**: `eventids`, `hostids`, `objectids`, `time_from`, etc.
- **Returns**: Array of events

### 🔧 Maintenance Tools (4 tools)

#### `zabbix_get_maintenances`
Get maintenance periods with host and group information
- **Parameters**: `maintenanceids`, `hostids`, `groupids`, `output`, etc.
- **Returns**: Array of maintenance periods

#### `zabbix_create_maintenance`
Create new maintenance window
- **Parameters**: `name`, `active_since`, `active_till`, `hosts`, `groups`, etc.
- **Returns**: Created maintenance ID

#### `zabbix_update_maintenance`
Update maintenance period configuration
- **Parameters**: `maintenanceid`, `name`, `active_since`, `active_till`, etc.
- **Returns**: Update confirmation

#### `zabbix_delete_maintenances`
Delete maintenance periods
- **Parameters**: `maintenanceids` (array)
- **Returns**: Deletion confirmation

### 👤 User Management Tools (6 tools)

#### `zabbix_get_users`
Get users with group and media information
- **Parameters**: `userids`, `output`, `selectUsrgrps`, `selectMedias`, etc.
- **Returns**: Array of user objects

#### `zabbix_create_user`
Create new user account
- **Parameters**: `username`, `passwd`, `name`, `surname`, `usrgrps`, etc.
- **Returns**: Created user ID

#### `zabbix_update_user`
Update user account information
- **Parameters**: `userid`, `username`, `name`, `surname`, `passwd`, etc.
- **Returns**: Update confirmation

#### `zabbix_delete_users`
Delete user accounts
- **Parameters**: `userids` (array)
- **Returns**: Deletion confirmation

#### `zabbix_get_usergroups`
Get user groups with permissions
- **Parameters**: `usrgrpids`, `output`, `selectUsers`, `selectRights`, etc.
- **Returns**: Array of user group objects

#### `zabbix_create_usergroup`
Create new user group
- **Parameters**: `name`, `gui_access`, `users_status`, `rights`, etc.
- **Returns**: Created group ID

### 📋 Template Management Tools (6 tools)

#### `zabbix_get_templates`
Get templates with items, triggers, and graphs
- **Parameters**: `templateids`, `hostids`, `groupids`, `output`, etc.
- **Returns**: Array of template objects

#### `zabbix_create_template`
Create new template
- **Parameters**: `host`, `name`, `groups`, `description`, etc.
- **Returns**: Created template ID

#### `zabbix_update_template`
Update template configuration
- **Parameters**: `templateid`, `host`, `name`, `groups`, etc.
- **Returns**: Update confirmation

#### `zabbix_delete_templates`
Delete templates
- **Parameters**: `templateids` (array)
- **Returns**: Deletion confirmation

#### `zabbix_link_templates`
Link templates to hosts
- **Parameters**: `hostids`, `templateids`
- **Returns**: Link confirmation

#### `zabbix_unlink_templates`
Unlink templates from hosts
- **Parameters**: `hostids`, `templateids`
- **Returns**: Unlink confirmation

### 🔧 Scripts Management Tools (6 tools)

#### `zabbix_get_scripts`
Get scripts with filtering by type and scope
- **Parameters**: `scriptids`, `hostids`, `groupids`, `output`, etc.
- **Returns**: Array of script objects

#### `zabbix_create_script`
Create script for remote execution
- **Parameters**: `name`, `command`, `type`, `scope`, `host_access`, etc.
- **Returns**: Created script ID

#### `zabbix_update_script`
Update script configuration
- **Parameters**: `scriptid`, `name`, `command`, `type`, etc.
- **Returns**: Update confirmation

#### `zabbix_delete_scripts`
Delete scripts
- **Parameters**: `scriptids` (array)
- **Returns**: Deletion confirmation

#### `zabbix_execute_script`
Execute script on hosts
- **Parameters**: `scriptid`, `hostid`, `manualinput`
- **Returns**: Execution result

#### `zabbix_get_script_execution_history`
Get script execution history from events
- **Parameters**: `hostids`, `time_from`, `time_till`, `limit`
- **Returns**: Execution history

### 🔍 Discovery Tools (6 tools)

#### `zabbix_get_discovery_rules`
Get low-level discovery rules
- **Parameters**: `itemids`, `hostids`, `output`, `selectItemPrototypes`, etc.
- **Returns**: Array of LLD rules

#### `zabbix_create_discovery_rule`
Create LLD rule with prototypes
- **Parameters**: `hostid`, `name`, `key_`, `delay`, `filter`, etc.
- **Returns**: Created rule ID

#### `zabbix_update_discovery_rule`
Update LLD rule configuration
- **Parameters**: `itemid`, `name`, `key_`, `delay`, etc.
- **Returns**: Update confirmation

#### `zabbix_delete_discovery_rules`
Delete LLD rules
- **Parameters**: `ruleids` (array)
- **Returns**: Deletion confirmation

#### `zabbix_get_discovered_hosts`
Get hosts discovered by network discovery
- **Parameters**: `dhostids`, `druleids`, `output`, etc.
- **Returns**: Array of discovered hosts

#### `zabbix_get_discovered_services`
Get services discovered by network discovery
- **Parameters**: `dserviceids`, `dhostids`, `output`, etc.
- **Returns**: Array of discovered services

### 📢 Media & Notifications Tools (7 tools)

#### `zabbix_get_media_types`
Get media types with filtering
- **Parameters**: `mediatypeids`, `output`, `filter`, `search`, etc.
- **Returns**: Array of media type objects

#### `zabbix_create_media_type`
Create media type for notifications
- **Parameters**: `name`, `type`, `smtp_server`, `smtp_helo`, etc.
- **Returns**: Created media type ID

#### `zabbix_update_media_type`
Update media type configuration
- **Parameters**: `mediatypeid`, `name`, `type`, `status`, etc.
- **Returns**: Update confirmation

#### `zabbix_delete_media_types`
Delete media types
- **Parameters**: `mediatypeids` (array)
- **Returns**: Deletion confirmation

#### `zabbix_test_media_type`
Test media type delivery
- **Parameters**: `mediatypeid`, `sendto`, `subject`, `message`
- **Returns**: Test result

#### `zabbix_get_user_media`
Get user notification settings
- **Parameters**: `userids`, `mediatypeids`, `output`, etc.
- **Returns**: User media configurations

#### `zabbix_get_alerts`
Get sent notifications and alerts
- **Parameters**: `alertids`, `actionids`, `eventids`, `time_from`, etc.
- **Returns**: Array of alert records

### ⚡ Actions & Escalations Tools (6 tools)

#### `zabbix_get_actions`
Get actions with comprehensive filtering
- **Parameters**: `actionids`, `hostids`, `triggerids`, `output`, etc.
- **Returns**: Array of action objects

#### `zabbix_create_action`
Create automated response action
- **Parameters**: `name`, `eventsource`, `status`, `filter`, `operations`, etc.
- **Returns**: Created action ID

#### `zabbix_update_action`
Update action configuration
- **Parameters**: `actionid`, `name`, `status`, `filter`, etc.
- **Returns**: Update confirmation

#### `zabbix_delete_actions`
Delete actions
- **Parameters**: `actionids` (array)
- **Returns**: Deletion confirmation

#### `zabbix_get_correlations`
Get event correlations
- **Parameters**: `correlationids`, `output`, `filter`, etc.
- **Returns**: Array of correlation objects

#### `zabbix_create_correlation`
Create event correlation rule
- **Parameters**: `name`, `filter`, `operations`, `status`
- **Returns**: Created correlation ID

### 🗺️ Maps Management Tools (12 tools)

#### Value Maps (4 tools)
- `zabbix_get_value_maps` - Get value maps for numeric-to-text conversion
- `zabbix_create_value_map` - Create value mapping rules
- `zabbix_update_value_map` - Update value map configuration
- `zabbix_delete_value_maps` - Delete value maps

#### Icon Maps (4 tools)
- `zabbix_get_icon_maps` - Get icon maps for inventory-based icons
- `zabbix_create_icon_map` - Create icon mapping rules
- `zabbix_update_icon_map` - Update icon map configuration
- `zabbix_delete_icon_maps` - Delete icon maps

#### Network Maps (4 tools)
- `zabbix_get_maps` - Get network topology maps
- `zabbix_create_map` - Create network map with elements and links
- `zabbix_update_map` - Update map configuration
- `zabbix_delete_maps` - Delete network maps

### 📊 Dashboard Management Tools (4 tools)

#### `zabbix_get_dashboards`
Get dashboards with pages and widgets
- **Parameters**: `dashboardids`, `output`, `selectPages`, etc.
- **Returns**: Array of dashboard objects

#### `zabbix_create_dashboard`
Create dashboard with pages and widgets
- **Parameters**: `name`, `pages`, `users`, `userGroups`, etc.
- **Returns**: Created dashboard ID

#### `zabbix_update_dashboard`
Update dashboard configuration
- **Parameters**: `dashboardid`, `name`, `pages`, etc.
- **Returns**: Update confirmation

#### `zabbix_delete_dashboards`
Delete dashboards
- **Parameters**: `dashboardids` (array)
- **Returns**: Deletion confirmation

### 🌐 Proxy Management Tools (4 tools)

#### `zabbix_get_proxies`
Get proxies with host and group information
- **Parameters**: `proxyids`, `output`, `selectHosts`, etc.
- **Returns**: Array of proxy objects

#### `zabbix_create_proxy`
Create proxy for distributed monitoring
- **Parameters**: `name`, `operating_mode`, `address`, `port`, etc.
- **Returns**: Created proxy ID

#### `zabbix_update_proxy`
Update proxy configuration
- **Parameters**: `proxyid`, `name`, `operating_mode`, etc.
- **Returns**: Update confirmation

#### `zabbix_delete_proxies`
Delete proxies
- **Parameters**: `proxyids` (array)
- **Returns**: Deletion confirmation

### 🔄 Configuration Management Tools (3 tools)

#### `zabbix_export_configuration`
Export Zabbix configuration as XML/JSON
- **Parameters**: `format`, `options` (hosts, templates, etc.)
- **Returns**: Exported configuration string

#### `zabbix_import_configuration`
Import configuration from XML/JSON
- **Parameters**: `format`, `source`, `rules`
- **Returns**: Import result

#### `zabbix_import_compare_configuration`
Compare configuration without importing
- **Parameters**: `format`, `source`, `rules`
- **Returns**: Comparison results

### 🏢 Business Services Tools (5 tools)

#### `zabbix_get_services`
Get business services with hierarchy
- **Parameters**: `serviceids`, `parentids`, `output`, etc.
- **Returns**: Array of service objects

#### `zabbix_create_service`
Create business service for IT service monitoring
- **Parameters**: `name`, `algorithm`, `parents`, `children`, etc.
- **Returns**: Created service ID

#### `zabbix_update_service`
Update service configuration
- **Parameters**: `serviceid`, `name`, `algorithm`, etc.
- **Returns**: Update confirmation

#### `zabbix_delete_services`
Delete business services
- **Parameters**: `serviceids` (array)
- **Returns**: Deletion confirmation

#### `zabbix_get_service_sla`
Get SLA data for services
- **Parameters**: `serviceids`, `intervals`
- **Returns**: SLA calculation results

## 🏗️ Architecture

### Project Structure

```
├── src/
│   ├── api/                 # API layer modules
│   │   ├── client.js        # Zabbix API client
│   │   ├── hosts.js         # Host management API
│   │   ├── items.js         # Items API
│   │   ├── triggers.js      # Triggers API
│   │   ├── maps.js          # Maps API
│   │   ├── dashboards.js    # Dashboards API
│   │   ├── services.js      # Business services API
│   │   └── ...              # Other API modules
│   ├── tools/               # MCP tools layer
│   │   ├── auth.js          # Authentication tools
│   │   ├── hosts.js         # Host management tools
│   │   ├── items.js         # Items tools
│   │   ├── triggers.js      # Triggers tools
│   │   ├── maps.js          # Maps tools
│   │   ├── dashboards.js    # Dashboard tools
│   │   ├── services.js      # Services tools
│   │   └── index.js         # Tool registration
│   ├── utils/
│   │   └── logger.js        # Logging utility
│   └── index.js             # Main server entry point
├── docs/                    # Documentation
├── examples/                # Usage examples
└── scripts/                 # Utility scripts
```

### Design Principles

1. **Modular Architecture**: Clean separation between API layer and tools layer
2. **Type Safety**: Comprehensive Zod schema validation for all inputs
3. **Error Handling**: Robust error handling with detailed logging
4. **Consistency**: Uniform patterns across all tool categories
5. **Extensibility**: Easy to add new tools and functionality

## 🔧 Development

### Adding New Tools

1. **Create API Module** (`src/api/newmodule.js`):
```javascript
const { request } = require('./zabbix-client');

async function getItems(params = {}) {
    return await request('item.get', params);
}

module.exports = { newModuleApi: { getItems } };
```

2. **Create Tools Module** (`src/tools/newmodule.js`):
```javascript
const { logger } = require('../utils/logger');
const api = require('../api');
const { z } = require('zod');

function registerTools(server) {
    server.tool('tool_name', 'Description', {
        param: z.string().describe('Parameter description')
    }, async (args) => {
        // Implementation
    });
}

module.exports = { registerTools };
```

3. **Register Module** in `src/api/index.js` and `src/tools/index.js`

### Schema Validation

All tools use Zod schemas for type-safe validation:

```javascript
const schema = z.object({
    hostid: z.string().describe('Host ID'),
    name: z.string().min(1).describe('Host name'),
    groups: z.array(z.object({
        groupid: z.string()
    })).min(1).describe('Host groups')
});
```

### Error Handling

Consistent error handling pattern:

```javascript
try {
    const result = await api.someApi.someMethod(params);
    logger.info(`Operation successful: ${result.length} items`);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
} catch (error) {
    logger.error('Operation failed:', error.message);
    throw error;
}
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration

# Run with coverage
npm run test:coverage
```

## 📝 Configuration

### Environment Variables

#### **API Token Authentication (Recommended)**
```env
# Required
ZABBIX_API_URL=https://your-zabbix-server/api_jsonrpc.php
ZABBIX_API_TOKEN=your_api_token_here

# Optional
LOG_LEVEL=info
CACHE_TTL=300
ZABBIX_REQUEST_TIMEOUT=120000
MCP_TRANSPORT_MODE=stdio
```

#### **Username/Password Authentication**
```env
# Required
ZABBIX_API_URL=https://your-zabbix-server/api_jsonrpc.php
ZABBIX_USERNAME=Admin
ZABBIX_PASSWORD=your_password

# Optional
LOG_LEVEL=info
CACHE_TTL=300
ZABBIX_REQUEST_TIMEOUT=120000
MCP_TRANSPORT_MODE=stdio
```

### Advanced Configuration

Create `config/zabbix.json`:

```json
{
  "api": {
    "timeout": 30000,
    "retries": 3,
    "cache": {
      "enabled": true,
      "ttl": 300
    }
  },
  "logging": {
    "level": "info",
    "format": "json"
  }
}
```

## 🚀 Deployment

### Docker

```bash
# Build image
docker build -t zabbix-mcp-server .

# Run container (API Token)
docker run -d \
  --name zabbix-mcp \
  -e ZABBIX_API_URL=https://your-zabbix-server/api_jsonrpc.php \
  -e ZABBIX_API_TOKEN=your_api_token_here \
  zabbix-mcp-server

# Run container (Username/Password)
docker run -d \
  --name zabbix-mcp \
  -e ZABBIX_API_URL=https://your-zabbix-server/api_jsonrpc.php \
  -e ZABBIX_USERNAME=Admin \
  -e ZABBIX_PASSWORD=your_password \
  zabbix-mcp-server
```

### Docker Compose

```yaml
version: '3.8'
services:
  zabbix-mcp:
    build: .
    environment:
      # API Token Authentication (Recommended)
      - ZABBIX_API_URL=https://your-zabbix-server/api_jsonrpc.php
      - ZABBIX_API_TOKEN=your_api_token_here
      
      # Or Username/Password Authentication
      # - ZABBIX_API_URL=https://your-zabbix-server/api_jsonrpc.php
      # - ZABBIX_USERNAME=Admin
      # - ZABBIX_PASSWORD=your_password
    restart: unless-stopped
```

## 📊 Monitoring & Observability

The server includes comprehensive logging and monitoring:

- **Structured Logging**: JSON-formatted logs with correlation IDs
- **Performance Metrics**: Request timing and success rates
- **Health Checks**: Built-in health monitoring endpoints
- **Error Tracking**: Detailed error reporting and stack traces

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow existing code patterns and conventions
- Add comprehensive tests for new functionality
- Update documentation for new tools
- Ensure all tools have proper Zod schema validation
- Include error handling and logging

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Zabbix](https://www.zabbix.com/) for the comprehensive monitoring platform
- [Model Context Protocol](https://modelcontextprotocol.io/) for the standardized interface
- [Zod](https://zod.dev/) for runtime type validation

## 📞 Support

- **Documentation**: Check the comprehensive tool reference above
- **Issues**: Report bugs and feature requests via GitHub Issues
- **Community**: Join discussions in GitHub Discussions
- **Enterprise Support**: Contact for enterprise support options

---

**Built with ❤️ for the Zabbix monitoring community** 