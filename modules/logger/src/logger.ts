import { sanitize } from './sanitizeLog';

/**
 * BitGo Logger with automatic sanitization in test/staging environments
 */
class BitGoLogger {
  /**
   * Determines if sanitization should be applied based on NODE_ENV
   */
  private shouldSanitize(): boolean {
    const env = process.env.NODE_ENV;
    return env === 'test' || env === 'staging';
  }

  /**
   * Sanitizes arguments if in test/staging environment
   */
  private sanitizeArgs(args: unknown[]): unknown[] {
    if (!this.shouldSanitize()) {
      return args;
    }

    return args.map((arg) => {
      if (typeof arg === 'object' && arg !== null) {
        return sanitize(arg);
      }
      return arg;
    });
  }

  /**
   * Logs a message with automatic sanitization
   */
  log(...args: unknown[]): void {
    const sanitized = this.sanitizeArgs(args);
    // eslint-disable-next-line no-console
    console.log(...sanitized);
  }

  /**
   * Logs an error message with automatic sanitization
   */
  error(...args: unknown[]): void {
    const sanitized = this.sanitizeArgs(args);
    // eslint-disable-next-line no-console
    console.error(...sanitized);
  }

  /**
   * Logs a warning message with automatic sanitization
   */
  warn(...args: unknown[]): void {
    const sanitized = this.sanitizeArgs(args);
    // eslint-disable-next-line no-console
    console.warn(...sanitized);
  }

  /**
   * Logs an info message with automatic sanitization
   */
  info(...args: unknown[]): void {
    const sanitized = this.sanitizeArgs(args);
    // eslint-disable-next-line no-console
    console.info(...sanitized);
  }
}

/**
 * Singleton logger instance
 */
export const logger = new BitGoLogger();
