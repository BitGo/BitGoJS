import assert from 'assert';
import { EddsaKeyDeriver } from '@bitgo/sdk-core';
import { data } from '../../resources/eddsaKeyDeriver';

describe('EddsaKeyDeriver', () => {
  describe('createRootKeys', () => {
    it('should create root keys without seed', async () => {
      const rootKeys = await EddsaKeyDeriver.createRootKeys();

      assert.ok(rootKeys.prv);
      assert.equal(rootKeys.prv.length, data.rootKeys1.prv.length);
      assert.ok(rootKeys.prv.startsWith(EddsaKeyDeriver.ROOT_PRV_KEY_PREFIX));
      assert.ok(rootKeys.pub);
      assert.equal(rootKeys.pub.length, data.rootKeys1.pub.length);
      assert.ok(rootKeys.pub.startsWith(EddsaKeyDeriver.ROOT_PUB_KEY_PREFIX));
    });

    it('should create root keys with seed', async () => {
      const seed = Buffer.from(data.seed.validSeed, 'hex');
      const rootKeys = await EddsaKeyDeriver.createRootKeys(seed);

      assert.ok(rootKeys.prv);
      assert.equal(rootKeys.prv, data.seed.expectedRootKeys.prv);
      assert.ok(rootKeys.pub);
      assert.equal(rootKeys.pub, data.seed.expectedRootKeys.pub);
    });

    it('should throw for invalid seed', async () => {
      const seed = Buffer.from('asdf12f1', 'hex');

      assert.rejects(
        async () => {
          await EddsaKeyDeriver.createRootKeys(seed);
        },
        { message: 'Invalid seed' },
      );
    });
  });

  describe('deriveKeyWithSeed', () => {
    const seed = 'seed123';
    const expectedPath = 'm/999999/240510315/85914100';
    it('should derive a pub key and path from for root public key with seed', async () => {
      const rootPubKey = data.rootKeys1.pub;

      const derivedKey = await EddsaKeyDeriver.deriveKeyWithSeed(rootPubKey, seed);

      assert.equal(derivedKey.key.length, 64);
      assert.equal(derivedKey.key, data.rootKeys1.derivedPub);
      assert.equal(derivedKey.derivationPath, expectedPath);
    });

    it('should derive a private key and path from for root private key with seed', async () => {
      const rootPrvKey = data.rootKeys1.prv;

      const derivedKey = await EddsaKeyDeriver.deriveKeyWithSeed(rootPrvKey, seed);

      assert.equal(derivedKey.key.length, 128);
      assert.equal(derivedKey.key, data.rootKeys1.derivedPrv);
      assert.equal(derivedKey.derivationPath, expectedPath);
    });

    it('should throw an error for invalid key format', async () => {
      const invalidKey = 'invalid:key:format';

      await assert.rejects(
        async () => {
          await EddsaKeyDeriver.deriveKeyWithSeed(invalidKey, seed);
        },
        { message: 'Invalid key format' },
      );
    });
  });
});
