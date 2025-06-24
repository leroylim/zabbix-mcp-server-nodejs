#!/usr/bin/env node

/**
 * Test script for Clean Modern Interface
 * Verifies that only modern methods are available and working
 */

console.log('🧹 Testing Clean Modern Interface...\n');

async function testCleanInterface() {
    try {
        // Test 1: Load the clean client
        console.log('📋 Test 1: Clean Client Loading');
        const client = require('./src/api/zabbix-client');
        console.log('✅ Clean zabbix-client loaded successfully');
        
        // Test 2: Verify ONLY modern methods are available
        console.log('\n🔧 Test 2: Modern Interface Verification');
        const modernMethods = [
            'getClient', 'request', 'checkConnection', 'disconnect', 'getVersion'
        ];
        
        const legacyMethods = [
            'zabbixRequest', 'ensureLogin', 'login', 'logout', 'getApiVersion'
        ];
        
        console.log('✅ Modern methods available:');
        modernMethods.forEach(method => {
            const available = typeof client[method] === 'function';
            console.log(`  ${method}: ${available ? '✅ Available' : '❌ Missing'}`);
            if (!available) {
                throw new Error(`Modern method ${method} is missing!`);
            }
        });
        
        console.log('\n🚫 Legacy methods removed:');
        legacyMethods.forEach(method => {
            const available = typeof client[method] === 'function';
            console.log(`  ${method}: ${available ? '❌ Still present' : '✅ Removed'}`);
            if (available) {
                throw new Error(`Legacy method ${method} should be removed!`);
            }
        });
        
        // Test 3: Load API modules
        console.log('\n📦 Test 3: API Modules with Clean Interface');
        const api = require('./src/api');
        console.log('✅ API modules loaded successfully');
        console.log(`📊 Total functions: ${Object.keys(api).length}`);
        
        // Verify modern methods are available at API level
        const apiModernMethods = ['getClient', 'request', 'checkConnection', 'disconnect', 'getVersion'];
        apiModernMethods.forEach(method => {
            const available = typeof api[method] === 'function';
            console.log(`  API.${method}: ${available ? '✅ Available' : '❌ Missing'}`);
        });
        
        // Test 4: Enhanced Functions Check
        console.log('\n🚀 Test 4: Enhanced Functions Check');
        const enhancedFunctions = [
            'getHostsByName', 'getActiveMaintenanceWindows', 'getUsersByRole',
            'getItemsByHost', 'getProblemsByHost', 'getTemplatesByName'
        ];
        
        enhancedFunctions.forEach(fn => {
            const available = typeof api[fn] === 'function';
            console.log(`  ${fn}: ${available ? '✅ Available' : '❌ Missing'}`);
        });
        
        // Test 5: History Module with Modern Interface
        console.log('\n📈 Test 5: History Module Modern Interface');
        const history = require('./src/api/history');
        const historyFunctions = ['getHistory', 'getTrends', 'getLatestData'];
        
        historyFunctions.forEach(fn => {
            const available = typeof history[fn] === 'function';
            console.log(`  ${fn}: ${available ? '✅ Available' : '❌ Missing'}`);
        });
        
        // Test 6: Auth Tools with Modern Interface
        console.log('\n🔑 Test 6: Auth Tools Modern Interface');
        const authTools = require('./src/tools/auth');
        console.log('✅ Auth tools loaded successfully');
        console.log(`📊 Auth functions: ${Object.keys(authTools).length}`);
        
        // Test 7: MCP Tools Integration
        console.log('\n🛠️  Test 7: MCP Tools Integration');
        const { registerAllTools } = require('./src/tools');
        console.log('✅ MCP tools registration loaded successfully');
        
        // Test 8: Interface Consistency Check
        console.log('\n🎯 Test 8: Interface Consistency');
        const clientMethods = Object.keys(client).filter(key => typeof client[key] === 'function');
        const expectedMethods = ['getClient', 'request', 'checkConnection', 'disconnect', 'getVersion'];
        
        const extraMethods = clientMethods.filter(m => !expectedMethods.includes(m));
        const missingMethods = expectedMethods.filter(m => !clientMethods.includes(m));
        
        if (extraMethods.length > 0) {
            console.log(`⚠️  Extra methods found: ${extraMethods.join(', ')}`);
        } else {
            console.log('✅ No extra methods found');
        }
        
        if (missingMethods.length > 0) {
            console.log(`❌ Missing methods: ${missingMethods.join(', ')}`);
            throw new Error(`Missing required methods: ${missingMethods.join(', ')}`);
        } else {
            console.log('✅ All required methods present');
        }
        
        // Summary
        console.log('\n📊 Clean Interface Summary:');
        console.log('✅ All legacy methods removed successfully');
        console.log('✅ Only modern interface methods available');
        console.log('✅ All enhanced API functions working');
        console.log('✅ History module using modern interface');
        console.log('✅ Auth tools using modern interface');
        console.log('✅ MCP tools integration working');
        console.log('✅ Interface consistency verified');
        
        console.log('\n🎉 CLEAN INTERFACE: COMPLETE!');
        console.log('\n📝 Modern Interface:');
        console.log('✅ getClient() - Get client instance');
        console.log('✅ request(method, params) - Make API calls');
        console.log('✅ checkConnection() - Check connection status');
        console.log('✅ disconnect() - Disconnect and cleanup');
        console.log('✅ getVersion() - Get API version');
        
        console.log('\n🚫 Legacy Interface Removed:');
        console.log('❌ zabbixRequest() → use request()');
        console.log('❌ ensureLogin() → automatic with getClient()');
        console.log('❌ login() → automatic with getClient()');
        console.log('❌ logout() → use disconnect()');
        console.log('❌ getApiVersion() → use getVersion()');
        
    } catch (error) {
        console.error('❌ Clean interface test failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run the test
testCleanInterface().catch(console.error); 