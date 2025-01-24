/*

Utilities for mapping back from PSBT inputs to descriptors.

This is a somewhat brute-force attempt that relies on the `bip32Derivation` field to be set.

It will probably only work correctly if all xpubs in the descriptor are derivable.

We should take a look at a more robust and standard approach like this: https://github.com/bitcoin/bips/pull/1548

 */
import { PsbtInput, PsbtOutput } from 'bip174/src/lib/interfaces';
import { Descriptor } from '@bitgo/wasm-miniscript';

import { DescriptorMap } from '../DescriptorMap';

type DescriptorWithIndex = { descriptor: Descriptor; index: number };

/**
 * Find a descriptor in the descriptor map that matches the given script and derivation index.
 * @param script
 * @param index
 * @param descriptorMap
 * @returns DescriptorWithIndex if found, undefined otherwise
 */
function findDescriptorForDerivationIndex(
  script: Buffer,
  index: number,
  descriptorMap: DescriptorMap
): DescriptorWithIndex | undefined {
  for (const descriptor of descriptorMap.values()) {
    if (Buffer.from(descriptor.atDerivationIndex(index).scriptPubkey()).equals(script)) {
      return { descriptor, index };
    }
  }

  return undefined;
}

function getDerivationIndexFromPath(path: string): number {
  const indexStr = path.split('/').pop();
  if (!indexStr) {
    throw new Error(`Invalid derivation path ${path}`);
  }
  const index = parseInt(indexStr, 10);
  if (index.toString() !== indexStr) {
    throw new Error(`Invalid derivation path ${path}`);
  }
  return index;
}

/**
 * Wrapper around findDescriptorForDerivationPath that tries multiple derivation paths.
 * @param script
 * @param derivationPaths
 * @param descriptorMap
 */
function findDescriptorForAnyDerivationPath(
  script: Buffer,
  derivationPaths: string[],
  descriptorMap: DescriptorMap
): DescriptorWithIndex | undefined {
  const derivationIndexSet = new Set(derivationPaths.map((p) => getDerivationIndexFromPath(p)));
  for (const index of [...derivationIndexSet]) {
    const desc = findDescriptorForDerivationIndex(script, index, descriptorMap);
    if (desc) {
      return desc;
    }
  }

  return undefined;
}

/**
 * @param input
 * @param descriptorMap
 * @returns DescriptorWithIndex for the input if found, undefined otherwise
 */
export function findDescriptorForInput(
  input: PsbtInput,
  descriptorMap: DescriptorMap
): DescriptorWithIndex | undefined {
  const script = input.witnessUtxo?.script;
  if (!script) {
    throw new Error('Missing script');
  }
  if (input.bip32Derivation !== undefined) {
    return findDescriptorForAnyDerivationPath(
      script,
      input.bip32Derivation.map((v) => v.path),
      descriptorMap
    );
  }
  if (input.tapBip32Derivation !== undefined) {
    return findDescriptorForAnyDerivationPath(
      script,
      input.tapBip32Derivation.filter((v) => v.path !== '' && v.path !== 'm').map((v) => v.path),
      descriptorMap
    );
  }
  throw new Error('Missing derivation path');
}

/**
 * @param script - the output script
 * @param output - the PSBT output
 * @param descriptorMap
 * @returns DescriptorWithIndex for the output if found, undefined otherwise
 */
export function findDescriptorForOutput(
  script: Buffer,
  output: PsbtOutput,
  descriptorMap: DescriptorMap
): DescriptorWithIndex | undefined {
  if (!output.bip32Derivation) {
    return undefined;
  }
  return findDescriptorForAnyDerivationPath(
    script,
    output.bip32Derivation.map((d) => d.path),
    descriptorMap
  );
}
