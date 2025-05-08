import BigNumber from 'bignumber.js';

import { TransactionBuilder, Transaction, Interface, Schema } from '@bitgo/abstract-substrate';
import { DecodedSignedTx, DecodedSigningPayload, defineMethod, UnsignedTransaction } from '@substrate/txwrapper-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BaseAddress, InvalidTransactionError, TransactionType } from '@bitgo/sdk-core';

import utils from './utils';

export class TransferBuilder extends TransactionBuilder {
  protected _amount: string;
  protected _to: string;
  protected _memo: string;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this.material(utils.getMaterial(_coinConfig.network.type));
  }

  protected get transactionType(): TransactionType {
    return TransactionType.Send;
  }

  /**
   * Construct an unsigned `transferWithMemo` transaction using the provided details.
   *
   * @returns {UnsignedTransaction} The constructed unsigned transferWithMemo transaction.
   */
  protected buildTransaction(): UnsignedTransaction {
    const baseTxInfo = this.createBaseTxInfo();
    return this.TransferWithMemo(
      {
        dest: { id: this._to },
        value: this._amount,
        memo: this._memo,
      },
      baseTxInfo
    );
  }

  /**
   *
   * The amount for transfer transaction.
   *
   * @param {string} amount
   * @returns {TransferBuilder} This transfer builder.
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
   */
  to({ address }: BaseAddress): this {
    this.validateAddress({ address });
    this._to = address;
    return this;
  }

  /**
   * The memo to attach to the transfer transaction.
   * Pads the memo on the left with zeros to ensure it is 32 characters long.
   *
   * @param {string} memo The memo string to include.
   * @returns {TransferBuilder} This transfer builder.
   */
  memo(memo: string): this {
    const paddedMemo = memo.padStart(32, '0');
    this._memo = paddedMemo;
    return this;
  }

  /** @inheritdoc */
  validateDecodedTransaction(decodedTxn: DecodedSigningPayload | DecodedSignedTx, rawTransaction?: string): void {
    if (decodedTxn.method?.name === Interface.MethodNames.TransferWithMemo) {
      const txMethod = decodedTxn.method.args as Interface.TransferWithMemoArgs;
      const amount = `${txMethod.value}`;
      const to = txMethod.dest.id;
      const memo = txMethod.memo;

      console.log(`Validating TransferWithMemo transaction: amount=${amount}, to=${to}, memo=${memo}`);

      const validationResult = Schema.TransferWithMemoTransactionSchema.validate({ amount, to, memo });
      if (validationResult.error) {
        throw new InvalidTransactionError(`Invalid transaction: ${validationResult.error.message}`);
      }
    }
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction {
    const tx = super.fromImplementation(rawTransaction);
    if (this._method?.name === Interface.MethodNames.TransferWithMemo) {
      const txMethod = this._method.args as Interface.TransferWithMemoArgs;
      this.amount(txMethod.value);
      this.to({ address: utils.decodeSubstrateAddress(txMethod.dest.id, this.getAddressFormat()) });
      this.memo(txMethod.memo);
    } else {
      throw new InvalidTransactionError(`Invalid Transaction Type: ${this._method?.name}. Expected transferWithMemo`);
    }
    return tx;
  }

  /**
   * Construct a transaction to transfer funds with an attached memo.
   *
   * @param {Interface.TransferWithMemoArgs} args Arguments to be passed to the transferWithMemo method
   * @param {Interface.CreateBaseTxInfo} info Base txn info required to construct the transfer transaction
   * @returns {UnsignedTransaction} An unsigned transferWithMemo transaction
   */
  private TransferWithMemo(
    args: Interface.TransferWithMemoArgs,
    info: Interface.CreateBaseTxInfo
  ): UnsignedTransaction {
    return defineMethod(
      {
        method: {
          args,
          name: 'transferWithMemo',
          pallet: 'balances',
        },
        ...info.baseTxInfo,
      },
      info.options
    );
  }
}
