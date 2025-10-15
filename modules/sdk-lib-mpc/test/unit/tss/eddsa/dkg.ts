import assert from 'assert';
import { concatBytes } from '../../../../src/tss/eddsa-mps/util';
import { generateEdDsaDKGKeyShares } from './util';
import { decode } from 'cbor-x';
import { MPSDkg, MPSUtil } from '../../../../src/tss/eddsa-mps';
import { DkgState } from '../../../../src/tss/eddsa-mps/types';

describe('EdDSA MPS DKG', function () {
  let user: MPSDkg.DKG;
  let backup: MPSDkg.DKG;
  let bitgo: MPSDkg.DKG;
  let publicKeyConcat: Uint8Array;

  beforeEach(async function () {
    user = new MPSDkg.DKG(3, 2, 0);
    backup = new MPSDkg.DKG(3, 2, 1);
    bitgo = new MPSDkg.DKG(3, 2, 2);

    const publicKeys = await Promise.all([user.getPublicKey(), backup.getPublicKey(), bitgo.getPublicKey()]);
    publicKeyConcat = concatBytes(publicKeys);
  });

  afterEach(function () {
    user.endSession();
    backup.endSession();
    bitgo.endSession();
  });

  describe('DKG Initialization', function () {
    it('should initialize DKG sessions for all parties', async function () {
      await Promise.all([
        user.initDkg(publicKeyConcat),
        backup.initDkg(publicKeyConcat),
        bitgo.initDkg(publicKeyConcat),
      ]);

      // Verify that all parties can create first messages
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
      await Promise.all([
        user.initDkg(publicKeyConcat),
        backup.initDkg(publicKeyConcat),
        bitgo.initDkg(publicKeyConcat),
      ]);
    });

    it('should complete full DKG protocol and generate key shares', async function () {
      // Round 1: Create first messages
      const r1Messages = [user.getFirstMessage(), backup.getFirstMessage(), bitgo.getFirstMessage()];

      // Verify round 1 messages
      assert.strictEqual(r1Messages.length, 3, 'Should have 3 round 1 messages');
      r1Messages.forEach((msg, index) => {
        assert.strictEqual(msg.from, index, `Message ${index} should be from party ${index}`);
        assert(msg.payload.length > 0, `Message ${index} should have payload`);
      });

      // Round 2: Handle round 1 messages and create round 2 messages
      const r2Messages = [
        ...user.handleIncomingMessages(r1Messages),
        ...backup.handleIncomingMessages(r1Messages),
        ...bitgo.handleIncomingMessages(r1Messages),
      ];

      // Verify round 2 messages
      assert(r2Messages.length > 0, 'Should have round 2 messages');
      r2Messages.forEach((msg) => {
        assert(msg.payload.length > 0, 'Round 2 message should have payload');
        assert(typeof msg.from === 'number', 'Round 2 message should have from field');
      });

      // Round 3: Handle round 2 messages
      const r3Messages = [
        ...user.handleIncomingMessages(r2Messages),
        ...backup.handleIncomingMessages(r2Messages),
        ...bitgo.handleIncomingMessages(r2Messages),
      ];

      // Verify round 3 messages
      assert(r3Messages.length >= 0, 'Round 3 messages should be valid');

      // Get key shares
      const userKeyShare = user.getKeyShare();
      const backupKeyShare = backup.getKeyShare();
      const bitgoKeyShare = bitgo.getKeyShare();

      // Verify key shares
      assert(Buffer.isBuffer(userKeyShare), 'User key share should be a Buffer');
      assert(Buffer.isBuffer(backupKeyShare), 'Backup key share should be a Buffer');
      assert(Buffer.isBuffer(bitgoKeyShare), 'BitGo key share should be a Buffer');

      assert(userKeyShare.length > 0, 'User key share should not be empty');
      assert(backupKeyShare.length > 0, 'Backup key share should not be empty');
      assert(bitgoKeyShare.length > 0, 'BitGo key share should not be empty');
    });

    it('should generate consistent key shares across all parties', async function () {
      // Complete the DKG protocol
      const r1Messages = [user.getFirstMessage(), backup.getFirstMessage(), bitgo.getFirstMessage()];

      const r2Messages = [
        ...user.handleIncomingMessages(r1Messages),
        ...backup.handleIncomingMessages(r1Messages),
        ...bitgo.handleIncomingMessages(r1Messages),
      ];

      user.handleIncomingMessages(r2Messages);
      backup.handleIncomingMessages(r2Messages);
      bitgo.handleIncomingMessages(r2Messages);

      // Get key shares
      const userKeyShare = user.getKeyShare();
      const backupKeyShare = backup.getKeyShare();
      const bitgoKeyShare = bitgo.getKeyShare();

      // Parse key shares using fetchMaterial
      const keyShareData = MPSUtil.fetchMaterial([userKeyShare, backupKeyShare, bitgoKeyShare]);

      // Verify all parties have the same public key
      const publicKeys = keyShareData.map((share) => share.public_key);
      assert.strictEqual(publicKeys[0], publicKeys[1], 'User and backup should have same public key');
      assert.strictEqual(publicKeys[1], publicKeys[2], 'Backup and BitGo should have same public key');

      // Verify all parties have the same root chain code
      const rootChainCodes = keyShareData.map((share) => share.root_chain_code);
      assert.strictEqual(rootChainCodes[0], rootChainCodes[1], 'User and backup should have same root chain code');
      assert.strictEqual(rootChainCodes[1], rootChainCodes[2], 'Backup and BitGo should have same root chain code');

      // Verify threshold and total parties
      keyShareData.forEach((share, index) => {
        assert.strictEqual(share.threshold, 2, `Party ${index} should have threshold 2`);
        assert.strictEqual(share.total_parties, 3, `Party ${index} should have total parties 3`);
        assert.strictEqual(share.party_id, index, `Party ${index} should have correct party ID`);
      });

      // Verify each party has unique private key material
      const privateKeys = keyShareData.map((share) => share.d_i);
      const uniquePrivateKeys = new Set(privateKeys);
      assert.strictEqual(uniquePrivateKeys.size, 3, 'Each party should have unique private key material');
    });
  });

  describe('Seed-based Key Generation', function () {
    it('should create key shares with deterministic seeds', async function () {
      const seedUser = Buffer.from('a304733c16cc821fe171d5c7dbd7276fd90deae808b7553d17a1e55e4a76b270', 'hex');
      const seedBackup = Buffer.from('9d91c2e6353202cf61f8f275158b3468e9a00f7872fc2fd310b72cd026e2e2f9', 'hex');
      const seedBitgo = Buffer.from('33c749b635cdba7f9fbf51ad0387431cde47e20d8dc13acd1f51a9a0ad06ebfe', 'hex');

      const [user, backup, bitgo] = await generateEdDsaDKGKeyShares(seedUser, seedBackup, seedBitgo);

      const userKeyShare = user.getKeyShare();
      const backupKeyShare = backup.getKeyShare();
      const bitgoKeyShare = bitgo.getKeyShare();
      const userReducedKeyShare = user.getReducedKeyShare();

      // Verify key shares are generated
      assert(Buffer.isBuffer(userKeyShare), 'User key share should be a Buffer');
      assert(Buffer.isBuffer(backupKeyShare), 'Backup key share should be a Buffer');
      assert(Buffer.isBuffer(bitgoKeyShare), 'BitGo key share should be a Buffer');
      assert(Buffer.isBuffer(userReducedKeyShare), 'User reduced key share should be a Buffer');

      // Verify all parties have the same public key
      const [userKeyData, backupKeyData, bitgoKeyData] = MPSUtil.fetchMaterial([
        userKeyShare,
        backupKeyShare,
        bitgoKeyShare,
      ]);

      assert.deepEqual(userKeyData.public_key, bitgoKeyData.public_key, 'User and BitGo should have same public key');
      assert.deepEqual(
        backupKeyData.public_key,
        bitgoKeyData.public_key,
        'Backup and BitGo should have same public key'
      );

      // Verify deterministic behavior - running again with same seeds should produce same results
      const [user2, backup2, bitgo2] = await generateEdDsaDKGKeyShares(seedUser, seedBackup, seedBitgo);

      const [userKeyShare2, backupKeyShare2, bitgoKeyShare2] = MPSUtil.fetchMaterial([
        user2.getKeyShare(),
        backup2.getKeyShare(),
        bitgo2.getKeyShare(),
      ]);

      // Key shares should be identical when using same seeds
      assert.deepEqual(userKeyData.d_i, userKeyShare2.d_i, 'User key shares should be identical with same seed');
      assert.deepEqual(backupKeyData.d_i, backupKeyShare2.d_i, 'Backup key shares should be identical with same seed');
      assert.deepEqual(bitgoKeyData.d_i, bitgoKeyShare2.d_i, 'BitGo key shares should be identical with same seed');

      // Clean up
      user.endSession();
      backup.endSession();
      bitgo.endSession();
      user2.endSession();
      backup2.endSession();
      bitgo2.endSession();
    });

    it('should create different key shares with different seeds', async function () {
      const seedUser1 = Buffer.from('a304733c16cc821fe171d5c7dbd7276fd90deae808b7553d17a1e55e4a76b270', 'hex');
      const seedBackup1 = Buffer.from('9d91c2e6353202cf61f8f275158b3468e9a00f7872fc2fd310b72cd026e2e2f9', 'hex');
      const seedBitgo1 = Buffer.from('33c749b635cdba7f9fbf51ad0387431cde47e20d8dc13acd1f51a9a0ad06ebfe', 'hex');

      const seedUser2 = Buffer.from('b415844d27dd9320f282d6d8ecd8387f0e9fbf9198664e28a2f66e6f5b87c381', 'hex');
      const seedBackup2 = Buffer.from('ae02d3f7464313d0f72f9f3862694579fa11f8983fc3fe42183cd137e3f3f30a', 'hex');
      const seedBitgo2 = Buffer.from('44d85ab746decb8f0f0c62be0498542ddf58f31d9ed24bd1f62b1b1be17fce0f', 'hex');

      const [user1, backup1, bitgo1] = await generateEdDsaDKGKeyShares(seedUser1, seedBackup1, seedBitgo1);
      const [user2, backup2, bitgo2] = await generateEdDsaDKGKeyShares(seedUser2, seedBackup2, seedBitgo2);

      const userKeyShare1 = user1.getKeyShare();
      const userKeyShare2 = user2.getKeyShare();

      // Key shares should be different with different seeds
      assert.notDeepEqual(userKeyShare1, userKeyShare2, 'User key shares should be different with different seeds');

      // Clean up
      user1.endSession();
      backup1.endSession();
      bitgo1.endSession();
      user2.endSession();
      backup2.endSession();
      bitgo2.endSession();
    });

    it('should create key shares without seeds (random)', async function () {
      const [user, backup, bitgo] = await generateEdDsaDKGKeyShares();

      const userKeyShare = user.getKeyShare();
      const backupKeyShare = backup.getKeyShare();
      const bitgoKeyShare = bitgo.getKeyShare();

      // Verify key shares are generated
      assert(Buffer.isBuffer(userKeyShare), 'User key share should be a Buffer');
      assert(Buffer.isBuffer(backupKeyShare), 'Backup key share should be a Buffer');
      assert(Buffer.isBuffer(bitgoKeyShare), 'BitGo key share should be a Buffer');

      // Verify all parties have the same public key
      const userKeyData = decode(userKeyShare);
      const backupKeyData = decode(backupKeyShare);
      const bitgoKeyData = decode(bitgoKeyShare);

      assert.deepEqual(userKeyData.public_key, bitgoKeyData.public_key, 'User and BitGo should have same public key');
      assert.deepEqual(
        backupKeyData.public_key,
        bitgoKeyData.public_key,
        'Backup and BitGo should have same public key'
      );

      // Clean up
      user.endSession();
      backup.endSession();
      bitgo.endSession();
    });

    it('should generate valid reduced key shares', async function () {
      const [user, backup, bitgo] = await generateEdDsaDKGKeyShares();

      const userReducedKeyShare = user.getReducedKeyShare();
      const backupReducedKeyShare = backup.getReducedKeyShare();
      const bitgoReducedKeyShare = bitgo.getReducedKeyShare();

      // Verify reduced key shares are generated
      assert(Buffer.isBuffer(userReducedKeyShare), 'User reduced key share should be a Buffer');
      assert(Buffer.isBuffer(backupReducedKeyShare), 'Backup reduced key share should be a Buffer');
      assert(Buffer.isBuffer(bitgoReducedKeyShare), 'BitGo reduced key share should be a Buffer');

      // Verify reduced key shares have content
      assert(userReducedKeyShare.length > 0, 'User reduced key share should not be empty');
      assert(backupReducedKeyShare.length > 0, 'Backup reduced key share should not be empty');
      assert(bitgoReducedKeyShare.length > 0, 'BitGo reduced key share should not be empty');

      // Decode and verify structure
      const userReducedData = decode(userReducedKeyShare);
      const backupReducedData = decode(backupReducedKeyShare);
      const bitgoReducedData = decode(bitgoReducedKeyShare);

      // Verify all parties have the same public key in reduced shares
      assert.deepEqual(
        userReducedData.pub,
        bitgoReducedData.pub,
        'User and BitGo should have same public key in reduced share'
      );
      assert.deepEqual(
        backupReducedData.pub,
        bitgoReducedData.pub,
        'Backup and BitGo should have same public key in reduced share'
      );

      // Verify all parties have the same root chain code in reduced shares
      assert.deepEqual(
        userReducedData.rootChainCode,
        bitgoReducedData.rootChainCode,
        'User and BitGo should have same root chain code in reduced share'
      );
      assert.deepEqual(
        backupReducedData.rootChainCode,
        bitgoReducedData.rootChainCode,
        'Backup and BitGo should have same root chain code in reduced share'
      );

      // Verify each party has unique private key material in reduced shares
      const privateKeys = [userReducedData.prv, backupReducedData.prv, bitgoReducedData.prv];
      const uniquePrivateKeys = new Set(privateKeys.map((key) => Buffer.from(key).toString('hex')));
      assert.strictEqual(
        uniquePrivateKeys.size,
        3,
        'Each party should have unique private key material in reduced share'
      );

      // Clean up
      user.endSession();
      backup.endSession();
      bitgo.endSession();
    });
  });

  describe('Session Management', function () {
    it('should export and restore DKG session correctly', async function () {
      const user = new MPSDkg.DKG(3, 2, 0);
      const backup = new MPSDkg.DKG(3, 2, 1);
      const bitgo = new MPSDkg.DKG(3, 2, 2);

      const publicKeys = await Promise.all([user.getPublicKey(), backup.getPublicKey(), bitgo.getPublicKey()]);
      const publicKeyConcat = MPSUtil.concatBytes(publicKeys);

      // Initialize DKG sessions
      await Promise.all([
        user.initDkg(publicKeyConcat),
        backup.initDkg(publicKeyConcat),
        bitgo.initDkg(publicKeyConcat),
      ]);

      // Get first messages
      user.getFirstMessage();
      backup.getFirstMessage();
      bitgo.getFirstMessage();

      // Export sessions at this point
      const userSession = user.getSession();
      const backupSession = backup.getSession();
      const bitgoSession = bitgo.getSession();

      // Verify sessions are exported as base64 strings
      assert(typeof userSession === 'string', 'User session should be a string');
      assert(typeof backupSession === 'string', 'Backup session should be a string');
      assert(typeof bitgoSession === 'string', 'BitGo session should be a string');
      assert(userSession.length > 0, 'User session should not be empty');
      assert(backupSession.length > 0, 'Backup session should not be empty');
      assert(bitgoSession.length > 0, 'BitGo session should not be empty');

      // Create new DKG instances and restore sessions
      const restoredUser = new MPSDkg.DKG(3, 2, 0);
      const restoredBackup = new MPSDkg.DKG(3, 2, 1);
      const restoredBitgo = new MPSDkg.DKG(3, 2, 2);

      await restoredUser.restoreSession(userSession);
      await restoredBackup.restoreSession(backupSession);
      await restoredBitgo.restoreSession(bitgoSession);

      // Verify restored sessions have the same state
      assert.strictEqual(restoredUser.getState(), user.getState(), 'Restored user state should match original');
      assert.strictEqual(restoredBackup.getState(), backup.getState(), 'Restored backup state should match original');
      assert.strictEqual(restoredBitgo.getState(), bitgo.getState(), 'Restored bitgo state should match original');

      // Clean up
      user.endSession();
      backup.endSession();
      bitgo.endSession();
      restoredUser.endSession();
      restoredBackup.endSession();
      restoredBitgo.endSession();
    });

    it('should throw error when trying to export session after completion', async function () {
      const [user, backup, bitgo] = await generateEdDsaDKGKeyShares();

      // Now try to export session - should throw error
      assert.throws(() => {
        user.getSession();
      }, /DKG session is complete. Exporting the session is not allowed./);

      assert.throws(() => {
        backup.getSession();
      }, /DKG session is complete. Exporting the session is not allowed./);

      assert.throws(() => {
        bitgo.getSession();
      }, /DKG session is complete. Exporting the session is not allowed./);

      // Clean up
      user.endSession();
      backup.endSession();
      bitgo.endSession();
    });

    it('should safely end session multiple times without throwing errors', async function () {
      const [user, backup, bitgo] = await generateEdDsaDKGKeyShares();

      // End session first time
      user.endSession();
      assert.strictEqual(user.getState(), DkgState.Uninitialized, 'User should be in Uninitialized state');

      // End session second time - should not throw
      assert.doesNotThrow(() => {
        user.endSession();
      }, 'Calling endSession multiple times should not throw');

      // Verify still in Uninitialized state
      assert.strictEqual(user.getState(), DkgState.Uninitialized, 'User should still be in Uninitialized state');

      // Clean up other instances
      backup.endSession();
      bitgo.endSession();
    });
  });

  describe('DKG State Management', function () {
    it('should track state transitions correctly throughout the protocol', async function () {
      const user = new MPSDkg.DKG(3, 2, 0);
      const backup = new MPSDkg.DKG(3, 2, 1);
      const bitgo = new MPSDkg.DKG(3, 2, 2);

      // Initial state should be Uninitialized
      assert.strictEqual(user.getState(), DkgState.Uninitialized, 'Initial state should be Uninitialized');
      assert.strictEqual(backup.getState(), DkgState.Uninitialized, 'Initial state should be Uninitialized');
      assert.strictEqual(bitgo.getState(), DkgState.Uninitialized, 'Initial state should be Uninitialized');

      const publicKeys = await Promise.all([user.getPublicKey(), backup.getPublicKey(), bitgo.getPublicKey()]);
      const publicKeyConcat = MPSUtil.concatBytes(publicKeys);

      // After initialization, state should be Init
      await Promise.all([
        user.initDkg(publicKeyConcat),
        backup.initDkg(publicKeyConcat),
        bitgo.initDkg(publicKeyConcat),
      ]);
      assert.strictEqual(user.getState(), DkgState.Init, 'State should be Init after initDkg()');
      assert.strictEqual(backup.getState(), DkgState.Init, 'State should be Init after initDkg()');
      assert.strictEqual(bitgo.getState(), DkgState.Init, 'State should be Init after initDkg()');

      // After getting first message, state should be WaitMsg1
      const r1Messages = [user.getFirstMessage(), backup.getFirstMessage(), bitgo.getFirstMessage()];
      assert.strictEqual(user.getState(), DkgState.WaitMsg1, 'State should be WaitMsg1 after getFirstMessage()');
      assert.strictEqual(backup.getState(), DkgState.WaitMsg1, 'State should be WaitMsg1 after getFirstMessage()');
      assert.strictEqual(bitgo.getState(), DkgState.WaitMsg1, 'State should be WaitMsg1 after getFirstMessage()');

      // After handling round 1 messages, state should be WaitMsg2
      const r2Messages = [
        ...user.handleIncomingMessages(r1Messages),
        ...backup.handleIncomingMessages(r1Messages),
        ...bitgo.handleIncomingMessages(r1Messages),
      ];
      assert.strictEqual(user.getState(), DkgState.WaitMsg2, 'State should be WaitMsg2 after handling round 1');
      assert.strictEqual(backup.getState(), DkgState.WaitMsg2, 'State should be WaitMsg2 after handling round 1');
      assert.strictEqual(bitgo.getState(), DkgState.WaitMsg2, 'State should be WaitMsg2 after handling round 1');

      // After handling round 2 messages, state should be Complete
      user.handleIncomingMessages(r2Messages);
      backup.handleIncomingMessages(r2Messages);
      bitgo.handleIncomingMessages(r2Messages);
      assert.strictEqual(user.getState(), DkgState.Complete, 'State should be Complete after handling all messages');
      assert.strictEqual(backup.getState(), DkgState.Complete, 'State should be Complete after handling all messages');
      assert.strictEqual(bitgo.getState(), DkgState.Complete, 'State should be Complete after handling all messages');

      // After ending session, state should be Uninitialized
      user.endSession();
      backup.endSession();
      bitgo.endSession();
      assert.strictEqual(user.getState(), DkgState.Uninitialized, 'State should be Uninitialized after endSession()');
      assert.strictEqual(backup.getState(), DkgState.Uninitialized, 'State should be Uninitialized after endSession()');
      assert.strictEqual(bitgo.getState(), DkgState.Uninitialized, 'State should be Uninitialized after endSession()');
    });

    it('should throw errors when trying to use methods after session is ended', async function () {
      const [user, backup, bitgo] = await generateEdDsaDKGKeyShares();

      // End the session
      user.endSession();
      assert.strictEqual(user.getState(), DkgState.Uninitialized, 'Session should be in Uninitialized state');

      // Try to use various methods - all should throw
      assert.throws(() => user.getFirstMessage(), /DKG session not initialized/);

      assert.throws(() => user.handleIncomingMessages([]), /DKG session not initialized/);

      assert.throws(() => user.getKeyShare(), /DKG session not initialized/);

      assert.throws(() => user.getReducedKeyShare(), /DKG session not initialized/);

      assert.throws(() => user.getSession(), /DKG session not initialized/);

      // Clean up other instances
      backup.endSession();
      bitgo.endSession();
    });
  });
});
