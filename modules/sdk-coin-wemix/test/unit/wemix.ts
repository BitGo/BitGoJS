import 'should';

import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';

import { Wemix, Twemix } from '../../src/index';

const bitgo: TestBitGoAPI = TestBitGo.decorate(BitGoAPI, { env: 'test' });

describe('wemix', function () {
  before(function () {
    bitgo.safeRegister('wemix', Wemix.createInstance);
    bitgo.safeRegister('twemix', Twemix.createInstance);
    bitgo.initializeTestVars();
  });

  describe('Basic Coin Info', function () {
    it('should return the right info for wemix', function () {
      const wemix = bitgo.coin('wemix');

      wemix.should.be.an.instanceof(Wemix);
      wemix.getChain().should.equal('wemix');
      wemix.getFamily().should.equal('wemix');
      wemix.getFullName().should.equal('Wemix');
      wemix.getBaseFactor().should.equal(1e18);
      wemix.supportsTss().should.equal(true);
      wemix.allowsAccountConsolidations().should.equal(false);
    });

    it('should return the right info for twemix', function () {
      const twemix = bitgo.coin('twemix');

      twemix.should.be.an.instanceof(Twemix);
      twemix.getChain().should.equal('twemix');
      twemix.getFamily().should.equal('wemix');
      twemix.getFullName().should.equal('Testnet wemix');
      twemix.getBaseFactor().should.equal(1e18);
      twemix.supportsTss().should.equal(true);
      twemix.allowsAccountConsolidations().should.equal(false);
    });
  });
});
