import { BaseTransaction } from '../baseCoin';
import { BaseKey } from '../baseCoin/iface';
import { NotImplementedError } from '../baseCoin/errors';

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
