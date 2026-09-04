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
  | ConfigureConfidentialTransferAccount
  | ApplyPendingBalance
  | ConfidentialDeposit
  | ConfidentialWithdraw
  | ConfidentialTransfer
  | VerifyPubkeyValidity
  | VerifyEqualityProof
  | VerifyValidityProof
  | VerifyRangeProof;

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
  | 'ConfigureConfidentialTransferAccount'
  | 'ApplyPendingBalance'
  | 'ConfidentialDeposit'
  | 'ConfidentialWithdraw'
  | 'ConfidentialTransfer'
  | 'VerifyPubkeyValidity'
  | 'VerifyEqualityProof'
  | 'VerifyValidityProof'
  | 'VerifyRangeProof';

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

// ─── Confidential Transfer interfaces (Token-2022 CT extension) ────────────

/**
 * Configures a token account for confidential transfers.
 *
 * Layout: [27][2] + decryptable_zero_balance(36) + maximum_pending_balance_credit_counter(u64) + proof_instruction_offset(i8) = 47 bytes
 *
 * Accounts: [token(writable), mint, instructionsSysvar|contextState, authority(signer)]
 */
export interface ConfigureConfidentialTransferAccount {
  type: InstructionBuilderTypes.ConfigureConfidentialTransferAccount;
  params: {
    tokenAddress: string;
    mintAddress: string;
    authorityAddress: string;
    /** Instructions sysvar (inline proof) or context state account (pre-verified proof). Defaults to instructions sysvar. */
    instructionsSysvarOrContextStateAddress?: string;
    /** AES-encrypted zero balance (36 bytes hex). */
    decryptableZeroBalance: string;
    /** Maximum deposits + transfers before ApplyPendingBalance is required. */
    maximumPendingBalanceCreditCounter: string;
    /** Relative offset to the VerifyPubkeyValidity proof instruction (i8, signed). 0 = use context state account. */
    proofInstructionOffset: number;
  };
}

/**
 * Applies pending balance to available balance.
 *
 * Layout: [27][8] + expected_pending_balance_credit_counter(u64) + new_decryptable_available_balance(36) = 46 bytes
 *
 * Accounts: [token(writable), authority(signer)]
 */
export interface ApplyPendingBalance {
  type: InstructionBuilderTypes.ApplyPendingBalance;
  params: {
    tokenAddress: string;
    authorityAddress: string;
    /** Expected number of pending balance credits since last ApplyPendingBalance. */
    expectedPendingBalanceCreditCounter: string;
    /** AES-encrypted new available balance (36 bytes hex). */
    newDecryptableAvailableBalance: string;
  };
}

/**
 * Deposits public SPL tokens into confidential pending balance.
 *
 * Layout: [27][5] + amount(u64) + decimals(u8) = 11 bytes
 *
 * Accounts: [token(writable), mint, authority(signer)]
 */
export interface ConfidentialDeposit {
  type: InstructionBuilderTypes.ConfidentialDeposit;
  params: {
    tokenAddress: string;
    mintAddress: string;
    authorityAddress: string;
    /** Amount to deposit in base units. */
    amount: string;
    /** Number of decimals for the token. */
    decimals: number;
  };
}

/**
 * Withdraws tokens from confidential available balance to public balance.
 *
 * Layout: [27][6] + amount(u64) + decimals(u8) + new_decryptable_available_balance(36) + equality_proof_offset(i8) + range_proof_offset(i8) = 49 bytes
 *
 * Accounts: [token(writable), mint, instructionsSysvar?, equalityContextState?, rangeContextState?, authority(signer)]
 */
export interface ConfidentialWithdraw {
  type: InstructionBuilderTypes.ConfidentialWithdraw;
  params: {
    tokenAddress: string;
    mintAddress: string;
    authorityAddress: string;
    /** Instructions sysvar address (if proofs are inline). Omit if using context state accounts. */
    instructionsSysvarAddress?: string;
    /** Equality proof context state account (if pre-verified). Omit if using inline proof. */
    equalityProofContextStateAddress?: string;
    /** Range proof context state account (if pre-verified). Omit if using inline proof. */
    rangeProofContextStateAddress?: string;
    /** Amount to withdraw in base units. */
    amount: string;
    /** Number of decimals for the token. */
    decimals: number;
    /** AES-encrypted new available balance after withdrawal (36 bytes hex). */
    newDecryptableAvailableBalance: string;
    /** Relative offset to VerifyCiphertextCommitmentEquality proof (i8). 0 = use context state. */
    equalityProofInstructionOffset: number;
    /** Relative offset to VerifyBatchedRangeProofU64 proof (i8). 0 = use context state. */
    rangeProofInstructionOffset: number;
  };
}

/**
 * Transfers tokens confidentially between two accounts.
 *
 * Layout: [27][7] + new_source_decryptable(36) + auditor_ct_lo(64) + auditor_ct_hi(64) + eq_offset(i8) + validity_offset(i8) + range_offset(i8) = 169 bytes
 *
 * Accounts: [source(writable), mint, dest(writable), instructionsSysvar?, eqCtx?, validityCtx?, rangeCtx?, authority(signer)]
 */
