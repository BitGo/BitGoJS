import { BaseCoin as CoinConfig } from '@bitgo/statics/dist/src/base';
import { hash } from '@stablelib/sha384';
import BigNumber from 'bignumber.js';
import { Writer } from 'protobufjs';
import * as nacl from 'tweetnacl';
import { Transaction as SDKTransaction } from '@hashgraph/sdk';
import { TransactionBody } from '@hashgraph/sdk/lib/generated/TransactionBody_pb';
import { SignatureMap, SignaturePair } from '@hashgraph/sdk/lib/generated/BasicTypes_pb';
import Long from 'long';
import { proto } from '../../../resources/hbar/protobuf/hedera';
import { BaseTransaction } from '../baseCoin';
import { BaseKey } from '../baseCoin/iface';
import { SigningError } from '../baseCoin/errors';
import { TxData } from './ifaces';
import { stringifyAccountId, stringifyTxTime, toHex, toUint8Array } from './utils';
import { KeyPair } from './';

export class Transaction extends BaseTransaction {
  private _hederaTx: SDKTransaction;
  private _txBody: TransactionBody;

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
    const signature = nacl.sign.detached(this._hederaTx._toProto().getBodybytes_asU8(), secretKey);
    this.addSignature(toHex(signature), keyPair);
  }

  /**
   * Add a signature to this transaction
   *
   * @param signature The signature to add, in string hex format
   * @param key The key of the key that created the signature
   */
  addSignature(signature: string, key: KeyPair): void {
    const sigPair = new SignaturePair();
    sigPair.setPubkeyprefix(toUint8Array(key.getKeys(true).pub));
    sigPair.setEd25519(toUint8Array(signature));

    const sigMap = this._hederaTx._toProto().getSigmap() || new SignatureMap();
    sigMap.getSigpairList()!.push(sigPair);
    this._hederaTx._toProto().setSigmap(sigMap);
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
      data: toHex(this._hederaTx._toProto().getBodybytes_asU8()),
      fee: new BigNumber(this._txBody.getTransactionfee().toString()).toNumber(),
      from: acc,
      startTime: time,
      validDuration: this._txBody
        .getTransactionvalidduration()!
        .getSeconds()
        .toString(),
      node: stringifyAccountId(this._txBody.getNodeaccountid()!),
      memo: this._txBody.getMemo(),
    };

    // if (this._txBody.data === 'cryptoTransfer') {
    if (this._txBody.hasCryptotransfer()) {
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
    this._txBody
      .getCryptotransfer()!
      .getTransfers()!
      .getAccountamountsList()
      .forEach(transfer => {
        const amount = Long.fromValue(transfer.getAmount());
        if (amount.isPositive()) {
          transferData = [stringifyAccountId(transfer.getAccountid()!), amount.toString()];
        }
      });

    return transferData;
  }

  //region getters & setters
  get txBody(): TransactionBody {
    return this._txBody;
  }

  get hederaTx(): SDKTransaction {
    return this._hederaTx;
  }

  /**
   * Sets this transaction body components
   *
   * @param {SDKTransaction} tx body transaction
   */
  body(tx: SDKTransaction) {
    this._txBody = TransactionBody.deserializeBinary(tx._toProto().getBodybytes_asU8());
    this._hederaTx = tx;
    // this.loadPreviousSignatures();
  }

  /**
   * Decode previous signatures from the inner hedera transaction
   * and save them into the base transaction signature list.
   */
  loadPreviousSignatures(): void {
    if (
      this._hederaTx._toProto().getSigmap() &&
      this._hederaTx
        ._toProto()
        .getSigmap()!
        .getSigpairList()
    ) {
      const sigPairs = this._hederaTx
        ._toProto()
        .getSigmap()!
        .getSigpairList();
      sigPairs.forEach(sigPair => {
        // const signature = sigPair.ed25519;
        const signature = sigPair.getEd25519_asU8();
        if (signature) {
          this._signatures.push(toHex(signature));
        }
      });
    }
  }

  /**
   * Sets this transaction body components
   *
   * @param {Uint8Array} bytes encoded body transaction
   */
  bodyBytes(bytes: Uint8Array) {
    this.body(SDKTransaction.fromBytes(bytes));
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
      this._txBody.getTransactionid() &&
      this._txBody.getTransactionid()!.getAccountid() &&
      this._txBody.getTransactionid()!.getTransactionvalidstart()
    ) {
      return [
        stringifyAccountId(this._txBody.getTransactionid()!.getAccountid()!),
        stringifyTxTime(this._txBody.getTransactionid()!.getTransactionvalidstart()!),
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
    if (!this._txBody.getNodeaccountid()) {
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
