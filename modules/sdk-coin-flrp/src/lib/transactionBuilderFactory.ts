import { utils as FlareUtils, evmSerial, pvmSerial, Credential } from '@flarenetwork/flarejs';
import { BaseTransactionBuilderFactory, NotSupported } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { TransactionBuilder } from './transactionBuilder';
import { ExportInPTxBuilder } from './ExportInPTxBuilder';
import { ImportInPTxBuilder } from './ImportInPTxBuilder';
import { ExportInCTxBuilder } from './ExportInCTxBuilder';
import { ImportInCTxBuilder } from './ImportInCTxBuilder';
import { PermissionlessDelegatorTxBuilder } from './permissionlessDelegatorTxBuilder';
import { SerializedTx } from './iface';
import utils from './utils';

interface Codec {
  UnpackPrefix<T>(bytes: Uint8Array): [T, Uint8Array];
}

export class TransactionBuilderFactory extends BaseTransactionBuilderFactory {
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
  private extractCredentialsWithCodec(credentialBytes: Uint8Array, codec: Codec): Credential[] {
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
        const [credential, rest] = codec.UnpackPrefix<Credential>(remainingBytes);
        credentials.push(credential);
        remainingBytes = rest;
      } catch {
        moreCredentials = false;
      }
    } while (remainingBytes.length > 0 && moreCredentials);

    return credentials;
  }

  /**
   * Parse a raw transaction buffer using the specified VM manager.
   * @param rawBuffer The raw transaction buffer
   * @param vmType The VM type to use for parsing ('EVM' or 'PVM')
   * @returns Parsed transaction and credentials, or null if parsing fails
   */
  private parseWithVM(
    rawBuffer: Buffer,
    vmType: 'EVM' | 'PVM'
  ): { tx: SerializedTx; credentials: Credential[] } | null {
    try {
      const manager = FlareUtils.getManagerForVM(vmType);
      const [codec, txBytes] = manager.getCodecFromBuffer(rawBuffer);
      const [tx, credentialBytes] = (codec as Codec).UnpackPrefix<SerializedTx>(txBytes);

      const credentials =
        credentialBytes.length > 4 ? this.extractCredentialsWithCodec(credentialBytes, codec as Codec) : [];

      return { tx, credentials };
    } catch {
      return null;
    }
  }

  /**
   * Create the appropriate transaction builder based on transaction type.
   * @param tx The parsed transaction
   * @param rawBuffer The raw transaction buffer
   * @param credentials The extracted credentials
   * @param isEVM Whether this is an EVM transaction
   * @returns The appropriate transaction builder
   */
  private createBuilder(
    tx: SerializedTx,
    rawBuffer: Buffer,
    credentials: Credential[],
    isEVM: boolean
  ): TransactionBuilder {
    if (isEVM) {
      if (ExportInCTxBuilder.verifyTxType(tx._type)) {
        const builder = this.getExportInCBuilder();
        builder.initBuilder(tx as evmSerial.ExportTx, rawBuffer, credentials);
        return builder;
      }
      if (ImportInCTxBuilder.verifyTxType(tx._type)) {
        const builder = this.getImportInCBuilder();
        builder.initBuilder(tx as evmSerial.ImportTx, rawBuffer, credentials);
        return builder;
      }
    } else {
      if (ImportInPTxBuilder.verifyTxType(tx._type)) {
        const builder = this.getImportInPBuilder();
        builder.initBuilder(tx as pvmSerial.ImportTx, rawBuffer, credentials);
        return builder;
      }
      if (ExportInPTxBuilder.verifyTxType(tx._type)) {
        const builder = this.getExportInPBuilder();
        builder.initBuilder(tx as pvmSerial.ExportTx, rawBuffer, credentials);
        return builder;
      }
      if (PermissionlessDelegatorTxBuilder.verifyTxType(tx._type)) {
        const builder = this.getDelegatorBuilder();
        builder.initBuilder(tx as pvmSerial.AddPermissionlessDelegatorTx, rawBuffer, credentials);
        return builder;
      }
    }
    throw new NotSupported('Transaction type not supported');
  }

  /** @inheritdoc */
  from(raw: string): TransactionBuilder {
    utils.validateRawTransaction(raw);
    const rawBuffer = Buffer.from(utils.removeHexPrefix(raw), 'hex');

    // Try EVM first, then fall back to PVM
    const evmResult = this.parseWithVM(rawBuffer, 'EVM');
    if (evmResult) {
      return this.createBuilder(evmResult.tx, rawBuffer, evmResult.credentials, true);
    }

    const pvmResult = this.parseWithVM(rawBuffer, 'PVM');
    if (pvmResult) {
      return this.createBuilder(pvmResult.tx, rawBuffer, pvmResult.credentials, false);
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

  /**
   * Get builder for AddPermissionlessDelegator transactions.
   * Used for delegating stake to existing validators.
   */
  getDelegatorBuilder(): PermissionlessDelegatorTxBuilder {
    return new PermissionlessDelegatorTxBuilder(this._coinConfig);
  }

  /** @inheritdoc */
  getWalletInitializationBuilder(): TransactionBuilder {
    throw new NotSupported('Wallet initialization is not needed');
  }
}
