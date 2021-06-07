export interface TxData {
  id: string;
  from: string;
  to?: string;
  fee: number;
  amount?: string;
  firstRound: number;
  lastRound: number;
  note?: Uint8Array;
  voteKey?: string;
  selectionKey?: string;
  voteFirst?: number;
  voteLast?: number;
  voteKeyDilution?: number;
}
