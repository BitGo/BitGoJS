import { BaseBuilder } from '@bitgo/sdk-core';
import { coins } from '@bitgo/statics';
import { WrappedBuilder } from './wrappedBuilder';

export const getBuilder = (coinName: string): BaseBuilder => {
  return new WrappedBuilder(coins.get(coinName));
};
