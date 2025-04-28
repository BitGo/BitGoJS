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

export interface TokenTransferParams {
  sender: string;
  recipient: string;
  amount: string;
  memo?: string;
}

export interface TokenBalanceData {
  balance: string;
  total_sent: string;
  total_received: string;
}

export interface NativeStxBalance {
  balance: string;
  total_miner_rewards_received: string;
  lock_tx_id: string;
  locked: string;
  lock_height: number;
  burnchain_lock_height: number;
  burnchain_unlock_height: number;
}

export interface SingleFungibleTokenBalance {
  balance: string;
}

export interface StxNonceResponse {
  last_mempool_tx_nonce?: number;
  last_executed_tx_nonce?: number;
  possible_next_nonce: number;
  detected_missing_nonces?: number[];
  detected_mempool_nonces?: number[];
}

export interface StxTxnFeeEstimationResponse {
  estimations: {
    feeRate: number;
    fee: number;
  }[];
}

export interface RecoveryOptions {
  backupKey: string;
  userKey: string;
  rootAddress: string;
  recoveryDestination: string;
  bitgoKey?: string;
  walletPassphrase?: string;
  contractId?: string;
}

export interface RecoveryTransaction {
  txHex: string;
}
