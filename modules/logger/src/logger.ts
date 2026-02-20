import { sanitize } from './sanitizeLog';

/**
 * BitGo Logger with automatic sanitization for all environments
 */
class BitGoLogger {
  /**
   * Sanitizes arguments for all environments
   */
  private sanitizeArgs(args: unknown[]): unknown[] {
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
