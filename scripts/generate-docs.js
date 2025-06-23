/**
 * Zabbix MCP Server - Documentation Generation Script
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

const path = require('path');
const fs = require('fs');
const { ApiDocumentationGenerator } = require('../src/utils/doc-generator');
const { logger } = require('../src/utils/logger');

/**
 * Load real tool definitions from extracted data
 * @returns {Object} Object containing tools and schemas
 */
function loadRealToolDefinitions() {
  try {
    const extractedToolsPath = path.resolve(__dirname, '../docs/extracted-tools.json');
    
    if (!fs.existsSync(extractedToolsPath)) {
      logger.warn('Extracted tools file not found. Run npm run docs:extract first.');
      logger.info('Falling back to mock data...');
      return { tools: getMockTools(), schemas: getMockSchemas() };
    }
    
    const extractedData = JSON.parse(fs.readFileSync(extractedToolsPath, 'utf8'));
    logger.info(`Loaded ${extractedData.totalTools} real tool definitions from extraction`);
    logger.info(`Loaded ${extractedData.totalSchemas} real schema definitions from extraction`);
    
    const tools = extractedData.tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
      category: tool.category
    }));
    
    const schemas = extractedData.schemaDefinitions || {};
    
    return { tools, schemas };
    
  } catch (error) {
    logger.error('Failed to load extracted tools:', error.message);
    logger.info('Falling back to mock data...');
    return { tools: getMockTools(), schemas: getMockSchemas() };
  }
}

/**
 * Get mock tools as fallback
 * @returns {Array} Array of mock tool definitions
 */
function getMockTools() {
  return [
    {
      name: 'zabbix_login',
      description: 'Authenticate with Zabbix server and obtain session token. Required before using other tools.',
      inputSchema: null,
      category: 'Authentication'
    },
    {
      name: 'zabbix_host_get',
      description: 'Retrieve host information from Zabbix server. Use this to get details about monitored hosts.',
      inputSchema: null,
      category: 'Host Management'
    },
    {
      name: 'zabbix_get_problems',
      description: 'Get current problems/issues from Zabbix. Use this to see active alerts and problems.',
      inputSchema: null,
      category: 'Problem Management'
    },
    {
      name: 'zabbix_get_items',
      description: 'Retrieve monitoring items from Zabbix. Use this to see what metrics are being collected.',
      inputSchema: null,
      category: 'Items Management'
    },
    {
      name: 'zabbix_get_triggers',
      description: 'Get trigger definitions from Zabbix. Use this to see alert conditions and thresholds.',
      inputSchema: null,
      category: 'Triggers Management'
    },
    {
      name: 'zabbix_get_history',
      description: 'Retrieve historical data for items. Use this to analyze trends and past performance.',
      inputSchema: null,
      category: 'History Tools'
    }
  ];
}

/**
 * Get mock schemas as fallback
 * @returns {Object} Object of mock schema definitions
 */
function getMockSchemas() {
  return {
    hostId: {
      type: 'string',
      description: 'Zabbix host identifier',
      pattern: '^[0-9]+$'
    },
    itemId: {
      type: 'string',
      description: 'Zabbix item identifier',
      pattern: '^[0-9]+$'
    },
    triggerId: {
      type: 'string',
      description: 'Zabbix trigger identifier',
      pattern: '^[0-9]+$'
    },
    severity: {
      type: 'integer',
      enum: [0, 1, 2, 3, 4, 5],
      description: 'Trigger severity levels (0=Not classified, 1=Information, 2=Warning, 3=Average, 4=High, 5=Disaster)'
    },
    timeRange: {
      type: 'object',
      properties: {
        time_from: { type: 'integer', description: 'Start time (Unix timestamp)' },
        time_till: { type: 'integer', description: 'End time (Unix timestamp)' }
      },
      description: 'Time range for historical data queries'
    }
  };
}

async function generateDocumentation() {
  try {
    logger.info('Starting Zabbix MCP Server documentation generation...');
    
    // Load real tool definitions
    const { tools, schemas } = loadRealToolDefinitions();
    logger.info(`Using ${tools.length} tool definitions for documentation`);
    
    // Create documentation generator instance
    const generator = new ApiDocumentationGenerator();
    
    // Generate documentation
    const openApiSpec = generator.generateDocumentation(tools, schemas);
    
    // Determine output directory
    const outputDir = path.resolve(__dirname, '../docs/generated');
    
    // Save documentation files
    generator.saveDocumentation(outputDir, {
      generateOpenApi: true,
      generateMarkdown: true,
      generateHtml: true
    });
    
    logger.info('Zabbix MCP Server documentation generation completed successfully!');
    logger.info(`Files generated in: ${outputDir}`);
    logger.info('- openapi.json: OpenAPI 3.0 specification');
    logger.info('- API.md: Markdown documentation');
    
    // Display summary
    const toolCount = tools.length;
    const schemaCount = Object.keys(schemas).length;
    const pathCount = Object.keys(openApiSpec.paths).length;
    const categories = [...new Set(tools.map(t => t.category || 'General'))].sort();
    
    console.log('\n📊 Zabbix MCP Server Documentation Summary:');
    console.log(`   🔧 Tools documented: ${toolCount}`);
    console.log(`   📋 Schemas included: ${schemaCount}`);
    console.log(`   🛣️  API paths generated: ${pathCount}`);
    console.log(`   📂 Categories: ${categories.length}`);
    console.log(`   📄 License: ${openApiSpec.info.license.name}`);
    console.log(`   🔗 Repository: ${openApiSpec.info.contact.url}`);
    
    console.log('\n📋 Zabbix Tool Categories:');
    categories.forEach(category => {
      const categoryTools = tools.filter(t => (t.category || 'General') === category);
      console.log(`   ${category}: ${categoryTools.length} tools`);
    });
    
  } catch (error) {
    logger.error('Zabbix MCP Server documentation generation failed:', error.message);
    if (error.stack) {
      logger.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Run the documentation generation
if (require.main === module) {
  generateDocumentation();
}

module.exports = { generateDocumentation }; 