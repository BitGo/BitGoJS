import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BaseTransactionBuilderFactory, NotSupported } from '@bitgo/sdk-core';
import { TransactionBuilder } from './transactionBuilder';
import { ValidatorTxBuilder } from './validatorTxBuilder';
import utils from './utils';
import { ExportTxBuilder } from './exportTxBuilder';
import { SignerTransactionBuilder } from './signerTransactionBuilder';

export class TransactionBuilderFactory extends BaseTransactionBuilderFactory {
  protected recoverSigner = false;
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /** @inheritdoc */
  from(raw: string): SignerTransactionBuilder {
    utils.validateRawTransaction(raw);
    const transactionBuilder = new SignerTransactionBuilder(this._coinConfig);
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

  /** @inheritdoc */
  getWalletInitializationBuilder(): TransactionBuilder {
    throw new NotSupported('Wallet initialization is not needed');
  }
}
