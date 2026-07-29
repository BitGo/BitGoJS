import assert from 'assert';
import { ed25519 } from '@noble/curves/ed25519';
import { EddsaMPSDkg, EddsaMPSDsg, MPSUtil } from '../../../../src/tss/eddsa-mps';
import { concatBytes, generateEdDsaDKGKeyShares } from '../../../../src/tss/eddsa-mps/util';

describe('EdDSA Utility Functions', function () {
  describe('concatBytes', function () {
    it('should concatenate Uint8Array arrays correctly', function () {
      const arr1 = new Uint8Array([1, 2, 3]);
      const arr2 = new Uint8Array([4, 5, 6]);
      const arr3 = new Uint8Array([7, 8, 9]);

      const result = concatBytes([arr1, arr2, arr3]);
      const expected = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9]);

      assert.deepStrictEqual(result, expected, 'concatBytes should concatenate arrays correctly');
    });
  });

  describe('generateEdDsaDKGKeyShares', function () {
    const seedUser = Buffer.from('a304733c16cc821fe171d5c7dbd7276fd90deae808b7553d17a1e55e4a76b270', 'hex');
    const seedBackup = Buffer.from('9d91c2e6353202cf61f8f275158b3468e9a00f7872fc2fd310b72cd026e2e2f9', 'hex');
    const seedBitgo = Buffer.from('33c749b635cdba7f9fbf51ad0387431cde47e20d8dc13acd1f51a9a0ad06ebfe', 'hex');
    const dkgSeedUser = Buffer.from('b415844d27dd9320f282d6d8ecd8387f0e9fbf9198664e28a2f66e6f5b87c381', 'hex');
    const dkgSeedBackup = Buffer.from('ae02d3f7464313d0f72f9f3862694579fa11f8983fc3fe42183cd137e3f3f30a', 'hex');
    const dkgSeedBitgo = Buffer.from('44d85ab746decb8f0f0c62be0498542ddf58f31d9ed24bd1f62b1b1be17fce0f', 'hex');

    it('should be deterministic with split encKey and dkgSeed', async function () {
      const split = {
        user: { encKey: seedUser, dkgSeed: dkgSeedUser },
        backup: { encKey: seedBackup, dkgSeed: dkgSeedBackup },
        bitgo: { encKey: seedBitgo, dkgSeed: dkgSeedBitgo },
      };
      const [user, backup, bitgo] = await generateEdDsaDKGKeyShares(split.user, split.backup, split.bitgo);
      const [repeatUser] = await generateEdDsaDKGKeyShares(split.user, split.backup, split.bitgo);

      const userPublicKey = user.getSharePublicKey().toString('hex');
      assert.strictEqual(userPublicKey, backup.getSharePublicKey().toString('hex'));
      assert.strictEqual(userPublicKey, bitgo.getSharePublicKey().toString('hex'));
      assert.strictEqual(userPublicKey, repeatUser.getSharePublicKey().toString('hex'));
    });

    it('should reject seeds shorter than 32 bytes', async function () {
      const okBackup = { encKey: seedBackup, dkgSeed: dkgSeedBackup };
      const okBitgo = { encKey: seedBitgo, dkgSeed: dkgSeedBitgo };
      await assert.rejects(
        generateEdDsaDKGKeyShares({ encKey: Buffer.alloc(31), dkgSeed: dkgSeedUser }, okBackup, okBitgo),
        /encKey must be at least 32 bytes/
      );
      await assert.rejects(
        generateEdDsaDKGKeyShares({ encKey: seedUser, dkgSeed: Buffer.alloc(31) }, okBackup, okBitgo),
        /dkgSeed must be at least 32 bytes/
      );
    });
  });

  describe('executeTillRound', function () {
    const MESSAGE = Buffer.from('The Times 03/Jan/2009 Chancellor on brink of second bailout for banks');

    let userDkg: EddsaMPSDkg.DKG;
    let keySharesByIdx: [Buffer, Buffer, Buffer];
    let dkgPubKey: Buffer;

    before(async function () {
      const [user, backup, bitgo] = await generateEdDsaDKGKeyShares();
      userDkg = user;
      keySharesByIdx = [user.getKeyShare(), backup.getKeyShare(), bitgo.getKeyShare()];
      dkgPubKey = user.getSharePublicKey();
    });

    // All three 2-of-3 signing combinations: user+backup, user+BitGo, backup+BitGo.
    const PARTY_PAIRS: Array<[number, number]> = [
      [0, 1],
      [0, 2],
      [1, 2],
    ];

    PARTY_PAIRS.forEach(([p1, p2]) => {
      it(`should produce a valid signature verifying under the DKG public key for parties ${p1}+${p2}`, async function () {
        const sig = (await MPSUtil.executeTillRound(
          3,
          new EddsaMPSDsg.DSG(p1),
          new EddsaMPSDsg.DSG(p2),
          keySharesByIdx[p1],
          keySharesByIdx[p2],
          MESSAGE,
          'm'
        )) as Buffer;
        assert.strictEqual(sig.length, 64);
        assert(ed25519.verify(sig, MESSAGE, dkgPubKey));
      });
    });

    it('should verify round-3 signature against root public key from getCommonKeychain()', async function () {
      const sig = (await MPSUtil.executeTillRound(
        3,
        new EddsaMPSDsg.DSG(0),
        new EddsaMPSDsg.DSG(2),
        keySharesByIdx[0],
        keySharesByIdx[2],
        MESSAGE,
        'm'
      )) as Buffer;
      const rootPubKey = Buffer.from(userDkg.getCommonKeychain().slice(0, 64), 'hex');
      assert(ed25519.verify(sig, MESSAGE, rootPubKey), 'should verify under root public key from getCommonKeychain()');
    });

    it('should not verify under the root public key when signing at a derived path (m/0/0)', async function () {
      const sig = (await MPSUtil.executeTillRound(
        3,
        new EddsaMPSDsg.DSG(0),
        new EddsaMPSDsg.DSG(2),
        keySharesByIdx[0],
        keySharesByIdx[2],
        MESSAGE,
        'm/0/0'
      )) as Buffer;
      assert.strictEqual(sig.length, 64, 'Derived path signature must be 64 bytes');
      const rootPubKey = Buffer.from(userDkg.getCommonKeychain().slice(0, 64), 'hex');
      assert(
        !ed25519.verify(sig, MESSAGE, rootPubKey),
        'derived-path signature should not verify under root public key'
      );
    });

    it('should return message arrays (not a Buffer) for intermediate round 1', async function () {
      const result = await MPSUtil.executeTillRound(
        1,
        new EddsaMPSDsg.DSG(0),
        new EddsaMPSDsg.DSG(2),
        keySharesByIdx[0],
        keySharesByIdx[2],
        MESSAGE,
        'm'
      );
      assert(!Buffer.isBuffer(result), 'round 1 should return message arrays, not a Buffer');
      assert.strictEqual(result.length, 2, 'should contain message arrays for both parties');
    });

    it('should return message arrays (not a Buffer) for intermediate round 2', async function () {
      const result = await MPSUtil.executeTillRound(
        2,
        new EddsaMPSDsg.DSG(0),
        new EddsaMPSDsg.DSG(2),
        keySharesByIdx[0],
        keySharesByIdx[2],
        MESSAGE,
        'm'
      );
      assert(!Buffer.isBuffer(result), 'round 2 should return message arrays, not a Buffer');
      assert.strictEqual(result.length, 2, 'should contain message arrays for both parties');
    });

    it('should throw for round out of range', async function () {
      const dsg1 = new EddsaMPSDsg.DSG(0);
      const dsg2 = new EddsaMPSDsg.DSG(2);
      await assert.rejects(
        MPSUtil.executeTillRound(0, dsg1, dsg2, keySharesByIdx[0], keySharesByIdx[2], MESSAGE, 'm'),
        /Invalid round number/
      );
      await assert.rejects(
        MPSUtil.executeTillRound(4, dsg1, dsg2, keySharesByIdx[0], keySharesByIdx[2], MESSAGE, 'm'),
        /Invalid round number/
      );
    });
  });
});
