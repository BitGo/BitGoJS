/**
 * Testnet TRX - Shasta network
 *
 * @format
 */
import { BaseCoin, BitGoBase } from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, coins } from '@bitgo/statics';
import { Trx } from './trx';

export class Ttrx extends Trx {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin> = coins.get('7e0c65f7-dfdc-4d22-8c31-37936a39d717');
  protected constructor(bitgo: BitGoBase) {
    super(bitgo);
  }

  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Ttrx(bitgo);
  }
}
