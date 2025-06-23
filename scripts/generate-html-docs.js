/**
 * UpGuard CyberRisk MCP Server - HTML Documentation Generator
 * 
 * This script generates interactive HTML documentation using Swagger UI
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
 * Generate Swagger UI HTML documentation
 * @param {string} openApiSpecPath - Path to OpenAPI specification
 * @param {string} outputDir - Output directory for HTML files
 */
function generateSwaggerUI(openApiSpecPath, outputDir) {
  try {
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Read the OpenAPI spec
    const openApiSpec = JSON.parse(fs.readFileSync(openApiSpecPath, 'utf8'));
    
    // Create Swagger UI HTML
    const swaggerHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${openApiSpec.info.title} - Interactive API Documentation</title>
    <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.10.3/swagger-ui.css" />
    <link rel="icon" type="image/png" href="https://unpkg.com/swagger-ui-dist@5.10.3/favicon-32x32.png" sizes="32x32" />
    <style>
        html {
            box-sizing: border-box;
            overflow: -moz-scrollbars-vertical;
            overflow-y: scroll;
        }
        *, *:before, *:after {
            box-sizing: inherit;
        }
        body {
            margin:0;
            background: #fafafa;
        }
        .swagger-ui .topbar {
            background-color: #1f4e79;
        }
        .swagger-ui .topbar .download-url-wrapper {
            display: none;
        }
        .custom-header {
            background: linear-gradient(135deg, #1f4e79 0%, #2d5aa0 100%);
            color: white;
            padding: 20px;
            text-align: center;
            margin-bottom: 0;
        }
        .custom-header h1 {
            margin: 0;
            font-size: 2em;
            font-weight: 300;
        }
        .custom-header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
        }
        .stats-bar {
            background: #f8f9fa;
            border-bottom: 1px solid #e9ecef;
            padding: 15px;
            text-align: center;
            font-size: 14px;
            color: #6c757d;
        }
        .stats-bar .stat {
            display: inline-block;
            margin: 0 20px;
            font-weight: 500;
        }
        .stats-bar .stat-value {
            color: #1f4e79;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="custom-header">
        <h1>🛡️ ${openApiSpec.info.title}</h1>
        <p>${openApiSpec.info.description}</p>
        <p>Version ${openApiSpec.info.version} | <a href="${openApiSpec.info.contact?.url || '#'}" style="color: #87ceeb;">View on GitHub</a></p>
    </div>
    
    <div class="stats-bar">
        <span class="stat">📊 <span class="stat-value">${Object.keys(openApiSpec.paths || {}).length}</span> API Endpoints</span>
        <span class="stat">🔧 <span class="stat-value">${Object.keys(openApiSpec.components?.schemas || {}).length}</span> Schema Definitions</span>
        <span class="stat">📄 <span class="stat-value">${openApiSpec.info.license?.name || 'MIT'}</span> License</span>
    </div>

    <div id="swagger-ui"></div>

    <script src="https://unpkg.com/swagger-ui-dist@5.10.3/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@5.10.3/swagger-ui-standalone-preset.js"></script>
    <script>
        window.onload = function() {
            const ui = SwaggerUIBundle({
                url: './openapi.json',
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIStandalonePreset
                ],
                plugins: [
                    SwaggerUIBundle.plugins.DownloadUrl
                ],
                layout: "StandaloneLayout",
                defaultModelsExpandDepth: 1,
                defaultModelExpandDepth: 1,
                docExpansion: "list",
                filter: true,
                showExtensions: true,
                showCommonExtensions: true,
                tryItOutEnabled: true,
                requestInterceptor: function(request) {
                    // Add custom headers or modify requests here if needed
                    return request;
                },
                responseInterceptor: function(response) {
                    // Handle responses here if needed
                    return response;
                }
            });
        };
    </script>
</body>
</html>`;

    // Write Swagger UI HTML
    const swaggerPath = path.join(outputDir, 'swagger.html');
    fs.writeFileSync(swaggerPath, swaggerHtml);
    logger.info(`Swagger UI HTML generated: ${swaggerPath}`);

    // Copy OpenAPI spec to output directory
    const specOutputPath = path.join(outputDir, 'openapi.json');
    fs.copyFileSync(openApiSpecPath, specOutputPath);
    logger.info(`OpenAPI spec copied to: ${specOutputPath}`);

    return swaggerPath;

  } catch (error) {
    logger.error('Failed to generate Swagger UI:', error);
    throw error;
  }
}

/**
 * Generate Redoc HTML documentation
 * @param {string} openApiSpecPath - Path to OpenAPI specification
 * @param {string} outputDir - Output directory for HTML files
 */
function generateRedoc(openApiSpecPath, outputDir) {
  try {
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Read the OpenAPI spec
    const openApiSpec = JSON.parse(fs.readFileSync(openApiSpecPath, 'utf8'));
    
    // Create Redoc HTML
    const redocHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${openApiSpec.info.title} - API Documentation</title>
    <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet">
    <style>
        body {
            margin: 0;
            padding: 0;
        }
    </style>
</head>
<body>
    <redoc spec-url='./openapi.json'></redoc>
    <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
</body>
</html>`;

    // Write Redoc HTML
    const redocPath = path.join(outputDir, 'redoc.html');
    fs.writeFileSync(redocPath, redocHtml);
    logger.info(`Redoc HTML generated: ${redocPath}`);

    return redocPath;

  } catch (error) {
    logger.error('Failed to generate Redoc:', error);
    throw error;
  }
}

