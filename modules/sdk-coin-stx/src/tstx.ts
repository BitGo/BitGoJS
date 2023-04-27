/**
 * Testnet Stx
 *
 * @format
 */
import { BaseCoin, BitGoBase } from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, coins } from '@bitgo/statics';
import { Stx } from './stx';

export class Tstx extends Stx {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin> = coins.get('287fc055-e1f6-4ab9-8f2c-97cad4b0f328');

  constructor(bitgo: BitGoBase) {
    super(bitgo);
  }

  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Tstx(bitgo);
  }
}
