# UpGuard CyberRisk MCP Server - Quickstart Guide

## Overview

The UpGuard CyberRisk MCP Server provides seamless integration with the UpGuard CyberRisk API through the Model Context Protocol (MCP). This guide will get you up and running in minutes.

## Prerequisites

- **Node.js**: Version 16 or higher
- **UpGuard Account**: Active UpGuard CyberRisk subscription
- **API Credentials**: UpGuard API key and secret

## 🚀 Quick Setup

### 1. Clone and Install

```bash
git clone https://github.com/leroylim/upguard-cyberrisk-mcp-server-nodejs.git
cd upguard-cyberrisk-mcp-server-nodejs
npm install
```

### 2. Configure Environment

Create a `.env` file in the root directory:

```env
UPGUARD_API_KEY=your_api_key_here
UPGUARD_API_SECRET=your_api_secret_here
UPGUARD_BASE_URL=https://cyber-risk.upguard.com/api/public
```

### 3. Test the Server

```bash
# Test server startup
node src/index.js

# You should see:
# [INFO] Starting MCP server with stdio transport
# [MCP Server Log] UpGuard CyberRisk MCP Server (v1.2.0) STDIO transport is running...
# [INFO] STDIO server started
```

Press `Ctrl+C` to stop the server gracefully. You should see:
```
[MCP Server Log] Received SIGINT, shutting down gracefully...
[MCP Server Log] UpGuard CyberRisk MCP Server stopped
```

## 🔧 MCP Client Integration

### Option 1: Claude Desktop (Recommended)

#### Step 1: Configure Claude Desktop

Add the server to your Claude Desktop configuration file:

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Linux**: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "upguard-cyberrisk": {
      "command": "node",
      "args": ["C:/path/to/upguard-cyberrisk-mcp-server-nodejs/src/index.js"],
      "env": {
        "UPGUARD_API_KEY": "your_api_key_here",
        "UPGUARD_API_SECRET": "your_api_secret_here",
        "UPGUARD_BASE_URL": "https://cyber-risk.upguard.com/api/public"
      }
    }
  }
}
```

#### Step 2: Restart Claude Desktop

Close and reopen Claude Desktop. You should see the UpGuard tools available in the interface.

#### Step 3: Test Integration

Try these example prompts in Claude Desktop:

```
"Get the security risks for microsoft.com"
"Show me all monitored vendors"
"List domains in my account"
"Get vulnerability information for google.com"
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

async function createUpGuardClient() {
    const transport = new StdioClientTransport({
        command: 'node',
        args: ['src/index.js'],
        env: {
            UPGUARD_API_KEY: 'your_api_key_here',
            UPGUARD_API_SECRET: 'your_api_secret_here',
            UPGUARD_BASE_URL: 'https://cyber-risk.upguard.com/api/public'
        }
    });

    const client = new Client({
        name: "upguard-client",
        version: "1.0.0"
    }, {
        capabilities: {}
    });

    await client.connect(transport);
    return client;
}

// Example usage
async function main() {
    const client = await createUpGuardClient();
    
    // List available tools
    const tools = await client.listTools();
    console.log('Available tools:', tools.tools.map(t => t.name));
    
    // Get vendor risks
    const risks = await client.callTool('upguard_get_vendor_risks', {
        primary_hostname: 'microsoft.com'
    });
    console.log('Microsoft risks:', risks.content[0].text);
    
    await client.close();
}

main().catch(console.error);
```

## 📋 Essential Tools Reference

### Risk Assessment
```javascript
// Get vendor security risks
await client.callTool('upguard_get_vendor_risks', {
    primary_hostname: 'example.com'
});

// Compare risks between vendors
await client.callTool('upguard_get_vendor_risks_diff', {
    vendor_primary_hostname: 'vendor1.com',
    comparison_hostname: 'vendor2.com'
});
```

### Vendor Management
```javascript
// List all monitored vendors
await client.callTool('upguard_list_monitored_vendors', {
    page_size: 100,
    include_risks: true
});

// Get vendor details
await client.callTool('upguard_get_vendor_details', {
    hostname: 'vendor.com'
});
```

### Domain & IP Monitoring
```javascript
// List domains
await client.callTool('upguard_list_domains', {
    page_size: 50
});

// Get domain details
await client.callTool('upguard_get_domain_details', {
    hostname: 'example.com'
});

