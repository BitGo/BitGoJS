/**
 * Maps BitGoJS InstructionParams to wasm-solana TransactionIntent format.
 *
 * This mapper enables building Solana transactions via WASM instead of @solana/web3.js,
 * providing deterministic transaction construction without JavaScript BigInt quirks.
 *
 * Architecture:
 * - Microservices: BaseIntent (payment, stake) -> generateXxxData() -> buildParams + recipients
 * - SDK: buildParams + recipients -> TransactionBuilder -> _instructionsData: InstructionParams[]
 * - This mapper: InstructionParams[] -> TransactionIntent -> WASM buildTransaction()
 *
 * Supported staking types:
 * - Native: Full staking operations (activate, deactivate, partial deactivate, withdraw)
 * - Marinade: Activate and deactivate (liquid staking)
 * - Jito: Activate and deactivate (stake pool operations)
 */
import {
  TransactionIntent,
  NonceSource,
  BuilderInstruction,
  TransferInstruction,
  MemoInstruction,
  NonceAdvanceInstruction,
  NonceInitializeInstruction,
  ComputeBudgetInstruction,
  TokenTransferInstruction,
  CreateAssociatedTokenAccountInstruction,
  CloseAssociatedTokenAccountInstruction,
  StakeInitializeInstruction,
  StakeDelegateInstruction,
  StakeDeactivateInstruction,
  StakeWithdrawInstruction,
  StakeAuthorizeInstruction,
  StakeSplitInstruction,
  AllocateInstruction,
  AssignInstruction,
  MintToInstruction,
  BurnInstruction,
  ApproveInstruction,
  CreateAccountInstruction,
  StakePoolDepositSolInstruction,
  StakePoolWithdrawStakeInstruction,
  BuilderCustomInstruction,
  // Program ID constants
  systemProgramId,
  stakeProgramId,
  stakeAccountSpace,
  nonceAccountSpace,
  tokenProgramId,
  // PDA derivation functions (eliminates @solana/web3.js dependency)
  getAssociatedTokenAddress,
  findWithdrawAuthorityProgramAddress,
} from '@bitgo/wasm-solana';
import { InstructionBuilderTypes, STAKE_ACCOUNT_RENT_EXEMPT_AMOUNT } from './constants';
import {
  InstructionParams,
  Transfer,
  Memo,
  Nonce,
  WalletInit,
  TokenTransfer,
  AtaInit,
  AtaClose,
  StakingActivate,
  StakingDeactivate,
  StakingWithdraw,
  StakingAuthorize,
  StakingDelegate,
  SetPriorityFee,
  SetComputeUnitLimit,
  MintTo,
  Burn,
  Approve,
  DurableNonceParams,
  JitoStakingActivateParams,
  JitoStakingDeactivateParams,
  CustomInstruction,
} from './iface';
import { BuildTransactionError, SolInstruction } from '@bitgo/sdk-core';

// Program ID constants from wasm-solana (avoid pulling in full @solana/web3.js)
const SYSTEM_PROGRAM_ID = systemProgramId();
const STAKE_PROGRAM_ID = stakeProgramId();
const TOKEN_PROGRAM_ID = tokenProgramId();
const STAKE_ACCOUNT_SPACE = Number(stakeAccountSpace());
const NONCE_ACCOUNT_LENGTH = Number(nonceAccountSpace());

/**
 * Parameters for mapping InstructionParams to TransactionIntent
 */
export interface IntentMapperParams {
  /** The fee payer address */
  feePayer: string;
  /** The recent blockhash or nonce value */
  recentBlockhash: string;
  /** Durable nonce parameters, if using durable nonce */
  durableNonceParams?: DurableNonceParams;
  /** The instruction params to convert */
  instructionsData: InstructionParams[];
  /** Optional memo to append */
  memo?: string;
  /** Address lookup tables for versioned transactions */
  addressLookupTables?: Array<{ accountKey: string; writableIndexes: number[]; readonlyIndexes: number[] }>;
  /** Static account keys for versioned transactions */
  staticAccountKeys?: string[];
}

