# New Prompts for Zabbix MCP Server

This file outlines new prompts that can be used with the Zabbix MCP Server, leveraging the newly created analysis tools.

## 1. Host Diagnostics Prompt

**Prompt:** `zabbix_host_diagnostics_report`

**Description:**
Provides a comprehensive diagnostic report for a single host. This is useful for deep-dive investigations into a specific host's performance and status.

**Example Usage (Claude Desktop):**
```json
{
  "hostIdentifier": "zabbix-server",
  "historyItemKeys": [
    "system.cpu.util[,idle]",
    "vm.memory.size[available]",
    "zabbix[queue,5m]"
  ]
}
```

**LLM Conversation Example:**
```
User: "Run a full diagnostic on the zabbix-server."
Assistant: "I'll generate a comprehensive diagnostic report for 'zabbix-server', including its configuration, active problems, and recent performance history for key metrics."

[Uses zabbix_get_host_diagnostics tool]

**Host Diagnostics Report: zabbix-server**
- **Host Details:** (JSON output of host properties)
- **Active Problems:** (List of current problems on the host)
- **Recent History:** (Recent data for the specified items)
```

## 2. Host Comparison Prompt

**Prompt:** `zabbix_compare_host_configurations`

**Description:**
Compares the configurations of two hosts, highlighting differences in templates, macros, and interfaces. This is ideal for troubleshooting "works on my machine" type issues.

**Example Usage (Claude Desktop):**
```json
{
  "hostIdentifierA": "web-server-01",
  "hostIdentifierB": "web-server-02"
}
```

**LLM Conversation Example:**
```
User: "Why is web-server-01 behaving differently from web-server-02? Compare their configurations."
Assistant: "I will compare the configurations of 'web-server-01' and 'web-server-02' to identify any differences."

[Uses zabbix_compare_hosts tool]

**Configuration Difference: web-server-01 vs web-server-02**
(A diff patch showing the differences in JSON configuration)
```

## 3. Unmonitored Hosts Audit Prompt

**Prompt:** `zabbix_audit_unmonitored_hosts_report`

**Description:**
Performs an audit to find hosts that are not being monitored correctly. This is useful for ensuring complete monitoring coverage.

**Example Usage (Claude Desktop):**
```json
{
  "hostGroupIds": ["2"]
}
```

**LLM Conversation Example:**
```
User: "Are there any hosts in the 'Linux Servers' group that we're not monitoring?"
Assistant: "I will audit the hosts in the specified group to find any that are unmonitored or have availability issues."

[Uses zabbix_audit_unmonitored_hosts tool]

**Unmonitored Hosts Audit Report**
- **Unmonitored Hosts:** (List of hosts with status 'unmonitored')
- **Hosts with Availability Errors:** (List of hosts with Zabbix agent reachability issues)
- **Summary:** (Counts of audited hosts and issues found)
```

## 4. Template Audit Prompt

**Prompt:** `zabbix_template_health_check`

**Description:**
Analyzes the health of template configurations, identifying unused templates, hosts without templates, and potentially bloated templates.

**Example Usage (Claude Desktop):**
```json
{
  "itemThreshold": 150,
  "triggerThreshold": 75
}
```

**LLM Conversation Example:**
```
User: "Let's clean up our templates. Run a template health check."
Assistant: "I will perform an audit of your Zabbix templates to identify any that are unlinked, oversized, or any hosts that are missing templates."

[Uses zabbix_template_audit tool]

**Template Audit Report**
- **Unlinked Templates:** (Templates not assigned to any hosts)
- **Hosts Without Templates:** (Hosts that are not using any templates)
- **Oversized Templates:** (Templates exceeding the item/trigger thresholds)
- **Summary:** (Counts of templates, hosts, and identified issues)
```
