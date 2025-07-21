/**
 * @file Implementation of the depositSol instruction. On upgrade of
 * '@solana/spl-token', this module may no longer be necessary.
 */

import { StakePoolInstruction, STAKE_POOL_PROGRAM_ID, DepositSolParams } from '@solana/spl-stake-pool';
import {
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { AccountMeta, PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import assert from 'assert';

export const DEPOSIT_SOL_LAYOUT_CODE = 14;

export interface DepositSolInstructionsParams {
  stakePoolAddress: PublicKey;
  from: PublicKey;
  lamports: bigint;
}

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
  poolMint: PublicKey,
  reserveStake: PublicKey,
  managerFeeAccount: PublicKey
): TransactionInstruction[] {
  const { stakePoolAddress, from, lamports } = params;

  // findWithdrawAuthorityProgramAddress
  const [withdrawAuthority] = PublicKey.findProgramAddressSync(
    [stakePoolAddress.toBuffer(), Buffer.from('withdraw')],
    STAKE_POOL_PROGRAM_ID
  );

  const associatedAddress = getAssociatedTokenAddressSync(poolMint, from);

  return [
    createAssociatedTokenAccountInstruction(from, associatedAddress, from, poolMint),
    StakePoolInstruction.depositSol({
      stakePool: stakePoolAddress,
      reserveStake,
      fundingAccount: from,
      destinationPoolAccount: associatedAddress,
      managerFeeAccount: managerFeeAccount,
      referralPoolAccount: associatedAddress,
      poolMint: poolMint,
      lamports: Number(lamports),
      withdrawAuthority,
    }),
  ];
}

function parseKey(key: AccountMeta, template: { isSigner: boolean; isWritable: boolean }): PublicKey {
  assert(
    key.isSigner === template.isSigner && key.isWritable === template.isWritable,
    'Unexpected key metadata in DepositSol instruction'
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
