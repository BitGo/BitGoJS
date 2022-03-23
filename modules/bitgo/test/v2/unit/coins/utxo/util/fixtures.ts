/**
 * @prettier
 */
import 'should';
import * as fs from 'fs-extra';
import * as mpath from 'path';

import { AbstractUtxoCoin } from '../../../../../../src/v2/coins';

async function getFixtureWithName<T>(name: string, defaultValue: T): Promise<T> {
  const path = `${__dirname}/../fixtures/${name}.json`;
  const dirname = mpath.dirname(path);
  try {
    await fs.access(dirname);
  } catch (e) {
    if (e.code !== 'ENOENT') {
      throw e;
    }
    await fs.mkdirp(dirname);
  }
  try {
    return JSON.parse(await fs.readFile(path, 'utf8'));
  } catch (e) {
    if (e.code === 'ENOENT') {
      await fs.writeFile(path, JSON.stringify(defaultValue, null, 2));
      throw new Error(`Wrote defaultValue to ${path}. Inspect output and rerun tests.`);
    }
    throw e;
  }
}

export async function getFixture<T>(coin: AbstractUtxoCoin, name: string, defaultValue: T): Promise<T> {
  return await getFixtureWithName(`${coin.getChain()}/${name}`, defaultValue);
}

/**
 * Compares obj to fixtureJSON after round-tripping obj through JSON
 * @param obj
 * @param fixtureJSON
 * @throws Error if obj and fixtureJSON are different after normalizing obj under JSON:w
 */
export function shouldEqualJSON<T>(obj: T, fixtureJSON: T): void {
  JSON.parse(JSON.stringify(obj)).should.eql(fixtureJSON);
}
