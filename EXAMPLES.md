# 🚀 Zabbix MCP Server - Examples & Usage Guide

This document provides practical examples and usage patterns for the Zabbix MCP Server, demonstrating how to effectively use all 19 tool categories and 90+ individual tools with **modern authentication** and **clean interface**.

## 🎯 Quick Start Examples

### Modern Authentication Setup

#### **Option 1: API Token (Recommended)**
```env
ZABBIX_API_URL=https://your-zabbix-server/api_jsonrpc.php
ZABBIX_API_TOKEN=your_api_token_here
```

#### **Option 2: Username/Password**
```env
ZABBIX_API_URL=https://your-zabbix-server/api_jsonrpc.php
ZABBIX_USERNAME=Admin
ZABBIX_PASSWORD=your_password
```

### Basic API Usage

```javascript
const { request, getVersion, checkConnection } = require('./src/api/zabbix-client');

// Check connection and get version
const connected = await checkConnection();
console.log(`Connected: ${connected}`);

const version = await getVersion();
console.log(`Zabbix API Version: ${version}`);

// Authentication is automatic based on environment variables
// No manual login/logout required with API tokens
```

### MCP Tool Usage

```javascript
// Using MCP tools (automatic authentication)
await zabbix_get_api_info();

// Direct API calls using modern interface
const hosts = await request('host.get', {
    output: ['hostid', 'host', 'name'],
    selectInterfaces: ['interfaceid', 'ip']
});
```

### Host Management Workflow

```javascript
// 1. Get existing host groups
const groups = await zabbix_get_hostgroups({
  output: ["groupid", "name"]
});

// 2. Create a new host
const newHost = await zabbix_create_host({
  host: "web-server-01",
  name: "Web Server 01",
  groups: [{ groupid: "2" }], // Linux servers group
  interfaces: [{
    type: 1, // Agent interface
    main: 1,
    useip: 1,
    ip: "192.168.1.100",
    dns: "",
    port: "10050"
  }],
  templates: [{ templateid: "10001" }] // Linux template
});

// 3. Update host configuration
await zabbix_update_host({
  hostid: newHost.hostids[0],
  description: "Production web server",
  inventory: {
    type: "Web Server",
    location: "Data Center A"
  }
});
```

## 📊 Monitoring Setup Examples

### Items and Triggers Configuration

```javascript
// Create monitoring item
const cpuItem = await zabbix_create_item({
  hostid: "10084",
  name: "CPU utilization",
  key_: "system.cpu.util",
  type: 0, // Zabbix agent
  value_type: 0, // Float
  delay: "60s",
  units: "%",
  description: "CPU utilization percentage"
});

// Create trigger for high CPU usage
const cpuTrigger = await zabbix_create_trigger({
  description: "High CPU utilization on {HOST.NAME}",
  expression: `{${cpuItem.itemids[0]}:avg(5m)}>80`,
  priority: 3, // Average severity
  comments: "CPU usage is above 80% for 5 minutes"
});

// Get item history
const history = await zabbix_get_item_history({
  itemids: cpuItem.itemids,
  history: 0, // Float values
  time_from: Math.floor(Date.now() / 1000) - 3600, // Last hour
  limit: 100
});
```

### Template Management

```javascript
// Create custom template
const template = await zabbix_create_template({
  host: "Template Custom Web Server",
  name: "Custom Web Server Template",
  groups: [{ groupid: "1" }], // Templates group
  description: "Custom monitoring template for web servers",
  macros: [{
    macro: "{$HTTP_PORT}",
    value: "80"
  }]
});

// Link template to hosts
await zabbix_link_templates({
  hostids: ["10084", "10085"],
  templateids: template.templateids
});
```

## 🚨 Problem Management Examples

### Problem Monitoring and Response

