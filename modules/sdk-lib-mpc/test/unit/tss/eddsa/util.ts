import crypto from 'crypto';
import { x25519 } from '@noble/curves/ed25519';
import { EddsaMPSDkg } from '../../../../src/tss/eddsa-mps';

/**
 * Generates an X25519 keypair. If a seed is provided (32 bytes), it is used as the
 * private key directly, giving deterministic output. This mirrors how the orchestrator
 * extracts X25519 keys from GPG encryption subkeys.
 */
function generateX25519Keypair(seed?: Buffer): { privKey: Buffer; pubKey: Buffer } {
  const privKey = seed ? seed.subarray(0, 32) : crypto.randomBytes(32);
  const pubKey = Buffer.from(x25519.getPublicKey(privKey));
  return { privKey: Buffer.from(privKey), pubKey };
}

/**
 * Generates EdDSA DKG key shares for 3 parties with optional seeds.
 * Seeds are used as X25519 private keys AND as DKG round0 seeds for full determinism.
 */
export async function generateEdDsaDKGKeyShares(
  seedUser?: Buffer,
  seedBackup?: Buffer,
  seedBitgo?: Buffer
): Promise<[EddsaMPSDkg.DKG, EddsaMPSDkg.DKG, EddsaMPSDkg.DKG]> {
  const user = new EddsaMPSDkg.DKG(3, 2, 0);
  const backup = new EddsaMPSDkg.DKG(3, 2, 1);
  const bitgo = new EddsaMPSDkg.DKG(3, 2, 2);

  const userKP = generateX25519Keypair(seedUser);
  const backupKP = generateX25519Keypair(seedBackup);
  const bitgoKP = generateX25519Keypair(seedBitgo);

  // Each party gets own privKey + other parties' pubKeys sorted by ascending party index
  user.initDkg(userKP.privKey, [backupKP.pubKey, bitgoKP.pubKey]);
  backup.initDkg(backupKP.privKey, [userKP.pubKey, bitgoKP.pubKey]);
  bitgo.initDkg(bitgoKP.privKey, [userKP.pubKey, backupKP.pubKey]);

  // Use seed as DKG round0 seed for determinism when seed is provided
  const r1Messages = [
    user.getFirstMessage(seedUser),
    backup.getFirstMessage(seedBackup),
    bitgo.getFirstMessage(seedBitgo),
  ];

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
