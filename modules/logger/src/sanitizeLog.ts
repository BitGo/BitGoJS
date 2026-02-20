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
  'walletPassphrase',
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

/**
 * Recursively sanitizes an object, replacing sensitive values with '<REMOVED>'
 * Handles circular references and nested structures
 */
export function sanitize(obj: unknown, seen = new WeakSet<Record<string, unknown>>(), depth = 0): unknown {
  // Prevent infinite recursion
  if (depth > 50) {
    return '[Max Depth Exceeded]';
  }

  // Handle primitives
  if (obj === null || obj === undefined) {
    return obj;
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

  // Handle objects
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (isSensitiveKey(key) || isBearerV2Token(value)) {
      sanitized[key] = '<REMOVED>';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitize(value, seen, depth + 1);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}
