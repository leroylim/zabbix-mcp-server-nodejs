// Jest setup file for common configuration and mocks

// Mock environment variables for testing
process.env.UPGUARD_API_KEY = process.env.UPGUARD_API_KEY || 'test-api-key-for-testing';
process.env.UPGUARD_API_URL = process.env.UPGUARD_API_URL || 'https://cyber-risk.upguard.com/api/public';
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';

// Global test timeout
jest.setTimeout(30000);

// Store original functions for cleanup
const originalSetInterval = global.setInterval;
const originalSetTimeout = global.setTimeout;
const activeTimers = new Set();

// Track timers to ensure proper cleanup
global.setInterval = (fn, delay, ...args) => {
    const timer = originalSetInterval(fn, delay, ...args);
    activeTimers.add(timer);
    return timer;
};

global.setTimeout = (fn, delay, ...args) => {
    const timer = originalSetTimeout(fn, delay, ...args);
    activeTimers.add(timer);
    return timer;
};

// Override clearInterval and clearTimeout to track cleanup
const originalClearInterval = global.clearInterval;
const originalClearTimeout = global.clearTimeout;

global.clearInterval = (timer) => {
    activeTimers.delete(timer);
    return originalClearInterval(timer);
};

global.clearTimeout = (timer) => {
    activeTimers.delete(timer);
    return originalClearTimeout(timer);
};

// Suppress console logs during tests unless explicitly needed
const originalConsoleError = console.error;
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;

beforeEach(() => {
    if (!process.env.VERBOSE_TESTS) {
        console.error = jest.fn();
        console.log = jest.fn();
        console.warn = jest.fn();
    }
});

afterEach(() => {
    console.error = originalConsoleError;
    console.log = originalConsoleLog;
    console.warn = originalConsoleWarn;
    
    // Clean up any remaining timers from this test
    activeTimers.forEach(timer => {
        clearInterval(timer);
        clearTimeout(timer);
    });
    activeTimers.clear();
});

// Global cleanup after all tests
afterAll(async () => {
    // Clean up any remaining timers
    activeTimers.forEach(timer => {
        clearInterval(timer);
        clearTimeout(timer);
    });
    activeTimers.clear();
    
    // Force garbage collection if available
    if (global.gc) {
        global.gc();
    }
    
    // Give time for cleanup
    await new Promise(resolve => setTimeout(resolve, 100));
}); 
