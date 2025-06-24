/**
 * Integration Test Example for Zabbix MCP Server
 * 
 * This script tests the core functionality of the Zabbix MCP server
 * to ensure all major features are working correctly.
 * 
 * Usage:
 *   node integration-test.js
 * 
 * Environment Variables:
 *   ZABBIX_API_URL - Your Zabbix server API endpoint (required)
 *   ZABBIX_API_TOKEN - Your Zabbix API token (recommended)
 *   ZABBIX_USERNAME - Your Zabbix username (alternative)
 *   ZABBIX_PASSWORD - Your Zabbix password (alternative)
 */

const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');

class ZabbixMCPIntegrationTest {
    constructor() {
        this.client = null;
        this.apiUrl = process.env.ZABBIX_API_URL;
        this.apiToken = process.env.ZABBIX_API_TOKEN;
        this.username = process.env.ZABBIX_USERNAME;
        this.password = process.env.ZABBIX_PASSWORD;
        this.serverPath = '../src/index.js';
        this.testResults = [];
    }

    async runTests() {
        console.log('🚀 Starting Zabbix MCP Server Integration Tests');
        console.log('===============================================\n');

        // Validate environment
        if (!this.apiUrl) {
            console.error('❌ ZABBIX_API_URL environment variable is required');
            return false;
        }

        if (!this.apiToken && (!this.username || !this.password)) {
            console.error('❌ Either ZABBIX_API_TOKEN or ZABBIX_USERNAME+ZABBIX_PASSWORD is required');
            return false;
        }

        try {
            // Connect to server
            await this.connectToServer();

            // Run test suite
            await this.testAuthentication();
            await this.testHostManagement();
            await this.testItemsAndTriggers();
            await this.testProblemsAndHistory();
            await this.testUserManagement();
            await this.testMaintenance();

            // Print results
            this.printTestResults();

            return this.testResults.every(result => result.passed);

        } catch (error) {
            console.error('❌ Integration test failed:', error.message);
            return false;
        } finally {
            await this.cleanup();
        }
    }

    async connectToServer() {
        console.log('🔌 Connecting to Zabbix MCP Server...');

        const transport = new StdioClientTransport({
            command: 'node',
            args: [this.serverPath],
            env: {
                ZABBIX_API_URL: this.apiUrl,
                ...(this.apiToken ? {
                    ZABBIX_API_TOKEN: this.apiToken
                } : {
                    ZABBIX_USERNAME: this.username,
                    ZABBIX_PASSWORD: this.password
                }),
                LOG_LEVEL: 'error' // Reduce noise during tests
            }
        });

        this.client = new Client({
            name: "zabbix-integration-test",
            version: "1.0.0"
        }, {
            capabilities: {}
        });

        await this.client.connect(transport);
        console.log('✅ Connected successfully\n');
    }

    async testAuthentication() {
        console.log('🔐 Testing Authentication...');

        try {
            const result = await this.client.callTool('zabbix_get_api_info', {});
            const apiInfo = JSON.parse(result.content[0].text);
            
            this.addTestResult('Authentication', true, `API Version: ${apiInfo.version || 'Unknown'}`);
            console.log('  ✅ Authentication successful');
            
        } catch (error) {
            this.addTestResult('Authentication', false, error.message);
            console.log('  ❌ Authentication failed');
        }
    }

    async testHostManagement() {
        console.log('🖥️ Testing Host Management...');

        try {
            // Test getting hosts
            const hosts = await this.client.callTool('zabbix_get_hosts', {
                output: ['hostid', 'host', 'name'],
                limit: 5
            });
            
            const hostData = JSON.parse(hosts.content[0].text);
            const hostCount = hostData.length || 0;
            
            this.addTestResult('Get Hosts', true, `Found ${hostCount} hosts`);
            console.log(`  ✅ Retrieved ${hostCount} hosts`);

            // Test getting host groups
            const groups = await this.client.callTool('zabbix_get_hostgroups', {
                output: ['groupid', 'name'],
                limit: 5
            });
            
            const groupData = JSON.parse(groups.content[0].text);
            const groupCount = groupData.length || 0;
            
            this.addTestResult('Get Host Groups', true, `Found ${groupCount} groups`);
            console.log(`  ✅ Retrieved ${groupCount} host groups`);
            
        } catch (error) {
            this.addTestResult('Host Management', false, error.message);
            console.log('  ❌ Host management test failed');
        }
    }

    async testItemsAndTriggers() {
        console.log('📊 Testing Items and Triggers...');

        try {
            // Test getting items
            const items = await this.client.callTool('zabbix_get_items', {
                output: ['itemid', 'name', 'key_'],
                filter: { status: 0 },
                limit: 5
            });
            
            const itemData = JSON.parse(items.content[0].text);
            const itemCount = itemData.length || 0;
            
            this.addTestResult('Get Items', true, `Found ${itemCount} items`);
            console.log(`  ✅ Retrieved ${itemCount} items`);

            // Test getting triggers
            const triggers = await this.client.callTool('zabbix_get_triggers', {
                output: ['triggerid', 'description', 'priority'],
                filter: { status: 0 },
                limit: 5
            });
            
            const triggerData = JSON.parse(triggers.content[0].text);
            const triggerCount = triggerData.length || 0;
            
            this.addTestResult('Get Triggers', true, `Found ${triggerCount} triggers`);
            console.log(`  ✅ Retrieved ${triggerCount} triggers`);
            
        } catch (error) {
            this.addTestResult('Items and Triggers', false, error.message);
            console.log('  ❌ Items and triggers test failed');
        }
    }

