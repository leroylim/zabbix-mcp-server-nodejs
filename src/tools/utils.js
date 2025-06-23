const { logger } = require('../utils/logger');

/**
 * Creates a formatted response for tool output
 * @param {any} result - The result from the API call
 * @param {Object} options - Additional options for response formatting
 * @returns {Object} Formatted response object
 */
function createToolResponse(result, options = {}) {
    const {
        format = 'json',
        includeTimestamp = true,
        maxLength = 10000
    } = options;

    if (!result) {
        return {
            content: [{
                type: 'text',
                text: 'Operation completed successfully (no content returned).'
            }]
        };
    }

    if (result.type === 'binary_content') {
        return {
            content: [{
                type: 'text',
                text: `Binary content received:
• Type: ${result.contentType}
• Size: ${formatBytes(result.length)}
• Preview: ${result.dataPreview}`
            }]
        };
    }

    let formattedText;
    if (format === 'json') {
        formattedText = JSON.stringify(result, null, 2);
    } else if (format === 'table' && Array.isArray(result)) {
        formattedText = formatAsTable(result);
    } else {
        formattedText = String(result);
    }

    // Truncate if too long
    if (formattedText.length > maxLength) {
        formattedText = `${formattedText.substring(0, maxLength)  }\n... (truncated)`;
    }

    const timestamp = includeTimestamp ? `[${new Date().toISOString()}] ` : '';
    return {
        content: [{
            type: 'text',
            text: timestamp + formattedText
        }]
    };
}

/**
 * Creates a formatted error response
 * @param {Error} error - The error object
 * @param {string} operationName - Name of the operation that failed
 * @returns {Object} Formatted error response object
 */
function createErrorResponse(error, operationName) {
    logger.error(`Error in ${operationName}:`, error);

    const errorDetails = {
        message: error.message,
        code: error.code || 'UNKNOWN_ERROR',
        operation: operationName
    };

    if (error.response?.data) {
        errorDetails.apiError = error.response.data;
    }

    if (process.env.NODE_ENV === 'development') {
        errorDetails.stack = error.stack;
    }

    return {
        content: [{
            type: 'text',
            text: `Error performing ${operationName}:
• Message: ${error.message}
• Code: ${errorDetails.code}
${error.response?.data ? `• API Error: ${JSON.stringify(error.response.data, null, 2)}` : ''}`
        }],
        isError: true,
        errorDetails
    };
}

/**
 * Formats byte size into human readable format
 * @param {number} bytes - Number of bytes
 * @returns {string} Formatted size string
 */
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))  } ${  sizes[i]}`;
}

/**
 * Formats an array of objects as an ASCII table
 * @param {Array<Object>} data - Array of objects to format
 * @returns {string} Formatted table string
 */
function formatAsTable(data) {
    if (!data.length) return 'No data';

    // Get all unique columns
    const columns = [...new Set(data.flatMap(Object.keys))];
    
    // Calculate column widths
    const widths = columns.map(col => {
        const maxWidth = Math.max(
            col.length,
            ...data.map(row => String(row[col] || '').length)
        );
        return Math.min(maxWidth, 40); // Cap width at 40 chars
    });

    // Create header
    const header = columns.map((col, i) => col.padEnd(widths[i])).join(' | ');
    const separator = widths.map(w => '-'.repeat(w)).join('-+-');

    // Create rows
    const rows = data.map(row =>
        columns.map((col, i) => 
            String(row[col] || '').padEnd(widths[i])
        ).join(' | ')
    );

    return [header, separator, ...rows].join('\n');
}

module.exports = {
    createToolResponse,
    createErrorResponse,
    formatBytes,
    formatAsTable
}; 


