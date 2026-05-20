import * as should from 'should';
import { KeyPair } from '../../src/lib/keyPair';
import { KaspaAddressType } from '../../src/lib/constants';
import { KEYS, ADDRESSES } from '../fixtures/kaspa.fixtures';

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
      const kp = new KeyPair({ prv: KEYS.prv });
      const keys = kp.getKeys();
      keys.pub.should.equal(KEYS.pub);
      keys.prv!.should.equal(KEYS.prv);
    });

    it('should create a key pair from a public key', function () {
      const kp = new KeyPair({ pub: KEYS.pub });
      const keys = kp.getKeys();
      keys.pub.should.equal(KEYS.pub);
      should.not.exist(keys.prv);
    });

    it('should throw for an invalid private key', function () {
      (() => new KeyPair({ prv: 'invalid-prv' })).should.throw();
    });
  });

  describe('Address Derivation', function () {
    it('should derive a mainnet address', function () {
      const kp = new KeyPair({ prv: KEYS.prv });
      const address = kp.getAddress('mainnet');
      address.should.startWith('kaspa');
      address.should.containEql(':');
    });

    it('should derive a testnet address', function () {
      const kp = new KeyPair({ prv: KEYS.prv });
      const address = kp.getAddress('testnet');
      address.should.startWith('kaspatest');
      address.should.containEql(':');
    });

    it('should derive consistent addresses for the same key', function () {
      const kp1 = new KeyPair({ prv: KEYS.prv });
      const kp2 = new KeyPair({ prv: KEYS.prv });
      kp1.getAddress('mainnet').should.equal(kp2.getAddress('mainnet'));
    });

    it('should derive different addresses for different keys', function () {
      const kp1 = new KeyPair({ prv: KEYS.prv });
      const kp2 = new KeyPair();
      kp1.getAddress('mainnet').should.not.equal(kp2.getAddress('mainnet'));
    });
  });

  describe('ECDSA Address Derivation (v1)', function () {
    it('should derive a mainnet ECDSA address', function () {
      const kp = new KeyPair({ prv: KEYS.prv });
      const address = kp.getAddress('mainnet', KaspaAddressType.ECDSA);
      address.should.startWith('kaspa');
      address.should.containEql(':');
    });

    it('should derive a testnet ECDSA address', function () {
      const kp = new KeyPair({ prv: KEYS.prv });
      const address = kp.getAddress('testnet', KaspaAddressType.ECDSA);
      address.should.startWith('kaspatest');
      address.should.containEql(':');
    });

    it('Schnorr and ECDSA addresses for the same key should differ', function () {
      const kp = new KeyPair({ prv: KEYS.prv });
      const schnorrAddr = kp.getAddress('mainnet');
      const ecdsaAddr = kp.getAddress('mainnet', KaspaAddressType.ECDSA);
      schnorrAddr.should.not.equal(ecdsaAddr);
    });

    it('Schnorr address matches fixture ADDRESSES.valid', function () {
      const kp = new KeyPair({ prv: KEYS.prv });
      kp.getAddress('mainnet').should.equal(ADDRESSES.valid);
    });

    it('ECDSA address matches fixture ADDRESSES.validEcdsa', function () {
      const kp = new KeyPair({ prv: KEYS.prv });
      kp.getAddress('mainnet', KaspaAddressType.ECDSA).should.equal(ADDRESSES.validEcdsa);
    });

    it('should be consistent across two KeyPair instances for ECDSA', function () {
      const kp1 = new KeyPair({ prv: KEYS.prv });
      const kp2 = new KeyPair({ prv: KEYS.prv });
      kp1.getAddress('mainnet', KaspaAddressType.ECDSA).should.equal(kp2.getAddress('mainnet', KaspaAddressType.ECDSA));
    });
  });
});
