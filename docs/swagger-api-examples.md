# UpGuard CyberRisk MCP Server - Swagger API Examples

## Overview

This document provides comprehensive examples of using the UpGuard CyberRisk MCP Server tools that are now 100% compliant with the official Swagger specification. All examples use exact parameter names and validation rules as defined in the UpGuard API documentation.

## 🚨 Important Parameter Changes

**Before using these examples**, note the key parameter name changes:

| Old Parameter | New Parameter | Affected Tools |
|---------------|---------------|----------------|
| `vendor_primary_hostname` | `primary_hostname` | `upguard_get_vendor_risks` |
| `domain` | `hostname` | All domain tools |
| `ip_address` | `ip` | All IP tools |
| `identity_breach_id` | `id` | `upguard_get_identity_breach` |

## 📊 Risk Management Examples

### 1. Get Account Risks with Filtering

```javascript
// Get high and critical severity risks for your account
const accountRisks = await server.call('upguard_get_risks', {
  min_severity: 'high',
  page_size: 50,
  sort_by: 'severity',
  sort_desc: true
});
```

### 2. Vendor Risk Assessment

```javascript
// Get all risks for a specific vendor
const vendorRisks = await server.call('upguard_get_vendor_risks', {
  primary_hostname: 'vendor.com',  // Note: changed from vendor_primary_hostname
  min_severity: 'medium',
  page_size: 100
});

// Compare vendor risks over time
const riskChanges = await server.call('upguard_get_vendor_risks_diff', {
  vendor_primary_hostname: 'vendor.com',  // Note: this endpoint uses vendor_primary_hostname
  from_date: '2024-01-01',
  to_date: '2024-12-31',
  min_severity: 'high'
});
```

### 3. Questionnaire-Based Risk Assessment

```javascript
// Get risks from vendor questionnaire responses
const questionnaireRisks = await server.call('upguard_get_vendor_questionnaire_risks', {
  vendor_primary_hostname: 'vendor.com',
  min_severity: 'medium'
});

// Use enhanced v2 questionnaire risk assessment
const enhancedRisks = await server.call('upguard_get_vendor_questionnaire_risks_v2', {
  vendor_primary_hostname: 'vendor.com',
  sort_by: 'severity',
  sort_desc: true
});
```

## 🏢 Vendor Management Examples

### 1. Complete Vendor Onboarding Workflow

```javascript
// Step 1: Get vendor details (generates ad-hoc report if needed)
const vendorDetails = await server.call('upguard_get_vendor', {
  hostname: 'newvendor.com',
  generate_ad_hoc_report: true,
  wait_for_scan: true
});

// Step 2: Start monitoring the vendor
const monitoring = await server.call('upguard_start_monitoring_vendor', {
  hostname: 'newvendor.com',
  tier: 1,  // High priority
  labels: ['critical-vendor', 'financial-services'],
  wait_for_scan: true
});

// Step 3: Get initial risk assessment
const initialRisks = await server.call('upguard_get_vendor_risks', {
  primary_hostname: 'newvendor.com',
  min_severity: 'low'
});
```

### 2. Vendor Portfolio Management

```javascript
// Update vendor categorization
const labelUpdate = await server.call('upguard_update_vendor_labels', {
  vendor_primary_hostname: 'vendor.com',
  labels: ['tier-1', 'cloud-provider', 'data-processor']
});

// Get vendor score trends
const scoreHistory = await server.call('upguard_get_vendor_score_history', {
  hostname: 'vendor.com',
  from_date: '2024-01-01',
  to_date: '2024-12-31'
});

// Stop monitoring a vendor
const stopMonitoring = await server.call('upguard_stop_monitoring_vendor', {
  hostname: 'former-vendor.com'
});
```

## 🌐 Domain & IP Management Examples

### 1. Domain Security Monitoring

