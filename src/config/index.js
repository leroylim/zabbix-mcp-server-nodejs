require('dotenv').config();

const config = {
    api: {
        baseUrl: process.env.UPGUARD_API_URL || 'https://cyber-risk.upguard.com/api/public',
        key: process.env.UPGUARD_API_KEY,
        timeout: parseInt(process.env.UPGUARD_API_TIMEOUT || '30000', 10)
    },
    server: {
        port: parseInt(process.env.PORT || '3000', 10),
        host: process.env.HOST || 'localhost'
    },
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        file: process.env.LOG_FILE || 'logs/server.log'
    }
};

// Validate required configuration
if (!config.api.key) {
    throw new Error('UPGUARD_API_KEY environment variable is required');
}

module.exports = config; 
