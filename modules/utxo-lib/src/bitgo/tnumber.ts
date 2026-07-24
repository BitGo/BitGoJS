/**
 * Convert input to bigint or number.
 * Throws error if input cannot be converted to a safe integer number.
 * @param value - input value
 * @param amountType - desired output type
 * @return value converted to amountType
 */
export function toTNumber<TNumber extends number | bigint>(
  value: number | bigint | string,
  amountType: 'number' | 'bigint'
): TNumber {
  if (typeof value === amountType) {
    return value as TNumber;
  }
  if (value === undefined) {
    throw new Error('input value cannot be undefined');
  }
  if (amountType === 'number') {
    const numberValue = Number(value);
    if (!Number.isSafeInteger(numberValue)) {
      throw new Error('input value cannot be converted to safe integer number');
    }
    return Number(value) as TNumber;
  }
  if (amountType === 'bigint') {
    return BigInt(value) as TNumber;
  }
  throw new Error('amountType must be either "number" or "bigint"');
}
