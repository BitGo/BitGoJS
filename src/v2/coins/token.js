const Eth = require('./eth');
const _ = require('lodash');
const Promise = require('bluebird');
const co = Promise.coroutine;
const sjcl = require('../../sjcl.min');
const prova = require('prova-lib');
const Util = require('../../util');
let ethUtil = function() {};
let ethAbi = function() {};
let EthTx = function() {};

try {
  ethUtil = require('ethereumjs-util');
  ethAbi = require('ethereumjs-abi');
  EthTx = require('ethereumjs-tx');
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

  /**
   * Builds a token recovery transaction without BitGo
   * @param params.userKey {String} [encrypted] xprv
   * @param params.backupKey {String} [encrypted] xprv
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

      // get balance of backup key and make sure we can afford gas
      const backupKeyBalance = yield this.queryAddressBalance(backupKeyAddress);

      if (backupKeyBalance.lt(gasPrice.mul(gasLimit))) {
        throw new Error(`Backup key address ${backupKeyAddress} has balance ${backupKeyBalance.toString(10)}. This address must have a balance of at least 0.01 ETH to perform recoveries`);
      }

      // get token balance of wallet
      const txAmount = yield this.queryAddressTokenBalance(this.tokenContractAddress, params.walletContractAddress);

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
        signature: signature,
        gasLimit: gasLimit.toString(10)
      };

      // calculate send data
      const sendMethodArgs = this.getSendMethodArgs(txInfo);
      const methodSignature = ethAbi.methodID('sendMultiSigToken', _.map(sendMethodArgs, 'type'));
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

  getSendMethodArgs(txInfo) {
    // Method signature is
    // sendMultiSigToken(address toAddress, uint value, address tokenContractAddress, uint expireTime, uint sequenceId, bytes signature)
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
        name: 'tokenContractAddress',
        type: 'address',
        value: this.tokenContractAddress
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
