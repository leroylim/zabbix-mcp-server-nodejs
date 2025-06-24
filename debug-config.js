const config = require('./src/config');

console.log('=== Configuration Debug ===');
console.log('API URL:', config.api.url);
console.log('Auth Method:', config.api.authMethod);
console.log('Username:', config.api.username);
console.log('Password set:', config.api.password ? 'YES' : 'NO');
console.log('API Token set:', config.api.apiToken ? 'YES' : 'NO');

console.log('\n=== Environment Variables ===');
console.log('ZABBIX_API_URL:', process.env.ZABBIX_API_URL || 'NOT SET');
console.log('ZABBIX_USERNAME:', process.env.ZABBIX_USERNAME || 'NOT SET');
console.log('ZABBIX_PASSWORD:', process.env.ZABBIX_PASSWORD ? '***SET***' : 'NOT SET');
console.log('ZABBIX_API_TOKEN:', process.env.ZABBIX_API_TOKEN ? '***SET***' : 'NOT SET'); 