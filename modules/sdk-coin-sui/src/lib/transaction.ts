import {
  BaseKey,
  BaseTransaction,
  InvalidTransactionError,
  PublicKey as BasePublicKey,
  Signature,
  TransactionType,
} from '@bitgo/sdk-core';
import { SuiTransaction, SuiTransactionType, TxData } from './iface';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import utils from './utils';
import {
  GasData,
  normalizeSuiAddress,
  normalizeSuiObjectId,
  ProgrammableTransaction,
  SuiObjectRef,
} from './mystenlab/types';
import { SIGNATURE_SCHEME_BYTES, SUI_INTENT_BYTES } from './constants';
import { Buffer } from 'buffer';
import { fromB64, toB64 } from '@mysten/bcs';
import bs58 from 'bs58';
import { KeyPair } from './keyPair';
import { TRANSACTION_DATA_MAX_SIZE, TransactionDataBuilder } from './mystenlab/builder/TransactionData';
import { builder, TransactionCommand } from './mystenlab/builder';
import { hashTypedData } from './mystenlab/cryptography/hash';

export abstract class Transaction<T> extends BaseTransaction {
  protected _suiTransaction: SuiTransaction<T>;
  protected _signature: Signature;
  private _serializedSig: Uint8Array;

  protected constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  get suiTransaction(): SuiTransaction<T> {
    return this._suiTransaction;
  }

  setSuiTransaction(tx: SuiTransaction<T>): void {
    this._suiTransaction = tx;
  }

  /** @inheritDoc **/
  get id(): string {
    const dataBytes = this.getDataBytes();
    const hash = hashTypedData('TransactionData', dataBytes);
    this._id = bs58.encode(hash);
    return this._id;
  }

  addSignature(publicKey: BasePublicKey, signature: Buffer): void {
    this._signatures.push(signature.toString('hex'));
    this._signature = { publicKey, signature };
    this.serialize();
  }

  get suiSignature(): Signature {
    return this._signature;
  }

  get serializedSig(): Uint8Array {
    return this._serializedSig;
  }

  setSerializedSig(publicKey: BasePublicKey, signature: Buffer): void {
    const pubKey = Buffer.from(publicKey.pub, 'hex');
    const serialized_sig = new Uint8Array(1 + signature.length + pubKey.length);
    serialized_sig.set(SIGNATURE_SCHEME_BYTES);
    serialized_sig.set(signature, 1);
    serialized_sig.set(pubKey, 1 + signature.length);
    this._serializedSig = serialized_sig;
  }

  /** @inheritdoc */
  canSign(key: BaseKey): boolean {
    return true;
  }

  /**
   * Sign this transaction
   *
   * @param {KeyPair} signer key
   */

  sign(signer: KeyPair): void {
    if (!this._suiTransaction) {
      throw new InvalidTransactionError('empty transaction to sign');
    }

    const signature = signer.signMessageinUint8Array(this.signablePayload);
    this.setSerializedSig({ pub: signer.getKeys().pub }, Buffer.from(signature));
    this.addSignature({ pub: signer.getKeys().pub }, Buffer.from(signature));
  }

  /** @inheritdoc */
  toBroadcastFormat(): string {
    if (!this._suiTransaction) {
      throw new InvalidTransactionError('Empty transaction');
    }
    return this.serialize();
  }

  /** @inheritdoc */
  abstract toJson(): TxData;

  /**
   * Set the transaction type.
   *
   * @param {TransactionType} transactionType The transaction type to be set.
   */
  transactionType(transactionType: TransactionType): void {
    this._type = transactionType;
  }

  /**
   *  get the correct txData with transaction type
   */
  abstract getTxData(): TxData;

  /**
   * Load the input and output data on this transaction.
   */
  abstract loadInputsAndOutputs(): void;

  /**
   * Sets this transaction payload
   *
   * @param rawTransaction
   */
  abstract fromRawTransaction(rawTransaction: string): void;

  getDataBytes(): Uint8Array {
    const txData = this.getTxData();
    const txSer = builder.ser('TransactionData', { V1: txData }, { maxSize: TRANSACTION_DATA_MAX_SIZE });
    return txSer.toBytes();
  }

  /** @inheritDoc */
  get signablePayload(): Buffer {
    const dataBytes = this.getDataBytes();

    const intentMessage = new Uint8Array(SUI_INTENT_BYTES.length + dataBytes.length);
    intentMessage.set(SUI_INTENT_BYTES);
    intentMessage.set(dataBytes, SUI_INTENT_BYTES.length);
    return Buffer.from(intentMessage);
  }

  serialize(): string {
    const dataBytes = this.getDataBytes();
    this._id = bs58.encode(hashTypedData('TransactionData', dataBytes));
    return toB64(dataBytes);
  }

  static deserializeSuiTransaction(serializedTx: string): SuiTransaction<ProgrammableTransaction> {
    const data = fromB64(serializedTx);
    const transaction = TransactionDataBuilder.fromBytes(data);
    const inputs = transaction.inputs.map((txInput) => txInput.value);
    const commands: TransactionCommand[] = transaction.commands;
    // TODO: FIXME - get tx type Transfer or AddStake, for now only Transfer
    const txType = SuiTransactionType.Transfer;
    return {
      id: transaction.getDigest(),
      type: txType,
      sender: normalizeSuiAddress(transaction.sender!),
      tx: {
        inputs: inputs,
        commands: commands,
      },
      gasData: {
        payment: this.normalizeCoins(transaction.gasConfig.payment!),
        owner: normalizeSuiAddress(transaction.gasConfig.owner!),
        price: Number(transaction.gasConfig.price as string),
        budget: Number(transaction.gasConfig.budget as string),
      },
    };
  }

  static getProperGasData(k: any): GasData {
    return {
      payment: [this.normalizeSuiObjectRef(k.gasData.payment)],
      owner: utils.normalizeHexId(k.gasData.owner),
      price: Number(k.gasData.price),
      budget: Number(k.gasData.budget),
    };
  }

  private static normalizeCoins(coins: any[]): SuiObjectRef[] {
    return coins.map((coin) => {
      return this.normalizeSuiObjectRef(coin);
    });
  }

  private static normalizeSuiObjectRef(obj: SuiObjectRef): SuiObjectRef {
    return {
      objectId: normalizeSuiObjectId(obj.objectId),
      version: Number(obj.version),
      digest: obj.digest,
    };
  }
}
