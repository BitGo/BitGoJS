//
// Tests for basecoin
//
import 'should';
import { restore } from 'nock';

import { TestBitGo } from '../../lib/test_bitgo';
const bitgo = new TestBitGo({ env: 'test' });
bitgo.initializeTestVars();

describe('V2 Base Coin:', function () {
  describe('fee estimate call', function () {
    before(() => restore());

    const testAccountFeeEstimate = (coin) => {
      return async function () {
        const feeInfo = await coin.feeEstimate();
        feeInfo.should.have.property('feeEstimate');
        return feeInfo;
      }.call(this);
    };

    const testUtxoFeeEstimate = (coin) => {
      return async function () {
        const feeInfo = await coin.feeEstimate();
        feeInfo.should.have.property('numBlocks');
        feeInfo.should.have.property('feePerKb');
        return feeInfo;
      }.call(this);
    };

    it('should fetch fee info for tbtc', async function () {
      const coin = bitgo.coin('tbtc');
      const feeInfo = await testUtxoFeeEstimate(coin);
      feeInfo.should.have.properties('feeByBlockTarget', 'confidence', 'multiplier', 'cpfpFeePerKb');
    });

    it('should fetch fee info for tltc', async function () {
      const coin = bitgo.coin('tltc');
      await testUtxoFeeEstimate(coin);
    });

    it('should fetch fee info for tbch', async function () {
      const coin = bitgo.coin('tbch');
      await testUtxoFeeEstimate(coin);
    });

    it('should fetch fee info for teth coin', async function () {
      const coin = bitgo.coin('teth');
      const feeEstimate = await testAccountFeeEstimate(coin);
      feeEstimate.should.have.properties('minGasPrice', 'minGasLimit', 'maxGasLimit');
    });

    it('should fetch fee info for txrp coin', async function () {
      const coin = bitgo.coin('txrp');
      await testAccountFeeEstimate(coin);
    });
  });
});
