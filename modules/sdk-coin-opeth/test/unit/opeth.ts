import 'should';

import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';

import { Opeth, Topeth } from '../../src/index';

const bitgo: TestBitGoAPI = TestBitGo.decorate(BitGoAPI, { env: 'test' });

describe('Optimism', function () {
  before(function () {
    bitgo.safeRegister('opeth', Opeth.createInstance);
    bitgo.safeRegister('topeth', Topeth.createInstance);
    bitgo.initializeTestVars();
  });

  describe('Basic Coin Info', function () {
    it('should return the right info for opeth', function () {
      const opeth = bitgo.coin('opeth');

      opeth.should.be.an.instanceof(Opeth);
      opeth.getChain().should.equal('opeth');
      opeth.getFamily().should.equal('opeth');
      opeth.getFullName().should.equal('Optimism Ethereum');
      opeth.getBaseFactor().should.equal(1e18);
      opeth.supportsTss().should.equal(true);
    });

    it('should return the right info for topeth', function () {
      const topeth = bitgo.coin('topeth');

      topeth.should.be.an.instanceof(Topeth);
      topeth.getChain().should.equal('topeth');
      topeth.getFamily().should.equal('opeth');
      topeth.getFullName().should.equal('Testnet Optimism Ethereum');
      topeth.getBaseFactor().should.equal(1e18);
      topeth.supportsTss().should.equal(true);
    });
  });
});
