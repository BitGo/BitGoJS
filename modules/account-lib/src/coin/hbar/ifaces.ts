import { KeyPair } from '.';

export interface TxData {
  id: string;
  hash?: string;
  from: string;
  data: string;
  fee: number;
  startTime: string;
}

export interface SignatureData {
  signature: string;
  keyPair: KeyPair;
}
