import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';

import { Tsoneium, Soneium } from '../../src';

const bitgo: TestBitGoAPI = TestBitGo.decorate(BitGoAPI, { env: 'test' });

describe('soneium', function () {
  before(function () {
    bitgo.safeRegister('soneium', Soneium.createInstance);
    bitgo.safeRegister('tsoneium', Tsoneium.createInstance);
    bitgo.initializeTestVars();
  });

  describe('Basic Coin Info', function () {
    it('should return the right info for soneium', function () {
      const soneium = bitgo.coin('soneium');
      soneium.should.be.an.instanceof(Soneium);
      soneium.getChain().should.equal('soneium');
      soneium.getFamily().should.equal('soneium');
      soneium.getFullName().should.equal('Soneium');
      soneium.getBaseFactor().should.equal(1e18);
      soneium.supportsTss().should.equal(true);
      soneium.allowsAccountConsolidations().should.equal(false);
    });
    it('should return the right info for tsoneium', function () {
      const tsoneium = bitgo.coin('tsoneium');

      tsoneium.should.be.an.instanceof(Tsoneium);
      tsoneium.getChain().should.equal('tsoneium');
      tsoneium.getFamily().should.equal('soneium');
      tsoneium.getFullName().should.equal('Soneium Testnet');
      tsoneium.getBaseFactor().should.equal(1e18);
      tsoneium.supportsTss().should.equal(true);
      tsoneium.allowsAccountConsolidations().should.equal(false);
    });
  });
});
