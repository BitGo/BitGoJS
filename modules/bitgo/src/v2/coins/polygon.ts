/**
 * @prettier
 */
import { BaseCoin, BitGoBase, TransactionExplanation } from '@bitgo/sdk-core';
import { BaseCoin as StaticsBaseCoin } from '@bitgo/statics';
import { Eth } from './eth';
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
  protected getTransactionBuilder(): PolygonAccountLib.TransactionBuilder {
    return getBuilder(this.getBaseChain()) as PolygonAccountLib.TransactionBuilder;
  }
}
