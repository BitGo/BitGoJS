import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { AtomicTransactionBuilder } from './atomicTransactionBuilder';
import { ImportInCTxBuilder } from './importInCTxBuilder';
import { ValidatorTxBuilder } from './validatorTxBuilder';
import { PermissionlessValidatorTxBuilder } from './permissionlessValidatorTxBuilder';
import { ExportInCTxBuilder } from './exportInCTxBuilder';
import { ExportInPTxBuilder } from './exportInPTxBuilder';
import { ImportInPTxBuilder } from './importInPTxBuilder';

/**
 * Factory for Flare P-chain transaction builders
 */
export class TransactionBuilderFactory {
  protected _coinConfig: Readonly<CoinConfig>;

  constructor(coinConfig: Readonly<CoinConfig>) {
    this._coinConfig = coinConfig;
  }

  /**
   * Create a transaction builder from a hex string
   * @param txHex - Transaction hex string
   */
  from(txHex: string): AtomicTransactionBuilder {
    // TODO: Parse the hex and determine transaction type, then return appropriate builder
    // For now, return a basic export builder as that's the most common use case
    if (!txHex) {
      throw new Error('Transaction hex is required');
    }

    // Create a mock export builder for now
    // In the future, this will parse the transaction and determine the correct type
    const builder = new ExportInPTxBuilder(this._coinConfig);

    // Initialize with the hex data (placeholder)
    builder.initBuilder({ txHex });

    return builder;
  }

  /**
   * Initialize Validator builder
   *
   * @returns {ValidatorTxBuilder} the builder initialized
   */
  getValidatorBuilder(): ValidatorTxBuilder {
    return new ValidatorTxBuilder(this._coinConfig);
  }

  /**
   * Initialize Permissionless Validator builder
   *
   * @returns {PermissionlessValidatorTxBuilder} the builder initialized
   */
  getPermissionlessValidatorTxBuilder(): PermissionlessValidatorTxBuilder {
    return new PermissionlessValidatorTxBuilder(this._coinConfig);
  }

  /**
   * Export Cross chain transfer
   *
   * @returns {ExportInPTxBuilder} the builder initialized
   */
  getExportBuilder(): ExportInPTxBuilder {
    return new ExportInPTxBuilder(this._coinConfig);
  }

  /**
   * Import Cross chain transfer
   *
   * @returns {ImportInPTxBuilder} the builder initialized
   */
  getImportBuilder(): ImportInPTxBuilder {
    return new ImportInPTxBuilder(this._coinConfig);
  }

  /**
   * Import in C chain Cross chain transfer
   *
   * @returns {ImportInCTxBuilder} the builder initialized
   */
  getImportInCBuilder(): ImportInCTxBuilder {
    return new ImportInCTxBuilder(this._coinConfig);
  }

  /**
   * Export in C chain Cross chain transfer
   *
   * @returns {ExportInCTxBuilder} the builder initialized
   */
  getExportInCBuilder(): ExportInCTxBuilder {
    return new ExportInCTxBuilder(this._coinConfig);
  }
}
