import assert from 'assert';
import should from 'should';
import { AlgoLib as Algo } from '../../../src';
import * as AlgoResources from '../../fixtures/resources';

describe('Algo KeyPair', () => {
  const defaultSeed = { seed: Buffer.alloc(32) };

  const {
    accounts: { account1, account2, account3, default: defaultAccount },
  } = AlgoResources;

  describe('Keypair creation', () => {
    it('initial state', () => {
      const keyPair = new Algo.KeyPair();
      should.exists(keyPair.getKeys().prv);
      should.exists(keyPair.getKeys().pub);
      should.equal(keyPair.getKeys().prv!.length, 64);
      should.equal(keyPair.getKeys().pub.length, 64);
    });

    it('initialization from private key', () => {
      let keyPair = new Algo.KeyPair({ prv: account1.secretKey.toString('hex') });
      should.equal(keyPair.getKeys().prv, account1.secretKey.toString('hex'));
      should.equal(keyPair.getKeys().pub, account1.pubKey.toString('hex'));

      keyPair = new Algo.KeyPair({ prv: account2.secretKey.toString('hex') });
      should.equal(keyPair.getKeys().prv, account2.secretKey.toString('hex'));
      should.equal(keyPair.getKeys().pub, account2.pubKey.toString('hex'));
    });

    it('initialization from public key', () => {
      const keyPair = new Algo.KeyPair({ pub: account3.pubKey.toString('hex') });
      should.equal(keyPair.getKeys().pub, account3.pubKey.toString('hex'));
    });
  });

  describe('KeyPair validation', () => {
    it('should fail to create from an invalid seed', () => {
      const seed = { seed: Buffer.alloc(8) }; //  Seed should be 512 bits (64 bytes)
      assert.throws(() => new Algo.KeyPair(seed), /bad seed size/);
    });

    it('should fail to create from an invalid public key', () => {
      const source = {
        pub: '01D63D',
      };
      assert.throws(() => new Algo.KeyPair(source), /address seems to be malformed/);
    });

    it('should fail to create from an invalid private key', () => {
      const source = {
        prv: '82A34',
      };
      assert.throws(() => new Algo.KeyPair(source), /Invalid base32 characters/);
    });
  });

  describe('getAddress', () => {
    it('should get an address', () => {
      let keyPair = new Algo.KeyPair(defaultSeed);
      let address = keyPair.getAddress();
      address.should.equal(defaultAccount.address);

      keyPair = new Algo.KeyPair({ prv: account2.secretKey.toString('hex') });
      address = keyPair.getAddress();
      address.should.equal(account2.address);
    });
  });

  describe('getKeys', () => {
    it('should get private and public keys in the protocol default format', () => {
      const keyPair = new Algo.KeyPair(defaultSeed);
      const { prv, pub } = keyPair.getKeys();
      prv!.should.equal(defaultAccount.secretKey.toString('hex'));
      pub.should.equal(defaultAccount.pubKey.toString('hex'));
    });

    it('should get private and public keys for a random seed', () => {
      const keyPair = new Algo.KeyPair();
      const { prv, pub } = keyPair.getKeys();
      should.exist(prv);
      should.exist(pub);
    });
  });
});
