class UpGuardError extends Error {
    constructor(message, code, details = {}) {
        super(message);
        this.name = this.constructor.name;
        this.code = code;
        this.details = details;
        Error.captureStackTrace(this, this.constructor);
    }
}

class ValidationError extends UpGuardError {
    constructor(message, details = {}) {
        super(message, 'VALIDATION_ERROR', details);
    }
}

class RateLimitError extends UpGuardError {
    constructor(message, details = {}) {
        super(message, 'RATE_LIMIT_ERROR', details);
    }
}

class ApiError extends UpGuardError {
    constructor(message, statusCode, details = {}) {
        super(message, 'API_ERROR', { ...details, statusCode });
    }
}

class ConfigurationError extends UpGuardError {
    constructor(message, details = {}) {
        super(message, 'CONFIGURATION_ERROR', details);
    }
}

class AuthenticationError extends UpGuardError {
    constructor(message, details = {}) {
        super(message, 'AUTHENTICATION_ERROR', details);
    }
}

// Error handler function
function handleError(error) {
    if (error instanceof UpGuardError) {
        return {
            code: error.code,
            message: error.message,
            details: error.details
        };
    }

    // Handle unknown errors
    return {
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred',
        details: {
            originalError: error.message
        }
    };
}

// Validation helper
function validateConfig(config, requiredFields) {
    const missing = requiredFields.filter(field => !(field in config));
    if (missing.length > 0) {
        throw new ConfigurationError('Missing required configuration fields', {
            missingFields: missing
        });
    }
}

// API error helper
function handleApiResponse(response) {
    if (response.status >= 400) {
        throw new ApiError(
            response.data?.message || 'API request failed',
            response.status,
            {
                endpoint: response.config?.url,
                method: response.config?.method,
                response: response.data
            }
        );
    }
    return response;
}

module.exports = {
    UpGuardError,
    ValidationError,
    RateLimitError,
    ApiError,
    ConfigurationError,
    AuthenticationError,
    handleError,
    validateConfig,
    handleApiResponse
}; 
