import { coins } from '@bitgo-beta/statics';
import { TransactionBuilderFactory } from './lib';

export const getBuilder = (coinName: string): TransactionBuilderFactory => {
  return new TransactionBuilderFactory(coins.get(coinName));
};
