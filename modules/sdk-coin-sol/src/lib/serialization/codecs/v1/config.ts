/**
 * v1 (SIMD-0296/0385) transaction config codec: bit mask + value encoding.
 */

// Transaction config mask bits (mirror @solana/transaction-messages).
export const PRIORITY_FEE_BITS = 0b11;
export const COMPUTE_UNIT_LIMIT_BIT = 0b100;
export const LOADED_ACCOUNTS_DATA_SIZE_LIMIT_BIT = 0b1000;
export const HEAP_SIZE_BIT = 0b10000;

export type ConfigValue = { kind: 'u32' | 'u64'; value: number | bigint };

export function encodeConfigMaskAndValues(config: {
  computeUnitLimit: number | null;
  heapSize: number | null;
  loadedAccountsDataSizeLimit: number | null;
  priorityFee: number | null;
}): { mask: number; values: ConfigValue[] } {
  let mask = 0;
  const values: ConfigValue[] = [];
  if (config.priorityFee !== null) {
    mask |= PRIORITY_FEE_BITS;
    values.push({ kind: 'u64', value: BigInt(config.priorityFee) });
  }
  if (config.computeUnitLimit !== null) {
    mask |= COMPUTE_UNIT_LIMIT_BIT;
    values.push({ kind: 'u32', value: config.computeUnitLimit });
  }
  if (config.loadedAccountsDataSizeLimit !== null) {
    mask |= LOADED_ACCOUNTS_DATA_SIZE_LIMIT_BIT;
    values.push({ kind: 'u32', value: config.loadedAccountsDataSizeLimit });
  }
  if (config.heapSize !== null) {
    mask |= HEAP_SIZE_BIT;
    values.push({ kind: 'u32', value: config.heapSize });
  }
  return { mask, values };
}
