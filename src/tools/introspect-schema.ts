import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { IntrospectSchemaParamsSchema, SchemaIntrospectionResult } from '../types';
import { GraphQLClientService } from '../services/graphql-client';
import { getLogger } from '../utils/logger';

export const introspectSchemaTool: Tool = {
  name: 'introspect-schema',
  description: 'Retrieve and analyze the GraphQL schema from the endpoint. Supports multiple output formats and includes schema statistics.',
  inputSchema: {
    type: 'object',
    properties: {
      format: {
        type: 'string',
        enum: ['sdl', 'json', 'introspection'],
        default: 'sdl',
        description: 'Output format: sdl (Schema Definition Language), json (parsed schema), or introspection (raw introspection result)',
      },
      includeDescription: {
        type: 'boolean',
        default: true,
        description: 'Include field and type descriptions in the output',
      },
      includeDeprecated: {
        type: 'boolean',
        default: false,
        description: 'Include deprecated fields and types',
      },
      headers: {
        type: 'object',
        description: 'HTTP headers to include with the request (e.g., Authorization)',
        additionalProperties: {
          type: 'string'
        },
      },
    },
  },
};

export const handleIntrospectSchema = async (
  args: any,
  client: GraphQLClientService
): Promise<SchemaIntrospectionResult> => {
  const logger = getLogger();
  const startTime = Date.now();

  try {
    // Validate and parse arguments
    const params = IntrospectSchemaParamsSchema.parse(args);
    
    logger.debug('Starting schema introspection', { 
      format: params.format,
      includeDescription: params.includeDescription,
      includeDeprecated: params.includeDeprecated,
      hasHeaders: !!params.headers,
    });

    // Get schema info with per-request headers
    const schemaInfo = await client.introspectSchema(params.headers);
    
    // Count schema elements
    const typeMap = schemaInfo.schema.getTypeMap();
    const queryType = schemaInfo.schema.getQueryType();
    const mutationType = schemaInfo.schema.getMutationType();
    const subscriptionType = schemaInfo.schema.getSubscriptionType();

    const types = Object.keys(typeMap).filter(name => !name.startsWith('__')).length;
    const queries = queryType ? Object.keys(queryType.getFields()).length : 0;
    const mutations = mutationType ? Object.keys(mutationType.getFields()).length : 0;
    const subscriptions = subscriptionType ? Object.keys(subscriptionType.getFields()).length : 0;

    // Prepare output based on format
    let schemaOutput: string;
    
    switch (params.format) {
      case 'json':
        schemaOutput = JSON.stringify({
          types: typeMap,
          queryType: queryType?.name,
          mutationType: mutationType?.name,
          subscriptionType: subscriptionType?.name,
        }, null, 2);
        break;
      
      case 'introspection':
        // Return raw introspection result
        const introspectionQuery = client.getSchema()?.schema;
        if (introspectionQuery) {
          const { introspectionFromSchema } = await import('graphql');
          schemaOutput = JSON.stringify(introspectionFromSchema(introspectionQuery), null, 2);
        } else {
          throw new Error('Schema not available for introspection format');
        }
        break;
      
      case 'sdl':
      default:
        schemaOutput = schemaInfo.sdl;
        break;
    }

    const duration = Date.now() - startTime;
    logger.performance('Schema introspection', duration, {
      types,
      queries,
      mutations,
      subscriptions,
      format: params.format,
    });

    return {
      schema: schemaOutput,
      format: params.format,
      types,
      queries,
      mutations,
      subscriptions,
      version: schemaInfo.version,
      lastUpdated: schemaInfo.lastUpdated.toISOString(),
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Schema introspection failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      duration,
    });
    throw error;
  }
}; 