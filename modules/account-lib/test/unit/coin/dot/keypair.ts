import should from 'should';
import { Dot } from '../../../../src';
import * as DotResources from '../../../resources/dot';

describe('Dot KeyPair', () => {
  const defaultSeed = { seed: Buffer.alloc(32) };

  const {
    accounts: { account1, account2, account3, default: defaultAccount },
  } = DotResources;

  describe('Keypair creation', () => {
    it('initial state', () => {
      const keyPair = new Dot.KeyPair();
      should.exists(keyPair.getKeys().prv);
      should.exists(keyPair.getKeys().pub);
      should.equal(keyPair.getKeys().prv!.length, 64);
      should.equal(keyPair.getKeys().pub.length, 64);
    });

    it('initialization from private key', () => {
      let keyPair = new Dot.KeyPair({ prv: account1.secretKey });
      should.equal(keyPair.getKeys().prv, account1.secretKey);
      should.equal(keyPair.getKeys().pub, account1.publicKey);

      keyPair = new Dot.KeyPair({ prv: account2.secretKey });
      should.equal(keyPair.getKeys().prv, account2.secretKey);
      should.equal(keyPair.getKeys().pub, account2.publicKey);
    });

    it('initialization from public key', () => {
      const keyPair = new Dot.KeyPair({ pub: account3.publicKey });
      should.equal(keyPair.getKeys().pub, account3.publicKey);
    });
  });

  describe('KeyPair validation', () => {
    it('should fail to create from an invalid seed', () => {
      const seed = { seed: Buffer.alloc(8) }; //  Seed should be 512 bits (64 bytes)
      should.throws(() => new Dot.KeyPair(seed), 'bad seed size');
    });

    it('should fail to create from an invalid public key', () => {
      const source = {
        pub: '01D63D',
      };
      should.throws(() => new Dot.KeyPair(source), 'address seems to be malformed');
    });

    it('should fail to create from an invalid private key', () => {
      const source = {
        prv: '82A34',
      };
      should.throws(() => new Dot.KeyPair(source), 'Invalid base32 characters');
    });
  });

  describe('getAddress', () => {
    it('should get an address', () => {
      let keyPair = new Dot.KeyPair(defaultSeed);
      let address = keyPair.getAddress();
      address.should.equal(defaultAccount.address);

      keyPair = new Dot.KeyPair({ prv: account2.secretKey });
      address = keyPair.getAddress();
      address.should.equal(account2.address);
    });
  });

  describe('getSigningKeyPair', () => {
    it('should create a signing keypair', () => {
      const keyPair = new Dot.KeyPair({ prv: account1.secretKey });
      const address = keyPair.getSigningKeyPair().address;
      address.should.equal(account1.address);
    });
  });

  describe('getKeys', () => {
    it('should get private and public keys in the protocol default format', () => {
      const keyPair = new Dot.KeyPair(defaultSeed);
      const { prv, pub } = keyPair.getKeys();
      pub.should.equal(defaultAccount.publicKey);
      if (prv) {
        prv.should.equal(defaultAccount.secretKey);
      }
    });

    it('should get private and public keys for a random seed', () => {
      const keyPair = new Dot.KeyPair();
      const { prv, pub } = keyPair.getKeys();
      should.exist(prv);
      should.exist(pub);
    });
  });
});
