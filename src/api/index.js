const client = require('./zabbix-client');
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
const maps = require('./maps');
const dashboards = require('./dashboards');
const proxies = require('./proxies');
const services = require('./services');
const configuration = require('./configuration');
const intelligence = require('./intelligence');

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
    ...maps,
    ...dashboards,
    ...proxies,
    ...services,
    ...configuration,
    ...intelligence
}; 
