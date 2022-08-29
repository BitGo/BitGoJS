import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BuildTransactionError, NotSupported, TransactionType } from '@bitgo/sdk-core';
import { AtomicTransactionBuilder } from './atomicTransactionBuilder';
import {
  ExportTx,
  PlatformVMConstants,
  SECPTransferOutput,
  TransferableOutput,
  Tx as PVMTx,
  UnsignedTx,
} from 'avalanche/dist/apis/platformvm';
import { BN } from 'avalanche';
import { AmountOutput } from 'avalanche/dist/apis/evm/outputs';
import utils from './utils';
import { recoverUtxos } from './utxoEngine';
import { Tx, BaseTx } from './iface';

export class ExportTxBuilder extends AtomicTransactionBuilder {
  private _amount: BN;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._externalChainId = utils.cb58Decode(this.transaction._network.cChainBlockchainID);
  }

  protected get transactionType(): TransactionType {
    return TransactionType.Export;
  }

  /**
   * Amount is a long that specifies the quantity of the asset that this output owns. Must be positive.
   *
   * @param {BN | string} amount The withdrawal amount
   */
  amount(value: BN | string): this {
    const valueBN = BN.isBN(value) ? value : new BN(value);
    this.validateAmount(valueBN);
    this._amount = valueBN;
    return this;
  }

  /** @inheritdoc */
  initBuilder(tx: Tx): this {
    super.initBuilder(tx);
    const baseTx: BaseTx = tx.getUnsignedTx().getTransaction();
    if (!this.verifyTxType(baseTx)) {
      throw new NotSupported('Transaction cannot be parsed or has an unsupported transaction type');
    }
    // The ExportOutputs is a {@link exportedOutputs} result.
    // It's expected to have only one outputs with the addresses of the sender.
    const outputs = baseTx.getExportOutputs();
    if (outputs.length != 1) {
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
    this._externalChainId = baseTx.getDestinationChain();
    this._amount = (secpOut as AmountOutput).getAmount();
    this.transaction._utxos = recoverUtxos(baseTx.getIns());
    return this;
  }

  static verifyTxType(baseTx: BaseTx): baseTx is ExportTx {
    return baseTx.getTypeID() === PlatformVMConstants.EXPORTTX;
  }

  verifyTxType(baseTx: BaseTx): baseTx is ExportTx {
    return ExportTxBuilder.verifyTxType(baseTx);
  }

  /**
   * Create the internal avalanche transaction.
   * @protected
   */
  protected buildAvaxTransaction(): void {
    // if tx has credentials, tx shouldn't change
    if (this.transaction.hasCredentials) return;
    const { inputs, outputs, credentials } = this.createInputOutput(this._amount.add(new BN(this.transaction.fee.fee)));
    this.transaction.setTransaction(
      new PVMTx(
        new UnsignedTx(
          new ExportTx(
            this.transaction._networkID,
            this.transaction._blockchainID,
            outputs,
            inputs,
            this.transaction._memo,
            this._externalChainId,
            this.exportedOutputs()
          )
        ),
        credentials
      )
    );
  }

  /**
   * Create the ExportedOut where the recipient address are the sender.
   * Later a importTx should complete the operations signing with the same keys.
   * @protected
   */
  protected exportedOutputs(): TransferableOutput[] {
    return [
      new TransferableOutput(
        this.transaction._assetId,
        new SECPTransferOutput(
          this._amount,
          this.transaction._fromAddresses,
          this.transaction._locktime,
          this.transaction._threshold
        )
      ),
    ];
  }
}
