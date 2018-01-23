let ethUtil = function() {};
const ethPrototype = require('./eth').prototype;

const Token = function() {
};

Token.prototype = Object.create(ethPrototype);
Token.constructor = Token;

try {
  ethUtil = require('ethereumjs-util');
} catch (e) {
  // ethereum currently not supported
}

function factory(config) {
  const generator = () => function Token() {
    Object.assign(this, config);
  };
  const token = generator();
  token.prototype = Object.create(Token.prototype);
  return token;
}

Token.prototype.getChain = function() {
  return this.type;
};

Token.prototype.getFullName = function() {
  return 'ERC20 Token';
};

Token.prototype.getBaseFactor = function() {
  return String(Math.pow(10, this.decimalPlaces));
};

Token.prototype.getOperation = function(recipient, expireTime, contractSequenceId) {
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
};

module.exports = factory;
