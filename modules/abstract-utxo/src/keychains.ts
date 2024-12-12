import assert from 'assert';
import * as t from 'io-ts';
import * as utxolib from '@bitgo/utxo-lib';
import { IRequestTracer, IWallet, KeyIndices, promiseProps, Triple } from '@bitgo/sdk-core';

import { AbstractUtxoCoin } from './abstractUtxoCoin';
import { UtxoWallet } from './wallet';

/*

The standard Keychain type from sdk-core requires a bunch of uninteresting parameters like `id` and `type` and leaves
important fields like `pub` and `prv` optional.

This is a more focused type that only includes the fields we care about.
 */

/**
 * A keychain for a UTXO wallet.
 */
export const UtxoKeychain = t.intersection(
  [
    t.type({
      pub: t.string,
    }),
    t.partial({
      prv: t.string,
      encryptedPrv: t.string,
    }),
  ],
  'UtxoKeychain'
);

export type UtxoKeychain = t.TypeOf<typeof UtxoKeychain>;

export const UtxoNamedKeychains = t.type({
  user: UtxoKeychain,
  backup: UtxoKeychain,
  bitgo: UtxoKeychain,
});

export type UtxoNamedKeychains = t.TypeOf<typeof UtxoNamedKeychains>;

export function toKeychainTriple(keychains: UtxoNamedKeychains): Triple<UtxoKeychain> {
  const { user, backup, bitgo } = keychains;
  return [user, backup, bitgo];
}

export function toBip32Triple(
  keychains: UtxoNamedKeychains | Triple<{ pub: string }> | Triple<string>
): Triple<utxolib.BIP32Interface> {
  if (Array.isArray(keychains)) {
    return keychains.map((keychain: { pub: string } | string) => {
      const v = typeof keychain === 'string' ? keychain : keychain.pub;
      return utxolib.bip32.fromBase58(v);
    }) as Triple<utxolib.BIP32Interface>;
  }

  return toBip32Triple(toKeychainTriple(keychains));
}

export async function fetchKeychains(
  coin: AbstractUtxoCoin,
  wallet: IWallet,
  reqId?: IRequestTracer
): Promise<UtxoNamedKeychains> {
  const result = await promiseProps({
    user: coin.keychains().get({ id: wallet.keyIds()[KeyIndices.USER], reqId }),
    backup: coin.keychains().get({ id: wallet.keyIds()[KeyIndices.BACKUP], reqId }),
    bitgo: coin.keychains().get({ id: wallet.keyIds()[KeyIndices.BITGO], reqId }),
  });
  assert(UtxoNamedKeychains.is(result));
  return result;
}

export const KeySignatures = t.partial({
  backupPub: t.string,
  bitgoPub: t.string,
});

export type KeySignatures = t.TypeOf<typeof KeySignatures>;

export function getKeySignatures(wallet: UtxoWallet): KeySignatures | undefined {
  if (t.partial({ keySignatures: KeySignatures }).is(wallet._wallet)) {
    return wallet._wallet.keySignatures;
  }
  return undefined;
}
