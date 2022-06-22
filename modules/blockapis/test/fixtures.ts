import * as assert from 'assert';
import { promises as fs } from 'fs';

export async function getFixtureString(path: string, defaultValue?: string): Promise<string> {
  try {
    return await fs.readFile(path, 'utf8');
  } catch (e) {
    if ((e as any).code === 'ENOENT') {
      if (!defaultValue) {
        throw new Error(`no default value provided`);
      }
      await fs.writeFile(path, defaultValue, 'utf8');
      throw new Error(`wrote default value for ${path}`);
    }
    throw e;
  }
}

export async function getFixture<T>(path: string, defaultValue?: T): Promise<T> {
  return JSON.parse(await getFixtureString(path, defaultValue ? JSON.stringify(defaultValue, null, 2) : undefined));
}

export function deepStrictEqualJSON<T>(a: T, b: T): void {
  return assert.deepStrictEqual(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)));
}
