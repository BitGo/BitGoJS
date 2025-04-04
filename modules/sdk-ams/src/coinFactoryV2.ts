import { BitGoBase, BaseCoin, UnsupportedCoinError, CoinConstructor } from '@bitgo/sdk-core';
import { CoinMap, CoinNotDefinedError, coins } from '@bitgo/statics';

export class CoinFactoryV2 {
  protected coinConstructors: Map<string, CoinConstructor>;
  protected coinMap: CoinMap;

  /**
   * Constructor for CoinFactoryV2 Object
   * @param coinMap - Custom coin map that defaults to the statics coin map
   */
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

    if (constructor && typeof constructor === 'function') {
      return constructor(bitgo, staticsCoin);
    }

    throw new UnsupportedCoinError(name);
  }
}
