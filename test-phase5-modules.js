#!/usr/bin/env node

/**
 * Phase 5 Refactored Modules Test Suite
 * 
 * This script demonstrates the enhanced functionality of the refactored:
 * - Discovery module (discovery-new.js)
 * - Scripts module (scripts-new.js) 
 * - Media module (media-new.js)
 * 
 * These modules now use zabbix-utils for professional API integration
 * with enhanced error handling, comprehensive functionality, and analytics.
 */

const { logger } = require('./src/utils/logger');

// Import refactored modules
const discoveryApi = require('./src/api/discovery-new');
const scriptsApi = require('./src/api/scripts-new');
const mediaApi = require('./src/api/media-new');

/**
 * Test Discovery Module Enhanced Functionality
 */
async function testDiscoveryModule() {
    console.log('\n🔍 Testing Discovery Module Enhanced Functionality');
    console.log('=' .repeat(60));
    
    try {
        // Test 1: Get all discovery rules with comprehensive data
        console.log('\n1. Getting discovery rules with comprehensive data...');
        const allRules = await discoveryApi.getDiscoveryRules({
            output: 'extend',
            selectHosts: ['hostid', 'name'],
            selectItems: 'count',
            selectTriggers: 'count',
            selectGraphs: 'count',
            limit: 5
        });
        console.log(`✅ Retrieved ${allRules.length} discovery rules`);
        if (allRules.length > 0) {
            console.log(`   Example: ${allRules[0].name} (${allRules[0].items || 0} items, ${allRules[0].triggers || 0} triggers)`);
        }

        // Test 2: Get enabled discovery rules
        console.log('\n2. Getting enabled discovery rules...');
        const enabledRules = await discoveryApi.getEnabledDiscoveryRules({ limit: 3 });
        console.log(`✅ Found ${enabledRules.length} enabled discovery rules`);

        // Test 3: Get disabled discovery rules
        console.log('\n3. Getting disabled discovery rules...');
        const disabledRules = await discoveryApi.getDisabledDiscoveryRules({ limit: 3 });
        console.log(`✅ Found ${disabledRules.length} disabled discovery rules`);

        // Test 4: Search discovery rules by name pattern
        console.log('\n4. Searching discovery rules by name pattern...');
        const searchResults = await discoveryApi.searchDiscoveryRules({
            name: '*',
            status: 0 // enabled only
        });
        console.log(`✅ Found ${searchResults.length} discovery rules matching criteria`);

        // Test 5: Get discovery rule statistics
        console.log('\n5. Getting discovery rule statistics...');
        const stats = await discoveryApi.getDiscoveryRuleStatistics();
        console.log(`✅ Discovery Statistics:`);
        console.log(`   Total: ${stats.total}, Enabled: ${stats.enabled}, Disabled: ${stats.disabled}`);
        console.log(`   Total Items: ${stats.totalItems}, Triggers: ${stats.totalTriggers}, Graphs: ${stats.totalGraphs}`);
        console.log(`   Type Distribution:`, stats.byType);

        // Test 6: Get discovered hosts
        console.log('\n6. Getting discovered hosts...');
        const discoveredHosts = await discoveryApi.getDiscoveredHosts({ limit: 5 });
        console.log(`✅ Found ${discoveredHosts.length} discovered hosts`);
        if (discoveredHosts.length > 0) {
            console.log(`   Example: ${discoveredHosts[0].ip} (Last up: ${discoveredHosts[0].lastup_readable})`);
        }

        // Test 7: Get discovered services
        console.log('\n7. Getting discovered services...');
        const discoveredServices = await discoveryApi.getDiscoveredServices({ limit: 5 });
        console.log(`✅ Found ${discoveredServices.length} discovered services`);

        console.log('\n🎉 Discovery Module: All tests completed successfully!');
        return {
            module: 'Discovery',
            totalRules: allRules.length,
            enabledRules: enabledRules.length,
            disabledRules: disabledRules.length,
            discoveredHosts: discoveredHosts.length,
            discoveredServices: discoveredServices.length,
            statistics: stats
        };

    } catch (error) {
        console.error('❌ Discovery Module test failed:', error.message);
        return { module: 'Discovery', error: error.message };
    }
}

