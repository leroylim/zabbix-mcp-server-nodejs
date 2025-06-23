const client = require('./client');
const hosts = require('./hosts');
const hostgroups = require('./hostgroups');
const items = require('./items');
const problems = require('./problems');
const triggers = require('./triggers');
const maintenance = require('./maintenance');
const templates = require('./templates');
const history = require('./history');
const users = require('./users');
const scripts = require('./scripts');
const discovery = require('./discovery');
const media = require('./media');
const actions = require('./actions');

// Enhanced Phase 6 modules
const mapsNew = require('./maps-new');
const dashboardsNew = require('./dashboards-new');
const proxiesNew = require('./proxies-new');
const servicesNew = require('./services-new');
const configurationNew = require('./configuration-new');

// Legacy compatibility imports
const { mapsApi } = require('./maps');
const { dashboardsApi } = require('./dashboards');
const { proxiesApi } = require('./proxies');
const { configurationApi } = require('./configuration');
const { servicesApi } = require('./services');

module.exports = {
    ...client,
    ...hosts,
    ...hostgroups,
    ...items,
    ...problems,
    ...triggers,
    ...maintenance,
    ...templates,
    ...history,
    ...users,
    ...scripts,
    ...discovery,
    ...media,
    ...actions,
    
    // Enhanced Phase 6 API modules (primary)
    ...mapsNew,
    ...dashboardsNew,
    ...proxiesNew,
    ...servicesNew,
    ...configurationNew,
    
    // Legacy compatibility APIs (fallback)
    ...mapsApi,
    ...dashboardsApi,
    ...proxiesApi,
    ...configurationApi,
    ...servicesApi
}; 