```javascript
// Get current problems
const problems = await zabbix_get_problems({
  severities: [3, 4, 5], // Average, High, Disaster
  recent: true,
  selectTags: "extend",
  sortfield: ["eventid"],
  sortorder: ["DESC"],
  limit: 50
});

// Acknowledge critical problems
const criticalProblems = problems.filter(p => p.severity >= 4);
for (const problem of criticalProblems) {
  await zabbix_acknowledge_problems({
    eventids: [problem.eventid],
    message: "Investigating the issue",
    action: 6 // Acknowledge + Add message
  });
}

// Get events for analysis
const events = await zabbix_get_events({
  time_from: Math.floor(Date.now() / 1000) - 86400, // Last 24 hours
  severities: [4, 5], // High and Disaster
  selectHosts: ["hostid", "name"],
  selectTags: "extend"
});
```

## 🔧 Maintenance Management Examples

### Scheduled Maintenance

```javascript
// Create maintenance window
const maintenance = await zabbix_create_maintenance({
  name: "Weekly Server Maintenance",
  active_since: Math.floor(Date.now() / 1000),
  active_till: Math.floor(Date.now() / 1000) + 7200, // 2 hours
  hosts: [{ hostid: "10084" }],
  timeperiods: [{
    timeperiod_type: 0, // One time only
    start_date: Math.floor(Date.now() / 1000),
    period: 7200 // 2 hours in seconds
  }],
  maintenance_type: 0, // With data collection
  description: "Scheduled maintenance for system updates"
});

// Get active maintenances
const activeMaintenances = await zabbix_get_maintenances({
  selectHosts: ["hostid", "name"],
  selectTimeperiods: "extend",
  filter: {
    maintenance_type: 0
  }
});
```

## 👤 User and Access Management Examples

### User Administration

```javascript
// Create user group with permissions
const userGroup = await zabbix_create_usergroup({
  name: "Web Administrators",
  gui_access: 0, // System default
  users_status: 0, // Enabled
  rights: [{
    permission: 3, // Read-write
    id: "2" // Linux servers group
  }]
});

// Create new user
const user = await zabbix_create_user({
  username: "webadmin",
  passwd: "SecurePassword123",
  name: "Web",
  surname: "Administrator",
  usrgrps: [{ usrgrpid: userGroup.usrgrpids[0] }],
  medias: [{
    mediatypeid: "1", // Email
    sendto: "webadmin@company.com",
    active: 0, // Enabled
    severity: 63, // All severities
    period: "1-7,00:00-24:00" // Always
  }]
});

// Get user information
const users = await zabbix_get_users({
  selectUsrgrps: "extend",
  selectMedias: "extend",
  filter: {
    username: "webadmin"
  }
});
```

## 🔧 Advanced Automation Examples

### Script Management and Execution

```javascript
// Create diagnostic script
const script = await zabbix_create_script({
  name: "System Diagnostics",
  command: "df -h && free -m && uptime",
  type: 0, // Script
  scope: 4, // Manual host action
  execute_on: 0, // Zabbix agent
  host_access: 2, // Read permission
  description: "Basic system diagnostics",
  confirmation: "Run system diagnostics?"
});

// Execute script on host
const execution = await zabbix_execute_script({
  scriptid: script.scriptids[0],
  hostid: "10084"
});

// Get execution history
const history = await zabbix_get_script_execution_history({
  hostids: ["10084"],
  time_from: Math.floor(Date.now() / 1000) - 3600,
  limit: 10
});
```

### Discovery Rules

```javascript
// Create LLD rule for network interfaces
const discoveryRule = await zabbix_create_discovery_rule({
  hostid: "10084",
  name: "Network interface discovery",
  key_: "net.if.discovery",
  type: 0, // Zabbix agent
  delay: "3600s", // Every hour
  description: "Discover network interfaces",
  filter: {
    evaltype: 0, // And/Or
    conditions: [{
      macro: "{#IFNAME}",
      value: "@Network interfaces for discovery",
      operator: 8 // matches regex
    }]
  },
  lifetime: "30d"
});

// Get discovered hosts from network discovery
const discoveredHosts = await zabbix_get_discovered_hosts({
  output: "extend",
  selectDServices: "extend"
});
```

## 📢 Notification and Action Examples

### Media Types and Notifications

