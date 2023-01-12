import { BaseCoin as CoinConfig, AVAXPCoin } from '@bitgo/statics';
import { BaseTransactionBuilderFactory, NotSupported } from '@bitgo/sdk-core';
import { TransactionBuilder } from './transactionBuilder';
import { ValidatorTxBuilder } from './validatorTxBuilder';
import { ExportTxBuilder } from './exportTxBuilder';
import { ImportTxBuilder } from './importTxBuilder';
import { ImportInCTxBuilder } from './importInCTxBuilder';
import { ExportInCTxBuilder } from './exportInCTxBuilder';

export class TransactionBuilderFactory extends BaseTransactionBuilderFactory {
  protected _coinConfig: Readonly<AVAXPCoin>;

  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig as Readonly<AVAXPCoin>);
  }

  /** @inheritdoc */
  from(raw: string): TransactionBuilder {
    const transactionBuilder = new TransactionBuilder(this._coinConfig);
    transactionBuilder.from(raw);
    return transactionBuilder;
  }

  /** @inheritdoc */
  getTransferBuilder(): TransactionBuilder {
    throw new NotSupported('Transfer is not supported in P Chain');
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
   * Export Cross chain transfer
   *
   * @returns {ExportTxBuilder} the builder initialized
   */
  getExportBuilder(): ExportTxBuilder {
    return new ExportTxBuilder(this._coinConfig);
  }

  /**
   * Import Cross chain transfer
   *
   * @returns {ImportTxBuilder} the builder initialized
   */
  getImportBuilder(): ImportTxBuilder {
    return new ImportTxBuilder(this._coinConfig);
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

  /** @inheritdoc */
  getWalletInitializationBuilder(): TransactionBuilder {
    throw new NotSupported('Wallet initialization is not needed');
  }
}
