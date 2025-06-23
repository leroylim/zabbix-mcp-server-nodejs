# Schema Usage Guidelines

## Hybrid Approach for Optimal Readability + Reusability

### When to Use Centralized Schemas

✅ **Use centralized schemas for:**
- **Common business entities**: `vendorHostname`, `labels`, `severity`
- **Complex validation logic**: Email, IP addresses, date formats
- **Cross-tool consistency**: Parameters used in multiple tools
- **Regulatory/business rules**: Data that must follow strict patterns

### When to Use Inline Schemas

✅ **Use inline schemas for:**
- **Tool-specific parameters**: Unique to one tool
- **Simple validations**: Basic strings, numbers with obvious constraints
- **Self-documenting cases**: Where the validation IS the documentation

## Recommended Patterns

### Pattern 1: Document Schema Usage with Comments
```javascript
// Good: Clear intent and validation reference
parameters: z.object({
    vendor_hostname: schemas.vendorHostname,  // Validates domain format, max 253 chars
    vendor_tier: z.number().int().min(1).max(3).optional()
        .describe('Tier level for the vendor (1-3)'),
    custom_field: z.string().max(100)  // Tool-specific, keep inline
})
```

### Pattern 2: Extend Centralized Schemas When Needed
```javascript
// Tool needs stricter validation than base schema
vendor_hostname: schemas.vendorHostname.refine(
    (val) => !val.includes('test'),
    'Production tools cannot monitor test domains'
)
```

### Pattern 3: Schema Documentation in JSDoc
```javascript
/**
 * Start monitoring a new vendor
 * @param {string} vendor_hostname - Must be valid domain (uses schemas.vendorHostname)
 * @param {number} [vendor_tier=1] - Tier level 1-3
 * @param {string[]} [vendor_labels] - Max 10 labels (uses schemas.labels)
 */
server.tool('upguard_start_monitoring_vendor', {
    parameters: z.object({
        vendor_hostname: schemas.vendorHostname,
        vendor_tier: z.number().int().min(1).max(3).optional()
            .describe('Tier level for the vendor (1-3)'),
        vendor_labels: schemas.labels.optional()
    })
}, async (params) => { /* ... */ });
```

## Migration Strategy

### Phase 1: High-Value Schemas First
```javascript
// Migrate these first (high consistency value):
- vendorHostname (used in 15+ tools)
- labels (used in 8+ tools)  
- severity (used in risk tools)
- ipAddress (used in IP tools)
```

### Phase 2: Keep Tool-Specific Inline
```javascript
// Keep these inline (low reuse, high specificity):
- scan_type (vendor tools only)
- report_format (report tools only)
- webhook_events (webhook tools only)
```

## IDE Support Enhancement

### Type Definitions for Better DX
```typescript
// schemas/types.d.ts
export interface VendorHostname extends z.ZodString {
  description: "Valid domain name format (e.g., 'example.com')"
  validation: "Regex: /^[a-zA-Z0-9][a-zA-Z0-9-_.]*[a-zA-Z0-9]$/"
  maxLength: 253
}
```

## Readability Best Practices

### 1. Schema Registry Documentation
Create a quick reference showing all available schemas with examples.

### 2. VS Code Snippets
```json
{
  "vendor-hostname": {
    "prefix": "vh",
    "body": "vendor_hostname: schemas.vendorHostname,",
    "description": "Vendor hostname with domain validation"
  }
}
```

### 3. Validation Error Context
```javascript
// Enhanced error messages that reference schema source
try {
  schemas.vendorHostname.parse(input);
} catch (error) {
  throw new Error(`Invalid vendor hostname (see schemas.vendorHostname): ${error.message}`);
}
``` 