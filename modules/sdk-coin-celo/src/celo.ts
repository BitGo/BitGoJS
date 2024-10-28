/**
 * @prettier
 */
import { BaseCoin, BitGoBase, VerifyTransactionOptions } from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, coins } from '@bitgo/statics';
import { AbstractEthLikeCoin } from '@bitgo/abstract-eth';
import { KeyPair, TransactionBuilder } from './lib';

export class Celo extends AbstractEthLikeCoin {
  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Celo(bitgo, staticsCoin);
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

  protected getTransactionBuilder(): TransactionBuilder {
    return new TransactionBuilder(coins.get(this.getBaseChain()));
  }

  async verifyTransaction(params: VerifyTransactionOptions): Promise<boolean> {
    const { txParams } = params;
    if (txParams?.recipients?.length !== 1) {
      throw new Error(`txParams should only have 1 recipient but ${txParams?.recipients?.length} found`);
    }
    return true;
  }
}
