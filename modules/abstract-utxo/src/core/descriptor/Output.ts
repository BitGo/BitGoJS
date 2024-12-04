import { Descriptor } from '@bitgo/wasm-miniscript';

import { DescriptorMap } from './DescriptorMap';
import { createScriptPubKeyFromDescriptor } from './address';

export type Output = {
  script: Buffer;
  value: bigint;
};

export type WithDescriptor<T> = T & {
  descriptor: Descriptor;
};

export type WithOptDescriptor<T> = T & {
  descriptor?: Descriptor;
};

export type PrevOutput = {
  hash: string;
  index: number;
  witnessUtxo: Output;
};

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
    throw new Error(`Script mismatch: descriptor ${output.descriptorName} ${descriptor.toString()} script=${script}`);
  }
  return {
    hash: output.hash,
    index: output.index,
    witnessUtxo: output.witnessUtxo,
    descriptor: descriptor.atDerivationIndex(output.descriptorIndex),
  };
}
