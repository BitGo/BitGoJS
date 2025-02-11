import { BaseAddress, InvalidTransactionError, TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { methods } from '@substrate/txwrapper-polkadot';
import { DecodedSignedTx, DecodedSigningPayload, UnsignedTransaction } from '@substrate/txwrapper-core';
import BigNumber from 'bignumber.js';
import { MethodNames, TransferAllArgs, TransferArgs } from './iface';
import { Transaction } from './transaction';
import { TransactionBuilder } from './transactionBuilder';
import { TransferAllTransactionSchema, TransferTransactionSchema } from './txnSchema';
import utils from './utils';

export abstract class NativeTransferBuilder extends TransactionBuilder {
  protected _sweepFreeBalance = false;
  protected _keepAddressAlive = true;
  protected _amount: string;
  protected _to: string;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /**
   *
   * Dispatch the given call from an account that the sender is authorised for through add_proxy.
   *
   * @returns {UnsignedTransaction} an unsigned Dot transaction
   *
   * @see https://polkadot.js.org/docs/substrate/extrinsics/#proxy
   */
  protected buildTransaction(): UnsignedTransaction {
    const baseTxInfo = this.createBaseTxInfo();
    let transferTx;
    if (this._sweepFreeBalance) {
      transferTx = methods.balances.transferAll(
        {
          dest: { id: this._to },
          keepAlive: this._keepAddressAlive,
        },
        baseTxInfo.baseTxInfo,
        baseTxInfo.options
      );
    } else {
      transferTx = methods.balances.transferKeepAlive(
        {
          value: this._amount,
          dest: { id: this._to },
        },
        baseTxInfo.baseTxInfo,
        baseTxInfo.options
      );
    }

    return transferTx;
  }

  protected get transactionType(): TransactionType {
    return TransactionType.Send;
  }

  /**
   *
   * Set this to be a sweep transaction, using TransferAll with keepAlive set to true by default.
   * If keepAlive is false, the entire address will be swept (including the 1 DOT minimum).
   *
   * @param {boolean} keepAlive - keep the address alive after this sweep
   * @returns {TransferBuilder} This transfer builder.
   *
   * @see https://github.com/paritytech/txwrapper-core/blob/main/docs/modules/txwrapper_substrate_src.methods.balances.md#transferall
   */
  sweep(keepAlive?: boolean): this {
    this._sweepFreeBalance = true;
    if (keepAlive !== undefined) {
      this._keepAddressAlive = keepAlive;
    }
    return this;
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
  to({ address }: BaseAddress): this {
    this.validateAddress({ address });
    this._to = address;
    return this;
  }

  /** @inheritdoc */
  validateDecodedTransaction(decodedTxn: DecodedSigningPayload | DecodedSignedTx, rawTransaction: string): void {
    if (decodedTxn.method?.name === MethodNames.TransferKeepAlive) {
      const txMethod = decodedTxn.method.args as unknown as TransferArgs;
      const amount = `${txMethod.value}`;
      const to = txMethod.dest.id;
      const validationResult = TransferTransactionSchema.validate({ amount, to });
      if (validationResult.error) {
        throw new InvalidTransactionError(`Transfer Transaction validation failed: ${validationResult.error.message}`);
      }
    }
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction {
    const tx = super.fromImplementation(rawTransaction);
    if (this._method?.name === MethodNames.TransferKeepAlive) {
      const txMethod = this._method.args as TransferArgs;
      this.amount(txMethod.value);
      this.to({
        address: utils.decodeSubstrateAddress(txMethod.dest.id, this.getAddressFormat()),
      });
    } else if (this._method?.name === MethodNames.TransferAll) {
      this._sweepFreeBalance = true;
      const txMethod = this._method.args as TransferAllArgs;
      this.sweep(txMethod.keepAlive);
      this.to({
        address: utils.decodeSubstrateAddress(txMethod.dest.id, this.getAddressFormat()),
      });
    } else {
      throw new InvalidTransactionError(
        `Invalid Transaction Type: ${this._method?.name}. Expected a transferKeepAlive or a proxy transferKeepAlive transaction`
      );
    }
    return tx;
  }

  /** @inheritdoc */
  validateTransaction(_: Transaction): void {
    super.validateTransaction(_);
    this.validateFields(this._to, this._amount);
  }

  private validateFields(to: string, amount: string): void {
    let validationResult;
    if (this._sweepFreeBalance) {
      validationResult = TransferAllTransactionSchema.validate({ to });
    } else {
      validationResult = TransferTransactionSchema.validate({ amount, to });
    }

    if (validationResult.error) {
      throw new InvalidTransactionError(`Transaction validation failed: ${validationResult.error.message}`);
    }
  }
}
