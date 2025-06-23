# Swagger Compliance Migration Guide

## Overview

This document outlines the complete migration to Swagger specification compliance for the UpGuard CyberRisk MCP Server tools. All tools now use exact parameter names, descriptions, and validation rules as defined in the official UpGuard CyberRisk API Swagger specification.

## ⚠️ Breaking Changes

### Parameter Name Changes

**IMPORTANT**: The following parameter names have changed to match Swagger specifications exactly:

| Tool | Old Parameter | New Parameter | Reason |
|------|---------------|---------------|---------|
| `upguard_get_vendor_risks` | `vendor_primary_hostname` | `primary_hostname` | Swagger spec uses `primary_hostname` |
| `upguard_get_vendor_risks_diff` | `primary_hostname` | `vendor_primary_hostname` | Swagger spec uses `vendor_primary_hostname` |
| `upguard_get_domains` | `domain` | `hostname` | Swagger spec uses `hostname` |
| `upguard_get_domain_details` | `domain` | `hostname` | Swagger spec uses `hostname` |
| `upguard_update_domain_labels` | `domain` | `hostname` | Swagger spec uses `hostname` |
| `upguard_get_ips` | `ip_address` | `ip` | Swagger spec uses `ip` |
| `upguard_get_ip_details` | `ip_address` | `ip` | Swagger spec uses `ip` |
| `upguard_get_vendor_vulnerabilities` | `vendor_hostname` | `primary_hostname` | Swagger spec uses `primary_hostname` |
| `upguard_get_identity_breach` | `identity_breach_id` | `id` | Swagger spec uses `id` |
| `upguard_delete_webhook` | `webhook_id` | `id` | Swagger spec uses `id` |
| `upguard_get_report_status` | `report_id` | `queued_report_id` | Swagger spec uses `queued_report_id` |

### Removed Tools

The following tools were removed as they don't exist in the Swagger specification:
- `upguard_update_webhook` - No update endpoint in Swagger
- `upguard_get_available_reports` - No such endpoint in Swagger  
- `upguard_download_report` - No direct download endpoint in Swagger

### Added Tools

New tools added to match Swagger specification:
- `upguard_get_custom_reports` - Get custom report templates
- `upguard_get_webhook_sample_data` - Get webhook sample data
- `upguard_get_vendor_questionnaire_risks` - Get vendor questionnaire risks
- `upguard_get_vendor_questionnaire_risks_v2` - Get vendor questionnaire risks v2
- `upguard_send_vendor_questionnaire` - Send questionnaire to vendor
- `upguard_get_vendor_questionnaires` - Get vendor questionnaires
- `upguard_get_vendor_questionnaires_v2` - Get vendor questionnaires v2
- `upguard_get_questionnaire_types` - Get available questionnaire types
- `upguard_send_relationship_questionnaire` - Send relationship questionnaire
- `upguard_get_vendor_questionnaire_attachments` - Get questionnaire attachments
- `upguard_get_ranges` - Get IP ranges
- `upguard_update_ip_labels` - Update IP labels
- `upguard_update_domain_labels` - Update domain labels
- Bulk hostname operations (6 new tools)

## Migration Strategy

### 1. Backward Compatibility Removed

**Previous approach**: Tools accepted both old and new parameter names for backward compatibility.

**Current approach**: Tools use **ONLY** the exact Swagger parameter names.

**Impact**: Existing integrations using old parameter names will break and need to be updated.

### 2. Swagger-First Development

All tools now follow these principles:

1. **Exact Parameter Names**: Use parameter names exactly as defined in Swagger
2. **Exact Descriptions**: Use descriptions from Swagger specification  
3. **Exact Validation**: Use validation rules from Swagger (enums, formats, etc.)
4. **Complete Coverage**: Implement all parameters defined in Swagger

### 3. Schema Usage Strategy

**Centralized schemas are still used for**:
- Complex validation patterns (hostnames, emails, dates)
- Reusable business rules (severity levels, status enums)
- Cross-tool consistency (vendor IDs, labels)

