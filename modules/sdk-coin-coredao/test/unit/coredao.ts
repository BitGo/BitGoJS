import 'should';

import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';

import { Coredao, Tcoredao } from '../../src/index';

const bitgo: TestBitGoAPI = TestBitGo.decorate(BitGoAPI, { env: 'test' });

describe('Coredao', function () {
  before(function () {
    bitgo.safeRegister('coredao', Coredao.createInstance);
    bitgo.safeRegister('tcoredao', Tcoredao.createInstance);
    bitgo.initializeTestVars();
  });

  describe('Basic Coin Info', function () {
    it('should return the right info for coredao', function () {
      const coredao = bitgo.coin('coredao');

      coredao.should.be.an.instanceof(Coredao);
      coredao.getChain().should.equal('coredao');
      coredao.getFamily().should.equal('coredao');
      coredao.getFullName().should.equal('coredaochain');
      coredao.getBaseFactor().should.equal(1e18);
      coredao.supportsTss().should.equal(true);
      coredao.allowsAccountConsolidations().should.equal(false);
    });

    it('should return the right info for tcoredao', function () {
      const tcoredao = bitgo.coin('tcoredao');

      tcoredao.should.be.an.instanceof(Tcoredao);
      tcoredao.getChain().should.equal('tcoredao');
      tcoredao.getFamily().should.equal('coredao');
      tcoredao.getFullName().should.equal('Testnet coredao chain');
      tcoredao.getBaseFactor().should.equal(1e18);
      tcoredao.supportsTss().should.equal(true);
      tcoredao.allowsAccountConsolidations().should.equal(false);
    });
  });
});
