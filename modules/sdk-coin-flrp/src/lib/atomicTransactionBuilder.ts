import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { TransactionType } from '@bitgo/sdk-core';
import { TransactionBuilder } from './transactionBuilder';
import { Transaction } from './transaction';
import {
  TransferableInput,
  Int,
  Id,
  TypeSymbols,
  Credential,
  Address,
  utils as FlareUtils,
} from '@flarenetwork/flarejs';
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

      // Create credential with empty signatures for slot identification
      // Match avaxp behavior: dynamic ordering based on addressesIndex from UTXO
      const hasAddresses = sender && sender.length >= (this.transaction as Transaction)._threshold;

      if (!hasAddresses) {
        // If addresses not available, use all zeros
        const emptySignatures = sender.map(() => utils.createNewSig(''));
        credentials.push(new Credential(emptySignatures));
      } else {
        // Compute addressesIndex: position of each _fromAddresses in UTXO's address list
        const utxoAddresses = utxo.addresses.map((a: string) => utils.parseAddress(a));
        const addressesIndex = sender.map((a) =>
          utxoAddresses.findIndex((u) => Buffer.compare(Buffer.from(u), Buffer.from(a)) === 0)
        );

        // either user (0) or recovery (2)
        const firstIndex = this.recoverSigner ? 2 : 0;
        const bitgoIndex = 1;

        // Dynamic ordering based on addressesIndex
        let emptySignatures: ReturnType<typeof utils.createNewSig>[];
        if (addressesIndex[bitgoIndex] < addressesIndex[firstIndex]) {
          // Bitgo comes first in signature order: [zeros, userAddress]
          emptySignatures = [
            utils.createNewSig(''),
            utils.createEmptySigWithAddress(Buffer.from(sender[firstIndex]).toString('hex')),
          ];
        } else {
          // User comes first in signature order: [userAddress, zeros]
          emptySignatures = [
            utils.createEmptySigWithAddress(Buffer.from(sender[firstIndex]).toString('hex')),
            utils.createNewSig(''),
          ];
        }
        credentials.push(new Credential(emptySignatures));
      }
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

  /**
   * Create credential with dynamic ordering based on addressesIndex from UTXO
   * Matches avaxp behavior: signature order depends on UTXO address positions
   * @param utxo - The UTXO to create credential for
   * @param threshold - Number of signatures required
   * @returns Credential with empty signatures ordered based on UTXO positions
   * @protected
   */
  protected createCredentialForUtxo(utxo: DecodedUtxoObj, threshold: number): Credential {
    const sender = (this.transaction as Transaction)._fromAddresses;
    const hasAddresses = sender && sender.length >= threshold;

    if (!hasAddresses || !utxo.addresses || utxo.addresses.length === 0) {
      // Fallback: use all zeros if no addresses available
      const emptySignatures: ReturnType<typeof utils.createNewSig>[] = [];
      for (let i = 0; i < threshold; i++) {
        emptySignatures.push(utils.createNewSig(''));
      }
      return new Credential(emptySignatures);
    }

    // Compute addressesIndex: position of each _fromAddresses in UTXO's address list
    const utxoAddresses = utxo.addresses.map((a) => utils.parseAddress(a));
    const addressesIndex = sender.map((a) =>
      utxoAddresses.findIndex((u) => Buffer.compare(Buffer.from(u), Buffer.from(a)) === 0)
    );

    // either user (0) or recovery (2)
    const firstIndex = this.recoverSigner ? 2 : 0;
    const bitgoIndex = 1;

    // Dynamic ordering based on addressesIndex
    let emptySignatures: ReturnType<typeof utils.createNewSig>[];
    if (addressesIndex[bitgoIndex] < addressesIndex[firstIndex]) {
      // Bitgo comes first in signature order: [zeros, userAddress]
      emptySignatures = [
        utils.createNewSig(''),
        utils.createEmptySigWithAddress(Buffer.from(sender[firstIndex]).toString('hex')),
      ];
    } else {
      // User comes first in signature order: [userAddress, zeros]
      emptySignatures = [
        utils.createEmptySigWithAddress(Buffer.from(sender[firstIndex]).toString('hex')),
        utils.createNewSig(''),
      ];
    }
    return new Credential(emptySignatures);
  }

  /**
   * Create AddressMap based on signature slot order (matching credential order), not sorted addresses
   * This matches the approach used in credentials: addressesIndex determines signature order
   * AddressMaps should map addresses to signature slots in the same order as credentials
   * @param utxo - The UTXO to create AddressMap for
   * @param threshold - Number of signatures required
   * @returns AddressMap that maps addresses to signature slots based on UTXO order
   * @protected
   */
  protected createAddressMapForUtxo(utxo: DecodedUtxoObj, threshold: number): FlareUtils.AddressMap {
    const addressMap = new FlareUtils.AddressMap();
    const sender = (this.transaction as Transaction)._fromAddresses;

    // If UTXO has addresses, compute addressesIndex to determine signature order
    if (utxo && utxo.addresses && utxo.addresses.length > 0 && sender && sender.length >= threshold) {
      const utxoAddresses = utxo.addresses.map((a) => utils.parseAddress(a));
      const addressesIndex = sender.map((a) =>
        utxoAddresses.findIndex((u) => Buffer.compare(Buffer.from(u), Buffer.from(a)) === 0)
      );

      const firstIndex = this.recoverSigner ? 2 : 0;
      const bitgoIndex = 1;

      // Determine signature slot order based on addressesIndex (same logic as credentials)
      if (addressesIndex[bitgoIndex] < addressesIndex[firstIndex]) {
        // Bitgo comes first: slot 0 = bitgo, slot 1 = firstIndex
        addressMap.set(new Address(sender[bitgoIndex]), 0);
        addressMap.set(new Address(sender[firstIndex]), 1);
      } else {
        // User/recovery comes first: slot 0 = firstIndex, slot 1 = bitgo
        addressMap.set(new Address(sender[firstIndex]), 0);
        addressMap.set(new Address(sender[bitgoIndex]), 1);
      }
    } else {
      // Fallback: map addresses sequentially if no UTXO addresses available
      if (sender && sender.length >= threshold) {
        sender.slice(0, threshold).forEach((addr, i) => {
          addressMap.set(new Address(addr), i);
        });
      }
    }

    return addressMap;
  }
}
