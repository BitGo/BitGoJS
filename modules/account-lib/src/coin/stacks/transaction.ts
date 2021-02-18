import { BaseTransaction } from '../baseCoin';
import { BaseKey } from '../baseCoin/iface';

export class Transaction extends BaseTransaction {
  /** @inheritdoc */
  canSign(key: BaseKey): boolean {
    throw new Error('Method not implemented.');
  }

  /** @inheritdoc */
  toJson() {
    throw new Error('Method not implemented.');
  }
  toBroadcastFormat() {
    throw new Error('Method not implemented.');
  }
}
