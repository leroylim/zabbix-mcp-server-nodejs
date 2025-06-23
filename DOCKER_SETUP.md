# 🐳 Docker Setup for Zabbix MCP Server

## 📋 Prerequisites

1. **GitHub Personal Access Token (PAT)**
   - Go to GitHub → Settings → Developer settings → Personal access tokens
   - Create a token with these scopes:
     - `write:packages` (to push packages)
     - `read:packages` (to pull packages)
     - `delete:packages` (optional)

2. **Docker installed and running**

3. **Zabbix Server Access**
   - Zabbix server URL with API access
   - Valid Zabbix user credentials with API permissions

## 🔧 Setup Instructions

### 1. **Configure Environment Variables**

Create a `.env` file (copy from `.env.example`):

```bash
cp .env.example .env
```

Edit `.env` and set:
```bash
# GitHub Container Registry
GITHUB_TOKEN=your_personal_access_token_here
GITHUB_USERNAME=your_github_username
GITHUB_REPOSITORY=your_username/zabbix-mcp-server-nodejs

# Zabbix Configuration
ZABBIX_URL=https://your-zabbix-server.com/api_jsonrpc.php
ZABBIX_USERNAME=your_zabbix_username
ZABBIX_PASSWORD=your_zabbix_password

# Optional MCP Configuration
MCP_TRANSPORT_MODE=stdio
MCP_SESSION_MANAGEMENT=false
LOG_LEVEL=info
```

### 2. **Local Docker Commands**

#### **Linux/macOS:**
```bash
# Build and push to GitHub Container Registry
npm run docker:build-ghcr

# Or manually:
bash docker-build-push.sh
```

#### **Windows:**
```powershell
# Build and push to GitHub Container Registry
npm run docker:build-ghcr:win

# Or manually:
powershell -ExecutionPolicy Bypass -File docker-build-push.ps1
```

### 3. **Manual Docker Commands**

```bash
# Login to GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u $GITHUB_USERNAME --password-stdin

# Build the image
docker build -t ghcr.io/$GITHUB_USERNAME/zabbix-mcp-server-nodejs:latest .

# Push the image
docker push ghcr.io/$GITHUB_USERNAME/zabbix-mcp-server-nodejs:latest
```

### 4. **GitHub Actions (Automatic)**

The Docker workflow (`.github/workflows/docker.yml`) automatically:
- Builds and pushes on every push to main/develop
- Creates multi-platform images (amd64, arm64)
- Uses the built-in `GITHUB_TOKEN` (no setup needed)

## 🔐 Security Best Practices

### **Local Development:**
- Store credentials in `.env` file (never commit this file)
- Use environment variables: `export GITHUB_TOKEN=your_token`
- **Zabbix Security**: Use dedicated API user with minimal required permissions

### **CI/CD (GitHub Actions):**
- Uses built-in `GITHUB_TOKEN` automatically
- Store Zabbix credentials in GitHub Secrets for testing

### **Production:**
- Use GitHub Actions for automated builds
- Enable package visibility settings in GitHub
- **Zabbix Production**: Use read-only API user when possible
- Implement proper network security for Zabbix API access

## 📦 Using the Docker Image

### **Pull and Run:**
```bash
# Pull the image
docker pull ghcr.io/your_username/zabbix-mcp-server-nodejs:latest

# Run the container with Zabbix configuration
docker run -p 3000:3000 \
  -e ZABBIX_URL=https://your-zabbix-server.com/api_jsonrpc.php \
  -e ZABBIX_USERNAME=your_username \
  -e ZABBIX_PASSWORD=your_password \
  ghcr.io/your_username/zabbix-mcp-server-nodejs:latest

# Or use env file
docker run -p 3000:3000 --env-file .env \
  ghcr.io/your_username/zabbix-mcp-server-nodejs:latest
```

### **Docker Compose:**
```yaml
version: '3.8'
services:
  zabbix-mcp:
    image: ghcr.io/your_username/zabbix-mcp-server-nodejs:latest
    ports:
      - "3000:3000"
    environment:
      - ZABBIX_URL=https://your-zabbix-server.com/api_jsonrpc.php
      - ZABBIX_USERNAME=your_username
      - ZABBIX_PASSWORD=your_password
      - MCP_TRANSPORT_MODE=http
      - LOG_LEVEL=info
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### **Development with Docker Compose:**
```yaml
version: '3.8'
services:
  zabbix-mcp:
    build: .
    ports:
      - "3000:3000"
    env_file:
      - .env
    volumes:
      - ./src:/app/src
      - ./logs:/app/logs
    restart: unless-stopped
```

## 🚀 Available Scripts

- `npm run docker:build-ghcr` - Build and push (Linux/macOS)
- `npm run docker:build-ghcr:win` - Build and push (Windows)
- `npm run docker:login` - Login to GHCR (Linux/macOS)
- `npm run docker:login:win` - Login to GHCR (Windows)
- `npm run docker:build` - Build local image
- `npm run docker:run` - Run local container
- `npm run docker:dev` - Development mode with Docker Compose
- `npm run docker:prod` - Production mode with Docker Compose

## 🔍 Troubleshooting

### **Authentication Issues:**
```bash
# Check if GitHub token is set
echo $GITHUB_TOKEN

# Test GitHub login
echo $GITHUB_TOKEN | docker login ghcr.io -u $GITHUB_USERNAME --password-stdin

# Test Zabbix connection
curl -X POST https://your-zabbix-server.com/api_jsonrpc.php \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"apiinfo.version","id":1}'
```

### **Permission Issues:**
- Ensure PAT has `write:packages` scope
- Check repository visibility settings
- Verify username is correct
- **Zabbix**: Ensure API user has required permissions

### **Build Issues:**
- Ensure Docker is running
- Check Dockerfile syntax
- Verify all dependencies are available
- **Zabbix**: Validate environment variables are set correctly

### **Runtime Issues:**
```bash
# Check container logs
docker logs <container_name>

# Test Zabbix connectivity from container
docker exec -it <container_name> curl -X POST $ZABBIX_URL \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"apiinfo.version","id":1}'

# Check MCP server health
curl http://localhost:3000/health
```

## 🌐 Zabbix Integration

### **Required Zabbix Permissions:**
The API user needs permissions for:
- Host management (read/write)
- Item and trigger management
- Problem acknowledgment
- User management (if using user tools)
- Template management
- Script execution (if using script tools)

### **Zabbix Version Compatibility:**
- Zabbix 5.0+ (recommended)
- Zabbix 6.0+ (full feature support)
- API version 2.0 (JSON-RPC)

### **Network Configuration:**
- Ensure Docker container can reach Zabbix server
- Configure firewall rules if necessary
- Use HTTPS for production deployments

## 📚 Additional Resources

- [Zabbix API Documentation](https://www.zabbix.com/documentation/current/en/manual/api)
- [GitHub Container Registry Documentation](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [Docker Documentation](https://docs.docker.com/)
- [GitHub Actions Docker Guide](https://docs.github.com/en/actions/publishing-packages/publishing-docker-images)
- [MCP Protocol Specification](https://modelcontextprotocol.io/)

## 🎯 Quick Start Example

```bash
# 1. Clone repository
git clone https://github.com/your_username/zabbix-mcp-server-nodejs.git
cd zabbix-mcp-server-nodejs

# 2. Configure environment
cp .env.example .env
# Edit .env with your Zabbix credentials

# 3. Build and run
docker build -t zabbix-mcp-server .
docker run -p 3000:3000 --env-file .env zabbix-mcp-server

# 4. Test connection
curl http://localhost:3000/health
```
