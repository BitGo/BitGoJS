import { TransactionBuilder } from '../../src';
import { coins } from '@bitgo-beta/statics';

export const getBuilder = (coin: string): TransactionBuilder => {
  return new TransactionBuilder(coins.get(coin));
};
