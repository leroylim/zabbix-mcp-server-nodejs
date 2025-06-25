class ZabbixError extends Error {
    constructor(message, code, details = {}) {
        super(message);
        this.name = this.constructor.name;
        this.code = code;
        this.details = details;
        Error.captureStackTrace(this, this.constructor);
    }
}

class ZabbixApiError extends ZabbixError {
    constructor(message, apiMethod, apiCode, apiData, requestId, details = {}) {
        const enhancedMessage = `Zabbix API Error (Method: ${apiMethod}${requestId ? `, ID: ${requestId}` : ''}): ${message}${apiData ? ` - ${apiData}` : ''} (Code: ${apiCode})`;
        super(enhancedMessage, 'ZABBIX_API_ERROR', {
            ...details,
            apiMethod,
            apiCode,
            apiData,
            requestId,
            originalMessage: message
        });
        this.apiMethod = apiMethod;
        this.apiCode = apiCode;
        this.apiData = apiData;
        this.requestId = requestId;
    }
}

// Enhanced Zabbix error handler function
function handleZabbixError(error, method = 'unknown', params = {}) {
    if (error instanceof ZabbixApiError) {
        return {
            code: error.code,
            message: error.message,
            details: {
                ...error.details,
                method,
                params: Object.keys(params).length > 0 ? params : undefined
            }
        };
    }

    if (error instanceof ZabbixError) {
        return {
            code: error.code,
            message: error.message,
            details: error.details
        };
    }

    // Handle zabbix-utils library errors (they may contain detailed API responses)
    if (error.message && error.message.includes('Zabbix API')) {
        return {
            code: 'ZABBIX_API_ERROR',
            message: error.message,
            details: {
                method,
                params: Object.keys(params).length > 0 ? params : undefined,
                originalError: error.message,
                stack: error.stack
            }
        };
    }

    // Handle unknown errors with enhanced context
    return {
        code: 'UNKNOWN_ERROR',
        message: `Error in ${method}: ${error.message}`,
        details: {
            method,
            params: Object.keys(params).length > 0 ? params : undefined,
            originalError: error.message,
            stack: error.stack
        }
    };
}

module.exports = {
    ZabbixError,
    ZabbixApiError,
    handleZabbixError
}; 
