import { getBuilder } from '../../getBuilder';
import { TransactionBuilder } from '../../../src';
import * as testData from '../../resources';
import { runSendTests } from '@bitgo/abstract-eth';

describe('Opeth send transaction tests', () => {
  const coin = testData.COIN;
  it('should run send transaction tests for opeth', async () => {
    const txBuilder = getBuilder(coin) as TransactionBuilder;
    runSendTests('Opeth', txBuilder, getBuilder, testData);
  });
});
