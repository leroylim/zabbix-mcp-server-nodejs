# Zabbix MCP Server - API Examples

This document provides comprehensive examples of using the Zabbix MCP Server tools with proper parameter names and validation rules as defined in the Zabbix API documentation.

## 🔐 Authentication Examples

### Getting API Information
```javascript
const apiInfo = await server.call('zabbix_get_api_info', {});
console.log('API Version:', apiInfo.version);
```

### Login (Username/Password Authentication)
```javascript
const loginResult = await server.call('zabbix_login', {
    username: 'Admin',
    password: 'your_password'
});
console.log('Session Token:', loginResult.sessionid);
```

## 🖥️ Host Management Examples

### Get Hosts
```javascript
const hosts = await server.call('zabbix_get_hosts', {
    output: ['hostid', 'host', 'name', 'status'],
    selectInterfaces: ['interfaceid', 'ip', 'port'],
    selectGroups: ['groupid', 'name'],
    filter: {
        status: 0 // Enabled hosts only
    },
    limit: 10
});
```

### Create Host
```javascript
const newHost = await server.call('zabbix_create_host', {
    host: 'new-server.example.com',
    name: 'New Server',
    groups: [
        { groupid: '2' } // Linux servers group
    ],
    interfaces: [
        {
            type: 1, // Agent interface
            main: 1,
            useip: 1,
            ip: '192.168.1.100',
            dns: '',
            port: '10050'
        }
    ]
});
```

## 👥 Host Groups Management

### Get Host Groups
```javascript
const groups = await server.call('zabbix_get_hostgroups', {
    output: 'extend',
    selectHosts: ['hostid', 'host'],
    filter: {
        name: ['Linux servers', 'Windows servers']
    }
});
```

### Create Host Group
```javascript
const newGroup = await server.call('zabbix_create_hostgroup', {
    name: 'Production Servers'
});
```

## 📊 Items Management Examples

### Get Items
```javascript
const items = await server.call('zabbix_get_items', {
    output: ['itemid', 'name', 'key_', 'type', 'value_type'],
    selectHosts: ['hostid', 'host'],
    filter: {
        status: 0, // Active items
        type: 0    // Zabbix agent items
    },
    limit: 20
});
```

### Create Item
```javascript
const newItem = await server.call('zabbix_create_item', {
    hostid: '10084',
    name: 'CPU Usage',
    key_: 'system.cpu.util',
    type: 0,        // Zabbix agent
    value_type: 0,  // Numeric float
    delay: '60s',   // Update interval
    units: '%'
});
```

## ⚠️ Triggers Management

### Get Triggers
```javascript
const triggers = await server.call('zabbix_get_triggers', {
    output: 'extend',
    selectHosts: ['hostid', 'host'],
    selectItems: ['itemid', 'key_'],
    filter: {
        status: 0,    // Enabled triggers
        priority: 4   // High priority
    },
    sortfield: 'priority',
    sortorder: 'DESC'
});
```

### Create Trigger
```javascript
const newTrigger = await server.call('zabbix_create_trigger', {
    description: 'High CPU usage on {HOST.NAME}',
    expression: '{server.example.com:system.cpu.util.last()}>90',
    priority: 4, // High priority
    status: 0    // Enabled
});
```

## 🚨 Problems Management

### Get Current Problems
```javascript
const problems = await server.call('zabbix_get_problems', {
    output: 'extend',
    selectTags: 'extend',
    selectAcknowledges: 'extend',
    severities: [4, 5], // High and Disaster
    recent: true,
    sortfield: ['eventid'],
    sortorder: 'DESC'
});
```

### Acknowledge Problems
```javascript
const ackResult = await server.call('zabbix_acknowledge_problems', {
    eventids: ['12345', '12346'],
    message: 'Investigating the issue',
    action: 1 // Close problem
});
```

## 📈 Historical Data Examples

### Get History
```javascript
const history = await server.call('zabbix_get_history', {
    history: 0, // Numeric float
    itemids: ['23456', '23457'],
    time_from: Math.floor(Date.now() / 1000) - 3600, // Last hour
    time_till: Math.floor(Date.now() / 1000),
    limit: 100
});
```

### Get Trends
```javascript
const trends = await server.call('zabbix_get_trends', {
    itemids: ['23456'],
    time_from: Math.floor(Date.now() / 1000) - 86400, // Last 24 hours
    time_till: Math.floor(Date.now() / 1000),
    limit: 24
});
```

