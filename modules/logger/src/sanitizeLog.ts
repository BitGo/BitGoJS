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

const BEARER_V2_PATTERN = /^v2x[a-fA-F0-9]{32,}$/;

/**
 * Checks if a key is sensitive (case-insensitive)
 */
function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEYS.has(key.toLowerCase());
}

/**
 * Checks if a value matches the bearer v2 token pattern
 */
function isBearerV2Token(value: unknown): boolean {
  return typeof value === 'string' && BEARER_V2_PATTERN.test(value);
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
 * Handles circular references, nested structures, and various JavaScript types
 * @param obj - The value to sanitize
 * @param seen - WeakSet to track circular references
 * @param depth - Current recursion depth
 * @returns Sanitized value
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
    return isBearerV2Token(obj) ? '<REMOVED>' : obj;
  }

  if (typeof obj !== 'object') {
    return obj;
  }

  // Handle Date objects before circular check (Dates should be converted, not tracked)
  if (obj instanceof Date) {
    return obj.toISOString();
  }

  // Handle circular references (only for objects that can be in WeakSet)
  const objAsRecord = obj as Record<string, unknown>;
  if (seen.has(objAsRecord)) {
    return '[Circular]';
  }

  seen.add(objAsRecord);

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitize(item, seen, depth + 1));
  }

  // Handle RegExp
  if (obj instanceof RegExp) {
    return obj.toString();
  }

  // Handle Buffer (Node.js)
  if (typeof Buffer !== 'undefined' && Buffer.isBuffer(obj)) {
    return '<Buffer>';
  }

  // Handle typed arrays
  if (ArrayBuffer.isView(obj) && !(obj instanceof DataView)) {
    return '<TypedArray>';
  }

  // Handle Map
  if (obj instanceof Map) {
    const sanitized = new Map();
    for (const [key, value] of obj.entries()) {
      const keyStr = typeof key === 'string' ? key : String(key);
      if (isSensitiveKey(keyStr) || isBearerV2Token(value)) {
        sanitized.set(key, '<REMOVED>');
      } else {
        sanitized.set(key, sanitize(value, seen, depth + 1));
      }
    }
    return sanitized;
  }

  // Handle Set
  if (obj instanceof Set) {
    const sanitized = new Set();
    for (const value of obj.values()) {
      sanitized.add(sanitize(value, seen, depth + 1));
    }
    return sanitized;
  }

  // Handle plain objects and other object types
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (isSensitiveKey(key) || isBearerV2Token(value)) {
      sanitized[key] = '<REMOVED>';
    } else if (value instanceof Error) {
      sanitized[key] = sanitize(getErrorData(value), seen, depth + 1);
    } else {
      sanitized[key] = sanitize(value, seen, depth + 1);
    }
  }

  return sanitized;
}
