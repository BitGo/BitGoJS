import { TestnetTransactionBuilder, TransactionBuilder } from '../../src';
import { coins } from '@bitgo/statics';

export const getBuilder = (coin: string): TestnetTransactionBuilder | TransactionBuilder => {
  return coin === 'celo' ? new TransactionBuilder(coins.get(coin)) : new TestnetTransactionBuilder(coins.get(coin));
};
