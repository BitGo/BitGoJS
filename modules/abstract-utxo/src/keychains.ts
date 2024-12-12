import * as utxolib from '@bitgo/utxo-lib';
import { IRequestTracer, IWallet, Keychain, KeyIndices, promiseProps, Triple } from '@bitgo/sdk-core';

import { AbstractUtxoCoin } from './abstractUtxoCoin';

export type NamedKeychains = {
  user?: Keychain;
  backup?: Keychain;
  bitgo?: Keychain;
};

export function toKeychainTriple(keychains: NamedKeychains): Triple<Keychain> {
  const { user, backup, bitgo } = keychains;
  if (!user || !backup || !bitgo) {
    throw new Error('keychains must include user, backup, and bitgo');
  }
  return [user, backup, bitgo];
}

export function toBip32Triple(keychains: Triple<{ pub: string }> | Triple<string>): Triple<utxolib.BIP32Interface> {
  return keychains.map((keychain: { pub: string } | string) => {
    const v = typeof keychain === 'string' ? keychain : keychain.pub;
    return utxolib.bip32.fromBase58(v);
  }) as Triple<utxolib.BIP32Interface>;
}

export async function fetchKeychains(
  coin: AbstractUtxoCoin,
  wallet: IWallet,
  reqId?: IRequestTracer
): Promise<NamedKeychains> {
  return promiseProps({
    user: coin.keychains().get({ id: wallet.keyIds()[KeyIndices.USER], reqId }),
    backup: coin.keychains().get({ id: wallet.keyIds()[KeyIndices.BACKUP], reqId }),
    bitgo: coin.keychains().get({ id: wallet.keyIds()[KeyIndices.BITGO], reqId }),
  });
}
