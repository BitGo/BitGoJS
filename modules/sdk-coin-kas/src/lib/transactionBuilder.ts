/**
 * Kaspa (KAS) Transaction Builder
 *
 * Builds Kaspa UTXO transactions with inputs and outputs.
 * Handles input selection, change output calculation, and signing.
 */

import { BaseTransactionBuilder, BuildTransactionError, SigningError, BaseKey, BaseAddress } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import BigNumber from 'bignumber.js';
import { schnorr } from '@noble/curves/secp256k1';
import { Transaction } from './transaction';
import { KaspaTransactionInput, KaspaTransactionOutput, KaspaUtxoEntry, KaspaScriptPublicKey } from './iface';
import {
  DEFAULT_SEQUENCE,
  DEFAULT_GAS,
  DEFAULT_LOCK_TIME,
  NATIVE_SUBNETWORK_ID,
  TX_VERSION,
  SIGHASH_ALL,
  MINIMUM_FEE,
  ADDRESS_VERSION_PUBKEY,
  ADDRESS_VERSION_SCRIPTHASH,
} from './constants';
import { isValidAddress, buildScriptPublicKey, buildP2SHScriptPublicKey, kaspaDecodeAddress } from './utils';
import { KeyPair } from './keyPair';

/**
 * Build a P2PK signature script from a Schnorr signature (64 bytes).
 * Script: OP_DATA_65 (0x41) + signature (64 bytes) + sighash_type (1 byte)
 */
function buildSignatureScript(signature: Buffer, sighashType: number): Buffer {
  // Signature script: OP_DATA_65 (0x41 = push 65 bytes), sig (64 bytes), sighash_type (1 byte)
  const opDataByte = 0x41; // push 65 bytes
  return Buffer.concat([Buffer.from([opDataByte]), signature, Buffer.from([sighashType])]);
}

/**
 * Build a script public key from an address.
 * Supports P2PK (version 0x00) and P2SH (version 0x08) addresses.
 */
function addressToScriptPublicKey(address: string): KaspaScriptPublicKey {
  const { version, payload } = kaspaDecodeAddress(address);
  if (version === ADDRESS_VERSION_PUBKEY) {
    return buildScriptPublicKey(payload);
  } else if (version === ADDRESS_VERSION_SCRIPTHASH) {
    return buildP2SHScriptPublicKey(payload);
  }
  throw new Error(`Unsupported address version: ${version}`);
}

export class TransactionBuilder extends BaseTransactionBuilder {
  protected _transaction: Transaction;
  protected _inputs: KaspaTransactionInput[] = [];
  protected _outputs: KaspaTransactionOutput[] = [];
  protected _utxoEntries: KaspaUtxoEntry[] = [];
  protected _fee: bigint = MINIMUM_FEE;
  protected _changeAddress?: string;
  protected _sender?: string;
  /** True when initialized from an existing serialized tx — skips change output recalculation. */
  protected _isFromHex = false;

  constructor(coin: Readonly<CoinConfig>) {
    super(coin);
    this._transaction = new Transaction();
  }

  /** @inheritdoc */
  protected get transaction(): Transaction {
    return this._transaction;
  }

  /** @inheritdoc */
  protected set transaction(tx: Transaction) {
    this._transaction = tx;
  }

  /**
   * Initialize builder from an existing serialized transaction hex.
   */
  from(rawTx: string): this {
    try {
      this._transaction = Transaction.fromHex(rawTx);
      this._inputs = [...this._transaction.txData.inputs];
      this._outputs = [...this._transaction.txData.outputs];
      if (this._transaction.txData.utxoEntries) {
        this._utxoEntries = [...this._transaction.txData.utxoEntries];
      }
      this._isFromHex = true;
    } catch (e) {
      throw new BuildTransactionError(`Failed to deserialize transaction: ${e.message}`);
    }
    return this;
  }

  /**
   * Set the sender address (used as change address if not specified separately).
   */
  sender(address: string): this {
    if (!isValidAddress(address)) {
      throw new BuildTransactionError(`Invalid sender address: ${address}`);
    }
    this._sender = address;
    return this;
  }

  /**
   * Set the change address. Defaults to sender if not set.
   */
  changeAddress(address: string): this {
    if (!isValidAddress(address)) {
      throw new BuildTransactionError(`Invalid change address: ${address}`);
    }
    this._changeAddress = address;
    return this;
  }

  /**
   * Add a recipient output.
   */
  to(address: string, amount: bigint | string): this {
    if (!isValidAddress(address)) {
      throw new BuildTransactionError(`Invalid recipient address: ${address}`);
    }
    const amountBig = typeof amount === 'string' ? BigInt(amount) : amount;
    if (amountBig <= BigInt(0)) {
      throw new BuildTransactionError('Amount must be positive');
    }
    this._outputs.push({
      value: amountBig,
      scriptPublicKey: addressToScriptPublicKey(address),
    });
    return this;
  }

  /**
   * Set the transaction fee in sompi.
   */
  fee(fee: bigint | string): this {
    const feeBig = typeof fee === 'string' ? BigInt(fee) : fee;
    if (feeBig < BigInt(0)) {
      throw new BuildTransactionError('Fee must be non-negative');
    }
    this._fee = feeBig;
    return this;
  }

  /**
   * Add a UTXO as a transaction input.
   */
  addUtxo(utxo: KaspaUtxoEntry): this {
    this._utxoEntries.push(utxo);
    this._inputs.push({
      previousOutpoint: {
        transactionId: utxo.transactionId,
        index: utxo.index,
      },
      signatureScript: '',
      sequence: DEFAULT_SEQUENCE,
      sigOpCount: 1,
    });
    return this;
  }

