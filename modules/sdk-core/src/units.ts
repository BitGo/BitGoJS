import BigNumber from 'bignumber.js';

import { coins } from '@bitgo/statics';

/**
 * Converts an amount of coin in base units (such as satoshis, cents, or wei) to full units (such as bitcoin, dollars, or ether)
 * @param baseUnits number of base units
 * @param coin coin ticker
 */
export function toFullUnits(baseUnits: number | string | BigNumber, coin: string): string {
  return new BigNumber(baseUnits).div(10 ** coins.get(coin).decimalPlaces).toString();
}

/**
 * Converts an amount of coin in base units (such as satoshis, cents, or wei) to full units (such as bitcoin, dollars, or ether) fixed amount
 * @param baseUnits number of base units
 * @param coin coin ticker
 */
export function toFullUnitsFixed(baseUnits: number | string | BigNumber, coin: string): string {
  const decimalPlaces = coins.get(coin).decimalPlaces;
  return new BigNumber(baseUnits).div(10 ** decimalPlaces).toFixed(decimalPlaces);
}

/**
 * Converts an amount of coin in full units (such as bitcoin, dollars, or ether) to base units (such as satoshis, cents, or wei)
 * @param fullUnits number of full units
 * @param coin coin ticker
 */
export function toBaseUnits(fullUnits: number | string | BigNumber, coin: string): string {
  return new BigNumber(fullUnits).times(10 ** coins.get(coin).decimalPlaces).toString();
}

/**
 * Converts price and quantity for a coin into base units market value
 * (note, price might be 2 decimal places longer than priceIn decimal places for base units)
 * @param coin - which coin to calculate for
 * @param price - price of a unit of the coin specified
 * @param quantity - number of coins
 * @param priceIn - numerator of trading pair, for example USD of BTC/USD
 */
export function toMarketValueBaseUnits(
  coin: string,
  price: number | string | BigNumber,
  quantity: string | number | bigint,
  priceIn = 'tsusd'
): bigint {
  const roundFactor = BigInt(1000000);
  const priceInBaseUnitsBy100 = Math.round(Number(toBaseUnits(price, priceIn)) * 100);
  const decimalPlacesCoinBy100 = BigInt(toBaseUnits(1, coin)) * BigInt(100);
  return (roundFactor * BigInt(quantity) * BigInt(priceInBaseUnitsBy100)) / (decimalPlacesCoinBy100 * roundFactor);
}
