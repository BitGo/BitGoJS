/**
 * @prettier
 */
import { Network } from './types';
import * as fs from 'fs/promises';

const coins = require('../../../src/coins');

export function getFixtureDir(network: Network): string {
  const networkName = coins.getNetworkName(network);
  return `${__dirname}/../fixtures/${networkName}`;
}

export async function wipeFixtures(network: Network): Promise<void> {
  try {
    await fs.rm(getFixtureDir(network), { recursive: true });
  } catch (e) {
    if (e.code === 'ENOENT') {
      return;
    }
  }
}

export async function writeFixture(network: Network, filename: string, content: unknown): Promise<void> {
  await fs.mkdir(getFixtureDir(network), { recursive: true });
  await fs.writeFile(`${getFixtureDir(network)}/${filename}`, JSON.stringify(content, null, 2));
}

export async function readFixture<T>(network: Network, filename: string): Promise<T> {
  return JSON.parse(await fs.readFile(`${getFixtureDir(network)}/${filename}`, 'utf8'));
}