/**
 * Maps BitGoJS InstructionParams array to wasm-solana TransactionIntent.
 *
 * This enables building transactions through WASM instead of @solana/web3.js.
 *
 * @param params - The parameters containing fee payer, nonce, and instructions
 * @returns A TransactionIntent that can be passed to buildTransaction()
 */
export function mapToTransactionIntent(params: IntentMapperParams): TransactionIntent {
  const {
    feePayer,
    recentBlockhash,
    durableNonceParams,
    instructionsData,
    memo,
    addressLookupTables,
    staticAccountKeys,
  } = params;

  // Always use blockhash nonce source - durable nonce is handled via NonceAdvance instruction
  // This ensures compatibility with legacy builder's tx.nonceInfo handling
  const nonce: NonceSource = {
    type: 'blockhash',
    value: recentBlockhash,
  };

  // Map instructions
  const instructions: BuilderInstruction[] = [];

  // If using durable nonce, prepend NonceAdvance instruction
  // (legacy builder stores this in tx.nonceInfo separately from _instructionsData)
  if (durableNonceParams) {
    instructions.push({
      type: 'nonceAdvance',
      nonce: durableNonceParams.walletNonceAddress,
      authority: durableNonceParams.authWalletAddress,
    } as NonceAdvanceInstruction);
  }

  for (const instructionParam of instructionsData) {
    const mapped = mapInstruction(instructionParam);
    instructions.push(...mapped);
  }

  // Add memo if present and not already in instructions
  if (memo) {
    const hasMemo = instructions.some((instr) => instr.type === 'memo');
    if (!hasMemo) {
      instructions.push({
        type: 'memo',
        message: memo,
      } as MemoInstruction);
    }
  }

  const intent: TransactionIntent = {
    feePayer,
    nonce,
    instructions,
  };

  // Add versioned transaction fields if present
  if (addressLookupTables && addressLookupTables.length > 0) {
    intent.addressLookupTables = addressLookupTables;
  }
  if (staticAccountKeys && staticAccountKeys.length > 0) {
    intent.staticAccountKeys = staticAccountKeys;
  }

  return intent;
}

/**
 * Set of instruction types supported by the WASM builder.
 */
// WASM-supported instruction types for testnet (tsol)
//
// IMPORTANT: WASM (Rust) and legacy (@solana/web3.js) builders may produce different byte
// representations for the same logical transaction. Both are valid Solana transactions that
// execute identically on-chain. Key differences include:
//
// 1. Account ordering: Solana allows different orderings in the accounts array
// 2. CreateAssociatedTokenAccount: WASM uses the modern format with 6 accounts, while
//    legacy @solana/web3.js uses the older format with 7 accounts (including Rent sysvar).
//    The Rent sysvar was made optional in newer versions of the ATA program because
//    modern Solana runtime provides rent information implicitly via syscalls.
//    See: https://github.com/solana-labs/solana-program-library/blob/master/associated-token-account/program/src/processor.rs
//    (The program accepts both 6 and 7 account formats for backwards compatibility)
//
const WASM_SUPPORTED_INSTRUCTIONS = new Set([
  // Basic operations
  InstructionBuilderTypes.Transfer,
  InstructionBuilderTypes.Memo,
  InstructionBuilderTypes.NonceAdvance,
  InstructionBuilderTypes.SetPriorityFee,
  InstructionBuilderTypes.SetComputeUnitLimit,
  // Token operations
  InstructionBuilderTypes.TokenTransfer,
  InstructionBuilderTypes.CreateAssociatedTokenAccount,
  InstructionBuilderTypes.CloseAssociatedTokenAccount,
  InstructionBuilderTypes.MintTo,
  InstructionBuilderTypes.Burn,
  InstructionBuilderTypes.Approve,
  // Staking operations
  InstructionBuilderTypes.StakingActivate,
  InstructionBuilderTypes.StakingDeactivate,
  InstructionBuilderTypes.StakingWithdraw,
  InstructionBuilderTypes.StakingAuthorize,
  InstructionBuilderTypes.StakingDelegate,
  // Nonce/wallet operations
  InstructionBuilderTypes.CreateNonceAccount,
  // Custom instructions (arbitrary program invocation)
  InstructionBuilderTypes.CustomInstruction,
]);

