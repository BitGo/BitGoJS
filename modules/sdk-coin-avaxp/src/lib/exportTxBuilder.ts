import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BuildTransactionError, NotSupported, TransactionType } from '@bitgo/sdk-core';
import { TransactionBuilder } from './transactionBuilder';
import {
  BaseTx,
  ExportTx,
  PlatformVMConstants,
  SECPTransferOutput,
  TransferableOutput,
  Tx,
  UnsignedTx,
} from 'avalanche/dist/apis/platformvm';
import utils from './utils';
import { BN, Buffer as BufferAvax } from 'avalanche';
import { AmountOutput } from 'avalanche/dist/apis/evm/outputs';

export class ExportTxBuilder extends TransactionBuilder {
  private _amount: BN;
  private _targetChainId: BufferAvax;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this.transaction._fee = new BN(this.transaction._network.txFee);
  }

  protected get transactionType(): TransactionType {
    return TransactionType.Export;
  }

  /**
   *
   * @param value
   */
  targetChainId(chainId: string | Buffer): this {
    const newTargetChainId = typeof chainId === 'string' ? utils.cb58Decode(chainId) : BufferAvax.from(chainId);
    this.validateChainId(newTargetChainId);
    this._targetChainId = newTargetChainId;
    return this;
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

  /**
   *
   * @param amount
   */
  validateAmount(amount: BN): void {
    if (amount.lten(0)) {
      throw new BuildTransactionError('Amount must be greater than 0');
    }
  }

  /**
   *
   * @param chainID
   */
  private validateChainId(chainID: BufferAvax) {
    if (chainID.length != 32) {
      throw new BuildTransactionError('Chain id are 32 byte size');
    }
  }

  initBuilder(tx: Tx): this {
    super.initBuilder(tx);
    const baseTx: BaseTx = tx.getUnsignedTx().getTransaction();
    if (!this.verifyTxType(baseTx)) {
      throw new NotSupported('Transaction cannot be parsed or has an unsupported transaction type');
    }
    this._targetChainId = baseTx.getDestinationChain();
    this._amount = (baseTx.getExportOutputs()[0].getOutput() as any as AmountOutput).getAmount();
    return this;
  }

  static verifyTxType(baseTx: BaseTx): baseTx is ExportTx {
    return baseTx.getTypeID() === PlatformVMConstants.EXPORTTX;
  }

  verifyTxType(baseTx: BaseTx): baseTx is ExportTx {
    return ExportTxBuilder.verifyTxType(baseTx);
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
            this._targetChainId,
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
