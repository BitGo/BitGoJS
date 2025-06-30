import assert from 'assert';

import type { Descriptor } from '@bitgo/wasm-miniscript';
import { miniscript } from '@bitgo/utxo-lib';

/**
 * Get a descriptor at a specific derivation index.
 * For wildcard descriptors (containing '*'), the index is required and used for derivation.
 * For definite descriptors (not containing '*'), no index should be provided.
 * @param descriptor - The descriptor to derive from
 * @param index - The derivation index for wildcard descriptors
 * @returns A new descriptor at the specified index for wildcard descriptors, or the original descriptor for definite ones
 * @throws {Error} If index is undefined for a wildcard descriptor or if index is provided for a definite descriptor
 */
export function getDescriptorAtIndex(descriptor: Descriptor, index: number | undefined): Descriptor {
  assert(descriptor instanceof miniscript.Descriptor);
  miniscript.Descriptor.fromString(descriptor.toString(), 'derivable');
  descriptor = miniscript.Descriptor.fromStringDetectType(descriptor.toString());
  if (descriptor.hasWildcard()) {
    if (index === undefined) {
      throw new Error('Derivable descriptor requires an index');
    }
    return descriptor.atDerivationIndex(index);
  } else {
    if (index !== undefined) {
      throw new Error('Definite descriptor cannot be derived with index');
    }
    return descriptor;
  }
}

export function getDescriptorAtIndexCheckScript(
  descriptor: Descriptor,
  index: number | undefined,
  script: Buffer,
  descriptorString = descriptor.toString()
): Descriptor {
  assert(descriptor instanceof miniscript.Descriptor);
  const descriptorAtIndex = getDescriptorAtIndex(descriptor, index);
  if (!script.equals(descriptorAtIndex.scriptPubkey())) {
    throw new Error(`Script mismatch: descriptor ${descriptorString} script=${script.toString('hex')}`);
  }
  assert(descriptorAtIndex instanceof miniscript.Descriptor);
  return descriptorAtIndex;
}
