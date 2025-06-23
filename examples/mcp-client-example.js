#!/usr/bin/env node

/**
 * UpGuard CyberRisk MCP Client Example
 * 
 * This example demonstrates how to connect to and use the UpGuard MCP server
 * programmatically using the MCP SDK.
 * 
 * Prerequisites:
 * 1. Install MCP SDK: npm install @modelcontextprotocol/sdk
 * 2. Set environment variables or update the config below
 * 3. Ensure the MCP server is working: node src/index.js
 */

const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');
const path = require('path');

// Configuration
const CONFIG = {
    // Path to the MCP server (adjust as needed)
    serverPath: path.join(__dirname, '..', 'src', 'index.js'),
    
    // API credentials (set these environment variables or update directly)
    apiKey: process.env.UPGUARD_API_KEY || 'your_api_key_here',
    apiSecret: process.env.UPGUARD_API_SECRET || 'your_api_secret_here',
    baseUrl: process.env.UPGUARD_BASE_URL || 'https://cyber-risk.upguard.com/api/public',
    
    // Test hostname for examples
    testHostname: 'microsoft.com'
};

async function createUpGuardClient() {
    console.log('🔌 Connecting to UpGuard MCP Server...');
    
    const transport = new StdioClientTransport({
        command: 'node',
        args: [CONFIG.serverPath],
        env: {
            UPGUARD_API_KEY: CONFIG.apiKey,
            UPGUARD_API_SECRET: CONFIG.apiSecret,
            UPGUARD_BASE_URL: CONFIG.baseUrl
        }
    });

    const client = new Client({
        name: "upguard-example-client",
        version: "1.0.0"
    }, {
        capabilities: {}
    });

    await client.connect(transport);
    console.log('✅ Connected to UpGuard MCP Server');
    return client;
}

async function listAvailableTools(client) {
    console.log('\n📋 Listing Available Tools...');
    
    const tools = await client.listTools();
    console.log(`Found ${tools.tools.length} tools:`);
    
    // Group tools by category
    const categories = {};
    tools.tools.forEach(tool => {
        const category = tool.name.split('_')[1] || 'other';
        if (!categories[category]) categories[category] = [];
        categories[category].push(tool.name);
    });
    
    Object.entries(categories).forEach(([category, toolNames]) => {
        console.log(`\n  ${category.toUpperCase()}:`);
        toolNames.forEach(name => console.log(`    - ${name}`));
    });
}

async function demonstrateRiskAssessment(client) {
    console.log(`\n🔍 Risk Assessment Demo for ${CONFIG.testHostname}...`);
    
    try {
        // Get vendor risks
        console.log('  📊 Getting vendor risks...');
        const risks = await client.callTool('upguard_get_vendor_risks', {
            primary_hostname: CONFIG.testHostname
        });
        
        const riskData = JSON.parse(risks.content[0].text);
        console.log(`  ✅ Found ${riskData.risks?.length || 0} risks`);
        
        if (riskData.risks && riskData.risks.length > 0) {
            console.log('  Top 3 risks:');
            riskData.risks.slice(0, 3).forEach((risk, i) => {
                console.log(`    ${i + 1}. ${risk.risk_name} (Score: ${risk.score})`);
            });
        }
        
    } catch (error) {
        console.log(`  ❌ Error: ${error.message}`);
    }
}

async function demonstrateVendorManagement(client) {
    console.log('\n👥 Vendor Management Demo...');
    
    try {
        // List monitored vendors
        console.log('  📋 Getting monitored vendors...');
        const vendors = await client.callTool('upguard_list_monitored_vendors', {
            page_size: 5,
            include_risks: true
        });
        
        const vendorData = JSON.parse(vendors.content[0].text);
        console.log(`  ✅ Found ${vendorData.vendors?.length || 0} vendors (showing first 5)`);
        
        if (vendorData.vendors && vendorData.vendors.length > 0) {
            vendorData.vendors.forEach((vendor, i) => {
                console.log(`    ${i + 1}. ${vendor.primary_hostname} (Score: ${vendor.score || 'N/A'})`);
            });
        }
        
    } catch (error) {
        console.log(`  ❌ Error: ${error.message}`);
    }
}

async function demonstrateVulnerabilityTracking(client) {
    console.log(`\n🛡️ Vulnerability Tracking Demo for ${CONFIG.testHostname}...`);
    
    try {
        // Get vendor vulnerabilities
        console.log('  🔍 Getting vendor vulnerabilities...');
        const vulnerabilities = await client.callTool('upguard_get_vendor_vulnerabilities', {
            primary_hostname: CONFIG.testHostname,
            page_size: 5
        });
        
        const vulnData = JSON.parse(vulnerabilities.content[0].text);
        console.log(`  ✅ Found ${vulnData.vulnerabilities?.length || 0} vulnerabilities (showing first 5)`);
        
        if (vulnData.vulnerabilities && vulnData.vulnerabilities.length > 0) {
            vulnData.vulnerabilities.forEach((vuln, i) => {
                console.log(`    ${i + 1}. ${vuln.title || vuln.name} (Severity: ${vuln.severity || 'N/A'})`);
            });
        }
        
    } catch (error) {
        console.log(`  ❌ Error: ${error.message}`);
    }
}

