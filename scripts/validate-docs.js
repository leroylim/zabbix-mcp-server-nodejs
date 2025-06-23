/**
 * UpGuard CyberRisk MCP Server - Documentation Validation Script
 * 
 * This script validates documentation quality and completeness
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
 * Validate OpenAPI specification compliance
 * @param {string} filePath - Path to OpenAPI spec
 * @returns {Object} Validation results
 */
function validateOpenApiCompliance(filePath) {
  const results = {
    valid: true,
    score: 0,
    maxScore: 100,
    issues: [],
    recommendations: []
  };

  try {
    const spec = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // Check OpenAPI version (10 points)
    if (spec.openapi && spec.openapi.startsWith('3.')) {
      results.score += 10;
    } else {
      results.issues.push('Missing or invalid OpenAPI version');
    }
    
    // Check info section completeness (20 points)
    if (spec.info) {
      if (spec.info.title) results.score += 5;
      else results.issues.push('Missing API title');
      
      if (spec.info.version) results.score += 5;
      else results.issues.push('Missing API version');
      
      if (spec.info.description) results.score += 5;
      else results.issues.push('Missing API description');
      
      if (spec.info.contact) results.score += 3;
      else results.recommendations.push('Add contact information');
      
      if (spec.info.license) results.score += 2;
      else results.recommendations.push('Add license information');
    } else {
      results.issues.push('Missing info section');
    }
    
    // Check servers (10 points)
    if (spec.servers && spec.servers.length > 0) {
      results.score += 10;
    } else {
      results.issues.push('Missing server definitions');
    }
    
    // Check paths (30 points)
    if (spec.paths && Object.keys(spec.paths).length > 0) {
      results.score += 20;
      
      // Check for proper HTTP methods
      let hasProperMethods = false;
      for (const path of Object.values(spec.paths)) {
        if (path.get || path.post || path.put || path.delete) {
          hasProperMethods = true;
          break;
        }
      }
      if (hasProperMethods) results.score += 10;
      else results.issues.push('Paths missing proper HTTP methods');
    } else {
      results.issues.push('Missing API paths');
    }
    
    // Check components/schemas (20 points)
    if (spec.components && spec.components.schemas) {
      const schemaCount = Object.keys(spec.components.schemas).length;
      if (schemaCount > 0) {
        results.score += 15;
        if (schemaCount > 10) results.score += 5; // Bonus for comprehensive schemas
      }
    } else {
      results.recommendations.push('Add schema definitions for better API documentation');
    }
    
    // Check security schemes (10 points)
    if (spec.components && spec.components.securitySchemes) {
      results.score += 10;
    } else {
      results.recommendations.push('Add security scheme definitions');
    }
    
    results.valid = results.issues.length === 0;
    
  } catch (error) {
    results.valid = false;
    results.issues.push(`Failed to parse OpenAPI spec: ${error.message}`);
  }
  
  return results;
}

/**
 * Validate documentation coverage
 * @param {string} extractedToolsPath - Path to extracted tools
 * @returns {Object} Coverage results
 */
function validateDocumentationCoverage(extractedToolsPath) {
  const results = {
    coverage: 0,
    totalTools: 0,
    documentedTools: 0,
    toolsWithSchemas: 0,
    schemasCovered: 0,
    issues: [],
    recommendations: []
  };

  try {
    const data = JSON.parse(fs.readFileSync(extractedToolsPath, 'utf8'));
    
    results.totalTools = data.totalTools || 0;
    results.documentedTools = data.tools ? data.tools.length : 0;
    
    if (data.tools) {
      results.toolsWithSchemas = data.tools.filter(t => 
        t.inputSchema && t.inputSchema.schemaReferences && t.inputSchema.schemaReferences.length > 0
      ).length;
    }
    
    results.schemasCovered = data.totalSchemas || 0;
    
    // Calculate coverage percentage
    if (results.totalTools > 0) {
      results.coverage = Math.round((results.documentedTools / results.totalTools) * 100);
    }
    
    // Provide recommendations based on coverage
    if (results.coverage < 80) {
      results.recommendations.push('Increase documentation coverage to at least 80%');
    }
    
    if (results.toolsWithSchemas < results.totalTools * 0.7) {
      results.recommendations.push('Add schema definitions for more tools (target: 70%+)');
    }
    
    if (results.schemasCovered < 20) {
      results.recommendations.push('Expand schema definitions for better validation');
    }
    
  } catch (error) {
    results.issues.push(`Failed to analyze coverage: ${error.message}`);
  }
  
  return results;
}

