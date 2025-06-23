const { logger } = require('../utils/logger');
const { ZabbixClient } = require('./zabbix-client');
const config = require('../config');

// Initialize client
const client = new ZabbixClient();

/**
 * Make a request using the zabbix-utils client
 * @param {string} method - API method name
 * @param {Object} params - Request parameters
 * @returns {Promise<any>} API response
 */
async function request(method, params = {}) {
    return await client.request(method, params);
}

/**
 * Get media types from Zabbix
 * @param {Object} options - Parameters for mediatype.get
 * @returns {Promise<Array>} Array of media types
 */
async function getMediaTypes(options = {}) {
    try {
        logger.debug(`${config.logging.prefix} Getting media types`);
        const defaultOptions = {
            output: 'extend',
            selectUsers: ['userid', 'username'],
            selectMessageTemplates: 'extend'
        };
        
        const params = { ...defaultOptions, ...options };
        return await request('mediatype.get', params);
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get media types:`, error.message);
        throw new Error(`Failed to retrieve media types: ${error.message}`);
    }
}

/**
 * Create a new media type
 * @param {Object} mediaTypeData - Media type creation parameters
 * @returns {Promise<Object>} Creation result with mediatypeids
 */
async function createMediaType(mediaTypeData) {
    try {
        logger.debug(`${config.logging.prefix} Creating media type: ${mediaTypeData.name}`);
        
        // Validate required fields
        if (!mediaTypeData.name || typeof mediaTypeData.type === 'undefined') {
            throw new Error("Parameters 'name' and 'type' are required");
        }
        
        const result = await request('mediatype.create', mediaTypeData);
        logger.info(`${config.logging.prefix} Created media type: ${mediaTypeData.name} (ID: ${result.mediatypeids[0]})`);
        return result;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to create media type:`, error.message);
        throw new Error(`Failed to create media type: ${error.message}`);
    }
}

/**
 * Update an existing media type
 * @param {Object} updateData - Media type update parameters (must include mediatypeid)
 * @returns {Promise<Object>} Update result with mediatypeids
 */
async function updateMediaType(updateData) {
    try {
        logger.debug(`${config.logging.prefix} Updating media type: ${updateData.mediatypeid}`);
        
        if (!updateData.mediatypeid) {
            throw new Error("Parameter 'mediatypeid' is required for updating media type");
        }
        
        const result = await request('mediatype.update', updateData);
        logger.info(`${config.logging.prefix} Updated media type: ${updateData.mediatypeid}`);
        return result;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to update media type:`, error.message);
        throw new Error(`Failed to update media type: ${error.message}`);
    }
}

/**
 * Delete media types
 * @param {Array<string>} mediaTypeIds - Array of media type IDs to delete
 * @returns {Promise<Object>} Deletion result with mediatypeids
 */
async function deleteMediaTypes(mediaTypeIds) {
    try {
        logger.debug(`${config.logging.prefix} Deleting ${mediaTypeIds.length} media types`);
        
        if (!Array.isArray(mediaTypeIds) || mediaTypeIds.length === 0) {
            throw new Error("Parameter 'mediaTypeIds' must be a non-empty array");
        }
        
        const result = await request('mediatype.delete', mediaTypeIds);
        logger.info(`${config.logging.prefix} Deleted ${mediaTypeIds.length} media types`);
        return result;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to delete media types:`, error.message);
        throw new Error(`Failed to delete media types: ${error.message}`);
    }
}

/**
 * Test media type delivery
 * @param {Object} testData - Media type test parameters
 * @returns {Promise<Object>} Test result
 */
