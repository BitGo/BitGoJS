import { BaseCoin, BitGoBase, MultisigType, multisigTypes } from '@bitgo-beta/sdk-core';
import { BaseCoin as StaticsBaseCoin, coins } from '@bitgo-beta/statics';
import { AbstractEthLikeCoin } from '@bitgo-beta/abstract-eth';
import { KeyPair, TransactionBuilder } from './lib';

export class Rbtc extends AbstractEthLikeCoin {
  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Rbtc(bitgo, staticsCoin);
  }

  isValidPub(pub: string): boolean {
    let valid = true;
    try {
      new KeyPair({ pub });
    } catch (e) {
      valid = false;
    }
    return valid;
  }

  /** inherited doc */
  getDefaultMultisigType(): MultisigType {
    return multisigTypes.onchain;
  }

  protected getTransactionBuilder(): TransactionBuilder {
    return new TransactionBuilder(coins.get(this.getBaseChain()));
  }
}
