# MCP GraphQL Server

A powerful and feature-rich Model Context Protocol (MCP) server for GraphQL APIs. This server provides advanced GraphQL capabilities including schema introspection, query execution, analysis, caching, and comprehensive security features.

## Features

### Core Capabilities
- **Schema Introspection**: Retrieve and analyze GraphQL schemas with multiple output formats
- **Query Execution**: Execute GraphQL queries, mutations, and subscriptions with validation
- **Query Analysis**: Analyze query complexity, depth, and structure
- **Intelligent Caching**: LRU cache with TTL for improved performance
- **Security Controls**: Query depth/complexity limits, rate limiting, and introspection controls
- **Comprehensive Logging**: Structured logging with performance metrics

### Advanced Features
- **Dry Run Mode**: Validate queries without execution
- **Multiple Output Formats**: SDL, JSON, and raw introspection formats
- **Error Handling**: Detailed error reporting with context
- **Configuration Flexibility**: Environment variables or JSON config file
- **TypeScript Support**: Full TypeScript implementation with type safety

## Installation

```bash
npm install mcp-gql
```

## Quick Start

### Using Environment Variables

```bash
export MCP_GQL_ENDPOINT="https://api.github.com/graphql"
export MCP_GQL_HEADERS='{"Authorization": "Bearer YOUR_TOKEN"}'
npx mcp-gql
```

### Using Configuration File

Create `mcp-gql.config.json`:

```json
{
  "name": "github-graphql",
  "endpoint": "https://api.github.com/graphql",
  "headers": {
    "Authorization": "Bearer YOUR_TOKEN_HERE"
  },
  "allowMutations": false,
  "cache": {
    "enabled": true,
    "ttl": 300000
  },
  "logging": {
    "level": "info",
    "performance": true
  }
}
```

Then run:

```bash
npx mcp-gql
```

## Configuration

### Configuration File Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `name` | string | `"mcp-gql"` | Server name |
| `endpoint` | string | **Required** | GraphQL endpoint URL |
| `headers` | object | `{}` | HTTP headers for requests |
| `allowMutations` | boolean | `false` | Allow mutation operations |
| `allowSubscriptions` | boolean | `false` | Allow subscription operations |
| `timeout` | number | `30000` | Request timeout in milliseconds |
| `retries` | number | `3` | Number of retry attempts |

#### Cache Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `cache.enabled` | boolean | `true` | Enable caching |
| `cache.ttl` | number | `300000` | Cache TTL in milliseconds |
| `cache.maxSize` | number | `100` | Maximum cache entries |

#### Security Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `security.maxDepth` | number | `10` | Maximum query depth |
| `security.maxComplexity` | number | `1000` | Maximum query complexity |
| `security.allowIntrospection` | boolean | `true` | Allow schema introspection |
| `security.rateLimiting.enabled` | boolean | `false` | Enable rate limiting |
| `security.rateLimiting.windowMs` | number | `60000` | Rate limit window |
| `security.rateLimiting.max` | number | `100` | Max requests per window |

#### Logging Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `logging.level` | string | `"info"` | Log level (error, warn, info, debug) |
| `logging.queries` | boolean | `false` | Log executed queries |
| `logging.performance` | boolean | `false` | Log performance metrics |

### Environment Variables

All configuration options can be set via environment variables with the `MCP_GQL_` prefix:

```bash
MCP_GQL_ENDPOINT="https://api.example.com/graphql"
MCP_GQL_HEADERS='{"Authorization": "Bearer token"}'
MCP_GQL_ALLOW_MUTATIONS="true"
MCP_GQL_CACHE_ENABLED="true"
MCP_GQL_CACHE_TTL="600000"
MCP_GQL_LOG_LEVEL="debug"
MCP_GQL_LOG_PERFORMANCE="true"
```

## Available Tools

### 1. introspect-schema

Retrieve and analyze the GraphQL schema from the endpoint.

**Parameters:**
- `format` (optional): Output format - `"sdl"`, `"json"`, or `"introspection"` (default: `"sdl"`)
- `includeDescription` (optional): Include descriptions (default: `true`)
- `includeDeprecated` (optional): Include deprecated fields (default: `false`)
- `useCache` (optional): Use cached schema (default: `true`)

**Example:**
```json
{
  "format": "sdl",
  "includeDescription": true,
  "useCache": true
}
```

