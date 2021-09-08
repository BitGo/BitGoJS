import should from 'should';
import { test } from 'mocha';

import { Algo } from '../../../../src';
import * as AlgoResources from '../../../resources/algo';

describe('Algo KeyPair', () => {
  const defaultSeed = { seed: Buffer.alloc(32) };

  const {
    accounts: { account1, account2, account3, default: defaultAccount },
  } = AlgoResources;

  describe('Keypair creation', () => {
    test('initial state', () => {
      const keyPair = new Algo.KeyPair();
      should.exists(keyPair.getKeys().prv);
      should.exists(keyPair.getKeys().pub);
      should.equal(keyPair.getKeys().prv!.length, 64);
      should.equal(keyPair.getKeys().pub.length, 64);
    });

    test('initialization from private key', () => {
      let keyPair = new Algo.KeyPair({ prv: account1.secretKey.toString('hex') });
      should.equal(keyPair.getKeys().prv, account1.secretKey.toString('hex'));
      should.equal(keyPair.getKeys().pub, account1.pubKey.toString('hex'));

      keyPair = new Algo.KeyPair({ prv: account2.secretKey.toString('hex') });
      should.equal(keyPair.getKeys().prv, account2.secretKey.toString('hex'));
      should.equal(keyPair.getKeys().pub, account2.pubKey.toString('hex'));
    });

    test('initialization from public key', () => {
      const keyPair = new Algo.KeyPair({ pub: account3.pubKey.toString('hex') });
      should.equal(keyPair.getKeys().pub, account3.pubKey.toString('hex'));
    });
  });

  describe('KeyPair validation', () => {
    it('should fail to create from an invalid seed', () => {
      const seed = { seed: Buffer.alloc(8) }; //  Seed should be 512 bits (64 bytes)
      should.throws(() => new Algo.KeyPair(seed));
    });

    it('should fail to create from an invalid public key', () => {
      const source = {
        pub: '01D63D',
      };
      should.throws(() => new Algo.KeyPair(source));
    });

    it('should fail to create from an invalid private key', () => {
      const source = {
        prv: '82A34',
      };
      should.throws(() => new Algo.KeyPair(source));
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
