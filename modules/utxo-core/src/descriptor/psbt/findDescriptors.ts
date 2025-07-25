/*

Utilities for mapping back from PSBT inputs to descriptors.

This is a somewhat brute-force attempt that relies on the `bip32Derivation` field to be set.

It will probably only work correctly if all xpubs in the descriptor are derivable.

We should take a look at a more robust and standard approach like this: https://github.com/bitcoin/bips/pull/1548

 */
import { PsbtInput, PsbtOutput } from 'bip174/src/lib/interfaces.js';
import { Descriptor } from '@bitgo/wasm-miniscript';

import { DescriptorMap } from '../DescriptorMap.js';

type DescriptorWithoutIndex = { descriptor: Descriptor; index: undefined };

/**
 * Find a definite descriptor in the descriptor map that matches the given script.
 * @param script
 * @param descriptorMap
 */
function findDescriptorWithoutDerivation(
  script: Buffer,
  descriptorMap: DescriptorMap
): DescriptorWithoutIndex | undefined {
  for (const descriptor of descriptorMap.values()) {
    if (!descriptor.hasWildcard()) {
      if (Buffer.from(descriptor.scriptPubkey()).equals(script)) {
        return { descriptor, index: undefined };
      }
    }
  }

  return undefined;
}

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
    if (descriptor.hasWildcard() && Buffer.from(descriptor.atDerivationIndex(index).scriptPubkey()).equals(script)) {
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

type WithBip32Derivation = { bip32Derivation?: { path: string }[] };
type WithTapBip32Derivation = { tapBip32Derivation?: { path: string }[] };

function getDerivationPaths(v: WithBip32Derivation | WithTapBip32Derivation): string[] | undefined {
  if ('bip32Derivation' in v && v.bip32Derivation) {
    return v.bip32Derivation.map((v) => v.path);
  }
  if ('tapBip32Derivation' in v && v.tapBip32Derivation) {
    return v.tapBip32Derivation.map((v) => v.path).filter((v) => v !== '' && v !== 'm');
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
): DescriptorWithIndex | DescriptorWithoutIndex | undefined {
  const script = input.witnessUtxo?.script;
  if (!script) {
    throw new Error('Missing script');
  }
  const derivationPaths = getDerivationPaths(input) ?? [];
  return (
    findDescriptorWithoutDerivation(script, descriptorMap) ??
    findDescriptorForAnyDerivationPath(script, derivationPaths, descriptorMap)
  );
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
): DescriptorWithIndex | DescriptorWithoutIndex | undefined {
  const derivationPaths = getDerivationPaths(output);
  return (
    findDescriptorWithoutDerivation(script, descriptorMap) ??
    (derivationPaths === undefined
      ? undefined
      : findDescriptorForAnyDerivationPath(script, derivationPaths, descriptorMap))
  );
}
