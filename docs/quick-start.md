# Zabbix MCP Server - Quick Start Guide

## Overview

The Zabbix MCP Server provides seamless integration with Zabbix monitoring systems through the Model Context Protocol (MCP). This guide will get you up and running in minutes with **modern authentication** and a **clean interface**.

## Prerequisites

- **Node.js**: Version 18 or higher
- **Zabbix Server**: Version 5.0+ (API Token requires 5.4+)
- **API Credentials**: Either API token (recommended) or username/password

## 🚀 Quick Setup

### 1. Clone and Install

```bash
git clone <repository-url>
cd zabbix-mcp-server
npm install
```

### 2. Configure Authentication

#### **Option 1: API Token (Recommended)**

**Generate API Token in Zabbix:**
1. Login to Zabbix UI
2. Navigate to `Administration → General → Tokens`
3. Click `Create token`
4. Configure token settings and copy the generated token

**Create `.env` file:**
```env
ZABBIX_API_URL=https://your-zabbix-server/api_jsonrpc.php
ZABBIX_API_TOKEN=your_api_token_here
```

#### **Option 2: Username/Password**

**Create `.env` file:**
```env
ZABBIX_API_URL=https://your-zabbix-server/api_jsonrpc.php
ZABBIX_USERNAME=Admin
ZABBIX_PASSWORD=your_password
```

### 3. Test the Server

```bash
# Test server startup
node src/index.js

# You should see:
# [INFO] [Zabbix API Client] Using API token authentication (Zabbix 5.4+)
# [INFO] [Zabbix API Client] Connected to Zabbix API version: 6.0.0
# [INFO] MCP Server started successfully
```

Press `Ctrl+C` to stop the server gracefully.

## 🔧 MCP Client Integration

### Option 1: Claude Desktop (Recommended)

#### Step 1: Configure Claude Desktop

Add the server to your Claude Desktop configuration file:

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Linux**: `~/.config/Claude/claude_desktop_config.json`

**For API Token Authentication:**
```json
{
  "mcpServers": {
    "zabbix": {
      "command": "node",
      "args": ["C:/path/to/zabbix-mcp-server/src/index.js"],
      "env": {
        "ZABBIX_API_URL": "https://your-zabbix-server/api_jsonrpc.php",
        "ZABBIX_API_TOKEN": "your_api_token_here"
      }
    }
  }
}
```

**For Username/Password Authentication:**
```json
{
  "mcpServers": {
    "zabbix": {
      "command": "node",
      "args": ["C:/path/to/zabbix-mcp-server/src/index.js"],
      "env": {
        "ZABBIX_API_URL": "https://your-zabbix-server/api_jsonrpc.php",
        "ZABBIX_USERNAME": "Admin",
        "ZABBIX_PASSWORD": "your_password"
      }
    }
  }
}
```

#### Step 2: Restart Claude Desktop

Close and reopen Claude Desktop. You should see the Zabbix tools available in the interface.

#### Step 3: Test Integration

Try these example prompts in Claude Desktop:

```
"Show me all hosts in my Zabbix server"
"Get current problems with high severity"
"List all host groups"
"Show me CPU utilization items for host 'web-server-01'"
"Create a maintenance window for server maintenance"
```

### Option 2: Programmatic MCP Client

#### Install MCP SDK

```bash
npm install @modelcontextprotocol/sdk
```

#### Example Client Code

```javascript
const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');

async function createZabbixClient() {
    const transport = new StdioClientTransport({
        command: 'node',
        args: ['src/index.js'],
        env: {
            // API Token Authentication (Recommended)
            ZABBIX_API_URL: 'https://your-zabbix-server/api_jsonrpc.php',
            ZABBIX_API_TOKEN: 'your_api_token_here'
            
            // Or Username/Password Authentication
            // ZABBIX_API_URL: 'https://your-zabbix-server/api_jsonrpc.php',
            // ZABBIX_USERNAME: 'Admin',
            // ZABBIX_PASSWORD: 'your_password'
        }
    });

    const client = new Client({
        name: "zabbix-client",
        version: "1.0.0"
    }, {
        capabilities: {}
    });

    await client.connect(transport);
    return client;
}

// Example usage
async function main() {
    const client = await createZabbixClient();
    
    // List available tools
    const tools = await client.listTools();
    console.log('Available tools:', tools.tools.length);
    console.log('Sample tools:', tools.tools.slice(0, 5).map(t => t.name));
    
    // Get API information
    const apiInfo = await client.callTool('zabbix_get_api_info', {});
    console.log('Zabbix API Info:', apiInfo.content[0].text);
    
    // Get hosts
    const hosts = await client.callTool('zabbix_get_hosts', {
        output: ['hostid', 'host', 'name'],
        selectInterfaces: ['interfaceid', 'ip'],
        limit: 10
    });
    console.log('Hosts:', hosts.content[0].text);
    
    await client.close();
}

main().catch(console.error);
```

