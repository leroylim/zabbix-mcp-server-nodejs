const { logger } = require('./logger');

/**
 * Retry utility with exponential backoff
 */
class RetryPolicy {
    constructor(options = {}) {
        this.maxAttempts = options.maxAttempts || 3;
        this.baseDelay = options.baseDelay || 1000;
        this.maxDelay = options.maxDelay || 30000;
        this.backoffFactor = options.backoffFactor || 2;
        this.retryableErrors = options.retryableErrors || ['ECONNRESET', 'ENOTFOUND', 'ECONNREFUSED', 'ETIMEDOUT'];
        this.retryableStatusCodes = options.retryableStatusCodes || [429, 500, 502, 503, 504];
    }

    async execute(fn, context = '') {
        let lastError;

        for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
            try {
                const result = await fn();
                if (attempt > 1) {
                    logger.info(`Operation ${context} succeeded on attempt ${attempt}`);
                }
                return result;
            } catch (error) {
                lastError = error;

                if (!this.shouldRetry(error, attempt)) {
                    break;
                }

                const delay = this.calculateDelay(attempt);
                logger.warn(`Operation ${context} failed on attempt ${attempt}/${this.maxAttempts}. Retrying in ${delay}ms`, {
                    error: error.message,
                    attempt,
                    delay
                });

                await this.sleep(delay);
            }
        }

        logger.error(`Operation ${context} failed after ${this.maxAttempts} attempts`, {
            error: lastError.message,
            stack: lastError.stack
        });
        throw lastError;
    }

    shouldRetry(error, attempt) {
        if (attempt >= this.maxAttempts) {
            return false;
        }

        // Check for retryable error codes
        if (error.code && this.retryableErrors.includes(error.code)) {
            return true;
        }

        // Check for retryable HTTP status codes
        if (error.response?.status && this.retryableStatusCodes.includes(error.response.status)) {
            return true;
        }

        // Check for rate limiting
        if (error.message?.includes('rate limit') || error.message?.includes('Rate limit')) {
            return true;
        }

        return false;
    }

    calculateDelay(attempt) {
        const delay = this.baseDelay * Math.pow(this.backoffFactor, attempt - 1);
        return Math.min(delay, this.maxDelay);
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

/**
 * Circuit Breaker Pattern Implementation
 */
class CircuitBreaker {
    constructor(options = {}) {
        this.failureThreshold = options.failureThreshold || 5;
        this.recoveryTimeout = options.recoveryTimeout || 60000;
        this.monitoringPeriod = options.monitoringPeriod || 10000;
        
        this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
        this.failureCount = 0;
        this.lastFailureTime = null;
        this.successCount = 0;
    }

    async execute(fn, context = '') {
        if (this.state === 'OPEN') {
            if (Date.now() - this.lastFailureTime >= this.recoveryTimeout) {
                this.state = 'HALF_OPEN';
                this.successCount = 0;
                logger.info(`Circuit breaker ${context} entering HALF_OPEN state`);
            } else {
                throw new Error(`Circuit breaker ${context} is OPEN. Service unavailable.`);
            }
        }

        try {
            const result = await fn();
            this.onSuccess(context);
            return result;
        } catch (error) {
            this.onFailure(context);
            throw error;
        }
    }

    onSuccess(context) {
        this.failureCount = 0;
        
        if (this.state === 'HALF_OPEN') {
            this.successCount++;
            if (this.successCount >= 3) { // Require 3 successful calls to close
                this.state = 'CLOSED';
                logger.info(`Circuit breaker ${context} is now CLOSED`);
            }
        }
    }

    onFailure(context) {
        this.failureCount++;
        this.lastFailureTime = Date.now();

        if (this.state === 'HALF_OPEN') {
            this.state = 'OPEN';
            logger.warn(`Circuit breaker ${context} is now OPEN`);
        } else if (this.failureCount >= this.failureThreshold) {
            this.state = 'OPEN';
            logger.warn(`Circuit breaker ${context} tripped OPEN after ${this.failureCount} failures`);
        }
    }

    getState() {
        return {
            state: this.state,
            failureCount: this.failureCount,
            lastFailureTime: this.lastFailureTime
        };
    }
}

// Create default instances
const defaultRetryPolicy = new RetryPolicy();
const upguardApiCircuitBreaker = new CircuitBreaker({
    failureThreshold: 5,
    recoveryTimeout: 60000
});

/**
 * Convenience function to wrap API calls with retry and circuit breaker
 */
async function withResilience(fn, options = {}) {
    const retryPolicy = options.retryPolicy || defaultRetryPolicy;
    const circuitBreaker = options.circuitBreaker || upguardApiCircuitBreaker;
    const context = options.context || 'API call';

    return await circuitBreaker.execute(async () => {
        return await retryPolicy.execute(fn, context);
    }, context);
}

module.exports = {
    RetryPolicy,
    CircuitBreaker,
    defaultRetryPolicy,
    upguardApiCircuitBreaker,
    withResilience
}; 
