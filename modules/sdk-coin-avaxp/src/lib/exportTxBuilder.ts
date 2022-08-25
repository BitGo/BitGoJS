import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { NotSupported, TransactionType } from '@bitgo/sdk-core';
import { AtomicTransactionBuilder } from './atomicTransactionBuilder';
import {
  BaseTx,
  ExportTx,
  PlatformVMConstants,
  SECPTransferOutput,
  TransferableOutput,
  Tx,
  UnsignedTx,
} from 'avalanche/dist/apis/platformvm';
import { BN } from 'avalanche';
import { AmountOutput } from 'avalanche/dist/apis/evm/outputs';

export class ExportTxBuilder extends AtomicTransactionBuilder {
  private _amount: BN;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  protected get transactionType(): TransactionType {
    return TransactionType.Export;
  }

  /**
   *
   * @param value
   */
  amount(value: BN | string): this {
    const valueBN = BN.isBN(value) ? value : new BN(value);
    this.validateAmount(valueBN);
    this._amount = valueBN;
    return this;
  }

  initBuilder(tx: Tx): this {
    super.initBuilder(tx);
    const baseTx: BaseTx = tx.getUnsignedTx().getTransaction();
    if (!this.verifyTxType(baseTx)) {
      throw new NotSupported('Transaction cannot be parsed or has an unsupported transaction type');
    }
    this._externalChainId = baseTx.getDestinationChain();
    this._amount = (baseTx.getExportOutputs()[0].getOutput() as any as AmountOutput).getAmount();
    return this;
  }

  static get txType(): number {
    return PlatformVMConstants.EXPORTTX;
  }

  verifyTxType(baseTx: BaseTx): baseTx is ExportTx {
    return baseTx.getTypeID() === ExportTxBuilder.txType;
  }

  protected get outsMethod(): string {
    return 'getExportOutputs';
  }

  /**
   *
   * @protected
   */
  protected buildAvaxpTransaction(): void {
    const { inputs, outputs, credentials } = this.createInputOutput(this._amount.add(this.transaction._fee));
    this.transaction.setTransaction(
      new Tx(
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
