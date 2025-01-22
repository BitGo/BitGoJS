import 'should';

import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';

import { Xdc, Txdc } from '../../src/index';

const bitgo: TestBitGoAPI = TestBitGo.decorate(BitGoAPI, { env: 'test' });

describe('xdc', function () {
  before(function () {
    bitgo.safeRegister('xdc', Xdc.createInstance);
    bitgo.safeRegister('txdc', Txdc.createInstance);
    bitgo.initializeTestVars();
  });

  describe('Basic Coin Info', function () {
    it('should return the right info for xdc', function () {
      const xdc = bitgo.coin('xdc');

      xdc.should.be.an.instanceof(Xdc);
      xdc.getChain().should.equal('xdc');
      xdc.getFamily().should.equal('xdc');
      xdc.getFullName().should.equal('XDC');
      xdc.getBaseFactor().should.equal(1e18);
      xdc.supportsTss().should.equal(true);
      xdc.allowsAccountConsolidations().should.equal(false);
    });

    it('should return the right info for txdc', function () {
      const txdc = bitgo.coin('txdc');

      txdc.should.be.an.instanceof(Txdc);
      txdc.getChain().should.equal('txdc');
      txdc.getFamily().should.equal('xdc');
      txdc.getFullName().should.equal('Testnet XDC chain');
      txdc.getBaseFactor().should.equal(1e18);
      txdc.supportsTss().should.equal(true);
      txdc.allowsAccountConsolidations().should.equal(false);
    });
  });
});
