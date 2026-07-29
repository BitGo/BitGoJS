/**
 * Multiply a decimal amount by 1e8 to convert from coins to sats
 * (optionally to a bigint converting to bigint)
 *
 * This function really shouldn't exist, but is used by some test code. At some
 * point we should fix those functions to use strings or integers only to
 * represent monetary values.
 *
 * Throws error if resulting value is not a safe integer number
 *
 * @param value - decimal amount of coins
 * @param amountType - desired output type
 * @return value * 1e8, as amountType
 */
export function decimalCoinsToSats<TNumber extends number | bigint>(
  value: number,
  amountType: 'number' | 'bigint' = 'number'
): TNumber {
  if (amountType === 'number') {
    const scaledValue = value * 1e8;
    if (!Number.isSafeInteger(scaledValue)) {
      throw new Error('input value cannot be scaled to safe integer number');
    }
    return scaledValue as TNumber;
  } else {
    const [integerString, decimalString] = value.toFixed(8).split('.');
    return (BigInt(integerString) * BigInt(1e8) + BigInt(decimalString)) as TNumber;
  }
}
