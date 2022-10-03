import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BuildTransactionError, NotSupported, TransactionType } from '@bitgo/sdk-core';
import { AtomicTransactionBuilder } from './atomicTransactionBuilder';
import { ImportTx, PlatformVMConstants, Tx as PVMTx, UnsignedTx } from 'avalanche/dist/apis/platformvm';
import utils from './utils';
import { BN } from 'avalanche';
import { recoverUtxos } from './utxoEngine';
import { Tx, BaseTx } from './iface';

export class ImportTxBuilder extends AtomicTransactionBuilder {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._externalChainId = utils.cb58Decode(this.transaction._network.cChainBlockchainID);
  }

  protected get transactionType(): TransactionType {
    return TransactionType.Import;
  }

  initBuilder(tx: Tx): this {
    super.initBuilder(tx);
    const baseTx: BaseTx = tx.getUnsignedTx().getTransaction();
    if (!this.verifyTxType(baseTx)) {
      throw new NotSupported('Transaction cannot be parsed or has an unsupported transaction type');
    }

    // The regular change output is the tx output in Import tx.
    // {@link createInputOutput} result a single item array.
    // It's expected to have only one outputs with the addresses of the sender.
    const outputs = baseTx.getOuts();
    if (outputs.length !== 1) {
      throw new BuildTransactionError('Transaction can have one external output');
    }
    const output = outputs[0];
    if (!output.getAssetID().equals(this.transaction._assetId)) {
      throw new Error('The Asset ID of the output does not match the transaction');
    }
    const secpOut = output.getOutput();
    this.transaction._locktime = secpOut.getLocktime();
    this.transaction._threshold = secpOut.getThreshold();
    // output addresses are the sender addresses
    this.transaction._fromAddresses = secpOut.getAddresses();
    this._externalChainId = baseTx.getSourceChain();
    this.transaction._utxos = recoverUtxos(baseTx.getImportInputs());
    return this;
  }

  static verifyTxType(baseTx: BaseTx): baseTx is ImportTx {
    return baseTx.getTypeID() === PlatformVMConstants.IMPORTTX;
  }

  verifyTxType(baseTx: BaseTx): baseTx is ImportTx {
    return ImportTxBuilder.verifyTxType(baseTx);
  }

  /**
   * Build the import transaction
   * @protected
   */
  protected buildAvaxTransaction(): void {
    // if tx has credentials, tx shouldn't change
    if (this.transaction.hasCredentials) return;
    const { inputs, outputs, credentials } = this.createInputOutput(new BN(this.transaction.fee.fee));
    this.transaction.setTransaction(
      new PVMTx(
        new UnsignedTx(
          new ImportTx(
            this.transaction._networkID,
            this.transaction._blockchainID,
            outputs,
            [], // P-Chain input
            this.transaction._memo,
            this._externalChainId,
            inputs
          )
        ),
        credentials
      )
    );
  }
}
