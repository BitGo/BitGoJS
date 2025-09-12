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
import { validateModuleName, validateFunctionName } from '../utils/validation';

/**
 * Transaction class for custom Aptos transactions with entry function payloads.
 */
export class CustomTransaction extends Transaction {
  private _moduleName: string;
  private _functionName: string;
  private _typeArguments: string[] = [];
  private _functionArguments: Array<EntryFunctionArgumentTypes | SimpleEntryFunctionArgumentTypes> = [];
  private _entryFunctionAbi: EntryFunctionABI;

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
    validateModuleName(params.moduleName);
    validateFunctionName(params.functionName);
    this.validateAbi(params.abi);

    this._moduleName = params.moduleName;
    this._functionName = params.functionName;
    this._typeArguments = params.typeArguments || [];
    this._functionArguments = params.functionArguments || [];
    this._entryFunctionAbi = params.abi;
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
    validateModuleName(moduleName);
    validateFunctionName(functionIdentifier);

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
      abi: this._entryFunctionAbi,
    };
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

  /**
   * Validate ABI structure and provide helpful error messages
   *
   * @param {EntryFunctionABI} abi - The ABI to validate
   * @throws {Error} If ABI format is invalid
   */
  private validateAbi(abi: EntryFunctionABI): void {
    if (!abi || typeof abi !== 'object') {
      throw new Error('ABI must be a valid EntryFunctionABI object');
    }

    if (!Array.isArray(abi.typeParameters)) {
      throw new Error('ABI must have a typeParameters array. Use [] if the function has no type parameters');
    }

    if (!Array.isArray(abi.parameters)) {
      throw new Error('ABI must have a parameters array containing TypeTag objects for each function parameter');
    }
  }
}
