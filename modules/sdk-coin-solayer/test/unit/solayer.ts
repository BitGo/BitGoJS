import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { Solayer, Tsolayer } from '../../src';

describe('Solayer:', function () {
  let bitgo: TestBitGoAPI;
  let solayer: Solayer;
  let tsolayer: Tsolayer;

  before(function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'mock' });
    bitgo.safeRegister('solayer', Solayer.createInstance);
    bitgo.safeRegister('tsolayer', Tsolayer.createInstance);
    bitgo.initializeTestVars();
    solayer = bitgo.coin('solayer') as Solayer;
    tsolayer = bitgo.coin('tsolayer') as Tsolayer;
  });

  describe('Basic Coin Properties', function () {
    it('should return the correct coin name', function () {
      solayer.getChain().should.equal('solayer');
      tsolayer.getChain().should.equal('tsolayer');
    });

    it('should return the correct full name', function () {
      solayer.getFullName().should.equal('Solayer');
      tsolayer.getFullName().should.equal('Testnet Solayer');
    });

    it('should return the correct base factor', function () {
      solayer.getBaseFactor().should.equal(1e9);
      tsolayer.getBaseFactor().should.equal(1e9);
    });

    it('should support TSS', function () {
      solayer.supportsTss().should.be.true();
      tsolayer.supportsTss().should.be.true();
    });

    it('should use EdDSA MPC algorithm', function () {
      solayer.getMPCAlgorithm().should.equal('eddsa');
      tsolayer.getMPCAlgorithm().should.equal('eddsa');
    });

    it('should validate valid addresses', function () {
      // Standard Solana base58 addresses work on Solayer
      solayer.isValidAddress('5hr5fisPi6DXNuuRpm5XUbzpiEnmdyxXuBDTwzwZj5Pe').should.be.true();
    });

    it('should reject invalid addresses', function () {
      solayer.isValidAddress('invalid_address').should.be.false();
      solayer.isValidAddress('').should.be.false();
    });
  });
});
