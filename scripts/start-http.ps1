#!/usr/bin/env pwsh

# PowerShell script to start the Zabbix MCP Server in HTTP mode
# This handles Windows environment variable setting properly

$env:MCP_TRANSPORT_MODE = "http"
Write-Host "Starting Zabbix MCP Server in HTTP mode..."
Write-Host "Environment: MCP_TRANSPORT_MODE=$env:MCP_TRANSPORT_MODE"
Write-Host "Server will be available at: http://localhost:3000"
Write-Host "Health check: http://localhost:3000/health"
Write-Host ""

node src/index.js 