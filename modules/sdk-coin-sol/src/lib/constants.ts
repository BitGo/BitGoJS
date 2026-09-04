import { ValidInstructionTypes } from './iface';

export const MEMO_PROGRAM_PK = 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr';

export const SEED_LENGTH = 32;

export const MAX_MEMO_LENGTH = 130;
export const STAKE_ACCOUNT_RENT_EXEMPT_AMOUNT = 2282880;

export const UNAVAILABLE_TEXT = 'UNAVAILABLE';

/**
 * Sysvar instructions account address — used by Token-2022 confidential transfer
 * instructions to locate inline proof verification instructions in the same transaction.
 */
export const INSTRUCTIONS_SYSVAR_ADDRESS = 'Sysvar1nstructions1111111111111111111111111';

/**
 * Canonical on-chain program id of the zk-elgamal-proof program.
 *
 * This is the same across mainnet, devnet, and testnet — it is a native
 * built-in program. Callers can override via ConfidentialTransferBuilder
 * .zkProofProgramId() if targeting a custom deployment.
 *
 * Note: The deprecated zk-token-proof program id is
 * `ZkTokenProof1111111111111111111111111111111`.
 */
export const ZK_ELGAMAL_PROOF_PROGRAM_ID = 'ZkE1Gama1Proof11111111111111111111111111111';

/**
 * Token-2022 confidential transfer extension discriminator (byte 0 of instruction data).
 */
export const CT_EXT_DISCRIMINATOR = 27;

/**
 * Valid CT sub-instruction discriminators (byte 1 after CT_EXT_DISCRIMINATOR).
 * Used for transaction type detection (getTransactionType / deriveTransactionType).
 */
export const CT_SUB_DISCRIMINATORS = new Set<number>([
  2, // ConfigureAccount
  5, // Deposit
  6, // Withdraw
  7, // Transfer
  8, // ApplyPendingBalance
]);

/**
 * Maximum over-the-wire size of a Solana transaction (in bytes)
 *
 * Source: https://github.com/anza-xyz/agave/blob/v2.1.13/sdk/packet/src/lib.rs#L27-L29
 *
 * Calculation:
 * - IPv6 minimum MTU: 1280 bytes
 * - IPv6 header: 40 bytes
 * - Fragment/UDP header: 8 bytes
 * - Result: 1280 - 40 - 8 = 1232 bytes
 *
 * This limit is designed to avoid packet fragmentation on typical internet infrastructure.
 * Transactions exceeding this limit will fail to serialize with a RangeError during
 * the encoding of the transaction message.
 *
 * Reference: https://solana.com/docs/core/transactions#transaction-size
 */
export const SOLANA_TRANSACTION_MAX_SIZE = 1232;

export const JITO_STAKE_POOL_ADDRESS = 'Jito4APyf642JPZPx3hGc6WWJ8zPKtRbRs4P815Awbb';
export const JITOSOL_MINT_ADDRESS = 'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn';
export const JITO_STAKE_POOL_RESERVE_ACCOUNT = 'BgKUXdS29YcHCFrPm5M8oLHiTzZaMDjsebggjoaQ6KFL';
export const JITO_STAKE_POOL_RESERVE_ACCOUNT_TESTNET = 'rrWBQqRqBXYZw3CmPCCcjFxQ2Ds4JFJd7oRQJ997dhz';
export const JITO_MANAGER_FEE_ACCOUNT = 'feeeFLLsam6xZJFc6UQFrHqkvVt4jfmVvi2BRLkUZ4i';
export const JITO_MANAGER_FEE_ACCOUNT_TESTNET = 'DH7tmjoQ5zjqcgfYJU22JqmXhP5EY1tkbYpgVWUS2oNo';

/**
 * On-chain program id of the sRFC-37 Token ACL program. This single program gates every
 * allowlist/blocklist (DefaultAccountState) Token-2022 mint, so the value is generic and never
 * tied to a specific issuer.
 */
export const TOKEN_ACL_PROGRAM_ID = 'TACLkU6CiCdkQN2MjoyDkVg2yAH9zkxiHDsiztQ52TP';

/**
 * Instruction discriminator (a single u8 byte) for the Token ACL `ThawPermissionlessIdempotent`
 * instruction.
 */
export const THAW_PERMISSIONLESS_IDEMPOTENT_DISCRIMINATOR = 9;

