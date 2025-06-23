# 🚀 Scripts Directory

This directory contains utility scripts for running the Zabbix MCP Server.

## 📜 Available Scripts

### Unix/Linux/macOS Scripts

- **[start-stdio.sh](./start-stdio.sh)** - Start server in stdio mode (Unix/Linux/macOS)
- **[start-http.sh](./start-http.sh)** - Start server in HTTP mode (Unix/Linux/macOS)

### Windows Scripts

- **[start-stdio.ps1](./start-stdio.ps1)** - Start server in stdio mode (Windows PowerShell)
- **[start-http.ps1](./start-http.ps1)** - Start server in HTTP mode (Windows PowerShell)

### Documentation & Setup Scripts

- **[generate-docs.js](./generate-docs.js)** - Generate API documentation
- **[extract-tools-direct.js](./extract-tools-direct.js)** - Extract tool definitions from source
- **[setup-all.js](./setup-all.js)** - Master setup script for project enhancements
- **[monitoring-setup.js](./monitoring-setup.js)** - Setup monitoring and observability
- **[security-setup.js](./security-setup.js)** - Setup security enhancements
- **[setup-testing.js](./setup-testing.js)** - Setup testing framework
- **[setup-docker.js](./setup-docker.js)** - Setup Docker configuration

## 🎯 Usage

### For Unix/Linux/macOS:
```bash
# Make scripts executable
chmod +x scripts/*.sh

# Start in stdio mode
./scripts/start-stdio.sh

# Start in HTTP mode
./scripts/start-http.sh
```

### For Windows:
```powershell
# Start in stdio mode
.\scripts\start-stdio.ps1

# Start in HTTP mode
.\scripts\start-http.ps1
```

### Documentation Generation:
```bash
# Extract tools from source
npm run docs:extract

# Generate documentation
npm run docs:generate

# Generate all documentation
npm run docs:all
```

## 📋 Script Details

### stdio Mode
- **Purpose**: Direct communication via standard input/output
- **Use Case**: Integration with MCP clients that support stdio transport
- **Port**: Not applicable (uses stdin/stdout)

### HTTP Mode
- **Purpose**: HTTP server for REST API access
- **Use Case**: Web applications, testing, and HTTP-based integrations
- **Port**: 3000 (configurable via environment variables)

## ⚙️ Configuration

All scripts respect environment variables:
- `ZABBIX_URL` - Your Zabbix server API endpoint
- `ZABBIX_USERNAME` - Your Zabbix username
- `ZABBIX_PASSWORD` - Your Zabbix password
- `MCP_TRANSPORT_MODE` - Transport mode (stdio/http)
- `MCP_HTTP_PORT` - HTTP server port (HTTP mode only)
- `NODE_ENV` - Environment (development/production)
- `LOG_LEVEL` - Logging level (error/warn/info/debug)

## 🔧 Customization

You can modify these scripts to:
- Change default ports and hosts
- Add additional environment variables
- Include custom startup logic
- Add logging configurations
- Configure Zabbix connection parameters

## 🚀 Available Tool Categories

The Zabbix MCP Server provides 90+ tools across 19 categories:
- 🔐 Authentication & Core (3 tools)
- 🖥️ Host Management (3 tools)
- 👥 Host Groups (4 tools)
- 📊 Items Management (5 tools)
- ⚠️ Triggers Management (4 tools)
- 🚨 Problems Management (2 tools)
- 📈 History Tools (3 tools)
- 🔧 Maintenance Tools (4 tools)
- 👤 User Management (6 tools)
- 📋 Template Management (6 tools)
- 🔧 Scripts Management (6 tools)
- 🔍 Discovery Tools (6 tools)
- 📢 Media & Notifications (7 tools)
- ⚡ Actions & Escalations (6 tools)
- 🗺️ Maps Management (12 tools)
- 📊 Dashboard Management (4 tools)
- 🌐 Proxy Management (4 tools)
- 🔄 Configuration Management (3 tools)
- 🏢 Business Services (5 tools)

---

**Built with ❤️ for infrastructure monitoring teams** 