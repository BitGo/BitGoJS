import { BaseCoin, BitGoBase } from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin } from '@bitgo/statics';
import { Polyx } from './polyx';
import { TPOLYX_ADDRESS_FORMAT } from './lib/constants';

export class Tpolyx extends Polyx {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;
  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);

    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Tpolyx(bitgo, staticsCoin);
  }

  /**
   * Identifier for the blockchain which supports this coin
   */
  public getChain(): string {
    return 'tpolyx';
  }

  /**
   * Complete human-readable name of this coin
   */
  public getFullName(): string {
    return 'Testnet Polymesh';
  }

  /**
   * Retrieves the address format for Testnet Polyx.
   *
   * @returns {number} The address format as a number for Testnet Polyx.
   * @override
   */
  protected getAddressFormat(): number {
    return TPOLYX_ADDRESS_FORMAT;
  }
}
