import { BaseTransactionBuilderFactory, NotSupported } from '@bitgo/sdk-core';
import { AvalancheNetwork, BaseCoin as CoinConfig } from '@bitgo/statics';
import { TransactionBuilder } from './transactionBuilder';
import { ValidatorTxBuilder } from './validatorTxBuilder';
// import { PermissionlessValidatorTxBuilder } from './permissionlessValidatorTxBuilder';
import { Buffer as BufferAvax } from 'avalanche';
import { Tx as EVMTx } from 'avalanche/dist/apis/evm';
import { Tx } from 'avalanche/dist/apis/platformvm';
import { avmSerial, pvmSerial } from 'bitgo-aaron-avalanchejs';
import { ExportInCTxBuilder } from './exportInCTxBuilder';
import { ExportTxBuilder } from './exportTxBuilder';
import { ImportInCTxBuilder } from './importInCTxBuilder';
import { ImportTxBuilder } from './importTxBuilder';
import utils from './utils';
// const { BaseTx, AddPermissionlessValidatorTx } = pvmSerial;
// const { AddPermissionlessValidatorTx } = pvmSerial;
// const AvaxBaseTx = avaxSerial.AvaxTx;
// const AvaxBaseTx = avaxSerial.BaseTx;
// const BaseTx = pvmSerial.BaseTx;
const BaseTx = pvmSerial.AddPermissionlessValidatorTx;
// const AddPermissionlessValidatorTx = pvmSerial.AddPermissionlessValidatorTx;
const AVMManager = avmSerial.getAVMManager();

export class TransactionBuilderFactory extends BaseTransactionBuilderFactory {
  protected recoverSigner = false;
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /** @inheritdoc */
  from(raw: string): TransactionBuilder {
    utils.validateRawTransaction(raw);
    raw = utils.removeHexPrefix(raw);
    // let txSource: 'EVM' | 'PVM' = 'PVM';
    // let tx: Tx | EVMTx | avmSerial.BaseTx
    // let tx: Tx | EVMTx;
    let tx: Tx | EVMTx | pvmSerial.BaseTx;
    // let tx: Tx | EVMTx | avaxSerial.AvaxTx;
    // let tx: Tx | EVMTx | avaxSerial.BaseTx;
    const transactionBuilder: TransactionBuilder | undefined = undefined;

    try {
      tx = new Tx();
      // could throw an error if a txType doesn't match.
      tx.fromBuffer(BufferAvax.from(raw, 'hex'));

      if (!utils.isTransactionOf(tx, (this._coinConfig.network as AvalancheNetwork).blockchainID)) {
        throw new Error('It is not a transaction of this network');
      }
    } catch (e) {
      // TODO We need to create an instance of the pvm base tx that includes data about the staking-related data
      //   Using the code in the coins-sandbox script I created the hex representation of the tx,
      //   then I rebuilt it using:
      //     const AVMManager = avmSerial.getAVMManager();
      //     const rebuiltTx = utils.unpackWithManager('PVM', tx.getSignedTx().toBytes());
      //   rebuiltTx is the same transaction we get from tx.getTx(), but it can't be converted back to bytes using
      //     toHexString(rebuiltTx.getSignedTx().toBytes())
      // if (BaseTx.fromBytes(BufferAvax.from(raw, 'hex'), new Codec([]) as Codec) instanceof BaseTx) {
      // const [tx1, remaining1] = BaseTx.fromBytes(BufferAvax.from(raw, 'hex'), AVMManager.getDefaultCodec());
      // const [tx1, remaining1] = AvaxBaseTx.fromBytes(BufferAvax.from(raw, 'hex'), AVMManager.getDefaultCodec());
      // const [tx1, remaining1] = AvaxBaseTx.fromBytes(BufferAvax.from(raw, 'hex'), AVMManager.getDefaultCodec());
      // FIXME This is incorrect, the tx doesn't have enough bytes to be converted to pvmSerial.AddPermissionlessValidatorTx
      const [tx1] = BaseTx.fromBytes(BufferAvax.from(raw, 'hex'), AVMManager.getDefaultCodec());
      // const [tx1, remaining1] = AddPermissionlessValidatorTx.fromBytes(BufferAvax.from(raw, 'hex'), AVMManager.getDefaultCodec());
      // if (tx1.baseTx instanceof BaseTx) {
      if (tx1._type == 'pvm.BaseTx') {
        console.log(tx1);
        // tx = tx1.baseTx
        // tx = tx1
      } else {
        // txSource = 'EVM';
        tx = new EVMTx();
        tx.fromBuffer(BufferAvax.from(raw, 'hex'));

        if (!utils.isTransactionOf(tx, (this._coinConfig.network as AvalancheNetwork).cChainBlockchainID)) {
          throw new Error('It is not a transaction of this network or C chain');
        }
      }
    }
    // if (tx instanceof Tx && txSource === 'PVM') {
    //   if (ValidatorTxBuilder.verifyTxType(tx.getUnsignedTx().getTransaction())) {
    //     transactionBuilder = this.getValidatorBuilder();
    //   } else if (ExportTxBuilder.verifyTxType(tx.getUnsignedTx().getTransaction())) {
    //     transactionBuilder = this.getExportBuilder();
    //   } else if (ImportTxBuilder.verifyTxType(tx.getUnsignedTx().getTransaction())) {
    //     transactionBuilder = this.getImportBuilder();
    //   }
    // } else if (tx instanceof Tx && txSource === 'EVM') {
    //   if (ImportInCTxBuilder.verifyTxType(tx.getUnsignedTx().getTransaction())) {
    //     transactionBuilder = this.getImportInCBuilder();
    //   } else if (ExportInCTxBuilder.verifyTxType(tx.getUnsignedTx().getTransaction())) {
    //     transactionBuilder = this.getExportInCBuilder();
    //   }
    // } else if (tx instanceof AvaxBaseTx) {
    //   console.log(AvaxBaseTx);
    //   if (PermissionlessValidatorTxBuilder.verifyTxType(tx)) {
    //     transactionBuilder = this.getValidatorBuilder();
    //   }
    // }

    if (transactionBuilder === undefined) {
      throw new NotSupported('Transaction cannot be parsed or has an unsupported transaction type');
    }
    // transactionBuilder.initBuilder(tx);
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
