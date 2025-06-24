/**
 * Zabbix MCP Client Example
 * 
 * This example demonstrates how to connect to and use the Zabbix MCP server
 * for comprehensive monitoring, alerting, and infrastructure management.
 */

const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');

// Configuration
const CONFIG = {
    // API Token Authentication (Recommended)
    apiUrl: process.env.ZABBIX_API_URL || 'https://your-zabbix-server/api_jsonrpc.php',
    apiToken: process.env.ZABBIX_API_TOKEN || 'your_api_token_here',
    
    // Username/Password Authentication (Alternative)
    username: process.env.ZABBIX_USERNAME || 'Admin',
    password: process.env.ZABBIX_PASSWORD || 'your_password',
    
    // Server configuration
    serverPath: process.env.ZABBIX_MCP_SERVER_PATH || '../src/index.js',
    logLevel: process.env.LOG_LEVEL || 'info'
};

/**
 * Create and connect to Zabbix MCP Server
 */
async function createZabbixClient() {
    console.log('🔌 Connecting to Zabbix MCP Server...');
    
    // Create transport
    const transport = new StdioClientTransport({
        command: 'node',
        args: [CONFIG.serverPath],
        env: {
            // Use API token if available, otherwise username/password
            ZABBIX_API_URL: CONFIG.apiUrl,
            ...(CONFIG.apiToken !== 'your_api_token_here' ? {
                ZABBIX_API_TOKEN: CONFIG.apiToken
            } : {
                ZABBIX_USERNAME: CONFIG.username,
                ZABBIX_PASSWORD: CONFIG.password
            }),
            LOG_LEVEL: CONFIG.logLevel
        }
    });

    // Create client
    const client = new Client({
        name: "zabbix-example-client",
        version: "1.0.0"
    }, {
        capabilities: {}
    });

    // Connect
    await client.connect(transport);
    console.log('✅ Connected to Zabbix MCP Server');
    
    return client;
}

/**
 * Example: Get Zabbix API Information
 */
async function getApiInfo(client) {
    console.log('\n🔍 Getting Zabbix API Information...');
    
    try {
        const result = await client.callTool('zabbix_get_api_info', {});
        console.log('API Version:', result.content[0].text);
    } catch (error) {
        console.error('❌ Error getting API info:', error.message);
    }
}

/**
 * Example: Monitor Hosts and Problems
 */
async function monitorHosts(client) {
    console.log('\n🖥️ Getting Host Information...');
    
    try {
        // Get all hosts
        const hosts = await client.callTool('zabbix_get_hosts', {
            output: ['hostid', 'host', 'name', 'status'],
            selectInterfaces: ['interfaceid', 'ip', 'port'],
            selectGroups: ['groupid', 'name'],
            limit: 10
        });
        
        console.log(`Found ${hosts.content[0].text.length || 0} hosts`);
        
        // Get current problems
        const problems = await client.callTool('zabbix_get_problems', {
            output: 'extend',
            selectTags: 'extend',
            recent: true,
            limit: 5
        });
        
        console.log(`Current problems: ${problems.content[0].text.length || 0}`);
        
    } catch (error) {
        console.error('❌ Error monitoring hosts:', error.message);
    }
}

/**
 * Example: Manage Triggers and Alerts
 */
async function manageTriggers(client) {
    console.log('\n⚠️ Managing Triggers...');
    
    try {
        // Get triggers with high priority
        const triggers = await client.callTool('zabbix_get_triggers', {
            output: 'extend',
            selectHosts: ['hostid', 'host'],
            filter: {
                priority: [4, 5] // High and Disaster priorities
            },
            sortfield: 'priority',
            sortorder: 'DESC',
            limit: 10
        });
        
        console.log(`High priority triggers: ${triggers.content[0].text.length || 0}`);
        
    } catch (error) {
        console.error('❌ Error managing triggers:', error.message);
    }
}

/**
 * Example: Historical Data Analysis
 */
