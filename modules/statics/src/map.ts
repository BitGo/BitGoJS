import { BaseCoin } from './base';
import { DuplicateCoinDefinitionError, CoinNotDefinedError, DuplicateCoinIdDefinitionError } from './errors';
import { ContractAddressDefinedToken, NFTCollectionIdDefinedToken } from './account';

export class CoinMap {
  private readonly _map = new Map<string, Readonly<BaseCoin>>();
  private readonly _coinByIds = new Map<string, Readonly<BaseCoin>>();
  // Holds key equivalences used during an asset name migration
  private readonly _coinByAliases = new Map<string, Readonly<BaseCoin>>();
  // map of coin by address -> the key is the family:contractAddress
  // the family is the where the coin is e.g l1 chains like eth, bsc etc. or l2 like arbeth, celo etc.
  private readonly _coinByContractAddress = new Map<string, Readonly<BaseCoin>>();
  // map of coin by NFT collection ID -> the key is the (t)family:nftCollectionID
  private readonly _coinByNftCollectionID = new Map<string, Readonly<BaseCoin>>();

  private constructor() {
    // Do not instantiate
  }

  static fromCoins(coins: Readonly<BaseCoin>[]): CoinMap {
    return coins.reduce((coinMap, coin) => {
      if (coinMap.has(coin.name)) {
        throw new DuplicateCoinDefinitionError(coin.name);
      }
      coinMap._map.set(coin.name, coin);

      if (coinMap._coinByIds.has(coin.id)) {
        throw new DuplicateCoinIdDefinitionError(coin.id);
      }
      coinMap._coinByIds.set(coin.id, coin);

      const alias = coin.alias;
      if (alias) {
        if (coinMap.has(alias)) {
          throw new DuplicateCoinDefinitionError(alias);
        }
        coinMap._coinByAliases.set(alias, coin);
      }
      if (coin.isToken) {
        if (coin instanceof ContractAddressDefinedToken) {
          coinMap._coinByContractAddress.set(`${coin.family}:${coin.contractAddress}`, coin);
        } else if (coin instanceof NFTCollectionIdDefinedToken) {
          coinMap._coinByNftCollectionID.set(`${coin.prefix}${coin.family}:${coin.nftCollectionId}`, coin);
        }
      }
      return coinMap;
    }, new CoinMap());
  }

  static coinNameFromChainId(chainId: number): string {
    const ethLikeCoinFromChainId: Record<number, string> = {
      1: 'eth',
      42: 'teth',
      5: 'gteth',
      17000: 'hteth',
      10001: 'ethw',
      80002: 'tpolygon',
      137: 'polygon',
      56: 'bsc',
      97: 'tbsc',
      42161: 'arbeth',
      421614: 'tarbeth',
      10: 'opeth',
      11155420: 'topeth',
      1116: 'coredao',
      1114: 'tcoredao',
      248: 'oas',
      9372: 'toas',
      14: 'flr',
      114: 'tflr',
      19: 'sgb',
      16: 'tsgb',
      1111: 'wemix',
      1112: 'twemix',
      50: 'xdc',
      51: 'txdc',
      80094: 'bera',
      80000: 'tbera',
      42220: 'celo',
      44787: 'tcelo',
      2222: 'kava',
      2221: 'tkava',
      43114: 'avax',
      43113: 'tavax',
      100: 'gno',
      130: 'uni',
      324: 'zketh',
      8453: 'baseeth',
      10143: 'tmon',
    };
    return ethLikeCoinFromChainId[chainId];
  }

  /**
   * Override `get` to throw if a coin is missing, instead of returning undefined.
   * It will honor key equivalences in case given key is missing.
   * @param {string} key
   * @return {BaseCoin}
   */
  public get(key: string): Readonly<BaseCoin> {
    const coin =
      this._map.get(key) ||
      this._coinByIds.get(key) ||
      this._coinByAliases.get(key) ||
      this._coinByContractAddress.get(key) ||
      this._coinByNftCollectionID.get(key);

    if (coin) {
      return coin;
    }

    throw new CoinNotDefinedError(key);
  }

  public has(key: string): boolean {
    return (
      this._map.has(key) ||
      this._coinByIds.has(key) ||
      this._coinByAliases.has(key) ||
      this._coinByContractAddress.has(key) ||
      this._coinByNftCollectionID.has(key)
    );
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

  public [Symbol.iterator](): IterableIterator<[string, Readonly<BaseCoin>]> {
    return this._map[Symbol.iterator]();
  }
}
