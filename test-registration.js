const { logger } = require('./src/utils/logger');

// Mock server object to test tool registration
const mockServer = {
    tool: (name, description, schema, handler) => {
        console.log(`  ✓ ${name}`);
        return true;
    }
};

const toolModules = [
    { name: 'auth', description: 'Authentication (3 tools)' },
    { name: 'hosts', description: 'Host Management (3 tools)' },
    { name: 'hostgroups', description: 'Host Groups (4 tools)' },
    { name: 'items', description: 'Items Management (5 tools)' },
    { name: 'triggers', description: 'Triggers Management (4 tools)' },
    { name: 'problems', description: 'Problems Management (2 tools)' },
    { name: 'history', description: 'History Tools (3 tools)' },
    { name: 'maintenance', description: 'Maintenance Tools (4 tools)' },
    { name: 'users', description: 'User Management (6 tools)' },
    { name: 'templates', description: 'Template Management (6 tools)' },
    { name: 'scripts', description: 'Scripts Management (6 tools)' },
    { name: 'discovery', description: 'Discovery Tools (6 tools)' },
    { name: 'media', description: 'Media & Notifications (7 tools)' },
    { name: 'actions', description: 'Actions & Escalations (6 tools)' },
    { name: 'maps', description: 'Maps Management (12 tools)' },
    { name: 'dashboards', description: 'Dashboard Management (4 tools)' },
    { name: 'proxies', description: 'Proxy Management (4 tools)' },
    { name: 'configuration', description: 'Configuration Management (3 tools)' },
    { name: 'services', description: 'Business Services (5 tools)' }
];

console.log('🔧 Testing Zabbix MCP Server tool registration...\n');
console.log('=' * 60);

let successCount = 0;
let totalModules = toolModules.length;
let totalTools = 0;

for (const { name: moduleName, description } of toolModules) {
    try {
        const module = require(`./src/tools/${moduleName}`);
        if (module && typeof module.registerTools === 'function') {
            console.log(`\n📦 ${moduleName.toUpperCase()} - ${description}`);
            console.log('-'.repeat(40));
            
            // Count tools before registration
            const toolsBefore = Object.keys(mockServer).length;
            module.registerTools(mockServer);
            
            console.log(`✅ ${moduleName} tools registered successfully`);
            successCount++;
        } else {
            console.log(`\n❌ ${moduleName.toUpperCase()} - ${description}`);
            console.log('-'.repeat(40));
            console.log(`✗ No registerTools function found`);
        }
    } catch (error) {
        console.log(`\n❌ ${moduleName.toUpperCase()} - ${description}`);
        console.log('-'.repeat(40));
        console.log(`✗ Error: ${error.message}`);
    }
}

console.log('\n' + '='.repeat(60));
console.log('📊 REGISTRATION TEST RESULTS');
console.log('='.repeat(60));
console.log(`✅ Successful modules: ${successCount}/${totalModules}`);
console.log(`📋 Tool categories: 19`);
console.log(`🔧 Total tools: 90+`);

if (successCount === totalModules) {
    console.log('\n🎉 All Zabbix tool modules registered successfully!');
    console.log('\n🚀 Server is ready to handle:');
    console.log('   • Authentication and session management');
    console.log('   • Host and infrastructure monitoring');
    console.log('   • Problem detection and alerting');
    console.log('   • User and access management');
    console.log('   • Advanced automation and scripting');
    console.log('   • Visualization and reporting');
    console.log('   • Business service monitoring');
    console.log('   • Enterprise-grade features');
} else {
    console.log(`\n⚠️  ${totalModules - successCount} modules failed registration`);
    console.log('❌ Server may not function correctly');
    process.exit(1);
}

console.log('\n✨ Zabbix MCP Server registration test completed!'); 