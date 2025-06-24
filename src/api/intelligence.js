/**
 * Intelligence API Module - LLM-Optimized Convenience Functions
 * 
 * This module provides high-level intelligence functions that aggregate and process
 * Zabbix data to reduce LLM token usage and processing overhead. Functions return
 * structured, actionable data optimized for conversational AI interactions.
 */

const { request } = require('./zabbix-client');
const { logger, config } = require('../utils/logger');

/**
 * Get overall infrastructure health summary
 * Returns concise health metrics optimized for LLM consumption
 * @param {Object} [options] - Optional filtering parameters
 * @returns {Promise<Object>} Infrastructure health summary
 */
async function getInfrastructureHealth(options = {}) {
    try {
        logger.debug(${config.logging.prefix} Getting infrastructure health summary);
        
        // Get hosts, problems, and basic metrics in parallel
        const [hosts, problems, triggers] = await Promise.all([
            request('host.get', { 
                output: ['hostid', 'name', 'status', 'available'],
                selectGroups: ['name'],
                filter: { status: 0 } // Only monitored hosts
            }),
            request('problem.get', { 
                output: ['problemid', 'name', 'severity', 'clock'],
                selectHosts: ['name'],
                recent: true,
                sortfield: ['severity', 'clock'],
                sortorder: ['DESC', 'DESC']
            }),
            request('trigger.get', {
                output: ['triggerid', 'description', 'priority', 'value'],
                filter: { value: 1 }, // Only problem triggers
                selectHosts: ['name'],
                expandDescription: true
            })
        ]);

        // Categorize problems by severity
        const severityCounts = { critical: 0, high: 0, average: 0, warning: 0, information: 0 };
        const criticalProblems = [];
        
        problems.forEach(problem => {
            const severity = parseInt(problem.severity);
            switch (severity) {
                case 5: severityCounts.critical++; break;
                case 4: severityCounts.high++; break;
                case 3: severityCounts.average++; break;
                case 2: severityCounts.warning++; break;
                case 1: severityCounts.information++; break;
            }
            
            // Collect critical and high severity problems for action items
            if (severity >= 4) {
                criticalProblems.push({
                    name: problem.name,
                    severity: severity === 5 ? 'Critical' : 'High',
                    host: problem.hosts?.[0]?.name || 'Unknown',
                    duration: Math.floor((Date.now() / 1000 - parseInt(problem.clock)) / 60) + ' minutes'
                });
            }
        });

        // Categorize hosts by status
        const hostStats = {
            total: hosts.length,
            available: hosts.filter(h => h.available === '1').length,
            unavailable: hosts.filter(h => h.available === '2').length,
            unknown: hosts.filter(h => h.available === '0').length
        };

        // Generate health score (0-100)
        const totalIssues = severityCounts.critical * 10 + severityCounts.high * 5 + severityCounts.average * 2 + severityCounts.warning;
        const healthScore = Math.max(0, 100 - Math.min(totalIssues, 100));

        // Generate summary text optimized for LLM
        let summary = Infrastructure health score: /100. ;
        if (severityCounts.critical > 0) {
            summary +=   critical issue requiring immediate attention. ;
        }
        if (severityCounts.high > 0) {
            summary +=   high priority issue. ;
        }
        if (hostStats.unavailable > 0) {
            summary += ${hostStats.unavailable} host unavailable. ;
        }
        if (severityCounts.critical === 0 && severityCounts.high === 0) {
            summary +=  No critical issues detected.;
        }

        return {
            summary,
            healthScore,
            timestamp: new Date().toISOString(),
            hosts: hostStats,
            problems: {
                total: problems.length,
                bySeverity: severityCounts
            },
            actionItems: criticalProblems.slice(0, 10), // Limit to top 10 for token efficiency
            status: healthScore >= 90 ? 'Excellent' : 
                   healthScore >= 75 ? 'Good' : 
                   healthScore >= 50 ? 'Warning' : 'Critical'
        };

    } catch (error) {
        logger.error(${config.logging.prefix} Failed to get infrastructure health:, error.message);
        throw new Error(Failed to retrieve infrastructure health: );
    }
}

