import { Transaction } from './transaction';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { TransactionType } from '@bitgo/sdk-core';
import {
  EntryFunctionABI,
  EntryFunctionArgumentTypes,
  InputGenerateTransactionPayloadData,
  SimpleEntryFunctionArgumentTypes,
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
  private _functionArguments: Array<EntryFunctionArgumentTypes | SimpleEntryFunctionArgumentTypes> = [];
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
    this.validateModuleName(params.moduleName);
    this.validateFunctionName(params.functionName);

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

    const moduleName = `${moduleAddress}::${moduleIdentifier}`;

    // Validate the extracted names using our existing validation
    this.validateModuleName(moduleName);
    this.validateFunctionName(functionIdentifier);

    this._moduleName = moduleName;
    this._functionName = functionIdentifier;

    // Extract type arguments and function arguments
    this._typeArguments = entryFunction.type_args.map((typeArg) => typeArg.toString());
    this._functionArguments = entryFunction.args as Array<
      EntryFunctionArgumentTypes | SimpleEntryFunctionArgumentTypes
    >;
  }

  /**
   * Generate the transaction payload data for the custom transaction
   *
   * @returns {InputGenerateTransactionPayloadData} The transaction payload data
   */
  protected getTransactionPayloadData(): InputGenerateTransactionPayloadData {
    const functionName = this.getValidatedFullFunctionName();

    return {
      function: functionName,
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

  /**
   * Validate module name format
   *
   * @param {string} moduleName - Module name to validate
   * @throws {Error} If module name format is invalid
   */
  private validateModuleName(moduleName: string): void {
    if (!moduleName || typeof moduleName !== 'string') {
      throw new Error('Module name is required and must be a non-empty string');
    }

    // Aptos module name format: address::module_name
    // Supports both SHORT (0x1) and LONG (0x0000...0001) address formats
    // Also supports named addresses (resolved at deployment time)
    const moduleNamePattern = /^(0x[a-fA-F0-9]{1,64}|[a-zA-Z_][a-zA-Z0-9_]*)::[a-zA-Z_][a-zA-Z0-9_]*$/;
    if (!moduleNamePattern.test(moduleName)) {
      throw new Error(
        `Invalid module name format: "${moduleName}". Expected format: "0xaddress::module_name" or "named_address::module_name"`
      );
    }
  }

  /**
   * Validate function name format
   *
   * @param {string} functionName - Function name to validate
   * @throws {Error} If function name format is invalid
   */
  private validateFunctionName(functionName: string): void {
    if (!functionName || typeof functionName !== 'string') {
      throw new Error('Function name is required and must be a non-empty string');
    }

    // Aptos function name pattern: valid identifier (letters, numbers, underscores, starting with letter/underscore)
    const functionNamePattern = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
    if (!functionNamePattern.test(functionName)) {
      throw new Error(
        `Invalid function name format: "${functionName}". Function names must be valid identifiers (letters, numbers, underscores, starting with letter or underscore)`
      );
    }
  }

  /**
   * Override the deprecated recipient getter to handle custom transactions gracefully
   * Custom transactions may not have traditional recipients
   *
   * @deprecated - use `recipients()`
   */
  get recipient(): any {
    // For custom transactions, return a placeholder recipient if no recipients exist
    if (this._recipients.length === 0) {
      return {
        address: '', // Empty address for custom transactions
        amount: '0',
      };
    }
    return this._recipients[0];
  }

  /**
   * Get validated full function name with runtime format checking
   *
   * @returns {string} The validated full function name
   * @throws {Error} If function name format is invalid
   */
  private getValidatedFullFunctionName(): `${string}::${string}::${string}` {
    if (!this._moduleName || !this._functionName) {
      throw new Error('Module name and function name must be set before building transaction');
    }

    const fullName = `${this._moduleName}::${this._functionName}`;

    // Runtime validation of the expected format
    // Supports both hex addresses (SHORT/LONG) and named addresses
    const fullFunctionPattern =
      /^(0x[a-fA-F0-9]{1,64}|[a-zA-Z_][a-zA-Z0-9_]*)::[a-zA-Z_][a-zA-Z0-9_]*::[a-zA-Z_][a-zA-Z0-9_]*$/;
    if (!fullFunctionPattern.test(fullName)) {
      throw new Error(`Invalid full function name format: "${fullName}". Expected format: "address::module::function"`);
    }

    return fullName as `${string}::${string}::${string}`;
  }
}
