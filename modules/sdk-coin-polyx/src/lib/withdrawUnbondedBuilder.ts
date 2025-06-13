import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { methods } from '@substrate/txwrapper-polkadot';
import { UnsignedTransaction, DecodedSigningPayload, DecodedSignedTx } from '@substrate/txwrapper-core';
import { InvalidTransactionError, TransactionType } from '@bitgo/sdk-core';
import BigNumber from 'bignumber.js';
import { TransactionBuilder, Transaction } from '@bitgo/abstract-substrate';
import { WithdrawUnbondedTransactionSchema } from './txnSchema';
import { WithdrawUnbondedArgs } from './iface';

export class WithdrawUnbondedBuilder extends TransactionBuilder {
  protected _slashingSpans = 0;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /**
   * Withdraw unbonded tokens after the unbonding period has passed
   *
   * @returns {UnsignedTransaction} an unsigned Polyx transaction
   */
  protected buildTransaction(): UnsignedTransaction {
    const baseTxInfo = this.createBaseTxInfo();

    return methods.staking.withdrawUnbonded(
      {
        numSlashingSpans: this._slashingSpans,
      },
      baseTxInfo.baseTxInfo,
      baseTxInfo.options
    );
  }

  protected get transactionType(): TransactionType {
    return TransactionType.StakingWithdraw;
  }

  /**
   * The number of slashing spans, typically 0 for most users
   *
   * @param {number} slashingSpans
   * @returns {WithdrawUnbondedBuilder} This withdrawUnbonded builder.
   */
  slashingSpans(slashingSpans: number): this {
    this.validateValue(new BigNumber(slashingSpans));
    this._slashingSpans = slashingSpans;
    return this;
  }

  /**
   * Get the slashing spans
   */
  getSlashingSpans(): number {
    return this._slashingSpans;
  }

  /** @inheritdoc */
  validateDecodedTransaction(decodedTxn: DecodedSigningPayload | DecodedSignedTx): void {
    if (decodedTxn.method?.name === 'withdrawUnbonded') {
      const txMethod = decodedTxn.method.args as unknown as WithdrawUnbondedArgs;
      const slashingSpans = txMethod.numSlashingSpans;
      const validationResult = WithdrawUnbondedTransactionSchema.validate({ slashingSpans });

      if (validationResult.error) {
        throw new InvalidTransactionError(
          `WithdrawUnbonded Transaction validation failed: ${validationResult.error.message}`
        );
      }
    } else {
      throw new InvalidTransactionError(
        `Invalid transaction type: ${decodedTxn.method?.name}. Expected withdrawUnbonded`
      );
    }
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction {
    const tx = super.fromImplementation(rawTransaction);

    if (this._method && (this._method.name as string) === 'withdrawUnbonded') {
      const txMethod = this._method.args as unknown as WithdrawUnbondedArgs;
      this.slashingSpans(txMethod.numSlashingSpans);
    } else {
      throw new InvalidTransactionError(`Invalid Transaction Type: ${this._method?.name}. Expected withdrawUnbonded`);
    }

    return tx;
  }

  /** @inheritdoc */
  validateTransaction(_: Transaction): void {
    super.validateTransaction(_);
    this.validateFields(this._slashingSpans);
  }

  private validateFields(slashingSpans: number): void {
    const validationResult = WithdrawUnbondedTransactionSchema.validate({
      slashingSpans,
    });

    if (validationResult.error) {
      throw new InvalidTransactionError(
        `WithdrawUnbonded Builder Transaction validation failed: ${validationResult.error.message}`
      );
    }
  }
}