**Response:**
```json
{
  "schema": "type Query { ... }",
  "format": "sdl",
  "types": 42,
  "queries": 15,
  "mutations": 8,
  "subscriptions": 3,
  "version": "abc123",
  "lastUpdated": "2024-01-01T00:00:00.000Z"
}
```

### 2. query-graphql

Execute GraphQL queries, mutations, or subscriptions.

**Parameters:**
- `query` (required): GraphQL query string
- `variables` (optional): Query variables
- `operationName` (optional): Operation name for multi-operation queries
- `validate` (optional): Validate query before execution (default: `true`)
- `dryRun` (optional): Parse and validate without execution (default: `false`)
- `useCache` (optional): Use cached results (default: `true`)

**Example:**
```json
{
  "query": "query GetUser($id: ID!) { user(id: $id) { name email } }",
  "variables": { "id": "123" },
  "validate": true,
  "dryRun": false
}
```

**Response:**
```json
{
  "data": {
    "user": {
      "name": "John Doe",
      "email": "john@example.com"
    }
  },
  "extensions": {
    "metrics": {
      "duration": 150,
      "cacheHit": false
    }
  }
}
```

### 3. analyze-query

Analyze GraphQL queries for complexity, depth, and structure.

**Parameters:**
- `query` (required): GraphQL query to analyze
- `variables` (optional): Query variables
- `includeComplexity` (optional): Include complexity analysis (default: `true`)
- `includeDepth` (optional): Include depth analysis (default: `true`)
- `includeFields` (optional): Include field extraction (default: `true`)

**Example:**
```json
{
  "query": "query { users { posts { comments { author } } } }",
  "includeComplexity": true,
  "includeDepth": true
}
```

**Response:**
```json
{
  "operation": "query",
  "complexity": 45,
  "depth": 4,
  "fields": ["users", "posts", "comments", "author"],
  "variables": [],
  "fragments": [],
  "warnings": ["Deep query nesting: 4 levels. This may impact performance."],
  "errors": []
}
```

## Library Usage

You can also use this as a library in your Node.js applications:

```typescript
import { createMcpGraphQLServer, McpConfig } from 'mcp-gql';

const config: McpConfig = {
  name: 'my-graphql-server',
  endpoint: 'https://api.example.com/graphql',
  headers: {
    'Authorization': 'Bearer token'
  },
  allowMutations: true,
  cache: {
    enabled: true,
    ttl: 300000,
    maxSize: 100
  }
};

const server = createMcpGraphQLServer(config);

// Start the server
await server.start();

// Access services directly
const client = server.getClient();
const schema = await client.introspectSchema();
console.log('Schema version:', schema.version);

// Stop the server
await server.stop();
```

## Error Handling

The server provides comprehensive error handling with detailed context:

```json
{
  "error": "Query validation failed",
  "tool": "query-graphql",
  "args": { "query": "invalid query" },
  "details": {
    "errors": [
      {
        "message": "Syntax Error: Expected Name, found }",
        "locations": [{ "line": 1, "column": 15 }]
      }
    ]
  }
}
```

## Performance Features

### Caching
- **Schema Caching**: Schemas are cached to avoid repeated introspection
- **Query Caching**: Query results are cached (excluding mutations/subscriptions)
- **LRU Eviction**: Automatic cache cleanup with configurable size limits
- **TTL Support**: Time-based cache expiration

### Performance Monitoring
- **Execution Metrics**: Track query execution time and cache hit rates
- **Performance Logging**: Optional detailed performance logging
- **Query Analysis**: Complexity and depth analysis for optimization

## Security Features

### Query Protection
- **Depth Limiting**: Prevent deeply nested queries
- **Complexity Analysis**: Block overly complex queries
- **Validation**: Schema-based query validation
- **Operation Control**: Disable mutations/subscriptions as needed

### Access Control
- **Header-based Auth**: Support for various authentication methods
- **Rate Limiting**: Configurable request rate limiting
- **Introspection Control**: Option to disable schema introspection

## Development

### Building from Source

```bash
git clone https://github.com/your-org/mcp-gql.git
cd mcp-gql
npm install
npm run build
```

### Running Tests

```bash
npm test
```

### Development Mode

```bash
npm run dev
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Changelog

### v1.0.0
- Initial release with comprehensive GraphQL MCP server
- Schema introspection with multiple output formats
- Query execution with caching and validation
- Query analysis and complexity detection
- Security features and performance monitoring
- TypeScript implementation with full type safety 