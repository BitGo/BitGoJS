import * as t from 'io-ts';

import { ValidationError } from '../errors';

/**
 * Formats io-ts validation errors into clear, human-readable messages.
 */
export function formatValidationErrors(errors: t.Errors): string {
  const seen = new Set<string>();
  const messages: string[] = [];

  for (const error of errors) {
    // Build field path, filtering out internal keys
    const path = error.context
      .map((c) => c.key)
      .filter((key) => key && !/^\d+$/.test(key) && key !== 'body')
      .join('.');

    if (!path || seen.has(path)) continue;
    seen.add(path);

    const expected = error.context[error.context.length - 1]?.type.name;
    if (expected === 'undefined') continue;

    if (error.value === undefined) {
      messages.push(`Missing required field '${path}'`);
    } else {
      const value = typeof error.value === 'object' ? JSON.stringify(error.value) : String(error.value);
      messages.push(`Invalid value for '${path}': expected ${expected}, got '${value}'`);
    }
  }

  return messages.join('. ') + (messages.length ? '.' : '');
}

/**
 * Creates a ValidationError from io-ts validation errors.
 */
export function createValidationError(errors: t.Errors): ValidationError {
  return new ValidationError(formatValidationErrors(errors));
}