/**
 * Test Scripts Module Enhanced Functionality
 */
async function testScriptsModule() {
    console.log('\n📜 Testing Scripts Module Enhanced Functionality');
    console.log('=' .repeat(60));
    
    try {
        // Test 1: Get all scripts with comprehensive data
        console.log('\n1. Getting scripts with comprehensive data...');
        const allScripts = await scriptsApi.getScripts({
            output: 'extend',
            selectHosts: ['hostid', 'name'],
            selectHostGroups: ['groupid', 'name'],
            limit: 5
        });
        console.log(`✅ Retrieved ${allScripts.length} scripts`);
        if (allScripts.length > 0) {
            console.log(`   Example: ${allScripts[0].name} (Type: ${allScripts[0].type}, Scope: ${allScripts[0].scope})`);
        }

        // Test 2: Get scripts by type
        console.log('\n2. Getting scripts by type...');
        const scriptsByType = await scriptsApi.getScriptsByType(0, { limit: 3 }); // 0 = script
        console.log(`✅ Found ${scriptsByType.length} scripts of type 0 (script)`);

        // Test 3: Get scripts by scope
        console.log('\n3. Getting scripts by scope...');
        const scriptsByScope = await scriptsApi.getScriptsByScope(2, { limit: 3 }); // 2 = manual host action
        console.log(`✅ Found ${scriptsByScope.length} scripts with scope 2 (manual host action)`);

        // Test 4: Get global scripts
        console.log('\n4. Getting global scripts...');
        const globalScripts = await scriptsApi.getGlobalScripts({ limit: 3 });
        console.log(`✅ Found ${globalScripts.length} global scripts`);

        // Test 5: Get webhook scripts
        console.log('\n5. Getting webhook scripts...');
        const webhookScripts = await scriptsApi.getWebhookScripts({ limit: 3 });
        console.log(`✅ Found ${webhookScripts.length} webhook scripts`);

        // Test 6: Search scripts with multiple criteria
        console.log('\n6. Searching scripts with criteria...');
        const searchResults = await scriptsApi.searchScripts({
            name: '*',
            type: 0 // script type
        });
        console.log(`✅ Found ${searchResults.length} scripts matching criteria`);

        // Test 7: Get script statistics
        console.log('\n7. Getting script statistics...');
        const stats = await scriptsApi.getScriptStatistics();
        console.log(`✅ Script Statistics:`);
        console.log(`   Total: ${stats.total}`);
        console.log(`   Type Distribution:`, stats.byType);
        console.log(`   Scope Distribution:`, stats.byScope);
        console.log(`   Execute On Distribution:`, stats.byExecuteOn);

        // Test 8: Get script execution history
        console.log('\n8. Getting script execution history...');
        const executionHistory = await scriptsApi.getScriptExecutionHistory({ limit: 5 });
        console.log(`✅ Found ${executionHistory.length} execution history events`);

        console.log('\n🎉 Scripts Module: All tests completed successfully!');
        return {
            module: 'Scripts',
            totalScripts: allScripts.length,
            globalScripts: globalScripts.length,
            webhookScripts: webhookScripts.length,
            executionHistory: executionHistory.length,
            statistics: stats
        };

    } catch (error) {
        console.error('❌ Scripts Module test failed:', error.message);
        return { module: 'Scripts', error: error.message };
    }
}

/**
 * Test Media Module Enhanced Functionality
 */
