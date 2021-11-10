import { Sol, Tsol } from '../../../../src/v2/coins/';
import { TestBitGo } from '../../../lib/test_bitgo';
import * as should from 'should';

describe('SOL:', function () {
  let bitgo;
  let basecoin;

  before(function () {
    bitgo = new TestBitGo({ env: 'mock' });
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('tsol');
  });

  it('should instantiate the coin', function () {
    let localBasecoin = bitgo.coin('tsol');
    localBasecoin.should.be.an.instanceof(Tsol);

    localBasecoin = bitgo.coin('sol');
    localBasecoin.should.be.an.instanceof(Sol);
  });

  it('should retun the right info', function() {
    basecoin.getChain().should.equal('tsol');
    basecoin.getFamily().should.equal('sol');
    basecoin.getFullName().should.equal('Testnet Sol');
    basecoin.getBaseFactor().should.equal(1000000000);
  });

  it('should verify transactions', (function () {
    should.throws(() => basecoin.verifyTransaction('placeholder'), 'verifyTransaction method not implemented');
  }));

  it('should verify addresses', (function () {
    should.throws(() => basecoin.verifyAddress('placeholder'), 'verifyAddress method not implemented');
  }));

  it('should check valid addresses', (function () {
    should.throws(() => basecoin.isValidAddress('placeholder'), 'isValidAddress method not implemented');
  }));

  it('should check valid pub keys', (function () {
    should.throws(() => basecoin.isValidPub('placeholder'), 'isValidPub method not implemented');
  }));

  it('should check valid prv keys', (function () {
    should.throws(() => basecoin.isValidPrv('placeholder'), 'isValidPrv method not implemented');
  }));

  describe('Parse Transactions:', () => {
    it('should parse a transfer transaction', async function () {
      await should.throws(() => basecoin.parseTransaction('placeholder'), 'parseTransaction method not implemented');
    });
  });

  describe('Explain Transactions:', () => {
    it('should explain a transfer transaction', async function () {
      await should.throws(() => basecoin.explainTransaction('placeholder'), 'explainTransaction method not implemented');
    });

    it('should explain an unsigned transaction', async function () {
      await should.throws(() => basecoin.explainTransaction('placeholder'), 'explainTransaction method not implemented');
    });
  });

  describe('Keypair:', () => {
    it('should generate a keypair from random seed', function () {
      should.throws(() => basecoin.generateKeyPair('placeholder'), 'generateKeyPair method not implemented');
    });

    it('should generate a keypair from a seed', function () {
      should.throws(() => basecoin.generateKeyPair('placeholder'), 'generateKeyPair method not implemented');
    });
  });

  describe('Sign transaction:', () => {
    it('should sign transaction', async function () {
      await should.throws(() => basecoin.signTransaction('placeholder'), 'signTransaction method not implemented');
    });
  });
});
