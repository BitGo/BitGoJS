export interface SplitSecret {
  shares: Record<number, bigint>;
  v: Array<bigint>;
}
