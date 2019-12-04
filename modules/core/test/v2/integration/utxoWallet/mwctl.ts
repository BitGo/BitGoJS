import makeDebug from 'debug';
import {LabelTracer, ManagedWallets} from './ManagedWallets';
import { GroupPureP2sh, GroupPureP2shP2wsh, GroupPureP2wsh } from './types';
import { formatWalletTable } from './display';

const main = async() => {
  // debugLib.enable('ManagedWallets,bitgo:*,superagent:*');
  makeDebug.enable('ManagedWallets:*,superagent');

  const { ArgumentParser } = require('argparse');
  const parser = new ArgumentParser();
  const clientId = 'otto+e2e-utxowallets@bitgo.com';
  parser.addArgument(['--env'], { required: true });
  parser.addArgument(['--poolSize'], { required: true, type: Number });
  parser.addArgument(['--group'], { required: true });
  parser.addArgument(['--cleanup'], { nargs: 0 });
  parser.addArgument(['--dryRun'], { nargs: 0 });
  parser.addArgument(['--reset'], { nargs: 0 });
  parser.addArgument(['--dump'], { nargs: 0 });
  parser.addArgument(['--dumpWallet'], { type: String });
  parser.addArgument(['--checkTransfers'], { nargs: 0 });
  const {
    env,
    poolSize,
    group: groupName,
    cleanup,
    reset,
    dump,
    dumpWallet,
    checkTransfers,
    dryRun,
  } = parser.parseArgs();
  const walletConfig = [GroupPureP2sh, GroupPureP2shP2wsh, GroupPureP2wsh]
    .find(({ name }) => name === groupName);
  if (!walletConfig) {
    throw new Error(`no walletConfig with name ${groupName}`);
  }
  const forcedPoolSize = (cleanup || dumpWallet) ? 0 : poolSize;
  const testWallets = await ManagedWallets.create(
    env,
    clientId,
    walletConfig,
    forcedPoolSize,
    { dryRun }
  );

  testWallets.setClientLabel(`mwctl-${env}-${walletConfig.name}`);

  if ([cleanup, reset, checkTransfers, dump, dumpWallet].filter(Boolean).length !== 1) {
    throw new Error(`must pick one of "cleanup", "reset" or "checkTransfers"`);
  }

  if (cleanup) {
    await testWallets.removeAllWallets();
  }

  if (reset) {
    await testWallets.resetWallets();
  }

  if (dump) {
    const wallets = await testWallets.getAll();
    console.log();
    console.log('chainHead=', testWallets.chain.chainHead);
    console.log();
    console.log(formatWalletTable(wallets));
    return;
  }

  if (dumpWallet) {
    const wallet = await testWallets.getWalletWithLabel(dumpWallet, { create: false });
    const unspents = await testWallets.getUnspents(wallet);
    console.log(wallet.id());
    console.log(unspents);
  }

  if (checkTransfers) {
    await testWallets.checkTransfers();
  }
};

if (require.main === module) {
  process.addListener('unhandledRejection', (e) => {
    console.error(e);
    process.abort();
  });

  main()
    .catch((e) => {
      console.error(e);
      process.abort();
    });
}
