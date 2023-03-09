import { BaseCoin, BitGoBase, Environments } from '@bitgo/sdk-core';
import { Xrp } from './xrp';
import { BaseCoin as StaticsBaseCoin } from '@bitgo/statics';

export class Txrp extends Xrp {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;

  constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);

    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Txrp(bitgo, staticsCoin);
  }

  getChain() {
    return this._staticsCoin.name;
  }

  getFullName() {
    return this._staticsCoin.fullName;
  }

  /**
   * URL of a well-known, public facing (non-bitgo) rippled instance which can be used for recovery
   */
  public getPublicNodeUrl(): string {
    return Environments[this.bitgo.getEnv()].xrpNodeUrl;
  }
}
