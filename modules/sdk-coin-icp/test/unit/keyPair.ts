import should from 'should';
import { KeyPair } from '../../src/lib/keyPair';
import { randomBytes } from 'crypto';

describe('ICP KeyPair', () => {
  describe('constructor', () => {
    it('should generate a key pair with a random seed when no source is provided', () => {
      const keyPair = new KeyPair();
      should.exist(keyPair);
      const publicKey = keyPair.getKeys().pub;
      const privateKey = keyPair.getKeys().prv;
      should.exist(publicKey);
      should.exist(privateKey);
      publicKey.should.be.a.String();
      if (privateKey) {
        privateKey.should.be.a.String();
      }
    });

    it('should generate a key pair from a given seed', () => {
      const seed = randomBytes(32);
      const keyPair = new KeyPair({ seed });
      should.exist(keyPair);
      const publicKey = keyPair.getKeys().pub;
      const privateKey = keyPair.getKeys().prv;
      should.exist(publicKey);
      should.exist(privateKey);
      publicKey.should.be.a.String();
      if (privateKey) {
        privateKey.should.be.a.String();
      }
    });

    it('should generate a key pair from a public key', () => {
      const tempKeyPair = new KeyPair();
      const publicKey = tempKeyPair.getKeys().pub;
      const keyPair = new KeyPair({ pub: publicKey });

      should.exist(keyPair);
      should.exist(keyPair.getKeys().pub);
      should.equal(keyPair.getKeys().pub, publicKey);
    });

    it('should generate different key pairs for different seeds', () => {
      const seed1 = randomBytes(32);
      const seed2 = randomBytes(32);
      const keyPair1 = new KeyPair({ seed: seed1 });
      const keyPair2 = new KeyPair({ seed: seed2 });

      should.notEqual(keyPair1.getKeys().pub, keyPair2.getKeys().pub);
      should.notEqual(keyPair1.getKeys().prv, keyPair2.getKeys().prv);
    });

    it('should generate the same key pair for the same seed', () => {
      const seed = randomBytes(32);
      const keyPair1 = new KeyPair({ seed });
      const keyPair2 = new KeyPair({ seed });

      should.equal(keyPair1.getKeys().pub, keyPair2.getKeys().pub);
      should.equal(keyPair1.getKeys().prv, keyPair2.getKeys().prv);
    });
  });

  describe('KeyPair getKeys()', () => {
    it('should return valid public and private keys for a randomly generated key pair', () => {
      const keyPair = new KeyPair();
      const keys = keyPair.getKeys();

      should.exist(keys);
      should.exist(keys.pub);
      should.exist(keys.prv);
      keys.pub.should.be.a.String();
      keys.pub.length.should.be.greaterThan(0);
      if (keys.prv) {
        keys.prv.should.be.a.String();
        keys.prv.length.should.be.greaterThan(0);
      }
    });

    it('should return valid public and private keys for a key pair generated with a seed', () => {
      const seed = randomBytes(32);
      const keyPair = new KeyPair({ seed });
      const keys = keyPair.getKeys();

      should.exist(keys);
      should.exist(keys.pub);
      should.exist(keys.prv);
      keys.pub.should.be.a.String();
      if (keys.prv) {
        keys.prv.should.be.a.String();
      }
    });

    it('should return only a public key when a key pair is generated from a public key', () => {
      const tempKeyPair = new KeyPair();
      const publicKey = tempKeyPair.getKeys().pub;
      const keyPair = new KeyPair({ pub: publicKey });
      const keys = keyPair.getKeys();

      should.exist(keys);
      should.exist(keys.pub);
      should.equal(keys.pub, publicKey);
      should.not.exist(keys.prv);
    });

    it('should generate consistent keys for the same seed', () => {
      const seed = randomBytes(32);
      const keyPair1 = new KeyPair({ seed });
      const keyPair2 = new KeyPair({ seed });

      const keys1 = keyPair1.getKeys();
      const keys2 = keyPair2.getKeys();

      should.equal(keys1.pub, keys2.pub);
      should.equal(keys1.prv, keys2.prv);
    });

    it('should generate different keys for different seeds', () => {
      const seed1 = randomBytes(32);
      const seed2 = randomBytes(32);
      const keyPair1 = new KeyPair({ seed: seed1 });
      const keyPair2 = new KeyPair({ seed: seed2 });

      const keys1 = keyPair1.getKeys();
      const keys2 = keyPair2.getKeys();

      should.notEqual(keys1.pub, keys2.pub);
      should.notEqual(keys1.prv, keys2.prv);
    });

    it('should return a compressed public key', () => {
      const keyPair = new KeyPair();
      const keys = keyPair.getKeys();

      should.exist(keys.pub);
      keys.pub.length.should.equal(66); // 33 bytes * 2 (hex)
      keys.pub.startsWith('02').should.be.true() || keys.pub.startsWith('03').should.be.true();
    });
  });
});
