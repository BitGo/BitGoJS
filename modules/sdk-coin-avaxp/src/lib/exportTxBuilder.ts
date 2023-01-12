import { ExportTx, SECPTransferOutput, TransferableOutput, Tx, UnsignedTx } from 'avalanche/dist/apis/platformvm';
import utils from './utils';
import { PvmTransactionBuilder } from './pvmTransactionBuilder';
import { ExternalChainId, Amount } from './mixins';
import { BaseTransaction } from '@bitgo/sdk-core';

export class ExportTxBuilder extends ExternalChainId(Amount(PvmTransactionBuilder)) {
  /**
   * Create the internal avalanche transaction.
   * @protected
   */
  protected buildAvaxTransaction(): void {
    if (!this._externalChainId) {
      // default external chain is C.
      this._externalChainId = utils.binTools.cb58Decode(this._coinConfig.network.cChainBlockchainID);
    }
    const { inputs, amount, credentials } = this.createInput();
    const outputs = this.createChangeOutputs(amount.sub(this._amount).subn(this.txFee));
    this.transaction.tx = new Tx(
      new UnsignedTx(
        new ExportTx(
          this._coinConfig.network.networkID,
          utils.binTools.cb58Decode(this._coinConfig.network.blockchainID),
          outputs,
          inputs,
          this._memo,
          this._externalChainId,
          this.exportedOutputs()
        )
      ),
      credentials
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
        this.assetID,
        new SECPTransferOutput(this._amount, this._fromAddresses, this._locktime, this._threshold)
      ),
    ];
  }

  validateTransaction(_?: BaseTransaction): void {
    if (this._amount === undefined) {
      throw new Error('amount is required');
    }
    if (this._fromAddresses.length <= this._threshold) {
      throw new Error('fromPubKey length should be greater than threshold');
    }
  }
}
