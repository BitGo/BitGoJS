import { Buffer } from 'buffer';
import { Derive } from '../ecdsa-dkls/derive';
import { VrfDkg } from './dkg';

/**
 * Runs a local 2-of-3 VRF DKG across user (0), backup (1) and bitgo (2) parties and
 * returns the three completed VrfDkg sessions, mirroring `generateDKGKeyShares` from
 * `ecdsa-dkls/util.ts` so VRF tests read like the existing DKLS ones.
 */
export async function generateVrfDKGKeyShares(
  seedUser?: Buffer,
  seedBackup?: Buffer,
  seedBitgo?: Buffer
): Promise<[VrfDkg, VrfDkg, VrfDkg]> {
  const user = new VrfDkg(3, 2, 0, seedUser);
  const backup = new VrfDkg(3, 2, 1, seedBackup);
  const bitgo = new VrfDkg(3, 2, 2, seedBitgo);
  // #region round 1
  const userRound1Messages = await user.initDkg();
  const backupRound1Messages = await backup.initDkg();
  const bitgoRound1Messages = await bitgo.initDkg();
  const bitgoRound2Messages = await bitgo.handleIncomingMessages({
    p2pMessages: [],
    broadcastMessages: [...userRound1Messages.broadcastMessages, ...backupRound1Messages.broadcastMessages],
  });
  // #endregion

  // #region round 2
  const userRound2Messages = await user.handleIncomingMessages({
    p2pMessages: [],
    broadcastMessages: [...bitgoRound1Messages.broadcastMessages, ...backupRound1Messages.broadcastMessages],
  });
  const backupRound2Messages = await backup.handleIncomingMessages({
    p2pMessages: [],
    broadcastMessages: [...userRound1Messages.broadcastMessages, ...bitgoRound1Messages.broadcastMessages],
  });
  await bitgo.handleIncomingMessages({
    p2pMessages: [bitgoRound2Messages, userRound2Messages, backupRound2Messages]
      .flatMap((m) => m.p2pMessages)
      .filter((m) => m.to === 2),
    broadcastMessages: [],
  });
  await user.handleIncomingMessages({
    p2pMessages: [bitgoRound2Messages, userRound2Messages, backupRound2Messages]
      .flatMap((m) => m.p2pMessages)
      .filter((m) => m.to === 0),
    broadcastMessages: [],
  });
  await backup.handleIncomingMessages({
    p2pMessages: [bitgoRound2Messages, userRound2Messages, backupRound2Messages]
      .flatMap((m) => m.p2pMessages)
      .filter((m) => m.to === 1),
    broadcastMessages: [],
  });
  return [user, backup, bitgo];
}

/**
 * Runs the hard-derivation ceremony on top of completed root sessions: the user (0)
 * hard-derive session pairs with a fresh BitGo (2) session, and the backup (1)
 * session with a second fresh BitGo session. The hard-derive wasm session is a
 * 2-party threshold protocol per instance, so the BitGo server side runs two
 * sessions — one per SDK party. All four derived keyshares agree on the child
 * public key; the two BitGo shares are distinct private shares of that same key.
 *
 * @param path hardened derivation path bytes (e.g. `m/0'` as a 4-byte big-endian
 *   index with the hardened bit set)
 * @returns [user, backup, bitgoUserPair, bitgoBackupPair] completed Derive sessions
 */
export async function generateHardDerivedKeyShares(
  userRoot: { getKeyShare(): Buffer },
  backupRoot: { getKeyShare(): Buffer },
  bitgoRoot: { getKeyShare(): Buffer },
  userVrf: VrfDkg,
  backupVrf: VrfDkg,
  bitgoVrf: VrfDkg,
  path: Uint8Array,
  seedUser?: Buffer,
  seedBackup?: Buffer
): Promise<[Derive, Derive, Derive, Derive]> {
  const user = new Derive(3, 2, 0, userRoot.getKeyShare(), userVrf.getKeyShare(), path, seedUser);
  const backup = new Derive(3, 2, 1, backupRoot.getKeyShare(), backupVrf.getKeyShare(), path, seedBackup);
  const bitgoUserPair = new Derive(3, 2, 2, bitgoRoot.getKeyShare(), bitgoVrf.getKeyShare(), path);
  const bitgoBackupPair = new Derive(3, 2, 2, bitgoRoot.getKeyShare(), bitgoVrf.getKeyShare(), path);

  // #region round 1
  const userMsg1 = await user.initDerive();
  const backupMsg1 = await backup.initDerive();
  const bitgoUserPairMsg1 = await bitgoUserPair.initDerive();
  const bitgoBackupPairMsg1 = await bitgoBackupPair.initDerive();

  const userMsg2 = user.handleIncomingMessages({
    p2pMessages: [],
    broadcastMessages: [{ payload: bitgoUserPairMsg1.payload, from: bitgoUserPairMsg1.from }],
  });
  const bitgoUserPairMsg2 = bitgoUserPair.handleIncomingMessages({
    p2pMessages: [],
    broadcastMessages: [{ payload: userMsg1.payload, from: userMsg1.from }],
  });
  const backupMsg2 = backup.handleIncomingMessages({
    p2pMessages: [],
    broadcastMessages: [{ payload: bitgoBackupPairMsg1.payload, from: bitgoBackupPairMsg1.from }],
  });
  const bitgoBackupPairMsg2 = bitgoBackupPair.handleIncomingMessages({
    p2pMessages: [],
    broadcastMessages: [{ payload: backupMsg1.payload, from: backupMsg1.from }],
  });
  // #endregion

  // #region round 2
  user.handleIncomingMessages({
    p2pMessages: [],
    broadcastMessages: [{ payload: bitgoUserPairMsg2.broadcastMessages[0].payload, from: 2 }],
  });
  bitgoUserPair.handleIncomingMessages({
    p2pMessages: [],
    broadcastMessages: [{ payload: userMsg2.broadcastMessages[0].payload, from: 0 }],
  });
  backup.handleIncomingMessages({
    p2pMessages: [],
    broadcastMessages: [{ payload: bitgoBackupPairMsg2.broadcastMessages[0].payload, from: 2 }],
  });
  bitgoBackupPair.handleIncomingMessages({
    p2pMessages: [],
    broadcastMessages: [{ payload: backupMsg2.broadcastMessages[0].payload, from: 1 }],
  });
  // #endregion

  return [user, backup, bitgoUserPair, bitgoBackupPair];
}
