import { BaseCoin as CoinConfig } from '@bitgo/statics/dist/src/base';
import { hash } from '@stablelib/sha384';
import BigNumber from 'bignumber.js';
import { Writer } from 'protobufjs';
import * as nacl from 'tweetnacl';
import { proto } from '../../../resources/hbar/protobuf/hedera';
import { BaseTransaction } from '../baseCoin';
import { BaseKey } from '../baseCoin/iface';
import { SigningError } from '../baseCoin/errors';
import { TxData } from './ifaces';
import { toHex, toUint8Array } from './utils';
import { KeyPair } from './';

export class Transaction extends BaseTransaction {
  private _hederaTx: proto.Transaction;
  private _txBody: proto.TransactionBody;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  /** @inheritdoc */
  canSign(key: BaseKey): boolean {
    return true;
  }

  async sign(keyPair: KeyPair): Promise<void> {
    const keys = keyPair.getKeys(true);
    if (!keys.prv) {
      throw new SigningError('Missing private key');
    }
    const secretKey = toUint8Array(keys.prv + keys.pub);
    const signature = nacl.sign.detached(this._hederaTx.bodyBytes, secretKey);
    this.addSignature(toHex(signature), keyPair);
  }

  /**
   * Add a signature to this transaction
   * @param signature The signature to add, in string hex format
   * @param key The key of the key that created the signature
   */
  addSignature(signature: string, key: KeyPair): void {
    const sigPair = new proto.SignaturePair();
    sigPair.pubKeyPrefix = toUint8Array(key.getKeys(true).pub);
    sigPair.ed25519 = toUint8Array(signature);

    const sigMap = this._hederaTx.sigMap || new proto.SignatureMap();
    sigMap.sigPair!.push(sigPair);
    this._hederaTx.sigMap = sigMap;
  }


  /** @inheritdoc */
  toBroadcastFormat(): string {
    return toHex(this.encode(this._hederaTx));
  }

  /** @inheritdoc */
  toJson(): TxData {
    const [acc, time] = this.getTxIdParts();
    return {
      id: acc + '@' + time,
      hash: this.getTxHash(), // TODO: Update once hedera-sdk release this functionality BGA-284
      data: toHex(this._hederaTx.bodyBytes),
      fee: new BigNumber(this._txBody.transactionFee!.toString()).toNumber(),
      from: acc,
      startTime: time,
    };
  }

  //region getters & setters
  get txBody(): proto.TransactionBody {
    return this._txBody;
  }

  get hederaTx(): proto.Transaction {
    return this._hederaTx;
  }

  /**
   * Sets this transaction body components
   *
   * @param {proto.Transaction} tx body transaction
   */
  body(tx: proto.Transaction) {
    this._txBody = proto.TransactionBody.decode(tx.bodyBytes);
    this._hederaTx = tx;
  }

  /**
   * Sets this transaction body components
   *
   * @param {Uint8Array} bytes encoded body transaction
   */
  bodyBytes(bytes: Uint8Array) {
    this.body(proto.Transaction.decode(bytes));
  }
  //endregion

  //region helpers
  /**
   * Returns this hedera transaction id components in a readable format
   *
   * @returns {[string, string]} - transaction id parts [<account id>, <startTime in seconds>]
   */
  private getTxIdParts(): [string, string] {
    if (
      this._txBody &&
      this._txBody.transactionID &&
      this._txBody.transactionID.accountID &&
      this._txBody.transactionID.transactionValidStart
    ) {
      return [
        this.stringifyAccountId(this._txBody.transactionID.accountID),
        this.stringifyTxTime(this._txBody.transactionID.transactionValidStart),
      ];
    }
    throw new Error('Missing transaction id information');
  }

  /**
   * Returns a string representation of an {proto.IAccountID} object
   *
   * @param {proto.IAccountID} - account id to be cast to string
   * @returns {string} - the string representation of the {proto.IAccountID}
   */
  private stringifyAccountId({ shardNum, realmNum, accountNum }: proto.IAccountID): string {
    return `${shardNum || 0}.${realmNum || 0}.${accountNum}`;
  }

  /**
   * Returns a string representation of an {proto.ITimestamp} object
   *
   * @param {proto.ITimestamp} - timestamp to be cast to string
   * @returns {string} - the string representation of the {proto.ITimestamp}
   */
  private stringifyTxTime({ seconds, nanos }: proto.ITimestamp) {
    return `${seconds}.${nanos}`;
  }

  /**
   * Returns this transaction hash
   *
   * @returns {string} - The transaction hash
   */
  private getTxHash(): string {
    if (!this._txBody.nodeAccountID) {
      throw new Error('Missing transaction node id');
    }
    return this.getHashOf(this._hederaTx);
  }

  /**
   * Encode an object using the given encoder class
   *
   * @param obj - the object to be encoded, it must be an proto namespace object
   * @param encoder - Object encoder
   * @returns {Uint8Array} - encoded object byte array
   */
  private encode<T extends { constructor: Function }>(obj: T, encoder?: { encode(arg: T): Writer }): Uint8Array {
    if (encoder) {
      return encoder.encode(obj).finish();
    }
    return this.encode(obj, proto[obj.constructor.name]);
  }

  /**
   * Returns an sha-384 hash
   *
   * @param {Uint8Array} bytes - bytes to be hashed
   * @returns {string} - the resulting hash string
   */
  private sha(bytes: Uint8Array): string {
    return toHex(hash(bytes));
  }

  /**
   * Returns a hash of the given proto object.
   *
   * @param obj - The object to be hashed, it must be an proto namespace object
   * @returns {string} - the resulting hash string
   */
  private getHashOf<T>(obj: T): string {
    return this.sha(this.encode(obj));
  }
  //endregion
}