```javascript
// Add multiple domains for monitoring
const addDomains = await server.call('upguard_add_custom_domains', {
  hostnames: ['example.com', 'subdomain.example.com', 'api.example.com'],
  labels: ['production', 'customer-facing']
});

// Get comprehensive domain list with filtering
const domains = await server.call('upguard_get_domains', {
  labels: ['production'],
  sort_by: 'automated_score',
  sort_desc: true,
  page_size: 100
});

// Get detailed security analysis for a domain
const domainDetails = await server.call('upguard_get_domain_details', {
  hostname: 'example.com'  // Note: changed from 'domain'
});

// Update domain categorization
const updateLabels = await server.call('upguard_update_domain_labels', {
  hostname: 'example.com',
  labels: ['production', 'critical', 'customer-data']
});
```

### 2. IP Address Security Monitoring

```javascript
// Add IP addresses for monitoring
const addIPs = await server.call('upguard_add_custom_ips', {
  ips: ['192.168.1.100', '10.0.0.50'],
  labels: ['internal', 'database-servers']
});

// Get IP details with security scan results
const ipDetails = await server.call('upguard_get_ip_details', {
  ip: '192.168.1.100'  // Note: changed from 'ip_address'
});

// Get IP ranges for network analysis
const ipRanges = await server.call('upguard_get_ranges', {
  sort_by: 'num_ips',
  sort_desc: true
});

// Update IP categorization
const updateIPLabels = await server.call('upguard_update_ip_labels', {
  ip: 192168001100,  // Note: IP as integer for label updates
  labels: ['production', 'web-servers']
});
```

## 📋 Questionnaire Management Examples

### 1. Vendor Questionnaire Workflow

```javascript
// Get available questionnaire types
const questionnaireTypes = await server.call('upguard_get_questionnaire_types', {});

// Send questionnaire to vendor
const sendQuestionnaire = await server.call('upguard_send_vendor_questionnaire', {
  hostname: 'vendor.com',
  questionnaire_type_id: 'security-assessment-v2',
  recipient_email: 'security@vendor.com',
  recipient_first_name: 'John',
  recipient_last_name: 'Smith',
  message: 'Please complete this security assessment for our vendor onboarding process.'
});

// Check questionnaire status
const questionnaires = await server.call('upguard_get_vendor_questionnaires', {
  hostname: 'vendor.com',
  status: 'active'
});

// Get questionnaire attachments
const attachments = await server.call('upguard_get_vendor_questionnaire_attachments', {
  hostname: 'vendor.com',
  questionnaire_id: 'quest-123456'
});
```

### 2. Relationship Questionnaires

```javascript
// Send relationship questionnaire
const relationshipQuest = await server.call('upguard_send_relationship_questionnaire', {
  questionnaire_type_id: 'vendor-relationship-v1',
  target_vendors: ['vendor1-id', 'vendor2-id'],
  recipient_email: 'partnerships@company.com',
  message: 'Please complete this relationship assessment.'
});
```

## 📊 Reporting Examples

### 1. Executive Reporting

```javascript
// Get available custom report templates
const customReports = await server.call('upguard_get_custom_reports', {});

// Queue executive summary report
const executiveReport = await server.call('upguard_queue_report', {
  report_type: 'VendorRiskExecutiveSummaryPDF',
  vendor_portfolio_names: ['Critical Vendors', 'Tier 1 Partners'],
  email_addresses: ['ciso@company.com', 'ceo@company.com'],
  filename_prefix: 'Q4-2024'
});

// Queue detailed vendor report
const vendorReport = await server.call('upguard_queue_report', {
  report_type: 'VendorDetailedPDF',
  vendor_primary_hostname: 'critical-vendor.com',
  wait_for_data: true,
  post_webhook_url: 'https://company.com/webhooks/report-ready'
});

// Check report status
const reportStatus = await server.call('upguard_get_report_status', {
  queued_report_id: 'report-abc123'  // Note: changed from 'report_id'
});
```

### 2. Custom Report Generation

