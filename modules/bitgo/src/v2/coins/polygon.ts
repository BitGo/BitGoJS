/**
 * @prettier
 */
import { BaseCoin, BitGoBase, TransactionExplanation } from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin, EthereumNetwork } from '@bitgo/statics';
import { Eth, Recipient, GetSendMethodArgsOptions, SendMethodArgs, optionalDeps } from './eth';
import { getBuilder, Polygon as PolygonAccountLib } from '@bitgo/account-lib';
import BigNumber from 'bignumber.js';
import { ExplainTransactionOptions } from './abstractEthLikeCoin';

export class Polygon extends Eth {
  protected constructor(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) {
    super(bitgo, staticsCoin);
  }

  static createInstance(bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>): BaseCoin {
    return new Polygon(bitgo, staticsCoin);
  }

  getChain(): string {
    return 'polygon';
  }

  getNetwork(): EthereumNetwork | undefined {
    return this.staticsCoin?.network as EthereumNetwork;
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
      new PolygonAccountLib.KeyPair({ pub });
    } catch (e) {
      valid = false;
    }
    return valid;
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
        Buffer.from(optionalDeps.ethUtil.stripHexPrefix(recipient.data) || '', 'hex'),
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
   * Explain a transaction from txHex
   * @param params The options with which to explain the transaction
   */
  async explainTransaction(params: ExplainTransactionOptions): Promise<TransactionExplanation> {
    const txHex = params.txHex || (params.halfSigned && params.halfSigned.txHex);
    if (!txHex || !params.feeInfo) {
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
      fee: params.feeInfo,
    };
  }

  /**
   * Create a new transaction builder for the current chain
   * @return a new transaction builder
   */
  protected getTransactionBuilder(): PolygonAccountLib.TransactionBuilder {
    return getBuilder(this.getBaseChain()) as PolygonAccountLib.TransactionBuilder;
  }
}
