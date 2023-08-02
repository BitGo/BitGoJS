const fs = require('fs/promises');

import * as yargs from 'yargs';
import { BitGoAPI } from '@bitgo/sdk-api';
import { Btc, Tbtc } from '@bitgo/sdk-coin-btc';

function getBitGo(accessToken: string, env: string) {
  if (env !== 'test' && env !== 'prod') {
    throw new Error('env must be test or prod');
  }
  return new BitGoAPI({ accessToken, env });
}

const bitgo = new BitGoAPI({
  accessToken: process.env.TESTNET_ACCESS_TOKEN,
  env: 'test', // Change this to env: 'production' when you are ready for production
});

bitgo.register('btc', Btc.createInstance);
bitgo.register('tbtc', Tbtc.createInstance);

function printResult(result: unknown) {
  console.log(JSON.stringify(result, null, 4));
}

async function buildTransaction(a: {
  env: string;
  accessToken: string;
  coin: string;
  wallet: string;
  recipient: string[];
}) {
  const bitgo = await getBitGo(a.accessToken, a.env);
  const recipients = a.recipient.map((r) => {
    const [address, amount] = r.split(':');
    if (!address || !amount || isNaN(Number(amount))) {
      throw new Error('recipient must be in the format address:amount');
    }
    return { address, amount };
  });
  const wallet = await bitgo.coin(a.coin).wallets().get({ id: a.wallet });
  const transaction = await wallet.prebuildTransaction({
    recipients,
  });
  printResult(transaction);
}

async function submitTransaction(a: { env: string; accessToken: string; coin: string; wallet: string; file: string }) {
  const bitgo = await getBitGo(a.accessToken, a.env);
  const wallet = await bitgo.coin(a.coin).wallets().get({ id: a.wallet });
  const transaction = JSON.parse(await fs.readFile(a.file, { encoding: 'utf8' }));
  await wallet.submitTransaction(transaction);
}

yargs
  .option('env', { type: 'string', demandOption: true })
  .option('accessToken', { type: 'string', demandOption: true })
  .option('coin', { type: 'string', default: 'btc' })
  .option('wallet', { type: 'string', demandOption: true })
  .command({
    command: 'buildTransaction',
    builder(b) {
      return b
        .option('unspent', { type: 'string' })
        .array('unspent')
        .option('recipient', { type: 'string', demandOption: true })
        .array('recipient');
    },
    async handler(a: { env: string; accessToken: string; coin: string; wallet: string; recipient: string[] }) {
      await buildTransaction(a);
    },
  })
  .command({
    command: 'submitTransaction',
    builder(b) {
      return b.option('file', { type: 'string', demandOption: true });
    },
    async handler(a: { env: string; accessToken: string; coin: string; wallet: string; file: string }) {
      await submitTransaction(a);
    },
  }).argv;
