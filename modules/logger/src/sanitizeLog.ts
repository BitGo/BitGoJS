/**
 * Sanitizes sensitive data from logs to prevent token exposure in test/staging environments
 */

const SENSITIVE_KEYS = new Set([
  'token',
  'bearer',
  'prv',
  'xprv',
  'privatekey',
  'password',
  'otp',
  'passphrase',
  'walletpassphrase',
  '_token',
]);

const SENSITIVE_PREFIXES = ['v2x', 'xprv'];

const MIN_SENSITIVE_STRING_LENGTH = 10;

/**
 * Checks if a key is sensitive (case-insensitive)
 */
function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEYS.has(key.toLowerCase());
}

/**
 * Checks if a string value is sensitive based on known prefixes.
 * Unlike isSensitiveKey (which checks property names), this identifies
 * sensitive data by recognizable content patterns — useful when there
 * is no key context (e.g. top-level strings, array elements).
 * Requires a minimum length to avoid false positives on short strings.
 */
function isSensitiveStringValue(s: string): boolean {
  return s.length >= MIN_SENSITIVE_STRING_LENGTH && SENSITIVE_PREFIXES.some((prefix) => s.startsWith(prefix));
}

export function getErrorData(error: unknown): unknown {
  if (!(error && error instanceof Error)) {
    return error;
  }

  const errorData: Record<string, unknown> = {
    name: error.name,
  };

  for (const key of Object.getOwnPropertyNames(error)) {
    const value = (error as unknown as Record<string, unknown>)[key];
    errorData[key] = value instanceof Error ? getErrorData(value) : value;
  }

  return errorData;
}

/**
 * Recursively sanitizes an object, replacing sensitive values with '<REMOVED>'
 * Handles circular references and nested structures
 */
export function sanitize(obj: unknown, seen = new WeakSet<Record<string, unknown>>(), depth = 0): unknown {
  if (depth > 25) {
    return '[Max Depth Exceeded]';
  }

  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle BigInt (JSON.stringify(1n) throws TypeError)
  if (typeof obj === 'bigint') {
    return obj.toString();
  }

  if (typeof obj === 'string') {
    return isSensitiveStringValue(obj) ? '<REMOVED>' : obj;
  }

  if (typeof obj !== 'object') {
    return obj;
  }

  // Handle circular references
  if (seen.has(obj as Record<string, unknown>)) {
    return '[Circular]';
  }

  seen.add(obj as Record<string, unknown>);

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitize(item, seen, depth + 1));
  }

  // Handle Date objects
  if (obj instanceof Date) {
    return isNaN(obj.getTime()) ? '[Invalid Date]' : obj.toISOString();
  }

  // Handle objects
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (isSensitiveKey(key) || (typeof value === 'string' && isSensitiveStringValue(value))) {
      sanitized[key] = '<REMOVED>';
    } else if (value instanceof Error) {
      sanitized[key] = sanitize(getErrorData(value), seen, depth + 1);
    } else {
      sanitized[key] = sanitize(value, seen, depth + 1);
    }
  }

  return sanitized;
}