export interface ConfidentialTransfer {
  type: InstructionBuilderTypes.ConfidentialTransfer;
  params: {
    sourceTokenAddress: string;
    mintAddress: string;
    destinationTokenAddress: string;
    authorityAddress: string;
    /** Instructions sysvar address (if proofs are inline). Omit if using context state accounts. */
    instructionsSysvarAddress?: string;
    /** Equality proof context state account (if pre-verified). Omit if using inline proof. */
    equalityProofContextStateAddress?: string;
    /** Ciphertext validity proof context state account (if pre-verified). Omit if using inline proof. */
    ciphertextValidityProofContextStateAddress?: string;
    /** Range proof context state account (if pre-verified). Omit if using inline proof. */
    rangeProofContextStateAddress?: string;
    /** AES-encrypted new source decryptable balance (36 bytes hex). */
    newSourceDecryptableAvailableBalance: string;
    /** Auditor ElGamal ciphertext for transfer amount low 16 bits (64 bytes hex). */
    transferAmountAuditorCiphertextLo: string;
    /** Auditor ElGamal ciphertext for transfer amount high bits (64 bytes hex). */
    transferAmountAuditorCiphertextHi: string;
    /** Relative offset to VerifyCiphertextCommitmentEquality proof (i8). 0 = use context state. */
    equalityProofInstructionOffset: number;
    /** Relative offset to VerifyBatchedGroupedCiphertext3HandlesValidity proof (i8). 0 = use context state. */
    ciphertextValidityProofInstructionOffset: number;
    /** Relative offset to VerifyBatchedRangeProofU128 proof (i8). 0 = use context state. */
    rangeProofInstructionOffset: number;
  };
}

// ─── zk-elgamal-proof verification interfaces ──────────────────────────────

/**
 * Verifies the validity of an ElGamal pubkey (used with ConfigureAccount).
 *
 * Discriminator: [4] + proof_data
 * Program: zk-elgamal-proof
 * Accounts: [] (inline proof) or [contextState(writable), authority] (context state)
 */
export interface VerifyPubkeyValidity {
  type: InstructionBuilderTypes.VerifyPubkeyValidity;
  params: {
    /** Proof data as hex string (inline proof). If omitted, uses context state account + offset. */
    proofData?: string;
    /** Context state account address (if pre-verified proof). */
    contextStateAccountAddress?: string;
    /** Context state authority address (if pre-verified proof). */
    contextStateAuthorityAddress?: string;
  };
}

/**
 * Verifies ciphertext-commitment equality proof (used with Transfer and Withdraw).
 *
 * Discriminator: [3] + proof_data or [3] + offset(u32)
 * Program: zk-elgamal-proof
 */
export interface VerifyEqualityProof {
  type: InstructionBuilderTypes.VerifyEqualityProof;
  params: {
    /** Proof data as hex string (inline proof). If omitted, uses context state account + offset. */
    proofData?: string;
    /** Context state account address (if pre-verified proof). */
    contextStateAccountAddress?: string;
    /** Context state authority address (if pre-verified proof). */
    contextStateAuthorityAddress?: string;
    /** Offset into context state account (if using context state). */
    offset?: number;
  };
}

/**
 * Verifies batched grouped ciphertext 3-handles validity proof (used with Transfer).
 *
 * Discriminator: [12] + proof_data or [12] + offset(u32)
 * Program: zk-elgamal-proof
 */
export interface VerifyValidityProof {
  type: InstructionBuilderTypes.VerifyValidityProof;
  params: {
    /** Proof data as hex string (inline proof). If omitted, uses context state account + offset. */
    proofData?: string;
    /** Context state account address (if pre-verified proof). */
    contextStateAccountAddress?: string;
    /** Context state authority address (if pre-verified proof). */
    contextStateAuthorityAddress?: string;
    /** Offset into context state account (if using context state). */
    offset?: number;
  };
}

/**
 * Verifies batched range proof U128 (used with Transfer).
 *
 * Discriminator: [7] + proof_data or [7] + offset(i32)
 * Program: zk-elgamal-proof
 * Accounts: [] (inline proof) or [contextState(writable), authority] (context state)
 */
export interface VerifyRangeProof {
  type: InstructionBuilderTypes.VerifyRangeProof;
  params: {
    /** Proof data as hex string (inline proof). If omitted, uses context state account + offset. */
    proofData?: string;
    /** Context state account address (if pre-verified proof). */
    contextStateAccountAddress?: string;
    /** Context state authority address (if pre-verified proof). */
    contextStateAuthorityAddress?: string;
    /** Offset into context state account (if using context state). */
    offset?: number;
  };
}

export class TokenAssociateRecipient {
  ownerAddress: string;
  tokenName: string;
  ataAddress?: string;
  tokenAddress?: string;
  programId?: string;
}