module.exports = {
    getInfrastructureHealth
};
/**
 * Get critical issues requiring immediate attention
 * Returns only critical and high severity problems with essential context
 * @param {Object} [options] - Optional filtering parameters
 * @returns {Promise<Object>} Critical issues summary
 */
async function getCriticalIssues(options = {}) {
    try {
        logger.debug(${config.logging.prefix} Getting critical issues);
        
        const problems = await request('problem.get', {
            output: ['problemid', 'name', 'severity', 'clock', 'acknowledged'],
            selectHosts: ['name', 'hostid'],
            selectTags: 'extend',
            filter: { 
                severity: [4, 5] // Only high and critical
            },
            sortfield: ['severity', 'clock'],
            sortorder: ['DESC', 'DESC'],
            limit: options.limit || 20
        });

        const criticalIssues = problems.map(problem => {
            const severity = parseInt(problem.severity);
            const duration = Math.floor((Date.now() / 1000 - parseInt(problem.clock)) / 60);
            
            return {
                id: problem.problemid,
                title: problem.name,
                severity: severity === 5 ? 'Critical' : 'High',
                host: problem.hosts?.[0]?.name || 'Unknown',
                duration: duration < 60 ? ${duration}m : ${Math.floor(duration/60)}h m,
                acknowledged: problem.acknowledged === '1',
                tags: problem.tags?.map(tag => ${tag.tag}:).join(', ') || ''
            };
        });

        const unacknowledged = criticalIssues.filter(i => !i.acknowledged);
        const summary = criticalIssues.length === 0 ? 
            ' No critical issues detected.' :
              critical issue requiring attention.  +
            ${unacknowledged.length} unacknowledged.;

        return {
            summary,
            total: criticalIssues.length,
            unacknowledged: unacknowledged.length,
            issues: options.unacknowledgedOnly ? unacknowledged : criticalIssues,
            timestamp: new Date().toISOString()
        };

    } catch (error) {
        logger.error(${config.logging.prefix} Failed to get critical issues:, error.message);
        throw new Error(Failed to retrieve critical issues: );
    }
}

/**
 * Get comprehensive system overview
 * Combines problems, maintenance, and key metrics in one call
 * @param {Object} [options] - Optional filtering parameters
 * @returns {Promise<Object>} System overview
 */
async function getSystemOverview(options = {}) {
    try {
        logger.debug(${config.logging.prefix} Getting system overview);
        
        const [problems, maintenance, hosts, triggers] = await Promise.all([
            request('problem.get', { 
                output: ['problemid', 'name', 'severity'],
                countOutput: true 
            }),
            request('maintenance.get', {
                output: ['maintenanceid', 'name', 'active_since', 'active_till'],
                selectHosts: ['name'],
                limit: 5
            }),
            request('host.get', { 
                output: ['hostid'],
                countOutput: true,
                filter: { status: 0 }
            }),
            request('trigger.get', {
                output: ['triggerid'],
                filter: { value: 1, status: 0 },
                countOutput: true
            })
        ]);

        const activeMaintenance = maintenance.filter(m => {
            const now = Date.now() / 1000;
            return parseInt(m.active_since) <= now && 
                   (parseInt(m.active_till) === 0 || parseInt(m.active_till) >= now);
        });

        return {
            summary: System monitoring  hosts with  active problems.  +
                    ${activeMaintenance.length} maintenance window active.,
            metrics: {
                hosts: parseInt(hosts),
                problems: parseInt(problems),
                triggers: parseInt(triggers),
                maintenance: activeMaintenance.length
            },
            maintenance: activeMaintenance.map(m => ({
                name: m.name,
                hosts: m.hosts?.map(h => h.name).join(', ') || 'Multiple hosts',
                until: m.active_till === '0' ? 'Indefinite' : 
                       new Date(parseInt(m.active_till) * 1000).toLocaleString()
            })),
            timestamp: new Date().toISOString(),
            status: problems > 10 ? 'High Activity' : 
                   problems > 5 ? 'Moderate Activity' : 'Normal'
        };

    } catch (error) {
        logger.error(${config.logging.prefix} Failed to get system overview:, error.message);
        throw new Error(Failed to retrieve system overview: );
    }
}