// List IP addresses
await client.callTool('upguard_list_ips', {
    page_size: 50
});
```

### Vulnerability Tracking
```javascript
// Get vendor vulnerabilities
await client.callTool('upguard_get_vendor_vulnerabilities', {
    primary_hostname: 'vendor.com',
    page_size: 100
});
```

### Data Breach Monitoring
```javascript
// List identity breaches
await client.callTool('upguard_list_identity_breaches', {
    page_size: 50
});

// Get breach details
await client.callTool('upguard_get_identity_breach', {
    id: 12345
});
```

## 🔍 Common Use Cases

### 1. Vendor Risk Assessment Workflow

```javascript
// Step 1: Get vendor risks
const risks = await client.callTool('upguard_get_vendor_risks', {
    primary_hostname: 'vendor.com'
});

// Step 2: Get detailed vulnerabilities
const vulnerabilities = await client.callTool('upguard_get_vendor_vulnerabilities', {
    primary_hostname: 'vendor.com'
});

// Step 3: Check for data breaches
const breaches = await client.callTool('upguard_list_identity_breaches', {
    page_size: 100
});
```

### 2. Security Monitoring Dashboard

```javascript
// Get overview data
const vendors = await client.callTool('upguard_list_monitored_vendors', {
    include_risks: true,
    page_size: 100
});

const domains = await client.callTool('upguard_list_domains', {
    page_size: 100
});

const breaches = await client.callTool('upguard_list_identity_breaches', {
    page_size: 50
});
```

### 3. Compliance Reporting

```javascript
// Generate vendor risk report
const report = await client.callTool('upguard_create_vendor_report', {
    vendor_primary_hostname: 'vendor.com',
    report_type: 'detailed'
});

// Check report status
const status = await client.callTool('upguard_get_report_status', {
    queued_report_id: report.report_id
});
```

## 🛠️ Troubleshooting

### Common Issues

#### 1. Authentication Errors
```
Error: 401 Unauthorized
```
**Solution**: Verify your API credentials in the `.env` file or environment variables.

#### 2. Tool Not Found
```
Error: Tool 'tool_name' not found
```
**Solution**: Check the tool name spelling. Use `client.listTools()` to see available tools.

#### 3. Parameter Validation Errors
```
Error: Invalid parameter 'hostname'
```
**Solution**: Check the parameter names match the Swagger specification. See [swagger-api-examples.md](swagger-api-examples.md) for correct parameters.

#### 4. Server Won't Start
```
Error: Tool registration failed
```
**Solution**: Check for duplicate tool registrations or syntax errors in tool files.

### Debug Mode

Enable debug logging:

```bash
DEBUG=upguard:* node src/index.js
```

### Validate Configuration

```bash
# Test API connectivity
node -e "
const api = require('./src/api');
api.getAvailableRisksV2()
  .then(() => console.log('✅ API connection successful'))
  .catch(err => console.error('❌ API connection failed:', err.message));
"
```

## 📚 Next Steps

1. **Explore All Tools**: See [swagger-api-examples.md](swagger-api-examples.md) for comprehensive examples
2. **Integration Patterns**: Check [documentation-recommendations.md](documentation-recommendations.md) for advanced patterns
3. **API Reference**: Review the complete Swagger specification in `swagger.json`
4. **Custom Workflows**: Build custom security monitoring workflows using the MCP tools

## 🔗 Additional Resources

- **UpGuard API Documentation**: [https://cyber-risk.upguard.com/api/public/docs](https://cyber-risk.upguard.com/api/public/docs)
- **MCP Protocol**: [https://modelcontextprotocol.io](https://modelcontextprotocol.io)
- **Claude Desktop**: [https://claude.ai/desktop](https://claude.ai/desktop)

## 💡 Pro Tips

1. **Pagination**: Most list endpoints support pagination. Use `page_size` and `page_token` for large datasets.
2. **Filtering**: Use label filters to focus on specific vendor categories or risk types.
3. **Batch Operations**: Use bulk tools for managing multiple domains or IPs efficiently.
4. **Real-time Updates**: Set up webhooks for real-time security event notifications.
5. **Performance**: Cache frequently accessed data like vendor lists to improve response times.

---

**Need Help?** Check the troubleshooting section above or review the comprehensive examples in [swagger-api-examples.md](swagger-api-examples.md). 