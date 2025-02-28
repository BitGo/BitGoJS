import assert from 'assert';

import { Descriptor } from '@bitgo/wasm-miniscript';

import { getFixedOutputSum, MaxOutput, Output, PrevOutput } from '../Output';

import { DescriptorMap } from './DescriptorMap';
import { getDescriptorAtIndexCheckScript } from './derive';

export type WithDescriptor<T> = T & {
  descriptor: Descriptor;
};

export type WithOptDescriptor<T> = T & {
  descriptor?: Descriptor;
};

export function isInternalOutput<T extends object>(output: T | WithDescriptor<T>): output is WithDescriptor<T> {
  return 'descriptor' in output && output.descriptor !== undefined;
}

export function isExternalOutput<T extends object>(output: T | WithDescriptor<T>): output is T {
  return !isInternalOutput(output);
}

/**
 * @return the sum of the external outputs that are not 'max'
 * @param outputs
 */
export function getExternalFixedAmount(outputs: WithOptDescriptor<Output | MaxOutput>[]): bigint {
  return getFixedOutputSum(outputs.filter(isExternalOutput));
}

export type DescriptorWalletOutput = PrevOutput & {
  descriptorName: string;
  descriptorIndex: number | undefined;
};

export type DerivedDescriptorWalletOutput = WithDescriptor<PrevOutput>;

export function toDerivedDescriptorWalletOutput(
  output: DescriptorWalletOutput,
  descriptorMap: DescriptorMap
): DerivedDescriptorWalletOutput {
  const descriptor = descriptorMap.get(output.descriptorName);
  if (!descriptor) {
    throw new Error(`Descriptor not found: ${output.descriptorName}`);
  }
  assert(descriptor instanceof Descriptor);
  const descriptorAtIndex = getDescriptorAtIndexCheckScript(
    descriptor,
    output.descriptorIndex,
    output.witnessUtxo.script,
    output.descriptorName
  );
  return {
    hash: output.hash,
    index: output.index,
    witnessUtxo: output.witnessUtxo,
    descriptor: descriptorAtIndex,
  };
}
