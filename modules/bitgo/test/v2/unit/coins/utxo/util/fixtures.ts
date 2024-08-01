/**
 * @prettier
 */
import 'should';
import * as fs from 'fs-extra';
import * as mpath from 'path';

import { AbstractUtxoCoin } from '@bitgo/abstract-utxo';

function serializeBigInt(k: string, v: any): string | number {
  if (typeof v === 'bigint') {
    return v.toString();
  } else {
    return v;
  }
}

async function getFixtureWithName<T>(name: string, defaultValue: T, rawCoinName: string): Promise<T> {
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
    let textContent = await fs.readFile(path, 'utf8');
    if (rawCoinName === 'tbgbtc') {
      textContent = textContent.replace(/tbtcsig/g, 'tbgbtc');
    }
    return JSON.parse(textContent);
  } catch (e) {
    if (e.code === 'ENOENT') {
      throw new Error(`Wrote defaultValue to ${path}. Inspect output and rerun tests.`);
    }
    throw e;
  }
}

export async function getFixture<T>(coin: AbstractUtxoCoin, name: string, defaultValue: T): Promise<T> {
  const coinChain = coin.getChain() === 'tbgbtc' ? 'tbtcsig' : coin.getChain();
  return await getFixtureWithName(`${coinChain}/${name}`, defaultValue, coin.getChain());
}

/**
 * Compares obj to fixtureJSON after round-tripping obj through JSON
 * @param obj
 * @param fixtureJSON
 * @throws Error if obj and fixtureJSON are different after normalizing obj under JSON:w
 */
export function shouldEqualJSON<T>(obj: T, fixtureJSON: T): void {
  JSON.parse(JSON.stringify(obj, serializeBigInt)).should.eql(fixtureJSON);
}
