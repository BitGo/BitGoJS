import { DelegatorTxBuilder } from './delegatorTxBuilder';
import { BaseCoin } from '@bitgo/statics';
import { AddValidatorTx, Tx, UnsignedTx } from 'avalanche/dist/apis/platformvm';
import { BuildTransactionError, TransactionType } from '@bitgo/sdk-core';
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
   * get transaction type
   * @protected
   */
  protected get transactionType(): TransactionType {
    return TransactionType.addValidator;
  }

  /**
   * set the delegationFeeRate
   * @param value number
   */
  delegationFeeRate(value: number): this {
    this.validateDelegationFeeRate(value);
    this._delegationFeeRate = value;
    return this;
  }

  /**
   * Validate that the delegation fee is at least the minDelegationFee
   * @param delegationFeeRate number
   */
  validateDelegationFeeRate(delegationFeeRate: number): void {
    if (delegationFeeRate < Number(this.transaction._network.minDelegationFee)) {
      throw new BuildTransactionError(
        `Delegation fee cannot be less than ${this.transaction._network.minDelegationFee}`
      );
    }
  }

  /**
   * Build the validator transaction
   * @protected
   */
  protected buildAvaxpTransaction(): void {
    this.validateStakeDuration(this._startTime, this._endTime);
    const { inputs, credentials, amount } = this.createInput();
    if (amount.lt(this._stakeAmount)) {
      throw new BuildTransactionError(
        `Utxo outputs get ${amount.toString()} and ${this._stakeAmount.toString()} is required`
      );
    }
    const outputs = this.changeOutputs(amount.sub(this._stakeAmount));
    this.transaction.setTransaction(
      new Tx(
        new UnsignedTx(
          new AddValidatorTx(
            this.transaction._networkID,
            this.transaction._blockchainID,
            outputs,
            inputs,
            this.transaction._memo,
            utils.NodeIDStringToBuffer(this._nodeID),
            this._startTime,
            this._endTime,
            this._stakeAmount,
            [this.stakeTransferOut()],
            this.rewardOwnersOutput(),
            this._delegationFeeRate
          )
        ),
        credentials
      )
    );
  }
}
