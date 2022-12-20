export interface CoinThatConstructFinalSignedMessageHash {
  constructFinalSignedMessageHash(combineShare: string): string;
}

export function isCoinThatConstructFinalSignedMessageHash(c: unknown): c is CoinThatConstructFinalSignedMessageHash {
  return typeof (c as any).constructFinalSignedMessageHash === 'function';
}