/**
 * Check if all instructions in the list are supported by the WASM builder.
 */
export function areInstructionsSupportedByWasm(instructions: InstructionParams[]): boolean {
  return instructions.every((instr) => WASM_SUPPORTED_INSTRUCTIONS.has(instr.type));
}

/**
 * Maps a single InstructionParams to one or more wasm-solana Instructions.
 *
 * Some BitGoJS instruction types (like StakingActivate) expand to multiple
 * underlying Solana instructions.
 */
function mapInstruction(param: InstructionParams): BuilderInstruction[] {
  switch (param.type) {
    case InstructionBuilderTypes.Transfer:
      return [mapTransfer(param as Transfer)];

    case InstructionBuilderTypes.Memo:
      return [mapMemo(param as Memo)];

    case InstructionBuilderTypes.NonceAdvance:
      return [mapNonceAdvance(param as Nonce)];

    case InstructionBuilderTypes.SetComputeUnitLimit:
      return [mapComputeUnitLimit(param as SetComputeUnitLimit)];

    case InstructionBuilderTypes.SetPriorityFee:
      return [mapPriorityFee(param as SetPriorityFee)];

    case InstructionBuilderTypes.TokenTransfer:
      return [mapTokenTransfer(param as TokenTransfer)];

    case InstructionBuilderTypes.CreateAssociatedTokenAccount:
      return [mapAtaInit(param as AtaInit)];

    case InstructionBuilderTypes.CloseAssociatedTokenAccount:
      return [mapAtaClose(param as AtaClose)];

    case InstructionBuilderTypes.StakingActivate:
      return mapStakingActivate(param as StakingActivate);

    case InstructionBuilderTypes.StakingDeactivate:
      return mapStakingDeactivate(param as StakingDeactivate);

    case InstructionBuilderTypes.StakingWithdraw:
      return [mapStakingWithdraw(param as StakingWithdraw)];

    case InstructionBuilderTypes.StakingAuthorize:
      return mapStakingAuthorize(param as StakingAuthorize);

    case InstructionBuilderTypes.StakingDelegate:
      return [mapStakingDelegate(param as StakingDelegate)];

    case InstructionBuilderTypes.MintTo:
      return [mapMintTo(param as MintTo)];

    case InstructionBuilderTypes.Burn:
      return [mapBurn(param as Burn)];

    case InstructionBuilderTypes.Approve:
      return [mapApprove(param as Approve)];

    case InstructionBuilderTypes.CreateNonceAccount:
      return mapCreateNonceAccount(param as WalletInit);

    case InstructionBuilderTypes.CustomInstruction:
      return [mapCustomInstruction(param as CustomInstruction)];

    default:
      throw new BuildTransactionError(`Unsupported instruction type for WASM builder: ${(param as any).type}`);
  }
}

// =============================================================================
// Individual Instruction Mappers
// =============================================================================

function mapTransfer(param: Transfer): TransferInstruction {
  return {
    type: 'transfer',
    from: param.params.fromAddress,
    to: param.params.toAddress,
    lamports: BigInt(param.params.amount),
  };
}

function mapMemo(param: Memo): MemoInstruction {
  return {
    type: 'memo',
    message: param.params.memo,
  };
}

function mapNonceAdvance(param: Nonce): NonceAdvanceInstruction {
  return {
    type: 'nonceAdvance',
    nonce: param.params.walletNonceAddress,
    authority: param.params.authWalletAddress,
  };
}

/**
 * Maps CreateNonceAccount to CreateAccount + NonceInitialize instructions.
 * Nonce account space is 80 bytes (exported from wasm-solana as nonceAccountSpace).
 */
function mapCreateNonceAccount(param: WalletInit): BuilderInstruction[] {
  const { fromAddress, nonceAddress, authAddress, amount } = param.params;

  return [
    {
      type: 'createAccount',
      from: fromAddress,
      newAccount: nonceAddress,
      lamports: BigInt(amount),
      space: NONCE_ACCOUNT_LENGTH,
      owner: SYSTEM_PROGRAM_ID,
    } as CreateAccountInstruction,
    {
      type: 'nonceInitialize',
      nonce: nonceAddress,
      authority: authAddress,
    } as NonceInitializeInstruction,
  ];
}