/**
 * Generate comprehensive index page
 * @param {string} outputDir - Output directory
 * @param {Object} stats - Documentation statistics
 */
function generateIndexPage(outputDir, stats) {
  const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>UpGuard CyberRisk MCP Server - Documentation Hub</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
            background: #f8f9fa;
        }
        .header {
            background: linear-gradient(135deg, #1f4e79 0%, #2d5aa0 100%);
            color: white;
            padding: 40px;
            border-radius: 12px;
            text-align: center;
            margin-bottom: 40px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        .header h1 {
            margin: 0;
            font-size: 2.5em;
            font-weight: 300;
        }
        .header p {
            margin: 15px 0 0 0;
            opacity: 0.9;
            font-size: 1.1em;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        .stat-card {
            background: white;
            padding: 25px;
            border-radius: 8px;
            text-align: center;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            border-left: 4px solid #1f4e79;
        }
        .stat-number {
            font-size: 2.5em;
            font-weight: bold;
            color: #1f4e79;
            margin: 0;
        }
        .stat-label {
            color: #6c757d;
            font-size: 0.9em;
            margin: 5px 0 0 0;
        }
        .docs-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 30px;
            margin: 40px 0;
        }
        .doc-card {
            background: white;
            border-radius: 12px;
            padding: 30px;
            text-decoration: none;
            color: inherit;
            transition: all 0.3s ease;
            box-shadow: 0 2px 15px rgba(0,0,0,0.1);
            border: 1px solid #e9ecef;
        }
        .doc-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 30px rgba(0,0,0,0.15);
        }
        .doc-icon {
            font-size: 3em;
            margin-bottom: 20px;
            display: block;
        }
        .doc-title {
            font-size: 1.4em;
            font-weight: bold;
            margin-bottom: 15px;
            color: #1f4e79;
        }
        .doc-desc {
            color: #6c757d;
            margin-bottom: 20px;
        }
        .doc-features {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        .doc-features li {
            padding: 5px 0;
            color: #28a745;
            font-size: 0.9em;
        }
        .doc-features li:before {
            content: "✓ ";
            font-weight: bold;
        }
        .footer {
            text-align: center;
            margin-top: 60px;
            padding: 30px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .footer a {
            color: #1f4e79;
            text-decoration: none;
            font-weight: 500;
        }
        .footer a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🛡️ UpGuard CyberRisk MCP Server</h1>
        <p>Model Context Protocol server for UpGuard CyberRisk API integration</p>
        <p>Comprehensive security risk assessment and management capabilities</p>
    </div>
    
    <div class="stats">
        <div class="stat-card">
            <div class="stat-number">${stats.totalTools || 67}</div>
            <div class="stat-label">API Tools</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${stats.totalCategories || 13}</div>
            <div class="stat-label">Categories</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${stats.totalSchemas || 22}</div>
            <div class="stat-label">Schema Definitions</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${stats.toolsWithSchemas || 54}</div>
            <div class="stat-label">Tools with Schemas</div>
        </div>
    </div>

    <div class="docs-grid">
        <a href="swagger.html" class="doc-card">
            <span class="doc-icon">🚀</span>
            <div class="doc-title">Interactive API Explorer</div>
            <div class="doc-desc">Swagger UI interface for testing and exploring the API endpoints</div>
            <ul class="doc-features">
                <li>Try out API calls directly</li>
                <li>Interactive request/response examples</li>
                <li>Built-in authentication support</li>
                <li>Real-time API testing</li>
            </ul>
        </a>
        
        <a href="redoc.html" class="doc-card">
            <span class="doc-icon">📚</span>
            <div class="doc-title">Beautiful API Documentation</div>
            <div class="doc-desc">Redoc-powered documentation with clean, professional layout</div>
            <ul class="doc-features">
                <li>Clean, readable interface</li>
                <li>Comprehensive schema documentation</li>
                <li>Code examples in multiple languages</li>
                <li>Mobile-responsive design</li>
            </ul>
        </a>
        
        <a href="API.md" class="doc-card">
            <span class="doc-icon">📖</span>
            <div class="doc-title">Markdown Documentation</div>
            <div class="doc-desc">Human-readable documentation with examples and guides</div>
            <ul class="doc-features">
                <li>Easy to read and navigate</li>
                <li>Copy-paste ready examples</li>
                <li>Authentication instructions</li>
                <li>Tool categorization</li>
            </ul>
        </a>
        
        <a href="openapi.json" class="doc-card">
            <span class="doc-icon">🔧</span>
            <div class="doc-title">OpenAPI Specification</div>
            <div class="doc-desc">Machine-readable API specification for tooling integration</div>
            <ul class="doc-features">
                <li>OpenAPI 3.0 compliant</li>
                <li>Import into Postman/Insomnia</li>
                <li>Generate client SDKs</li>
                <li>API validation and testing</li>
            </ul>
        </a>
    </div>
    
    <div class="footer">
        <p><strong>UpGuard CyberRisk MCP Server</strong> v1.2.0</p>
        <p>Licensed under <strong>MIT License</strong></p>
        <p><a href="https://github.com/leroylim/upguard-cyberrisk-mcp-server-nodejs">View on GitHub</a> | 
           <a href="https://github.com/leroylim/upguard-cyberrisk-mcp-server-nodejs/issues">Report Issues</a></p>
        <p style="margin-top: 20px; color: #6c757d; font-size: 0.9em;">
            Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
        </p>
    </div>
</body>
</html>`;

  const indexPath = path.join(outputDir, 'index.html');
  fs.writeFileSync(indexPath, indexHtml);
  logger.info(`Index page generated: ${indexPath}`);
  
  return indexPath;
}

/**
 * Main HTML generation function
 */
async function main() {
  try {
    logger.info('Starting HTML documentation generation...');
    
    const openApiSpecPath = path.resolve(__dirname, '../docs/generated/openapi.json');
    const outputDir = path.resolve(__dirname, '../docs/generated');
    
    if (!fs.existsSync(openApiSpecPath)) {
      logger.error('OpenAPI specification not found. Run npm run docs:generate first.');
      process.exit(1);
    }
    
    // Read stats from extracted tools
    const extractedToolsPath = path.resolve(__dirname, '../docs/extracted-tools.json');
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
    const swaggerPath = generateSwaggerUI(openApiSpecPath, outputDir);
    const redocPath = generateRedoc(openApiSpecPath, outputDir);
    const indexPath = generateIndexPage(outputDir, stats);
    
    console.log('\n🎉 HTML Documentation Generated Successfully!');
    console.log('\n📄 Generated Files:');
    console.log(`   📊 Documentation Hub: ${indexPath}`);
    console.log(`   🚀 Swagger UI: ${swaggerPath}`);
    console.log(`   📚 Redoc: ${redocPath}`);
    console.log('\n🌐 Open any of these files in your browser to view the documentation');
    
  } catch (error) {
    logger.error('HTML documentation generation failed:', error);
    process.exit(1);
  }
}

// Run generation if called directly
if (require.main === module) {
  main();
}

module.exports = { generateSwaggerUI, generateRedoc, generateIndexPage }; 