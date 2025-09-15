import { SolStakingTypeEnum } from '@bitgo/public-types';
import { TransactionExplanation as BaseTransactionExplanation, Recipient, SolInstruction } from '@bitgo/sdk-core';
import { DecodedCloseAccountInstruction } from '@solana/spl-token';
import { Blockhash, StakeInstructionType, SystemInstructionType, TransactionSignature } from '@solana/web3.js';
import { InstructionBuilderTypes } from './constants';
import { StakePoolInstructionType } from '@solana/spl-stake-pool';
import { DepositSolStakePoolData, WithdrawStakeStakePoolData } from './jitoStakePoolOperations';

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

export type InstructionParams =
  | Nonce
  | Memo
  | WalletInit
  | SetPriorityFee
  | Transfer
  | StakingActivate
  | StakingDeactivate
  | StakingWithdraw
  | AtaInit
  | AtaClose
  | TokenTransfer
  | StakingAuthorize
  | StakingDelegate
  | MintTo
  | Burn
  | Approve
  | CustomInstruction;

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
  params: {
    fromAddress: string;
    toAddress: string;
    amount: string;
  };
}

export interface TokenTransfer {
  type: InstructionBuilderTypes.TokenTransfer;
  params: {
    fromAddress: string;
    toAddress: string;
    amount: string;
    tokenName: string;
    sourceAddress: string;
    tokenAddress?: string;
    decimalPlaces?: number;
    programId?: string;
  };
}

export interface MintTo {
  type: InstructionBuilderTypes.MintTo;
  params: {
    mintAddress: string;
    destinationAddress: string;
    authorityAddress: string;
    amount: string;
    tokenName: string;
    decimalPlaces?: number;
    programId?: string;
  };
}

export interface Burn {
  type: InstructionBuilderTypes.Burn;
  params: {
    mintAddress: string;
    accountAddress: string;
    authorityAddress: string;
    amount: string;
    tokenName: string;
    decimalPlaces?: number;
    programId?: string;
  };
}

export interface Approve {
  type: InstructionBuilderTypes.Approve;
  params: {
    accountAddress: string;
    delegateAddress: string;
    ownerAddress: string;
    amount: string;
    programId?: string;
  };
}

export interface JitoStakingActivateParams {
  stakePoolData: DepositSolStakePoolData;
  createAssociatedTokenAccount?: boolean;
}

export type StakingActivateExtraParams = JitoStakingActivateParams;

export interface StakingActivate {
  type: InstructionBuilderTypes.StakingActivate;
  params: {
    fromAddress: string;
    stakingAddress: string;
    amount: string;
    validator: string;
    stakingType: SolStakingTypeEnum;
    extraParams?: StakingActivateExtraParams;
  };
}

export interface StakingDelegate {
  type: InstructionBuilderTypes.StakingDelegate;
  params: { stakingAddress: string; fromAddress: string; validator: string };
}

export interface JitoStakingDeactivateParams {
  stakePoolData: WithdrawStakeStakePoolData;
  validatorAddress: string;
  transferAuthorityAddress: string;
}

export type StakingDeactivateExtraParams = JitoStakingDeactivateParams;

export interface StakingDeactivate {
  type: InstructionBuilderTypes.StakingDeactivate;
  params: {
    fromAddress: string;
    stakingAddress: string;
    amount?: string;
    unstakingAddress?: string;
    stakingType: SolStakingTypeEnum;
    extraParams?: StakingDeactivateExtraParams;
    recipients?: Recipient[];
  };
}

export interface StakingWithdraw {
  type: InstructionBuilderTypes.StakingWithdraw;
  params: { fromAddress: string; stakingAddress: string; amount: string };
}

export interface StakingAuthorize {
  type: InstructionBuilderTypes.StakingAuthorize;
  params: {
    stakingAddress: string;
    oldAuthorizeAddress;
    newAuthorizeAddress: string;
    newWithdrawAddress?: string;
    custodianAddress?: string;
  };
}

export interface SetPriorityFee {
  type: InstructionBuilderTypes.SetPriorityFee;
  params: {
    fee: number | bigint;
  };
}

export interface AtaInit {
  type: InstructionBuilderTypes.CreateAssociatedTokenAccount;
  params: {
    mintAddress: string;
    ataAddress: string;
    ownerAddress: string;
    payerAddress: string;
    tokenName: string;
    programId?: string;
  };
}

export interface AtaClose {
  type: InstructionBuilderTypes.CloseAssociatedTokenAccount;
  params: { accountAddress: string; destinationAddress: string; authorityAddress: string };
}

export type ValidInstructionTypes =
  | SystemInstructionType
  | StakeInstructionType
  | StakePoolInstructionType
  | 'Memo'
  | 'InitializeAssociatedTokenAccount'
  | 'CloseAssociatedTokenAccount'
  | DecodedCloseAccountInstruction
  | 'TokenTransfer'
  | 'SetPriorityFee'
  | 'MintTo'
  | 'Burn'
  | 'Approve'
  | 'CustomInstruction';

export type StakingAuthorizeParams = {
  stakingAddress: string;
  oldWithdrawAddress: string;
  newWithdrawAddress: string;
  custodianAddress?: string;
  oldStakingAuthorityAddress?: string;
  newStakingAuthorityAddress?: string;
};

export type StakingDelegateParams = {
  stakingAddress: string;
  fromAddress: string;
  validator: string;
};

export interface CustomInstruction {
  type: InstructionBuilderTypes.CustomInstruction;
  params: SolInstruction;
}

export interface TransactionExplanation extends BaseTransactionExplanation {
  type: string;
  blockhash: Blockhash;
  // only populated if blockhash is from a nonce account
  durableNonce?: DurableNonceParams;
  memo?: string;
  stakingAuthorize?: StakingAuthorizeParams;
  stakingDelegate?: StakingDelegateParams;
}

export class TokenAssociateRecipient {
  ownerAddress: string;
  tokenName: string;
  ataAddress?: string;
  tokenAddress?: string;
  programId?: string;
}
