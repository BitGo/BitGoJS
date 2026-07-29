import { SolStakingTypeEnum } from '@bitgo/public-types';
import {
  TransactionExplanation as BaseTransactionExplanation,
  Recipient,
  SolInstruction,
  SolVersionedInstruction,
} from '@bitgo/sdk-core';
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
  | SetComputeUnitLimit
  | SetPriorityFee
  | Transfer
  | StakingActivate
  | StakingDeactivate
  | StakingWithdraw
  | AtaInit
  | AtaClose
  | AtaRecoverNested
  | TokenTransfer
  | StakingAuthorize
  | StakingDelegate
  | MintTo
  | Burn
  | Approve
  | CustomInstruction
  | VersionedCustomInstruction
  | PermissionlessThawIdempotent
  | ConfidentialMint
  | CreateRecordAccount
  | WriteRecordData
  | VerifyEqualityProof
  | VerifyValidityProof
  | VerifyRangeProof
  | CloseRecordAccount
  | CloseContextState
  | ConfigureConfidentialTransferAccount;

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

/**
 * Extra account metadata required by a Token-2022 Transfer Hook.
 *
 * These are resolved live (in the order the hook's ExtraAccountMetaList requires)
 * and supplied to the instruction factory. See {@link TokenTransfer}.
 */
export interface ExtraAccountMeta {
  /** The base58-encoded public key of the account */
  pubkey: string;
  /** Whether the account must sign the transaction */
  isSigner: boolean;
  /** Whether the account is writable */
  isWritable: boolean;
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
    /** Withheld transfer fee in raw base units */
    fee?: string;
    /**
     * Resolved Transfer Hook extra account metas, in the exact order the hook
     * requires. Only used for Token-2022 transfers whose mint has a Transfer
     * Hook extension; resolved live by the caller (offline builders never fetch).
     */
    transferHookAccounts?: ExtraAccountMeta[];
  };
}

/**
 * sRFC-37 Token ACL permissionless thaw (idempotent) instruction.
 *
 * Emitted for allowlist/blocklist (DefaultAccountState) Token-2022 mints so a freshly created
 * (frozen) token account can be thawed atomically in the same transaction as the transfer. The
 * gating-program dependencies (`flagAccount`, `mintConfig`, `gatingProgram`, `extraAccounts`) are
 * resolved live by the caller (see `Sol.resolvePermissionlessThaw`) because builders never fetch.
 */
