import * as utxolib from '@bitgo/utxo-lib';

/** We receive a proof in the form:
 * 0x18Bitcoin Signed Message:\n<varint_length><ENTROPY><ADDRESS><UUID>
 * and trims the 0x18Bitcoin Signed Message:\n<varin_length> and returns
 * our message <ENTROPY><ADDRESS><UUID> in a Buffer.
 *
 * @param proof
 * @returns
 */
export function trimMessagePrefix(proof: Buffer): Buffer {
  const prefix = '\u0018Bitcoin Signed Message:\n';
  const prefixBuffer = Buffer.from(prefix, 'utf-8');
  if (proof.toString().startsWith(prefix)) {
    proof = proof.slice(prefixBuffer.length);
    utxolib.bufferutils.varuint.decode(proof, 0);
    // Determines how many bytes were consumed during our last varuint.decode(Buffer, offset)
    // So if varuint.decode(0xfd) then varuint.decode.bytes = 3
    // varuint.decode(0xfe) then varuint.decode.bytes = 5, etc.
    const varintBytesLength = utxolib.bufferutils.varuint.decode.bytes;

    return proof.slice(varintBytesLength);
  }
  return proof;
}
