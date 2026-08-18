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
 * Reduce the Authorize instructions of a transaction to a single human-readable summary for
 * `explainTransaction`.
 *
 * This is a **display** summary, not a security boundary. Because it collapses many instructions
 * into one it cannot describe a transaction that re-authorises several stake accounts, so nothing
 * may authorise a signature on the strength of it. `Sol.verifyStakingAuthorizeInstructions`
 * validates every instruction individually against the intent instead.
 *
 * Selection rules, and why:
 *
 * - The authority being changed is taken **only** from `authorizeType`, never inferred from the
 *   presence of a custodian. Solana documents the lockup custodian as an optional account for
 *   Withdrawer changes under lockup, and the instruction encoding can still attach one on a
 *   Staker change (or omit it on a Withdrawer change), so custodian presence is not a type
 *   discriminator — inferring from it would let a decoy Staker change be reported as the
 *   withdraw authority.
 * - A Withdrawer change outranks a Staker change, so the withdraw authority is never masked by a
 *   staker-only instruction.
 * - Among instructions of the same authority type the **last** one wins, matching Solana's
 *   sequential execution for a single stake account.
 * - Withdraw fields are left empty for a staker-only transaction, so a staker address is never
 *   presented as a withdraw address.
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