export interface PermissionlessThawIdempotent {
  type: InstructionBuilderTypes.PermissionlessThawIdempotent;
  params: {
    /** The signer invoking the thaw (fee payer / authority). */
    authority: string;
    /** The Token-2022 mint of the token account being thawed. */
    mint: string;
    /** The token account (ATA) to thaw. */
    tokenAccount: string;
    /** The owner of the token account. */
    tokenAccountOwner: string;
    /** The Token ACL gating program that authorizes the thaw. */
    gatingProgram: string;
    /** PDA (under the Token ACL program) tracking the token account's thaw flag. */
    flagAccount: string;
    /** PDA (under the Token ACL program) holding the mint's Token ACL config. */
    mintConfig: string;
    /** Token program id; defaults to the Token-2022 program when omitted. */
    tokenProgram?: string;
    /** System program id; defaults to the System program when omitted. */
    systemProgram?: string;
    /**
     * Resolved extra account metas required by the gating program, in the exact order the
     * gating program's thaw ExtraAccountMetaList requires. The first entry is the thaw
     * ExtraAccountMetaList PDA itself, followed by any seed/account-derived dependencies.
     */
    extraAccounts: ExtraAccountMeta[];
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

export interface SetComputeUnitLimit {
  type: InstructionBuilderTypes.SetComputeUnitLimit;
  params: {
    units: number;
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

export interface AtaRecoverNested {
  type: InstructionBuilderTypes.RecoverNestedAssociatedTokenAccount;
  params: {
    nestedAccountAddress: string;
    nestedMintAddress: string;
    destinationAccountAddress: string;
    ownerAccountAddress: string;
    ownerMintAddress: string;
    walletAddress: string;
  };
}

export type ValidInstructionTypes =
  | SystemInstructionType
  | StakeInstructionType
  | StakePoolInstructionType
  | 'Memo'
  | 'InitializeAssociatedTokenAccount'
  | 'CloseAssociatedTokenAccount'
  | 'RecoverNestedAssociatedTokenAccount'
  | DecodedCloseAccountInstruction
  | 'TokenTransfer'
  | 'SetComputeUnitLimit'
  | 'SetPriorityFee'
  | 'MintTo'
  | 'Burn'
  | 'Approve'
  | 'CustomInstruction'
  | 'PermissionlessThawIdempotent'
  | 'ConfidentialMint'
  | 'CreateRecordAccount'
  | 'WriteRecordData'
  | 'VerifyEqualityProof'
  | 'VerifyValidityProof'
  | 'VerifyRangeProof'
  | 'CloseRecordAccount'
  | 'CloseContextState'
  | 'ConfigureConfidentialTransferAccount';

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

export interface VersionedCustomInstruction {
  type: InstructionBuilderTypes.VersionedCustomInstruction;
  params: SolVersionedInstruction;
}

export interface VersionedTransactionData {
  versionedInstructions: SolVersionedInstruction[];
  addressLookupTables: AddressLookupTable[];
  staticAccountKeys: string[];
  messageHeader: {
    numRequiredSignatures: number;
    numReadonlySignedAccounts: number;
    numReadonlyUnsignedAccounts: number;
  };
  recentBlockhash?: string;
}

export interface ConfidentialMint {
  type: InstructionBuilderTypes.ConfidentialMint;
  params: {
    tokenAddress: string;
    mintAddress: string;
    authorityAddress: string;
    equalityRecordAddress?: string;
    ciphertextValidityRecordAddress?: string;
    rangeRecordAddress?: string;
    newDecryptableSupply: string;
    mintAmountAuditorCiphertextLo: string;
    mintAmountAuditorCiphertextHi: string;
    equalityProofInstructionOffset: number;
    ciphertextValidityProofInstructionOffset: number;
    rangeProofInstructionOffset: number;
  };
}

export interface CreateRecordAccount {
  type: InstructionBuilderTypes.CreateRecordAccount;
  params: {
    payerAddress: string;
    recordAccountAddress: string;
    recordAccountOwnerAddress: string;
    space: number;
    lamports: number;
  };
}

export interface WriteRecordData {
  type: InstructionBuilderTypes.WriteRecordData;
  params: {
    recordAccountAddress: string;
    recordAccountOwnerAddress: string;
    offset: number;
    data: string;
  };
}

export interface VerifyEqualityProof {
  type: InstructionBuilderTypes.VerifyEqualityProof;
  params: {
    proofAccountAddress: string;
    contextStateAccountAddress: string;
    contextStateAuthorityAddress: string;
    offset?: number;
    proofData?: string;
  };
}

export interface VerifyValidityProof {
  type: InstructionBuilderTypes.VerifyValidityProof;
  params: {
    proofAccountAddress: string;
    contextStateAccountAddress: string;
    contextStateAuthorityAddress: string;
    offset?: number;
    proofData?: string;
  };
}

export interface VerifyRangeProof {
  type: InstructionBuilderTypes.VerifyRangeProof;
  params: {
    proofAccountAddress: string;
    offset?: number;
    proofData?: string;
  };
}

export interface CloseRecordAccount {
  type: InstructionBuilderTypes.CloseRecordAccount;
  params: {
    recordAccountAddress: string;
    destinationAddress: string;
    authorityAddress: string;
  };
}

export interface CloseContextState {
  type: InstructionBuilderTypes.CloseContextState;
  params: {
    contextStateAccountAddress: string;
    destinationAddress: string;
    authorityAddress: string;
  };
}

export interface ConfigureConfidentialTransferAccount {
  type: InstructionBuilderTypes.ConfigureConfidentialTransferAccount;
  params: {
    tokenAddress: string;
    mintAddress: string;
    authorityAddress: string;
    instructionsSysvarOrContextStateAddress?: string;
    decryptableZeroBalance: string;
    maximumPendingBalanceCreditCounter: string;
    proofInstructionOffset: number;
  };
}

export interface AddressLookupTable {
  accountKey: string;
  writableIndexes: number[];
  readonlyIndexes: number[];
}

export interface TransactionExplanation extends BaseTransactionExplanation {
  type: string;
  blockhash: Blockhash;
  // only populated if blockhash is from a nonce account
  durableNonce?: DurableNonceParams;
  memo?: string;
  stakingAuthorize?: StakingAuthorizeParams;
  stakingDelegate?: StakingDelegateParams;
  inputs?: { address: string; value: string; coin?: string }[];
  feePayer?: string;
  ataOwnerMap?: Record<string, string>;
}

export class TokenAssociateRecipient {
  ownerAddress: string;
  tokenName: string;
  ataAddress?: string;
  tokenAddress?: string;
  programId?: string;
}
