/**
 * @prettier
 */
import { bip32 } from '@bitgo/utxo-lib';
import _ from 'lodash';
import request from 'superagent';
import {
  BaseCoin,
  BitGoBase,
  checkKrsProvider,
  common,
  FullySignedTransaction,
  getIsUnsignedSweep,
  getIsKrsRecovery,
  HalfSignedTransaction,
  MPCAlgorithm,
  Recipient,
  Util,
} from '@bitgo/sdk-core';
import {
  AbstractEthLikeNewCoins,
  BuildOptions,
  BuildTransactionParams,
  EIP1559,
  FeesUsed,
  GetBatchExecutionInfoRT,
  GetSendMethodArgsOptions,
  RecoveryInfo,
  RecoverOptions,
  ReplayProtectionOptions,
  SendMethodArgs,
  SignedTransaction,
  SignFinalOptions,
  SignTransactionOptions,
  TransactionPrebuild,
  OfflineVaultTxInfo,
  optionalDeps,
} from '@bitgo/abstract-eth';
import { BaseCoin as StaticsBaseCoin, coins } from '@bitgo/statics';
import type * as EthTxLib from '@ethereumjs/tx';
import { BigNumber } from 'bignumber.js';

import { TransactionBuilder } from './lib/transactionBuilder';
import { Erc20Token } from './erc20Token';

export {
  BuildTransactionParams,
  Recipient,
  HalfSignedTransaction,
  FeesUsed,
  FullySignedTransaction,
  GetBatchExecutionInfoRT,
  GetSendMethodArgsOptions,
  TransactionPrebuild,
  OfflineVaultTxInfo,
  optionalDeps,
  RecoverOptions,
  RecoveryInfo,
  SendMethodArgs,
  SignFinalOptions,
  SignedTransaction,
  SignTransactionOptions,
};

