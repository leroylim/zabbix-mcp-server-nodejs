#!/bin/bash

# Shell script to start the Zabbix MCP Server in HTTP mode
# This handles Linux/Unix environment variable setting

export MCP_TRANSPORT_MODE="http"
echo "Starting Zabbix MCP Server in HTTP mode..."
echo "Environment: MCP_TRANSPORT_MODE=$MCP_TRANSPORT_MODE"
echo "Server will be available at: http://localhost:3000"
echo "Health check: http://localhost:3000/health"
echo ""

node src/index.js 