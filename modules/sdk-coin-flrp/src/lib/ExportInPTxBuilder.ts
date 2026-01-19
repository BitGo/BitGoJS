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

    this.transaction._utxos = this.recoverUtxos([...exportTx.baseTx.inputs], outputOwners.addrs);

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

    this.computeAddressesIndexFromParsed();

    const txCredentials =
      credentials.length > 0
        ? credentials
        : this.transaction._utxos.map((utxo) => {
            const utxoThreshold = utxo.threshold || this.transaction._threshold;
            return this.createCredentialForUtxo(utxo, utxoThreshold);
          });

    const addressMaps = this.transaction._utxos.map((utxo) => {
      const utxoThreshold = utxo.threshold || this.transaction._threshold;
      return this.createAddressMapForUtxo(utxo, utxoThreshold);
    });

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
   * Following AVAX P approach for UTXO handling and signature slot assignment.
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

    this.computeAddressesIndex();

    this.validateUtxoAddresses();

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

    const flareUnsignedTx = exportTx as UnsignedTx;
    const innerTx = flareUnsignedTx.getTx() as pvmSerial.ExportTx;

    const utxosWithIndex = innerTx.baseTx.inputs.map((input, idx) => {
      const originalUtxo = this.transaction._utxos[idx];
      return {
        ...originalUtxo,
        addressesIndex: originalUtxo.addressesIndex,
        addresses: originalUtxo.addresses,
        threshold: originalUtxo.threshold || this.transaction._threshold,
      };
    });

    this.transaction._utxos = utxosWithIndex;

    const txCredentials = utxosWithIndex.map((utxo) => this.createCredentialForUtxo(utxo, utxo.threshold));

    const addressMaps = utxosWithIndex.map((utxo) => this.createAddressMapForUtxo(utxo, utxo.threshold));

    const fixedUnsignedTx = new UnsignedTx(innerTx, [], new FlareUtils.AddressMaps(addressMaps), txCredentials);

    this.transaction.setTransaction(fixedUnsignedTx);
  }

  /**
   * Recover UTXOs from inputs.
   * Uses output addresses as proxy for UTXO addresses.
   *
   * @param inputs Array of TransferableInput
   * @param outputAddrs Output owner addresses to use as proxy
   * @returns Array of decoded UTXO objects
   */
  private recoverUtxos(inputs: TransferableInput[], outputAddrs?: { toBytes(): Uint8Array }[]): DecodedUtxoObj[] {
    const proxyAddresses = outputAddrs
      ? outputAddrs.map((addr) =>
          utils.addressToString(
            this.transaction._network.hrp,
            this.transaction._network.alias,
            Buffer.from(addr.toBytes())
          )
        )
      : [];

    return inputs.map((input) => {
      const utxoId = input.utxoID;
      const transferInput = input.input as TransferInput;
      const sigIndicies = transferInput.sigIndicies();

      const utxo: DecodedUtxoObj = {
        outputID: SECP256K1_Transfer_Output,
        amount: input.amount().toString(),
        txid: utils.cb58Encode(Buffer.from(utxoId.txID.toBytes())),
        outputidx: utxoId.outputIdx.value().toString(),
        threshold: sigIndicies.length || this.transaction._threshold,
        addresses: proxyAddresses,
        addressesIndex: sigIndicies,
      };
      return utxo;
    });
  }

  private computeAddressesIndexFromParsed(): void {
    const sender = this.transaction._fromAddresses;
    if (!sender || sender.length === 0) return;

    this.transaction._utxos.forEach((utxo) => {
      if (utxo.addresses && utxo.addresses.length > 0) {
        const utxoAddresses = utxo.addresses.map((a) => utils.parseAddress(a));
        utxo.addressesIndex = sender.map((senderAddr) =>
          utxoAddresses.findIndex((utxoAddr) => Buffer.compare(Buffer.from(utxoAddr), Buffer.from(senderAddr)) === 0)
        );
      }
    });
  }
}
