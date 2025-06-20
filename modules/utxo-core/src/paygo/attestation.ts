export const NILL_UUID = '00000000-0000-0000-0000-000000000000';

/** This function reconstructs the proof <ENTROPY><ADDRESS><UUID>
 * given the address and entropy.
 *
 * @param address
 * @param entropy
 * @returns
 */
export function createPayGoAttestationBuffer(address: string, entropy: Buffer): Buffer {
  const addressBuffer = Buffer.from(address);
  return Buffer.concat([entropy, addressBuffer, Buffer.from(NILL_UUID)]);
}
