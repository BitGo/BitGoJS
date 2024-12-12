export type ComparableOutput = {
  script: Buffer;
  value: bigint;
};

export type ParseOutputsResult<T extends ComparableOutput> = {
  /** These are the external outputs that were explicitly specified in the transaction */
  explicitExternalOutputs: T[];
  /**
   * These are the surprise external outputs that were not explicitly specified in the transaction.
   * They can be PayGo fees.
   */
  implicitExternalOutputs: T[];
  /**
   * These are the outputs that were expected to be in the transaction but were not found.
   */
  missingOutputs: T[];
};

export function equalOutput<T extends ComparableOutput>(a: T, b: T): boolean {
  return a.value === b.value && a.script.equals(b.script);
}

/**
 * @returns all outputs in the first array that are not in the second array
 * Outputs can occur more than once in each array.
 */
export function outputDifference<T extends ComparableOutput>(first: T[], second: T[]): T[] {
  first = first.slice();
  for (const output of second) {
    const index = first.findIndex((o) => equalOutput(o, output));
    if (index !== -1) {
      first.splice(index, 1);
    }
  }
  return first;
}

/**
 * @param actualExternalOutputs - external outputs in the transaction
 * @param expectedExternalOutputs - external outputs that were expected to be in the transaction
 * @returns the difference between the actual and expected external outputs
 */
export function outputDifferencesWithExpected<T extends ComparableOutput>(
  actualExternalOutputs: T[],
  expectedExternalOutputs: T[]
): ParseOutputsResult<T> {
  const implicitExternalOutputs = outputDifference(actualExternalOutputs, expectedExternalOutputs);
  const explicitExternalOutputs = outputDifference(actualExternalOutputs, implicitExternalOutputs);
  const missingOutputs = outputDifference(expectedExternalOutputs, actualExternalOutputs);
  return {
    explicitExternalOutputs,
    implicitExternalOutputs,
    missingOutputs,
  };
}