/** PDA seed prefix (under the Token ACL program) for a mint's MintConfig account. */
export const TOKEN_ACL_MINT_CONFIG_SEED = 'MINT_CONFIG';
/** PDA seed prefix (under the Token ACL program) for a token account's thaw flag account. */
export const TOKEN_ACL_FLAG_ACCOUNT_SEED = 'FLAG_ACCOUNT';
/** PDA seed prefix (under the gating program) for a mint's thaw ExtraAccountMetaList account. */
export const TOKEN_ACL_THAW_EXTRA_METAS_SEED = 'thaw_extra_account_metas';

// Sdk instructions, mainly to check decoded types.
export enum ValidInstructionTypesEnum {
  AdvanceNonceAccount = 'AdvanceNonceAccount',
  Create = 'Create',
  InitializeNonceAccount = 'InitializeNonceAccount',
  StakingInitialize = 'Initialize',
  StakingDelegate = 'Delegate',
  StakingDeactivate = 'Deactivate',
  StakingWithdraw = 'Withdraw',
  Transfer = 'Transfer',
  TokenTransfer = 'TokenTransfer',
  Memo = 'Memo',
  InitializeAssociatedTokenAccount = 'InitializeAssociatedTokenAccount',
  CloseAssociatedTokenAccount = 'CloseAssociatedTokenAccount',
  RecoverNestedAssociatedTokenAccount = 'RecoverNestedAssociatedTokenAccount',
  Allocate = 'Allocate',
  Assign = 'Assign',
  Split = 'Split',
  Authorize = 'Authorize',
  SetComputeUnitLimit = 'SetComputeUnitLimit',
  SetPriorityFee = 'SetPriorityFee',
  MintTo = 'MintTo',
  Burn = 'Burn',
  DepositSol = 'DepositSol',
  WithdrawStake = 'WithdrawStake',
  Approve = 'Approve',
  CustomInstruction = 'CustomInstruction',
  PermissionlessThawIdempotent = 'PermissionlessThawIdempotent',
  // Confidential Transfer instruction types (Token-2022 CT extension + zk-elgamal-proof)
  ConfigureConfidentialTransferAccount = 'ConfigureConfidentialTransferAccount',
  ApplyPendingBalance = 'ApplyPendingBalance',
  ConfidentialDeposit = 'ConfidentialDeposit',
  ConfidentialWithdraw = 'ConfidentialWithdraw',
  ConfidentialTransfer = 'ConfidentialTransfer',
  VerifyPubkeyValidity = 'VerifyPubkeyValidity',
  VerifyEqualityProof = 'VerifyEqualityProof',
  VerifyValidityProof = 'VerifyValidityProof',
  VerifyRangeProof = 'VerifyRangeProof',
}

// Internal instructions types
export enum InstructionBuilderTypes {
  CreateNonceAccount = 'CreateNonceAccount',
  StakingActivate = 'Activate',
  StakingDeactivate = 'Deactivate',
  StakingWithdraw = 'Withdraw',
  Transfer = 'Transfer',
  Memo = 'Memo',
  NonceAdvance = 'NonceAdvance',
  CreateAssociatedTokenAccount = 'CreateAssociatedTokenAccount',
  CloseAssociatedTokenAccount = 'CloseAssociatedTokenAccount',
  RecoverNestedAssociatedTokenAccount = 'RecoverNestedAssociatedTokenAccount',
  TokenTransfer = 'TokenTransfer',
  StakingAuthorize = 'Authorize',
  StakingDelegate = 'Delegate',
  SetComputeUnitLimit = 'SetComputeUnitLimit',
  SetPriorityFee = 'SetPriorityFee',
  MintTo = 'MintTo',
  Burn = 'Burn',
  CustomInstruction = 'CustomInstruction',
  VersionedCustomInstruction = 'VersionedCustomInstruction',
  Approve = 'Approve',
  WithdrawStake = 'WithdrawStake',
  PermissionlessThawIdempotent = 'PermissionlessThawIdempotent',
  // Confidential Transfer instruction types (Token-2022 CT extension + zk-elgamal-proof)
  ConfigureConfidentialTransferAccount = 'ConfigureConfidentialTransferAccount',
  ApplyPendingBalance = 'ApplyPendingBalance',
  ConfidentialDeposit = 'ConfidentialDeposit',
  ConfidentialWithdraw = 'ConfidentialWithdraw',
  ConfidentialTransfer = 'ConfidentialTransfer',
  VerifyPubkeyValidity = 'VerifyPubkeyValidity',
  VerifyEqualityProof = 'VerifyEqualityProof',
  VerifyValidityProof = 'VerifyValidityProof',
  VerifyRangeProof = 'VerifyRangeProof',
}

