# Docker Build and Push Script for Zabbix MCP Server - GitHub Container Registry (PowerShell)

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
$DOCKER_IMAGE_NAME = if ($env:DOCKER_IMAGE_NAME) { $env:DOCKER_IMAGE_NAME } else { "zabbix-mcp-server-nodejs" }
$DOCKER_IMAGE_TAG = if ($env:DOCKER_IMAGE_TAG) { $env:DOCKER_IMAGE_TAG } else { "latest" }

# Full image name - using proper PowerShell variable syntax
$FULL_IMAGE_NAME = "${DOCKER_REGISTRY}/${GITHUB_USERNAME}/${DOCKER_IMAGE_NAME}:${DOCKER_IMAGE_TAG}"

Write-Host "🚀 Zabbix MCP Server - Docker Build & Push" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "📦 Image: $FULL_IMAGE_NAME" -ForegroundColor Blue
Write-Host "🏗️  Building Docker image..." -ForegroundColor Blue

# Build the Docker image
docker build -t $FULL_IMAGE_NAME .

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker build failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Docker image built successfully" -ForegroundColor Green

# Show image details
Write-Host "📊 Image details:" -ForegroundColor Blue
docker images $FULL_IMAGE_NAME --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"

# Check if GITHUB_TOKEN is set
if (-not $env:GITHUB_TOKEN) {
    Write-Host ""
    Write-Host "⚠️  GITHUB_TOKEN not set. Please set it to push to GitHub Container Registry." -ForegroundColor Yellow
    Write-Host "   You can set it in your .env file or as an environment variable:" -ForegroundColor Yellow
    Write-Host "   `$env:GITHUB_TOKEN = 'your_personal_access_token'" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "🏃 To run locally without pushing:" -ForegroundColor Green
    Write-Host "   docker run -p 3000:3000 --env-file .env $FULL_IMAGE_NAME" -ForegroundColor Green
    exit 1
}

Write-Host ""
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

Write-Host ""
Write-Host "🎉 Zabbix MCP Server Docker image pushed successfully!" -ForegroundColor Green
Write-Host "📍 Image location: $FULL_IMAGE_NAME" -ForegroundColor Blue
Write-Host ""
Write-Host "🚀 To use the image:" -ForegroundColor Cyan
Write-Host "   docker pull $FULL_IMAGE_NAME" -ForegroundColor White
Write-Host "   docker run -p 3000:3000 \\" -ForegroundColor White
Write-Host "     -e ZABBIX_URL=https://your-zabbix-server.com/api_jsonrpc.php \\" -ForegroundColor White
Write-Host "     -e ZABBIX_USERNAME=your_username \\" -ForegroundColor White
Write-Host "     -e ZABBIX_PASSWORD=your_password \\" -ForegroundColor White
Write-Host "     $FULL_IMAGE_NAME" -ForegroundColor White