```javascript
// Create email media type
const emailMedia = await zabbix_create_media_type({
  name: "Company Email",
  type: 0, // Email
  smtp_server: "smtp.company.com",
  smtp_port: 587,
  smtp_helo: "zabbix.company.com",
  smtp_email: "zabbix@company.com",
  smtp_security: 1, // STARTTLS
  smtp_authentication: 1, // Normal password
  username: "zabbix@company.com",
  passwd: "email_password",
  message_templates: [{
    eventsource: 0, // Triggers
    recovery: 0, // Problem
    subject: "Problem: {EVENT.NAME}",
    message: "Problem started at {EVENT.TIME} on {HOST.NAME}\n\nProblem name: {EVENT.NAME}\nHost: {HOST.NAME}\nSeverity: {EVENT.SEVERITY}"
  }]
});

// Test media type
const testResult = await zabbix_test_media_type({
  mediatypeid: emailMedia.mediatypeids[0],
  sendto: "admin@company.com",
  subject: "Test notification",
  message: "This is a test message from Zabbix"
});

// Create action for automatic notifications
const action = await zabbix_create_action({
  name: "Notify on high severity problems",
  eventsource: 0, // Triggers
  status: 0, // Enabled
  esc_period: "1h",
  def_shortdata: "Problem: {EVENT.NAME}",
  def_longdata: "Problem started at {EVENT.TIME} on {HOST.NAME}",
  filter: {
    evaltype: 0, // And/Or
    conditions: [{
      conditiontype: 5, // Trigger severity
      operator: 7, // >=
      value: "3" // Average and above
    }]
  },
  operations: [{
    operationtype: 0, // Send message
    esc_period: 0,
    esc_step_from: 1,
    esc_step_to: 1,
    opmessage: {
      default_msg: 1,
      mediatypeid: emailMedia.mediatypeids[0]
    },
    opmessage_usr: [{
      userid: "1" // Admin user
    }]
  }]
});
```

## 🗺️ Visualization Examples

### Maps and Dashboards

```javascript
// Create value map for status interpretation
const valueMap = await zabbix_create_value_map({
  name: "Service Status",
  mappings: [
    { value: "0", newvalue: "Down" },
    { value: "1", newvalue: "Up" },
    { value: "2", newvalue: "Unknown" }
  ]
});

// Create network map
const networkMap = await zabbix_create_map({
  name: "Data Center Network",
  width: 800,
  height: 600,
  selements: [{
    elementtype: 0, // Host
    elementid: "10084",
    x: 100,
    y: 100,
    iconid_off: "1"
  }],
  links: [{
    selementid1: "1",
    selementid2: "2",
    color: "00FF00"
  }]
});

// Create dashboard
const dashboard = await zabbix_create_dashboard({
  name: "Infrastructure Overview",
  pages: [{
    name: "Main",
    widgets: [{
      type: "problems",
      name: "Current Problems",
      x: 0,
      y: 0,
      width: 12,
      height: 5,
      fields: [{
        type: 0, // Integer
        name: "show_tags",
        value: 3
      }]
    }]
  }]
});
```

## 🌐 Infrastructure Management Examples

### Proxy Configuration

```javascript
// Create active proxy
const proxy = await zabbix_create_proxy({
  name: "Remote Office Proxy",
  operating_mode: 0, // Active
  description: "Proxy for remote office monitoring",
  tls_connect: 2, // PSK
  tls_accept: 2, // PSK
  tls_psk_identity: "remote-proxy-01",
  tls_psk: "a1b2c3d4e5f6789012345678901234567890abcdef",
  custom_timeouts: 1,
  timeout_zabbix_agent: "10s",
  timeout_simple_check: "10s"
});

// Assign hosts to proxy
await zabbix_update_host({
  hostid: "10084",
  proxy_hostid: proxy.proxyids[0]
});
```

### Configuration Management

