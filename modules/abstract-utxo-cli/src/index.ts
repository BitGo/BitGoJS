import { run, subcommands, command, string, option } from 'cmd-ts';

import { handleCreate } from './commands/wallet/cmdCreate';
import { handleList } from './commands/wallet/cmdList';
import { handleShow } from './commands/wallet/cmdShow';
import { handleXprv } from './commands/wallet/cmdXprv';
import { handleAddress } from './commands/wallet/createAddress';
import { handleBuildSignSend } from './commands/wallet/tx/buildSignSend';
import { handleChangePassphrase } from './commands/wallet/cmdChangePassphrase';
import { handleUnspents } from './commands/wallet/unspents';
import { getBitGoWithUtxoCoin } from './util/bitGoInstance';
import { store } from './util/store';

const initializeBitGo = (env: string = 'staging', coin: string = 'tbtc', accessToken?: string): void => {
  try {
    const { bitgo, coin: coinInstance } = getBitGoWithUtxoCoin({
      env: env as 'prod' | 'test' | 'staging',
      accessToken,
      coin,
    });
    store.bitgo = bitgo;
    store.coin = coinInstance;
  } catch (error) {
    console.error('Failed to initialize BitGo:', error);
    process.exit(1);
  }
};

type CommandHandler = (args: any) => Promise<void>;

const createHandler = (handler: CommandHandler): CommandHandler => handler;

const globalOptions = {
  env: option({ type: string, long: 'env', description: 'BitGo environment (prod, test, staging)', defaultValue: () => 'staging' }),
  coin: option({ type: string, long: 'coin', description: 'Coin type (btc, tbtc, etc)', defaultValue: () => 'tbtc' }),
  walletPassphrase: option({ type: string, long: 'walletPassphrase', description: 'Wallet passphrase', defaultValue: () => 'setec astronomy' }),
  accessToken: option({ type: string, long: 'accessToken', description: 'BitGo access token (optional)', defaultValue: () => '' }),
};

const walletList = command({
  name: 'list',
  description: 'List all wallets',
  args: {
    ...globalOptions,
  },
  handler: createHandler(async (args) => {
    initializeBitGo(args.env, args.coin, args.accessToken);
    const ctx = { flags: { walletPassphrase: args.walletPassphrase } };
    await handleList(ctx as any);
  }),
} as any);

const walletCreate = command({
  name: 'create',
  description: 'Create a new descriptor wallet',
  args: {
    label: option({ type: string, long: 'label', description: 'Wallet label' }),
    enterprise: option({ type: string, long: 'enterprise', description: 'Enterprise ID' }),
    ...globalOptions,
  },
  handler: createHandler(async (args) => {
    initializeBitGo(args.env, args.coin, args.accessToken);
    const ctx = { flags: { label: args.label, enterprise: args.enterprise, walletPassphrase: args.walletPassphrase } };
    await handleCreate(ctx as any);
  }),
} as any);

const walletShow = command({
  name: 'show',
  description: 'Show the wallet JSON',
  args: {
    id: option({ type: string, long: 'id', description: 'Wallet ID', defaultValue: () => '' }),
    label: option({ type: string, long: 'label', description: 'Wallet label', defaultValue: () => '' }),
    ...globalOptions,
  },
  handler: createHandler(async (args) => {
    initializeBitGo(args.env, args.coin, args.accessToken);
    const ctx = { flags: { id: args.id || undefined, label: args.label || undefined, walletPassphrase: args.walletPassphrase } };
    await handleShow(ctx as any);
  }),
} as any);

const walletXprv = command({
  name: 'xprv',
  description: 'Show the xprv of the wallet',
  args: {
    id: option({ type: string, long: 'id', description: 'Wallet ID', defaultValue: () => '' }),
    label: option({ type: string, long: 'label', description: 'Wallet label', defaultValue: () => '' }),
    ...globalOptions,
  },
  handler: createHandler(async (args) => {
    initializeBitGo(args.env, args.coin, args.accessToken);
    const ctx = { flags: { id: args.id || undefined, label: args.label || undefined, walletPassphrase: args.walletPassphrase } };
    await handleXprv(ctx as any);
  }),
} as any);

