import { BIP32Interface } from 'bip32';

import { DerivedWalletKeys, eqPublicKey, RootWalletKeys, WalletKeys } from './WalletKeys';
import { Triple } from '../types';

export class WalletUnspentSigner<T extends WalletKeys> {
  public readonly walletKeys: T;

  static from(
    walletKeys: RootWalletKeys,
    signer: number | BIP32Interface,
    cosigner: number | BIP32Interface
  ): WalletUnspentSigner<RootWalletKeys> {
    if (typeof signer !== 'number') {
      for (let i = 0; i < 3; i++) {
        if (eqPublicKey(walletKeys.triple[i], signer)) {
          signer = i;
          break;
        }
      }
    }
    if (typeof signer !== 'number') {
      throw new Error('signer must be in wallet keys');
    }
    if (typeof cosigner !== 'number') {
      for (let i = 0; i < 3; i++) {
        if (eqPublicKey(walletKeys.triple[i], cosigner)) {
          cosigner = i;
          break;
        }
      }
    }
    if (typeof cosigner !== 'number') {
      throw new Error('cosigner must be in wallet keys');
    }
    return new WalletUnspentSigner<RootWalletKeys>(walletKeys, signer, cosigner);
  }

  constructor(
    walletKeys: WalletKeys | Triple<BIP32Interface>,
    public readonly signerIndex: number,
    public readonly cosignerIndex: number
  ) {
    if (Array.isArray(walletKeys)) {
      walletKeys = new RootWalletKeys(walletKeys);
    }

    this.walletKeys = walletKeys as T;

    if (signerIndex === cosignerIndex) {
      throw new Error(`signer must not equal cosigner`);
    }
    if (walletKeys.triple[signerIndex].isNeutered()) {
      throw new Error(`signer must have private key`);
    }
  }

  get signer(): BIP32Interface {
    return this.walletKeys.triple[this.signerIndex];
  }

  get cosigner(): BIP32Interface {
    return this.walletKeys.triple[this.cosignerIndex];
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
        this.signerIndex,
        this.cosignerIndex
      );
    }

    throw new Error(`invalid state`);
  }
}
