import EthereumCommon from '@ethereumjs/common';
import { BaseBuilder } from '@bitgo/sdk-core';
import { coins } from '@bitgo/statics';
import { EthLikeTransactionBuilder } from '../src';

export function getBuilder(coinName: string, common: EthereumCommon): BaseBuilder {
  return new EthLikeTransactionBuilder(coins.get(coinName), common);
}