/**
 * Validate documentation quality
 * @param {string} markdownPath - Path to markdown documentation
 * @returns {Object} Quality results
 */
function validateDocumentationQuality(markdownPath) {
  const results = {
    score: 0,
    maxScore: 100,
    issues: [],
    recommendations: []
  };

  try {
    const content = fs.readFileSync(markdownPath, 'utf8');
    const lines = content.split('\n');
    
    // Check for proper structure (30 points)
    if (content.includes('# ')) results.score += 10; // Has main title
    else results.issues.push('Missing main title');
    
    if (content.includes('## ')) results.score += 10; // Has sections
    else results.issues.push('Missing section headers');
    
    if (content.includes('### ')) results.score += 10; // Has subsections
    else results.issues.push('Missing subsection headers');
    
    // Check for authentication documentation (20 points)
    if (content.includes('Authentication') || content.includes('authorization')) {
      results.score += 20;
    } else {
      results.issues.push('Missing authentication documentation');
    }
    
    // Check for code examples (20 points)
    const codeBlocks = (content.match(/```/g) || []).length / 2;
    if (codeBlocks >= 5) {
      results.score += 20;
    } else if (codeBlocks >= 2) {
      results.score += 10;
      results.recommendations.push('Add more code examples');
    } else {
      results.issues.push('Insufficient code examples');
    }
    
    // Check for proper formatting (15 points)
    const hasLists = content.includes('- ') || content.includes('* ');
    const hasTables = content.includes('|');
    const hasLinks = content.includes('[') && content.includes('](');
    
    if (hasLists) results.score += 5;
    if (hasTables) results.score += 5;
    if (hasLinks) results.score += 5;
    
    if (!hasLists) results.recommendations.push('Add bullet points for better readability');
    if (!hasTables) results.recommendations.push('Consider adding tables for structured data');
    if (!hasLinks) results.recommendations.push('Add relevant links for better navigation');
    
    // Check documentation length (15 points)
    if (lines.length > 1000) {
      results.score += 15;
    } else if (lines.length > 500) {
      results.score += 10;
      results.recommendations.push('Expand documentation for better coverage');
    } else {
      results.issues.push('Documentation appears too brief');
    }
    
  } catch (error) {
    results.issues.push(`Failed to analyze documentation quality: ${error.message}`);
  }
  
  return results;
}

/**
 * Run comprehensive documentation validation
 */
async function runValidation() {
  console.log('🔍 Running Documentation Validation...\n');
  
  const docsDir = path.resolve(__dirname, '../docs');
  const generatedDir = path.join(docsDir, 'generated');
  
  let overallScore = 0;
  let maxOverallScore = 0;
  const allIssues = [];
  const allRecommendations = [];
  
  // Validate OpenAPI compliance
  console.log('📋 Validating OpenAPI Compliance...');
  const openApiPath = path.join(generatedDir, 'openapi.json');
  if (fs.existsSync(openApiPath)) {
    const openApiResults = validateOpenApiCompliance(openApiPath);
    console.log(`   Score: ${openApiResults.score}/${openApiResults.maxScore} (${Math.round(openApiResults.score/openApiResults.maxScore*100)}%)`);
    console.log(`   Status: ${openApiResults.valid ? '✅ Valid' : '❌ Issues found'}`);
    
    overallScore += openApiResults.score;
    maxOverallScore += openApiResults.maxScore;
    allIssues.push(...openApiResults.issues);
    allRecommendations.push(...openApiResults.recommendations);
  } else {
    console.log('   ❌ OpenAPI specification not found');
    allIssues.push('OpenAPI specification missing');
  }
  
  // Validate documentation coverage
  console.log('\n📊 Validating Documentation Coverage...');
  const extractedToolsPath = path.join(docsDir, 'extracted-tools.json');
  if (fs.existsSync(extractedToolsPath)) {
    const coverageResults = validateDocumentationCoverage(extractedToolsPath);
    console.log(`   Coverage: ${coverageResults.coverage}% (${coverageResults.documentedTools}/${coverageResults.totalTools} tools)`);
    console.log(`   Tools with schemas: ${coverageResults.toolsWithSchemas}`);
    console.log(`   Schema definitions: ${coverageResults.schemasCovered}`);
    
    allIssues.push(...coverageResults.issues);
    allRecommendations.push(...coverageResults.recommendations);
  } else {
    console.log('   ❌ Extracted tools data not found');
    allIssues.push('Extracted tools data missing');
  }
  
  // Validate documentation quality
  console.log('\n📖 Validating Documentation Quality...');
  const markdownPath = path.join(generatedDir, 'API.md');
  if (fs.existsSync(markdownPath)) {
    const qualityResults = validateDocumentationQuality(markdownPath);
    console.log(`   Quality Score: ${qualityResults.score}/${qualityResults.maxScore} (${Math.round(qualityResults.score/qualityResults.maxScore*100)}%)`);
    
    overallScore += qualityResults.score;
    maxOverallScore += qualityResults.maxScore;
    allIssues.push(...qualityResults.issues);
    allRecommendations.push(...qualityResults.recommendations);
  } else {
    console.log('   ❌ Markdown documentation not found');
    allIssues.push('Markdown documentation missing');
  }
  
  // Overall results
  const overallPercentage = maxOverallScore > 0 ? Math.round(overallScore/maxOverallScore*100) : 0;
  console.log('\n📋 Overall Validation Results:');
  console.log(`   Overall Score: ${overallScore}/${maxOverallScore} (${overallPercentage}%)`);
  
  if (overallPercentage >= 90) {
    console.log('   🎉 Excellent! Documentation quality is outstanding.');
  } else if (overallPercentage >= 80) {
    console.log('   ✅ Good! Documentation quality is solid.');
  } else if (overallPercentage >= 70) {
    console.log('   ⚠️  Fair. Documentation needs some improvements.');
  } else {
    console.log('   ❌ Poor. Documentation requires significant improvements.');
  }
  
  // Issues and recommendations
  if (allIssues.length > 0) {
    console.log('\n❌ Issues Found:');
    allIssues.forEach(issue => console.log(`   - ${issue}`));
  }
  
  if (allRecommendations.length > 0) {
    console.log('\n💡 Recommendations:');
    allRecommendations.forEach(rec => console.log(`   - ${rec}`));
  }
  
  if (allIssues.length === 0 && allRecommendations.length === 0) {
    console.log('\n🎉 Perfect! No issues or recommendations found.');
  }
  
  console.log('\n📈 Next Steps:');
  console.log('   1. Address any critical issues listed above');
  console.log('   2. Consider implementing recommendations for better quality');
  console.log('   3. Re-run validation after making improvements');
  console.log('   4. Aim for 90%+ overall score for production readiness');
}

// Run validation if called directly
if (require.main === module) {
  runValidation().catch(error => {
    logger.error('Validation failed:', error);
    process.exit(1);
  });
}

module.exports = { 
  validateOpenApiCompliance, 
  validateDocumentationCoverage, 
  validateDocumentationQuality, 
  runValidation 
}; 