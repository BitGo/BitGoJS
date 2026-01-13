import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BuildTransactionError, NotSupported, TransactionType } from '@bitgo/sdk-core';
import { AtomicTransactionBuilder } from './atomicTransactionBuilder';
import {
  pvmSerial,
  UnsignedTx,
  TransferableInput,
  TransferableOutput,
  TransferInput,
  utils as FlareUtils,
  TransferOutput,
  Credential,
  pvm,
} from '@flarenetwork/flarejs';
import utils from './utils';
import { DecodedUtxoObj, SECP256K1_Transfer_Output, FlareTransactionType, Tx } from './iface';

export class ExportInPTxBuilder extends AtomicTransactionBuilder {
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

  initBuilder(tx: Tx, rawBytes?: Buffer, parsedCredentials?: Credential[]): this {
    const exportTx = tx as pvmSerial.ExportTx;

    if (!this.verifyTxType(exportTx._type)) {
      throw new NotSupported('Transaction cannot be parsed or has an unsupported transaction type');
    }
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
    this.transaction._locktime = outputOwners.locktime.value();
    this.transaction._threshold = outputOwners.threshold.value();
    this.transaction._fromAddresses = outputOwners.addrs.map((addr) => Buffer.from(addr.toBytes()));
    this._externalChainId = Buffer.from(exportTx.destination.toBytes());
    this.transaction._amount = outputTransfer.amount();
    this.transaction._utxos = this.recoverUtxos([...exportTx.baseTx.inputs]);

    const totalInputAmount = exportTx.baseTx.inputs.reduce((sum, input) => sum + input.amount(), BigInt(0));
    const changeOutputAmount = exportTx.baseTx.outputs.reduce((sum, out) => {
      const transferOut = out.output as TransferOutput;
      return sum + transferOut.amount();
    }, BigInt(0));
    const fee = totalInputAmount - changeOutputAmount - this.transaction._amount;
    this.transaction._fee.fee = fee.toString();

    const credentials = parsedCredentials || [];
    const hasCredentials = credentials.length > 0;

    if (rawBytes && hasCredentials) {
      this.transaction._rawSignedBytes = rawBytes;
    }

    const txCredentials =
      credentials.length > 0
        ? credentials
        : exportTx.baseTx.inputs.map((input, inputIdx) => {
            const transferInput = input.input as TransferInput;
            const inputThreshold = transferInput.sigIndicies().length || this.transaction._threshold;

            const utxo = this.transaction._utxos[inputIdx];

            if (inputThreshold === this.transaction._threshold) {
              return this.createCredentialForUtxo(utxo, this.transaction._threshold);
            } else {
              const sigSlots: ReturnType<typeof utils.createNewSig>[] = [];
              for (let i = 0; i < inputThreshold; i++) {
                sigSlots.push(utils.createNewSig(''));
              }
              return new Credential(sigSlots);
            }
          });

    const addressMaps = txCredentials.map((credential, credIdx) =>
      this.createAddressMapForUtxo(this.transaction._utxos[credIdx], this.transaction._threshold)
    );

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
  protected async buildFlareTransaction(): Promise<void> {
    if (this.transaction.hasCredentials) return;

    const feeState = this.transaction._feeState;
    if (!feeState) {
      throw new BuildTransactionError('Fee state is required');
    }
    if (!this.transaction._context) {
      throw new BuildTransactionError('context is required');
    }
    if (this.transaction._amount === undefined) {
      throw new BuildTransactionError('amount is required');
    }
    if (!this.transaction._utxos || this.transaction._utxos.length === 0) {
      throw new BuildTransactionError('UTXOs are required');
    }

    // Convert decoded UTXOs to native FlareJS Utxo objects
    const assetIdCb58 = utils.cb58Encode(Buffer.from(this.transaction._assetId, 'hex'));
    const nativeUtxos = utils.decodedToUtxos(this.transaction._utxos, assetIdCb58);

    const totalUtxoAmount = nativeUtxos.reduce((sum, utxo) => {
      const output = utxo.output as TransferOutput;
      return sum + output.amount();
    }, BigInt(0));

    if (totalUtxoAmount < this.transaction._amount) {
      throw new BuildTransactionError(
        `Insufficient UTXO balance: have ${totalUtxoAmount.toString()} nFLR, need at least ${this.transaction._amount.toString()} nFLR (plus fee)`
      );
    }

    const assetId = utils.flareIdString(this.transaction._assetId).toString();
    const fromAddresses = this.transaction._fromAddresses.map((addr) => Buffer.from(addr));
    const transferableOutput = TransferableOutput.fromNative(
      assetId,
      this.transaction._amount,
      fromAddresses,
      this.transaction._locktime,
      this.transaction._threshold
    );

    const exportTx = pvm.e.newExportTx(
      {
        feeState,
        fromAddressesBytes: this.transaction._fromAddresses.map((addr) => Buffer.from(addr)),
        destinationChainId: this.transaction._network.cChainBlockchainID,
        outputs: [transferableOutput],
        utxos: nativeUtxos,
      },
      this.transaction._context
    );

    this.transaction.setTransaction(exportTx);
  }

  /**
   * Recover UTXOs from inputs
   * @param inputs Array of TransferableInput
   * @returns Array of decoded UTXO objects
   */
  private recoverUtxos(inputs: TransferableInput[]): DecodedUtxoObj[] {
    return inputs.map((input) => {
      const utxoId = input.utxoID;
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
