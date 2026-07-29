import { BaseBuilder } from '@bitgo/sdk-core';
import { coins } from '@bitgo/statics';
import { TransactionBuilder } from '../src';

export function getBuilder(coinName: string): BaseBuilder {
  return new TransactionBuilder(coins.get(coinName));
}
