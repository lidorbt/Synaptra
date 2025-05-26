import {
  buildClientSchema,
  getIntrospectionQuery,
  validate,
  parse,
  print,
  DocumentNode,
  printSchema,
} from 'graphql';
import { GraphQLClient } from 'graphql-request';
import {
  GraphQLEndpoint,
  SchemaInfo,
  QueryInfo,
  QueryResult,
  SchemaError,
  QueryError,
  NetworkError,
  ValidationError,
  PerformanceMetrics,
} from '../types';

export class GraphQLClientService {
  private endpoint: GraphQLEndpoint;
  private client: GraphQLClient;
  private schema: SchemaInfo | null = null;

  constructor(
    endpoint: GraphQLEndpoint,
    private maxRetries: number = 3
  ) {
    this.endpoint = endpoint;
    this.client = new GraphQLClient(endpoint.url, {
      headers: endpoint.headers,
    });
  }

  async introspectSchema(requestHeaders?: Record<string, string>): Promise<SchemaInfo> {
    try {
      const introspectionQuery = getIntrospectionQuery();
      
      const queryInfo: QueryInfo = {
        query: introspectionQuery,
      };
      
      if (requestHeaders) {
        queryInfo.headers = requestHeaders;
      }
      
      const queryResult = await this.executeQuery(queryInfo);

      if (queryResult.errors || !queryResult.data) {
        throw new SchemaError(
          'Failed to introspect schema',
          { errors: queryResult.errors }
        );
      }

      const schema = buildClientSchema(queryResult.data);
      const sdl = printSchema(schema);
      
      const schemaInfo: SchemaInfo = {
        schema,
        sdl,
        lastUpdated: new Date(),
        version: this.generateSchemaVersion(sdl),
      };

      this.schema = schemaInfo;
      
      return schemaInfo;
    } catch (error) {
      if (error instanceof SchemaError) {
        throw error;
      }
      throw new SchemaError(
        `Schema introspection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { originalError: error }
      );
    }
  }

  async executeQuery(
    queryInfo: QueryInfo,
    dryRun: boolean = false
  ): Promise<QueryResult> {
    const metrics: PerformanceMetrics = { startTime: Date.now() };
    
    try {
      // Parse query if it's a string
      const queryDoc = typeof queryInfo.query === 'string' 
        ? parse(queryInfo.query) 
        : queryInfo.query;
      
      const queryString = print(queryDoc);
      
      // Validate query against schema if available
      if (this.schema) {
        const validationErrors = validate(this.schema.schema, queryDoc);
        if (validationErrors.length > 0) {
          throw new ValidationError(
            'Query validation failed',
            { errors: validationErrors }
          );
        }
      }

      if (dryRun) {
        return {
          data: null,
          extensions: {
            dryRun: true,
            query: queryString,
            variables: queryInfo.variables,
            metrics,
          },
        };
      }

      // Merge default headers with request-specific headers
      const headers = {
        ...this.endpoint.headers,
        ...(queryInfo.headers || {}),
      };

      // Execute query with retry logic
      let lastError: Error | null = null;
      
      for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
        try {
          const result = await this.client.request(
            queryDoc,
            queryInfo.variables,
            headers
          );

          metrics.endTime = Date.now();
          metrics.duration = metrics.endTime - metrics.startTime;

          const queryResult: QueryResult = {
            data: result,
            extensions: { metrics },
          };

          return queryResult;
        } catch (error) {
          lastError = error as Error;
          
          if (attempt < this.maxRetries) {
            // Wait before retry (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          }
        }
      }

      throw new NetworkError(
        `Query execution failed after ${this.maxRetries + 1} attempts`,
        { originalError: lastError }
      );

    } catch (error) {
      if (error instanceof ValidationError || error instanceof NetworkError) {
        throw error;
      }
      
      throw new QueryError(
        `Query execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { originalError: error }
      );
    }
  }

  async analyzeQuery(query: string, variables?: Record<string, any>) {
    try {
      const queryDoc = parse(query);
      const analysis = {
        operation: this.getOperationType(queryDoc),
        complexity: this.calculateComplexity(queryDoc),
        depth: this.calculateDepth(queryDoc),
        fields: this.extractFields(queryDoc),
        variables: variables ? Object.keys(variables) : [],
        fragments: this.extractFragments(queryDoc),
      };

      return analysis;
    } catch (error) {
      throw new ValidationError(
        `Query analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { originalError: error }
      );
    }
  }

  getSchema(): SchemaInfo | null {
    return this.schema;
  }

  updateEndpoint(endpoint: Partial<GraphQLEndpoint>) {
    this.endpoint = { ...this.endpoint, ...endpoint };
    this.client = new GraphQLClient(this.endpoint.url, {
      headers: this.endpoint.headers,
    });
  }

  private generateSchemaVersion(sdl: string): string {
    const crypto = require('crypto');
    return crypto.createHash('md5').update(sdl).digest('hex').substring(0, 8);
  }

  private getOperationType(query: DocumentNode): string {
    const operationDef = query.definitions.find(def => def.kind === 'OperationDefinition');
    return operationDef?.kind === 'OperationDefinition' ? operationDef.operation : 'unknown';
  }

  private calculateComplexity(query: DocumentNode): number {
    // Simple complexity calculation - count field selections
    let complexity = 0;
    
    const visit = (node: any) => {
      if (node.kind === 'Field') {
        complexity++;
      }
      if (node.selectionSet) {
        node.selectionSet.selections.forEach(visit);
      }
    };

    query.definitions.forEach(def => {
      if (def.kind === 'OperationDefinition' && def.selectionSet) {
        def.selectionSet.selections.forEach(visit);
      }
    });

    return complexity;
  }

  private calculateDepth(query: DocumentNode): number {
    let maxDepth = 0;
    
    const visit = (node: any, depth: number) => {
      maxDepth = Math.max(maxDepth, depth);
      if (node.selectionSet) {
        node.selectionSet.selections.forEach((selection: any) => {
          if (selection.kind === 'Field') {
            visit(selection, depth + 1);
          }
        });
      }
    };

    query.definitions.forEach(def => {
      if (def.kind === 'OperationDefinition' && def.selectionSet) {
        def.selectionSet.selections.forEach((selection: any) => {
          if (selection.kind === 'Field') {
            visit(selection, 1);
          }
        });
      }
    });

    return maxDepth;
  }

  private extractFields(query: DocumentNode): string[] {
    const fields: string[] = [];
    
    const visit = (node: any) => {
      if (node.kind === 'Field') {
        fields.push(node.name.value);
      }
      if (node.selectionSet) {
        node.selectionSet.selections.forEach(visit);
      }
    };

    query.definitions.forEach(def => {
      if (def.kind === 'OperationDefinition' && def.selectionSet) {
        def.selectionSet.selections.forEach(visit);
      }
    });

    return [...new Set(fields)]; // Remove duplicates
  }

  private extractFragments(query: DocumentNode): string[] {
    const fragments: string[] = [];
    
    query.definitions.forEach(def => {
      if (def.kind === 'FragmentDefinition') {
        fragments.push(def.name.value);
      }
    });

    return fragments;
  }
} 