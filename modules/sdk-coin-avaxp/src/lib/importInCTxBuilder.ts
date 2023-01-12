import {
  ImportTx,
  UnsignedTx,
  SECPTransferInput,
  SelectCredentialClass,
  TransferableInput,
  EVMOutput,
  Tx,
} from 'avalanche/dist/apis/evm';
import { costImportTx } from 'avalanche/dist/utils';
import { BN } from 'avalanche';
import { createInputs } from './utxoEngine';
import utils from './utils';
import { TransactionBuilder } from './transactionBuilder';
import { Utxos, FeeRate, ExternalChainId, To, Threshold, Locktime } from './mixins';
import { BaseTransaction } from '@bitgo/sdk-core';

export class ImportInCTxBuilder extends Utxos(FeeRate(ExternalChainId(To(Threshold(Locktime(TransactionBuilder)))))) {
  /**
   * Build the import in C-chain transaction
   * @protected
   */
  protected buildAvaxTransaction(): void {
    if (!this._externalChainId) {
      // default external chain is P.
      this._externalChainId = utils.binTools.cb58Decode(this._coinConfig.network.blockchainID);
    }
    const { inputs, amount, credentials } = this.createInputs(this.assetID, this._utxos, this.sender, this._threshold);

    const feeRate = new BN(this._feeRate);
    const cChainBlockchainID = utils.binTools.cb58Decode(this._coinConfig.network.cChainBlockchainID);
    const feeSize = costImportTx(
      new UnsignedTx(
        new ImportTx(this._coinConfig.network.networkID, cChainBlockchainID, this._externalChainId, inputs, [
          new EVMOutput(this._to[0], amount, this.assetID),
        ])
      )
    );
    const fee = feeRate.muln(feeSize);
    this.transaction.tx = new Tx(
      new UnsignedTx(
        new ImportTx(
          this._coinConfig.network.networkID,
          cChainBlockchainID,
          this._externalChainId,
          inputs,
          [new EVMOutput(this._to[0], amount.sub(fee), this.assetID)],
          fee
        )
      ),
      credentials
    );
  }

  validateTransaction(_?: BaseTransaction): void {
    if (this._fromAddresses.length <= this._threshold) {
      throw new Error('fromPubKey length should be greater than threshold');
    }
    if (this._to.length !== 1) {
      throw new Error('to is required');
    }
    if (!this._feeRate) {
      throw new Error('fee rate is required');
    }
  }

  /**
   * Create inputs by mapping {@see utxoEngine.utxoToInput} result.
   * Reorder sender to handle recover signer.
   * TransferableInput is a EVM Tx.
   * @return {
   *     inputs: TransferableInput[];
   *     credentials: Credential[];
   *     amount: BN;
   *   } where amount is the sum of inputs amount and credentials has signer address to be replaced with correct signature.
   * @protected
   *
   */
  protected createInputs = createInputs(TransferableInput, SECPTransferInput, SelectCredentialClass);
}
