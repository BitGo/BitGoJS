import { StakeAuthorizeType, StakingAuthorizeParams } from './iface';

/**
 * A single decoded Authorize instruction, normalised across the three parse paths
 * (legacy web3.js `Authorize`, raw `AuthorizeChecked`, and the WASM parser).
 */
export interface AuthorizeInstructionView {
  stakingAddress: string;
  /** The authority signing this change — staker or withdrawer, per `authorizeType`. */
  oldAuthorizeAddress: string;
  /** The new authority — new staker or new withdrawer, per `authorizeType`. */
  newAuthorizeAddress: string;
  /** Decoded from Solana's `stakeAuthorizationType`. Undefined only if decoding failed. */
  authorizeType?: StakeAuthorizeType;
  /** The lockup custodian account, if the instruction carries one. */
  custodianAddress?: string;
}

/**
 * Reduce the Authorize instructions of a transaction to the single summary that
 * `verifyTransaction` validates against the signing intent.
 *
 * Selection rules, and why:
 *
 * - The authority being changed is taken **only** from `authorizeType`, never inferred from the
 *   presence of a custodian. A lockup custodian is orthogonal to `StakeAuthorize` — Solana allows
 *   a Staker change to carry one and a Withdrawer change to omit one — so inferring the type from
 *   it lets a crafted transaction pair a real Withdrawer change to an attacker key with a decoy
 *   Staker change to the expected key, and have the decoy reported as the withdraw authority.
 * - A Withdrawer change always outranks a Staker change, because `newWithdrawAddress` is the
 *   security-critical field and must not be masked by a staker-only instruction.
 * - Among instructions of the same authority type the **last** one wins, matching Solana's
 *   sequential execution: the final on-chain authority is the one set by the last instruction.
 * - Withdraw fields are left empty for a staker-only transaction so a staker address is never
 *   compared against an intended withdraw key. `verifyTransaction` rejects the empty value when
 *   the intent expects a withdraw-authority change.
 *
 * @param instructions decoded Authorize instructions, in transaction order
 * @returns the summary, or undefined when the transaction has no Authorize instruction
 */
export function summarizeStakingAuthorize(
  instructions: AuthorizeInstructionView[]
): StakingAuthorizeParams | undefined {
  if (instructions.length === 0) {
    return undefined;
  }

  const lastOfType = (type: StakeAuthorizeType): AuthorizeInstructionView | undefined =>
    [...instructions].reverse().find((instruction) => instruction.authorizeType === type);

  const withdrawer = lastOfType('Withdrawer');
  if (withdrawer) {
    return {
      stakingAddress: withdrawer.stakingAddress,
      oldWithdrawAddress: withdrawer.oldAuthorizeAddress,
      newWithdrawAddress: withdrawer.newAuthorizeAddress,
      custodianAddress: withdrawer.custodianAddress,
    };
  }

  // No withdraw-authority change in this transaction. Report the staker change (if the type was
  // decodable at all) and leave the withdraw fields empty.
  const staker = lastOfType('Staker');
  const fallback = staker ?? instructions[instructions.length - 1];
  return {
    stakingAddress: fallback.stakingAddress,
    oldWithdrawAddress: '',
    newWithdrawAddress: '',
    ...(staker && {
      oldStakingAuthorityAddress: staker.oldAuthorizeAddress,
      newStakingAuthorityAddress: staker.newAuthorizeAddress,
    }),
  };
}
