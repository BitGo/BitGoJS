import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';

import { Tstt } from '../../src';

const bitgo: TestBitGoAPI = TestBitGo.decorate(BitGoAPI, { env: 'test' });

describe('stt', function () {
  before(function () {
    bitgo.safeRegister('tstt', Tstt.createInstance);
    bitgo.initializeTestVars();
  });

  describe('Basic Coin Info', function () {
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
