import crypto from 'crypto';

import { varuint } from '@bitgo/utxo-lib';
/** We have a mirrored function similar to our hsm that generates our Bitcoin signed
 * message so that we can use for testing. This creates a random entropy as well using
 * the nilUUID structure to construct our uuid buffer and given our address we can
 * directly encode it into our message.
 *
 * @param attestationPrvKey
 * @param uuid
 * @param address
 * @returns
 */
export function generatePayGoAttestationProof(uuid: string, address: Buffer): Buffer {
  // <0x18Bitcoin Signed Message:\n
  const prefixByte = Buffer.from([0x18]);
  const prefixMessage = Buffer.from('Bitcoin Signed Message:\n');
  const prefixBuffer = Buffer.concat([prefixByte, prefixMessage]);

  // <ENTROPY>
  const entropyLength = 64;
  const entropy = crypto.randomBytes(entropyLength);

  // <UUID>
  const uuidBuffer = Buffer.from(uuid);
  const uuidBufferLength = uuidBuffer.length;

  // <ADDRESS>
  const addressBufferLength = address.length;

  // <VARINT_LENGTH>
  const msgLength = entropyLength + addressBufferLength + uuidBufferLength;
  const msgLengthBuffer = varuint.varuint.encode(msgLength);

  // <0x18Bitcoin Signed Message:\n<LENGTH><ENTROPY><ADDRESS><UUID>
  const proofMessage = Buffer.concat([prefixBuffer, msgLengthBuffer, entropy, address, uuidBuffer]);

  // we sign this with the priv key
  // don't know what sign function to call. Since this is just a mirrored function don't know if we need
  // to include this part.
  // const signedMsg = sign(attestationPrvKey, proofMessage);
  return proofMessage;
}
