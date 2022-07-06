/* eslint-disable @typescript-eslint/no-explicit-any */
import { ClarityValue, PayloadType } from '@stacks/transactions';

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
  index: number;
  sigHash: string;
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
  functionArgs: ClarityValue[];
}

export interface ClarityValueJson {
  type: string;
  val?: any | TupleData[] | ClarityValueJson;
}

export interface TupleData extends ClarityValueJson {
  key: string;
}

export interface SignResponse {
  signature: string;
  recid: number;
}

export interface AddressDetails {
  address: string;
  memoId?: string;
}

export interface SendParams {
  address: string;
  amount: string;
  memo?: string;
}
