# API Reference

This document provides a detailed overview of the API layer of the Zabbix MCP Server. The API layer is responsible for all communication with the Zabbix API.

## `zabbix-client.js`

The `zabbix-client.js` module is the core of the API layer. It provides a singleton `ZabbixClient` class that manages the connection to the Zabbix API.

### `async initialize()`

Initializes the Zabbix API client. It automatically detects whether to use API token or username/password authentication based on the environment variables.

### `async getClient()`

Returns the `zabbix-utils` API client instance, initializing it if necessary.

### `async checkConnection()`

Checks if the client is authenticated and connected to the Zabbix API.

### `async disconnect()`

Disconnects from the Zabbix API and cleans up the connection.

### `async getVersion()`

Returns the version of the Zabbix API.

### `async request(method, params = {})`

Makes a generic request to the Zabbix API. This method handles errors, including a retry mechanism for authentication errors.

**Arguments:**

*   `method` (string): The Zabbix API method to call (e.g., `host.get`).
*   `params` (object): An object containing the parameters for the API method.

**Returns:**

A promise that resolves with the result of the API call.

## API Modules

The other files in the `src/api` directory correspond to specific Zabbix API modules. These modules use the `zabbix-client.js` to make API calls and export functions that can be used by the tool layer.

### Example: `src/api/hosts.js`

The `src/api/hosts.js` module provides functions for interacting with the Zabbix `host` API module.

#### `async getHosts(params)`

Retrieves hosts from the Zabbix API.

**Arguments:**

*   `params` (object): An object containing the parameters for the `host.get` method.

**Returns:**

A promise that resolves with an array of host objects.

#### `async createHost(params)`

Creates a new host in the Zabbix API.

**Arguments:**

*   `params` (object): An object containing the parameters for the `host.create` method.

**Returns:**

A promise that resolves with the result of the API call.

#### `async updateHost(params)`

Updates an existing host in the Zabbix API.

**Arguments:**

*   `params` (object): An object containing the parameters for the `host.update` method.

**Returns:**

A promise that resolves with the result of the API call.

#### `async deleteHosts(hostIds)`

Deletes one or more hosts from the Zabbix API.

**Arguments:**

*   `hostIds` (array): An array of host IDs to delete.

**Returns:**

A promise that resolves with the result of the API call.
