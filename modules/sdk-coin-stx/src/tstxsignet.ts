/**
 * Testnet Stacks Signet
 *
 * @format
 */
import { BaseCoin, BitGoBase, Environments } from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin } from '@bitgo/statics';

import { Stx } from './stx';

export class Tstxsignet extends Stx {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;

  constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);

    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Tstxsignet(bitgo, staticsCoin);
  }

  /**
   * The Stacks staking-testnet RPC. It is a distinct chain (chain ID 1280) that only exists on
   * testnet-derived environments; environments without it configured (e.g. prod) cannot talk to
   * this network.
   */
  override getPublicNodeUrl(): string {
    const nodeUrl = Environments[this.bitgo.getEnv()].stxSignetNodeUrl;
    if (!nodeUrl) {
      throw new Error(`no stx signet node url configured for env ${this.bitgo.getEnv()}`);
    }
    return nodeUrl;
  }
}
