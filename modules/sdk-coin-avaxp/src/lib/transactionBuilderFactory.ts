import { BaseTransactionBuilderFactory, NotSupported } from '@bitgo/sdk-core';
import { AvalancheNetwork, BaseCoin as CoinConfig } from '@bitgo/statics';
// import { Tx as EVMTx } from 'avalanche/dist/apis/evm';
// import { Tx } from 'avalanche/dist/apis/platformvm';
import { utils as AvaxUtils, pvmSerial } from '@bitgo/avalanchejs';
// eslint-disable-next-line import/no-internal-modules
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
    let tx: PVMTx | EVMTx | pvmSerial.BaseTx;
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
        // TODO(CR-1073): How do we create other EVM Tx types here, may be unpack from rawTx
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
          const [codec, rest] = manager.getCodecFromBuffer(AvaxUtils.hexToBuffer(raw));
          tx = codec.UnpackPrefix<pvmSerial.AddPermissionlessValidatorTx>(rest)[0];
        } catch (e) {
          // TODO(CR-1073): remove log
          console.log('failed all attempts to parse tx');
          throw e;
        }
      }
    }

    if (txSource === 'PVM') {
      if (PermissionlessValidatorTxBuilder.verifyTxType((tx as pvmSerial.BaseTx)._type)) {
        transactionBuilder = this.getPermissionlessValidatorTxBuilder().initBuilder(tx as pvmSerial.BaseTx);
      } else if (ValidatorTxBuilder.verifyTxType((tx as PVMTx).getUnsignedTx().getTransaction())) {
        transactionBuilder = this.getValidatorBuilder().initBuilder(tx as PVMTx);
      } else if (ExportTxBuilder.verifyTxType((tx as PVMTx).getUnsignedTx().getTransaction())) {
        transactionBuilder = this.getExportBuilder().initBuilder(tx as PVMTx);
      } else if (ImportTxBuilder.verifyTxType((tx as PVMTx).getUnsignedTx().getTransaction())) {
        transactionBuilder = this.getImportBuilder().initBuilder(tx as PVMTx);
      }
    } else if (txSource === 'EVM') {
      if (ImportInCTxBuilder.verifyTxType((tx as EVMTx).getUnsignedTx().getTransaction())) {
        transactionBuilder = this.getImportInCBuilder().initBuilder(tx as EVMTx);
      } else if (ExportInCTxBuilder.verifyTxType((tx as EVMTx).getUnsignedTx().getTransaction())) {
        transactionBuilder = this.getExportInCBuilder().initBuilder(tx as EVMTx);
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
