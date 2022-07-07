import { WrappedBuilder } from '../../src';
import { coins } from '@bitgo/statics';

export const getBuilder = (coin: string): WrappedBuilder => {
  return new WrappedBuilder(coins.get(coin));
};