```javascript
// Generate custom report using template
const customReport = await server.call('upguard_queue_report', {
  report_type: 'CustomPDF',
  custom_report_uuid: 'template-uuid-123',
  vendor_id: 12345,
  filename_prefix: 'Custom-Assessment'
});
```

## 🔔 Webhook & Notification Examples

### 1. Webhook Management

```javascript
// Get available notification types
const notificationTypes = await server.call('upguard_get_webhook_notification_types', {});

// Create webhook for critical alerts
const webhook = await server.call('upguard_create_webhook', {
  name: 'Critical Security Alerts',
  hook_url: 'https://company.com/webhooks/security-alerts',
  notification_type_ids: ['risk-detected', 'score-changed', 'breach-detected']
});

// Get webhook sample data for testing
const sampleData = await server.call('upguard_get_webhook_sample_data', {
  notification_type_ids: ['risk-detected', 'score-changed']
});

// List all webhooks
const webhooks = await server.call('upguard_list_webhooks', {});

// Delete webhook
const deleteWebhook = await server.call('upguard_delete_webhook', {
  id: 'webhook-123'  // Note: changed from 'webhook_id'
});
```

## 🔍 Breach Monitoring Examples

### 1. Identity Breach Tracking

```javascript
// Get recent breached identities
const breachedIdentities = await server.call('upguard_get_breached_identities', {
  sort_by: 'date_last_breach',
  sort_desc: true,
  page_size: 50
});

// Filter by specific breach
const specificBreach = await server.call('upguard_get_breached_identities', {
  breach_id: 'breach-12345',
  sort_by: 'num_breaches',
  sort_desc: true
});

// Get detailed breach information
const breachDetails = await server.call('upguard_get_identity_breach', {
  id: 'breach-12345'  // Note: changed from 'identity_breach_id'
});
```

## 🏗️ Bulk Operations Examples

### 1. Bulk Hostname Management

```javascript
// List bulk hostnames with filtering
const bulkHostnames = await server.call('upguard_list_bulk_hostnames', {
  labels: ['production'],
  exclude_inactive: true,
  omit_scan_info: false,
  page_size: 500
});

// Register multiple hostnames for bulk monitoring
const registerBulk = await server.call('upguard_register_bulk_hostnames', {
  hostnames: ['host1.example.com', 'host2.example.com', 'host3.example.com'],
  labels: ['bulk-import', 'production']
});

// Get bulk hostname statistics
const bulkStats = await server.call('upguard_get_bulk_hostnames_stats', {});

// Get details for specific bulk hostname
const hostnameDetails = await server.call('upguard_get_bulk_hostname_details', {
  hostname: 'host1.example.com'
});

// Update labels for bulk hostname
const updateBulkLabels = await server.call('upguard_update_bulk_hostname_labels', {
  hostname: 'host1.example.com',
  labels: ['production', 'web-tier', 'customer-facing']
});

// Remove hostnames from bulk monitoring
const deregisterBulk = await server.call('upguard_deregister_bulk_hostnames', {
  hostnames: ['old-host1.example.com', 'old-host2.example.com']
});
```

## 🔧 Organization & System Examples

### 1. Organization Management

```javascript
// Get organization details
const orgDetails = await server.call('upguard_get_organisation', {});

// Get available labels
const labels = await server.call('upguard_get_labels', {});

// Get notifications
const notifications = await server.call('upguard_get_notifications', {});
```

### 2. Vulnerability Tracking

```javascript
// Get vendor vulnerabilities
const vulnerabilities = await server.call('upguard_get_vendor_vulnerabilities', {
  primary_hostname: 'vendor.com'  // Note: changed from 'vendor_hostname'
});
```

### 3. Typosquat Monitoring

```javascript
// List typosquat domains
const typosquatDomains = await server.call('upguard_list_typosquat_domains', {});

// Get typosquat details
const typosquatDetails = await server.call('upguard_get_typosquat_details', {
  domain: 'suspicious-domain.com'
});
```

