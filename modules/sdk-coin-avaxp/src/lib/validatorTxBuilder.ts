import { DelegatorTxBuilder } from './delegatorTxBuilder';
import { AddValidatorTx, Tx, UnsignedTx } from 'avalanche/dist/apis/platformvm';
import { BaseTransaction, BuildTransactionError } from '@bitgo/sdk-core';
import utils from './utils';
import { BN } from 'avalanche';

export class ValidatorTxBuilder extends DelegatorTxBuilder {
  protected _delegationFeeRate: number;

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
    if (delegationFeeRate < Number(this._coinConfig.network.minDelegationFee)) {
      throw new BuildTransactionError(
        `Delegation fee cannot be less than ${this._coinConfig.network.minDelegationFee}`
      );
    }
  }

  /**
   * Build the validator transaction
   * @protected
   */
  protected buildAvaxTransaction(): void {
    const { inputs, amount, credentials } = this.createInput();
    const outputs = this.createChangeOutputs(amount.sub(this._stakeAmount));
    this.transaction.tx = new Tx(
      new UnsignedTx(
        new AddValidatorTx(
          this._coinConfig.network.networkID,
          utils.binTools.cb58Decode(this._coinConfig.network.blockchainID),
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
        )
      ),
      credentials
    );
  }

  /**
   *
   * @param amount
   */
  validateStakeAmount(amount: BN): void {
    const minStake = new BN(this._coinConfig.network.minStake);
    if (amount.lt(minStake)) {
      throw new BuildTransactionError('Minimum staking amount is ' + Number(minStake) / 1000000000 + ' AVAX.');
    }
  }

  validateTransaction(_?: BaseTransaction): void {
    super.validateTransaction(_);
    if (!this._delegationFeeRate) {
      throw new Error('delegationFeeRate is required');
    }
  }
}
