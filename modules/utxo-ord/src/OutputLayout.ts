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
    (TODO)

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
    (TODO)

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
import { SatRange } from './SatRange';

/**
 * A range constraint
 */
export class Constraint {
  /**
   * @param minValue - inclusive
   * @param maxValue - inclusive
   */
  constructor(public minValue: bigint, public maxValue: bigint) {
    if (minValue < 0 || maxValue < minValue) {
      throw new Error(`invalid constraint [${minValue}, ${maxValue}]`);
    }
  }

  /** @return true iff value satisfies constraint */
  check(v: bigint): boolean {
    return new SatRange(this.minValue, this.maxValue).isSupersetOf(v);
  }

  static ZERO = new Constraint(BigInt(0), BigInt(0));
  /** infinity for all practical purposes */
  static MAXSAT = BigInt(21e14);
}

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
 * @param layout
 * @return output sum (including fee output) for layout.
 */
function getLayoutSum(layout: OutputLayout): bigint {
  return toArray(layout).reduce((a, b) => a + b, BigInt(0));
}

/**
 * @param inscriptionInput
 * @param layout
 * @param constraints
 * @return true iff layout satisfies constraints
 */
function check(inscriptionInput: OrdOutput, layout: OutputLayout, constraints: Parameters<Constraint>): boolean {
  if (
    constraints.firstChangeOutput.check(layout.firstChangeOutput) &&
    constraints.inscriptionOutput.check(layout.inscriptionOutput) &&
    constraints.secondChangeOutput.check(layout.secondChangeOutput) &&
    constraints.feeOutput.check(layout.feeOutput) &&
    getLayoutSum(layout) === inscriptionInput.value
  ) {
    /* make sure inscription actually lies on the inscriptionOutput */
    const outputs = getOrdOutputsForLayout(inscriptionInput, layout);
    return outputs.inscriptionOutput?.ordinals.length === 1;
  }

  return false;
}

/**
 * Solves the constraints defined in _p_ to produce a layout by expanding a parameter.
 * Currently only works with one expandable parameter.
 * @param total - the total input sum
 * @param p - the constraint parameters.
 * @return OutputLayout
 */
function toOutputLayout(total: bigint, p: Parameters<Constraint>): OutputLayout | undefined {
  const fixed = Object.values(p).filter((v) => v.minValue === v.maxValue);
  const expandable = Object.values(p).filter((v) => v.minValue !== v.maxValue);
  if (expandable.length === 0) {
    return Object.fromEntries(Object.entries(p).map(([k, v]) => [k, v.minValue])) as OutputLayout;
  }

  if (expandable.length === 1) {
    const sumFixed = fixed.reduce((sum, e) => sum + e.minValue, BigInt(0));
    const remainder = total - sumFixed;
    if (remainder < 0) {
      return;
    }
    for (const k in p) {
      if (p[k as keyof Parameters<unknown>] === expandable[0]) {
        return toOutputLayout(total, { ...p, [k]: new Constraint(remainder, remainder) });
      }
    }
    throw new Error(`illegal state`);
  }

  throw new Error(`cannot expand more than one constraint`);
}

/**
 * High-level constraints for output layout
 */
export type SearchParams = {
  minChange: bigint;
  maxChange: bigint;
  minInscriptionOutput: bigint;
  maxInscriptionOutput: bigint;
  feeFixed: bigint;
  feePerOutput: bigint;
};

/**
 * @param inscriptionInput
 * @param minChange
 * @param maxChange
 * @param minInscriptionOutput
 * @param maxInscriptionOutput
 * @param feeFixed
 * @param feePerOutput
 * @return a solution that satisfies constraints. If no solution can be found, return `undefined`.
 */
export function findOutputLayout(
  inscriptionInput: OrdOutput,
  {
    minChange = BigInt(10_000),
    maxChange = Constraint.MAXSAT,
    minInscriptionOutput = BigInt(10_000),
    maxInscriptionOutput = BigInt(20_000),
    feeFixed,
    feePerOutput,
  }: SearchParams
): OutputLayout | undefined {
  if (inscriptionInput.ordinals.length !== 1) {
    throw new Error(`unexpected ordinal count`);
  }
  if (inscriptionInput.ordinals[0].size() !== BigInt(1)) {
    throw new Error(`only single-satoshi inscriptions are supported`);
  }
  function feeConstraintForOutputCount(n: number) {
    const fee = feeFixed + feePerOutput * BigInt(n);
    return new Constraint(fee, fee);
  }

  const fixedZero = Constraint.ZERO;
  const expandableChangePadding = new Constraint(minChange, maxChange);
  const expandableInscriptionConstraint = new Constraint(minInscriptionOutput, maxInscriptionOutput);
  const fixedMinInscriptionConstraint = new Constraint(minInscriptionOutput, minInscriptionOutput);
  const fixedMaxInscriptionConstraint = new Constraint(maxInscriptionOutput, maxInscriptionOutput);

  const candidates = [
    toParameters(fixedZero, expandableInscriptionConstraint, fixedZero, feeConstraintForOutputCount(1)),
    toParameters(fixedZero, fixedMinInscriptionConstraint, expandableChangePadding, feeConstraintForOutputCount(2)),
    toParameters(fixedZero, fixedMaxInscriptionConstraint, expandableChangePadding, feeConstraintForOutputCount(2)),
    /* TODO(BG-68135): search solution space with change padding at the start */
  ];

  for (const candidate of candidates) {
    const result = toOutputLayout(inscriptionInput.value, candidate);
    if (!result) {
      continue;
    }
    if (check(inscriptionInput, result, candidate)) {
      return result;
    }
  }
}
