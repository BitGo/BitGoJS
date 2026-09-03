import assert from 'assert';
import { decode } from 'cbor-x';
import * as openpgp from 'openpgp';
import { DklsComms, DklsTypes, DklsVrf, DklsVrfUtils } from '../../../../src/tss';
import { serializeMessages } from '../../../../src/tss/ecdsa-dkls/types';

// Fixed seeds so the VRF DKG output is deterministic; the pinned public key below is
// the fixture (same approach as dklsDkg.ts pinning 0207a404…).
const seedUser = Buffer.from('a304733c16cc821fe171d5c7dbd7276fd90deae808b7553d17a1e55e4a76b270', 'hex');
const seedBackup = Buffer.from('9d91c2e6353202cf61f8f275158b3468e9a00f7872fc2fd310b72cd026e2e2f9', 'hex');
const seedBitgo = Buffer.from('33c749b635cdba7f9fbf51ad0387431cde47e20d8dc13acd1f51a9a0ad06ebfe', 'hex');

const PINNED_PUBLIC_KEY = '5c814ae89c8ba8100aa2a8eb62387df59a5301aec12abfbd9ea6d4be113c4e2a';
const PINNED_KEY_ID = '592c56f4aed1cf9e8989399ffc5b56a8618c9c44a9affe8f55357264957ba4af';
const PINNED_ROOT_CHAIN_CODE = 'c13ededafc532c47780dd121986963e26beba7546ada9c297512dedc839afd68';
// The CBOR VrfKeyshare encoding length varies slightly between parties and runs.
const VRF_KEYSHARE_SIZE_MIN_BYTES = 600;
const VRF_KEYSHARE_SIZE_MAX_BYTES = 700;

function assertVrfKeyShareSize(keyShare: Buffer): void {
  assert.ok(
    keyShare.length >= VRF_KEYSHARE_SIZE_MIN_BYTES && keyShare.length <= VRF_KEYSHARE_SIZE_MAX_BYTES,
    `VRF keyshare size ${keyShare.length} outside measured range ${VRF_KEYSHARE_SIZE_MIN_BYTES}-${VRF_KEYSHARE_SIZE_MAX_BYTES}`
  );
}

