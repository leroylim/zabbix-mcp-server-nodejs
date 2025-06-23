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
    ...mapsApi,
    ...dashboardsApi,
    ...proxiesApi,
    ...configurationApi,
    ...servicesApi
}; 
