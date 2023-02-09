import {
  BaseKey,
  BaseTransaction,
  InvalidTransactionError,
  PublicKey as BasePublicKey,
  Signature,
  TransactionType,
} from '@bitgo/sdk-core';
import {
  MoveCallTx,
  MoveCallTxDetails,
  PayTx,
  SuiObjectRef,
  SuiTransaction,
  SuiTransactionType,
  TxData,
  TxDetails,
} from './iface';
import { BaseCoin as CoinConfig } from '@bitgo/statics';
import utils from './utils';
import { bcs } from './bcs';
import { SER_BUFFER_SIZE, SIGNATURE_SCHEME_BYTES, SUI_INTENT_BYTES, UNAVAILABLE_TEXT } from './constants';
import { Buffer } from 'buffer';
import sha3 from 'js-sha3';
import { fromB64, fromHEX } from '@mysten/bcs';
import bs58 from 'bs58';
import { KeyPair } from './keyPair';

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
    if (this._signature !== undefined) {
      const dataBytes = this.getDataBytes();
      const hash = this.getSha256Hash('TransactionData', dataBytes);
      this._id = bs58.encode(hash);
    }
    return this._id || UNAVAILABLE_TEXT;
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
    return bcs.ser('TransactionData', txData, SER_BUFFER_SIZE).toBytes();
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
    if (this._signature !== undefined) {
      const hash = this.getSha256Hash('TransactionData', dataBytes);
      this._id = bs58.encode(hash);
    }
    return Buffer.from(dataBytes).toString('base64');
  }

  private getSha256Hash(typeTag: string, data: Uint8Array): Uint8Array {
    const hash = sha3.sha3_256.create();

    const typeTagBytes = Array.from(`${typeTag}::`).map((e) => e.charCodeAt(0));

    const dataWithTag = new Uint8Array(typeTagBytes.length + data.length);
    dataWithTag.set(typeTagBytes);
    dataWithTag.set(data, typeTagBytes.length);

    hash.update(dataWithTag);

    return fromHEX(hash.hex());
  }

  static deserializeSuiTransaction(serializedTx: string): SuiTransaction {
    const data = fromB64(serializedTx);
    const k = bcs.de('TransactionData', data);

    let type: SuiTransactionType;
    const txDetails: TxDetails = k.kind.Single;
    if (txDetails.hasOwnProperty('Pay')) {
      type = SuiTransactionType.Pay;
    } else if (txDetails.hasOwnProperty('PaySui')) {
      type = SuiTransactionType.PaySui;
    } else if (txDetails.hasOwnProperty('PayAllSui')) {
      type = SuiTransactionType.PayAllSui;
    } else if (txDetails.hasOwnProperty('Call')) {
      const moveCallTxDetail = txDetails as MoveCallTxDetails;
      type = utils.getSuiTransactionType(moveCallTxDetail.Call.function);
    } else {
      throw new Error('Transaction type not supported: ' + txDetails);
    }

    const tx = this.getProperTxDetails(k, type);

    return {
      type,
      sender: utils.normalizeHexId(k.sender),
      tx: tx,
      gasBudget: k.gasBudget.toNumber(),
      gasPrice: k.gasPrice.toNumber(),
      gasPayment: {
        objectId: utils.normalizeHexId(k.gasPayment.objectId),
        version: k.gasPayment.version.toNumber(),
        digest: k.gasPayment.digest,
      },
    };
  }

  static getProperTxDetails(k: any, type: SuiTransactionType): PayTx | MoveCallTx {
    switch (type) {
      case SuiTransactionType.Pay:
        return {
          coins: this.normalizeCoins(k.kind.Single.Pay.coins),
          recipients: k.kind.Single.Pay.recipients.map((recipient) => utils.normalizeHexId(recipient)) as string[],
          amounts: k.kind.Single.Pay.amounts.map((amount) => amount.toNumber()) as number[],
        };
      case SuiTransactionType.PaySui:
        return {
          coins: this.normalizeCoins(k.kind.Single.PaySui.coins),
          recipients: k.kind.Single.PaySui.recipients.map((recipient) => utils.normalizeHexId(recipient)) as string[],
          amounts: k.kind.Single.PaySui.amounts.map((amount) => amount.toNumber()) as number[],
        };
      case SuiTransactionType.PayAllSui:
        return {
          coins: this.normalizeCoins(k.kind.Single.PayAllSui.coins),
          recipients: [k.kind.Single.PayAllSui.recipient].map((recipient) =>
            utils.normalizeHexId(recipient)
          ) as string[],
          amounts: [], // PayAllSui deserialization doesn't return the amount
        };
      case SuiTransactionType.AddDelegation:
        return {
          package: k.kind.Single.Call.package,
          module: k.kind.Single.Call.module,
          function: k.kind.Single.Call.function,
          typeArguments: k.kind.Single.Call.typeArguments,
          arguments: [
            utils.mapCallArgToSharedObject(k.kind.Single.Call.arguments[0]),
            this.normalizeCoins(utils.mapCallArgToCoins(k.kind.Single.Call.arguments[1])),
            utils.mapCallArgToAmount(k.kind.Single.Call.arguments[2]),
            utils.normalizeHexId(utils.mapCallArgToAddress(k.kind.Single.Call.arguments[3])),
          ],
        };
      case SuiTransactionType.WithdrawDelegation:
        return {
          package: k.kind.Single.Call.package,
          module: k.kind.Single.Call.module,
          function: k.kind.Single.Call.function,
          typeArguments: k.kind.Single.Call.typeArguments,
          arguments: [
            utils.mapCallArgToSharedObject(k.kind.Single.Call.arguments[0]),
            this.normalizeSuiObjectRef(utils.mapCallArgToSuiObjectRef(k.kind.Single.Call.arguments[1])), // delegation
            this.normalizeSuiObjectRef(utils.mapCallArgToSuiObjectRef(k.kind.Single.Call.arguments[2])), // stake sui
          ],
        };
      case SuiTransactionType.SwitchDelegation:
        return {
          package: k.kind.Single.Call.package,
          module: k.kind.Single.Call.module,
          function: k.kind.Single.Call.function,
          typeArguments: k.kind.Single.Call.typeArguments,
          arguments: [
            utils.mapCallArgToSharedObject(k.kind.Single.Call.arguments[0]),
            this.normalizeSuiObjectRef(utils.mapCallArgToSuiObjectRef(k.kind.Single.Call.arguments[1])), // delegation
            this.normalizeSuiObjectRef(utils.mapCallArgToSuiObjectRef(k.kind.Single.Call.arguments[2])), // stake sui
            utils.normalizeHexId(utils.mapCallArgToAddress(k.kind.Single.Call.arguments[3])), // new validator address
          ],
        };
      default:
        throw new InvalidTransactionError('SuiTransactionType not supported');
    }
  }

  private static normalizeCoins(coins: any[]): SuiObjectRef[] {
    return coins.map((coin) => {
      return this.normalizeSuiObjectRef(coin);
    });
  }

  private static normalizeSuiObjectRef(obj: SuiObjectRef): SuiObjectRef {
    return {
      objectId: utils.normalizeHexId(obj.objectId),
      version: Number(obj.version),
      digest: obj.digest,
    };
  }
}
