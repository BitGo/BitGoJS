import * as utxolib from '@bitgo/utxo-lib';

/** We receive a proof in the form:
 * 0x18Bitcoin Signed Message:\n<varint_length><ENTROPY><ADDRESS><UUID>
 * and when verifying our message we want to exclude the 0x18Bitcoin Signed Message:\n<varint_length>
 * of the proof so that we are left with the entropy address and uuid as our message.
 * This is what we are going to be verifying.
 *
 * @param proof
 * @returns
 */
export function trimMessagePrefix(proof: Buffer): Buffer {
  const prefix = '\u0018Bitcoin Signed Message:\n';
  if (proof.toString().startsWith(prefix)) {
    proof = proof.slice(Buffer.from(prefix).length);
    utxolib.bufferutils.varuint.decode(proof, 0);
    // Determines how many bytes were consumed during our last varuint.decode(Buffer, offset)
    // So if varuint.decode(0xfd) then varuint.decode.bytes = 3
    // varuint.decode(0xfe) then varuint.decode.bytes = 5, etc.
    const varintBytesLength = utxolib.bufferutils.varuint.decode.bytes;

    proof.slice(varintBytesLength);
  }
  return proof;
}
