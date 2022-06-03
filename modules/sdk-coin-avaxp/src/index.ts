import * as Utils from './utils';
import { BaseTransactionBuilderFactory } from '@bitgo/sdk-core';
import { BaseCoin as CoinConfig, coins } from '@bitgo/statics';
export { KeyPair } from './keyPair';
export { Transaction } from './transaction';
export { TransactionBuilder } from './transactionBuilder';
export { TransactionBuilderFactory } from './transactionBuilderFactory';
export { Utils };

/**
 * Register a new coin instance with its builder factory
 *
 * @param {string} coinName coin name as it was registered in @bitgo/statics
 * @param {any} builderFactory the builder factory class for that coin
 * @returns {any} the factory instance for the registered coin
 */
export function register<T extends BaseTransactionBuilderFactory>(
  coinName: string,
  builderFactory: { new (_coinConfig: Readonly<CoinConfig>): T }
): T {
  const coinConfig = coins.get(coinName);
  const factory = new builderFactory(coinConfig);
  // coinBuilderMap[coinName] = factory;
  // coinBuilderMap[coinName] = builderFactory; // For now register the constructor function until reimplement getBuilder method
  return factory;
}
