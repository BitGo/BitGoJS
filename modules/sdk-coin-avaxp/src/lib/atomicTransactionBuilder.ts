import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BN, Buffer as BufferAvax } from 'avalanche';
import utils from './utils';
import { TransactionBuilder } from './transactionBuilder';
import {
  SECPTransferInput,
  SECPTransferOutput,
  SelectCredentialClass,
  TransferableInput,
  TransferableOutput,
} from 'avalanche/dist/apis/platformvm';
import { Credential } from 'avalanche/dist/common';
import { BuildTransactionError } from '@bitgo/sdk-core';
import { SECP256K1_Transfer_Output } from './iface';

/**
 * Cross-chain transactions (export and import) are atomic operations.
 */
export abstract class AtomicTransactionBuilder extends TransactionBuilder {
  protected _externalChainId: BufferAvax;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this.transaction._fee.fee = this.fixedFee;
  }

  /**
   * The internal chain is the one set for the coin in coinConfig.network. The external chain is the other chain involved.
   * The external chain id is the source on import and the destination on export.
   *
   * @param {string} chainId - id of the external chain
   */
  externalChainId(chainId: string | Buffer): this {
    const newTargetChainId = typeof chainId === 'string' ? utils.cb58Decode(chainId) : BufferAvax.from(chainId);
    this.validateChainId(newTargetChainId);
    this._externalChainId = newTargetChainId;
    return this;
  }

  /**
   * Fee is fix for AVM atomic tx.
   *
   * @returns network.txFee
   * @protected
   */
  protected get fixedFee(): string {
    return this.transaction._network.txFee;
  }

  // region utxo engine
  /**
   * Threshold must be 2 and since output always get reordered we want to make sure we can always add signatures in the correct location
   * To find the correct location for the signature, we use the output's addresses to create the signatureIdx in the order that we desire
   * 0: user key, 1: hsm key, 2: recovery key
   * @protected
   */
  protected createInputOutput(amount: BN): {
    inputs: TransferableInput[];
    outputs: TransferableOutput[];
    credentials: Credential[];
  } {
    const inputs: TransferableInput[] = [];
    const outputs: TransferableOutput[] = [];

    // amount spent so far
    let currentTotal: BN = new BN(0);

    // delegating and validating have no fees
    const totalTarget = amount.clone();

    const credentials: Credential[] = [];

    /*
    A = user key
    B = hsm key
    C = backup key
    bitgoAddresses = bitgo addresses [ A, B, C ]
    utxo.addresses = IMS addresses [ B, C, A ]
    utxo.addressesIndex = [ 2, 0, 1 ]
    we pick 0, 1 for non-recovery
    we pick 1, 2 for recovery
    */
    this.transaction._utxos.forEach((utxo) => {
      // in WP, output.addressesIndex is empty, so fill it
      if (!utxo.addressesIndex || utxo.addressesIndex.length === 0) {
        const utxoAddresses: BufferAvax[] = utxo.addresses.map((a) => utils.parseAddress(a));
        utxo.addressesIndex = this.transaction._fromAddresses.map((a) => utxoAddresses.findIndex((u) => a.equals(u)));
      }
      // in OVC, output.addressesIndex is defined correctly from the previous iteration
    });

    // validate the utxos
    this.transaction._utxos.forEach((utxo) => {
      if (!utxo) {
        throw new BuildTransactionError('Utxo is undefined');
      }
      // addressesIndex should never have a mismatch
      if (utxo.addressesIndex?.includes(-1)) {
        throw new BuildTransactionError('Addresses are inconsistent: ' + utxo.txid);
      }
      if (utxo.threshold !== this.transaction._threshold) {
        throw new BuildTransactionError('Threshold is inconsistent');
      }
    });

    this.transaction._utxos.forEach((utxo, i) => {
      if (utxo.outputID === SECP256K1_Transfer_Output) {
        const txidBuf = utils.cb58Decode(utxo.txid);
        const amt: BN = new BN(utxo.amount);
        const outputidx = utils.outputidxNumberToBuffer(utxo.outputidx);
        const addressesIndex = utxo.addressesIndex ?? [];

        // either user (0) or recovery (2)
        const firstIndex = this.recoverSigner ? 2 : 0;
        const bitgoIndex = 1;
        currentTotal = currentTotal.add(amt);

        const secpTransferInput = new SECPTransferInput(amt);

        // if user/backup > bitgo
        if (addressesIndex[bitgoIndex] < addressesIndex[firstIndex]) {
          secpTransferInput.addSignatureIdx(addressesIndex[bitgoIndex], this.transaction._fromAddresses[bitgoIndex]);
          secpTransferInput.addSignatureIdx(addressesIndex[firstIndex], this.transaction._fromAddresses[firstIndex]);
          credentials.push(
            SelectCredentialClass(
              secpTransferInput.getCredentialID(), // 9
              ['', this.transaction._fromAddresses[firstIndex].toString('hex')].map(utils.createSig)
            )
          );
        } else {
          secpTransferInput.addSignatureIdx(addressesIndex[firstIndex], this.transaction._fromAddresses[firstIndex]);
          secpTransferInput.addSignatureIdx(addressesIndex[bitgoIndex], this.transaction._fromAddresses[bitgoIndex]);
          credentials.push(
            SelectCredentialClass(
              secpTransferInput.getCredentialID(),
              [this.transaction._fromAddresses[firstIndex].toString('hex'), ''].map(utils.createSig)
            )
          );
        }

        const input: TransferableInput = new TransferableInput(
          txidBuf,
          outputidx,
          this.transaction._assetId,
          secpTransferInput
        );
        inputs.push(input);
      }
    });

    if (currentTotal.lt(totalTarget)) {
      throw new BuildTransactionError(
        `Utxo outputs get ${currentTotal.toString()} and ${totalTarget.toString()} is required`
      );
    } else if (currentTotal.gt(totalTarget)) {
      outputs.push(
        new TransferableOutput(
          this.transaction._assetId,
          new SECPTransferOutput(
            currentTotal.sub(totalTarget),
            this.transaction._fromAddresses,
            this.transaction._locktime,
            this.transaction._threshold
          )
        )
      );
    }
    return {
      inputs,
      outputs,
      credentials,
    };
  }

  // endregion
}
