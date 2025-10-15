import assert from 'assert';
import { generateEdDsaDKGKeyShares } from './util';
import { Ed25519Curve } from '../../../../src/curves';
import { bigIntFromBufferLE } from '../../../../src/util';
import { decode } from 'cbor-x';
import { MPSDkg, MPSDsg } from '../../../../src/index';
import { DsgState } from '../../../../src/tss/eddsa-mps/types';

/**
 * Helper function to execute the complete DSG protocol
 */
async function executeDSGProtocol(sessions: MPSDsg.DSG[]): Promise<Buffer[]> {
  // Round 1: Get first messages
  const messagesR1 = sessions.map((session) => session.getFirstMessage());

  // Round 2: Handle round 1 messages
  const messagesR2 = sessions.map((session) => session.handleIncomingMessages(messagesR1)).flat();

  // Round 3: Handle round 2 messages
  const messagesR3 = sessions.map((session) => session.handleIncomingMessages(messagesR2)).flat();

  // Final round: Handle round 3 messages
  sessions.map((session) => session.handleIncomingMessages(messagesR3)).flat();

  // Return signatures from all parties
  return sessions.map((session) => session.getSignature());
}

/**
 * Helper function to create and initialize DSG sessions
 */
async function createDSGSessions(user: MPSDkg.DKG, bitgo: MPSDkg.DKG, msg: Buffer): Promise<MPSDsg.DSG[]> {
  const userSession = new MPSDsg.DSG(user.getKeyShare(), 0, 'm', msg);
  const bitgoSession = new MPSDsg.DSG(bitgo.getKeyShare(), 2, 'm', msg);

  await Promise.all([userSession.init(), bitgoSession.init()]);

  return [userSession, bitgoSession];
}

describe('EdDSA DSG (Distributed Signature Generation)', function () {
  let user: MPSDkg.DKG;
  let bitgo: MPSDkg.DKG;
  let message: Buffer;

  beforeEach(async function () {
    // Generate DKG key shares for user and BitGo (2-party setup)
    const [userDkg, , bitgoDkg] = await generateEdDsaDKGKeyShares();
    user = userDkg;
    bitgo = bitgoDkg;
    message = Buffer.from('test message for EdDSA signature');
  });

  it('should complete DSG protocol and generate valid signatures', async function () {
    const sessions = await createDSGSessions(user, bitgo, message);
    const signatures = await executeDSGProtocol(sessions);

    // Verify signatures are generated correctly
    assert.strictEqual(signatures.length, 2, 'Should have 2 signatures');
    signatures.forEach((sig, index) => {
      assert(Buffer.isBuffer(sig), `Signature ${index} should be a Buffer`);
      assert(sig.length > 0, `Signature ${index} should not be empty`);
    });

    // Verify signatures are identical (both parties should produce the same signature)
    assert.deepEqual(signatures[0], signatures[1], 'Both parties should produce identical signatures');
  });

  it('should generate signatures that can be verified with Ed25519', async function () {
    const sessions = await createDSGSessions(user, bitgo, message);
    const signatures = await executeDSGProtocol(sessions);
    const signatureBytes = signatures[0]; // Both should be identical

    // Extract public key from key share and verify signature
    const publicKeyBytes = Buffer.from(decode(user.getKeyShare()).public_key);
    const curve = await Ed25519Curve.initialize();
    const publicKeyBigInt = bigIntFromBufferLE(publicKeyBytes);
    const isValid = curve.verify(message, signatureBytes, publicKeyBigInt);

    assert(isValid, 'Generated signature should be valid when verified with Ed25519');
  });

  it('should produce different signatures for different messages', async function () {
    const differentMessage = Buffer.from('different test message');

    // Generate signatures for both messages
    const sessions1 = await createDSGSessions(user, bitgo, message);
    const sessions2 = await createDSGSessions(user, bitgo, differentMessage);

    const signatures1 = await executeDSGProtocol(sessions1);
    const signatures2 = await executeDSGProtocol(sessions2);

    // Signatures should be different for different messages
    assert.notDeepEqual(signatures1[0], signatures2[0], 'Signatures should be different for different messages');
  });

  describe('DSG State Management', function () {
    it('should track state transitions correctly', async function () {
      const userSession = new MPSDsg.DSG(user.getKeyShare(), 0, 'm', message);
      const bitgoSession = new MPSDsg.DSG(bitgo.getKeyShare(), 2, 'm', message);

      // Initial state should be Uninitialized
      assert.strictEqual(userSession.getState(), DsgState.Uninitialized, 'Initial state should be Uninitialized');
      assert.strictEqual(bitgoSession.getState(), DsgState.Uninitialized, 'Initial state should be Uninitialized');

      // After initialization, state should be Init
      await Promise.all([userSession.init(), bitgoSession.init()]);
      assert.strictEqual(userSession.getState(), DsgState.Init, 'State should be Init after init()');
      assert.strictEqual(bitgoSession.getState(), DsgState.Init, 'State should be Init after init()');

      // Complete the protocol to reach Finished state
      const sessions = [userSession, bitgoSession];
      await executeDSGProtocol(sessions);
      assert.strictEqual(
        userSession.getState(),
        DsgState.Finished,
        'State should be Finished after protocol completion'
      );
      assert.strictEqual(
        bitgoSession.getState(),
        DsgState.Finished,
        'State should be Finished after protocol completion'
      );

      // After ending session, state should be Ended
      userSession.endSession();
      bitgoSession.endSession();
      assert.strictEqual(userSession.getState(), DsgState.Ended, 'State should be Ended after endSession()');
      assert.strictEqual(bitgoSession.getState(), DsgState.Ended, 'State should be Ended after endSession()');
    });

    it('should enforce state-based method access', async function () {
      const userSession = new MPSDsg.DSG(user.getKeyShare(), 0, 'm', message);
      // Should not be able to get first message before initialization
      assert.throws(() => userSession.getFirstMessage(), /DSG session not initialized/);

      // Should not be able to get signature before completion
      await userSession.init();
      assert.throws(() => userSession.getSignature(), /DSG session must be finished to get signature/);

      // Should not be able to initialize twice
      await assert.rejects(() => userSession.init(), /DSG session already initialized/);
    });
  });
});
