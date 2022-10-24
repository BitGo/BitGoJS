/**
 * Classes for deriving key triples for wallet addresses.
 *
 * By default, BitGo wallets consist of a triple of bip32 extend keypairs.
 * Every wallet address can be identified by _(chain: number, index: number)_.
 * The key set for a particular address can be obtained by deriving with the path
 * `0/0/${chain}/${index}`. (In rare cases the prefix 0/0 can be different)
 *
 * Since we never use other derivations for utxo address scripts, the classes defined here only
 * allow exactly one level of derivation.
 */
import { BIP32Interface } from 'bip32';

import { Triple } from '../types';

export type KeyName = 'user' | 'backup' | 'bitgo';

export function eqPublicKey(a: BIP32Interface, b: BIP32Interface): boolean {
  return a.publicKey.equals(b.publicKey);
}

/**
 * Base class for RootWalletKeys and DerivedWalletKeys.
 * Keys can be either public keys or private keys.
 */
export class WalletKeys {
  public readonly publicKeys: Triple<Buffer>;

  /**
   * @param triple - bip32 key triple
   */
  constructor(public readonly triple: Triple<BIP32Interface>) {
    triple.forEach((a, i) => {
      triple.forEach((b, j) => {
        if (eqPublicKey(a, b) && i !== j) {
          throw new Error(`wallet keys must be distinct`);
        }
      });
    });

    this.publicKeys = this.triple.map((k) => k.publicKey) as Triple<Buffer>;
  }

  get user(): BIP32Interface {
    return this.triple[0];
  }

  get backup(): BIP32Interface {
    return this.triple[1];
  }

  get bitgo(): BIP32Interface {
    return this.triple[2];
  }
}

/**
 * Set of WalletKeys derived from RootWalletKeys. Suitable for signing transaction inputs.
 * Contains reference to the RootWalletKeys this was derived from as well as the paths used
 * for derivation.
 */
export class DerivedWalletKeys extends WalletKeys {
  /**
   * @param parent - wallet keys to derive from
   * @param paths - paths to derive with
   */
  constructor(public parent: RootWalletKeys, public paths: Triple<string>) {
    super(parent.triple.map((k, i) => k.derivePath(paths[i])) as Triple<BIP32Interface>);
  }
}

/**
 * Set of root wallet keys, typically instantiated using the wallet xpub triple.
 */
export class RootWalletKeys extends WalletKeys {
  static readonly defaultPrefix = '0/0';

  /**
   * @param triple - bip32 key triple
   * @param derivationPrefixes - Certain v1 wallets or their migrated v2 counterparts
   *                             can have a nonstandard prefix.
   */
  constructor(
    triple: Triple<BIP32Interface>,
    public readonly derivationPrefixes: Triple<string> = [
      RootWalletKeys.defaultPrefix,
      RootWalletKeys.defaultPrefix,
      RootWalletKeys.defaultPrefix,
    ]
  ) {
    super(triple);

    derivationPrefixes.forEach((p) => {
      if (p.startsWith('/') || p.endsWith('/')) {
        throw new Error(`derivation prefix must not start or end with a slash`);
      }
    });
  }

  /**
   * @param key
   * @param chain
   * @param index
   * @return full derivation path for key, including key-specific prefix
   */
  getDerivationPath(key: BIP32Interface, chain: number, index: number): string {
    if (!this.derivationPrefixes) {
      throw new Error(`no derivation prefixes`);
    }
    const prefix = this.derivationPrefixes.find((prefix, i) => eqPublicKey(key, this.triple[i]));
    if (prefix === undefined) {
      throw new Error(`key not in walletKeys`);
    }
    return `${prefix}/${chain}/${index}`;
  }

  /**
   * @param chain
   * @param index
   * @return walletKeys for a particular address identified by (chain, index)
   */
  deriveForChainAndIndex(chain: number, index: number): DerivedWalletKeys {
    return new DerivedWalletKeys(
      this,
      this.triple.map((k) => this.getDerivationPath(k, chain, index)) as Triple<string>
    );
  }
}
