import { BaseBuilder } from '@bitgo-beta/sdk-core';
import { coins } from '@bitgo-beta/statics';
import { WrappedBuilder } from './wrappedBuilder';

export const getBuilder = (coinName: string): BaseBuilder => {
  return new WrappedBuilder(coins.get(coinName));
};
