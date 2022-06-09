//
// Tests for enterprises
//

import * as nock from 'nock';
import { common, Enterprise } from '@bitgo/sdk-core';

import { TestBitGo } from '@bitgo/sdk-test';
import { Tbtc } from '../../../src/v2/coins/tbtc';

describe('Enterprise:', function () {
  let bitgo;
  let enterprise;
  let baseCoin;
  let bgUrl;

  before(function () {
    bitgo = new TestBitGo({ env: 'test' });
    bitgo.initializeTestVars();
    bitgo.safeRegister('tbtc', Tbtc.createInstance);
    baseCoin = bitgo.coin('tbtc');
    enterprise = new Enterprise(bitgo, baseCoin, { id: '593f1ece99d37c23080a557283edcc89', name: 'Test Enterprise' });
    bgUrl = common.Environments[bitgo.getEnv()].uri;
  });

  describe('Transaction data', function () {
    it('should search for pending transaction correctly', async function () {
      const params = { enterpriseId: enterprise.id };
      const scope =
        nock(bgUrl)
          .get('/api/v2/tbtc/tx/pending/first')
          .query(params)
          .reply(200);
      await enterprise.getFirstPendingTransaction().should.be.resolved();
      scope.isDone().should.be.True();
    });
  });
});
