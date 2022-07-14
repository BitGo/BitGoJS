import assert from 'assert';
import should from 'should';
import { KeyPair } from '../../src';
import * as NearResources from '../resources/near';

describe('NEAR KeyPair', () => {
  const defaultSeed = { seed: Buffer.alloc(32) };

  const {
    accounts: { account1, account2, account3, account4, default: defaultAccount },
  } = NearResources;

  describe('Keypair creation', () => {
    it('initial state', () => {
      const keyPair = new KeyPair();
      should.exists(keyPair.getKeys().prv);
      should.exists(keyPair.getKeys().pub);
      should.equal(keyPair.getKeys().prv!.length, 64);
      should.equal(keyPair.getKeys().pub.length, 64);
    });

    it('initialization from private key', () => {
      let keyPair = new KeyPair({ prv: account1.secretKey });
      should.equal(keyPair.getKeys().prv, account1.secretKey);
      should.equal(keyPair.getKeys().pub, account1.publicKey);

      keyPair = new KeyPair({ prv: account2.secretKey });
      should.equal(keyPair.getKeys().prv, account2.secretKey);
      should.equal(keyPair.getKeys().pub, account2.publicKey);

      keyPair = new KeyPair({ prv: account3.secretKey });
      should.equal(keyPair.getAddress(), account3.address);
      should.equal(keyPair.getKeys().pub, account3.publicKey);
    });

    it('initialization from public key', () => {
      let keyPair = new KeyPair({ pub: account1.publicKey });
      should.equal(keyPair.getKeys().pub, account1.publicKey);

      keyPair = new KeyPair({ pub: account4.publicKey });
      should.equal(keyPair.getAddress(), account4.address);
    });
  });

  describe('KeyPair validation', () => {
    it('should fail to create from an invalid seed', () => {
      const seed = { seed: Buffer.alloc(8) }; //  Seed should be 512 bits (64 bytes)
      assert.throws(() => new KeyPair(seed), /bad seed size/);
    });

    it('should fail to create from an invalid public key', () => {
      const source = {
        pub: '01D63D',
      };
      assert.throws(() => new KeyPair(source), /Non-base58 character/);
    });

    it('should fail to create from an invalid private key', () => {
      const source = {
        prv: '82A34',
      };
      assert.throws(() => new KeyPair(source), /Non-base58 character/);
    });
  });

  describe('getAddress', () => {
    it('should get an address', () => {
      let keyPair = new KeyPair({ prv: account1.secretKey });
      let address = keyPair.getAddress();
      address.should.equal(account1.address);

      keyPair = new KeyPair({ prv: account2.secretKey });
      address = keyPair.getAddress();
      address.should.equal(account2.address);
    });
  });

  describe('getKeys', () => {
    it('should get private and public keys in the protocol default format', () => {
      const keyPair = new KeyPair(defaultSeed);
      const { prv, pub } = keyPair.getKeys();
      prv!.should.equal(defaultAccount.secretKey);
      pub.should.equal(defaultAccount.publicKey);
      const address = keyPair.getAddress();
      address.should.equal(defaultAccount.address);
    });

    it('should get private and public keys for a random seed', () => {
      const keyPair = new KeyPair();
      const { prv, pub } = keyPair.getKeys();
      should.exist(prv);
      should.exist(pub);
    });
  });
});