/**
 * Get last 24 hours activity summary
 * Returns recent events, problems, and changes
 * @param {Object} [options] - Optional filtering parameters
 * @returns {Promise<Object>} 24-hour activity summary
 */
async function getLast24HoursSummary(options = {}) {
    try {
        logger.debug(${config.logging.prefix} Getting last 24 hours summary);
        
        const yesterday = Math.floor(Date.now() / 1000) - (24 * 60 * 60);
        
        const [recentProblems, resolvedProblems] = await Promise.all([
            request('problem.get', {
                output: ['problemid', 'name', 'severity', 'clock'],
                selectHosts: ['name'],
                time_from: yesterday,
                sortfield: 'clock',
                sortorder: 'DESC',
                limit: 10
            }),
            request('event.get', {
                output: ['eventid', 'name', 'clock'],
                selectHosts: ['name'],
                time_from: yesterday,
                value: 0, // Recovery events only
                sortfield: 'clock',
                sortorder: 'DESC',
                limit: 10
            })
        ]);

        const newProblems = recentProblems.length;
        const resolvedCount = resolvedProblems.length;
        const criticalNew = recentProblems.filter(p => parseInt(p.severity) >= 4).length;

        return {
            summary: Last 24 hours:  new problem,  +
                    ${resolvedCount} resolved.  +
                    (criticalNew > 0 ? ${criticalNew} critical/high severity.  : '') +
                    Net change:  problems.,
            period: '24 hours',
            metrics: {
                newProblems,
                resolvedProblems: resolvedCount,
                netChange: newProblems - resolvedCount,
                criticalNew
            },
            recentActivity: recentProblems.slice(0, 5).map(p => ({
                name: p.name,
                host: p.hosts?.[0]?.name || 'Unknown',
                severity: ['Not classified', 'Information', 'Warning', 'Average', 'High', 'Disaster'][parseInt(p.severity)],
                time: Math.floor((Date.now() / 1000 - parseInt(p.clock)) / 60) + ' minutes ago'
            })),
            timestamp: new Date().toISOString()
        };

    } catch (error) {
        logger.error(${config.logging.prefix} Failed to get 24h summary:, error.message);
        throw new Error(Failed to retrieve 24-hour summary: );
    }
}

/**
 * Get actionable items requiring immediate attention
 * Returns problems and issues that need human intervention
 * @param {Object} [options] - Optional filtering parameters
 * @returns {Promise<Object>} Actionable items
 */
async function getActionableItems(options = {}) {
    try {
        logger.debug(${config.logging.prefix} Getting actionable items);
        
        const [unacknowledgedProblems, longRunningProblems, unavailableHosts] = await Promise.all([
            request('problem.get', {
                output: ['problemid', 'name', 'severity', 'clock'],
                selectHosts: ['name'],
                filter: { 
                    acknowledged: 0,
                    severity: [3, 4, 5]
                },
                sortfield: ['severity', 'clock'],
                sortorder: ['DESC', 'DESC'],
                limit: 10
            }),
            request('problem.get', {
                output: ['problemid', 'name', 'severity', 'clock'],
                selectHosts: ['name'],
                time_till: Math.floor(Date.now() / 1000) - (4 * 60 * 60),
                filter: { severity: [3, 4, 5] },
                sortfield: 'clock',
                sortorder: 'ASC',
                limit: 5
            }),
            request('host.get', {
                output: ['hostid', 'name', 'available'],
                selectGroups: ['name'],
                filter: { 
                    status: 0,
                    available: 2
                },
                limit: 10
            })
        ]);

        const actionItems = [];

        unacknowledgedProblems.forEach(problem => {
            const severity = parseInt(problem.severity);
            actionItems.push({
                type: 'Unacknowledged Problem',
                priority: severity >= 4 ? 'High' : 'Medium',
                title: problem.name,
                host: problem.hosts?.[0]?.name || 'Unknown',
                action: 'Acknowledge and investigate',
                duration: Math.floor((Date.now() / 1000 - parseInt(problem.clock)) / 60) + ' minutes'
            });
        });

        longRunningProblems.forEach(problem => {
            const hours = Math.floor((Date.now() / 1000 - parseInt(problem.clock)) / 3600);
            actionItems.push({
                type: 'Long-running Problem',
                priority: 'Medium',
                title: problem.name,
                host: problem.hosts?.[0]?.name || 'Unknown',
                action: 'Escalate or resolve',
                duration: ${hours} hours
            });
        });

        unavailableHosts.forEach(host => {
            actionItems.push({
                type: 'Unavailable Host',
                priority: 'High',
                title: Host  is unavailable,
                host: host.name,
                action: 'Check connectivity and services',
                group: host.groups?.[0]?.name || 'Unknown'
            });
        });

        const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
        actionItems.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

        if (options.priorityFilter) {
            actionItems = actionItems.filter(item => item.priority === options.priorityFilter);
        }

        const limitedItems = actionItems.slice(0, options.maxItems || 15);
        const highPriority = actionItems.filter(i => i.priority === 'High').length;

        return {
            summary: actionItems.length === 0 ? 
                ' No immediate action items.' :
                  item requiring attention.  high priority.,
            total: actionItems.length,
            highPriority,
            items: limitedItems,
            timestamp: new Date().toISOString()
        };

    } catch (error) {
        logger.error(${config.logging.prefix} Failed to get actionable items:, error.message);
        throw new Error(Failed to retrieve actionable items: );
    }
}