function mapComputeUnitLimit(param: SetComputeUnitLimit): ComputeBudgetInstruction {
  return {
    type: 'computeBudget',
    unitLimit: param.params.units,
  };
}

function mapPriorityFee(param: SetPriorityFee): ComputeBudgetInstruction {
  return {
    type: 'computeBudget',
    unitPrice: Number(param.params.fee),
  };
}

function mapTokenTransfer(param: TokenTransfer): TokenTransferInstruction {
  return {
    type: 'tokenTransfer',
    source: param.params.sourceAddress,
    destination: param.params.toAddress,
    mint: param.params.tokenAddress || '',
    // WASM expects amount as BigInt (maps to Rust u64)
    amount: BigInt(param.params.amount),
    decimals: param.params.decimalPlaces || 0,
    authority: param.params.fromAddress,
    programId: param.params.programId,
  };
}

function mapAtaInit(param: AtaInit): CreateAssociatedTokenAccountInstruction {
  return {
    type: 'createAssociatedTokenAccount',
    payer: param.params.payerAddress,
    owner: param.params.ownerAddress,
    mint: param.params.mintAddress,
    tokenProgramId: param.params.programId,
  };
}

function mapAtaClose(param: AtaClose): CloseAssociatedTokenAccountInstruction {
  return {
    type: 'closeAssociatedTokenAccount',
    account: param.params.accountAddress,
    destination: param.params.destinationAddress,
    authority: param.params.authorityAddress,
  };
}

/**
 * Maps StakingActivate to multiple instructions based on staking type.
 *
 * Native staking: CreateAccount + StakeInitialize + StakeDelegate
 * Marinade staking: CreateAccount + StakeInitialize (staker=validator, no delegate)
 * Jito staking: Optional CreateATA + StakePoolDepositSol
 *
 * Note: The amount passed here should already include rent if needed.
 * This matches the legacy builder behavior which passes amounts as-is.
 */
function mapStakingActivate(param: StakingActivate): BuilderInstruction[] {
  const { fromAddress, stakingAddress, amount, validator, stakingType, extraParams } = param.params;

  switch (stakingType) {
    case 'NATIVE':
      return mapNativeStakingActivate(fromAddress, stakingAddress, amount, validator);

    case 'MARINADE':
      return mapMarinadeStakingActivate(fromAddress, stakingAddress, amount, validator);

    case 'JITO':
      return mapJitoStakingActivate(fromAddress, stakingAddress, amount, extraParams as JitoStakingActivateParams);

    default:
      throw new BuildTransactionError(`WASM builder does not support staking type: ${stakingType}`);
  }
}

/**
 * Native staking: CreateAccount + StakeInitialize + StakeDelegate
 */
function mapNativeStakingActivate(
  fromAddress: string,
  stakingAddress: string,
  amount: string,
  validator: string
): BuilderInstruction[] {
  return [
    {
      type: 'createAccount',
      from: fromAddress,
      newAccount: stakingAddress,
      lamports: BigInt(amount),
      space: STAKE_ACCOUNT_SPACE,
      owner: STAKE_PROGRAM_ID,
    } as CreateAccountInstruction,
    {
      type: 'stakeInitialize',
      stake: stakingAddress,
      staker: fromAddress,
      withdrawer: fromAddress,
    } as StakeInitializeInstruction,
    {
      type: 'stakeDelegate',
      stake: stakingAddress,
      vote: validator,
      authority: fromAddress,
    } as StakeDelegateInstruction,
  ];
}

/**
 * Marinade staking: CreateAccount + StakeInitialize (staker=validator, no delegate)
 * The validator becomes the staker (authorized to delegate/deactivate) while
 * the sender remains the withdrawer (authorized to withdraw funds).
 */
