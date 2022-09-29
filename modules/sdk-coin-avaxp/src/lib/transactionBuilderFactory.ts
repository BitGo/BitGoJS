import { AvalancheNetwork, BaseCoin as CoinConfig } from '@bitgo/statics';
import { BaseTransactionBuilderFactory, NotSupported } from '@bitgo/sdk-core';
import { TransactionBuilder } from './transactionBuilder';
import { ValidatorTxBuilder } from './validatorTxBuilder';
import { Tx } from 'avalanche/dist/apis/platformvm';
import { Tx as EVMTx } from 'avalanche/dist/apis/evm';
import { Buffer as BufferAvax } from 'avalanche';
import utils from './utils';
import { ExportTxBuilder } from './exportTxBuilder';
import { ImportTxBuilder } from './importTxBuilder';
import { ImportInCTxBuilder } from './importInCTxBuilder';
import { ExportInCTxBuilder } from './exportInCTxBuilder';

export class TransactionBuilderFactory extends BaseTransactionBuilderFactory {
  protected recoverSigner = false;
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /** @inheritdoc */
  from(raw: string): TransactionBuilder {
    utils.validateRawTransaction(raw);
    raw = utils.removeHexPrefix(raw);
    let txSource: 'EVM' | 'PVM' = 'PVM';
    let tx: Tx | EVMTx;
    let transactionBuilder: TransactionBuilder | undefined = undefined;

    try {
      tx = new Tx();
      // could throw an error if a txType doesn't match.
      tx.fromBuffer(BufferAvax.from(raw, 'hex'));

      if (!utils.isTransactionOf(tx, (this._coinConfig.network as AvalancheNetwork).blockchainID)) {
        throw new Error('It is not a transaction of this network');
      }
    } catch {
      txSource = 'EVM';
      tx = new EVMTx();
      tx.fromBuffer(BufferAvax.from(raw, 'hex'));

      if (!utils.isTransactionOf(tx, (this._coinConfig.network as AvalancheNetwork).cChainBlockchainID)) {
        throw new Error('It is not a transaction of this network or C chain');
      }
    }
    if (txSource === 'PVM') {
      if (ValidatorTxBuilder.verifyTxType(tx.getUnsignedTx().getTransaction())) {
        transactionBuilder = this.getValidatorBuilder();
      } else if (ExportTxBuilder.verifyTxType(tx.getUnsignedTx().getTransaction())) {
        transactionBuilder = this.getExportBuilder();
      } else if (ImportTxBuilder.verifyTxType(tx.getUnsignedTx().getTransaction())) {
        transactionBuilder = this.getImportBuilder();
      }
    } else if (txSource === 'EVM') {
      if (ImportInCTxBuilder.verifyTxType(tx.getUnsignedTx().getTransaction())) {
        transactionBuilder = this.getImportInCBuilder();
      } else if (ExportInCTxBuilder.verifyTxType(tx.getUnsignedTx().getTransaction())) {
        transactionBuilder = this.getExportInCBuilder();
      }
    }
    if (transactionBuilder === undefined) {
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
