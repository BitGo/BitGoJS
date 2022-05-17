import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { TransactionBuilder } from './transactionBuilder';
import { DecodedSignedTx, DecodedSigningPayload, UnsignedTransaction } from '@substrate/txwrapper-core';
import { methods } from '@substrate/txwrapper-polkadot';
import { BuildTransactionError, InvalidTransactionError, NotImplementedError, TransactionType } from '@bitgo/sdk-core';
import { BatchCallObject, BatchArgs, MethodNames } from './iface';
import { BatchTransactionSchema } from './txnSchema';
import { Transaction } from './transaction';
import { ValidationResult } from 'joi';

export class BatchTransactionBuilder extends TransactionBuilder {
  protected _calls: string[];
  protected _type: TransactionType;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /** @inheritDoc */
  protected buildTransaction(): UnsignedTransaction {
    return this.buildBatchTransaction();
  }

  /**
   * Build a transaction which batches together multiple transactions.
   * The transactions which are batched together are passed in as an array of hex strings
   * which are composed of the method to call and the arguments to pass into the method.
   *
   * @returns {UnsignedTransaction}
   *
   * @see https://polkadot.js.org/docs/substrate/extrinsics/#batchcalls-veccall
   */
  protected buildBatchTransaction(): UnsignedTransaction {
    const baseTxInfo = this.createBaseTxInfo();
    return methods.utility.batch(
      {
        calls: this._calls,
      },
      baseTxInfo.baseTxInfo,
      baseTxInfo.options,
    );
  }

  protected get transactionType(): TransactionType {
    return TransactionType.Batch;
  }

  /**
   * Set multiple unsigned transactions to be batched and broadcast as a single transaction
   *
   * @param {BatchCall[]} calls unsigned transactions
   * @returns {BatchTransactionBuilder} This batch transaction builder.
   */
  calls(calls: string[]): this {
    this.validateCalls(calls);
    this._calls = calls;
    return this;
  }

  /** @inheritdoc */
  validateDecodedTransaction(decodedTxn: DecodedSigningPayload | DecodedSignedTx): void {
    const txMethod = decodedTxn.method.args as unknown as BatchArgs;
    const validationResult = this.validateBatchTransactionFields(txMethod.calls);
    if (validationResult.error) {
      throw new InvalidTransactionError(`Transaction validation failed: ${validationResult.error.message}`);
    }
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction {
    const tx = super.fromImplementation(rawTransaction);
    if (this._method?.name === MethodNames.Batch) {
      const txMethod = this._method.args as BatchArgs;
      if (!txMethod.calls) {
        throw new InvalidTransactionError('failed to decode calls from batch transaction');
      }
      const callsToBatch: string[] = [];
      txMethod.calls.forEach((call) => {
        const method = (call as BatchCallObject).callIndex;
        if (method === '0x1604') {
          callsToBatch.push(this.getAnonymousProxyCall(call as BatchCallObject));
        } else {
          throw new NotImplementedError(`batching of transactions with index ${method} unsupported`);
        }
      });
      this.calls(callsToBatch);
    } else {
      throw new InvalidTransactionError(
        `Invalid Transaction Type: ${this._method?.name}. Expected ${MethodNames.Batch}`,
      );
    }
    return tx;
  }

  /** @inheritdoc */
  validateTransaction(_: Transaction): void {
    super.validateTransaction(_);
    this.validateFields();
  }

  /**
   * Validate list of unsigned transactions added to batch
   *
   * @param {string[]} calls
   *
   */
  validateCalls(calls: string[]): void {
    calls.forEach((call) => {
      if (call.slice(0, 2) !== '0x') {
        // example: '0x160400000000000000'
        throw new BuildTransactionError('call in string format must be hex format of a method and its arguments');
      }
    });
  }

  private validateFields(): void {
    const validationResult = this.validateBatchTransactionFields(this._calls);
    if (validationResult.error) {
      throw new InvalidTransactionError(
        `AddressInitialization Transaction validation failed: ${validationResult.error.message}`,
      );
    }
  }

  private validateBatchTransactionFields(calls: (string | BatchCallObject)[]): ValidationResult {
    return BatchTransactionSchema.validate({
      calls,
    });
  }

  private getAnonymousProxyCall(callObject: BatchCallObject): string {
    const baseTxInfo = this.createBaseTxInfo();
    const unsigned = methods.proxy.anonymous(
      {
        proxyType: callObject.args?.proxy_type,
        index: callObject.args?.index,
        delay: callObject.args?.delay,
      },
      baseTxInfo.baseTxInfo,
      baseTxInfo.options,
    );
    return unsigned.method;
  }
}
