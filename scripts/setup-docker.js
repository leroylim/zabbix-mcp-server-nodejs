/**
 * UpGuard CyberRisk MCP Server - Docker Setup Script
 * 
 * This script sets up Docker configuration for GitHub Container Registry
 * 
 * Copyright (c) 2024 Han Yong Lim
 * Licensed under MIT License
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { logger } = require('../src/utils/logger');

/**
 * Create environment variables template
 */
function createEnvTemplate() {
  const envTemplate = `# UpGuard CyberRisk MCP Server Environment Variables

# UpGuard API Configuration
UPGUARD_API_KEY=your_upguard_api_key_here
UPGUARD_API_BASE_URL=https://cyber-risk.upguard.com/api/public

# MCP Server Configuration
MCP_TRANSPORT_MODE=stdio
MCP_HTTP_PORT=3000
MCP_HTTP_HOST=localhost
MCP_SESSION_MANAGEMENT=true

# Logging Configuration
LOG_LEVEL=info
LOG_FILE=logs/app.log

# GitHub Container Registry (for Docker)
GITHUB_TOKEN=your_github_personal_access_token_here
GITHUB_USERNAME=your_github_username
GITHUB_REPOSITORY=your_username/upguard-cyberrisk-mcp-server

# Docker Configuration
DOCKER_REGISTRY=ghcr.io
DOCKER_IMAGE_NAME=upguard-cyberrisk-mcp-server
DOCKER_IMAGE_TAG=latest

# Security Configuration
API_RATE_LIMIT=100
API_RATE_WINDOW=900000

# Monitoring Configuration
PROMETHEUS_PORT=9090
GRAFANA_PORT=3001`;

  const envPath = path.join(__dirname, '../.env.example');
  fs.writeFileSync(envPath, envTemplate);
  logger.info('Environment template created');
}

/**
 * Create Docker scripts for GitHub Container Registry
 */
function createDockerScripts() {
  // Docker build and push script
  const dockerBuildScript = `#!/bin/bash
# Docker Build and Push Script for GitHub Container Registry

set -e

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Set default values if not provided
GITHUB_USERNAME=\${GITHUB_USERNAME:-"your_username"}
DOCKER_REGISTRY=\${DOCKER_REGISTRY:-"ghcr.io"}
DOCKER_IMAGE_NAME=\${DOCKER_IMAGE_NAME:-"upguard-cyberrisk-mcp-server"}
DOCKER_IMAGE_TAG=\${DOCKER_IMAGE_TAG:-"latest"}

# Full image name
FULL_IMAGE_NAME="\${DOCKER_REGISTRY}/\${GITHUB_USERNAME}/\${DOCKER_IMAGE_NAME}:\${DOCKER_IMAGE_TAG}"

echo "🐳 Building Docker image: \${FULL_IMAGE_NAME}"

# Build the Docker image
docker build -t "\${FULL_IMAGE_NAME}" .

echo "✅ Docker image built successfully"

# Check if GITHUB_TOKEN is set
if [ -z "\${GITHUB_TOKEN}" ]; then
  echo "⚠️  GITHUB_TOKEN not set. Please set it to push to GitHub Container Registry."
  echo "   You can set it in your .env file or as an environment variable."
  exit 1
fi

echo "🔐 Logging in to GitHub Container Registry..."

# Login to GitHub Container Registry
echo "\${GITHUB_TOKEN}" | docker login ghcr.io -u "\${GITHUB_USERNAME}" --password-stdin

echo "📤 Pushing Docker image to GitHub Container Registry..."

# Push the image
docker push "\${FULL_IMAGE_NAME}"

echo "🎉 Docker image pushed successfully to \${FULL_IMAGE_NAME}"
`;

  const dockerScriptPath = path.join(__dirname, '../docker-build-push.sh');
  fs.writeFileSync(dockerScriptPath, dockerBuildScript);
  fs.chmodSync(dockerScriptPath, '755');

  // PowerShell version for Windows
  const dockerBuildScriptPS = `# Docker Build and Push Script for GitHub Container Registry (PowerShell)

# Load environment variables from .env file
if (Test-Path .env) {
    Get-Content .env | ForEach-Object {
        if ($_ -match '^([^#][^=]+)=(.*)$') {
            [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
        }
    }
}

# Set default values if not provided
$GITHUB_USERNAME = if ($env:GITHUB_USERNAME) { $env:GITHUB_USERNAME } else { "your_username" }
$DOCKER_REGISTRY = if ($env:DOCKER_REGISTRY) { $env:DOCKER_REGISTRY } else { "ghcr.io" }
$DOCKER_IMAGE_NAME = if ($env:DOCKER_IMAGE_NAME) { $env:DOCKER_IMAGE_NAME } else { "upguard-cyberrisk-mcp-server" }
$DOCKER_IMAGE_TAG = if ($env:DOCKER_IMAGE_TAG) { $env:DOCKER_IMAGE_TAG } else { "latest" }

# Full image name
$FULL_IMAGE_NAME = "$DOCKER_REGISTRY/$GITHUB_USERNAME/$DOCKER_IMAGE_NAME:$DOCKER_IMAGE_TAG"

Write-Host "🐳 Building Docker image: $FULL_IMAGE_NAME" -ForegroundColor Blue

# Build the Docker image
docker build -t $FULL_IMAGE_NAME .

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker build failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Docker image built successfully" -ForegroundColor Green

# Check if GITHUB_TOKEN is set
if (-not $env:GITHUB_TOKEN) {
    Write-Host "⚠️  GITHUB_TOKEN not set. Please set it to push to GitHub Container Registry." -ForegroundColor Yellow
    Write-Host "   You can set it in your .env file or as an environment variable." -ForegroundColor Yellow
    exit 1
}

Write-Host "🔐 Logging in to GitHub Container Registry..." -ForegroundColor Blue

# Login to GitHub Container Registry
$env:GITHUB_TOKEN | docker login ghcr.io -u $GITHUB_USERNAME --password-stdin

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker login failed" -ForegroundColor Red
    exit 1
}

Write-Host "📤 Pushing Docker image to GitHub Container Registry..." -ForegroundColor Blue

# Push the image
docker push $FULL_IMAGE_NAME

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker push failed" -ForegroundColor Red
    exit 1
}

Write-Host "🎉 Docker image pushed successfully to $FULL_IMAGE_NAME" -ForegroundColor Green
`;

  const dockerScriptPSPath = path.join(__dirname, '../docker-build-push.ps1');
  fs.writeFileSync(dockerScriptPSPath, dockerBuildScriptPS);

  logger.info('Docker scripts created');
}

