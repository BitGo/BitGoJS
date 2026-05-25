/**
 * @prettier
 */
import { coins, CoinMap, BaseCoin as StaticsBaseCoin, CoinNotDefinedError } from '@bitgo/statics';
import { BaseCoin } from './baseCoin';
import { BitGoBase } from './bitgoBase';
import { UnsupportedCoinError } from './errors';

export type CoinConstructor = (bitgo: BitGoBase, staticsCoin?: Readonly<StaticsBaseCoin>) => BaseCoin;

export interface NamedCoinConstructor {
  name: string;
  coinConstructor: CoinConstructor;
}

export class CoinFactory {
  private coinConstructors: Map<string, CoinConstructor>;
  private coinMap: CoinMap;

  constructor(coinMap: CoinMap = coins) {
    this.coinConstructors = new Map();
    this.coinMap = coinMap;
  }

  /**
   * @param name Name of coin or address
   * @returns {(Object|undefined)}
   */
  private getCoinConstructor(name: string): CoinConstructor | undefined {
    if (this.coinConstructors === undefined) {
      this.coinConstructors = new Map();
    }
    return this.coinConstructors.get(name);
  }

  /**
   * @param name Name of coin or address
   * @param coin Coin plugin's constructor
   * @throws Error
   */
  public register(name: string, coin: CoinConstructor): void {
    this.coinConstructors.set(name, coin);
  }

  /**
   * Checks if the coin is present in both coin map and constructor map
   * @param name Name of coin
   * @returns {boolean}
   */

  public hasCoin(name: string): boolean {
    return this.coinMap.has(name) && this.getCoinConstructor(name) !== undefined;
  }

  /**
   * Registers a token in the coin map and the constructor map.
   * @param staticsCoin The static coin definition from BitGo Statics
   * @param coinConstructor The constructor for the coin plugin
   * @throws Error
   */
  public registerToken(staticsCoin: Readonly<StaticsBaseCoin>, coinConstructor: CoinConstructor): void {
    if (
      !(
        this.coinMap.has(staticsCoin.name) ||
        this.coinMap.has(staticsCoin.id) ||
        (staticsCoin.alias && this.coinMap.has(staticsCoin.alias))
      )
    ) {
      this.coinMap.addCoin(staticsCoin);
    }
    this.register(staticsCoin.name, coinConstructor);
  }

  /**
   * @param bitgo Instance of BitGo
   * @param name Name of coin or address
   * @throws CoinNotDefinedError
   * @throws UnsupportedCoinError
   */
  public getInstance(bitgo: BitGoBase, name: string): BaseCoin {
    let staticsCoin;

    try {
      staticsCoin = this.coinMap.get(name);
    } catch (e) {
      if (!(e instanceof CoinNotDefinedError)) {
        throw e;
      }
    }

    const constructor = this.getCoinConstructor(name);

    if (constructor) {
      return constructor(bitgo, staticsCoin);
    }

    throw new UnsupportedCoinError(name);
  }
}

export const GlobalCoinFactory: CoinFactory = new CoinFactory();
