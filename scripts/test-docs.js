/**
 * UpGuard CyberRisk MCP Server - Documentation Testing Script
 * 
 * This script validates the generated documentation files
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
 * Test OpenAPI specification validity
 * @param {string} filePath - Path to OpenAPI spec
 * @returns {Object} Test results
 */
function testOpenApiSpec(filePath) {
  const results = {
    exists: false,
    valid: false,
    size: 0,
    paths: 0,
    schemas: 0,
    errors: []
  };

  try {
    if (!fs.existsSync(filePath)) {
      results.errors.push('OpenAPI spec file does not exist');
      return results;
    }

    results.exists = true;
    const stats = fs.statSync(filePath);
    results.size = stats.size;

    const content = fs.readFileSync(filePath, 'utf8');
    const spec = JSON.parse(content);

    // Validate basic structure
    if (!spec.openapi) {
      results.errors.push('Missing openapi version');
    }

    if (!spec.info) {
      results.errors.push('Missing info section');
    } else {
      if (!spec.info.title) results.errors.push('Missing title');
      if (!spec.info.version) results.errors.push('Missing version');
      if (!spec.info.description) results.errors.push('Missing description');
    }

    if (!spec.paths) {
      results.errors.push('Missing paths section');
    } else {
      results.paths = Object.keys(spec.paths).length;
    }

    if (spec.components && spec.components.schemas) {
      results.schemas = Object.keys(spec.components.schemas).length;
    }

    results.valid = results.errors.length === 0;

  } catch (error) {
    results.errors.push(`Failed to parse OpenAPI spec: ${error.message}`);
  }

  return results;
}

/**
 * Test Markdown documentation
 * @param {string} filePath - Path to Markdown file
 * @returns {Object} Test results
 */
function testMarkdownDoc(filePath) {
  const results = {
    exists: false,
    size: 0,
    lines: 0,
    hasTitle: false,
    hasAuth: false,
    hasEndpoints: false,
    errors: []
  };

  try {
    if (!fs.existsSync(filePath)) {
      results.errors.push('Markdown file does not exist');
      return results;
    }

    results.exists = true;
    const stats = fs.statSync(filePath);
    results.size = stats.size;

    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    results.lines = lines.length;

    // Check for key sections
    results.hasTitle = content.includes('# UpGuard CyberRisk MCP Server API');
    results.hasAuth = content.includes('## Authentication');
    results.hasEndpoints = content.includes('###') && content.includes('**GET**');

    if (!results.hasTitle) results.errors.push('Missing main title');
    if (!results.hasAuth) results.errors.push('Missing authentication section');
    if (!results.hasEndpoints) results.errors.push('Missing endpoint documentation');

  } catch (error) {
    results.errors.push(`Failed to read Markdown file: ${error.message}`);
  }

  return results;
}

/**
 * Test HTML documentation files
 * @param {string} dirPath - Path to documentation directory
 * @returns {Object} Test results
 */
function testHtmlDocs(dirPath) {
  const results = {
    index: { exists: false, size: 0, hasTitle: false, hasLinks: false },
    swagger: { exists: false, size: 0, hasSwaggerUI: false, hasSpec: false },
    redoc: { exists: false, size: 0, hasRedoc: false, hasSpec: false },
    errors: []
  };

  try {
    // Test index.html
    const indexPath = path.join(dirPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      results.index.exists = true;
      results.index.size = fs.statSync(indexPath).size;
      const indexContent = fs.readFileSync(indexPath, 'utf8');
      results.index.hasTitle = indexContent.includes('UpGuard CyberRisk MCP Server');
      results.index.hasLinks = indexContent.includes('swagger.html') && indexContent.includes('redoc.html');
    } else {
      results.errors.push('index.html does not exist');
    }

    // Test swagger.html
    const swaggerPath = path.join(dirPath, 'swagger.html');
    if (fs.existsSync(swaggerPath)) {
      results.swagger.exists = true;
      results.swagger.size = fs.statSync(swaggerPath).size;
      const swaggerContent = fs.readFileSync(swaggerPath, 'utf8');
      results.swagger.hasSwaggerUI = swaggerContent.includes('SwaggerUIBundle');
      results.swagger.hasSpec = swaggerContent.includes('./openapi.json');
    } else {
      results.errors.push('swagger.html does not exist');
    }

    // Test redoc.html
    const redocPath = path.join(dirPath, 'redoc.html');
    if (fs.existsSync(redocPath)) {
      results.redoc.exists = true;
      results.redoc.size = fs.statSync(redocPath).size;
      const redocContent = fs.readFileSync(redocPath, 'utf8');
      results.redoc.hasRedoc = redocContent.includes('<redoc');
      results.redoc.hasSpec = redocContent.includes('./openapi.json');
    } else {
      results.errors.push('redoc.html does not exist');
    }

  } catch (error) {
    results.errors.push(`Failed to test HTML files: ${error.message}`);
  }

  return results;
}

