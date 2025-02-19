import { Descriptor } from '@bitgo/wasm-miniscript';

import { DescriptorMap } from './DescriptorMap';
import { createScriptPubKeyFromDescriptor } from './address';

export type Output<TValue = bigint> = {
  script: Buffer;
  value: TValue;
};

export type MaxOutput = Output<'max'>;

type ValueBigInt = { value: bigint };
type ValueMax = { value: 'max' };

/**
 * @return true if the output is a max output
 */
export function isMaxOutput<A extends ValueBigInt, B extends ValueMax>(output: A | B): output is B {
  return output.value === 'max';
}

/**
 * @return the max output if there is one
 * @throws if there are multiple max outputs
 */
export function getMaxOutput<A extends ValueBigInt, B extends ValueMax>(outputs: (A | B)[]): B | undefined {
  const max = outputs.filter(isMaxOutput<A, B>);
  if (max.length === 0) {
    return undefined;
  }
  if (max.length > 1) {
    throw new Error('Multiple max outputs');
  }
  return max[0];
}

/**
 * @return the sum of the outputs
 */
export function getOutputSum(outputs: ValueBigInt[]): bigint {
  return outputs.reduce((sum, output) => sum + output.value, 0n);
}

/**
 * @return the sum of the outputs that are not 'max'
 */
export function getFixedOutputSum(outputs: (ValueBigInt | ValueMax)[]): bigint {
  return getOutputSum(outputs.filter((o): o is Output => !isMaxOutput(o)));
}

/**
 * @param outputs
 * @param params
 * @return the outputs with the 'max' output replaced with the max amount
 */
export function toFixedOutputs<A extends ValueBigInt, B extends ValueMax>(
  outputs: (A | B)[],
  params: { maxAmount: bigint }
): A[] {
  // assert that there is at most one max output
  const maxOutput = getMaxOutput<A, B>(outputs);
  return outputs.map((output): A => {
    if (isMaxOutput(output)) {
      if (output !== maxOutput) {
        throw new Error('illegal state');
      }
      return { ...output, value: params.maxAmount };
    } else {
      return output;
    }
  });
}

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
