import { BaseKey, BaseTransaction } from '@bitgo/sdk-core';

export class Transaction extends BaseTransaction {
  canSign(key: BaseKey): boolean {
    throw new Error('Method not implemented.');
  }
  toJson() {
    throw new Error('Method not implemented.');
  }
  toBroadcastFormat() {
    throw new Error('Method not implemented.');
  }
}
