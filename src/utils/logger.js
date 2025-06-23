/**
 * UpGuard CyberRisk MCP Server - Logger Utility
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

class Logger {
    constructor() {
        // Bind all methods to ensure they work correctly when passed as references
        this.error = this.error.bind(this);
        this.warn = this.warn.bind(this);
        this.info = this.info.bind(this);
        this.debug = this.debug.bind(this);
        this.http = this.http.bind(this);
    }

    error(...args) {
        process.stderr.write(`[ERROR] ${args.join(' ')}\n`);
    }

    warn(...args) {
        process.stderr.write(`[WARN] ${args.join(' ')}\n`);
    }

    info(...args) {
        process.stderr.write(`[INFO] ${args.join(' ')}\n`);
    }

    debug(...args) {
        process.stderr.write(`[DEBUG] ${args.join(' ')}\n`);
    }

    http(...args) {
        process.stderr.write(`[HTTP] ${args.join(' ')}\n`);
    }
}

// Create a single instance of the logger
const logger = new Logger();

// Request logging middleware
const requestLogger = (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.http(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
    });
    next();
};

// Error logging middleware
const errorLogger = (err, req, res, next) => {
    logger.error('Unhandled Error:', err.message);
    if (err.stack) {
        logger.error('Stack:', err.stack);
    }
    next(err);
};

// Helper methods
const logApiCall = (method, endpoint, _params, _response) => {
    logger.debug(`API Call - ${method} ${endpoint}`);
};

const logToolExecution = (toolName, _args, _result) => {
    logger.info(`Tool Execution: ${toolName}`);
};

const logPerformance = (operation, duration) => {
    logger.debug(`Performance: ${operation} - ${duration}ms`);
};

// Export the logger instance and helper functions
module.exports = {
    logger,
    requestLogger,
    errorLogger,
    logApiCall,
    logToolExecution,
    logPerformance
}; 
