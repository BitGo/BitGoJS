import 'should';

import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';

import { Bnb, Tbnb } from '../../src/index';

const bitgo: TestBitGoAPI = TestBitGo.decorate(BitGoAPI, { env: 'test' });

describe('BNB Smart Chain', function () {
  before(function () {
    bitgo.safeRegister('bnb', Bnb.createInstance);
    bitgo.safeRegister('tbnb', Tbnb.createInstance);
    bitgo.initializeTestVars();
  });

  describe('Basic Coin Info', function () {
    it('should return the right info for bnb', function () {
      const bnb = bitgo.coin('bnb');

      bnb.should.be.an.instanceof(Bnb);
      bnb.getChain().should.equal('bnb');
      bnb.getFamily().should.equal('bnb');
      bnb.getFullName().should.equal('BNB Smart Chain');
      bnb.getBaseFactor().should.equal(1e18);
      bnb.supportsTss().should.equal(true);
    });

    it('should return the right info for tbnb', function () {
      const tbnb = bitgo.coin('tbnb');

      tbnb.should.be.an.instanceof(Tbnb);
      tbnb.getChain().should.equal('tbnb');
      tbnb.getFamily().should.equal('bnb');
      tbnb.getFullName().should.equal('Testnet BNB Smart Chain');
      tbnb.getBaseFactor().should.equal(1e18);
      tbnb.supportsTss().should.equal(true);
      tbnb.allowsAccountConsolidations().should.equal(true);
    });
  });
});
