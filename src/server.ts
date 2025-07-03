import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { McpConfig, McpConfigSchema } from './types';
import { GraphQLClientService } from './services/graphql-client';
import { createLogger, getLogger } from './utils/logger';

// Import tools
import { introspectSchemaTool, handleIntrospectSchema } from './tools/introspect-schema';
import { queryGraphQLTool, handleQueryGraphQL } from './tools/query-graphql';
import { analyzeQueryTool, handleAnalyzeQuery } from './tools/analyze-query';

export class McpGraphQLServer {
  private server: Server;
  private config: McpConfig;
  private client: GraphQLClientService;

  constructor(config: McpConfig) {
    this.config = McpConfigSchema.parse(config);
    
    // Initialize logger
    createLogger({
      level: this.config.logging.level,
      enableQueries: this.config.logging.queries,
      enablePerformance: this.config.logging.performance,
    });

    // Initialize GraphQL client
    const clientHeaders = { ...this.config.headers };
    
    // Add default API key to headers if provided and no Authorization header exists
    if (this.config.defaultApiKey && !clientHeaders.Authorization && !clientHeaders.authorization) {
      clientHeaders.Authorization = `Bearer ${this.config.defaultApiKey}`;
    }
    
    this.client = new GraphQLClientService(
      {
        url: this.config.endpoint,
        headers: clientHeaders,
        timeout: this.config.timeout,
      },
      this.config.retries
    );

    // Initialize MCP server
    this.server = new Server(
      {
        name: this.config.name,
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    const logger = getLogger();

    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools = [introspectSchemaTool, queryGraphQLTool, analyzeQueryTool];
      
      logger.debug('Listing available tools', { 
        toolCount: tools.length,
        tools: tools.map(t => t.name),
      });

      return { tools };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      logger.info(`Tool called: ${name}`, { args });

      try {
        switch (name) {
          case 'introspect-schema':
            const schemaResult = await handleIntrospectSchema(args, this.client);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(schemaResult, null, 2),
                },
              ],
            };

          case 'query-graphql':
            const queryResult = await handleQueryGraphQL(
              args,
              this.client,
              this.config.allowMutations,
              this.config.allowSubscriptions
            );
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(queryResult, null, 2),
                },
              ],
            };

          case 'analyze-query':
            const analysisResult = await handleAnalyzeQuery(args, this.client);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(analysisResult, null, 2),
                },
              ],
            };

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        logger.error(`Tool execution failed: ${name}`, {
          error: error instanceof Error ? error.message : 'Unknown error',
          args,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                error: error instanceof Error ? error.message : 'Unknown error',
                tool: name,
                args,
              }, null, 2),
            },
          ],
          isError: true,
        };
      }
    });
  }

  async start() {
    const logger = getLogger();
    
    try {
      // Initialize schema if introspection is allowed
      if (this.config.security.allowIntrospection) {
        logger.info('Initializing GraphQL schema...');
        await this.client.introspectSchema();
        logger.info('Schema initialized successfully');
      }

      // Start the server
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      
      logger.info(`MCP GraphQL server started`, {
        name: this.config.name,
        endpoint: this.config.endpoint,
        allowMutations: this.config.allowMutations,
        allowSubscriptions: this.config.allowSubscriptions,
      });

    } catch (error) {
      logger.error('Failed to start MCP server', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
}

  async stop() {
    const logger = getLogger();
    logger.info('Stopping MCP GraphQL server...');
    
    // Close server connection
    await this.server.close();
    
    logger.info('MCP GraphQL server stopped');
  }

  // Utility methods for configuration updates
  updateConfig(newConfig: Partial<McpConfig>) {
    this.config = McpConfigSchema.parse({ ...this.config, ...newConfig });
    
    // Update logger if logging config changed
    if (newConfig.logging) {
      const logger = getLogger();
      logger.updateConfig({
        level: this.config.logging.level,
        enableQueries: this.config.logging.queries,
        enablePerformance: this.config.logging.performance,
      });
    }

    // Update client endpoint if changed
    if (newConfig.endpoint || newConfig.headers || newConfig.timeout || newConfig.defaultApiKey) {
      const clientHeaders = { ...this.config.headers };
      
      // Add default API key to headers if provided and no Authorization header exists
      if (this.config.defaultApiKey && !clientHeaders.Authorization && !clientHeaders.authorization) {
        clientHeaders.Authorization = `Bearer ${this.config.defaultApiKey}`;
      }
      
      this.client.updateEndpoint({
        url: this.config.endpoint,
        headers: clientHeaders,
        timeout: this.config.timeout,
      });
    }
  }

  getConfig(): McpConfig {
    return { ...this.config };
  }

  getClient(): GraphQLClientService {
    return this.client;
  }
}

// Factory function for easy server creation
export const createMcpGraphQLServer = (config: McpConfig): McpGraphQLServer => {
  return new McpGraphQLServer(config);
};

// Default export for convenience
export default McpGraphQLServer; 