import { ClarityAbiType, PayloadType } from '@stacks/transactions';
import { KeyPair } from '.';

export interface TxData {
  id: string;
  from: string;
  fee: string;
  nonce: number;
  payload: StacksTransactionPayload | StacksContractPayload;
}
export interface SignatureData {
  type: number;
  data: string;
}

export interface StacksTransactionPayload {
  readonly payloadType: PayloadType.TokenTransfer;
  memo?: string;
  to: string;
  amount: string;
}

export interface StacksContractPayload {
  readonly payloadType: PayloadType.ContractCall;
  contractAddress: string;
  contractName: string;
  functionName: string;
  functionArgs: ClarityValueJson[];
}

export interface ClarityValueJson {
  type: string;
  value: string;
}

export interface SignResponse {
  signature: string;
  recid: number;
}
