//
// Tests for enterprises
//

const nock = require('nock');
import * as Promise from 'bluebird';
const co = Promise.coroutine;
import { Enterprise } from '../../../src/v2/enterprise';
const common = require('../../../src/common');

const TestV2BitGo = require('../../lib/test_bitgo');

describe('Enterprise:', function() {
  let bitgo;
  let enterprise;
  let baseCoin;
  let bgUrl;

  before(co(function *() {
    bitgo = new TestV2BitGo({ env: 'test' });
    bitgo.initializeTestVars();
    baseCoin = bitgo.coin('tbtc');
    enterprise = new Enterprise(bitgo, baseCoin, { id: '593f1ece99d37c23080a557283edcc89', name: 'Test Enterprise' });
    bgUrl = common.Environments[bitgo.getEnv()].uri;
  }));

  describe('Transaction data', function() {
    it('should search for pending transaction correctly', co(function *() {
      const params = { enterpriseId: enterprise.id };
      const scope =
        nock(bgUrl)
        .get('/api/v2/tbtc/tx/pending/first')
        .query(params)
        .reply(200);
      try {
        yield enterprise.getFirstPendingTransaction();
        throw '';
      } catch (error) {
        // test is successful if nock is consumed, HMAC errors expected
      }
      scope.isDone().should.be.True();
    }));
  });
});
