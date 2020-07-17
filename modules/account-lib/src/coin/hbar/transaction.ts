import { proto } from '../../../resources/hbar/protobuf/hedera';
import { BaseCoin as CoinConfig } from '@bitgo/statics/dist/src/base';
import { BaseTransaction } from '../baseCoin';
import { BaseKey } from '../baseCoin/iface';

export class Transaction extends BaseTransaction {
  private _body: proto.Transaction;

  constructor(_coinConfig: Readonly<CoinConfig>) {
    super(_coinConfig);
  }

  body(txBody: proto.Transaction) {
    this._body = txBody;
  }

  canSign(key: BaseKey): boolean {
    return true;
  }

  toBroadcastFormat(): any {
    return proto.Transaction.encode(this._body).finish();
  }

  toJson(): any {
    return {};
  }
}
