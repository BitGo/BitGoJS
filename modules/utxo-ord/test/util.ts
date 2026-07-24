import { OrdOutput, SatRange } from '../src';

export function range(start: number, end: number = start): SatRange {
  return new SatRange(BigInt(start), BigInt(end));
}

export function output(value: number, ...ordinals: SatRange[]): OrdOutput {
  return new OrdOutput(BigInt(value), ordinals);
}
