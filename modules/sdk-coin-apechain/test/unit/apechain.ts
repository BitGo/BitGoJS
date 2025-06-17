import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';

import { Apechain, Tapechain } from '../../src/index';

const bitgo: TestBitGoAPI = TestBitGo.decorate(BitGoAPI, { env: 'test' });

describe('APECHAIN chain', function () {
  before(function () {
    bitgo.safeRegister('apechain', Apechain.createInstance);
    bitgo.safeRegister('tapechain', Tapechain.createInstance);
    bitgo.initializeTestVars();
  });

  describe('Basic Coin Info', function () {
    it('should return the right info for apechain', function () {
      const apechain = bitgo.coin('apechain');

      apechain.should.be.an.instanceof(Apechain);
      apechain.getChain().should.equal('apechain');
      apechain.getFamily().should.equal('apechain');
      apechain.getFullName().should.equal('Ape Chain');
      apechain.getBaseFactor().should.equal(1e18);
      apechain.supportsTss().should.equal(true);
      apechain.allowsAccountConsolidations().should.equal(false);
    });

    it('should return the right info for tapechain', function () {
      const tapechain = bitgo.coin('tapechain');

      tapechain.should.be.an.instanceof(Tapechain);
      tapechain.getChain().should.equal('tapechain');
      tapechain.getFamily().should.equal('apechain');
      tapechain.getFullName().should.equal('Testnet Ape Chain');
      tapechain.getBaseFactor().should.equal(1e18);
      tapechain.supportsTss().should.equal(true);
      tapechain.allowsAccountConsolidations().should.equal(false);
    });
  });
});