async function testMediaType(testData) {
    try {
        logger.debug(`${config.logging.prefix} Testing media type: ${testData.mediatypeid}`);
        
        // Validate required fields
        if (!testData.mediatypeid) {
            throw new Error("Parameter 'mediatypeid' is required for testing");
        }
        
        const result = await request('mediatype.test', testData);
        logger.info(`${config.logging.prefix} Tested media type: ${testData.mediatypeid}`);
        return result;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to test media type:`, error.message);
        throw new Error(`Failed to test media type: ${error.message}`);
    }
}

/**
 * Get media types by type
 * @param {number} mediaType - Media type (0=email, 1=script, 2=SMS, 3=webhook, 4=Eztext)
 * @param {Object} options - Additional options
 * @returns {Promise<Array>} Array of media types
 */
async function getMediaTypesByType(mediaType, options = {}) {
    try {
        logger.debug(`${config.logging.prefix} Getting media types by type: ${mediaType}`);
        
        if (typeof mediaType !== 'number') {
            throw new Error("Parameter 'mediaType' must be a number");
        }
        
        const params = {
            filter: { type: mediaType },
            output: 'extend',
            selectUsers: ['userid', 'username'],
            selectMessageTemplates: 'extend',
            ...options
        };
        
        return await request('mediatype.get', params);
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get media types by type:`, error.message);
        throw new Error(`Failed to retrieve media types by type: ${error.message}`);
    }
}

/**
 * Get media types by name pattern
 * @param {string} namePattern - Name pattern to search for
 * @param {Object} options - Additional options
 * @returns {Promise<Array>} Array of media types
 */
async function getMediaTypesByName(namePattern, options = {}) {
    try {
        logger.debug(`${config.logging.prefix} Getting media types by name pattern: ${namePattern}`);
        
        if (!namePattern || typeof namePattern !== 'string') {
            throw new Error("Parameter 'namePattern' must be a non-empty string");
        }
        
        const params = {
            search: { name: namePattern },
            searchWildcardsEnabled: true,
            output: 'extend',
            selectUsers: ['userid', 'username'],
            selectMessageTemplates: 'extend',
            ...options
        };
        
        return await request('mediatype.get', params);
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get media types by name:`, error.message);
        throw new Error(`Failed to retrieve media types by name: ${error.message}`);
    }
}

/**
 * Get enabled media types
 * @param {Object} options - Additional options
 * @returns {Promise<Array>} Array of enabled media types
 */
async function getEnabledMediaTypes(options = {}) {
    try {
        logger.debug(`${config.logging.prefix} Getting enabled media types`);
        
        const params = {
            filter: { status: 0 }, // 0 = enabled
            output: 'extend',
            selectUsers: ['userid', 'username'],
            selectMessageTemplates: 'extend',
            ...options
        };
        
        return await request('mediatype.get', params);
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get enabled media types:`, error.message);
        throw new Error(`Failed to retrieve enabled media types: ${error.message}`);
    }
}

/**
 * Get disabled media types
 * @param {Object} options - Additional options
 * @returns {Promise<Array>} Array of disabled media types
 */
async function getDisabledMediaTypes(options = {}) {
    try {
        logger.debug(`${config.logging.prefix} Getting disabled media types`);
        
        const params = {
            filter: { status: 1 }, // 1 = disabled
            output: 'extend',
            selectUsers: ['userid', 'username'],
            selectMessageTemplates: 'extend',
            ...options
        };
        
        return await request('mediatype.get', params);
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get disabled media types:`, error.message);
        throw new Error(`Failed to retrieve disabled media types: ${error.message}`);
    }
}

/**
 * Get user media (notification settings)
 * @param {Object} options - Parameters for usermedia.get
 * @returns {Promise<Array>} Array of user media
 */
async function getUserMedia(options = {}) {
    try {
        logger.debug(`${config.logging.prefix} Getting user media`);
        
        const defaultOptions = {
            output: 'extend',
            selectUsers: ['userid', 'username'],
            selectMediaType: ['mediatypeid', 'name', 'type']
        };
        
        const params = { ...defaultOptions, ...options };
        return await request('usermedia.get', params);
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get user media:`, error.message);
        throw new Error(`Failed to retrieve user media: ${error.message}`);
    }
}

