/**
 * Zabbix MCP Server
 * 
 * Copyright (c) 2024 Han Yong Lim
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { StreamableHTTPServerTransport } = require('@modelcontextprotocol/sdk/server/streamableHttp.js');
const { isInitializeRequest } = require('@modelcontextprotocol/sdk/types.js');
const { randomUUID } = require('crypto');
const express = require('express');
const { z } = require('zod');
const { registerAllTools } = require('./tools');
const schemas = require('./tools/schemas');
const { logger } = require('./utils/logger');
const config = require('./config');

// Create server instance based on transport mode
async function createServer() {
    const serverInstance = new McpServer({
        name: 'zabbix_mcp_server',
        version: '1.7.0',
        description: 'MCP server for interacting with the Zabbix API, providing comprehensive monitoring and management capabilities.'
    });

    // Register all tools
    await registerAllTools(serverInstance);

    // Example prompts for common operations
    serverInstance.prompt(
        'zabbix_get_host_status',
        {
            hostIdentifiers: z.array(z.string()).optional()
                .describe('Array of host identifiers (names, IPs, or IDs) to check status for.'),
            include_problems: z.boolean().optional().default(true)
                .describe('Include current problems for the hosts.')
        },
        (args) => ({
            messages: [{ 
                role: 'user', 
                content: { 
                    type: 'text', 
                    text: `Please show me the status of ${args.hostIdentifiers ? `hosts: ${args.hostIdentifiers.join(', ')}` : 'all hosts'}${args.include_problems ? ' including current problems' : ''} using 'zabbix_host_get' and 'zabbix_get_problems'.`
                } 
            }]
        })
    );

    serverInstance.prompt(
        'zabbix_monitor_new_host',
        {
            hostname: z.string().describe('Technical name for the new host.'),
            visibleName: z.string().optional().describe('Visible name for the host.'),
            ipAddress: z.string().ip().describe('IP address of the host.'),
            hostGroups: z.array(z.string()).describe('Host group names to assign the host to.'),
            templates: z.array(z.string()).optional().describe('Template names to link to the host.')
        },
        (args) => ({
            messages: [{ 
                role: 'user', 
                content: { 
                    type: 'text', 
                    text: `Please add a new host ${args.hostname} with IP ${args.ipAddress} to groups: ${args.hostGroups.join(', ')}${args.templates ? ` and link templates: ${args.templates.join(', ')}` : ''} using 'zabbix_host_create'.`
                } 
            }]
        })
    );

    // Problem investigation prompt
    serverInstance.prompt(
        'zabbix_investigate_problems',
        {
            severity: z.enum(['not_classified', 'information', 'warning', 'average', 'high', 'disaster']).optional(),
            hostIdentifiers: z.array(z.string()).optional(),
            timeRange: z.string().optional().describe('Time range for problems (e.g., "1h", "24h", "7d")')
        },
        (args) => ({
            messages: [
                {
                    role: 'user',
                    content: {
                        type: 'text',
                        text: `Please investigate current problems${args.severity ? ` with severity ${args.severity} or higher` : ''}${args.hostIdentifiers ? ` for hosts: ${args.hostIdentifiers.join(', ')}` : ''}:
1. Get current problems using 'zabbix_get_problems'
2. Get affected hosts using 'zabbix_host_get'
3. Get recent events using 'zabbix_get_events'
4. Summarize the findings and suggest actions`
                    }
                }
            ]
        })
    );

    // Maintenance management prompt
    serverInstance.prompt(
        'zabbix_schedule_maintenance',
        {
            hostIdentifiers: z.array(z.string()).describe('Hosts to put in maintenance.'),
            duration: z.string().describe('Duration of maintenance (e.g., "2h", "1d").'),
            description: z.string().describe('Description of the maintenance.'),
            maintenanceType: z.enum(['with_data_collection', 'without_data_collection']).optional().default('with_data_collection')
        },
        (args) => ({
            messages: [
                {
                    role: 'user',
                    content: {
                        type: 'text',
                        text: `Please schedule maintenance for hosts: ${args.hostIdentifiers.join(', ')} for ${args.duration} (${args.description}) using 'zabbix_create_maintenance'.`
                    }
                }
            ]
        })
    );

    // Performance monitoring prompt
    serverInstance.prompt(
        'zabbix_monitor_performance',
        {
            hostIdentifiers: z.array(z.string()).describe('Hosts to monitor performance for.'),
            metrics: z.array(z.string()).optional().describe('Specific metrics to check (e.g., CPU, memory, disk).'),
            timeRange: z.string().optional().default('1h').describe('Time range for historical data.')
        },
        (args) => ({
            messages: [
                {
                    role: 'user',
                    content: {
                        type: 'text',
                        text: `Please analyze performance for hosts: ${args.hostIdentifiers.join(', ')}:
1. Get host details using 'zabbix_host_get'
2. Get items for performance metrics using 'zabbix_get_items'
3. Get latest data using 'zabbix_get_latest_data'
4. ${args.timeRange ? `Get historical trends for ${args.timeRange} using 'zabbix_get_trends'` : ''}
5. Summarize performance status and identify any issues`
                    }
                }
            ]
        })
    );

    // Configuration backup prompt
    serverInstance.prompt(
        'zabbix_backup_configuration',
        {
            exportType: z.enum(['hosts', 'templates', 'host_groups', 'triggers', 'items']).describe('Type of configuration to export.'),
            includeIds: z.array(z.string()).optional().describe('Specific IDs to export (if not provided, exports all).')
        },
        (args) => ({
            messages: [
                {
                    role: 'user',
                    content: {
                        type: 'text',
                        text: `Please export ${args.exportType} configuration${args.includeIds ? ` for IDs: ${args.includeIds.join(', ')}` : ' (all)'} using 'zabbix_export_configuration'.`
                    }
                }
            ]
        })
    );

    return serverInstance;
}

// HTTP Transport Implementation
let httpServer = null;

async function startHttpServer() {
    const app = express();
    app.use(express.json());

    // Store transports by session ID for session management
    const transports = {};

    if (config.transport.http.sessionManagement) {
        // With Session Management
        app.post('/mcp', async (req, res) => {
            try {
                const sessionId = req.headers['mcp-session-id'];
                let transport;

                if (sessionId && transports[sessionId]) {
                    // Reuse existing transport
                    transport = transports[sessionId];
                } else if (!sessionId && isInitializeRequest(req.body)) {
                    // New initialization request
                    const serverInstance = await createServer();
                    
                    transport = new StreamableHTTPServerTransport({
                        sessionIdGenerator: () => randomUUID(),
                        onsessioninitialized: (sessionId) => {
                            transports[sessionId] = transport;
                            logger.info(`New HTTP session initialized: ${sessionId}`);
                        }
                    });

                    // Clean up transport when closed
                    transport.onclose = () => {
                        if (transport.sessionId) {
                            logger.info(`HTTP session closed: ${transport.sessionId}`);
                            delete transports[transport.sessionId];
                        }
                    };

                    await serverInstance.connect(transport);
                } else {
                    res.status(400).json({
                        jsonrpc: '2.0',
                        error: {
                            code: -32000,
                            message: 'Bad Request: No valid session ID provided'
                        },
                        id: null
                    });
                    return;
                }

                await transport.handleRequest(req, res, req.body);
            } catch (error) {
                logger.error('Error handling HTTP MCP request:', error);
                if (!res.headersSent) {
                    res.status(500).json({
                        jsonrpc: '2.0',
                        error: {
                            code: -32603,
                            message: 'Internal server error'
                        },
                        id: null
                    });
                }
            }
        });

        // Handle GET and DELETE requests for session management
        const handleSessionRequest = async (req, res) => {
            const sessionId = req.headers['mcp-session-id'];
            if (!sessionId || !transports[sessionId]) {
                res.status(400).send('Invalid or missing session ID');
                return;
            }
            
            const transport = transports[sessionId];
            await transport.handleRequest(req, res);
        };

        app.get('/mcp', handleSessionRequest);
        app.delete('/mcp', handleSessionRequest);
    } else {
        // Stateless mode - new server instance for each request
        app.post('/mcp', async (req, res) => {
            try {
                const serverInstance = await createServer();
                const transport = new StreamableHTTPServerTransport({
                    sessionIdGenerator: undefined
                });

                res.on('close', () => {
                    logger.info('HTTP request closed');
                    transport.close();
                    serverInstance.close();
                });

                await serverInstance.connect(transport);
                await transport.handleRequest(req, res, req.body);
            } catch (error) {
                logger.error('Error handling HTTP MCP request:', error);
                if (!res.headersSent) {
                    res.status(500).json({
                        jsonrpc: '2.0',
                        error: {
                            code: -32603,
                            message: 'Internal server error'
                        },
                        id: null
                    });
                }
            }
        });

        app.get('/mcp', (req, res) => {
            res.writeHead(405).end(JSON.stringify({
                jsonrpc: '2.0',
                error: {
                    code: -32000,
                    message: 'Method not allowed for stateless mode.'
                },
                id: null
            }));
        });

        app.delete('/mcp', (req, res) => {
            res.writeHead(405).end(JSON.stringify({
                jsonrpc: '2.0',
                error: {
                    code: -32000,
                    message: 'Method not allowed for stateless mode.'
                },
                id: null
            }));
        });
    }

    // Health check endpoint
    app.get('/health', (req, res) => {
        res.json({ 
            status: 'healthy', 
            transport: 'http',
            sessionManagement: config.transport.http.sessionManagement,
            timestamp: new Date().toISOString()
        });
    });

    // Start HTTP server and store reference for shutdown
    const { port, host } = config.transport.http;
    httpServer = app.listen(port, host, () => {
        const sessionMode = config.transport.http.sessionManagement ? 'with session management' : 'stateless';
        logger.info(`[MCP Server Log] Zabbix MCP Server (v1.7.0) HTTP transport running on ${host}:${port} (${sessionMode})`);
        logger.info(`HTTP server started on ${host}:${port} (${sessionMode})`);
    });

    return httpServer;
}

// STDIO Transport Implementation
async function startStdioServer() {
    const serverInstance = await createServer();
    const transport = new StdioServerTransport();
    
    await serverInstance.connect(transport);
    logger.info('[MCP Server Log] Zabbix MCP Server (v1.7.0) STDIO transport is running...');
    logger.info('STDIO server started');
}

// Start the server based on transport mode
async function startServer() {
    try {
        logger.info(`Starting MCP server with ${config.transport.mode} transport`);
        
        if (config.transport.mode === 'http') {
            await startHttpServer();
        } else {
            await startStdioServer();
        }
    } catch (error) {
        logger.error('Failed to start Zabbix MCP Server:', error);
        logger.error('[MCP Server Log] Failed to start Zabbix MCP Server:', error);
        throw error;
    }
}

// Start the server
startServer();

// Graceful shutdown handling
let isShuttingDown = false;

function gracefulShutdown(signal) {
    if (isShuttingDown) {
        logger.error(`[MCP Server Log] Force shutdown on ${signal}`);
        // eslint-disable-next-line no-process-exit
        process.exit(1);
    }
    
    isShuttingDown = true;
    logger.info(`[MCP Server Log] Received ${signal}, shutting down gracefully...`);
    logger.info(`Received ${signal}, initiating graceful shutdown`);
    
    // Close HTTP server if running
    if (httpServer) {
        httpServer.close((err) => {
            if (err) {
                logger.error('Error closing HTTP server:', err);
            } else {
                logger.info('HTTP server closed');
            }
            
            // Give the server a moment to finish current operations
            setTimeout(() => {
                logger.info('[MCP Server Log] Zabbix MCP Server stopped');
                logger.info('Server shutdown complete');
                // eslint-disable-next-line no-process-exit
                process.exit(0);
            }, 500);
        });
    } else {
        // For STDIO mode, just wait a moment
        setTimeout(() => {
            logger.info('[MCP Server Log] Zabbix MCP Server stopped');
            logger.info('Server shutdown complete');
            // eslint-disable-next-line no-process-exit
            process.exit(0);
        }, 500);
    }
}

// Handle various termination signals
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGQUIT', () => gracefulShutdown('SIGQUIT'));

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (error) => {
    logger.error('[MCP Server Log] Uncaught Exception:', error);
    logger.error('Uncaught Exception:', error);
    gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('[MCP Server Log] Unhandled Rejection at:', promise, 'reason:', reason);
    logger.error('Unhandled Rejection:', { promise, reason });
    gracefulShutdown('unhandledRejection');
});

// Export for testing
module.exports = {
    server: createServer,
    registerTools: registerAllTools,
    startHttpServer,
    startStdioServer
}; 
