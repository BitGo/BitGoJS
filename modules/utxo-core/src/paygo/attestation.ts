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
export function createPayGoAttestationBuffer(address: Buffer, entropy: Buffer, network: utxolib.Network): Buffer {
  assert(address.length > 0);
  const isValidAddress = utxolib.address.fromOutputScript(address, network);
  assert(isValidAddress, `Address ${isValidAddress} is not a valid address.`);
  return Buffer.concat([entropy, address, Buffer.from(NIL_UUID)]);
}