## 👤 User Management Examples

### Get Users
```javascript
const users = await server.call('zabbix_get_users', {
    output: ['userid', 'username', 'name', 'surname'],
    selectUsrgrps: ['usrgrpid', 'name'],
    selectRole: ['roleid', 'name'],
    getAccess: true
});
```

### Create User
```javascript
const newUser = await server.call('zabbix_create_user', {
    username: 'john.doe',
    name: 'John',
    surname: 'Doe',
    passwd: 'secure_password',
    usrgrps: [
        { usrgrpid: '7' } // Zabbix administrators
    ],
    roleid: '1' // Admin role
});
```

## 🔧 Maintenance Examples

### Get Maintenance Periods
```javascript
const maintenance = await server.call('zabbix_get_maintenances', {
    output: 'extend',
    selectHosts: ['hostid', 'host'],
    selectGroups: ['groupid', 'name'],
    selectTimeperiods: 'extend'
});
```

### Create Maintenance
```javascript
const newMaintenance = await server.call('zabbix_create_maintenance', {
    name: 'Server Maintenance',
    active_since: Math.floor(Date.now() / 1000),
    active_till: Math.floor(Date.now() / 1000) + 3600, // 1 hour
    hosts: [
        { hostid: '10084' }
    ],
    timeperiods: [
        {
            timeperiod_type: 0, // One time only
            start_time: 0,
            period: 3600
        }
    ]
});
```

## 🗺️ Network Maps Examples

### Get Maps
```javascript
const maps = await server.call('zabbix_get_maps', {
    output: 'extend',
    selectSelements: 'extend',
    selectLinks: 'extend'
});
```

## 📋 Templates Examples

### Get Templates
```javascript
const templates = await server.call('zabbix_get_templates', {
    output: ['templateid', 'name'],
    selectHosts: ['hostid', 'host'],
    selectItems: ['itemid', 'name', 'key_'],
    selectTriggers: ['triggerid', 'description']
});
```

## 📡 Discovery Examples

### Get Discovery Rules
```javascript
const discovery = await server.call('zabbix_get_drules', {
    output: 'extend',
    selectDChecks: 'extend'
});
```

## 🎛️ Dashboard Examples

### Get Dashboards
```javascript
const dashboards = await server.call('zabbix_get_dashboards', {
    output: 'extend',
    selectPages: 'extend',
    selectUsers: ['userid', 'username'],
    selectUserGroups: ['usrgrpid', 'name']
});
```

## 📝 Scripts Examples

### Get Scripts
```javascript
const scripts = await server.call('zabbix_get_scripts', {
    output: 'extend',
    selectHosts: ['hostid', 'host'],
    selectHostGroups: ['groupid', 'name']
});
```

### Execute Script
```javascript
const execution = await server.call('zabbix_execute_script', {
    scriptid: '1',
    hostid: '10084'
});
```

## 🔔 Media and Notifications

### Get Media Types
```javascript
const mediaTypes = await server.call('zabbix_get_mediatypes', {
    output: 'extend',
    selectUsers: ['userid', 'username']
});
```

## 🏢 Services Examples

### Get Services
```javascript
const services = await server.call('zabbix_get_services', {
    output: 'extend',
    selectParents: ['serviceid', 'name'],
    selectChildren: ['serviceid', 'name'],
    selectTriggers: ['triggerid', 'description']
});
```

## 🎯 Actions Examples

### Get Actions
```javascript
const actions = await server.call('zabbix_get_actions', {
    output: 'extend',
    selectOperations: 'extend',
    selectRecoveryOperations: 'extend',
    selectFilter: 'extend'
});
```

## Error Handling

All API calls should include proper error handling:

```javascript
try {
    const result = await server.call('zabbix_get_hosts', {
        output: ['hostid', 'host'],
        limit: 10
    });
    console.log('Success:', result);
} catch (error) {
    console.error('API Error:', error.message);
    
    // Handle specific error types
    if (error.message.includes('Session terminated')) {
        console.log('Need to re-authenticate');
    } else if (error.message.includes('Permission denied')) {
        console.log('Insufficient permissions');
    }
}
```

## Best Practices

1. **Always use appropriate output parameters** to limit data transfer
2. **Set reasonable limits** for large datasets
3. **Use filters** to narrow down results
4. **Handle authentication errors** gracefully
5. **Implement proper error handling** for all API calls
6. **Use batch operations** when possible for better performance 