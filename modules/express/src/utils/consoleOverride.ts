/**
 * @prettier
 */

import { sanitize } from './sanitizeLog';

// Store original console methods (only the ones we override)
/* eslint-disable no-console */
const originalConsole = {
  error: console.error,
  log: console.log,
  warn: console.warn,
  info: console.info,
};
/* eslint-enable no-console */

export function overrideConsole(): void {
  /* eslint-disable no-console, @typescript-eslint/no-explicit-any */

  console.error = function (...args: any[]) {
    const sanitizedArgs = args.map((arg) => sanitize(arg));
    originalConsole.error.apply(console, sanitizedArgs);
  };

  console.log = function (...args: any[]) {
    const sanitizedArgs = args.map((arg) => sanitize(arg));
    originalConsole.log.apply(console, sanitizedArgs);
  };

  console.warn = function (...args: any[]) {
    const sanitizedArgs = args.map((arg) => sanitize(arg));
    originalConsole.warn.apply(console, sanitizedArgs);
  };

  console.info = function (...args: any[]) {
    const sanitizedArgs = args.map((arg) => sanitize(arg));
    originalConsole.info.apply(console, sanitizedArgs);
  };

  /* eslint-enable no-console, @typescript-eslint/no-explicit-any */
}
/**
 * Restore original console methods (only the ones we overrode)
 */
export function restoreConsole(): void {
  /* eslint-disable no-console */
  console.error = originalConsole.error;
  console.log = originalConsole.log;
  console.warn = originalConsole.warn;
  console.info = originalConsole.info;
  /* eslint-enable no-console */
}
// Auto-activate console sanitization in testing and staging
if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'staging') {
  overrideConsole();
}
