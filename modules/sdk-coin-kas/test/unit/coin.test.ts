import * as should from 'should';
import { BitGoAPI } from '@bitgo/sdk-api';
import { Kaspa } from '../../src/kas';
import { Tkaspa } from '../../src/tkas';

const bitgo = new BitGoAPI({ env: 'mock' });
const mockStaticsCoin = {
  name: 'kaspa',
  fullName: 'Kaspa',
  family: 'kaspa',
  decimalPlaces: 8,
  network: { type: 'mainnet' },
} as any;

const mockStaticsTestnetCoin = {
  ...mockStaticsCoin,
  name: 'tkaspa',
  fullName: 'Kaspa Testnet',
  network: { type: 'testnet' },
} as any;

describe('Kaspa Coin Class', () => {
  let kas: Kaspa;
  let tkas: Tkaspa;

  before(() => {
    kas = new Kaspa(bitgo, mockStaticsCoin);
    tkas = new Tkaspa(bitgo, mockStaticsTestnetCoin);
  });

  describe('getChain', () => {
    it('should return "kaspa" for mainnet', () => {
      kas.getChain().should.equal('kaspa');
    });

    it('should return "tkaspa" for testnet', () => {
      tkas.getChain().should.equal('tkaspa');
    });
  });

  describe('getFullName', () => {
    it('should return the full name', () => {
      kas.getFullName().should.equal('Kaspa');
    });
  });

  describe('getBaseFactor', () => {
    it('should return 10^8 = 100000000', () => {
      Number(kas.getBaseFactor()).should.equal(100000000);
    });
  });

  describe('isValidAddress', () => {
    it('should return true for valid addresses', () => {
      // Generate a valid address
      const { KeyPair } = require('../../src/lib/keyPair');
      const kp = new KeyPair({ prv: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' });
      const addr = kp.getAddress('mainnet');
      kas.isValidAddress(addr).should.be.true();
    });

    it('should return false for invalid addresses', () => {
      kas.isValidAddress('not-an-address').should.be.false();
      kas.isValidAddress('').should.be.false();
    });
  });

  describe('isValidPub', () => {
    it('should return true for valid compressed public keys', () => {
      kas.isValidPub('0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798').should.be.true();
    });

    it('should return false for invalid public keys', () => {
      kas.isValidPub('invalid').should.be.false();
    });
  });

  describe('isValidPrv', () => {
    it('should return true for valid private keys', () => {
      kas.isValidPrv('1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef').should.be.true();
    });

    it('should return false for invalid private keys', () => {
      kas.isValidPrv('tooshort').should.be.false();
    });
  });

  describe('generateKeyPair', () => {
    it('should generate a random key pair', () => {
      const kp = kas.generateKeyPair();
      should.exist(kp.pub);
      should.exist(kp.prv);
    });

    it('should generate a key pair from seed', () => {
      const seed = Buffer.alloc(32, 0x42);
      const kp = kas.generateKeyPair(seed);
      const kp2 = kas.generateKeyPair(seed);
      kp.pub!.should.equal(kp2.pub);
    });
  });

  describe('supportsTss / getMPCAlgorithm', () => {
    it('should support TSS', () => {
      kas.supportsTss().should.be.true();
    });

    it('should use ECDSA as MPC algorithm', () => {
      kas.getMPCAlgorithm().should.equal('ecdsa');
    });
  });

  describe('Tkaspa', () => {
    it('should be a subclass of Kaspa', () => {
      tkas.should.be.instanceof(Kaspa);
    });

    it('createInstance should return Tkaspa', () => {
      const instance = Tkaspa.createInstance(bitgo, mockStaticsTestnetCoin);
      instance.should.be.instanceof(Tkaspa);
    });
  });
});
