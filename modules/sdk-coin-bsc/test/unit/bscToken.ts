import 'should';
import { BscToken } from '../../src';
import { runTokenTestInitialization } from '@bitgo/abstract-eth';
import * as testData from '../resources/bsc';

describe('Bsc Token Tests', () => {
  const coinName = 'Bsc';
  const tokenNetworkName = 'Test Binance USD Token';

  describe('Bsc tokens in test env:', () => {
    it('Bsc run token tests', () => {
      runTokenTestInitialization(BscToken, coinName, tokenNetworkName, testData);
    });
  });
});
