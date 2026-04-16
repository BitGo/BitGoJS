import * as should from 'should';
import {
  isValidAddress,
  isValidPublicKey,
  isValidPrivateKey,
  publicKeyToAddress,
  buildScriptPublicKey,
  getHrpFromAddress,
  isMainnetAddress,
} from '../../src/lib/utils';
import { KeyPair } from '../../src/lib/keyPair';

describe('Kaspa Utils', () => {
  const validPrivateKey = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

  describe('isValidAddress', () => {
    it('should return true for valid mainnet addresses', () => {
      const kp = new KeyPair({ prv: validPrivateKey });
      const address = kp.getAddress('mainnet');
      isValidAddress(address).should.be.true();
    });

    it('should return true for valid testnet addresses', () => {
      const kp = new KeyPair({ prv: validPrivateKey });
      const address = kp.getAddress('testnet');
      isValidAddress(address).should.be.true();
    });

    it('should return false for invalid addresses', () => {
      isValidAddress('').should.be.false();
      isValidAddress('bitcoin:abc123').should.be.false();
      isValidAddress('kaspa:invalid_address').should.be.false();
      isValidAddress('kaspa:').should.be.false();
    });

    it('should accept an array of valid addresses', () => {
      const kp = new KeyPair({ prv: validPrivateKey });
      const addr = kp.getAddress('mainnet');
      isValidAddress([addr]).should.be.true();
    });

    it('should return false if any address in array is invalid', () => {
      const kp = new KeyPair({ prv: validPrivateKey });
      const addr = kp.getAddress('mainnet');
      isValidAddress([addr, 'invalid']).should.be.false();
    });
  });

  describe('isValidPublicKey', () => {
    it('should return true for compressed public keys', () => {
      const kp = new KeyPair({ prv: validPrivateKey });
      isValidPublicKey(kp.getKeys().pub).should.be.true();
    });

    it('should return false for invalid keys', () => {
      isValidPublicKey('').should.be.false();
      isValidPublicKey('zz'.repeat(33)).should.be.false();
    });
  });

  describe('isValidPrivateKey', () => {
    it('should return true for valid 32-byte hex keys', () => {
      isValidPrivateKey(validPrivateKey).should.be.true();
    });

    it('should return false for invalid keys', () => {
      isValidPrivateKey('too_short').should.be.false();
      isValidPrivateKey('gg'.repeat(32)).should.be.false(); // invalid hex
    });
  });

  describe('publicKeyToAddress', () => {
    it('should derive a bech32m address with kaspa HRP from a compressed public key', () => {
      const kp = new KeyPair({ prv: validPrivateKey });
      const compressedPub = Buffer.from(kp.getKeys().pub, 'hex');
      const address = publicKeyToAddress(compressedPub, 'kaspa');
      address.should.startWith('kaspa:');
      isValidAddress(address).should.be.true();
    });

    it('should derive a bech32m address with kaspatest HRP for testnet', () => {
      const kp = new KeyPair({ prv: validPrivateKey });
      const compressedPub = Buffer.from(kp.getKeys().pub, 'hex');
      const address = publicKeyToAddress(compressedPub, 'kaspatest');
      address.should.startWith('kaspatest:');
      isValidAddress(address).should.be.true();
    });
  });

  describe('buildScriptPublicKey', () => {
    it('should build a P2PK script from 32-byte x-only public key', () => {
      const kp = new KeyPair({ prv: validPrivateKey });
      const xOnly = kp.getXOnlyPublicKey();
      const spk = buildScriptPublicKey(xOnly);
      spk.version.should.equal(0);
      // Script: OP_DATA_32 (0x20) + 32 bytes + OP_CHECKSIG (0xAC) = 34 bytes = 68 hex chars
      spk.script.length.should.equal(68);
      spk.script.should.startWith('20'); // OP_DATA_32
      spk.script.should.endWith('ac'); // OP_CHECKSIG
    });

    it('should throw for non-32-byte input', () => {
      should.throws(() => buildScriptPublicKey(Buffer.alloc(33)));
    });
  });

  describe('getHrpFromAddress and isMainnetAddress', () => {
    it('should return kaspa HRP for mainnet address', () => {
      const kp = new KeyPair({ prv: validPrivateKey });
      const address = kp.getAddress('mainnet');
      getHrpFromAddress(address).should.equal('kaspa');
      isMainnetAddress(address).should.be.true();
    });

    it('should return kaspatest HRP for testnet address', () => {
      const kp = new KeyPair({ prv: validPrivateKey });
      const address = kp.getAddress('testnet');
      getHrpFromAddress(address).should.equal('kaspatest');
      isMainnetAddress(address).should.be.false();
    });
  });
});
