import { BuildTransactionError, TransactionType } from '@bitgo-beta/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo-beta/statics';
import { EntryFunctionABI, TransactionPayload, TransactionPayloadEntryFunction } from '@aptos-labs/ts-sdk';
import { Transaction } from '../transaction/transaction';
import { TransactionBuilder } from './transactionBuilder';
import { CustomTransaction } from '../transaction/customTransaction';
import { CustomTransactionParams } from '../iface';
import { isValidModuleName, isValidFunctionName } from '../utils/validation';

/**
 * Builder for Aptos custom transactions.
 * Allows building transactions with any entry function call.
 */
export class CustomTransactionBuilder extends TransactionBuilder {
  protected _transaction: CustomTransaction;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._transaction = new CustomTransaction(_coinConfig);
  }

  /**
   * @returns {TransactionType} The transaction type
   */
  protected get transactionType(): TransactionType {
    return TransactionType.CustomTx;
  }

  /**
   * Set the custom transaction parameters
   *
   * @param {CustomTransactionParams} params - Custom transaction parameters
   * @returns {CustomTransactionBuilder} The builder instance
   */
  customTransaction(params: CustomTransactionParams): CustomTransactionBuilder {
    if (!params.moduleName) {
      throw new BuildTransactionError('Missing module name');
    }

    if (!params.functionName) {
      throw new BuildTransactionError('Missing function name');
    }

    this._transaction.setCustomTransactionParams(params);
    return this;
  }

  /**
   * Set the entry function ABI
   *
   * @param {EntryFunctionABI} abi - The ABI definition for the entry function
   * @returns {CustomTransactionBuilder} The builder instance
   */
  entryFunctionAbi(abi: EntryFunctionABI): CustomTransactionBuilder {
    this._transaction.setEntryFunctionAbi(abi);
    return this;
  }

  /**
   * @inheritdoc
   */
  assetId(assetId: string): TransactionBuilder {
    // Asset ID is optional for custom transactions
    this._transaction.assetId = assetId;
    return this;
  }

  /**
   * Check if a transaction payload is valid for this builder
   *
   * @param {TransactionPayload} payload - The transaction payload to check
   * @returns {boolean} True if the payload is valid for this builder
   */
  protected isValidTransactionPayload(payload: TransactionPayload): boolean {
    // Basic payload type check
    if (!(payload instanceof TransactionPayloadEntryFunction)) {
      return false;
    }
    try {
      const entryFunction = payload.entryFunction;
      // Validate module and function identifiers
      const moduleAddress = entryFunction.module_name.address.toString();
      const moduleIdentifier = entryFunction.module_name.name.identifier;
      const functionIdentifier = entryFunction.function_name.identifier;
      const moduleName = `${moduleAddress}::${moduleIdentifier}`;

      if (!isValidModuleName(moduleName) || !isValidFunctionName(functionIdentifier)) {
        return false;
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Initialize the builder from an existing transaction
   *
   * @param {Transaction} tx - The transaction to initialize from
   */
  initBuilder(tx: Transaction): void {
    super.initBuilder(tx);

    if (tx instanceof CustomTransaction) {
      const params = tx.getCustomTransactionParams();
      // Only set custom transaction params if they are defined
      if (params.moduleName && params.functionName) {
        this.customTransaction(params);
      }
    }
  }

  /**
   * Build the transaction
   *
   * @returns {Promise<CustomTransaction>} The built transaction
   */
  async build(): Promise<CustomTransaction> {
    const params = (this._transaction as CustomTransaction).getCustomTransactionParams();
    if (!params.moduleName || !params.functionName) {
      throw new BuildTransactionError('Missing required module or function name');
    }

    return (await super.build()) as CustomTransaction;
  }

  /**
   * Get the transaction builder instance from an existing transaction
   *
   * @param {Transaction} tx - The transaction to convert
   * @returns {TransactionBuilder} The transaction builder
   */
  from(tx: Transaction): TransactionBuilder {
    if (!(tx instanceof CustomTransaction)) {
      throw new BuildTransactionError('Invalid transaction type');
    }

    this.initBuilder(tx);
    return this;
  }
}
