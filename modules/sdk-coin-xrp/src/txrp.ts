/**
 * Testnet XRP
 *
 * @format
 */
import { BaseCoin, BitGoBase } from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, coins } from '@bitgo/statics';
import { Xrp } from './xrp';

export class Txrp extends Xrp {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin> = coins.get('cdf3b41b-176a-4b48-859b-88b7869c51e9');
  protected constructor(bitgo: BitGoBase) {
    super(bitgo);
  }

  static createInstance(bitgo: BitGoBase): BaseCoin {
    return new Txrp(bitgo);
  }

  /**
   * URL of a well-known, public facing (non-bitgo) rippled instance which can be used for recovery
   */
  public getRippledUrl(): string {
    return 'https://s.altnet.rippletest.net:51234';
  }
}
