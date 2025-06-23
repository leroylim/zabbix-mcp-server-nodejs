/**
 * UpGuard CyberRisk MCP Server - Documentation Generator
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

const fs = require('fs');
const path = require('path');
const { logger } = require('./logger');

class ApiDocumentationGenerator {
  constructor() {
    this.openApiSpec = {
      openapi: '3.0.3',
      info: {
        title: 'UpGuard CyberRisk MCP Server API',
        version: '1.2.0',
        description: 'Model Context Protocol server for UpGuard CyberRisk API integration',
        contact: {
          name: 'API Support',
          url: 'https://github.com/leroylim/upguard-cyberrisk-mcp-server-nodejs'
        },
        license: {
          name: 'MIT',
          url: 'https://opensource.org/licenses/MIT'
        }
      },
      servers: [
        {
          url: 'http://localhost:3000',
          description: 'Development server'
        }
      ],
      paths: {},
      components: {
        schemas: {},
        securitySchemes: {
          ApiKeyAuth: {
            type: 'apiKey',
            in: 'header',
            name: 'Authorization'
          }
        }
      },
      security: [
        {
          ApiKeyAuth: []
        }
      ]
    };
  }

  /**
   * Generate OpenAPI documentation from tool definitions
   * @param {Array} tools - Array of tool definitions
   * @param {object} schemas - Schema definitions
   * @returns {object} OpenAPI specification
   */
  generateDocumentation(tools, schemas = {}) {
    // Generate schemas from Zod definitions
    this.generateSchemas(schemas);
    
    // Generate paths from tools
    this.generatePaths(tools);
    
    // Add health check endpoint
    this.addHealthEndpoint();
    
    // Add metrics endpoint
    this.addMetricsEndpoint();
    
    return this.openApiSpec;
  }

  /**
   * Convert Zod schemas to OpenAPI schemas
   * @param {object} schemas - Zod schema definitions
   */
  generateSchemas(schemas) {
    for (const [name, schema] of Object.entries(schemas)) {
      try {
        this.openApiSpec.components.schemas[name] = this.zodToOpenApi(schema);
      } catch (error) {
        logger.warn(`Failed to convert schema ${name}:`, error.message);
      }
    }
  }

  /**
   * Convert Zod schema to OpenAPI schema
   * @param {object} zodSchema - Zod schema
   * @returns {object} OpenAPI schema
   */
  zodToOpenApi(zodSchema) {
    // Basic conversion - would need more sophisticated handling for complex schemas
    if (zodSchema._def) {
      const def = zodSchema._def;
      
      switch (def.typeName) {
        case 'ZodString':
          return {
            type: 'string',
            description: def.description,
            ...(def.checks && this.extractStringConstraints(def.checks))
          };
          
        case 'ZodNumber':
          return {
            type: 'number',
            description: def.description,
            ...(def.checks && this.extractNumberConstraints(def.checks))
          };
          
        case 'ZodBoolean':
          return {
            type: 'boolean',
            description: def.description
          };
          
        case 'ZodEnum':
          return {
            type: 'string',
            enum: def.values,
            description: def.description
          };
          
        case 'ZodArray':
          return {
            type: 'array',
            items: this.zodToOpenApi(def.type),
            description: def.description
          };
          
        case 'ZodObject': {
          const properties = {};
          const required = [];
          
          for (const [key, value] of Object.entries(def.shape())) {
            properties[key] = this.zodToOpenApi(value);
            if (!value.isOptional()) {
              required.push(key);
            }
          }
          
          return {
            type: 'object',
            properties,
            required: required.length > 0 ? required : undefined,
            description: def.description
          };
        }
        
        default:
          return {
            type: 'string',
            description: def.description || 'Unknown type'
          };
      }
    }
    
    return { type: 'string' };
  }

  /**
   * Extract string constraints from Zod checks
   * @param {Array} checks - Zod validation checks
   * @returns {object} OpenAPI constraints
   */
  extractStringConstraints(checks) {
    const constraints = {};
    
    for (const check of checks) {
      switch (check.kind) {
        case 'min':
          constraints.minLength = check.value;
          break;
        case 'max':
          constraints.maxLength = check.value;
          break;
        case 'regex':
          constraints.pattern = check.regex.source;
          break;
        case 'email':
          constraints.format = 'email';
          break;
        case 'url':
          constraints.format = 'uri';
          break;
        case 'datetime':
          constraints.format = 'date-time';
          break;
      }
    }
    
    return constraints;
  }

  /**
   * Extract number constraints from Zod checks
   * @param {Array} checks - Zod validation checks
   * @returns {object} OpenAPI constraints
   */
  extractNumberConstraints(checks) {
    const constraints = {};
    
    for (const check of checks) {
      switch (check.kind) {
        case 'min':
          constraints.minimum = check.value;
          break;
        case 'max':
          constraints.maximum = check.value;
          break;
        case 'int':
          constraints.type = 'integer';
          break;
      }
    }
    
    return constraints;
  }

  /**
   * Generate API paths from MCP tools
   * @param {Array} tools - Tool definitions
   */
  generatePaths(tools) {
    for (const tool of tools) {
      const pathName = `/tools/${tool.name}`;
      
      this.openApiSpec.paths[pathName] = {
        post: {
          summary: tool.description || `Execute ${tool.name} tool`,
          description: tool.description,
          tags: [this.getToolCategory(tool.name)],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    method: {
                      type: 'string',
                      enum: ['tools/call'],
                      description: 'MCP method name'
                    },
                    params: {
                      type: 'object',
                      properties: {
                        name: {
                          type: 'string',
                          enum: [tool.name],
                          description: 'Tool name'
                        },
                        arguments: this.getToolSchema(tool)
                      },
                      required: ['name']
                    }
                  },
                  required: ['method', 'params']
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Successful tool execution',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      content: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            type: {
                              type: 'string',
                              enum: ['text']
                            },
                            text: {
                              type: 'string',
                              description: 'Tool execution result'
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            '400': {
              description: 'Invalid request or parameters'
            },
            '401': {
              description: 'Authentication failed'
            },
            '429': {
              description: 'Rate limit exceeded'
            },
            '500': {
              description: 'Internal server error'
            }
          }
        }
      };
    }
  }

  /**
   * Get tool schema for OpenAPI
   * @param {object} tool - Tool definition
   * @returns {object} OpenAPI schema
   */
  getToolSchema(tool) {
    if (tool.inputSchema) {
      return this.zodToOpenApi(tool.inputSchema);
    }
    
    return {
      type: 'object',
      description: 'Tool parameters'
    };
  }

  /**
   * Get tool category for grouping
   * @param {string} toolName - Tool name
   * @returns {string} Category name
   */
  getToolCategory(toolName) {
    if (toolName.includes('risk')) return 'Risk Management';
    if (toolName.includes('vendor')) return 'Vendor Management';
    if (toolName.includes('domain')) return 'Domain Management';
    if (toolName.includes('ip')) return 'IP Management';
    if (toolName.includes('questionnaire')) return 'Questionnaire Management';
    if (toolName.includes('report')) return 'Report Generation';
    if (toolName.includes('breach')) return 'Breach Monitoring';
    if (toolName.includes('bulk')) return 'Bulk Operations';
    
    return 'General';
  }

  /**
   * Add health check endpoint
   */
  addHealthEndpoint() {
    this.openApiSpec.paths['/health'] = {
      get: {
        summary: 'Health check endpoint',
        description: 'Check server health and status',
        tags: ['System'],
        security: [],
        responses: {
          '200': {
            description: 'Server is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: {
                      type: 'string',
                      enum: ['ok', 'degraded', 'error']
                    },
                    uptime: {
                      type: 'number',
                      description: 'Server uptime in seconds'
                    },
                    timestamp: {
                      type: 'string',
                      format: 'date-time'
                    },
                    system: {
                      type: 'object',
                      properties: {
                        memory: {
                          type: 'object',
                          properties: {
                            total: { type: 'number' },
                            free: { type: 'number' },
                            used: { type: 'number' }
                          }
                        },
                        cpu: {
                          type: 'array',
                          items: { type: 'number' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    };
  }

  /**
   * Add metrics endpoint
   */
  addMetricsEndpoint() {
    this.openApiSpec.paths['/metrics'] = {
      get: {
        summary: 'Prometheus metrics endpoint',
        description: 'Get application metrics in Prometheus format',
        tags: ['System'],
        responses: {
          '200': {
            description: 'Metrics in Prometheus format',
            content: {
              'text/plain': {
                schema: {
                  type: 'string',
                  description: 'Prometheus metrics'
                }
              }
            }
          }
        }
      }
    };
  }

  /**
   * Generate markdown documentation
   * @param {object} openApiSpec - OpenAPI specification
   * @returns {string} Markdown documentation
   */
  generateMarkdown(openApiSpec = this.openApiSpec) {
    let markdown = `# ${openApiSpec.info.title}\n\n`;
    markdown += `${openApiSpec.info.description}\n\n`;
    markdown += `**Version:** ${openApiSpec.info.version}\n\n`;
    
    // Table of contents
    markdown += '## Table of Contents\n\n';
    const categories = new Set();
    Object.values(openApiSpec.paths).forEach(path => {
      Object.values(path).forEach(operation => {
        if (operation.tags) {
          operation.tags.forEach(tag => categories.add(tag));
        }
      });
    });
    
    for (const category of Array.from(categories).sort()) {
      markdown += `- [${category}](#${category.toLowerCase().replace(/\s+/g, '-')})\n`;
    }
    markdown += '\n';
    
    // Authentication
    markdown += '## Authentication\n\n';
    markdown += 'This API uses API Key authentication. Include your API key in the Authorization header:\n\n';
    markdown += '```\nAuthorization: Bearer YOUR_API_KEY\n```\n\n';
    
    // Endpoints by category
    for (const category of Array.from(categories).sort()) {
      markdown += `## ${category}\n\n`;
      
      for (const [pathName, pathItem] of Object.entries(openApiSpec.paths)) {
        for (const [method, operation] of Object.entries(pathItem)) {
          if (operation.tags && operation.tags.includes(category)) {
            markdown += `### ${operation.summary}\n\n`;
            markdown += `**${method.toUpperCase()}** \`${pathName}\`\n\n`;
            markdown += `${operation.description}\n\n`;
            
            // Parameters
            if (operation.requestBody) {
              markdown += '#### Request Body\n\n';
              markdown += '```json\n';
              markdown += JSON.stringify(
                this.generateExampleFromSchema(
                  operation.requestBody.content['application/json'].schema
                ),
                null,
                2
              );
              markdown += '\n```\n\n';
            }
            
            // Responses
            markdown += '#### Responses\n\n';
            for (const [status, response] of Object.entries(operation.responses)) {
              markdown += `**${status}** - ${response.description}\n\n`;
            }
            
            markdown += '---\n\n';
          }
        }
      }
    }
    
    return markdown;
  }

  /**
   * Generate example from schema
   * @param {object} schema - OpenAPI schema
   * @returns {any} Example value
   */
  generateExampleFromSchema(schema) {
    switch (schema.type) {
      case 'object': {
        const example = {};
        if (schema.properties) {
          for (const [key, prop] of Object.entries(schema.properties)) {
            example[key] = this.generateExampleFromSchema(prop);
          }
        }
        return example;
      }
        
      case 'array':
        return [this.generateExampleFromSchema(schema.items)];
        
      case 'string':
        if (schema.enum) return schema.enum[0];
        if (schema.format === 'email') return 'user@example.com';
        if (schema.format === 'date-time') return '2024-01-01T00:00:00Z';
        return 'string';
        
      case 'number':
      case 'integer':
        return schema.minimum || 0;
        
      case 'boolean':
        return true;
        
      default:
        return null;
    }
  }

  /**
   * Save documentation to files
   * @param {string} outputDir - Output directory
   * @param {object} options - Options
   */
  saveDocumentation(outputDir = './docs', options = {}) {
    const { 
      generateOpenApi = true, 
      generateMarkdown = true,
      generateHtml = false 
    } = options;
    
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    if (generateOpenApi) {
      const openApiPath = path.join(outputDir, 'openapi.json');
      fs.writeFileSync(openApiPath, JSON.stringify(this.openApiSpec, null, 2));
      logger.info(`OpenAPI specification saved to ${openApiPath}`);
    }
    
    if (generateMarkdown) {
      const markdownPath = path.join(outputDir, 'API.md');
      const markdown = this.generateMarkdown();
      fs.writeFileSync(markdownPath, markdown);
      logger.info(`Markdown documentation saved to ${markdownPath}`);
    }
    
    if (generateHtml) {
      try {
        // Import and use the HTML generation functions
        const { generateSwaggerUI, generateRedoc, generateIndexPage } = require('../../scripts/generate-html-docs');
        
        const openApiPath = path.join(outputDir, 'openapi.json');
        
        // Read stats from extracted tools if available
        const extractedToolsPath = path.resolve(outputDir, '../extracted-tools.json');
        let stats = { totalTools: 67, totalCategories: 13, totalSchemas: 22, toolsWithSchemas: 54 };
        
        if (fs.existsSync(extractedToolsPath)) {
          const extractedData = JSON.parse(fs.readFileSync(extractedToolsPath, 'utf8'));
          stats = {
            totalTools: extractedData.totalTools,
            totalCategories: extractedData.categories?.length || 13,
            totalSchemas: extractedData.totalSchemas,
            toolsWithSchemas: extractedData.tools?.filter(t => t.inputSchema?.schemaReferences?.length > 0).length || 54
          };
        }
        
        // Generate HTML documentation
        generateSwaggerUI(openApiPath, outputDir);
        generateRedoc(openApiPath, outputDir);
        generateIndexPage(outputDir, stats);
        
        logger.info('HTML documentation generated successfully');
      } catch (error) {
        logger.error('Failed to generate HTML documentation:', error.message);
        logger.info('HTML generation requires the generate-html-docs script');
      }
    }
  }
}

module.exports = {
  ApiDocumentationGenerator
}; 
