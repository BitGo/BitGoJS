import crypto from 'crypto';
import assert from 'assert';
import { x25519 } from '@noble/curves/ed25519';
import { RedPallasDKG } from './dkg';

function generateX25519Keypair(seed?: Buffer): { privKey: Buffer; pubKey: Buffer } {
  const privKey = seed ? seed.subarray(0, 32) : crypto.randomBytes(32);
  const pubKey = Buffer.from(x25519.getPublicKey(privKey));
  return { privKey: Buffer.from(privKey), pubKey };
}

/**
 * Per-party deterministic seed material. To use the same seed for both, pass it as both fields.
 * `encKey` seeds the X25519 encryption key; `dkgSeed` seeds DKG round 0.
 */
export interface RedPallasDKGPartySeed {
  encKey?: Buffer;
  dkgSeed?: Buffer;
}

function validateSeed(seed?: RedPallasDKGPartySeed): RedPallasDKGPartySeed {
  assert(!seed?.encKey || seed.encKey.length >= 32, 'encKey must be at least 32 bytes');
  assert(!seed?.dkgSeed || seed.dkgSeed.length >= 32, 'dkgSeed must be at least 32 bytes');
  return seed ?? {};
}

/**
 * Runs a full 3-party (2-of-3) RedPallas DKG in-process. See `RedPallasDKGPartySeed`.
 * Mirrors `generateEdDsaDKGKeyShares` in `../eddsa-mps/util.ts`.
 *
 * @param derivationSeed - 32-byte seed consumed by round2 for the (platform-side-only)
 *   subsequent derivation process. Must be the same value across all three parties.
 */
export async function generateRedPallasDKGKeyShares(
  derivationSeed: Buffer,
  seedUser?: RedPallasDKGPartySeed,
  seedBackup?: RedPallasDKGPartySeed,
  seedBitgo?: RedPallasDKGPartySeed
): Promise<[RedPallasDKG, RedPallasDKG, RedPallasDKG]> {
  const { encKey: userEncKey, dkgSeed: userDkgSeed } = validateSeed(seedUser);
  const { encKey: backupEncKey, dkgSeed: backupDkgSeed } = validateSeed(seedBackup);
  const { encKey: bitgoEncKey, dkgSeed: bitgoDkgSeed } = validateSeed(seedBitgo);

  const user = new RedPallasDKG(3, 2, 0);
  const backup = new RedPallasDKG(3, 2, 1);
  const bitgo = new RedPallasDKG(3, 2, 2);

  const userKP = generateX25519Keypair(userEncKey);
  const backupKP = generateX25519Keypair(backupEncKey);
  const bitgoKP = generateX25519Keypair(bitgoEncKey);

  await user.initDkg(userKP.privKey, [backupKP.pubKey, bitgoKP.pubKey]);
  await backup.initDkg(backupKP.privKey, [userKP.pubKey, bitgoKP.pubKey]);
  await bitgo.initDkg(bitgoKP.privKey, [userKP.pubKey, backupKP.pubKey]);

  const r1Messages = [
    user.getFirstMessage(userDkgSeed),
    backup.getFirstMessage(backupDkgSeed),
    bitgo.getFirstMessage(bitgoDkgSeed),
  ];

  const r2Messages = [
    ...user.handleIncomingMessages(r1Messages),
    ...backup.handleIncomingMessages(r1Messages),
    ...bitgo.handleIncomingMessages(r1Messages),
  ];

  user.handleIncomingMessages(r2Messages, derivationSeed);
  backup.handleIncomingMessages(r2Messages, derivationSeed);
  bitgo.handleIncomingMessages(r2Messages, derivationSeed);

  return [user, backup, bitgo];
}
