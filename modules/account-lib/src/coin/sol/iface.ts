import { Blockhash, StakeInstructionType, SystemInstructionType, TransactionSignature } from '@solana/web3.js';
import { InstructionBuilderTypes } from './constants';
import { TransactionExplanation as BaseTransactionExplanation } from '../baseCoin/iface';

// TODO(STLX-9890): Add the interfaces for validityWindow and SequenceId
export interface SolanaKeys {
  prv?: Uint8Array | string;
  pub: string;
}

export interface DurableNonceParams {
  walletNonceAddress: string;
  authWalletAddress: string;
}

export interface TxData {
  id?: TransactionSignature;
  feePayer?: string;
  lamportsPerSignature?: number;
  numSignatures: number;
  nonce: Blockhash;
  // only populated when nonce is from a durable nonce account
  durableNonce?: DurableNonceParams;
  instructionsData: InstructionParams[];
}

export type InstructionParams = Nonce | Memo | WalletInit | Transfer | StakingActivate | StakingDeactivate;

export interface Memo {
  type: InstructionBuilderTypes.Memo;
  params: { memo: string };
}

export interface Nonce {
  type: InstructionBuilderTypes.NonceAdvance;
  params: DurableNonceParams;
}

export interface WalletInit {
  type: InstructionBuilderTypes.CreateNonceAccount;
  params: { fromAddress: string; nonceAddress: string; authAddress: string; amount: string };
}

export interface Transfer {
  type: InstructionBuilderTypes.Transfer;
  params: { fromAddress: string; toAddress: string; amount: string };
}

export interface StakingActivate {
  type: InstructionBuilderTypes.StakingActivate;
  params: { fromAddress: string; stakingAddress: string; amount: string; validator: string };
}

export interface StakingDeactivate {
  type: InstructionBuilderTypes.StakingDeactivate;
  params: { fromAddress: string; stakingAddress: string };
}

export type ValidInstructionTypes = SystemInstructionType | StakeInstructionType | 'Memo';

export interface TransactionExplanation extends BaseTransactionExplanation {
  type: string;
  blockhash: Blockhash;
  // only populated if blockhash is from a nonce account
  durableNonce?: DurableNonceParams;
  memo?: string;
}
