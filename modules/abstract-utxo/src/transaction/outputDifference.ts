export type ComparableOutput<TValue> = {
  script: Buffer;
  value: TValue;
};

/** Actual outputs have fixed values. */
export type ActualOutput = ComparableOutput<bigint>;

/** Expected outputs can have a fixed value or 'max'. */
export type ExpectedOutput = ComparableOutput<bigint | 'max'>;

/**
 * @param a
 * @param b
 * @returns whether the two outputs are equal. Outputs with value `max` are considered equal to any other output with the same script.
 */
export function matchingOutput<TValue>(a: ComparableOutput<TValue>, b: ComparableOutput<TValue>): boolean {
  if (a.value === 'max' || b.value === 'max') {
    return a.script.equals(b.script);
  }
  return a.script.equals(b.script) && a.value === b.value;
}

/**
 * @returns all outputs in the first array that are not in the second array.
 * Outputs can occur more than once in each array.
 * An output with value `max` is considered equal to any other output with the same script.
 */
export function outputDifference<A extends ActualOutput | ExpectedOutput, B extends ActualOutput | ExpectedOutput>(
  first: A[],
  second: B[]
): A[] {
  first = first.slice();
  for (const output of second) {
    const index = first.findIndex((o) => matchingOutput(o, output));
    if (index !== -1) {
      first.splice(index, 1);
    }
  }
  return first;
}

export type OutputDifferenceWithExpected<TActual extends ActualOutput, TExpected extends ExpectedOutput> = {
  /** These are the external outputs that were expected and found in the transaction. */
  explicitOutputs: TActual[];
  /**
   * These are the surprise external outputs that were not explicitly specified in the transaction.
   * They can be PayGo fees.
   */
  implicitOutputs: TActual[];
  /**
   * These are the outputs that were expected to be in the transaction but were not found.
   */
  missingOutputs: TExpected[];
};

/**
 * @param actualOutputs - external outputs in the transaction
 * @param expectedOutputs - external outputs that were expected to be in the transaction
 * @returns the difference between the actual and expected external outputs
 */
export function outputDifferencesWithExpected<TActual extends ActualOutput, TExpected extends ExpectedOutput>(
  actualOutputs: TActual[],
  expectedOutputs: TExpected[]
): OutputDifferenceWithExpected<TActual, TExpected> {
  const implicitOutputs = outputDifference(actualOutputs, expectedOutputs);
  const explicitOutputs = outputDifference(actualOutputs, implicitOutputs);
  const missingOutputs = outputDifference(expectedOutputs, actualOutputs);
  return {
    explicitOutputs,
    implicitOutputs,
    missingOutputs,
  };
}
