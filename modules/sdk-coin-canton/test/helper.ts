import { coins } from '@bitgo/statics';
import { TransactionBuilderFactory } from '../src';

export function getCantonBuilderFactory(coinName: string): TransactionBuilderFactory {
  return new TransactionBuilderFactory(coins.get(coinName));
}
