import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';

import { Tmon, Mon } from '../../src';

const bitgo: TestBitGoAPI = TestBitGo.decorate(BitGoAPI, { env: 'test' });

describe('mon', function () {
  before(function () {
    bitgo.safeRegister('mon', Mon.createInstance);
    bitgo.safeRegister('tmon', Tmon.createInstance);
    bitgo.initializeTestVars();
  });

  //currently MON is only live for only testnet
  describe('Basic Coin Info', function () {
    it('should return the right info for mon', function () {
      const mon = bitgo.coin('mon');
      mon.should.be.an.instanceof(Mon);
      mon.getChain().should.equal('mon');
      mon.getFamily().should.equal('mon');
      mon.getFullName().should.equal('Monad');
      mon.getBaseFactor().should.equal(1e18);
      mon.supportsTss().should.equal(true);
      mon.allowsAccountConsolidations().should.equal(false);
    });
    it('should return the right info for tmon', function () {
      const tmon = bitgo.coin('tmon');

      tmon.should.be.an.instanceof(Tmon);
      tmon.getChain().should.equal('tmon');
      tmon.getFamily().should.equal('mon');
      tmon.getFullName().should.equal('Testnet Monad');
      tmon.getBaseFactor().should.equal(1e18);
      tmon.supportsTss().should.equal(true);
      tmon.allowsAccountConsolidations().should.equal(false);
    });
  });
});
