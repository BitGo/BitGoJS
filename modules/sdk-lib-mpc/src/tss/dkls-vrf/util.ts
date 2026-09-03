import { Buffer } from 'buffer';
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