/**
 * Get user media by user IDs
 * @param {Array<string>} userIds - Array of user IDs
 * @param {Object} options - Additional options
 * @returns {Promise<Array>} Array of user media
 */
async function getUserMediaByUsers(userIds, options = {}) {
    try {
        logger.debug(`${config.logging.prefix} Getting user media for ${userIds.length} users`);
        
        if (!Array.isArray(userIds) || userIds.length === 0) {
            throw new Error("Parameter 'userIds' must be a non-empty array");
        }
        
        const params = {
            userids: userIds,
            output: 'extend',
            selectUsers: ['userid', 'username'],
            selectMediaType: ['mediatypeid', 'name', 'type'],
            ...options
        };
        
        return await request('usermedia.get', params);
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get user media by users:`, error.message);
        throw new Error(`Failed to retrieve user media by users: ${error.message}`);
    }
}

/**
 * Get user media by media type IDs
 * @param {Array<string>} mediaTypeIds - Array of media type IDs
 * @param {Object} options - Additional options
 * @returns {Promise<Array>} Array of user media
 */
async function getUserMediaByMediaTypes(mediaTypeIds, options = {}) {
    try {
        logger.debug(`${config.logging.prefix} Getting user media for ${mediaTypeIds.length} media types`);
        
        if (!Array.isArray(mediaTypeIds) || mediaTypeIds.length === 0) {
            throw new Error("Parameter 'mediaTypeIds' must be a non-empty array");
        }
        
        const params = {
            mediatypeids: mediaTypeIds,
            output: 'extend',
            selectUsers: ['userid', 'username'],
            selectMediaType: ['mediatypeid', 'name', 'type'],
            ...options
        };
        
        return await request('usermedia.get', params);
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get user media by media types:`, error.message);
        throw new Error(`Failed to retrieve user media by media types: ${error.message}`);
    }
}

/**
 * Get alerts (sent notifications)
 * @param {Object} options - Parameters for alert.get
 * @returns {Promise<Array>} Array of alerts
 */
async function getAlerts(options = {}) {
    try {
        logger.debug(`${config.logging.prefix} Getting alerts`);
        
        const defaultOptions = {
            output: 'extend',
            selectHosts: ['hostid', 'name'],
            selectUsers: ['userid', 'username'],
            selectMediaType: ['mediatypeid', 'name', 'type'],
            sortfield: ['clock'],
            sortorder: 'DESC',
            limit: 100
        };
        
        const params = { ...defaultOptions, ...options };
        const alerts = await request('alert.get', params);
        
        // Format timestamps for readability
        const formattedAlerts = alerts.map(alert => ({
            ...alert,
            clock_readable: new Date(alert.clock * 1000).toISOString(),
            status_text: getAlertStatusText(alert.status),
            alerttype_text: getAlertTypeText(alert.alerttype)
        }));
        
        return formattedAlerts;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get alerts:`, error.message);
        throw new Error(`Failed to retrieve alerts: ${error.message}`);
    }
}

/**
 * Get alerts by time range
 * @param {number} timeFrom - Start timestamp
 * @param {number} timeTill - End timestamp
 * @param {Object} options - Additional options
 * @returns {Promise<Array>} Array of alerts
 */
async function getAlertsByTimeRange(timeFrom, timeTill, options = {}) {
    try {
        logger.debug(`${config.logging.prefix} Getting alerts by time range`);
        
        if (typeof timeFrom !== 'number' || typeof timeTill !== 'number') {
            throw new Error("Parameters 'timeFrom' and 'timeTill' must be numbers (timestamps)");
        }
        
        const params = {
            time_from: timeFrom,
            time_till: timeTill,
            output: 'extend',
            selectHosts: ['hostid', 'name'],
            selectUsers: ['userid', 'username'],
            selectMediaType: ['mediatypeid', 'name', 'type'],
            sortfield: ['clock'],
            sortorder: 'DESC',
            ...options
        };
        
        return await getAlerts(params);
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get alerts by time range:`, error.message);
        throw new Error(`Failed to retrieve alerts by time range: ${error.message}`);
    }
}

