import assert from 'assert';
import should from 'should';
import { KeyPair } from '../../../src/lib';
import * as testData from '../../resources/avaxp';

const pubKey = testData.ACCOUNT_1.pubkey;
const prvKey = testData.ACCOUNT_1.privkey;

describe('Avax P Key Pair', () => {
  describe('should create a valid KeyPair', () => {
    it('from an empty value', () => {
      const keyPair = new KeyPair();
      should.exists(keyPair.getKeys().prv);
      should.exists(keyPair.getKeys().pub);
      should.exists(keyPair.getKeys().pub);
    });

    it('from a seed', () => {
      const seed = testData.SEED_ACCOUNT.seed;
      const keyPairObj = new KeyPair({ seed: Buffer.from(seed, 'hex') });
      const keys = keyPairObj.getKeys();
      should.exists(keys.prv);
      should.exists(keys.pub);
      should.equal(keys.prv!, testData.SEED_ACCOUNT.privateKey);
      should.equal(keys.pub, testData.SEED_ACCOUNT.publicKey);

      const extendedKeys = keyPairObj.getExtendedKeys();
      should.exists(extendedKeys.xprv);
      should.exists(extendedKeys.xpub);
      should.equal(extendedKeys.xprv, testData.SEED_ACCOUNT.xPrivateKey);
      should.equal(extendedKeys.xpub, testData.SEED_ACCOUNT.xPublicKey);
    });

    it('from a xprv', () => {
      const keyPairObj = new KeyPair({ prv: testData.SEED_ACCOUNT.xPrivateKey });
      const keys = keyPairObj.getKeys();
      should.exists(keys.prv);
      should.exists(keys.pub);
      should.equal(keys.prv!, testData.SEED_ACCOUNT.privateKey);
      should.equal(keys.pub, testData.SEED_ACCOUNT.publicKey);

      const extendedKeys = keyPairObj.getExtendedKeys();
      should.exists(extendedKeys.xprv);
      should.exists(extendedKeys.xpub);
      should.equal(extendedKeys.xprv, testData.SEED_ACCOUNT.xPrivateKey);
      should.equal(extendedKeys.xpub, testData.SEED_ACCOUNT.xPublicKey);
    });

    it('from a xpub', () => {
      const keyPairObj = new KeyPair({ pub: testData.SEED_ACCOUNT.xPublicKey });
      const keys = keyPairObj.getKeys();
      should.not.exists(keys.prv);
      should.exists(keys.pub);
      should.equal(keys.pub, testData.SEED_ACCOUNT.publicKey);

      const extendedKeys = keyPairObj.getExtendedKeys();
      should.not.exists(extendedKeys.xprv);
      should.exists(extendedKeys.xpub);
      should.equal(extendedKeys.xpub, testData.SEED_ACCOUNT.xPublicKey);
    });

    it('from a public key', () => {
      const keyPair = new KeyPair({ pub: testData.ACCOUNT_3.pubkey });
      should.equal(keyPair.getKeys().pub, testData.ACCOUNT_3.pubkeyHex);
      should.exists(keyPair.getAddress());
    });

    it('from a public ke hex', () => {
      const keyPair = new KeyPair({ pub: testData.ACCOUNT_3.pubkeyHex });
      should.equal(keyPair.getKeys().pub, testData.ACCOUNT_3.pubkeyHex);
      should.exists(keyPair.getAddress());
    });

    it('from a private key', () => {
      const keyPair = new KeyPair({ prv: testData.ACCOUNT_3.privkey });
      should.equal(keyPair.getKeys().prv, testData.ACCOUNT_3.privkeyHex);
      should.equal(keyPair.getKeys().pub, testData.ACCOUNT_3.pubkeyHex);
      should.exists(keyPair.getAddress());
    });

    it('from a private key Hex', () => {
      const keyPair = new KeyPair({ prv: testData.ACCOUNT_3.privkeyHex });
      should.equal(keyPair.getKeys().prv, testData.ACCOUNT_3.privkeyHex);
      should.equal(keyPair.getKeys().pub, testData.ACCOUNT_3.pubkeyHex);
      should.exists(keyPair.getAddress());
    });

    it('Should get same address key for account 3 private key ', () => {
      const keyPair = new KeyPair({ prv: testData.ACCOUNT_3.privkey });
      should.equal(keyPair.getKeys().prv, testData.ACCOUNT_3.privkeyHex);
      should.equal(keyPair.getKeys().pub, testData.ACCOUNT_3.pubkeyHex);
      should.equal(keyPair.getAddress('testnet'), testData.ACCOUNT_3.address);
    });

    it('Should get same address key for account 3 private key hex ', () => {
      const keyPair = new KeyPair({ prv: testData.ACCOUNT_3.privkeyHex });
      should.equal(keyPair.getKeys().prv, testData.ACCOUNT_3.privkeyHex);
      should.equal(keyPair.getKeys().pub, testData.ACCOUNT_3.pubkeyHex);
      should.equal(keyPair.getAddress('testnet'), testData.ACCOUNT_3.address);
    });

    it('Should get same address key for account 4 private key ', () => {
      const keyPair = new KeyPair({ prv: testData.ACCOUNT_4.privkey });
      should.equal(keyPair.getKeys().prv, testData.ACCOUNT_4.privkeyHex);
      should.equal(keyPair.getKeys().pub, testData.ACCOUNT_4.pubkeyHex);
      should.equal(keyPair.getAddress('testnet'), testData.ACCOUNT_4.address);
    });

    it('Should get same address key for account 4 private key hex ', () => {
      const keyPair = new KeyPair({ prv: testData.ACCOUNT_4.privkeyHex });
      should.equal(keyPair.getKeys().prv, testData.ACCOUNT_4.privkeyHex);
      should.equal(keyPair.getKeys().pub, testData.ACCOUNT_4.pubkeyHex);
      should.equal(keyPair.getAddress('testnet'), testData.ACCOUNT_4.address);
    });
    describe('getAddress', function () {
      it('should get an address', () => {
        const seed = testData.SEED_ACCOUNT.seed;
        const keyPair = new KeyPair({ seed: Buffer.from(seed, 'hex') });
        const address = keyPair.getAddress();
        address.should.equal(testData.SEED_ACCOUNT.addressMainnet);
      });
    });

    it('without source', () => {
      const keyPair = new KeyPair();
      keyPair.getKeys().should.have.property('pub');
      keyPair.getKeys().should.have.property('prv');
    });
  });

  describe('should fail to create a KeyPair', () => {
    it('from an invalid public key', () => {
      assert.throws(
        () => new KeyPair({ pub: testData.INVALID_SHORT_KEYPAIR_KEY }),
        (e: any) => e.message === testData.INVALID_PUBLIC_KEY_ERROR_MESSAGE
      );
    });

    it('from an invalid private key', () => {
      assert.throws(
        () => new KeyPair({ prv: testData.INVALID_SHORT_KEYPAIR_KEY }),
        (e: any) => e.message === testData.INVALID_PRIVATE_KEY_ERROR_MESSAGE
      );
      assert.throws(
        () => {
          new KeyPair({ prv: testData.INVALID_LONG_KEYPAIR_PRV });
        },
        (e: any) => e.message === testData.INVALID_PRIVATE_KEY_ERROR_MESSAGE
      );
      assert.throws(
        () => new KeyPair({ prv: prvKey + pubKey }),
        (e: any) => e.message === testData.INVALID_PRIVATE_KEY_ERROR_MESSAGE
      );
    });
  });

  describe('verifyAddress', function () {
    it('should get and match mainnet address', () => {
      const seed = testData.SEED_ACCOUNT.seed;
      const keyPair = new KeyPair({ seed: Buffer.from(seed, 'hex') });
      const address = keyPair.getAddress();
      address.should.equal(testData.SEED_ACCOUNT.addressMainnet);

      const prv = testData.ACCOUNT_1.privkey;
      const keyPair2 = new KeyPair({ prv: prv });
      const address2 = keyPair2.getAddress();
      address2.should.equal(testData.ACCOUNT_1.addressMainnet);
    });

    it('should get and match testnet address', () => {
      const seed = testData.SEED_ACCOUNT.seed;
      const keyPair = new KeyPair({ seed: Buffer.from(seed, 'hex') });
      const address = keyPair.getAddress('testnet');
      address.should.equal(testData.SEED_ACCOUNT.addressTestnet);

      const prv = testData.ACCOUNT_1.privkey;
      const keyPair2 = new KeyPair({ prv: prv });
      const address2 = keyPair2.getAddress('testnet');
      address2.should.equal(testData.ACCOUNT_1.addressTestnet);
    });
  });
});