export const VALID_SYSTEM_INSTRUCTION_TYPES: ValidInstructionTypes[] = [
  ValidInstructionTypesEnum.AdvanceNonceAccount,
  ValidInstructionTypesEnum.Create,
  ValidInstructionTypesEnum.StakingInitialize,
  ValidInstructionTypesEnum.StakingDelegate,
  ValidInstructionTypesEnum.StakingDeactivate,
  ValidInstructionTypesEnum.StakingWithdraw,
  ValidInstructionTypesEnum.Transfer,
  ValidInstructionTypesEnum.InitializeNonceAccount,
  ValidInstructionTypesEnum.Memo,
  ValidInstructionTypesEnum.InitializeAssociatedTokenAccount,
  ValidInstructionTypesEnum.CloseAssociatedTokenAccount,
  ValidInstructionTypesEnum.RecoverNestedAssociatedTokenAccount,
  ValidInstructionTypesEnum.TokenTransfer,
  ValidInstructionTypesEnum.Allocate,
  ValidInstructionTypesEnum.Assign,
  ValidInstructionTypesEnum.Split,
  ValidInstructionTypesEnum.Authorize,
  ValidInstructionTypesEnum.SetComputeUnitLimit,
  ValidInstructionTypesEnum.SetPriorityFee,
  ValidInstructionTypesEnum.MintTo,
  ValidInstructionTypesEnum.Burn,
  ValidInstructionTypesEnum.Approve,
  ValidInstructionTypesEnum.DepositSol,
  ValidInstructionTypesEnum.WithdrawStake,
  ValidInstructionTypesEnum.CustomInstruction,
  ValidInstructionTypesEnum.PermissionlessThawIdempotent,
];

/** Const to check the order of the Wallet Init instructions when decode */
export const walletInitInstructionIndexes = {
  Create: 0,
  InitializeNonceAccount: 1,
  Memo: 2,
} as const;

/** Const to check the order of the Staking Activate instructions when decode */
export const stakingActivateInstructionsIndexes = {
  Create: 0,
  Initialize: 1,
  Delegate: 2,
  Memo: 3,
} as const;

/** Const to check the order of the Marinade Staking Activate instructions when decode */
export const marinadeStakingActivateInstructionsIndexes = {
  Create: 0,
  Initialize: 1,
  Memo: 2,
} as const;

/** Const to check the order of the Jito Staking Activate instructions when decode */
export const jitoStakingActivateInstructionsIndexes = {
  DepositSol: 0,
} as const;

/** Const to check the order of the Jito Staking Activate instructions when decode */
export const jitoStakingActivateWithATAInstructionsIndexes = {
  InitializeAssociatedTokenAccount: 0,
  DepositSol: 1,
} as const;

/** Const to check the order of the Jito Staking Activate instructions when decode */
export const jitoStakingDeactivateInstructionsIndexes = {
  Approve: 0,
  Create: 1,
  WithdrawStake: 2,
} as const;

/** Const to check the order of the Staking Authorize instructions when decode */
export const stakingAuthorizeInstructionsIndexes = {
  Authorize: 0,
} as const;

/** Const to check the order of the Staking Delegate instructions when decode */
export const stakingDelegateInstructionsIndexes = {
  Delegate: 0,
} as const;

/** Const to check the order of the Staking Deactivate instructions when decode */
export const stakingDeactivateInstructionsIndexes = {
  Deactivate: 0,
  Memo: 1,
} as const;

/** Const to check the order of the Marinade Staking Deactivate instructions when decode */
export const marinadeStakingDeactivateInstructionsIndexes = {
  Transfer: 0,
  Memo: 1,
} as const;

/** Const to check the order of the Partial Staking Deactivate instructions when decoded */
export const stakingPartialDeactivateInstructionsIndexes = {
  Transfer: 0,
  Allocate: 1,
  Assign: 2,
  Split: 3,
  Deactivate: 4,
  Memo: 5,
} as const;

/** Const to check the order of the Staking Withdraw instructions when decode */
export const stakingWithdrawInstructionsIndexes = {
  Withdraw: 0,
  Memo: 1,
} as const;

/** Const to check the order of the ATA init instructions when decode */
export const ataInitInstructionIndexes = {
  InitializeAssociatedTokenAccount: 0,
  Memo: 1,
} as const;

/** Const to check the order of the ATA init instructions when decode */
export const ataCloseInstructionIndexes = {
  CloseAssociatedTokenAccount: 0,
} as const;

/** Const to check the order of the recover nested ATA instructions when decode */
export const ataRecoverNestedInstructionIndexes = {
  RecoverNestedAssociatedTokenAccount: 0,
} as const;

export const nonceAdvanceInstruction = 'AdvanceNonceAccount';
export const validInstructionData = '0a00000001000000';
export const validInstructionData2 = '0a00000000000000';
