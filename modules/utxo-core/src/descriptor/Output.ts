import { Descriptor } from '@bitgo/wasm-miniscript';

import { getFixedOutputSum, MaxOutput, Output, PrevOutput } from '../Output';

import { DescriptorMap } from './DescriptorMap';
import { createScriptPubKeyFromDescriptor } from './address';

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
  descriptorIndex: number;
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
  const derivedDescriptor = descriptor.atDerivationIndex(output.descriptorIndex);
  const script = createScriptPubKeyFromDescriptor(derivedDescriptor);
  if (!script.equals(output.witnessUtxo.script)) {
    throw new Error(
      `Script mismatch: descriptor ${output.descriptorName} ${descriptor.toString()} script=${script.toString('hex')}`
    );
  }
  return {
    hash: output.hash,
    index: output.index,
    witnessUtxo: output.witnessUtxo,
    descriptor: descriptor.atDerivationIndex(output.descriptorIndex),
  };
}
