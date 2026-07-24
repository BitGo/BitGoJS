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

export type PrevOutput = {
  hash: string;
  index: number;
  witnessUtxo: Output;
};
