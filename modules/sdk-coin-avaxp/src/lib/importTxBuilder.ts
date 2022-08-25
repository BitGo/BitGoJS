import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { NotSupported, TransactionType } from '@bitgo/sdk-core';
import { AtomicTransactionBuilder } from './atomicTransactionBuilder';
import {
  BaseTx,
  ImportTx,
  PlatformVMConstants,
  TransferableInput,
  TransferableOutput,
  Tx,
  UnsignedTx,
} from 'avalanche/dist/apis/platformvm';
import { BN } from 'avalanche';
import { Credential } from 'avalanche/dist/common';

export class ImportTxBuilder extends AtomicTransactionBuilder {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
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
    this._externalChainId = baseTx.getSourceChain();
    return this;
  }

  static get txType(): number {
    return PlatformVMConstants.IMPORTTX;
  }

  verifyTxType(baseTx: BaseTx): baseTx is ImportTx {
    return baseTx.getTypeID() === ImportTxBuilder.txType;
  }

  protected get insMethod(): string {
    return 'getImportInputs';
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
            this._externalChainId,
            inputs
          )
        ),
        credentials
      )
    );
  }

  /**
   * Override to change the input to a ImportInput.
   * @inheritdoc
   */
  protected createInputOutput(amount: BN): {
    inputs: TransferableInput[];
    outputs: TransferableOutput[];
    credentials: Credential[];
  } {
    if (this.transaction.hasCredentials) {
      // get inputs, outputs and credentials from the deserialized transaction if we are in OVC
      return {
        inputs: (this.transaction.avaxPTransaction as ImportTx).getImportInputs(),
        outputs: this.transaction.avaxPTransaction.getOuts(),
        credentials: this.transaction.credentials,
      };
    }
    return super.createInputOutput(amount);
  }
}