const walletAddress = command({
  name: 'address',
  description: 'Create a new address in the wallet',
  args: {
    id: option({ type: string, long: 'id', description: 'Wallet ID', defaultValue: () => '' }),
    label: option({ type: string, long: 'label', description: 'Wallet label', defaultValue: () => '' }),
    ...globalOptions,
  },
  handler: createHandler(async (args) => {
    initializeBitGo(args.env, args.coin, args.accessToken);
    const ctx = { flags: { id: args.id || undefined, label: args.label || undefined } };
    await handleAddress(ctx as any);
  }),
} as any);

const walletUnspents = command({
  name: 'unspents',
  description: 'List unspents',
  args: {
    id: option({ type: string, long: 'id', description: 'Wallet ID', defaultValue: () => '' }),
    label: option({ type: string, long: 'label', description: 'Wallet label', defaultValue: () => '' }),
    ...globalOptions,
  },
  handler: createHandler(async (args) => {
    initializeBitGo(args.env, args.coin, args.accessToken);
    const ctx = { flags: { id: args.id || undefined, label: args.label || undefined } };
    await handleUnspents(ctx as any);
  }),
} as any);

const txBuildSignSend = command({
  name: 'buildSignSend',
  description: 'Build, sign and send a transaction',
  args: {
    id: option({ type: string, long: 'id', description: 'Wallet ID', defaultValue: () => '' }),
    label: option({ type: string, long: 'label', description: 'Wallet label', defaultValue: () => '' }),
    recipient: option({ type: string, long: 'recipient', description: 'Recipient address' }),
    amount: option({ type: string, long: 'amount', description: 'Amount in satoshis' }),
    otp: option({ type: string, long: 'otp', description: 'One-time password for signing', defaultValue: () => '000000' }),
    ...globalOptions,
  },
  handler: createHandler(async (args) => {
    initializeBitGo(args.env, args.coin, args.accessToken);
    const ctx = {
      flags: {
        id: args.id || undefined,
        label: args.label || undefined,
        recipient: args.recipient,
        amount: args.amount,
        walletPassphrase: args.walletPassphrase,
        feeRateSatB: '10',
        otp: args.otp,
      },
    };
    await handleBuildSignSend(ctx as any);
  }),
} as any);

const walletPassphraseChange = command({
  name: 'change',
  description: 'Change wallet passphrase',
  args: {
    id: option({ type: string, long: 'id', description: 'Wallet ID', defaultValue: () => '' }),
    label: option({ type: string, long: 'label', description: 'Wallet label', defaultValue: () => '' }),
    old: option({ type: string, long: 'old', description: 'Current passphrase' }),
    new: option({ type: string, long: 'new', description: 'New passphrase' }),
    ...globalOptions,
  },
  handler: createHandler(async (args) => {
    initializeBitGo(args.env, args.coin, args.accessToken);
    const ctx = {
      flags: {
        id: args.id || undefined,
        label: args.label || undefined,
        old: args.old,
        new: args.new,
      },
    };
    await handleChangePassphrase(ctx as any);
  }),
} as any);

const tx = subcommands({
  name: 'tx',
  description: 'Transaction commands',
  cmds: {
    buildSignSend: txBuildSignSend,
  },
});

const passphrase = subcommands({
  name: 'passphrase',
  description: 'Passphrase commands',
  cmds: {
    change: walletPassphraseChange,
  },
});

const wallet = subcommands({
  name: 'wallet',
  description: 'Wallet commands',
  cmds: {
    list: walletList,
    create: walletCreate,
    show: walletShow,
    xprv: walletXprv,
    address: walletAddress,
    unspents: walletUnspents,
    tx: tx,
    passphrase: passphrase,
  },
});

const app = subcommands({
  name: 'abstract-utxo-cli',
  description: 'CLI for BitGo UTXO wallets',
  version: '1.0.0',
  cmds: {
    wallet: wallet,
  },
});

run(app, process.argv.slice(2));