    async testProblemsAndHistory() {
        console.log('🚨 Testing Problems and History...');

        try {
            // Test getting problems
            const problems = await this.client.callTool('zabbix_get_problems', {
                output: 'extend',
                recent: true,
                limit: 5
            });
            
            const problemData = JSON.parse(problems.content[0].text);
            const problemCount = problemData.length || 0;
            
            this.addTestResult('Get Problems', true, `Found ${problemCount} problems`);
            console.log(`  ✅ Retrieved ${problemCount} current problems`);

            // Test getting events
            const events = await this.client.callTool('zabbix_get_events', {
                output: ['eventid', 'source', 'object', 'objectid'],
                time_from: Math.floor(Date.now() / 1000) - 3600, // Last hour
                limit: 5
            });
            
            const eventData = JSON.parse(events.content[0].text);
            const eventCount = eventData.length || 0;
            
            this.addTestResult('Get Events', true, `Found ${eventCount} events`);
            console.log(`  ✅ Retrieved ${eventCount} recent events`);
            
        } catch (error) {
            this.addTestResult('Problems and History', false, error.message);
            console.log('  ❌ Problems and history test failed');
        }
    }

    async testUserManagement() {
        console.log('👤 Testing User Management...');

        try {
            // Test getting users
            const users = await this.client.callTool('zabbix_get_users', {
                output: ['userid', 'username', 'name'],
                limit: 5
            });
            
            const userData = JSON.parse(users.content[0].text);
            const userCount = userData.length || 0;
            
            this.addTestResult('Get Users', true, `Found ${userCount} users`);
            console.log(`  ✅ Retrieved ${userCount} users`);

            // Test getting user groups
            const userGroups = await this.client.callTool('zabbix_get_usergroups', {
                output: ['usrgrpid', 'name'],
                status: 0
            });
            
            const userGroupData = JSON.parse(userGroups.content[0].text);
            const userGroupCount = userGroupData.length || 0;
            
            this.addTestResult('Get User Groups', true, `Found ${userGroupCount} user groups`);
            console.log(`  ✅ Retrieved ${userGroupCount} user groups`);
            
        } catch (error) {
            this.addTestResult('User Management', false, error.message);
            console.log('  ❌ User management test failed');
        }
    }

    async testMaintenance() {
        console.log('🔧 Testing Maintenance...');

        try {
            // Test getting maintenance periods
            const maintenance = await this.client.callTool('zabbix_get_maintenances', {
                output: ['maintenanceid', 'name', 'active_since', 'active_till'],
                limit: 5
            });
            
            const maintenanceData = JSON.parse(maintenance.content[0].text);
            const maintenanceCount = maintenanceData.length || 0;
            
            this.addTestResult('Get Maintenance', true, `Found ${maintenanceCount} maintenance periods`);
            console.log(`  ✅ Retrieved ${maintenanceCount} maintenance periods`);
            
        } catch (error) {
            this.addTestResult('Maintenance', false, error.message);
            console.log('  ❌ Maintenance test failed');
        }
    }

    addTestResult(testName, passed, details) {
        this.testResults.push({
            name: testName,
            passed,
            details
        });
    }

    printTestResults() {
        console.log('\n📋 Test Results Summary');
        console.log('=======================');
        
        const passedTests = this.testResults.filter(r => r.passed).length;
        const totalTests = this.testResults.length;
        
        console.log(`\nTotal Tests: ${totalTests}`);
        console.log(`Passed: ${passedTests}`);
        console.log(`Failed: ${totalTests - passedTests}`);
        console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%\n`);
        
        this.testResults.forEach(result => {
            const status = result.passed ? '✅' : '❌';
            console.log(`${status} ${result.name}: ${result.details}`);
        });
        
        if (passedTests === totalTests) {
            console.log('\n🎉 All tests passed! The Zabbix MCP Server is working correctly.');
        } else {
            console.log('\n⚠️ Some tests failed. Please check your Zabbix configuration and permissions.');
        }
    }

    async cleanup() {
        if (this.client) {
            try {
                await this.client.close();
                console.log('\n🔌 Disconnected from Zabbix MCP Server');
            } catch (error) {
                // Ignore cleanup errors
            }
        }
    }
}

// Run the integration test
async function main() {
    const test = new ZabbixMCPIntegrationTest();
    const success = await test.runTests();
    process.exit(success ? 0 : 1);
}

if (require.main === module) {
    main().catch(error => {
        console.error('❌ Integration test crashed:', error);
        process.exit(1);
    });
}

module.exports = ZabbixMCPIntegrationTest; 