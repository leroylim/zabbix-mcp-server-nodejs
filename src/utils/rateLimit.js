const { logger } = require('./logger');

class RateLimiter {
    constructor(windowMs = 60000, maxRequests = 100) {
        this.windowMs = windowMs;
        this.maxRequests = maxRequests;
        this.requests = new Map();
    }

    isRateLimited(key) {
        const now = Date.now();
        const windowStart = now - this.windowMs;
        
        // Clean old entries
        if (this.requests.has(key)) {
            this.requests.get(key).timestamps = this.requests.get(key).timestamps.filter(
                timestamp => timestamp > windowStart
            );
        }

        // Get or initialize request count
        const requestData = this.requests.get(key) || { timestamps: [] };
        
        // Check if rate limited
        if (requestData.timestamps.length >= this.maxRequests) {
            logger.warn(`Rate limit exceeded for ${key}`);
            return true;
        }

        // Add new request
        requestData.timestamps.push(now);
        this.requests.set(key, requestData);
        return false;
    }

    getRemainingRequests(key) {
        const requestData = this.requests.get(key);
        if (!requestData) return this.maxRequests;
        
        const windowStart = Date.now() - this.windowMs;
        const validRequests = requestData.timestamps.filter(timestamp => timestamp > windowStart);
        return Math.max(0, this.maxRequests - validRequests.length);
    }
}

// Create different rate limiters for various operations
const rateLimiters = {
    default: new RateLimiter(60000, 100),  // 100 requests per minute
    risksApi: new RateLimiter(60000, 50),  // 50 requests per minute for risk-related endpoints
    vendorsApi: new RateLimiter(60000, 30), // 30 requests per minute for vendor-related endpoints
    reportsApi: new RateLimiter(300000, 10) // 10 requests per 5 minutes for report generation
};

module.exports = rateLimiters; 
