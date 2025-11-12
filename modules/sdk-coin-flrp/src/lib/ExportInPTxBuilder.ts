import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BuildTransactionError, NotSupported, TransactionType } from '@bitgo/sdk-core';
import { AtomicTransactionBuilder } from './atomicTransactionBuilder';
import {
  evmSerial,
  UnsignedTx,
  BigIntPr,
  Int,
  Id,
  TransferableOutput,
  Address,
  utils as FlareUtils,
  TransferOutput,
  OutputOwners,
} from '@flarenetwork/flarejs';
import utils from './utils';
import { DecodedUtxoObj, SECP256K1_Transfer_Output, FlareTransactionType, Tx } from './iface';

export class ExportInPTxBuilder extends AtomicTransactionBuilder {
  private _amount: bigint;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._externalChainId = utils.cb58Decode(this.transaction._network.cChainBlockchainID);
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

  initBuilder(tx: Tx): this {
    const baseTx = tx as evmSerial.ExportTx;
    if (!this.verifyTxType(baseTx._type)) {
      throw new NotSupported('Transaction cannot be parsed or has an unsupported transaction type');
    }

    // The exportedOutputs is a TransferableOutput array.
    // It's expected to have only one output with the addresses of the sender.
    const outputs = baseTx.exportedOutputs;
    if (outputs.length !== 1) {
      throw new BuildTransactionError('Transaction can have one external output');
    }

    const output = outputs[0];
    const outputTransfer = output.output as TransferOutput;
    const assetId = output.assetId.toBytes();
    if (Buffer.compare(assetId, Buffer.from(this.transaction._assetId)) !== 0) {
      throw new Error('The Asset ID of the output does not match the transaction');
    }

    // Set locktime to 0 since it's not used in EVM outputs
    this.transaction._locktime = BigInt(0);

    // Set threshold to 1 since EVM outputs only have one address
    this.transaction._threshold = 1;

    // Convert output address to buffer and set as fromAddress
    const outputOwners = outputTransfer as unknown as OutputOwners;
    this.transaction._fromAddresses = outputOwners.addrs.map((addr) => Buffer.from(addr.toBytes()));

    // Set external chain ID from the destination chain
    this._externalChainId = Buffer.from(baseTx.destinationChain.toString());

    // Set amount from output
    this._amount = outputTransfer.amount();

    // Recover UTXOs from inputs
    this.transaction._utxos = this.recoverUtxos(baseTx.ins);
    return this;
  }

  static verifyTxType(txnType: string): boolean {
    return txnType === FlareTransactionType.PvmExportTx;
  }

  verifyTxType(txnType: string): boolean {
    return ExportInPTxBuilder.verifyTxType(txnType);
  }

  /**
   * Build the export transaction
   * @protected
   */
  protected buildFlareTransaction(): void {
    // if tx has credentials, tx shouldn't change
    if (this.transaction.hasCredentials) return;

    const { inputs, credentials } = this.createInputOutput(this._amount + BigInt(this.transaction.fee.fee));

    // Convert TransferableInputs to EVM Inputs
    const transferableInputs: evmSerial.Input[] = inputs.map((input) => {
      const assetIdBytes = input.assetId.toBytes();
      const inputOwners = input as unknown as OutputOwners;
      return new evmSerial.Input(
        inputOwners.addrs[0],
        new BigIntPr(input.amount()),
        new Id(assetIdBytes),
        new BigIntPr(BigInt(0)) // nonce is 0 for non-EVM inputs
      );
    });

    // Create the export transaction
    const exportTx = new evmSerial.ExportTx(
      new Int(this.transaction._networkID),
      new Id(new Uint8Array(Buffer.from(this.transaction._blockchainID, 'hex'))),
      new Id(new Uint8Array(this._externalChainId)),
      transferableInputs,
      this.exportedOutputs()
    );

    // Create unsigned transaction with proper address maps
    const addressMap = new FlareUtils.AddressMap([[new Address(this.transaction._fromAddresses[0]), 0]]);
    const addressMaps = new FlareUtils.AddressMaps([addressMap]);

    const unsignedTx = new UnsignedTx(
      exportTx,
      [], // Empty UTXOs array, will be filled during processing
      addressMaps,
      credentials
    );

    this.transaction.setTransaction(unsignedTx);
  }

  /**
   * Create the ExportedOutputs where the recipient address are the sender.
   * Later an importTx should complete the operations signing with the same keys.
   * @protected
   */
  protected exportedOutputs(): TransferableOutput[] {
    const assetIdBytes = new Uint8Array(Buffer.from(this.transaction._assetId, 'hex'));
    const outputOwners = new OutputOwners(
      new BigIntPr(BigInt(0)), // locktime
      new Int(1), // threshold
      [new Address(this.transaction._fromAddresses[0])]
    );

    const output = new TransferOutput(new BigIntPr(this._amount), outputOwners);

    return [new TransferableOutput(new Id(assetIdBytes), output)];
  }

  /**
   * Recover UTXOs from inputs
   * @param inputs Array of inputs
   * @returns Array of decoded UTXO objects
   */
  private recoverUtxos(inputs: evmSerial.Input[]): DecodedUtxoObj[] {
    return inputs.map((input) => {
      const txid = Buffer.from(input.assetId.toBytes()).toString('hex');
      return {
        outputID: SECP256K1_Transfer_Output,
        amount: input.amount.toString(),
        txid: utils.cb58Encode(Buffer.from(txid, 'hex')),
        outputidx: '0', // Since EVM inputs don't have output indices
        threshold: this.transaction._threshold,
        addresses: [
          utils.addressToString(
            this.transaction._network.hrp,
            this.transaction._network.alias,
            Buffer.from(input.address.toBytes())
          ),
        ],
      };
    });
  }
}