## 🔄 Complete Workflow Examples

### 1. New Vendor Onboarding

```javascript
async function onboardNewVendor(vendorHostname, tier, labels) {
  try {
    // Step 1: Get vendor details and generate initial report
    const vendorInfo = await server.call('upguard_get_vendor', {
      hostname: vendorHostname,
      generate_ad_hoc_report: true,
      wait_for_scan: true
    });
    
    // Step 2: Start monitoring
    const monitoring = await server.call('upguard_start_monitoring_vendor', {
      hostname: vendorHostname,
      tier: tier,
      labels: labels,
      wait_for_scan: true
    });
    
    // Step 3: Send security questionnaire
    const questionnaire = await server.call('upguard_send_vendor_questionnaire', {
      hostname: vendorHostname,
      questionnaire_type_id: 'security-assessment-v2',
      recipient_email: `security@${vendorHostname}`,
      message: 'Please complete our security assessment.'
    });
    
    // Step 4: Get initial risk assessment
    const risks = await server.call('upguard_get_vendor_risks', {
      primary_hostname: vendorHostname,
      min_severity: 'medium'
    });
    
    // Step 5: Queue detailed report
    const report = await server.call('upguard_queue_report', {
      report_type: 'VendorDetailedPDF',
      vendor_primary_hostname: vendorHostname,
      email_addresses: ['vendor-management@company.com']
    });
    
    return {
      vendor: vendorInfo,
      monitoring: monitoring,
      questionnaire: questionnaire,
      risks: risks,
      report: report
    };
  } catch (error) {
    console.error('Vendor onboarding failed:', error);
    throw error;
  }
}

// Usage
const result = await onboardNewVendor('newvendor.com', 2, ['cloud-provider', 'data-processor']);
```

### 2. Security Monitoring Dashboard

```javascript
async function getSecurityDashboard() {
  try {
    // Get high-priority risks
    const criticalRisks = await server.call('upguard_get_risks', {
      min_severity: 'high',
      sort_by: 'severity',
      sort_desc: true,
      page_size: 20
    });
    
    // Get recent breaches
    const recentBreaches = await server.call('upguard_get_breached_identities', {
      sort_by: 'date_last_breach',
      sort_desc: true,
      page_size: 10
    });
    
    // Get domain security status
    const domains = await server.call('upguard_get_domains', {
      sort_by: 'automated_score',
      page_size: 50
    });
    
    // Get organization info
    const organization = await server.call('upguard_get_organisation', {});
    
    return {
      criticalRisks: criticalRisks,
      recentBreaches: recentBreaches,
      domains: domains,
      organization: organization
    };
  } catch (error) {
    console.error('Dashboard data fetch failed:', error);
    throw error;
  }
}
```

## 🚨 Error Handling Best Practices

```javascript
async function robustVendorRiskCheck(hostname) {
  try {
    const risks = await server.call('upguard_get_vendor_risks', {
      primary_hostname: hostname,  // Use correct parameter name
      min_severity: 'medium'
    });
    return risks;
  } catch (error) {
    if (error.message.includes('Parameter')) {
      console.error('Parameter validation error:', error.message);
      // Handle parameter name issues
    } else if (error.message.includes('404')) {
      console.error('Vendor not found:', hostname);
      // Handle vendor not found
    } else {
      console.error('Unexpected error:', error);
    }
    throw error;
  }
}
```

## 📝 Notes

1. **Parameter Names**: Always use exact Swagger parameter names
2. **Validation**: All parameters are validated against Swagger schemas
3. **Pagination**: Use `page_token` and `page_size` for large datasets
4. **Filtering**: Use `labels`, `min_severity`, and other filters to focus results
5. **Async Operations**: Reports and some operations are asynchronous - use status endpoints to check completion

This comprehensive guide covers all major use cases with the new Swagger-compliant parameter names and validation rules. 