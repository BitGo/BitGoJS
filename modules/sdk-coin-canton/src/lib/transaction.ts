import { BaseKey, BaseTransaction } from '@bitgo/sdk-core';
import { TxData } from './iface';

export class Transaction extends BaseTransaction {
  canSign(key: BaseKey): boolean {
    return false;
  }

  toBroadcastFormat(): string {
    throw new Error('Method not implemented.');
  }

  toJson(): TxData {
    throw new Error('Method not implemented.');
  }
}
