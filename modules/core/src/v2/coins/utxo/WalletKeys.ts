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

/**
 * @prettier
 */
import * as bip32 from 'bip32';
import { Triple } from '../../triple';

export function eqPublicKey(a: bip32.BIP32Interface, b: bip32.BIP32Interface): boolean {
  return a.publicKey.equals(b.publicKey);
}

/**
 * Base method for
 */
export class WalletKeys {
  public readonly publicKeys: Triple<Buffer>;

  constructor(public readonly triple: Triple<bip32.BIP32Interface>) {
    triple.forEach((a, i) => {
      triple.forEach((b, j) => {
        if (eqPublicKey(a, b) && i !== j) {
          throw new Error(`wallet keys must be distinct`);
        }
      });
    });

    this.publicKeys = this.triple.map((k) => k.publicKey) as Triple<Buffer>;
  }

  get user(): bip32.BIP32Interface {
    return this.triple[0];
  }

  get backup(): bip32.BIP32Interface {
    return this.triple[1];
  }

  get bitgo(): bip32.BIP32Interface {
    return this.triple[2];
  }
}

export class DerivedWalletKeys extends WalletKeys {
  constructor(public parent: RootWalletKeys, public paths: Triple<string>) {
    super(parent.triple.map((k, i) => k.derivePath(paths[i])) as Triple<bip32.BIP32Interface>);
  }
}

export class RootWalletKeys extends WalletKeys {
  static readonly defaultPrefix = '0/0';
  constructor(
    triple: Triple<bip32.BIP32Interface>,
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

  getDerivationPath(key: bip32.BIP32Interface, chain: number, index: number): string {
    if (!this.derivationPrefixes) {
      throw new Error(`no derivation prefixes`);
    }
    const prefix = this.derivationPrefixes.find((prefix, i) => eqPublicKey(key, this.triple[i]));
    if (prefix === undefined) {
      throw new Error(`key not in walletKeys`);
    }
    return `${prefix}/${chain}/${index}`;
  }

  deriveForChainAndIndex(chain: number, index: number): DerivedWalletKeys {
    return new DerivedWalletKeys(
      this,
      this.triple.map((k) => this.getDerivationPath(k, chain, index)) as Triple<string>
    );
  }
}