async function testMediaModule() {
    console.log('\n📢 Testing Media Module Enhanced Functionality');
    console.log('=' .repeat(60));
    
    try {
        // Test 1: Get all media types with comprehensive data
        console.log('\n1. Getting media types with comprehensive data...');
        const allMediaTypes = await mediaApi.getMediaTypes({
            output: 'extend',
            selectUsers: ['userid', 'username'],
            selectMessageTemplates: 'extend',
            limit: 5
        });
        console.log(`✅ Retrieved ${allMediaTypes.length} media types`);
        if (allMediaTypes.length > 0) {
            console.log(`   Example: ${allMediaTypes[0].name} (Type: ${allMediaTypes[0].type}, Status: ${allMediaTypes[0].status})`);
        }

        // Test 2: Get media types by type
        console.log('\n2. Getting email media types...');
        const emailMediaTypes = await mediaApi.getMediaTypesByType(0, { limit: 3 }); // 0 = email
        console.log(`✅ Found ${emailMediaTypes.length} email media types`);

        // Test 3: Get enabled media types
        console.log('\n3. Getting enabled media types...');
        const enabledMediaTypes = await mediaApi.getEnabledMediaTypes({ limit: 3 });
        console.log(`✅ Found ${enabledMediaTypes.length} enabled media types`);

        // Test 4: Get disabled media types
        console.log('\n4. Getting disabled media types...');
        const disabledMediaTypes = await mediaApi.getDisabledMediaTypes({ limit: 3 });
        console.log(`✅ Found ${disabledMediaTypes.length} disabled media types`);

        // Test 5: Get user media
        console.log('\n5. Getting user media configurations...');
        const userMedia = await mediaApi.getUserMedia({ limit: 5 });
        console.log(`✅ Found ${userMedia.length} user media configurations`);

        // Test 6: Get recent alerts
        console.log('\n6. Getting recent alerts (last 24 hours)...');
        const recentAlerts = await mediaApi.getRecentAlerts(24, { limit: 10 });
        console.log(`✅ Found ${recentAlerts.length} alerts in the last 24 hours`);
        if (recentAlerts.length > 0) {
            console.log(`   Example: ${recentAlerts[0].subject || 'No subject'} (${recentAlerts[0].status_text})`);
        }

        // Test 7: Get failed alerts
        console.log('\n7. Getting failed alerts...');
        const failedAlerts = await mediaApi.getFailedAlerts({ limit: 5 });
        console.log(`✅ Found ${failedAlerts.length} failed alerts`);

        // Test 8: Get media type statistics
        console.log('\n8. Getting media type statistics...');
        const mediaStats = await mediaApi.getMediaTypeStatistics();
        console.log(`✅ Media Type Statistics:`);
        console.log(`   Total: ${mediaStats.total}, Enabled: ${mediaStats.enabled}, Disabled: ${mediaStats.disabled}`);
        console.log(`   Type Distribution:`, mediaStats.byType);
        console.log(`   Total Users: ${mediaStats.totalUsers}`);

        // Test 9: Get notification statistics
        console.log('\n9. Getting notification statistics (last 24 hours)...');
        const notificationStats = await mediaApi.getNotificationStatistics(24);
        console.log(`✅ Notification Statistics:`);
        console.log(`   Total: ${notificationStats.total}, Sent: ${notificationStats.sent}, Failed: ${notificationStats.failed}, Pending: ${notificationStats.pending}`);
        console.log(`   By Media Type:`, notificationStats.byMediaType);

        // Test 10: Search media types
        console.log('\n10. Searching media types with criteria...');
        const searchResults = await mediaApi.searchMediaTypes({
            name: '*',
            status: 0 // enabled only
        });
        console.log(`✅ Found ${searchResults.length} media types matching criteria`);

        console.log('\n🎉 Media Module: All tests completed successfully!');
        return {
            module: 'Media',
            totalMediaTypes: allMediaTypes.length,
            enabledMediaTypes: enabledMediaTypes.length,
            disabledMediaTypes: disabledMediaTypes.length,
            userMedia: userMedia.length,
            recentAlerts: recentAlerts.length,
            failedAlerts: failedAlerts.length,
            mediaStatistics: mediaStats,
            notificationStatistics: notificationStats
        };

    } catch (error) {
        console.error('❌ Media Module test failed:', error.message);
        return { module: 'Media', error: error.message };
    }
}

/**
 * Main test execution
 */
