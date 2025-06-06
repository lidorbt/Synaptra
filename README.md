# Synaptra 🚀

[![npm version](https://badge.fury.io/js/synaptra.svg)](https://badge.fury.io/js/synaptra)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

**Synaptra** is a high-performance Model Context Protocol (MCP) server for GraphQL APIs. It provides seamless integration between LLMs and GraphQL endpoints with advanced features like schema introspection, query optimization, caching, and comprehensive security controls.

## ✨ Features

- 🔍 **Automatic Schema Introspection** - Discovers and exposes GraphQL schema structures
- 🚀 **High Performance** - Built-in caching and query optimization  
- 🛡️ **Enterprise Security** - Rate limiting, query complexity analysis, and depth limiting
- 🔧 **Flexible Configuration** - Environment variables, config files, and runtime options
- 📊 **Advanced Logging** - Comprehensive query and performance logging
- 🎯 **Type Safety** - Full TypeScript support with generated types
- 🔄 **Real-time Support** - GraphQL subscriptions (configurable)
- 🎛️ **Developer Experience** - Rich error handling and debugging tools

## 📦 Installation

```bash
npm install synaptra
```

## 🚀 Quick Start

### As a Library

```typescript
import { createMcpGraphQLServer } from 'synaptra';

// Create server
const server = createMcpGraphQLServer({
  name: 'my-graphql-api',
  endpoint: 'https://api.example.com/graphql',
  headers: {
    'Authorization': 'Bearer your-token-here'
  }
});

// Get client for operations
const client = server.getClient();

// Execute queries
const result = await client.executeQuery({
  query: `
    query GetUsers {
      users(limit: 10) {
        id
        name
        email
      }
    }
  `
});
```

### CLI Usage

```bash
# Start MCP server
npx synaptra --endpoint https://api.example.com/graphql --name my-api

# With authentication
npx synaptra --endpoint https://api.example.com/graphql --api-key your-key --name my-api
```

## 📖 Configuration

### Server Configuration

```typescript
interface McpGraphQLConfig {
  name: string;                    // Server name
  endpoint: string;                // GraphQL endpoint URL
  defaultApiKey?: string;          // Optional default API key
  headers?: Record<string, string>; // Default headers
  allowMutations?: boolean;        // Allow mutations (default: true)
  allowSubscriptions?: boolean;    // Allow subscriptions (default: false)
  timeout?: number;                // Request timeout in ms (default: 30000)
  retries?: number;                // Retry attempts (default: 3)
  
  // Security settings
  security?: {
    maxDepth?: number;             // Max query depth (default: 15)
    maxComplexity?: number;        // Max query complexity (default: 1000)
    allowIntrospection?: boolean;  // Allow introspection (default: true)
  };
  
  // Logging configuration
  logging?: {
    level?: 'error' | 'warn' | 'info' | 'debug';
    queries?: boolean;             // Log queries (default: false)
    performance?: boolean;         // Log performance metrics
  };
}
```

### Environment Variables

```bash
SYNAPTRA_ENDPOINT=https://api.example.com/graphql
SYNAPTRA_API_KEY=your-api-key
SYNAPTRA_TIMEOUT=30000
LOG_LEVEL=info
```

## 🔧 Advanced Usage

### Per-Request Authentication

```typescript
// Execute query with custom headers
const result = await client.executeQuery({
  query: 'query { users { id name } }',
  headers: {
    'Authorization': 'Bearer user-specific-token',
    'X-User-ID': '12345'
  }
});
```

### Schema Analysis

```typescript
// Introspect schema
const schema = await client.introspectSchema();
console.log('Schema types:', schema.types.length);

// Analyze query complexity
const analysis = await client.analyzeQuery(`
  query ComplexQuery {
    users {
      posts {
        comments {
          author { name }
        }
      }
    }
  }
`);
console.log('Complexity:', analysis.complexity);
console.log('Depth:', analysis.depth);
```

### Dynamic Configuration

```typescript
// Update configuration at runtime
server.updateConfig({
  timeout: 60000,
  security: { maxDepth: 10 },
  logging: { level: 'debug' }
});
```

## 🛡️ Security Features

### Query Analysis
- **Depth Limiting**: Prevent deeply nested queries that could cause performance issues
- **Complexity Analysis**: Calculate and limit query complexity scores
- **Timeout Protection**: Automatic request timeout and cancellation

### Authentication
- **Flexible Auth**: Support for API keys, bearer tokens, custom headers
- **Per-Request Keys**: Override authentication on each request
- **Secure Headers**: Automatic header sanitization and validation

## 📊 Monitoring & Debugging

### Built-in Logging

```typescript
const server = createMcpGraphQLServer({
  endpoint: 'https://api.example.com/graphql',
  logging: {
    level: 'debug',
    queries: true,        // Log all queries
    performance: true     // Log execution times
  }
});
```

### Performance Metrics

```typescript
// Get performance statistics
const stats = client.getPerformanceStats();
console.log('Average response time:', stats.averageResponseTime);
console.log('Total requests:', stats.totalRequests);
console.log('Error rate:', stats.errorRate);
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run integration tests
npm run test:integration

# Test with your GraphQL endpoint
npm run test:local
```

## 📋 API Reference

### Methods

#### `createMcpGraphQLServer(config: McpGraphQLConfig)`
Creates a new MCP GraphQL server instance.

#### `server.getClient()`
Returns the GraphQL client for executing operations.

#### `client.executeQuery(options: QueryOptions)`
Executes a GraphQL query with optional custom headers.

#### `client.introspectSchema()`
Performs schema introspection and returns schema information.

#### `client.analyzeQuery(query: string)`
Analyzes query complexity and depth.

#### `server.updateConfig(config: Partial<McpGraphQLConfig>)`
Updates server configuration at runtime.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built on the [Model Context Protocol](https://modelcontextprotocol.io/)
- Powered by [GraphQL](https://graphql.org/)
- TypeScript support via [TypeScript](https://www.typescriptlang.org/)

---

**Made with ❤️ for the MCP and GraphQL communities** 