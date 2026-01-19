import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BuildTransactionError, NotSupported, TransactionType } from '@bitgo/sdk-core';
import { AtomicTransactionBuilder } from './atomicTransactionBuilder';
import {
  pvmSerial,
  UnsignedTx,
  TransferableInput,
  TransferOutput,
  TransferInput,
  utils as FlareUtils,
  Credential,
  pvm,
} from '@flarenetwork/flarejs';
import utils from './utils';
import { DecodedUtxoObj, FlareTransactionType, SECP256K1_Transfer_Output, Tx } from './iface';

export class ImportInPTxBuilder extends AtomicTransactionBuilder {
  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
    this._externalChainId = utils.cb58Decode(this.transaction._network.cChainBlockchainID);
    this.transaction._blockchainID = Buffer.from(utils.cb58Decode(this.transaction._network.blockchainID)).toString(
      'hex'
    );
  }

  protected get transactionType(): TransactionType {
    return TransactionType.Import;
  }

  /**
   * @param {string | string[]} senderPubKey - C-chain address(es) with C- prefix
   * @throws {BuildTransactionError} if any address is not a C-chain address
   */
  fromPubKey(senderPubKey: string | string[]): this {
    const pubKeys = Array.isArray(senderPubKey) ? senderPubKey : [senderPubKey];
    const invalidAddress = pubKeys.find((addr) => !addr.startsWith('C-'));
    if (invalidAddress) {
      throw new BuildTransactionError(`Invalid fromAddress: expected C-chain address (C-...), got ${invalidAddress}`);
    }
    this.transaction._fromAddresses = pubKeys.map((addr) => utils.parseAddress(addr));
    return this;
  }

  /**
   * @param {string[]} addresses - Array of P-chain addresses (bech32 format with P- prefix)
   * @throws {BuildTransactionError} if any address is not a P-chain address
   */
  to(addresses: string[]): this {
    const invalidAddress = addresses.find((addr) => !addr.startsWith('P-'));
    if (invalidAddress) {
      throw new BuildTransactionError(`Invalid toAddress: expected P-chain address (P-...), got ${invalidAddress}`);
    }
    this.transaction._to = addresses.map((addr) => utils.parseAddress(addr));
    return this;
  }

  initBuilder(tx: Tx, rawBytes?: Buffer, parsedCredentials?: Credential[]): this {
    const importTx = tx as pvmSerial.ImportTx;

    if (!this.verifyTxType(importTx._type)) {
      throw new NotSupported('Transaction cannot be parsed or has an unsupported transaction type');
    }

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
    this.transaction._locktime = outputOwners.locktime.value();
    this.transaction._threshold = outputOwners.threshold.value();
    this.transaction._fromAddresses = outputOwners.addrs.map((addr) => Buffer.from(addr.toBytes()));
    this._externalChainId = Buffer.from(importTx.sourceChain.toBytes());
    this.transaction._utxos = this.recoverUtxos(importTx.ins);

    const totalInputAmount = importTx.ins.reduce((sum, input) => sum + input.amount(), BigInt(0));
    const outputAmount = transferOutput.amount();
    const fee = totalInputAmount - outputAmount;
    this.transaction._fee.fee = fee.toString();

    const credentials = parsedCredentials || [];
    const hasCredentials = credentials.length > 0;

    if (rawBytes && hasCredentials) {
      this.transaction._rawSignedBytes = rawBytes;
    }

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
   * Build the import transaction for P-chain (importing FROM C-chain)
   * @protected
   */
  protected async buildFlareTransaction(): Promise<void> {
    if (this.transaction.hasCredentials) return;
    if (!this.transaction._utxos || this.transaction._utxos.length === 0) {
      throw new BuildTransactionError('UTXOs are required');
    }
    if (!this.transaction._feeState) {
      throw new BuildTransactionError('Fee state is required');
    }
    if (!this.transaction._context) {
      throw new BuildTransactionError('context is required');
    }
    if (!this.transaction._fromAddresses || this.transaction._fromAddresses.length === 0) {
      throw new BuildTransactionError('fromAddresses are required');
    }
    if (!this.transaction._to || this.transaction._to.length === 0) {
      throw new BuildTransactionError('toAddresses are required');
    }
    if (!this.transaction._threshold) {
      throw new BuildTransactionError('threshold is required');
    }
    if (this.transaction._locktime === undefined) {
      throw new BuildTransactionError('locktime is required');
    }

    // Convert decoded UTXOs to native FlareJS Utxo objects
    const assetId = utils.cb58Encode(Buffer.from(this.transaction._assetId, 'hex'));
    const nativeUtxos = utils.decodedToUtxos(this.transaction._utxos, assetId);

    // Validate UTXO balance is non-zero (fee will be deducted during import)
    const totalUtxoAmount = nativeUtxos.reduce((sum, utxo) => {
      const output = utxo.output as TransferOutput;
      return sum + output.amount();
    }, BigInt(0));

    if (totalUtxoAmount === BigInt(0)) {
      throw new BuildTransactionError('UTXOs have zero total balance');
    }

    const toAddresses = this.transaction._to.map((addr) => Buffer.from(addr));
    const fromAddresses = this.transaction._fromAddresses.map((addr) => Buffer.from(addr));

    // Validate address lengths (P-chain addresses are 20 bytes)
    const invalidToAddress = toAddresses.find((addr) => addr.length !== 20);
    if (invalidToAddress) {
      throw new BuildTransactionError(`Invalid toAddress length: expected 20 bytes, got ${invalidToAddress.length}`);
    }

    const invalidFromAddress = fromAddresses.find((addr) => addr.length !== 20);
    if (invalidFromAddress) {
      throw new BuildTransactionError(
        `Invalid fromAddress length: expected 20 bytes, got ${invalidFromAddress.length}`
      );
    }

    const importTx = pvm.e.newImportTx(
      {
        feeState: this.transaction._feeState,
        fromAddressesBytes: fromAddresses,
        sourceChainId: this.transaction._network.cChainBlockchainID,
        toAddressesBytes: toAddresses,
        utxos: nativeUtxos,
        threshold: this.transaction._threshold,
        locktime: this.transaction._locktime,
      },
      this.transaction._context
    );

    const flareUnsignedTx = importTx as UnsignedTx;
    const innerTx = flareUnsignedTx.getTx() as pvmSerial.ImportTx;

    const utxosWithIndex = innerTx.ins.map((input, idx) => {
      const transferInput = input.input as TransferInput;
      const addressesIndex = transferInput.sigIndicies();
      return {
        ...this.transaction._utxos[idx],
        addressesIndex,
        addresses: [],
        threshold: addressesIndex.length || this.transaction._utxos[idx].threshold,
      };
    });

    const txCredentials = utxosWithIndex.map((utxo) => this.createCredentialForUtxo(utxo, utxo.threshold));

    const addressMaps = utxosWithIndex.map((utxo) => this.createAddressMapForUtxo(utxo, utxo.threshold));

    const fixedUnsignedTx = new UnsignedTx(innerTx, [], new FlareUtils.AddressMaps(addressMaps), txCredentials);

    this.transaction.setTransaction(fixedUnsignedTx);
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
      const addressesIndex = transferInput.sigIndicies();

      const utxo: DecodedUtxoObj = {
        outputID: SECP256K1_Transfer_Output,
        amount: transferInput.amount().toString(),
        txid: utils.cb58Encode(Buffer.from(utxoId.txID.toBytes())),
        outputidx: utxoId.outputIdx.value().toString(),
        threshold: addressesIndex.length || this.transaction._threshold,
        addresses: [],
        addressesIndex,
      };
      return utxo;
    });
  }
}
