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

type BabylonNetwork = 'mainnet' | 'testnet';

async function getAllParams(network: BabylonNetwork): Promise<unknown[]> {
  const url = `${getBaseUrl(network)}/babylon/btcstaking/v1/params_versions`;
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`Failed to fetch ${url}: ${resp.status} ${resp.statusText}`);
  }
  const result = await resp.json();
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
  .demandCommand()
  .help()
  .strict().argv;
