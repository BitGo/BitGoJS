import assert from 'node:assert/strict';

// eslint-disable-next-line @typescript-eslint/ban-types
export function assertHasProperty<T extends object>(obj: T, key: string, value?: unknown): void {
  assert.ok(key in obj, `expected object to have property '${key}'`);
  if (arguments.length >= 3) {
    assert.strictEqual((obj as Record<string, unknown>)[key], value);
  }
}

export function assertContains<T>(haystack: readonly T[] | string, needle: T | string): void {
  if (typeof haystack === 'string') {
    assert.ok(haystack.includes(needle as string), `expected '${haystack}' to contain '${needle}'`);
  } else {
    assert.ok(haystack.includes(needle as T), `expected array to contain ${JSON.stringify(needle)}`);
  }
}
