const BaseCoin = require('../baseCoin');
const Wallet = require('../wallet');
const common = require('../../common');
const BigNumber = require('bignumber.js');
const Util = require('../../util');
const _ = require('lodash');
const Promise = require('bluebird');
const request = require('superagent');
const crypto = require('crypto');
const prova = require('prova-lib');
const sjcl = require('../../sjcl.min');
const co = Promise.coroutine;

let ethAbi = function() {
};

let ethUtil = function() {
};

let EthTx = function() {
};

try {
  ethAbi = require('ethereumjs-abi');
  ethUtil = require('ethereumjs-util');
  EthTx = require('ethereumjs-tx');
} catch (e) {
  // ethereum currently not supported
}

class Eth extends BaseCoin {

  /**
   * Returns the factor between the base unit and its smallest subdivison
   * @return {number}
   */
  getBaseFactor() {
    // 10^18
    return '1000000000000000000';
  }

  getChain() {
    return 'eth';
  }

  getFamily() {
    return 'eth';
  }

  getFullName() {
    return 'Ethereum';
  }

  /**
   * Evaluates whether an address string is valid for this coin
   * @param address
   */
  isValidAddress(address) {
    return ethUtil.isValidAddress(ethUtil.addHexPrefix(address));
  }

  /**
   * Default gas price from platform
   * @returns {BigNumber}
   */
  getRecoveryGasPrice() {
    return new ethUtil.BN('20000000000');
  }

  /**
   * Default gas limit from platform
   * @returns {BigNumber}
   */
  getRecoveryGasLimit() {
    return new ethUtil.BN('500000');
  }

  /**
   * Default expire time for a contract call (1 week)
   * @returns {number} Time in seconds
   */
  getDefaultExpireTime() {
    return Math.floor((new Date().getTime()) / 1000) + (60 * 60 * 24 * 7);
  }

  /**
   * Query Etherscan for the balance of an address
   * @param address {String} the ETH address
   * @param callback
   * @returns {BigNumber} address balance
   */
  queryAddressBalance(address, callback) {
    return co(function *() {
      const result = yield this.recoveryBlockchainExplorerQuery({
        module: 'account',
        action: 'balance',
        address: address
      });
      return new ethUtil.BN(result.result, 10);
    }).call(this).asCallback(callback);
  }

  /**
   * Query Etherscan for the balance of an address for a token
   * @param tokenContractAddress {String} address where the token smart contract is hosted
   * @param walletContractAddress {String} address of the wallet
   * @param callback
   * @returns {BigNumber} token balaance in base units
   */
  queryAddressTokenBalance(tokenContractAddress, walletContractAddress, callback) {
    return co(function *() {
      if (!ethUtil.isValidAddress(tokenContractAddress)) {
        throw new Error('cannot get balance for invalid token address');
      }
      if (!ethUtil.isValidAddress(walletContractAddress)) {
        throw new Error('cannot get token balance for invalid wallet address');
      }

      const result = yield this.recoveryBlockchainExplorerQuery({
        module: 'account',
        action: 'tokenbalance',
        contractaddress: tokenContractAddress,
        address: walletContractAddress,
        tag: 'latest'
      });

      return new ethUtil.BN(result.result, 10);
    }).call(this).asCallback(callback);
  }

  /**
   * Get transfer operation for coin
   * @param recipient recipient info
   * @param expireTime expiry time
   * @param contractSequenceId sequence id
   * @returns {Array} operation array
   */
  getOperation(recipient, expireTime, contractSequenceId) {
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
  }

  getOperationSha3ForExecuteAndConfirm(recipients, expireTime, contractSequenceId) {
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
  }

  /**
   * Queries the contract (via Etherscan) for the next sequence ID
   * @param address {String} address of the contract
   * @param callback
   * @returns {Number} sequence ID
   */
  querySequenceId(address, callback) {
    return co(function *() {
      // Get sequence ID using contract call
      const sequenceIdMethodSignature = ethAbi.methodID('getNextSequenceId', []);
      const sequenceIdArgs = ethAbi.rawEncode([], []);
      const sequenceIdData = Buffer.concat([sequenceIdMethodSignature, sequenceIdArgs]).toString('hex');
      const result = yield this.recoveryBlockchainExplorerQuery({
        module: 'proxy',
        action: 'eth_call',
        to: address,
        data: sequenceIdData,
        tag: 'latest'
      });
      const sequenceIdHex = result.result;
      return new ethUtil.BN(sequenceIdHex.slice(2), 16).toNumber();
    }).call(this).asCallback(callback);
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
  }

