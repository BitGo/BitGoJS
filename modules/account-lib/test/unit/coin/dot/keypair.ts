import assert from 'assert';
import should from 'should';
import { Dot } from '../../../../src';
import { accounts } from '../../../resources/dot';
import bs58 from 'bs58';
import utils from '../../../../src/coin/dot/utils';
import { AddressFormat } from '../../../../src/coin/baseCoin/enum';

describe('Dot KeyPair', () => {
  const defaultSeed = { seed: Buffer.alloc(32) };

  const { account1, account2, account3, default: defaultAccount, bs58Account } = accounts;

  describe('Keypair creation', () => {
    it('initial state', () => {
      const keyPair = new Dot.KeyPair();
      should.exists(keyPair.getKeys().prv);
      should.exists(keyPair.getKeys().pub);
      should.equal(keyPair.getKeys().prv?.length, 64);
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

    it('initialization from base58 public key', () => {
      const decodedbs58Buffer: Buffer = bs58.decode(bs58Account.publicKey);
      const publicKeyHexString = decodedbs58Buffer.toString('hex');

      const keyPair = new Dot.KeyPair({ pub: bs58Account.publicKey });
      should.equal(keyPair.getKeys().pub, publicKeyHexString);
    });

    it('should be able to derive keypair with hardened derivation', () => {
      // using ed25519 (polkadot.js uses sr25519)
      const keyPair = new Dot.KeyPair({
        prv: account1.secretKey,
      });
      const derivationIndex = 0;
      const derived = keyPair.deriveHardened(`m/0'/0'/0'/${derivationIndex}'`);
      const derivedKeyPair = new Dot.KeyPair({
        prv: derived.prv || '',
      });
      should.exists(derivedKeyPair.getAddress());
      should.exists(derivedKeyPair.getKeys().prv);
      should.exists(derivedKeyPair.getKeys().pub);
      should.equal(derivedKeyPair.getKeys().prv?.length, 64);
      should.equal(derivedKeyPair.getKeys().pub?.length, 64);
    });
  });

  describe('KeyPair validation', () => {
    it('should fail to create from an invalid seed', () => {
      const seed = { seed: Buffer.alloc(8) }; //  Seed should be 512 bits (64 bytes)
      assert.throws(() => new Dot.KeyPair(seed), /bad seed size/);
    });

    it('should create from a valid seed', () => {
      const seed = { seed: Buffer.alloc(32) }; //  Seed should be 512 bits (64 bytes)
      should.doesNotThrow(() => new Dot.KeyPair(seed));
    });

    it('should fail to create from an invalid public key', () => {
      const source = {
        pub: '01D63D',
      };
      assert.throws(() => new Dot.KeyPair(source), /Expected a valid key to convert/);
    });

    it('should fail to create from an invalid private key', () => {
      const source = {
        prv: '82A34',
      };
      assert.throws(() => new Dot.KeyPair(source), /Invalid base32 characters/);
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

    it('should get an address with bs58 pub key', () => {
      const keyPair = new Dot.KeyPair({ pub: bs58Account.publicKey });
      const address = keyPair.getAddress();
      address.should.equal(bs58Account.address);
      utils.isValidAddress(address).should.equal(true);
    });

    it('should get a polkadot network address', () => {
      const keyPair = new Dot.KeyPair({ pub: bs58Account.publicKey });
      const address = keyPair.getAddress(AddressFormat.polkadot);
      address.should.equal(bs58Account.polkadotAddress);
      utils.isValidAddress(address).should.equal(true);
    });
  });

  describe('getSigningKeyPair', () => {
    it('should create a signing keypair', () => {
      const keyPair = new Dot.KeyPair({ prv: account1.secretKey });
      const address = keyPair.getAddress();
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
