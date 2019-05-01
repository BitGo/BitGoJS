import { BaseCoin } from './base';
import { CoinNotDefinedError, DuplicateCoinDefinitionError, ModificationError } from './errors';
import { utxo } from './utxo';
import { Networks } from './networks';

export class CoinMap {
  private readonly map = new Map<string, BaseCoin>();

  private constructor() {}

  static fromCoins(...coins: BaseCoin[]): CoinMap {
    return coins.reduce((coinMap, coin) => {
      if (coinMap.map.has(coin.name)) {
        throw new DuplicateCoinDefinitionError(coin.name);
      }
      coinMap.map.set(coin.name, coin);
      return coinMap;
    }, new CoinMap());
  }

  /**
   * Override `get` to throw if a coin is missing, instead of returning undefined.
   * @param {string} key
   * @return {BaseCoin}
   */
  public get(key: string): Readonly<BaseCoin> {
    if (this.map.has(key)) {
      return this.map.get(key)!;
    }

    throw new CoinNotDefinedError(key);
  }
}

export const coins = CoinMap.fromCoins(
  utxo('btc', 'Bitcoin', Networks.main.bitcoin),
  utxo('tbtc', 'Testnet Bitcoin', Networks.test.bitcoin),
  utxo('ltc', 'Litecoin', Networks.main.litecoin),
  utxo('tltc', 'Testnet Litecoin', Networks.test.litecoin)
);
