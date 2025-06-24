# 🔐 Zabbix MCP Server Authentication Guide

## **Overview**

The Zabbix MCP Server supports **two authentication methods** for connecting to Zabbix API with a **clean, modern interface** that automatically detects and uses the best authentication method available.

## **🔑 Authentication Methods**

### **Method 1: API Token Authentication (Recommended)**
- **Used by**: Zabbix 5.4+ (recommended for production)
- **Security**: Direct API token authentication (more secure)
- **Implementation**: ✅ **Fully implemented** with automatic detection

### **Method 2: Username/Password Authentication (Traditional)**
- **Used by**: Zabbix 5.0+ (all versions)
- **Security**: Session-based authentication with automatic token management
- **Implementation**: ✅ **Fully implemented** with automatic login/logout

---

## **📋 Current Implementation Status**

### **✅ What's Fully Supported**

**API Token Authentication (Recommended):**
```javascript
// Environment Variables:
ZABBIX_API_URL=https://your-zabbix-server/api_jsonrpc.php
ZABBIX_API_TOKEN=your_api_token_here
```

**Username/Password Authentication:**
```javascript
// Environment Variables:
ZABBIX_API_URL=https://your-zabbix-server/api_jsonrpc.php
ZABBIX_USERNAME=Admin
ZABBIX_PASSWORD=your_password
```

**Implementation Details:**
- **Unified Client**: `src/api/zabbix-client.js` (single, clean interface)
- **Automatic Detection**: Automatically chooses API token when available
- **Clean Interface**: 5 modern methods only (no legacy baggage)
- **Smart Fallback**: Falls back to username/password if token not available

---

## **🔧 Modern Authentication Architecture**

### **Unified Client Implementation**

The MCP server uses a **single, clean authentication system**:

#### **Smart Authentication Detection**
```javascript
// Automatic authentication method detection
function detectAuthMethod() {
    const hasToken = !!process.env.ZABBIX_API_TOKEN;
    const hasCredentials = !!(process.env.ZABBIX_USERNAME && process.env.ZABBIX_PASSWORD);
    
    if (hasToken) {
        logger.info('[Config] Using API token authentication (Zabbix 5.4+)');
        return 'token';
    } else if (hasCredentials) {
        logger.info('[Config] Using username/password authentication');
        return 'password';
    } else {
        logger.warn('[Config] No authentication method configured');
        return 'none';
    }
}
```

#### **Clean Modern Interface**
```javascript
// Available methods (no legacy methods)
const { 
    getClient,        // Get authenticated client instance
    request,          // Make API calls
    checkConnection,  // Check connection status
    disconnect,       // Disconnect and cleanup
    getVersion        // Get API version
} = require('./src/api/zabbix-client');
```

---

## **🚀 How to Configure Authentication**

### **Option 1: API Token Authentication (Recommended)**

#### **Step 1: Generate API Token in Zabbix**
1. **Login to Zabbix UI**
2. **Navigate to**: `Administration → General → Tokens`
3. **Click**: `Create token`
4. **Configure**:
   - Name: `MCP Server Token`
   - User: Select appropriate user
   - Expires at: Set expiration (optional)
5. **Copy the generated token**

#### **Step 2: Set Environment Variables**
```bash
# Windows PowerShell
$env:ZABBIX_API_URL="https://your-zabbix-server/api_jsonrpc.php"
$env:ZABBIX_API_TOKEN="your_api_token_here"

# Linux/macOS
export ZABBIX_API_URL="https://your-zabbix-server/api_jsonrpc.php"
export ZABBIX_API_TOKEN="your_api_token_here"
```

#### **Step 3: Create `.env` file**
```env
ZABBIX_API_URL=https://your-zabbix-server/api_jsonrpc.php
ZABBIX_API_TOKEN=your_api_token_here
```

### **Option 2: Username/Password Authentication**

```bash
# Windows PowerShell
$env:ZABBIX_API_URL="https://your-zabbix-server/api_jsonrpc.php"
$env:ZABBIX_USERNAME="Admin"
$env:ZABBIX_PASSWORD="your_password"

# Linux/macOS
export ZABBIX_API_URL="https://your-zabbix-server/api_jsonrpc.php"
export ZABBIX_USERNAME="Admin"
export ZABBIX_PASSWORD="your_password"
```

