const { logger } = require('./logger');

/**
 * Enhanced in-memory cache with TTL, LRU eviction, and statistics
 */
class EnhancedCache {
    constructor(options = {}) {
        this.maxSize = options.maxSize || 1000;
        this.defaultTtl = options.defaultTtl || 300000; // 5 minutes
        this.cleanupInterval = options.cleanupInterval || 60000; // 1 minute
        
        this.cache = new Map();
        this.accessOrder = new Map(); // For LRU tracking
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0,
            evictions: 0,
            cleanups: 0
        };

        // Only start cleanup timer if not in test environment
        if (process.env.NODE_ENV !== 'test') {
            this.cleanupTimer = setInterval(() => this.cleanup(), this.cleanupInterval);
        }
    }

    set(key, value, ttl = null) {
        const expiresAt = Date.now() + (ttl || this.defaultTtl);
        
        // Remove existing entry if it exists
        if (this.cache.has(key)) {
            this.cache.delete(key);
            this.accessOrder.delete(key);
        }

        // Check if we need to evict LRU items
        while (this.cache.size >= this.maxSize) {
            this.evictLRU();
        }

        // Add new entry
        this.cache.set(key, { value, expiresAt });
        this.accessOrder.set(key, Date.now());
        this.stats.sets++;

        logger.debug(`Cache SET: ${key}`, { ttl: ttl || this.defaultTtl });
    }

    get(key) {
        const entry = this.cache.get(key);
        
        if (!entry) {
            this.stats.misses++;
            logger.debug(`Cache MISS: ${key}`);
            return null;
        }

        // Check if expired
        if (Date.now() > entry.expiresAt) {
            this.delete(key);
            this.stats.misses++;
            logger.debug(`Cache EXPIRED: ${key}`);
            return null;
        }

        // Update access order for LRU
        this.accessOrder.set(key, Date.now());
        this.stats.hits++;
        
        logger.debug(`Cache HIT: ${key}`);
        return entry.value;
    }

    delete(key) {
        const deleted = this.cache.delete(key);
        this.accessOrder.delete(key);
        
        if (deleted) {
            this.stats.deletes++;
            logger.debug(`Cache DELETE: ${key}`);
        }
        
        return deleted;
    }

    has(key) {
        const entry = this.cache.get(key);
        if (!entry) return false;
        
        // Check if expired
        if (Date.now() > entry.expiresAt) {
            this.delete(key);
            return false;
        }
        
        return true;
    }

    clear() {
        const size = this.cache.size;
        this.cache.clear();
        this.accessOrder.clear();
        logger.debug(`Cache cleared: ${size} entries removed`);
    }

    evictLRU() {
        // Find the least recently used item
        let lruKey = null;
        let lruTime = Infinity;
        
        for (const [key, accessTime] of this.accessOrder) {
            if (accessTime < lruTime) {
                lruTime = accessTime;
                lruKey = key;
            }
        }

        if (lruKey) {
            this.delete(lruKey);
            this.stats.evictions++;
            logger.debug(`Cache LRU eviction: ${lruKey}`);
        }
    }

    cleanup() {
        const now = Date.now();
        const expired = [];

        for (const [key, entry] of this.cache) {
            if (now > entry.expiresAt) {
                expired.push(key);
            }
        }

        expired.forEach(key => this.delete(key));
        
        if (expired.length > 0) {
            this.stats.cleanups++;
            logger.debug(`Cache cleanup: ${expired.length} expired entries removed`);
        }
    }

    getStats() {
        const hitRate = this.stats.hits + this.stats.misses > 0 
            ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2)
            : 0;

        return {
            ...this.stats,
            hitRate: `${hitRate}%`,
            size: this.cache.size,
            maxSize: this.maxSize
        };
    }

    destroy() {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = null;
        }
        this.clear();
    }
}

/**
 * Cache wrapper for API responses with smart key generation
 */
class APICache extends EnhancedCache {
    constructor(options = {}) {
        super({
            maxSize: 500,
            defaultTtl: 300000, // 5 minutes for API responses
            ...options
        });
    }

    generateKey(endpoint, params = {}) {
        // Create a deterministic key from endpoint and parameters
        const sortedParams = Object.keys(params)
            .sort()
            .reduce((result, key) => {
                result[key] = params[key];
                return result;
            }, {});
        
        return `${endpoint}:${JSON.stringify(sortedParams)}`;
    }

    cacheApiCall(endpoint, params, fn, ttl = null) {
        const key = this.generateKey(endpoint, params);
        
        // Try to get from cache first
        const cached = this.get(key);
        if (cached !== null) {
            return Promise.resolve(cached);
        }

        // Execute the function and cache the result
        return fn().then(result => {
            this.set(key, result, ttl);
            return result;
        });
    }
}

// Create cache instances for different use cases
const generalCache = new EnhancedCache({
    maxSize: 1000,
    defaultTtl: 300000 // 5 minutes
});

const apiCache = new APICache({
    maxSize: 500,
    defaultTtl: 300000 // 5 minutes for API responses
});

const risksCache = new APICache({
    maxSize: 200,
    defaultTtl: 600000 // 10 minutes for risks (more stable data)
});

const vendorsCache = new APICache({
    maxSize: 300,
    defaultTtl: 180000 // 3 minutes for vendors (more dynamic)
});

// Graceful shutdown - only attach in non-test environments
if (process.env.NODE_ENV !== 'test') {
    process.on('SIGINT', () => {
        logger.debug('Destroying caches...');
        generalCache.destroy();
        apiCache.destroy();
        risksCache.destroy();
        vendorsCache.destroy();
    });
}

module.exports = {
    EnhancedCache,
    APICache,
    generalCache,
    apiCache,
    risksCache,
    vendorsCache
}; 
