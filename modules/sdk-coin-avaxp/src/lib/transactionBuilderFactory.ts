import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BaseTransactionBuilderFactory, NotSupported } from '@bitgo/sdk-core';
import { TransactionBuilder } from './transactionBuilder';
import { ValidatorTxBuilder } from './validatorTxBuilder';
import { Tx } from 'avalanche/dist/apis/platformvm';
import { Buffer as BufferAvax } from 'avalanche';
import utils from './utils';
import { ExportTxBuilder } from './exportTxBuilder';

export class TransactionBuilderFactory extends BaseTransactionBuilderFactory {
  protected recoverSigner = false;
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /** @inheritdoc */
  from(raw: string): TransactionBuilder {
    utils.validateRawTransaction(raw);
    const tx = new Tx();
    tx.fromBuffer(BufferAvax.from(raw, 'hex'));
    let transactionBuilder: TransactionBuilder;
    if (ValidatorTxBuilder.verifyTxType(tx.getUnsignedTx().getTransaction())) {
      transactionBuilder = this.getValidatorBuilder();
    } else if (ExportTxBuilder.verifyTxType(tx.getUnsignedTx().getTransaction())) {
      transactionBuilder = this.getExportBuilder();
    } else {
      throw new NotSupported('Transaction cannot be parsed or has an unsupported transaction type');
    }
    transactionBuilder.initBuilder(tx);
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

  getWalletInitializationBuilder(): TransactionBuilder {
    throw new NotSupported('Wallet initialization is not needed');
  }
}
