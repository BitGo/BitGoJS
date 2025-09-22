import crypto from 'crypto';

import { bufferutils } from '@bitgo-beta/utxo-lib';

import { Prefix } from '../paygo';

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
export function generatePayGoAttestationProof(uuid: string, address: Buffer, hasPrefix = true): Buffer {
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
  const msgLengthBuffer = bufferutils.varuint.encode(msgLength);

  // <LENGTH><ENTROPY><ADDRESS><UUID>
  const proofMessage = Buffer.concat([msgLengthBuffer, entropy, address, uuidBuffer]);

  // If hasPrefix, we return 0x18Bitcoin Signed Message:\n<proof> otherwise its just <proof>
  // where <proof> = <VARINT_LEN><ENTROPY><ADDRESS><UUID>
  return hasPrefix ? Buffer.concat([Prefix, proofMessage]) : proofMessage;
}
