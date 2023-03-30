/*

This file contains code for creating an output layouts for transactions that pass on inscriptions.

When passing on an inscription, we want to satisfy a few constraints:

* All outputs should be larger than a minimal value (dust limit)
* The sum of all output values needs to be less than the input to cover the transaction fee.
* The output containing the inscription should be as small as possible, but large enough to
  contain the inscription.

To keep the inscription output small, we can pad the satoshi range preceding and following the range
with change outputs, which have a minimal size and incur a fee cost.


Broadly speaking, there are four scenarios:

(1) Small inscription input that has just enough value to pay for fee and a single inscription
    output (u0). No padding outputs.
    ┌────────┬────────┐
    │        │ u0     │
    │      r ┼        │
    │        ├────────┘
    │        │ fee
    └────────┘


(2) Large inscription input with inscription close to start of input.
    Inscription output followed by change output (u1) padding the remaining value.

    ┌────────┬────────┐
    │        │ u0     │
    │      r ┼        │
    │        ├────────┤
    │        │ u1     │
    │        │        │
    │        │        │
    │        │        │
    │        │        │
    │        │        │
    │        │        │
    │        │        │
    │        │        │
    │        │        │
    │        ├────────┘
    │        │
    │        │ fee
    │        │
    └────────┘


(3) Large inscription input with inscription close to end of input.
    Change output padding start followed by inscription output.

    ┌────────┬────────┐
    │        │ u0     │
    │        │        │
    │        │        │
    │        │        │
    │        │        │
    │        │        │
    │        │        │
    │        │        │
    │        │        │
    │        ├────────┤
    │      r ┼        │
    │        │ u1     │
    │        ├────────┘
    │        │
    │        │ fee
    │        │
    └────────┘


(4) Large inscription input with inscription in the middle.
    Inscription input (u1) with padding on both sides (u0 and u2)

    ┌────────┬────────┐
    │        │ u0     │
    │        │        │
    │        │        │
    │        │        │
    │        │        │
    │        ├────────┤
    │        │ u1     │
    │      r ┼        │
    │        ├────────┤
    │        │ u2     │
    │        │        │
    │        │        │
    │        │        │
    │        ├────────┘
    │        │
    │        │ fee
    │        │
    └────────┘
 */

import { OrdOutput } from './OrdOutput';

const ZERO = BigInt(0);
const ONE = BigInt(1);

function max(a: bigint, b: bigint): bigint {
  return a < b ? b : a;
}

function min(a: bigint, b: bigint): bigint {
  return a < b ? a : b;
}

function sum(arr: bigint[]): bigint {
  return arr.reduce((a, b) => a + b, ZERO);
}

/**
 * A range constraint
 */
type Parameters<T> = {
  /** Padding preceding the inscription output */
  firstChangeOutput: T;
  /** The inscription output that will inherit the input inscription */
  inscriptionOutput: T;
  /** Padding following the inscription output */
  secondChangeOutput: T;
  /** Not a real output, used only to simplify calculations */
  feeOutput: T;
};

/** @return canonical sequence of parameters */
export function toArray<T>(p: Parameters<T>): [T, T, T, T] {
  return [p.firstChangeOutput, p.inscriptionOutput, p.secondChangeOutput, p.feeOutput];
}

export function toParameters<T>(
  firstChangeOutput: T,
  inscriptionOutput: T,
  secondChangeOutput: T,
  feeOutput: T
): Parameters<T> {
  return {
    firstChangeOutput,
    inscriptionOutput,
    secondChangeOutput,
    feeOutput,
  };
}

/** A finished output layout */
export type OutputLayout = Parameters<bigint>;

/**
 * Translates a layout into OrdOutputs. Absent outputs are set to `null`.
 *
 * @param inscriptionInput
 * @param layout
 * @return OrdOutputs for layout
 */
export function getOrdOutputsForLayout(
  inscriptionInput: OrdOutput,
  layout: OutputLayout
): Parameters<OrdOutput | null> {
  const outputs = inscriptionInput.splitAllWithParams(toArray(layout), { exact: true, allowZero: true });
  if (outputs.length !== 4) {
    throw new Error(`unexpected result`);
  }
  type T = OrdOutput | null;
  return toParameters(...(outputs as [T, T, T, T]));
}

/**
 * @param constraints
 * @param inscriptionInput
 * @param layout
 * @return true iff layout satisfies constraints
 */
function check(constraints: Constraints, inscriptionInput: OrdOutput, layout: OutputLayout): boolean {
  if (
    (layout.firstChangeOutput === ZERO || constraints.minChangeOutput <= layout.firstChangeOutput) &&
    (layout.secondChangeOutput === ZERO || constraints.minChangeOutput <= layout.secondChangeOutput) &&
    constraints.minInscriptionOutput <= layout.inscriptionOutput &&
    layout.inscriptionOutput <= constraints.maxInscriptionOutput &&
    getFeeForOutputs(constraints, [layout.firstChangeOutput, layout.inscriptionOutput, layout.secondChangeOutput]) <=
      layout.feeOutput &&
    sum(toArray(layout)) === inscriptionInput.value
  ) {
    /* make sure inscription actually lies on the inscriptionOutput */
    const outputs = getOrdOutputsForLayout(inscriptionInput, layout);
    return outputs.inscriptionOutput?.ordinals.length === 1;
  }

  return false;
}

