import * as utxolib from '@bitgo/utxo-lib';

/** We receive a proof in the form:
 * 0x18Bitcoin Signed Message:\n<varint_length><ENTROPY><ADDRESS><UUID>
 * and when verifying our message in our PayGo utils we want to only verify
 * the message portion of our proof. This helps to pare our proof in that format,
 * and returns a Buffer.
 *
 * @param proof
 * @returns
 */
export function parseVaspProof(proof: Buffer): Buffer {
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
