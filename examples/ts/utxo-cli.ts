import { BaseCoin, IWallet, Keychain } from '@bitgo/sdk-core';
import * as yargs from 'yargs';
import { BitGoAPI } from '@bitgo/sdk-api';
import { Btc, Tbtc } from '@bitgo/sdk-coin-btc';

const fs = require('fs/promises');

function getBitGo(accessToken: string, env: string) {
  if (env !== 'test' && env !== 'prod') {
    throw new Error('env must be test or prod');
  }
  const bitgo = new BitGoAPI({ accessToken, env });
  bitgo.register('btc', Btc.createInstance);
  bitgo.register('tbtc', Tbtc.createInstance);
  return bitgo;
}

function printResult(result: unknown) {
  console.log(JSON.stringify(result, null, 4));
}

function getOfflineVaultInfo(keychains: Keychain[]) {
  const xpubsWithDerivationPath = Object.fromEntries(
    keychains.map((keychain, i) => {
      const name = ['user', 'backup', 'bitgo'][i];
      return [
        name,
        {
          xpub: keychain.pub,
          derivedFromParentWithSeed: keychain.derivedFromParentWithSeed,
        },
      ];
    })
  );

  return {
    pubs: keychains.map((k) => k.pub),
    xpubsWithDerivationPath,
  };
}

async function getKeychains(coin: BaseCoin, wallet: IWallet): Promise<Keychain[]> {
  return await Promise.all(wallet.keyIds().map((keyId) => coin.keychains().get({ id: keyId })));
}

async function withUnlock<T>(bitgo: BitGoAPI, otp: string | undefined, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    if (e.status !== 401 || !e.result?.needsOTP) {
      throw e;
    }
  }

  if (!otp) {
    throw new Error('OTP required');
  }

  await bitgo.unlock({ otp });

  return await fn();
}

type ArgsCommon = {
  env: string;
  accessToken: string;
  coin: string;
  wallet: string;
};

type ArgsBuildTransaction = {
  unspent?: string[];
  recipient: string[];
};

type ArgsSubmitTransaction = {
  otp?: string;
  file: string;
};

async function buildTransaction(a: ArgsCommon & ArgsBuildTransaction) {
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
    unspents: a.unspent?.length ? a.unspent : undefined,
    recipients,
  });
  const keychains = await getKeychains(bitgo.coin(a.coin), wallet);
  Object.assign(transaction, getOfflineVaultInfo(keychains));
  printResult(transaction);
}

async function submitTransaction(a: ArgsCommon & ArgsSubmitTransaction) {
  const bitgo = await getBitGo(a.accessToken, a.env);
  const wallet = await bitgo.coin(a.coin).wallets().get({ id: a.wallet });
  const transaction = JSON.parse(await fs.readFile(a.file, { encoding: 'utf8' }));
  console.log(
    await withUnlock(bitgo, a.otp, async () => {
      return await wallet.submitTransaction(transaction);
    })
  );
}

yargs
  .option('env', { type: 'string', demandOption: true })
  .option('accessToken', { type: 'string', demandOption: true })
  .option('coin', { type: 'string', default: 'btc' })
  .option('wallet', { type: 'string', demandOption: true })
  .option('otp', { type: 'string' })
  .command({
    command: 'buildTransaction',
    builder(b) {
      return b
        .option('unspent', { type: 'string' })
        .array('unspent')
        .option('recipient', { type: 'string', demandOption: true })
        .array('recipient');
    },
    async handler(a: ArgsCommon & ArgsBuildTransaction) {
      await buildTransaction(a);
    },
  })
  .command({
    command: 'submitTransaction',
    builder(b) {
      return b.option('file', { type: 'string', demandOption: true });
    },
    async handler(a: ArgsCommon & ArgsSubmitTransaction) {
      await submitTransaction(a);
    },
  }).argv;
