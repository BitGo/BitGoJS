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

const BEARER_V2_PATTERN = /^v2x[a-f0-9]{32,}$/i;

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
    return isBearerV2Token(obj) ? '<REMOVED>' : obj;
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
    return obj.toISOString();
  }

  // Handle objects
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
