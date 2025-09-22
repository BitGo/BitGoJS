import { BaseBuilder } from '@bitgo-beta/sdk-core';
import { coins } from '@bitgo-beta/statics';
import { TransactionBuilder } from '../src';

export function getBuilder(coinName: string): BaseBuilder {
  return new TransactionBuilder(coins.get(coinName));
}
