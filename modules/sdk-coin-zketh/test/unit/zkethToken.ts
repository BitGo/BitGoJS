import 'should';
import { ZkethToken } from '../../src';
import * as testData from '../resources';
import { runTokenTestInitialization } from '@bitgo/abstract-eth';

describe('Zketh Token Tests', () => {
  const coinName = 'Zketh';
  const tokenNetworkName = 'zkSync Test LINK';

  describe('Zketh tokens in test env:', () => {
    it('Zketh run token tests', () => {
      runTokenTestInitialization(ZkethToken, coinName, tokenNetworkName, testData);
    });
  });
});