function mapMarinadeStakingActivate(
  fromAddress: string,
  stakingAddress: string,
  amount: string,
  validator: string
): BuilderInstruction[] {
  return [
    {
      type: 'createAccount',
      from: fromAddress,
      newAccount: stakingAddress,
      lamports: BigInt(amount),
      space: STAKE_ACCOUNT_SPACE,
      owner: STAKE_PROGRAM_ID,
    } as CreateAccountInstruction,
    {
      type: 'stakeInitialize',
      stake: stakingAddress,
      staker: validator, // Marinade uses validator as staker
      withdrawer: fromAddress,
    } as StakeInitializeInstruction,
    // No StakeDelegate for Marinade - the stake is not delegated to a vote account
  ];
}

/**
 * Jito staking: Optional CreateATA + StakePoolDepositSol
 * This is liquid staking that deposits SOL into a stake pool and receives pool tokens.
 *
 * Uses WASM functions for PDA derivation - no @solana/web3.js dependency.
 */
function mapJitoStakingActivate(
  fromAddress: string,
  stakePoolAddress: string,
  amount: string,
  extraParams: JitoStakingActivateParams
): BuilderInstruction[] {
  if (!extraParams?.stakePoolData) {
    throw new BuildTransactionError('Jito staking requires stakePoolData in extraParams');
  }

  const { stakePoolData, createAssociatedTokenAccount } = extraParams;

  // Calculate PDAs using WASM functions (returns strings directly, no PublicKey needed)
  const withdrawAuthority = findWithdrawAuthorityProgramAddress(stakePoolAddress);
  const destinationPoolAccount = getAssociatedTokenAddress(fromAddress, stakePoolData.poolMint, TOKEN_PROGRAM_ID);

  const instructions: BuilderInstruction[] = [];

  // Optionally create the ATA for pool tokens
  if (createAssociatedTokenAccount) {
    instructions.push({
      type: 'createAssociatedTokenAccount',
      payer: fromAddress,
      owner: fromAddress,
      mint: stakePoolData.poolMint,
      tokenProgramId: TOKEN_PROGRAM_ID,
    } as CreateAssociatedTokenAccountInstruction);
  }

  // Deposit SOL into the stake pool
  instructions.push({
    type: 'stakePoolDepositSol',
    stakePool: stakePoolAddress,
    withdrawAuthority: withdrawAuthority,
    reserveStake: stakePoolData.reserveStake,
    fundingAccount: fromAddress,
    destinationPoolAccount: destinationPoolAccount,
    managerFeeAccount: stakePoolData.managerFeeAccount,
    referralPoolAccount: destinationPoolAccount, // Same as destination for self-referral
    poolMint: stakePoolData.poolMint,
    lamports: BigInt(amount),
  } as StakePoolDepositSolInstruction);

  return instructions;
}

/**
 * Maps StakingDeactivate based on staking type.
 *
 * Native staking: StakeDeactivate (or Allocate + Assign + Split + Deactivate for partial)
 * Marinade staking: Transfer (to revoke staking authority, represented as a transfer)
 * Jito staking: Approve + CreateAccount + StakePoolWithdrawStake + StakeDeactivate
 */
function mapStakingDeactivate(param: StakingDeactivate): BuilderInstruction[] {
  const { fromAddress, stakingAddress, stakingType, amount, unstakingAddress, extraParams, recipients } = param.params;

  switch (stakingType) {
    case 'NATIVE':
      return mapNativeStakingDeactivate(fromAddress, stakingAddress, amount, unstakingAddress);

    case 'MARINADE':
      return mapMarinadeStakingDeactivate(fromAddress, recipients);

    case 'JITO':
      return mapJitoStakingDeactivate(
        fromAddress,
        stakingAddress,
        amount!,
        unstakingAddress!,
        extraParams as JitoStakingDeactivateParams
      );

    default:
      throw new BuildTransactionError(`WASM builder does not support staking type: ${stakingType}`);
  }
}

/**
 * Native staking deactivate.
 * Simple case: Just deactivate the stake account.
 * Partial case: Allocate + Assign + StakeSplit + Deactivate
 *
 * For partial deactivation:
 * 1. Allocate space in the split stake account
 * 2. Assign the split stake account to the Stake Program
 * 3. Split lamports from the source stake account to the split stake account
 * 4. Deactivate the split stake account
 */
