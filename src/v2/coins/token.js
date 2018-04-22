let ethUtil = function() {};
const Eth = require('./eth');

try {
  ethUtil = require('ethereumjs-util');
} catch (e) {
  // ethereum currently not supported
}

class Token extends Eth {

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
    return 'ERC20 Token';
  }

  getBaseFactor() {
    return String(Math.pow(10, this.decimalPlaces));
  }

  getOperation(recipient, expireTime, contractSequenceId) {
    return [
      ['string', 'address', 'uint', 'address', 'uint', 'uint'],
      [
        'ERC20',
        new ethUtil.BN(ethUtil.stripHexPrefix(recipient.address), 16),
        recipient.amount,
        new ethUtil.BN(ethUtil.stripHexPrefix(this.tokenContractAddress), 16),
        expireTime,
        contractSequenceId
      ]
    ];
  }

  static generateToken(config) {
    // dynamically generate a new class
    class CurrentToken extends Token {
      static get tokenConfig() {
        return config;
      }
    }

    return CurrentToken;
  }

}

module.exports = Token;
