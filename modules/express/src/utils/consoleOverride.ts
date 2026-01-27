/**
 * @prettier
 */

import { sanitize } from './sanitizeLog';

// Store original console methods for restoration if needed
const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  debug: console.debug,
  info: console.info,
  dir: console.dir,
  table: console.table,
  trace: console.trace,
  assert: console.assert,
};

/**
 * Override global console methods to sanitize sensitive data
 * This intercepts all console calls and removes sensitive fields before logging
 */
export function overrideConsole(): void {
  // Standard logging methods
  /* eslint-disable no-console, @typescript-eslint/no-explicit-any */
  console.log = function (...args: any[]) {
    const sanitizedArgs = args.map((arg) => sanitize(arg));
    originalConsole.log.apply(console, sanitizedArgs);
  };

  console.error = function (...args: any[]) {
    const sanitizedArgs = args.map((arg) => sanitize(arg));
    originalConsole.error.apply(console, sanitizedArgs);
  };

  console.warn = function (...args: any[]) {
    const sanitizedArgs = args.map((arg) => sanitize(arg));
    originalConsole.warn.apply(console, sanitizedArgs);
  };

  console.info = function (...args: any[]) {
    const sanitizedArgs = args.map((arg) => sanitize(arg));
    originalConsole.info.apply(console, sanitizedArgs);
  };

  console.debug = function (...args: any[]) {
    const sanitizedArgs = args.map((arg) => sanitize(arg));
    originalConsole.debug.apply(console, sanitizedArgs);
  };

  // Special methods with specific handling

  /**
   * console.dir(obj, options)
   * Second argument is options, not data - don't sanitize it
   */
  console.dir = function (obj: any, options?: any) {
    const sanitizedObj = sanitize(obj);
    originalConsole.dir.call(console, sanitizedObj, options);
  };

  /**
   * console.table(data, properties)
   * Second argument is column selection - don't sanitize it
   */
  console.table = function (data: any, properties?: string[]) {
    const sanitizedData = sanitize(data);
    originalConsole.table.call(console, sanitizedData, properties);
  };

  /**
   * console.trace(...args)
   * Prints stack trace with optional message/data
   */
  console.trace = function (...args: any[]) {
    const sanitizedArgs = args.map((arg) => sanitize(arg));
    originalConsole.trace.apply(console, sanitizedArgs);
  };

  /**
   * console.assert(condition, ...args)
   * First argument is boolean condition - don't sanitize it
   */
  console.assert = function (condition?: boolean, ...args: any[]) {
    const sanitizedArgs = args.map((arg) => sanitize(arg));
    originalConsole.assert.call(console, condition, ...sanitizedArgs);
  };
  /* eslint-enable no-console, @typescript-eslint/no-explicit-any */
}

/**
 * Restore original console methods
 * Useful for testing or if sanitization needs to be disabled
 */
export function restoreConsole(): void {
  /* eslint-disable no-console */
  console.log = originalConsole.log;
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
  console.debug = originalConsole.debug;
  console.info = originalConsole.info;
  console.dir = originalConsole.dir;
  console.table = originalConsole.table;
  console.trace = originalConsole.trace;
  console.assert = originalConsole.assert;
  /* eslint-enable no-console */
}
