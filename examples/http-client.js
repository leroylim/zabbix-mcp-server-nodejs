#!/usr/bin/env node

/**
 * Example HTTP Client for UpGuard CyberRisk MCP Server
 * 
 * This demonstrates how to connect to the MCP server using HTTP Streamable transport.
 * 
 * Usage:
 *   1. Start the server in HTTP mode: npm run start:http
 *   2. Run this client: node examples/http-client.js
 */

const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StreamableHTTPClientTransport } = require('@modelcontextprotocol/sdk/client/streamableHttp.js');

async function testHttpClient() {
    console.log('🚀 Starting HTTP MCP Client test...\n');

    try {
        // Create client
        const client = new Client({
            name: 'upguard-test-client',
            version: '1.0.0'
        });

        // Create HTTP transport
        const transport = new StreamableHTTPClientTransport(
            new URL('http://localhost:3000/mcp')
        );

        console.log('🔗 Connecting to MCP server at http://localhost:3000/mcp...');
        await client.connect(transport);
        console.log('✅ Connected successfully!\n');

        // Test listing tools
        console.log('📋 Listing available tools...');
        const tools = await client.listTools();
        console.log(`Found ${tools.tools.length} tools:`);
        tools.tools.forEach(tool => {
            console.log(`  - ${tool.name}: ${tool.description}`);
        });
        console.log();

        // Test listing prompts
        console.log('📝 Listing available prompts...');
        const prompts = await client.listPrompts();
        console.log(`Found ${prompts.prompts.length} prompts:`);
        prompts.prompts.forEach(prompt => {
            console.log(`  - ${prompt.name}: ${prompt.description || 'No description'}`);
        });
        console.log();

        // Test a simple tool call
        console.log('🔧 Testing tool call: upguard_get_account_info...');
        try {
            const result = await client.callTool({
                name: 'upguard_get_account_info',
                arguments: {}
            });
            console.log('✅ Tool call successful!');
            console.log('Response:', JSON.stringify(result, null, 2));
        } catch (error) {
            console.log('⚠️ Tool call failed (this might be expected if API key is not configured):');
            console.log(`   ${error.message}`);
        }
        console.log();

        // Close connection
        console.log('🔚 Closing connection...');
        await client.close();
        console.log('✅ Connection closed successfully!');

    } catch (error) {
        console.error('❌ Error during client test:', error);
        process.exit(1);
    }
}

// Health check function
async function checkServerHealth() {
    try {
        const response = await fetch('http://localhost:3000/health');
        if (response.ok) {
            const health = await response.json();
            console.log('🏥 Server health check:', health);
            return true;
        } else {
            console.log('⚠️ Server health check failed:', response.status);
            return false;
        }
    } catch (error) {
        console.log('❌ Server not reachable. Make sure to start the server with: npm run start:http');
        return false;
    }
}

// Main function
async function main() {
    console.log('UpGuard CyberRisk MCP Server - HTTP Client Test\n');
    console.log('============================================\n');

    // Check if server is running
    const serverHealthy = await checkServerHealth();
    if (!serverHealthy) {
        console.log('\n💡 To start the server in HTTP mode, run: npm run start:http');
        process.exit(1);
    }

    console.log();
    await testHttpClient();
    
    console.log('\n🎉 HTTP client test completed successfully!');
}

// Run the test
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { testHttpClient, checkServerHealth }; 