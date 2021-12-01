import { Blockhash, SystemInstructionType, TransactionSignature } from '@solana/web3.js';
import { InstructionBuilderTypes } from './constants';

// TODO(STLX-9890): Add the interfaces for validityWindow, feeOptions and SequenceId
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
  numSignatures: number;
  nonce: Blockhash;
  instructionsData: InstructionParams[];
}

export type InstructionParams = Nonce | Memo | WalletInit | Transfer;

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

export type ValidInstructionTypes = SystemInstructionType | 'Memo';
