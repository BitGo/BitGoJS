import crypto from 'crypto';
import assert from 'assert';
import { x25519 } from '@noble/curves/ed25519';
import { RedPallasDKG } from './dkg';
import { RedPallasDSG } from './dsg';
import { DeserializedMessages, RedPallasSignatureResult } from './types';

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

/**
 * Initializes two RedPallas DSG parties and drives them through the protocol until the
 * specified round. Mirrors `executeTillRound` in `../eddsa-mps/util.ts`, minus the
 * derivation path (RedPallas DSG operates on an already-(root-or-derived) keyshare; there
 * is no per-signing-session derivation path).
 *
 * @param round - Round to execute until (1–3). Returns intermediate message arrays for 1–2,
 *   or the final `RedPallasSignatureResult` (signature/rk/alpha) for 3.
 * @param party1Dsg - First DSG party (`new RedPallasDSG(partyIdx)`), not yet initialized.
 * @param party2Dsg - Second DSG party (`new RedPallasDSG(partyIdx)`), not yet initialized.
 * @param keyShare1 - Key share for the first party.
 * @param keyShare2 - Key share for the second party.
 * @param message - Raw message bytes to sign.
 */
export async function executeTillRound(
  round: number,
  party1Dsg: RedPallasDSG,
  party2Dsg: RedPallasDSG,
  keyShare1: Buffer,
  keyShare2: Buffer,
  message: Buffer
): Promise<DeserializedMessages[] | RedPallasSignatureResult> {
  if (round < 1 || round > 3) {
    throw Error('Invalid round number');
  }
  await party1Dsg.initDsg(keyShare1, message, party2Dsg.getPartyIdx());
  await party2Dsg.initDsg(keyShare2, message, party1Dsg.getPartyIdx());
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

  const sig1 = party1Dsg.getSignature();
  const sig2 = party2Dsg.getSignature();
  assert(sig1.signature.toString('hex') === sig2.signature.toString('hex'));
  assert(sig1.rk.toString('hex') === sig2.rk.toString('hex'));
  assert(sig1.alpha.toString('hex') === sig2.alpha.toString('hex'));
  return sig1;
}

/**
 * Verifies a `RedPallasSignatureResult` against the raw message.
 *
 * IMPORTANT: unlike EdDSA, RedPallas signatures must be verified against `rk` — the
 * randomized verification key produced alongside the signature by DSG round3 — and NOT
 * against the DKG (or derived) public key directly. `rk = pk + [alpha]G`; `alpha` is
 * included in `RedPallasSignatureResult` for callers that need to independently confirm
 * the relationship between `rk` and a known `pk`, but is not required to verify the
 * signature itself.
 */
export async function verifyRedPallasSignature(
  signatureResult: RedPallasSignatureResult,
  message: Buffer
): Promise<boolean> {
  const wasm =
    typeof window !== 'undefined' && !window.process && !window.process?.['type']
      ? // eslint-disable-next-line import/no-internal-modules -- @bitgo/wasm-mps exposes environment-specific subpath exports.
        await import('@bitgo/wasm-mps/web').then(async (webWasm) => {
          await webWasm.default();
          return webWasm;
        })
      : await import('@bitgo/wasm-mps');
  return wasm.redpallas_verify(signatureResult.rk, signatureResult.signature, message);
}
