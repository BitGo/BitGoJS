import {
  Address,
  utils as AvaxUtils,
  Credential,
  pvmSerial,
  TransferOutput,
  UnsignedTx,
} from '@bitgo-forks/avalanchejs';
import { BaseTransactionBuilderFactory, NotSupported } from '@bitgo/sdk-core';
import { AvalancheNetwork, BaseCoin as CoinConfig } from '@bitgo/statics';
import { Buffer as BufferAvax } from 'avalanche';
import { Tx as EVMTx } from 'avalanche/dist/apis/evm';
import { Tx as PVMTx } from 'avalanche/dist/apis/platformvm';
import { DeprecatedTransactionBuilder } from './deprecatedTransactionBuilder';
import { ExportInCTxBuilder } from './exportInCTxBuilder';
import { ExportTxBuilder } from './exportTxBuilder';
import { ImportInCTxBuilder } from './importInCTxBuilder';
import { ImportTxBuilder } from './importTxBuilder';
import { PermissionlessValidatorTxBuilder } from './permissionlessValidatorTxBuilder';
import { TransactionBuilder } from './transactionBuilder';
import utils from './utils';
import { ValidatorTxBuilder } from './validatorTxBuilder';

export class TransactionBuilderFactory extends BaseTransactionBuilderFactory {
  protected recoverSigner = false;
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /** @inheritdoc */
  from(raw: string): TransactionBuilder | DeprecatedTransactionBuilder {
    utils.validateRawTransaction(raw);
    let txSource: 'EVM' | 'PVM' = 'PVM';
    let transactionBuilder: TransactionBuilder | DeprecatedTransactionBuilder | undefined = undefined;
    let tx: PVMTx | EVMTx | UnsignedTx;
    const rawNoHex = utils.removeHexPrefix(raw);
    try {
      tx = new PVMTx();
      // could throw an error if a txType doesn't match.
      tx.fromBuffer(BufferAvax.from(rawNoHex, 'hex'));

      if (!utils.isTransactionOf(tx, (this._coinConfig.network as AvalancheNetwork).blockchainID)) {
        throw new Error('It is not a transaction of this platformvm old flow');
      }
    } catch (e) {
      try {
        txSource = 'EVM';
        tx = new EVMTx();
        tx.fromBuffer(BufferAvax.from(rawNoHex, 'hex'));

        if (!utils.isTransactionOf(tx, (this._coinConfig.network as AvalancheNetwork).cChainBlockchainID)) {
          throw new Error('It is not a transaction of this network or C chain EVM');
        }
      } catch (e) {
        try {
          txSource = 'PVM';
          // this should be the last because other PVM functions are still being detected in the new SDK
          const manager = AvaxUtils.getManagerForVM('PVM');
          const [codec, txBytes] = manager.getCodecFromBuffer(AvaxUtils.hexToBuffer(raw));
          const unpackedTx = codec.UnpackPrefix<pvmSerial.AddPermissionlessValidatorTx>(txBytes);
          // A signed transaction includes 4 bytes for the number of credentials as an Int type that is not known by the codec
          // We'll skip those 4 bytes, instead we'll loop until we've parsed all credentials
          // @see https://docs.avax.network/reference/avalanchego/p-chain/txn-format#signed-transaction-example
          const credentials: Credential[] = [];
          let credentialBytes = unpackedTx[1].slice(4);
          let moreCredentials = true;
          do {
            try {
              const [credential, rest] = codec.UnpackPrefix<Credential>(credentialBytes);
              credentials.push(credential);
              credentialBytes = rest;
            } catch (e) {
              moreCredentials = false;
            }
          } while (credentialBytes.length > 0 && moreCredentials);

          const unpacked = codec.UnpackPrefix<pvmSerial.AddPermissionlessValidatorTx>(txBytes);
          const permissionlessValidatorTx = unpacked[0] as pvmSerial.AddPermissionlessValidatorTx;
          const outputs = permissionlessValidatorTx.baseTx.outputs;
          const output = outputs[0].output as TransferOutput;
          if (outputs[0].getAssetId() !== (this._coinConfig.network as AvalancheNetwork).avaxAssetID) {
            throw new Error('The Asset ID of the output does not match the transaction');
          }
          const fromAddresses = output.outputOwners.addrs.map((a) => AvaxUtils.hexToBuffer(a.toHex()));
          const addressMaps = fromAddresses.map((a) => new AvaxUtils.AddressMap([[new Address(a), 0]]));
          tx = new UnsignedTx(unpacked[0], [], new AvaxUtils.AddressMaps(addressMaps), credentials);
        } catch (e) {
          throw new Error(
            `The transaction type is not recognized as an old PVM or old EVM transaction. Additionally, parsing of the new PVM AddPermissionlessValidatorTx type failed: ${e.message}`
          );
        }
      }
    }

    if (txSource === 'PVM') {
      if ((tx as UnsignedTx)?.tx?._type && PermissionlessValidatorTxBuilder.verifyTxType((tx as UnsignedTx).tx._type)) {
        transactionBuilder = this.getPermissionlessValidatorTxBuilder();
        transactionBuilder.initBuilder(tx);
      } else if (ValidatorTxBuilder.verifyTxType((tx as PVMTx).getUnsignedTx().getTransaction())) {
        transactionBuilder = this.getValidatorBuilder();
        transactionBuilder.initBuilder(tx as PVMTx);
      } else if (ExportTxBuilder.verifyTxType((tx as PVMTx).getUnsignedTx().getTransaction())) {
        transactionBuilder = this.getExportBuilder();
        transactionBuilder.initBuilder(tx as PVMTx);
      } else if (ImportTxBuilder.verifyTxType((tx as PVMTx).getUnsignedTx().getTransaction())) {
        transactionBuilder = this.getImportBuilder();
        transactionBuilder.initBuilder(tx as PVMTx);
      }
    } else if (txSource === 'EVM') {
      if (ImportInCTxBuilder.verifyTxType((tx as EVMTx).getUnsignedTx().getTransaction())) {
        transactionBuilder = this.getImportInCBuilder();
        transactionBuilder.initBuilder(tx as EVMTx);
      } else if (ExportInCTxBuilder.verifyTxType((tx as EVMTx).getUnsignedTx().getTransaction())) {
        transactionBuilder = this.getExportInCBuilder();
        transactionBuilder.initBuilder(tx as EVMTx);
      }
    }
    if (transactionBuilder === undefined) {
      throw new NotSupported('Transaction cannot be parsed or has an unsupported transaction type');
    }
    return transactionBuilder;
  }

  /** @inheritdoc */
  getTransferBuilder(): DeprecatedTransactionBuilder {
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
  getWalletInitializationBuilder(): DeprecatedTransactionBuilder {
    throw new NotSupported('Wallet initialization is not needed');
  }
}
