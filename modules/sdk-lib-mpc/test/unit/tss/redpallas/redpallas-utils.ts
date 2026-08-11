import assert from 'assert';
import { generateRedPallasDKGKeyShares } from '../../../../src/tss/redpallas-mps/util';

describe('RedPallas Utility Functions', function () {
  describe('generateRedPallasDKGKeyShares', function () {
    const seedUser = Buffer.from('a304733c16cc821fe171d5c7dbd7276fd90deae808b7553d17a1e55e4a76b270', 'hex');
    const seedBackup = Buffer.from('9d91c2e6353202cf61f8f275158b3468e9a00f7872fc2fd310b72cd026e2e2f9', 'hex');
    const seedBitgo = Buffer.from('33c749b635cdba7f9fbf51ad0387431cde47e20d8dc13acd1f51a9a0ad06ebfe', 'hex');
    const dkgSeedUser = Buffer.from('b415844d27dd9320f282d6d8ecd8387f0e9fbf9198664e28a2f66e6f5b87c381', 'hex');
    const dkgSeedBackup = Buffer.from('ae02d3f7464313d0f72f9f3862694579fa11f8983fc3fe42183cd137e3f3f30a', 'hex');
    const dkgSeedBitgo = Buffer.from('44d85ab746decb8f0f0c62be0498542ddf58f31d9ed24bd1f62b1b1be17fce0f', 'hex');
    const derivationSeed = Buffer.from('c526955e37be0a0c8b77a831eb615948772b38df9f04d8c5a2e0e1f1d0c9b8a7', 'hex');

    it('should be deterministic with split encKey and dkgSeed', async function () {
      const split = {
        user: { encKey: seedUser, dkgSeed: dkgSeedUser },
        backup: { encKey: seedBackup, dkgSeed: dkgSeedBackup },
        bitgo: { encKey: seedBitgo, dkgSeed: dkgSeedBitgo },
      };
      const [user, backup, bitgo] = await generateRedPallasDKGKeyShares(
        derivationSeed,
        split.user,
        split.backup,
        split.bitgo
      );
      const [repeatUser] = await generateRedPallasDKGKeyShares(derivationSeed, split.user, split.backup, split.bitgo);

      const userPublicKey = user.getSharePublicKey().toString('hex');
      assert.strictEqual(userPublicKey, backup.getSharePublicKey().toString('hex'));
      assert.strictEqual(userPublicKey, bitgo.getSharePublicKey().toString('hex'));
      assert.strictEqual(userPublicKey, repeatUser.getSharePublicKey().toString('hex'));
    });

    it('should reject seeds shorter than 32 bytes', async function () {
      const okBackup = { encKey: seedBackup, dkgSeed: dkgSeedBackup };
      const okBitgo = { encKey: seedBitgo, dkgSeed: dkgSeedBitgo };
      await assert.rejects(
        generateRedPallasDKGKeyShares(
          derivationSeed,
          { encKey: Buffer.alloc(31), dkgSeed: dkgSeedUser },
          okBackup,
          okBitgo
        ),
        /encKey must be at least 32 bytes/
      );
      await assert.rejects(
        generateRedPallasDKGKeyShares(
          derivationSeed,
          { encKey: seedUser, dkgSeed: Buffer.alloc(31) },
          okBackup,
          okBitgo
        ),
        /dkgSeed must be at least 32 bytes/
      );
    });

    it('should produce distinct key shares per party with a shared public key', async function () {
      const [user, backup, bitgo] = await generateRedPallasDKGKeyShares(derivationSeed);

      const userShare = user.getKeyShare();
      const backupShare = backup.getKeyShare();
      const bitgoShare = bitgo.getKeyShare();

      assert.notStrictEqual(userShare.toString('hex'), backupShare.toString('hex'));
      assert.notStrictEqual(backupShare.toString('hex'), bitgoShare.toString('hex'));
      assert.strictEqual(user.getSharePublicKey().toString('hex'), backup.getSharePublicKey().toString('hex'));
      assert.strictEqual(backup.getSharePublicKey().toString('hex'), bitgo.getSharePublicKey().toString('hex'));
    });
  });
});
