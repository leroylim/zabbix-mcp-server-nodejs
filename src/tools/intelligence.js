/**
 * Intelligence Tools - LLM-Optimized Convenience Functions
 * 
 * These tools provide high-level intelligence functions that aggregate and process
 * Zabbix data to reduce LLM token usage and processing overhead.
 */

const api = require('../api');
const { logger } = require('../utils/logger');
const { z } = require('zod');
const schemas = require('./schemas');

function registerTools(server) {
    // Tool: Get Infrastructure Health
    server.tool(
        'zabbix_get_infrastructure_health',
        'Get overall infrastructure health summary with metrics optimized for LLM consumption. Returns health score, problem counts by severity, host statistics, and critical action items.',
        {
            options: z.object({
                hostGroupIds: z.array(z.string()).optional().describe('Filter by specific host group IDs'),
                severityThreshold: z.number().int().min(1).max(5).optional().describe('Minimum severity level to include (1-5)')
            }).optional().describe('Optional filtering parameters')
        },
        async (args) => {
            try {
                const result = await api.getInfrastructureHealth(args.options || {});
                return { content: [{ type: 'text', text: `Infrastructure health summary:\n${JSON.stringify(result, null, 2)}` }] };
            } catch (error) {
                logger.error('Error getting infrastructure health:', error);
                throw error;
            }
        }
    );

    // Tool: Get Critical Issues
    server.tool(
        'zabbix_get_critical_issues',
        'Get critical and high severity issues requiring immediate attention. Returns only critical/high problems with essential context, acknowledgment status, and duration.',
        {
            options: z.object({
                limit: z.number().int().min(1).max(50).optional().default(20).describe('Maximum number of issues to return'),
                unacknowledgedOnly: z.boolean().optional().describe('Return only unacknowledged problems')
            }).optional().describe('Optional filtering parameters')
        },
        async (args) => {
            try {
                const result = await api.getCriticalIssues(args.options || {});
                return { content: [{ type: 'text', text: `Critical issues:\n${JSON.stringify(result, null, 2)}` }] };
            } catch (error) {
                logger.error('Error getting critical issues:', error);
                throw error;
            }
        }
    );

    // Tool: Get System Overview
    server.tool(
        'zabbix_get_system_overview',
        'Get comprehensive system overview combining problems, maintenance windows, and key metrics in one call. Provides high-level system status and activity level.',
        {
            options: z.object({
                includeInactiveMaintenance: z.boolean().optional().describe('Include inactive maintenance windows')
            }).optional().describe('Optional filtering parameters')
        },
        async (args) => {
            try {
                const result = await api.getSystemOverview(args.options || {});
                return { content: [{ type: 'text', text: `System overview:\n${JSON.stringify(result, null, 2)}` }] };
            } catch (error) {
                logger.error('Error getting system overview:', error);
                throw error;
            }
        }
    );

    // Tool: Get Last 24 Hours Summary
    server.tool(
        'zabbix_get_last_24_hours_summary',
        'Get activity summary for the last 24 hours including new problems, resolved issues, and recent events. Shows trends and net change in problem count.',
        {
            options: z.object({
                severityFilter: z.array(z.number().int().min(1).max(5)).optional().describe('Filter by severity levels (1-5)')
            }).optional().describe('Optional filtering parameters')
        },
        async (args) => {
            try {
                const result = await api.getLast24HoursSummary(args.options || {});
                return { content: [{ type: 'text', text: `Last 24 hours summary:\n${JSON.stringify(result, null, 2)}` }] };
            } catch (error) {
                logger.error('Error getting 24h summary:', error);
                throw error;
            }
        }
    );

    // Tool: Get Actionable Items
    server.tool(
        'zabbix_get_actionable_items',
        'Get actionable items requiring immediate human intervention including unacknowledged problems, long-running issues, and unavailable hosts. Prioritized by urgency.',
        {
            options: z.object({
                priorityFilter: z.enum(['High', 'Medium', 'Low']).optional().describe('Filter by priority level'),
                maxItems: z.number().int().min(1).max(50).optional().default(15).describe('Maximum number of items to return')
            }).optional().describe('Optional filtering parameters')
        },
        async (args) => {
            try {
                const result = await api.getActionableItems(args.options || {});
                return { content: [{ type: 'text', text: `Actionable items:\n${JSON.stringify(result, null, 2)}` }] };
            } catch (error) {
                logger.error('Error getting actionable items:', error);
                throw error;
            }
        }
    );

    // Tool: Get Performance Alerts
    server.tool(
        'zabbix_get_performance_alerts',
        'Get performance alerts and resource-related issues with context. Filters performance problems by resource type and severity.',
        {
            options: z.object({
                resourceType: z.enum(['cpu', 'memory', 'disk', 'network']).optional().describe('Filter by resource type'),
                severityThreshold: z.number().int().min(1).max(5).optional().describe('Minimum severity level to include')
            }).optional().describe('Optional filtering parameters')
        },
        async (args) => {
            try {
                const result = await api.getPerformanceAlerts(args.options || {});
                return { content: [{ type: 'text', text: `Performance alerts:\n${JSON.stringify(result, null, 2)}` }] };
            } catch (error) {
                logger.error('Error getting performance alerts:', error);
                throw error;
            }
        }
    );
}

module.exports = { registerTools }; 