/**
 * Create GitHub Actions workflow for Docker
 */
function createDockerWorkflow() {
  const dockerWorkflow = `name: Build and Push Docker Image

on:
  push:
    branches: [ main, develop ]
    tags: [ 'v*' ]
  pull_request:
    branches: [ main ]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: \${{ github.repository }}

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
    - name: Checkout repository
      uses: actions/checkout@v4

    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v3

    - name: Log in to Container Registry
      uses: docker/login-action@v3
      with:
        registry: \${{ env.REGISTRY }}
        username: \${{ github.actor }}
        password: \${{ secrets.GITHUB_TOKEN }}

    - name: Extract metadata
      id: meta
      uses: docker/metadata-action@v5
      with:
        images: \${{ env.REGISTRY }}/\${{ env.IMAGE_NAME }}
        tags: |
          type=ref,event=branch
          type=ref,event=pr
          type=semver,pattern={{version}}
          type=semver,pattern={{major}}.{{minor}}
          type=raw,value=latest,enable={{is_default_branch}}

    - name: Build and push Docker image
      uses: docker/build-push-action@v5
      with:
        context: .
        platforms: linux/amd64,linux/arm64
        push: true
        tags: \${{ steps.meta.outputs.tags }}
        labels: \${{ steps.meta.outputs.labels }}
        cache-from: type=gha
        cache-to: type=gha,mode=max

    - name: Generate artifact attestation
      uses: actions/attest-build-provenance@v1
      with:
        subject-name: \${{ env.REGISTRY }}/\${{ env.IMAGE_NAME}}
        subject-digest: \${{ steps.build.outputs.digest }}
        push-to-registry: true`;

  const workflowPath = path.join(__dirname, '../.github/workflows/docker.yml');
  fs.mkdirSync(path.dirname(workflowPath), { recursive: true });
  fs.writeFileSync(workflowPath, dockerWorkflow);
  logger.info('Docker workflow created');
}

/**
 * Update package.json with Docker scripts
 */
