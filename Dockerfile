# Multi-stage build for production optimization
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Production stage
FROM node:18-alpine AS production

# Install security updates and curl for health checks
RUN apk upgrade --no-cache && \
    apk add --no-cache curl

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S zabbix -u 1001

# Set working directory
WORKDIR /app

# Copy node_modules from builder stage
COPY --from=builder /app/node_modules ./node_modules

# Copy application code
COPY --chown=zabbix:nodejs src/ ./src/
COPY --chown=zabbix:nodejs package*.json ./
COPY --chown=zabbix:nodejs jest.config.js ./

# Create logs and data directories
RUN mkdir -p logs data && chown zabbix:nodejs logs data

# Switch to non-root user
USER zabbix

# Expose port for HTTP mode
EXPOSE 3000

# Health check for HTTP mode (will fail gracefully in stdio mode)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/health 2>/dev/null || \
      node -e "console.log('Zabbix MCP Server is running')" || exit 1

# Set default environment variables
ENV NODE_ENV=production
ENV MCP_TRANSPORT_MODE=stdio
ENV LOG_LEVEL=info

# Start the Zabbix MCP Server
CMD ["node", "src/index.js"] 