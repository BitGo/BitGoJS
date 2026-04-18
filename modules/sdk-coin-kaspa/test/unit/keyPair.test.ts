import * as should from 'should';
import { KeyPair } from '../../src/lib/keyPair';
import { testKeyData } from '../fixtures/kaspaFixtures';

describe('Kaspa KeyPair', function () {
  describe('Key Generation', function () {
    it('should generate a random key pair', function () {
      const kp = new KeyPair();
      const keys = kp.getKeys();
      should.exist(keys.pub);
      should.exist(keys.prv);
      keys.pub.should.have.length(66); // compressed secp256k1 public key
      keys.prv!.should.have.length(64); // 32-byte private key in hex
    });

    it('should create a key pair from a private key', function () {
      const kp = new KeyPair({ prv: testKeyData.prv });
      const keys = kp.getKeys();
      keys.pub.should.equal(testKeyData.pub);
      keys.prv!.should.equal(testKeyData.prv);
    });

    it('should create a key pair from a public key', function () {
      const kp = new KeyPair({ pub: testKeyData.pub });
      const keys = kp.getKeys();
      keys.pub.should.equal(testKeyData.pub);
      should.not.exist(keys.prv);
    });

    it('should throw for an invalid private key', function () {
      (() => new KeyPair({ prv: 'invalid-prv' })).should.throw();
    });
  });

  describe('Address Derivation', function () {
    it('should derive a mainnet address', function () {
      const kp = new KeyPair({ prv: testKeyData.prv });
      const address = kp.getAddress('mainnet');
      address.should.startWith('kaspa');
      address.should.containEql(':');
    });

    it('should derive a testnet address', function () {
      const kp = new KeyPair({ prv: testKeyData.prv });
      const address = kp.getAddress('testnet');
      address.should.startWith('kaspatest');
      address.should.containEql(':');
    });

    it('should derive consistent addresses for the same key', function () {
      const kp1 = new KeyPair({ prv: testKeyData.prv });
      const kp2 = new KeyPair({ prv: testKeyData.prv });
      kp1.getAddress('mainnet').should.equal(kp2.getAddress('mainnet'));
    });

    it('should derive different addresses for different keys', function () {
      const kp1 = new KeyPair({ prv: testKeyData.prv });
      const kp2 = new KeyPair();
      kp1.getAddress('mainnet').should.not.equal(kp2.getAddress('mainnet'));
    });
  });
});
