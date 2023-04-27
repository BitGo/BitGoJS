/**
 * Testnet Cosmos
 *
 * @format
 */
import { BaseCoin, BitGoBase } from '@bitgo/sdk-core';
import { Atom } from './atom';
import { BaseCoin as StaticsBaseCoin, coins } from '@bitgo/statics';

export class Tatom extends Atom {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin> = coins.get('9869004c-d372-42e1-bdd5-9ac8716c86cb');
  protected constructor(bitgo: BitGoBase) {
    super(bitgo);
  }

  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Tatom(bitgo);
  }
}
