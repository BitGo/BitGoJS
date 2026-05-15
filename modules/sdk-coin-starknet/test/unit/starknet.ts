import { TestBitGo, TestBitGoAPI } from '@bitgo/sdk-test';
import { BitGoAPI } from '@bitgo/sdk-api';
import { Starknet } from '../../src/index';
import * as testData from '../resources/starknet';
import should from 'should';
import { getAddressFromPublicKey } from '../../src/lib/utils';

describe('Starknet', function () {
  let bitgo: TestBitGoAPI;
  let basecoin;

  before(async function () {
    bitgo = TestBitGo.decorate(BitGoAPI, { env: 'test' });
    bitgo.safeRegister('starknet', Starknet.createInstance);
    bitgo.safeRegister('tstarknet', Starknet.createInstance);
    bitgo.initializeTestVars();
    basecoin = bitgo.coin('starknet');
  });

  it('should return the right info', function () {
    const starknet = bitgo.coin('starknet');
    const tstarknet = bitgo.coin('tstarknet');

    starknet.getChain().should.equal('starknet');
    starknet.getFamily().should.equal('starknet');
    starknet.getFullName().should.equal('Starknet');
    starknet.getBaseFactor().should.equal(1e18);
    starknet.supportsTss().should.equal(true);

    tstarknet.getChain().should.equal('tstarknet');
    tstarknet.getFamily().should.equal('starknet');
    tstarknet.getFullName().should.equal('Testnet Starknet');
    tstarknet.getBaseFactor().should.equal(1e18);
    tstarknet.supportsTss().should.equal(true);
  });

  describe('Address validation', () => {
    it('should validate a correct Starknet address', function () {
      basecoin.isValidAddress(testData.Accounts.account1.address).should.equal(true);
    });

    it('should validate a second correct address', function () {
      basecoin.isValidAddress(testData.Accounts.account2.address).should.equal(true);
    });

    it('should reject an obviously invalid address', function () {
      basecoin.isValidAddress('not_an_address').should.equal(false);
    });

    it('should reject an empty address', function () {
      basecoin.isValidAddress('').should.equal(false);
    });
  });

  describe('Address derivation', () => {
    it('should derive correct address from public key for account1', function () {
      const derived = getAddressFromPublicKey(testData.Accounts.account1.publicKey);
      derived.should.equal(testData.Accounts.account1.address);
    });

    it('should derive correct address from public key for account2', function () {
      const derived = getAddressFromPublicKey(testData.Accounts.account2.publicKey);
      derived.should.equal(testData.Accounts.account2.address);
    });

    it('should derive correct address from public key for account3', function () {
      const derived = getAddressFromPublicKey(testData.Accounts.account3.publicKey);
      derived.should.equal(testData.Accounts.account3.address);
    });
  });

  describe('Public key validation', () => {
    it('should validate a correct uncompressed public key', function () {
      basecoin.isValidPub(testData.Accounts.account1.publicKey).should.equal(true);
    });

    it('should reject an invalid public key', function () {
      basecoin.isValidPub('invalid-public-key').should.equal(false);
    });
  });

  describe('MPC support', () => {
    it('should support TSS', function () {
      basecoin.supportsTss().should.equal(true);
    });

    it('should return ECDSA as MPC algorithm', function () {
      basecoin.getMPCAlgorithm().should.equal('ecdsa');
    });
  });

  describe('Key pair generation', () => {
    it('should generate a key pair', function () {
      const keyPair = basecoin.generateKeyPair();
      should.exist(keyPair.pub);
      should.exist(keyPair.prv);
    });

    it('should generate different key pairs each time', function () {
      const kp1 = basecoin.generateKeyPair();
      const kp2 = basecoin.generateKeyPair();
      kp1.pub.should.not.equal(kp2.pub);
    });
  });
});
