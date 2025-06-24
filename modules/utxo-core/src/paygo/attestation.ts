import assert from 'assert';

import * as utxolib from '@bitgo/utxo-lib';
export const NIL_UUID = '00000000-0000-0000-0000-000000000000';

/** This function reconstructs the proof <ENTROPY><ADDRESS><UUID>
 * given the address and entropy.
 *
 * @param address
 * @param entropy
 * @returns
 */
export function createPayGoAttestationBuffer(address: string, entropy: Buffer, network: utxolib.Network): Buffer {
  assert(address.length > 0);
  const isValidAddress = utxolib.address.toOutputScript(address, network);
  assert(isValidAddress, `Address ${address} is not a valid address.`);
  const addressBuffer = Buffer.from(address);
  return Buffer.concat([entropy, addressBuffer, Buffer.from(NIL_UUID)]);
}