**But now aligned with Swagger specifications**:
```javascript
// Schema definitions match Swagger exactly
primaryHostname: z.string().describe("Primary hostname (e.g., 'example.com').")
severity: z.enum(["info", "low", "medium", "high", "critical"])
```

## Updated Tool Categories

### ✅ Fully Swagger Compliant

1. **Risk Tools** (`src/tools/risks.js`)
   - `upguard_get_risks` - Uses exact Swagger parameters
   - `upguard_get_vendor_risks` - Now uses `primary_hostname`
   - `upguard_get_vendor_risks_diff` - Uses `vendor_primary_hostname`
   - Added questionnaire risk tools

2. **Vendor Tools** (`src/tools/vendors.js`)
   - All parameters match Swagger exactly
   - Removed deprecated parameters
   - Added missing vendor operations

3. **Domain Tools** (`src/tools/domains.js`)
   - Changed `domain` to `hostname` throughout
   - Added pagination parameters
   - Added `upguard_update_domain_labels`

4. **IP Tools** (`src/tools/ips.js`)
   - Changed `ip_address` to `ip` throughout
   - Added pagination parameters
   - Added `upguard_get_ranges` and `upguard_update_ip_labels`

5. **Questionnaire Tools** (`src/tools/questionnaires.js`)
   - Complete rewrite to match Swagger
   - 6 new tools added
   - All parameters match Swagger specification

6. **Subsidiary Tools** (`src/tools/subsidiaries.js`)
   - Redesigned to focus on subsidiary domain management
   - Uses Swagger `/subsidiary/` endpoints

7. **Organization Tools** (`src/tools/organization.js`)
   - Simplified to match Swagger (no parameters)

8. **Webhook Tools** (`src/tools/webhooks.js`)
   - Updated parameter names (`webhook_id` → `id`)
   - Removed non-existent update endpoint
   - Added sample data endpoint

9. **Reports Tools** (`src/tools/reports.js`)
   - Added all Swagger report parameters
   - Updated parameter names
   - Added custom reports endpoint

10. **Breaches Tools** (`src/tools/breaches.js`)
    - Added pagination parameters
    - Updated parameter names (`identity_breach_id` → `id`)

11. **Bulk Tools** (`src/tools/bulk.js`)
    - Complete rewrite to match Swagger bulk hostname operations
    - Removed non-existent domain/IP bulk operations

## API Client Updates

All API client functions have been updated to:
- Use correct HTTP methods (GET, POST, PUT, DELETE)
- Use correct endpoints from Swagger
- Handle parameters exactly as Swagger specifies

## Testing Strategy

### Validation Testing
```javascript
// All tools now validate against exact Swagger schemas
const result = await server.call('upguard_get_vendor_risks', {
  primary_hostname: 'example.com'  // Must use exact Swagger parameter name
});
```

### Error Handling
```javascript
// Better error messages based on Swagger validation
"Parameter 'primary_hostname' is required"
"Invalid severity level. Must be one of: info, low, medium, high, critical"
```

## Developer Experience

### ✅ Benefits
- **Consistency**: All tools match official API documentation
- **Reliability**: No parameter name confusion
- **Completeness**: All Swagger endpoints are implemented
- **Maintainability**: Single source of truth (Swagger spec)

### ⚠️ Migration Required
- Update all existing integrations to use new parameter names
- Review tool usage to ensure compatibility
- Test all integrations after migration

## Future Maintenance

### Swagger-First Approach
1. **API Changes**: Monitor Swagger specification for updates
2. **New Endpoints**: Add new tools when Swagger is updated
3. **Parameter Changes**: Update tools when Swagger parameters change
4. **Validation**: Keep validation rules in sync with Swagger

### Schema Evolution
- Schemas will evolve to match Swagger updates
- Centralized schemas ensure consistency across tools
- Breaking changes will be documented and communicated

## Conclusion

The migration to strict Swagger compliance provides:
- ✅ **100% API Compatibility** with official UpGuard documentation
- ✅ **Predictable Behavior** matching official API exactly
- ✅ **Complete Feature Coverage** of all available endpoints
- ✅ **Future-Proof Architecture** that stays in sync with API updates

**Next Steps**: Update your integrations to use the new parameter names and test thoroughly. 