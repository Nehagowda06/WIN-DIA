/**
 * Pluggable Logger Interface & Production Implementation
 * Enables swapping internal handler (Console, Pino, Winston, Sentry) cleanly.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  [key: string]: unknown;
}

export interface ILogger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, error?: Error | unknown, context?: LogContext): void;
}

export type LogHandler = (level: LogLevel, message: string, context?: LogContext, error?: unknown) => void;

class DefaultLogger implements ILogger {
  private customHandler: LogHandler | null = null;
  private readonly sensitiveKeys = new Set(['password', 'token', 'secret', 'authorization', 'apiKey']);

  /**
   * Allows registering external logging backends (e.g. Pino, Winston, Sentry)
   */
  public setLogHandler(handler: LogHandler): void {
    this.customHandler = handler;
  }

  private redact(obj?: LogContext): LogContext | undefined {
    if (!obj) return undefined;
    const cleanContext: LogContext = {};
    for (const [key, value] of Object.entries(obj)) {
      if (this.sensitiveKeys.has(key.toLowerCase())) {
        cleanContext[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        cleanContext[key] = this.redact(value as LogContext);
      } else {
        cleanContext[key] = value;
      }
    }
    return cleanContext;
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: unknown): void {
    const sanitizedContext = this.redact(context);

    if (this.customHandler) {
      this.customHandler(level, message, sanitizedContext, error);
      return;
    }

    const payload = {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message,
      ...(sanitizedContext ? { context: sanitizedContext } : {}),
      ...(error instanceof Error ? { error: { name: error.name, message: error.message, stack: error.stack } } : error ? { error } : {}),
    };

    const jsonLog = JSON.stringify(payload);

    switch (level) {
      case 'debug':
        console.debug(jsonLog);
        break;
      case 'info':
        console.info(jsonLog);
        break;
      case 'warn':
        console.warn(jsonLog);
        break;
      case 'error':
        console.error(jsonLog);
        break;
    }
  }

  public debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  public info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  public warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  public error(message: string, error?: Error | unknown, context?: LogContext): void {
    this.log('error', message, context, error);
  }
}

export const logger = new DefaultLogger();