  /**
   * Ensure either enterprise or newFeeAddress is passed, to know whether to create new key or use enterprise key
   * @param params
   * @param params.enterprise {String} the enterprise id to associate with this key
   * @param params.newFeeAddress {Boolean} create a new fee address (enterprise not needed in this case)
   */
  preCreateBitGo(params) {

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
  }

  /**
   * Builds a funds recovery transaction without BitGo
   * @param params.userKey {String} [encrypted] xprv
   * @param params.backupKey {String} [encrypted] xrpv
   * @param params.walletPassphrase {String} used to decrypt userKey and backupKey
   * @param params.walletContractAddress {String} the ETH address of the wallet contract
   * @param params.recoveryDestination {String} target address to send recovered funds to
   * @param callback
   */
  recover(params, callback) {
    return co(function *recover() {
      if (_.isUndefined(params.userKey)) {
        throw new Error('missing userKey');
      }

      if (_.isUndefined(params.backupKey)) {
        throw new Error('missing backupKey');
      }

      if (_.isUndefined(params.walletPassphrase)) {
        throw new Error('missing wallet passphrase');
      }

      if (_.isUndefined(params.walletContractAddress) || !this.isValidAddress(params.walletContractAddress)) {
        throw new Error('invalid walletContractAddress');
      }

      if (_.isUndefined(params.recoveryDestination) || !this.isValidAddress(params.recoveryDestination)) {
        throw new Error('invalid recoveryDestination');
      }

      // Clean up whitespace from entered values
      const encryptedUserKey = params.userKey.replace(/\s/g, '');
      const encryptedBackupKey = params.backupKey.replace(/\s/g, '');

      // Set new eth tx fees (using default config values from platform)
      const gasPrice = this.getRecoveryGasPrice();
      const gasLimit = this.getRecoveryGasLimit();

      // Decrypt private keys from KeyCard values
      let userPrv;
      try {
        userPrv = sjcl.decrypt(params.walletPassphrase, encryptedUserKey);
      } catch (e) {
        throw new Error(`Error decrypting user keychain: ${e.message}`);
      }

      // Decrypt backup private key and get address
      let backupPrv;
      try {
        backupPrv = sjcl.decrypt(params.walletPassphrase, encryptedBackupKey);
      } catch (e) {
        throw new Error(`Error decrypting backup keychain: ${e.message}`);
      }

      const backupHDNode = prova.HDNode.fromBase58(backupPrv);
      const backupSigningKey = backupHDNode.getKey().getPrivateKeyBuffer();
      const backupKeyAddress = `0x${ethUtil.privateToAddress(backupSigningKey).toString('hex')}`;

      // Get nonce for backup key (should be 0)
      let backupKeyNonce = 0;

      const result = yield this.recoveryBlockchainExplorerQuery({
        module: 'account',
        action: 'txlist',
        address: backupKeyAddress
      });
      const backupKeyTxList = result.result;
      if (backupKeyTxList.length > 0) {
        // Calculate last nonce used
        const outgoingTxs = backupKeyTxList.filter((tx) => tx.from === backupKeyAddress);
        backupKeyNonce = outgoingTxs.length;
      }

      // get balance of wallet and deduct fees to get transaction amount
      const backupKeyBalance = yield this.queryAddressBalance(backupKeyAddress);

      if (backupKeyBalance.lt(gasPrice.mul(gasLimit))) {
        throw new Error(`Backup key address ${backupKeyAddress} has balance ${backupKeyBalance.toString(10)}. This address must have a balance of at least 0.01 ETH to perform recoveries`);
      }

      // get balance of wallet and deduct fees to get transaction amount
      const txAmount = yield this.queryAddressBalance(params.walletContractAddress);

      // build recipients object
      const recipients = [{
        address: params.recoveryDestination,
        amount: txAmount.toString(10)
      }];

      // Get sequence ID using contract call
      const sequenceId = yield this.querySequenceId(params.walletContractAddress);

      // Get operation hash and sign it
      const operationHash = this.getOperationSha3ForExecuteAndConfirm(recipients, this.getDefaultExpireTime(), sequenceId);
      const signature = Util.ethSignMsgHash(operationHash, Util.xprvToEthPrivateKey(userPrv));

      try {
        Util.ecRecoverEthAddress(operationHash, signature);
      } catch (e) {
        throw new Error('Invalid signature');
      }

      const txInfo = {
        recipient: recipients[0],
        expireTime: this.getDefaultExpireTime(),
        contractSequenceId: sequenceId,
        operationHash: operationHash,
        signature: signature,
        gasLimit: gasLimit.toString(10)
      };

      // calculate send data
      const sendMethodArgs = this.getSendMethodArgs(txInfo);
      const methodSignature = ethAbi.methodID('sendMultiSig', _.map(sendMethodArgs, 'type'));
      const encodedArgs = ethAbi.rawEncode(_.map(sendMethodArgs, 'type'), _.map(sendMethodArgs, 'value'));
      const sendData = Buffer.concat([methodSignature, encodedArgs]);

      // Build contract call and sign it
      const tx = new EthTx({
        to: params.walletContractAddress,
        nonce: backupKeyNonce,
        value: 0,
        gasPrice: gasPrice,
        gasLimit: gasLimit,
        data: sendData,
        spendAmount: txAmount
      });

      tx.sign(backupSigningKey);

      const signedTx = {
        id: ethUtil.bufferToHex(tx.hash(true)),
        tx: tx.serialize().toString('hex')
      };

      return signedTx;
    }).call(this).asCallback(callback);
  }

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
  recoverToken(params, callback) {
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
      const recoveryAmount = yield this.queryAddressTokenBalance(params.tokenContractAddress, walletContractAddress);

      const recipient = {
        address: params.recipient,
        amount: recoveryAmount.toString(10)
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
  }

  getSendMethodArgs(txInfo) {
    // Method signature is
    // sendMultiSig(address toAddress, uint value, bytes data, uint expireTime, uint sequenceId, bytes signature)
    return [
      {
        name: 'toAddress',
        type: 'address',
        value: txInfo.recipient.address
      },
      {
        name: 'value',
        type: 'uint',
        value: txInfo.recipient.amount
      },
      {
        name: 'data',
        type: 'bytes',
        value: ethUtil.toBuffer(txInfo.recipient.data || '')
      },
      {
        name: 'expireTime',
        type: 'uint',
        value: txInfo.expireTime
      },
      {
        name: 'sequenceId',
        type: 'uint',
        value: txInfo.contractSequenceId
      },
      {
        name: 'signature',
        type: 'bytes',
        value: ethUtil.toBuffer(txInfo.signature)
      }
    ];
  }

  /**
   * Make a query to Etherscan for information such as balance, token balance, solidity calls
   * @param query {Object} key-value pairs of parameters to append after /api
   * @param callback
   * @returns {Object} response from Etherscan
   */
  recoveryBlockchainExplorerQuery(query, callback) {
    return co(function *() {
      const response = yield request.get(common.Environments[this.bitgo.env].etherscanBaseUrl + '/api')
      .query(query);

      if (!response.ok) {
        throw new Error('could not reach Etherscan');
      }

      return response.body;
    }).call(this).asCallback(callback);
  }
}

/**
 * Generate secp256k1 key pair
 *
 * @param seed
 * @returns {Object} object with generated pub and prv
 */
Eth.prototype.generateKeyPair = function(seed) {
  if (!seed) {
    // An extended private key has both a normal 256 bit private key and a 256
    // bit chain code, both of which must be random. 512 bits is therefore the
    // maximum entropy and gives us maximum security against cracking.
    seed = crypto.randomBytes(512 / 8);
  }
  const extendedKey = prova.HDNode.fromSeedBuffer(seed);
  const xpub = extendedKey.neutered().toBase58();
  return {
    pub: xpub,
    prv: extendedKey.toBase58()
  };
};

module.exports = Eth;
