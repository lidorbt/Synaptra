import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { AnalyzeQueryParamsSchema, QueryAnalysisResult } from '../types';
import { GraphQLClientService } from '../services/graphql-client';
import { getLogger } from '../utils/logger';

export const analyzeQueryTool: Tool = {
  name: 'analyze-query',
  description: 'Analyze a GraphQL query to provide insights about complexity, depth, fields, and potential issues.',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The GraphQL query to analyze',
      },
      variables: {
        type: 'object',
        description: 'Variables used in the query',
        additionalProperties: true,
      },
      includeComplexity: {
        type: 'boolean',
        default: true,
        description: 'Include complexity analysis in the result',
      },
      includeDepth: {
        type: 'boolean',
        default: true,
        description: 'Include depth analysis in the result',
      },
      includeFields: {
        type: 'boolean',
        default: true,
        description: 'Include field extraction in the result',
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

export const handleAnalyzeQuery = async (
  args: any,
  client: GraphQLClientService
): Promise<QueryAnalysisResult> => {
  const logger = getLogger();
  const startTime = Date.now();

  try {
    // Validate and parse arguments
    const params = AnalyzeQueryParamsSchema.parse(args);
    
    logger.debug('Starting query analysis', { 
      includeComplexity: params.includeComplexity,
      includeDepth: params.includeDepth,
      includeFields: params.includeFields,
      hasVariables: !!params.variables,
      hasHeaders: !!params.headers,
    });

    // Analyze the query
    const analysis = await client.analyzeQuery(params.query, params.variables);
    
    const result: QueryAnalysisResult = {
      operation: analysis.operation,
    };

    if (params.includeComplexity) {
      result.complexity = analysis.complexity;
    }

    if (params.includeDepth) {
      result.depth = analysis.depth;
    }

    if (params.includeFields) {
      result.fields = analysis.fields;
      result.variables = analysis.variables;
      result.fragments = analysis.fragments;
    }

    // Add warnings and errors based on analysis
    result.warnings = [];
    result.errors = [];

    // Check for potential issues
    if (analysis.complexity && analysis.complexity > 100) {
      result.warnings.push(`High query complexity: ${analysis.complexity}. Consider simplifying the query.`);
    }

    if (analysis.depth && analysis.depth > 10) {
      result.warnings.push(`Deep query nesting: ${analysis.depth} levels. This may impact performance.`);
    }

    if (analysis.fields && analysis.fields.length > 50) {
      result.warnings.push(`Large number of fields: ${analysis.fields.length}. Consider using fragments or pagination.`);
    }

    const duration = Date.now() - startTime;
    logger.performance('Query analysis', duration, {
      operation: analysis.operation,
      complexity: analysis.complexity,
      depth: analysis.depth,
      fieldCount: analysis.fields?.length,
      warningCount: result.warnings.length,
    });

    return result;

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Query analysis failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      duration,
    });
    throw error;
  }
}; 