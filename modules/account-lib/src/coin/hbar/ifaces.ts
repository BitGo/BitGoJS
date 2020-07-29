export interface TxData {
  id: string;
  hash?: string;
  from: string;
  data: string;
  fee: number;
  startTime: string;
  memo?: string;
  to?: string;
  amount?: string;
}

export interface HederaNode {
  nodeId: string;
}
