/*

Classes used for tracking sats across transactions.

https://github.com/casey/ord/blob/master/bip.mediawiki#design

> The ordinal numbers of sats in transaction inputs are transferred to output sats in
> first-in-first-out order, according to the size and order of the transactions inputs and outputs.


Sample scenario:
   inputs         i0, i1, i2
   outputs        u0, u1
   inscriptions   r0, r1, r2, r3, r4


createOutputs(
  [i0, i1],
  [
    [u0, [r0, r1]],
    [u1, [r2, r3]],
  ]
);

  r4 is donated to the miner

  ┌────────┬────────┐
  │ i0     │ u0     │
  │        │        │
  │     r0 ┼        │
  │        │        │
  ├────────┤        │
  │ i1     │        │
  │     r1 ┼        │
  │        │        │
  │        ├────────┤
  │        │ u1     │
  │     r2 ┼        │
  │        │        │
  ├────────┤        │
  │ i2     │        │
  │     r3 ┼        │
  │        │        │
  │        │        │
  │        ├────────┘
  │        │
  │     r4 ┼
  │        │
  └────────┘

 */

export class InvalidSatRange extends Error {
  constructor(message: string, public start: bigint, public end: bigint) {
    super(message);
  }
}

/**
 * Range of satoshi, inclusive.
 * Inscriptions have start === end.
 */
export class SatRange {
  constructor(public start: bigint, public end: bigint) {
    if (start < 0 || end < 0 || end < start) {
      throw new InvalidSatRange(`Invalid SatRange [${start}, ${end}]`, start, end);
    }
  }

  /**
   * @param offset
   * @return SatRange with start end end shifted by offset
   */
  shiftedBy(offset: bigint): SatRange {
    return new SatRange(this.start + offset, this.end + offset);
  }

  /** @return true iff this intersects with _other_ */
  intersectsWith(other: SatRange): boolean {
    if (this.start <= other.start) {
      return other.start <= this.end;
    }
    return other.intersectsWith(this);
  }

  /** @return true iff this is superset of _other_. */
  isSupersetOf(other: SatRange): boolean {
    return this.start <= other.start && other.end <= this.end;
  }

  toString(): string {
    if (this.start === this.end) {
      return `[${this.start}]`;
    }
    return `[${this.start}..${this.end}]`;
  }

  size(): bigint {
    return this.end - this.start + BigInt(1);
  }
}

export class InvalidOrdOutput extends Error {
  constructor(message: string, public value: bigint, public ordinals: SatRange[]) {
    super(message);
  }
}

/**
 * The ordinal metadata for an output
 */
export class OrdOutput {
  /**
   * @param value - the input value
   * @param ordinals - The ordinal ranges of an output, relative to the first satoshi.
   *                   Required to be ordered and non-overlapping.
   *                   Not required to be exhaustive.
   */
  constructor(public value: bigint, public ordinals: SatRange[]) {
    const maxRange = new SatRange(BigInt(0), value - BigInt(1));
    ordinals.forEach((r, i) => {
      if (!maxRange.isSupersetOf(r)) {
        throw new InvalidOrdOutput(`range ${r} outside output maxRange ${maxRange}`, value, ordinals);
      }
      if (0 < i) {
        const prevRange = ordinals[i - 1];
        if (r.start <= prevRange.end) {
          throw new InvalidOrdOutput(`SatRange #${i - 1} ${prevRange} overlaps SatRange #${i} ${r}`, value, ordinals);
        }
      }
    });
  }

  /**
   * @param other
   * @return OrdOutput extended by other.value and SatRanges shifted by this.value
   */
  joinedWith(other: OrdOutput): OrdOutput {
    return new OrdOutput(this.value + other.value, [
      ...this.ordinals,
      ...other.ordinals.map((r) => r.shiftedBy(this.value)),
    ]);
  }

  /**
   * @param ords
   * @return single OrdOutput containing all SatRanges, shifted by preceding output values
   */
  static joinAll(ords: OrdOutput[]): OrdOutput {
    if (ords.length === 0) {
      throw new TypeError(`empty input`);
    }
    return ords.reduce((a, b) => a.joinedWith(b));
  }

  /**
   * @param r
   * @return new OrdOutput with all ranges fully contained in _r_. SatRanges are aligned to new start.
   */
  fromSatRange(r: SatRange): OrdOutput {
    return new OrdOutput(
      r.size(),
      this.ordinals.flatMap((s) => {
        if (r.intersectsWith(s)) {
          if (!r.isSupersetOf(s)) {
            throw new Error(`partial overlap in ${r} and ${s}`);
          }
          return s.shiftedBy(-r.start);
        }
        return [];
      })
    );
  }

  /**
   * @param value
   * @return first OrdOutput with value `value`, second OrdOutput with remaining value.
   *         With respective SatRanges
   */
  splitAt(value: bigint): [OrdOutput, OrdOutput] {
    if (this.value < value) {
      throw new Error(`must split at value inside range`);
    }
    return [
      this.fromSatRange(new SatRange(BigInt(0), value - BigInt(1))),
      this.fromSatRange(new SatRange(value, this.value - BigInt(1))),
    ];
  }

  /**
   * Split output successively at values.
   * @param values
   * @return OrdOutput with length _values.length + 1_
   */
  splitAll(values: bigint[]): OrdOutput[] {
    if (values.length === 0) {
      throw new Error(`invalid argument`);
    }
    const [v, ...rest] = values;
    const [a, b] = this.splitAt(v);
    if (rest.length) {
      return [a, ...b.splitAll(rest)];
    } else {
      return [a, b];
    }
  }
}
