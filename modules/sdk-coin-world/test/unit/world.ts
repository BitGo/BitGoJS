import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';

import { Twld, Wld } from '../../src';

const bitgo: TestBitGoAPI = TestBitGo.decorate(BitGoAPI, { env: 'test' });

describe('wld', function () {
  before(function () {
    bitgo.safeRegister('wld', Wld.createInstance);
    bitgo.safeRegister('twld', Twld.createInstance);
    bitgo.initializeTestVars();
  });

  //currently WORLD is only live for only testnet
  describe('Basic Coin Info', function () {
    it('should return the right info for wld', function () {
      const wld = bitgo.coin('wld');
      wld.should.be.an.instanceof(Wld);
      wld.getChain().should.equal('wld');
      wld.getFamily().should.equal('wld');
      wld.getFullName().should.equal('Worldchain');
      wld.getBaseFactor().should.equal(1e18);
      wld.supportsTss().should.equal(true);
      wld.allowsAccountConsolidations().should.equal(false);
    });
    it('should return the right info for twld', function () {
      const twld = bitgo.coin('twld');

      twld.should.be.an.instanceof(Twld);
      twld.getChain().should.equal('twld');
      twld.getFamily().should.equal('wld');
      twld.getFullName().should.equal('Worldchain Testnet');
      twld.getBaseFactor().should.equal(1e18);
      twld.supportsTss().should.equal(true);
      twld.allowsAccountConsolidations().should.equal(false);
    });
  });
});
