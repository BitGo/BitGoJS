import { utils as FlareUtils, evmSerial, pvmSerial, Credential } from '@flarenetwork/flarejs';
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

  /**
   * Extract credentials from remaining bytes after transaction using FlareJS codec.
   * This is the proper way to parse credentials - using the codec's UnpackPrefix method.
   * @param credentialBytes Remaining bytes after the transaction (starts with numCredentials)
   * @param codec The FlareJS codec to use for unpacking
   * @returns Array of parsed credentials
   */
  private extractCredentialsWithCodec(credentialBytes: Uint8Array, codec: any): Credential[] {
    const credentials: Credential[] = [];
    if (credentialBytes.length < 4) {
      return credentials;
    }

    // Skip the first 4 bytes (numCredentials as Int type)
    // The codec doesn't know about this Int, so we skip it manually
    let remainingBytes: Uint8Array = credentialBytes.slice(4);
    let moreCredentials = true;

    do {
      try {
        const unpacked = codec.UnpackPrefix(remainingBytes);
        credentials.push(unpacked[0] as Credential);
        remainingBytes = unpacked[1] as Uint8Array;
      } catch (e) {
        moreCredentials = false;
      }
    } while (remainingBytes.length > 0 && moreCredentials);

    return credentials;
  }

  /** @inheritdoc */
  from(raw: string): TransactionBuilder {
    utils.validateRawTransaction(raw);
    const rawNoHex = utils.removeHexPrefix(raw);
    const rawBuffer = Buffer.from(rawNoHex, 'hex');
    let txSource: 'EVM' | 'PVM';

    const network = this._coinConfig.network as FlareNetwork;
    let tx: any;
    let credentials: Credential[] = [];

    try {
      txSource = 'EVM';
      const evmManager = FlareUtils.getManagerForVM('EVM');

      // Use getCodecFromBuffer to get both codec and remaining bytes
      const [codec, txBytes] = evmManager.getCodecFromBuffer(rawBuffer);
      // UnpackPrefix returns [transaction, remainingBytes]
      const [transaction, credentialBytes] = codec.UnpackPrefix(txBytes) as [any, Uint8Array];
      tx = transaction;

      // Extract credentials from remaining bytes using codec
      if (credentialBytes.length > 4) {
        credentials = this.extractCredentialsWithCodec(credentialBytes, codec);
      }

      const blockchainId = tx.getBlockchainId();
      if (blockchainId === network.cChainBlockchainID) {
        console.log('Parsed as EVM transaction on C-Chain');
      }
    } catch (e) {
      txSource = 'PVM';
      const pvmManager = FlareUtils.getManagerForVM('PVM');

      // Use getCodecFromBuffer to get both codec and remaining bytes
      const [codec, txBytes] = pvmManager.getCodecFromBuffer(rawBuffer);
      // UnpackPrefix returns [transaction, remainingBytes]
      const [transaction, credentialBytes] = codec.UnpackPrefix(txBytes) as [any, Uint8Array];
      tx = transaction;

      // Extract credentials from remaining bytes using codec
      if (credentialBytes.length > 4) {
        credentials = this.extractCredentialsWithCodec(credentialBytes, codec);
      }

      const blockchainId = tx.getBlockchainId();
      if (blockchainId === network.blockchainID) {
        console.log('Parsed as PVM transaction on P-Chain');
      }
    }

    if (txSource === 'EVM') {
      if (ExportInCTxBuilder.verifyTxType(tx._type)) {
        const exportBuilder = this.getExportInCBuilder();
        exportBuilder.initBuilder(tx as evmSerial.ExportTx, rawBuffer, credentials);
        return exportBuilder;
      } else if (ImportInCTxBuilder.verifyTxType(tx._type)) {
        const importBuilder = this.getImportInCBuilder();
        importBuilder.initBuilder(tx as evmSerial.ImportTx, rawBuffer, credentials);
        return importBuilder;
      }
    } else if (txSource === 'PVM') {
      if (ImportInPTxBuilder.verifyTxType(tx._type)) {
        const importBuilder = this.getImportInPBuilder();
        importBuilder.initBuilder(tx as pvmSerial.ImportTx, rawBuffer, credentials);
        return importBuilder;
      } else if (ExportInPTxBuilder.verifyTxType(tx._type)) {
        const exportBuilder = this.getExportInPBuilder();
        exportBuilder.initBuilder(tx as pvmSerial.ExportTx, rawBuffer, credentials);
        return exportBuilder;
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
