# UpGuard CyberRisk MCP Server Documentation

This directory contains documentation for the UpGuard CyberRisk MCP Server project.

## Documentation Structure

```
docs/
├── README.md                 # This file - documentation overview
├── quick-start.md           # Quick start guide for users
├── generated/               # Auto-generated API documentation
│   ├── openapi.json        # OpenAPI 3.0 specification
│   └── API.md              # Markdown API documentation
└── ...                     # Other documentation files
```

## Generating Documentation

The project includes an automated documentation generator that creates OpenAPI specifications and Markdown documentation from the MCP server's tool definitions.

### Available Commands

```bash
# Generate documentation
npm run docs:generate

# Clean generated documentation
npm run docs:clean

# Clean and regenerate documentation
npm run docs:build
```

### Generated Files

The documentation generator creates the following files in `docs/generated/`:

- **`openapi.json`** - Complete OpenAPI 3.0 specification that can be used with tools like:
  - [Swagger UI](https://swagger.io/tools/swagger-ui/)
  - [Redoc](https://redocly.github.io/redoc/)
  - [Postman](https://www.postman.com/)
  - API testing tools

- **`API.md`** - Human-readable Markdown documentation with:
  - Tool descriptions organized by category
  - Request/response examples
  - Authentication information
  - Complete API reference

### Documentation Features

The generated documentation includes:

- ✅ **Complete API Reference** - All MCP tools documented as REST endpoints
- ✅ **Categorized Tools** - Tools grouped by functionality (Risk Management, Vendor Management, etc.)
- ✅ **Authentication Details** - API key authentication requirements
- ✅ **Request/Response Examples** - JSON examples for all endpoints
- ✅ **Schema Validation** - Zod schema conversion to OpenAPI schemas
- ✅ **Health & Metrics Endpoints** - System monitoring endpoints
- ✅ **MIT License Information** - Proper license attribution

### Tool Categories

The documentation automatically categorizes tools into:

- **Risk Management** - Risk assessment and monitoring tools
- **Vendor Management** - Vendor monitoring and questionnaire tools
- **Domain Management** - Domain analysis and monitoring tools
- **IP Management** - IP address analysis tools
- **Breach Monitoring** - Data breach and identity monitoring tools
- **Bulk Operations** - Bulk data processing tools
- **Report Generation** - Report export and generation tools
- **System** - Health checks and metrics endpoints

### Customizing Documentation

To customize the generated documentation:

1. **Update Tool Definitions** - Modify tool descriptions and schemas in the MCP server code
2. **Edit Generator Script** - Modify `scripts/generate-docs.js` to change:
   - Mock tool data (replace with actual tool definitions)
   - Schema definitions
   - Output formatting
3. **Update OpenAPI Info** - Modify the OpenAPI specification metadata in `src/utils/doc-generator.js`

### Integration with Development Workflow

The documentation generation is integrated into the development workflow:

- **Manual Generation** - Run `npm run docs:generate` when needed
- **Clean Builds** - Use `npm run docs:build` for fresh documentation
- **CI/CD Integration** - Can be added to GitHub Actions for automatic updates

### Viewing Generated Documentation

#### OpenAPI Specification
The `openapi.json` file can be used with various tools:

```bash
# Using Swagger UI (if installed globally)
swagger-ui-serve docs/generated/openapi.json

# Using online Swagger Editor
# Upload docs/generated/openapi.json to https://editor.swagger.io/
```

#### Markdown Documentation
The `API.md` file can be viewed:

- In any Markdown viewer
- On GitHub (automatically rendered)
- In VS Code with Markdown preview
- Converted to HTML using tools like `pandoc`

### Future Enhancements

Planned improvements for the documentation system:

- [ ] **Live Tool Integration** - Replace mock data with actual MCP server tool definitions
- [ ] **HTML Generation** - Add Redoc/Swagger UI HTML output
- [ ] **Interactive Examples** - Add runnable API examples
- [ ] **Schema Validation** - Enhanced Zod to OpenAPI schema conversion
- [ ] **Multi-format Export** - PDF, HTML, and other format support

## Contributing to Documentation

When contributing to the project:

1. **Update Tool Descriptions** - Ensure all tools have clear, helpful descriptions
2. **Regenerate Documentation** - Run `npm run docs:build` after changes
3. **Review Generated Output** - Check that documentation accurately reflects changes
4. **Update This README** - Keep documentation instructions current

## License

All documentation is licensed under the MIT License, consistent with the project license. 