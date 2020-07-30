import { BaseCoin as CoinConfig } from '@bitgo/statics/dist/src/base';
import BigNumber from 'bignumber.js';
import * as nacl from 'tweetnacl';
import Long from 'long';
import { proto } from '../../../resources/hbar/protobuf/hedera';
import { BaseTransaction } from '../baseCoin';
import { BaseKey } from '../baseCoin/iface';
import { SigningError } from '../baseCoin/errors';
import { TxData } from './ifaces';
import { stringifyAccountId, stringifyTxTime, toHex, toUint8Array } from './utils';
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
      validDuration: new BigNumber(this._txBody.transactionValidDuration!.seconds!.toString()).toNumber(),
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
        stringifyAccountId(this._txBody.transactionID.accountID),
        stringifyTxTime(this._txBody.transactionID.transactionValidStart),
      ];
    }
    throw new Error('Missing transaction id information');
  }
  //endregion
}