```javascript
// Export configuration
const exportData = await zabbix_export_configuration({
  format: "json",
  options: {
    hosts: ["10084"],
    templates: ["10001"],
    groups: ["2"]
  }
});

// Import configuration to another system
const importResult = await zabbix_import_configuration({
  format: "json",
  source: exportData,
  rules: {
    hosts: {
      createMissing: true,
      updateExisting: true
    },
    templates: {
      createMissing: true,
      updateExisting: true
    },
    groups: {
      createMissing: true
    }
  }
});
```

## 🏢 Business Services Examples

### Service Monitoring Setup

```javascript
// Create parent service
const webService = await zabbix_create_service({
  name: "Web Application",
  algorithm: 2, // Most critical of children
  description: "Main web application service",
  tags: [{
    tag: "Application",
    value: "Web"
  }]
});

// Create child services
const dbService = await zabbix_create_service({
  name: "Database Service",
  algorithm: 0, // Problem, one child
  parents: [{
    serviceid: webService.serviceids[0]
  }],
  problem_tags: [{
    tag: "Service",
    operator: 0, // Equals
    value: "Database"
  }]
});

// Get SLA data
const slaData = await zabbix_get_service_sla({
  serviceids: webService.serviceids,
  intervals: [{
    from: Math.floor(Date.now() / 1000) - 2592000, // 30 days ago
    to: Math.floor(Date.now() / 1000)
  }]
});
```

## 📊 Monitoring Workflows

### Complete Monitoring Setup

```javascript
// 1. Setup host groups and templates
const webGroup = await zabbix_create_hostgroup({
  name: "Web Servers"
});

const webTemplate = await zabbix_create_template({
  host: "Template Web Server",
  name: "Web Server Template",
  groups: [{ groupid: "1" }]
});

// 2. Create hosts with monitoring
const hosts = [];
for (let i = 1; i <= 3; i++) {
  const host = await zabbix_create_host({
    host: `web-${i.toString().padStart(2, '0')}`,
    name: `Web Server ${i}`,
    groups: [{ groupid: webGroup.groupids[0] }],
    templates: [{ templateid: webTemplate.templateids[0] }],
    interfaces: [{
      type: 1,
      main: 1,
      useip: 1,
      ip: `192.168.1.${100 + i}`,
      port: "10050"
    }]
  });
  hosts.push(host.hostids[0]);
}

// 3. Setup monitoring items
for (const hostid of hosts) {
  await zabbix_create_item({
    hostid: hostid,
    name: "HTTP service status",
    key_: "net.tcp.service[http]",
    type: 3, // Simple check
    value_type: 3, // Numeric unsigned
    delay: "60s"
  });
}

// 4. Create maintenance schedule
const weeklyMaintenance = await zabbix_create_maintenance({
  name: "Weekly Web Server Maintenance",
  active_since: Math.floor(Date.now() / 1000),
  active_till: Math.floor(Date.now() / 1000) + 604800, // 1 week
  hosts: hosts.map(id => ({ hostid: id })),
  timeperiods: [{
    timeperiod_type: 3, // Weekly
    every: 1,
    dayofweek: 64, // Sunday
    start_time: 82800, // 23:00
    period: 3600 // 1 hour
  }]
});
```

## 🔍 Troubleshooting Examples

### Diagnostic Workflows

```javascript
// Get hosts with problems
const problematicHosts = await zabbix_get_hosts({
  selectTriggers: ["triggerid", "description", "priority", "value"],
  filter: {
    status: 0 // Monitored hosts
  },
  monitored_hosts: true,
  with_triggers: true,
  with_monitored_triggers: true
});

// Check trigger states
for (const host of problematicHosts) {
  const activeProblems = host.triggers.filter(t => t.value === "1");
  if (activeProblems.length > 0) {
    console.log(`Host ${host.name} has ${activeProblems.length} active problems`);
    
    // Get recent events for this host
    const events = await zabbix_get_events({
      hostids: [host.hostid],
      time_from: Math.floor(Date.now() / 1000) - 3600,
      selectTags: "extend",
      value: 1 // Problem events
    });
    
    // Execute diagnostic script
    const diagnostics = await zabbix_execute_script({
      scriptid: "1", // Diagnostic script ID
      hostid: host.hostid
    });
  }
}

// Get performance trends
const trends = await zabbix_get_trends({
  itemids: ["12345"], // CPU utilization item
  time_from: Math.floor(Date.now() / 1000) - 86400,
  time_till: Math.floor(Date.now() / 1000)
});
```

