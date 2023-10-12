import 'should';

import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';

import { Arbeth, Tarbeth } from '../../src/index';

const bitgo: TestBitGoAPI = TestBitGo.decorate(BitGoAPI, { env: 'test' });

describe('Arbitrum', function () {
  before(function () {
    bitgo.safeRegister('arbeth', Arbeth.createInstance);
    bitgo.safeRegister('tarbeth', Tarbeth.createInstance);
    bitgo.initializeTestVars();
  });

  describe('Basic Coin Info', function () {
    it('should return the right info for arbeth', function () {
      const arbeth = bitgo.coin('arbeth');

      arbeth.should.be.an.instanceof(Arbeth);
      arbeth.getChain().should.equal('arbeth');
      arbeth.getFamily().should.equal('arbeth');
      arbeth.getFullName().should.equal('Arbitrum Ethereum');
      arbeth.getBaseFactor().should.equal(1e18);
      arbeth.supportsTss().should.equal(true);
    });

    it('should return the right info for tarbeth', function () {
      const tarbeth = bitgo.coin('tarbeth');

      tarbeth.should.be.an.instanceof(Tarbeth);
      tarbeth.getChain().should.equal('tarbeth');
      tarbeth.getFamily().should.equal('arbeth');
      tarbeth.getFullName().should.equal('Testnet Arbitrum Ethereum');
      tarbeth.getBaseFactor().should.equal(1e18);
      tarbeth.supportsTss().should.equal(true);
    });
  });
});
