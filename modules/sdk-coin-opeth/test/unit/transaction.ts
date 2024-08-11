import { coins } from '@bitgo/statics';
import { getCommon } from '../../src/lib/utils';
import * as testData from '../resources';
import { runTransactionTests } from '@bitgo/abstract-eth';

describe('Opeth Run Transaction Tests', () => {
  const coin = testData.COIN;
  const coinConfig = coins.get(coin);
  const common = getCommon(coinConfig.network.type);
  it('run transaction tests', () => {
    runTransactionTests('Opeth', testData, common);
  });
});
