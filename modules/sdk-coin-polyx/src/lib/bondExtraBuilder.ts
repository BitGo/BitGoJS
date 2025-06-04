import { TransactionBuilder, Transaction } from '@bitgo/abstract-substrate';
import { DecodedSignedTx, DecodedSigningPayload, UnsignedTransaction } from '@substrate/txwrapper-core';
import { methods } from '@substrate/txwrapper-polkadot';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { InvalidTransactionError, TransactionType } from '@bitgo/sdk-core';
import { BondExtraTransactionSchema } from './txnSchema';
import utils from './utils';
import { BondExtraArgs } from './iface';
import BigNumber from 'bignumber.js';

export class BondExtraBuilder extends TransactionBuilder {
  protected _amount: string;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this.material(utils.getMaterial(_coinConfig.network.type));
  }

  protected get transactionType(): TransactionType {
    return TransactionType.StakingActivate;
  }

  /**
   * Build the bondExtra transaction
   */
  protected buildTransaction(): UnsignedTransaction {
    const baseTxInfo = this.createBaseTxInfo();

    return methods.staking.bondExtra(
      {
        maxAdditional: this._amount,
      },
      baseTxInfo.baseTxInfo,
      baseTxInfo.options
    );
  }

  /**
   * Set additional amount to stake
   */
  amount(amount: string): this {
    this.validateValue(new BigNumber(amount));
    this._amount = amount;
    return this;
  }

  /**
   * Get the amount to stake
   */
  getAmount(): string {
    return this._amount;
  }

  /** @inheritdoc */
  validateDecodedTransaction(decodedTxn: DecodedSigningPayload | DecodedSignedTx): void {
    const methodName = decodedTxn.method?.name as string;

    if (methodName === 'staking.bondExtra') {
      const txMethod = decodedTxn.method.args as unknown as BondExtraArgs;
      const value = txMethod.maxAdditional;

      const validationResult = BondExtraTransactionSchema.validate({
        value,
      });

      if (validationResult.error) {
        throw new InvalidTransactionError(`Invalid transaction: ${validationResult.error.message}`);
      }
    } else {
      throw new InvalidTransactionError(`Invalid transaction type: ${methodName}`);
    }
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction {
    const tx = super.fromImplementation(rawTransaction);
    const methodName = this._method?.name as string;

    if (methodName === 'staking.bondExtra' && this._method) {
      const txMethod = this._method.args as unknown as BondExtraArgs;
      this.amount(txMethod.maxAdditional);
    } else {
      throw new InvalidTransactionError(`Invalid Transaction Type: ${methodName}. Expected staking.bondExtra`);
    }

    return tx;
  }

  /** @inheritdoc */
  validateTransaction(tx: Transaction): void {
    super.validateTransaction(tx);
    this.validateFields();
  }

  /**
   * Validate the bondExtra fields
   */
  private validateFields(): void {
    const validationResult = BondExtraTransactionSchema.validate({
      value: this._amount,
    });

    if (validationResult.error) {
      throw new InvalidTransactionError(`Invalid transaction: ${validationResult.error.message}`);
    }
  }

  /**
   * Validate amount
   */
  validateAmount(amount: string): void {
    const amountBN = new BigNumber(amount);
    if (amountBN.isNaN() || amountBN.isLessThanOrEqualTo(0)) {
      throw new Error(`Bond amount ${amount} must be a positive number`);
    }
  }
}