## 📋 Essential Tools Reference

### Authentication & Core
```javascript
// Get API information (automatic authentication)
await client.callTool('zabbix_get_api_info', {});

// Authentication is automatic based on environment variables
// No manual login/logout required with API tokens
```

### Host Management
```javascript
// Get all hosts
await client.callTool('zabbix_get_hosts', {
    output: ['hostid', 'host', 'name', 'status'],
    selectGroups: ['groupid', 'name'],
    selectInterfaces: ['interfaceid', 'ip', 'port']
});

// Create new host
await client.callTool('zabbix_create_host', {
    host: 'web-server-01',
    name: 'Web Server 01',
    groups: [{ groupid: '2' }],
    interfaces: [{
        type: 1,
        main: 1,
        useip: 1,
        ip: '192.168.1.100',
        port: '10050'
    }]
});
```

### Problem Monitoring
```javascript
// Get current problems
await client.callTool('zabbix_get_problems', {
    severities: [3, 4, 5], // Average, High, Disaster
    recent: true,
    selectTags: 'extend',
    limit: 50
});

// Acknowledge problems
await client.callTool('zabbix_acknowledge_problems', {
    eventids: ['12345'],
    message: 'Investigating the issue',
    action: 6
});
```

### Items & Triggers
```javascript
// Get monitoring items
await client.callTool('zabbix_get_items', {
    hostids: ['10084'],
    output: ['itemid', 'name', 'key_', 'lastvalue'],
    search: { key_: 'system.cpu' }
});

// Create monitoring item
await client.callTool('zabbix_create_item', {
    hostid: '10084',
    name: 'CPU utilization',
    key_: 'system.cpu.util',
    type: 0,
    value_type: 0,
    delay: '60s',
    units: '%'
});
```

### Maintenance Management
```javascript
// Create maintenance window
await client.callTool('zabbix_create_maintenance', {
    name: 'Weekly Server Maintenance',
    active_since: Math.floor(Date.now() / 1000),
    active_till: Math.floor(Date.now() / 1000) + 7200,
    hosts: [{ hostid: '10084' }],
    timeperiods: [{
        timeperiod_type: 0,
        start_date: Math.floor(Date.now() / 1000),
        period: 7200
    }]
});
```

## 🔧 Direct API Usage

You can also use the clean modern interface directly:

```javascript
const { request, getVersion, checkConnection } = require('./src/api/zabbix-client');

async function example() {
    // Check connection
    const connected = await checkConnection();
    console.log(`Connected: ${connected}`);
    
    // Get API version
    const version = await getVersion();
    console.log(`Zabbix API Version: ${version}`);
    
    // Make direct API calls
    const hosts = await request('host.get', {
        output: ['hostid', 'host', 'name'],
        selectInterfaces: ['interfaceid', 'ip']
    });
    console.log(`Found ${hosts.length} hosts`);
    
    const problems = await request('problem.get', {
        output: 'extend',
        selectTags: 'extend',
        recent: true,
        limit: 10
    });
    console.log(`Found ${problems.length} problems`);
}

example().catch(console.error);
```

## 🔍 Testing & Verification

### Test Authentication
```bash
# Test authentication configuration
node test-auth-modernization.js
```

### Test Clean Interface
```bash
# Test clean interface (no legacy methods)
node test-clean-interface.js
```

### Test All Tools
```bash
# Run comprehensive tests
npm test
```

## 🎯 Next Steps

1. **Explore the API Reference**: Check `API_REFERENCE.md` for complete tool documentation
2. **Review Examples**: See `EXAMPLES.md` for practical usage patterns
3. **Authentication Guide**: Read `AUTHENTICATION_GUIDE.md` for detailed authentication setup
4. **Production Deployment**: Follow `DOCKER_SETUP.md` for containerized deployment

## 🆘 Troubleshooting

### Common Issues

#### "No authentication method configured"
**Solution**: Set either `ZABBIX_API_TOKEN` or `ZABBIX_USERNAME`+`ZABBIX_PASSWORD`

#### "Connection failed"
**Solutions**:
- Verify `ZABBIX_API_URL` is correct
- Check Zabbix server accessibility
- Validate SSL certificates

#### "Authentication failed"
**Solutions**:
- Verify API token is valid and not expired
- Check username/password are correct
- Ensure user has API access permissions

### Debug Mode
```bash
# Enable debug logging
LOG_LEVEL=debug node src/index.js
```

---

**🎉 You're ready to start monitoring with Zabbix MCP Server!**

The server provides 90+ tools across 19 categories for comprehensive Zabbix integration with modern authentication and a clean, professional interface. 