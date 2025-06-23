/**
 * UpGuard CyberRisk MCP Server - Tool Extraction Script
 * 
 * This script extracts actual tool definitions from the MCP server
 * for use in documentation generation.
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
const { registerAllTools } = require('../src/tools');
const { logger } = require('../src/utils/logger');
const fs = require('fs');
const path = require('path');

/**
 * Extract tool definitions from the MCP server
 * @returns {Array} Array of tool definitions
 */
async function extractToolDefinitions() {
  try {
    logger.info('Creating MCP server instance for tool extraction...');
    
    // Create a server instance
    const server = new McpServer({
      name: 'upguard_cyberrisk_mcp_server_extractor',
      version: '1.2.0',
      description: 'Tool extraction server'
    });

    // Register all tools
    await registerAllTools(server);
    
    // Debug: Log server structure
    logger.info('Server structure keys:', Object.keys(server));
    if (server.server) {
      logger.info('Server.server structure keys:', Object.keys(server.server));
    }
    
    // Extract tool definitions - try multiple possible locations
    const tools = [];
    
    // Try different possible locations for tools
    const possibleToolsLocations = [
      server.server?._tools,
      server._tools,
      server.tools,
      server.server?.tools,
      server.server?._handlers?.tools,
      server._handlers?.tools
    ];
    
    let toolsMap = null;
    for (const location of possibleToolsLocations) {
      if (location && typeof location === 'object' && Object.keys(location).length > 0) {
        toolsMap = location;
        logger.info(`Found tools at location with ${Object.keys(location).length} tools`);
        break;
      }
    }
    
    if (!toolsMap) {
      // Try to use the listTools method if available
      try {
        if (typeof server.listTools === 'function') {
          const toolsList = await server.listTools();
          logger.info('Using listTools method, found:', toolsList);
          if (toolsList && toolsList.tools) {
            toolsList.tools.forEach(tool => {
              tools.push({
                name: tool.name,
                description: tool.description || `Execute ${tool.name} tool`,
                inputSchema: tool.inputSchema || null,
                category: getToolCategory(tool.name)
              });
            });
          }
        }
      } catch (error) {
        logger.warn('listTools method failed:', error.message);
      }
    } else {
      // Extract from tools map
      for (const [toolName, toolDefinition] of Object.entries(toolsMap)) {
        tools.push({
          name: toolName,
          description: toolDefinition.description || `Execute ${toolName} tool`,
          inputSchema: toolDefinition.inputSchema || null,
          category: getToolCategory(toolName)
        });
      }
    }
    
    if (tools.length === 0) {
      logger.warn('No tools found. Server structure:');
      logger.warn('Server keys:', Object.keys(server));
      if (server.server) {
        logger.warn('Server.server keys:', Object.keys(server.server));
      }
    }
    
    logger.info(`Extracted ${tools.length} tool definitions`);
    return tools;
    
  } catch (error) {
    logger.error('Failed to extract tool definitions:', error);
    throw error;
  }
}

/**
 * Get tool category for grouping
 * @param {string} toolName - Tool name
 * @returns {string} Category name
 */
function getToolCategory(toolName) {
  if (toolName.includes('risk')) return 'Risk Management';
  if (toolName.includes('vendor')) return 'Vendor Management';
  if (toolName.includes('domain')) return 'Domain Management';
  if (toolName.includes('ip')) return 'IP Management';
  if (toolName.includes('questionnaire')) return 'Questionnaire Management';
  if (toolName.includes('report')) return 'Report Generation';
  if (toolName.includes('breach')) return 'Breach Monitoring';
  if (toolName.includes('bulk')) return 'Bulk Operations';
  if (toolName.includes('webhook')) return 'Webhook Management';
  if (toolName.includes('organization')) return 'Organization Management';
  if (toolName.includes('subsidiary')) return 'Subsidiary Management';
  if (toolName.includes('typosquat')) return 'Typosquat Detection';
  if (toolName.includes('vulnerability')) return 'Vulnerability Management';
  if (toolName.includes('label')) return 'Label Management';
  if (toolName.includes('notification')) return 'Notification Management';
  
  return 'General';
}

/**
 * Save extracted tools to a JSON file
 * @param {Array} tools - Tool definitions
 * @param {string} outputPath - Output file path
 */
function saveToolDefinitions(tools, outputPath) {
  const toolsData = {
    extractedAt: new Date().toISOString(),
    totalTools: tools.length,
    categories: [...new Set(tools.map(t => t.category))].sort(),
    tools: tools.sort((a, b) => a.name.localeCompare(b.name))
  };
  
  fs.writeFileSync(outputPath, JSON.stringify(toolsData, null, 2));
  logger.info(`Tool definitions saved to ${outputPath}`);
}

/**
 * Main extraction function
 */
async function main() {
  try {
    logger.info('Starting tool extraction...');
    
    // Extract tools
    const tools = await extractToolDefinitions();
    
    // Save to file
    const outputPath = path.resolve(__dirname, '../docs/extracted-tools.json');
    saveToolDefinitions(tools, outputPath);
    
    // Display summary
    const categories = [...new Set(tools.map(t => t.category))].sort();
    
    console.log('\n📊 Tool Extraction Summary:');
    console.log(`   🔧 Total tools extracted: ${tools.length}`);
    console.log(`   📂 Categories found: ${categories.length}`);
    console.log('\n📋 Categories:');
    
    categories.forEach(category => {
      const categoryTools = tools.filter(t => t.category === category);
      console.log(`   ${category}: ${categoryTools.length} tools`);
    });
    
    console.log(`\n💾 Tool definitions saved to: ${outputPath}`);
    console.log('\nNext steps:');
    console.log('1. Review extracted-tools.json for accuracy');
    console.log('2. Update scripts/generate-docs.js to use real tool data');
    console.log('3. Run npm run docs:build to generate updated documentation');
    
  } catch (error) {
    logger.error('Tool extraction failed:', error);
    process.exit(1);
  }
}

// Run extraction if called directly
if (require.main === module) {
  main();
}

module.exports = { extractToolDefinitions, getToolCategory, saveToolDefinitions }; 