import { AtomicTransactionBuilder } from './atomicTransactionBuilder';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import utils from './utils';
import { BN, Buffer as BufferAvax } from 'avalanche';
import { BuildTransactionError } from '@bitgo/sdk-core';
import { Transaction } from './transaction';
import { Tx as EVMTx } from 'avalanche/dist/apis/evm/tx';

export abstract class AtomicInCTransactionBuilder extends AtomicTransactionBuilder {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    // external chain id is P
    this._externalChainId = utils.cb58Decode(this.transaction._network.blockchainID);
    // chain id is C
    this.transaction._blockchainID = utils.cb58Decode(this.transaction._network.cChainBlockchainID);
  }

  /**
   * C-Chain base fee with decimal places converted form 18 to 9.
   *
   * @param {string | number} baseFee
   */
  feeRate(baseFee: string | number): this {
    const bnValue = new BN(baseFee);
    this.validateFee(bnValue);
    this.transaction._fee.feeRate = bnValue.toNumber();
    return this;
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction {
    const tx = new EVMTx();
    tx.fromBuffer(BufferAvax.from(rawTransaction, 'hex'));
    this.initBuilder(tx);
    return this.transaction;
  }

  /**
   * Check that fee is grater than 0.
   * @param {BN} fee
   */
  validateFee(fee: BN): void {
    if (fee.lten(0)) {
      throw new BuildTransactionError('Fee must be greater than 0');
    }
  }
}
