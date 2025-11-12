import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BuildTransactionError, NotSupported, TransactionType } from '@bitgo/sdk-core';
import { AtomicInCTransactionBuilder } from './atomicInCTransactionBuilder';
import {
  evmSerial,
  UnsignedTx,
  Credential,
  BigIntPr,
  Int,
  Id,
  TransferableInput,
  TypeSymbols,
  Address,
  utils as FlareUtils,
  avmSerial,
} from '@flarenetwork/flarejs';
import utils from './utils';
import { DecodedUtxoObj, FlareTransactionType, SECP256K1_Transfer_Output, Tx } from './iface';

export class ImportInCTxBuilder extends AtomicInCTransactionBuilder {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /**
   * C-chain address who is target of the import.
   * Address format is eth like
   * @param {string} cAddress
   */
  to(cAddress: string): this {
    this.transaction._to = [utils.parseAddress(cAddress)];
    return this;
  }

  protected get transactionType(): TransactionType {
    return TransactionType.Import;
  }

  initBuilder(tx: Tx): this {
    const baseTx = tx as evmSerial.ImportTx;
    if (!this.verifyTxType(baseTx._type)) {
      throw new NotSupported('Transaction cannot be parsed or has an unsupported transaction type');
    }

    // The outputs is a single C-Chain address result.
    // It's expected to have only one output to the destination C-Chain address.
    const outputs = baseTx.Outs;
    if (outputs.length !== 1) {
      throw new BuildTransactionError('Transaction can have one output');
    }
    const output = outputs[0];

    const assetIdStr = Buffer.from(this.transaction._assetId).toString('hex');
    if (Buffer.from(output.assetId.toBytes()).toString('hex') !== assetIdStr) {
      throw new Error('AssetID are not equals');
    }
    this.transaction._to = [Buffer.from(output.address.toBytes())];

    const inputs = baseTx.importedInputs;
    this.transaction._utxos = this.recoverUtxos(inputs);

    // Calculate total input and output amounts
    const totalInputAmount = inputs.reduce((t, i) => t + i.amount(), BigInt(0));
    const totalOutputAmount = output.amount.value();

    // Calculate fee based on input/output difference
    const fee = totalInputAmount - totalOutputAmount;
    const feeSize = this.calculateFeeSize(baseTx);
    const feeRate = Number(fee) / feeSize;

    this.transaction._fee = {
      fee: fee.toString(),
      feeRate: feeRate,
      size: feeSize,
    };

    this.transaction.setTransaction(tx);
    return this;
  }

  static verifyTxType(txnType: string): boolean {
    return txnType === FlareTransactionType.PvmImportTx;
  }

  verifyTxType(txnType: string): boolean {
    return ImportInCTxBuilder.verifyTxType(txnType);
  }

  /**
   * Build the import in C-chain transaction
   * @protected
   */
  protected buildFlareTransaction(): void {
    // if tx has credentials, tx shouldn't change
    if (this.transaction.hasCredentials) return;
    if (this.transaction._to.length !== 1) {
      throw new Error('to is required');
    }
    if (!this.transaction._fee.feeRate) {
      throw new Error('fee rate is required');
    }

    const { inputs, amount, credentials } = this.createInputs();

    // Calculate fee
    const feeRate = BigInt(this.transaction._fee.feeRate);
    const feeSize = this.calculateFeeSize();
    const fee = feeRate * BigInt(feeSize);
    this.transaction._fee.fee = fee.toString();
    this.transaction._fee.size = feeSize;

    // Create output with required interface implementation
    const output = {
      _type: TypeSymbols.BaseTx,
      address: new Address(this.transaction._to[0]),
      amount: new BigIntPr(amount - fee),
      assetId: new Id(new Uint8Array(Buffer.from(this.transaction._assetId, 'hex'))),
      toBytes: () => new Uint8Array(),
    };

    // Create the import transaction
    const importTx = new evmSerial.ImportTx(
      new Int(this.transaction._networkID),
      new Id(new Uint8Array(Buffer.from(this.transaction._blockchainID, 'hex'))),
      new Id(new Uint8Array(this._externalChainId)),
      inputs,
      [output]
    );

    // Create unsigned transaction
    const addressMap = new FlareUtils.AddressMap([[new Address(this.transaction._fromAddresses[0]), 0]]);
    const addressMaps = new FlareUtils.AddressMaps([addressMap]);

    const unsignedTx = new UnsignedTx(
      importTx,
      [], // Empty UTXOs array, will be filled during processing
      addressMaps,
      credentials
    );

    this.transaction.setTransaction(unsignedTx);
  }

