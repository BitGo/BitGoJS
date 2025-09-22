import EthereumCommon from '@ethereumjs/common';
import { BaseBuilder } from '@bitgo-beta/sdk-core';
import { coins } from '@bitgo-beta/statics';
import { EthLikeTransactionBuilder } from '../src';

export function getBuilder(coinName: string, common: EthereumCommon): BaseBuilder {
  return new EthLikeTransactionBuilder(coins.get(coinName), common);
}
