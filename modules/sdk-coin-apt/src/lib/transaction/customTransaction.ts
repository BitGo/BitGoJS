import { Transaction } from './transaction';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { InvalidTransactionError, TransactionType } from '@bitgo/sdk-core';
import {
  EntryFunctionABI,
  EntryFunctionArgumentTypes,
  SimpleEntryFunctionArgumentTypes,
  InputGenerateTransactionPayloadData,
  TransactionPayload,
  TransactionPayloadEntryFunction,
  AccountAddress,
  TypeTagAddress,
  TypeTagBool,
  TypeTagU8,
  TypeTagU16,
  TypeTagU32,
  TypeTagU64,
  TypeTagU128,
  TypeTagU256,
} from '@aptos-labs/ts-sdk';
import { CustomTransactionParams } from '../iface';
import { validateModuleName, validateFunctionName } from '../utils/validation';
import utils from '../utils';

/**
 * Transaction class for custom Aptos transactions.
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
   */
  setCustomTransactionParams(params: CustomTransactionParams): void {
    validateModuleName(params.moduleName);
    validateFunctionName(params.functionName);

    this._moduleName = params.moduleName;
    this._functionName = params.functionName;
    this._typeArguments = params.typeArguments || [];
    this._functionArguments = params.functionArguments || [];
    this._entryFunctionAbi = params.abi;
  }

  /**
   * Set the entry function ABI
   */
  setEntryFunctionAbi(abi: EntryFunctionABI): void {
    this._entryFunctionAbi = abi;
  }

  /**
   * Get the full function name
   */
  get fullFunctionName(): string {
    if (!this._moduleName || !this._functionName) {
      return '';
    }
    return `${this._moduleName}::${this._functionName}`;
  }

  /**
   * Parse a transaction payload to extract the custom transaction data
   * Requires ABI information for proper type-aware conversion
   *
   * @param {TransactionPayload} payload - The transaction payload to parse
   */
  protected parseTransactionPayload(payload: TransactionPayload): void {
    if (!(payload instanceof TransactionPayloadEntryFunction)) {
      throw new InvalidTransactionError('Expected entry function payload for custom transaction');
    }

    const entryFunction = payload.entryFunction;

    // Extract function data
    const moduleAddress = entryFunction.module_name.address.toString();
    const moduleIdentifier = entryFunction.module_name.name.identifier;
    const functionIdentifier = entryFunction.function_name.identifier;

    const moduleName = `${moduleAddress}::${moduleIdentifier}`;

    // Validate
    validateModuleName(moduleName);
    validateFunctionName(functionIdentifier);

    this._moduleName = moduleName;
    this._functionName = functionIdentifier;
    this._typeArguments = entryFunction.type_args.map((typeArg) => typeArg.toString());

    // Parse arguments using ABI information
    // If ABI is available, parse with type awareness; otherwise store raw args for later processing
    if (this._entryFunctionAbi?.parameters) {
      this._functionArguments = entryFunction.args.map((arg: any, index: number) => {
        const paramType = this._entryFunctionAbi?.parameters?.[index];
        if (!paramType) {
          throw new InvalidTransactionError(
            `Missing ABI parameter type for argument ${index} in ${this._moduleName}::${this._functionName}. ` +
              'ABI parameter count mismatch.'
          );
        }
        return this.convertArgumentByABI(arg, paramType);
      });
    } else {
      // Store raw arguments temporarily - transaction will be re-parsed when ABI is provided
      this._functionArguments = entryFunction.args.map((arg: any) => arg);
    }
  }

  /**
   * Generate transaction payload data
   */
  protected getTransactionPayloadData(): InputGenerateTransactionPayloadData {
    const functionName = this.getValidatedFullFunctionName();

    // Arguments are pre-processed during parsing phase
    const processedArguments = this._functionArguments;

    return {
      function: functionName,
      typeArguments: this._typeArguments,
      functionArguments: processedArguments,
      abi: this._entryFunctionAbi,
    } as InputGenerateTransactionPayloadData;
  }

  /**
   * Convert argument based on ABI type information
   */
  private convertArgumentByABI(arg: any, paramType: any): any {
    // Helper function to convert bytes to hex string
    const bytesToHex = (bytes: number[]): string => {
      return '0x' + bytes.map((b) => b.toString(16).padStart(2, '0')).join('');
    };

    // Helper function to try converting a hex string to an AccountAddress
    const tryToAddress = (hexStr: string): any => {
      try {
        return AccountAddress.fromString(hexStr);
      } catch {
        return hexStr;
      }
    };

    // Handle primitive values (string, number, boolean)
    if (typeof arg === 'string' || typeof arg === 'number' || typeof arg === 'boolean') {
      // Address conversion for hex strings
      if (paramType instanceof TypeTagAddress && typeof arg === 'string' && arg.startsWith('0x')) {
        return tryToAddress(arg);
      }

      // Type conversions based on parameter type
      if (paramType instanceof TypeTagBool) return Boolean(arg);
      if (paramType instanceof TypeTagU8 || paramType instanceof TypeTagU16 || paramType instanceof TypeTagU32)
        return Number(arg);
      if (paramType instanceof TypeTagU64 || paramType instanceof TypeTagU128 || paramType instanceof TypeTagU256)
        return String(arg);

      return arg;
    }

    // Handle BCS-encoded data with 'data' property
    if (arg && typeof arg === 'object' && 'data' in arg && arg.data) {
      const bytes = Array.from(arg.data) as number[];
      const hexString = bytesToHex(bytes);

      return paramType instanceof TypeTagAddress ? tryToAddress(hexString) : hexString;
    }

    // Handle nested BCS structures with 'value' property
    if (arg && typeof arg === 'object' && 'value' in arg && arg.value) {
      // Check if inner value is a Uint8Array (common for U64 arguments)
      if (arg.value.value && arg.value.value instanceof Uint8Array) {
        const bytes = Array.from(arg.value.value) as number[];
        if (this.isNumericType(paramType)) {
          return this.convertNumericArgument(bytes, paramType);
        }
        // For non-numeric types, convert to hex string
        return bytesToHex(bytes);
      }

      // Simple value wrapper
      if (!('value' in arg.value) || typeof arg.value.value !== 'object') {
        return this.convertArgumentByABI(arg.value, paramType);
      }

      // Double nested structure with numeric keys
      const bytesObj = arg.value.value;
      const keys = Object.keys(bytesObj)
        .filter((k) => !isNaN(parseInt(k, 10)))
        .sort((a, b) => parseInt(a, 10) - parseInt(b, 10));

      if (keys.length === 0) return arg;

      const bytes = keys.map((k) => bytesObj[k]);
      let extractedValue: any;

      // Convert bytes based on parameter type using unified approach
      if (this.isNumericType(paramType)) {
        extractedValue = this.convertNumericArgument(bytes, paramType);
      } else if (paramType instanceof TypeTagAddress) {
        extractedValue = bytesToHex(bytes);
      } else if (paramType instanceof TypeTagBool) {
        extractedValue = bytes[0] === 1;
      } else {
        extractedValue = bytesToHex(bytes);
      }

      return this.convertArgumentByABI(extractedValue, paramType);
    }

    // For anything else, return as-is
    return arg;
  }

  /**
   * Get custom transaction parameters
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
   * Override recipient getter for custom transactions
   */
  get recipient(): any {
    if (this._recipients.length === 0) {
      return {
        address: '',
        amount: '0',
      };
    }
    return this._recipients[0];
  }

  /**
   * Get validated full function name
   */
  private getValidatedFullFunctionName(): `${string}::${string}::${string}` {
    if (!this._moduleName || !this._functionName) {
      throw new Error('Module name and function name must be set before building transaction');
    }

    const fullName = `${this._moduleName}::${this._functionName}`;

    // Basic validation
    const fullFunctionPattern =
      /^(0x[a-fA-F0-9]{1,64}|[a-zA-Z_][a-zA-Z0-9_]*)::[a-zA-Z_][a-zA-Z0-9_]*::[a-zA-Z_][a-zA-Z0-9_]*$/;
    if (!fullFunctionPattern.test(fullName)) {
      throw new Error(`Invalid full function name format: "${fullName}". Expected format: "address::module::function"`);
    }

    return fullName as `${string}::${string}::${string}`;
  }

  /**
   * Check if a parameter type is a numeric type
   */
  private isNumericType(paramType: any): boolean {
    return (
      paramType instanceof TypeTagU8 ||
      paramType instanceof TypeTagU16 ||
      paramType instanceof TypeTagU32 ||
      paramType instanceof TypeTagU64 ||
      paramType instanceof TypeTagU128 ||
      paramType instanceof TypeTagU256
    );
  }

  /**
   * Convert numeric argument using consistent little-endian byte handling
   */
  private convertNumericArgument(bytes: number[], paramType: any): any {
    if (paramType instanceof TypeTagU8 || paramType instanceof TypeTagU16 || paramType instanceof TypeTagU32) {
      // Small integers: use Number for compatibility
      let result = 0;
      for (let i = bytes.length - 1; i >= 0; i--) {
        result = result * 256 + bytes[i];
      }
      return result;
    }

    if (paramType instanceof TypeTagU64 || paramType instanceof TypeTagU128 || paramType instanceof TypeTagU256) {
      // Large integers: reuse the existing utility method
      return utils.getAmountFromPayloadArgs(new Uint8Array(bytes));
    }

    // Fallback for unexpected numeric types
    return '0x' + bytes.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
}
