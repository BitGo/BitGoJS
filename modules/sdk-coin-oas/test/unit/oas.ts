import 'should';

import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';

import { Oas, Toas } from '../../src/index';

const bitgo: TestBitGoAPI = TestBitGo.decorate(BitGoAPI, { env: 'test' });

describe('OASYS chain', function () {
  before(function () {
    bitgo.safeRegister('oas', Oas.createInstance);
    bitgo.safeRegister('toas', Toas.createInstance);
    bitgo.initializeTestVars();
  });

  describe('Basic Coin Info', function () {
    it('should return the right info for oas', function () {
      const oas = bitgo.coin('oas');

      oas.should.be.an.instanceof(Oas);
      oas.getChain().should.equal('oas');
      oas.getFamily().should.equal('oas');
      oas.getFullName().should.equal('Oasys');
      oas.getBaseFactor().should.equal(1e18);
      oas.supportsTss().should.equal(true);
      oas.allowsAccountConsolidations().should.equal(false);
    });

    it('should return the right info for toas', function () {
      const toas = bitgo.coin('toas');

      toas.should.be.an.instanceof(Toas);
      toas.getChain().should.equal('toas');
      toas.getFamily().should.equal('oas');
      toas.getFullName().should.equal('Testnet Oasys');
      toas.getBaseFactor().should.equal(1e18);
      toas.supportsTss().should.equal(true);
      toas.allowsAccountConsolidations().should.equal(false);
    });
  });
});
