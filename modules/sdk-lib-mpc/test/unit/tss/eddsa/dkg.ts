import assert from 'assert';
import crypto from 'crypto';
import { x25519 } from '@noble/curves/ed25519';
import { EddsaMPSDkg, MPSTypes } from '../../../../src/tss/eddsa-mps';
import { generateEdDsaDKGKeyShares } from './util';

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
    it('should initialize DKG sessions for all parties', function () {
      user.initDkg(userKP.privKey, [backupKP.pubKey, bitgoKP.pubKey]);
      backup.initDkg(backupKP.privKey, [userKP.pubKey, bitgoKP.pubKey]);
      bitgo.initDkg(bitgoKP.privKey, [userKP.pubKey, backupKP.pubKey]);

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
    beforeEach(function () {
      user.initDkg(userKP.privKey, [backupKP.pubKey, bitgoKP.pubKey]);
      backup.initDkg(backupKP.privKey, [userKP.pubKey, bitgoKP.pubKey]);
      bitgo.initDkg(bitgoKP.privKey, [userKP.pubKey, backupKP.pubKey]);
    });

    it('should complete full DKG protocol and generate key shares', function () {
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

    it('should generate consistent public keys across all parties', function () {
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

      const [user1, backup1, bitgo1] = await generateEdDsaDKGKeyShares(seedUser, seedBackup, seedBitgo);

      const pk0 = user1.getSharePublicKey().toString('hex');
      const pk1 = backup1.getSharePublicKey().toString('hex');
      const pk2 = bitgo1.getSharePublicKey().toString('hex');
      assert.strictEqual(pk0, pk1, 'User and backup should have same public key');
      assert.strictEqual(pk1, pk2, 'Backup and BitGo should have same public key');

      const [user2] = await generateEdDsaDKGKeyShares(seedUser, seedBackup, seedBitgo);
      assert.strictEqual(
        user1.getSharePublicKey().toString('hex'),
        user2.getSharePublicKey().toString('hex'),
        'Same seeds should produce same public key'
      );
    });

    it('should create different key shares with different seeds', async function () {
      const [user1] = await generateEdDsaDKGKeyShares(
        Buffer.from('a304733c16cc821fe171d5c7dbd7276fd90deae808b7553d17a1e55e4a76b270', 'hex'),
        Buffer.from('9d91c2e6353202cf61f8f275158b3468e9a00f7872fc2fd310b72cd026e2e2f9', 'hex'),
        Buffer.from('33c749b635cdba7f9fbf51ad0387431cde47e20d8dc13acd1f51a9a0ad06ebfe', 'hex')
      );
      const [user2] = await generateEdDsaDKGKeyShares(
        Buffer.from('b415844d27dd9320f282d6d8ecd8387f0e9fbf9198664e28a2f66e6f5b87c381', 'hex'),
        Buffer.from('ae02d3f7464313d0f72f9f3862694579fa11f8983fc3fe42183cd137e3f3f30a', 'hex'),
        Buffer.from('44d85ab746decb8f0f0c62be0498542ddf58f31d9ed24bd1f62b1b1be17fce0f', 'hex')
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

      const userPub = Buffer.from(MPSTypes.getDecodedReducedKeyShare(userReduced).pub).toString('hex');
      const backupPub = Buffer.from(MPSTypes.getDecodedReducedKeyShare(backupReduced).pub).toString('hex');
      const bitgoPub = Buffer.from(MPSTypes.getDecodedReducedKeyShare(bitgoReduced).pub).toString('hex');

      assert.strictEqual(userPub, backupPub, 'User and backup should have same public key in reduced share');
      assert.strictEqual(backupPub, bitgoPub, 'Backup and BitGo should have same public key in reduced share');
    });
  });

  describe('Message Serialization', function () {
    it('should serialize and deserialize messages round-trip', function () {
      userKP = makeKeypair();
      backupKP = makeKeypair();
      bitgoKP = makeKeypair();
      user.initDkg(userKP.privKey, [backupKP.pubKey, bitgoKP.pubKey]);
      backup.initDkg(backupKP.privKey, [userKP.pubKey, bitgoKP.pubKey]);
      bitgo.initDkg(bitgoKP.privKey, [userKP.pubKey, backupKP.pubKey]);

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
    it('should export and restore DKG session and continue protocol correctly', function () {
      user.initDkg(userKP.privKey, [backupKP.pubKey, bitgoKP.pubKey]);
      backup.initDkg(backupKP.privKey, [userKP.pubKey, bitgoKP.pubKey]);
      bitgo.initDkg(bitgoKP.privKey, [userKP.pubKey, backupKP.pubKey]);

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
});
