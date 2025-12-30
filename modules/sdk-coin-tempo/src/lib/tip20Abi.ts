/**
 * TIP20 Token Standard ABI (Skeleton)
 *
 * TODO: Update this file when TIP20 ABI becomes available
 */

/**
 * Placeholder TIP20 ABI
 * This is an empty array that should be replaced with the actual ABI
 */
export const TIP20_ABI = [] as const;

/**
 * Placeholder for TIP20 Factory ABI
 */
export const TIP20_FACTORY_ABI = [] as const;

/**
 * Get the method signature for TIP20 transfer
 * TODO: Update with actual method name if different from ERC20
 */
export function getTip20TransferSignature(): string {
  return 'transfer(address,uint256)';
}

/**
 * Get the method signature for TIP20 transferFrom
 * TODO: Update with actual method name if different from ERC20
 */
export function getTip20TransferFromSignature(): string {
  return 'transferFrom(address,address,uint256)';
}
