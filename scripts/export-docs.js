/**
 * UpGuard CyberRisk MCP Server - Documentation Export Script
 * 
 * This script exports documentation to various formats
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
const { logger } = require('../src/utils/logger');

/**
 * Export documentation to Postman collection
 * @param {string} openApiPath - Path to OpenAPI specification
 * @param {string} outputDir - Output directory
 */
function exportToPostman(openApiPath, outputDir) {
  try {
    const openApiSpec = JSON.parse(fs.readFileSync(openApiPath, 'utf8'));
    
    const postmanCollection = {
      info: {
        name: openApiSpec.info.title,
        description: openApiSpec.info.description,
        version: openApiSpec.info.version,
        schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
      },
      auth: {
        type: "bearer",
        bearer: [
          {
            key: "token",
            value: "{{API_KEY}}",
            type: "string"
          }
        ]
      },
      variable: [
        {
          key: "baseUrl",
          value: openApiSpec.servers[0]?.url || "http://localhost:3000",
          type: "string"
        },
        {
          key: "API_KEY",
          value: "your_api_key_here",
          type: "string"
        }
      ],
      item: []
    };

    // Convert paths to Postman requests
    for (const [pathName, pathItem] of Object.entries(openApiSpec.paths)) {
      for (const [method, operation] of Object.entries(pathItem)) {
        const request = {
          name: operation.summary || `${method.toUpperCase()} ${pathName}`,
          request: {
            method: method.toUpperCase(),
            header: [
              {
                key: "Content-Type",
                value: "application/json",
                type: "text"
              }
            ],
            url: {
              raw: "{{baseUrl}}" + pathName,
              host: ["{{baseUrl}}"],
              path: pathName.split('/').filter(p => p)
            },
            description: operation.description
          },
          response: []
        };

        // Add request body if present
        if (operation.requestBody) {
          const schema = operation.requestBody.content['application/json']?.schema;
          if (schema) {
            request.request.body = {
              mode: "raw",
              raw: JSON.stringify(generateExampleFromSchema(schema), null, 2),
              options: {
                raw: {
                  language: "json"
                }
              }
            };
          }
        }

        // Group by tags
        const tag = operation.tags?.[0] || 'General';
        let folder = postmanCollection.item.find(item => item.name === tag);
        if (!folder) {
          folder = {
            name: tag,
            item: []
          };
          postmanCollection.item.push(folder);
        }
        folder.item.push(request);
      }
    }

    const outputPath = path.join(outputDir, 'postman-collection.json');
    fs.writeFileSync(outputPath, JSON.stringify(postmanCollection, null, 2));
    logger.info(`Postman collection exported to: ${outputPath}`);
    
    return outputPath;
  } catch (error) {
    logger.error('Failed to export Postman collection:', error);
    throw error;
  }
}

/**
 * Export documentation to Insomnia workspace
 * @param {string} openApiPath - Path to OpenAPI specification
 * @param {string} outputDir - Output directory
 */
function exportToInsomnia(openApiPath, outputDir) {
  try {
    const openApiSpec = JSON.parse(fs.readFileSync(openApiPath, 'utf8'));
    
    const insomniaWorkspace = {
      _type: "export",
      __export_format: 4,
      __export_date: new Date().toISOString(),
      __export_source: "upguard-cyberrisk-mcp-server",
      resources: [
        {
          _id: "wrk_base",
          _type: "workspace",
          name: openApiSpec.info.title,
          description: openApiSpec.info.description
        },
        {
          _id: "env_base",
          _type: "environment",
          name: "Base Environment",
          data: {
            baseUrl: openApiSpec.servers[0]?.url || "http://localhost:3000",
            apiKey: "your_api_key_here"
          },
          parentId: "wrk_base"
        }
      ]
    };

    // Convert paths to Insomnia requests
    let requestId = 1;
    for (const [pathName, pathItem] of Object.entries(openApiSpec.paths)) {
      for (const [method, operation] of Object.entries(pathItem)) {
        const request = {
          _id: `req_${requestId++}`,
          _type: "request",
          name: operation.summary || `${method.toUpperCase()} ${pathName}`,
          method: method.toUpperCase(),
          url: "{{ _.baseUrl }}" + pathName,
          description: operation.description,
          headers: [
            {
              name: "Content-Type",
              value: "application/json"
            },
            {
              name: "Authorization",
              value: "Bearer {{ _.apiKey }}"
            }
          ],
          parentId: "wrk_base"
        };

        // Add request body if present
        if (operation.requestBody) {
          const schema = operation.requestBody.content['application/json']?.schema;
          if (schema) {
            request.body = {
              mimeType: "application/json",
              text: JSON.stringify(generateExampleFromSchema(schema), null, 2)
            };
          }
        }

        insomniaWorkspace.resources.push(request);
      }
    }

    const outputPath = path.join(outputDir, 'insomnia-workspace.json');
    fs.writeFileSync(outputPath, JSON.stringify(insomniaWorkspace, null, 2));
    logger.info(`Insomnia workspace exported to: ${outputPath}`);
    
    return outputPath;
  } catch (error) {
    logger.error('Failed to export Insomnia workspace:', error);
    throw error;
  }
}

