import { BaseCoin as CoinConfig } from '@bitgo/statics';
import { BaseTransaction } from '../baseCoin';
import { BaseKey } from '../baseCoin/iface';
import { NotImplementedError } from '../baseCoin/errors';

export class Transaction extends BaseTransaction {
  constructor(coinConfig: Readonly<CoinConfig>) {
    super(coinConfig);
  }

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