function updatePackageScripts() {
  const packagePath = path.join(__dirname, '../package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

  // Add Docker scripts
  packageJson.scripts = {
    ...packageJson.scripts,
    'docker:build-ghcr': 'bash docker-build-push.sh',
    'docker:build-ghcr:win': 'powershell -ExecutionPolicy Bypass -File docker-build-push.ps1',
    'docker:login': 'echo $GITHUB_TOKEN | docker login ghcr.io -u $GITHUB_USERNAME --password-stdin',
    'docker:login:win': 'echo $env:GITHUB_TOKEN | docker login ghcr.io -u $env:GITHUB_USERNAME --password-stdin'
  };

  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
  logger.info('Package.json updated with Docker scripts');
}

/**
 * Create Docker setup instructions
 */
function createDockerInstructions() {
  const instructions = `# 🐳 Docker Setup for GitHub Container Registry

## 📋 Prerequisites

1. **GitHub Personal Access Token (PAT)**
   - Go to GitHub → Settings → Developer settings → Personal access tokens
   - Create a token with these scopes:
     - \`write:packages\` (to push packages)
     - \`read:packages\` (to pull packages)
     - \`delete:packages\` (optional)

2. **Docker installed and running**

## 🔧 Setup Instructions

### 1. **Configure Environment Variables**

Create a \`.env\` file (copy from \`.env.example\`):

\`\`\`bash
cp .env.example .env
\`\`\`

Edit \`.env\` and set:
\`\`\`bash
GITHUB_TOKEN=your_personal_access_token_here
GITHUB_USERNAME=your_github_username
GITHUB_REPOSITORY=your_username/upguard-cyberrisk-mcp-server
\`\`\`

### 2. **Local Docker Commands**

#### **Linux/macOS:**
\`\`\`bash
# Build and push to GitHub Container Registry
npm run docker:build-ghcr

# Or manually:
bash docker-build-push.sh
\`\`\`

#### **Windows:**
\`\`\`powershell
# Build and push to GitHub Container Registry
npm run docker:build-ghcr:win

# Or manually:
powershell -ExecutionPolicy Bypass -File docker-build-push.ps1
\`\`\`

### 3. **Manual Docker Commands**

\`\`\`bash
# Login to GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u $GITHUB_USERNAME --password-stdin

# Build the image
docker build -t ghcr.io/$GITHUB_USERNAME/upguard-cyberrisk-mcp-server:latest .

# Push the image
docker push ghcr.io/$GITHUB_USERNAME/upguard-cyberrisk-mcp-server:latest
\`\`\`

### 4. **GitHub Actions (Automatic)**

The Docker workflow (\`.github/workflows/docker.yml\`) automatically:
- Builds and pushes on every push to main/develop
- Creates multi-platform images (amd64, arm64)
- Uses the built-in \`GITHUB_TOKEN\` (no setup needed)

## 🔐 Security Best Practices

### **Local Development:**
- Store PAT in \`.env\` file (never commit this file)
- Use environment variables: \`export GITHUB_TOKEN=your_token\`

### **CI/CD (GitHub Actions):**
- Uses built-in \`GITHUB_TOKEN\` automatically
- No manual token setup required

### **Production:**
- Use GitHub Actions for automated builds
- Enable package visibility settings in GitHub

## 📦 Using the Docker Image

### **Pull and Run:**
\`\`\`bash
# Pull the image
docker pull ghcr.io/your_username/upguard-cyberrisk-mcp-server:latest

# Run the container
docker run -p 3000:3000 --env-file .env ghcr.io/your_username/upguard-cyberrisk-mcp-server:latest
\`\`\`

### **Docker Compose:**
\`\`\`yaml
version: '3.8'
services:
  upguard-mcp:
    image: ghcr.io/your_username/upguard-cyberrisk-mcp-server:latest
    ports:
      - "3000:3000"
    env_file:
      - .env
\`\`\`

## 🚀 Available Scripts

- \`npm run docker:build-ghcr\` - Build and push (Linux/macOS)
- \`npm run docker:build-ghcr:win\` - Build and push (Windows)
- \`npm run docker:login\` - Login to GHCR (Linux/macOS)
- \`npm run docker:login:win\` - Login to GHCR (Windows)

## 🔍 Troubleshooting

### **Authentication Issues:**
\`\`\`bash
# Check if token is set
echo $GITHUB_TOKEN

# Test login
echo $GITHUB_TOKEN | docker login ghcr.io -u $GITHUB_USERNAME --password-stdin
\`\`\`

### **Permission Issues:**
- Ensure PAT has \`write:packages\` scope
- Check repository visibility settings
- Verify username is correct

### **Build Issues:**
- Ensure Docker is running
- Check Dockerfile syntax
- Verify all dependencies are available
\`\`\`

## 📚 Additional Resources

- [GitHub Container Registry Documentation](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [Docker Documentation](https://docs.docker.com/)
- [GitHub Actions Docker Guide](https://docs.github.com/en/actions/publishing-packages/publishing-docker-images)
`;

  const instructionsPath = path.join(__dirname, '../DOCKER_SETUP.md');
  fs.writeFileSync(instructionsPath, instructions);
  logger.info('Docker setup instructions created');
}

/**
 * Main setup function
 */
async function main() {
  try {
    logger.info('Setting up Docker configuration for GitHub Container Registry...');
    
    createEnvTemplate();
    createDockerScripts();
    createDockerWorkflow();
    updatePackageScripts();
    createDockerInstructions();
    
    console.log('\n🐳 Docker Setup Complete!');
    console.log('\n📋 Created Components:');
    console.log('   📄 Environment template (.env.example)');
    console.log('   🔧 Docker build scripts (docker-build-push.sh/.ps1)');
    console.log('   🤖 GitHub Actions workflow (.github/workflows/docker.yml)');
    console.log('   📚 Setup instructions (DOCKER_SETUP.md)');
    console.log('\n🚀 Next Steps:');
    console.log('   1. Copy .env.example to .env');
    console.log('   2. Set your GITHUB_TOKEN in .env file');
    console.log('   3. Set your GITHUB_USERNAME in .env file');
    console.log('   4. Run: npm run docker:build-ghcr');
    console.log('\n📚 Read DOCKER_SETUP.md for detailed instructions');
    
  } catch (error) {
    logger.error('Docker setup failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { 
  createEnvTemplate, 
  createDockerScripts, 
  createDockerWorkflow, 
  updatePackageScripts, 
  createDockerInstructions 
}; 