import { Buffer } from 'buffer';
import { encode } from 'cbor-x';
import { Derive } from '../ecdsa-dkls/derive';
import { ReducedKeyShare, buildDklsKeyShare, getCommonKeychain, getDecodedReducedKeyShare } from '../ecdsa-dkls/types';
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

/**
 * Builds the multi-level hardened derivation path for a Safe MPC child wallet:
 * `m/44'/<coinType>'/<safeSlotOrdinal>'/<accountIndex>'`, encoded as the byte
 * sequence the DKLS VRF hard-derive wasm expects — four 4-byte big-endian u32s,
 * each with the hardened bit (0x80000000) set, concatenated in order.
 *
 */
export function buildSafeMpcDerivePath(params: {
  coinType: number;
  safeSlotOrdinal: number;
  accountIndex: number;
}): Uint8Array {
  const { coinType, safeSlotOrdinal, accountIndex } = params;
  const segments = [44, coinType, safeSlotOrdinal, accountIndex];
  const path = new Uint8Array(segments.length * 4);
  segments.forEach((segment, i) => {
    if (!Number.isInteger(segment) || segment < 0 || segment > 0x7fffffff) {
      throw new Error(`Invalid BIP44 path segment at index ${i}: ${segment}`);
    }
    path.set([0x80 | (segment >>> 24), (segment >>> 16) & 0xff, (segment >>> 8) & 0xff, segment & 0xff], i * 4);
  });
  return path;
}

export type MpcRootShare = { signing: Buffer; vrf: Buffer };

/**
 * Derives the Safe ecdsaMpc child wallet key for a given account, fully offline, from the
 * user and backup reduced roots on the keycard: rebuild both as 3-party keyshares, run the
 * user↔backup hard-derive ceremony at `m/44'/<coinType>'/3'/<account>'`, then return the child
 * common keychain and both reduced child shares.
 */
export async function deriveSafeEcdsaMpcChild(params: {
  userRoot: MpcRootShare;
  backupRoot: MpcRootShare;
  account: number;
  coinType: number;
}): Promise<{ commonKeychain: string; userChild: string; backupChild: string }> {
  const reduceRootToDklsKeyShare = (reducedRoot: ReducedKeyShare, partyIdx: number): Buffer => {
    const xShare = {
      x: Buffer.from(reducedRoot.prv).toString('hex'),
      y: Buffer.from(reducedRoot.pub).toString('hex'),
      chaincode: Buffer.from(reducedRoot.rootChainCode).toString('hex'),
    };
    return Buffer.from(encode(buildDklsKeyShare({ xShare, n: 3, t: 2, partyIdx, xiList: reducedRoot.xList })));
  };

  const { userRoot, backupRoot, account, coinType } = params;

  const userReduced = getDecodedReducedKeyShare(userRoot.signing);
  const backupReduced = getDecodedReducedKeyShare(backupRoot.signing);

  const userKeyShare = reduceRootToDklsKeyShare(userReduced, 0);
  const backupKeyShare = reduceRootToDklsKeyShare(backupReduced, 1);

  const path = buildSafeMpcDerivePath({ coinType, safeSlotOrdinal: 3, accountIndex: account });

  /**
   * Derive User and Backup keys - 2 Rounds
   */
  const user = new Derive(3, 2, 0, userKeyShare, userRoot.vrf, path);
  const backup = new Derive(3, 2, 1, backupKeyShare, backupRoot.vrf, path);

  // #region round 1
  const userMsg1 = await user.initDerive();
  const backupMsg1 = await backup.initDerive();

  const userMsg2 = user.handleIncomingMessages({
    p2pMessages: [],
    broadcastMessages: [{ payload: backupMsg1.payload, from: backupMsg1.from }],
  });
  const backupMsg2 = backup.handleIncomingMessages({
    p2pMessages: [],
    broadcastMessages: [{ payload: userMsg1.payload, from: userMsg1.from }],
  });
  // #endregion

  // #region round 2
  user.handleIncomingMessages({
    p2pMessages: [],
    broadcastMessages: [
      { payload: backupMsg2.broadcastMessages[0].payload, from: backupMsg2.broadcastMessages[0].from },
    ],
  });
  backup.handleIncomingMessages({
    p2pMessages: [],
    broadcastMessages: [{ payload: userMsg2.broadcastMessages[0].payload, from: userMsg2.broadcastMessages[0].from }],
  });
  // #endregion

  const commonKeychain = getCommonKeychain(user.getKeyShare());

  // Guard: the derived child must never equal the root
  const rootCommonKeychain =
    Buffer.from(userReduced.pub).toString('hex') + Buffer.from(userReduced.rootChainCode).toString('hex');
  if (commonKeychain === rootCommonKeychain) {
    throw new Error('deriveSafeEcdsaMpcChild: derived child keychain equals the root keychain');
  }

  return {
    commonKeychain,
    userChild: user.getReducedKeyShare().toString('base64'),
    backupChild: backup.getReducedKeyShare().toString('base64'),
  };
}
