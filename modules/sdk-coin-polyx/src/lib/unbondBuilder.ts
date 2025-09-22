import { Transaction } from './transaction';
import { PolyxBaseBuilder } from './baseBuilder';
import { DecodedSignedTx, DecodedSigningPayload, UnsignedTransaction } from '@substrate/txwrapper-core';
import { methods } from '@substrate/txwrapper-polkadot';
import { BaseCoin as CoinConfig } from '@bitgo-beta/statics';
import { InvalidTransactionError, TransactionType } from '@bitgo-beta/sdk-core';
import { UnbondTransactionSchema } from './txnSchema';
import utils from './utils';
import { UnbondArgs } from './iface';
import BigNumber from 'bignumber.js';

export class UnbondBuilder extends PolyxBaseBuilder {
  protected _amount: string;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this.material(utils.getMaterial(_coinConfig.network.type));
  }

  protected get transactionType(): TransactionType {
    return TransactionType.StakingDeactivate;
  }

  /**
   * Build the unbond transaction
   */
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

  /**
   * Set the amount to unbond
   */
  amount(amount: string): this {
    this.validateValue(new BigNumber(amount));
    this._amount = amount;
    return this;
  }

  /**
   * Get the amount to unbond
   */
  getAmount(): string {
    return this._amount;
  }

  /** @inheritdoc */
  validateDecodedTransaction(decodedTxn: DecodedSigningPayload | DecodedSignedTx): void {
    const methodName = decodedTxn.method?.name as string;

    if (methodName === 'unbond') {
      const txMethod = decodedTxn.method.args as unknown as UnbondArgs;
      const value = txMethod.value;

      const validationResult = UnbondTransactionSchema.validate({
        value,
      });

      if (validationResult.error) {
        throw new InvalidTransactionError(`Invalid unbond transaction: ${validationResult.error.message}`);
      }
    } else {
      throw new InvalidTransactionError(`Invalid transaction type: ${methodName}. Expected unbond`);
    }
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction {
    const tx = super.fromImplementation(rawTransaction);
    const methodName = this._method?.name as string;

    if (methodName === 'unbond' && this._method) {
      const txMethod = this._method.args as unknown as UnbondArgs;
      this.amount(txMethod.value);
    } else {
      throw new InvalidTransactionError(`Invalid Transaction Type: ${methodName}. Expected unbond`);
    }

    return tx;
  }

  /** @inheritdoc */
  validateTransaction(tx: Transaction): void {
    super.validateTransaction(tx);
    this.validateFields();
  }

  /**
   * Validate the unbond fields
   */
  private validateFields(): void {
    const validationResult = UnbondTransactionSchema.validate({
      value: this._amount,
    });

    if (validationResult.error) {
      throw new InvalidTransactionError(`Invalid unbond transaction: ${validationResult.error.message}`);
    }
  }

  /**
   * Validates fields for testing
   */
  testValidateFields(): void {
    this.validateFields();
  }
}
