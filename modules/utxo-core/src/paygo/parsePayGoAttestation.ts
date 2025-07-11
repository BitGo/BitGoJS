import assert from 'assert';

import { bufferutils } from '@bitgo/utxo-lib';

// The signed address will always have the following structure:
// 0x18Bitcoin Signed Message:\n<varint_length><ENTROPY><ADDRESS><UUID>
export const Prefix = Buffer.from('\u0018Bitcoin Signed Message:\n', 'utf-8');

// UUID has the structure 00000000-0000-0000-0000-000000000000, and after
// we Buffer.from and get it's length its 36.
const UuidBufferLength = 36;
// The entropy will always be 64 bytes
const EntropyLen = 64;

/**
 * This function takes in the attestation proof of a PayGo address of the from
 * <varint_length><ENTROPY><ADDRESS><UUID> and returns
 * the address given its length. It is assumed that the ENTROPY is 64 bytes in the Buffer
 * so if not given an address proof length we can still extract the address from the proof.
 *
 * @param message
 * @param adressProofLength
 */
export function parsePayGoAttestation(message: Buffer): {
  entropy: Buffer;
  address: Buffer;
  uuid: Buffer;
} {
  if (message.length <= EntropyLen + UuidBufferLength) {
    throw new Error('PayGo attestation proof is too short to contain a valid address');
  }

  // This generates the first part before the varint length so that we can
  // determine how many bytes this is and iterate through the Buffer.
  let offset = 0;
  if (message.toString('hex').startsWith(Prefix.toString('hex'))) {
    offset = Prefix.length;
  }

  // we decode the varint of the message which is uint32
  // https://en.bitcoin.it/wiki/Protocol_documentation
  const varInt = bufferutils.varuint.decode(message, offset);
  assert(varInt);
  offset += bufferutils.varuint.decode.bytes;

  const entropy = message.subarray(offset, offset + EntropyLen);
  offset += EntropyLen;
  const address = message.subarray(offset, message.length - UuidBufferLength);
  offset += address.length;
  const uuid = message.subarray(message.length - UuidBufferLength);

  // we break up the original message and retuen the entropy, address and uuid in their buffers
  return { entropy, address, uuid };
}
