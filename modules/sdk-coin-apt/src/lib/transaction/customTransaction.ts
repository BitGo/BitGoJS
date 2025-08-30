import { Transaction } from './transaction';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { TransactionType } from '@bitgo/sdk-core';
import {
  EntryFunctionABI,
  InputGenerateTransactionPayloadData,
  TransactionPayload,
  TransactionPayloadEntryFunction,
} from '@aptos-labs/ts-sdk';
import { CustomTransactionParams } from '../iface';

/**
 * Transaction class for custom Aptos transactions with entry function payloads.
 */
export class CustomTransaction extends Transaction {
  private _moduleName: string;
  private _functionName: string;
  private _typeArguments: string[] = [];
  private _functionArguments: any[] = [];
  private _entryFunctionAbi?: EntryFunctionABI;

  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
    this._type = TransactionType.CustomTx;
  }

  /**
   * Set the custom transaction parameters
   *
   * @param {CustomTransactionParams} params - Custom transaction parameters
   */
  setCustomTransactionParams(params: CustomTransactionParams): void {
    this._moduleName = params.moduleName;
    this._functionName = params.functionName;
    this._typeArguments = params.typeArguments || [];
    this._functionArguments = params.functionArguments || [];
  }

  /**
   * Set the entry function ABI
   *
   * @param {EntryFunctionABI} abi - The ABI definition for the entry function
   */
  setEntryFunctionAbi(abi: EntryFunctionABI): void {
    this._entryFunctionAbi = abi;
  }

  /**
   * Get the full function name in the format moduleName::functionName
   *
   * @returns {string} The full function name
   */
  get fullFunctionName(): string {
    if (!this._moduleName || !this._functionName) {
      return '';
    }
    return `${this._moduleName}::${this._functionName}`;
  }

  /**
   * Parse a transaction payload to extract the custom transaction data
   *
   * @param {TransactionPayload} payload - The transaction payload to parse
   */
  protected parseTransactionPayload(payload: TransactionPayload): void {
    if (!(payload instanceof TransactionPayloadEntryFunction)) {
      throw new Error('Expected entry function payload for custom transaction');
    }

    const entryFunction = payload.entryFunction;

    // Extract function data
    const moduleAddress = entryFunction.module_name.address.toString();
    const moduleIdentifier = entryFunction.module_name.name.identifier;
    const functionIdentifier = entryFunction.function_name.identifier;

    this._moduleName = `${moduleAddress}::${moduleIdentifier}`;
    this._functionName = functionIdentifier;

    // Extract type arguments and function arguments
    this._typeArguments = entryFunction.type_args.map((typeArg) => typeArg.toString());
    this._functionArguments = entryFunction.args;
  }

  /**
   * Generate the transaction payload data for the custom transaction
   *
   * @returns {InputGenerateTransactionPayloadData} The transaction payload data
   */
  protected getTransactionPayloadData(): InputGenerateTransactionPayloadData {
    return {
      function: this.fullFunctionName as `${string}::${string}::${string}`,
      typeArguments: this._typeArguments,
      functionArguments: this._functionArguments,
      abi: this._entryFunctionAbi,
    };
  }

  /**
   * Get the custom transaction parameters
   *
   * @returns {CustomTransactionParams} The custom transaction parameters
   */
  getCustomTransactionParams(): CustomTransactionParams {
    return {
      moduleName: this._moduleName || '',
      functionName: this._functionName || '',
      typeArguments: this._typeArguments,
      functionArguments: this._functionArguments,
    };
  }
}
