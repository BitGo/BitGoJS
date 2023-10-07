import {
  BaseKey,
  BaseTransaction,
  InvalidTransactionError,
  PublicKey as BasePublicKey,
  Signature,
  TransactionType as BitGoTransactionType,
} from '@bitgo/sdk-core';
import {
  StakingProgrammableTransaction,
  SuiTransaction,
  SuiTransactionType,
  TransferProgrammableTransaction,
  TxData,
} from './iface';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import utils, { AppId, Intent, IntentScope, IntentVersion } from './utils';
import { GasData, normalizeSuiAddress, normalizeSuiObjectId, SuiObjectRef } from './mystenlab/types';
import { SIGNATURE_SCHEME_BYTES } from './constants';
import { Buffer } from 'buffer';
import { fromB64, toB64 } from '@mysten/bcs';
import bs58 from 'bs58';
import { KeyPair } from './keyPair';
import { TRANSACTION_DATA_MAX_SIZE, TransactionBlockDataBuilder } from './mystenlab/builder/TransactionDataBlock';
import { builder, TransactionType } from './mystenlab/builder';
import blake2b from '@bitgo/blake2b';
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

    const intentMessage = this.signablePayload;
    const signature = signer.signMessageinUint8Array(intentMessage);

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
  transactionType(transactionType: BitGoTransactionType): void {
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
    const intentMessage = this.messageWithIntent(IntentScope.TransactionData, dataBytes);
    return Buffer.from(blake2b(32).update(intentMessage).digest('binary'));
  }

  private messageWithIntent(scope: IntentScope, message: Uint8Array) {
    const intent = this.intentWithScope(scope);
    const intentMessage = new Uint8Array(intent.length + message.length);
    intentMessage.set(intent);
    intentMessage.set(message, intent.length);
    return intentMessage;
  }

  private intentWithScope(scope: IntentScope): Intent {
    return [scope, IntentVersion.V0, AppId.Sui];
  }

  serialize(): string {
    const dataBytes = this.getDataBytes();
    this._id = bs58.encode(hashTypedData('TransactionData', dataBytes));
    return toB64(dataBytes);
  }

  static deserializeSuiTransaction(
    serializedTx: string
  ): SuiTransaction<TransferProgrammableTransaction | StakingProgrammableTransaction> {
    const data = fromB64(serializedTx);
    const transactionBlock = TransactionBlockDataBuilder.fromBytes(data);
    const inputs = transactionBlock.inputs.map((txInput) => txInput.value);
    const transactions = transactionBlock.transactions;
    const txType = this.getSuiTransactionType(transactions);
    return {
      id: transactionBlock.getDigest(),
      type: txType,
      sender: normalizeSuiAddress(transactionBlock.sender!),
      tx: {
        inputs: inputs,
        transactions: transactions,
      },
      gasData: {
        payment: this.normalizeCoins(transactionBlock.gasConfig.payment!),
        owner: normalizeSuiAddress(transactionBlock.gasConfig.owner!),
        price: Number(transactionBlock.gasConfig.price as string),
        budget: Number(transactionBlock.gasConfig.budget as string),
      },
    };
  }

  private static getSuiTransactionType(transactions: TransactionType[]): SuiTransactionType {
    // tricky to determine custom tx purely from a serialized tx, we can rely on following logic
    if (transactions.length == 1) {
      return utils.getSuiTransactionType(transactions[0]);
    }
    if (transactions.some((tx) => utils.getSuiTransactionType(tx) === SuiTransactionType.AddStake)) {
      return SuiTransactionType.AddStake;
    }
    if (transactions.some((tx) => utils.getSuiTransactionType(tx) === SuiTransactionType.WithdrawStake)) {
      return SuiTransactionType.WithdrawStake;
    }
    if (transactions.every((tx) => utils.getSuiTransactionType(tx) === SuiTransactionType.Transfer)) {
      return SuiTransactionType.Transfer;
    }

    return SuiTransactionType.CustomTx;
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
