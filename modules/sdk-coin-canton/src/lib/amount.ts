import BigNumber from 'bignumber.js';

import type { CantonAmount, CantonAmountInput } from './iface';

/**
 * Canton amounts may remain numbers for legacy callers, but strings are required when
 * the value can exceed Number.MAX_SAFE_INTEGER. BigInt inputs are normalized to strings
 * because request objects are serialized as JSON.
 */
export function normalizeCantonAmount(amount: CantonAmountInput, errorMessage: string): CantonAmount {
  if (typeof amount === 'bigint') {
    if (amount <= 0n) {
      throw new Error(errorMessage);
    }
    return amount.toString();
  }

  if (typeof amount === 'number') {
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error(errorMessage);
    }
    return amount;
  }

  const normalized = amount.trim();
  const numericAmount = new BigNumber(normalized);
  if (!normalized || !numericAmount.isFinite() || numericAmount.isLessThanOrEqualTo(0)) {
    throw new Error(errorMessage);
  }
  return normalized;
}
