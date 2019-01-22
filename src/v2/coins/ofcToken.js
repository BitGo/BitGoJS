const Ofc = require('./ofc');
const _ = require('lodash');
const Promise = require('bluebird');
const co = Promise.coroutine;

class OFCToken extends Ofc {

  static get tokenConfig() {
    return {};
  }

  constructor() {
    super();
    Object.assign(this, this.constructor.tokenConfig);
  }

  getChain() {
    return this.type;
  }

  getFullName() {
    return this.name;
  }

  getBaseFactor() {
    return String(Math.pow(10, this.decimalPlaces));
  }

  /**
   * Flag for sending value of 0
   * @returns {boolean} True if okay to send 0 value, false otherwise
   */
  valuelessTransferAllowed() {
    return false;
  }

  static generateToken(config) {
    // dynamically generate a new class
    class CurrentToken extends OFCToken {
      static get tokenConfig() {
        return config;
      }
    }

    return CurrentToken;
  }

  /**
   * Assemble keychain and half-sign prebuilt transaction
   * @param params
   * - txPrebuild
   * - prv
   * @returns {{txHex}}
   */
  signTransaction(params) {
    const txPrebuild = params.txPrebuild;
    const userPrv = params.prv;

    const payload = txPrebuild.payload;
    const signatureBuffer = this.signMessage(params, payload);
    const signature = signatureBuffer.toString('hex');
    return { halfSigned: { payload, signature } };
  }

}

module.exports = OFCToken;
