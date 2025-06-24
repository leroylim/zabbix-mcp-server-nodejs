const { AsyncZabbixAPI } = require('zabbix-utils');

// Get credentials from command line arguments
const args = process.argv.slice(2);
if (args.length < 3) {
    console.log('Usage: node test-with-credentials.js <url> <username> <password>');
    console.log('Example: node test-with-credentials.js "https://monitoring.sipef.com/api_jsonrpc.php" "Admin" "your_password"');
    process.exit(1);
}

const [url, username, password] = args;

async function testConnection() {
    console.log('Testing Zabbix connection...');
    console.log('URL:', url);
    console.log('Username:', username);
    console.log('Password:', password ? '***SET***' : 'NOT PROVIDED');
    
    try {
        // Test 1: Instantiate AsyncZabbixAPI
        console.log('\n=== Test 1: Creating AsyncZabbixAPI instance ===');
        const api = new AsyncZabbixAPI({
            url: url,
            skipVersionCheck: true,
            timeout: 30,
            validateCerts: false
        });
        console.log('✓ AsyncZabbixAPI instantiated successfully');
        
        // Test 2: Try login
        console.log('\n=== Test 2: Login attempt ===');
        await api.login(null, username, password);
        console.log('✓ Login successful!');
        
        // Test 3: Try a simple API call
        console.log('\n=== Test 3: API version check ===');
        const version = await api.version();
        console.log('✓ Zabbix version:', version);
        
        // Test 4: Get host groups (simple test)
        console.log('\n=== Test 4: Get host groups ===');
        const hostGroups = await api.hostgroup.get({
            output: ['groupid', 'name'],
            limit: 5
        });
        console.log('✓ Retrieved', hostGroups.length, 'host groups');
        if (hostGroups.length > 0) {
            console.log('   First group:', hostGroups[0].name);
        }
        
        console.log('\n🎉 All tests passed! Zabbix connection is working.');
        
    } catch (error) {
        console.error('\n❌ Connection failed:', error.message);
        if (error.stack) {
            console.error('\nFull error stack:');
            console.error(error.stack);
        }
    }
}

testConnection(); 