export interface IShamir {
  split(secret: bigint, threshold: number, numShares: number, indices: Array<number>): Record<number, bigint>;
  combine(shares: Record<number, bigint>): bigint;
}
