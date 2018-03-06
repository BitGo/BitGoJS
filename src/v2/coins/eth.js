const baseCoinPrototype = require('../baseCoin').prototype;
const Wallet = require('../wallet');
const BigNumber = require('bignumber.js');
const Util = require('../../util');
const _ = require('lodash');
const Promise = require('bluebird');
const request = require('superagent');
const co = Promise.coroutine;
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

/**
 * Recover an unsupported token from a BitGo multisig wallet
 * This builds a half-signed transaction, for which there will be an admin route to co-sign and broadcast
 * @param params
 * @param params.wallet the wallet to recover the token from
 * @param params.tokenContractAddress the contract address of the unsupported token
 * @param params.recipient the destination address recovered tokens should be sent to
 * @param params.walletPassphrase the wallet passphrase
 * @param params.prv the xprv
 */
Eth.prototype.recoverToken = function(params, callback) {
  return co(function *() {
    if (!_.isObject(params)) {
      throw new Error(`recoverToken must be passed a params object. Got ${params} (type ${typeof params})`);
    }

    if (_.isUndefined(params.tokenContractAddress) || !_.isString(params.tokenContractAddress)) {
      throw new Error(`tokenContractAddress must be a string, got ${params.tokenContractAddress} (type ${typeof params.tokenContractAddress})`);
    }

    if (!this.isValidAddress(params.tokenContractAddress)) {
      throw new Error('tokenContractAddress not a valid address');
    }

    if (_.isUndefined(params.wallet) || !(params.wallet instanceof Wallet)) {
      throw new Error(`wallet must be a wallet instance, got ${params.wallet} (type ${typeof params.wallet})`);
    }

    if (_.isUndefined(params.recipient) || !_.isString(params.recipient)) {
      throw new Error(`recipient must be a string, got ${params.recipient} (type ${typeof params.recipient})`);
    }

    if (!this.isValidAddress(params.recipient)) {
      throw new Error('recipient not a valid address');
    }

    if (!ethUtil.bufferToHex || !ethAbi.soliditySHA3) {
      throw new Error('ethereum not fully supported in this environment');
    }

    // Get token balance from external API
    const walletContractAddress = params.wallet._wallet.coinSpecific.baseAddress;
    const contractBalanceUrl = this.getWalletTokenBalanceUrl(params.tokenContractAddress, walletContractAddress);
    const res = yield request.get(contractBalanceUrl);

    if (res.status !== 200 || !res.body.result) {
      throw new Error('Could not fetch token balance from etherscan');
    }

    const recoveryAmount = res.body.result;

    const recipient = {
      address: params.recipient,
      amount: recoveryAmount
    };

    // This signature will be valid for one week
    const expireTime = Math.floor((new Date().getTime()) / 1000) + (60 * 60 * 24 * 7);

    // Get sequence ID. We do this by building a 'fake' eth transaction, so the platform will increment and return us the new sequence id
    // This _does_ require the user to have a non-zero wallet balance
    const { nextContractSequenceId, gasPrice, gasLimit } = yield params.wallet.prebuildTransaction({
      recipients: [
        {
          address: params.recipient,
          amount: '1'
        }
      ]
    });

    // Build sendData for ethereum tx
    const operationTypes = ['string', 'address', 'uint', 'address', 'uint', 'uint'];
    const operationArgs = [
      // "ERC20" has been added here so that ether operation hashes, signatures cannot be re-used for tokenSending
      'ERC20',
      new ethUtil.BN(ethUtil.stripHexPrefix(recipient.address), 16),
      recipient.amount,
      new ethUtil.BN(ethUtil.stripHexPrefix(params.tokenContractAddress), 16),
      expireTime,
      nextContractSequenceId
    ];

    const operationHash = ethUtil.bufferToHex(ethAbi.soliditySHA3(operationTypes, operationArgs));

    const userPrv = yield params.wallet.getPrv({
      prv: params.prv,
      walletPassphrase: params.walletPassphrase
    });

    const signature = Util.ethSignMsgHash(operationHash, Util.xprvToEthPrivateKey(userPrv));

    const txParams = {
      recipient: recipient,
      expireTime: expireTime,
      contractSequenceId: nextContractSequenceId,
      operationHash: operationHash,
      signature: signature,
      gasLimit: gasLimit,
      gasPrice: gasPrice,
      tokenContractAddress: params.tokenContractAddress,
      walletId: params.wallet.id()
    };

    return { halfSigned: txParams };
  }).call(this).asCallback(callback);
};

Eth.prototype.getWalletTokenBalanceUrl = function(tokenContractAddress, walletContractAddress) {
  const subdomain = this.getChain() === 'teth' ? 'kovan' : 'api';

  return `https://${subdomain}.etherscan.io/api?module=account&action=tokenbalance&contractaddress=${tokenContractAddress}&address=${walletContractAddress}&tag=latest`;
};

module.exports = Eth;
