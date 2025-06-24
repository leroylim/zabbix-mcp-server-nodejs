const { logger } = require('../utils/logger');
const authTools = require('./auth');
const hostTools = require('./hosts');
const problemTools = require('./problems');
const hostGroupTools = require('./hostgroups');
const itemTools = require('./items');
const triggerTools = require('./triggers');
const templateTools = require('./templates');
const maintenanceTools = require('./maintenance');
const historyTools = require('./history');
const userTools = require('./users');
const scriptTools = require('./scripts');
const discoveryTools = require('./discovery');
const mediaTools = require('./media');
const actionTools = require('./actions');
const mapTools = require('./maps');
const dashboardTools = require('./dashboards');
const proxyTools = require('./proxies');
const configurationTools = require('./configuration');
const serviceTools = require('./services');
const intelligenceTools = require('./intelligence');
// Import other tool categories as they are created

function registerAllTools(server) {
    const toolCategories = [
        { name: 'auth', module: authTools },
        { name: 'hosts', module: hostTools },
        { name: 'problems', module: problemTools },
        { name: 'hostgroups', module: hostGroupTools },
        { name: 'items', module: itemTools },
        { name: 'triggers', module: triggerTools },
        { name: 'templates', module: templateTools },
        { name: 'maintenance', module: maintenanceTools },
        { name: 'history', module: historyTools },
        { name: 'users', module: userTools },
        { name: 'scripts', module: scriptTools },
        { name: 'discovery', module: discoveryTools },
        { name: 'media', module: mediaTools },
        { name: 'actions', module: actionTools },
        { name: 'maps', module: mapTools },
        { name: 'dashboards', module: dashboardTools },
        { name: 'proxies', module: proxyTools },
        { name: 'configuration', module: configurationTools },
        { name: 'services', module: serviceTools },
        { name: 'intelligence', module: intelligenceTools }
    ];
    
    for (const { name, module } of toolCategories) {
        try {
            if (module && typeof module.registerTools === 'function') {
                module.registerTools(server);
                logger.info(`Registered tools from ${name}`);
            } else {
                logger.warn(`No registerTools function found in ${name}`);
            }
        } catch (error) {
            logger.error(`Failed to register ${name} tools:`, error.message);
            if (error.message.includes('keyValidator._parse is not a function')) {
                logger.error(`This appears to be a Zod schema validation issue. Check that all schemas in ${name} are properly defined.`);
            }
            throw new Error(`Tool registration failed for ${name}: ${error.message}`);
        }
    }
}

module.exports = { registerAllTools }; 


