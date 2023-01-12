import { BaseTransaction, BuildTransactionError } from '@bitgo/sdk-core';
import {
  SelectCredentialClass,
  ExportTx,
  EVMInput,
  TransferableOutput,
  SECPTransferOutput,
  UnsignedTx,
  Tx,
} from 'avalanche/dist/apis/evm';
import utils from './utils';
import { BN } from 'avalanche';
import { TransactionBuilder } from './transactionBuilder';
import { ExternalChainId, FeeRate, Amount, To, Threshold, Locktime } from './mixins';

export class ExportInCTxBuilder extends FeeRate(ExternalChainId(Amount(To(Threshold(Locktime(TransactionBuilder)))))) {
  private _nonce: BN;

  /**
   * Set the nonce of C-Chain sender address
   *
   * @param {number | string} nonce - number that can be only used once
   */
  nonce(nonce: number | string): this {
    const nonceBN = new BN(nonce);
    this.validateNonce(nonceBN);
    this._nonce = nonceBN;
    return this;
  }

  /**
   * Build the export in C-chain transaction
   * @protected
   */
  protected buildAvaxTransaction(): void {
    if (!this._externalChainId) {
      // default external chain is P.
      this._externalChainId = utils.binTools.cb58Decode(this._coinConfig.network.blockchainID);
    }
    const txFee = Number(this._coinConfig.network.txFee);
    const fee: number = this._feeRate + txFee;

    const input = new EVMInput(this._fromAddresses[0], this._amount.addn(fee), this.assetID, this._nonce);
    input.addSignatureIdx(0, this._fromAddresses[0]);

    this.transaction.tx = new Tx(
      new UnsignedTx(
        new ExportTx(
          this._coinConfig.network.networkID,
          utils.binTools.cb58Decode(this._coinConfig.network.cChainBlockchainID),
          this._externalChainId,
          [input],
          [
            new TransferableOutput(
              this.assetID,
              new SECPTransferOutput(this._amount, this._to, this._locktime, this._threshold)
            ),
          ]
        )
      ),
      // TODO(BG-56700):  Improve canSign by check in addresses in empty credentials match signer
      [SelectCredentialClass(input.getCredentialID(), [''].map(utils.createSig))]
    );
  }

  validateTransaction(_?: BaseTransaction): void {
    if (this._amount === undefined) {
      throw new Error('amount is required');
    }
    if (this._fromAddresses.length !== 1) {
      throw new Error('fromPubKey is one and required');
    }
    if (this._to.length === 0) {
      throw new Error('to is required');
    }
    if (!this._feeRate) {
      throw new Error('fee rate is required');
    }
    if (!this._nonce === undefined) {
      throw new Error('nonce is required');
    }
  }

  /**
   * Check the amount is positive.
   * @param amount
   */
  validateNonce(nonce: BN): void {
    if (nonce.ltn(0)) {
      throw new BuildTransactionError('Nonce must be greater or equal than 0');
    }
  }
}
