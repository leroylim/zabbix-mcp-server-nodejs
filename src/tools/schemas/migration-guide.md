# Schema Migration Guide

This guide explains how to migrate from inline schemas to the centralized schema system in the UpGuard CyberRisk MCP Server.

## Overview

The centralized schema system provides:
- **Consistency**: Single source of truth for validation rules
- **Reusability**: Common schemas shared across tools
- **Maintainability**: Easier updates and bug fixes
- **Documentation**: Comprehensive schema documentation

## Migration Process

### Step 1: Identify Common Patterns

Before migrating, identify common validation patterns in your tool:

```javascript
// Common patterns to look for:
- hostname validation
- email validation
- severity levels
- date formats
- pagination parameters
```

### Step 2: Import Centralized Schemas

Replace inline schemas with imports from the centralized system:

```javascript
// Before (inline)
const toolSchema = {
  type: "object",
  properties: {
    hostname: {
      type: "string",
      pattern: "^[a-zA-Z0-9]([a-zA-Z0-9\\-]{0,61}[a-zA-Z0-9])?(\\.([a-zA-Z0-9]([a-zA-Z0-9\\-]{0,61}[a-zA-Z0-9])?))*$",
      description: "Domain name or hostname"
    }
  }
};

// After (centralized)
import { hostname } from './schemas/index.js';

const toolSchema = {
  type: "object",
  properties: {
    hostname
  }
};
```

### Step 3: Handle Tool-Specific Schemas

For tool-specific validation, combine centralized and custom schemas:

```javascript
import { hostname, severity } from './schemas/index.js';

const customToolSchema = {
  type: "object",
  properties: {
    hostname,        // Centralized
    severity,        // Centralized
    customField: {   // Tool-specific
      type: "string",
      enum: ["custom1", "custom2"],
      description: "Tool-specific field"
    }
  }
};
```

## Available Centralized Schemas

### Core Schemas
- `hostname` - Domain name validation
- `email` - Email address validation
- `emailArray` - Array of email addresses
- `severity` - Risk severity levels
- `labels` - String array for categorization

### Filter Schemas
- `riskFilters` - Risk filtering parameters
- `vulnerabilityFilters` - Vulnerability filtering
- `dateRange` - Date range validation

### Pagination
- `pagination` - Standard pagination parameters

## Migration Examples

### Example 1: Vendors Tool

```javascript
// Before
const vendorsSchema = {
  type: "object",
  properties: {
    hostname: {
      type: "string",
      pattern: "^[a-zA-Z0-9]([a-zA-Z0-9\\-]{0,61}[a-zA-Z0-9])?(\\.([a-zA-Z0-9]([a-zA-Z0-9\\-]{0,61}[a-zA-Z0-9])?))*$",
      description: "Domain name or hostname to scan"
    },
    labels: {
      type: "array",
      items: { type: "string" },
      description: "Optional labels to categorize vendors"
    }
  },
  required: ["hostname"]
};

// After
import { hostname, labels } from './schemas/index.js';

const vendorsSchema = {
  type: "object",
  properties: {
    hostname,
    labels
  },
  required: ["hostname"]
};
```

### Example 2: Risks Tool

```javascript
// Before
const risksSchema = {
  type: "object",
  properties: {
    hostname: {
      type: "string",
      pattern: "^[a-zA-Z0-9]([a-zA-Z0-9\\-]{0,61}[a-zA-Z0-9])?(\\.([a-zA-Z0-9]([a-zA-Z0-9\\-]{0,61}[a-zA-Z0-9])?))*$"
    },
    severity: {
      type: "string",
      enum: ["low", "medium", "high", "critical"]
    }
  }
};

// After
import { hostname, riskFilters } from './schemas/index.js';

const risksSchema = {
  type: "object",
  properties: {
    hostname,
    ...riskFilters.properties
  }
};
```

## Best Practices

### 1. Gradual Migration
- Migrate one tool at a time
- Test thoroughly after each migration
- Keep inline schemas for truly unique validations

### 2. Schema Composition
```javascript
// Combine multiple centralized schemas
import { hostname, severity, pagination } from './schemas/index.js';

const complexSchema = {
  type: "object",
  properties: {
    ...hostname,
    ...severity,
    ...pagination.properties,
    customField: {
      type: "string",
      description: "Tool-specific field"
    }
  }
};
```

### 3. Error Handling
Centralized schemas provide consistent error messages:

```javascript
// Automatic validation with consistent errors
const validation = ajv.validate(schema, data);
if (!validation) {
  // Consistent error format across all tools
  throw new Error(`Validation failed: ${ajv.errorsText()}`);
}
```

## Testing Migration

### 1. Unit Tests
```javascript
import { hostname } from '../schemas/index.js';

describe('Hostname Schema', () => {
  test('validates correct hostname', () => {
    const result = ajv.validate(hostname, 'example.com');
    expect(result).toBe(true);
  });
});
```

### 2. Integration Tests
```javascript
// Test tool with migrated schema
const toolResult = await mcpClient.callTool('vendors', {
  hostname: 'test.example.com'
});
expect(toolResult.success).toBe(true);
```

## Troubleshooting

### Common Issues

1. **Import Errors**
   ```javascript
   // Wrong
   import hostname from './schemas/index.js';
   
   // Correct
   import { hostname } from './schemas/index.js';
   ```

2. **Schema Composition**
   ```javascript
   // Wrong
   properties: { hostname, severity }
   
   // Correct
   properties: {
     hostname,
     severity
   }
   ```

3. **Required Fields**
   ```javascript
   // Don't forget to update required arrays
   const schema = {
     properties: { hostname, email },
     required: ["hostname"] // Update as needed
   };
   ```

## Validation

After migration, verify:
- [ ] All tests pass
- [ ] Schema validation works correctly
- [ ] Error messages are consistent
- [ ] Documentation is updated
- [ ] No duplicate validation logic remains

## Support

For migration assistance:
1. Check the [documentation.md](./documentation.md) for schema details
2. Review [swagger-compliance-guide.md](./swagger-compliance-guide.md) for API compliance
3. Run the test suite to validate changes
4. Check existing migrated tools for examples

## Future Enhancements

The centralized schema system enables:
- Automatic API documentation generation
- Consistent validation across all tools
- Easier addition of new validation rules
- Better error reporting and debugging 