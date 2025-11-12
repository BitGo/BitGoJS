import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BuildTransactionError, NotSupported, TransactionType } from '@bitgo/sdk-core';
import { AtomicTransactionBuilder } from './atomicTransactionBuilder';
import {
  evmSerial,
  UnsignedTx,
  Int,
  Id,
  TransferableInput,
  utils as FlareUtils,
  Address,
  BigIntPr,
} from '@flarenetwork/flarejs';
import utils from './utils';
import { DecodedUtxoObj, FlareTransactionType, SECP256K1_Transfer_Output, Tx } from './iface';

export class ImportInPTxBuilder extends AtomicTransactionBuilder {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    // external chain id is P
    this._externalChainId = utils.cb58Decode(this.transaction._network.blockchainID);
    // chain id is C
    this.transaction._blockchainID = Buffer.from(
      utils.cb58Decode(this.transaction._network.cChainBlockchainID)
    ).toString('hex');
  }

  protected get transactionType(): TransactionType {
    return TransactionType.Import;
  }

  initBuilder(tx: Tx): this {
    const baseTx = tx as evmSerial.ImportTx;
    if (!this.verifyTxType(baseTx._type)) {
      throw new NotSupported('Transaction cannot be parsed or has an unsupported transaction type');
    }

    // The regular change output is the tx output in Import tx.
    // createInputOutput results in a single item array.
    // It's expected to have only one output with the addresses of the sender.
    const outputs = baseTx.Outs;
    if (outputs.length !== 1) {
      throw new BuildTransactionError('Transaction can have one external output');
    }

    const output = outputs[0];
    const assetId = output.assetId.toBytes();
    if (Buffer.compare(assetId, Buffer.from(this.transaction._assetId)) !== 0) {
      throw new Error('The Asset ID of the output does not match the transaction');
    }

    // Set locktime to 0 since it's not used in EVM outputs
    this.transaction._locktime = BigInt(0);

    // Set threshold to 1 since EVM outputs only have one address
    this.transaction._threshold = 1;

    // Convert output address to buffer and set as fromAddress
    this.transaction._fromAddresses = [Buffer.from(output.address.toBytes())];

    // Set external chain ID from the source chain
    this._externalChainId = Buffer.from(baseTx.sourceChain.toString());

    // Recover UTXOs from imported inputs
    this.transaction._utxos = this.recoverUtxos(baseTx.importedInputs);

    return this;
  }

  static verifyTxType(txnType: string): boolean {
    return txnType === FlareTransactionType.PvmImportTx;
  }

  verifyTxType(txnType: string): boolean {
    return ImportInPTxBuilder.verifyTxType(txnType);
  }

  /**
   * Build the import transaction
   * @protected
   */
  protected buildFlareTransaction(): void {
    // if tx has credentials, tx shouldn't change
    if (this.transaction.hasCredentials) return;

    const { inputs, credentials } = this.createInputOutput(BigInt(this.transaction.fee.fee));

    // Convert TransferableInput to evmSerial.Output
    const evmOutputs = inputs.map((input) => {
      return new evmSerial.Output(
        new Address(this.transaction._fromAddresses[0]),
        new BigIntPr(input.input.amount()),
        new Id(input.assetId.toBytes())
      );
    });

    // Create the import transaction
    const importTx = new evmSerial.ImportTx(
      new Int(this.transaction._networkID),
      Id.fromString(this.transaction._blockchainID.toString()),
      Id.fromString(this._externalChainId.toString()),
      inputs,
      evmOutputs
    );

    const addressMaps = this.transaction._fromAddresses.map((a) => new FlareUtils.AddressMap([[new Address(a), 0]]));

    // Create unsigned transaction
    const unsignedTx = new UnsignedTx(
      importTx,
      [], // Empty UTXOs array, will be filled during processing
      new FlareUtils.AddressMaps(addressMaps),
      credentials
    );

    this.transaction.setTransaction(unsignedTx);
  }

  /**
   * Recover UTXOs from imported inputs
   * @param importedInputs Array of transferable inputs
   * @returns Array of decoded UTXO objects
   */
  private recoverUtxos(importedInputs: TransferableInput[]): DecodedUtxoObj[] {
    return importedInputs.map((input) => {
      const utxoId = input.utxoID;
      const transferInput = input.input;
      const utxo: DecodedUtxoObj = {
        outputID: SECP256K1_Transfer_Output,
        amount: transferInput.amount.toString(),
        txid: utils.cb58Encode(Buffer.from(utxoId.ID.toString())),
        outputidx: utxoId.outputIdx.toBytes().toString(),
        threshold: this.transaction._threshold,
        addresses: this.transaction._fromAddresses.map((addr) =>
          utils.addressToString(this.transaction._network.hrp, this.transaction._network.alias, Buffer.from(addr))
        ),
      };
      return utxo;
    });
  }
}
