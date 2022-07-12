/**
 * @prettier
 */
import { BaseCoin, BitGoBase } from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, coins } from '@bitgo/statics';
import { AbstractEthLikeCoin } from '@bitgo/abstract-eth';
import { Etc as EtcAccountLib } from '@bitgo/account-lib';

export class Etc extends AbstractEthLikeCoin {
  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Etc(bitgo, staticsCoin);
  }

  isValidPub(pub: string): boolean {
    let valid = true;
    try {
      new EtcAccountLib.KeyPair({ pub });
    } catch (e) {
      valid = false;
    }
    return valid;
  }

  protected getTransactionBuilder(): EtcAccountLib.TransactionBuilder {
    return new EtcAccountLib.TransactionBuilder(coins.get(this.getBaseChain()));
  }
}
