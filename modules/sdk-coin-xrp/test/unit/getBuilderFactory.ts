import { coins } from '@bitgo/statics';
import { TransactionBuilderFactory } from '../../src/lib/transactionBuilderFactory';

export const getBuilderFactory = (coin: string): TransactionBuilderFactory => {
  return new TransactionBuilderFactory(coins.get(coin));
};
