import * as crypto from 'crypto';
import * as util from 'util';
import { spawn, execFile } from 'child_process';

import * as utxolib from '../../../src';
import { Network, getNetworkName } from '../../../src/networks';

type DockerImageParams = {
  extraArgsDocker: string[];
  image: string;
  binary: string | undefined;
  extraArgsNode: string[];
};

const rpcPort = 18333;
const rpcUser = 'utxolib';
const rpcPassword = crypto.randomBytes(16).toString('hex');

function dockerImage(
  image: string,
  binary: string | undefined,
  extraArgsNode: string[] = [],
  extraArgsDocker: string[] = []
): DockerImageParams {
  return { image, binary, extraArgsNode, extraArgsDocker };
}

function getDockerParams(network: Network): DockerImageParams {
  switch (network) {
    case utxolib.networks.testnet:
      return dockerImage('ruimarinho/bitcoin-core:0.21.1', 'bitcoind', ['-fallbackfee=0.0001']);
    case utxolib.networks.bitcoincashTestnet:
      return dockerImage('zquestz/bitcoin-cash-node:23.0.0', 'bitcoind', ['-usecashaddr=0']);
    case utxolib.networks.bitcoinsvTestnet:
      return dockerImage('bitcoinsv/bitcoin-sv:1.0.5', 'bitcoind', [
        '-excessiveblocksize=0',
        '-maxstackmemoryusageconsensus=0',
      ]);
    case utxolib.networks.bitcoingoldTestnet:
      return dockerImage('uphold/bitcoin-gold:0.17.3', 'bgoldd');
    case utxolib.networks.dashTest:
      return dockerImage('dashpay/dashd:0.16.1.1', 'dashd');
    case utxolib.networks.dogecoinTest:
      return dockerImage('williamqinbitgo/dogeimage:1.14.5-v3', 'dogecoind');
    case utxolib.networks.ecashTest:
      return dockerImage('bitcoinabc/bitcoin-abc:0.26.9', 'bitcoind', ['-ecash=0 -usecashaddr=0']);
    case utxolib.networks.litecoinTest:
      return dockerImage('uphold/litecoin-core:0.17.1', 'litecoind');
    case utxolib.networks.zcashTest:
      const paramsDir = process.env.ZCASH_PARAMS_DIR;
      if (!paramsDir) {
        throw new Error(`envvar ZCASH_PARAMS_DIR not set`);
      }
      return dockerImage(
        'electriccoinco/zcashd:v4.7.0',
        undefined, // `zcashd` is implicit
        [
          '-nuparams=5ba81b19:10',
          '-nuparams=76b809bb:20',
          '-nuparams=2bb40e60:30',
          '-nuparams=f5b9230b:40',
          '-nuparams=e9ff75a6:400',
          // https://zips.z.cash/zip-0252
          '-nuparams=c2d6d0b4:500',
        ],
        [`--volume=${paramsDir}:/srv/zcashd/.zcash-params`]
      );
  }
  throw new Error(`unsupported network ${getNetworkName(network)}`);
}

export interface Node {
  stop(): Promise<void>;
}

export async function getRegtestNode(network: Network): Promise<Node> {
  const dockerParams = getDockerParams(network);
  const args = [
    'run',
    `--publish=${rpcPort}:${rpcPort}`,
    ...dockerParams.extraArgsDocker,
    dockerParams.image,
    ...(dockerParams.binary ? [dockerParams.binary] : []),
    '-regtest',
    '-txindex',
    `-rpcuser=${rpcUser}`,
    `-rpcpassword=${rpcPassword}`,
    `-rpcbind=0.0.0.0:${rpcPort}`,
    `-rpcallowip=0.0.0.0/0`,
    ...dockerParams.extraArgsNode,
  ] as string[];

  let stdio: 'ignore' | 'inherit' = 'ignore';
  if (process.env.UTXOLIB_TESTS_LOG_DOCKER === '1') {
    stdio = 'inherit';
  }

  const proc = spawn('docker', args, { stdio });

  return {
    stop(): Promise<void> {
      proc.kill();
      return new Promise((resolve, reject) => {
        proc.on('exit', (code, signal) => {
          if (code === 0) {
            return resolve();
          }
          reject(new Error(`code=${code} signal=${signal}`));
        });
      });
    },
  };
}

export async function getRegtestNodeHelp(network: Network): Promise<{ stdout: string; stderr: string }> {
  const dockerParams = getDockerParams(network);
  const args = [
    'run',
    ...dockerParams.extraArgsDocker,
    dockerParams.image,
    ...(dockerParams.binary ? [dockerParams.binary] : []),
    '--help',
    '-help-debug',
    '-regtest',
  ];

  return await util.promisify(execFile)('docker', args);
}

export function getRegtestNodeUrl(network: Network): string {
  return `http://${rpcUser}:${rpcPassword}@localhost:${rpcPort}`;
}
