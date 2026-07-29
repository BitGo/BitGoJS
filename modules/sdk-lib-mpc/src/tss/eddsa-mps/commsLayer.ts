import * as pgp from 'openpgp';
import { MPSSignedMessage } from './types';

/**
 * PGP detached-signs raw WASM bytes with the given private key.
 * Returns an MPSSignedMessage with the base64-encoded payload and armored signature.
 */
export async function detachSignMpsMessage(
  rawBytes: Buffer | Uint8Array,
  signingKey: pgp.PrivateKey
): Promise<MPSSignedMessage> {
  const signature = await pgp.sign({
    message: await pgp.createMessage({ binary: rawBytes }),
    signingKeys: signingKey,
    detached: true,
  });
  return {
    message: Buffer.from(rawBytes).toString('base64'),
    signature: signature as string,
  };
}

/**
 * Verifies a PGP detached signature on an MPSSignedMessage and returns the decoded raw bytes.
 * Throws if the signature is invalid or not present.
 */
export async function verifyMpsMessage(msg: MPSSignedMessage, verificationKey: pgp.Key): Promise<Buffer> {
  const rawBytes = Buffer.from(msg.message, 'base64');
  const result = await pgp.verify({
    message: await pgp.createMessage({ binary: rawBytes }),
    signature: await pgp.readSignature({ armoredSignature: msg.signature }),
    verificationKeys: verificationKey,
    expectSigned: true,
  });
  await result.signatures[0].verified;
  return rawBytes;
}

/**
 * Extracts the X25519 public key bytes from a GPG key's encryption subkey.
 * Works for both public-only and private keys — use this for third-party keys (e.g. BitGo's).
 *
 * @param key - A GPG key with an X25519 encryption subkey.
 * @returns 32-byte X25519 public key.
 */
export async function extractEd25519PublicKey(key: pgp.Key): Promise<Buffer> {
  const { keyPacket } = await key.getEncryptionKey();
  return Buffer.from((keyPacket.publicParams as { Q: Uint8Array }).Q).subarray(1);
}

/**
 * Extracts the X25519 public and private key bytes from a GPG ed25519 private key's
 * encryption subkey. Encapsulates the keyPacket internals and the little-endian scalar
 * reversal in one place so sdk-core only deals with plain Buffers.
 *
 * @param privateKey - An ed25519 GPG private key with an X25519 encryption subkey.
 * @returns  [pk, sk] — 32-byte X25519 public key and private scalar.
 */
export async function extractEd25519KeyPair(privateKey: pgp.PrivateKey): Promise<[Buffer, Buffer]> {
  const encKey = await privateKey.getEncryptionKey();
  const pk = Buffer.from((encKey.keyPacket.publicParams as { Q: Uint8Array }).Q).subarray(1);
  const sk = Buffer.from(
    (encKey.keyPacket as unknown as { privateParams: { d: Uint8Array } }).privateParams.d
  ).reverse();
  return [pk, sk];
}
