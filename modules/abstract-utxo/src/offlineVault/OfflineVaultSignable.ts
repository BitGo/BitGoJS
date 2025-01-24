import * as utxolib from '@bitgo/utxo-lib';
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
export function toKeyTriple(xpubs: NamedKeys): Triple<utxolib.BIP32Interface> {
  return [xpubs.user.xpub, xpubs.backup.xpub, xpubs.bitgo.xpub].map((xpub) =>
    utxolib.bip32.fromBase58(xpub)
  ) as Triple<utxolib.BIP32Interface>;
}
