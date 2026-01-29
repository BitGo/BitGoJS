/**
 * @prettier
 */
/**
 * Compiled regex pattern for sensitive keywords (case-insensitive substring matching).
 * Matches any key containing these patterns (e.g., 'token' matches '_token', 'authtoken', etc.)
 * Pattern checks all 6 keywords simultaneously in a single pass using DFA (Deterministic Finite Automaton).
 */
const SENSITIVE_PATTERN = /token|bearer|prv|privatekey|password|otp/i;

/**
 * Pattern to detect bearer v2 token values (e.g., v2xea99e123bba182f1360ad35529a7a6ae77cfc0bc4e5dcb4f88a6dd4e4bf6a8db)
 * Matches strings starting with v2x followed by at least 32 hexadecimal characters
 */
const BEARER_V2_PATTERN = /^v2x[a-f0-9]{32,}$/i;

/**
 * Recursively sanitize data by removing sensitive fields
 * @param data - The data to sanitize
 * @param seen - WeakSet to track circular references
 * @param depth - Current recursion depth
 * @returns Sanitized data with sensitive fields removed
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-module-boundary-types
export function sanitize(data: any, seen: WeakSet<Record<string, unknown>> = new WeakSet(), depth = 0): any {
  const MAX_DEPTH = 50;

  // Handle null/undefined
  if (data === null || data === undefined) {
    return data;
  }
  // Prevent stack overflow
  if (depth > MAX_DEPTH) {
    return '[Max Depth]';
  }
  // Handle primitives
  if (typeof data !== 'object') {
    // Check if string value is a bearer v2 token
    if (typeof data === 'string' && BEARER_V2_PATTERN.test(data)) {
      return '<REMOVED>';
    }
    return data;
  }
  // Handle circular references
  if (seen.has(data)) {
    return '[Circular]';
  }
  seen.add(data);

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map((item) => sanitize(item, seen, depth + 1));
  }
  // Handle objects - replace sensitive field values with <REMOVED>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sanitized: any = {};
  for (const key in data) {
    if (data.hasOwnProperty(key)) {
      // Check if key contains any sensitive pattern (regex checks all patterns in one pass)
      if (SENSITIVE_PATTERN.test(key)) {
        // Keep the field but replace value with <REMOVED>
        sanitized[key] = '<REMOVED>';
      } else {
        // Recursively sanitize non-sensitive fields
        sanitized[key] = sanitize(data[key], seen, depth + 1);
      }
    }
  }
  return sanitized;
}
