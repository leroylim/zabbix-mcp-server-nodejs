const { zabbixRequest, ensureLogin } = require('./client');

// Item Functions
async function getItems(params = { output: "extend" }) {
    await ensureLogin();
    return zabbixRequest('item.get', params);
}

async function createItem(params) {
    await ensureLogin();
    if (!params.name || !params.key_ || !params.hostid || !params.type) {
        throw new Error("Parameters 'name', 'key_', 'hostid', and 'type' are required for creating an item.");
    }
    return zabbixRequest('item.create', params);
}

async function updateItem(params) {
    await ensureLogin();
    if (!params || !params.itemid) {
        throw new Error("Parameter 'itemid' is required for updating an item.");
    }
    return zabbixRequest('item.update', params);
}

async function deleteItems(itemIds) {
    await ensureLogin();
    if (!Array.isArray(itemIds) || itemIds.length === 0 || !itemIds.every(id => typeof id === 'string')) {
        throw new Error("deleteItems expects a non-empty array of string item IDs.");
    }
    return zabbixRequest('item.delete', itemIds);
}

async function massUpdateItems(params) {
    await ensureLogin();
    if (!params || !params.items || !Array.isArray(params.items)) {
        throw new Error("massUpdateItems expects a params object with an 'items' array.");
    }
    return zabbixRequest('item.massupdate', params);
}

async function getLatestDataForItems(itemGetParams) {
    await ensureLogin();
    const items = await zabbixRequest('item.get', itemGetParams);
    const itemIds = items.map(item => item.itemid);
    return zabbixRequest('item.get', { itemids: itemIds, output: ['itemid', 'lastvalue', 'lastclock', 'prevvalue'] });
}

module.exports = {
    getItems,
    createItem,
    updateItem,
    deleteItems,
    massUpdateItems,
    getLatestDataForItems
}; 