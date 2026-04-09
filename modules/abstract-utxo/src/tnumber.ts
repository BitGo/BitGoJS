export function toTNumber(value: number | bigint, amountType: 'number'): number;
export function toTNumber(value: number | bigint, amountType: 'bigint'): bigint;
export function toTNumber(value: number | bigint, amountType: 'number' | 'bigint'): number | bigint;
export function toTNumber(value: number | bigint, amountType: 'number' | 'bigint'): number | bigint {
  switch (amountType) {
    case 'number':
      return Number(value);
    case 'bigint':
      return BigInt(value);
  }
}
