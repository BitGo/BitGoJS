/**
 * @prettier
 */
import { HDNode } from '@bitgo/utxo-lib';
import * as Bluebird from 'bluebird';
import * as _ from 'lodash';
import { BitGo } from '../../bitgo';
import { NodeCallback } from '../types';

import { Eth, RecoverOptions, RecoveryInfo, optionalDeps } from './eth';
import { CoinConstructor } from '../coinFactory';
import { Util } from '../internal/util';
import * as config from '../../config';

const co = Bluebird.coroutine;

export interface Erc20TokenConfig {
  name: string;
  type: string;
  coin: string;
  network: string;
  tokenContractAddress: string;
  decimalPlaces: number;
}

export class Erc20Token extends Eth {
  public readonly tokenConfig: Erc20TokenConfig;

  constructor(bitgo: BitGo, tokenConfig: Erc20TokenConfig) {
    super(bitgo);
    this.tokenConfig = tokenConfig;
  }

  static createTokenConstructor(config: Erc20TokenConfig): CoinConstructor {
    return (bitgo: BitGo) => new Erc20Token(bitgo, config);
  }

  get type() {
    return this.tokenConfig.type;
  }

  get name() {
    return this.tokenConfig.name;
  }

  get coin() {
    return this.tokenConfig.coin;
  }

  get network() {
    return this.tokenConfig.network;
  }

  get tokenContractAddress() {
    return this.tokenConfig.tokenContractAddress;
  }

  get decimalPlaces() {
    return this.tokenConfig.decimalPlaces;
  }

  getChain() {
    return this.tokenConfig.type;
  }

  getFullName() {
    return 'ERC20 Token';
  }

  getBaseFactor() {
    return String(Math.pow(10, this.tokenConfig.decimalPlaces));
  }

  /**
   * Flag for sending value of 0
   * @returns {boolean} True if okay to send 0 value, false otherwise
   */
  valuelessTransferAllowed() {
    return false;
  }

  /**
   * Flag for sending data along with transactions
   * @returns {boolean} True if okay to send tx data (ETH), false otherwise
   */
  transactionDataAllowed() {
    return false;
  }

