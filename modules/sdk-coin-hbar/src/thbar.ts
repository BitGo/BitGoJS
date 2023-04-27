/**
 * @prettier
 */
import { BaseCoin, BitGoBase } from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, coins } from '@bitgo/statics';
import { Hbar } from './hbar';

/**
 * Tezos testnet.
 */
export class Thbar extends Hbar {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin> = coins.get('0d251e8d-5c95-49d2-a505-db66ff5440ba');
  protected constructor(bitgo: BitGoBase) {
    super(bitgo);
  }

  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Thbar(bitgo);
  }
}