export class Eth extends AbstractEthLikeNewCoins {
  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Eth(bitgo, staticsCoin);
  }

  allowsAccountConsolidations(): boolean {
    return true;
  }

  /** @inheritDoc */
  supportsTss(): boolean {
    return true;
  }

  getMPCAlgorithm(): MPCAlgorithm {
    return 'ecdsa';
  }

  /**
   * Gets correct Eth Common object based on params from either recovery or tx building
   * @param eip1559 {EIP1559} configs that specify whether we should construct an eip1559 tx
   * @param replayProtectionOptions {ReplayProtectionOptions} check if chain id supports replay protection
   */
  private static getEthCommon(eip1559?: EIP1559, replayProtectionOptions?: ReplayProtectionOptions) {
    // if eip1559 params are specified, default to london hardfork, otherwise,
    // default to tangerine whistle to avoid replay protection issues
    const defaultHardfork = !!eip1559 ? 'london' : optionalDeps.EthCommon.Hardfork.TangerineWhistle;
    const defaultCommon = new optionalDeps.EthCommon.default({
      chain: optionalDeps.EthCommon.Chain.Mainnet,
      hardfork: defaultHardfork,
    });

    // if replay protection options are set, override the default common setting
    const ethCommon = replayProtectionOptions
      ? optionalDeps.EthCommon.default.isSupportedChainId(new optionalDeps.ethUtil.BN(replayProtectionOptions.chain))
        ? new optionalDeps.EthCommon.default({
            chain: replayProtectionOptions.chain,
            hardfork: replayProtectionOptions.hardfork,
          })
        : optionalDeps.EthCommon.default.custom({
            chainId: new optionalDeps.ethUtil.BN(replayProtectionOptions.chain),
            defaultHardfork: replayProtectionOptions.hardfork,
          })
      : defaultCommon;
    return ethCommon;
  }

  static buildTransaction(params: BuildTransactionParams): EthTxLib.FeeMarketEIP1559Transaction | EthTxLib.Transaction {
    // if eip1559 params are specified, default to london hardfork, otherwise,
    // default to tangerine whistle to avoid replay protection issues
    const ethCommon = Eth.getEthCommon(params.eip1559, params.replayProtectionOptions);

    const baseParams = {
      to: params.to,
      nonce: params.nonce,
      value: params.value,
      data: params.data,
      gasLimit: new optionalDeps.ethUtil.BN(params.gasLimit),
    };

    const unsignedEthTx = !!params.eip1559
      ? optionalDeps.EthTx.FeeMarketEIP1559Transaction.fromTxData(
          {
            ...baseParams,
            maxFeePerGas: new optionalDeps.ethUtil.BN(params.eip1559.maxFeePerGas),
            maxPriorityFeePerGas: new optionalDeps.ethUtil.BN(params.eip1559.maxPriorityFeePerGas),
          },
          { common: ethCommon }
        )
      : optionalDeps.EthTx.Transaction.fromTxData(
          {
            ...baseParams,
            gasPrice: new optionalDeps.ethUtil.BN(params.gasPrice),
          },
          { common: ethCommon }
        );

    return unsignedEthTx;
  }

  /**
   * Make a query to Etherscan for information such as balance, token balance, solidity calls
   * @param query {Object} key-value pairs of parameters to append after /api
   * @returns {Object} response from Etherscan
   */
  async recoveryBlockchainExplorerQuery(query: Record<string, string>): Promise<any> {
    const token = common.Environments[this.bitgo.getEnv()].etherscanApiToken;
    if (token) {
      query.apikey = token;
    }
    const response = await request.get(common.Environments[this.bitgo.getEnv()].etherscanBaseUrl + '/api').query(query);

    if (!response.ok) {
      throw new Error('could not reach Etherscan');
    }

    if (response.body.status === '0' && response.body.message === 'NOTOK') {
      throw new Error('Etherscan rate limit reached');
    }
    return response.body;
  }

  /**
   * Recovers a tx with non-TSS keys
   * same expected arguments as recover method (original logic before adding TSS recover path)
   */
  protected async recoverEthLike(params: RecoverOptions): Promise<RecoveryInfo | OfflineVaultTxInfo> {
    // bitgoFeeAddress is only defined when it is a evm cross chain recovery
    // as we use fee from this wrong chain address for the recovery txn on the correct chain.
    if (params.bitgoFeeAddress) {
      return this.recoverEthLikeforEvmBasedRecovery(params);
    }

    this.validateRecoveryParams(params);
    const isKrsRecovery = getIsKrsRecovery(params);
    const isUnsignedSweep = getIsUnsignedSweep(params);

    if (isKrsRecovery) {
      checkKrsProvider(this, params.krsProvider, { checkCoinFamilySupport: false });
    }

    // Clean up whitespace from entered values
    let userKey = params.userKey.replace(/\s/g, '');
    const backupKey = params.backupKey.replace(/\s/g, '');

    // Set new eth tx fees (using default config values from platform)

    const gasLimit = new optionalDeps.ethUtil.BN(this.setGasLimit(params.gasLimit));
    const gasPrice = params.eip1559
      ? new optionalDeps.ethUtil.BN(params.eip1559.maxFeePerGas)
      : new optionalDeps.ethUtil.BN(this.setGasPrice(params.gasPrice));
    if (!userKey.startsWith('xpub') && !userKey.startsWith('xprv')) {
      try {
        userKey = this.bitgo.decrypt({
          input: userKey,
          password: params.walletPassphrase,
        });
      } catch (e) {
        throw new Error(`Error decrypting user keychain: ${e.message}`);
      }
    }

    let backupKeyAddress: string;
    let backupSigningKey;

    if (isKrsRecovery || isUnsignedSweep) {
      const backupHDNode = bip32.fromBase58(backupKey);
      backupSigningKey = backupHDNode.publicKey;
      backupKeyAddress = `0x${optionalDeps.ethUtil.publicToAddress(backupSigningKey, true).toString('hex')}`;
    } else {
      // Decrypt backup private key and get address
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
      if (!backupHDNode) {
        throw new Error('no private key');
      }
      backupKeyAddress = `0x${optionalDeps.ethUtil.privateToAddress(backupSigningKey).toString('hex')}`;
    }

    const backupKeyNonce = await this.getAddressNonce(backupKeyAddress);

    // get balance of backupKey to ensure funds are available to pay fees
    const backupKeyBalance = await this.queryAddressBalance(backupKeyAddress);

    const totalGasNeeded = gasPrice.mul(gasLimit);
    const weiToGwei = 10 ** 9;
    if (backupKeyBalance.lt(totalGasNeeded)) {
      throw new Error(
        `Backup key address ${backupKeyAddress} has balance ${(backupKeyBalance / weiToGwei).toString()} Gwei.` +
          `This address must have a balance of at least ${(totalGasNeeded / weiToGwei).toString()}` +
          ` Gwei to perform recoveries. Try sending some ETH to this address then retry.`
      );
    }

    // get balance of wallet and deduct fees to get transaction amount
    const txAmount = await this.queryAddressBalance(params.walletContractAddress);
    if (new BigNumber(txAmount).isLessThanOrEqualTo(0)) {
      throw new Error('Wallet does not have enough funds to recover');
    }

    // build recipients object
    const recipients = [
      {
        address: params.recoveryDestination,
        amount: txAmount.toString(10),
      },
    ];

    // Get sequence ID using contract call
    // we need to wait between making two etherscan calls to avoid getting banned
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const sequenceId = await this.querySequenceId(params.walletContractAddress);

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
      gasLimit: gasLimit.toString(10),
    };

    // calculate send data
    const sendMethodArgs = this.getSendMethodArgs(txInfo);
    const methodSignature = optionalDeps.ethAbi.methodID(this.sendMethodName, _.map(sendMethodArgs, 'type'));
    const encodedArgs = optionalDeps.ethAbi.rawEncode(_.map(sendMethodArgs, 'type'), _.map(sendMethodArgs, 'value'));
    const sendData = Buffer.concat([methodSignature, encodedArgs]);

    const txParams = {
      to: params.walletContractAddress,
      nonce: backupKeyNonce,
      value: 0,
      gasPrice: gasPrice,
      gasLimit: gasLimit,
      data: sendData,
      eip1559: params.eip1559,
      replayProtectionOptions: params.replayProtectionOptions,
    };

    // Build contract call and sign it
    let tx = Eth.buildTransaction(txParams);

    if (isUnsignedSweep) {
      return this.formatForOfflineVault(
        txInfo,
        tx,
        userKey,
        backupKey,
        gasPrice,
        gasLimit,
        params.eip1559,
        params.replayProtectionOptions
      );
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
      signedTx.coin = this.getChain();
    }

    return signedTx;
  }

  /**
   * Return boolean indicating whether input is valid public key for the coin.
   *
   * @param {String} pub the pub to be checked
   * @returns {Boolean} is it valid?
   */
  isValidPub(pub: string): boolean {
    try {
      return bip32.fromBase58(pub).isNeutered();
    } catch (e) {
      return false;
    }
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
  signFinal(params: SignFinalOptions): FullySignedTransaction {
    const txPrebuild = params.txPrebuild;

    if (!_.isNumber(params.signingKeyNonce) && !_.isNumber(params.txPrebuild.halfSigned?.backupKeyNonce)) {
      throw new Error(
        'must have at least one of signingKeyNonce and backupKeyNonce as a parameter, and it must be a number'
      );
    }
    if (_.isUndefined(params.walletContractAddress)) {
      throw new Error('params must include walletContractAddress, but got undefined');
    }

    const signingNode = bip32.fromBase58(params.prv);
    const signingKey = signingNode.privateKey;
    if (_.isUndefined(signingKey)) {
      throw new Error('missing private key');
    }

    let recipient: Recipient;
    let txInfo;
    if (txPrebuild.recipients) {
      recipient = txPrebuild.recipients[0];
      txInfo = {
        recipient,
        expireTime: txPrebuild.halfSigned?.expireTime as number,
        contractSequenceId: txPrebuild.halfSigned?.contractSequenceId as number,
        signature: txPrebuild.halfSigned?.signature as string,
      };
    }

    const sendMethodArgs = this.getSendMethodArgs(txInfo);
    const methodSignature = optionalDeps.ethAbi.methodID(this.sendMethodName, _.map(sendMethodArgs, 'type'));
    const encodedArgs = optionalDeps.ethAbi.rawEncode(_.map(sendMethodArgs, 'type'), _.map(sendMethodArgs, 'value'));
    const sendData = Buffer.concat([methodSignature, encodedArgs]);

    const ethTxParams = {
      to: params.walletContractAddress,
      nonce:
        params.signingKeyNonce !== undefined ? params.signingKeyNonce : params.txPrebuild.halfSigned?.backupKeyNonce,
      value: 0,
      gasPrice: new optionalDeps.ethUtil.BN(txPrebuild.gasPrice),
      gasLimit: new optionalDeps.ethUtil.BN(txPrebuild.gasLimit),
      data: sendData,
    };

    const unsignedEthTx = Eth.buildTransaction({
      ...ethTxParams,
      eip1559: params.txPrebuild.eip1559,
      replayProtectionOptions: params.txPrebuild.replayProtectionOptions,
    });

    const ethTx = unsignedEthTx.sign(signingKey);

    return { txHex: ethTx.serialize().toString('hex') };
  }

  /**
   * Assemble keychain and half-sign prebuilt transaction
   * @param params
   * - txPrebuild
   * - prv
   * @returns {Promise<SignedTransaction>}
   */
  async signTransaction(params: SignTransactionOptions): Promise<SignedTransaction> {
    if (params.isEvmBasedCrossChainRecovery) {
      return super.signTransaction(params);
    }
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

    if (params.recipients.length == 0) {
      throw new Error('recipients empty');
    }

    // Normally the SDK provides the first signature for an ETH tx, but occasionally it provides the second and final one.
    if (params.isLastSignature) {
      // In this case when we're doing the second (final) signature, the logic is different.
      return this.signFinal(params);
    }

    const secondsSinceEpoch = Math.floor(new Date().getTime() / 1000);
    const expireTime = params.expireTime || secondsSinceEpoch + EXPIRETIME_DEFAULT;
    const sequenceId = txPrebuild.nextContractSequenceId;

    if (_.isUndefined(sequenceId)) {
      throw new Error('transaction prebuild missing required property nextContractSequenceId');
    }

    const operationHash = this.getOperationSha3ForExecuteAndConfirm(params.recipients, expireTime, sequenceId);
    const signature = Util.ethSignMsgHash(operationHash, Util.xprvToEthPrivateKey(userPrv));

    const txParams = {
      eip1559: params.txPrebuild.eip1559,
      isBatch: params.txPrebuild.isBatch,
      recipients: params.recipients,
      expireTime: expireTime,
      contractSequenceId: sequenceId,
      sequenceId: params.sequenceId,
      operationHash: operationHash,
      signature: signature,
      gasLimit: params.gasLimit,
      gasPrice: params.gasPrice,
      hopTransaction: txPrebuild.hopTransaction,
      backupKeyNonce: txPrebuild.backupKeyNonce,
      custodianTransactionId: params.custodianTransactionId,
    };
    return { halfSigned: txParams };
  }

  /**
   * Modify prebuild before sending it to the server. Add things like hop transaction params
   * @param buildParams The whitelisted parameters for this prebuild
   * @param buildParams.hop True if this should prebuild a hop tx, else false
   * @param buildParams.recipients The recipients array of this transaction
   * @param buildParams.wallet The wallet sending this tx
   * @param buildParams.walletPassphrase the passphrase for this wallet
   */
  async getExtraPrebuildParams(buildParams: BuildOptions): Promise<BuildOptions> {
    if (
      !_.isUndefined(buildParams.hop) &&
      buildParams.hop &&
      !_.isUndefined(buildParams.wallet) &&
      !_.isUndefined(buildParams.recipients) &&
      !_.isUndefined(buildParams.walletPassphrase)
    ) {
      if (this instanceof Erc20Token) {
        throw new Error(
          `Hop transactions are not enabled for ERC-20 tokens, nor are they necessary. Please remove the 'hop' parameter and try again.`
        );
      }
      return (await this.createHopTransactionParams({
        wallet: buildParams.wallet,
        recipients: buildParams.recipients,
        walletPassphrase: buildParams.walletPassphrase,
      })) as any;
    }
    return {};
  }

  /**
   * Create a new transaction builder for the current chain
   * @return a new transaction builder
   */
  protected getTransactionBuilder(): TransactionBuilder {
    return new TransactionBuilder(coins.get(this.getBaseChain()));
  }

  /** @inheritDoc */
  supportsMessageSigning(): boolean {
    return true;
  }

  /** @inheritDoc */
  supportsSigningTypedData(): boolean {
    return true;
  }
}
