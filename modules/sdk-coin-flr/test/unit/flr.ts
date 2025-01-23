import 'should';

import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';

import { Flr, Tflr } from '../../src/index';

const bitgo: TestBitGoAPI = TestBitGo.decorate(BitGoAPI, { env: 'test' });

describe('flr', function () {
  before(function () {
    bitgo.safeRegister('flr', Flr.createInstance);
    bitgo.safeRegister('tflr', Tflr.createInstance);
    bitgo.initializeTestVars();
  });

  describe('Basic Coin Info', function () {
    it('should return the right info for flr', function () {
      const flr = bitgo.coin('flr');

      flr.should.be.an.instanceof(Flr);
      flr.getChain().should.equal('flr');
      flr.getFamily().should.equal('flr');
      flr.getFullName().should.equal('flare');
      flr.getBaseFactor().should.equal(1e18);
      flr.supportsTss().should.equal(true);
      flr.allowsAccountConsolidations().should.equal(false);
    });

    it('should return the right info for tflr', function () {
      const tflr = bitgo.coin('tflr');

      tflr.should.be.an.instanceof(Tflr);
      tflr.getChain().should.equal('tflr');
      tflr.getFamily().should.equal('flr');
      tflr.getFullName().should.equal('Testnet flare chain');
      tflr.getBaseFactor().should.equal(1e18);
      tflr.supportsTss().should.equal(true);
      tflr.allowsAccountConsolidations().should.equal(false);
    });
  });
});
