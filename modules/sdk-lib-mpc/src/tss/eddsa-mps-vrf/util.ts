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
