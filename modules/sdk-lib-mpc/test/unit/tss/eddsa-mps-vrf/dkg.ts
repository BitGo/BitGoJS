import assert from 'assert';
import crypto from 'crypto';
import * as openpgp from 'openpgp';
import { DklsTypes, MPSComms, MPSTypes, MPSUtil, MpsVrf, MpsVrfTypes, MpsVrfUtils } from '../../../../src/tss';
import { serializeMessages, type DeserializedMessages } from '../../../../src/tss/ecdsa-dkls/types';

// Measured on @bitgo/wasm-mps 1.14.0; keycard sizing depends on this.
const VRF_KEYSHARE_SIZE_BYTES = 229;

describe('MPS VRF DKG 2x3', function () {
  it('should create VRF key shares of the measured size for all three parties', async function () {
    const [user, backup, bitgo] = await MpsVrfUtils.generateVrfDKGKeyShares();
    const userKeyShare = user.getKeyShare();
    const backupKeyShare = backup.getKeyShare();
    const bitgoKeyShare = bitgo.getKeyShare();
    assert.equal(userKeyShare.length, VRF_KEYSHARE_SIZE_BYTES);
    assert.equal(backupKeyShare.length, VRF_KEYSHARE_SIZE_BYTES);
    assert.equal(bitgoKeyShare.length, VRF_KEYSHARE_SIZE_BYTES);
    assert.notDeepStrictEqual(userKeyShare, backupKeyShare);
    assert.notDeepStrictEqual(userKeyShare, bitgoKeyShare);
    for (const party of [user, backup, bitgo]) {
      assert.equal(party.getState(), MpsVrfTypes.VrfDkgState.Complete);
    }
  });

  it('should produce key shares that agree on one VRF key, proven by hard derivation', async function () {
    const mps = await import('@bitgo/wasm-mps');
    const [rootUser, rootBackup, rootBitgo] = await MPSUtil.generateEdDsaDKGKeyShares();
    const [vrfUser, vrfBackup, vrfBitgo] = await MpsVrfUtils.generateVrfDKGKeyShares();
    const rootShares = [rootUser.getKeyShare(), rootBackup.getKeyShare(), rootBitgo.getKeyShare()];
    const vrfShares = [vrfUser.getKeyShare(), vrfBackup.getKeyShare(), vrfBitgo.getKeyShare()];
    const path = "m/0'";

    const pairs: [number, number][] = [
      [0, 2],
      [0, 1],
    ];
    const derived = pairs.map(([a, b]) => {
      const round0 = [a, b].map((i) => mps.ed25519_hard_derive_round0_process(vrfShares[i], rootShares[i], path));
      const round1 = [0, 1].map((i) => mps.ed25519_hard_derive_round1_process(round0[1 - i].msg, round0[i].state));
      return [0, 1].map((i) => mps.ed25519_hard_derive_round2_process(round1[1 - i].msg, round1[i].state));
    });

    assert.deepStrictEqual(Buffer.from(derived[0][0].pk), Buffer.from(derived[1][0].pk));
    assert.deepStrictEqual(Buffer.from(derived[0][0].chaincode), Buffer.from(derived[1][0].chaincode));
    assert.deepStrictEqual(Buffer.from(derived[0][1].pk), Buffer.from(derived[0][0].pk));
    assert.deepStrictEqual(Buffer.from(derived[0][1].chaincode), Buffer.from(derived[0][0].chaincode));
  });

  it('should carry VRF messages through the existing MPS sign/verify comms unchanged', async function () {
    const [userGpg, backupGpg, bitgoGpg] = await Promise.all([
      openpgp.generateKey({ userIDs: [{ name: 'user', email: 'u@test.com' }], curve: 'ed25519', format: 'object' }),
      openpgp.generateKey({ userIDs: [{ name: 'backup', email: 'b@test.com' }], curve: 'ed25519', format: 'object' }),
      openpgp.generateKey({ userIDs: [{ name: 'bitgo', email: 'bg@test.com' }], curve: 'ed25519', format: 'object' }),
    ]);
    const prvKeys = [userGpg.privateKey, backupGpg.privateKey, bitgoGpg.privateKey];
    const pubKeys = [userGpg.publicKey, backupGpg.publicKey, bitgoGpg.publicKey];
    const parties = [new MpsVrf.VrfDkg(3, 2, 0), new MpsVrf.VrfDkg(3, 2, 1), new MpsVrf.VrfDkg(3, 2, 2)];

    const round1 = await Promise.all(parties.map((p) => p.initDkg()));
    const round1Signed = await Promise.all(
      round1.map((m, i) => MPSComms.detachSignMpsMessage(Buffer.from(m.broadcastMessages[0].payload), prvKeys[i]))
    );
    const round1Outputs: DeserializedMessages[] = [];
    for (const [i, party] of parties.entries()) {
      const signerIds = [0, 1, 2].filter((j) => j !== i);
      const signed = round1Signed.filter((_, j) => j !== i);
      const verified = await Promise.all(signed.map((s, k) => MPSComms.verifyMpsMessage(s, pubKeys[signerIds[k]])));
      round1Outputs.push(
        await party.handleIncomingMessages({
          p2pMessages: [],
          broadcastMessages: verified.map((payload, k) => ({ payload: new Uint8Array(payload), from: signerIds[k] })),
        })
      );
    }

    const openingsForParty: { signed: MPSTypes.MPSSignedMessage; from: number }[][] = [[], [], []];
    for (const [i, msgs] of round1Outputs.entries()) {
      for (const p2p of msgs.p2pMessages) {
        openingsForParty[p2p.to].push({
          signed: await MPSComms.detachSignMpsMessage(Buffer.from(p2p.payload), prvKeys[i]),
          from: i,
        });
      }
    }
    for (const [i, party] of parties.entries()) {
      const verified = await Promise.all(
        openingsForParty[i].map(async (o) => ({
          payload: new Uint8Array(await MPSComms.verifyMpsMessage(o.signed, pubKeys[o.from])),
          from: o.from,
          to: i,
        }))
      );
      await party.handleIncomingMessages({ p2pMessages: verified, broadcastMessages: [] });
    }

    for (const party of parties) {
      assert.equal(party.getKeyShare().length, VRF_KEYSHARE_SIZE_BYTES);
    }
  });

  it('should round-trip VRF messages through serializeMessages/deserializeMessages', async function () {
    const parties = [new MpsVrf.VrfDkg(3, 2, 0), new MpsVrf.VrfDkg(3, 2, 1), new MpsVrf.VrfDkg(3, 2, 2)];
    const round1 = await Promise.all(parties.map((p) => p.initDkg()));

    const deserialized = DklsTypes.deserializeMessages(serializeMessages(round1[0]));
    assert.equal(deserialized.broadcastMessages.length, round1[0].broadcastMessages.length);
    assert.equal(deserialized.broadcastMessages[0].from, round1[0].broadcastMessages[0].from);
    assert.deepEqual(deserialized.broadcastMessages[0].payload, round1[0].broadcastMessages[0].payload);
    assert.equal(deserialized.p2pMessages.length, 0);

    const round2Outputs = await Promise.all(
      parties.map((party, i) =>
        party.handleIncomingMessages({
          p2pMessages: [],
          broadcastMessages: round1.flatMap((m) => m.broadcastMessages).filter((m) => m.from !== i),
        })
      )
    );

    const deserializedOpenings = DklsTypes.deserializeMessages(serializeMessages(round2Outputs[0]));
    assert.equal(deserializedOpenings.p2pMessages.length, round2Outputs[0].p2pMessages.length);
    assert.deepEqual(deserializedOpenings.p2pMessages[0].payload, round2Outputs[0].p2pMessages[0].payload);
    assert.equal(deserializedOpenings.p2pMessages[0].to, round2Outputs[0].p2pMessages[0].to);
    assert.equal(deserializedOpenings.p2pMessages[0].from, 0);

    for (const [i, party] of parties.entries()) {
      await party.handleIncomingMessages({
        p2pMessages: round2Outputs.flatMap((m) => m.p2pMessages).filter((m) => m.to === i),
        broadcastMessages: [],
      });
    }
    assert.equal(parties[0].getKeyShare().length, VRF_KEYSHARE_SIZE_BYTES);
  });

  it('should restore a session serialized after initialization', async function () {
    const restored = await runWithRestore('afterInit');
    assert.equal(restored.getKeyShare().length, VRF_KEYSHARE_SIZE_BYTES);
  });

  it('should restore a session serialized after round 1', async function () {
    const restored = await runWithRestore('afterRound1');
    assert.equal(restored.getKeyShare().length, VRF_KEYSHARE_SIZE_BYTES);
  });

  it('should restore a completed session from its key share', async function () {
    const [user] = await MpsVrfUtils.generateVrfDKGKeyShares();
    const restored = await MpsVrf.VrfDkg.restoreSession(3, 2, 0, user.getSessionData());
    assert.deepEqual(restored.getKeyShare(), user.getKeyShare());
  });

  it('should reject a wrong message count in round 1', async function () {
    const [user, backupRound1] = await startThreeParties();
    await assert.rejects(
      user.handleIncomingMessages({ p2pMessages: [], broadcastMessages: [...backupRound1.broadcastMessages] }),
      /Invalid Input/
    );
  });

  it('should reject duplicate senders in round 1', async function () {
    const [user, backupRound1] = await startThreeParties();
    await assert.rejects(
      user.handleIncomingMessages({
        p2pMessages: [],
        broadcastMessages: [...backupRound1.broadcastMessages, ...backupRound1.broadcastMessages],
      }),
      /Protocol Error/
    );
  });

  it('should reject getKeyShare before the DKG completes', async function () {
    const [user] = await startThreeParties();
    assert.throws(() => user.getKeyShare(), /Can not get key share/);
  });

  it('should reject invalid constructor parameters and double initialization', async function () {
    await assert.rejects(new MpsVrf.VrfDkg(2, 3, 0).initDkg(), /Invalid parameters for VRF DKG/);
    await assert.rejects(new MpsVrf.VrfDkg(3, 2, 5).initDkg(), /Invalid parameters for VRF DKG/);
    await assert.rejects(new MpsVrf.VrfDkg(3, 2, 0, Buffer.alloc(16)).initDkg(), /Seed should be 32 bytes, got 16/);
    const [user] = await startThreeParties();
    await assert.rejects(user.initDkg(), /VRF DKG session already initialized/);
  });

  it('should reject handling messages before initialization and after completion', async function () {
    const user = new MpsVrf.VrfDkg(3, 2, 0);
    await assert.rejects(
      user.handleIncomingMessages({ p2pMessages: [], broadcastMessages: [] }),
      /VRF DKG session not initialized/
    );
    const [completed] = await MpsVrfUtils.generateVrfDKGKeyShares();
    await assert.rejects(
      completed.handleIncomingMessages({ p2pMessages: [], broadcastMessages: [] }),
      /VRF DKG session already completed/
    );
  });

  it('should reject restoring a session without the required material', async function () {
    await assert.rejects(
      MpsVrf.VrfDkg.restoreSession(3, 2, 0, { vrfState: MpsVrfTypes.VrfDkgState.Round1 }),
      /without state bytes/
    );
    await assert.rejects(
      MpsVrf.VrfDkg.restoreSession(3, 2, 0, { vrfState: MpsVrfTypes.VrfDkgState.Complete }),
      /without a key share/
    );
    await assert.rejects(
      MpsVrf.VrfDkg.restoreSession(3, 2, 0, { vrfState: MpsVrfTypes.VrfDkgState.Uninitialized }),
      /Invalid VRF DKG session data/
    );
    await assert.rejects(MpsVrf.VrfDkg.restoreSession(3, 2, 0, { vrfState: 'Round1' }), /Invalid VRF DKG session data/);
  });

  it('should reject non-integer round-1 recipient ids', function () {
    assert.throws(() => MpsVrfTypes.decodePartyId('1.5'), /not a party id/);
    assert.throws(() => MpsVrfTypes.decodePartyId('01'), /not a party id/);
    assert.throws(() => MpsVrfTypes.decodePartyId('user'), /not a party id/);
    assert.equal(MpsVrfTypes.decodePartyId('2'), 2);
  });

  async function startThreeParties(): Promise<[MpsVrf.VrfDkg, DeserializedMessages]> {
    const user = new MpsVrf.VrfDkg(3, 2, 0);
    const backup = new MpsVrf.VrfDkg(3, 2, 1);
    const bitgo = new MpsVrf.VrfDkg(3, 2, 2);
    const round1 = await Promise.all([user, backup, bitgo].map((p) => p.initDkg()));
    return [user, round1[1]];
  }

  /**
   * Runs a full ceremony where party 0's session is serialized and restored at
   * the requested point, returning party 0's completed session.
   */
  async function runWithRestore(restoreAfter: 'afterInit' | 'afterRound1'): Promise<MpsVrf.VrfDkg> {
    const user = new MpsVrf.VrfDkg(3, 2, 0, crypto.randomBytes(32));
    const backup = new MpsVrf.VrfDkg(3, 2, 1, crypto.randomBytes(32));
    const bitgo = new MpsVrf.VrfDkg(3, 2, 2, crypto.randomBytes(32));
    const round1 = await Promise.all([user, backup, bitgo].map((p) => p.initDkg()));
    const [userRound1, backupRound1, bitgoRound1] = round1;

    let userSession: MpsVrf.VrfDkg = user;
    if (restoreAfter === 'afterInit') {
      userSession = await MpsVrf.VrfDkg.restoreSession(3, 2, 0, user.getSessionData());
    }
    const userRound2 = await userSession.handleIncomingMessages({
      p2pMessages: [],
      broadcastMessages: [backupRound1, bitgoRound1].flatMap((m) => m.broadcastMessages),
    });
    if (restoreAfter === 'afterRound1') {
      userSession = await MpsVrf.VrfDkg.restoreSession(3, 2, 0, userSession.getSessionData());
    }
    const backupRound2 = await backup.handleIncomingMessages({
      p2pMessages: [],
      broadcastMessages: [userRound1, bitgoRound1].flatMap((m) => m.broadcastMessages),
    });
    const bitgoRound2 = await bitgo.handleIncomingMessages({
      p2pMessages: [],
      broadcastMessages: [userRound1, backupRound1].flatMap((m) => m.broadcastMessages),
    });
    const round2Outputs = [userRound2, backupRound2, bitgoRound2];
    for (const [i, party] of [userSession, backup, bitgo].entries()) {
      await party.handleIncomingMessages({
        p2pMessages: round2Outputs.flatMap((m) => m.p2pMessages).filter((m) => m.to === i),
        broadcastMessages: [],
      });
    }
    return userSession;
  }
});