  /**
   * Add multiple UTXOs as inputs.
   */
  addUtxos(utxos: KaspaUtxoEntry[]): this {
    utxos.forEach((utxo) => this.addUtxo(utxo));
    return this;
  }

  /**
   * Set UTXO metadata for signing without adding new inputs.
   * Use this after `from()` when the inputs are already in the serialized tx
   * but UTXO amounts/scripts are needed for sighash computation.
   */
  setUtxoEntries(utxos: KaspaUtxoEntry[]): this {
    this._utxoEntries = [...utxos];
    return this;
  }

  /**
   * Sign the transaction with a private key.
   * Signs all inputs using Schnorr signatures.
   */
  sign(params: { key: string }): this {
    if (this._inputs.length === 0) {
      throw new SigningError('No inputs to sign');
    }
    if (this._utxoEntries.length !== this._inputs.length) {
      throw new SigningError('UTXO entries must be provided for all inputs before signing');
    }

    const keyPair = new KeyPair({ prv: params.key });
    const privKeyHex = keyPair.getKeys().prv;
    if (!privKeyHex) {
      throw new SigningError('Private key required for signing');
    }

    const privKeyBytes = Buffer.from(privKeyHex, 'hex');

    // Ensure UTXO entries are available on the transaction for sighash computation
    if (!this._transaction.txData.utxoEntries && this._utxoEntries.length > 0) {
      this._transaction.txData.utxoEntries = [...this._utxoEntries];
    }

    // Sign each input with Schnorr
    for (let i = 0; i < this._inputs.length; i++) {
      const sighash = this._transaction.computeSighash(i, SIGHASH_ALL);
      const sigBytes = Buffer.from(schnorr.sign(sighash, privKeyBytes));
      this._inputs[i].signatureScript = buildSignatureScript(sigBytes, SIGHASH_ALL).toString('hex');
    }

    return this;
  }

  /** Override to return the concrete Transaction type. */
  async build(): Promise<Transaction> {
    return super.build() as Promise<Transaction>;
  }

  /** @inheritdoc */
  protected fromImplementation(rawTransaction: string): Transaction {
    return Transaction.fromHex(rawTransaction);
  }

  /** @inheritdoc */
  protected signImplementation(key: BaseKey): Transaction {
    this.sign({ key: key.key });
    return this._transaction;
  }

  /** @inheritdoc */
  protected async buildImplementation(): Promise<Transaction> {
    const finalOutputs = [...this._outputs];

    if (!this._isFromHex && this._utxoEntries.length > 0) {
      const totalIn = this._utxoEntries.reduce((sum, u) => sum + u.amount, BigInt(0));
      const totalOut = finalOutputs.reduce((sum, o) => sum + o.value, BigInt(0));
      const change = totalIn - totalOut - this._fee;

      if (change > BigInt(0)) {
        const changeAddr = this._changeAddress || this._sender;
        if (!changeAddr) {
          throw new BuildTransactionError('Change address or sender address required for change output');
        }
        finalOutputs.push({
          value: change,
          scriptPublicKey: addressToScriptPublicKey(changeAddr),
        });
      } else if (change < BigInt(0)) {
        throw new BuildTransactionError(`Insufficient funds: inputs=${totalIn}, outputs=${totalOut}, fee=${this._fee}`);
      }
    }

    this._transaction = new Transaction({
      version: TX_VERSION,
      inputs: this._inputs,
      outputs: finalOutputs,
      lockTime: DEFAULT_LOCK_TIME,
      subnetworkId: NATIVE_SUBNETWORK_ID.toString('hex'),
      gas: DEFAULT_GAS,
      payload: '',
      utxoEntries: this._utxoEntries.length > 0 ? this._utxoEntries : undefined,
    });

    return this._transaction;
  }

  /** @inheritdoc */
  validateKey(key: BaseKey): void {
    if (!key.key || typeof key.key !== 'string' || !/^[0-9a-fA-F]{64}$/.test(key.key)) {
      throw new BuildTransactionError('Invalid key: must be a 32-byte hex string');
    }
  }

  /** @inheritdoc */
  validateAddress(address: BaseAddress): void {
    if (!isValidAddress(address.address)) {
      throw new BuildTransactionError(`Invalid address: ${address.address}`);
    }
  }

  /** @inheritdoc */
  validateValue(value: BigNumber): void {
    if (value.isLessThanOrEqualTo(0)) {
      throw new BuildTransactionError('Value must be greater than 0');
    }
  }

  /** @inheritdoc */
  validateRawTransaction(rawTransaction: string): void {
    if (!rawTransaction || typeof rawTransaction !== 'string') {
      throw new BuildTransactionError('Invalid raw transaction');
    }
    try {
      Transaction.fromHex(rawTransaction);
    } catch (e) {
      throw new BuildTransactionError(`Invalid transaction hex: ${e.message}`);
    }
  }

  /**
   * Validate all required fields are present.
   */
  validateTransaction(): void {
    if (this._inputs.length === 0) {
      throw new BuildTransactionError('At least one input (UTXO) is required');
    }
    if (this._outputs.length === 0) {
      throw new BuildTransactionError('At least one output is required');
    }

    // Check balance only when UTXO amounts are known
    if (this._utxoEntries.length > 0) {
      const totalIn = this._utxoEntries.reduce((sum, u) => sum + u.amount, BigInt(0));
      const totalOut = this._outputs.reduce((sum, o) => sum + o.value, BigInt(0));
      const required = totalOut + this._fee;

      if (totalIn < required) {
        throw new BuildTransactionError(`Insufficient funds: inputs=${totalIn}, outputs+fee=${required}`);
      }
    }
  }
}
