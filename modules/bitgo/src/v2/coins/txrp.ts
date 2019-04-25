/**
 * Testnet XRP
 *
 * @format
 */
const Xrp = require('./xrp');

class Txrp extends Xrp {
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

export = Txrp;
