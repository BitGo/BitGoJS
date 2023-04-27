/**
 * Testnet Cardano Ada
 *
 * @format
 */
import { BaseCoin, BitGoBase } from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, coins } from '@bitgo/statics';
import { Ada } from './ada';

export class Tada extends Ada {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin> = coins.get('1cbfb5aa-94ba-415b-b5c2-c51e801e21b3');
  protected constructor(bitgo: BitGoBase) {
    super(bitgo);
  }

  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Tada(bitgo);
  }
}
