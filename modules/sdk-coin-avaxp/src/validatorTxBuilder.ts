import { DelegatorTxBuilder } from './delegatorTxBuilder';
import { BaseCoin } from '@bitgo/statics';
import { AddValidatorTx, BaseTx } from 'avalanche/dist/apis/platformvm';
import { BuildTransactionError } from '@bitgo/sdk-core';
import utils from './utils';

export class ValidatorTxBuilder extends DelegatorTxBuilder {
  protected _delegationFeeRate: number;

  /**
   * @param coinConfig
   */
  constructor(coinConfig: Readonly<BaseCoin>) {
    super(coinConfig);
  }

  /**
   * set the delegationFeeRate
   * @param value BigInt
   */
  delegationFeeRate(value: number): this {
    this.validateDelegationFeeRate(value);
    this._delegationFeeRate = value;
    return this;
  }

  /**
   * Validate that the delegation fee is at least the minDelegationFee
   * @param delegationFeeRate BigInt
   */
  validateDelegationFeeRate(delegationFeeRate: number): void {
    if (delegationFeeRate < this._network.minDelegationFee) {
      throw new BuildTransactionError(`Delegation fee cannot be less than ${this._network.minDelegationFee}`);
    }
  }

  /**
   * Initialize the builder
   * @param tx BaseTx
   * @returns ValidatorTxBuilder
   */
  initBuilder(tx?: AddValidatorTx): this {
    if (!tx) return this;
    this._delegationFeeRate = tx.getDelegationFee();
    return super.initBuilder(tx);
  }

  /**
   * Build the validator transaction
   * @protected
   */
  protected buildAvaxpTransaction(): BaseTx {
    const { inputs, outputs } = this.createInputOutput();

    return new AddValidatorTx(
      this._networkID,
      this._blockchainID,
      outputs,
      inputs,
      this._memo,
      utils.NodeIDStringToBuffer(this._nodeID),
      this._startTime,
      this._endTime,
      this._stakeAmount,
      [this.stakeTransferOut()],
      this.rewardOwnersOutput(),
      this._delegationFeeRate
    );
  }
}
