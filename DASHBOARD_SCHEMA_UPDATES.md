# Dashboard Tool Zod Schema Updates

## Summary
Updated the Zabbix MCP dashboard tools schema to comply with the official [Zabbix Dashboard Object documentation](https://www.zabbix.com/documentation/current/en/manual/api/reference/dashboard/object).

## Key Changes Made

### 1. **Display Period Validation** ✅
**Before:**
```javascript
display_period: z.number().int().min(10).max(31536000).optional().default(30)
```

**After:**
```javascript
display_period: z.enum([0, 10, 30, 60, 120, 600, 1800, 3600]).optional().default(30)
```

**Reason:** Zabbix only accepts specific values for display periods, not arbitrary ranges.

### 2. **Widget Positioning Limits (Update Tool)** ✅
**Before:**
```javascript
x: z.number().int().min(0).max(23)     // Incorrect max
y: z.number().int().min(0).max(62)     // Incorrect max  
width: z.number().int().min(1).max(24)  // Incorrect max
height: z.number().int().min(2).max(32) // Incorrect max
```

**After:**
```javascript
x: z.number().int().min(0).max(71)      // ✅ Correct: 0-71
y: z.number().int().min(0).max(63)      // ✅ Correct: 0-63
width: z.number().int().min(1).max(72)  // ✅ Correct: 1-72
height: z.number().int().min(1).max(64) // ✅ Correct: 1-64
```

**Note:** Create tool already had correct values, only update tool needed fixing.

### 3. **Widget Field Types (Update Tool)** ✅
**Before:**
```javascript
type: z.number().int().min(0).max(7)    // Only supports 8 types
```

**After:**
```javascript
type: z.number().int().min(0).max(13)   // ✅ Supports all 14 types
```

### 4. **User/UserGroup Permissions Schema** ✅
**Before:**
```javascript
users: z.array(z.record(z.any())).optional()
userGroups: z.array(z.record(z.any())).optional()
```

**After:**
```javascript
users: z.array(z.object({
    userid: z.string().describe('User ID'),
    permission: z.number().int().min(2).max(3).describe('Access level: 2 (read-only), 3 (read-write)')
})).optional()

userGroups: z.array(z.object({
    usrgrpid: z.string().describe('User group ID'),
    permission: z.number().int().min(2).max(3).describe('Access level: 2 (read-only), 3 (read-write)')
})).optional()
```

## Widget Field Types Reference

According to the official documentation, widget field types are:

| Type | Description |
|------|-------------|
| 0    | Integer |
| 1    | String |
| 2    | Host group |
| 3    | Host |
| 4    | Item |
| 5    | Item prototype |
| 6    | Graph |
| 7    | Graph prototype |
| 8    | Map |
| 9    | Service |
| 10   | SLA |
| 11   | User |
| 12   | Action |
| 13   | Media type |

## Display Period Values Reference

Valid `display_period` values (in seconds):

| Value | Description |
|-------|-------------|
| 0     | Use default page display period |
| 10    | 10 seconds |
| 30    | 30 seconds |
| 60    | 1 minute |
| 120   | 2 minutes |
| 600   | 10 minutes |
| 1800  | 30 minutes |
| 3600  | 1 hour |

## Widget Positioning Limits

| Property | Min | Max | Description |
|----------|-----|-----|-------------|
| x        | 0   | 71  | Horizontal position from left side |
| y        | 0   | 63  | Vertical position from top |
| width    | 1   | 72  | Widget width |
| height   | 1   | 64  | Widget height |

## Testing

✅ **Dashboard ID 142** successfully created with updated schema:
- Name: "📺 UPDATED TV SLIDESHOW - Global Infrastructure"
- Used valid `display_period: 120` (2 minutes)
- Used full-width widgets (72 units)
- All field types properly validated

## Benefits

1. **Compliance**: Now fully compliant with official Zabbix API specification
2. **Validation**: Prevents invalid parameter values that cause API errors
3. **Full Feature Support**: Supports all 14 widget field types and TV-optimized layouts
4. **Better Error Messages**: More descriptive validation errors for developers
5. **Future-Proof**: Aligned with current Zabbix 7.2 documentation

## Files Updated

- `zabbix-mcp-server/src/tools/dashboards.js` - Complete schema overhaul

---
*Updated: $(date)*
*Reference: [Zabbix Dashboard Object Documentation](https://www.zabbix.com/documentation/current/en/manual/api/reference/dashboard/object)* 