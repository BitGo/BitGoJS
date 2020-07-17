import { proto } from '../../../resources/hbar/protobuf/hedera';
import { BaseCoin as CoinConfig } from '@bitgo/statics/dist/src/base';
import { BaseTransaction } from '../baseCoin';
import { BaseKey } from '../baseCoin/iface';
import {TxData} from './ifaces';
import BigNumber from 'bignumber.js';

export class Transaction extends BaseTransaction {
  private _hederaTx: proto.Transaction;
  private _txBody: proto.TransactionBody;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  body(tx: proto.Transaction) {
    this._txBody = proto.TransactionBody.decode(tx.bodyBytes);
    this._hederaTx = tx;
  }

  canSign(key: BaseKey): boolean {
    return true;
  }

  /** @inheritdoc */
  toBroadcastFormat(): any {
    return proto.Transaction.encode(this._hederaTx).finish();
  }

  /** @inheritdoc */
  toJson(): TxData {
    const [acc, time] = this.getTxIdParts();
    return {
      id: acc + '@' + time,
      // TODO: add tx hash
      data: Uint8Array.from(this._hederaTx.bodyBytes).toString(),
      fee: +new BigNumber(this._txBody.transactionFee.toString()),
      from: acc,
    };
  }

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

  private stringifyAccountId({ shardNum, realmNum, accountNum }: proto.IAccountID): string {
    return `${shardNum || 0}.${realmNum || 0}.${accountNum}`;
  }

  private stringifyTxTime({ seconds, nanos }: proto.ITimestamp) {
    return `${seconds}.${nanos}`;
  }
}
