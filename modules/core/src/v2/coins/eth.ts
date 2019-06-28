import { BaseCoin } from '../baseCoin';
import { Wallet } from '../wallet';
import * as common from '../../common';
import * as config from '../../config';
const BigNumber = require('bignumber.js');
const keccak = require('keccak');
const Util = require('../../util');
import * as _ from 'lodash';
import * as Bluebird from 'bluebird';
import * as crypto from 'crypto';
import * as secp256k1 from 'secp256k1';
import * as utxoLib from 'bitgo-utxo-lib';
const co = Bluebird.coroutine;
const request = require('superagent');

// The following dependencies are optional. If they are missing we still want to be
// able to require `eth.js` without error.
const optionalDeps = {
  get ethAbi() {
    return require('ethereumjs-abi');
  },

  get ethUtil() {
    return require('ethereumjs-util');
  },

  get EthTx() {
    return require('ethereumjs-tx');
  }
};

/**
 * The extra parameters to send to platform build route for hop transactions
 */
interface HopParams {
  gasPriceMax: number,
  userReqSig: string,
  paymentId: string,
}

/**
 * The prebuilt hop transaction returned from the HSM
 */
interface HopPrebuild {
  tx: string,
  id: string,
  signature: string,
}

export class Eth extends BaseCoin {

  static createInstance(bitgo: any): BaseCoin {
    return new Eth(bitgo);
  }

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

  static hopTransactionSalt = 'bitgoHopAddressRequestSalt';

  /**
   * Flag for sending value of 0
   * @returns {boolean} True if okay to send 0 value, false otherwise
   */
  valuelessTransferAllowed() {
    return true;
  }

  /**
   * Flag for sending data along with transactions
   * @returns {boolean} True if okay to send tx data (ETH), false otherwise
   */
  transactionDataAllowed() {
    return true;
  }

  /**
   * Evaluates whether an address string is valid for this coin
   * @param address
   */
  isValidAddress(address) {
    return optionalDeps.ethUtil.isValidAddress(optionalDeps.ethUtil.addHexPrefix(address));
  }

