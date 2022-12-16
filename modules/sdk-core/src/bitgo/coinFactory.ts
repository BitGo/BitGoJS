/**
 * @prettier
 */
import { coins, BaseCoin as StaticsBaseCoin, CoinNotDefinedError } from '@bitgo/statics';
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

  constructor() {
    this.coinConstructors = new Map();
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
   * @param bitgo Instance of BitGo
   * @param name Name of coin or address
   * @throws CoinNotDefinedError
   * @throws UnsupportedCoinError
   */
  public getInstance(bitgo: BitGoBase, name: string): BaseCoin {
    let staticsCoin;

    try {
      staticsCoin = coins.get(name);
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
