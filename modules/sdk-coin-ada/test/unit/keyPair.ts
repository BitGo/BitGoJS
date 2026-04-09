import should from 'should';
import { KeyPair } from '../../src';
import { enterpriseAccounts } from '../resources/';
import { PrivateKey, PublicKey } from '@emurgo/cardano-serialization-lib-nodejs';
import { AddressFormat, toHex } from '@bitgo/sdk-core';

describe('Ada Keypair', () => {
  const defaultSeed = { seed: Buffer.alloc(32) };

  describe('Keypair creation', () => {
    it('initial state', () => {
      const keyPair = new KeyPair();
      should.exists(keyPair.getKeys().prv);
      should.exists(keyPair.getKeys().prv);
    });

    it('initialization from private key', () => {
      let keyPair = new KeyPair({
        prv: enterpriseAccounts.account1.secretKey,
      });

      should.equal(
        keyPair.getKeys().prv,
        toHex(PrivateKey.from_bech32(enterpriseAccounts.account1.secretKey).as_bytes())
      );

      should.equal(keyPair.getKeys().pub, enterpriseAccounts.account1.hexPublic);

      keyPair = new KeyPair({
        prv: enterpriseAccounts.account2.secretKey,
      });

      should.equal(
        keyPair.getKeys().prv,
        toHex(PrivateKey.from_bech32(enterpriseAccounts.account2.secretKey).as_bytes())
      );
      should.equal(keyPair.getKeys().pub, enterpriseAccounts.account2.hexPublic);
    });

    it('initialization from public key', () => {
      let keyPair = new KeyPair({ pub: enterpriseAccounts.account1.publicKey });

      should.equal(
        keyPair.getKeys().pub,
        toHex(PublicKey.from_bech32(enterpriseAccounts.account1.publicKey).as_bytes())
      );

      keyPair = new KeyPair({ pub: enterpriseAccounts.account2.publicKey });
      should.equal(keyPair.getAddress(AddressFormat.testnet), enterpriseAccounts.account2.baseAddress);

      keyPair = new KeyPair({ pub: enterpriseAccounts.account4.publicKeyHex });
      should.equal(keyPair.getKeys().pub, enterpriseAccounts.account4.publicKeyHex);
    });
  });

  describe('KeyPair validation', () => {
    it('should fail to create from an invalid seed', () => {
      const seed = { seed: Buffer.alloc(8) }; //  Seed should be 512 bits (64 bytes)
      should.throws(() => new KeyPair(seed), 'bad seed size');
    });

    it('should fail to create from an invalid public key', () => {
      const source = {
        pub: '01D63D',
      };
      should.throws(() => new KeyPair(source), 'address seems to be malformed');
    });

    it('should fail to create from an invalid private key', () => {
      const source = {
        prv: '82A34',
      };
      should.throws(() => new KeyPair(source), 'Invalid base32 characters');
    });
  });

  describe('getAddress', () => {
    it('should get an address', () => {
      let keyPair = new KeyPair({ prv: enterpriseAccounts.account1.secretKey });
      let address = keyPair.getAddress(AddressFormat.testnet);
      address.should.equal(enterpriseAccounts.account1.baseAddress);

      keyPair = new KeyPair({ prv: enterpriseAccounts.account3.secretKey });
      address = keyPair.getAddress(AddressFormat.testnet);
      address.should.equal(enterpriseAccounts.account3.baseAddress);

      keyPair = new KeyPair({ pub: enterpriseAccounts.account4.publicKeyHex });
      address = keyPair.getAddress(AddressFormat.testnet);
      address.should.equal(enterpriseAccounts.account4.baseAddress);
    });
  });

  describe('getKeys', () => {
    it('should get private and public keys in the protocol default format', () => {
      const keyPair = new KeyPair(defaultSeed);
      const { prv, pub } = keyPair.getKeys();

      prv!.should.equal(prv);
      pub.should.equal(pub);
      const address = keyPair.getAddress(AddressFormat.testnet);
      address.should.equal(enterpriseAccounts.seedAccount.enterpriseAddress);
    });

    it('should get private and public keys for a random seed', () => {
      const keyPair = new KeyPair();
      const { prv, pub } = keyPair.getKeys();
      should.exist(prv);
      should.exist(pub);
    });
  });
});
