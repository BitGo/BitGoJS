import assert from 'assert';
import { decode } from 'cbor-x';
import { DklsTypes, DklsUtils, DklsVrfUtils } from '../../../../src/tss';
import { DklsDrv } from '../../../../src/tss/ecdsa-dkls';
import { DeriveState } from '../../../../src/tss/ecdsa-dkls/derive';

// Hardened child path `m/0'` as a single big-endian u32 with the hardened bit set.
const PATH_M0 = new Uint8Array([0x80, 0x00, 0x00, 0x00]);

describe('DKLS hard derive (VRF backed)', function () {
  it('should derive a child keyshare for all parties, agreeing on the child public key', async function () {
    const [userRoot, backupRoot, bitgoRoot] = await DklsUtils.generateDKGKeyShares();
    const [vrfUser, vrfBackup, vrfBitgo] = await DklsVrfUtils.generateVrfDKGKeyShares();
    const rootCommonKeychain = DklsTypes.getCommonKeychain(userRoot.getKeyShare());
    assert.equal(rootCommonKeychain, DklsTypes.getCommonKeychain(backupRoot.getKeyShare()));

    const [user, backup, bitgoUserPair, bitgoBackupPair] = await DklsVrfUtils.generateHardDerivedKeyShares(
      userRoot,
      backupRoot,
      bitgoRoot,
      vrfUser,
      vrfBackup,
      vrfBitgo,
      PATH_M0
    );

    const userChild = decode(user.getKeyShare());
    const backupChild = decode(backup.getKeyShare());
    const bitgoUserChild = decode(bitgoUserPair.getKeyShare());
    const bitgoBackupChild = decode(bitgoBackupPair.getKeyShare());

    // All four derived keyshares carry the child common keychain.
    const userChildKeychain = DklsTypes.getCommonKeychain(user.getKeyShare());
    const backupChildKeychain = DklsTypes.getCommonKeychain(backup.getKeyShare());
    const bitgoUserChildKeychain = DklsTypes.getCommonKeychain(bitgoUserPair.getKeyShare());
    const bitgoBackupChildKeychain = DklsTypes.getCommonKeychain(bitgoBackupPair.getKeyShare());
    assert.equal(userChildKeychain, backupChildKeychain);
    assert.equal(userChildKeychain, bitgoUserChildKeychain);
    assert.equal(userChildKeychain, bitgoBackupChildKeychain);
    // The child common keychain differs from the root: the hard-derive tweak moved the key.
    assert.notEqual(userChildKeychain, rootCommonKeychain);

    // All parties keep their identities and agree on the child public key.
    assert.equal(userChild.party_id, 0);
    assert.equal(backupChild.party_id, 1);
    assert.equal(bitgoUserChild.party_id, 2);
    assert.equal(bitgoBackupChild.party_id, 2);
    assert.equal(
      Buffer.from(userChild.public_key).toString('hex'),
      Buffer.from(backupChild.public_key).toString('hex')
    );
    assert.equal(
      Buffer.from(bitgoUserChild.public_key).toString('hex'),
      Buffer.from(bitgoBackupChild.public_key).toString('hex')
    );
    // Private shares differ per party — the two BitGo sessions are distinct shares of the same child key.
    assert.notDeepStrictEqual(userChild.s_i, backupChild.s_i);
    assert.notDeepStrictEqual(bitgoUserChild.s_i, bitgoBackupChild.s_i);
    assert.notDeepStrictEqual(bitgoUserChild.s_i, userChild.s_i);

    // Child keyshares are ordinary DKLS Keyshares (signing material only).
    assert.deepEqual(
      Object.keys(userChild).sort(),
      [
        'big_s_list',
        'final_session_id',
        'party_id',
        'public_key',
        'rank_list',
        'rec_seed_list',
        'root_chain_code',
        's_i',
        'seed_ot_receivers',
        'seed_ot_senders',
        'sent_seed_list',
        'threshold',
        'total_parties',
        'x_i_list',
      ].sort()
    );
  });

  it('should produce a deterministic child public key with fixed root seeds', async function () {
    const seedUser = Buffer.from('a304733c16cc821fe171d5c7dbd7276fd90deae808b7553d17a1e55e4a76b270', 'hex');
    const seedBackup = Buffer.from('9d91c2e6353202cf61f8f275158b3468e9a00f7872fc2fd310b72cd026e2e2f9', 'hex');
    const seedBitgo = Buffer.from('33c749b635cdba7f9fbf51ad0387431cde47e20d8dc13acd1f51a9a0ad06ebfe', 'hex');
    const [userRoot, backupRoot, bitgoRoot] = await DklsUtils.generateDKGKeyShares(
      undefined,
      undefined,
      undefined,
      seedUser,
      seedBackup,
      seedBitgo
    );
    const [vrfUser, vrfBackup, vrfBitgo] = await DklsVrfUtils.generateVrfDKGKeyShares(seedUser, seedBackup, seedBitgo);

    const [user, , bitgoUserPair] = await DklsVrfUtils.generateHardDerivedKeyShares(
      userRoot,
      backupRoot,
      bitgoRoot,
      vrfUser,
      vrfBackup,
      vrfBitgo,
      PATH_M0,
      seedUser,
      seedBackup
    );
    assert.equal(
      DklsTypes.getCommonKeychain(user.getKeyShare()),
      DklsTypes.getCommonKeychain(bitgoUserPair.getKeyShare())
    );
    const firstChild = DklsTypes.getCommonKeychain(user.getKeyShare());

    const [user2] = await DklsVrfUtils.generateHardDerivedKeyShares(
      userRoot,
      backupRoot,
      bitgoRoot,
      vrfUser,
      vrfBackup,
      vrfBitgo,
      PATH_M0,
      seedUser,
      seedBackup
    );
    assert.equal(DklsTypes.getCommonKeychain(user2.getKeyShare()), firstChild);
  });

  it('should reject a party index that does not match the root keyshare party id', async function () {
    const [userRoot] = await DklsUtils.generateDKGKeyShares();
    const [vrfUser] = await DklsVrfUtils.generateVrfDKGKeyShares();
    const mismatched = new DklsDrv.Derive(3, 2, 1, userRoot.getKeyShare(), vrfUser.getKeyShare(), PATH_M0);
    await assert.rejects(() => mismatched.initDerive(), /does not match root key share partyId/);
  });

  it('should expose session data for restore and resume mid-protocol', async function () {
    const [userRoot, backupRoot, bitgoRoot] = await DklsUtils.generateDKGKeyShares();
    const [vrfUser, vrfBackup, vrfBitgo] = await DklsVrfUtils.generateVrfDKGKeyShares();
    // Drive the user pair through round 1, snapshot the user session, then resume it
    // from the snapshot and finish the ceremony: user(0) <-> bitgoA(2), backup(1) <-> bitgoB(2).
    const user = new DklsDrv.Derive(3, 2, 0, userRoot.getKeyShare(), vrfUser.getKeyShare(), PATH_M0);
    const backup = new DklsDrv.Derive(3, 2, 1, backupRoot.getKeyShare(), vrfBackup.getKeyShare(), PATH_M0);
    const bitgoUserPair = new DklsDrv.Derive(3, 2, 2, bitgoRoot.getKeyShare(), vrfBitgo.getKeyShare(), PATH_M0);
    const bitgoBackupPair = new DklsDrv.Derive(3, 2, 2, bitgoRoot.getKeyShare(), vrfBitgo.getKeyShare(), PATH_M0);
    const userMsg1 = await user.initDerive();
    const backupMsg1 = await backup.initDerive();
    const bitgoUserPairMsg1 = await bitgoUserPair.initDerive();
    const bitgoBackupPairMsg1 = await bitgoBackupPair.initDerive();

    const userMsg2 = user.handleIncomingMessages({
      p2pMessages: [],
      broadcastMessages: [{ payload: bitgoUserPairMsg1.payload, from: 2 }],
    });
    const backupMsg2 = backup.handleIncomingMessages({
      p2pMessages: [],
      broadcastMessages: [{ payload: bitgoBackupPairMsg1.payload, from: 2 }],
    });
    const bitgoUserPairMsg2 = bitgoUserPair.handleIncomingMessages({
      p2pMessages: [],
      broadcastMessages: [{ payload: userMsg1.payload, from: 0 }],
    });
    const bitgoBackupPairMsg2 = bitgoBackupPair.handleIncomingMessages({
      p2pMessages: [],
      broadcastMessages: [{ payload: backupMsg1.payload, from: 1 }],
    });

    const snapshot = user.getSessionData();
    assert.equal(snapshot.deriveState, DeriveState.Round2);
    const resumed = await DklsDrv.Derive.restoreSession(
      3,
      2,
      0,
      userRoot.getKeyShare(),
      vrfUser.getKeyShare(),
      PATH_M0,
      snapshot
    );
    resumed.handleIncomingMessages({
      p2pMessages: [],
      broadcastMessages: [{ payload: bitgoUserPairMsg2.broadcastMessages[0].payload, from: 2 }],
    });
    backup.handleIncomingMessages({
      p2pMessages: [],
      broadcastMessages: [{ payload: bitgoBackupPairMsg2.broadcastMessages[0].payload, from: 2 }],
    });
    bitgoUserPair.handleIncomingMessages({
      p2pMessages: [],
      broadcastMessages: [{ payload: userMsg2.broadcastMessages[0].payload, from: 0 }],
    });
    bitgoBackupPair.handleIncomingMessages({
      p2pMessages: [],
      broadcastMessages: [{ payload: backupMsg2.broadcastMessages[0].payload, from: 1 }],
    });
    // The resumed-from-snapshot user session agrees with the live backup on the child key.
    assert.equal(DklsTypes.getCommonKeychain(resumed.getKeyShare()), DklsTypes.getCommonKeychain(backup.getKeyShare()));
  });
});