## 📈 Reporting Examples

### Generate Reports

```javascript
// Monthly availability report
async function generateAvailabilityReport(hostids, month) {
  const startTime = new Date(2024, month - 1, 1).getTime() / 1000;
  const endTime = new Date(2024, month, 0, 23, 59, 59).getTime() / 1000;
  
  const report = {
    period: `${month}/2024`,
    hosts: []
  };
  
  for (const hostid of hostids) {
    // Get host info
    const hosts = await zabbix_get_hosts({
      hostids: [hostid],
      output: ["hostid", "name"]
    });
    
    // Get problems during period
    const problems = await zabbix_get_problems({
      hostids: [hostid],
      time_from: startTime,
      time_till: endTime,
      selectTags: "extend"
    });
    
    // Calculate availability
    const totalTime = endTime - startTime;
    const problemTime = problems.reduce((sum, problem) => {
      const problemEnd = problem.r_eventid ? 
        parseInt(problem.r_clock) : endTime;
      return sum + (problemEnd - parseInt(problem.clock));
    }, 0);
    
    const availability = ((totalTime - problemTime) / totalTime * 100).toFixed(2);
    
    report.hosts.push({
      name: hosts[0].name,
      availability: `${availability}%`,
      problems: problems.length,
      downtime: `${Math.round(problemTime / 3600)} hours`
    });
  }
  
  return report;
}

// Usage
const report = await generateAvailabilityReport(["10084", "10085"], 11);
console.log(JSON.stringify(report, null, 2));
```

## 🚀 Best Practices

### Error Handling

```javascript
async function safeZabbixOperation(operation) {
  try {
    const result = await operation();
    return { success: true, data: result };
  } catch (error) {
    console.error('Zabbix operation failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Usage
const result = await safeZabbixOperation(() => 
  zabbix_get_hosts({ output: "extend" })
);

if (result.success) {
  console.log('Hosts retrieved:', result.data.length);
} else {
  console.error('Failed to get hosts:', result.error);
}
```

### Batch Operations

```javascript
// Batch host creation
async function createHostsBatch(hostConfigs) {
  const results = [];
  
  for (const config of hostConfigs) {
    try {
      const host = await zabbix_create_host(config);
      results.push({ success: true, hostid: host.hostids[0] });
    } catch (error) {
      results.push({ success: false, error: error.message, config });
    }
  }
  
  return results;
}

// Usage
const hostConfigs = [
  {
    host: "server-01",
    name: "Server 01",
    groups: [{ groupid: "2" }],
    interfaces: [{ type: 1, main: 1, useip: 1, ip: "192.168.1.101", port: "10050" }]
  },
  {
    host: "server-02", 
    name: "Server 02",
    groups: [{ groupid: "2" }],
    interfaces: [{ type: 1, main: 1, useip: 1, ip: "192.168.1.102", port: "10050" }]
  }
];

const results = await createHostsBatch(hostConfigs);
```

### Performance Optimization

```javascript
// Efficient data retrieval with selective output
const hosts = await zabbix_get_hosts({
  output: ["hostid", "name", "status"], // Only needed fields
  selectGroups: ["groupid", "name"],
  selectInterfaces: ["interfaceid", "ip"],
  filter: { status: 0 }, // Only monitored hosts
  limit: 100 // Reasonable limit
});

// Use search instead of getting all data
const webServers = await zabbix_get_hosts({
  output: "extend",
  search: { name: "web" },
  searchWildcardsEnabled: true
});
```

---

**This examples guide demonstrates practical usage patterns for all major Zabbix MCP Server functionality, from basic operations to complex automation workflows. Use these examples as starting points for your own monitoring and automation solutions.** 