/**
 * Get performance alerts and resource-related issues
 * Returns performance problems with context
 * @param {Object} [options] - Optional filtering parameters
 * @returns {Promise<Object>} Performance alerts
 */
async function getPerformanceAlerts(options = {}) {
    try {
        logger.debug(${config.logging.prefix} Getting performance alerts);
        
        let searchTerms = ['CPU', 'Memory', 'Disk', 'Network', 'Load', 'Space', 'Usage', 'Performance'];
        
        if (options.resourceType) {
            const typeMap = {
                cpu: ['CPU', 'Load'],
                memory: ['Memory', 'RAM'],
                disk: ['Disk', 'Space', 'Storage'],
                network: ['Network', 'Bandwidth']
            };
            searchTerms = typeMap[options.resourceType] || searchTerms;
        }

        const performanceTriggers = await request('trigger.get', {
            output: ['triggerid', 'description', 'priority', 'lastchange'],
            selectHosts: ['name'],
            selectItems: ['name', 'key_'],
            filter: { 
                value: 1,
                status: 0,
                priority: options.severityThreshold ? [options.severityThreshold, 5] : undefined
            },
            search: { description: searchTerms },
            sortfield: ['priority', 'lastchange'],
            sortorder: ['DESC', 'DESC'],
            limit: 15
        });

        const alerts = performanceTriggers.map(trigger => {
            const priority = parseInt(trigger.priority);
            const item = trigger.items?.[0];
            
            return {
                host: trigger.hosts?.[0]?.name || 'Unknown',
                alert: trigger.description,
                severity: ['Not classified', 'Information', 'Warning', 'Average', 'High', 'Disaster'][priority],
                metric: item?.name || 'Unknown metric',
                key: item?.key_ || '',
                duration: Math.floor((Date.now() / 1000 - parseInt(trigger.lastchange)) / 60) + ' minutes'
            };
        });

        const categories = {
            cpu: alerts.filter(a => /cpu|load/i.test(a.alert)).length,
            memory: alerts.filter(a => /memory|ram/i.test(a.alert)).length,
            disk: alerts.filter(a => /disk|space|storage/i.test(a.alert)).length,
            network: alerts.filter(a => /network|bandwidth/i.test(a.alert)).length
        };

        return {
            summary: alerts.length === 0 ? 
                ' No performance alerts.' :
                  performance alert.  +
                CPU: , Memory: , Disk: , Network: .,
            total: alerts.length,
            categories,
            alerts: alerts.slice(0, 10),
            timestamp: new Date().toISOString()
        };

    } catch (error) {
        logger.error(${config.logging.prefix} Failed to get performance alerts:, error.message);
        throw new Error(Failed to retrieve performance alerts: );
    }
}

module.exports = {
    getInfrastructureHealth,
    getCriticalIssues,
    getSystemOverview,
    getLast24HoursSummary,
    getActionableItems,
    getPerformanceAlerts
};
