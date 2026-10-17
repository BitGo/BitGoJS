import { FungibleConditionCode, Pc, StakingPostCondition } from '@stacks/transactions';

/**
 * Comparator accepted by {@link makeStakingPostCondition}: either the `FungibleConditionCode` enum
 * from `@stacks/transactions` (`Equal`, `Greater`, `GreaterEqual`, `Less`, `LessEqual`) or the string
 * form used by the v7 wire format (`'eq' | 'gt' | 'gte' | 'lt' | 'lte'`).
 */
export type PostConditionCode = FungibleConditionCode | 'eq' | 'gt' | 'gte' | 'lt' | 'lte';

/** Amount accepted by {@link makeStakingPostCondition} (micro-STX). */
export type PostConditionAmount = string | number | bigint;

type Comparator = 'eq' | 'gt' | 'gte' | 'lt' | 'lte';

function toComparator(code: PostConditionCode): Comparator {
  if (typeof code === 'string') {
    return code;
  }
  switch (code) {
    case FungibleConditionCode.Equal:
      return 'eq';
    case FungibleConditionCode.Greater:
      return 'gt';
    case FungibleConditionCode.GreaterEqual:
      return 'gte';
    case FungibleConditionCode.Less:
      return 'lt';
    case FungibleConditionCode.LessEqual:
      return 'lte';
    default:
      throw new Error(`Unsupported fungible condition code: ${code}`);
  }
}

function applyComparator(
  builder: ReturnType<typeof Pc.principal>,
  code: PostConditionCode,
  amount: PostConditionAmount
): ReturnType<ReturnType<typeof Pc.principal>['willSendEq']> {
  switch (toComparator(code)) {
    case 'eq':
      return builder.willSendEq(amount);
    case 'gt':
      return builder.willSendGt(amount);
    case 'gte':
      return builder.willSendGte(amount);
    case 'lt':
      return builder.willSendLt(amount);
    case 'lte':
      return builder.willSendLte(amount);
  }
}

/**
 * Build a SIP-044 **staking** post-condition (`PostConditionType.Staking = 3`).
 *
 * This is the post-condition required by PoX-5 `register-for-bond` (and any call that locks the
 * staker's STX): the staked STX is tracked under the staking condition type, so an STX post-condition
 * does **not** cover it and a `Deny`-mode tx with no/mismatched post-condition aborts on-chain with
 * `… STX was staked by … but not checked` (SI-1936).
 *
 * Only `@stacks/transactions` v7 can construct it — the driver for the v7 migration (SI-2024).
 *
 * @param address the staker principal whose locked STX is asserted
 * @param code the comparator (`'eq' | 'gt' | 'gte' | 'lt' | 'lte'` or `FungibleConditionCode`)
 * @param amount the locked amount in micro-STX
 *
 * @example
 * ```ts
 * builder.postConditionMode(PostConditionMode.Deny);
 * builder.postConditions([makeStakingPostCondition(staker, 'eq', amountUstx)]);
 * ```
 */
export function makeStakingPostCondition(
  address: string,
  code: PostConditionCode,
  amount: PostConditionAmount
): StakingPostCondition {
  return applyComparator(Pc.principal(address), code, amount).ustxToLock();
}