/**
 * High-level constraints for output layout
 */
export type Constraints = {
  minChangeOutput: bigint;
  minInscriptionOutput: bigint;
  maxInscriptionOutput: bigint;
  feeFixed: bigint;
  feePerOutput: bigint;
  satPos: bigint;
  total: bigint;
};

function getFeeForOutputs(p: { feePerOutput: bigint; feeFixed: bigint }, outputs: bigint[]): bigint {
  return outputs.reduce((sum, oValue): bigint => sum + (oValue === ZERO ? ZERO : p.feePerOutput), p.feeFixed);
}
function getStartChangeOutput(c: Constraints): bigint | null {
  // we don't need a change padding output
  if (c.satPos < c.maxInscriptionOutput) {
    return ZERO;
  }
  if (c.minChangeOutput <= c.satPos) {
    return c.satPos;
  }
  return null;
}

function getInscriptionOutput(c: Constraints, startChangeOutput: bigint): bigint | null {
  const result = min(c.maxInscriptionOutput, max(c.minInscriptionOutput, c.satPos - startChangeOutput + ONE));
  if (c.satPos < startChangeOutput || startChangeOutput + result < c.satPos) {
    return null;
  }
  // if is not worth creating an end change output, let's maximize the inscription output
  if (getEndChangeOutput(c, startChangeOutput, result) === ZERO) {
    const remainder = c.total - startChangeOutput - getFeeForOutputs(c, [startChangeOutput, result]);
    return min(remainder, c.maxInscriptionOutput);
  }
  return result;
}

function getEndChangeOutput(c: Constraints, startChangeOutput: bigint, inscriptionOutput: bigint): bigint | null {
  const remainder = c.total - sum([startChangeOutput, inscriptionOutput]);
  const minFeeWithoutSecondOutput = getFeeForOutputs(c, [startChangeOutput, inscriptionOutput]);
  const minFeeWithSecondOutput = getFeeForOutputs(c, [startChangeOutput, inscriptionOutput, c.minChangeOutput]);
  if (remainder < minFeeWithoutSecondOutput) {
    // We cannot even pay the fee for the output(s) we have so far.
    return null;
  }
  if (remainder - minFeeWithSecondOutput < c.minChangeOutput) {
    // The remainder is too small to pay for the end change output. Let's skip it and pay a higher fee.
    return ZERO;
  }
  // let's use as much as we can for fee while leaving enough for fee
  return remainder - minFeeWithSecondOutput;
}

function getFeeOutput(
  c: Constraints,
  startChangeOutput: bigint,
  inscriptionOutput: bigint,
  endChangeOutput: bigint
): bigint | null {
  const minFee = getFeeForOutputs(c, [startChangeOutput, inscriptionOutput, endChangeOutput]);
  const remainder = c.total - sum([startChangeOutput, inscriptionOutput, endChangeOutput]);
  if (remainder < minFee) {
    return null;
  }
  return remainder;
}

/**
 * @param inscriptionInput
 * @param search
 * @return a solution that satisfies constraints. If no solution can be found, return `undefined`.
 */
export function findOutputLayout(
  inscriptionInput: OrdOutput,
  search: Omit<Constraints, 'satPos' | 'total'>
): OutputLayout | undefined {
  if (inscriptionInput.ordinals.length !== 1) {
    throw new Error(`unexpected ordinal count ${inscriptionInput.ordinals.length}`);
  }
  if (inscriptionInput.ordinals[0].size() !== ONE) {
    throw new Error(`only single-satoshi inscriptions are supported`);
  }

  const satPos = inscriptionInput.ordinals[0].start;
  const total = inscriptionInput.value;

  const constraints: Constraints = { ...search, satPos, total };

  const startChangeOutput = getStartChangeOutput(constraints);
  if (startChangeOutput === null) {
    return;
  }
  const inscriptionOutput = getInscriptionOutput(constraints, startChangeOutput);
  if (inscriptionOutput === null) {
    return;
  }
  const endChangeOutput = getEndChangeOutput(constraints, startChangeOutput, inscriptionOutput);
  if (endChangeOutput === null) {
    return;
  }
  const feeOutput = getFeeOutput(constraints, startChangeOutput, inscriptionOutput, endChangeOutput);
  if (feeOutput === null) {
    return;
  }
  const result = toParameters(startChangeOutput, inscriptionOutput, endChangeOutput, feeOutput);
  if (!check(constraints, inscriptionInput, result)) {
    throw new Error(`invalid result`);
  }
  return result;
}
