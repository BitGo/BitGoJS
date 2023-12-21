import 'should';

import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';

import { Zketh, Tzketh } from '../../src/index';

const bitgo: TestBitGoAPI = TestBitGo.decorate(BitGoAPI, { env: 'test' });

describe('zkSync', function () {
  before(function () {
    bitgo.safeRegister('zketh', Zketh.createInstance);
    bitgo.safeRegister('tzketh', Tzketh.createInstance);
    bitgo.initializeTestVars();
  });

  describe('Basic Coin Info', function () {
    it('should return the right info for zketh', function () {
      const zketh = bitgo.coin('zketh');

      zketh.should.be.an.instanceof(Zketh);
      zketh.getChain().should.equal('zketh');
      zketh.getFamily().should.equal('zketh');
      zketh.getFullName().should.equal('zkSync Ethereum');
      zketh.getBaseFactor().should.equal(1e18);
      zketh.supportsTss().should.equal(false);
    });

    it('should return the right info for tzketh', function () {
      const tzketh = bitgo.coin('tzketh');

      tzketh.should.be.an.instanceof(Tzketh);
      tzketh.getChain().should.equal('tzketh');
      tzketh.getFamily().should.equal('zketh');
      tzketh.getFullName().should.equal('Testnet zkSync Ethereum');
      tzketh.getBaseFactor().should.equal(1e18);
      tzketh.supportsTss().should.equal(false);
    });
  });
});
