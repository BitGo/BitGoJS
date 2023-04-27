/**
 * @prettier
 */
import { BaseCoin, BitGoBase } from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, coins } from '@bitgo/statics';
import { Celo } from './celo';

export class Tcelo extends Celo {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin> = coins.get('dd0fc389-1292-4845-b9c8-f560514593e4');
  protected constructor(bitgo: BitGoBase) {
    super(bitgo);
  }

  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Tcelo(bitgo);
  }
}
