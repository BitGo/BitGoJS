//
// Tests for basecoin
//

const Promise = require('bluebird');
const co = Promise.coroutine;
const _ = require('lodash');

require('should');

const TestV2BitGo = require('../../lib/test_bitgo');
const bitgo = new TestV2BitGo({ env: 'test' });
bitgo.initializeTestVars();

describe('V2 Base Coin:', function() {

  describe('fee estimate call', function() {

    _.forEach(['tbtc', 'trmg', 'tltc', 'tbch', 'tbtg'], function(coin) {
      const basecoin = bitgo.coin(coin);

      it('should fetch fee info for utxo coins', co(function *() {
        const feeInfo = yield basecoin.feeEstimate();
        feeInfo.should.have.property('feePerKb');
        feeInfo.should.have.property('numBlocks');
      }));
    });

    _.forEach(['teth', 'txrp'], function(coin) {
      const basecoin = bitgo.coin(coin);

      it('should fail to to fetch fee info for account coin', co(function *() {
        try {
          yield basecoin.feeEstimate();
          throw new Error();
        } catch (err) {
          err.message.should.equal('cannot get fee estimate data for ' + coin);
        }
      }));
    });
  });
});
