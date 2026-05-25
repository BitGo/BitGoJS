import crypto from 'crypto';
import assert from 'assert';
import { x25519 } from '@noble/curves/ed25519';
import { DKG } from './dkg';
import { DSG } from './dsg';
import { DeserializedMessages } from './types';

/**
 * Concatenates multiple Uint8Array instances into a single Uint8Array
 * @param chunks - Array of Uint8Array instances to concatenate
 * @returns Concatenated Uint8Array
 */
export function concatBytes(chunks: Uint8Array[]): Uint8Array {
  const buffers = chunks.map((chunk) => Buffer.from(chunk));
  return new Uint8Array(Buffer.concat(buffers));
}

function generateX25519Keypair(seed?: Buffer): { privKey: Buffer; pubKey: Buffer } {
  const privKey = seed ? seed.subarray(0, 32) : crypto.randomBytes(32);
  const pubKey = Buffer.from(x25519.getPublicKey(privKey));
  return { privKey: Buffer.from(privKey), pubKey };
}

/**
 * Per-party deterministic seed material. To use the same seed for both, pass it as both fields.
 * `encKey` seeds the X25519 encryption key; `dkgSeed` seeds DKG round 0.
 */
export interface EdDsaDKGPartySeed {
  encKey?: Buffer;
  dkgSeed?: Buffer;
}

function validateSeed(seed?: EdDsaDKGPartySeed): EdDsaDKGPartySeed {
  assert(!seed?.encKey || seed.encKey.length >= 32, 'encKey must be at least 32 bytes');
  assert(!seed?.dkgSeed || seed.dkgSeed.length >= 32, 'dkgSeed must be at least 32 bytes');
  return seed ?? {};
}

/** See `EdDsaDKGPartySeed`. Mirrors `DklsUtils.generateDKGKeyShares` for ECDSA DKLS. */
export async function generateEdDsaDKGKeyShares(
  seedUser?: EdDsaDKGPartySeed,
  seedBackup?: EdDsaDKGPartySeed,
  seedBitgo?: EdDsaDKGPartySeed
): Promise<[DKG, DKG, DKG]> {
  const { encKey: userEncKey, dkgSeed: userDkgSeed } = validateSeed(seedUser);
  const { encKey: backupEncKey, dkgSeed: backupDkgSeed } = validateSeed(seedBackup);
  const { encKey: bitgoEncKey, dkgSeed: bitgoDkgSeed } = validateSeed(seedBitgo);

  const user = new DKG(3, 2, 0);
  const backup = new DKG(3, 2, 1);
  const bitgo = new DKG(3, 2, 2);

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

  user.handleIncomingMessages(r2Messages);
  backup.handleIncomingMessages(r2Messages);
  bitgo.handleIncomingMessages(r2Messages);

  return [user, backup, bitgo];
}

/**
 * Initializes two DSG parties and drives them through the protocol until the specified round.
 *
 * @param round - Round to execute until (1–3). Returns intermediate message arrays for 1–2,
 *   or the 64-byte Ed25519 signature Buffer for 3.
 * @param party1Dsg - First DSG party (`new DSG(partyIdx)`), not yet initialized.
 * @param party2Dsg - Second DSG party (`new DSG(partyIdx)`), not yet initialized.
 * @param keyShare1 - Key share for the first party.
 * @param keyShare2 - Key share for the second party.
 * @param message - Raw message bytes to sign.
 * @param derivationPath - BIP-32-style derivation path, e.g. `"m"` or `"m/0/0"`.
 */
export function executeTillRound(
  round: number,
  party1Dsg: DSG,
  party2Dsg: DSG,
  keyShare1: Buffer,
  keyShare2: Buffer,
  message: Buffer,
  derivationPath: string
): DeserializedMessages[] | Buffer {
  if (round < 1 || round > 3) {
    throw Error('Invalid round number');
  }
  party1Dsg.initDsg(keyShare1, message, derivationPath, party2Dsg.getPartyIdx());
  party2Dsg.initDsg(keyShare2, message, derivationPath, party1Dsg.getPartyIdx());
  const party1Round0Message = party1Dsg.getFirstMessage();
  const party2Round0Message = party2Dsg.getFirstMessage();

  const [party2Round1Messages] = party2Dsg.handleIncomingMessages([party1Round0Message, party2Round0Message]);
  const [party1Round1Messages] = party1Dsg.handleIncomingMessages([party1Round0Message, party2Round0Message]);
  if (round === 1) return [[party1Round1Messages], [party2Round1Messages]];

  const [party1Round2Messages] = party1Dsg.handleIncomingMessages([party1Round1Messages, party2Round1Messages]);
  const [party2Round2Messages] = party2Dsg.handleIncomingMessages([party1Round1Messages, party2Round1Messages]);
  if (round === 2) return [[party1Round2Messages], [party2Round2Messages]];

  party1Dsg.handleIncomingMessages([party1Round2Messages, party2Round2Messages]);
  party2Dsg.handleIncomingMessages([party1Round2Messages, party2Round2Messages]);

  assert(party1Dsg.getSignature().toString('hex') === party2Dsg.getSignature().toString('hex'));
  return party1Dsg.getSignature();
}