describe('VRF DKG 2x3', function () {
  it('should create VRF key shares with all parties agreeing on the public key, key id and root chain code', async function () {
    const [user, backup, bitgo] = await DklsVrfUtils.generateVrfDKGKeyShares();
    const userKeyShare = decode(user.getKeyShare());
    const backupKeyShare = decode(backup.getKeyShare());
    const bitgoKeyShare = decode(bitgo.getKeyShare());
    assert.deepEqual(user.getPublicKey(), backup.getPublicKey());
    assert.deepEqual(user.getPublicKey(), bitgo.getPublicKey());
    assert.deepEqual(user.getKeyId(), backup.getKeyId());
    assert.deepEqual(user.getKeyId(), bitgo.getKeyId());
    assert.deepEqual(user.getRootChainCode(), backup.getRootChainCode());
    assert.deepEqual(user.getRootChainCode(), bitgo.getRootChainCode());
    // The CBOR keyshare carries the same material as the getters.
    assert.equal(Buffer.from(userKeyShare.public_key).toString('hex'), user.getPublicKey().toString('hex'));
    assert.equal(Buffer.from(userKeyShare.key_id).toString('hex'), user.getKeyId().toString('hex'));
    assert.equal(Buffer.from(userKeyShare.root_chain_code).toString('hex'), user.getRootChainCode().toString('hex'));
    // Shares are party-specific.
    assert.equal(userKeyShare.party_id, 0);
    assert.equal(backupKeyShare.party_id, 1);
    assert.equal(bitgoKeyShare.party_id, 2);
    assert.notDeepStrictEqual(userKeyShare.d_i, backupKeyShare.d_i);
    assertVrfKeyShareSize(user.getKeyShare());
  });

  it('should produce a deterministic public key with fixed seeds', async function () {
    const [user, backup, bitgo] = await DklsVrfUtils.generateVrfDKGKeyShares(seedUser, seedBackup, seedBitgo);
    // Seed is used so the public key is the same every time.
    assert.equal(user.getPublicKey().toString('hex'), PINNED_PUBLIC_KEY);
    assert.equal(user.getKeyId().toString('hex'), PINNED_KEY_ID);
    assert.equal(user.getRootChainCode().toString('hex'), PINNED_ROOT_CHAIN_CODE);
    assert.equal(backup.getPublicKey().toString('hex'), PINNED_PUBLIC_KEY);
    assert.equal(bitgo.getPublicKey().toString('hex'), PINNED_PUBLIC_KEY);
  });

  it('should carry VRF messages through the existing comms layer unchanged', async function () {
    openpgp.config.rejectCurves = new Set();
    const [userGpg, backupGpg, bitgoGpg] = await Promise.all([
      openpgp.generateKey({ userIDs: [{ name: 'user', email: 'u@test.com' }], curve: 'secp256k1' }),
      openpgp.generateKey({ userIDs: [{ name: 'backup', email: 'b@test.com' }], curve: 'secp256k1' }),
      openpgp.generateKey({ userIDs: [{ name: 'bitgo', email: 'bg@test.com' }], curve: 'secp256k1' }),
    ]);
    const prvKeys = [
      { partyId: 0, gpgKey: userGpg.privateKey },
      { partyId: 1, gpgKey: backupGpg.privateKey },
      { partyId: 2, gpgKey: bitgoGpg.privateKey },
    ];
    const pubKeys = [
      { partyId: 0, gpgKey: userGpg.publicKey },
      { partyId: 1, gpgKey: backupGpg.publicKey },
      { partyId: 2, gpgKey: bitgoGpg.publicKey },
    ];
    const parties = [new DklsVrf.VrfDkg(3, 2, 0), new DklsVrf.VrfDkg(3, 2, 1), new DklsVrf.VrfDkg(3, 2, 2)];

    // Round 1: every party signs (broadcast) its commitment through the comms layer.
    const round1 = await Promise.all(parties.map((p) => p.initDkg()));
    const round1Serialized = await Promise.all(
      round1.map((m) =>
        DklsComms.encryptAndAuthOutgoingMessages(serializeMessages(m), [], [prvKeys[m.broadcastMessages[0].from]])
      )
    );
    const round1Outputs = [];
    for (const [i, party] of parties.entries()) {
      const others = round1Serialized.filter((_, j) => j !== i);
      const decrypted = await DklsComms.decryptAndVerifyIncomingMessages(
        { p2pMessages: [], broadcastMessages: others.flatMap((s) => s.broadcastMessages) },
        pubKeys,
        [prvKeys[i]]
      );
      round1Outputs.push(await party.handleIncomingMessages(DklsTypes.deserializeMessages(decrypted)));
    }

    // Round 2: every opening is p2p-addressed; encrypt each to its recipient.
    const round2Ciphertexts: Record<number, DklsTypes.AuthEncMessages[]> = { 0: [], 1: [], 2: [] };
    for (const [i, msgs] of round1Outputs.entries()) {
      for (const p2p of msgs.p2pMessages) {
        round2Ciphertexts[p2p.to].push(
          await DklsComms.encryptAndAuthOutgoingMessages(
            { p2pMessages: [DklsTypes.serializeP2PMessage(p2p)], broadcastMessages: [] },
            [pubKeys[p2p.to]],
            [prvKeys[i]]
          )
        );
      }
    }
    for (const [i, party] of parties.entries()) {
      const decrypted = await DklsComms.decryptAndVerifyIncomingMessages(
        { p2pMessages: round2Ciphertexts[i].flatMap((m) => m.p2pMessages), broadcastMessages: [] },
        pubKeys,
        [prvKeys[i]]
      );
      await party.handleIncomingMessages(DklsTypes.deserializeMessages(decrypted));
    }
    // All three parties completed the VRF DKG over the comms layer and agree.
    assert.deepEqual(parties[0].getPublicKey(), parties[1].getPublicKey());
    assert.deepEqual(parties[0].getPublicKey(), parties[2].getPublicKey());
    assertVrfKeyShareSize(parties[0].getKeyShare());
  });

  it('should round-trip round-1 messages through serializeMessages/deserializeMessages', async function () {
    const parties = [new DklsVrf.VrfDkg(3, 2, 0), new DklsVrf.VrfDkg(3, 2, 1), new DklsVrf.VrfDkg(3, 2, 2)];
    const round1 = await Promise.all(parties.map((p) => p.initDkg()));
    const serialized = serializeMessages(round1[0]);
    const deserialized = DklsTypes.deserializeMessages(serialized);
    assert.equal(deserialized.broadcastMessages.length, round1[0].broadcastMessages.length);
    assert.equal(deserialized.broadcastMessages[0].from, round1[0].broadcastMessages[0].from);
    assert.deepEqual(deserialized.broadcastMessages[0].payload, round1[0].broadcastMessages[0].payload);
    assert.equal(deserialized.p2pMessages.length, 0);
    // The re-hydrated messages still drive a real session to completion.
    const userRound2 = await parties[0].handleIncomingMessages({
      p2pMessages: [],
      broadcastMessages: [...round1[1].broadcastMessages, ...round1[2].broadcastMessages],
    });
    const backupRound2 = await parties[1].handleIncomingMessages({
      p2pMessages: [],
      broadcastMessages: [...round1[0].broadcastMessages, ...round1[2].broadcastMessages],
    });
    const bitgoRound2 = await parties[2].handleIncomingMessages({
      p2pMessages: [],
      broadcastMessages: [...round1[0].broadcastMessages, ...round1[1].broadcastMessages],
    });
    // Each party consumes every opening addressed to it, its own self-addressed
    // opening included.
    const round2Outputs = [userRound2, backupRound2, bitgoRound2];
    for (const [i, party] of parties.entries()) {
      await party.handleIncomingMessages({
        p2pMessages: round2Outputs.flatMap((m) => m.p2pMessages).filter((m) => m.to === i),
        broadcastMessages: [],
      });
    }
    assertVrfKeyShareSize(parties[0].getKeyShare());
  });

  it('should restore a session serialized after initialization', async function () {
    const restored = await runWithRestore('afterInit');
    assert.equal(restored.getPublicKey().toString('hex'), PINNED_PUBLIC_KEY);
  });

  it('should restore a session serialized after round 1', async function () {
    const restored = await runWithRestore('afterRound1');
    assert.equal(restored.getPublicKey().toString('hex'), PINNED_PUBLIC_KEY);
  });

  it('should reject a wrong message count in round 1', async function () {
    const user = new DklsVrf.VrfDkg(3, 2, 0);
    const backup = new DklsVrf.VrfDkg(3, 2, 1);
    const bitgo = new DklsVrf.VrfDkg(3, 2, 2);
    await user.initDkg();
    const backupMessages = await backup.initDkg();
    await bitgo.initDkg();
    // Round 1 needs both other parties' commitments; passing only one must fail.
    await assert.rejects(
      user.handleIncomingMessages({ p2pMessages: [], broadcastMessages: [...backupMessages.broadcastMessages] }),
      /Invalid message count|invalid message count/
    );
  });

  it('should reject duplicate senders in round 1', async function () {
    const user = new DklsVrf.VrfDkg(3, 2, 0);
    const backup = new DklsVrf.VrfDkg(3, 2, 1);
    const bitgo = new DklsVrf.VrfDkg(3, 2, 2);
    await user.initDkg();
    const backupMessages = await backup.initDkg();
    await bitgo.initDkg();
    // Two commitments claiming to be from backup must fail the sender set check.
    await assert.rejects(
      user.handleIncomingMessages({
        p2pMessages: [],
        broadcastMessages: [...backupMessages.broadcastMessages, ...backupMessages.broadcastMessages],
      }),
      /Invalid message sender set|invalid message sender set|invalid participant set/
    );
  });

  it('should reject getKeyShare before the DKG completes', async function () {
    const user = new DklsVrf.VrfDkg(3, 2, 0);
    assert.throws(() => user.getKeyShare(), /Can not get key share/);
    await user.initDkg();
    assert.throws(() => user.getKeyShare(), /Can not get key share/);
  });

  it('should reject invalid constructor parameters and double initialization', async function () {
    assert.rejects(new DklsVrf.VrfDkg(2, 3, 0).initDkg(), /Invalid parameters for VRF DKG/);
    assert.rejects(new DklsVrf.VrfDkg(3, 2, 5).initDkg(), /Invalid parameters for VRF DKG/);
    assert.rejects(new DklsVrf.VrfDkg(3, 2, 0, Buffer.alloc(16)).initDkg(), /Seed should be 32 bytes, got 16/);
    const user = new DklsVrf.VrfDkg(3, 2, 0);
    await user.initDkg();
    await assert.rejects(() => user.initDkg(), /VRF DKG session already initialized/);
  });

  /**
   * Runs a full seeded ceremony where party 0's session is serialized and restored at
   * the requested point, returning party 0's completed session.
   */
  async function runWithRestore(restoreAfter: 'afterInit' | 'afterRound1'): Promise<DklsVrf.VrfDkg> {
    const user = new DklsVrf.VrfDkg(3, 2, 0, seedUser);
    const backup = new DklsVrf.VrfDkg(3, 2, 1, seedBackup);
    const bitgo = new DklsVrf.VrfDkg(3, 2, 2, seedBitgo);
    const round1 = await Promise.all([user, backup, bitgo].map((p) => p.initDkg()));
    const [userRound1, backupRound1, bitgoRound1] = round1;

    let userSession: DklsVrf.VrfDkg = user;
    if (restoreAfter === 'afterInit') {
      userSession = await DklsVrf.VrfDkg.restoreSession(3, 2, 0, user.getSessionData(), seedUser);
    }
    const userRound2 = await userSession.handleIncomingMessages({
      p2pMessages: [],
      broadcastMessages: [...backupRound1.broadcastMessages, ...bitgoRound1.broadcastMessages],
    });
    if (restoreAfter === 'afterRound1') {
      userSession = await DklsVrf.VrfDkg.restoreSession(3, 2, 0, userSession.getSessionData(), seedUser);
    }
    const backupRound2 = await backup.handleIncomingMessages({
      p2pMessages: [],
      broadcastMessages: [...userRound1.broadcastMessages, ...bitgoRound1.broadcastMessages],
    });
    const bitgoRound2 = await bitgo.handleIncomingMessages({
      p2pMessages: [],
      broadcastMessages: [...userRound1.broadcastMessages, ...backupRound1.broadcastMessages],
    });
    await userSession.handleIncomingMessages({
      p2pMessages: [userRound2, backupRound2, bitgoRound2].flatMap((m) => m.p2pMessages).filter((m) => m.to === 0),
      broadcastMessages: [],
    });
    await backup.handleIncomingMessages({
      p2pMessages: [userRound2, backupRound2, bitgoRound2].flatMap((m) => m.p2pMessages).filter((m) => m.to === 1),
      broadcastMessages: [],
    });
    await bitgo.handleIncomingMessages({
      p2pMessages: [userRound2, backupRound2, bitgoRound2].flatMap((m) => m.p2pMessages).filter((m) => m.to === 2),
      broadcastMessages: [],
    });
    return userSession;
  }
});
