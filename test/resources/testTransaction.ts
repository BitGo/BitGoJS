import { BaseTransaction } from '../../src/coin/baseCoin/baseTransaction';
import { BaseKey } from '../../src/coin/baseCoin/iface';

/**
 * The purpose of this coin is to provide a mock to use for the test runner since there is no easy
 * way to mock abstract methods with sinon.
 */
export class TestTransaction extends BaseTransaction {
  canSign(key: BaseKey): boolean {
    return true;
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  toJson(): any {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  toBroadcastFormat(): any {}
}
