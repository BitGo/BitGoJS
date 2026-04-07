import assert from 'assert';
import { KeyPair, isValidKaspaAddress } from '../../src/lib';

describe('Kaspa (KAS)', function () {
  describe('KeyPair', function () {
    it('should generate a random key pair', function () {
      const kp = new KeyPair();
      const keys = kp.getKeys();
      assert.ok(keys.pub, 'pub key should exist');
      assert.ok(keys.prv, 'prv key should exist');
      assert.equal(typeof keys.pub, 'string');
      assert.equal(typeof keys.prv, 'string');
    });

    it('should create key pair from private key', function () {
      const kp = new KeyPair();
      const keys = kp.getKeys();
      const kp2 = new KeyPair({ prv: keys.prv! });
      assert.equal(kp2.getKeys().pub, keys.pub);
    });

    it('should create key pair from public key', function () {
      const kp = new KeyPair();
      const keys = kp.getKeys();
      const kp2 = new KeyPair({ pub: keys.pub });
      assert.equal(kp2.getKeys().pub, keys.pub);
    });

    it('should derive a valid Kaspa mainnet address', function () {
      const kp = new KeyPair();
      const address = kp.getAddress('mainnet');
      assert.ok(address.startsWith('kaspa:'), `Expected kaspa: prefix, got ${address}`);
      assert.ok(isValidKaspaAddress(address), `Expected valid address, got ${address}`);
    });

    it('should derive a valid Kaspa testnet address', function () {
      const kp = new KeyPair();
      const address = kp.getAddress('testnet');
      assert.ok(address.startsWith('kaspatest:'), `Expected kaspatest: prefix, got ${address}`);
      assert.ok(isValidKaspaAddress(address), `Expected valid address, got ${address}`);
    });
  });

  describe('Address Validation', function () {
    it('should reject invalid addresses', function () {
      assert.equal(isValidKaspaAddress(''), false);
      assert.equal(isValidKaspaAddress('invalid'), false);
      assert.equal(isValidKaspaAddress('bitcoin:123'), false);
    });

    it('should accept valid addresses derived from key pair', function () {
      const kp = new KeyPair();
      const mainnetAddr = kp.getAddress('mainnet');
      const testnetAddr = kp.getAddress('testnet');
      assert.ok(isValidKaspaAddress(mainnetAddr));
      assert.ok(isValidKaspaAddress(testnetAddr));
    });
  });
});
