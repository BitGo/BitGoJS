import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BuildTransactionError, NotSupported, TransactionType } from '@bitgo/sdk-core';
import { TransactionBuilder } from './transactionBuilder';
import { BaseTx, ImportTx, PlatformVMConstants, Tx, UnsignedTx } from 'avalanche/dist/apis/platformvm';
import utils from './utils';
import { BN, Buffer as BufferAvax } from 'avalanche';

export class ImportTxBuilder extends TransactionBuilder {
  private _targetChainId: BufferAvax;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this.transaction._fee = new BN(this.transaction._network.txFee);
  }

  protected get transactionType(): TransactionType {
    return TransactionType.Import;
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
    this._targetChainId = baseTx.getSourceChain();
    this.transaction._utxos = this.recoverUtxos(baseTx.getImportInputs());
    return this;
  }

  static get txType(): number {
    return PlatformVMConstants.IMPORTTX;
  }

  verifyTxType(baseTx: BaseTx): baseTx is ImportTx {
    return baseTx.getTypeID() === ImportTxBuilder.txType;
  }

  /**
   *
   * @protected
   */
  protected buildAvaxpTransaction(): void {
    const { inputs, outputs, credentials } = this.createInputOutput(this.transaction._fee);
    this.transaction.setTransaction(
      new Tx(
        new UnsignedTx(
          new ImportTx(
            this.transaction._networkID,
            this.transaction._blockchainID,
            outputs,
            [], // P-Chain input
            this.transaction._memo,
            this._targetChainId,
            inputs
          )
        ),
        credentials
      )
    );
  }
}
