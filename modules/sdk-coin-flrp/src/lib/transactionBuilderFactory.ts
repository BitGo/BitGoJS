import { utils as FlareUtils, evmSerial } from '@flarenetwork/flarejs';
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

    // const manager = FlareUtils.getManagerForVM("EVM")
    // const parsedTx = manager.unpackTransaction(rawBuffer)

    // Get network IDs
    const network = this._coinConfig.network as FlareNetwork;
    try {
      txSource = 'EVM';
      const evmManager = FlareUtils.getManagerForVM('EVM');
      const tx = evmManager.unpackTransaction(rawBuffer);
      const blockchainId = tx.getBlockchainId();

      if (blockchainId === network.cChainBlockchainID) {
        console.log('Parsed as EVM transaction on C-Chain');
      }

      if (txSource === 'EVM') {
        if (ExportInCTxBuilder.verifyTxType(tx._type)) {
          const exportBuilder = this.getExportInCBuilder();
          exportBuilder.initBuilder(tx as evmSerial.ExportTx, rawBuffer);
          return exportBuilder;
        }
      }
    } catch (e) {
      console.log('error while parsing tx: ', e.message);
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
  getExportBuilder(): ExportInPTxBuilder {
    return new ExportInPTxBuilder(this._coinConfig);
  }

  /**
   * Import Cross chain transfer
   */
  getImportBuilder(): ImportInPTxBuilder {
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
