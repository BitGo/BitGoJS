import * as fs from 'fs/promises';

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

function getBaseUrl(network: 'mainnet' | 'testnet') {
  if (network === 'mainnet') {
    throw new Error('Mainnet not supported');
  }
  return 'https://babylon-testnet-api.nodes.guru';
}

type BabylonNetwork = 'mainnet' | 'testnet';

async function getParams(network: BabylonNetwork, version: number): Promise<unknown> {
  const url = `${getBaseUrl(network)}/babylon/btcstaking/v1/params/${version}`;
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`Failed to fetch ${url}: ${resp.statusText}`);
  }
  return await resp.json();
}

async function getAllParams(network: BabylonNetwork): Promise<unknown[]> {
  const params: unknown[] = [];
  for (let i = 0; ; i++) {
    try {
      const p = await getParams(network, i);
      params.push(p);
    } catch (e) {
      console.error(`error fetching ${network} params version ${i}: ${e.message}`);
      break;
    }
  }
  return params;
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