function mapNativeStakingDeactivate(
  fromAddress: string,
  stakingAddress: string,
  amount?: string,
  unstakingAddress?: string
): BuilderInstruction[] {
  // Partial deactivate: Allocate + Assign + StakeSplit + Deactivate
  if (amount && unstakingAddress) {
    return [
      // 1. Allocate space for the split stake account
      {
        type: 'allocate',
        account: unstakingAddress,
        space: STAKE_ACCOUNT_SPACE,
      } as AllocateInstruction,
      // 2. Assign the split stake account to the Stake Program
      {
        type: 'assign',
        account: unstakingAddress,
        owner: STAKE_PROGRAM_ID,
      } as AssignInstruction,
      // 3. Split lamports from source to split stake account
      {
        type: 'stakeSplit',
        stake: stakingAddress,
        splitStake: unstakingAddress,
        authority: fromAddress,
        lamports: BigInt(amount),
      } as StakeSplitInstruction,
      // 4. Deactivate the split stake account
      {
        type: 'stakeDeactivate',
        stake: unstakingAddress,
        authority: fromAddress,
      } as StakeDeactivateInstruction,
    ];
  }

  // Simple full deactivate
  return [
    {
      type: 'stakeDeactivate',
      stake: stakingAddress,
      authority: fromAddress,
    } as StakeDeactivateInstruction,
  ];
}

/**
 * Marinade staking deactivate is represented as a Transfer instruction.
 * The transfer goes from the sender to the Marinade program's specified recipient.
 */
function mapMarinadeStakingDeactivate(
  fromAddress: string,
  recipients?: { address: string; amount: string }[]
): BuilderInstruction[] {
  if (!recipients || recipients.length === 0) {
    throw new BuildTransactionError('Marinade staking deactivate requires recipients');
  }

  // Marinade deactivate is a simple transfer from sender to recipients
  return recipients.map(
    (recipient) =>
      ({
        type: 'transfer',
        from: fromAddress,
        to: recipient.address,
        lamports: BigInt(recipient.amount),
      } as TransferInstruction)
  );
}

/**
 * Jito staking deactivate: Approve + CreateAccount + StakePoolWithdrawStake + StakeDeactivate
 * This withdraws stake from the pool by burning pool tokens.
 *
 * Uses WASM functions for PDA derivation - no @solana/web3.js dependency.
 */
function mapJitoStakingDeactivate(
  fromAddress: string,
  stakePoolAddress: string,
  poolTokenAmount: string,
  destinationStakeAddress: string,
  extraParams: JitoStakingDeactivateParams
): BuilderInstruction[] {
  if (!extraParams?.stakePoolData) {
    throw new BuildTransactionError('Jito staking deactivate requires stakePoolData in extraParams');
  }

  const { stakePoolData, validatorAddress, transferAuthorityAddress } = extraParams;

  // Calculate PDAs using WASM functions (returns strings directly, no PublicKey needed)
  const withdrawAuthority = findWithdrawAuthorityProgramAddress(stakePoolAddress);
  const sourcePoolAccount = getAssociatedTokenAddress(fromAddress, stakePoolData.poolMint, TOKEN_PROGRAM_ID);

  return [
    // 1. Approve the transfer authority to spend pool tokens
    {
      type: 'approve',
      account: sourcePoolAccount,
      delegate: transferAuthorityAddress,
      owner: fromAddress,
      amount: BigInt(poolTokenAmount),
      programId: TOKEN_PROGRAM_ID,
    } as ApproveInstruction,

    // 2. Create the destination stake account
    {
      type: 'createAccount',
      from: fromAddress,
      newAccount: destinationStakeAddress,
      lamports: BigInt(STAKE_ACCOUNT_RENT_EXEMPT_AMOUNT),
      space: STAKE_ACCOUNT_SPACE,
      owner: STAKE_PROGRAM_ID,
    } as CreateAccountInstruction,

    // 3. Withdraw stake from the pool
    {
      type: 'stakePoolWithdrawStake',
      stakePool: stakePoolAddress,
      validatorList: stakePoolData.validatorListAccount,
      withdrawAuthority: withdrawAuthority,
      validatorStake: validatorAddress,
      destinationStake: destinationStakeAddress,
      destinationStakeAuthority: fromAddress,
      sourceTransferAuthority: transferAuthorityAddress,
      sourcePoolAccount: sourcePoolAccount,
      managerFeeAccount: stakePoolData.managerFeeAccount,
      poolMint: stakePoolData.poolMint,
      poolTokens: BigInt(poolTokenAmount),
    } as StakePoolWithdrawStakeInstruction,

    // 4. Deactivate the newly created stake account
    {
      type: 'stakeDeactivate',
      stake: destinationStakeAddress,
      authority: fromAddress,
    } as StakeDeactivateInstruction,
  ];
}

