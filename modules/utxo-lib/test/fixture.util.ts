import * as assert from 'assert';
import * as fs from 'fs';
import * as mpath from 'path';

function bufferAsHex(v: unknown): unknown {
  // You would think that you could use `Buffer.isBuffer(v)` here but you would be mistaken
  // https://github.com/nodejs/node-v0.x-archive/issues/5110
  type Buf = { type: string; data: number[] };
  if (v && (v as Buf).type === 'Buffer') {
    return Buffer.from((v as Buf).data).toString('hex');
  }
  return v;
}

function toPrettyJSON(v: unknown): string {
  return JSON.stringify(v, (k, v) => bufferAsHex(v), 2);
}

export async function readFixture<T>(path: string, defaultValue: T): Promise<T> {
  path = path.replace('bitcoinBitGoSignet', 'bitcoinPublicSignet');
  path = path.replace('bitcoinTestnet4', 'bitcoinPublicSignet');

  try {
    await fs.promises.access(mpath.dirname(path));
  } catch (e) {
    await fs.promises.mkdir(mpath.dirname(path), { recursive: true });
  }

  try {
    return JSON.parse(await fs.promises.readFile(path, 'utf8')) as T;
  } catch (e) {
    if (e.code === 'ENOENT') {
      await fs.promises.writeFile(path, toPrettyJSON(defaultValue));
      throw new Error(`wrote defaults, please check contents and re-run tests`);
    }

    throw e;
  }
}

export async function assertEqualFixture<T>(path: string, a: T): Promise<void> {
  assert.deepStrictEqual(await readFixture(path, a), JSON.parse(toPrettyJSON(a)));
}

/**
 * @param a
 * @param b
 * @throws error iff `a` and `b` are different under JSON.parse(JSON.stringify(v))
 */
export function assertEqualJSON<T>(a: T, b: T): void {
  assert.deepStrictEqual(JSON.parse(toPrettyJSON(a)), JSON.parse(toPrettyJSON(b)));
}

type FixtureEncoding = 'json' | 'hex' | 'txt';

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
  if (path.endsWith('.txt')) {
    return 'txt';
  }
  throw new Error(`unknown fixture encoding for ${path}`);
}

function decodeFixture(raw: string, encoding: FixtureEncoding): unknown {
  switch (encoding) {
    case 'json':
      return JSON.parse(raw);
    case 'hex':
      return Buffer.from(raw, 'hex');
    case 'txt':
      return raw;
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
    case 'txt':
      if (typeof value !== 'string') {
        throw new Error(`expected string, got ${typeof value}`);
      }
      return value;
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
