import { BaseCoin as CoinConfig } from '@bitgo/statics/dist/src/base';
import { hash } from '@stablelib/sha384';
import BigNumber from 'bignumber.js';
import { Writer } from 'protobufjs';
import * as nacl from 'tweetnacl';
import Long from 'long';
import { proto } from '../../../resources/hbar/protobuf/hedera';
import { BaseTransaction, TransactionType } from '../baseCoin';
import { BaseKey } from '../baseCoin/iface';
import { SigningError } from '../baseCoin/errors';
import { TxData } from './ifaces';
import { stringifyAccountId, stringifyTxTime, toHex, toUint8Array } from './utils';
import { KeyPair } from './';

export class Transaction extends BaseTransaction {
  private _hederaTx: proto.Transaction;
  private _txBody: proto.TransactionBody;
  protected _type: TransactionType;

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
    this._signatures.push(signature);
  }


  /** @inheritdoc */
  toBroadcastFormat(): string {
    return toHex(this.encode(this._hederaTx));
  }

  /** @inheritdoc */
  toJson(): TxData {
    const [acc, time] = this.getTxIdParts();
    const result: TxData = {
      id: acc + '@' + time,
      hash: this.getTxHash(), // TODO: Update once hedera-sdk release this functionality BGA-284
      data: toHex(this._hederaTx.bodyBytes),
      fee: new BigNumber(this._txBody.transactionFee!.toString()).toNumber(),
      from: acc,
      startTime: time,
      validDuration: this._txBody.transactionValidDuration!.seconds!.toString(),
      node: stringifyAccountId(this._txBody.nodeAccountID!),
      memo: this._txBody.memo,
    };

    if (this._txBody.data === 'cryptoTransfer') {
      const [recipient, amount] = this.getTransferData();
      result.amount = amount;
      result.to = recipient;
    }
    return result;
  }

  /**
   * Get the recipient account and the amount
   * transferred on this transaction
   *
   * @returns {[string, string]} first element is the recipient, second element is the amount
   */
  private getTransferData(): [string, string] {
    let transferData;
    this._txBody.cryptoTransfer!.transfers!.accountAmounts!.forEach(transfer => {
      const amount = Long.fromValue(transfer.amount!);
      if (amount.isPositive()) {
        transferData = [stringifyAccountId(transfer.accountID!), amount.toString()];
      }
    });

    return transferData;
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
    // this.loadPreviousSignatures();
    this.loadInputsAndOutputs();
  }

  /**
   * Set the transaction type
   *
   * @param {TransactionType} transactionType The transaction type to be set
   */
  setTransactionType(transactionType: TransactionType): void {
    this._type = transactionType;
  }

  /**
   * Decode previous signatures from the inner hedera transaction
   * and save them into the base transaction signature list.
   */
  loadPreviousSignatures(): void {
    if (this._hederaTx.sigMap && this._hederaTx.sigMap.sigPair) {
      const sigPairs = this._hederaTx.sigMap.sigPair;
      sigPairs.forEach(sigPair => {
        const signature = sigPair.ed25519;
        if (signature) {
          this._signatures.push(toHex(signature));
        }
      });
    }
  }

  /**
   * Load the input and output data on this transaction using the transaction json
   * if there are outputs. For transactions without outputs (e.g. wallet initializations),
   * this function will not do anything
   */
  loadInputsAndOutputs(): void {
    const txJson = this.toJson();
    if (txJson.to && txJson.amount) {
      this._outputs = [{
        address: txJson.to,
        value: txJson.amount,
        coin: this._coinConfig.name,
      }];

      this._inputs = [{
        address: txJson.from,
        value: txJson.amount,
        coin: this._coinConfig.name,
      }];
    }
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
  getTxIdParts(): [string, string] {
    if (
      this._txBody &&
      this._txBody.transactionID &&
      this._txBody.transactionID.accountID &&
      this._txBody.transactionID.transactionValidStart
    ) {
      return [
        stringifyAccountId(this._txBody.transactionID.accountID),
        stringifyTxTime(this._txBody.transactionID.transactionValidStart),
      ];
    }
    throw new Error('Missing transaction id information');
  }

  /**
   * Returns this transaction hash
   *
   * @returns {string} - The transaction hash
   */
  getTxHash(): string {
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
  sha(bytes: Uint8Array): string {
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
