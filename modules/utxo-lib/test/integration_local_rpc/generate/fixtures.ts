import * as assert from 'assert';
import * as fs from 'fs-extra';
import * as path from 'path';

import { networks, Network, getNetworkName, getMainnet } from '../../../src';
import { getKeyTriple } from '../../../src/testutil';
import { RpcClient } from './RpcClient';
import { RpcTransaction } from './RpcTypes';
import { getDefaultTransactionVersion } from '../../../src/bitgo';

export type Protocol = {
  network: Network;
  version: number;
};

export function getProtocolVersions(network: Network): number[] {
  switch (getMainnet(network)) {
    case networks.zcash:
      // FIXME: re-enable protocol version 500
      // return [400, 450, 500];
      return [400, 450];
    default:
      return [getDefaultTransactionVersion(network)];
  }
}

export function getFixtureDir(protocol: Protocol): string {
  const networkName = getNetworkName(protocol.network);
  assert(networkName);
  return path.join(__dirname, '..', 'fixtures', networkName, `v${protocol.version}`);
}

export async function wipeFixtures(protocol: Protocol): Promise<void> {
  try {
    await fs.remove(getFixtureDir(protocol));
  } catch (e) {
    if (e.code === 'ENOENT') {
      return;
    }
  }
}

export async function writeFixture(protocol: Protocol, filename: string, content: unknown): Promise<void> {
  await fs.mkdir(getFixtureDir(protocol), { recursive: true });
  await fs.writeFile(path.join(getFixtureDir(protocol), filename), JSON.stringify(content, null, 2));
}

export async function readFixture<T>(protocol: Protocol, filename: string): Promise<T> {
  return JSON.parse(await fs.readFile(path.join(getFixtureDir(protocol), filename), 'utf8'));
}

export type TransactionFixtureWithInputs = {
  transaction: RpcTransaction;
  inputs: RpcTransaction[];
};

export async function writeTransactionFixtureWithInputs(
  rpc: RpcClient,
  protocol: Protocol,
  filename: string,
  txid: string
): Promise<void> {
  const transaction = await rpc.getRawTransactionVerbose(txid);
  const inputTransactionIds = transaction.vin.reduce(
    (all: string[], input) => (all.includes(input.txid) ? all : [...all, input.txid]),
    []
  );
  const inputs = await RpcClient.parallelMap(inputTransactionIds, (inputTxid) =>
    rpc.getRawTransactionVerbose(inputTxid)
  );
  assert.strictEqual(inputs.length, inputTransactionIds.length);
  await writeFixture(protocol, filename, {
    transaction,
    inputs,
  });
}

export const fixtureKeys = getKeyTriple('rpctest');
