//
// Tests for enterprises
//

import * as nock from 'nock';
import * as Promise from 'bluebird';
import * as should from 'should';

import { Enterprise, EnterpriseData } from '../../../src/v2/enterprise';
import * as common from '../../../src/common';
import { TestBitGo } from '../../lib/test_bitgo';

const co = Promise.coroutine;

describe('Enterprise:', function() {
  let bitgo;
  let enterprise;
  let baseCoin;
  let bgUrl;

  const enterpriseData: EnterpriseData = {
    id: '593f1ece99d37c23080a557283edcc89',
    name: 'Test Enterprise',
    ethFeeAddress: '0x123',
  };

  before(co(function *() {
    bitgo = new TestBitGo({ env: 'test' });
    bitgo.initializeTestVars();
    baseCoin = bitgo.coin('tbtc');
    enterprise = new Enterprise(bitgo, baseCoin, enterpriseData);
    bgUrl = common.Environments[bitgo.getEnv()].uri;
  }));

  describe('Transaction data', function() {
    it('should search for pending transaction correctly', co(function *() {
      const params = { enterpriseId: enterprise.id };
      const scope = nock(bgUrl)
        .get('/api/v2/tbtc/tx/pending/first')
        .query(params)
        .reply(200);
      yield enterprise.getFirstPendingTransaction().should.be.rejected();
      scope.done();
    }));
  });

  describe('Fee Address', function() {
    it('should return the eth address from enterprise data as the fee address for an enterprise', co(function*() {
      const feeAddress = enterprise.getFeeAddress();
      feeAddress.should.eql(enterpriseData.ethFeeAddress);
    }));
  });
});
