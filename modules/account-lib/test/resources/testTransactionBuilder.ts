import BigNumber from 'bignumber.js';
import { BaseCoin as CoinConfig, coins } from '@bitgo/statics';
import { BaseAddress, BaseKey, BaseTransaction, BaseTransactionBuilder } from '@bitgo/sdk-core';
import { TestTransaction } from './testTransaction';

/**
 * The purpose of this coin is a mock to use for the test runner since there is no easy way to mock
 * an interface with sinon without providing the mandatory fields/methods.
 * Use it along with sinon by stubbing its methods.
 */
export class TestTransactionBuilder extends BaseTransactionBuilder {
  _transaction: TestTransaction;
  _coinConfig: Readonly<CoinConfig>;

  constructor() {
    super(coins.get('ttrx'));
    this._coinConfig = coins.get('ttrx');
  }

  public displayName(): string {
    return 'Test';
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public validateAddress(address: BaseAddress, addressFormat?: string) {}

  public validateValue(value: BigNumber): boolean {
    return true;
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public validateKey(key: BaseKey) {}

  public fromImplementation(rawTransaction: any) {
    return rawTransaction;
  }

  protected signImplementation(privateKey: BaseKey) {
    return this._transaction;
  }

  public async buildImplementation(): Promise<BaseTransaction> {
    return Promise.resolve(this._transaction);
  }

  protected get transaction(): BaseTransaction {
    return this._transaction;
  }

  protected set transaction(transaction: BaseTransaction) {
    this._transaction = transaction;
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  validateRawTransaction(rawTransaction: any) {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  validateTransaction(transaction: BaseTransaction) {}
}
