import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';

import { Tworld, World } from '../../src';

const bitgo: TestBitGoAPI = TestBitGo.decorate(BitGoAPI, { env: 'test' });

describe('world', function () {
  before(function () {
    bitgo.safeRegister('world', World.createInstance);
    bitgo.safeRegister('tworld', Tworld.createInstance);
    bitgo.initializeTestVars();
  });

  //currently WORLD is only live for only testnet
  describe('Basic Coin Info', function () {
    it('should return the right info for world', function () {
      const world = bitgo.coin('world');
      world.should.be.an.instanceof(World);
      world.getChain().should.equal('world');
      world.getFamily().should.equal('world');
      world.getFullName().should.equal('Worldchain');
      world.getBaseFactor().should.equal(1e18);
      world.supportsTss().should.equal(true);
      world.allowsAccountConsolidations().should.equal(false);
    });
    it('should return the right info for tworld', function () {
      const tworld = bitgo.coin('tworld');

      tworld.should.be.an.instanceof(Tworld);
      tworld.getChain().should.equal('tworld');
      tworld.getFamily().should.equal('world');
      tworld.getFullName().should.equal('Worldchain Testnet');
      tworld.getBaseFactor().should.equal(1e18);
      tworld.supportsTss().should.equal(true);
      tworld.allowsAccountConsolidations().should.equal(false);
    });
  });
});
