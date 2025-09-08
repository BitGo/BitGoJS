import { BuildTransactionError, TransactionType } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { AtomicInCTransactionBuilder } from './atomicInCTransactionBuilder';

// Lightweight interface placeholders replacing Avalanche SDK transaction shapes
interface FlareExportInputShape {
  address: string;
  amount: bigint; // includes exported amount + fee
  assetId: Buffer;
  nonce: bigint;
}

interface FlareExportOutputShape {
  addresses: string[]; // destination P-chain addresses
  amount: bigint; // exported amount
  assetId: Buffer;
}

interface FlareUnsignedExportTx {
  networkId: number;
  sourceBlockchainId: Buffer; // C-chain id
  destinationBlockchainId: Buffer; // P-chain id
  inputs: FlareExportInputShape[];
  outputs: FlareExportOutputShape[];
}

interface FlareSignedExportTx {
  unsignedTx: FlareUnsignedExportTx;
  // credentials placeholder
  credentials: unknown[];
}

type RawFlareExportTx = FlareSignedExportTx; // for now treat them the same

export class ExportInCTxBuilder extends AtomicInCTransactionBuilder {
  private _amount?: bigint;
  private _nonce?: bigint;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /**
   * Utxos are not required in Export Tx in C-Chain.
   * Override utxos to prevent used by throwing a error.
   *
   * @param {DecodedUtxoObj[]} value ignored
   */
  utxos(_value: unknown[]): this {
    throw new BuildTransactionError('utxos are not required in Export Tx in C-Chain');
  }

  /**
   * Amount is a long that specifies the quantity of the asset that this output owns. Must be positive.
   * The transaction output amount add a fixed fee that will be paid upon import.
   *
   * @param {BN | string} amount The withdrawal amount
   */
  amount(amount: bigint | number | string): this {
    const n = typeof amount === 'bigint' ? amount : BigInt(amount);
    this.validateAmount(n);
    this._amount = n;
    return this;
  }

  /**
   * Set the nonce of C-Chain sender address
   *
   * @param {number | string} nonce - number that can be only used once
   */
  nonce(nonce: bigint | number | string): this {
    const n = typeof nonce === 'bigint' ? nonce : BigInt(nonce);
    this.validateNonce(n);
    this._nonce = n;
    return this;
  }

  /**
   * Export tx target P wallet.
   *
   * @param pAddresses
   */
  to(pAddresses: string | string[]): this {
    const pubKeys = Array.isArray(pAddresses) ? pAddresses : pAddresses.split('~');
    // For now ensure they are stored as bech32 / string addresses directly
    this.transaction._to = pubKeys.map((a) => a.toString());
    return this;
  }

  protected get transactionType(): TransactionType {
    return TransactionType.Export;
  }

  initBuilder(raw: RawFlareExportTx): this {
    // Basic shape validation
    const unsigned = raw.unsignedTx;
    if (unsigned.networkId !== this.transaction._networkID) {
      throw new Error('Network ID mismatch');
    }
    if (!unsigned.sourceBlockchainId.equals(this.transaction._blockchainID)) {
      throw new Error('Blockchain ID mismatch');
    }
    if (unsigned.outputs.length !== 1) {
      throw new BuildTransactionError('Transaction can have one output');
    }
    if (unsigned.inputs.length !== 1) {
      throw new BuildTransactionError('Transaction can have one input');
    }
    const out = unsigned.outputs[0];
    const inp = unsigned.inputs[0];
    if (!out.assetId.equals(this.transaction._assetId) || !inp.assetId.equals(this.transaction._assetId)) {
      throw new Error('AssetID mismatch');
    }
    this.transaction._to = out.addresses;
    this._amount = out.amount;
    const fee = inp.amount - out.amount;
    if (fee < 0n) {
      throw new BuildTransactionError('Computed fee is negative');
    }
    const fixed = this.fixedFee;
    const feeRate = fee - fixed;
    this.transaction._fee.feeRate = feeRate.toString();
    this.transaction._fee.fee = fee.toString();
    this.transaction._fee.size = 1;
    this.transaction._fromAddresses = [inp.address];
    this._nonce = inp.nonce;
    this.transaction.setTransaction(raw);
    return this;
  }

  // For parity with Avalanche builder interfaces; always returns true for placeholder
  //TODO: WIN-6322
  static verifyTxType(_tx: unknown): _tx is FlareUnsignedExportTx {
    return true;
  }

  verifyTxType(_tx: unknown): _tx is FlareUnsignedExportTx {
    return ExportInCTxBuilder.verifyTxType(_tx);
  }

  /**
   * Build the export in C-chain transaction
   * @protected
   */
  protected buildFlareTransaction(): void {
    if (this.transaction.hasCredentials) return; // placeholder: credentials not yet implemented
    if (this._amount === undefined) throw new Error('amount is required');
    if (this.transaction._fromAddresses.length !== 1) throw new Error('sender is one and required');
    if (this.transaction._to.length === 0) throw new Error('to is required');
    if (!this.transaction._fee.feeRate) throw new Error('fee rate is required');
    if (this._nonce === undefined) throw new Error('nonce is required');

    // Compose placeholder unsigned tx shape
    const feeRate = BigInt(this.transaction._fee.feeRate);
    const fixed = this.fixedFee;
    const totalFee = feeRate + fixed;
    const input: FlareExportInputShape = {
      address: this.transaction._fromAddresses[0],
      amount: this._amount + totalFee,
      assetId: this.transaction._assetId,
      nonce: this._nonce,
    };
    const output: FlareExportOutputShape = {
      addresses: this.transaction._to,
      amount: this._amount,
      assetId: this.transaction._assetId,
    };
    const unsigned: FlareUnsignedExportTx = {
      networkId: this.transaction._networkID,
      sourceBlockchainId: this.transaction._blockchainID,
      destinationBlockchainId: this._externalChainId || Buffer.alloc(0),
      inputs: [input],
      outputs: [output],
    };
    const signed: FlareSignedExportTx = { unsignedTx: unsigned, credentials: [] };
    this.transaction._fee.fee = totalFee.toString();
    this.transaction._fee.size = 1;
    this.transaction.setTransaction(signed);
  }

  /** @inheritdoc */
  protected fromImplementation(raw: string | RawFlareExportTx): { _tx?: unknown } {
    if (typeof raw === 'string') {
      // Future: parse hex or serialized form. For now treat as opaque raw tx.
      this.transaction.setTransaction(raw);
      return this.transaction;
    }
    return this.initBuilder(raw).transaction;
  }

  /**
   * Check the amount is positive.
   * @param amount
   */
  validateNonce(nonce: bigint): void {
    if (nonce < 0n) {
      throw new BuildTransactionError('Nonce must be greater or equal than 0');
    }
  }
}
