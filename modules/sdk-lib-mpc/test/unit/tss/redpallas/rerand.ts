import assert from 'assert';
import { RedPallasMPSRerand } from '../../../../src/tss/redpallas-mps';
import { RedPallasRerandResult } from '../../../../src/tss/redpallas-mps/types';
import { generateRedPallasDKGKeyShares, executeRerand } from './util';

describe('RedPallas MPS Rerand', function () {
  // DKG is expensive; generate keyshares once and reuse across tests.
  let userKeyShare: Buffer;
  let backupKeyShare: Buffer;
  let bitgoKeyShare: Buffer;
  let dkgPublicKey: Buffer;

  before(async function () {
    const [user, backup, bitgo] = await generateRedPallasDKGKeyShares();
    userKeyShare = user.getKeyShare();
    backupKeyShare = backup.getKeyShare();
    bitgoKeyShare = bitgo.getKeyShare();
    dkgPublicKey = user.getSharePublicKey();
  });

  describe('Rerand Initialization', function () {
    it('should accept valid inputs and produce a first message', async function () {
      const rerand = new RedPallasMPSRerand.RedPallasRerand(0);
      await rerand.initRerand(userKeyShare, 2);

      const msg = rerand.getFirstMessage();
      assert.strictEqual(msg.from, 0, 'First message should be from party 0');
      assert(msg.payload.length > 0, 'First message should have non-empty payload');
    });

    it('should throw when getFirstMessage is called before initRerand', function () {
      const rerand = new RedPallasMPSRerand.RedPallasRerand(0);
      assert.throws(() => rerand.getFirstMessage(), /Rerand session not initialized/);
    });

    it('should throw when handleIncomingMessages is called before initRerand', function () {
      const rerand = new RedPallasMPSRerand.RedPallasRerand(0);
      assert.throws(() => rerand.handleIncomingMessages([]), /Rerand session not initialized/);
    });

    it('should throw when getRerandomizedKeyShare is called before completion', async function () {
      const rerand = new RedPallasMPSRerand.RedPallasRerand(0);
      await rerand.initRerand(userKeyShare, 2);
      assert.throws(() => rerand.getRerandomizedKeyShare(), /has not produced a rerandomized key share yet/);
    });

    it('should throw on empty keyShare', async function () {
      const rerand = new RedPallasMPSRerand.RedPallasRerand(0);
      await assert.rejects(rerand.initRerand(Buffer.alloc(0), 2), /Missing or invalid keyShare/);
    });

    it('should throw when otherPartyIdx equals own partyIdx', async function () {
      const rerand = new RedPallasMPSRerand.RedPallasRerand(0);
      await assert.rejects(rerand.initRerand(userKeyShare, 0), /Invalid otherPartyIdx/);
    });

    it('should throw when otherPartyIdx is out of range', async function () {
      const rerand = new RedPallasMPSRerand.RedPallasRerand(0);
      await assert.rejects(rerand.initRerand(userKeyShare, 5), /Invalid otherPartyIdx/);
    });

    it('should throw when partyIdx is out of range', async function () {
      const rerand = new RedPallasMPSRerand.RedPallasRerand(7);
      await assert.rejects(rerand.initRerand(userKeyShare, 0), /Invalid partyIdx/);
    });

    it('should throw when handleIncomingMessages is called before getFirstMessage', async function () {
      const rerand = new RedPallasMPSRerand.RedPallasRerand(0);
      await rerand.initRerand(userKeyShare, 2);
      assert.throws(() => rerand.handleIncomingMessages([]), /must call getFirstMessage/);
    });
  });

  describe('Rerand Protocol Execution (2-of-3)', function () {
    it('should complete full rerand between user (0) and backup (1) with identical pk and alpha', async function () {
      const [userResult, backupResult] = await executeRerand(
        new RedPallasMPSRerand.RedPallasRerand(0),
        new RedPallasMPSRerand.RedPallasRerand(1),
        userKeyShare,
        backupKeyShare
      );

      assertRerandResult(userResult, backupResult, dkgPublicKey);
    });

    it('should complete full rerand between user (0) and bitgo (2) with identical pk and alpha', async function () {
      const [userResult, bitgoResult] = await executeRerand(
        new RedPallasMPSRerand.RedPallasRerand(0),
        new RedPallasMPSRerand.RedPallasRerand(2),
        userKeyShare,
        bitgoKeyShare
      );

      assertRerandResult(userResult, bitgoResult, dkgPublicKey);
    });

    it('should complete full rerand between backup (1) and bitgo (2) with identical pk and alpha', async function () {
      const [backupResult, bitgoResult] = await executeRerand(
        new RedPallasMPSRerand.RedPallasRerand(1),
        new RedPallasMPSRerand.RedPallasRerand(2),
        backupKeyShare,
        bitgoKeyShare
      );

      assertRerandResult(backupResult, bitgoResult, dkgPublicKey);
    });

    it('should produce a fresh alpha and pk for each rerand session over the same keyshares', async function () {
      const [first] = await executeRerand(
        new RedPallasMPSRerand.RedPallasRerand(0),
        new RedPallasMPSRerand.RedPallasRerand(2),
        userKeyShare,
        bitgoKeyShare
      );
      const [second] = await executeRerand(
        new RedPallasMPSRerand.RedPallasRerand(0),
        new RedPallasMPSRerand.RedPallasRerand(2),
        userKeyShare,
        bitgoKeyShare
      );

      assert.notStrictEqual(
        first.alpha.toString('hex'),
        second.alpha.toString('hex'),
        'alpha must be fresh per rerand session'
      );
      assert.notStrictEqual(first.pk.toString('hex'), second.pk.toString('hex'), 'pk must be fresh per rerand session');
    });

    it('should throw when handleIncomingMessages is called after completion', async function () {
      const party1 = new RedPallasMPSRerand.RedPallasRerand(0);
      const party2 = new RedPallasMPSRerand.RedPallasRerand(2);
      await executeRerand(party1, party2, userKeyShare, bitgoKeyShare);
      assert.throws(() => party1.handleIncomingMessages([]), /already completed/);
    });

    it('should fail when a message from the wrong rerand round is fed to a party', async function () {
      const userRerand = new RedPallasMPSRerand.RedPallasRerand(0);
      const bitgoRerand = new RedPallasMPSRerand.RedPallasRerand(2);
      await userRerand.initRerand(userKeyShare, 2);
      await bitgoRerand.initRerand(bitgoKeyShare, 0);

      const userMsg1 = userRerand.getFirstMessage();
      const bitgoMsg1 = bitgoRerand.getFirstMessage();

      const [userMsg2] = userRerand.handleIncomingMessages([userMsg1, bitgoMsg1]);

      // Feeding bitgo a round-2 opening (userMsg2) where its round-1 commitment
      // (userMsg1) is expected must fail: message bytes carry per-round prefixes
      // and are bound to the session id. The class must surface the WASM error.
      assert.throws(
        () => bitgoRerand.handleIncomingMessages([bitgoMsg1, userMsg2]),
        /Error while creating messages from party 2/
      );

      // bitgo is still in WaitMsg1; the correctly matched rounds complete normally.
      const [bitgoMsg2] = bitgoRerand.handleIncomingMessages([bitgoMsg1, userMsg1]);
      bitgoRerand.handleIncomingMessages([bitgoMsg2, userMsg2]);
      assert.strictEqual(bitgoRerand.getState(), 'Complete');
    });
  });

  describe('Error Handling', function () {
    it('should throw when handleIncomingMessages receives the wrong number of messages', async function () {
      const rerand = new RedPallasMPSRerand.RedPallasRerand(0);
      await rerand.initRerand(userKeyShare, 2);
      const own = rerand.getFirstMessage();

      assert.throws(() => rerand.handleIncomingMessages([own]), /Expected 2 messages/);
      assert.throws(() => rerand.handleIncomingMessages([own, own, own]), /Expected 2 messages/);
    });

    it('should throw when counterpart message comes from an unexpected party', async function () {
      const rerand = new RedPallasMPSRerand.RedPallasRerand(0);
      await rerand.initRerand(userKeyShare, 2);

      const own = rerand.getFirstMessage();
      // Forge a "counterpart" message from party 1 instead of expected party 2
      const wrongPeer = { from: 1, payload: own.payload };

      assert.throws(() => rerand.handleIncomingMessages([own, wrongPeer]), /Unexpected counterpart party index/);
    });

    it('should throw when both messages claim to come from this party', async function () {
      const rerand = new RedPallasMPSRerand.RedPallasRerand(0);
      await rerand.initRerand(userKeyShare, 2);
      const own = rerand.getFirstMessage();

      assert.throws(() => rerand.handleIncomingMessages([own, own]), /Expected exactly 1 counterpart message/);
    });
  });

  describe('Session Management', function () {
    it('should export and restore rerand session after round 0 and finish with the same result as the peer', async function () {
      const partyA = new RedPallasMPSRerand.RedPallasRerand(0);
      const partyB = new RedPallasMPSRerand.RedPallasRerand(2);
      await partyA.initRerand(userKeyShare, 2);
      await partyB.initRerand(bitgoKeyShare, 0);

      const a0 = partyA.getFirstMessage();
      const b0 = partyB.getFirstMessage();

      const sessionA = partyA.getSession();
      assert(typeof sessionA === 'string' && sessionA.length > 0);

      // Restore A in a fresh instance and finish the protocol from there.
      const restoredA = new RedPallasMPSRerand.RedPallasRerand(0);
      await restoredA.restoreSession(sessionA);
      assert.strictEqual(restoredA.getState(), partyA.getState(), 'Restored state should match original');

      const [a1] = restoredA.handleIncomingMessages([a0, b0]);
      const [b1] = partyB.handleIncomingMessages([a0, b0]);

      restoredA.handleIncomingMessages([a1, b1]);
      partyB.handleIncomingMessages([a1, b1]);

      const resultA = restoredA.getRerandomizedKeyShare();
      const resultB = partyB.getRerandomizedKeyShare();

      assert.strictEqual(resultA.pk.toString('hex'), resultB.pk.toString('hex'), 'Restored party must agree on pk');
      assert.strictEqual(
        resultA.alpha.toString('hex'),
        resultB.alpha.toString('hex'),
        'Restored party must agree on alpha'
      );
      assert.notStrictEqual(
        resultA.keyShare.toString('hex'),
        resultB.keyShare.toString('hex'),
        'Per-party rerandomized keyshares must differ'
      );
    });

    it('should throw when exporting session after completion', async function () {
      const party1 = new RedPallasMPSRerand.RedPallasRerand(0);
      const party2 = new RedPallasMPSRerand.RedPallasRerand(2);
      await executeRerand(party1, party2, userKeyShare, bitgoKeyShare);
      assert.throws(() => party1.getSession(), /Rerand session is complete\. Exporting the session is not allowed\./);
      assert.throws(() => party2.getSession(), /Rerand session is complete\. Exporting the session is not allowed\./);
    });

    it('should throw when exporting session before the first message', async function () {
      const rerand = new RedPallasMPSRerand.RedPallasRerand(0);
      await rerand.initRerand(userKeyShare, 2);
      assert.throws(() => rerand.getSession(), /must produce its first message before exporting/);
    });

    it('should throw when exporting session before initialization', function () {
      const rerand = new RedPallasMPSRerand.RedPallasRerand(0);
      assert.throws(() => rerand.getSession(), /Rerand session not initialized/);
    });

    it('should throw when restoring a session with invalid fields', async function () {
      const rerand = new RedPallasMPSRerand.RedPallasRerand(0);
      await rerand.initRerand(userKeyShare, 2);
      rerand.getFirstMessage();

      const session = JSON.parse(rerand.getSession());

      await assert.rejects(
        new RedPallasMPSRerand.RedPallasRerand(0).restoreSession(
          JSON.stringify({ ...session, rerandRound: 'Invalid' })
        ),
        /Invalid rerandRound in session/
      );
      await assert.rejects(
        new RedPallasMPSRerand.RedPallasRerand(0).restoreSession(JSON.stringify({ ...session, partyIdx: 4 })),
        /Invalid partyIdx in session/
      );
      await assert.rejects(
        new RedPallasMPSRerand.RedPallasRerand(0).restoreSession(JSON.stringify({ ...session, otherPartyIdx: 0 })),
        /Invalid otherPartyIdx in session/
      );
      await assert.rejects(
        new RedPallasMPSRerand.RedPallasRerand(0).restoreSession(
          JSON.stringify({ ...session, rerandStateBytes: null })
        ),
        /requires rerandStateBytes/
      );
      await assert.rejects(
        new RedPallasMPSRerand.RedPallasRerand(1).restoreSession(JSON.stringify(session)),
        /Session partyIdx 0 does not match instance 1/
      );
    });
  });

  function assertRerandResult(result1: RedPallasRerandResult, result2: RedPallasRerandResult, dkgPub: Buffer): void {
    assert.strictEqual(result1.pk.length, 32, 'pk must be 32 bytes');
    assert.strictEqual(result1.alpha.length, 32, 'alpha must be 32 bytes');
    assert(!result1.alpha.equals(Buffer.alloc(32)), 'alpha must be non-zero');
    assert.strictEqual(
      result1.pk.toString('hex'),
      result2.pk.toString('hex'),
      'Both parties must agree on the rerandomized public key'
    );
    assert.strictEqual(
      result1.alpha.toString('hex'),
      result2.alpha.toString('hex'),
      'Both parties must agree on alpha'
    );
    assert.notStrictEqual(
      result1.pk.toString('hex'),
      dkgPub.toString('hex'),
      'Rerandomized pk must differ from the DKG public key'
    );
  }
});
