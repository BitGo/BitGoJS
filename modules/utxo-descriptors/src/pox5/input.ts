import { Descriptor, Psbt, descriptorWallet } from '@bitgo/wasm-utxo';

import { Pox5DescriptorInfo, parsePox5LockupDescriptor } from './parseDescriptor';

type ResolvedPox5DescriptorInfo = Pox5DescriptorInfo & {
  stakerKeys: [Buffer, Buffer, Buffer];
};

export type Pox5InputMatch = {
  /** The concrete descriptor whose script matches the input. */
  descriptor: Descriptor;
  /** The derivation index used for a wildcard descriptor, if any. */
  index: number | undefined;
  info: ResolvedPox5DescriptorInfo;
};

function getConcreteDescriptor(descriptor: Descriptor, index: number | undefined): Descriptor {
  return index === undefined ? descriptor : descriptor.atDerivationIndex(index);
}

/**
 * Find and parse a canonical PoX-5 descriptor for a native PSBT input projection.
 *
 * Foreign root derivations are ignored by the shared native descriptor matcher. A
 * match is returned only when all three staker keys can be resolved at the matched
 * descriptor index.
 */
export function findPox5DescriptorForInput(
  input: descriptorWallet.PsbtInput,
  descriptors: descriptorWallet.DescriptorMap
): Pox5InputMatch | undefined {
  try {
    const matched = descriptorWallet.findDescriptorForInput(input, descriptors);
    if (!matched) {
      return undefined;
    }
    const descriptor = getConcreteDescriptor(matched.descriptor, matched.index);
    const info = parsePox5LockupDescriptor(descriptor);
    if (!info?.stakerKeys) {
      return undefined;
    }
    return {
      descriptor,
      index: matched.index,
      info: {
        ...info,
        stakerKeys: info.stakerKeys,
      },
    };
  } catch {
    return undefined;
  }
}

/** Find and parse a canonical PoX-5 descriptor for one native PSBT input. */
export function matchPox5Input(
  psbt: Psbt,
  inputIndex: number,
  descriptors: descriptorWallet.DescriptorMap
): Pox5InputMatch | undefined {
  const input = psbt.getInputs()[inputIndex];
  return input ? findPox5DescriptorForInput(input, descriptors) : undefined;
}
