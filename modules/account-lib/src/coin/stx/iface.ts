import { PayloadType } from '@stacks/transactions';
import { KeyPair } from '.';

export interface TxData {
  id: string;
  from: string;
  fee: string;
  payload: StacksTransactionPayload;
}
export interface SignatureData {
  type: number;
  data: string;
}

export interface StacksTransactionPayload {
  payloadType: PayloadType;
  memo?: string;
  to?: string;
  amount?: string;
}
