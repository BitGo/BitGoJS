const BaseCoin = require('../baseCoin');
const BigNumber = require('bignumber.js');
const crypto = require('crypto');
const prova = require('../../prova');
const Q = require('q');
const common = require('../../common');
const Util = require('../../util');
const _ = require('lodash');
let ethAbi = function() {};
let ethUtil = function() {};

const Eth = function() {
  // this function is called externally from BaseCoin
  // replace the BaseCoin prototype with the local override prototype, which inherits from BaseCoin
  // effectively, move the BaseCoin prototype one level away
  this.__proto__ = Eth.prototype;
};

Eth.prototype.__proto__ = BaseCoin.prototype;

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

/**
 * Evaluates whether an address string is valid for this coin
 * @param address
 */
Eth.prototype.isValidAddress = function(address) {
  return true;
};

const getOperationSha3ForExecuteAndConfirm = (recipients, expireTime, contractSequenceId) => {
  if (!recipients || !Array.isArray(recipients)) {
    throw new Error('expecting array of recipients');
  }

  // Right now we only support 1 recipient
  if (recipients.length !== 1) {
    throw new Error("must send to exactly 1 recipient");
  }

  if (typeof(expireTime) !== 'number') {
    throw new Error("expireTime must be number of seconds since epoch");
  }

  if (typeof(contractSequenceId) !== 'number') {
    throw new Error("contractSequenceId must be number");
  }

  // Check inputs
  recipients.forEach(function(recipient) {
    if (typeof(recipient.address) !== 'string' || !ethUtil.isValidAddress(ethUtil.addHexPrefix(recipient.address))) {
      throw new Error("Invalid address: " + recipient.address);
    }

    let amount;
    try {
      amount = new BigNumber(recipient.amount);
    } catch (e) {
      throw new Error("Invalid amount for: " + recipient.address + ' - should be numeric');
    }

    recipient.amount = amount.toFixed(0);

    if (recipient.data && typeof(recipient.data) !== 'string') {
      throw new Error("Data for recipient " + recipient.address + ' - should be of type hex string');
    }
  });

  const recipient = recipients[0];
  return ethUtil.bufferToHex(ethAbi.soliditySHA3(
  ["address", "uint", "string", "uint", "uint"],
  [
    new ethUtil.BN(ethUtil.stripHexPrefix(recipient.address), 16),
    recipient.amount,
    ethUtil.stripHexPrefix(recipient.data) || '',
    expireTime,
    contractSequenceId
  ]
  ));
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

  var secondsSinceEpoch = Math.floor((new Date().getTime()) / 1000);
  var expireTime = params.expireTime || secondsSinceEpoch + EXPIRETIME_DEFAULT;

  var operationHash = getOperationSha3ForExecuteAndConfirm(params.recipients, expireTime, txPrebuild.nextContractSequenceId);
  var signature = Util.ethSignMsgHash(operationHash, Util.xprvToEthPrivateKey(userPrv));

  var txParams = {
    recipients: params.recipients,
    expireTime: expireTime,
    contractSequenceId: txPrebuild.nextContractSequenceId,
    sequenceId: params.sequenceId,
    operationHash: operationHash,
    signature: signature,
    gasLimit: params.gasLimit
  };
  return { halfSigned: txParams };
};

module.exports = Eth;
