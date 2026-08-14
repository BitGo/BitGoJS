import assert from 'assert';
import crypto, { createHash } from 'crypto';
import { x25519 } from '@noble/curves/ed25519';
import { EddsaMPSDkg, MPSTypes, type EddsaRetrofitData } from '../../../../src/tss/eddsa-mps';
import { generateEdDsaDKGKeyShares } from './util';
import { Ed25519Curve } from '../../../../src/curves/ed25519';
import { Shamir } from '../../../../src/shamir/shamir';
import {
  bigIntFromBufferLE,
  bigIntToBufferLE,
  bigIntFromBufferBE,
  bigIntToBufferBE,
  clamp,
} from '../../../../src/util';

function makeKeypair(seed?: Buffer) {
  const privKey = seed ? Buffer.from(seed.subarray(0, 32)) : crypto.randomBytes(32);
  const pubKey = Buffer.from(x25519.getPublicKey(privKey));
  return { privKey, pubKey };
}

describe('EdDSA MPS DKG', function () {
  let user: EddsaMPSDkg.DKG;
  let backup: EddsaMPSDkg.DKG;
  let bitgo: EddsaMPSDkg.DKG;
  let userKP: { privKey: Buffer; pubKey: Buffer };
  let backupKP: { privKey: Buffer; pubKey: Buffer };
  let bitgoKP: { privKey: Buffer; pubKey: Buffer };

  beforeEach(function () {
    user = new EddsaMPSDkg.DKG(3, 2, 0);
    backup = new EddsaMPSDkg.DKG(3, 2, 1);
    bitgo = new EddsaMPSDkg.DKG(3, 2, 2);

    userKP = makeKeypair();
    backupKP = makeKeypair();
    bitgoKP = makeKeypair();
  });

  describe('DKG Initialization', function () {
    it('should initialize DKG sessions for all parties', async function () {
      await user.initDkg(userKP.privKey, [backupKP.pubKey, bitgoKP.pubKey]);
      await backup.initDkg(backupKP.privKey, [userKP.pubKey, bitgoKP.pubKey]);
      await bitgo.initDkg(bitgoKP.privKey, [userKP.pubKey, backupKP.pubKey]);

      const userMessage = user.getFirstMessage();
      const backupMessage = backup.getFirstMessage();
      const bitgoMessage = bitgo.getFirstMessage();

      assert(userMessage.payload.length > 0, 'User first message should have payload');
      assert(backupMessage.payload.length > 0, 'Backup first message should have payload');
      assert(bitgoMessage.payload.length > 0, 'BitGo first message should have payload');

      assert.strictEqual(userMessage.from, 0, 'User message should be from party 0');
      assert.strictEqual(backupMessage.from, 1, 'Backup message should be from party 1');
      assert.strictEqual(bitgoMessage.from, 2, 'BitGo message should be from party 2');
    });

    it('should throw error when DKG session is not initialized', function () {
      assert.throws(() => {
        user.getFirstMessage();
      }, /DKG session not initialized/);

      assert.throws(() => {
        user.handleIncomingMessages([]);
      }, /DKG session not initialized/);

      assert.throws(() => {
        user.getKeyShare();
      }, /DKG session not initialized/);
    });
  });

  describe('DKG Protocol Execution', function () {
    beforeEach(async function () {
      await user.initDkg(userKP.privKey, [backupKP.pubKey, bitgoKP.pubKey]);
      await backup.initDkg(backupKP.privKey, [userKP.pubKey, bitgoKP.pubKey]);
      await bitgo.initDkg(bitgoKP.privKey, [userKP.pubKey, backupKP.pubKey]);
    });

    it('should complete full DKG protocol and generate key shares', async function () {
      const r1Messages = [user.getFirstMessage(), backup.getFirstMessage(), bitgo.getFirstMessage()];

      assert.strictEqual(r1Messages.length, 3, 'Should have 3 round 1 messages');
      r1Messages.forEach((msg, index) => {
        assert.strictEqual(msg.from, index, `Message ${index} should be from party ${index}`);
        assert(msg.payload.length > 0, `Message ${index} should have payload`);
      });

      const r2Messages = [
        ...user.handleIncomingMessages(r1Messages),
        ...backup.handleIncomingMessages(r1Messages),
        ...bitgo.handleIncomingMessages(r1Messages),
      ];

      assert.strictEqual(r2Messages.length, 3, 'Should have 3 round 2 messages');
      r2Messages.forEach((msg) => {
        assert(msg.payload.length > 0, 'Round 2 message should have payload');
      });

      const r3Messages = [
        ...user.handleIncomingMessages(r2Messages),
        ...backup.handleIncomingMessages(r2Messages),
        ...bitgo.handleIncomingMessages(r2Messages),
      ];

      assert.strictEqual(r3Messages.length, 0, 'Round 3 should produce no output messages');

      const userKeyShare = user.getKeyShare();
      const backupKeyShare = backup.getKeyShare();
      const bitgoKeyShare = bitgo.getKeyShare();

      assert(Buffer.isBuffer(userKeyShare) && userKeyShare.length > 0, 'User key share should be non-empty Buffer');
      assert(
        Buffer.isBuffer(backupKeyShare) && backupKeyShare.length > 0,
        'Backup key share should be non-empty Buffer'
      );
      assert(Buffer.isBuffer(bitgoKeyShare) && bitgoKeyShare.length > 0, 'BitGo key share should be non-empty Buffer');
    });

    it('should generate consistent public keys across all parties', async function () {
      const r1Messages = [user.getFirstMessage(), backup.getFirstMessage(), bitgo.getFirstMessage()];
      const r2Messages = [
        ...user.handleIncomingMessages(r1Messages),
        ...backup.handleIncomingMessages(r1Messages),
        ...bitgo.handleIncomingMessages(r1Messages),
      ];
      user.handleIncomingMessages(r2Messages);
      backup.handleIncomingMessages(r2Messages);
      bitgo.handleIncomingMessages(r2Messages);

      const userPk = user.getSharePublicKey().toString('hex');
      const backupPk = backup.getSharePublicKey().toString('hex');
      const bitgoPk = bitgo.getSharePublicKey().toString('hex');

      assert.strictEqual(userPk, backupPk, 'User and backup should agree on public key');
      assert.strictEqual(backupPk, bitgoPk, 'Backup and BitGo should agree on public key');
    });
  });

  describe('Seed-based Key Generation', function () {
    it('should create key shares with deterministic seeds', async function () {
      const seedUser = Buffer.from('a304733c16cc821fe171d5c7dbd7276fd90deae808b7553d17a1e55e4a76b270', 'hex');
      const seedBackup = Buffer.from('9d91c2e6353202cf61f8f275158b3468e9a00f7872fc2fd310b72cd026e2e2f9', 'hex');
      const seedBitgo = Buffer.from('33c749b635cdba7f9fbf51ad0387431cde47e20d8dc13acd1f51a9a0ad06ebfe', 'hex');
      const userParty = { encKey: seedUser, dkgSeed: seedUser };
      const backupParty = { encKey: seedBackup, dkgSeed: seedBackup };
      const bitgoParty = { encKey: seedBitgo, dkgSeed: seedBitgo };

      const [user1, backup1, bitgo1] = await generateEdDsaDKGKeyShares(userParty, backupParty, bitgoParty);

      const pk0 = user1.getSharePublicKey().toString('hex');
      const pk1 = backup1.getSharePublicKey().toString('hex');
      const pk2 = bitgo1.getSharePublicKey().toString('hex');
      assert.strictEqual(pk0, pk1, 'User and backup should have same public key');
      assert.strictEqual(pk1, pk2, 'Backup and BitGo should have same public key');

      const [user2] = await generateEdDsaDKGKeyShares(userParty, backupParty, bitgoParty);
      assert.strictEqual(
        user1.getSharePublicKey().toString('hex'),
        user2.getSharePublicKey().toString('hex'),
        'Same seeds should produce same public key'
      );
    });

    it('should create different key shares with different seeds', async function () {
      const seedAUser = Buffer.from('a304733c16cc821fe171d5c7dbd7276fd90deae808b7553d17a1e55e4a76b270', 'hex');
      const seedABackup = Buffer.from('9d91c2e6353202cf61f8f275158b3468e9a00f7872fc2fd310b72cd026e2e2f9', 'hex');
      const seedABitgo = Buffer.from('33c749b635cdba7f9fbf51ad0387431cde47e20d8dc13acd1f51a9a0ad06ebfe', 'hex');
      const seedBUser = Buffer.from('b415844d27dd9320f282d6d8ecd8387f0e9fbf9198664e28a2f66e6f5b87c381', 'hex');
      const seedBBackup = Buffer.from('ae02d3f7464313d0f72f9f3862694579fa11f8983fc3fe42183cd137e3f3f30a', 'hex');
      const seedBBitgo = Buffer.from('44d85ab746decb8f0f0c62be0498542ddf58f31d9ed24bd1f62b1b1be17fce0f', 'hex');

      const [user1] = await generateEdDsaDKGKeyShares(
        { encKey: seedAUser, dkgSeed: seedAUser },
        { encKey: seedABackup, dkgSeed: seedABackup },
        { encKey: seedABitgo, dkgSeed: seedABitgo }
      );
      const [user2] = await generateEdDsaDKGKeyShares(
        { encKey: seedBUser, dkgSeed: seedBUser },
        { encKey: seedBBackup, dkgSeed: seedBBackup },
        { encKey: seedBBitgo, dkgSeed: seedBBitgo }
      );

      assert.notStrictEqual(
        user1.getSharePublicKey().toString('hex'),
        user2.getSharePublicKey().toString('hex'),
        'Different seeds should produce different public keys'
      );
    });

    it('should create key shares without seeds (random)', async function () {
      const [user, backup, bitgo] = await generateEdDsaDKGKeyShares();

      const userPk = user.getSharePublicKey().toString('hex');
      const backupPk = backup.getSharePublicKey().toString('hex');
      const bitgoPk = bitgo.getSharePublicKey().toString('hex');

      assert.strictEqual(userPk, backupPk, 'User and backup should agree on public key');
      assert.strictEqual(backupPk, bitgoPk, 'Backup and BitGo should agree on public key');
    });

    it('should generate valid reduced key shares', async function () {
      const [user, backup, bitgo] = await generateEdDsaDKGKeyShares();

      const userReduced = user.getReducedKeyShare();
      const backupReduced = backup.getReducedKeyShare();
      const bitgoReduced = bitgo.getReducedKeyShare();

      assert(Buffer.isBuffer(userReduced) && userReduced.length > 0, 'User reduced key share should be non-empty');
      assert(
        Buffer.isBuffer(backupReduced) && backupReduced.length > 0,
        'Backup reduced key share should be non-empty'
      );
      assert(Buffer.isBuffer(bitgoReduced) && bitgoReduced.length > 0, 'BitGo reduced key share should be non-empty');

      const userDecoded = MPSTypes.getDecodedReducedKeyShare(userReduced);
      const backupDecoded = MPSTypes.getDecodedReducedKeyShare(backupReduced);
      const bitgoDecoded = MPSTypes.getDecodedReducedKeyShare(bitgoReduced);

      const userPub = Buffer.from(userDecoded.pub).toString('hex');
      const backupPub = Buffer.from(backupDecoded.pub).toString('hex');
      const bitgoPub = Buffer.from(bitgoDecoded.pub).toString('hex');

      assert.strictEqual(userPub, backupPub, 'User and backup should have same public key in reduced share');
      assert.strictEqual(backupPub, bitgoPub, 'Backup and BitGo should have same public key in reduced share');

      // keyShare must be present and non-empty (opaque WASM bincode needed for DSG)
      assert(userDecoded.keyShare.length > 0, 'User reduced share must include keyShare');
      assert(backupDecoded.keyShare.length > 0, 'Backup reduced share must include keyShare');
      assert(bitgoDecoded.keyShare.length > 0, 'BitGo reduced share must include keyShare');

      // rootChainCode must be 32 bytes
      assert.strictEqual(userDecoded.rootChainCode.length, 32, 'User rootChainCode must be 32 bytes');
      assert.strictEqual(backupDecoded.rootChainCode.length, 32, 'Backup rootChainCode must be 32 bytes');
      assert.strictEqual(bitgoDecoded.rootChainCode.length, 32, 'BitGo rootChainCode must be 32 bytes');

      // All parties derive the same chaincode
      assert.strictEqual(
        Buffer.from(userDecoded.rootChainCode).toString('hex'),
        Buffer.from(backupDecoded.rootChainCode).toString('hex'),
        'User and backup should have same rootChainCode'
      );
      assert.strictEqual(
        Buffer.from(backupDecoded.rootChainCode).toString('hex'),
        Buffer.from(bitgoDecoded.rootChainCode).toString('hex'),
        'Backup and BitGo should have same rootChainCode'
      );
    });
  });

  describe('Message Serialization', function () {
    it('should serialize and deserialize messages round-trip', async function () {
      userKP = makeKeypair();
      backupKP = makeKeypair();
      bitgoKP = makeKeypair();
      await user.initDkg(userKP.privKey, [backupKP.pubKey, bitgoKP.pubKey]);
      await backup.initDkg(backupKP.privKey, [userKP.pubKey, bitgoKP.pubKey]);
      await bitgo.initDkg(bitgoKP.privKey, [userKP.pubKey, backupKP.pubKey]);

      const r1Messages = [user.getFirstMessage(), backup.getFirstMessage(), bitgo.getFirstMessage()];

      const serialized = MPSTypes.serializeMessages(r1Messages);
      assert(
        serialized.every((m) => typeof m.payload === 'string'),
        'Serialized payloads should be strings'
      );

      const deserialized = MPSTypes.deserializeMessages(serialized);
      assert.strictEqual(deserialized.length, r1Messages.length);
      deserialized.forEach((msg, i) => {
        assert.strictEqual(msg.from, r1Messages[i].from);
        assert.deepStrictEqual(Buffer.from(msg.payload), Buffer.from(r1Messages[i].payload));
      });
    });
  });

  describe('Session Management', function () {
    it('should export and restore DKG session and continue protocol correctly', async function () {
      await user.initDkg(userKP.privKey, [backupKP.pubKey, bitgoKP.pubKey]);
      await backup.initDkg(backupKP.privKey, [userKP.pubKey, bitgoKP.pubKey]);
      await bitgo.initDkg(bitgoKP.privKey, [userKP.pubKey, backupKP.pubKey]);

      user.getFirstMessage();
      backup.getFirstMessage();
      bitgo.getFirstMessage();

      const userSession = user.getSession();
      const backupSession = backup.getSession();
      const bitgoSession = bitgo.getSession();

      assert(typeof userSession === 'string' && userSession.length > 0, 'Session should be non-empty string');

      const restoredUser = new EddsaMPSDkg.DKG(3, 2, 0);
      const restoredBackup = new EddsaMPSDkg.DKG(3, 2, 1);
      const restoredBitgo = new EddsaMPSDkg.DKG(3, 2, 2);

      restoredUser.restoreSession(userSession);
      restoredBackup.restoreSession(backupSession);
      restoredBitgo.restoreSession(bitgoSession);

      assert.strictEqual(restoredUser.getState(), user.getState(), 'Restored state should match original');
      assert.strictEqual(restoredBackup.getState(), backup.getState(), 'Restored backup state should match original');
      assert.strictEqual(restoredBitgo.getState(), bitgo.getState(), 'Restored BitGo state should match original');
    });

    it('should throw error when trying to export session after completion', async function () {
      const [user, backup, bitgo] = await generateEdDsaDKGKeyShares();

      assert.throws(() => {
        user.getSession();
      }, /DKG session is complete. Exporting the session is not allowed./);

      assert.throws(() => {
        backup.getSession();
      }, /DKG session is complete. Exporting the session is not allowed./);

      assert.throws(() => {
        bitgo.getSession();
      }, /DKG session is complete. Exporting the session is not allowed./);
    });
  });

  describe('Retrofit DKG (ed25519_dkg_round0_import)', function () {
    const curve = new Ed25519Curve();
    const shamir = new Shamir(curve);
    // 2^256 — same base used by the Eddsa class for chaincode arithmetic
    const base = BigInt('0x010000000000000000000000000000000000000000000000000000000000000000');

    /**
     * Mirrors Eddsa.keyShare(index, 2, 3) + Eddsa.keyCombine() from sdk-core.
     * Returns per-party EddsaRetrofitData with:
     *   s_i_0    = pShare.u  (combined clamped scalar, distinct per party)
     *   expectedPk = pShare.y (aggregate Ed25519 public key, same across all parties)
     *   chainCode  = pShare.chaincode (combined 32-byte chain code, same across all parties)
     */
    function buildRetrofitData(seeds: Buffer[]): EddsaRetrofitData[] {
      // Step 1: keyShare — derive per-party (u, y, chaincode, split_u)
      type PartyRaw = { u: bigint; y: bigint; chaincode: bigint; splitU: Record<number, bigint> };
      const n = seeds.length;
      const parties: PartyRaw[] = seeds.map((seed) => {
        const h = createHash('sha512').update(seed.subarray(0, 32)).digest();
        const u = clamp(bigIntFromBufferLE(h.subarray(0, 32) as Buffer));
        const y = curve.basePointMult(u);
        const chaincode = bigIntFromBufferBE(seed.subarray(32, 64) as Buffer);
        const { shares: splitU } = shamir.split(u, 2, n);
        return { u, y, chaincode, splitU };
      });

      // Step 2: keyCombine — aggregate y and chaincode; pick u_i for each party i
      const aggY = parties.map((p) => p.y).reduce((acc, y) => curve.pointAdd(acc, y));
      const aggChaincode = parties.map((p) => p.chaincode).reduce((acc, cc) => (acc + cc) % base);
      const expectedPk = bigIntToBufferLE(aggY, 32).toString('hex');
      // Eddsa.keyCombine stores pShare.chaincode as bigIntToBufferBE — match that encoding
      const chainCode = bigIntToBufferBE(aggChaincode, 32).toString('hex');

      return parties.map((party) => ({
        s_i_0: bigIntToBufferLE(party.u, 32).toString('hex'),
        expectedPk,
        chainCode,
      }));
    }

    // Deterministic per-party seeds: 64 bytes each (first 32 = key seed, last 32 = chaincode).
    // buildRetrofitData calls Ed25519Curve.basePointMult which requires libsodium to be
    // initialized — run it inside before() rather than at describe-scope.
    const seeds = [
      Buffer.from(
        'a304733c16cc821fe171d5c7dbd7276fd90deae808b7553d17a1e55e4a76b270' +
          '9d91c2e6353202cf61f8f275158b3468e9a00f7872fc2fd310b72cd026e2e2f9',
        'hex'
      ),
      Buffer.from(
        '33c749b635cdba7f9fbf51ad0387431cde47e20d8dc13acd1f51a9a0ad06ebfe' +
          'b415844d27dd9320f282d6d8ecd8387f0e9fbf9198664e28a2f66e6f5b87c381',
        'hex'
      ),
      Buffer.from(
        'ae02d3f7464313d0f72f9f3862694579fa11f8983fc3fe42183cd137e3f3f30a' +
          '44d85ab746decb8f0f0c62be0498542ddf58f31d9ed24bd1f62b1b1be17fce0f',
        'hex'
      ),
    ];
    let retrofitUser: EddsaRetrofitData;
    let retrofitBackup: EddsaRetrofitData;
    let retrofitBitgo: EddsaRetrofitData;

    before(function () {
      [retrofitUser, retrofitBackup, retrofitBitgo] = buildRetrofitData(seeds);
    });

    it('each party has a distinct s_i_0 but shared expectedPk', function () {
      assert.notStrictEqual(retrofitUser.s_i_0, retrofitBackup.s_i_0, 'user and backup s_i_0 must differ');
      assert.notStrictEqual(retrofitBackup.s_i_0, retrofitBitgo.s_i_0, 'backup and bitgo s_i_0 must differ');
      assert.strictEqual(retrofitUser.expectedPk, retrofitBackup.expectedPk, 'all parties share expectedPk');
      assert.strictEqual(retrofitBackup.expectedPk, retrofitBitgo.expectedPk, 'all parties share expectedPk');
    });

    it('should route getFirstMessage through ed25519_dkg_round0_import and all parties agree on public key', async function () {
      const [user, backup, bitgo] = await generateEdDsaDKGKeyShares(
        undefined,
        undefined,
        undefined,
        retrofitUser,
        retrofitBackup,
        retrofitBitgo
      );

      const userPk = user.getSharePublicKey().toString('hex');
      const backupPk = backup.getSharePublicKey().toString('hex');
      const bitgoPk = bitgo.getSharePublicKey().toString('hex');

      assert.strictEqual(userPk, backupPk, 'user and backup must agree on public key after retrofit DKG');
      assert.strictEqual(backupPk, bitgoPk, 'backup and bitgo must agree on public key after retrofit DKG');
      assert.strictEqual(userPk.length, 64, 'public key must be 32 bytes (64 hex chars)');
    });

    it('retrofit DKG produces a different public key than a fresh DKG', async function () {
      const [retrofitParty] = await generateEdDsaDKGKeyShares(
        undefined,
        undefined,
        undefined,
        retrofitUser,
        retrofitBackup,
        retrofitBitgo
      );
      const [freshParty] = await generateEdDsaDKGKeyShares();

      assert.notStrictEqual(
        retrofitParty.getSharePublicKey().toString('hex'),
        freshParty.getSharePublicKey().toString('hex'),
        'retrofit and fresh DKG should produce distinct public keys'
      );
    });

    it('retrofit DKG is deterministic: same retrofitData produces same public key', async function () {
      const [run1] = await generateEdDsaDKGKeyShares(
        undefined,
        undefined,
        undefined,
        retrofitUser,
        retrofitBackup,
        retrofitBitgo
      );
      const [run2] = await generateEdDsaDKGKeyShares(
        undefined,
        undefined,
        undefined,
        retrofitUser,
        retrofitBackup,
        retrofitBitgo
      );

      assert.strictEqual(
        run1.getSharePublicKey().toString('hex'),
        run2.getSharePublicKey().toString('hex'),
        'retrofit DKG must be deterministic: same inputs must produce same public key'
      );
    });

    it('session export/restore: restored party completes full retrofit DKG and agrees on public key', async function () {
      const userKP = makeKeypair();
      const backupKP = makeKeypair();
      const bitgoKP = makeKeypair();

      // --- Simulate party 0 persisting its session before round 0 ---
      const user = new EddsaMPSDkg.DKG(3, 2, 0, retrofitUser);
      await user.initDkg(userKP.privKey, [backupKP.pubKey, bitgoKP.pubKey]);

      const session = user.getSession();
      const parsed = JSON.parse(session);
      assert.deepStrictEqual(parsed.retrofitData, retrofitUser, 'getSession must include retrofitData');

      // Restore party 0 into a fresh instance.
      // initDkg loads the WASM module; restoreSession then overwrites state/keys from the blob.
      const restoredUser = new EddsaMPSDkg.DKG(3, 2, 0);
      await restoredUser.initDkg(userKP.privKey, [backupKP.pubKey, bitgoKP.pubKey]);
      restoredUser.restoreSession(session);

      // --- Run parties 1 and 2 normally ---
      const backup = new EddsaMPSDkg.DKG(3, 2, 1, retrofitBackup);
      const bitgo = new EddsaMPSDkg.DKG(3, 2, 2, retrofitBitgo);
      await backup.initDkg(backupKP.privKey, [userKP.pubKey, bitgoKP.pubKey]);
      await bitgo.initDkg(bitgoKP.privKey, [userKP.pubKey, backupKP.pubKey]);

      // --- Round 0 ---
      const r1Messages = [restoredUser.getFirstMessage(), backup.getFirstMessage(), bitgo.getFirstMessage()];

      // --- Round 1 ---
      const r2Messages = [
        ...restoredUser.handleIncomingMessages(r1Messages),
        ...backup.handleIncomingMessages(r1Messages),
        ...bitgo.handleIncomingMessages(r1Messages),
      ];

      // --- Round 2 (completes DKG) ---
      restoredUser.handleIncomingMessages(r2Messages);
      backup.handleIncomingMessages(r2Messages);
      bitgo.handleIncomingMessages(r2Messages);

      // All three parties must agree on the same public key
      const userPk = restoredUser.getSharePublicKey().toString('hex');
      const backupPk = backup.getSharePublicKey().toString('hex');
      const bitgoPk = bitgo.getSharePublicKey().toString('hex');

      assert.strictEqual(userPk, backupPk, 'restored user and backup must agree on public key');
      assert.strictEqual(backupPk, bitgoPk, 'backup and bitgo must agree on public key');

      // The public key must match the one from a non-restored retrofit run with the same inputs
      const [refUser] = await generateEdDsaDKGKeyShares(
        undefined,
        undefined,
        undefined,
        retrofitUser,
        retrofitBackup,
        retrofitBitgo
      );
      assert.strictEqual(
        userPk,
        refUser.getSharePublicKey().toString('hex'),
        'restored session must produce same public key as non-restored retrofit run'
      );
    });
  });
});
