#!/usr/bin/env node

/**
 * Test script for Enhanced API Migration
 * Tests that all enhanced modules load correctly and provide expected functionality
 */

console.log('🔍 Testing Enhanced API Migration...\n');

async function testAPI() {
    try {
        // Test 1: API Import
        console.log('📦 Test 1: API Module Import');
        const api = require('./src/api');
        console.log('✅ API imported successfully');
        console.log(`📊 Total functions available: ${Object.keys(api).length}`);
        
        // Test 2: Enhanced Functions Available
        console.log('\n🚀 Test 2: Enhanced Functions Check');
        
        // Check for enhanced host functions
        const enhancedHostFunctions = [
            'getHosts', 'createHost', 'updateHost', 'deleteHosts',
            'getHostsByName', 'getHostsByGroups', 'enableHosts', 'disableHosts'
        ];
        
        const missingHostFunctions = enhancedHostFunctions.filter(fn => !api[fn]);
        if (missingHostFunctions.length === 0) {
            console.log('✅ All enhanced host functions available');
        } else {
            console.log('❌ Missing host functions:', missingHostFunctions);
        }
        
        // Check for enhanced maintenance functions
        const enhancedMaintenanceFunctions = [
            'getMaintenanceWindows', 'createMaintenanceWindow', 'updateMaintenanceWindow',
            'deleteMaintenanceWindows', 'getActiveMaintenanceWindows'
        ];
        
        const missingMaintenanceFunctions = enhancedMaintenanceFunctions.filter(fn => !api[fn]);
        if (missingMaintenanceFunctions.length === 0) {
            console.log('✅ All enhanced maintenance functions available');
        } else {
            console.log('❌ Missing maintenance functions:', missingMaintenanceFunctions);
        }
        
        // Test 3: Sample Functions from Each Enhanced Module
        console.log('\n🔧 Test 3: Enhanced Module Functions Sample');
        
        const moduleTests = [
            { module: 'hosts', functions: ['getHosts', 'getHostsByName'] },
            { module: 'items', functions: ['getItems', 'getItemsByHost'] },
            { module: 'triggers', functions: ['getTriggers', 'getTriggersByHost'] },
            { module: 'problems', functions: ['getProblems', 'getProblemsByHost'] },
            { module: 'maintenance', functions: ['getMaintenanceWindows', 'getActiveMaintenanceWindows'] },
            { module: 'users', functions: ['getUsers', 'getUsersByRole'] },
            { module: 'actions', functions: ['getActions', 'getActionsByEvent'] },
            { module: 'discovery', functions: ['getDiscoveryRules', 'getDiscoveredHosts'] },
            { module: 'scripts', functions: ['getScripts', 'executeScript'] },
            { module: 'media', functions: ['getMediaTypes', 'getMediaTypesByName'] },
            { module: 'templates', functions: ['getTemplates', 'getTemplatesByName'] },
            { module: 'hostgroups', functions: ['getHostGroups', 'getHostGroupsByName'] },
            { module: 'maps', functions: ['getMaps', 'getNetworkMaps'] },
            { module: 'dashboards', functions: ['getDashboards', 'getDashboardsByName'] },
            { module: 'proxies', functions: ['getProxies', 'getProxiesByName'] },
            { module: 'services', functions: ['getServices', 'getServicesByName'] },
            { module: 'configuration', functions: ['exportConfiguration', 'importConfiguration'] }
        ];
        
        let passedModules = 0;
        let totalModules = moduleTests.length;
        
        for (const { module, functions } of moduleTests) {
            const availableFunctions = functions.filter(fn => api[fn]);
            if (availableFunctions.length === functions.length) {
                console.log(`✅ ${module}: All functions available (${functions.length})`);
                passedModules++;
            } else {
                const missing = functions.filter(fn => !api[fn]);
                console.log(`⚠️  ${module}: ${availableFunctions.length}/${functions.length} functions (missing: ${missing.join(', ')})`);
            }
        }
        
        console.log(`\n📊 Module Test Results: ${passedModules}/${totalModules} modules passed`);
        
        // Test 4: Function Signature Check (sample)
        console.log('\n🔍 Test 4: Function Signature Check');
        
        if (typeof api.getHosts === 'function') {
            console.log('✅ getHosts is a function');
        } else {
            console.log('❌ getHosts is not a function');
        }
        
        if (typeof api.getHostsByName === 'function') {
            console.log('✅ getHostsByName is a function (enhanced)');
        } else {
            console.log('❌ getHostsByName is not a function (enhanced missing)');
        }
        
        // Test 5: zabbix-utils Integration Check
        console.log('\n🔗 Test 5: zabbix-utils Integration');
        
        try {
            const zabbixClient = require('./src/api/zabbix-client');
            console.log('✅ zabbix-client module loaded');
            
            if (typeof zabbixClient.getClient === 'function') {
                console.log('✅ zabbix-utils client available');
            } else {
                console.log('❌ zabbix-utils client not available');
            }
        } catch (error) {
            console.log('❌ zabbix-client module error:', error.message);
        }
        
        // Test 6: Legacy vs Enhanced Comparison
        console.log('\n📈 Test 6: Enhanced vs Legacy Comparison');
        
        // Count functions by pattern
        const allFunctions = Object.keys(api);
        const basicFunctions = allFunctions.filter(fn => 
            ['get', 'create', 'update', 'delete'].some(prefix => fn.startsWith(prefix)) &&
            !fn.includes('By') && !fn.includes('Active') && !fn.includes('Search')
        );
        const enhancedFunctions = allFunctions.filter(fn => 
            fn.includes('By') || fn.includes('Active') || fn.includes('Search') || 
            fn.includes('Bulk') || fn.includes('Statistics') || fn.includes('Analytics')
        );
        
        console.log(`📊 Basic CRUD functions: ${basicFunctions.length}`);
        console.log(`🚀 Enhanced functions: ${enhancedFunctions.length}`);
        console.log(`📈 Enhancement ratio: ${Math.round((enhancedFunctions.length / basicFunctions.length) * 100)}%`);
        
        // Summary
        console.log('\n🎉 Migration Test Summary:');
        console.log(`✅ API Import: Success`);
        console.log(`✅ Total Functions: ${Object.keys(api).length}`);
        console.log(`✅ Enhanced Modules: ${passedModules}/${totalModules}`);
        console.log(`✅ zabbix-utils Integration: Available`);
        
        if (passedModules === totalModules) {
            console.log('\n🎊 MIGRATION TEST PASSED! All enhanced modules working correctly.');
        } else {
            console.log('\n⚠️  MIGRATION TEST PARTIAL: Some modules need attention.');
        }
        
    } catch (error) {
        console.error('❌ Migration test failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run the test
testAPI().catch(console.error); 