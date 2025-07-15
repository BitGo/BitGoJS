import assert from 'node:assert';
import * as fs from 'fs/promises';

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

function getBaseUrl(network: 'mainnet' | 'testnet') {
  if (network === 'mainnet') {
    return 'https://babylon.nodes.guru/api';
  }
  return 'https://babylon-testnet-api.nodes.guru';
}

function unwrapJson(r: Response): Promise<unknown> {
  if (r.ok) {
    return r.json();
  }
  return r.text().then((text) => {
    throw new Error(`Fetch failed: ${r.status} ${r.statusText} - ${text}`);
  });
}

type BabylonNetwork = 'mainnet' | 'testnet';

async function getAllParams(network: BabylonNetwork): Promise<unknown[]> {
  const url = `${getBaseUrl(network)}/babylon/btcstaking/v1/params_versions`;
  const result = await unwrapJson(await fetch(url));
  assert(result && typeof result === 'object', `Invalid response from ${url}`);
  assert('params' in result, `Response from ${url} does not contain 'params'`);
  assert(Array.isArray(result.params), `Response from ${url} 'params' is not an array`);
  return result.params;
}

async function syncParams(network: BabylonNetwork | undefined): Promise<void> {
  if (network === undefined) {
    await syncParams('testnet');
    await syncParams('mainnet');
    return;
  }

  const allParams = await getAllParams(network);
  const filename = __dirname + `/../src/babylon/params.${network}.json`;
  await fs.writeFile(filename, JSON.stringify(allParams, null, 2) + '\n');
  console.log(`Wrote ${allParams.length} params to ${filename}`);
}

async function syncDelegationResponse(network: BabylonNetwork | undefined, txid: string | undefined): Promise<void> {
  if (network === undefined && txid === undefined) {
    console.log('Syncing delegation with default params');
    return syncDelegationResponse('testnet', '5d277e1b29e5589074aea95ac8c8230fd911c2ec3c58774aafdef915619b772c');
  }

  if (network === undefined || txid === undefined) {
    throw new Error('Network must be specified when syncing delegation response');
  }

  const url = `${getBaseUrl(network)}/babylon/btcstaking/v1/btc_delegation/${txid}`;
  const result = await unwrapJson(await fetch(url));
  assert(result && typeof result === 'object', `Invalid response from ${url}`);

  const filename = __dirname + `/../test/fixtures/babylon/rpc/btc_delegation/${network}.${txid}.json`;
  await fs.writeFile(filename, JSON.stringify(result, null, 2) + '\n');
  console.log(`Wrote delegation response to ${filename}`);
}

yargs(hideBin(process.argv))
  .command({
    command: 'sync-babylon-params',
    describe: 'Sync Babylon params',
    builder(b) {
      return b.option('network', {
        choices: ['mainnet', 'testnet'] as const,
        description: 'Network',
      });
    },
    async handler(argv) {
      await syncParams(argv.network);
    },
  })
  .command({
    command: 'sync-btc-delegation',
    describe: 'Sync BTC delegation messages',
    builder(b) {
      return b
        .option('network', {
          choices: ['mainnet', 'testnet'] as const,
          description: 'Network',
        })
        .option('txid', {
          type: 'string',
          description: 'Transaction ID of the delegation message to sync',
        });
    },
    async handler(argv) {
      await syncDelegationResponse(argv.network, argv.txid);
    },
  })
  .demandCommand()
  .help()
  .strict().argv;
