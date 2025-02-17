import 'should';

import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';

import { Sgb, Tsgb } from '../../src/index';

const bitgo: TestBitGoAPI = TestBitGo.decorate(BitGoAPI, { env: 'test' });

describe('sgb', function () {
  before(function () {
    bitgo.safeRegister('sgb', Sgb.createInstance);
    bitgo.safeRegister('tsgb', Tsgb.createInstance);
    bitgo.initializeTestVars();
  });

  describe('Basic Coin Info', function () {
    it('should return the right info for sgb', function () {
      const sgb = bitgo.coin('sgb');

      sgb.should.be.an.instanceof(Sgb);
      sgb.getChain().should.equal('sgb');
      sgb.getFamily().should.equal('sgb');
      sgb.getFullName().should.equal('Songbird');
      sgb.getBaseFactor().should.equal(1e18);
      sgb.supportsTss().should.equal(true);
      sgb.allowsAccountConsolidations().should.equal(false);
    });

    it('should return the right info for tsgb', function () {
      const tsgb = bitgo.coin('tsgb');

      tsgb.should.be.an.instanceof(Tsgb);
      tsgb.getChain().should.equal('tsgb');
      tsgb.getFamily().should.equal('sgb');
      tsgb.getFullName().should.equal('Testnet songbird');
      tsgb.getBaseFactor().should.equal(1e18);
      tsgb.supportsTss().should.equal(true);
      tsgb.allowsAccountConsolidations().should.equal(false);
    });
  });
});
