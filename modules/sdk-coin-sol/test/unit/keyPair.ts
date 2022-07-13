import assert from 'assert';
import { KeyPair } from '../../src';
import should from 'should';
import * as testData from '../resources/sol';
import { isValidPublicKey, isValidAddress, isValidPrivateKey } from '../../src/lib/utils';

describe('Sol KeyPair', function () {
  const defaultSeed = { seed: testData.accountWithSeed.seed };

  describe('should create a valid KeyPair', () => {
    it('from an empty value', () => {
      const keyPair = new KeyPair();
      should.exists(keyPair.getKeys().prv);
      should.exists(keyPair.getKeys().pub);
      keyPair.getKeys().prv?.length.should.be.belowOrEqual(88);
      keyPair.getKeys().prv?.length.should.be.aboveOrEqual(76);
      keyPair.getKeys().pub.length.should.be.belowOrEqual(44);
      keyPair.getKeys().pub.length.should.be.aboveOrEqual(32);
    });

    it('from a private key', () => {
      const keyPair = new KeyPair({ prv: testData.accountWithSeed.privateKey.base58 });
      should.equal(keyPair.getKeys().pub, testData.accountWithSeed.publicKey);
      should.equal(keyPair.getKeys().prv, testData.accountWithSeed.privateKey.base58);
      should.equal(keyPair.getKeys(true).pub, testData.accountWithSeed.publicKey);
      should.deepEqual(keyPair.getKeys(true).prv, testData.accountWithSeed.privateKey.uint8Array);
    });

    it('from an public key', () => {
      const keyPair = new KeyPair({ pub: testData.accountWithSeed.publicKey });
      should.equal(keyPair.getKeys().pub, testData.accountWithSeed.publicKey);
    });

    it('should always generate and regenerate valid key pairs', () => {
      for (let i = 0; i < 50; i++) {
        const keyPair = new KeyPair();
        isValidPublicKey(keyPair.getKeys().pub).should.be.true();
        isValidAddress(keyPair.getAddress()).should.be.true();

        const prv = keyPair.getKeys().prv as string;
        should.exist(prv);

        // verify key pair can be re-generated from private portion
        const regeneratedKeyPairFromPrv = new KeyPair({ prv: prv });
        regeneratedKeyPairFromPrv.getKeys().should.deepEqual(keyPair.getKeys());
        regeneratedKeyPairFromPrv.getAddress().should.equal(keyPair.getAddress());
        regeneratedKeyPairFromPrv.should.deepEqual(keyPair);
        should.exist(regeneratedKeyPairFromPrv.getKeys().prv);

        // verify key pair can be re-generated from public portion
        const pub = keyPair.getKeys().pub;
        const regeneratedKeyPairFromPub = new KeyPair({ pub: pub });
        regeneratedKeyPairFromPub.getKeys().pub.should.deepEqual(keyPair.getKeys().pub);
        regeneratedKeyPairFromPub.getAddress().should.equal(keyPair.getAddress());
        should.not.exist(regeneratedKeyPairFromPub.getKeys().prv);
      }
    });
  });

  describe('should fail to create a KeyPair', function () {
    it('from invalid options', () => {
      // @ts-expect-error Testing for an params, should throw error
      should(() => new KeyPair({ random: 'random' })).throwError('Invalid key pair options');
    });

    it('from an invalid seed', () => {
      const seed = { seed: Buffer.alloc(8) }; //  Seed should be 512 bits (64 bytes)
      assert.throws(() => new KeyPair(seed));
    });

    it('from an invalid public key', () => {
      const source = {
        pub: '01D63D',
      };
      assert.throws(() => new KeyPair(source));
    });

    it('from an invalid private key', () => {
      const source = {
        prv: '82A34E',
      };
      assert.throws(() => new KeyPair(source));
    });
  });

  describe('getAddress', function () {
    it('should get an address', () => {
      const keyPair = new KeyPair(defaultSeed);
      const address = keyPair.getAddress();
      address.should.equal(testData.accountWithSeed.publicKey);
    });
  });

  describe('getKeys', function () {
    it('should get public keys in base58 and private in Uint8Array', () => {
      const keyPair = new KeyPair(defaultSeed);
      const { prv, pub } = keyPair.getKeys(true);
      prv?.should.deepEqual(testData.accountWithSeed.privateKey.uint8Array);
      pub.should.equal(testData.accountWithSeed.publicKey);
    });

    it('should get private and public keys base58', () => {
      const keyPair = new KeyPair(defaultSeed);
      const { prv, pub } = keyPair.getKeys();
      prv?.should.equal(testData.accountWithSeed.privateKey.base58);
      pub.should.equal(testData.accountWithSeed.publicKey);
    });

    it('should get private and public keys for a random seed', () => {
      const keyPair = new KeyPair();
      const { prv, pub } = keyPair.getKeys();
      should.exist(prv);
      should.exist(pub);
    });
  });

  describe('signMessage and verifySignature', function () {
    const message = 'test message pls ignore';

    it('should succeed to sign a msg ', () => {
      const keyPair = new KeyPair({ prv: testData.accountWithSeed.privateKey.base58 });
      const signedMessage = keyPair.signMessage(message);
      signedMessage.should.deepEqual(testData.SIGNED_MESSAGE_SIGNATURE);
    });

    it('should fail to sign a msg if prv key is missing', () => {
      const keyPair = new KeyPair({ pub: testData.pubKeys.validPubKeys[0] });
      should(() => keyPair.signMessage(message)).throwError('Missing private key');
    });
  });

  describe('verifySignature', function () {
    it('should succeed to verify a signature', () => {
      const keyPair = new KeyPair({ prv: testData.accountWithSeed.privateKey.base58 });
      const signature = testData.SIGNED_MESSAGE_SIGNATURE;
      const message = 'test message pls ignore';
      keyPair.verifySignature(message, signature).should.equal(true);
    });

    it('should succeed to verify a signature if the msg is a UInt8Array', () => {
      const keyPair = new KeyPair({ prv: testData.accountWithSeed.privateKey.base58 });
      const signature = testData.SIGNED_MESSAGE_SIGNATURE;
      const message = new Uint8Array(Buffer.from('test message pls ignore'));
      keyPair.verifySignature(message, signature).should.equal(true);
    });

    it('should fail to verify a signature if the prv key is not correct', () => {
      const keyPair = new KeyPair({ prv: testData.extraAccounts.prv1 });
      const signature = testData.SIGNED_MESSAGE_SIGNATURE;
      const message = 'test message pls ignore';
      keyPair.verifySignature(message, signature).should.equal(false);
    });

    it('should fail to verify a signature if the message is not correct', () => {
      const keyPair = new KeyPair({ prv: testData.accountWithSeed.privateKey.base58 });
      const signature = testData.SIGNED_MESSAGE_SIGNATURE;
      const message = 'incorrect msg';
      keyPair.verifySignature(message, signature).should.equal(false);
    });
  });

  describe('deriveHardened', () => {
    it('should derive child key pairs', () => {
      const rootKeyPair = new KeyPair();
      for (let i = 0; i < 50; i++) {
        const path = `m/0'/0'/0'/${i}'`;
        const derived = new KeyPair(rootKeyPair.deriveHardened(path));

        isValidPublicKey(derived.getKeys().pub).should.be.true();
        isValidAddress(derived.getAddress()).should.be.true();

        const derivedPrv = derived.getKeys().prv;
        should.exist(derivedPrv);
        isValidPrivateKey(derivedPrv as string | Uint8Array).should.be.true();

        const rederived = new KeyPair(rootKeyPair.deriveHardened(path));
        rederived.getKeys().should.deepEqual(derived.getKeys());
      }
    });

    it('should not be able to derive without private key', () => {
      const rootKeyPair = new KeyPair({ pub: testData.accountWithSeed.publicKey });
      assert.throws(() => rootKeyPair.deriveHardened("m/0'/0'/0'/0'"), /need private key to derive hardened keypair/);
    });

    it('should throw error for non-hardened path', () => {
      const rootKeyPair = new KeyPair();
      assert.throws(() => rootKeyPair.deriveHardened('m/0/0/0/0'), /Invalid derivation path/);
    });
  });
});
