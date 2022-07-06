import { BaseTransaction, BaseKey, NotImplementedError } from '@bitgo/sdk-core';

export class Transaction extends BaseTransaction {
  /** @inheritdoc */
  canSign(key: BaseKey): boolean {
    throw new NotImplementedError('canSign not implemented');
  }

  toBroadcastFormat(): string {
    throw new NotImplementedError('toBroadcastFormat not implemented');
  }

  /** @inheritdoc */
  toJson(): any {
    throw new Error('Method not implemented.');
  }
}
