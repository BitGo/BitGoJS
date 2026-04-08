import { AbstractUtxoCoin, descriptor } from '@bitgo/abstract-utxo';
import { BitGoAPI } from '@bitgo/sdk-api';
import { IWallet } from '@bitgo/sdk-core';
import * as utxolib from '@bitgo/utxo-lib';
import { Descriptor } from '@bitgo/wasm-utxo';

import { printJSON } from '../../util/output';
import { store } from '../../util/store';
import type { HandlerContext } from '../../util/context';

export async function createDescriptorWallet(
  bitgo: BitGoAPI,
  coin: AbstractUtxoCoin,
  {
    label,
    enterprise,
    walletPassphrase,
  }: {
    label: string;
    enterprise: string;
    walletPassphrase: string;
  }
): Promise<IWallet> {
  return descriptor.createWallet.createDescriptorWalletWithWalletPassphrase(bitgo, coin, {
    label,
    enterprise,
    walletPassphrase,
    descriptorsFromKeys: descriptor.createWallet.DefaultWsh2Of3,
  });
}

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

export async function handleCreate(ctx: HandlerContext): Promise<void> {
  if (!store.bitgo || !store.coin) {
    throw new Error('BitGo not initialized');
  }

  const label = ctx.flags.label as string;
  const enterprise = ctx.flags.enterprise as string;
  const walletPassphrase = (ctx.flags.walletPassphrase as string) || 'setec astronomy';

  printJSON(
    await createDescriptorWallet(store.bitgo, store.coin, {
      label,
      enterprise,
      walletPassphrase,
    })
  );
}
