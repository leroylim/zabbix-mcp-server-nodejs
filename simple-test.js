console.log('Testing Zabbix MCP Server tool modules...\n');

const toolModules = [
    'auth',           // Authentication (3 tools)
    'hosts',          // Host Management (3 tools)
    'hostgroups',     // Host Groups (4 tools)
    'items',          // Items Management (5 tools)
    'triggers',       // Triggers Management (4 tools)
    'problems',       // Problems Management (2 tools)
    'history',        // History Tools (3 tools)
    'maintenance',    // Maintenance Tools (4 tools)
    'users',          // User Management (6 tools)
    'templates',      // Template Management (6 tools)
    'scripts',        // Scripts Management (6 tools)
    'discovery',      // Discovery Tools (6 tools)
    'media',          // Media & Notifications (7 tools)
    'actions',        // Actions & Escalations (6 tools)
    'maps',           // Maps Management (12 tools)
    'dashboards',     // Dashboard Management (4 tools)
    'proxies',        // Proxy Management (4 tools)
    'configuration',  // Configuration Management (3 tools)
    'services'        // Business Services (5 tools)
];

let successCount = 0;
let totalCount = toolModules.length;

console.log(`🔍 Testing ${totalCount} Zabbix tool categories...\n`);

for (let i = 0; i < toolModules.length; i++) {
    const moduleName = toolModules[i];
    try {
        console.log(`${i + 1}. Testing ${moduleName}...`);
        const module = require(`./src/tools/${moduleName}`);
        
        if (module && typeof module.registerTools === 'function') {
            console.log(`✓ ${moduleName} loaded successfully`);
            successCount++;
        } else {
            console.log(`✗ ${moduleName} - Missing registerTools function`);
        }
    } catch (error) {
        console.log(`✗ ${moduleName} - Error: ${error.message}`);
    }
}

console.log('\n' + '='.repeat(50));
console.log(`📊 Test Results: ${successCount}/${totalCount} modules loaded successfully`);

if (successCount === totalCount) {
    console.log('🎉 All Zabbix tool modules loaded successfully!');
    console.log('\n📋 Available Tool Categories:');
    console.log('   🔐 Authentication & Core (3 tools)');
    console.log('   🖥️  Infrastructure Management (20 tools)');
    console.log('   📊 Monitoring & Alerting (15 tools)');
    console.log('   🎯 Advanced Features (23 tools)');
    console.log('   🎨 Visualization & Reporting (16 tools)');
    console.log('   📢 Communication & Integration (16 tools)');
    console.log('\n   Total: 90+ tools across 19 categories');
} else {
    console.log(`⚠️  ${totalCount - successCount} modules failed to load`);
    process.exit(1);
}

console.log('\n🚀 Ready to start Zabbix MCP Server!'); 