import { BuildTransactionError, NotSupported, TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { AtomicInCTransactionBuilder } from './atomicInCTransactionBuilder';
import {
  evmSerial,
  UnsignedTx,
  Credential,
  Address,
  TransferOutput,
  utils as FlareUtils,
  evm,
} from '@flarenetwork/flarejs';
import utils from './utils';
import { Tx, FlareTransactionType, ExportEVMOptions, DecodedUtxoObj } from './iface';

export class ExportInCTxBuilder extends AtomicInCTransactionBuilder {
  private _nonce: bigint;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /**
   * UTXOs are not required for Export Tx from C-Chain (uses EVM balance instead).
   * Override to prevent usage by throwing an error.
   *
   * @throws {BuildTransactionError} always throws as UTXOs are not applicable
   */
  decodedUtxos(_decodedUtxos: DecodedUtxoObj[]): this {
    throw new BuildTransactionError('UTXOs are not required for Export Tx from C-Chain');
  }

  /**
   * Set the nonce of C-Chain sender address
   *
   * @param {number | string} nonce - number that can be only used once
   */
  nonce(nonce: number | string): this {
    const nonceBigInt = BigInt(nonce);
    this.validateNonce(nonceBigInt);
    this._nonce = nonceBigInt;
    return this;
  }

  /**
   * Export tx target P wallet.
   *
   * @param pAddresses
   */
  to(pAddresses: string | string[]): this {
    const pubKeys = Array.isArray(pAddresses) ? pAddresses : pAddresses.split('~');
    this.transaction._to = pubKeys.map((addr) => utils.parseAddress(addr));
    return this;
  }

  protected get transactionType(): TransactionType {
    return TransactionType.Export;
  }

  initBuilder(tx: Tx, rawBytes?: Buffer, parsedCredentials?: Credential[]): this {
    const baseTx = tx as evmSerial.ExportTx;
    if (!this.verifyTxType(baseTx._type)) {
      throw new NotSupported('Transaction cannot be parsed or has an unsupported transaction type');
    }

    const outputs = baseTx.exportedOutputs;
    if (outputs.length !== 1) {
      throw new BuildTransactionError('Transaction can have one output');
    }
    const output = outputs[0];

    if (Buffer.from(output.assetId.toBytes()).toString('hex') !== this.transaction._assetId) {
      throw new BuildTransactionError('AssetID mismatch');
    }

    const inputs = baseTx.ins;
    if (inputs.length !== 1) {
      throw new BuildTransactionError('Transaction can have one input');
    }
    const input = inputs[0];

    const transferOutput = output.output as TransferOutput;
    const owners = transferOutput.getOwners();
    this.transaction._to = owners;
    const inputAmount = input.amount.value();
    const outputAmount = transferOutput.amount();
    const fee = inputAmount - outputAmount;
    this.transaction._amount = outputAmount;
    this.transaction._fee.fee = fee.toString();
    this.transaction._fromAddresses = [Buffer.from(input.address.toBytes())];
    this.transaction._locktime = transferOutput.getLocktime();
    this._nonce = input.nonce.value();
    const credentials = parsedCredentials || [];
    const hasCredentials = credentials.length > 0;
    if (hasCredentials && rawBytes) {
      this.transaction._rawSignedBytes = rawBytes;
    }

    const fromAddress = new Address(this.transaction._fromAddresses[0]);
    const addressMap = new FlareUtils.AddressMap([
      [fromAddress, 0],
      [fromAddress, 1],
    ]);
    const addressMaps = new FlareUtils.AddressMaps([addressMap]);

    const unsignedTx = new UnsignedTx(
      baseTx,
      [],
      addressMaps,
      credentials.length > 0 ? credentials : [new Credential([utils.createNewSig('')])]
    );

    this.transaction.setTransaction(unsignedTx);
    return this;
  }

  static verifyTxType(txnType: string): boolean {
    return txnType === FlareTransactionType.EvmExportTx;
  }

  verifyTxType(txnType: string): boolean {
    return ExportInCTxBuilder.verifyTxType(txnType);
  }

  /**
   * Build the export in C-chain transaction
   * @protected
   */
  protected buildFlareTransaction(): void {
    if (this.transaction.hasCredentials) return;
    if (this.transaction._amount === undefined) {
      throw new BuildTransactionError('amount is required');
    }
    if (this.transaction._fromAddresses.length !== 1) {
      throw new BuildTransactionError('sender is one and required');
    }
    if (this.transaction._to.length === 0) {
      throw new BuildTransactionError('to is required');
    }
    if (!this.transaction._fee.fee) {
      throw new BuildTransactionError('fee rate is required');
    }
    if (this._nonce === undefined) {
      throw new BuildTransactionError('nonce is required');
    }
    if (!this.transaction._context) {
      throw new BuildTransactionError('context is required');
    }

    const fee = BigInt(this.transaction._fee.fee);
    const fromAddressBytes = this.transaction._fromAddresses[0];
    const sortedToAddresses = [...this.transaction._to].sort((a, b) => {
      const aHex = Buffer.from(a).toString('hex');
      const bHex = Buffer.from(b).toString('hex');
      return aHex.localeCompare(bHex);
    });
    const toAddresses = sortedToAddresses.map((addr) => new Address(addr));

    const exportEVMOptions: ExportEVMOptions = {
      threshold: this.transaction._threshold,
      locktime: this.transaction._locktime,
    };

    const exportTx = evm.newExportTxFromBaseFee(
      this.transaction._context,
      fee,
      this.transaction._amount,
      this.transaction._context.pBlockchainID,
      fromAddressBytes,
      toAddresses.map((addr) => Buffer.from(addr.toBytes())),
      BigInt(this._nonce),
      utils.flareIdString(this.transaction._assetId).toString(),
      exportEVMOptions
    );

    this.transaction.setTransaction(exportTx);
  }

  /**
   * Check the nonce is non-negative.
   * @param nonce
   */
  validateNonce(nonce: bigint): void {
    if (nonce < BigInt(0)) {
      throw new BuildTransactionError('Nonce must be greater or equal than 0');
    }
  }
}
