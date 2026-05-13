import {
  BaseTransactionBuilder,
  BaseTransaction,
  BaseKey,
  PublicKey as BasePublicKey,
  SigningError,
} from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import BigNumber from 'bignumber.js';
import { Transaction } from './transaction';
import { KaspaTransactionData, KaspaUtxoInput, KaspaTransactionOutput } from './iface';
import { isValidKaspaAddress } from './utils';
import { KeyPair } from './keyPair';
import { DEFAULT_FEE, TX_VERSION } from './constants';

interface KaspaSignature {
  publicKey: BasePublicKey;
  signature: Buffer;
}

export class TransactionBuilder extends BaseTransactionBuilder {
  protected _transaction: Transaction;
  protected _inputs: KaspaUtxoInput[] = [];
  protected _outputs: KaspaTransactionOutput[] = [];
  protected _fee: string = DEFAULT_FEE;
  protected _fromAddress = '';
  protected _signatures: KaspaSignature[] = [];

  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
    this._transaction = new Transaction(coinConfig.name);
  }

  /** @inheritDoc */
  protected get transaction(): BaseTransaction {
    return this._transaction;
  }

  /** @inheritDoc */
  protected set transaction(tx: BaseTransaction) {
    this._transaction = tx as Transaction;
  }

  /**
   * Set the sender address.
   */
  sender(address: string): this {
    if (!isValidKaspaAddress(address)) {
      throw new Error(`Invalid Kaspa address: ${address}`);
    }
    this._fromAddress = address;
    return this;
  }

  /**
   * Add a recipient output.
   */
  to(address: string, amount: string): this {
    if (!isValidKaspaAddress(address)) {
      throw new Error(`Invalid Kaspa recipient address: ${address}`);
    }
    this._outputs.push({ address, amount });
    return this;
  }

  /**
   * Set transaction fee in sompi.
   */
  fee(fee: string): this {
    this._fee = fee;
    return this;
  }

  /**
   * Add a UTXO input.
   */
  addInput(utxo: KaspaUtxoInput): this {
    if (!utxo.transactionId || utxo.transactionIndex === undefined) {
      throw new Error('Invalid UTXO: missing transactionId or transactionIndex');
    }
    this._inputs.push(utxo);
    return this;
  }

  /**
   * Add multiple UTXO inputs.
   */
  addInputs(utxos: KaspaUtxoInput[]): this {
    utxos.forEach((u) => this.addInput(u));
    return this;
  }

  /**
   * Add an externally-produced signature (from TSS/MPC signing) to the transaction.
   * The signature will be applied to all inputs during build().
   *
   * This follows the same pattern as ADA's TransactionBuilder.addSignature().
   *
   * @param publicKey The compressed secp256k1 public key that produced the signature
   * @param signature The 64-byte Schnorr signature buffer
   */
  addSignature(publicKey: BasePublicKey, signature: Buffer): void {
    this._signatures.push({ publicKey, signature });
  }

  /** @inheritDoc */
  protected fromImplementation(rawTransaction: string): Transaction {
    const tx = Transaction.fromHex((this as any)._coinConfig?.name || 'kaspa', rawTransaction);
    this._transaction = tx;
    this._inputs = tx.txData.inputs || [];
    this._outputs = tx.txData.outputs || [];
    this._fee = tx.txData.fee || DEFAULT_FEE;
    return tx;
  }

  /** @inheritDoc */
  protected async buildImplementation(): Promise<BaseTransaction> {
    const txData: KaspaTransactionData = {
      version: TX_VERSION,
      inputs: this._inputs,
      outputs: this._outputs,
      fee: this._fee,
      lockTime: '0',
      subnetworkId: '0000000000000000000000000000000000000000',
      payload: '',
    };

    this._transaction = new Transaction((this as any)._coinConfig?.name || 'kaspa', txData);

    // Apply any externally-produced signatures (from TSS/MPC)
    for (const sig of this._signatures) {
      this._transaction.addSignature(sig.publicKey.pub, sig.signature);
    }

    return this._transaction;
  }

  /** @inheritDoc */
  protected signImplementation({ key }: BaseKey): BaseTransaction {
    const keyPair = new KeyPair({ prv: key });
    const privateKey = keyPair.getKeys().prv;
    if (!privateKey) {
      throw new SigningError('Missing private key');
    }
    this._transaction.sign(Buffer.from(privateKey, 'hex'));
    return this._transaction;
  }

  /** @inheritDoc */
  validateTransaction(_transaction?: BaseTransaction): void {
    if (this._inputs.length === 0) {
      throw new Error('At least one UTXO input is required');
    }
    if (this._outputs.length === 0) {
      throw new Error('At least one output is required');
    }
  }

  /** @inheritDoc */
  validateKey(key: { key: string }): void {
    // Key validation handled in KeyPair
  }

  /** @inheritDoc */
  validateAddress(address: { address: string }): void {
    if (!isValidKaspaAddress(address.address)) {
      throw new Error(`Invalid Kaspa address: ${address.address}`);
    }
  }

  /** @inheritDoc */
  validateRawTransaction(rawTransaction: string): void {
    try {
      Transaction.fromHex((this as any)._coinConfig?.name || 'kaspa', rawTransaction);
    } catch {
      throw new Error('Invalid raw Kaspa transaction');
    }
  }

  /** @inheritDoc */
  validateValue(value: BigNumber): void {
    if (value.isLessThan(0)) {
      throw new Error('Transaction value cannot be negative');
    }
  }
}
