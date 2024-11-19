import { ArgumentsCamelCase, CommandModule } from 'yargs';
import * as utxolib from '@bitgo/utxo-lib';
import { BitGoApiArgs } from '../bitGoArgs';
import { getBitGoInstance, getBitGoWithUtxoCoin } from '../util/bitGoInstance';
import { AbstractUtxoCoin } from '@bitgo/abstract-utxo';
import { BitGoAPI } from '@bitgo/sdk-api';
import { Keychain } from '@bitgo/sdk-core';
import { createFullnodeKeychain, getHdKeys } from './fullnode';
import { getDescriptors } from './descriptorWallet';
import { RpcClient } from './RpcClient';
import { Descriptor } from '@bitgo/wasm-miniscript';

type CreateWalletArgs = {
  enterpriseId: string;
  name: string;
  descriptor?: string;
  descriptorTemplate?: string;
  walletPassphrase: string;
  fullnodeUrl?: string;
};

function getXpub(keychain: Keychain): string {
  if (!keychain.pub) {
    throw new Error(`Keychain ${keychain.id} does not have a public key`);
  }
  return keychain.pub;
}

type DescriptorTemplate = 'Wsh2Of3' | 'ShWsh2Of3CltvDrop';

type PsbtParams = {
  locktime?: number;
};

function multi(m: number, n: number, keys: string[], path: string): string {
  if (n < m) {
    throw new Error(`Cannot create ${m} of ${n} multisig`);
  }
  if (keys.length < n) {
    throw new Error(`Not enough keys for ${m} of ${n} multisig: keys.length=${keys.length}`);
  }
  keys = keys.slice(0, n);
  return `multi(${m},${keys.map((k) => `${k}/${path}`).join(',')})`;
}

export function getPsbtParams(t: DescriptorTemplate): Partial<PsbtParams> {
  switch (t) {
    case 'Wsh2Of3':
      return {};
    case 'ShWsh2Of3CltvDrop':
      return { locktime: 17 };
  }
}

function getDescriptorString(
  {
    descriptor,
    descriptorTemplate,
  }: {
    descriptor?: string;
    descriptorTemplate?: string;
  },
  keychains: Keychain[]
): string {
  if (descriptor) {
    return descriptor;
  }
  const xpubs = keychains.map(getXpub);
  if (descriptorTemplate) {
    switch (descriptorTemplate) {
      case 'Wsh2Of3':
        return `wsh(${multi(2, 3, xpubs, '0/*')})`;
      case 'ShWsh2Of3CltvDrop':
        const { locktime } = getPsbtParams(descriptorTemplate);
        return `sh(wsh(and_v(r:after(${locktime}),${multi(2, 3, xpubs, '0/*')})))`;
      default:
        throw new Error(`Unknown descriptor template: ${descriptorTemplate}`);
    }
  }
  throw new Error('Not implemented');
}

function printJSON(obj: unknown): void {
  console.log(JSON.stringify(obj, null, 2));
}

async function createDescriptorWalletWithKeychains(
  bitgo: BitGoAPI,
  coin: AbstractUtxoCoin,
  {
    name,
    keychains,
    descriptor,
    descriptorTemplate,
    enterpriseId,
  }: {
    name: string;
    keychains: Keychain[];
    descriptor?: string;
    descriptorTemplate?: string;
    enterpriseId: string;
  }
) {
  const keys = keychains.map((keychain) => keychain.id);
  return await bitgo
    .post(coin.url('/wallet'))
    .send({
      type: 'hot',
      label: name,
      enterprise: enterpriseId,
      keys,
      coinSpecific: {
        descriptors: [
          {
            name: 'default',
            value: getDescriptorString({ descriptor, descriptorTemplate }, keychains),
            lastIndex: 0,
            signatures: [],
          },
        ],
      },
    })
    .result();
}

