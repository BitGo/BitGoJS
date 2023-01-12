import { BN } from 'avalanche';
import { TransactionBuilder } from './transactionBuilder';
import {
  SECPTransferInput,
  SECPTransferOutput,
  SelectCredentialClass,
  TransferableInput,
  TransferableOutput,
} from 'avalanche/dist/apis/platformvm';
import { Credential } from 'avalanche/dist/common';
import { createInputs } from './utxoEngine';
import { Utxos, Threshold, Locktime, Memo } from './mixins';
import { BuildTransactionError } from '@bitgo/sdk-core';

/**
 * Cross-chain transactions (export and import) are atomic operations.
 */
export class PvmTransactionBuilder extends Utxos(Memo(Threshold(Locktime(TransactionBuilder)))) {
  /**
   * Threshold must be 2 and since output always get reordered we want to make sure we can always add signatures in the correct location
   * To find the correct location for the signature, we use the output's addresses to create the signatureIdx in the order that we desire
   * 0: user key, 1: hsm key, 2: recovery key
   * @protected
   */
  protected createInput(): { amount: BN; inputs: TransferableInput[]; credentials: Credential[] } {
    return createInputs(TransferableInput, SECPTransferInput, SelectCredentialClass)(
      this.assetID,
      this._utxos,
      this.sender,
      this._threshold
    );
  }

  protected createChangeOutputs(amount: BN): TransferableOutput[] {
    if (amount.gtn(0)) {
      return [
        new TransferableOutput(
          this.assetID,
          new SECPTransferOutput(amount, this._fromAddresses, this._locktime, this._threshold)
        ),
      ];
    } else if (amount.ltn(0)) {
      throw new BuildTransactionError(`Utxo outputs is missing ${amount.abs().toString()}`);
    } else {
      return [];
    }
  }

  protected get txFee(): number {
    return Number(this._coinConfig.network.txFee);
  }
}
