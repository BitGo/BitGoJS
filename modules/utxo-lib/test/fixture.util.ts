import * as assert from 'assert';
import * as mpath from 'path';
import * as fs from 'fs-extra';

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
  try {
    await fs.access(mpath.dirname(path));
  } catch (e) {
    await fs.mkdirp(mpath.dirname(path));
  }

  try {
    return JSON.parse(await fs.readFile(path, 'utf8')) as T;
  } catch (e) {
    if (e.code === 'ENOENT') {
      await fs.writeFile(path, toPrettyJSON(defaultValue));
      throw new Error(`wrote defaults, please check contents and re-run tests`);
    }

    throw e;
  }
}

/**
 * @param a
 * @param b
 * @throws error iff `a` and `b` are different under JSON.parse(JSON.stringify(v))
 */
export function assertEqualJSON<T>(a: T, b: T): void {
  assert.deepStrictEqual(JSON.parse(toPrettyJSON(a)), JSON.parse(toPrettyJSON(b)));
}
