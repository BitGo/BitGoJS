import crypto from 'crypto';
import { x25519 } from '@noble/curves/ed25519';
import { EddsaMPSDkg, EddsaMPSDsg } from '../../../../src/tss/eddsa-mps';
import { DeserializedMessage } from '../../../../src/tss/eddsa-mps/types';

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

/**
 * Runs a full 2-of-3 EdDSA DSG protocol between two parties holding `keyShareA`
 * and `keyShareB`, signing `message` under `derivationPath`.
 *
 * Returns both parties' resulting `DSG` instances so callers can compare signatures
 * (`dsgA.getSignature()` and `dsgB.getSignature()` should be byte-identical) or
 * verify against a public key.
 */
export function runEdDsaDSG(
  keyShareA: Buffer,
  keyShareB: Buffer,
  partyAIdx: number,
  partyBIdx: number,
  message: Buffer,
  derivationPath = 'm'
): { dsgA: EddsaMPSDsg.DSG; dsgB: EddsaMPSDsg.DSG } {
  const dsgA = new EddsaMPSDsg.DSG(partyAIdx);
  const dsgB = new EddsaMPSDsg.DSG(partyBIdx);

  dsgA.initDsg(keyShareA, message, derivationPath, partyBIdx);
  dsgB.initDsg(keyShareB, message, derivationPath, partyAIdx);

  // Round 0 -> SignMsg1
  const a0: DeserializedMessage = dsgA.getFirstMessage();
  const b0: DeserializedMessage = dsgB.getFirstMessage();

  // Round 1 -> SignMsg2
  const [a1] = dsgA.handleIncomingMessages([a0, b0]);
  const [b1] = dsgB.handleIncomingMessages([a0, b0]);

  // Round 2 -> SignMsg3 (partial sig)
  const [a2] = dsgA.handleIncomingMessages([a1, b1]);
  const [b2] = dsgB.handleIncomingMessages([a1, b1]);

  // Round 3 -> Complete (no output messages)
  dsgA.handleIncomingMessages([a2, b2]);
  dsgB.handleIncomingMessages([a2, b2]);

  return { dsgA, dsgB };
}
