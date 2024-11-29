//
// Tests for basecoin
//
import 'should';
import { coroutine as co } from 'bluebird';
import { restore } from 'nock';

import { TestBitGo } from '../../lib/test_bitgo';
const bitgo = new TestBitGo({ env: 'test' });
bitgo.initializeTestVars();

describe('V2 Base Coin:', function () {
  describe('fee estimate call', function () {
    before(() => restore());

    function testAccountFeeEstimate(coin) {
      return co(function* () {
        const feeInfo = yield coin.feeEstimate();
        feeInfo.should.have.property('feeEstimate');
        return feeInfo;
      }).call(this);
    }

    function testUtxoFeeEstimate(coin) {
      return co(function* () {
        const feeInfo = yield coin.feeEstimate();
        feeInfo.should.have.property('numBlocks');
        feeInfo.should.have.property('feePerKb');
        return feeInfo;
      }).call(this);
    }

    it(
      'should fetch fee info for tbtc',
      co(function* () {
        const coin = bitgo.coin('tbtc');
        const feeInfo = yield testUtxoFeeEstimate(coin);
        feeInfo.should.have.properties('feeByBlockTarget', 'confidence', 'multiplier', 'cpfpFeePerKb');
      })
    );

    it(
      'should fetch fee info for tltc',
      co(function* () {
        const coin = bitgo.coin('tltc');
        yield testUtxoFeeEstimate(coin);
      })
    );

    it(
      'should fetch fee info for tbch',
      co(function* () {
        const coin = bitgo.coin('tbch');
        yield testUtxoFeeEstimate(coin);
      })
    );

    it(
      'should fetch fee info for teth coin',
      co(function* () {
        const coin = bitgo.coin('teth');
        const feeEstimate = yield testAccountFeeEstimate(coin);
        feeEstimate.should.have.properties('minGasPrice', 'minGasLimit', 'maxGasLimit');
      })
    );

    it(
      'should fetch fee info for txrp coin',
      co(function* () {
        const coin = bitgo.coin('txrp');
        yield testAccountFeeEstimate(coin);
      })
    );
  });
});
