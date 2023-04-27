/**
 * Testnet Xtz
 *
 * @format
 */
import { BaseCoin, BitGoBase } from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, coins } from '@bitgo/statics';
import { Xtz } from './xtz';

export class Txtz extends Xtz {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin> = coins.get('1792f953-c4be-4842-97b3-69efb4f0832c');
  protected constructor(bitgo: BitGoBase) {
    super(bitgo);
  }

  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Txtz(bitgo);
  }
}
