import 'should';

import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';

import { Bsc, Tbsc } from '../../src/index';

const bitgo: TestBitGoAPI = TestBitGo.decorate(BitGoAPI, { env: 'test' });

describe('Binance Smart Chain', function () {
  before(function () {
    bitgo.safeRegister('bsc', Bsc.createInstance);
    bitgo.safeRegister('tbsc', Tbsc.createInstance);
    bitgo.initializeTestVars();
  });

  describe('Basic Coin Info', function () {
    it('should return the right info for bsc', function () {
      const bsc = bitgo.coin('bsc');

      bsc.should.be.an.instanceof(Bsc);
      bsc.getChain().should.equal('bsc');
      bsc.getFamily().should.equal('bsc');
      bsc.getFullName().should.equal('Binance Smart Chain');
      bsc.getBaseFactor().should.equal(1e18);
      bsc.supportsTss().should.equal(true);
      bsc.allowsAccountConsolidations().should.equal(true);
    });

    it('should return the right info for tbsc', function () {
      const tbsc = bitgo.coin('tbsc');

      tbsc.should.be.an.instanceof(Tbsc);
      tbsc.getChain().should.equal('tbsc');
      tbsc.getFamily().should.equal('bsc');
      tbsc.getFullName().should.equal('Testnet Binance Smart Chain');
      tbsc.getBaseFactor().should.equal(1e18);
      tbsc.supportsTss().should.equal(true);
      tbsc.allowsAccountConsolidations().should.equal(true);
    });
  });
});
