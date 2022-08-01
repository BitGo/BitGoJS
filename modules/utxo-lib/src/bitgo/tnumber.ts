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

/**
 * Multiply a decimal amount (optionally to a bigint)
 * Throws error if resulting value is not a safe integer number
 * @param value - decimal amount
 * @param amountType - desired output type
 * @param scaleFactor - scale amount
 * @return value * scaleFactor, cast to amountType
 */
export function getValueScaled<TNumber extends number | bigint>(
  value: number,
  amountType: 'number' | 'bigint' = 'number',
  scaleFactor = 1e8
): TNumber {
  if (amountType === 'number') {
    const scaledValue = Number(value) * scaleFactor;
    if (!Number.isSafeInteger(scaledValue)) {
      throw new Error('input value cannot be scaled to safe integer number');
    }
    return scaledValue as TNumber;
  } else {
    const integerPart = Math.floor(value);
    let decimalPart = value - integerPart;
    decimalPart = Math.round(decimalPart * scaleFactor); // scale and fix floating point

    return (BigInt(integerPart) * BigInt(scaleFactor) + BigInt(decimalPart)) as TNumber;
  }
}
