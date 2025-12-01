import { utils as FlareUtils, evmSerial, pvmSerial } from '@flarenetwork/flarejs';
import { BaseTransactionBuilderFactory, NotSupported } from '@bitgo/sdk-core';
import { FlareNetwork, BaseCoin as CoinConfig } from '@bitgo/statics';
import { TransactionBuilder } from './transactionBuilder';
import { ExportInPTxBuilder } from './ExportInPTxBuilder';
import { ImportInPTxBuilder } from './ImportInPTxBuilder';
import { ExportInCTxBuilder } from './ExportInCTxBuilder';
import { ImportInCTxBuilder } from './ImportInCTxBuilder';
import utils from './utils';

export class TransactionBuilderFactory extends BaseTransactionBuilderFactory {
  protected recoverSigner = false;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /** @inheritdoc */
  from(raw: string): TransactionBuilder {
    utils.validateRawTransaction(raw);
    const rawNoHex = utils.removeHexPrefix(raw);
    const rawBuffer = Buffer.from(rawNoHex, 'hex');
    let txSource: 'EVM' | 'PVM';

    const network = this._coinConfig.network as FlareNetwork;
    let tx: any;
    try {
      txSource = 'EVM';
      const evmManager = FlareUtils.getManagerForVM('EVM');
      tx = evmManager.unpackTransaction(rawBuffer);
      const blockchainId = tx.getBlockchainId();

      if (blockchainId === network.cChainBlockchainID) {
        console.log('Parsed as EVM transaction on C-Chain');
      }
    } catch (e) {
      txSource = 'PVM';
      const pvmManager = FlareUtils.getManagerForVM('PVM');
      tx = pvmManager.unpackTransaction(rawBuffer);
      const blockchainId = tx.getBlockchainId();

      if (blockchainId === network.blockchainID) {
        console.log('Parsed as PVM transaction on P-Chain');
      }
    }

    if (txSource === 'EVM') {
      if (ExportInCTxBuilder.verifyTxType(tx._type)) {
        const exportBuilder = this.getExportInCBuilder();
        exportBuilder.initBuilder(tx as evmSerial.ExportTx, rawBuffer);
        return exportBuilder;
      }
    } else if (txSource === 'PVM') {
      if (ImportInPTxBuilder.verifyTxType(tx._type)) {
        const importBuilder = this.getImportInPBuilder();
        importBuilder.initBuilder(tx as pvmSerial.ImportTx, rawBuffer);
        return importBuilder;
      }
    }
    throw new NotSupported('Transaction type not supported');
  }

  /** @inheritdoc */
  getTransferBuilder(): TransactionBuilder {
    throw new NotSupported('Transfer is not supported in P Chain');
  }

  /**
   * Export Cross chain transfer
   */
  getExportInPBuilder(): ExportInPTxBuilder {
    return new ExportInPTxBuilder(this._coinConfig);
  }

  /**
   * Import Cross chain transfer
   */
  getImportInPBuilder(): ImportInPTxBuilder {
    return new ImportInPTxBuilder(this._coinConfig);
  }

  /**
   * Import in C chain Cross chain transfer
   */
  getImportInCBuilder(): ImportInCTxBuilder {
    return new ImportInCTxBuilder(this._coinConfig);
  }

  /**
   * Export in C chain Cross chain transfer
   */
  getExportInCBuilder(): ExportInCTxBuilder {
    return new ExportInCTxBuilder(this._coinConfig);
  }

  /** @inheritdoc */
  getWalletInitializationBuilder(): TransactionBuilder {
    throw new NotSupported('Wallet initialization is not needed');
  }
}
