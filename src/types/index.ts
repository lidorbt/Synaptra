import { z } from 'zod';
import { GraphQLSchema, DocumentNode, GraphQLError } from 'graphql';

// Configuration schemas
export const McpConfigSchema = z.object({
  name: z.string().default('mcp-gql'),
  endpoint: z.string().url(),
  headers: z.record(z.string()).default({}), // Default headers, can be overridden per request
  defaultApiKey: z.string().optional(), // Default API key used when no Authorization header is provided
  allowMutations: z.boolean().default(false),
  allowSubscriptions: z.boolean().default(false),
  schema: z.string().optional(),
  timeout: z.number().default(30000),
  retries: z.number().default(3),
  security: z.object({
    maxDepth: z.number().default(10),
    maxComplexity: z.number().default(1000),
    allowIntrospection: z.boolean().default(true),
    rateLimiting: z.object({
      enabled: z.boolean().default(false),
      windowMs: z.number().default(60000),
      max: z.number().default(100),
    }).default({}),
  }).default({}),
  logging: z.object({
    level: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
    queries: z.boolean().default(false),
    performance: z.boolean().default(false),
  }).default({}),
});

export type McpConfig = z.infer<typeof McpConfigSchema>;

// GraphQL related types
export interface GraphQLEndpoint {
  url: string;
  headers: Record<string, string>;
  timeout: number;
}

export interface SchemaInfo {
  schema: GraphQLSchema;
  sdl: string;
  lastUpdated: Date;
  version: string;
}

export interface QueryInfo {
  query: string | DocumentNode;
  variables?: Record<string, any>;
  operationName?: string;
  context?: Record<string, any>;
  headers?: Record<string, string>; // Per-request headers
}

export interface QueryResult {
  data?: any;
  errors?: GraphQLError[];
  extensions?: Record<string, any>;
}

export interface PerformanceMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
  queryComplexity?: number;
  queryDepth?: number;
}

// Tool parameter schemas
export const IntrospectSchemaParamsSchema = z.object({
  format: z.enum(['sdl', 'json', 'introspection']).default('sdl'),
  includeDescription: z.boolean().default(true),
  includeDeprecated: z.boolean().default(false),
  headers: z.record(z.string()).optional(), // Per-request headers
});

export const QueryGraphQLParamsSchema = z.object({
  query: z.string(),
  variables: z.record(z.any()).optional(),
  operationName: z.string().optional(),
  validate: z.boolean().default(true),
  dryRun: z.boolean().default(false),
  headers: z.record(z.string()).optional(), // Per-request headers
});

export const BuildQueryParamsSchema = z.object({
  operation: z.enum(['query', 'mutation', 'subscription']),
  selection: z.string(),
  variables: z.record(z.any()).optional(),
  fragments: z.array(z.string()).optional(),
});

export const AnalyzeQueryParamsSchema = z.object({
  query: z.string(),
  variables: z.record(z.any()).optional(),
  includeComplexity: z.boolean().default(true),
  includeDepth: z.boolean().default(true),
  includeFields: z.boolean().default(true),
  headers: z.record(z.string()).optional(), // Per-request headers
});

// Response types
export interface SchemaIntrospectionResult {
  schema: string;
  format: string;
  types: number;
  queries: number;
  mutations: number;
  subscriptions: number;
  version: string;
  lastUpdated: string;
}

export interface QueryAnalysisResult {
  operation: string;
  complexity?: number;
  depth?: number;
  fields?: string[];
  variables?: string[];
  fragments?: string[];
  errors?: string[];
  warnings?: string[];
}

// Error types
export class McpGraphQLError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'McpGraphQLError';
  }
}

export class SchemaError extends McpGraphQLError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'SCHEMA_ERROR', details);
  }
}

export class QueryError extends McpGraphQLError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'QUERY_ERROR', details);
  }
}

export class ValidationError extends McpGraphQLError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'VALIDATION_ERROR', details);
  }
}

export class NetworkError extends McpGraphQLError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'NETWORK_ERROR', details);
  }
}

// Plugin system types
export interface Plugin {
  name: string;
  version: string;
  beforeRequest?: (query: QueryInfo) => Promise<QueryInfo>;
  afterRequest?: (result: QueryResult, query: QueryInfo) => Promise<QueryResult>;
  beforeIntrospection?: (endpoint: GraphQLEndpoint) => Promise<GraphQLEndpoint>;
  afterIntrospection?: (schema: SchemaInfo) => Promise<SchemaInfo>;
}

export interface Middleware {
  name: string;
  handler: (context: any, next: () => Promise<any>) => Promise<any>;
} 