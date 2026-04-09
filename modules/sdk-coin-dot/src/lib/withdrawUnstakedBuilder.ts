import { InvalidTransactionError, TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { DecodedSignedTx, DecodedSigningPayload, UnsignedTransaction } from '@substrate/txwrapper-core';
import { methods } from '@substrate/txwrapper-polkadot';
import BigNumber from 'bignumber.js';
import { MethodNames, WithdrawUnstakedArgs } from './iface';
import { Transaction } from './transaction';
import { TransactionBuilder } from './transactionBuilder';
import { WithdrawUnstakedTransactionSchema } from './txnSchema';

export class WithdrawUnstakedBuilder extends TransactionBuilder {
  protected _numSlashingSpans: number;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /**
   *
   * Frees up any unlocked chunks.
   * The balance can now be used by the stash account to do whatever it wants.
   *
   * @returns {UnsignedTransaction} an unsigned Dot transaction
   *
   * @see https://polkadot.js.org/docs/substrate/extrinsics/#withdrawunbondednum_slashing_spans-u32
   */
  protected buildTransaction(): UnsignedTransaction {
    const baseTxInfo = this.createBaseTxInfo();
    // TODO: The method changes the args type from number to string, verify it doesn't break anything
    return methods.staking.withdrawUnbonded(
      {
        numSlashingSpans: this._numSlashingSpans,
      },
      baseTxInfo.baseTxInfo,
      baseTxInfo.options
    );
  }

  protected get transactionType(): TransactionType {
    return TransactionType.StakingWithdraw;
  }

  /**
   *
   * The number of slashing spans.
   *
   * @param {number} slashingSpans
   * @returns {WithdrawUnstakedBuilder} This withdrawUnstaked builder.
   *
   * @see https://polkadot.js.org/docs/substrate/extrinsics/#withdrawunbondednum_slashing_spans-u32
   */
  slashingSpans(slashingSpans: number): this {
    this.validateValue(new BigNumber(slashingSpans));
    this._numSlashingSpans = slashingSpans;
    return this;
  }

  /** @inheritdoc */
  validateDecodedTransaction(decodedTxn: DecodedSigningPayload | DecodedSignedTx): void {
    if (decodedTxn.method?.name === MethodNames.WithdrawUnbonded) {
      const txMethod = decodedTxn.method.args as unknown as WithdrawUnstakedArgs;
      const value = txMethod.numSlashingSpans;
      const validationResult = WithdrawUnstakedTransactionSchema.validate({ value });
      if (validationResult.error) {
        throw new InvalidTransactionError(
          `WithdrawUnstaked Transaction validation failed: ${validationResult.error.message}`
        );
      }
    }
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction {
    const tx = super.fromImplementation(rawTransaction);
    if (this._method?.name === MethodNames.WithdrawUnbonded) {
      const txMethod = this._method.args as WithdrawUnstakedArgs;
      this.slashingSpans(txMethod.numSlashingSpans);
    } else {
      throw new InvalidTransactionError(`Invalid Transaction Type: ${this._method?.name}. Expected withdrawUnbonded`);
    }
    return tx;
  }

  /** @inheritdoc */
  validateTransaction(_: Transaction): void {
    super.validateTransaction(_);
    this.validateFields(this._numSlashingSpans);
  }

  private validateFields(value: number): void {
    const validationResult = WithdrawUnstakedTransactionSchema.validate({
      value,
    });

    if (validationResult.error) {
      throw new InvalidTransactionError(
        `WithdrawUnstaked Builder Transaction validation failed: ${validationResult.error.message}`
      );
    }
  }
}
