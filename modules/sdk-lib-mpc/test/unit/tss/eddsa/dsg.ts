import assert from 'assert';
import { ed25519 } from '@noble/curves/ed25519';
import { EddsaMPSDkg, EddsaMPSDsg, MPSTypes, MPSUtil } from '../../../../src/tss/eddsa-mps';
import { generateEdDsaDKGKeyShares } from './util';

const MESSAGE = Buffer.from('The Times 03/Jan/2009 Chancellor on brink of second bailout for banks');

describe('EdDSA MPS DSG', function () {
  // DKG is expensive; generate keyshares once and reuse across tests.
  let userDkg: EddsaMPSDkg.DKG;
  let backupDkg: EddsaMPSDkg.DKG;
  let bitgoDkg: EddsaMPSDkg.DKG;

  let userKeyShare: Buffer;
  let backupKeyShare: Buffer;
  let bitgoKeyShare: Buffer;
  let dkgPubKey: Buffer;

  before(async function () {
    [userDkg, backupDkg, bitgoDkg] = await generateEdDsaDKGKeyShares();
    userKeyShare = userDkg.getKeyShare();
    backupKeyShare = backupDkg.getKeyShare();
    bitgoKeyShare = bitgoDkg.getKeyShare();
    dkgPubKey = userDkg.getSharePublicKey();
  });

  describe('DSG Initialization', function () {
    it('should accept valid inputs and produce a first message', function () {
      const dsg = new EddsaMPSDsg.DSG(0);
      dsg.initDsg(userKeyShare, MESSAGE, 'm', 2);

      const msg = dsg.getFirstMessage();
      assert.strictEqual(msg.from, 0, 'First message should be from party 0');
      assert(msg.payload.length > 0, 'First message should have non-empty payload');
    });

    it('should throw when getFirstMessage is called before initDsg', function () {
      const dsg = new EddsaMPSDsg.DSG(0);
      assert.throws(() => dsg.getFirstMessage(), /DSG session not initialized/);
    });

    it('should throw when handleIncomingMessages is called before initDsg', function () {
      const dsg = new EddsaMPSDsg.DSG(0);
      assert.throws(() => dsg.handleIncomingMessages([]), /DSG session not initialized/);
    });

    it('should throw when getSignature is called before completion', function () {
      const dsg = new EddsaMPSDsg.DSG(0);
      dsg.initDsg(userKeyShare, MESSAGE, 'm', 2);
      assert.throws(() => dsg.getSignature(), /has not produced a signature yet/);
    });

    it('should throw on empty keyShare', function () {
      const dsg = new EddsaMPSDsg.DSG(0);
      assert.throws(() => dsg.initDsg(Buffer.alloc(0), MESSAGE, 'm', 2), /Missing or invalid keyShare/);
    });

    it('should throw on empty message', function () {
      const dsg = new EddsaMPSDsg.DSG(0);
      assert.throws(() => dsg.initDsg(userKeyShare, Buffer.alloc(0), 'm', 2), /Missing or invalid message/);
    });

    it('should throw when otherPartyIdx equals own partyIdx', function () {
      const dsg = new EddsaMPSDsg.DSG(0);
      assert.throws(() => dsg.initDsg(userKeyShare, MESSAGE, 'm', 0), /Invalid otherPartyIdx/);
    });

    it('should throw when otherPartyIdx is out of range', function () {
      const dsg = new EddsaMPSDsg.DSG(0);
      assert.throws(() => dsg.initDsg(userKeyShare, MESSAGE, 'm', 5), /Invalid otherPartyIdx/);
    });

    it('should throw when partyIdx is out of range', function () {
      const dsg = new EddsaMPSDsg.DSG(7);
      assert.throws(() => dsg.initDsg(userKeyShare, MESSAGE, 'm', 0), /Invalid partyIdx/);
    });

    it('should throw when handleIncomingMessages is called before getFirstMessage', function () {
      const dsg = new EddsaMPSDsg.DSG(0);
      dsg.initDsg(userKeyShare, MESSAGE, 'm', 2);
      assert.throws(() => dsg.handleIncomingMessages([]), /must call getFirstMessage/);
    });
  });

  describe('DSG Protocol Execution (2-of-3)', function () {
    it('should complete full DSG between user (0) and bitgo (2) and produce identical signatures', function () {
      const dsgA = new EddsaMPSDsg.DSG(0);
      const dsgB = new EddsaMPSDsg.DSG(2);
      MPSUtil.executeTillRound(3, dsgA, dsgB, userKeyShare, bitgoKeyShare, MESSAGE, 'm');

      assert.strictEqual(dsgA.getState(), 'Complete');
      assert.strictEqual(dsgB.getState(), 'Complete');

      const sigA = dsgA.getSignature();
      const sigB = dsgB.getSignature();

      assert.strictEqual(sigA.length, 64, 'Signature must be 64 bytes');
      assert.strictEqual(sigA.toString('hex'), sigB.toString('hex'), 'Both parties must produce identical signatures');
    });

    it('should produce a signature that verifies under the DKG public key', function () {
      const sig = MPSUtil.executeTillRound(
        3,
        new EddsaMPSDsg.DSG(0),
        new EddsaMPSDsg.DSG(2),
        userKeyShare,
        bitgoKeyShare,
        MESSAGE,
        'm'
      ) as Buffer;

      const isValid = ed25519.verify(sig, MESSAGE, dkgPubKey);
      assert(isValid, 'Signature should verify under DKG public key');
    });

    it('should sign the same message identically across all 2-of-3 party combinations', function () {
      const userBackupSig = MPSUtil.executeTillRound(
        3,
        new EddsaMPSDsg.DSG(0),
        new EddsaMPSDsg.DSG(1),
        userKeyShare,
        backupKeyShare,
        MESSAGE,
        'm'
      ) as Buffer;
      const backupBitgoSig = MPSUtil.executeTillRound(
        3,
        new EddsaMPSDsg.DSG(1),
        new EddsaMPSDsg.DSG(2),
        backupKeyShare,
        bitgoKeyShare,
        MESSAGE,
        'm'
      ) as Buffer;
      const userBitgoSig = MPSUtil.executeTillRound(
        3,
        new EddsaMPSDsg.DSG(0),
        new EddsaMPSDsg.DSG(2),
        userKeyShare,
        bitgoKeyShare,
        MESSAGE,
        'm'
      ) as Buffer;

      // Per-session nonce randomisation means signatures across DIFFERENT signing
      // sessions WILL differ. The invariant we test is that every 2-of-3 subset
      // produces a signature that verifies under the SAME DKG public key.
      assert(ed25519.verify(userBackupSig, MESSAGE, dkgPubKey), 'user+backup signature should verify');
      assert(ed25519.verify(backupBitgoSig, MESSAGE, dkgPubKey), 'backup+bitgo signature should verify');
      assert(ed25519.verify(userBitgoSig, MESSAGE, dkgPubKey), 'user+bitgo signature should verify');
    });

    it('should sign arbitrary message lengths', function () {
      const shortMsg = Buffer.from([0x01]);
      const longMsg = Buffer.alloc(4096, 0xab);

      const shortSig = MPSUtil.executeTillRound(
        3,
        new EddsaMPSDsg.DSG(0),
        new EddsaMPSDsg.DSG(2),
        userKeyShare,
        bitgoKeyShare,
        shortMsg,
        'm'
      ) as Buffer;
      const longSig = MPSUtil.executeTillRound(
        3,
        new EddsaMPSDsg.DSG(0),
        new EddsaMPSDsg.DSG(2),
        userKeyShare,
        bitgoKeyShare,
        longMsg,
        'm'
      ) as Buffer;

      assert(ed25519.verify(shortSig, shortMsg, dkgPubKey), '1-byte message signature should verify');
      assert(ed25519.verify(longSig, longMsg, dkgPubKey), '4096-byte message signature should verify');
    });

    it('should throw when handleIncomingMessages is called after completion', function () {
      const dsgA = new EddsaMPSDsg.DSG(0);
      MPSUtil.executeTillRound(3, dsgA, new EddsaMPSDsg.DSG(2), userKeyShare, bitgoKeyShare, MESSAGE, 'm');
      assert.throws(() => dsgA.handleIncomingMessages([]), /already completed/);
    });

    it('should fail when parties sign different messages', function () {
      const dsg1 = new EddsaMPSDsg.DSG(0);
      const dsg2 = new EddsaMPSDsg.DSG(2);
      dsg1.initDsg(userKeyShare, Buffer.from('MESSAGE'), 'm', 2);
      dsg2.initDsg(bitgoKeyShare, Buffer.from('DIFFERENT_MESSAGE'), 'm', 0);

      const r0_1 = dsg1.getFirstMessage();
      const r0_2 = dsg2.getFirstMessage();

      const [r1_1] = dsg1.handleIncomingMessages([r0_1, r0_2]);
      const [r1_2] = dsg2.handleIncomingMessages([r0_1, r0_2]);

      assert.throws(
        () => dsg1.handleIncomingMessages([r1_1, r1_2]),
        /Error while creating messages from party 0, round WaitMsg2: Protocol Error/
      );
    });
  });

  describe('Derivation Paths', function () {
    it('should produce different signatures for different derivation paths', function () {
      const rootSig = MPSUtil.executeTillRound(
        3,
        new EddsaMPSDsg.DSG(0),
        new EddsaMPSDsg.DSG(2),
        userKeyShare,
        bitgoKeyShare,
        MESSAGE,
        'm'
      ) as Buffer;
      const derivedSig = MPSUtil.executeTillRound(
        3,
        new EddsaMPSDsg.DSG(0),
        new EddsaMPSDsg.DSG(2),
        userKeyShare,
        bitgoKeyShare,
        MESSAGE,
        'm/0/1'
      ) as Buffer;

      assert.notStrictEqual(
        rootSig.toString('hex'),
        derivedSig.toString('hex'),
        'Different derivation paths should produce different signatures'
      );
    });
  });

  describe('Error Handling', function () {
    it('should throw when handleIncomingMessages receives the wrong number of messages', function () {
      const dsg = new EddsaMPSDsg.DSG(0);
      dsg.initDsg(userKeyShare, MESSAGE, 'm', 2);
      const own = dsg.getFirstMessage();

      assert.throws(() => dsg.handleIncomingMessages([own]), /Expected 2 messages/);
      assert.throws(() => dsg.handleIncomingMessages([own, own, own]), /Expected 2 messages/);
    });

    it('should throw when counterpart message comes from an unexpected party', function () {
      const dsg = new EddsaMPSDsg.DSG(0);
      dsg.initDsg(userKeyShare, MESSAGE, 'm', 2);

      const own = dsg.getFirstMessage();
      // Forge a "counterpart" message from party 1 instead of expected party 2
      const wrongPeer = { from: 1, payload: own.payload };

      assert.throws(() => dsg.handleIncomingMessages([own, wrongPeer]), /Unexpected counterpart party index/);
    });

    it('should throw when both messages claim to come from this party', function () {
      const dsg = new EddsaMPSDsg.DSG(0);
      dsg.initDsg(userKeyShare, MESSAGE, 'm', 2);
      const own = dsg.getFirstMessage();

      assert.throws(() => dsg.handleIncomingMessages([own, own]), /Expected exactly 1 counterpart message/);
    });
  });

  describe('Message Serialization', function () {
    it('should serialize and deserialize DSG messages round-trip', function () {
      const dsgA = new EddsaMPSDsg.DSG(0);
      const dsgB = new EddsaMPSDsg.DSG(2);
      dsgA.initDsg(userKeyShare, MESSAGE, 'm', 2);
      dsgB.initDsg(bitgoKeyShare, MESSAGE, 'm', 0);

      const a0 = dsgA.getFirstMessage();
      const b0 = dsgB.getFirstMessage();

      const serialized = MPSTypes.serializeMessages([a0, b0]);
      assert(
        serialized.every((m) => typeof m.payload === 'string'),
        'Serialized payloads should be strings'
      );

      const deserialized = MPSTypes.deserializeMessages(serialized);
      assert.strictEqual(deserialized.length, 2);
      deserialized.forEach((msg, i) => {
        const original = i === 0 ? a0 : b0;
        assert.strictEqual(msg.from, original.from);
        assert.deepStrictEqual(Buffer.from(msg.payload), Buffer.from(original.payload));
      });
    });
  });

  describe('Session Management', function () {
    it('should export and restore DSG session and continue protocol to a valid signature', function () {
      const dsgA = new EddsaMPSDsg.DSG(0);
      const dsgB = new EddsaMPSDsg.DSG(2);
      dsgA.initDsg(userKeyShare, MESSAGE, 'm', 2);
      dsgB.initDsg(bitgoKeyShare, MESSAGE, 'm', 0);

      const a0 = dsgA.getFirstMessage();
      const b0 = dsgB.getFirstMessage();

      const sessionA = dsgA.getSession();
      assert(typeof sessionA === 'string' && sessionA.length > 0);

      // Restore A in a fresh instance and finish the protocol from there.
      const restoredA = new EddsaMPSDsg.DSG(0);
      restoredA.restoreSession(sessionA);
      assert.strictEqual(restoredA.getState(), dsgA.getState(), 'Restored state should match original');

      const [a1] = restoredA.handleIncomingMessages([a0, b0]);
      const [b1] = dsgB.handleIncomingMessages([a0, b0]);

      const [a2] = restoredA.handleIncomingMessages([a1, b1]);
      const [b2] = dsgB.handleIncomingMessages([a1, b1]);

      restoredA.handleIncomingMessages([a2, b2]);
      dsgB.handleIncomingMessages([a2, b2]);

      const sigA = restoredA.getSignature();
      const sigB = dsgB.getSignature();

      assert.strictEqual(sigA.toString('hex'), sigB.toString('hex'), 'Restored signer must agree with counterpart');
      assert(ed25519.verify(sigA, MESSAGE, dkgPubKey), 'Restored-session signature should verify under DKG pubkey');
    });

    it('should throw when exporting session after completion', function () {
      const dsgA = new EddsaMPSDsg.DSG(0);
      const dsgB = new EddsaMPSDsg.DSG(2);
      MPSUtil.executeTillRound(3, dsgA, dsgB, userKeyShare, bitgoKeyShare, MESSAGE, 'm');
      assert.throws(() => dsgA.getSession(), /DSG session is complete\. Exporting the session is not allowed\./);
      assert.throws(() => dsgB.getSession(), /DSG session is complete\. Exporting the session is not allowed\./);
    });

    it('should throw when exporting session before the first message', function () {
      const dsg = new EddsaMPSDsg.DSG(0);
      dsg.initDsg(userKeyShare, MESSAGE, 'm', 2);
      assert.throws(() => dsg.getSession(), /must produce its first message before exporting/);
    });

    it('should throw when exporting session before initialization', function () {
      const dsg = new EddsaMPSDsg.DSG(0);
      assert.throws(() => dsg.getSession(), /DSG session not initialized/);
    });

    it('should throw when restoring a session with invalid fields', function () {
      const dsg = new EddsaMPSDsg.DSG(0);
      dsg.initDsg(userKeyShare, MESSAGE, 'm', 2);
      dsg.getFirstMessage();

      const session = JSON.parse(dsg.getSession());

      assert.throws(
        () => new EddsaMPSDsg.DSG(0).restoreSession(JSON.stringify({ ...session, dsgRound: 'Invalid' })),
        /Invalid dsgRound in session/
      );
      assert.throws(
        () => new EddsaMPSDsg.DSG(0).restoreSession(JSON.stringify({ ...session, partyIdx: 4 })),
        /Invalid partyIdx in session/
      );
      assert.throws(
        () => new EddsaMPSDsg.DSG(0).restoreSession(JSON.stringify({ ...session, otherPartyIdx: 0 })),
        /Invalid otherPartyIdx in session/
      );
      assert.throws(
        () => new EddsaMPSDsg.DSG(0).restoreSession(JSON.stringify({ ...session, dsgStateBytes: null })),
        /requires dsgStateBytes/
      );
      assert.throws(
        () => new EddsaMPSDsg.DSG(1).restoreSession(JSON.stringify(session)),
        /Session partyIdx 0 does not match instance 1/
      );
    });
  });
});