async function createDescriptorWallet(
  bitgo: BitGoAPI,
  coin: AbstractUtxoCoin,
  {
    name,
    descriptor,
    descriptorTemplate,
    enterpriseId,
    walletPassphrase,
  }: {
    name: string;
    descriptor?: string;
    descriptorTemplate?: string;
    // FIXME - pick a default here
    enterpriseId: string;
    walletPassphrase: string;
  }
): Promise<void> {
  if (!descriptor && !descriptorTemplate) {
    throw new Error('Descriptor is required');
  }
  if (descriptor && descriptorTemplate) {
    throw new Error('Only one of descriptor or descriptorTemplate can be provided');
  }
  // FIXME remove dummy keychains
  const userKeychain = await coin.keychains().createUserKeychain(walletPassphrase);
  const backupKeychain = await coin.keychains().createBackup();
  const bitgoKeychain = await coin.keychains().createBitGo({ enterprise: enterpriseId });
  return await createDescriptorWalletWithKeychains(bitgo, coin, {
    name,
    keychains: [userKeychain, backupKeychain, bitgoKeychain],
    descriptor,
    descriptorTemplate,
    enterpriseId,
  });
}

async function createDescriptorWalletWithFullnode(
  bitcoin: BitGoAPI,
  coin: AbstractUtxoCoin,
  {
    name,
    enterpriseId,
    fullnodeConfig,
  }: {
    name: string;
    enterpriseId: string;
    fullnodeConfig: {
      url: string;
    };
  }
) {
  const userKeychain = await createFullnodeKeychain(coin, fullnodeConfig, name, 'user');
  const backupKeychain = await coin.keychains().createBackup();
  const bitgoKeychain = await coin.keychains().createBitGo({ enterprise: enterpriseId });
  let wallet = await createDescriptorWalletWithKeychains(bitcoin, coin, {
    name,
    keychains: [userKeychain, backupKeychain, bitgoKeychain],
    descriptorTemplate: 'Wsh2Of3',
    enterpriseId,
  });
  wallet = await coin.wallets().get({ id: wallet.id });
  const descriptors = getDescriptors(wallet);
  for (const d of descriptors) {
    await registerDescriptorFullnode(fullnodeConfig.url, d.value, coin.network);
  }
  return wallet;
}

export const cmdCreate: CommandModule<BitGoApiArgs, BitGoApiArgs & CreateWalletArgs> = {
  command: 'create',

  builder(y) {
    return y
      .option('enterpriseId', { type: 'string', demandOption: true })
      .option('name', { type: 'string', demandOption: true })
      .option('descriptor', { type: 'string' })
      .option('descriptorTemplate', { type: 'string' })
      .option('walletPassphrase', { type: 'string', default: 'setec astronomy' })
      .option('fullnodeUrl', { type: 'string' });
  },

  async handler(args: ArgumentsCamelCase<BitGoApiArgs & CreateWalletArgs>): Promise<void> {
    const { bitgo, coin } = getBitGoWithUtxoCoin(args);
    if ('descriptor' in args || 'descriptorTemplate' in args) {
      if (!args.descriptor && !args.descriptorTemplate) {
        throw new Error('descriptor or descriptorTemplate is required');
      }
      if (args.fullnodeUrl) {
        return printJSON(
          await createDescriptorWalletWithFullnode(bitgo, coin, { ...args, fullnodeConfig: { url: args.fullnodeUrl } })
        );
      }
      printJSON(await createDescriptorWallet(bitgo, coin, args));
    } else {
      throw new Error('Not implemented');
    }
  },
};

type ShowWalletArgs = {
  wallet: string;
};

export const cmdShow: CommandModule<BitGoApiArgs, BitGoApiArgs & ShowWalletArgs> = {
  command: 'show',

  builder(y) {
    return y.option('wallet', { type: 'string', demandOption: true });
  },

  async handler(args: ArgumentsCamelCase<BitGoApiArgs>): Promise<void> {
    const { bitgo, coin } = getBitGoWithUtxoCoin(args);
    console.log(JSON.stringify(await bitgo.get(coin.url(`/wallet/${args.wallet}`)).result(), null, 2));
  },
};

type XprvArgs = {
  wallet: string;
  walletPassphrase: string;
};

