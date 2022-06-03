import { DelegatorTxBuilder } from './delegatorTxBuilder';
import { BaseCoin } from '@bitgo/statics';
import { AddValidatorTx, BaseTx } from 'avalanche/dist/apis/platformvm';
import { BuildTransactionError, TransactionType } from '@bitgo/sdk-core';
import utils from './utils';
import { minDelegationFee, validatorTransactionTypeId } from './constants';

export class ValidatorTxBuilder extends DelegatorTxBuilder {
  protected _delegationFeeRate: BigInt;

  /**
   * @param coinConfig
   */
  constructor(coinConfig: Readonly<BaseCoin>) {
    super(coinConfig);
  }

  /**
   * get transaction type
   * @protected
   */
  protected get transactionType(): TransactionType {
    return validatorTransactionTypeId;
  }

  /**
   * set the delegationFeeRate
   * @param value BigInt
   */
  delegationFeeRate(value: BigInt): this {
    this.validateDelegationFeeRate(value);
    this._delegationFeeRate = value;
    return this;
  }

  /**
   * Validate that the delegation fee is at least the minDelegationFee
   * @param delegationFeeRate BigInt
   */
  validateDelegationFeeRate(delegationFeeRate: BigInt): void {
    if (delegationFeeRate < minDelegationFee) {
      throw new BuildTransactionError(`Delegation fee cannot be less than ${minDelegationFee}`);
    }
  }

  /**
   * Initialize the builder
   * @param tx BaseTx
   * @returns ValidatorTxBuilder
   */
  initBuilder(tx?: BaseTx): this {
    if (!tx) return this;
    const vtx = tx as AddValidatorTx;
    this._delegationFeeRate = BigInt(vtx.getDelegationFee());
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
      Number(this._delegationFeeRate)
    );
  }
}