  /**
   * Builds a token recovery transaction without BitGo
   * @param params
   * @param params.userKey {String} [encrypted] xprv
   * @param params.backupKey {String} [encrypted] xprv or xpub if the xprv is held by a KRS providers
   * @param params.walletPassphrase {String} used to decrypt userKey and backupKey
   * @param params.walletContractAddress {String} the ETH address of the wallet contract
   * @param params.recoveryDestination {String} target address to send recovered funds to
   * @param params.krsProvider {String} necessary if backup key is held by KRS
   * @param callback
   */
  recover(params: RecoverOptions, callback?: NodeCallback<RecoveryInfo>): Bluebird<RecoveryInfo> {
    const self = this;
    return co<RecoveryInfo>(function* recover() {
      if (_.isUndefined(params.userKey)) {
        throw new Error('missing userKey');
      }

      if (_.isUndefined(params.backupKey)) {
        throw new Error('missing backupKey');
      }

      if (_.isUndefined(params.walletPassphrase) && !params.userKey.startsWith('xpub')) {
        throw new Error('missing wallet passphrase');
      }

      if (_.isUndefined(params.walletContractAddress) || !self.isValidAddress(params.walletContractAddress)) {
        throw new Error('invalid walletContractAddress');
      }

      if (_.isUndefined(params.recoveryDestination) || !self.isValidAddress(params.recoveryDestination)) {
        throw new Error('invalid recoveryDestination');
      }

      const isKrsRecovery = params.backupKey.startsWith('xpub') && !params.userKey.startsWith('xpub');
      const isUnsignedSweep = params.backupKey.startsWith('xpub') && params.userKey.startsWith('xpub');

      if (isKrsRecovery && params.krsProvider && _.isUndefined(config.krsProviders[params.krsProvider])) {
        throw new Error('unknown key recovery service provider');
      }

      // Clean up whitespace from entered values
      const userKey = params.userKey.replace(/\s/g, '');
      const backupKey = params.backupKey.replace(/\s/g, '');

      // Set new eth tx fees (using default config values from platform)
      const gasPrice = self.getRecoveryGasPrice();
      const gasLimit = self.getRecoveryGasLimit();

      // Decrypt private keys from KeyCard values
      let userPrv;
      if (!userKey.startsWith('xpub') && !userKey.startsWith('xprv')) {
        try {
          userPrv = self.bitgo.decrypt({
            input: userKey,
            password: params.walletPassphrase,
          });
        } catch (e) {
          throw new Error(`Error decrypting user keychain: ${e.message}`);
        }
      }

      let backupKeyAddress;
      let backupSigningKey;

      if (isKrsRecovery || isUnsignedSweep) {
        const backupHDNode = HDNode.fromBase58(backupKey);
        backupSigningKey = backupHDNode.getKey().getPublicKeyBuffer();
        backupKeyAddress = `0x${optionalDeps.ethUtil.publicToAddress(backupSigningKey, true).toString('hex')}`;
      } else {
        let backupPrv;

        try {
          backupPrv = self.bitgo.decrypt({
            input: backupKey,
            password: params.walletPassphrase,
          });
        } catch (e) {
          throw new Error(`Error decrypting backup keychain: ${e.message}`);
        }

        const backupHDNode = HDNode.fromBase58(backupPrv);
        backupSigningKey = backupHDNode.getKey().getPrivateKeyBuffer();
        backupKeyAddress = `0x${optionalDeps.ethUtil.privateToAddress(backupSigningKey).toString('hex')}`;
      }

      // Get nonce for backup key (should be 0)
      let backupKeyNonce = 0;

      const result = (yield self.recoveryBlockchainExplorerQuery({
        module: 'account',
        action: 'txlist',
        address: backupKeyAddress,
      })) as any;
      const backupKeyTxList = result.result;
      if (backupKeyTxList.length > 0) {
        // Calculate last nonce used
        const outgoingTxs = backupKeyTxList.filter((tx) => tx.from === backupKeyAddress);
        backupKeyNonce = outgoingTxs.length;
      }

      // get balance of backup key and make sure we can afford gas
      const backupKeyBalance = (yield self.queryAddressBalance(backupKeyAddress)) as any;

      if (backupKeyBalance.lt(gasPrice.mul(gasLimit))) {
        throw new Error(
          `Backup key address ${backupKeyAddress} has balance ${backupKeyBalance.toString(
            10
          )}. This address must have a balance of at least 0.01 ETH to perform recoveries`
        );
      }

      // get token balance of wallet
      const txAmount = (yield self.queryAddressTokenBalance(
        self.tokenContractAddress,
        params.walletContractAddress
      )) as any;

      // build recipients object
      const recipients = [
        {
          address: params.recoveryDestination,
          amount: txAmount.toString(10),
        },
      ];

      // Get sequence ID using contract call
      const sequenceId = (yield self.querySequenceId(params.walletContractAddress)) as any;

      let operationHash, signature;
      if (!isUnsignedSweep) {
        // Get operation hash and sign it
        operationHash = self.getOperationSha3ForExecuteAndConfirm(recipients, self.getDefaultExpireTime(), sequenceId);
        signature = Util.ethSignMsgHash(operationHash, Util.xprvToEthPrivateKey(userPrv));

        try {
          Util.ecRecoverEthAddress(operationHash, signature);
        } catch (e) {
          throw new Error('Invalid signature');
        }
      }

      const txInfo = {
        recipient: recipients[0],
        expireTime: self.getDefaultExpireTime(),
        contractSequenceId: sequenceId,
        signature: signature,
        gasLimit: gasLimit.toString(10),
        tokenContractAddress: self.tokenContractAddress,
      };

      // calculate send data
      const sendMethodArgs = self.getSendMethodArgs(txInfo);
      const methodSignature = optionalDeps.ethAbi.methodID('sendMultiSigToken', _.map(sendMethodArgs, 'type'));
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
        spendAmount: txAmount,
      });

      if (isUnsignedSweep) {
        return self.formatForOfflineVault(txInfo, tx, userKey, backupKey, gasPrice, gasLimit);
      }

      if (!isKrsRecovery) {
        tx.sign(backupSigningKey);
      }

      const signedTx: RecoveryInfo = {
        id: optionalDeps.ethUtil.bufferToHex(tx.hash(true)),
        tx: tx.serialize().toString('hex'),
      };

      if (isKrsRecovery) {
        signedTx.backupKey = backupKey;
        signedTx.coin = 'erc20';
      }

      return signedTx;
    })
      .call(this)
      .asCallback(callback);
  }

  getOperation(recipient, expireTime, contractSequenceId) {
    return [
      ['string', 'address', 'uint', 'address', 'uint', 'uint'],
      [
        'ERC20',
        new optionalDeps.ethUtil.BN(optionalDeps.ethUtil.stripHexPrefix(recipient.address), 16),
        recipient.amount,
        new optionalDeps.ethUtil.BN(optionalDeps.ethUtil.stripHexPrefix(this.tokenContractAddress), 16),
        expireTime,
        contractSequenceId,
      ],
    ];
  }

  getSendMethodArgs(txInfo) {
    // Method signature is
    // sendMultiSigToken(address toAddress, uint value, address tokenContractAddress, uint expireTime, uint sequenceId, bytes signature)
    return [
      {
        name: 'toAddress',
        type: 'address',
        value: txInfo.recipient.address,
      },
      {
        name: 'value',
        type: 'uint',
        value: txInfo.recipient.amount,
      },
      {
        name: 'tokenContractAddress',
        type: 'address',
        value: this.tokenContractAddress,
      },
      {
        name: 'expireTime',
        type: 'uint',
        value: txInfo.expireTime,
      },
      {
        name: 'sequenceId',
        type: 'uint',
        value: txInfo.contractSequenceId,
      },
      {
        name: 'signature',
        type: 'bytes',
        value: optionalDeps.ethUtil.toBuffer(txInfo.signature),
      },
    ];
  }
}
