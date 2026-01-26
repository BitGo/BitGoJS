import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BuildTransactionError, NotSupported, TransactionType } from '@bitgo/sdk-core';
import { AtomicInCTransactionBuilder } from './atomicInCTransactionBuilder';
import {
  evmSerial,
  UnsignedTx,
  Credential,
  TransferableInput,
  TransferInput,
  TransferOutput,
  utils as FlareUtils,
  evm,
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

    const firstInput = inputs[0];
    const inputThreshold = firstInput.sigIndicies().length || this.transaction._threshold;
    this.transaction._threshold = inputThreshold;

    this.transaction._utxos = this.recoverUtxos(inputs);

    const totalInputAmount = inputs.reduce((t, i) => t + i.amount(), BigInt(0));
    const totalOutputAmount = output.amount.value();

    const fee = totalInputAmount - totalOutputAmount;

    const credentials = parsedCredentials || [];
    const hasCredentials = credentials.length > 0;

    if (hasCredentials && rawBytes) {
      this.transaction._rawSignedBytes = rawBytes;
    }

    this.transaction._fee = {
      fee: fee.toString(),
    };

    this.computeAddressesIndexFromParsed();

    // Create addressMaps using sigIndices from parsed transaction for consistency
    const addressMaps = this.transaction._utxos.map((utxo) => {
      const utxoThreshold = utxo.threshold || this.transaction._threshold;
      const sigIndices = utxo.addressesIndex ?? [];
      if (sigIndices.length >= utxoThreshold && sigIndices.every((idx) => idx >= 0)) {
        return this.createAddressMapForUtxoWithSigIndices(utxo, utxoThreshold, sigIndices);
      }
      return this.createAddressMapForUtxo(utxo, utxoThreshold);
    });

    const flareAddressMaps = new FlareUtils.AddressMaps(addressMaps);

    // Use parsed credentials if available, otherwise create new ones based on sigIndices
    let txCredentials: Credential[];
    if (credentials.length > 0) {
      txCredentials = credentials;
    } else {
      txCredentials = this.transaction._utxos.map((utxo) => {
        const utxoThreshold = utxo.threshold || this.transaction._threshold;
        const sigIndices = utxo.addressesIndex ?? [];
        if (sigIndices.length >= utxoThreshold && sigIndices.every((idx) => idx >= 0)) {
          return this.createCredentialForUtxoWithSigIndices(utxo, utxoThreshold, sigIndices);
        }
        return this.createCredentialForUtxo(utxo, utxoThreshold);
      });
    }

    const unsignedTx = new UnsignedTx(baseTx, [], flareAddressMaps, txCredentials);

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
   * Following AVAX P approach for UTXO handling and signature slot assignment.
   * @protected
   */
  protected buildFlareTransaction(): void {
    if (this.transaction.hasCredentials) return;
    if (this.transaction._to.length !== 1) {
      throw new BuildTransactionError('to is required');
    }
    if (!this.transaction._fee.fee) {
      throw new BuildTransactionError('fee is required');
    }
    if (!this.transaction._context) {
      throw new BuildTransactionError('context is required');
    }
    if (!this.transaction._fromAddresses || this.transaction._fromAddresses.length === 0) {
      throw new BuildTransactionError('fromAddresses are required');
    }
    if (!this.transaction._utxos || this.transaction._utxos.length === 0) {
      throw new BuildTransactionError('UTXOs are required');
    }
    if (!this.transaction._threshold) {
      throw new BuildTransactionError('threshold is required');
    }

    this.computeAddressesIndex();

    this.validateUtxoAddresses();

    const actualFeeNFlr = BigInt(this.transaction._fee.fee);
    const sourceChain = 'P';

    // Convert decoded UTXOs to native FlareJS Utxo objects
    const assetId = utils.cb58Encode(Buffer.from(this.transaction._assetId, 'hex'));
    const nativeUtxos = utils.decodedToUtxos(this.transaction._utxos, assetId);

    // Validate UTXO balance is sufficient to cover the import fee
    const totalUtxoAmount = nativeUtxos.reduce((sum, utxo) => {
      const output = utxo.output as TransferOutput;
      return sum + output.amount();
    }, BigInt(0));

    if (totalUtxoAmount <= actualFeeNFlr) {
      throw new BuildTransactionError(
        `Insufficient UTXO balance: have ${totalUtxoAmount.toString()} nFLR, need more than ${actualFeeNFlr.toString()} nFLR to cover import fee`
      );
    }
    const importTx = evm.newImportTx(
      this.transaction._context,
      this.transaction._to[0],
      this.transaction._fromAddresses.map((addr) => Buffer.from(addr)),
      nativeUtxos,
      sourceChain,
      actualFeeNFlr
    );

    const flareUnsignedTx = importTx as UnsignedTx;
    const innerTx = flareUnsignedTx.getTx() as evmSerial.ImportTx;

    const utxosWithIndex = innerTx.importedInputs.map((input) => {
      const inputTxid = utils.cb58Encode(Buffer.from(input.utxoID.txID.toBytes()));
      const inputOutputIdx = input.utxoID.outputIdx.value().toString();

      const originalUtxo = this.transaction._utxos.find(
        (utxo) => utxo.txid === inputTxid && utxo.outputidx === inputOutputIdx
      );

      if (!originalUtxo) {
        throw new BuildTransactionError(`Could not find matching UTXO for input ${inputTxid}:${inputOutputIdx}`);
      }

      const transferInput = input.input as TransferInput;
      const actualSigIndices = transferInput.sigIndicies();

      return {
        ...originalUtxo,
        addressesIndex: originalUtxo.addressesIndex,
        addresses: originalUtxo.addresses,
        threshold: originalUtxo.threshold || this.transaction._threshold,
        actualSigIndices,
      };
    });

    this.transaction._utxos = utxosWithIndex;

    const txCredentials = utxosWithIndex.map((utxo) =>
      this.createCredentialForUtxoWithSigIndices(utxo, utxo.threshold, utxo.actualSigIndices)
    );

    const addressMaps = utxosWithIndex.map((utxo) =>
      this.createAddressMapForUtxoWithSigIndices(utxo, utxo.threshold, utxo.actualSigIndices)
    );

    const fixedUnsignedTx = new UnsignedTx(innerTx, [], new FlareUtils.AddressMaps(addressMaps), txCredentials);

    this.transaction.setTransaction(fixedUnsignedTx);
  }

  /**
   * Recover UTXOs from imported inputs.
   * Uses fromAddresses as proxy for UTXO addresses since they should be the same
   * addresses controlling the multisig.
   *
   * @param importedInputs Array of transferable inputs
   * @returns Array of decoded UTXO objects
   */
  private recoverUtxos(importedInputs: TransferableInput[]): DecodedUtxoObj[] {
    const proxyAddresses =
      this.transaction._fromAddresses && this.transaction._fromAddresses.length > 0
        ? this.transaction._fromAddresses.map((addr) =>
            utils.addressToString(this.transaction._network.hrp, 'P', Buffer.from(addr))
          )
        : [];

    return importedInputs.map((input) => {
      const txid = input.utxoID.toString();
      const outputidx = input.utxoID.outputIdx.toString();
      const transferInput = input.input as TransferInput;
      const sigIndicies = transferInput.sigIndicies();

      return {
        outputID: SECP256K1_Transfer_Output,
        amount: input.amount().toString(),
        txid: utils.cb58Encode(Buffer.from(txid, 'hex')),
        outputidx: outputidx,
        threshold: sigIndicies.length || this.transaction._threshold,
        addresses: proxyAddresses,
        addressesIndex: sigIndicies,
      };
    });
  }
}