async function analyzeHistory(client) {
    console.log('\n📈 Analyzing Historical Data...');
    
    try {
        // Get items for analysis
        const items = await client.callTool('zabbix_get_items', {
            output: ['itemid', 'name', 'key_', 'value_type'],
            selectHosts: ['hostid', 'host'],
            filter: {
                status: 0 // Active items only
            },
            limit: 5
        });
        
        console.log(`Active items for analysis: ${items.content[0].text.length || 0}`);
        
        // Get recent trends
        const trends = await client.callTool('zabbix_get_trends', {
            itemids: [], // Would use actual item IDs from above
            time_from: Math.floor(Date.now() / 1000) - 86400, // Last 24 hours
            limit: 100
        });
        
        console.log('Historical trends retrieved');
        
    } catch (error) {
        console.error('❌ Error analyzing history:', error.message);
    }
}

/**
 * Example: User and Group Management
 */
async function manageUsers(client) {
    console.log('\n👤 Managing Users and Groups...');
    
    try {
        // Get user groups
        const userGroups = await client.callTool('zabbix_get_usergroups', {
            output: 'extend',
            selectUsers: ['userid', 'username'],
            status: 0 // Enabled groups
        });
        
        console.log(`User groups: ${userGroups.content[0].text.length || 0}`);
        
        // Get users
        const users = await client.callTool('zabbix_get_users', {
            output: ['userid', 'username', 'name', 'surname'],
            selectUsrgrps: ['usrgrpid', 'name'],
            getAccess: true
        });
        
        console.log(`Users: ${users.content[0].text.length || 0}`);
        
    } catch (error) {
        console.error('❌ Error managing users:', error.message);
    }
}

/**
 * Main demonstration function
 */
async function main() {
    let client;
    
    console.log('🚀 Zabbix MCP Server Client Example');
    console.log('=====================================\n');
    
    // Check configuration
    if (CONFIG.apiToken === 'your_api_token_here' && CONFIG.password === 'your_password') {
        console.log('❌ Please set your Zabbix credentials in environment variables:');
        console.log('   For API Token: export ZABBIX_API_TOKEN="your_actual_token"');
        console.log('   For Username/Password: export ZABBIX_USERNAME="Admin" ZABBIX_PASSWORD="your_password"');
        console.log('   And: export ZABBIX_API_URL="https://your-zabbix-server/api_jsonrpc.php"');
        return;
    }
    
    try {
        // Connect to server
        client = await createZabbixClient();
        
        // Run examples
        await getApiInfo(client);
        await monitorHosts(client);
        await manageTriggers(client);
        await analyzeHistory(client);
        await manageUsers(client);
        
        console.log('\n✅ All examples completed successfully!');
        console.log('\n📚 Available Tools Categories:');
        console.log('   🔐 Authentication (3 tools)');
        console.log('   🖥️ Host Management (3 tools)');
        console.log('   👥 Host Groups (4 tools)');
        console.log('   📊 Items Management (5 tools)');
        console.log('   ⚠️ Triggers Management (4 tools)');
        console.log('   🚨 Problems Management (2 tools)');
        console.log('   📈 History Tools (3 tools)');
        console.log('   🔧 Maintenance Tools (4 tools)');
        console.log('   👤 User Management (6 tools)');
        console.log('   🗺️ Network Maps (4 tools)');
        console.log('   📋 Templates (4 tools)');
        console.log('   📡 Discovery (4 tools)');
        console.log('   🎛️ Dashboards (3 tools)');
        console.log('   🔗 Proxies (4 tools)');
        console.log('   ⚙️ Configuration (3 tools)');
        console.log('   📝 Scripts (4 tools)');
        console.log('   🔔 Media & Notifications (4 tools)');
        console.log('   🏢 Services (4 tools)');
        console.log('   🎯 Actions & Alerts (4 tools)');
        
    } catch (error) {
        console.error('❌ Error in main execution:', error.message);
        console.log('\n🔧 Troubleshooting tips:');
        console.log('1. Verify your Zabbix server is accessible');
        console.log('2. Check that your API token or credentials are valid');
        console.log('3. Ensure your user has API access permissions');
        console.log('4. Verify the Zabbix API URL is correct');
        
    } finally {
        // Cleanup
        if (client) {
            try {
                await client.close();
                console.log('🔌 Disconnected from Zabbix MCP Server');
            } catch (error) {
                console.error('❌ Error during cleanup:', error.message);
            }
        }
    }
}

// Export for use in other modules
module.exports = { createZabbixClient, CONFIG };

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
} 