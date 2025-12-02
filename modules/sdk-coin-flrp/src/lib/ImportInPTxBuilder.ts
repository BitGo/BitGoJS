import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BuildTransactionError, NotSupported, TransactionType } from '@bitgo/sdk-core';
import { AtomicTransactionBuilder } from './atomicTransactionBuilder';
import {
  pvmSerial,
  avaxSerial,
  UnsignedTx,
  Int,
  Id,
  TransferableInput,
  TransferableOutput,
  TransferOutput,
  TransferInput,
  OutputOwners,
  utils as FlareUtils,
  Address,
  BigIntPr,
  Credential,
  Bytes,
} from '@flarenetwork/flarejs';
import utils from './utils';
import { DecodedUtxoObj, FlareTransactionType, SECP256K1_Transfer_Output, Tx } from './iface';

export class ImportInPTxBuilder extends AtomicTransactionBuilder {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    // For Import INTO P-chain:
    // - external chain (source) is C-chain
    // - blockchain ID (destination) is P-chain
    this._externalChainId = utils.cb58Decode(this.transaction._network.cChainBlockchainID);
    // P-chain blockchain ID (from network config - typically all zeros for primary network)
    this.transaction._blockchainID = Buffer.from(utils.cb58Decode(this.transaction._network.blockchainID)).toString(
      'hex'
    );
  }

  protected get transactionType(): TransactionType {
    return TransactionType.Import;
  }

  initBuilder(tx: Tx, rawBytes?: Buffer, parsedCredentials?: Credential[]): this {
    const importTx = tx as pvmSerial.ImportTx;

    if (!this.verifyTxType(importTx._type)) {
      throw new NotSupported('Transaction cannot be parsed or has an unsupported transaction type');
    }

    // The regular change output is the tx output in Import tx.
    // It's expected to have only one output with the addresses of the sender.
    const outputs = importTx.baseTx.outputs;
    if (outputs.length !== 1) {
      throw new BuildTransactionError('Transaction can have one external output');
    }

    const output = outputs[0];
    const assetId = output.assetId.toBytes();
    if (Buffer.compare(assetId, Buffer.from(this.transaction._assetId, 'hex')) !== 0) {
      throw new Error('The Asset ID of the output does not match the transaction');
    }

    const transferOutput = output.output as TransferOutput;
    const outputOwners = transferOutput.outputOwners;

    // Set locktime from output
    this.transaction._locktime = outputOwners.locktime.value();

    // Set threshold from output
    this.transaction._threshold = outputOwners.threshold.value();

    // Convert output addresses to buffers and set as fromAddresses
    this.transaction._fromAddresses = outputOwners.addrs.map((addr) => Buffer.from(addr.toBytes()));

    // Set external chain ID from the source chain
    this._externalChainId = Buffer.from(importTx.sourceChain.toBytes());

    // Recover UTXOs from imported inputs
    this.transaction._utxos = this.recoverUtxos(importTx.ins);

    // Calculate and set fee from input/output difference
    const totalInputAmount = importTx.ins.reduce((sum, input) => sum + input.amount(), BigInt(0));
    const outputAmount = transferOutput.amount();
    const fee = totalInputAmount - outputAmount;
    this.transaction._fee.fee = fee.toString();

    // Use credentials passed from TransactionBuilderFactory (properly extracted using codec)
    const credentials = parsedCredentials || [];
    const hasCredentials = credentials.length > 0;

    // If there are credentials, store the original bytes to preserve exact format
    if (rawBytes && hasCredentials) {
      this.transaction._rawSignedBytes = rawBytes;
    }

    // Create proper UnsignedTx wrapper with credentials
    const sortedAddresses = [...this.transaction._fromAddresses].sort((a, b) => Buffer.compare(a, b));
    const addressMaps = sortedAddresses.map((a, i) => new FlareUtils.AddressMap([[new Address(a), i]]));

    // When credentials were extracted, use them directly to preserve existing signatures
    const txCredentials =
      credentials.length > 0
        ? credentials
        : [new Credential(sortedAddresses.slice(0, this.transaction._threshold).map(() => utils.createNewSig('')))];

    const unsignedTx = new UnsignedTx(importTx, [], new FlareUtils.AddressMaps(addressMaps), txCredentials);

    this.transaction.setTransaction(unsignedTx);
    return this;
  }

  static verifyTxType(txnType: string): boolean {
    return txnType === FlareTransactionType.PvmImportTx;
  }

  verifyTxType(txnType: string): boolean {
    return ImportInPTxBuilder.verifyTxType(txnType);
  }

  /**
   * Build the import transaction for P-chain
   * @protected
   */
  protected buildFlareTransaction(): void {
    // if tx has credentials, tx shouldn't change
    if (this.transaction.hasCredentials) return;

    const { inputs, credentials, totalAmount } = this.createImportInputs();

    // Calculate fee from transaction fee settings
    const fee = BigInt(this.transaction.fee.fee);
    const outputAmount = totalAmount - fee;

    // Create the output for P-chain (TransferableOutput with TransferOutput)
    const assetIdBytes = new Uint8Array(Buffer.from(this.transaction._assetId, 'hex'));

    // Create OutputOwners with the P-chain addresses (sorted by byte value as per AVAX protocol)
    const sortedAddresses = [...this.transaction._fromAddresses].sort((a, b) => Buffer.compare(a, b));
    const outputOwners = new OutputOwners(
      new BigIntPr(this.transaction._locktime),
      new Int(this.transaction._threshold),
      sortedAddresses.map((addr) => new Address(addr))
    );

    const transferOutput = new TransferOutput(new BigIntPr(outputAmount), outputOwners);
    const output = new TransferableOutput(new Id(assetIdBytes), transferOutput);

    // Create the BaseTx for the P-chain import transaction
    const baseTx = new avaxSerial.BaseTx(
      new Int(this.transaction._networkID),
      new Id(Buffer.from(this.transaction._blockchainID, 'hex')),
      [output], // outputs
      [], // inputs (empty for import - inputs come from importedInputs)
      new Bytes(new Uint8Array(0)) // empty memo
    );

    // Create the P-chain import transaction using pvmSerial.ImportTx
    const importTx = new pvmSerial.ImportTx(
      baseTx,
      new Id(this._externalChainId), // sourceChain (C-chain)
      inputs // importedInputs (ins)
    );

    // Create address maps for signing
    const addressMaps = this.transaction._fromAddresses.map((a, i) => new FlareUtils.AddressMap([[new Address(a), i]]));

    // Create unsigned transaction
    const unsignedTx = new UnsignedTx(
      importTx,
      [], // Empty UTXOs array
      new FlareUtils.AddressMaps(addressMaps),
      credentials
    );

    this.transaction.setTransaction(unsignedTx);
  }

  /**
   * Create inputs from UTXOs for P-chain import
   * @returns inputs, credentials, and total amount
   */
  protected createImportInputs(): {
    inputs: TransferableInput[];
    credentials: Credential[];
    totalAmount: bigint;
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

    this.transaction._utxos.forEach((utxo: DecodedUtxoObj) => {
      const amount = BigInt(utxo.amount);
      totalAmount += amount;

      // Create signature indices for threshold
      const sigIndices: number[] = [];
      for (let i = 0; i < this.transaction._threshold; i++) {
        sigIndices.push(i);
      }

      // Use fromNative to create TransferableInput
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

      // Create credential with empty signatures for threshold signers
      const emptySignatures = sigIndices.map(() => utils.createNewSig(''));
      credentials.push(new Credential(emptySignatures));
    });

    return {
      inputs,
      credentials,
      totalAmount,
    };
  }

  /**
   * Recover UTXOs from imported inputs
   * @param importedInputs Array of transferable inputs
   * @returns Array of decoded UTXO objects
   */
  private recoverUtxos(importedInputs: TransferableInput[]): DecodedUtxoObj[] {
    return importedInputs.map((input) => {
      const utxoId = input.utxoID;
      const transferInput = input.input as TransferInput;
      const utxo: DecodedUtxoObj = {
        outputID: SECP256K1_Transfer_Output,
        amount: transferInput.amount().toString(),
        txid: utils.cb58Encode(Buffer.from(utxoId.txID.toBytes())),
        outputidx: utxoId.outputIdx.value().toString(),
        threshold: this.transaction._threshold,
        addresses: this.transaction._fromAddresses.map((addr) =>
          utils.addressToString(this.transaction._network.hrp, this.transaction._network.alias, Buffer.from(addr))
        ),
      };
      return utxo;
    });
  }
}
