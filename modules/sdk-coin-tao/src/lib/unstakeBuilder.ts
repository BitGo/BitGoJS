import { InvalidTransactionError, TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { DecodedSignedTx, DecodedSigningPayload, UnsignedTransaction } from '@substrate/txwrapper-core';
import { methods } from '@substrate/txwrapper-polkadot';
import { MethodNames, UnstakeArgs } from './iface';
import { Transaction } from './transaction';
import { TransactionBuilder } from './transactionBuilder';
import { UnstakeTransactionSchema } from './txnSchema';
import BigNumber from 'bignumber.js';

export class UnstakeBuilder extends TransactionBuilder {
  protected _amount: string;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /**
   * The amount to unstake.
   *
   * @param {string} amount
   * @returns {UnstakeBuilder} This unstake builder.
   *
   * @see https://wiki.polkadot.network/docs/learn-nominator#required-minimum-stake
   */
  amount(amount: string): this {
    this.validateValue(new BigNumber(amount));
    this._amount = amount;
    return this;
  }

  /** @inheritdoc */
  protected buildTransaction(): UnsignedTransaction {
    const baseTxInfo = this.createBaseTxInfo();
    return methods.staking.unbond(
      {
        value: this._amount,
      },
      baseTxInfo.baseTxInfo,
      baseTxInfo.options
    );
  }

  /** @inheritdoc */
  protected get transactionType(): TransactionType {
    return TransactionType.StakingUnlock;
  }

  /** @inheritdoc */
  validateDecodedTransaction(decodedTxn: DecodedSigningPayload | DecodedSignedTx): void {
    if (decodedTxn.method?.name === MethodNames.Unbond) {
      const txMethod = decodedTxn.method.args as unknown as UnstakeArgs;
      const value = txMethod.value;
      const validationResult = UnstakeTransactionSchema.validate({ value });
      if (validationResult.error) {
        throw new InvalidTransactionError(`Unstake Transaction validation failed: ${validationResult.error.message}`);
      }
    }
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction {
    const tx = super.fromImplementation(rawTransaction);
    if (this._method?.name === MethodNames.Unbond) {
      const txMethod = this._method.args as UnstakeArgs;
      this.amount(txMethod.value);
    } else {
      throw new InvalidTransactionError(`Invalid Transaction Type: ${this._method?.name}. Expected unbond`);
    }
    return tx;
  }

  /** @inheritdoc */
  validateTransaction(_: Transaction): void {
    super.validateTransaction(_);
    this.validateFields(this._amount);
  }

  private validateFields(value: string): void {
    const validationResult = UnstakeTransactionSchema.validate({ value });

    if (validationResult.error) {
      throw new InvalidTransactionError(
        `Unstake Builder Transaction validation failed: ${validationResult.error.message}`
      );
    }
  }
}
