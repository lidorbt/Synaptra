import winston from 'winston';
import chalk from 'chalk';

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

interface LoggerConfig {
  level: LogLevel;
  enableQueries: boolean;
  enablePerformance: boolean;
}

class Logger {
  private winston: winston.Logger;
  private config: LoggerConfig;

  constructor(config: LoggerConfig) {
    this.config = config;
    this.winston = winston.createLogger({
      level: config.level,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
            winston.format.printf((info: winston.Logform.TransformableInfo) => {
              const ts = new Date(info.timestamp as string).toISOString();
              const { timestamp: _timestamp, level, message, ...meta } = info;
              const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
              return `${chalk.gray(ts)} ${level}: ${message}${metaStr}`;
            })
          ),
        }),
      ],
    });
  }

  error(message: string, meta?: Record<string, any>) {
    this.winston.error(message, meta);
  }

  warn(message: string, meta?: Record<string, any>) {
    this.winston.warn(message, meta);
  }

  info(message: string, meta?: Record<string, any>) {
    this.winston.info(message, meta);
  }

  debug(message: string, meta?: Record<string, any>) {
    this.winston.debug(message, meta);
  }

  query(query: string, variables?: Record<string, any>) {
    if (this.config.enableQueries) {
      this.debug(`GraphQL Query: ${query}`, { variables });
    }
  }

  performance(operation: string, duration: number, meta?: Record<string, any>) {
    if (this.config.enablePerformance) {
      const formattedDuration = duration < 1000 ? `${duration}ms` : `${(duration / 1000).toFixed(2)}s`;
      this.info(`Performance: ${operation} took ${formattedDuration}`, meta);
    }
  }

  updateConfig(config: Partial<LoggerConfig>) {
    this.config = { ...this.config, ...config };
    this.winston.level = this.config.level;
  }
}

// Singleton logger instance
let logger: Logger;

export const createLogger = (config: LoggerConfig): Logger => {
  logger = new Logger(config);
  return logger;
};

export const getLogger = (): Logger => {
  if (!logger) {
    throw new Error('Logger not initialized. Call createLogger first.');
  }
  return logger;
};

export { Logger }; 