/**
 * Get alerts by status
 * @param {number} status - Alert status (0=not sent, 1=sent, 2=failed)
 * @param {Object} options - Additional options
 * @returns {Promise<Array>} Array of alerts
 */
async function getAlertsByStatus(status, options = {}) {
    try {
        logger.debug(`${config.logging.prefix} Getting alerts by status: ${status}`);
        
        if (typeof status !== 'number') {
            throw new Error("Parameter 'status' must be a number");
        }
        
        const params = {
            filter: { status: status },
            output: 'extend',
            selectHosts: ['hostid', 'name'],
            selectUsers: ['userid', 'username'],
            selectMediaType: ['mediatypeid', 'name', 'type'],
            sortfield: ['clock'],
            sortorder: 'DESC',
            ...options
        };
        
        return await getAlerts(params);
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get alerts by status:`, error.message);
        throw new Error(`Failed to retrieve alerts by status: ${error.message}`);
    }
}

/**
 * Get failed alerts
 * @param {Object} options - Additional options
 * @returns {Promise<Array>} Array of failed alerts
 */
async function getFailedAlerts(options = {}) {
    try {
        logger.debug(`${config.logging.prefix} Getting failed alerts`);
        return await getAlertsByStatus(2, options); // 2 = failed
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get failed alerts:`, error.message);
        throw new Error(`Failed to retrieve failed alerts: ${error.message}`);
    }
}

/**
 * Get recent alerts
 * @param {number} hours - Number of hours to look back (default: 24)
 * @param {Object} options - Additional options
 * @returns {Promise<Array>} Array of recent alerts
 */
async function getRecentAlerts(hours = 24, options = {}) {
    try {
        logger.debug(`${config.logging.prefix} Getting alerts from last ${hours} hours`);
        
        const now = Math.floor(Date.now() / 1000);
        const timeFrom = now - (hours * 3600);
        
        return await getAlertsByTimeRange(timeFrom, now, options);
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get recent alerts:`, error.message);
        throw new Error(`Failed to retrieve recent alerts: ${error.message}`);
    }
}

/**
 * Get media type statistics
 * @param {Object} options - Additional filtering options
 * @returns {Promise<Object>} Media type statistics
 */
async function getMediaTypeStatistics(options = {}) {
    try {
        logger.debug(`${config.logging.prefix} Getting media type statistics`);
        
        const mediaTypes = await getMediaTypes({
            output: ['mediatypeid', 'name', 'type', 'status'],
            selectUsers: 'count',
            ...options
        });
        
        const stats = {
            total: mediaTypes.length,
            enabled: mediaTypes.filter(mt => mt.status === '0').length,
            disabled: mediaTypes.filter(mt => mt.status === '1').length,
            byType: {},
            totalUsers: 0
        };
        
        // Calculate type distribution
        mediaTypes.forEach(mediaType => {
            const type = mediaType.type;
            stats.byType[type] = (stats.byType[type] || 0) + 1;
            stats.totalUsers += parseInt(mediaType.users || 0);
        });
        
        return stats;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get media type statistics:`, error.message);
        throw new Error(`Failed to retrieve media type statistics: ${error.message}`);
    }
}

/**
 * Get notification statistics
 * @param {number} hours - Number of hours to analyze (default: 24)
 * @param {Object} options - Additional filtering options
 * @returns {Promise<Object>} Notification statistics
 */
