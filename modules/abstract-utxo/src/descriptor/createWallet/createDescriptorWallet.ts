import { BitGoAPI } from '@bitgo/sdk-api';
import * as utxolib from '@bitgo/utxo-lib';
import { Wallet } from '@bitgo/sdk-core';

import { AbstractUtxoCoin } from '../../abstractUtxoCoin';
import { IDescriptorWallet } from '../descriptorWallet';
import { NamedDescriptor } from '../NamedDescriptor';

import { DescriptorFromKeys } from './createDescriptors';

export async function createDescriptorWallet(
  bitgo: BitGoAPI,
  coin: AbstractUtxoCoin,
  {
    descriptors,
    ...params
  }: {
    type: 'hot';
    label: string;
    enterprise: string;
    keys: string[];
    descriptors: NamedDescriptor[];
  }
): Promise<IDescriptorWallet> {
  // We don't use `coin.wallets().add` here because it does a bunch of validation that does not make sense
  // for descriptor wallets.
  const newWallet = await bitgo
    .post(coin.url('/wallet/add'))
    .send({
      ...params,
      coinSpecific: { descriptors },
    })
    .result();
  return new Wallet(bitgo, coin, newWallet) as IDescriptorWallet;
}

export async function createDescriptorWalletWithWalletPassphrase(
  bitgo: BitGoAPI,
  coin: AbstractUtxoCoin,
  {
    enterprise,
    walletPassphrase,
    descriptorsFromKeys,
    ...params
  }: {
    label: string;
    enterprise: string;
    walletPassphrase: string;
    descriptorsFromKeys: DescriptorFromKeys;
    [key: string]: unknown;
  }
): Promise<IDescriptorWallet> {
  const userKeychain = await coin.keychains().createUserKeychain(walletPassphrase);
  const backupKeychain = await coin.keychains().createBackup();
  const bitgoKeychain = await coin.keychains().createBitGo({ enterprise });
  if (!userKeychain.prv) {
    throw new Error('Missing private key');
  }
  const userKey = utxolib.bip32.fromBase58(userKeychain.prv);
  const cosigners = [backupKeychain, bitgoKeychain].map((keychain) => {
    if (!keychain.pub) {
      throw new Error('Missing public key');
    }
    return utxolib.bip32.fromBase58(keychain.pub);
  });
  return createDescriptorWallet(bitgo, coin, {
    ...params,
    type: 'hot',
    enterprise,
    keys: [userKeychain.id, backupKeychain.id, bitgoKeychain.id],
    descriptors: descriptorsFromKeys(userKey, cosigners),
  });
}
