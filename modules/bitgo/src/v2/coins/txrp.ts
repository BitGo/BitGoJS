/**
 * Testnet XRP
 *
 * @format
 */
import { BaseCoin } from '@bitgo/sdk-core';
import { BitGo } from '../../bitgo';
import { Xrp } from './xrp';

export class Txrp extends Xrp {
  protected constructor(bitgo: BitGo) {
    super(bitgo);
  }

  static createInstance(bitgo: BitGo): BaseCoin {
    return new Txrp(bitgo);
  }
  /**
   * Identifier for the blockchain which supports this coin
   */
  public getChain(): string {
    return 'txrp';
  }

  /**
   * URL of a well-known, public facing (non-bitgo) rippled instance which can be used for recovery
   */
  public getRippledUrl(): string {
    return 'https://s.altnet.rippletest.net:51234';
  }

  /**
   * Complete human-readable name of this coin
   */
  public getFullName(): string {
    return 'Testnet Ripple';
  }
}
