import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';

import { Apecoin, Tapecoin } from '../../src/index';

const bitgo: TestBitGoAPI = TestBitGo.decorate(BitGoAPI, { env: 'test' });

describe('APECHAIN chain', function () {
  before(function () {
    bitgo.safeRegister('apecoin', Apecoin.createInstance);
    bitgo.safeRegister('tapecoin', Tapecoin.createInstance);
    bitgo.initializeTestVars();
  });

  describe('Basic Coin Info', function () {
    it('should return the right info for apecoin', function () {
      const apechain = bitgo.coin('apecoin');

      apechain.should.be.an.instanceof(Apecoin);
      apechain.getChain().should.equal('apecoin');
      apechain.getFamily().should.equal('apecoin');
      apechain.getFullName().should.equal('apecoin');
      apechain.getBaseFactor().should.equal(1e18);
      apechain.supportsTss().should.equal(true);
      apechain.allowsAccountConsolidations().should.equal(false);
    });

    it('should return the right info for toas', function () {
      const tapecoin = bitgo.coin('tapecoin');

      tapecoin.should.be.an.instanceof(Tapecoin);
      tapecoin.getChain().should.equal('tapecoin');
      tapecoin.getFamily().should.equal('tapecoin');
      tapecoin.getFullName().should.equal('Testnet Apecoin');
      tapecoin.getBaseFactor().should.equal(1e18);
      tapecoin.supportsTss().should.equal(true);
      tapecoin.allowsAccountConsolidations().should.equal(false);
    });
  });
});
