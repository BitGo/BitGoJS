/**
 * Testnet Sui
 *
 * @format
 */
import { BaseCoin, BitGoBase } from '@bitgo/sdk-core';
import { Sui } from './sui';
import { BaseCoin as StaticsBaseCoin, coins } from '@bitgo/statics';

export class Tsui extends Sui {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin> = coins.get('2eb07d12-3a42-49d7-ae98-bf559849b334');
  protected constructor(bitgo: BitGoBase) {
    super(bitgo);
  }

  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Tsui(bitgo);
  }
}
