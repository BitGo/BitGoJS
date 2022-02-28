/**
 * @prettier
 */
import { bip32 } from '@bitgo/utxo-lib';
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
} from '@bitgo/sdk-coin-eth';
import { BaseCoin, BitGoBase, TransactionExplanation, FullySignedTransaction } from '@bitgo/sdk-core';
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
  protected getTransactionBuilder(): TransactionBuilder {
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
   * @param params.signingKeyNonce
   * @param params.walletContractAddress
   * @param params.prv
   * @returns {{txHex: *}}
   */
  signFinal(params: SignFinalOptions): FullySignedTransaction {
    const txPrebuild = params.txPrebuild;

    if (!_.isNumber(params.signingKeyNonce) && !_.isNumber(params.txPrebuild.halfSigned.backupKeyNonce)) {
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

    const txInfo = {
      recipient: txPrebuild.recipients[0],
      expireTime: txPrebuild.halfSigned.expireTime,
      contractSequenceId: txPrebuild.halfSigned.contractSequenceId,
      signature: txPrebuild.halfSigned.signature,
    };

    const sendMethodArgs = this.getSendMethodArgs(txInfo);
    const methodSignature = optionalDeps.ethAbi.methodID(this.sendMethodName, _.map(sendMethodArgs, 'type'));
    const encodedArgs = optionalDeps.ethAbi.rawEncode(_.map(sendMethodArgs, 'type'), _.map(sendMethodArgs, 'value'));
    const sendData = Buffer.concat([methodSignature, encodedArgs]);

    const ethTxParams = {
      to: params.walletContractAddress,
      nonce:
        params.signingKeyNonce !== undefined ? params.signingKeyNonce : params.txPrebuild.halfSigned.backupKeyNonce,
      value: 0,
      gasPrice: new optionalDeps.ethUtil.BN(txPrebuild.gasPrice),
      gasLimit: new optionalDeps.ethUtil.BN(txPrebuild.gasLimit),
      data: sendData,
    };

    const unsignedEthTx = Polygon.buildTransaction({
      ...ethTxParams,
      eip1559: params.txPrebuild.eip1559,
      replayProtectionOptions: params.txPrebuild.replayProtectionOptions,
    });

    const ethTx = unsignedEthTx.sign(signingKey);

    return { txHex: ethTx.serialize().toString('hex') };
  }

  /**
   * Assemble half-sign prebuilt transaction
   * @param params
   */
  async signTransaction(params: SignTransactionOptions): Promise<SignedTransaction> {
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
}
