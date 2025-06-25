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

    // Enhanced handling for zabbix-utils library errors
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

    // Enhanced error parsing for detailed API errors
    let enhancedMessage = error.message || 'Unknown error';
    let errorDetails = {
        method,
        params: Object.keys(params).length > 0 ? params : undefined,
        originalError: error.message,
        stack: error.stack
    };

    // Extract detailed error information from various error formats
    if (error.response && error.response.data) {
        errorDetails.apiResponse = error.response.data;
        if (error.response.data.error) {
            enhancedMessage = `${error.response.data.error.message || enhancedMessage} (Code: ${error.response.data.error.code || 'unknown'})`;
            errorDetails.apiErrorCode = error.response.data.error.code;
            errorDetails.apiErrorData = error.response.data.error.data;
        }
    }

    // Handle zabbix-utils specific error structure
    if (error.error) {
        enhancedMessage = error.error.message || enhancedMessage;
        errorDetails.apiErrorCode = error.error.code;
        errorDetails.apiErrorData = error.error.data;
    }

    // Handle axios/HTTP errors
    if (error.response) {
        errorDetails.httpStatus = error.response.status;
        errorDetails.httpStatusText = error.response.statusText;
    }

    // Parse JSON error responses if they exist
    if (typeof error.message === 'string') {
        try {
            const parsed = JSON.parse(error.message);
            if (parsed.error) {
                enhancedMessage = `${parsed.error.message || enhancedMessage} (Code: ${parsed.error.code || 'unknown'})`;
                errorDetails.apiErrorCode = parsed.error.code;
                errorDetails.apiErrorData = parsed.error.data;
            }
        } catch (parseError) {
            // Not JSON, continue with original message
        }
    }

    // Handle unknown errors with enhanced context
    return {
        code: 'ZABBIX_API_ERROR',
        message: `Error in ${method}: ${enhancedMessage}`,
        details: errorDetails
    };
}

module.exports = {
    ZabbixError,
    ZabbixApiError,
    handleZabbixError
}; 
