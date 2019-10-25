import {BaseTransaction} from "../../src/transaction";
import {BaseKey} from "../../src/coin/baseCoin/iface";

/**
 * The purpose of this coin is to provide a mock to use for the test runner since there is no easy
 * way to mock abstract methods with sinon.
 */
export class TestTransaction extends BaseTransaction {
  canSign(key: BaseKey): boolean {
    return true;
  }

  toJson(): any { }
}