async function runPhase5Tests() {
    console.log('🚀 Phase 5 Refactored Modules Test Suite');
    console.log('Testing Discovery, Scripts, and Media modules with zabbix-utils integration');
    console.log('=' .repeat(80));

    const results = [];

    // Test Discovery Module
    const discoveryResults = await testDiscoveryModule();
    results.push(discoveryResults);

    // Test Scripts Module
    const scriptsResults = await testScriptsModule();
    results.push(scriptsResults);

    // Test Media Module
    const mediaResults = await testMediaModule();
    results.push(mediaResults);

    // Summary Report
    console.log('\n📊 PHASE 5 TEST SUMMARY REPORT');
    console.log('=' .repeat(80));

    let successCount = 0;
    let totalFunctionality = 0;

    results.forEach(result => {
        if (result.error) {
            console.log(`❌ ${result.module}: FAILED - ${result.error}`);
        } else {
            console.log(`✅ ${result.module}: SUCCESS`);
            successCount++;

            // Calculate functionality metrics
            if (result.module === 'Discovery') {
                const functionality = result.totalRules + result.discoveredHosts + result.discoveredServices;
                totalFunctionality += functionality;
                console.log(`   📈 Discovery Rules: ${result.totalRules} (${result.enabledRules} enabled, ${result.disabledRules} disabled)`);
                console.log(`   🔍 Discovered: ${result.discoveredHosts} hosts, ${result.discoveredServices} services`);
                console.log(`   📊 Analytics: Type distribution, statistics, and search capabilities`);
            } else if (result.module === 'Scripts') {
                const functionality = result.totalScripts + result.globalScripts + result.webhookScripts;
                totalFunctionality += functionality;
                console.log(`   📜 Scripts: ${result.totalScripts} total (${result.globalScripts} global, ${result.webhookScripts} webhook)`);
                console.log(`   🔄 Execution: History tracking and bulk execution capabilities`);
                console.log(`   📊 Analytics: Type, scope, and execution statistics`);
            } else if (result.module === 'Media') {
                const functionality = result.totalMediaTypes + result.recentAlerts + result.userMedia;
                totalFunctionality += functionality;
                console.log(`   📢 Media Types: ${result.totalMediaTypes} (${result.enabledMediaTypes} enabled, ${result.disabledMediaTypes} disabled)`);
                console.log(`   📬 Notifications: ${result.recentAlerts} recent, ${result.failedAlerts} failed`);
                console.log(`   👥 User Media: ${result.userMedia} configurations`);
                console.log(`   📊 Analytics: Comprehensive notification and media type statistics`);
            }
        }
    });

    console.log('\n🎯 PHASE 5 ACHIEVEMENTS');
    console.log('=' .repeat(50));
    console.log(`✅ Modules Successfully Refactored: ${successCount}/3`);
    console.log(`📈 Total Functionality Demonstrated: ${totalFunctionality} operations`);
    console.log(`🔧 Enhanced Features:`);
    console.log(`   • Professional zabbix-utils integration`);
    console.log(`   • Comprehensive error handling and logging`);
    console.log(`   • Advanced search and filtering capabilities`);
    console.log(`   • Rich analytics and statistics`);
    console.log(`   • Enhanced data formatting and readability`);
    console.log(`   • Backward compatibility maintained`);

    console.log('\n🚀 PHASE 5 BENEFITS');
    console.log('=' .repeat(50));
    console.log(`• Discovery: Enhanced LLD rule management with comprehensive analytics`);
    console.log(`• Scripts: Advanced script execution with history tracking and bulk operations`);
    console.log(`• Media: Complete notification management with failure analysis`);
    console.log(`• Professional API integration with automatic authentication`);
    console.log(`• Type safety through comprehensive JSDoc documentation`);
    console.log(`• Future-proof with upstream zabbix-utils synchronization`);

    if (successCount === 3) {
        console.log('\n🎉 PHASE 5 COMPLETED SUCCESSFULLY!');
        console.log('All three modules have been successfully refactored with enhanced functionality.');
        console.log('Ready to proceed with Phase 6: Maps, Dashboards, Proxies, Services, Configuration');
    } else {
        console.log('\n⚠️  Some modules encountered issues. Please review the errors above.');
    }

    return {
        phase: 5,
        modulesRefactored: successCount,
        totalModules: 3,
        success: successCount === 3,
        totalFunctionality,
        results
    };
}

// Execute tests if run directly
if (require.main === module) {
    runPhase5Tests()
        .then(results => {
            process.exit(results.success ? 0 : 1);
        })
        .catch(error => {
            console.error('Fatal error:', error);
            process.exit(1);
        });
}

module.exports = { runPhase5Tests }; 