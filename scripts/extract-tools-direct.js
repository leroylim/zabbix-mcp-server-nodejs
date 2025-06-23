/**
 * Zabbix MCP Server - Direct Tool Extraction Script
 * 
 * This script directly extracts tool definitions from source files
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

const fs = require('fs');
const path = require('path');
const { logger } = require('../src/utils/logger');

/**
 * Extract tool definitions by parsing source files
 * @returns {Object} Object containing tools and schemas
 */
function extractToolDefinitionsFromSource() {
  const tools = [];
  const schemas = {};
  const toolsDir = path.resolve(__dirname, '../src/tools');
  
  // First, load the schemas from the schemas module
  try {
    const schemasModule = require('../src/tools/schemas');
    Object.assign(schemas, schemasModule);
    logger.info(`Loaded ${Object.keys(schemas).length} schema definitions`);
  } catch (error) {
    logger.warn('Failed to load schemas module:', error.message);
  }
  
  // Get all tool files
  const toolFiles = fs.readdirSync(toolsDir)
    .filter(file => file.endsWith('.js') && file !== 'index.js' && !file.includes('schemas'))
    .map(file => path.join(toolsDir, file));
  
  logger.info(`Found ${toolFiles.length} tool files to process`);
  
  for (const filePath of toolFiles) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const fileName = path.basename(filePath, '.js');
      
      // Extract tool definitions using more comprehensive regex
      const toolMatches = content.matchAll(/server\.tool\(\s*['"`]([^'"`]+)['"`]\s*,\s*['"`]([^'"`]+)['"`]\s*,\s*({[^}]*}|\{[\s\S]*?\})/g);
      
      for (const match of toolMatches) {
        const [, toolName, description, schemaText] = match;
        
        // Try to extract schema information
        let inputSchema = null;
        try {
          // Look for schema references in the schema object
          const schemaRefs = extractSchemaReferences(schemaText);
          if (schemaRefs.length > 0) {
            inputSchema = {
              type: 'object',
              properties: {},
              schemaReferences: schemaRefs
            };
            
            // Try to resolve schema references to actual schema definitions
            schemaRefs.forEach(ref => {
              if (schemas[ref]) {
                inputSchema.properties[ref] = convertZodToOpenAPI(schemas[ref], ref);
              }
            });
          }
        } catch (error) {
          logger.debug(`Could not extract schema for ${toolName}:`, error.message);
        }
        
        tools.push({
          name: toolName,
          description: description,
          inputSchema: inputSchema,
          category: getToolCategory(toolName),
          sourceFile: fileName
        });
      }
      
      logger.info(`Processed ${fileName}: found ${[...content.matchAll(/server\.tool\(/g)].length} tools`);
      
    } catch (error) {
      logger.error(`Error processing ${filePath}:`, error.message);
    }
  }
  
  return { tools, schemas };
}

/**
 * Extract schema references from tool schema text
 * @param {string} schemaText - The schema object text
 * @returns {Array} Array of schema reference names
 */
function extractSchemaReferences(schemaText) {
  const refs = [];
  
  // Look for schema references like schemas.vendorHostname, schemas.labels, etc.
  const schemaMatches = schemaText.matchAll(/schemas\.(\w+)/g);
  for (const match of schemaMatches) {
    refs.push(match[1]);
  }
  
  // Look for direct z.object patterns
  const zodMatches = schemaText.matchAll(/(\w+):\s*z\./g);
  for (const match of zodMatches) {
    refs.push(match[1]);
  }
  
  return [...new Set(refs)]; // Remove duplicates
}

/**
 * Convert Zod schema to OpenAPI format
 * @param {Object} zodSchema - Zod schema object
 * @param {string} name - Schema name
 * @returns {Object} OpenAPI schema
 */
function convertZodToOpenAPI(zodSchema, name) {
  try {
    if (!zodSchema || !zodSchema._def) {
      return { type: 'string', description: `Schema for ${name}` };
    }
    
    const def = zodSchema._def;
    
    switch (def.typeName) {
      case 'ZodString':
        const stringSchema = { type: 'string' };
        if (def.description) stringSchema.description = def.description;
        
        // Extract constraints from checks
        if (def.checks) {
          def.checks.forEach(check => {
            switch (check.kind) {
              case 'min':
                stringSchema.minLength = check.value;
                break;
              case 'max':
                stringSchema.maxLength = check.value;
                break;
              case 'regex':
                stringSchema.pattern = check.regex.source;
                break;
              case 'email':
                stringSchema.format = 'email';
                break;
              case 'url':
                stringSchema.format = 'uri';
                break;
              case 'datetime':
                stringSchema.format = 'date-time';
                break;
            }
          });
        }
        return stringSchema;
        
      case 'ZodNumber':
        const numberSchema = { type: 'number' };
        if (def.description) numberSchema.description = def.description;
        
        if (def.checks) {
          def.checks.forEach(check => {
            switch (check.kind) {
              case 'min':
                numberSchema.minimum = check.value;
                break;
              case 'max':
                numberSchema.maximum = check.value;
                break;
              case 'int':
                numberSchema.type = 'integer';
                break;
            }
          });
        }
        return numberSchema;
        
      case 'ZodEnum':
        return {
          type: 'string',
          enum: def.values,
          description: def.description || `Enum values: ${def.values.join(', ')}`
        };
        
      case 'ZodArray':
        return {
          type: 'array',
          items: convertZodToOpenAPI(def.type, `${name}_item`),
          description: def.description
        };
        
      case 'ZodObject':
        const properties = {};
        const required = [];
        
        if (def.shape) {
          // Handle both function and object shapes
          const shape = typeof def.shape === 'function' ? def.shape() : def.shape;
          for (const [key, value] of Object.entries(shape)) {
            properties[key] = convertZodToOpenAPI(value, key);
            // Check if field is required (not optional)
            if (value._def && value._def.typeName !== 'ZodOptional') {
              required.push(key);
            }
          }
        }
        
        return {
          type: 'object',
          properties,
          required: required.length > 0 ? required : undefined,
          description: def.description
        };
        
      case 'ZodOptional':
        // Handle optional fields by returning the inner type
        return convertZodToOpenAPI(def.innerType, name);
        
      case 'ZodUnion':
        // Handle union types (e.g., string | number)
        if (def.options && def.options.length > 0) {
          return {
            oneOf: def.options.map((option, index) => 
              convertZodToOpenAPI(option, `${name}_option_${index}`)
            ),
            description: def.description
          };
        }
        break;
        
      case 'ZodLiteral':
        return {
          type: typeof def.value,
          enum: [def.value],
          description: def.description || `Literal value: ${def.value}`
        };
        
      case 'ZodBoolean':
        return {
          type: 'boolean',
          description: def.description
        };
        
      case 'ZodDate':
        return {
          type: 'string',
          format: 'date-time',
          description: def.description || 'ISO 8601 date-time string'
        };
        
      default:
        logger.debug(`Unknown Zod type: ${def.typeName} for ${name}`);
        return {
          type: 'string',
          description: def.description || `Schema for ${name} (${def.typeName})`
        };
    }
  } catch (error) {
    logger.debug(`Error converting schema ${name}:`, error.message);
    return { type: 'string', description: `Schema for ${name}` };
  }
}

/**
 * Get tool category for grouping
 * @param {string} toolName - Tool name
 * @returns {string} Category name
 */
function getToolCategory(toolName) {
  // Authentication tools
  if (toolName.includes('login') || toolName.includes('logout') || toolName.includes('apiinfo')) return 'Authentication';
  
  // Host management
  if (toolName.includes('host') && !toolName.includes('hostgroup')) return 'Host Management';
  if (toolName.includes('hostgroup')) return 'Host Groups';
  
  // Monitoring tools
  if (toolName.includes('item')) return 'Items Management';
  if (toolName.includes('trigger')) return 'Triggers Management';
  if (toolName.includes('problem')) return 'Problems Management';
  if (toolName.includes('history') || toolName.includes('trend')) return 'History Tools';
  
  // Maintenance and operations
  if (toolName.includes('maintenance')) return 'Maintenance Tools';
  if (toolName.includes('script')) return 'Scripts Management';
  
  // User management
  if (toolName.includes('user') || toolName.includes('usergroup')) return 'User Management';
  
  // Templates
  if (toolName.includes('template')) return 'Template Management';
  
  // Discovery
  if (toolName.includes('discovery') || toolName.includes('discovered')) return 'Discovery Tools';
  
  // Media and notifications
  if (toolName.includes('media') || toolName.includes('alert')) return 'Media & Notifications';
  
  // Actions and automation
  if (toolName.includes('action') || toolName.includes('correlation')) return 'Actions & Escalations';
  
  // Maps and visualization
  if (toolName.includes('map') || toolName.includes('value_map') || toolName.includes('icon')) return 'Maps Management';
  
  // Dashboards
  if (toolName.includes('dashboard')) return 'Dashboard Management';
  
  // Proxies
  if (toolName.includes('proxy')) return 'Proxy Management';
  
  // Configuration
  if (toolName.includes('export') || toolName.includes('import') || toolName.includes('configuration')) return 'Configuration Management';
  
  // Business services
  if (toolName.includes('service') || toolName.includes('sla')) return 'Business Services';
  
  return 'General';
}

/**
 * Save extracted tools to a JSON file
 * @param {Array} tools - Tool definitions
 * @param {Object} schemas - Schema definitions
 * @param {string} outputPath - Output file path
 */
function saveToolDefinitions(tools, schemas, outputPath) {
  const toolsData = {
    extractedAt: new Date().toISOString(),
    extractionMethod: 'direct-source-parsing',
    totalTools: tools.length,
    totalSchemas: Object.keys(schemas).length,
    categories: [...new Set(tools.map(t => t.category))].sort(),
    sourceFiles: [...new Set(tools.map(t => t.sourceFile))].sort(),
    schemas: Object.keys(schemas).sort(),
    tools: tools.sort((a, b) => a.name.localeCompare(b.name)),
    schemaDefinitions: schemas
  };
  
  fs.writeFileSync(outputPath, JSON.stringify(toolsData, null, 2));
  logger.info(`Tool definitions saved to ${outputPath}`);
}

/**
 * Main extraction function
 */
async function main() {
  try {
    logger.info('Starting direct tool extraction from source files...');
    
    // Extract tools and schemas
    const { tools, schemas } = extractToolDefinitionsFromSource();
    
    // Save to file
    const outputPath = path.resolve(__dirname, '../docs/extracted-tools.json');
    saveToolDefinitions(tools, schemas, outputPath);
    
    // Display summary
    const categories = [...new Set(tools.map(t => t.category))].sort();
    const sourceFiles = [...new Set(tools.map(t => t.sourceFile))].sort();
    const toolsWithSchemas = tools.filter(t => t.inputSchema && t.inputSchema.schemaReferences && t.inputSchema.schemaReferences.length > 0);
    
    console.log('\n📊 Tool Extraction Summary:');
    console.log(`   🔧 Total tools extracted: ${tools.length}`);
    console.log(`   📋 Schema definitions loaded: ${Object.keys(schemas).length}`);
    console.log(`   🔗 Tools with schemas: ${toolsWithSchemas.length}`);
    console.log(`   📂 Categories found: ${categories.length}`);
    console.log(`   📄 Source files processed: ${sourceFiles.length}`);
    console.log('\n📋 Categories:');
    
    categories.forEach(category => {
      const categoryTools = tools.filter(t => t.category === category);
      const categoryToolsWithSchemas = categoryTools.filter(t => t.inputSchema && t.inputSchema.schemaReferences && t.inputSchema.schemaReferences.length > 0);
      console.log(`   ${category}: ${categoryTools.length} tools (${categoryToolsWithSchemas.length} with schemas)`);
    });
    
    console.log('\n📄 Source Files:');
    sourceFiles.forEach(file => {
      const fileTools = tools.filter(t => t.sourceFile === file);
      const fileToolsWithSchemas = fileTools.filter(t => t.inputSchema && t.inputSchema.schemaReferences && t.inputSchema.schemaReferences.length > 0);
      console.log(`   ${file}.js: ${fileTools.length} tools (${fileToolsWithSchemas.length} with schemas)`);
    });
    
    if (Object.keys(schemas).length > 0) {
      console.log('\n📋 Available Schemas:');
      Object.keys(schemas).sort().forEach(schemaName => {
        console.log(`   ${schemaName}`);
      });
    }
    
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

module.exports = { extractToolDefinitionsFromSource, getToolCategory, saveToolDefinitions }; 