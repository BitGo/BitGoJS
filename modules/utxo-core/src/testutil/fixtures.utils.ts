/**
 * Contains helpers for working with test fixtures
 */

import * as fs from 'fs';
import * as mpath from 'path';

type FixtureEncoding = 'json' | 'hex';

function isNodeJsError(e: unknown): e is NodeJS.ErrnoException {
  return e instanceof Error && typeof (e as NodeJS.ErrnoException).code === 'string';
}

function fixtureEncoding(path: string): FixtureEncoding {
  if (path.endsWith('.json')) {
    return 'json';
  }
  if (path.endsWith('.hex')) {
    return 'hex';
  }
  throw new Error(`unknown fixture encoding for ${path}`);
}

function decodeFixture(raw: string, encoding: FixtureEncoding): unknown {
  switch (encoding) {
    case 'json':
      return JSON.parse(raw);
    case 'hex':
      return Buffer.from(raw, 'hex');
  }
}

function encodeFixture(value: unknown, encoding: FixtureEncoding): string {
  switch (encoding) {
    case 'json':
      return JSON.stringify(value, null, 2) + '\n';
    case 'hex':
      if (!Buffer.isBuffer(value)) {
        throw new Error(`expected Buffer, got ${typeof value}`);
      }
      return value.toString('hex');
  }
}

/**
 * Return fixture described in `path`.
 *
 * If file does not exist and `defaultValue` is provided, writes defaultValue to `path` and throws an error.
 *
 * @param path
 * @param defaultValue
 * @return T - fixture content
 */
export async function getFixture<T>(path: string, defaultValue?: T | (() => Promise<T>)): Promise<T> {
  try {
    await fs.promises.stat(mpath.dirname(path));
  } catch (e) {
    if (isNodeJsError(e) && e.code === 'ENOENT') {
      throw new Error(`fixture directory ${mpath.dirname(path)} not found, please create it first`);
    }
    throw e;
  }

  const encoding = fixtureEncoding(path);

  try {
    return decodeFixture(await fs.promises.readFile(path, 'utf8'), encoding) as T;
  } catch (e) {
    if (isNodeJsError(e) && e.code === 'ENOENT') {
      if (process.env.WRITE_FIXTURES === '0') {
        throw new Error(`fixture ${path} not found, WRITE_FIXTURES=0`);
      }
      if (defaultValue === undefined) {
        throw new Error(`fixture ${path} not found and no default value given`);
      }
      if (typeof defaultValue === 'function') {
        defaultValue = await (defaultValue as () => Promise<T>)();
      }
      await fs.promises.writeFile(path, encodeFixture(defaultValue, encoding));
      throw new Error(`wrote default value for ${path}, please inspect and restart test`);
    }

    throw e;
  }
}

export function jsonNormalize<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}
