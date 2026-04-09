import * as fs from 'fs-extra';
import { Network, networks, getMainnet, getNetworkName } from '../../src/networks';

export type FixtureInfo = {
  projectPath: string;
  tag: string;
};

export function getArchiveUrl(fixtureInfo: FixtureInfo): string {
  return `http://github.com/${fixtureInfo.projectPath}/archive/refs/tags/${fixtureInfo.tag}.tar.gz`;
}

export function getArchiveRoot(fixtureInfo: FixtureInfo): string {
  const [, projectName] = fixtureInfo.projectPath.split('/');
  return `${projectName}-${fixtureInfo.tag.substr(1)}`;
}

export function getFixtureInfo(network: Network): FixtureInfo {
  switch (getMainnet(network)) {
    case networks.bitcoin:
      return {
        projectPath: 'bitcoin/bitcoin',
        tag: 'v0.21.1',
      };
    case networks.bitcoincash:
      return {
        projectPath: 'bitcoin-cash-node/bitcoin-cash-node',
        tag: 'v23.0.0',
      };
    case networks.bitcoinsv:
      return {
        projectPath: 'bitcoin-sv/bitcoin-sv',
        tag: 'v1.0.8',
      };
    case networks.bitcoingold:
      return {
        projectPath: 'BTCGPU/BTCGPU',
        tag: 'v0.17.3',
      };
    case networks.dash:
      return {
        projectPath: 'dashpay/dash',
        tag: 'v0.17.0.3',
      };
    case networks.ecash:
      return {
        projectPath: 'Bitcoin-ABC/bitcoin-abc',
        tag: 'v0.26.4',
      };
    case networks.dogecoin:
      return {
        projectPath: 'dogecoin/dogecoin',
        tag: 'v1.14.5',
      };
    case networks.litecoin:
      return {
        projectPath: 'litecoin-project/litecoin',
        tag: 'v0.18.1',
      };
    case networks.zcash:
      return {
        projectPath: 'zcash/zcash',
        tag: 'v4.4.1',
      };
  }
  throw new Error(`${getNetworkName(network)} not supported`);
}

export async function readFile(network: Network, path: string): Promise<string> {
  const root = getArchiveRoot(getFixtureInfo(network));
  return await fs.readFile(`test/fixtures_thirdparty/nodes/${root}/src/test/data/${path}`, 'utf8');
}

export async function readJSON<T>(network: Network, path: string): Promise<T> {
  return JSON.parse(await readFile(network, path));
}

export const sigHashTestFile = 'sighash.json';

// https://github.com/bitcoin/bitcoin/blob/v0.21.1/src/test/data/sighash.json#L2
// https://github.com/bitcoin-cash-node/bitcoin-cash-node/blob/master/src/test/data/sighash.json
export type SigHashTestVector = [
  rawTransaction: string,
  script: string,
  inputIndex: number,
  hashType: number,
  signatureHash: string
  // BCH and BSV have two extra entries that we don't care abount
];

export type ZcashSigHashTestVector = [
  rawTransaction: string,
  script: string,
  inputIndex: number,
  hashType: number,
  branchId: number,
  signatureHash: string
];

export const txValidTestFile = 'tx_valid.json';
export type TxValidVector = [
  inputData: [prevoutHash: string, prevoutIndex: string, prevoutScriptPubKey: string][],
  serializedTransaction: string,
  verifyFlags: string
];

export function testFixture<T>(
  ctx: Mocha.Suite,
  network: Network,
  filename: string,
  callback: (this: Mocha.Context, data: T) => void
): void {
  it(filename, async function () {
    callback.call(this, await readJSON(network, filename));
  });
}

export function testFixtureArray<T>(
  ctx: Mocha.Suite,
  network: Network,
  filename: string,
  callback: (this: Mocha.Context, data: T[]) => void
): void {
  testFixture<T[]>(ctx, network, filename, function (arr: T[]) {
    callback.call(
      this,
      arr.filter((v: unknown) => (v as string[]).length !== 1)
    );
  });
}
