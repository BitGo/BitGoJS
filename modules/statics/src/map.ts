import { BaseCoin } from './base';
import { DuplicateCoinDefinitionError, CoinNotDefinedError } from './errors';

export class CoinMap {
  private readonly _map = new Map<string, Readonly<BaseCoin>>();

  private constructor() {}

  static fromCoins(coins: Readonly<BaseCoin>[]): CoinMap {
    return coins.reduce((coinMap, coin) => {
      if (coinMap._map.has(coin.name)) {
        throw new DuplicateCoinDefinitionError(coin.name);
      }
      coinMap._map.set(coin.name, coin);
      return coinMap;
    }, new CoinMap());
  }

  /**
   * Override `get` to throw if a coin is missing, instead of returning undefined.
   * @param {string} key
   * @return {BaseCoin}
   */
  public get(key: string): Readonly<BaseCoin> {
    if (this._map.has(key)) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return this._map.get(key)!;
    }

    throw new CoinNotDefinedError(key);
  }

  public map<T>(mapper: (coin: Readonly<BaseCoin>, coinName: string) => T): T[] {
    const mapResult: T[] = [];
    this._map.forEach((value, key) => {
      mapResult.push(mapper(value, key));
    });
    return mapResult;
  }

  public reduce<T>(reducer: (acc: T, coin: Readonly<BaseCoin>, coinName: string) => T, initialValue: T): T {
    let acc = initialValue;
    this._map.forEach((value, key) => {
      acc = reducer(acc, value, key);
    });
    return acc;
  }

  public filter(predicate: (coin: Readonly<BaseCoin>, coinName: string) => boolean): CoinMap {
    const filterResult: Readonly<BaseCoin>[] = [];
    this._map.forEach((value, key) => {
      if (predicate(value, key)) {
        filterResult.push(value);
      }
    });
    return CoinMap.fromCoins(filterResult);
  }

  public forEach(callback: (coin: Readonly<BaseCoin>, coinName: string) => void): void {
    this._map.forEach(callback);
  }
}
