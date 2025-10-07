import { EddsaMPSDkg, MPSUtil } from '../../../../src/tss/eddsa-mps';

/**
 * Generates EdDSA DKG key shares for 3 parties with optional seeds
 * @param seedUser - Optional seed for user party (party 0)
 * @param seedBackup - Optional seed for backup party (party 1)
 * @param seedBitgo - Optional seed for BitGo party (party 2)
 * @returns Promise resolving to array of Dkg instances [user, backup, bitgo]
 */
export async function generateEdDsaDKGKeyShares(
  seedUser?: Buffer,
  seedBackup?: Buffer,
  seedBitgo?: Buffer
): Promise<[EddsaMPSDkg.DKG, EddsaMPSDkg.DKG, EddsaMPSDkg.DKG]> {
  const user = new EddsaMPSDkg.DKG(3, 2, 0, seedUser);
  const backup = new EddsaMPSDkg.DKG(3, 2, 1, seedBackup);
  const bitgo = new EddsaMPSDkg.DKG(3, 2, 2, seedBitgo);

  const publicKeys = await Promise.all([user.getPublicKey(), backup.getPublicKey(), bitgo.getPublicKey()]);
  const publicKeyConcat = MPSUtil.concatBytes(publicKeys);

  await Promise.all([user.initDkg(publicKeyConcat), backup.initDkg(publicKeyConcat), bitgo.initDkg(publicKeyConcat)]);
  // Complete the DKG protocol
  const r1Messages = [user.getFirstMessage(), backup.getFirstMessage(), bitgo.getFirstMessage()];

  const r2Messages = [
    ...user.handleIncomingMessages(r1Messages),
    ...backup.handleIncomingMessages(r1Messages),
    ...bitgo.handleIncomingMessages(r1Messages),
  ];

  user.handleIncomingMessages(r2Messages);
  backup.handleIncomingMessages(r2Messages);
  bitgo.handleIncomingMessages(r2Messages);

  return [user, backup, bitgo];
}