  /**
   * Create inputs from UTXOs
   * @return {
   *     inputs: TransferableInput[];
   *     credentials: Credential[];
   *     amount: bigint;
   * }
   */
  protected createInputs(): {
    inputs: TransferableInput[];
    credentials: Credential[];
    amount: bigint;
  } {
    const sender = this.transaction._fromAddresses.slice();
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
    const credentials: Credential[] = [];

    this.transaction._utxos.forEach((utxo) => {
      const amount = BigInt(utxo.amount);
      totalAmount += amount;

      // Create input with proper interface implementation
      const input = {
        _type: TypeSymbols.Input,
        amount: () => amount,
        sigIndices: sender.map((_, i) => i),
        toBytes: () => new Uint8Array(),
      };

      // Create TransferableInput with proper UTXOID implementation
      const txId = new Id(new Uint8Array(Buffer.from(utxo.txid, 'hex')));
      const outputIdxInt = new Int(Number(utxo.outputidx));
      const outputIdxBytes = new Uint8Array(Buffer.alloc(4));
      new DataView(outputIdxBytes.buffer).setInt32(0, Number(utxo.outputidx), true);
      const outputIdxId = new Id(outputIdxBytes);

      // Create asset with complete Amounter interface
      const assetIdBytes = new Uint8Array(Buffer.from(this.transaction._assetId, 'hex'));
      const assetId = {
        _type: TypeSymbols.BaseTx,
        amount: () => amount,
        toBytes: () => assetIdBytes,
        toString: () => Buffer.from(assetIdBytes).toString('hex'),
      };

      // Create TransferableInput with UTXOID using Int for outputIdx
      const transferableInput = new TransferableInput(
        {
          _type: TypeSymbols.UTXOID,
          txID: txId,
          outputIdx: outputIdxInt,
          ID: () => utxo.txid,
          toBytes: () => new Uint8Array(),
        },
        outputIdxId, // Use Id type for TransferableInput constructor
        assetId // Use asset with complete Amounter interface
      );

      // Set input properties
      Object.assign(transferableInput, { input });
      inputs.push(transferableInput);

      // Create empty credential for each input
      const emptySignatures = sender.map(() => utils.createNewSig(''));
      const credential = new Credential(emptySignatures);
      credentials.push(credential);
    });

    return {
      inputs,
      credentials,
      amount: totalAmount,
    };
  }

  /**
   * Calculate the fee size for the transaction
   */
  private calculateFeeSize(tx?: evmSerial.ImportTx): number {
    // If tx is provided, calculate based on actual transaction size
    if (tx) {
      const codec = avmSerial.getAVMManager().getDefaultCodec();
      return tx.toBytes(codec).length;
    }

    // Otherwise estimate based on typical import transaction size
    const baseSize = 256; // Base transaction size
    const inputSize = 128; // Size per input
    const outputSize = 64; // Size per output
    const numInputs = this.transaction._utxos.length;
    const numOutputs = 1; // Import tx always has 1 output

    return baseSize + inputSize * numInputs + outputSize * numOutputs;
  }

  /**
   * Recover UTXOs from imported inputs
   * @param importedInputs Array of transferable inputs
   * @returns Array of decoded UTXO objects
   */
  private recoverUtxos(importedInputs: TransferableInput[]): DecodedUtxoObj[] {
    return importedInputs.map((input) => {
      const txid = input.utxoID.toString();
      const outputidx = input.utxoID.outputIdx.toString();

      return {
        outputID: SECP256K1_Transfer_Output,
        amount: input.amount().toString(),
        txid: utils.cb58Encode(Buffer.from(txid, 'hex')),
        outputidx: outputidx,
        threshold: this.transaction._threshold,
        addresses: this.transaction._fromAddresses.map((addr) =>
          utils.addressToString(this.transaction._network.hrp, this.transaction._network.alias, Buffer.from(addr))
        ),
      };
    });
  }
}
