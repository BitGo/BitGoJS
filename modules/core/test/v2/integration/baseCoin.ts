//
// Tests for basecoin
//

import * as Promise from 'bluebird';
const co = Promise.coroutine;
import * as _ from 'lodash';

import 'should';

const TestV2BitGo = require('../../lib/test_bitgo');
const bitgo = new TestV2BitGo({ env: 'test' });
bitgo.initializeTestVars();

describe('V2 Base Coin:', function() {

  describe('fee estimate call', function() {

    before(() => require('nock').restore());

    _.forEach(['tbtc', 'trmg', 'tltc', 'tbch'], function(coin) {
      const basecoin = bitgo.coin(coin);

      it('should fetch fee info for utxo coins', co(function *() {
        const feeInfo = yield basecoin.feeEstimate();
        feeInfo.should.have.property('feePerKb');
        feeInfo.should.have.property('numBlocks');
      }));
    });

    _.forEach(['teth', 'txrp'], function(coin) {
      const basecoin = bitgo.coin(coin);

      it('should fetch fee info for account coin', co(function *() {
        const feeInfo = yield basecoin.feeEstimate();
        feeInfo.should.have.property('feeEstimate');
      }));
    });
  });
});
