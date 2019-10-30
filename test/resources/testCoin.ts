import { BaseCoin } from "../../src/coin/baseCoin";
import BigNumber from "bignumber.js";
import { BaseAddress, BaseKey } from "../../src/coin/baseCoin/iface";
import { BaseTransaction } from "../../src/transaction";

/**
 * The purpose of this coin is a mock to use for the test runner since there is no easy way to mock
 * an interface with sinon without providing the mandatory fields/methods.
 * Use it along with sinon by stubbing its methods.
 */
export class TestCoin implements BaseCoin {
  _parseTransaction: BaseTransaction;
  _buildTransaction: BaseTransaction;
  _extendTransaction: BaseTransaction;
  _sign: BaseTransaction;

  public displayName(): string {
    return "Test";
  }

  public validateAddress(address: BaseAddress, addressFormat?: string) { }

  public validateValue(value: BigNumber): boolean {
    return true;
  }

  public validateKey(key: BaseKey) { }

  public parseTransaction(rawTransaction: any): BaseTransaction {
    return this._parseTransaction;
  }

  public buildTransaction(transaction: BaseTransaction): BaseTransaction {
    return this._buildTransaction;
  }

  public extendTransaction(transaction: BaseTransaction, extensionMs: number): BaseTransaction {
    return this._extendTransaction;
  }

  public sign(privateKey: BaseKey, transaction: BaseTransaction): BaseTransaction {
    return this._sign;
  }
}
