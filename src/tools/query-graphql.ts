import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { QueryGraphQLParamsSchema, QueryResult } from '../types';
import { GraphQLClientService } from '../services/graphql-client';
import { getLogger } from '../utils/logger';

export const queryGraphQLTool: Tool = {
  name: 'query-graphql',
  description: 'Execute GraphQL queries, mutations, or subscriptions against the configured endpoint. Supports validation and dry-run mode.',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The GraphQL query, mutation, or subscription to execute',
      },
      variables: {
        type: 'object',
        description: 'Variables to pass to the GraphQL operation',
        additionalProperties: true,
      },
      operationName: {
        type: 'string',
        description: 'The name of the operation to execute (if query contains multiple operations)',
      },
      validate: {
        type: 'boolean',
        default: true,
        description: 'Validate the query against the schema before execution',
      },
      dryRun: {
        type: 'boolean',
        default: false,
        description: 'Parse and validate the query without executing it',
      },
      headers: {
        type: 'object',
        description: 'HTTP headers to include with the request (e.g., Authorization)',
        additionalProperties: {
          type: 'string'
        },
      },
    },
    required: ['query'],
  },
};

export const handleQueryGraphQL = async (
  args: any,
  client: GraphQLClientService,
  allowMutations: boolean = false,
  allowSubscriptions: boolean = false
): Promise<QueryResult> => {
  const logger = getLogger();
  const startTime = Date.now();

  try {
    // Validate and parse arguments
    const params = QueryGraphQLParamsSchema.parse(args);
    
    logger.debug('Starting GraphQL query execution', { 
      operationName: params.operationName,
      validate: params.validate,
      dryRun: params.dryRun,
      hasVariables: !!params.variables,
      hasHeaders: !!params.headers,
    });

    // Log the query if query logging is enabled
    logger.query(params.query, params.variables);

    // Check operation type for security
    const operationType = detectOperationType(params.query);
    
    if (operationType === 'mutation' && !allowMutations) {
      throw new Error('Mutations are disabled. Set allowMutations to true to enable them.');
    }
    
    if (operationType === 'subscription' && !allowSubscriptions) {
      throw new Error('Subscriptions are disabled. Set allowSubscriptions to true to enable them.');
    }

    // Execute the query
    const queryInfo: any = {
      query: params.query,
    };
    
    if (params.variables) {
      queryInfo.variables = params.variables;
    }
    
    if (params.operationName) {
      queryInfo.operationName = params.operationName;
    }
    
    if (params.headers) {
      queryInfo.headers = params.headers;
    }
    
    const result = await client.executeQuery(
      queryInfo,
      params.dryRun
    );

    const duration = Date.now() - startTime;
    logger.performance('GraphQL query execution', duration, {
      operationType,
      operationName: params.operationName,
      dryRun: params.dryRun,
      hasErrors: !!result.errors?.length,
    });

    return result;

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('GraphQL query execution failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      duration,
    });
    throw error;
  }
};

// Helper function to detect operation type from query string
function detectOperationType(query: string): string {
  const trimmedQuery = query.trim().toLowerCase();
  
  if (trimmedQuery.startsWith('mutation')) {
    return 'mutation';
  } else if (trimmedQuery.startsWith('subscription')) {
    return 'subscription';
  } else if (trimmedQuery.startsWith('query') || trimmedQuery.startsWith('{')) {
    return 'query';
  }
  
  // Try to parse for more complex cases
  try {
    const { parse } = require('graphql');
    const doc = parse(query);
    const operationDef = doc.definitions.find((def: any) => def.kind === 'OperationDefinition');
    return operationDef?.operation || 'query';
  } catch {
    return 'query'; // Default to query if we can't parse
  }
} 