import { TransactionBuilderFactory } from '../../src';
import { coins } from '@bitgo/statics';

export const getBuilderFactory = (coin: string): TransactionBuilderFactory => {
  return new TransactionBuilderFactory(coins.get(coin));
};
