// Load configuration the same way the MCP server does
const config = require('./src/config');

console.log('=== Environment Variables Check ===');
console.log('ZABBIX_API_URL:', process.env.ZABBIX_API_URL || 'NOT SET');
console.log('ZABBIX_USERNAME:', process.env.ZABBIX_USERNAME || 'NOT SET');
console.log('ZABBIX_PASSWORD:', process.env.ZABBIX_PASSWORD ? '***SET***' : 'NOT SET');
console.log('ZABBIX_API_TOKEN:', process.env.ZABBIX_API_TOKEN ? '***SET***' : 'NOT SET');

console.log('\n=== Configuration Object ===');
console.log('config.api.url:', config.api.url);
console.log('config.api.username:', config.api.username);
console.log('config.api.password:', config.api.password ? '***SET***' : 'NOT SET');
console.log('config.api.authMethod:', config.api.authMethod);

console.log('\n=== Authentication Status ===');
if (config.api.authMethod === 'none') {
    console.log('❌ No authentication credentials configured');
} else if (config.api.authMethod === 'token') {
    console.log('✅ API token authentication configured');
} else if (config.api.authMethod === 'password') {
    if (config.api.username && config.api.password) {
        console.log('✅ Username/password authentication configured');
    } else {
        console.log('❌ Username/password authentication incomplete');
        console.log('   Username:', config.api.username ? 'SET' : 'MISSING');
        console.log('   Password:', config.api.password ? 'SET' : 'MISSING');
    }
} 