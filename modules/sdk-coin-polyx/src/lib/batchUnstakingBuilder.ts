import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { methods } from '@substrate/txwrapper-polkadot';
import { UnsignedTransaction, DecodedSigningPayload, DecodedSignedTx } from '@substrate/txwrapper-core';
import { InvalidTransactionError, TransactionType } from '@bitgo/sdk-core';
import BigNumber from 'bignumber.js';
import { TransactionBuilder, Transaction } from '@bitgo/abstract-substrate';
import { BatchArgs } from './iface';
import { BatchUnstakingTransactionSchema } from './txnSchema';

export class BatchUnstakingBuilder extends TransactionBuilder {
  protected _amount: string;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /**
   * Unbond tokens and chill (stop nominating validators)
   *
   * @returns {UnsignedTransaction} an unsigned Polyx transaction
   */
  protected buildTransaction(): UnsignedTransaction {
    const baseTxInfo = this.createBaseTxInfo();

    const chillCall = methods.staking.chill({}, baseTxInfo.baseTxInfo, baseTxInfo.options);

    const unbondCall = methods.staking.unbond(
      {
        value: this._amount,
      },
      baseTxInfo.baseTxInfo,
      baseTxInfo.options
    );

    // Create batch all transaction (atomic execution)
    return methods.utility.batchAll(
      {
        calls: [chillCall.method, unbondCall.method],
      },
      baseTxInfo.baseTxInfo,
      baseTxInfo.options
    );
  }

  protected get transactionType(): TransactionType {
    return TransactionType.Batch;
  }

  /**
   * The amount to unstake.
   *
   * @param {string} amount
   * @returns {BatchUnstakingBuilder} This unstake builder.
   */
  amount(amount: string): this {
    this.validateValue(new BigNumber(amount));
    this._amount = amount;
    return this;
  }

  /**
   * Get the amount to unstake
   */
  getAmount(): string {
    return this._amount;
  }

  /** @inheritdoc */
  validateDecodedTransaction(decodedTxn: DecodedSigningPayload | DecodedSignedTx): void {
    const methodName = decodedTxn.method?.name as string;

    if (methodName === 'utility.batchAll') {
      const txMethod = decodedTxn.method.args as unknown as BatchArgs;
      const calls = txMethod.calls;

      if (calls.length !== 2) {
        throw new InvalidTransactionError(
          `Invalid batch unstaking transaction: expected 2 calls but got ${calls.length}`
        );
      }

      // Check that first call is chill
      if (calls[0].method !== 'staking.chill') {
        throw new InvalidTransactionError(
          `Invalid batch unstaking transaction: first call should be staking.chill but got ${calls[0].method}`
        );
      }

      // Check that second call is unbond
      if (calls[1].method !== 'staking.unbond') {
        throw new InvalidTransactionError(
          `Invalid batch unstaking transaction: second call should be staking.unbond but got ${calls[1].method}`
        );
      }

      // Validate unbond amount
      const unbondArgs = calls[1].args as { value: string };
      const validationResult = BatchUnstakingTransactionSchema.validate({
        value: unbondArgs.value,
      });

      if (validationResult.error) {
        throw new InvalidTransactionError(`Invalid batch unstaking transaction: ${validationResult.error.message}`);
      }
    } else {
      throw new InvalidTransactionError(`Invalid transaction type: ${methodName}. Expected utility.batchAll`);
    }
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction {
    const tx = super.fromImplementation(rawTransaction);

    if (this._method && (this._method.name as string) === 'utility.batchAll') {
      const txMethod = this._method.args as unknown as BatchArgs;
      const calls = txMethod.calls;

      if (calls && calls.length === 2 && calls[1].method === 'staking.unbond') {
        const unbondArgs = calls[1].args as { value: string };
        this.amount(unbondArgs.value);
      }
    } else {
      throw new InvalidTransactionError(`Invalid Transaction Type: ${this._method?.name}. Expected utility.batchAll`);
    }

    return tx;
  }

  /** @inheritdoc */
  validateTransaction(_: Transaction): void {
    super.validateTransaction(_);
    this.validateFields(this._amount);
  }

  private validateFields(value: string): void {
    const validationResult = BatchUnstakingTransactionSchema.validate({
      value,
    });

    if (validationResult.error) {
      throw new InvalidTransactionError(
        `Batch Unstaking Builder Transaction validation failed: ${validationResult.error.message}`
      );
    }
  }

  /**
   * Validates fields for testing
   */
  testValidateFields(): void {
    this.validateFields(this._amount);
  }
}
