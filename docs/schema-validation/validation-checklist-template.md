# Schema Validation Checklist Template

## Module: [MODULE_NAME]

### **📋 Pre-Validation Information**
- **Tool File**: `src/tools/[module].js`
- **API Module**: `src/api/[module].js`
- **Official API Reference**: [Link to Zabbix Documentation]
- **Validation Date**: [Date]
- **Validator**: [Name]

### **🔍 Validation Checklist**

#### **1. Schema Completeness**
- [ ] All official API properties included
- [ ] No extra properties that don't exist in official API
- [ ] All object sub-properties correctly structured
- [ ] All array element schemas properly defined

#### **2. Type Accuracy**
- [ ] String properties use `z.string()`
- [ ] Number properties use `z.number().int()` or `z.number()`
- [ ] Boolean properties use `z.boolean()`
- [ ] Enum properties use correct enumeration values
- [ ] Array properties use `z.array()` with proper element schemas
- [ ] Object properties use `z.object()` with nested schemas

#### **3. Constraint Validation**
- [ ] String min/max lengths match API specification
- [ ] Number min/max values match API specification
- [ ] Enum values include all valid options from API
- [ ] Required vs optional fields correctly specified
- [ ] Default values match API defaults where specified

#### **4. Description Alignment**
- [ ] All property descriptions match official documentation
- [ ] Enum value descriptions are accurate and complete
- [ ] Complex object descriptions explain purpose and usage
- [ ] Cross-references to related objects are included

#### **5. Advanced Validation**
- [ ] Nested object schemas fully implemented
- [ ] Array element validation properly configured
- [ ] Conditional properties handled correctly
- [ ] Version-specific properties noted if applicable

### **📊 Validation Results**

#### **Issues Found:**
| **Severity** | **Property** | **Issue** | **Action Required** |
|--------------|--------------|-----------|-------------------|
| 🔴 Critical | [property] | [description] | [fix needed] |
| 🟡 Minor | [property] | [description] | [fix needed] |
| 🟢 Enhancement | [property] | [description] | [improvement] |

#### **Changes Applied:**
1. **[Property Name]**: [Description of change]
2. **[Property Name]**: [Description of change]

### **🧪 Testing**
- [ ] Schema validation tests pass
- [ ] Tool registration succeeds without errors
- [ ] Example API calls work with new schema
- [ ] No breaking changes to existing functionality

### **✅ Completion Status**
- [ ] All critical issues resolved
- [ ] All minor issues resolved
- [ ] Documentation updated
- [ ] Tests passing
- [ ] Ready for production

### **📝 Notes**
[Any additional notes, considerations, or future improvements]

---

**Validation Completed**: [Date]  
**Next Review**: [When to re-validate] 