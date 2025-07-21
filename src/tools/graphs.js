const api = require('../api');
const { z } = require('zod');
const { handleZabbixError } = require('../utils/errors');

// Helper function to format graph information
function formatGraphInfo(graph) {
    return {
        ...graph,
        graphid: graph.graphid,
        name: graph.name,
        width: graph.width,
        height: graph.height
    };
}

// Graph item schema
const graphItemSchema = z.object({
    itemid: z.string().describe("Item ID to be included in the graph."),
    drawtype: z.number().int().min(0).max(5).optional().describe("Draw style: 0 (line), 1 (filled region), 2 (bold line), 3 (dot), 4 (dashed line), 5 (gradient line)."),
    sortorder: z.number().int().min(0).max(999).optional().describe("Sort order of the graph item (0-999)."),
    color: z.string().regex(/^[0-9A-Fa-f]{6}$/).optional().describe("Graph item color in hex format (e.g., FF0000 for red)."),
    type: z.number().int().min(0).max(2).optional().describe("Graph item type: 0 (simple), 1 (graph sum), 2 (graph aggregated).")
});

// Graph object schema
const graphObjectSchema = z.object({
    graphid: z.string().optional().describe("Graph ID (read-only)."),
    name: z.string().min(1).max(255).describe("Name of the graph."),
    width: z.number().int().min(20).max(65535).optional().describe("Width of the graph in pixels."),
    height: z.number().int().min(20).max(65535).optional().describe("Height of the graph in pixels."),
    graphtype: z.number().int().min(0).max(1).optional().describe("Graph type: 0 (normal), 1 (stacked)."),
    gitems: z.array(graphItemSchema).min(1).describe("Graph items - at least one item is required.")
});