/**
 * Generate example from OpenAPI schema
 * @param {Object} schema - OpenAPI schema
 * @returns {any} Example value
 */
function generateExampleFromSchema(schema) {
  switch (schema.type) {
    case 'object':
      const example = {};
      if (schema.properties) {
        for (const [key, prop] of Object.entries(schema.properties)) {
          example[key] = generateExampleFromSchema(prop);
        }
      }
      return example;
      
    case 'array':
      return schema.items ? [generateExampleFromSchema(schema.items)] : [];
      
    case 'string':
      if (schema.enum) return schema.enum[0];
      if (schema.format === 'email') return 'user@example.com';
      if (schema.format === 'date-time') return '2024-01-01T00:00:00Z';
      if (schema.format === 'uri') return 'https://example.com';
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
 * Export API documentation summary
 * @param {string} extractedToolsPath - Path to extracted tools data
 * @param {string} outputDir - Output directory
 */
function exportSummary(extractedToolsPath, outputDir) {
  try {
    const extractedData = JSON.parse(fs.readFileSync(extractedToolsPath, 'utf8'));
    
    const summary = {
      title: "UpGuard CyberRisk MCP Server API Summary",
      version: "1.2.0",
      generatedAt: new Date().toISOString(),
      statistics: {
        totalTools: extractedData.totalTools,
        totalSchemas: extractedData.totalSchemas,
        categories: extractedData.categories?.length || 0,
        toolsWithSchemas: extractedData.tools?.filter(t => 
          t.inputSchema?.schemaReferences?.length > 0
        ).length || 0
      },
      categories: {},
      schemas: Object.keys(extractedData.schemaDefinitions || {}).sort()
    };

    // Group tools by category
    if (extractedData.tools) {
      extractedData.tools.forEach(tool => {
        const category = tool.category || 'General';
        if (!summary.categories[category]) {
          summary.categories[category] = [];
        }
        summary.categories[category].push({
          name: tool.name,
          description: tool.description,
          hasSchema: !!(tool.inputSchema?.schemaReferences?.length > 0)
        });
      });
    }

    const outputPath = path.join(outputDir, 'api-summary.json');
    fs.writeFileSync(outputPath, JSON.stringify(summary, null, 2));
    logger.info(`API summary exported to: ${outputPath}`);
    
    return outputPath;
  } catch (error) {
    logger.error('Failed to export API summary:', error);
    throw error;
  }
}

/**
 * Main export function
 */
async function main() {
  try {
    logger.info('Starting documentation export...');
    
    const docsDir = path.resolve(__dirname, '../docs');
    const generatedDir = path.join(docsDir, 'generated');
    const openApiPath = path.join(generatedDir, 'openapi.json');
    const extractedToolsPath = path.join(docsDir, 'extracted-tools.json');
    
    if (!fs.existsSync(openApiPath)) {
      logger.error('OpenAPI specification not found. Run npm run docs:generate first.');
      process.exit(1);
    }
    
    // Export to various formats
    const postmanPath = exportToPostman(openApiPath, generatedDir);
    const insomniaPath = exportToInsomnia(openApiPath, generatedDir);
    const summaryPath = exportSummary(extractedToolsPath, generatedDir);
    
    console.log('\n📦 Documentation Export Complete!');
    console.log('\n📄 Exported Files:');
    console.log(`   📮 Postman Collection: ${postmanPath}`);
    console.log(`   🔮 Insomnia Workspace: ${insomniaPath}`);
    console.log(`   📊 API Summary: ${summaryPath}`);
    console.log('\n💡 Usage Instructions:');
    console.log('   📮 Import postman-collection.json into Postman');
    console.log('   🔮 Import insomnia-workspace.json into Insomnia');
    console.log('   📊 Use api-summary.json for quick reference');
    
  } catch (error) {
    logger.error('Documentation export failed:', error);
    process.exit(1);
  }
}

// Run export if called directly
if (require.main === module) {
  main();
}

module.exports = { 
  exportToPostman, 
  exportToInsomnia, 
  exportSummary 
}; 