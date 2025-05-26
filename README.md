# MCP GraphQL Server

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

An enterprise-grade Model Context Protocol (MCP) server designed for GraphQL API integration. This production-ready solution provides comprehensive GraphQL capabilities including schema introspection, query execution, complexity analysis, and advanced security features with flexible authentication mechanisms.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Authentication](#authentication)
- [Available Tools](#available-tools)
- [Security](#security)
- [Performance](#performance)
- [Library Usage](#library-usage)
- [Error Handling](#error-handling)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

## Features

### Core Capabilities

- **🔍 Schema Introspection**: Comprehensive GraphQL schema analysis with multiple output formats (SDL, JSON, Raw)
- **⚡ Query Execution**: Execute GraphQL queries, mutations, and subscriptions with built-in validation
- **📊 Query Analysis**: Advanced complexity and depth analysis with performance insights
- **🔐 Flexible Authentication**: Default API key with per-request header override capabilities
- **🛡️ Enterprise Security**: Query depth/complexity limits, rate limiting, and introspection controls
- **📝 Comprehensive Logging**: Structured logging with performance metrics and query tracking

### Advanced Features

- **🧪 Dry Run Mode**: Validate and analyze queries without execution
- **🔄 Automatic Retries**: Configurable retry logic with exponential backoff
- **⚙️ Configuration Flexibility**: Support for environment variables and JSON configuration files
- **🏗️ TypeScript Native**: Full TypeScript implementation with comprehensive type safety
- **📈 Performance Monitoring**: Built-in metrics collection and performance analysis
- **🔌 Extensible Architecture**: Plugin-ready design for custom extensions

## Installation

### NPM

```bash
npm install mcp-gql
```

### Yarn

```bash
yarn add mcp-gql
```

### Global Installation

```bash
npm install -g mcp-gql
```

## Quick Start

### Environment Variables (Recommended for Development)

```bash
export MCP_GQL_ENDPOINT="https://api.github.com/graphql"
export MCP_GQL_DEFAULT_API_KEY="your-github-token"
export MCP_GQL_LOG_LEVEL="info"

npx mcp-gql
```

### Configuration File (Recommended for Production)

Create `mcp-gql.config.json`:

```json
{
  "name": "production-graphql-server",
  "endpoint": "https://api.github.com/graphql",
  "defaultApiKey": "ghp_your_production_token",
  "headers": {
    "User-Agent": "MyCompany-GraphQL-Server/1.0.0"
  },
  "allowMutations": false,
  "security": {
    "maxDepth": 8,
    "maxComplexity": 500,
    "allowIntrospection": true
  },
  "logging": {
    "level": "info",
    "performance": true,
    "queries": false
  }
}
```

Execute the server:

```bash
npx mcp-gql
```

## Configuration

### Configuration Options

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `name` | `string` | `"mcp-gql"` | Server identification name |
| `endpoint` | `string` | **Required** | Target GraphQL endpoint URL |
| `headers` | `object` | `{}` | Default HTTP headers for all requests |
| `defaultApiKey` | `string` | `undefined` | Fallback API key when no Authorization header provided |
| `allowMutations` | `boolean` | `false` | Enable GraphQL mutation operations |
| `allowSubscriptions` | `boolean` | `false` | Enable GraphQL subscription operations |
| `timeout` | `number` | `30000` | Request timeout in milliseconds |
| `retries` | `number` | `3` | Maximum retry attempts for failed requests |

### Security Configuration

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `security.maxDepth` | `number` | `10` | Maximum allowed query nesting depth |
| `security.maxComplexity` | `number` | `1000` | Maximum query complexity score |
| `security.allowIntrospection` | `boolean` | `true` | Enable schema introspection capabilities |
| `security.rateLimiting.enabled` | `boolean` | `false` | Enable request rate limiting |
| `security.rateLimiting.windowMs` | `number` | `60000` | Rate limiting time window (ms) |
| `security.rateLimiting.max` | `number` | `100` | Maximum requests per time window |

### Logging Configuration

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `logging.level` | `string` | `"info"` | Log level: `error`, `warn`, `info`, `debug` |
| `logging.queries` | `boolean` | `false` | Log executed GraphQL queries |
| `logging.performance` | `boolean` | `false` | Enable performance metrics logging |

### Environment Variables

Configure the server using environment variables with the `MCP_GQL_` prefix:

```bash
# Core Configuration
MCP_GQL_ENDPOINT="https://api.example.com/graphql"
MCP_GQL_DEFAULT_API_KEY="your-api-token"
MCP_GQL_HEADERS='{"User-Agent": "MyApp/1.0", "X-Custom": "value"}'

# Security Settings
MCP_GQL_MAX_DEPTH="10"
MCP_GQL_MAX_COMPLEXITY="1000"
MCP_GQL_ALLOW_MUTATIONS="false"

# Logging Configuration
MCP_GQL_LOG_LEVEL="info"
MCP_GQL_LOG_PERFORMANCE="true"
MCP_GQL_LOG_QUERIES="false"
```

## Authentication

The server implements a sophisticated authentication hierarchy that balances convenience with security:

### Authentication Priority Order

1. **Per-Request Headers** (Highest Priority)
   - Authorization headers provided in individual tool requests
   - Overrides all default authentication

2. **Default API Key** (Fallback)
   - Configured via `defaultApiKey` parameter
   - Used when no per-request Authorization header is provided

3. **Default Headers** (Base Configuration)
   - Static headers from server configuration
   - Applied to all requests unless overridden

### Implementation Examples

#### Default API Key Configuration

```json
{
  "endpoint": "https://api.github.com/graphql",
  "defaultApiKey": "ghp_your_default_token",
  "headers": {
    "User-Agent": "Enterprise-GraphQL-Client/1.0"
  }
}
```

#### Per-Request Authentication Override

```json
{
  "query": "query { viewer { login } }",
  "headers": {
    "Authorization": "Bearer ghp_user_specific_token",
    "X-Request-ID": "req-12345"
  }
}
```

### Security Benefits

- **🔐 Token Isolation**: Default tokens aren't exposed in request logs
- **👥 Multi-Tenant Support**: Different users can authenticate with separate tokens
- **⚡ Performance**: Reduced authentication overhead for bulk operations
- **🛡️ Audit Trail**: Clear distinction between default and user-specific authentication

## Available Tools

### 1. Schema Introspection (`introspect-schema`)

Retrieves and analyzes GraphQL schemas with comprehensive metadata extraction.

**Parameters:**
- `format` (*optional*): Output format - `"sdl"`, `"json"`, or `"introspection"` (default: `"sdl"`)
- `includeDescription` (*optional*): Include field descriptions (default: `true`)
- `includeDeprecated` (*optional*): Include deprecated elements (default: `false`)
- `headers` (*optional*): Request-specific HTTP headers

**Request Example:**
```json
{
  "format": "sdl",
  "includeDescription": true,
  "headers": {
    "Authorization": "Bearer user-specific-token"
  }
}
```

**Response Example:**
```json
{
  "schema": "type Query { user(id: ID!): User }",
  "format": "sdl",
  "types": 42,
  "queries": 15,
  "mutations": 8,
  "subscriptions": 3,
  "version": "abc123",
  "lastUpdated": "2024-01-01T00:00:00.000Z"
}
```

### 2. Query Execution (`query-graphql`)

Executes GraphQL operations with comprehensive validation and security controls.

**Parameters:**
- `query` (*required*): GraphQL query string
- `variables` (*optional*): Query variables object
- `operationName` (*optional*): Specific operation name for multi-operation documents
- `validate` (*optional*): Enable schema validation (default: `true`)
- `dryRun` (*optional*): Validate without execution (default: `false`)
- `headers` (*optional*): Request-specific HTTP headers

**Request Example:**
```json
{
  "query": "query GetUser($id: ID!) { user(id: $id) { name email } }",
  "variables": { "id": "user-123" },
  "validate": true,
  "headers": {
    "Authorization": "Bearer user-token"
  }
}
```

**Response Example:**
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
      "duration": 145,
      "complexity": 12,
      "depth": 2
    }
  }
}
```

### 3. Query Analysis (`analyze-query`)

Performs comprehensive analysis of GraphQL queries for optimization and security assessment.

**Parameters:**
- `query` (*required*): GraphQL query to analyze
- `variables` (*optional*): Query variables for analysis context
- `includeComplexity` (*optional*): Include complexity metrics (default: `true`)
- `includeDepth` (*optional*): Include depth analysis (default: `true`)
- `includeFields` (*optional*): Include field extraction (default: `true`)
- `headers` (*optional*): Request-specific HTTP headers

**Request Example:**
```json
{
  "query": "query { users { posts { comments { author } } } }",
  "includeComplexity": true,
  "includeDepth": true
}
```

**Response Example:**
```json
{
  "operation": "query",
  "complexity": 45,
  "depth": 4,
  "fields": ["users", "posts", "comments", "author"],
  "variables": [],
  "fragments": [],
  "warnings": [
    "Deep query nesting: 4 levels. Consider query optimization."
  ],
  "errors": []
}
```

## Security

### Query Protection Mechanisms

- **Depth Limiting**: Prevents deeply nested query attacks
- **Complexity Analysis**: Blocks computationally expensive operations
- **Schema Validation**: Ensures query compliance with target schema
- **Operation Control**: Granular control over mutations and subscriptions

### Access Control Features

- **Flexible Authentication**: Multi-tier authentication with fallback mechanisms
- **Rate Limiting**: Configurable request throttling
- **Introspection Control**: Optional schema introspection disabling
- **Audit Logging**: Comprehensive request and error logging

### Production Security Recommendations

```json
{
  "security": {
    "maxDepth": 8,
    "maxComplexity": 500,
    "allowIntrospection": false,
    "rateLimiting": {
      "enabled": true,
      "windowMs": 60000,
      "max": 100
    }
  },
  "logging": {
    "level": "warn",
    "queries": false,
    "performance": true
  }
}
```

## Performance

### Built-in Performance Features

- **Execution Metrics**: Automatic tracking of query execution times
- **Complexity Analysis**: Real-time query complexity assessment
- **Performance Logging**: Detailed metrics for optimization insights
- **Retry Logic**: Intelligent retry mechanisms with exponential backoff

### Performance Monitoring

The server automatically collects and reports:
- Query execution duration
- Schema introspection performance
- Error rates and retry statistics
- Complexity and depth metrics

### Optimization Recommendations

- Enable performance logging for production monitoring
- Set appropriate complexity and depth limits
- Use dry-run mode for query validation during development
- Monitor query patterns for optimization opportunities

## Library Usage

### TypeScript Integration

```typescript
import { createMcpGraphQLServer, McpConfig } from 'mcp-gql';

const config: McpConfig = {
  name: 'enterprise-graphql-server',
  endpoint: 'https://api.example.com/graphql',
  defaultApiKey: 'your-enterprise-token',
  headers: {
    'User-Agent': 'Enterprise-App/2.0.0'
  },
  security: {
    maxDepth: 8,
    maxComplexity: 500,
    allowIntrospection: false
  },
  allowMutations: true
};

const server = createMcpGraphQLServer(config);

// Lifecycle management
await server.start();

// Direct client access
const client = server.getClient();

// Default authentication usage
const schema = await client.introspectSchema();

// Per-request authentication override
const userSchema = await client.introspectSchema({
  'Authorization': 'Bearer user-specific-token'
});

// Graceful shutdown
await server.stop();
```

### JavaScript Integration

```javascript
const { createMcpGraphQLServer } = require('mcp-gql');

const config = {
  name: 'production-server',
  endpoint: 'https://api.example.com/graphql',
  defaultApiKey: process.env.GRAPHQL_API_KEY,
  allowMutations: false
};

async function main() {
  const server = createMcpGraphQLServer(config);
  await server.start();
  
  // Server is now running and ready to handle MCP requests
  console.log('GraphQL MCP Server is running');
}

main().catch(console.error);
```

## Error Handling

The server provides comprehensive error handling with detailed context and actionable information:

### Error Response Format

```json
{
  "error": "Query validation failed",
  "tool": "query-graphql",
  "args": { "query": "invalid query syntax" },
  "details": {
    "errors": [
      {
        "message": "Syntax Error: Expected Name, found }",
        "locations": [{ "line": 1, "column": 15 }],
        "path": null
      }
    ],
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

### Error Categories

- **Validation Errors**: Schema validation failures with specific field information
- **Network Errors**: Connection and timeout issues with retry information
- **Authentication Errors**: Authorization failures with security context
- **Query Errors**: GraphQL execution errors with detailed error paths

## Development

### Local Development Setup

```bash
# Clone the repository
git clone https://github.com/your-org/mcp-gql.git
cd mcp-gql

# Install dependencies
npm install

# Build the project
npm run build

# Run in development mode
npm run dev
```

### Testing

```bash
# Run the test suite
npm test

# Run tests with coverage
npm run test:coverage

# Run integration tests
npm run test:integration
```

### Building for Production

```bash
# Create production build
npm run build

# Verify build output
npm run verify

# Package for distribution
npm pack
```

## Contributing

We welcome contributions from the community! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details on:

- Code of Conduct
- Development workflow
- Testing requirements
- Pull request process
- Issue reporting

### Development Guidelines

1. Fork the repository and create a feature branch
2. Implement changes with comprehensive tests
3. Follow TypeScript best practices and coding standards
4. Update documentation for any API changes
5. Submit a pull request with detailed description

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for complete details.

---

## Support

- **Documentation**: [Full API Documentation](docs/api.md)
- **Issues**: [GitHub Issues](https://github.com/your-org/mcp-gql/issues)
- **Security**: [Security Policy](SECURITY.md)
- **Changelog**: [Release Notes](CHANGELOG.md)

---

*Built with ❤️ for the GraphQL and MCP communities* 