async function getNotificationStatistics(hours = 24, options = {}) {
    try {
        logger.debug(`${config.logging.prefix} Getting notification statistics for last ${hours} hours`);
        
        const alerts = await getRecentAlerts(hours, options);
        
        const stats = {
            total: alerts.length,
            sent: alerts.filter(alert => alert.status === '1').length,
            failed: alerts.filter(alert => alert.status === '2').length,
            pending: alerts.filter(alert => alert.status === '0').length,
            byMediaType: {},
            byUser: {},
            byHost: {}
        };
        
        // Calculate distributions
        alerts.forEach(alert => {
            // Media type distribution
            if (alert.mediatypes && alert.mediatypes.length > 0) {
                const mediaTypeName = alert.mediatypes[0].name;
                stats.byMediaType[mediaTypeName] = (stats.byMediaType[mediaTypeName] || 0) + 1;
            }
            
            // User distribution
            if (alert.users && alert.users.length > 0) {
                const username = alert.users[0].username;
                stats.byUser[username] = (stats.byUser[username] || 0) + 1;
            }
            
            // Host distribution
            if (alert.hosts && alert.hosts.length > 0) {
                const hostname = alert.hosts[0].name;
                stats.byHost[hostname] = (stats.byHost[hostname] || 0) + 1;
            }
        });
        
        return stats;
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to get notification statistics:`, error.message);
        throw new Error(`Failed to retrieve notification statistics: ${error.message}`);
    }
}

/**
 * Search media types with multiple criteria
 * @param {Object} criteria - Search criteria
 * @returns {Promise<Array>} Array of matching media types
 */
async function searchMediaTypes(criteria = {}) {
    try {
        logger.debug(`${config.logging.prefix} Searching media types with criteria`);
        
        const params = {
            output: 'extend',
            selectUsers: ['userid', 'username'],
            selectMessageTemplates: 'extend'
        };
        
        // Apply search criteria
        if (criteria.name) {
            params.search = { ...params.search, name: criteria.name };
            params.searchWildcardsEnabled = true;
        }
        
        if (criteria.type !== undefined) {
            params.filter = { ...params.filter, type: criteria.type };
        }
        
        if (criteria.status !== undefined) {
            params.filter = { ...params.filter, status: criteria.status };
        }
        
        if (criteria.userIds) {
            params.userids = criteria.userIds;
        }
        
        return await request('mediatype.get', params);
    } catch (error) {
        logger.error(`${config.logging.prefix} Failed to search media types:`, error.message);
        throw new Error(`Failed to search media types: ${error.message}`);
    }
}

/**
 * Helper function to get alert status text
 * @param {string} status - Alert status code
 * @returns {string} Human-readable status
 */
function getAlertStatusText(status) {
    const statusMap = {
        '0': 'Not sent',
        '1': 'Sent',
        '2': 'Failed'
    };
    return statusMap[status] || 'Unknown';
}

/**
 * Helper function to get alert type text
 * @param {string} alerttype - Alert type code
 * @returns {string} Human-readable alert type
 */
function getAlertTypeText(alerttype) {
    const typeMap = {
        '0': 'Message',
        '1': 'Remote command'
    };
    return typeMap[alerttype] || 'Unknown';
}

module.exports = {
    // Core CRUD operations
    getMediaTypes,
    createMediaType,
    updateMediaType,
    deleteMediaTypes,
    testMediaType,
    
    // Enhanced query functions
    getMediaTypesByType,
    getMediaTypesByName,
    getEnabledMediaTypes,
    getDisabledMediaTypes,
    
    // User media functions
    getUserMedia,
    getUserMediaByUsers,
    getUserMediaByMediaTypes,
    
    // Alert functions
    getAlerts,
    getAlertsByTimeRange,
    getAlertsByStatus,
    getFailedAlerts,
    getRecentAlerts,
    
    // Analytics and statistics
    getMediaTypeStatistics,
    getNotificationStatistics,
    searchMediaTypes,
    
    // Backward compatibility
    mediaApi: {
        get: getMediaTypes,
        create: createMediaType,
        update: updateMediaType,
        delete: deleteMediaTypes,
        test: testMediaType,
        getUserMedia,
        getAlerts
    }
}; 