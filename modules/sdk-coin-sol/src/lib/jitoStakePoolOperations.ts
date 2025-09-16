/**
 * @file Implementation of the depositSol instruction. On upgrade of
 * '@solana/spl-token', this module may no longer be necessary.
 */

import {
  StakePoolInstruction,
  STAKE_POOL_PROGRAM_ID,
  DepositSolParams,
  WithdrawStakeParams,
} from '@solana/spl-stake-pool';
import {
  createApproveInstruction,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import {
  AccountMeta,
  PublicKey,
  StakeProgram,
  SystemProgram,
  SYSVAR_CLOCK_PUBKEY,
  TransactionInstruction,
} from '@solana/web3.js';
import assert from 'assert';
import { STAKE_ACCOUNT_RENT_EXEMPT_AMOUNT } from './constants';

/**
 * Replicates the fields in @solana/spl-stake-pool Fee.
 *
 * @see {Fee}
 */
export interface Fee {
  denominator: string;
  numerator: string;
}

/**
 * Replicates the fields in @solana/spl-stake-pool StakePoolLayout.
 *
 * @see {StakePoolLayout}
 */
export interface StakePoolData {
  accountType: number;
  manager: string;
  staker: string;
  stakeDepositAuthority: string;
  stakeWithdrawBumpSeed: number;
  validatorListAccount: string;
  reserveStake: string;
  poolMint: string;
  managerFeeAccount: string;
  tokenProgramId: string;
  totalLamports: string;
  poolTokenSupply: string;
  lastUpdateEpoch: string;
  lockup: {
    unixTimestamp: string;
    epoch: string;
    custodian: string;
  };
  epochFee: Fee;
  nextEpochFee?: Fee | undefined;
  preferredDepositValidatorVoteAddress?: string | undefined;
  preferredWithdrawValidatorVoteAddress?: string | undefined;
  stakeDepositFee: Fee;
  stakeWithdrawalFee: Fee;
  nextStakeWithdrawalFee?: Fee | undefined;
  stakeReferralFee: number;
  solDepositAuthority?: string | undefined;
  solDepositFee: Fee;
  solReferralFee: number;
  solWithdrawAuthority?: string | undefined;
  solWithdrawalFee: Fee;
  nextSolWithdrawalFee?: Fee | undefined;
  lastEpochPoolTokenSupply: string;
  lastEpochTotalLamports: string;
}

export const DEPOSIT_SOL_LAYOUT_CODE = 14;
export const WITHDRAW_STAKE_LAYOUT_CODE = 10;

/**
 * Generates the withdraw authority program address for the stake pool.
 * Like findWithdrawAuthorityProgramAddress in @solana/spl-stake-pool,
 * but synchronous.
 *
 * @see {findWithdrawAuthorityProgramAddress}
 */
export function findWithdrawAuthorityProgramAddressSync(programId: PublicKey, stakePoolAddress: PublicKey): PublicKey {
  const [withdrawAuthority] = PublicKey.findProgramAddressSync(
    [stakePoolAddress.toBuffer(), Buffer.from('withdraw')],
    programId
  );
  return withdrawAuthority;
}

export interface DepositSolInstructionsParams {
  stakePoolAddress: PublicKey;
  from: PublicKey;
  lamports: bigint;
}

export type DepositSolStakePoolData = Pick<StakePoolData, 'poolMint' | 'reserveStake' | 'managerFeeAccount'>;

/**
 * Construct Solana depositSol stake pool instruction from parameters.
 *
 * @param {DepositSolInstructionsParams} params - parameters for staking to stake pool
 * @param poolMint - pool mint derived from getStakePoolAccount
 * @param reserveStake - reserve account derived from getStakePoolAccount
 * @param managerFeeAccount - manager fee account derived from getStakePoolAccount
 * @returns {TransactionInstruction}
 */
export function depositSolInstructions(
  params: DepositSolInstructionsParams,
  stakePool: DepositSolStakePoolData,
  createAssociatedTokenAccount: boolean
): TransactionInstruction[] {
  const { stakePoolAddress, from, lamports } = params;
  const poolMint = new PublicKey(stakePool.poolMint);
  const reserveStake = new PublicKey(stakePool.reserveStake);
  const managerFeeAccount = new PublicKey(stakePool.managerFeeAccount);

  // findWithdrawAuthorityProgramAddress
  const withdrawAuthority = findWithdrawAuthorityProgramAddressSync(STAKE_POOL_PROGRAM_ID, stakePoolAddress);
  const associatedAddress = getAssociatedTokenAddressSync(poolMint, from);

  const instructions: TransactionInstruction[] = [];

  if (createAssociatedTokenAccount) {
    instructions.push(createAssociatedTokenAccountInstruction(from, associatedAddress, from, poolMint));
  }

  instructions.push(
    StakePoolInstruction.depositSol({
      stakePool: stakePoolAddress,
      reserveStake,
      fundingAccount: from,
      destinationPoolAccount: associatedAddress,
      managerFeeAccount,
      referralPoolAccount: associatedAddress,
      poolMint,
      lamports: Number(lamports),
      withdrawAuthority,
    })
  );

  return instructions;
}

function parseKey(key: AccountMeta, template: { isSigner: boolean; isWritable: boolean }): PublicKey {
  assert(
    key.isSigner === template.isSigner && key.isWritable === template.isWritable,
    `Unexpected key metadata in instruction: { isSigner: ${key.isSigner}, isWritable: ${key.isWritable} }`
  );
  return key.pubkey;
}

/**
 * Construct Solana depositSol stake pool parameters from instruction.
 *
 * @param {TransactionInstruction} instruction
 * @returns {DepositSolParams}
 */
export function decodeDepositSol(instruction: TransactionInstruction): DepositSolParams {
  const { programId, keys, data } = instruction;

  assert(
    programId.equals(STAKE_POOL_PROGRAM_ID),
    'Invalid DepositSol instruction, program ID must be the Stake Pool Program'
  );

  let i = 0;
  const stakePool = parseKey(keys[i++], { isSigner: false, isWritable: true });
  const withdrawAuthority = parseKey(keys[i++], { isSigner: false, isWritable: false });
  const reserveStake = parseKey(keys[i++], { isSigner: false, isWritable: true });
  const fundingAccount = parseKey(keys[i++], { isSigner: true, isWritable: true });
  const destinationPoolAccount = parseKey(keys[i++], { isSigner: false, isWritable: true });
  const managerFeeAccount = parseKey(keys[i++], { isSigner: false, isWritable: true });
  const referralPoolAccount = parseKey(keys[i++], { isSigner: false, isWritable: true });
  const poolMint = parseKey(keys[i++], { isSigner: false, isWritable: true });
  const systemProgramProgramId = parseKey(keys[i++], { isSigner: false, isWritable: false });
  assert(systemProgramProgramId.equals(SystemProgram.programId), 'Unexpected pubkey in DepositSol instruction');
  const tokenProgramId = parseKey(keys[i++], { isSigner: false, isWritable: false });
  assert(tokenProgramId.equals(TOKEN_PROGRAM_ID), 'Unexpected pubkey in DepositSol instruction');
  const depositAuthority = keys.length > 10 ? parseKey(keys[i++], { isSigner: true, isWritable: false }) : undefined;
  assert(keys.length <= 11, 'Too many keys in DepositSol instruction');

  const layoutCode = data.readUint8(0);
  assert(layoutCode === DEPOSIT_SOL_LAYOUT_CODE, 'Incorrect layout code in DepositSol data');
  assert(data.length === 9, 'Incorrect data size for DepositSol layout');
  const lamports = data.readBigInt64LE(1);

  return {
    stakePool,
    depositAuthority,
    withdrawAuthority,
    reserveStake,
    fundingAccount,
    destinationPoolAccount,
    managerFeeAccount,
    referralPoolAccount,
    poolMint,
    lamports: Number(lamports),
  };
}

export interface WithdrawStakeInstructionsParams {
  stakePoolAddress: PublicKey;
  tokenOwner: PublicKey;
  destinationStakeAccount: PublicKey;
  validatorAddress: PublicKey;
  transferAuthority: PublicKey;
  poolAmount: string;
}

export type WithdrawStakeStakePoolData = Pick<StakePoolData, 'poolMint' | 'validatorListAccount' | 'managerFeeAccount'>;

/**
 * Construct Solana depositSol stake pool instruction from parameters.
 *
 * @param {DepositSolInstructionsParams} params - parameters for staking to stake pool
 * @param poolMint - pool mint derived from getStakePoolAccount
 * @param reserveStake - reserve account derived from getStakePoolAccount
 * @param managerFeeAccount - manager fee account derived from getStakePoolAccount
 * @returns {TransactionInstruction}
 */
export function withdrawStakeInstructions(
  params: WithdrawStakeInstructionsParams,
  stakePool: WithdrawStakeStakePoolData
): TransactionInstruction[] {
  const {
    tokenOwner,
    stakePoolAddress,
    destinationStakeAccount,
    validatorAddress,
    transferAuthority,
    poolAmount: poolAmountString,
  } = params;

  const poolMint = new PublicKey(stakePool.poolMint);
  const validatorList = new PublicKey(stakePool.validatorListAccount);
  const managerFeeAccount = new PublicKey(stakePool.managerFeeAccount);

  const poolTokenAccount = getAssociatedTokenAddressSync(poolMint, tokenOwner);
  const withdrawAuthority = findWithdrawAuthorityProgramAddressSync(STAKE_POOL_PROGRAM_ID, stakePoolAddress);

  const poolAmount = BigInt(poolAmountString);

  return [
    createApproveInstruction(poolTokenAccount, tokenOwner, tokenOwner, poolAmount),
    SystemProgram.createAccount({
      fromPubkey: tokenOwner,
      newAccountPubkey: destinationStakeAccount,
      lamports: STAKE_ACCOUNT_RENT_EXEMPT_AMOUNT,
      space: StakeProgram.space,
      programId: StakeProgram.programId,
    }),
    StakePoolInstruction.withdrawStake({
      stakePool: stakePoolAddress,
      validatorList: validatorList,
      validatorStake: validatorAddress,
      destinationStake: destinationStakeAccount,
      destinationStakeAuthority: tokenOwner,
      sourceTransferAuthority: transferAuthority,
      sourcePoolAccount: poolTokenAccount,
      managerFeeAccount: managerFeeAccount,
      poolMint: poolMint,
      poolTokens: Number(poolAmount),
      withdrawAuthority,
    }),
  ];
}

/**
 * Construct Solana withdrawStake stake pool parameters from instruction.
 *
 * @param {TransactionInstruction} instruction
 * @returns {DepositSolParams}
 */
export function decodeWithdrawStake(instruction: TransactionInstruction): WithdrawStakeParams {
  const { programId, keys, data } = instruction;

  assert(
    programId.equals(STAKE_POOL_PROGRAM_ID),
    'Invalid WithdrawStake instruction, program ID must be the Stake Pool Program'
  );

  const layoutCode = data.readUint8(0);
  assert(layoutCode === WITHDRAW_STAKE_LAYOUT_CODE, 'Incorrect layout code in WithdrawStake data');
  assert(data.length === 9, 'Incorrect data size for WithdrawStake layout');
  const poolTokens = data.readBigInt64LE(1);

  let i = 0;
  const stakePool = parseKey(keys[i++], { isSigner: false, isWritable: true });
  const validatorList = parseKey(keys[i++], { isSigner: false, isWritable: true });
  const withdrawAuthority = parseKey(keys[i++], { isSigner: false, isWritable: false });
  const validatorStake = parseKey(keys[i++], { isSigner: false, isWritable: true });
  const destinationStake = keys[i++].pubkey;
  const destinationStakeAuthority = keys[i++].pubkey;
  const sourceTransferAuthority = parseKey(keys[i++], { isSigner: true, isWritable: false });
  const sourcePoolAccount = parseKey(keys[i++], { isSigner: false, isWritable: true });
  const managerFeeAccount = parseKey(keys[i++], { isSigner: false, isWritable: true });
  const poolMint = parseKey(keys[i++], { isSigner: false, isWritable: true });
  const sysvarClockPubkey = parseKey(keys[i++], { isSigner: false, isWritable: false });
  assert(sysvarClockPubkey.equals(SYSVAR_CLOCK_PUBKEY), 'Unexpected pubkey in WithdrawStake instruction');
  const tokenProgramId = parseKey(keys[i++], { isSigner: false, isWritable: false });
  assert(tokenProgramId.equals(TOKEN_PROGRAM_ID), 'Unexpected pubkey in WithdrawStake instruction');
  const stakeProgramProgramId = parseKey(keys[i++], { isSigner: false, isWritable: false });
  assert(stakeProgramProgramId.equals(StakeProgram.programId), 'Unexpected pubkey in WithdrawStake instruction');
  assert(i === keys.length, 'Too many keys in WithdrawStake instruction');

  return {
    stakePool,
    validatorList,
    withdrawAuthority,
    validatorStake,
    destinationStake,
    destinationStakeAuthority,
    sourceTransferAuthority,
    sourcePoolAccount,
    managerFeeAccount,
    poolMint,
    poolTokens: Number(poolTokens),
  };
}
