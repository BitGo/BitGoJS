import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BuildTransactionError, NotSupported, TransactionType } from '@bitgo/sdk-core';
import { AtomicTransactionBuilder } from './atomicTransactionBuilder';
import {
  pvmSerial,
  avaxSerial,
  UnsignedTx,
  BigIntPr,
  Int,
  Id,
  TransferableInput,
  TransferableOutput,
  TransferInput,
  Address,
  utils as FlareUtils,
  TransferOutput,
  OutputOwners,
  Credential,
  Bytes,
} from '@flarenetwork/flarejs';
import utils from './utils';
import { DecodedUtxoObj, SECP256K1_Transfer_Output, FlareTransactionType, Tx } from './iface';

export class ExportInPTxBuilder extends AtomicTransactionBuilder {
  private _amount: bigint;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    // For Export FROM P-chain:
    // - external chain (destination) is C-chain
    // - blockchain ID (source) is P-chain
    this._externalChainId = utils.cb58Decode(this.transaction._network.cChainBlockchainID);
    // P-chain blockchain ID (from network config - decode from cb58 to hex)
    this.transaction._blockchainID = Buffer.from(utils.cb58Decode(this.transaction._network.blockchainID)).toString(
      'hex'
    );
  }

  protected get transactionType(): TransactionType {
    return TransactionType.Export;
  }

  /**
   * Amount is a bigint that specifies the quantity of the asset that this output owns. Must be positive.
   * @param {bigint | string} amount The withdrawal amount
   */
  amount(value: bigint | string): this {
    const valueBigInt = typeof value === 'string' ? BigInt(value) : value;
    this.validateAmount(valueBigInt);
    this._amount = valueBigInt;
    return this;
  }

  initBuilder(tx: Tx, rawBytes?: Buffer): this {
    const exportTx = tx as pvmSerial.ExportTx;

    if (!this.verifyTxType(exportTx._type)) {
      throw new NotSupported('Transaction cannot be parsed or has an unsupported transaction type');
    }

    // The exportedOutputs is a TransferableOutput array.
    // It's expected to have only one output with the addresses of the sender.
    const outputs = exportTx.outs;
    if (outputs.length !== 1) {
      throw new BuildTransactionError('Transaction can have one external output');
    }

    const output = outputs[0];
    const outputTransfer = output.output as TransferOutput;
    const assetId = output.assetId.toBytes();
    if (Buffer.compare(Buffer.from(assetId), Buffer.from(this.transaction._assetId, 'hex')) !== 0) {
      throw new Error('The Asset ID of the output does not match the transaction');
    }

    const outputOwners = outputTransfer.outputOwners;

    // Set locktime from output
    this.transaction._locktime = outputOwners.locktime.value();

    // Set threshold from output
    this.transaction._threshold = outputOwners.threshold.value();

    // Convert output addresses to buffers and set as fromAddresses
    this.transaction._fromAddresses = outputOwners.addrs.map((addr) => Buffer.from(addr.toBytes()));

    // Set external chain ID from the destination chain
    this._externalChainId = Buffer.from(exportTx.destination.toBytes());

    // Set amount from exported output
    this._amount = outputTransfer.amount();

    // Recover UTXOs from base tx inputs
    this.transaction._utxos = this.recoverUtxos([...exportTx.baseTx.inputs]);

    // Calculate and set fee from input/output difference
    const totalInputAmount = exportTx.baseTx.inputs.reduce((sum, input) => sum + input.amount(), BigInt(0));
    const changeOutputAmount = exportTx.baseTx.outputs.reduce((sum, out) => {
      const transferOut = out.output as TransferOutput;
      return sum + transferOut.amount();
    }, BigInt(0));
    const fee = totalInputAmount - changeOutputAmount - this._amount;
    this.transaction._fee.fee = fee.toString();

    // Extract credentials from raw bytes
    let hasCredentials = false;
    let credentials: Credential[] = [];

    if (rawBytes) {
      // Try standard extraction first
      const result = utils.extractCredentialsFromRawBytes(rawBytes, exportTx, 'PVM');
      hasCredentials = result.hasCredentials;
      credentials = result.credentials;

      // If extraction failed but raw bytes are longer, try parsing credentials at known offset
      if ((!hasCredentials || credentials.length === 0) && rawBytes.length > 300) {
        const codec = FlareUtils.getManagerForVM('PVM').getDefaultCodec();
        const txBytesLength = exportTx.toBytes(codec).length;

        if (rawBytes.length > txBytesLength) {
          hasCredentials = true;
          const credResult = utils.parseCredentialsAtOffset(rawBytes, txBytesLength);
          if (credResult.length > 0) {
            credentials = credResult;
          }
        }
      }
    }

    // If we have parsed credentials with the correct number of credentials for the inputs,
    // use them directly (preserves existing signatures)
    const numInputs = exportTx.baseTx.inputs.length;
    const useDirectCredentials = hasCredentials && credentials.length === numInputs;

    // If there are credentials in raw bytes, store the original bytes to preserve exact format
    if (rawBytes && hasCredentials) {
      this.transaction._rawSignedBytes = rawBytes;
    }

    // Create proper UnsignedTx wrapper with credentials
    const sortedAddresses = [...this.transaction._fromAddresses].sort((a, b) => Buffer.compare(a, b));

    // Helper function to check if a signature is empty (contains no real signature data)
    // A real ECDSA signature will never start with 45 bytes of zeros
    const isSignatureEmpty = (sig: string): boolean => {
      if (!sig) return true;
      const cleanSig = utils.removeHexPrefix(sig);
      if (cleanSig.length === 0) return true;
      // Check if the first 90 hex chars (45 bytes) are all zeros
      // Real signatures from secp256k1 will never have this pattern
      const first90Chars = cleanSig.substring(0, 90);
      return first90Chars === '0'.repeat(90) || first90Chars === '0'.repeat(first90Chars.length);
    };

    // Build txCredentials - either use direct credentials or reconstruct with embedded addresses
    let txCredentials: Credential[];

    if (useDirectCredentials) {
      // Use the extracted credentials directly - they already have the correct signatures
      // Just ensure empty slots have embedded addresses for signing identification
      txCredentials = credentials;
    } else {
      // Reconstruct credentials from scratch with embedded addresses
      txCredentials = exportTx.baseTx.inputs.map((input, idx) => {
        const transferInput = input.input as TransferInput;
        const inputThreshold = transferInput.sigIndicies().length || this.transaction._threshold;

        // Get existing signatures from parsed credentials if available
        const existingSigs: string[] = [];
        if (idx < credentials.length) {
          const existingCred = credentials[idx];
          existingSigs.push(...existingCred.getSignatures());
        }

        // Create credential with correct number of slots, preserving existing signatures
        // Empty slots get embedded addresses for slot identification
        const sigSlots: ReturnType<typeof utils.createNewSig>[] = [];
        for (let i = 0; i < inputThreshold; i++) {
          const existingSig = i < existingSigs.length ? existingSigs[i] : null;

          if (existingSig && !isSignatureEmpty(existingSig)) {
            // Use existing non-empty signature (real signature from signing)
            const sigHex = utils.removeHexPrefix(existingSig);
            sigSlots.push(utils.createNewSig(sigHex));
          } else {
            // Empty slot - create with embedded address for slot identification
            const addrHex = Buffer.from(sortedAddresses[i]).toString('hex');
            sigSlots.push(utils.createEmptySigWithAddress(addrHex));
          }
        }
        return new Credential(sigSlots);
      });
    }

    // Create address maps for signing - one per input/credential
    // Each address map contains all addresses mapped to their indices
    const addressMaps = txCredentials.map(() => {
      const addressMap = new FlareUtils.AddressMap();
      sortedAddresses.forEach((addr, i) => {
        addressMap.set(new Address(addr), i);
      });
      return addressMap;
    });

    // Always create a new UnsignedTx with properly structured credentials
    const unsignedTx = new UnsignedTx(exportTx, [], new FlareUtils.AddressMaps(addressMaps), txCredentials);

    this.transaction.setTransaction(unsignedTx);
    return this;
  }

  static verifyTxType(txnType: string): boolean {
    return txnType === FlareTransactionType.PvmExportTx;
  }

  verifyTxType(txnType: string): boolean {
    return ExportInPTxBuilder.verifyTxType(txnType);
  }

  /**
   * Build the export transaction for P-chain
   * @protected
   */
  protected buildFlareTransaction(): void {
    // if tx has credentials, tx shouldn't change
    if (this.transaction.hasCredentials) return;

    const { inputs, changeOutputs, credentials, totalAmount } = this.createExportInputs();

    // Calculate fee from transaction fee settings
    const fee = BigInt(this.transaction.fee.fee);
    const targetAmount = this._amount + fee;

    // Verify we have enough funds
    if (totalAmount < targetAmount) {
      throw new BuildTransactionError(`Insufficient funds: have ${totalAmount}, need ${targetAmount}`);
    }

    // Create the BaseTx for the P-chain export transaction
    const baseTx = new avaxSerial.BaseTx(
      new Int(this.transaction._networkID),
      new Id(Buffer.from(this.transaction._blockchainID, 'hex')),
      changeOutputs, // change outputs
      inputs, // inputs
      new Bytes(new Uint8Array(0)) // empty memo
    );

    // Create the P-chain export transaction using pvmSerial.ExportTx
    const exportTx = new pvmSerial.ExportTx(
      baseTx,
      new Id(this._externalChainId), // destinationChain (C-chain)
      this.exportedOutputs() // exportedOutputs
    );

    // Create address maps for signing - one per input/credential
    const sortedAddresses = [...this.transaction._fromAddresses].sort((a, b) => Buffer.compare(a, b));
    const addressMaps = credentials.map(() => {
      const addressMap = new FlareUtils.AddressMap();
      sortedAddresses.forEach((addr, i) => {
        addressMap.set(new Address(addr), i);
      });
      return addressMap;
    });

    // Create unsigned transaction
    const unsignedTx = new UnsignedTx(
      exportTx,
      [], // Empty UTXOs array
      new FlareUtils.AddressMaps(addressMaps),
      credentials
    );

    this.transaction.setTransaction(unsignedTx);
  }

  /**
   * Create inputs from UTXOs for P-chain export
   * Only selects enough UTXOs to cover the target amount (amount + fee)
   * @returns inputs, change outputs, credentials, and total amount
   */
  protected createExportInputs(): {
    inputs: TransferableInput[];
    changeOutputs: TransferableOutput[];
    credentials: Credential[];
    totalAmount: bigint;
  } {
    const sender = [...this.transaction._fromAddresses];
    if (this.recoverSigner) {
      // switch first and last signer
      const tmp = sender.pop();
      sender.push(sender[0]);
      if (tmp) {
        sender[0] = tmp;
      }
    }

    const fee = BigInt(this.transaction.fee.fee);
    const targetAmount = this._amount + fee;

    let totalAmount = BigInt(0);
    const inputs: TransferableInput[] = [];
    const credentials: Credential[] = [];

    // Change output threshold is always 1 (matching Flare protocol behavior)
    // This allows easier spending of change while maintaining security for export outputs
    const changeOutputThreshold = 1;

    // Only consume enough UTXOs to cover the target amount (in array order)
    // Inputs will be sorted after selection
    for (const utxo of this.transaction._utxos) {
      // Stop if we already have enough
      if (totalAmount >= targetAmount) {
        break;
      }

      const amount = BigInt(utxo.amount);
      totalAmount += amount;

      // Use the UTXO's own threshold for signature indices
      const utxoThreshold = utxo.threshold || this.transaction._threshold;

      // Create signature indices for the UTXO's threshold
      const sigIndices: number[] = [];
      for (let i = 0; i < utxoThreshold; i++) {
        sigIndices.push(i);
      }

      // Use fromNative to create TransferableInput
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

      // Create credential with empty signatures that have embedded addresses for slot identification
      // This allows the signing logic to determine which slot belongs to which address
      const sortedAddrs = [...this.transaction._fromAddresses].sort((a, b) => Buffer.compare(a, b));
      const emptySignatures = sigIndices.map((idx) => {
        const addrHex = Buffer.from(sortedAddrs[idx]).toString('hex');
        return utils.createEmptySigWithAddress(addrHex);
      });
      credentials.push(new Credential(emptySignatures));
    }

    // Create change output if there is remaining amount after export and fee
    const changeOutputs: TransferableOutput[] = [];
    const changeAmount = totalAmount - this._amount - fee;

    if (changeAmount > BigInt(0)) {
      const assetIdBytes = new Uint8Array(Buffer.from(this.transaction._assetId, 'hex'));

      // Create OutputOwners with the P-chain addresses (sorted by byte value as per AVAX protocol)
      // Use threshold=1 for change outputs (matching Flare protocol behavior)
      const sortedAddresses = [...this.transaction._fromAddresses].sort((a, b) => Buffer.compare(a, b));
      const outputOwners = new OutputOwners(
        new BigIntPr(this.transaction._locktime),
        new Int(changeOutputThreshold),
        sortedAddresses.map((addr) => new Address(addr))
      );

      const transferOutput = new TransferOutput(new BigIntPr(changeAmount), outputOwners);
      const changeOutput = new TransferableOutput(new Id(assetIdBytes), transferOutput);
      changeOutputs.push(changeOutput);
    }

    // Sort inputs lexicographically by txid (Avalanche protocol requirement)
    const sortedInputsWithCredentials = inputs
      .map((input, i) => ({ input, credential: credentials[i] }))
      .sort((a, b) => {
        const aTxId = Buffer.from(a.input.utxoID.txID.toBytes());
        const bTxId = Buffer.from(b.input.utxoID.txID.toBytes());
        return Buffer.compare(aTxId, bTxId);
      });

    return {
      inputs: sortedInputsWithCredentials.map((x) => x.input),
      changeOutputs,
      credentials: sortedInputsWithCredentials.map((x) => x.credential),
      totalAmount,
    };
  }

  /**
   * Create the ExportedOutputs where the recipient address are the sender.
   * Later an importTx should complete the operations signing with the same keys.
   * @protected
   */
  protected exportedOutputs(): TransferableOutput[] {
    const assetIdBytes = new Uint8Array(Buffer.from(this.transaction._assetId, 'hex'));

    // Create OutputOwners with sorted addresses
    const sortedAddresses = [...this.transaction._fromAddresses].sort((a, b) => Buffer.compare(a, b));
    const outputOwners = new OutputOwners(
      new BigIntPr(this.transaction._locktime),
      new Int(this.transaction._threshold),
      sortedAddresses.map((addr) => new Address(addr))
    );

    const output = new TransferOutput(new BigIntPr(this._amount), outputOwners);

    return [new TransferableOutput(new Id(assetIdBytes), output)];
  }

  /**
   * Recover UTXOs from inputs
   * @param inputs Array of TransferableInput
   * @returns Array of decoded UTXO objects
   */
  private recoverUtxos(inputs: TransferableInput[]): DecodedUtxoObj[] {
    return inputs.map((input) => {
      const utxoId = input.utxoID;
      // Get the threshold from the input's sigIndices length
      const transferInput = input.input as TransferInput;
      const inputThreshold = transferInput.sigIndicies().length;
      return {
        outputID: SECP256K1_Transfer_Output,
        amount: input.amount().toString(),
        txid: utils.cb58Encode(Buffer.from(utxoId.txID.toBytes())),
        outputidx: utxoId.outputIdx.value().toString(),
        threshold: inputThreshold || this.transaction._threshold,
        addresses: this.transaction._fromAddresses.map((addr) =>
          utils.addressToString(this.transaction._network.hrp, this.transaction._network.alias, Buffer.from(addr))
        ),
      };
    });
  }
}