async function demonstrateBreachMonitoring(client) {
    console.log('\n🚨 Data Breach Monitoring Demo...');
    
    try {
        // List identity breaches
        console.log('  📋 Getting recent identity breaches...');
        const breaches = await client.callTool('upguard_list_identity_breaches', {
            page_size: 3
        });
        
        const breachData = JSON.parse(breaches.content[0].text);
        console.log(`  ✅ Found ${breachData.breaches?.length || 0} breaches (showing first 3)`);
        
        if (breachData.breaches && breachData.breaches.length > 0) {
            breachData.breaches.forEach((breach, i) => {
                console.log(`    ${i + 1}. ${breach.title} (${breach.date || 'Date unknown'})`);
            });
        }
        
    } catch (error) {
        console.log(`  ❌ Error: ${error.message}`);
    }
}

async function demonstrateAssetInventory(client) {
    console.log('\n📦 Asset Inventory Demo...');
    
    try {
        // List domains
        console.log('  🌐 Getting domains...');
        const domains = await client.callTool('upguard_list_domains', {
            page_size: 3
        });
        
        const domainData = JSON.parse(domains.content[0].text);
        console.log(`  ✅ Found ${domainData.domains?.length || 0} domains (showing first 3)`);
        
        if (domainData.domains && domainData.domains.length > 0) {
            domainData.domains.forEach((domain, i) => {
                console.log(`    ${i + 1}. ${domain.hostname} (Score: ${domain.score || 'N/A'})`);
            });
        }
        
        // List IP addresses
        console.log('  🔢 Getting IP addresses...');
        const ips = await client.callTool('upguard_list_ips', {
            page_size: 3
        });
        
        const ipData = JSON.parse(ips.content[0].text);
        console.log(`  ✅ Found ${ipData.ips?.length || 0} IPs (showing first 3)`);
        
        if (ipData.ips && ipData.ips.length > 0) {
            ipData.ips.forEach((ip, i) => {
                console.log(`    ${i + 1}. ${ip.ip} (Score: ${ip.score || 'N/A'})`);
            });
        }
        
    } catch (error) {
        console.log(`  ❌ Error: ${error.message}`);
    }
}

async function main() {
    console.log('🚀 UpGuard CyberRisk MCP Client Example');
    console.log('=====================================');
    
    // Validate configuration
    if (CONFIG.apiKey === 'your_api_key_here' || CONFIG.apiSecret === 'your_api_secret_here') {
        console.log('❌ Please set your UpGuard API credentials in environment variables:');
        console.log('   export UPGUARD_API_KEY="your_actual_api_key"');
        console.log('   export UPGUARD_API_SECRET="your_actual_api_secret"');
        console.log('\nOr update the CONFIG object in this script.');
        process.exit(1);
    }
    
    let client;
    
    try {
        // Connect to MCP server
        client = await createUpGuardClient();
        
        // Run demonstrations
        await listAvailableTools(client);
        await demonstrateRiskAssessment(client);
        await demonstrateVendorManagement(client);
        await demonstrateVulnerabilityTracking(client);
        await demonstrateBreachMonitoring(client);
        await demonstrateAssetInventory(client);
        
        console.log('\n🎉 Demo completed successfully!');
        console.log('\nNext steps:');
        console.log('1. Explore more tools using client.listTools()');
        console.log('2. Check swagger-api-examples.md for comprehensive examples');
        console.log('3. Build custom workflows for your security needs');
        
    } catch (error) {
        console.error('❌ Demo failed:', error.message);
        
        if (error.message.includes('ENOENT')) {
            console.log('\n💡 Troubleshooting:');
            console.log('1. Make sure Node.js is installed');
            console.log('2. Check that the server path is correct');
            console.log('3. Verify the MCP server works: node src/index.js');
        } else if (error.message.includes('401') || error.message.includes('403')) {
            console.log('\n💡 Troubleshooting:');
            console.log('1. Verify your API credentials are correct');
            console.log('2. Check that your UpGuard account has API access');
            console.log('3. Ensure the API key has sufficient permissions');
        }
        
        process.exit(1);
    } finally {
        // Clean up
        if (client) {
            try {
                await client.close();
                console.log('🔌 Disconnected from MCP server');
            } catch (error) {
                // Ignore cleanup errors
            }
        }
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down gracefully...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n👋 Shutting down gracefully...');
    process.exit(0);
});

// Run the example
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { createUpGuardClient, CONFIG }; 