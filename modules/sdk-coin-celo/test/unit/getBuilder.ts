import { TestnetTransactionBuilder, TransactionBuilder } from '../../src';
import { coins } from '@bitgo-beta/statics';

export const getBuilder = (coin: string): TestnetTransactionBuilder | TransactionBuilder => {
  return coin === 'celo' ? new TransactionBuilder(coins.get(coin)) : new TestnetTransactionBuilder(coins.get(coin));
};
