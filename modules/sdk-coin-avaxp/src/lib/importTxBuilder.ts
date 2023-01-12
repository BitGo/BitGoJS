import { ImportTx, Tx, UnsignedTx } from 'avalanche/dist/apis/platformvm';
import utils from './utils';
import { PvmTransactionBuilder } from './pvmTransactionBuilder';
import { ExternalChainId } from './mixins';
import { BaseTransaction } from '@bitgo/sdk-core';

export class ImportTxBuilder extends ExternalChainId(PvmTransactionBuilder) {
  /**
   * Build the import transaction
   * @protected
   */
  protected buildAvaxTransaction(): void {
    if (!this._externalChainId) {
      // default external chain is C.
      this._externalChainId = utils.binTools.cb58Decode(this._coinConfig.network.cChainBlockchainID);
    }
    const { inputs, amount, credentials } = this.createInput();
    const outputs = this.createChangeOutputs(amount.subn(this.txFee));
    this.transaction.tx = new Tx(
      new UnsignedTx(
        new ImportTx(
          this._coinConfig.network.networkID,
          utils.binTools.cb58Decode(this._coinConfig.network.blockchainID),
          outputs,
          [], // P-Chain input
          this._memo,
          this._externalChainId,
          inputs
        )
      ),
      credentials
    );
  }

  validateTransaction(_?: BaseTransaction): void {
    if (this._fromAddresses.length <= this._threshold) {
      throw new Error('fromPubKey length should be greater than threshold');
    }
  }
}
