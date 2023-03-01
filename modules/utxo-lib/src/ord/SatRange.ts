export class InvalidSatRange extends Error {
  constructor(message: string, public start: bigint, public end: bigint) {
    super(message);
  }
}

function toRange(v: bigint | SatRange): SatRange {
  return typeof v === 'bigint' ? new SatRange(v, v) : v;
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
   * @return SatRange with start and end shifted by offset
   */
  shiftedBy(offset: bigint): SatRange {
    return new SatRange(this.start + offset, this.end + offset);
  }

  /** @return true iff this intersects with _other_ */
  intersectsWith(other: bigint | SatRange): boolean {
    other = toRange(other);
    if (this.start <= other.start) {
      return other.start <= this.end;
    }
    return other.intersectsWith(this);
  }

  /** @return true iff this is superset of _other_. */
  isSupersetOf(other: bigint | SatRange): boolean {
    other = toRange(other);
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