export const cmdXprv: CommandModule<BitGoApiArgs, BitGoApiArgs & XprvArgs> = {
  command: 'xprv',

  builder(y) {
    return y
      .option('wallet', { type: 'string', demandOption: true })
      .option('walletPassphrase', { type: 'string', default: 'setec astronomy' });
  },

  async handler(args) {
    const bitgo = getBitGoInstance(args);
    const coin = bitgo.coin(args.coin);
    const wallet = await coin.wallets().get({ id: args.wallet });
    const userKey = await coin.keychains().get({ id: wallet.keyIds()[0] });
    const key = wallet.getUserPrv({ keychain: userKey, walletPassphrase: args.walletPassphrase });
    console.log(key);
  },
};

type RegisterFullnodeArgs = {
  wallet: string;
  fullnodeUrl: string;
};

export function getXpubsFromDescriptor(v: Descriptor | unknown): string[] {
  if (v instanceof Descriptor) {
    return getXpubsFromDescriptor(v.node());
  }
  if (v === null || typeof v !== 'object') {
    return [];
  }
  if ('Wsh' in v) {
    return getXpubsFromDescriptor(v.Wsh);
  }
  if ('Sh' in v) {
    return getXpubsFromDescriptor(v.Sh);
  }
  if ('Ms' in v) {
    return getXpubsFromDescriptor(v.Ms);
  }
  if ('Multi' in v) {
    const args = v.Multi;
    if (!Array.isArray(args)) {
      throw new Error('Multi args should be an array');
    }
    return args.slice(1).map((v) => {
      const xpubParts = v.split('/');
      return xpubParts[0];
    });
  }
  throw new Error('Not implemented');
}

export function convertDescriptorXpubs(descriptor: Descriptor, from: utxolib.Network, to: utxolib.Network): Descriptor {
  const xpubs = getXpubsFromDescriptor(descriptor);
  let descriptorString = descriptor.toString().split('#')[0];
  for (const xpub of xpubs) {
    const key = utxolib.bip32.fromBase58(xpub, from);
    key.network = to;
    descriptorString = descriptorString.replace(xpub, key.toBase58());
  }
  return Descriptor.fromString(descriptorString, 'string');
}

async function replaceXpubXprv(descriptor: Descriptor, fullnodeUrl: string): Promise<Descriptor> {
  const rpcClient = new RpcClient(fullnodeUrl);
  const hdkeys = await getHdKeys(rpcClient);
  let descriptorString = descriptor.toString().split('#')[0];
  for (const hdkey of hdkeys) {
    if (hdkey.has_private) {
      const xpub = hdkey.xpub;
      const xprv = hdkey.xprv;
      if (!xpub || !xprv) {
        throw new Error('HDKey does not have xpub or xprv');
      }
      descriptorString = descriptorString.replace(xpub, xprv);
    }
  }
  return Descriptor.fromString(descriptorString, 'string');
}

async function registerDescriptorFullnode(fullnodeUrl: string, descriptor: string, network: utxolib.Network) {
  const rpcClient = new RpcClient(fullnodeUrl);
  let wrapped: Descriptor = Descriptor.fromString(descriptor, 'string');
  wrapped = convertDescriptorXpubs(wrapped, utxolib.networks.bitcoin, network);
  wrapped = await replaceXpubXprv(wrapped, fullnodeUrl);

  await rpcClient.exec('importdescriptors', [
    {
      desc: wrapped.toString(),
      timestamp: 'now',
      active: true,
    },
  ]);
}

export const cmdRegisterFullnode: CommandModule<BitGoApiArgs, BitGoApiArgs & RegisterFullnodeArgs> = {
  command: 'registerFullnode',
  builder(y) {
    return y
      .option('wallet', { type: 'string', demandOption: true })
      .option('fullnodeUrl', { type: 'string', demandOption: true });
  },
  async handler(args) {
    const { coin } = getBitGoWithUtxoCoin(args);
    const wallet = await coin.wallets().get({ id: args.wallet });
    const descriptors = getDescriptors(wallet);
    for (const d of descriptors) {
      await registerDescriptorFullnode(args.fullnodeUrl, d.value, coin.network);
    }
  },
};
