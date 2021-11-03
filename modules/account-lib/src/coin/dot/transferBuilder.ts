import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { TransactionType } from '../baseCoin';
import { InvalidTransactionError } from '../baseCoin/errors';
import { methods, decode } from '@substrate/txwrapper-polkadot';
import { UnsignedTransaction } from '@substrate/txwrapper-core';
import BigNumber from 'bignumber.js';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction';
import { MethodNames, TransferArgs } from './iface';
import { TransferTransactionSchema } from './txnSchema';

export class TransferBuilder extends TransactionBuilder {
  protected _amount: string;
  protected _dest: string;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }
  /** @inheritdoc */
  protected buildDotTxn(): UnsignedTransaction {
    const baseTxInfo = this.createBaseTxInfo();
    return methods.balances.transferKeepAlive(
      {
        value: this._amount,
        dest: this._dest,
      },
      baseTxInfo.baseTxInfo,
      baseTxInfo.options,
    );
  }
  /**
   *
   * The amount for transfer transaction.
   *
   * @param {string} amount
   * @returns {TransferBuilder} This transfer builder.
   *
   * @see https://wiki.polkadot.network/docs/build-protocol-info
   */
  amount(amount: string): this {
    this.validateValue(new BigNumber(amount));
    this._amount = amount;
    return this;
  }
  /**
   *
   * The destination address for transfer transaction.
   *
   * @param {string} dest
   * @returns {TransferBuilder} This transfer builder.
   *
   * @see https://wiki.polkadot.network/docs/build-protocol-info
   */
  dest(dest: string): this {
    this.validateAddress({ address: dest });
    this._dest = dest;
    return this;
  }
  protected get transactionType(): TransactionType {
    return TransactionType.Send;
  }
  /** @inheritdoc */
  validateRawTransaction(rawTransaction: string): void {
    super.validateRawTransaction(rawTransaction);
    const decodedTxn = decode(rawTransaction, {
      metadataRpc: this._metadataRpc,
      registry: this._registry,
    });
    if (decodedTxn.method?.name === MethodNames.TransferKeepAlive) {
      const txMethod = decodedTxn.method.args as unknown as TransferArgs;
      const value = txMethod.value;
      const dest = txMethod.dest.id;
      const validationResult = TransferTransactionSchema.validate({ value, dest });
      if (validationResult.error) {
        throw new InvalidTransactionError(`Transaction validation failed: ${validationResult.error.message}`);
      }
    }
  }
  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction {
    const tx = super.fromImplementation(rawTransaction);
    if (this._method?.name === MethodNames.TransferKeepAlive) {
      const txMethod = this._method.args as TransferArgs;
      this.amount(txMethod.value);
      this.dest(txMethod.dest.id);
    } else {
      throw new InvalidTransactionError(`Invalid Transaction Type: ${this._method?.name}. Expected transferKeepAlive`);
    }
    return tx;
  }
}
