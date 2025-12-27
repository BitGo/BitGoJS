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

  initBuilder(tx: Tx, rawBytes?: Buffer, parsedCredentials?: Credential[]): this {
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

    if (Buffer.from(output.assetId.toBytes()).toString('hex') !== this.transaction._assetId) {
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
    // Use integer division to ensure feeRate can be converted back to BigInt
    const feeRate = Math.floor(Number(fee) / feeSize);

    this.transaction._fee = {
      fee: fee.toString(),
      feeRate: feeRate,
      size: feeSize,
    };

    // Use credentials passed from TransactionBuilderFactory (properly extracted using codec)
    const credentials = parsedCredentials || [];
    const hasCredentials = credentials.length > 0;

    // If it's a signed transaction, store the original raw bytes to preserve exact format
    if (hasCredentials && rawBytes) {
      this.transaction._rawSignedBytes = rawBytes;
    }

    // Extract threshold from first input's sigIndicies (number of required signatures)
    const firstInput = inputs[0];
    const inputThreshold = firstInput.sigIndicies().length || this.transaction._threshold;
    this.transaction._threshold = inputThreshold;

    // Create AddressMaps based on signature slot order (matching credential order), not sorted addresses
    // This matches the approach used in credentials: addressesIndex determines signature order
    // AddressMaps should map addresses to signature slots in the same order as credentials
    // If _fromAddresses is available, create AddressMap based on UTXO order (matching credential order)
    // Otherwise, fall back to mapping just the output address
    const firstUtxo = this.transaction._utxos[0];
    let addressMap: FlareUtils.AddressMap;
    if (
      firstUtxo &&
      firstUtxo.addresses &&
      firstUtxo.addresses.length > 0 &&
      this.transaction._fromAddresses &&
      this.transaction._fromAddresses.length >= this.transaction._threshold
    ) {
      // Use centralized method for AddressMap creation
      addressMap = this.createAddressMapForUtxo(firstUtxo, this.transaction._threshold);
    } else {
      // Fallback: map output address to slot 0 (for C-chain imports, output is the destination)
      // Or map addresses sequentially if _fromAddresses is available but UTXO addresses are not
      addressMap = new FlareUtils.AddressMap();
      if (this.transaction._fromAddresses && this.transaction._fromAddresses.length >= this.transaction._threshold) {
        this.transaction._fromAddresses.slice(0, this.transaction._threshold).forEach((addr, i) => {
          addressMap.set(new Address(addr), i);
        });
      } else {
        // Last resort: map output address
        const toAddress = new Address(output.address.toBytes());
        addressMap.set(toAddress, 0);
      }
    }

    const addressMaps = new FlareUtils.AddressMaps([addressMap]);

    // When credentials were extracted, use them directly to preserve existing signatures
    // For initBuilder, _fromAddresses may not be set yet, so use all zeros for credential slots
    let txCredentials: Credential[];
    if (credentials.length > 0) {
      txCredentials = credentials;
    } else {
      // Create empty credential with threshold number of signature slots (all zeros)
      const emptySignatures: ReturnType<typeof utils.createNewSig>[] = [];
      for (let i = 0; i < inputThreshold; i++) {
        emptySignatures.push(utils.createNewSig(''));
      }
      txCredentials = [new Credential(emptySignatures)];
    }

    const unsignedTx = new UnsignedTx(baseTx, [], addressMaps, txCredentials);

    this.transaction.setTransaction(unsignedTx);
    return this;
  }

  static verifyTxType(txnType: string): boolean {
    return txnType === FlareTransactionType.EvmImportTx;
  }

  verifyTxType(txnType: string): boolean {
    return ImportInCTxBuilder.verifyTxType(txnType);
  }

  /**
   * Build the import in C-chain transaction
   * @protected
   */
  protected buildFlareTransaction(): void {
    // if tx has credentials or was already recovered from raw, tx shouldn't change
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

    // Create EVM output using proper FlareJS class
    const output = new evmSerial.Output(
      new Address(this.transaction._to[0]),
      new BigIntPr(amount - fee),
      new Id(new Uint8Array(Buffer.from(this.transaction._assetId, 'hex')))
    );

    // Create the import transaction
    const importTx = new evmSerial.ImportTx(
      new Int(this.transaction._networkID),
      new Id(new Uint8Array(Buffer.from(this.transaction._blockchainID, 'hex'))),
      new Id(new Uint8Array(this._externalChainId)),
      inputs,
      [output]
    );

    // Create AddressMaps based on signature slot order (matching credential order), not sorted addresses
    // This matches the approach used in credentials: addressesIndex determines signature order
    // AddressMaps should map addresses to signature slots in the same order as credentials
    // For C-chain imports, we typically have one input, so use the first UTXO
    // Use centralized method for AddressMap creation
    const firstUtxo = this.transaction._utxos[0];
    const addressMap = firstUtxo
      ? this.createAddressMapForUtxo(firstUtxo, this.transaction._threshold)
      : new FlareUtils.AddressMap();
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

      // Create signature indices for threshold
      const sigIndices: number[] = [];
      for (let i = 0; i < this.transaction._threshold; i++) {
        sigIndices.push(i);
      }

      // Use fromNative to create TransferableInput (same pattern as ImportInPTxBuilder)
      // fromNative expects cb58-encoded strings for txId and assetId
      const txIdCb58 = utxo.txid; // Already cb58 encoded
      const assetIdCb58 = utils.cb58Encode(Buffer.from(this.transaction._assetId, 'hex'));

      const transferableInput = TransferableInput.fromNative(
        txIdCb58,
        Number(utxo.outputidx),
        assetIdCb58,
        amount,
        sigIndices
      );

      inputs.push(transferableInput);

      // Create credential with empty signatures for slot identification
      // Match avaxp behavior: dynamic ordering based on addressesIndex from UTXO
      // Use centralized method for credential creation
      credentials.push(this.createCredentialForUtxo(utxo, this.transaction._threshold));
    });

    return {
      inputs,
      credentials,
      amount: totalAmount,
    };
  }

  /**
   * Calculate the fee size for the transaction
   * For C-chain imports, the feeRate is treated as an absolute fee value
   */
  private calculateFeeSize(tx?: evmSerial.ImportTx): number {
    // If tx is provided, calculate based on actual transaction size
    if (tx) {
      const codec = avmSerial.getAVMManager().getDefaultCodec();
      return tx.toBytes(codec).length;
    }

    // For C-chain imports, treat feeRate as the absolute fee (multiplier of 1)
    return 1;
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
