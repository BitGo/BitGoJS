import { BaseCoin, BitGoBase, Environments } from '@bitgo/sdk-core';
import { Sol } from '@bitgo/sdk-coin-sol';
import { BaseCoin as StaticsBaseCoin } from '@bitgo/statics';

export class Solayer extends Sol {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;

  constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);

    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Solayer(bitgo, staticsCoin);
  }

  getChain(): string {
    return this._staticsCoin.name;
  }

  getFullName(): string {
    return this._staticsCoin.fullName;
  }

  /**
   * Solayer uses its own RPC endpoints, not Solana's.
   */
  protected getPublicNodeUrl(): string {
    return Environments[this.bitgo.getEnv()].solayerNodeUrl;
  }
}
