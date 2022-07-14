import { DotAddressFormat } from '@bitgo/sdk-core';
import assert from 'assert';
import bs58 from 'bs58';
import should from 'should';
import { KeyPair } from '../../src';
import utils from '../../src/lib/utils';
import { accounts } from '../resources';

describe('Dot KeyPair', () => {
  const defaultSeed = { seed: Buffer.alloc(32) };

  const { account1, account2, account3, default: defaultAccount, bs58Account } = accounts;

  describe('Keypair creation', () => {
    it('initial state', () => {
      const keyPair = new KeyPair();
      should.exists(keyPair.getKeys().prv);
      should.exists(keyPair.getKeys().pub);
      should.equal(keyPair.getKeys().prv?.length, 64);
      should.equal(keyPair.getKeys().pub.length, 64);
    });

    it('initialization from private key', () => {
      let keyPair = new KeyPair({ prv: account1.secretKey });
      should.equal(keyPair.getKeys().prv, account1.secretKey);
      should.equal(keyPair.getKeys().pub, account1.publicKey);

      keyPair = new KeyPair({ prv: account2.secretKey });
      should.equal(keyPair.getKeys().prv, account2.secretKey);
      should.equal(keyPair.getKeys().pub, account2.publicKey);
    });

    it('initialization from public key', () => {
      const keyPair = new KeyPair({ pub: account3.publicKey });
      should.equal(keyPair.getKeys().pub, account3.publicKey);
    });

    it('initialization from base58 public key', () => {
      const decodedbs58Buffer: Buffer = bs58.decode(bs58Account.publicKey);
      const publicKeyHexString = decodedbs58Buffer.toString('hex');

      const keyPair = new KeyPair({ pub: bs58Account.publicKey });
      should.equal(keyPair.getKeys().pub, publicKeyHexString);
    });

    it('should be able to derive keypair with hardened derivation', () => {
      // using ed25519 (polkadot.js uses sr25519)
      const keyPair = new KeyPair({
        prv: account1.secretKey,
      });
      const derivationIndex = 0;
      const derived = keyPair.deriveHardened(`m/0'/0'/0'/${derivationIndex}'`);
      const derivedKeyPair = new KeyPair({
        prv: derived.prv || '',
      });
      should.exists(derivedKeyPair.getAddress(DotAddressFormat.substrate));
      should.exists(derivedKeyPair.getKeys().prv);
      should.exists(derivedKeyPair.getKeys().pub);
      should.equal(derivedKeyPair.getKeys().prv?.length, 64);
      should.equal(derivedKeyPair.getKeys().pub?.length, 64);
    });
  });

  describe('KeyPair validation', () => {
    it('should fail to create from an invalid seed', () => {
      const seed = { seed: Buffer.alloc(8) }; //  Seed should be 512 bits (64 bytes)
      assert.throws(() => new KeyPair(seed), /bad seed size/);
    });

    it('should create from a valid seed', () => {
      const seed = { seed: Buffer.alloc(32) }; //  Seed should be 512 bits (64 bytes)
      should.doesNotThrow(() => new KeyPair(seed));
    });

    it('should fail to create from an invalid public key', () => {
      const source = {
        pub: '01D63D',
      };
      assert.throws(() => new KeyPair(source), /Expected a valid key to convert/);
    });

    it('should fail to create from an invalid private key', () => {
      const source = {
        prv: '82A34',
      };
      assert.throws(() => new KeyPair(source), /Invalid base32 characters/);
    });
  });

  describe('getAddress', () => {
    it('should get an address', () => {
      let keyPair = new KeyPair(defaultSeed);
      let address = keyPair.getAddress(DotAddressFormat.substrate);
      address.should.equal(defaultAccount.address);

      keyPair = new KeyPair({ prv: account2.secretKey });
      address = keyPair.getAddress(DotAddressFormat.substrate);
      address.should.equal(account2.address);
    });

    it('should get an address with bs58 pub key', () => {
      const keyPair = new KeyPair({ pub: bs58Account.publicKey });
      const address = keyPair.getAddress(DotAddressFormat.substrate);
      address.should.equal(bs58Account.address);
      utils.isValidAddress(address).should.equal(true);
    });

    it('should get a polkadot network address', () => {
      const keyPair = new KeyPair({ pub: bs58Account.publicKey });
      const address = keyPair.getAddress(DotAddressFormat.polkadot);
      address.should.equal(bs58Account.polkadotAddress);
      utils.isValidAddress(address).should.equal(true);
    });
  });

  describe('getSigningKeyPair', () => {
    it('should create a signing keypair', () => {
      const keyPair = new KeyPair({ prv: account1.secretKey });
      const address = keyPair.getAddress(DotAddressFormat.substrate);
      address.should.equal(account1.address);
    });
  });

  describe('getKeys', () => {
    it('should get private and public keys in the protocol default format', () => {
      const keyPair = new KeyPair(defaultSeed);
      const { prv, pub } = keyPair.getKeys();
      pub.should.equal(defaultAccount.publicKey);
      if (prv) {
        prv.should.equal(defaultAccount.secretKey);
      }
    });

    it('should get private and public keys for a random seed', () => {
      const keyPair = new KeyPair();
      const { prv, pub } = keyPair.getKeys();
      should.exist(prv);
      should.exist(pub);
    });
  });
});
