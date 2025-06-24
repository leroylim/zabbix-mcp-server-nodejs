const { AsyncZabbixAPI } = require('zabbix-utils');

async function testConnection() {
    console.log('Testing Zabbix connection...');
    
    try {
        // Test 1: Minimal configuration
        console.log('\n=== Test 1: Minimal configuration ===');
        const api1 = new AsyncZabbixAPI({
            url: 'https://monitoring.sipef.com/api_jsonrpc.php',
            user: 'Admin',
            password: process.env.ZABBIX_PASSWORD,
            skipVersionCheck: true
        });
        console.log('✓ AsyncZabbixAPI instantiated successfully');
        
        // Test 2: Try login
        console.log('\n=== Test 2: Login attempt ===');
        await api1.login(null, 'Admin', process.env.ZABBIX_PASSWORD);
        console.log('✓ Login successful');
        
        // Test 3: Try a simple API call
        console.log('\n=== Test 3: API version call ===');
        const version = await api1.version();
        console.log('✓ API version:', version);
        
        await api1.logout();
        console.log('✓ Logout successful');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack trace:', error.stack);
    }
}

// Load environment variables
require('dotenv').config();

testConnection(); 