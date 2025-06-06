#!/usr/bin/env node

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { McpGraphQLServer, createMcpGraphQLServer } from './server';
import { McpConfig, McpConfigSchema } from './types';

// Export main classes and types for library usage
export { McpGraphQLServer, createMcpGraphQLServer };
export * from './types';
export * from './services/graphql-client';
export * from './utils/logger';

// CLI functionality
async function main() {
  try {
    // Get configuration from environment variables or config file
    const config = getConfiguration();
    
    // Create and start the server
    const server = createMcpGraphQLServer(config);
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\nReceived SIGINT, shutting down gracefully...');
      await server.stop();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('\nReceived SIGTERM, shutting down gracefully...');
      await server.stop();
      process.exit(0);
    });

    // Start the server
    await server.start();
    
  } catch (error) {
    console.error('Failed to start MCP GraphQL server:', error);
    process.exit(1);
  }
}

function getConfiguration(): McpConfig {
  // Try to load from config file first
  const configPath = process.env.SYNAPTRA_CONFIG || './synaptra.config.json';
  
  try {
    const configFile = readFileSync(resolve(configPath), 'utf-8');
    const fileConfig = JSON.parse(configFile);
    return McpConfigSchema.parse(fileConfig);
  } catch (_error) {
    // If config file doesn't exist or is invalid, use environment variables
    console.warn(`Config file not found or invalid (${configPath}), using environment variables`);
  }

  // Build config from environment variables
  const config: Partial<McpConfig> = {
    name: process.env.SYNAPTRA_NAME || 'synaptra',
    endpoint: process.env.SYNAPTRA_ENDPOINT || 'http://localhost:4000/graphql',
    headers: process.env.SYNAPTRA_HEADERS ? JSON.parse(process.env.SYNAPTRA_HEADERS) : {},
    defaultApiKey: process.env.SYNAPTRA_API_KEY,
    allowMutations: process.env.SYNAPTRA_ALLOW_MUTATIONS === 'true',
    allowSubscriptions: process.env.SYNAPTRA_ALLOW_SUBSCRIPTIONS === 'true',
    timeout: process.env.SYNAPTRA_TIMEOUT ? parseInt(process.env.SYNAPTRA_TIMEOUT) : 30000,
    retries: process.env.SYNAPTRA_RETRIES ? parseInt(process.env.SYNAPTRA_RETRIES) : 3,
  };

  // Security configuration
  if (process.env.SYNAPTRA_MAX_DEPTH !== undefined || process.env.SYNAPTRA_MAX_COMPLEXITY !== undefined) {
    config.security = {
      maxDepth: process.env.SYNAPTRA_MAX_DEPTH ? parseInt(process.env.SYNAPTRA_MAX_DEPTH) : 10,
      maxComplexity: process.env.SYNAPTRA_MAX_COMPLEXITY ? parseInt(process.env.SYNAPTRA_MAX_COMPLEXITY) : 1000,
      allowIntrospection: process.env.SYNAPTRA_ALLOW_INTROSPECTION !== 'false',
      rateLimiting: {
        enabled: process.env.SYNAPTRA_RATE_LIMIT_ENABLED === 'true',
        windowMs: process.env.SYNAPTRA_RATE_LIMIT_WINDOW ? parseInt(process.env.SYNAPTRA_RATE_LIMIT_WINDOW) : 60000,
        max: process.env.SYNAPTRA_RATE_LIMIT_MAX ? parseInt(process.env.SYNAPTRA_RATE_LIMIT_MAX) : 100,
      },
    };
  }

  // Logging configuration
  if (process.env.SYNAPTRA_LOG_LEVEL !== undefined) {
    config.logging = {
      level: (process.env.SYNAPTRA_LOG_LEVEL as any) || 'info',
      queries: process.env.SYNAPTRA_LOG_QUERIES === 'true',
      performance: process.env.SYNAPTRA_LOG_PERFORMANCE === 'true',
    };
  }

  return McpConfigSchema.parse(config);
}

// Run CLI if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
} 