function registerTools(server, { logger }) {
    // Get graphs
    server.tool(
        'zabbix_get_graphs',
        'Get graphs from Zabbix with filtering and output options',
        {
            graphids: z.array(z.string()).optional().describe('Return only graphs with the given graph IDs'),
            hostids: z.array(z.string()).optional().describe('Return only graphs that belong to the given hosts'),
            output: z.array(z.string()).optional().default(['graphid', 'name', 'width', 'height', 'graphtype']).describe('Object properties to be returned'),
            sortfield: z.array(z.string()).optional().default(['name']).describe('Sort the result by the given properties'),
            sortorder: z.enum(['ASC', 'DESC']).optional().default('ASC').describe('Sort order'),
            limit: z.number().int().positive().optional().describe('Limit the number of records returned')
        },
        async (args) => {
            try {
                const apiParams = {
                    output: args.output || ['graphid', 'name', 'width', 'height', 'graphtype'],
                    sortfield: args.sortfield || ['name'],
                    sortorder: args.sortorder || 'ASC'
                };

                if (args.graphids) apiParams.graphids = args.graphids;
                if (args.hostids) apiParams.hostids = args.hostids;
                if (args.limit) apiParams.limit = args.limit;

                const graphs = await api.getGraphs(apiParams);
                const formattedGraphs = graphs.map(graph => formatGraphInfo(graph));
                
                logger.info(`Retrieved ${graphs.length} graphs`);
                return {
                    content: [{
                        type: 'text',
                        text: `Found ${graphs.length} graphs:\\n\\n${JSON.stringify(formattedGraphs, null, 2)}`
                    }]
                };
            } catch (error) {
                const enhancedError = handleZabbixError(error, 'error_getting_graphs', args);
                logger.error('Error getting graphs:', enhancedError.message);
                throw new Error(enhancedError.message);
            }
        }
    );

    // Create graph
    server.tool(
        'zabbix_create_graph',
        'Create a new graph in Zabbix',
        graphObjectSchema,
        async (args) => {
            try {
                const result = await api.createGraph(args);
                logger.info(`Created graph with ID: ${result.graphids[0]}`);
                return {
                    content: [{
                        type: 'text',
                        text: `Successfully created graph with ID: ${result.graphids[0]}`
                    }]
                };
            } catch (error) {
                const enhancedError = handleZabbixError(error, 'error_creating_graph', args);
                logger.error('Error creating graph:', enhancedError.message);
                throw new Error(enhancedError.message);
            }
        }
    );

    // Update graph
    server.tool(
        'zabbix_update_graph',
        'Update an existing graph in Zabbix',
        graphObjectSchema.extend({
            graphid: z.string().describe("Graph ID to update (required).")
        }),
        async (args) => {
            try {
                const result = await api.updateGraph(args);
                logger.info(`Updated graph with ID: ${result.graphids[0]}`);
                return {
                    content: [{
                        type: 'text',
                        text: `Successfully updated graph with ID: ${result.graphids[0]}`
                    }]
                };
            } catch (error) {
                const enhancedError = handleZabbixError(error, 'error_updating_graph', args);
                logger.error('Error updating graph:', enhancedError.message);
                throw new Error(enhancedError.message);
            }
        }
    );

    // Delete graphs
    server.tool(
        'zabbix_delete_graphs',
        'Delete graphs from Zabbix',
        {
            graphids: z.array(z.string()).min(1).describe('Array of graph IDs to delete')
        },
        async (args) => {
            try {
                const result = await api.deleteGraphs(args.graphids);
                logger.info(`Deleted ${result.graphids.length} graphs`);
                return {
                    content: [{
                        type: 'text',
                        text: `Successfully deleted ${result.graphids.length} graphs: ${result.graphids.join(', ')}`
                    }]
                };
            } catch (error) {
                const enhancedError = handleZabbixError(error, 'error_deleting_graphs', args);
                logger.error('Error deleting graphs:', enhancedError.message);
                throw new Error(enhancedError.message);
            }
        }
    );

    // Get graph items
    server.tool(
        'zabbix_get_graph_items',
        'Get graph items from Zabbix with filtering and output options',
        {
            gitemids: z.array(z.string()).optional().describe('Return only graph items with the given IDs'),
            graphids: z.array(z.string()).optional().describe('Return only graph items that belong to the given graphs'),
            output: z.array(z.string()).optional().default(['gitemid', 'graphid', 'itemid', 'color', 'drawtype']).describe('Object properties to be returned'),
            limit: z.number().int().positive().optional().describe('Limit the number of records returned')
        },
        async (args) => {
            try {
                const apiParams = {
                    output: args.output || ['gitemid', 'graphid', 'itemid', 'color', 'drawtype']
                };

                if (args.gitemids) apiParams.gitemids = args.gitemids;
                if (args.graphids) apiParams.graphids = args.graphids;
                if (args.limit) apiParams.limit = args.limit;

                const graphItems = await api.getGraphItems(apiParams);
                
                logger.info(`Retrieved ${graphItems.length} graph items`);
                return {
                    content: [{
                        type: 'text',
                        text: `Found ${graphItems.length} graph items:\\n\\n${JSON.stringify(graphItems, null, 2)}`
                    }]
                };
            } catch (error) {
                const enhancedError = handleZabbixError(error, 'error_getting_graph_items', args);
                logger.error('Error getting graph items:', enhancedError.message);
                throw new Error(enhancedError.message);
            }
        }
    );

    // Get graph prototypes
    server.tool(
        'zabbix_get_graph_prototypes',
        'Get graph prototypes from Zabbix with filtering and output options',
        {
            graphids: z.array(z.string()).optional().describe('Return only graph prototypes with the given graph IDs'),
            hostids: z.array(z.string()).optional().describe('Return only graph prototypes that belong to the given hosts'),
            output: z.array(z.string()).optional().default(['graphid', 'name', 'width', 'height', 'graphtype']).describe('Object properties to be returned'),
            limit: z.number().int().positive().optional().describe('Limit the number of records returned')
        },
        async (args) => {
            try {
                const apiParams = {
                    output: args.output || ['graphid', 'name', 'width', 'height', 'graphtype']
                };

                if (args.graphids) apiParams.graphids = args.graphids;
                if (args.hostids) apiParams.hostids = args.hostids;
                if (args.limit) apiParams.limit = args.limit;

                const prototypes = await api.getGraphPrototypes(apiParams);
                const formattedPrototypes = prototypes.map(prototype => formatGraphInfo(prototype));
                
                logger.info(`Retrieved ${prototypes.length} graph prototypes`);
                return {
                    content: [{
                        type: 'text',
                        text: `Found ${prototypes.length} graph prototypes:\\n\\n${JSON.stringify(formattedPrototypes, null, 2)}`
                    }]
                };
            } catch (error) {
                const enhancedError = handleZabbixError(error, 'error_getting_graph_prototypes', args);
                logger.error('Error getting graph prototypes:', enhancedError.message);
                throw new Error(enhancedError.message);
            }
        }
    );

    // Create graph prototype
    server.tool(
        'zabbix_create_graph_prototype',
        'Create a new graph prototype in Zabbix',
        graphObjectSchema,
        async (args) => {
            try {
                const result = await api.createGraphPrototype(args);
                logger.info(`Created graph prototype with ID: ${result.graphids[0]}`);
                return {
                    content: [{
                        type: 'text',
                        text: `Successfully created graph prototype with ID: ${result.graphids[0]}`
                    }]
                };
            } catch (error) {
                const enhancedError = handleZabbixError(error, 'error_creating_graph_prototype', args);
                logger.error('Error creating graph prototype:', enhancedError.message);
                throw new Error(enhancedError.message);
            }
        }
    );

    // Update graph prototype
    server.tool(
        'zabbix_update_graph_prototype',
        'Update an existing graph prototype in Zabbix',
        graphObjectSchema.extend({
            graphid: z.string().describe("Graph prototype ID to update (required).")
        }),
        async (args) => {
            try {
                const result = await api.updateGraphPrototype(args);
                logger.info(`Updated graph prototype with ID: ${result.graphids[0]}`);
                return {
                    content: [{
                        type: 'text',
                        text: `Successfully updated graph prototype with ID: ${result.graphids[0]}`
                    }]
                };
            } catch (error) {
                const enhancedError = handleZabbixError(error, 'error_updating_graph_prototype', args);
                logger.error('Error updating graph prototype:', enhancedError.message);
                throw new Error(enhancedError.message);
            }
        }
    );

    // Delete graph prototypes
    server.tool(
        'zabbix_delete_graph_prototypes',
        'Delete graph prototypes from Zabbix',
        {
            graphids: z.array(z.string()).min(1).describe('Array of graph prototype IDs to delete')
        },
        async (args) => {
            try {
                const result = await api.deleteGraphPrototypes(args.graphids);
                logger.info(`Deleted ${result.graphids.length} graph prototypes`);
                return {
                    content: [{
                        type: 'text',
                        text: `Successfully deleted ${result.graphids.length} graph prototypes: ${result.graphids.join(', ')}`
                    }]
                };
            } catch (error) {
                const enhancedError = handleZabbixError(error, 'error_deleting_graph_prototypes', args);
                logger.error('Error deleting graph prototypes:', enhancedError.message);
                throw new Error(enhancedError.message);
            }
        }
    );
}

module.exports = { registerTools }; 