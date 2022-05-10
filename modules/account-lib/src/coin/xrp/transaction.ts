import { BaseKey, BaseTransaction, NotImplementedError } from '@bitgo/sdk-core';

export class Transaction extends BaseTransaction {
  /** @inheritdoc */
  canSign(key: BaseKey): boolean {
    throw new NotImplementedError('canSign not implemented');
  }

  /** @inheritdoc */
  toBroadcastFormat(): string {
    throw new NotImplementedError('toBroadcastFormat not implemented');
  }

  /** @inheritdoc */
  toJson(): any {
    throw new NotImplementedError('toJson not implemented');
  }
}
