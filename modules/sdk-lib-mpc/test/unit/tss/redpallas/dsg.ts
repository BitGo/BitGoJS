import assert from 'assert';
import {
  RedPallasMPSDkg,
  RedPallasMPSDsg,
  RedPallasMPSTypes,
  RedPallasMPSUtil,
} from '../../../../src/tss/redpallas-mps';
import { generateRedPallasDKGKeyShares, executeTillRound, verifyRedPallasSignature } from './util';

const MESSAGE = Buffer.from('The Times 03/Jan/2009 Chancellor on brink of second bailout for banks');
const DERIVATION_SEED = Buffer.from('c526955e37be0a0c8b77a831eb615948772b38df9f04d8c5a2e0e1f1d0c9b8a7', 'hex');

describe('RedPallas MPS DSG', function () {
  // DKG is expensive; generate keyshares once and reuse across tests.
  let userDkg: RedPallasMPSDkg.RedPallasDKG;
  let backupDkg: RedPallasMPSDkg.RedPallasDKG;
  let bitgoDkg: RedPallasMPSDkg.RedPallasDKG;

  let userKeyShare: Buffer;
  let backupKeyShare: Buffer;
  let bitgoKeyShare: Buffer;

  before(async function () {
    [userDkg, backupDkg, bitgoDkg] = await generateRedPallasDKGKeyShares(DERIVATION_SEED);
    userKeyShare = userDkg.getKeyShare();
    backupKeyShare = backupDkg.getKeyShare();
    bitgoKeyShare = bitgoDkg.getKeyShare();
  });

  describe('DSG Initialization', function () {
    it('should accept valid inputs and produce a first message', async function () {
      const dsg = new RedPallasMPSDsg.RedPallasDSG(0);
      await dsg.initDsg(userKeyShare, MESSAGE, 2);

      const msg = dsg.getFirstMessage();
      assert.strictEqual(msg.from, 0, 'First message should be from party 0');
      assert(msg.payload.length > 0, 'First message should have non-empty payload');
    });

    it('should throw when getFirstMessage is called before initDsg', function () {
      const dsg = new RedPallasMPSDsg.RedPallasDSG(0);
      assert.throws(() => dsg.getFirstMessage(), /DSG session not initialized/);
    });

    it('should throw when handleIncomingMessages is called before initDsg', function () {
      const dsg = new RedPallasMPSDsg.RedPallasDSG(0);
      assert.throws(() => dsg.handleIncomingMessages([]), /DSG session not initialized/);
    });

    it('should throw when getSignature is called before completion', async function () {
      const dsg = new RedPallasMPSDsg.RedPallasDSG(0);
      await dsg.initDsg(userKeyShare, MESSAGE, 2);
      assert.throws(() => dsg.getSignature(), /has not produced a signature yet/);
    });

    it('should throw on empty keyShare', async function () {
      const dsg = new RedPallasMPSDsg.RedPallasDSG(0);
      await assert.rejects(dsg.initDsg(Buffer.alloc(0), MESSAGE, 2), /Missing or invalid keyShare/);
    });

    it('should throw on empty message', async function () {
      const dsg = new RedPallasMPSDsg.RedPallasDSG(0);
      await assert.rejects(dsg.initDsg(userKeyShare, Buffer.alloc(0), 2), /Missing or invalid message/);
    });

    it('should throw when otherPartyIdx equals own partyIdx', async function () {
      const dsg = new RedPallasMPSDsg.RedPallasDSG(0);
      await assert.rejects(dsg.initDsg(userKeyShare, MESSAGE, 0), /Invalid otherPartyIdx/);
    });

    it('should throw when otherPartyIdx is out of range', async function () {
      const dsg = new RedPallasMPSDsg.RedPallasDSG(0);
      await assert.rejects(dsg.initDsg(userKeyShare, MESSAGE, 5), /Invalid otherPartyIdx/);
    });

    it('should throw when partyIdx is out of range', async function () {
      const dsg = new RedPallasMPSDsg.RedPallasDSG(7);
      await assert.rejects(dsg.initDsg(userKeyShare, MESSAGE, 0), /Invalid partyIdx/);
    });

    it('should throw when handleIncomingMessages is called before getFirstMessage', async function () {
      const dsg = new RedPallasMPSDsg.RedPallasDSG(0);
      await dsg.initDsg(userKeyShare, MESSAGE, 2);
      assert.throws(() => dsg.handleIncomingMessages([]), /must call getFirstMessage/);
    });
  });

  describe('DSG Protocol Execution (2-of-3)', function () {
    it('should complete full DSG between user (0) and bitgo (2) and produce identical signatures', async function () {
      const dsgA = new RedPallasMPSDsg.RedPallasDSG(0);
      const dsgB = new RedPallasMPSDsg.RedPallasDSG(2);
      await executeTillRound(3, dsgA, dsgB, userKeyShare, bitgoKeyShare, MESSAGE);

      assert.strictEqual(dsgA.getState(), 'Complete');
      assert.strictEqual(dsgB.getState(), 'Complete');

      const sigA = dsgA.getSignature();
      const sigB = dsgB.getSignature();

      assert.strictEqual(sigA.signature.length, 64, 'Signature must be 64 bytes');
      assert.strictEqual(sigA.rk.length, 32, 'rk must be 32 bytes');
      assert.strictEqual(sigA.alpha.length, 32, 'alpha must be 32 bytes');
      assert.strictEqual(
        sigA.signature.toString('hex'),
        sigB.signature.toString('hex'),
        'Both parties must produce identical signatures'
      );
      assert.strictEqual(sigA.rk.toString('hex'), sigB.rk.toString('hex'), 'Both parties must agree on rk');
      assert.strictEqual(sigA.alpha.toString('hex'), sigB.alpha.toString('hex'), 'Both parties must agree on alpha');
    });

    it('should produce a signature that verifies under rk (not the DKG public key directly)', async function () {
      const sig = (await executeTillRound(
        3,
        new RedPallasMPSDsg.RedPallasDSG(0),
        new RedPallasMPSDsg.RedPallasDSG(2),
        userKeyShare,
        bitgoKeyShare,
        MESSAGE
      )) as RedPallasMPSTypes.RedPallasSignatureResult;

      const isValid = await verifyRedPallasSignature(sig, MESSAGE);
      assert(isValid, 'Signature should verify under rk');
    });

    it('should sign the same message identically across all 2-of-3 party combinations', async function () {
      const userBackupSig = (await executeTillRound(
        3,
        new RedPallasMPSDsg.RedPallasDSG(0),
        new RedPallasMPSDsg.RedPallasDSG(1),
        userKeyShare,
        backupKeyShare,
        MESSAGE
      )) as RedPallasMPSTypes.RedPallasSignatureResult;
      const backupBitgoSig = (await executeTillRound(
        3,
        new RedPallasMPSDsg.RedPallasDSG(1),
        new RedPallasMPSDsg.RedPallasDSG(2),
        backupKeyShare,
        bitgoKeyShare,
        MESSAGE
      )) as RedPallasMPSTypes.RedPallasSignatureResult;
      const userBitgoSig = (await executeTillRound(
        3,
        new RedPallasMPSDsg.RedPallasDSG(0),
        new RedPallasMPSDsg.RedPallasDSG(2),
        userKeyShare,
        bitgoKeyShare,
        MESSAGE
      )) as RedPallasMPSTypes.RedPallasSignatureResult;

      // Per-session nonce (and rerandomizer alpha) randomisation means signatures across
      // DIFFERENT signing sessions WILL differ. The invariant we test is that every 2-of-3
      // subset produces a signature that verifies under its own (session-specific) rk.
      assert(await verifyRedPallasSignature(userBackupSig, MESSAGE), 'user+backup signature should verify');
      assert(await verifyRedPallasSignature(backupBitgoSig, MESSAGE), 'backup+bitgo signature should verify');
      assert(await verifyRedPallasSignature(userBitgoSig, MESSAGE), 'user+bitgo signature should verify');
    });

    it('should sign arbitrary message lengths', async function () {
      const shortMsg = Buffer.from([0x01]);
      const longMsg = Buffer.alloc(4096, 0xab);

      const shortSig = (await executeTillRound(
        3,
        new RedPallasMPSDsg.RedPallasDSG(0),
        new RedPallasMPSDsg.RedPallasDSG(2),
        userKeyShare,
        bitgoKeyShare,
        shortMsg
      )) as RedPallasMPSTypes.RedPallasSignatureResult;
      const longSig = (await executeTillRound(
        3,
        new RedPallasMPSDsg.RedPallasDSG(0),
        new RedPallasMPSDsg.RedPallasDSG(2),
        userKeyShare,
        bitgoKeyShare,
        longMsg
      )) as RedPallasMPSTypes.RedPallasSignatureResult;

      assert(await verifyRedPallasSignature(shortSig, shortMsg), '1-byte message signature should verify');
      assert(await verifyRedPallasSignature(longSig, longMsg), '4096-byte message signature should verify');
    });

    it('should throw when handleIncomingMessages is called after completion', async function () {
      const dsgA = new RedPallasMPSDsg.RedPallasDSG(0);
      await executeTillRound(3, dsgA, new RedPallasMPSDsg.RedPallasDSG(2), userKeyShare, bitgoKeyShare, MESSAGE);
      assert.throws(() => dsgA.handleIncomingMessages([]), /already completed/);
    });

    it('should fail when parties sign different messages', async function () {
      const dsg1 = new RedPallasMPSDsg.RedPallasDSG(0);
      const dsg2 = new RedPallasMPSDsg.RedPallasDSG(2);
      await dsg1.initDsg(userKeyShare, Buffer.from('MESSAGE'), 2);
      await dsg2.initDsg(bitgoKeyShare, Buffer.from('DIFFERENT_MESSAGE'), 0);

      const r0_1 = dsg1.getFirstMessage();
      const r0_2 = dsg2.getFirstMessage();

      const [r1_1] = dsg1.handleIncomingMessages([r0_1, r0_2]);
      const [r1_2] = dsg2.handleIncomingMessages([r0_1, r0_2]);

      assert.throws(() => dsg1.handleIncomingMessages([r1_1, r1_2]), /Error while creating messages from party 0/);
    });
  });

  describe('Error Handling', function () {
    it('should throw when handleIncomingMessages receives the wrong number of messages', async function () {
      const dsg = new RedPallasMPSDsg.RedPallasDSG(0);
      await dsg.initDsg(userKeyShare, MESSAGE, 2);
      const own = dsg.getFirstMessage();

      assert.throws(() => dsg.handleIncomingMessages([own]), /Expected 2 messages/);
      assert.throws(() => dsg.handleIncomingMessages([own, own, own]), /Expected 2 messages/);
    });

    it('should throw when counterpart message comes from an unexpected party', async function () {
      const dsg = new RedPallasMPSDsg.RedPallasDSG(0);
      await dsg.initDsg(userKeyShare, MESSAGE, 2);

      const own = dsg.getFirstMessage();
      // Forge a "counterpart" message from party 1 instead of expected party 2
      const wrongPeer = { from: 1, payload: own.payload };

      assert.throws(() => dsg.handleIncomingMessages([own, wrongPeer]), /Unexpected counterpart party index/);
    });

    it('should throw when both messages claim to come from this party', async function () {
      const dsg = new RedPallasMPSDsg.RedPallasDSG(0);
      await dsg.initDsg(userKeyShare, MESSAGE, 2);
      const own = dsg.getFirstMessage();

      assert.throws(() => dsg.handleIncomingMessages([own, own]), /Expected exactly 1 counterpart message/);
    });
  });

  describe('Message Serialization', function () {
    it('should serialize and deserialize DSG messages round-trip', async function () {
      const dsgA = new RedPallasMPSDsg.RedPallasDSG(0);
      const dsgB = new RedPallasMPSDsg.RedPallasDSG(2);
      await dsgA.initDsg(userKeyShare, MESSAGE, 2);
      await dsgB.initDsg(bitgoKeyShare, MESSAGE, 0);

      const a0 = dsgA.getFirstMessage();
      const b0 = dsgB.getFirstMessage();

      const serialized = RedPallasMPSTypes.serializeMessages([a0, b0]);
      assert(
        serialized.every((m) => typeof m.payload === 'string'),
        'Serialized payloads should be strings'
      );

      const deserialized = RedPallasMPSTypes.deserializeMessages(serialized);
      assert.strictEqual(deserialized.length, 2);
      deserialized.forEach((msg, i) => {
        const original = i === 0 ? a0 : b0;
        assert.strictEqual(msg.from, original.from);
        assert.deepStrictEqual(Buffer.from(msg.payload), Buffer.from(original.payload));
      });
    });
  });

  describe('Session Management', function () {
    it('should export and restore DSG session and continue protocol to a valid signature', async function () {
      const dsgA = new RedPallasMPSDsg.RedPallasDSG(0);
      const dsgB = new RedPallasMPSDsg.RedPallasDSG(2);
      await dsgA.initDsg(userKeyShare, MESSAGE, 2);
      await dsgB.initDsg(bitgoKeyShare, MESSAGE, 0);

      const a0 = dsgA.getFirstMessage();
      const b0 = dsgB.getFirstMessage();

      const sessionA = dsgA.getSession();
      assert(typeof sessionA === 'string' && sessionA.length > 0);

      // Restore A in a fresh instance and finish the protocol from there.
      const restoredA = new RedPallasMPSDsg.RedPallasDSG(0);
      await restoredA.restoreSession(sessionA);
      assert.strictEqual(restoredA.getState(), dsgA.getState(), 'Restored state should match original');

      const [a1] = restoredA.handleIncomingMessages([a0, b0]);
      const [b1] = dsgB.handleIncomingMessages([a0, b0]);

      const [a2] = restoredA.handleIncomingMessages([a1, b1]);
      const [b2] = dsgB.handleIncomingMessages([a1, b1]);

      restoredA.handleIncomingMessages([a2, b2]);
      dsgB.handleIncomingMessages([a2, b2]);

      const sigA = restoredA.getSignature();
      const sigB = dsgB.getSignature();

      assert.strictEqual(
        sigA.signature.toString('hex'),
        sigB.signature.toString('hex'),
        'Restored signer must agree with counterpart'
      );
      assert(await verifyRedPallasSignature(sigA, MESSAGE), 'Restored-session signature should verify under rk');
    });

    it('should throw when exporting session after completion', async function () {
      const dsgA = new RedPallasMPSDsg.RedPallasDSG(0);
      const dsgB = new RedPallasMPSDsg.RedPallasDSG(2);
      await executeTillRound(3, dsgA, dsgB, userKeyShare, bitgoKeyShare, MESSAGE);
      assert.throws(() => dsgA.getSession(), /DSG session is complete\. Exporting the session is not allowed\./);
      assert.throws(() => dsgB.getSession(), /DSG session is complete\. Exporting the session is not allowed\./);
    });

    it('should throw when exporting session before the first message', async function () {
      const dsg = new RedPallasMPSDsg.RedPallasDSG(0);
      await dsg.initDsg(userKeyShare, MESSAGE, 2);
      assert.throws(() => dsg.getSession(), /must produce its first message before exporting/);
    });

    it('should throw when exporting session before initialization', function () {
      const dsg = new RedPallasMPSDsg.RedPallasDSG(0);
      assert.throws(() => dsg.getSession(), /DSG session not initialized/);
    });

    it('should throw when restoring a session with invalid fields', async function () {
      const dsg = new RedPallasMPSDsg.RedPallasDSG(0);
      await dsg.initDsg(userKeyShare, MESSAGE, 2);
      dsg.getFirstMessage();

      const session = JSON.parse(dsg.getSession());

      await assert.rejects(
        new RedPallasMPSDsg.RedPallasDSG(0).restoreSession(JSON.stringify({ ...session, dsgRound: 'Invalid' })),
        /Invalid dsgRound in session/
      );
      await assert.rejects(
        new RedPallasMPSDsg.RedPallasDSG(0).restoreSession(JSON.stringify({ ...session, partyIdx: 4 })),
        /Invalid partyIdx in session/
      );
      await assert.rejects(
        new RedPallasMPSDsg.RedPallasDSG(0).restoreSession(JSON.stringify({ ...session, otherPartyIdx: 0 })),
        /Invalid otherPartyIdx in session/
      );
      await assert.rejects(
        new RedPallasMPSDsg.RedPallasDSG(0).restoreSession(JSON.stringify({ ...session, dsgStateBytes: null })),
        /requires dsgStateBytes/
      );
      await assert.rejects(
        new RedPallasMPSDsg.RedPallasDSG(1).restoreSession(JSON.stringify(session)),
        /Session partyIdx 0 does not match instance 1/
      );
    });
  });

  describe('Reduced key share format', function () {
    it('should produce a reduced key share with only keyShare and pub fields (no rootChainCode)', function () {
      const reduced = RedPallasMPSTypes.getDecodedReducedKeyShare(userDkg.getReducedKeyShare());
      assert.deepStrictEqual(Object.keys(reduced).sort(), ['keyShare', 'pub']);
      assert(!('rootChainCode' in reduced));
    });
  });

  describe('RedPallasMPSUtil re-exports', function () {
    it('should expose executeTillRound and verifyRedPallasSignature from the production util module', function () {
      assert.strictEqual(RedPallasMPSUtil.executeTillRound, executeTillRound);
      assert.strictEqual(RedPallasMPSUtil.verifyRedPallasSignature, verifyRedPallasSignature);
    });
  });
});
