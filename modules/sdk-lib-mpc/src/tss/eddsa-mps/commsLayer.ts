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
