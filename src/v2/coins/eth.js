const baseCoinPrototype = require('../baseCoin').prototype;
const BigNumber = require('bignumber.js');
const Util = require('../../util');
const _ = require('lodash');
let ethAbi = function() {};
let ethUtil = function() {};

const Eth = function() {
  // this function is called externally from BaseCoin
  // replace the BaseCoin prototype with the local override prototype, which inherits from BaseCoin
  // effectively, move the BaseCoin prototype one level away
};

Eth.prototype = Object.create(baseCoinPrototype);
Eth.constructor = Eth;

try {
  ethAbi = require('ethereumjs-abi');
  ethUtil = require('ethereumjs-util');
} catch (e) {
  // ethereum currently not supported
}

/**
 * Returns the factor between the base unit and its smallest subdivison
 * @return {number}
 */
Eth.prototype.getBaseFactor = function() {
  // 10^18
  return '1000000000000000000';
};

Eth.prototype.getChain = function() {
  return 'eth';
};
Eth.prototype.getFamily = function() {
  return 'eth';
};

Eth.prototype.getFullName = function() {
  return 'Ethereum';
};

/**
 * Evaluates whether an address string is valid for this coin
 * @param address
 */
Eth.prototype.isValidAddress = function(address) {
  return ethUtil.isValidAddress(ethUtil.addHexPrefix(address));
};

/**
 * Get transfer operation for coin
 * @param recipient recipient info
 * @param expireTime expiry time
 * @param contractSequenceId sequence id
 * @returns {Array} operation array
 */
Eth.prototype.getOperation = function(recipient, expireTime, contractSequenceId) {
  return [
    ['string', 'address', 'uint', 'string', 'uint', 'uint'],
    [
      'ETHER',
      new ethUtil.BN(ethUtil.stripHexPrefix(recipient.address), 16),
      recipient.amount,
      ethUtil.stripHexPrefix(recipient.data) || '',
      expireTime,
      contractSequenceId
    ]
  ];
};

Eth.prototype.getOperationSha3ForExecuteAndConfirm = function(recipients, expireTime, contractSequenceId) {
  if (!recipients || !Array.isArray(recipients)) {
    throw new Error('expecting array of recipients');
  }

  // Right now we only support 1 recipient
  if (recipients.length !== 1) {
    throw new Error('must send to exactly 1 recipient');
  }

  if (!_.isNumber(expireTime)) {
    throw new Error('expireTime must be number of seconds since epoch');
  }

  if (!_.isNumber(contractSequenceId)) {
    throw new Error('contractSequenceId must be number');
  }

  // Check inputs
  recipients.forEach(function(recipient) {
    if (!_.isString(recipient.address) || !ethUtil.isValidAddress(ethUtil.addHexPrefix(recipient.address))) {
      throw new Error('Invalid address: ' + recipient.address);
    }

    let amount;
    try {
      amount = new BigNumber(recipient.amount);
    } catch (e) {
      throw new Error('Invalid amount for: ' + recipient.address + ' - should be numeric');
    }

    recipient.amount = amount.toFixed(0);

    if (recipient.data && !_.isString(recipient.data)) {
      throw new Error('Data for recipient ' + recipient.address + ' - should be of type hex string');
    }
  });

  const recipient = recipients[0];
  return ethUtil.bufferToHex(ethAbi.soliditySHA3(...this.getOperation(recipient, expireTime, contractSequenceId)));
};

/**
 * Assemble keychain and half-sign prebuilt transaction
 * @param params
 * - txPrebuild
 * - prv
 * @returns {{txHex}}
 */
Eth.prototype.signTransaction = function(params) {
  const txPrebuild = params.txPrebuild;
  const userPrv = params.prv;
  const EXPIRETIME_DEFAULT = 60 * 60 * 24 * 7; // This signature will be valid for 1 week

  if (_.isUndefined(txPrebuild) || !_.isObject(txPrebuild)) {
    if (!_.isUndefined(txPrebuild) && !_.isObject(txPrebuild)) {
      throw new Error(`txPrebuild must be an object, got type ${typeof txPrebuild}`);
    }
    throw new Error('missing txPrebuild parameter');
  }

  if (_.isUndefined(userPrv) || !_.isString(userPrv)) {
    if (!_.isUndefined(userPrv) && !_.isString(userPrv)) {
      throw new Error(`prv must be a string, got type ${typeof userPrv}`);
    }
    throw new Error('missing prv parameter to sign transaction');
  }

  const secondsSinceEpoch = Math.floor((new Date().getTime()) / 1000);
  const expireTime = params.expireTime || secondsSinceEpoch + EXPIRETIME_DEFAULT;

  const operationHash = this.getOperationSha3ForExecuteAndConfirm(params.recipients, expireTime, txPrebuild.nextContractSequenceId);
  const signature = Util.ethSignMsgHash(operationHash, Util.xprvToEthPrivateKey(userPrv));

  const txParams = {
    recipients: params.recipients,
    expireTime: expireTime,
    contractSequenceId: txPrebuild.nextContractSequenceId,
    sequenceId: params.sequenceId,
    operationHash: operationHash,
    signature: signature,
    gasLimit: params.gasLimit,
    gasPrice: params.gasPrice
  };
  return { halfSigned: txParams };
};

/**
 * Ensure either enterprise or newFeeAddress is passed, to know whether to create new key or use enterprise key
 * @param params
 * @param params.enterprise {String} the enterprise id to associate with this key
 * @param params.newFeeAddress {Boolean} create a new fee address (enterprise not needed in this case)
 */
Eth.prototype.preCreateBitGo = function(params) {

  // We always need params object, since either enterprise or newFeeAddress is required
  if (!_.isObject(params)) {
    throw new Error(`preCreateBitGo must be passed a params object. Got ${params} (type ${typeof params})`);
  }

  if (_.isUndefined(params.enterprise) && _.isUndefined(params.newFeeAddress)) {
    throw new Error('expecting enterprise when adding BitGo key. If you want to create a new ETH bitgo key, set the newFeeAddress parameter to true.');
  }

  // Check whether key should be an enterprise key or a BitGo key for a new fee address
  if (!_.isUndefined(params.enterprise) && !_.isUndefined(params.newFeeAddress)) {
    throw new Error(`Incompatible arguments - cannot pass both enterprise and newFeeAddress parameter.`);
  }

  if (!_.isUndefined(params.enterprise) && !_.isString(params.enterprise)) {
    throw new Error(`enterprise should be a string - got ${params.enterprise} (type ${typeof params.enterprise})`);
  }

  if (!_.isUndefined(params.newFeeAddress) && !_.isBoolean(params.newFeeAddress)) {
    throw new Error(`newFeeAddress should be a boolean - got ${params.newFeeAddress} (type ${typeof params.newFeeAddress})`);
  }
};

module.exports = Eth;
