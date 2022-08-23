/**
 * @prettier
 */
import {
  BitGoBase,
  CoinConstructor,
  Util,
  checkKrsProvider,
  getIsKrsRecovery,
  getIsUnsignedSweep,
  NamedCoinConstructor,
} from '@bitgo/sdk-core';
import { Erc20TokenConfig, tokens } from '@bitgo/statics';
import { bip32 } from '@bitgo/utxo-lib';
import * as _ from 'lodash';

import { Eth, RecoverOptions, RecoveryInfo, optionalDeps, TransactionPrebuild } from './eth';
export { Erc20TokenConfig };
export class Erc20Token extends Eth {
  public readonly tokenConfig: Erc20TokenConfig;
  protected readonly sendMethodName: 'sendMultiSig' | 'sendMultiSigToken';

  constructor(bitgo: BitGoBase, tokenConfig: Erc20TokenConfig) {
    super(bitgo);
    this.tokenConfig = tokenConfig;
    this.sendMethodName = 'sendMultiSigToken';
  }

  static createTokenConstructor(config: Erc20TokenConfig): CoinConstructor {
    return (bitgo: BitGoBase) => new Erc20Token(bitgo, config);
  }

  static createTokenConstructors(): NamedCoinConstructor[] {
    const tokensCtors: NamedCoinConstructor[] = [];
    for (const token of [...tokens.bitcoin.eth.tokens, ...tokens.testnet.eth.tokens]) {
      const tokenConstructor = Erc20Token.createTokenConstructor(token);
      tokensCtors.push({ name: token.type, coinConstructor: tokenConstructor });
      tokensCtors.push({ name: token.tokenContractAddress, coinConstructor: tokenConstructor });
    }
    return tokensCtors;
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
   */
  async recover(params: RecoverOptions): Promise<RecoveryInfo> {
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

    const isKrsRecovery = getIsKrsRecovery(params);
    const isUnsignedSweep = getIsUnsignedSweep(params);

    if (isKrsRecovery) {
      checkKrsProvider(this, params.krsProvider, { checkCoinFamilySupport: false });
    }

    // Clean up whitespace from entered values
    const userKey = params.userKey.replace(/\s/g, '');
    const backupKey = params.backupKey.replace(/\s/g, '');

    // Set new eth tx fees (using default config values from platform)
    const gasPrice = this.getRecoveryGasPrice();
    const gasLimit = this.getRecoveryGasLimit();

    // Decrypt private keys from KeyCard values
    let userPrv;
    if (!userKey.startsWith('xpub') && !userKey.startsWith('xprv')) {
      try {
        userPrv = this.bitgo.decrypt({
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
      const backupHDNode = bip32.fromBase58(backupKey);
      backupSigningKey = backupHDNode.publicKey;
      backupKeyAddress = `0x${optionalDeps.ethUtil.publicToAddress(backupSigningKey, true).toString('hex')}`;
    } else {
      let backupPrv;

      try {
        backupPrv = this.bitgo.decrypt({
          input: backupKey,
          password: params.walletPassphrase,
        });
      } catch (e) {
        throw new Error(`Error decrypting backup keychain: ${e.message}`);
      }

      const backupHDNode = bip32.fromBase58(backupPrv);
      backupSigningKey = backupHDNode.privateKey;
      backupKeyAddress = `0x${optionalDeps.ethUtil.privateToAddress(backupSigningKey).toString('hex')}`;
    }

    // Get nonce for backup key (should be 0)
    let backupKeyNonce = 0;

    const result = await this.recoveryBlockchainExplorerQuery({
      module: 'account',
      action: 'txlist',
      address: backupKeyAddress,
    });
    const backupKeyTxList = result.result;
    if (backupKeyTxList.length > 0) {
      // Calculate last nonce used
      const outgoingTxs = backupKeyTxList.filter((tx) => tx.from === backupKeyAddress);
      backupKeyNonce = outgoingTxs.length;
    }

    // get balance of backup key and make sure we can afford gas
    const backupKeyBalance = await this.queryAddressBalance(backupKeyAddress);

    if (backupKeyBalance.lt(gasPrice.mul(gasLimit))) {
      throw new Error(
        `Backup key address ${backupKeyAddress} has balance ${backupKeyBalance.toString(
          10
        )}. This address must have a balance of at least 0.01 ETH to perform recoveries`
      );
    }

    // get token balance of wallet
    const txAmount = await this.queryAddressTokenBalance(this.tokenContractAddress, params.walletContractAddress);

    // build recipients object
    const recipients = [
      {
        address: params.recoveryDestination,
        amount: txAmount.toString(10),
      },
    ];

    // Get sequence ID using contract call
    const sequenceId = await this.querySequenceId(params.walletContractAddress);

    let operationHash, signature;
    if (!isUnsignedSweep) {
      // Get operation hash and sign it
      operationHash = this.getOperationSha3ForExecuteAndConfirm(recipients, this.getDefaultExpireTime(), sequenceId);
      signature = Util.ethSignMsgHash(operationHash, Util.xprvToEthPrivateKey(userPrv));

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
      signature: signature,
      gasLimit: gasLimit.toString(10),
      tokenContractAddress: this.tokenContractAddress,
    };

    // calculate send data
    const sendMethodArgs = this.getSendMethodArgs(txInfo);
    const methodSignature = optionalDeps.ethAbi.methodID(this.sendMethodName, _.map(sendMethodArgs, 'type'));
    const encodedArgs = optionalDeps.ethAbi.rawEncode(_.map(sendMethodArgs, 'type'), _.map(sendMethodArgs, 'value'));
    const sendData = Buffer.concat([methodSignature, encodedArgs]);

    let tx = Eth.buildTransaction({
      to: params.walletContractAddress,
      nonce: backupKeyNonce,
      value: 0,
      gasPrice: gasPrice,
      gasLimit: gasLimit,
      data: sendData,
      eip1559: params.eip1559,
      replayProtectionOptions: params.replayProtectionOptions,
    });

    if (isUnsignedSweep) {
      return this.formatForOfflineVault(txInfo, tx, userKey, backupKey, gasPrice, gasLimit) as any;
    }

    if (!isKrsRecovery) {
      tx = tx.sign(backupSigningKey);
    }

    const signedTx: RecoveryInfo = {
      id: optionalDeps.ethUtil.bufferToHex(tx.hash()),
      tx: tx.serialize().toString('hex'),
    };

    if (isKrsRecovery) {
      signedTx.backupKey = backupKey;
      signedTx.coin = 'erc20';
    }

    return signedTx;
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
        value: optionalDeps.ethUtil.toBuffer(optionalDeps.ethUtil.addHexPrefix(txInfo.signature)),
      },
    ];
  }

  verifyCoin(txPrebuild: TransactionPrebuild): boolean {
    return txPrebuild.coin === this.tokenConfig.coin && txPrebuild.token === this.tokenConfig.type;
  }
}
