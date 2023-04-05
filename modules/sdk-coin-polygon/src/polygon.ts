/**
 * @prettier
 */
import { bip32 } from '@bitgo/utxo-lib';
import request from 'superagent';
import { ExplainTransactionOptions } from '@bitgo/abstract-eth';
import {
  Eth,
  Recipient,
  GetSendMethodArgsOptions,
  SendMethodArgs,
  optionalDeps,
  BuildTransactionParams,
  SignFinalOptions,
  SignTransactionOptions,
  SignedTransaction,
  RecoverOptions,
  RecoveryInfo,
  OfflineVaultTxInfo,
} from '@bitgo/sdk-coin-eth';
import {
  BaseCoin,
  BitGoBase,
  common,
  TransactionExplanation,
  FullySignedTransaction,
  getIsUnsignedSweep,
  Util,
  MPCAlgorithm,
} from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, coins } from '@bitgo/statics';
import BigNumber from 'bignumber.js';
import { KeyPair, TransactionBuilder } from './lib';
import _ from 'lodash';
import type * as EthTxLib from '@ethereumjs/tx';

export class Polygon extends Eth {
  protected readonly _staticsCoin: Readonly<StaticsBaseCoin>;
  protected readonly sendMethodName: 'sendMultiSig' | 'sendMultiSigToken';

  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);

    if (!staticsCoin) {
      throw new Error('missing required constructor parameter staticsCoin');
    }

    this._staticsCoin = staticsCoin;
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Polygon(bitgo, staticsCoin);
  }
  static getCustomChainName(chainId?: number): string {
    if (chainId === 80001) {
      return 'PolygonMumbai';
    }
    return 'PolygonMainnet';
  }

  static buildTransaction(params: BuildTransactionParams): EthTxLib.FeeMarketEIP1559Transaction | EthTxLib.Transaction {
    // if eip1559 params are specified, default to london hardfork, otherwise,
    // default to tangerine whistle to avoid replay protection issues
    const defaultHardfork = !!params.eip1559 ? 'london' : optionalDeps.EthCommon.Hardfork.TangerineWhistle;
    let customChainCommon;
    // if replay protection options are set, override the default common setting
    if (params.replayProtectionOptions) {
      const customChainName = Polygon.getCustomChainName(params.replayProtectionOptions.chain as number);
      const customChain = optionalDeps.EthCommon.CustomChain[customChainName];
      customChainCommon = optionalDeps.EthCommon.default.custom(customChain);
      customChainCommon.setHardfork(params.replayProtectionOptions.hardfork);
    } else {
      const customChain = optionalDeps.EthCommon.CustomChain[Polygon.getCustomChainName()];
      customChainCommon = optionalDeps.EthCommon.default.custom(customChain);
      customChainCommon.setHardfork(defaultHardfork);
    }

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
          { common: customChainCommon }
        )
      : optionalDeps.EthTx.Transaction.fromTxData(
          {
            ...baseParams,
            gasPrice: new optionalDeps.ethUtil.BN(params.gasPrice),
          },
          { common: customChainCommon }
        );

    return unsignedEthTx;
  }

  getChain(): string {
    return 'polygon';
  }

  getFamily(): string {
    return 'polygon';
  }

  getFullName(): string {
    return 'Polygon';
  }

  /**
   * Get the base chain that the coin exists on.
   */
  getBaseChain(): string {
    return this.getChain();
  }

  isValidPub(pub: string): boolean {
    let valid = true;
    try {
      new KeyPair({ pub });
    } catch (e) {
      valid = false;
    }
    return valid;
  }

  /** @inheritDoc */
  async explainTransaction(options: ExplainTransactionOptions): Promise<TransactionExplanation> {
    const txHex = options.txHex || (options.halfSigned && options.halfSigned.txHex);
    if (!txHex || !options.feeInfo) {
      throw new Error('missing explain tx parameters');
    }
    const txBuilder = this.getTransactionBuilder();
    txBuilder.from(txHex);
    const tx = await txBuilder.build();
    const outputs = tx.outputs.map((output) => {
      return {
        address: output.address,
        amount: output.value,
      };
    });

    const displayOrder = ['id', 'outputAmount', 'changeAmount', 'outputs', 'changeOutputs', 'fee'];

    return {
      displayOrder,
      id: tx.id,
      outputs: outputs,
      outputAmount: outputs
        .reduce((accumulator, output) => accumulator.plus(output.amount), new BigNumber('0'))
        .toFixed(0),
      changeOutputs: [], // account based does not use change outputs
      changeAmount: '0', // account base does not make change
      fee: options.feeInfo,
    };
  }

  /**
   * Create a new transaction builder for the current chain
   * @return a new transaction builder
   */
  public getTransactionBuilder(): TransactionBuilder {
    return new TransactionBuilder(coins.get(this.getBaseChain()));
  }

  /**
   * Get transfer operation for coin
   * @param recipient recipient info
   * @param expireTime expiry time
   * @param contractSequenceId sequence id
   * @returns {Array} operation array
   */
  getOperation(recipient: Recipient, expireTime: number, contractSequenceId: number): (string | Buffer)[][] {
    return [
      ['string', 'address', 'uint256', 'bytes', 'uint256', 'uint256'],
      [
        'POLYGON',
        new optionalDeps.ethUtil.BN(optionalDeps.ethUtil.stripHexPrefix(recipient.address), 16),
        recipient.amount,
        Buffer.from(optionalDeps.ethUtil.stripHexPrefix(optionalDeps.ethUtil.padToEven(recipient.data || '')), 'hex'),
        expireTime,
        contractSequenceId,
      ],
    ];
  }

  /**
   * Build arguments to call the send method on the wallet contract
   * @param txInfo
   */
  getSendMethodArgs(txInfo: GetSendMethodArgsOptions): SendMethodArgs[] {
    // Method signature is
    // sendMultiSig(address toAddress, uint256 value, bytes data, uint256 expireTime, uint256 sequenceId, bytes signature)
    return [
      {
        name: 'toAddress',
        type: 'address',
        value: txInfo.recipient.address,
      },
      {
        name: 'value',
        type: 'uint256',
        value: txInfo.recipient.amount,
      },
      {
        name: 'data',
        type: 'bytes',
        value: optionalDeps.ethUtil.toBuffer(optionalDeps.ethUtil.addHexPrefix(txInfo.recipient.data || '')),
      },
      {
        name: 'expireTime',
        type: 'uint256',
        value: txInfo.expireTime,
      },
      {
        name: 'sequenceId',
        type: 'uint256',
        value: txInfo.contractSequenceId,
      },
      {
        name: 'signature',
        type: 'bytes',
        value: optionalDeps.ethUtil.toBuffer(optionalDeps.ethUtil.addHexPrefix(txInfo.signature)),
      },
    ];
  }

  /**
   * Helper function for signTransaction for the rare case that SDK is doing the second signature
   * Note: we are expecting this to be called from the offline vault
   * @param params.txPrebuild
   * @param params.prv
   * @returns {{txHex: string}}
   */
  async signFinalPolygon(params: SignFinalOptions): Promise<FullySignedTransaction> {
    const signingKey = new KeyPair({ prv: params.prv }).getKeys().prv;
    if (_.isUndefined(signingKey)) {
      throw new Error('missing private key');
    }
    const txBuilder = this.getTransactionBuilder();
    try {
      txBuilder.from(params.txPrebuild.halfSigned.txHex);
    } catch (e) {
      throw new Error('invalid half-signed transaction');
    }
    txBuilder.sign({ key: signingKey });
    const tx = await txBuilder.build();
    return {
      txHex: tx.toBroadcastFormat(),
    };
  }

  /**
   * Assemble half-sign prebuilt transaction
   * @param params
   */
  async signTransaction(params: SignTransactionOptions): Promise<SignedTransaction> {
    // Normally the SDK provides the first signature for an POLYGON tx, but occasionally it provides the second and final one.
    if (params.isLastSignature) {
      // In this case when we're doing the second (final) signature, the logic is different.
      return await this.signFinalPolygon(params);
    }
    const txBuilder = this.getTransactionBuilder();
    txBuilder.from(params.txPrebuild.txHex);
    txBuilder.transfer().key(new KeyPair({ prv: params.prv }).getKeys().prv!);
    const transaction = await txBuilder.build();

    const recipients = transaction.outputs.map((output) => ({ address: output.address, amount: output.value }));

    const txParams = {
      eip1559: params.txPrebuild.eip1559,
      txHex: transaction.toBroadcastFormat(),
      recipients: recipients,
      expiration: params.txPrebuild.expireTime,
      hopTransaction: params.txPrebuild.hopTransaction,
      custodianTransactionId: params.custodianTransactionId,
      expireTime: params.expireTime,
      contractSequenceId: params.txPrebuild.nextContractSequenceId as number,
      sequenceId: params.sequenceId,
    };

    return { halfSigned: txParams };
  }

  /**
   * Make a query to Polygonscan for information such as balance, token balance, solidity calls
   * @param {Object} query key-value pairs of parameters to append after /api
   * @returns {Promise<Object>} response from Polygonscan
   */
  async recoveryBlockchainExplorerQuery(query: Record<string, string>): Promise<any> {
    const token = common.Environments[this.bitgo.getEnv()].polygonscanApiToken;
    if (token) {
      query.apikey = token;
    }
    const response = await request
      .get(common.Environments[this.bitgo.getEnv()].polygonscanBaseUrl + '/api')
      .query(query);

    if (!response.ok) {
      throw new Error('could not reach Polygonscan');
    }

    if (response.body.status === '0' && response.body.message === 'NOTOK') {
      throw new Error('Polygonscan rate limit reached');
    }
    return response.body;
  }

  /**
   * Builds a funds recovery transaction without BitGo for non-TSS transaction
   * @param params
   * @param {String} params.userKey [encrypted] xprv or xpub
   * @param {String} params.backupKey [encrypted] xprv or xpub if the xprv is held by a KRS provider
   * @param {String} params.walletPassphrase used to decrypt userKey and backupKey
   * @param {String} params.walletContractAddress the Polygon address of the wallet contract
   * @param {String} params.krsProvider necessary if backup key is held by KRS
   * @param {String} params.recoveryDestination target address to send recovered funds to
   * @param {String} params.bitgoFeeAddress wrong chain wallet fee address for evm based cross chain recovery txn
   * @param {String} params.bitgoDestinationAddress target bitgo address where fee will be sent for evm based cross chain recovery txn
   * @returns {Promise<RecoveryInfo | OfflineVaultTxInfo>}
   */
  async recoverEthLike(params: RecoverOptions): Promise<RecoveryInfo | OfflineVaultTxInfo> {
    // bitgoFeeAddress is only defined when it is a evm cross chain recovery
    // as we use fee from this wrong chain address for the recovery txn on the correct chain.
    if (params.bitgoFeeAddress) {
      return this.recoverEthLikeforEvmBasedRecovery(params);
    }

    this.validateRecoveryParams(params);
    const isUnsignedSweep = getIsUnsignedSweep(params);

    // Clean up whitespace from entered values
    let userKey = params.userKey.replace(/\s/g, '');
    const backupKey = params.backupKey.replace(/\s/g, '');
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
    let backupKeyAddress;
    let backupSigningKey;
    if (isUnsignedSweep) {
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

      const keyPair = new KeyPair({ prv: backupPrv });
      backupSigningKey = keyPair.getKeys().prv;
      if (!backupSigningKey) {
        throw new Error('no private key');
      }
      backupKeyAddress = keyPair.getAddress();
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
          ` Gwei to perform recoveries. Try sending some MATIC to this address then retry.`
      );
    }

    // get balance of wallet
    const txAmount = await this.queryAddressBalance(params.walletContractAddress);

    // build recipients object
    const recipients = [
      {
        address: params.recoveryDestination,
        amount: txAmount.toString(10),
      },
    ];

    // Get sequence ID using contract call
    // we need to wait between making two polygonscan calls to avoid getting banned
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

    const txBuilder = this.getTransactionBuilder() as TransactionBuilder;
    txBuilder.counter(backupKeyNonce);
    txBuilder.contract(params.walletContractAddress);
    let txFee;
    if (params.eip1559) {
      txFee = {
        eip1559: {
          maxPriorityFeePerGas: params.eip1559.maxPriorityFeePerGas,
          maxFeePerGas: params.eip1559.maxFeePerGas,
        },
      };
    } else {
      txFee = { fee: gasPrice.toString() };
    }
    txBuilder.fee({
      ...txFee,
      gasLimit: gasLimit.toString(),
    });
    txBuilder
      .transfer()
      .amount(recipients[0].amount)
      .contractSequenceId(sequenceId)
      .expirationTime(this.getDefaultExpireTime())
      .to(params.recoveryDestination);

    const tx = await txBuilder.build();
    if (isUnsignedSweep) {
      const response: OfflineVaultTxInfo = {
        txHex: tx.toBroadcastFormat(),
        userKey,
        backupKey,
        coin: this.getChain(),
        gasPrice: optionalDeps.ethUtil.bufferToInt(gasPrice).toFixed(),
        gasLimit,
        recipients: [txInfo.recipient],
        walletContractAddress: tx.toJson().to,
        amount: txInfo.recipient.amount,
        backupKeyNonce,
        eip1559: params.eip1559,
      };
      _.extend(response, txInfo);
      response.nextContractSequenceId = response.contractSequenceId;
      return response;
    }

    txBuilder.transfer().key(new KeyPair({ prv: userKey }).getKeys().prv as string);
    txBuilder.sign({ key: backupSigningKey });

    const signedTx = await txBuilder.build();

    return {
      id: signedTx.toJson().id,
      tx: signedTx.toBroadcastFormat(),
    };
  }

  /** @inheritDoc */
  supportsTss(): boolean {
    return true;
  }

  /** @inheritDoc */
  supportsMessageSigning(): boolean {
    return true;
  }

  /** @inheritDoc */
  getMPCAlgorithm(): MPCAlgorithm {
    return 'ecdsa';
  }
}
