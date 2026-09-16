/**
 * Copyright 2026 BitGo, Inc. All Rights Reserved.
 */

/**
 * Solana Token-2022 ScaledUiAmount conversion utilities (CSHLD-1688).
 *
 * A scaled-UI mint carries a `UiAmountMultiplier`. On-chain (and therefore in
 * every send/build path of this SDK) amounts are raw base units; the UI
 * denomination is `raw * multiplier / 10^decimals`, matching the SPL
 * token-2022 ScaledUiAmount extension semantics. These utilities exist for
 * display, reconciliation, and balance conversions only — they never feed
 * transaction building, which stays raw-denominated.
 *
 * All arithmetic is exact scaled-integer (BigInt) math — floats are never used,
 * so conversions are deterministic across runtimes and lose no precision:
 * `rawToUiAmountString` is always exact (the divisor is a power of ten, so the
 * exact expansion fits within `multiplierScale + decimals` fraction digits).
 * `uiAmountToRaw` floors to an integer number of base units and is the exact
 * inverse of `rawToUiAmountString` whenever the ui string is exact.
 */

/** Significand and scale of a decimal literal: value = ±digits / 10^scale. */
interface ParsedDecimal {
  negative: boolean;
  digits: bigint;
  scale: number;
}

const DECIMAL_LITERAL_PATTERN = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/;

/**
 * Parse an exact decimal string into scaled-integer parts. Rejects scientific
 * notation, empty strings, NaN/Infinity, and non-numeric input.
 *
 * @param value The decimal literal, e.g. "0.001"; "1e-9" must be written as "0.000000001"
 */
function parseDecimal(value: string, what: string): ParsedDecimal {
  if (typeof value !== 'string' || !DECIMAL_LITERAL_PATTERN.test(value)) {
    throw new Error(`Invalid ${what} '${value}': expected a finite decimal string`);
  }
  const negative = value.startsWith('-');
  const unsigned = negative || value.startsWith('+') ? value.slice(1) : value;
  const [intPart = '0', fracPart = ''] = unsigned.split('.');
  const digits = BigInt(intPart + fracPart || '0');
  return { negative, digits, scale: fracPart.length };
}

/** Render ±digits/10^scale as a normalized decimal string (no trailing zeros, no "-0"). */
function toDecimalString({ negative, digits, scale }: ParsedDecimal): string {
  if (digits === 0n) {
    return '0';
  }
  let s = digits.toString().padStart(scale + 1, '0');
  if (scale > 0) {
    s = `${s.slice(0, -scale)}.${s.slice(-scale)}`;
    s = s.replace(/0+$/, '').replace(/\.$/, '');
  }
  return negative ? `-${s}` : s;
}

/**
 * Convert a raw base-unit amount to its scaled UI denomination.
 *
 * Exact by construction: the result is `raw * multiplier / 10^decimals`, whose
 * exact decimal expansion never exceeds `multiplier scale + decimals` fraction
 * digits, so no rounding ever occurs.
 *
 * @param raw Amount in raw base units (integer, >= 0)
 * @param multiplier The mint's UiAmountMultiplier as a decimal string (> 0)
 * @param decimals The mint's decimals (>= 0)
 * @returns The exact UI amount as a decimal string
 * @throws if any argument is malformed, the multiplier is not positive, or raw/decimals are negative
 */
export function rawToUiAmountString(raw: bigint, multiplier: string, decimals: number): string {
  if (typeof raw !== 'bigint') {
    throw new Error(`Invalid raw amount '${String(raw)}': expected a BigInt of base units`);
  }
  if (raw < 0n) {
    throw new Error(`Invalid raw amount '${raw}': must be non-negative`);
  }
  if (!Number.isInteger(decimals) || decimals < 0) {
    throw new Error(`Invalid decimals '${decimals}': must be a non-negative integer`);
  }
  const mult = parseDecimal(multiplier, 'multiplier');
  if (mult.negative || mult.digits === 0n) {
    throw new Error(`Invalid multiplier '${multiplier}': must be positive`);
  }

  // ui = raw * (multDigits / 10^multScale) / 10^decimals
  //    = (raw * multDigits) / 10^(multScale + decimals)   — exact, terminating expansion
  const numerator = raw * mult.digits;
  const fractionDigits = mult.scale + decimals;
  const denominator = 10n ** BigInt(fractionDigits);

  const quotient = numerator / denominator;
  const remainder = numerator % denominator;
  if (remainder === 0n) {
    return toDecimalString({ negative: false, digits: quotient, scale: 0 });
  }
  // The denominator IS 10^fractionDigits, so the exact fraction digits are `remainder`
  // zero-padded to fractionDigits — no long division needed.
  return toDecimalString({
    negative: false,
    digits: quotient * 10n ** BigInt(fractionDigits) + remainder,
    scale: fractionDigits,
  });
}

/**
 * Convert a scaled UI denomination to raw base units. Inverse of
 * {@link rawToUiAmountString}: flooring an exact ui string reproduces the
 * original raw amount.
 *
 * @param uiAmount The UI amount as a decimal string (>= 0)
 * @param multiplier The mint's UiAmountMultiplier as a decimal string (> 0)
 * @param decimals The mint's decimals (>= 0)
 * @returns The raw amount in base units, floored to the integer unit
 * @throws if any argument is malformed, the ui amount is negative, or the multiplier is not positive
 */
export function uiAmountToRaw(uiAmount: string, multiplier: string, decimals: number): bigint {
  if (!Number.isInteger(decimals) || decimals < 0) {
    throw new Error(`Invalid decimals '${decimals}': must be a non-negative integer`);
  }
  const ui = parseDecimal(uiAmount, 'uiAmount');
  if (ui.negative) {
    throw new Error(`Invalid uiAmount '${uiAmount}': must be non-negative`);
  }
  const mult = parseDecimal(multiplier, 'multiplier');
  if (mult.negative || mult.digits === 0n) {
    throw new Error(`Invalid multiplier '${multiplier}': must be positive`);
  }

  // ui = uiDigits / 10^uiScale;  multiplier = multDigits / 10^multScale
  // raw = (uiDigits / 10^uiScale) * 10^decimals * (10^multScale / multDigits)
  //     = (uiDigits * 10^(decimals + multScale)) / (multDigits * 10^uiScale)
  const numerator = ui.digits * 10n ** BigInt(decimals + mult.scale);
  const denominator = mult.digits * 10n ** BigInt(ui.scale);
  return numerator / denominator; // floor — raw base units are integers
}
