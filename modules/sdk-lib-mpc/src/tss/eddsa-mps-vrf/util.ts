import assert from 'assert';
import { Derive } from '../eddsa-mps/derive';
import { getDecodedReducedKeyShare } from '../eddsa-mps/types';
import { Buffer } from 'buffer';
import { VrfDkg } from './dkg';

/**
 * Runs a local 2-of-3 VRF DKG across user (0), backup (1) and bitgo (2) parties and
 * returns the three completed VrfDkg sessions, mirroring `generateVrfDKGKeyShares` from
 * `dkls-vrf/util.ts`.
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
  const round1Messages = [userRound1Messages, backupRound1Messages, bitgoRound1Messages];
  // #endregion

  // #region round 2
  const round2Outputs = await Promise.all(
    [user, backup, bitgo].map((party, i) =>
      party.handleIncomingMessages({
        p2pMessages: [],
        broadcastMessages: round1Messages.flatMap((m) => m.broadcastMessages).filter((m) => m.from !== i),
      })
    )
  );
  // #endregion

  // #region finalize
  for (const [i, party] of [user, backup, bitgo].entries()) {
    await party.handleIncomingMessages({
      p2pMessages: round2Outputs.flatMap((m) => m.p2pMessages).filter((m) => m.to === i),
      broadcastMessages: [],
    });
  }
  // #endregion

  return [user, backup, bitgo];
}

export type EddsaMpcRootShare = { signing: Buffer; vrf: Buffer };

/**
 * Derives a Safe eddsaMpc child offline from the user and backup root shares.
 * The root signing share is already present in full in the reduced key-share CBOR;
 * the paired VRF share is required for hardened derivation.
 */
export async function deriveSafeEddsaMpcChild(params: {
  userRoot: EddsaMpcRootShare;
  backupRoot: EddsaMpcRootShare;
  account: number;
  coinType: number;
  safeSlotOrdinal: number;
}): Promise<{ commonKeychain: string; userChild: string; backupChild: string }> {
  const { userRoot, backupRoot, account, coinType, safeSlotOrdinal } = params;
  const userReduced = getDecodedReducedKeyShare(userRoot.signing);
  const backupReduced = getDecodedReducedKeyShare(backupRoot.signing);
  const userRootCommonKeychain =
    Buffer.from(userReduced.pub).toString('hex') + Buffer.from(userReduced.rootChainCode).toString('hex');
  const backupRootCommonKeychain =
    Buffer.from(backupReduced.pub).toString('hex') + Buffer.from(backupReduced.rootChainCode).toString('hex');
  assert.strictEqual(
    userRootCommonKeychain,
    backupRootCommonKeychain,
    'deriveSafeEddsaMpcChild: user and backup root keychains do not match'
  );

  const path = `m/44'/${coinType}'/${safeSlotOrdinal}'/${account}'`;
  const user = new Derive(3, 2, 0, Buffer.from(userReduced.keyShare), userRoot.vrf, path);
  const backup = new Derive(3, 2, 1, Buffer.from(backupReduced.keyShare), backupRoot.vrf, path);

  const [userRound0, backupRound0] = await Promise.all([user.initDerive(), backup.initDerive()]);
  const [userRound1] = user.handleIncomingMessages([backupRound0]);
  const [backupRound1] = backup.handleIncomingMessages([userRound0]);
  assert(userRound1, 'deriveSafeEddsaMpcChild: user derive round 1 did not produce a message');
  assert(backupRound1, 'deriveSafeEddsaMpcChild: backup derive round 1 did not produce a message');
  assert.deepStrictEqual(user.handleIncomingMessages([backupRound1]), []);
  assert.deepStrictEqual(backup.handleIncomingMessages([userRound1]), []);

  const commonKeychain = user.getCommonKeychain();
  assert.strictEqual(
    backup.getCommonKeychain(),
    commonKeychain,
    'deriveSafeEddsaMpcChild: user and backup child keychains do not match'
  );
  assert.notStrictEqual(
    commonKeychain,
    userRootCommonKeychain,
    'deriveSafeEddsaMpcChild: derived child keychain equals the root keychain'
  );

  return {
    commonKeychain,
    userChild: user.getReducedKeyShare().toString('base64'),
    backupChild: backup.getReducedKeyShare().toString('base64'),
  };
}
