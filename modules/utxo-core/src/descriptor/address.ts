import { Descriptor } from '@bitgo/wasm-miniscript';
import * as utxolib from '@bitgo/utxo-lib';

export function createScriptPubKeyFromDescriptor(descriptor: Descriptor, index?: number): Buffer {
  if (index === undefined) {
    return Buffer.from(descriptor.scriptPubkey());
  }
  return createScriptPubKeyFromDescriptor(descriptor.atDerivationIndex(index));
}

export function createAddressFromDescriptor(
  descriptor: Descriptor,
  index: number | undefined,
  network: utxolib.Network
): string {
  return utxolib.address.fromOutputScript(createScriptPubKeyFromDescriptor(descriptor, index), network);
}
