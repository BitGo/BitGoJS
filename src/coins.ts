import { account, erc20, terc20 } from './account';
import { BaseCoin } from './base';
import { CoinNotDefinedError, DuplicateCoinDefinitionError } from './errors';
import { utxo, UtxoCoin } from './utxo';
import { Networks } from './networks';

export class CoinMap {
  private readonly _map = new Map<string, BaseCoin>();

  private constructor() {}

  static fromCoins(...coins: BaseCoin[]): CoinMap {
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
      return this._map.get(key)!;
    }

    throw new CoinNotDefinedError(key);
  }

  public map<T>(mapper: (coin: BaseCoin, coinName: string) => T): T[] {
    const mapResult: T[] = [];
    this._map.forEach((value, key) => {
      mapResult.push(mapper(value, key));
    });
    return mapResult;
  }

  public reduce<T>(reducer: (acc: T, coin: BaseCoin, coinName: string) => T, initialValue: T): T {
    let acc = initialValue;
    this._map.forEach((value, key) => {
      acc = reducer(acc, value, key);
    });
    return acc;
  }

  public filter(predicate: (coin: BaseCoin, coinName: string) => boolean): CoinMap {
    const filterResult: BaseCoin[] = [];
    this._map.forEach((value, key) => {
      if (predicate(value, key)) {
        filterResult.push(value);
      }
    });
    return CoinMap.fromCoins(...filterResult);
  }

  public forEach(callback: (coin: BaseCoin, coinName: string) => void): void {
    this._map.forEach(callback);
  }
}

export { UtxoCoin } from './utxo';
export { AccountCoin, Erc20Coin } from './account';
export { CoinFeature } from './base';
export * from './errors';
export { Networks } from './networks';

export const coins = CoinMap.fromCoins(
  utxo('btc', 'Bitcoin', Networks.main.bitcoin),
  utxo('tbtc', 'Testnet Bitcoin', Networks.test.bitcoin),
  utxo('ltc', 'Litecoin', Networks.main.litecoin),
  utxo('tltc', 'Testnet Litecoin', Networks.test.litecoin),
  account('eth', 'Ethereum', Networks.main.ethereum, 18),
  erc20('erc', 'ERC Token', 0, '0x8e35d374594fa07d0de5c5e6563766cd24336251'),
  erc20('omg', 'OmiseGo Token', 18, '0xd26114cd6ee289accf82350c8d8487fedb8a0c07'),
  terc20('terc', 'ERC Test Token', 0, '0x945ac907cf021a6bcd07852bb3b8c087051706a9'),
  terc20('test', 'Test Mintable ERC20 Token', 18, '0x1fb879581f31687b905653d4bbcbe3af507bed37')
);