function mapStakingWithdraw(param: StakingWithdraw): StakeWithdrawInstruction {
  return {
    type: 'stakeWithdraw',
    stake: param.params.stakingAddress,
    recipient: param.params.fromAddress,
    lamports: BigInt(param.params.amount),
    authority: param.params.fromAddress,
  };
}

/**
 * Maps StakingAuthorize to one or two authorize instructions.
 * Can authorize both staker and withdrawer in a single operation.
 */
function mapStakingAuthorize(param: StakingAuthorize): BuilderInstruction[] {
  const { stakingAddress, oldAuthorizeAddress, newAuthorizeAddress, newWithdrawAddress } = param.params;

  const instructions: BuilderInstruction[] = [];

  // Authorize new staker
  instructions.push({
    type: 'stakeAuthorize',
    stake: stakingAddress,
    newAuthority: newAuthorizeAddress,
    authorizeType: 'staker',
    authority: oldAuthorizeAddress,
  } as StakeAuthorizeInstruction);

  // Optionally authorize new withdrawer
  if (newWithdrawAddress) {
    instructions.push({
      type: 'stakeAuthorize',
      stake: stakingAddress,
      newAuthority: newWithdrawAddress,
      authorizeType: 'withdrawer',
      authority: oldAuthorizeAddress,
    } as StakeAuthorizeInstruction);
  }

  return instructions;
}

function mapStakingDelegate(param: StakingDelegate): StakeDelegateInstruction {
  return {
    type: 'stakeDelegate',
    stake: param.params.stakingAddress,
    vote: param.params.validator,
    authority: param.params.fromAddress,
  };
}

function mapMintTo(param: MintTo): MintToInstruction {
  return {
    type: 'mintTo',
    mint: param.params.mintAddress,
    destination: param.params.destinationAddress,
    authority: param.params.authorityAddress,
    // WASM expects amount as BigInt (maps to Rust u64)
    amount: BigInt(param.params.amount),
    programId: param.params.programId,
  };
}

function mapBurn(param: Burn): BurnInstruction {
  return {
    type: 'burn',
    mint: param.params.mintAddress,
    account: param.params.accountAddress,
    authority: param.params.authorityAddress,
    // WASM expects amount as BigInt (maps to Rust u64)
    amount: BigInt(param.params.amount),
    programId: param.params.programId,
  };
}

function mapApprove(param: Approve): ApproveInstruction {
  return {
    type: 'approve',
    account: param.params.accountAddress,
    delegate: param.params.delegateAddress,
    owner: param.params.ownerAddress,
    // WASM expects amount as BigInt (maps to Rust u64)
    amount: BigInt(param.params.amount),
    programId: param.params.programId,
  };
}

/**
 * Maps a CustomInstruction to WASM's Custom instruction format.
 *
 * CustomInstruction allows invoking any Solana program with arbitrary data.
 * The data is hex-encoded in BitGoJS (see customInstructionBuilder tests).
 */
function mapCustomInstruction(param: CustomInstruction): BuilderCustomInstruction {
  const instruction = param.params as SolInstruction;

  return {
    type: 'custom',
    programId: instruction.programId,
    accounts: instruction.keys.map((key) => ({
      pubkey: key.pubkey,
      isSigner: key.isSigner,
      isWritable: key.isWritable,
    })),
    data: instruction.data,
    // SolInstruction data is hex-encoded in BitGoJS
    encoding: 'hex',
  };
}