**Or create `.env` file:**
```env
ZABBIX_API_URL=https://your-zabbix-server/api_jsonrpc.php
ZABBIX_USERNAME=Admin
ZABBIX_PASSWORD=your_password
```

---

## **🔍 Testing Authentication**

### **Test Authentication Setup**
```bash
# Test authentication configuration
node test-auth-modernization.js
```

**Expected Output:**
```
✅ Configuration supports both auth methods
✅ Unified client with backward compatibility  
✅ All enhanced API functions available
✅ MCP tools integration working
✅ Authentication method simulation working
```

### **Test Clean Interface**
```bash
# Test clean interface (no legacy methods)
node test-clean-interface.js
```

**Expected Output:**
```
✅ All legacy methods removed successfully
✅ Only modern interface methods available
✅ All enhanced API functions working
✅ Interface consistency verified
```

### **Manual Testing**
```javascript
// Test API connection
const { checkConnection, getVersion } = require('./src/api/zabbix-client');

(async () => {
    const connected = await checkConnection();
    console.log(`Connected: ${connected}`);
    
    if (connected) {
        const version = await getVersion();
        console.log(`Zabbix API Version: ${version}`);
    }
})();
```

---

## **📊 Authentication Method Comparison**

| Feature | Username/Password | API Token |
|---------|------------------|-----------|
| **Zabbix Version** | 5.0+ | 5.4+ |
| **Security** | Session-based | Direct token |
| **Setup Complexity** | Simple | Requires token generation |
| **Expiration** | Auto-managed | Manual/long-lived |
| **Revocation** | Logout required | Instant revocation |
| **Audit Trail** | Session logs | Token usage logs |
| **MCP Server Support** | ✅ Fully implemented | ✅ Fully implemented |
| **Recommended For** | Development/Testing | Production |
| **Performance** | Login overhead | Direct access |

---

## **🎯 Best Practices**

### **For Production Deployment**
1. **Use API token authentication** for better security
2. **Create dedicated service account** with minimal permissions
3. **Set token expiration** appropriately (30-90 days)
4. **Monitor token usage** in Zabbix audit logs
5. **Implement token rotation** strategy
6. **Enable HTTPS** for API endpoint

### **For Development/Testing**
1. **Username/password is fine** for development
2. **Use non-admin accounts** when possible
3. **Test both authentication methods** during development
4. **Use environment variables** instead of hardcoded credentials

### **Security Recommendations**
1. **Never commit credentials** to version control
2. **Use `.env` files** for local development
3. **Rotate tokens regularly** in production
4. **Monitor authentication failures** in logs
5. **Use RBAC** to limit API permissions

---

## **🔧 Troubleshooting**

### **Common Issues**

#### **"No authentication method configured"**
```
[WARN] [Config] No authentication method configured
```
**Solution**: Set either `ZABBIX_API_TOKEN` or `ZABBIX_USERNAME`+`ZABBIX_PASSWORD`

#### **"Connection failed"**
```
[ERROR] [Zabbix API Client] Failed to connect to Zabbix API
```
**Solutions**:
- Check `ZABBIX_API_URL` is correct
- Verify Zabbix server is accessible
- Check firewall/network connectivity
- Validate SSL certificates

#### **"Authentication failed"**
```
[ERROR] [Zabbix API Client] Authentication failed
```
**Solutions**:
- Verify API token is valid and not expired
- Check username/password are correct
- Ensure user has API access permissions
- Check user account is not disabled

### **Debug Mode**
```bash
# Enable debug logging
LOG_LEVEL=debug node src/index.js
```

---

## **📈 Migration from Legacy System**

If upgrading from an older version:

### **What Changed**
1. ✅ **API Token support added**
2. ✅ **Clean interface implemented** (5 methods only)
3. ✅ **Legacy methods removed** (zabbixRequest, ensureLogin, etc.)
4. ✅ **Automatic authentication detection**
5. ✅ **Unified client architecture**

### **Migration Steps**
1. **Update environment variables** to use new names
2. **Generate API tokens** for production
3. **Test both authentication methods**
4. **Update any custom code** to use new interface
5. **Remove references to legacy methods**

**The system maintains full backward compatibility for authentication while providing modern interface methods.** 