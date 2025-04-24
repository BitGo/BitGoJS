import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';

import { Tstt, Stt } from '../../src';

const bitgo: TestBitGoAPI = TestBitGo.decorate(BitGoAPI, { env: 'test' });

describe('stt', function () {
  before(function () {
    bitgo.safeRegister('stt', Stt.createInstance);
    bitgo.safeRegister('tstt', Tstt.createInstance);
    bitgo.initializeTestVars();
  });

  describe('Basic Coin Info', function () {
    it('should return the right info for stt', function () {
      const stt = bitgo.coin('stt');
      stt.should.be.an.instanceof(Stt);
      stt.getChain().should.equal('stt');
      stt.getFamily().should.equal('stt');
      stt.getFullName().should.equal('Somnia');
      stt.getBaseFactor().should.equal(1e18);
      stt.supportsTss().should.equal(true);
      stt.allowsAccountConsolidations().should.equal(false);
    });
    it('should return the right info for tstt', function () {
      const tstt = bitgo.coin('tstt');

      tstt.should.be.an.instanceof(Tstt);
      tstt.getChain().should.equal('tstt');
      tstt.getFamily().should.equal('stt');
      tstt.getFullName().should.equal('Somnia Testnet');
      tstt.getBaseFactor().should.equal(1e18);
      tstt.supportsTss().should.equal(true);
      tstt.allowsAccountConsolidations().should.equal(false);
    });
  });
});
