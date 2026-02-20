import { BIP32 } from '@bitgo/wasm-utxo';
import { Triple } from '@bitgo/sdk-core';
import * as t from 'io-ts';

export const XPubWithDerivationPath = t.intersection(
  [t.type({ xpub: t.string }), t.partial({ derivedFromParentWithSeed: t.string })],
  'XPubWithDerivationPath'
);

export type XPubWithDerivationPath = t.TypeOf<typeof XPubWithDerivationPath>;

/**
 * This is the transaction payload that is sent to the offline vault to sign.
 */
export const OfflineVaultSignable = t.type(
  {
    xpubsWithDerivationPath: t.type({
      user: XPubWithDerivationPath,
      backup: XPubWithDerivationPath,
      bitgo: XPubWithDerivationPath,
    }),
    coinSpecific: t.type({ txHex: t.string }),
  },
  'BaseTransaction'
);

export type OfflineVaultUnsigned = t.TypeOf<typeof OfflineVaultSignable>;

type WithXpub = { xpub: string };
type NamedKeys = { user: WithXpub; backup: WithXpub; bitgo: WithXpub };
export function toKeyTriple(xpubs: NamedKeys): Triple<BIP32> {
  return [BIP32.fromBase58(xpubs.user.xpub), BIP32.fromBase58(xpubs.backup.xpub), BIP32.fromBase58(xpubs.bitgo.xpub)];
}
