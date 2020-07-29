import { BaseCoin as CoinConfig } from '@bitgo/statics/dist/src/base';
import BigNumber from 'bignumber.js';
import * as nacl from 'tweetnacl';
import Long from 'long';
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
    const sigPair = new proto.SignaturePair();
    sigPair.pubKeyPrefix = toUint8Array(keys.pub);
    sigPair.ed25519 = signature;

    const sigMap = this._hederaTx.sigMap || new proto.SignatureMap();
    sigMap.sigPair!.push(sigPair);
    this._hederaTx.sigMap = sigMap;
  }

  /** @inheritdoc */
  toBroadcastFormat(): string {
    return toHex(proto.Transaction.encode(this._hederaTx).finish());
  }

  /** @inheritdoc */
  toJson(): TxData {
    const [acc, time] = this.getTxIdParts();
    const result: TxData = {
      id: acc + '@' + time,
      data: Uint8Array.from(this._hederaTx.bodyBytes).toString(),
      fee: new BigNumber(this._txBody.transactionFee!.toString()).toNumber(),
      from: acc,
      startTime: time,
      memo: this._hederaTx.body!.memo!,
    };

    if (this._txBody.data === 'cryptoTransfer') {
      const [recipient, amount] = this.getTransferData();
      result.amount = amount;
      result.to = recipient;
    }
    return result;
  }

  private getTransferData(): [string, string] {
    let transferData;
    this._txBody.cryptoTransfer!.transfers!.accountAmounts!.forEach(transfer => {
      const amount = Long.fromValue(transfer.amount!);
      if (amount.isPositive()) {
        transferData = [transfer.accountID, amount.toString()];
      }
    });

    return transferData;
  }

  //region getters & setters
  get txBody(): proto.TransactionBody {
    return this._txBody;
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
  //endregion
}