  /**
   * Return boolean indicating whether input is valid public key for the coin.
   *
   * @param {String} pub the pub to be checked
   * @returns {Boolean} is it valid?
   */
  isValidPub(pub) {
    try {
      utxoLib.HDNode.fromBase58(pub);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Default gas price from platform
   * @returns {BigNumber}
   */
  getRecoveryGasPrice() {
    return new optionalDeps.ethUtil.BN('20000000000');
  }

  /**
   * Default gas limit from platform
   * @returns {BigNumber}
   */
  getRecoveryGasLimit() {
    return new optionalDeps.ethUtil.BN('500000');
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
      return new optionalDeps.ethUtil.BN(result.result, 10);
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
      if (!optionalDeps.ethUtil.isValidAddress(tokenContractAddress)) {
        throw new Error('cannot get balance for invalid token address');
      }
      if (!optionalDeps.ethUtil.isValidAddress(walletContractAddress)) {
        throw new Error('cannot get token balance for invalid wallet address');
      }

      const result = yield this.recoveryBlockchainExplorerQuery({
        module: 'account',
        action: 'tokenbalance',
        contractaddress: tokenContractAddress,
        address: walletContractAddress,
        tag: 'latest'
      });

      return new optionalDeps.ethUtil.BN(result.result, 10);
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
      ['string', 'address', 'uint', 'bytes', 'uint', 'uint'],
      [
        'ETHER',
        new optionalDeps.ethUtil.BN(optionalDeps.ethUtil.stripHexPrefix(recipient.address), 16),
        recipient.amount,
        new Buffer(optionalDeps.ethUtil.stripHexPrefix(recipient.data) || '', 'hex'),
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
      if (!_.isString(recipient.address) || !optionalDeps.ethUtil.isValidAddress(optionalDeps.ethUtil.addHexPrefix(recipient.address))) {
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
    return optionalDeps.ethUtil.bufferToHex(optionalDeps.ethAbi.soliditySHA3(...this.getOperation(recipient, expireTime, contractSequenceId)));
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
      const sequenceIdMethodSignature = optionalDeps.ethAbi.methodID('getNextSequenceId', []);
      const sequenceIdArgs = optionalDeps.ethAbi.rawEncode([], []);
      const sequenceIdData = Buffer.concat([sequenceIdMethodSignature, sequenceIdArgs]).toString('hex');
      const result = yield this.recoveryBlockchainExplorerQuery({
        module: 'proxy',
        action: 'eth_call',
        to: address,
        data: sequenceIdData,
        tag: 'latest'
      });
      const sequenceIdHex = result.result;
      return new optionalDeps.ethUtil.BN(sequenceIdHex.slice(2), 16).toNumber();
    }).call(this).asCallback(callback);
  }

  /**
   * Helper function for signTransaction for the rare case that SDK is doing the second signature
   * Note: we are expecting this to be called from the offline vault
   * @param params.txPrebuild
   * @param params.signingKeyNonce
   * @param params.walletContractAddress
   * @param params.prv
   * @returns {{txHex: *}}
   */
  signFinal(params) {
    const txPrebuild = params.txPrebuild;

    if (!_.isNumber(params.signingKeyNonce)) {
      throw new Error('must have signingKeyNonce as a parameter, and it must be a number');
    }
    if (_.isUndefined(params.walletContractAddress)) {
      throw new Error('params must include walletContractAddress, but got undefined');
    }

    const signingNode = utxoLib.HDNode.fromBase58(params.prv);
    const signingKey = signingNode.getKey().getPrivateKeyBuffer();

    const txInfo = {
      recipient: txPrebuild.recipients[0],
      expireTime: txPrebuild.halfSigned.expireTime,
      contractSequenceId: txPrebuild.halfSigned.contractSequenceId,
      signature: txPrebuild.halfSigned.signature
    };

    const sendMethodArgs = this.getSendMethodArgs(txInfo);
    const methodSignature = optionalDeps.ethAbi.methodID('sendMultiSig', _.map(sendMethodArgs, 'type'));
    const encodedArgs = optionalDeps.ethAbi.rawEncode(_.map(sendMethodArgs, 'type'), _.map(sendMethodArgs, 'value'));
    const sendData = Buffer.concat([methodSignature, encodedArgs]);

    const ethTxParams = {
      to: params.walletContractAddress,
      nonce: params.signingKeyNonce,
      value: 0,
      gasPrice: new optionalDeps.ethUtil.BN(txPrebuild.gasPrice),
      gasLimit: new optionalDeps.ethUtil.BN(txPrebuild.gasLimit),
      data: sendData,
      spendAmount: params.recipients[0].amount
    };

    const ethTx = new optionalDeps.EthTx(ethTxParams);
    ethTx.sign(signingKey);
    return { txHex: ethTx.serialize().toString('hex') };
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

    params.recipients = txPrebuild.recipients || params.recipients;

    // if no recipients in either params or txPrebuild, then throw an error
    if (!params.recipients || !Array.isArray(params.recipients)) {
      throw new Error('recipients missing or not array');
    }

    // Normally the SDK provides the first signature for an ETH tx, but occasionally it provides the second and final one.
    if (params.isLastSignature) {
      // In this case when we're doing the second (final) signature, the logic is different.
      return this.signFinal(params);
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
      gasPrice: params.gasPrice,
      hopTransaction: txPrebuild.hopTransaction,
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
   * Queries public block explorer to get the next ETH nonce that should be used for the given ETH address
   * @param address
   * @param callback
   * @returns {*}
   */
  getAddressNonce(address, callback) {
    return co(function *() {
      // Get nonce for backup key (should be 0)
      let nonce = 0;

      const result = yield this.recoveryBlockchainExplorerQuery({
        module: 'account',
        action: 'txlist',
        address
      });
      const backupKeyTxList = result.result;
      if (backupKeyTxList.length > 0) {
        // Calculate last nonce used
        const outgoingTxs = backupKeyTxList.filter((tx) => tx.from === address);
        nonce = outgoingTxs.length;
      }
      return nonce;
    }).call(this).asCallback(callback);
  }

  /**
   * Helper function for recover()
   * This transforms the unsigned transaction information into a format the BitGo offline vault expects
   * @param txInfo
   * @param ethTx
   * @param userKey
   * @param backupKey
   * @returns {{tx: *, userKey: *, backupKey: *, coin: string, amount: string, gasPrice: string, gasLimit: string, recipients: ({address, amount}|{address: ({address, amount}|string), amount: string}|string)[]}}
   */
  formatForOfflineVault(txInfo, ethTx, userKey, backupKey, gasPrice, gasLimit, callback) {
    return co(function *() {
      const backupHDNode = utxoLib.HDNode.fromBase58(backupKey);
      const backupSigningKey = backupHDNode.getKey().getPublicKeyBuffer();
      const response: any = {
        tx: ethTx.serialize().toString('hex'),
        userKey,
        backupKey,
        coin: this.getChain(),
        gasPrice: optionalDeps.ethUtil.bufferToInt(gasPrice).toFixed(),
        gasLimit,
        recipients: [
          txInfo.recipient
        ],
        walletContractAddress: '0x' + ethTx.to.toString('hex'),
        amount: txInfo.recipient.amount,
        backupKeyNonce: yield this.getAddressNonce(`0x${optionalDeps.ethUtil.publicToAddress(backupSigningKey, true).toString('hex')}`)
      };
      _.extend(response, txInfo);
      response.nextContractSequenceId = response.contractSequenceId;
      return response;
    }).call(this).asCallback(callback);
  }

  /**
   * Builds a funds recovery transaction without BitGo
   * @param params.userKey {String} [encrypted] xprv
   * @param params.backupKey {String} [encrypted] xprv or xpub if the xprv is held by a KRS provider
   * @param params.walletPassphrase {String} used to decrypt userKey and backupKey
   * @param params.walletContractAddress {String} the ETH address of the wallet contract
   * @param params.krsProvider {String} necessary if backup key is held by KRS
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

      if (_.isUndefined(params.walletPassphrase) && !params.userKey.startsWith('xpub')) {
        throw new Error('missing wallet passphrase');
      }

      if (_.isUndefined(params.walletContractAddress) || !this.isValidAddress(params.walletContractAddress)) {
        throw new Error('invalid walletContractAddress');
      }

      if (_.isUndefined(params.recoveryDestination) || !this.isValidAddress(params.recoveryDestination)) {
        throw new Error('invalid recoveryDestination');
      }

      const isKrsRecovery = params.backupKey.startsWith('xpub') && !params.userKey.startsWith('xpub');
      const isUnsignedSweep = params.backupKey.startsWith('xpub') && params.userKey.startsWith('xpub');

      if (isKrsRecovery && _.isUndefined(config.krsProviders[params.krsProvider])) {
        throw new Error('unknown key recovery service provider');
      }

      // Clean up whitespace from entered values
      let userKey = params.userKey.replace(/\s/g, '');
      const backupKey = params.backupKey.replace(/\s/g, '');

      // Set new eth tx fees (using default config values from platform)
      const gasPrice = this.getRecoveryGasPrice();
      const gasLimit = this.getRecoveryGasLimit();

      // Decrypt private keys from KeyCard values if necessary
      if (!userKey.startsWith('xpub') && !userKey.startsWith('xprv')) {
        try {
          userKey = this.bitgo.decrypt({
            input: userKey,
            password: params.walletPassphrase
          });
        } catch (e) {
          throw new Error(`Error decrypting user keychain: ${e.message}`);
        }
      }

      let backupKeyAddress;
      let backupSigningKey;

      if (isKrsRecovery || isUnsignedSweep) {
        const backupHDNode = utxoLib.HDNode.fromBase58(backupKey);
        backupSigningKey = backupHDNode.getKey().getPublicKeyBuffer();
        backupKeyAddress = `0x${optionalDeps.ethUtil.publicToAddress(backupSigningKey, true).toString('hex')}`;
      } else {
        // Decrypt backup private key and get address
        let backupPrv;

        try {
          backupPrv = this.bitgo.decrypt({
            input: backupKey,
            password: params.walletPassphrase
          });
        } catch (e) {
          throw new Error(`Error decrypting backup keychain: ${e.message}`);
        }

        const backupHDNode = utxoLib.HDNode.fromBase58(backupPrv);
        backupSigningKey = backupHDNode.getKey().getPrivateKeyBuffer();
        backupKeyAddress = `0x${optionalDeps.ethUtil.privateToAddress(backupSigningKey).toString('hex')}`;
      }

      const backupKeyNonce = yield this.getAddressNonce(backupKeyAddress);

      // get balance of backupKey to ensure funds are available to pay fees
      const backupKeyBalance = yield this.queryAddressBalance(backupKeyAddress);

      if (backupKeyBalance.lt(gasPrice.mul(gasLimit))) {
        throw new Error(`Backup key address ${backupKeyAddress} has balance ${backupKeyBalance.toString(10)}. This address must have a balance of at least 0.01 ETH to perform recoveries. Try sending some ETH to this address then retry.`);
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

      let operationHash, signature;
      // Get operation hash and sign it
      if (!isUnsignedSweep) {
        operationHash = this.getOperationSha3ForExecuteAndConfirm(recipients, this.getDefaultExpireTime(), sequenceId);
        signature = Util.ethSignMsgHash(operationHash, Util.xprvToEthPrivateKey(userKey));

        try {
          Util.ecRecoverEthAddress(operationHash, signature);
        } catch (e) {
          throw new Error('Invalid signature');
        }
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
      const methodSignature = optionalDeps.ethAbi.methodID('sendMultiSig', _.map(sendMethodArgs, 'type'));
      const encodedArgs = optionalDeps.ethAbi.rawEncode(_.map(sendMethodArgs, 'type'), _.map(sendMethodArgs, 'value'));
      const sendData = Buffer.concat([methodSignature, encodedArgs]);

      // Build contract call and sign it
      const tx = new optionalDeps.EthTx({
        to: params.walletContractAddress,
        nonce: backupKeyNonce,
        value: 0,
        gasPrice: gasPrice,
        gasLimit: gasLimit,
        data: sendData,
        spendAmount: txAmount
      });

      if (isUnsignedSweep) {
        return this.formatForOfflineVault(txInfo, tx, userKey, backupKey, gasPrice, gasLimit);
      }

      if (!isKrsRecovery) {
        tx.sign(backupSigningKey);
      }

      const signedTx: any = {
        id: optionalDeps.ethUtil.bufferToHex(tx.hash(true)),
        tx: tx.serialize().toString('hex'),
      };

      if (isKrsRecovery) {
        signedTx.backupKey = backupKey;
        signedTx.coin = this.getChain();
      }

      return signedTx;
    }).call(this).asCallback(callback);
  }

  /**
   * Recover an unsupported token from a BitGo multisig wallet
   * This builds a half-signed transaction, for which there will be an admin route to co-sign and broadcast. Optionally
   * the user can set params.broadcast = true and the half-signed tx will be sent to BitGo for cosigning and broadcasting
   * @param params
   * @param params.wallet the wallet to recover the token from
   * @param params.tokenContractAddress the contract address of the unsupported token
   * @param params.recipient the destination address recovered tokens should be sent to
   * @param params.walletPassphrase the wallet passphrase
   * @param params.prv the xprv
   * @param params.broadcast if true, we will automatically submit the half-signed tx to BitGo for cosigning and broadcasting
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

      if (!optionalDeps.ethUtil.bufferToHex || !optionalDeps.ethAbi.soliditySHA3) {
        throw new Error('ethereum not fully supported in this environment');
      }

      // Get token balance from external API
      const walletContractAddress = params.wallet._wallet.coinSpecific.baseAddress;
      const recoveryAmount = yield this.queryAddressTokenBalance(params.tokenContractAddress, walletContractAddress);

      if (params.broadcast) {
        // We're going to create a normal ETH transaction that sends an amount of 0 ETH to the
        // tokenContractAddress and encode the unsupported-token-send data in the data field
        // #tricksy
        const sendMethodArgs = [
          {
            name: '_to',
            type: 'address',
            value: params.recipient
          },
          {
            name: '_value',
            type: 'uint256',
            value: recoveryAmount.toString(10)
          }
        ];
        const methodSignature = optionalDeps.ethAbi.methodID('transfer', _.map(sendMethodArgs, 'type'));
        const encodedArgs = optionalDeps.ethAbi.rawEncode(_.map(sendMethodArgs, 'type'), _.map(sendMethodArgs, 'value'));
        const sendData = Buffer.concat([methodSignature, encodedArgs]);

        const broadcastParams: any = {
          address: params.tokenContractAddress,
          amount: '0',
          data: sendData.toString('hex')
        };

        if (params.walletPassphrase) {
          broadcastParams.walletPassphrase = params.walletPassphrase;
        } else if (params.prv) {
          broadcastParams.prv = params.prv;
        }

        return yield params.wallet.send(broadcastParams);
      }

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

      // these recoveries need to be processed by support, but if the customer sends any transactions before recovery is
      // complete the sequence ID will be invalid. artificially inflate the sequence ID to allow more time for processing
      const safeSequenceId = nextContractSequenceId + 1000;

      // Build sendData for ethereum tx
      const operationTypes = ['string', 'address', 'uint', 'address', 'uint', 'uint'];
      const operationArgs = [
        // "ERC20" has been added here so that ether operation hashes, signatures cannot be re-used for tokenSending
        'ERC20',
        new optionalDeps.ethUtil.BN(optionalDeps.ethUtil.stripHexPrefix(recipient.address), 16),
        recipient.amount,
        new optionalDeps.ethUtil.BN(optionalDeps.ethUtil.stripHexPrefix(params.tokenContractAddress), 16),
        expireTime,
        safeSequenceId
      ];

      const operationHash = optionalDeps.ethUtil.bufferToHex(optionalDeps.ethAbi.soliditySHA3(operationTypes, operationArgs));

      const userPrv = yield params.wallet.getPrv({
        prv: params.prv,
        walletPassphrase: params.walletPassphrase
      });

      const signature = Util.ethSignMsgHash(operationHash, Util.xprvToEthPrivateKey(userPrv));

      const txParams = {
        recipient: recipient,
        expireTime: expireTime,
        contractSequenceId: safeSequenceId,
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
        value: optionalDeps.ethUtil.toBuffer(txInfo.recipient.data || '')
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
        value: optionalDeps.ethUtil.toBuffer(txInfo.signature)
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


  /**
   * Creates the extra parameters needed to build a hop transaction
   * @param buildParams The original build parameters
   * @param callback
   * @returns extra parameters object to merge with the original build parameters object and send to the platform
   */
  createHopTransactionParams(buildParams, callback): { hopParams: HopParams, gasLimit: number } {
    return co(function *() {
      const wallet = buildParams.wallet;
      const recipients = buildParams.recipients;
      const walletPassphrase = buildParams.walletPassphrase;

      const userKeychain = yield this.keychains().get({ id: wallet.keyIds()[0] });
      const userPrv = wallet.getUserPrv({ keychain: userKeychain, walletPassphrase });
      const userPrvBuffer = utxoLib.HDNode.fromBase58(userPrv).getKey().getPrivateKeyBuffer();
      if (!recipients || !Array.isArray(recipients)) {
        throw new Error('expecting array of recipients');
      }

      // Right now we only support 1 recipient
      if (recipients.length !== 1) {
        throw new Error('must send to exactly 1 recipient');
      }
      const recipientAddress = recipients[0].address;
      const recipientAmount = recipients[0].amount;
      const feeEstimateParams = {
        recipient: recipientAddress,
        amount: recipientAmount,
        hop: true,
      };
      const feeEstimate = yield this.feeEstimate(feeEstimateParams);

      const gasLimit = feeEstimate.gasLimitEstimate;
      const gasPrice = Math.round((feeEstimate.feeEstimate) / gasLimit);
      const gasPriceMax = gasPrice * 5;
      // Payment id a random number so its different for every tx
      const paymentId = Math.floor(Math.random() * 10000000000).toString();
      const hopDigest: Buffer = Eth.getHopDigest([recipientAddress, recipientAmount, gasPriceMax, gasLimit, paymentId]);

      const userReqSig = optionalDeps.ethUtil.addHexPrefix(secp256k1.sign(hopDigest, userPrvBuffer).signature.toString('hex'));

      return {
        hopParams: {
          gasPriceMax,
          userReqSig,
          paymentId,
        },
        gasLimit,
      };
    }).call(this).asCallback(callback);
  }

  /**
   * Validates that the hop prebuild from the HSM is valid and correct
   * @param wallet The wallet that the prebuild is for
   * @param hopPrebuild The prebuild to validate
   * @param originalParams The original parameters passed to prebuildTransaction
   * @param callback
   * @returns void
   * @throws Error if The prebuild is invalid
   */
  validateHopPrebuild(wallet: any, hopPrebuild: HopPrebuild, originalParams: any, callback: any): void {
    return co(function *() {
      const {
        tx,
        id,
        signature,
      } = hopPrebuild;


      // first, validate the HSM signature
      const serverXpub = common.Environments[this.bitgo.env].hsmXpub;
      const serverPubkeyBuffer: Buffer = utxoLib.HDNode.fromBase58(serverXpub).getPublicKeyBuffer();
      const signatureBuffer: Buffer = Buffer.from(optionalDeps.ethUtil.stripHexPrefix(signature), 'hex');
      const messageBuffer: Buffer = Buffer.from(optionalDeps.ethUtil.stripHexPrefix(id), 'hex');

      const isValidSignature: boolean = secp256k1.verify(messageBuffer, signatureBuffer.slice(1), serverPubkeyBuffer);
      if (!isValidSignature) {
        throw new Error(`Hop txid signature invalid`);
      }

      const builtHopTx = new optionalDeps.EthTx(tx);
      // If original params are given, we can check them against the transaction prebuild params
      if (!_.isNil(originalParams)) {
        const {
          recipients,
        } = originalParams;

        // Then validate that the tx params actually equal the requested params
        const originalAmount = BigNumber(recipients[0].amount);
        const originalDestination: string = recipients[0].address;

        const hopAmount = BigNumber(optionalDeps.ethUtil.bufferToHex(builtHopTx.value));
        const hopDestination: string = optionalDeps.ethUtil.bufferToHex(builtHopTx.to);
        if (!hopAmount.eq(originalAmount)) {
          throw new Error(`Hop amount: ${hopAmount} does not equal original amount: ${originalAmount}`);
        }
        if (hopDestination.toLowerCase() !== originalDestination.toLowerCase()) {
          throw new Error(`Hop destination: ${hopDestination} does not equal original recipient: ${hopDestination}`);
        }
      }

      if (!builtHopTx.verifySignature()) {
        // We dont want to continue at all in this case, at risk of ETH being stuck on the hop address
        throw new Error(`Invalid hop transaction signature, txid: ${id}`);
      }
      if (optionalDeps.ethUtil.addHexPrefix(builtHopTx.hash().toString('hex')) !== id) {
        throw new Error(`Signed hop txid does not equal actual txid`);
      }
    }).call(this).asCallback(callback);
  }

  /**
   * Gets the hop digest for the user to sign. This is validated in the HSM to prove that the user requested this tx
   * @param paramsArr The parameters to hash together for the digest
   */
  static getHopDigest(paramsArr): Buffer {
    const hash = new keccak('keccak256');
    hash.update([Eth.hopTransactionSalt, ...paramsArr].join('$'));
    return hash.digest();
  }

  /**
   * Modify prebuild before sending it to the server. Add things like hop transaction params
   * @param buildParams The whitelisted parameters for this prebuild
   * @param buildParams.hop True if this should prebuild a hop tx, else false
   * @param buildParams.recipients The recipients array of this transaction
   * @param buildParams.wallet The wallet sending this tx
   * @param buildParams.walletPassphrase the passphrase for this wallet
   * @param callback
   */
  getExtraPrebuildParams(buildParams, callback) {
    return co(function *() {
      let extraParams = { };
      if (!_.isUndefined(buildParams.hop) && buildParams.hop && !_.isUndefined(buildParams.wallet) &&
        !_.isUndefined(buildParams.recipients) && !_.isUndefined(buildParams.walletPassphrase)) {
        extraParams = Object.assign(extraParams, yield this.createHopTransactionParams(buildParams));
      }
      return extraParams;
    }).call(this).asCallback(callback);
  }

  /**
   * Modify prebuild after receiving it from the server. Add things like nlocktime
   */
  postProcessPrebuild(params, callback) {
    return co(function *() {
      if (!_.isUndefined(params.hopTransaction) && !_.isUndefined(params.wallet) && !_.isUndefined(params.buildParams)) {
        yield this.validateHopPrebuild(params.wallet, params.hopTransaction, params.buildParams);
      }
      return params;
    }).call(this).asCallback(callback);
  }

  /**
   * Coin-specific things done before signing a transaction, i.e. verification
   */
  presignTransaction(params, callback) {
    return co(function *() {
      if (!_.isUndefined(params.hopTransaction) && !_.isUndefined(params.wallet) && !_.isUndefined(params.buildParams)) {
        yield this.validateHopPrebuild(params.wallet, params.hopTransaction);
      }
      return params;
    }).call(this).asCallback(callback);
  }

  /**
   * Fetch fee estimate information from the server
   * @param {Object} params The params passed into the function
   * @param {Boolean} [params.hop] True if we should estimate fee for a hop transaction
   * @param {String} [params.recipient] The recipient of the transaction to estimate a send to
   * @param {String} [params.data] The ETH tx data to estimate a send for
   * @param callback
   * @returns {Object} The fee info returned from the server
   */
  feeEstimate(params, callback) {
    return co(function *coFeeEstimate() {
      const query: any = {};
      if (params && params.hop) {
        query.hop = params.hop;
      }
      if (params && params.recipient) {
        query.recipient = params.recipient;
      }
      if (params && params.data) {
        query.data = params.data;
      }
      if (params && params.amount) {
        query.amount = params.amount;
      }

      return this.bitgo.get(this.url('/tx/fee')).query(query).result();
    }).call(this).asCallback(callback);
  }

  /**
   * Generate secp256k1 key pair
   *
   * @param seed
   * @returns {Object} object with generated pub and prv
   */
  generateKeyPair(seed) {
    if (!seed) {
      // An extended private key has both a normal 256 bit private key and a 256
      // bit chain code, both of which must be random. 512 bits is therefore the
      // maximum entropy and gives us maximum security against cracking.
      seed = crypto.randomBytes(512 / 8);
    }
    const extendedKey = utxoLib.HDNode.fromSeedBuffer(seed);
    const xpub = extendedKey.neutered().toBase58();
    return {
      pub: xpub,
      prv: extendedKey.toBase58()
    };
  }

}

