import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { TransactionType } from '@bitgo/sdk-core';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction';
import { TransferableInput, Int, Id, TypeSymbols, Credential } from '@flarenetwork/flarejs';
import { DecodedUtxoObj } from './iface';
import utils from './utils';

// Interface for objects that can provide an amount
interface Amounter {
  _type: TypeSymbols;
  amount: () => bigint;
  toBytes: () => Uint8Array;
}

export abstract class AtomicTransactionBuilder extends TransactionBuilder {
  protected _externalChainId: Buffer;
  protected recoverSigner = false;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this.transaction = new Transaction(_coinConfig);
    this.transaction._fee.fee = this.fixedFee;
  }

  /**
   * Create inputs and outputs from UTXOs
   * @param {bigint} amount Amount to transfer
   * @return {
   *     inputs: TransferableInput[];
   *     outputs: TransferableInput[];
   *     credentials: Credential[];
   * }
   * @protected
   */
  protected createInputOutput(amount: bigint): {
    inputs: TransferableInput[];
    outputs: TransferableInput[];
    credentials: Credential[];
  } {
    const sender = (this.transaction as Transaction)._fromAddresses.slice();
    if (this.recoverSigner) {
      // switch first and last signer
      const tmp = sender.pop();
      sender.push(sender[0]);
      if (tmp) {
        sender[0] = tmp;
      }
    }

    let totalAmount = BigInt(0);
    const inputs: TransferableInput[] = [];
    const outputs: TransferableInput[] = [];
    const credentials: Credential[] = [];

    (this.transaction as Transaction)._utxos.forEach((utxo: DecodedUtxoObj) => {
      const utxoAmount = BigInt(utxo.amount);
      totalAmount += utxoAmount;

      // Create input
      const input = {
        _type: TypeSymbols.Input,
        amount: () => utxoAmount,
        sigIndices: sender.map((_, i) => i),
        toBytes: () => new Uint8Array(),
      };

      // Create asset with Amounter interface
      const assetId: Amounter = {
        _type: TypeSymbols.BaseTx,
        amount: () => utxoAmount,
        toBytes: () => {
          const bytes = new Uint8Array(Buffer.from((this.transaction as Transaction)._assetId, 'hex'));
          return bytes;
        },
      };

      // Create TransferableInput
      const transferableInput = new TransferableInput(
        {
          _type: TypeSymbols.UTXOID,
          txID: new Id(new Uint8Array(Buffer.from(utxo.txid, 'hex'))),
          outputIdx: new Int(Number(utxo.outputidx)),
          ID: () => utxo.txid,
          toBytes: () => {
            const txIdBytes = new Uint8Array(Buffer.from(utxo.txid, 'hex'));
            const outputIdxBytes = new Uint8Array(4);
            new DataView(outputIdxBytes.buffer).setInt32(0, Number(utxo.outputidx), true);
            return Buffer.concat([txIdBytes, outputIdxBytes]);
          },
        },
        new Id(new Uint8Array(Buffer.from(utxo.outputidx.toString()))),
        assetId
      );

      // Set input properties
      Object.assign(transferableInput, { input });
      inputs.push(transferableInput);

      // Create empty credential for each input
      const emptySignatures = sender.map(() => utils.createNewSig(''));
      credentials.push(new Credential(emptySignatures));
    });

    // Create output if there is change
    if (totalAmount > amount) {
      const changeAmount = totalAmount - amount;
      const output = {
        _type: TypeSymbols.BaseTx,
        amount: () => changeAmount,
        addresses: sender,
        locktime: (this.transaction as Transaction)._locktime,
        threshold: (this.transaction as Transaction)._threshold,
        toBytes: () => new Uint8Array(),
      };

      // Create asset with Amounter interface
      const assetId: Amounter = {
        _type: TypeSymbols.BaseTx,
        amount: () => changeAmount,
        toBytes: () => {
          const bytes = new Uint8Array(Buffer.from((this.transaction as Transaction)._assetId, 'hex'));
          return bytes;
        },
      };

      // Create TransferableOutput
      const transferableOutput = new TransferableInput(
        {
          _type: TypeSymbols.UTXOID,
          txID: new Id(new Uint8Array(32)),
          outputIdx: new Int(0),
          ID: () => '',
          toBytes: () => {
            const txIdBytes = new Uint8Array(32);
            const outputIdxBytes = new Uint8Array(4);
            return Buffer.concat([txIdBytes, outputIdxBytes]);
          },
        },
        new Id(new Uint8Array([0])),
        assetId
      );

      // Set output properties
      Object.assign(transferableOutput, { output });
      outputs.push(transferableOutput);
    }

    return {
      inputs,
      outputs,
      credentials,
    };
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    this.buildFlareTransaction();
    this.setTransactionType(this.transactionType);
    if (this.hasSigner()) {
      // Sign sequentially to ensure proper order
      for (const keyPair of this._signer) {
        await this.transaction.sign(keyPair);
      }
    }
    return this.transaction;
  }

  /**
   * Builds the Flare transaction. Transaction field is changed.
   */
  protected abstract buildFlareTransaction(): void;

  protected abstract get transactionType(): TransactionType;

  /**
   * Fee is fix for AVM atomic tx.
   *
   * @returns network.txFee
   * @protected
   */
  protected get fixedFee(): string {
    return this.transaction._network.txFee;
  }

  /**
   * Set the transaction type
   *
   * @param {TransactionType} transactionType The transaction type to be set
   */
  setTransactionType(transactionType: TransactionType): void {
    this.transaction._type = transactionType;
  }

  /**
   * The internal chain is the one set for the coin in coinConfig.network. The external chain is the other chain involved.
   * The external chain id is the source on import and the destination on export.
   *
   * @param {string} chainId - id of the external chain
   */
  externalChainId(chainId: string | Buffer): this {
    const newTargetChainId = typeof chainId === 'string' ? utils.cb58Decode(chainId) : Buffer.from(chainId);
    this.validateChainId(newTargetChainId);
    this._externalChainId = newTargetChainId;
    return this;
  }

  /**
   * Set the transaction fee
   *
   * @param {string | bigint} feeValue - the fee value
   */
  fee(feeValue: string | bigint): this {
    const fee = typeof feeValue === 'string' ? feeValue : feeValue.toString();
    (this.transaction as Transaction)._fee.fee = fee;
    return this;
  }
}