/**
 * Test extracted tools data
 * @param {string} filePath - Path to extracted tools file
 * @returns {Object} Test results
 */
function testExtractedTools(filePath) {
  const results = {
    exists: false,
    valid: false,
    totalTools: 0,
    totalSchemas: 0,
    categories: 0,
    toolsWithSchemas: 0,
    errors: []
  };

  try {
    if (!fs.existsSync(filePath)) {
      results.errors.push('Extracted tools file does not exist');
      return results;
    }

    results.exists = true;
    const content = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(content);

    results.totalTools = data.totalTools || 0;
    results.totalSchemas = data.totalSchemas || 0;
    results.categories = data.categories ? data.categories.length : 0;
    
    if (data.tools) {
      results.toolsWithSchemas = data.tools.filter(t => 
        t.inputSchema && t.inputSchema.schemaReferences && t.inputSchema.schemaReferences.length > 0
      ).length;
    }

    if (!data.extractedAt) results.errors.push('Missing extraction timestamp');
    if (!data.tools || !Array.isArray(data.tools)) results.errors.push('Missing or invalid tools array');
    if (!data.schemaDefinitions) results.errors.push('Missing schema definitions');

    results.valid = results.errors.length === 0;

  } catch (error) {
    results.errors.push(`Failed to parse extracted tools: ${error.message}`);
  }

  return results;
}

/**
 * Run comprehensive documentation tests
 */
