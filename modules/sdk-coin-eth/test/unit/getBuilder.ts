import { TransactionBuilder } from '../../src';
import { coins } from '@bitgo/statics';

export const getBuilder = (coin: string): TransactionBuilder => {
  return new TransactionBuilder(coins.get(coin));
};
