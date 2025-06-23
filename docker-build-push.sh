#!/bin/bash
# Docker Build and Push Script for Zabbix MCP Server - GitHub Container Registry

set -e

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Set default values if not provided
GITHUB_USERNAME=${GITHUB_USERNAME:-"your_username"}
DOCKER_REGISTRY=${DOCKER_REGISTRY:-"ghcr.io"}
DOCKER_IMAGE_NAME=${DOCKER_IMAGE_NAME:-"zabbix-mcp-server-nodejs"}
DOCKER_IMAGE_TAG=${DOCKER_IMAGE_TAG:-"latest"}

# Full image name
FULL_IMAGE_NAME="${DOCKER_REGISTRY}/${GITHUB_USERNAME}/${DOCKER_IMAGE_NAME}:${DOCKER_IMAGE_TAG}"

echo "🚀 Zabbix MCP Server - Docker Build & Push"
echo "============================================"
echo "📦 Image: ${FULL_IMAGE_NAME}"
echo "🏗️  Building Docker image..."

# Build the Docker image
docker build -t "${FULL_IMAGE_NAME}" .

echo "✅ Docker image built successfully"
echo "📊 Image details:"
docker images "${FULL_IMAGE_NAME}" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"

# Check if GITHUB_TOKEN is set
if [ -z "${GITHUB_TOKEN}" ]; then
  echo ""
  echo "⚠️  GITHUB_TOKEN not set. Please set it to push to GitHub Container Registry."
  echo "   You can set it in your .env file or as an environment variable:"
  echo "   export GITHUB_TOKEN=your_personal_access_token"
  echo ""
  echo "🏃 To run locally without pushing:"
  echo "   docker run -p 3000:3000 --env-file .env ${FULL_IMAGE_NAME}"
  exit 1
fi

echo ""
echo "🔐 Logging in to GitHub Container Registry..."

# Login to GitHub Container Registry
echo "${GITHUB_TOKEN}" | docker login ghcr.io -u "${GITHUB_USERNAME}" --password-stdin

echo "📤 Pushing Docker image to GitHub Container Registry..."

# Push the image
docker push "${FULL_IMAGE_NAME}"

echo ""
echo "🎉 Zabbix MCP Server Docker image pushed successfully!"
echo "📍 Image location: ${FULL_IMAGE_NAME}"
echo ""
echo "🚀 To use the image:"
echo "   docker pull ${FULL_IMAGE_NAME}"
echo "   docker run -p 3000:3000 \\"
echo "     -e ZABBIX_URL=https://your-zabbix-server.com/api_jsonrpc.php \\"
echo "     -e ZABBIX_USERNAME=your_username \\"
echo "     -e ZABBIX_PASSWORD=your_password \\"
echo "     ${FULL_IMAGE_NAME}"
