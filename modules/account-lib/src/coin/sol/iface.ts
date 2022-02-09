import { Blockhash, PublicKey, Signer, SystemInstructionType, TransactionSignature } from '@solana/web3.js';
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

export type InstructionParams = Nonce | Memo | WalletInit | Transfer | TokenTransfer;

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

export interface TokenTransfer {
  type: InstructionBuilderTypes.TokenTransfer;
  params: {
    source: string;
    fromAddress: string;
    toAddress: string;
    mint: string;
    amount: string;
    multiSigners: Array<Signer>;
  };
}

export type ValidInstructionTypes = SystemInstructionType | 'Memo' | 'TokenTransfer';

export interface TransactionExplanation extends BaseTransactionExplanation {
  type: string;
  blockhash: Blockhash;
  // only populated if blockhash is from a nonce account
  durableNonce?: DurableNonceParams;
  memo?: string;
}
