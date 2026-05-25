import assert from 'assert';

import * as t from 'io-ts';
import { bitgo } from '@bitgo/utxo-lib';
import { IRequestTracer, IWallet, KeyIndices, promiseProps, Triple } from '@bitgo/sdk-core';
import { BIP32, bip32, fixedScriptWallet } from '@bitgo/wasm-utxo';

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
  keychains: bitgo.RootWalletKeys | UtxoNamedKeychains | Triple<{ pub: string }> | string[]
): Triple<BIP32> {
  if (keychains instanceof bitgo.RootWalletKeys) {
    return keychains.triple.map((k) => BIP32.fromBase58(k.toBase58())) as Triple<BIP32>;
  }
  if (Array.isArray(keychains)) {
    if (keychains.length !== 3) {
      throw new Error('expected 3 keychains');
    }
    return keychains.map((keychain: { pub: string } | string) => {
      const v = typeof keychain === 'string' ? keychain : keychain.pub;
      return BIP32.fromBase58(v);
    }) as Triple<BIP32>;
  }

  return toBip32Triple(toKeychainTriple(keychains));
}

function toXpub(keychain: { pub: string } | string | bip32.BIP32Interface): string {
  if (typeof keychain === 'string') {
    if (keychain.startsWith('xpub')) {
      return keychain;
    }
    throw new Error('expected xpub');
  }
  if ('neutered' in keychain) {
    return keychain.neutered().toBase58();
  }
  if ('pub' in keychain) {
    return toXpub(keychain.pub);
  }
  throw new Error('expected keychain');
}

export function toXpubTriple(
  keychains: UtxoNamedKeychains | Triple<{ pub: string }> | Triple<string> | Triple<bip32.BIP32Interface>
): Triple<string> {
  if (Array.isArray(keychains)) {
    if (keychains.length !== 3) {
      throw new Error('expected 3 keychains');
    }
    return keychains.map((k) => toXpub(k)) as Triple<string>;
  }
  return toXpubTriple(toKeychainTriple(keychains));
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

/**
 * Fetch wallet keys as wasm-utxo RootWalletKeys
 */
export async function fetchWasmRootWalletKeys(
  coin: AbstractUtxoCoin,
  wallet: IWallet,
  reqId?: IRequestTracer
): Promise<fixedScriptWallet.RootWalletKeys> {
  const keychains = await fetchKeychains(coin, wallet, reqId);
  return fixedScriptWallet.RootWalletKeys.from([keychains.user.pub, keychains.backup.pub, keychains.bitgo.pub]);
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
