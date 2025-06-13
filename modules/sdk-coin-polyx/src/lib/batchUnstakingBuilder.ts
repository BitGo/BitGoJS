import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { methods } from '@substrate/txwrapper-polkadot';
import { UnsignedTransaction, DecodedSigningPayload, DecodedSignedTx } from '@substrate/txwrapper-core';
import { InvalidTransactionError, TransactionType } from '@bitgo/sdk-core';
import BigNumber from 'bignumber.js';
import { TransactionBuilder, Transaction } from '@bitgo/abstract-substrate';
import { BatchArgs } from './iface';
import { BatchUnstakingTransactionSchema } from './txnSchema';
import utils from './utils';

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

    if (methodName === 'batchAll') {
      const txMethod = decodedTxn.method.args as unknown as BatchArgs;
      const calls = txMethod.calls;

      if (calls.length !== 2) {
        throw new InvalidTransactionError(
          `Invalid batch unstaking transaction: expected 2 calls but got ${calls.length}`
        );
      }

      // Check that first call is chill
      const firstCallMethod = utils.decodeMethodName(calls[0], this._registry);
      if (firstCallMethod !== 'chill') {
        throw new InvalidTransactionError(
          `Invalid batch unstaking transaction: first call should be chill but got ${firstCallMethod}`
        );
      }

      // Check that second call is unbond
      const secondCallMethod = utils.decodeMethodName(calls[1], this._registry);
      if (secondCallMethod !== 'unbond') {
        throw new InvalidTransactionError(
          `Invalid batch unstaking transaction: second call should be unbond but got ${secondCallMethod}`
        );
      }

      // Validate unbond amount - handle both string and number formats
      const unbondArgs = calls[1].args as { value: string | number };
      const valueString = typeof unbondArgs.value === 'string' ? unbondArgs.value : unbondArgs.value.toString();
      const validationResult = BatchUnstakingTransactionSchema.validate({
        value: valueString,
      });

      if (validationResult.error) {
        throw new InvalidTransactionError(`Invalid batch unstaking transaction: ${validationResult.error.message}`);
      }
    } else {
      throw new InvalidTransactionError(`Invalid transaction type: ${methodName}. Expected batchAll`);
    }
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction {
    const tx = super.fromImplementation(rawTransaction);

    if (this._method && (this._method.name as string) === 'batchAll') {
      const txMethod = this._method.args as unknown as BatchArgs;
      const calls = txMethod.calls;

      if (calls && calls.length === 2) {
        const secondCallMethod = utils.decodeMethodName(calls[1], this._registry);
        if (secondCallMethod === 'unbond') {
          const unbondArgs = calls[1].args as { value: string | number };
          const valueString = typeof unbondArgs.value === 'string' ? unbondArgs.value : unbondArgs.value.toString();
          this.amount(valueString);
        }
      }
    } else {
      throw new InvalidTransactionError(`Invalid Transaction Type: ${this._method?.name}. Expected batchAll`);
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
