import { BIP32Interface } from 'bip32';

import { DerivedWalletKeys, eqPublicKey, RootWalletKeys, WalletKeys } from './WalletKeys';
import { Triple } from '../types';

export class WalletUnspentSigner<T extends WalletKeys> {
  public readonly walletKeys: T;

  static from(
    walletKeys: RootWalletKeys,
    signer: BIP32Interface,
    cosigner: BIP32Interface
  ): WalletUnspentSigner<RootWalletKeys> {
    return new WalletUnspentSigner<RootWalletKeys>(walletKeys, signer, cosigner);
  }

  readonly signerIndex;
  readonly cosignerIndex;

  constructor(
    walletKeys: WalletKeys | Triple<BIP32Interface>,
    public signer: BIP32Interface,
    public cosigner: BIP32Interface
  ) {
    if (Array.isArray(walletKeys)) {
      walletKeys = new RootWalletKeys(walletKeys);
    }
    this.signerIndex = walletKeys.triple.findIndex((k) => eqPublicKey(k, signer));
    if (this.signerIndex === undefined) {
      throw new Error(`signer not part of walletKeys`);
    }
    this.cosignerIndex = walletKeys.triple.findIndex((k) => eqPublicKey(k, cosigner));
    if (this.cosignerIndex === undefined) {
      throw new Error(`cosigner not part of walletKeys`);
    }

    this.walletKeys = walletKeys as T;

    if (eqPublicKey(signer, cosigner)) {
      throw new Error(`signer must not equal cosigner`);
    }
    if (signer.isNeutered()) {
      throw new Error(`signer must have private key`);
    }
  }

  /**
   * @param chain
   * @param index
   * @return WalletUnspentSigner that contains keys for generating output scripts and signatures.
   */
  deriveForChainAndIndex(chain: number, index: number): WalletUnspentSigner<DerivedWalletKeys> {
    if (this.walletKeys instanceof DerivedWalletKeys) {
      throw new Error(`cannot derive again from DerivedWalletKeys`);
    }

    if (this.walletKeys instanceof RootWalletKeys) {
      return new WalletUnspentSigner(
        this.walletKeys.deriveForChainAndIndex(chain, index),
        this.signer.derivePath(this.walletKeys.getDerivationPath(this.signer, chain, index)),
        this.cosigner.derivePath(this.walletKeys.getDerivationPath(this.cosigner, chain, index))
      );
    }

    throw new Error(`invalid state`);
  }
}