async function runTests() {
  console.log('🧪 Running Documentation Tests...\n');

  const docsDir = path.resolve(__dirname, '../docs');
  const generatedDir = path.join(docsDir, 'generated');
  
  // Test extracted tools
  console.log('📊 Testing Extracted Tools Data...');
  const extractedToolsPath = path.join(docsDir, 'extracted-tools.json');
  const extractedResults = testExtractedTools(extractedToolsPath);
  
  if (extractedResults.exists) {
    console.log(`   ✅ File exists (${extractedResults.totalTools} tools, ${extractedResults.totalSchemas} schemas)`);
    console.log(`   📂 Categories: ${extractedResults.categories}`);
    console.log(`   🔗 Tools with schemas: ${extractedResults.toolsWithSchemas}`);
  } else {
    console.log('   ❌ File missing');
  }
  
  if (extractedResults.errors.length > 0) {
    console.log('   ⚠️  Errors:', extractedResults.errors.join(', '));
  }

  // Test OpenAPI specification
  console.log('\n🔧 Testing OpenAPI Specification...');
  const openApiPath = path.join(generatedDir, 'openapi.json');
  const openApiResults = testOpenApiSpec(openApiPath);
  
  if (openApiResults.exists) {
    console.log(`   ✅ File exists (${(openApiResults.size / 1024).toFixed(1)}KB)`);
    console.log(`   🛣️  Paths: ${openApiResults.paths}`);
    console.log(`   📋 Schemas: ${openApiResults.schemas}`);
    console.log(`   ${openApiResults.valid ? '✅' : '❌'} Valid OpenAPI spec`);
  } else {
    console.log('   ❌ File missing');
  }
  
  if (openApiResults.errors.length > 0) {
    console.log('   ⚠️  Errors:', openApiResults.errors.join(', '));
  }

  // Test Markdown documentation
  console.log('\n📖 Testing Markdown Documentation...');
  const markdownPath = path.join(generatedDir, 'API.md');
  const markdownResults = testMarkdownDoc(markdownPath);
  
  if (markdownResults.exists) {
    console.log(`   ✅ File exists (${(markdownResults.size / 1024).toFixed(1)}KB, ${markdownResults.lines} lines)`);
    console.log(`   ${markdownResults.hasTitle ? '✅' : '❌'} Has title`);
    console.log(`   ${markdownResults.hasAuth ? '✅' : '❌'} Has authentication section`);
    console.log(`   ${markdownResults.hasEndpoints ? '✅' : '❌'} Has endpoint documentation`);
  } else {
    console.log('   ❌ File missing');
  }
  
  if (markdownResults.errors.length > 0) {
    console.log('   ⚠️  Errors:', markdownResults.errors.join(', '));
  }

  // Test HTML documentation
  console.log('\n🌐 Testing HTML Documentation...');
  const htmlResults = testHtmlDocs(generatedDir);
  
  console.log('   📊 Index Page:');
  console.log(`     ${htmlResults.index.exists ? '✅' : '❌'} File exists`);
  if (htmlResults.index.exists) {
    console.log(`     ${htmlResults.index.hasTitle ? '✅' : '❌'} Has title`);
    console.log(`     ${htmlResults.index.hasLinks ? '✅' : '❌'} Has navigation links`);
  }
  
  console.log('   🚀 Swagger UI:');
  console.log(`     ${htmlResults.swagger.exists ? '✅' : '❌'} File exists`);
  if (htmlResults.swagger.exists) {
    console.log(`     ${htmlResults.swagger.hasSwaggerUI ? '✅' : '❌'} Has Swagger UI integration`);
    console.log(`     ${htmlResults.swagger.hasSpec ? '✅' : '❌'} References OpenAPI spec`);
  }
  
  console.log('   📚 Redoc:');
  console.log(`     ${htmlResults.redoc.exists ? '✅' : '❌'} File exists`);
  if (htmlResults.redoc.exists) {
    console.log(`     ${htmlResults.redoc.hasRedoc ? '✅' : '❌'} Has Redoc integration`);
    console.log(`     ${htmlResults.redoc.hasSpec ? '✅' : '❌'} References OpenAPI spec`);
  }
  
  if (htmlResults.errors.length > 0) {
    console.log('   ⚠️  Errors:', htmlResults.errors.join(', '));
  }

  // Summary
  console.log('\n📋 Test Summary:');
  const allErrors = [
    ...extractedResults.errors,
    ...openApiResults.errors,
    ...markdownResults.errors,
    ...htmlResults.errors
  ];
  
  if (allErrors.length === 0) {
    console.log('   🎉 All tests passed! Documentation is ready for deployment.');
  } else {
    console.log(`   ⚠️  ${allErrors.length} issues found:`);
    allErrors.forEach(error => console.log(`     - ${error}`));
  }

  // File sizes summary
  console.log('\n📊 File Sizes:');
  if (extractedResults.exists) {
    const extractedSize = fs.statSync(extractedToolsPath).size;
    console.log(`   📄 extracted-tools.json: ${(extractedSize / 1024).toFixed(1)}KB`);
  }
  if (openApiResults.exists) {
    console.log(`   🔧 openapi.json: ${(openApiResults.size / 1024).toFixed(1)}KB`);
  }
  if (markdownResults.exists) {
    console.log(`   📖 API.md: ${(markdownResults.size / 1024).toFixed(1)}KB`);
  }
  if (htmlResults.index.exists) {
    console.log(`   📊 index.html: ${(htmlResults.index.size / 1024).toFixed(1)}KB`);
  }
  if (htmlResults.swagger.exists) {
    console.log(`   🚀 swagger.html: ${(htmlResults.swagger.size / 1024).toFixed(1)}KB`);
  }
  if (htmlResults.redoc.exists) {
    console.log(`   📚 redoc.html: ${(htmlResults.redoc.size / 1024).toFixed(1)}KB`);
  }

  console.log('\n🌐 To view the documentation:');
  console.log(`   📊 Documentation Hub: file://${path.resolve(generatedDir, 'index.html')}`);
  console.log(`   🚀 Swagger UI: file://${path.resolve(generatedDir, 'swagger.html')}`);
  console.log(`   📚 Redoc: file://${path.resolve(generatedDir, 'redoc.html')}`);
  console.log(`   📖 Markdown: ${path.resolve(generatedDir, 'API.md')}`);
}

// Run tests if called directly
if (require.main === module) {
  runTests().catch(error => {
    logger.error('Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = { 
  testOpenApiSpec, 
  testMarkdownDoc, 
  testHtmlDocs, 
  testExtractedTools, 
  runTests 
}; 