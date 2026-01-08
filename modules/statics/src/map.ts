import { BaseCoin } from './base';
import { DuplicateCoinDefinitionError, CoinNotDefinedError, DuplicateCoinIdDefinitionError } from './errors';
import { ContractAddressDefinedToken, NFTCollectionIdDefinedToken } from './account';
import { EthereumNetwork } from './networks';

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
  // Lazily initialized cache for chainId to coin name mapping (derived from network definitions)
  private _coinByChainId: Map<number, string> | null = null;

  private constructor() {
    // Do not instantiate
  }

  static fromCoins(coins: Readonly<BaseCoin>[]): CoinMap {
    const coinMap = new CoinMap();
    coins.forEach((coin) => {
      coinMap.addCoin(coin);
    });
    return coinMap;
  }

  public addCoin(coin: Readonly<BaseCoin>): void {
    if (this._map.has(coin.name)) {
      throw new DuplicateCoinDefinitionError(coin.name);
    }
    if (this._coinByIds.has(coin.id)) {
      throw new DuplicateCoinIdDefinitionError(coin.id);
    }
    const alias = coin.alias;
    if (alias && this._coinByAliases.has(alias)) {
      throw new DuplicateCoinDefinitionError(alias);
    }
    this._map.set(coin.name, coin);
    this._coinByIds.set(coin.id, coin);
    if (alias) {
      this._coinByAliases.set(coin.alias, coin);
    }

    if (coin.isToken) {
      if (coin instanceof ContractAddressDefinedToken) {
        this._coinByContractAddress.set(`${coin.family}:${coin.contractAddress}`, coin);
      } else if (coin instanceof NFTCollectionIdDefinedToken) {
        this._coinByNftCollectionID.set(`${coin.prefix}${coin.family}:${coin.nftCollectionId}`, coin);
      }
    }
  }

  /**
   * Replace a Base coin object completely from the CoinMap using its ID.
   * @param {string} key key to search the old coin object
   * @param {Readonly<BaseCoin>} coin new coin object
   */
  public replace(coin: Readonly<BaseCoin>): void {
    if (this.has(coin.id)) {
      const oldCoin = this.get(coin.id);
      this._map.delete(oldCoin.name);
      this._coinByIds.delete(oldCoin.id);
      if (oldCoin.alias) {
        this._coinByAliases.delete(oldCoin.alias);
      }
      if (oldCoin.isToken) {
        if (oldCoin instanceof ContractAddressDefinedToken) {
          this._coinByContractAddress.delete(`${oldCoin.family}:${oldCoin.contractAddress}`);
        } else if (oldCoin instanceof NFTCollectionIdDefinedToken) {
          this._coinByNftCollectionID.delete(`${oldCoin.prefix}${oldCoin.family}:${oldCoin.nftCollectionId}`);
        }
      }
    }
    this.addCoin(coin);
  }

  /**
   * Hardcoded mapping for backward compatibility.
   */
  private static readonly LEGACY_CHAIN_ID_MAP: Record<number, string> = {
    1: 'eth',
    42: 'teth',
    5: 'gteth',
    560048: 'hteth',
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
    80069: 'tbera',
    42220: 'celo',
    11142220: 'tcelo',
    2222: 'kava',
    2221: 'tkava',
    43114: 'avax',
    43113: 'tavax',
    100: 'gno',
    130: 'uni',
    324: 'zketh',
    8453: 'baseeth',
    84532: 'tbaseeth',
    30143: 'mon',
    10143: 'tmon',
    480: 'world',
    4801: 'tworld',
    5031: 'somi',
    50312: 'tstt',
    1868: 'soneium',
    1946: 'tsoneium',
    33111: 'tapechain',
    33139: 'apechain',
    688688: 'tphrs',
    102030: 'ctc',
    102031: 'tctc',
    998: 'thypeevm',
    999: 'hypeevm',
    16602: 'tog',
    16661: 'og',
    9746: 'txpl',
    9745: 'xpl',
    14601: 'tsonic',
    146: 'sonic',
    1328: 'tseievm',
    1329: 'seievm',
    1001: 'tkaia',
    8217: 'kaia',
    1270: 'tirys',
    59141: 'tlineaeth',
    59144: 'lineaeth',
    1315: 'tip',
    1514: 'ip',
    545: 'tflow',
    747: 'flow',
    98867: 'tplume',
    98866: 'plume',
    6342: 'tmegaeth',
    295: 'hbarevm',
    296: 'thbarevm',
    196: 'okb',
    1952: 'tokb',
    5734951: 'jovayeth',
    2019775: 'tjovayeth',
    5042002: 'tarc',
    42428: 'tempo',
    42429: 'ttempo',
    5000: 'mantle',
    5003: 'tmantle',
    20993: 'fluenteth',
    20994: 'tfluenteth',
  };

  private buildChainIdMap(): Map<number, string> {
    const chainIdMap = new Map<number, string>();
    this._map.forEach((coin, coinName) => {
      // Skip tokens - they share the same chainId as their parent chain
      if (coin.isToken) {
        return;
      }
      const network = coin.network;
      if ('chainId' in network && typeof (network as EthereumNetwork).chainId === 'number') {
        const chainId = (network as EthereumNetwork).chainId;
        if (!chainIdMap.has(chainId)) {
          chainIdMap.set(chainId, coinName);
        }
      }
    });
    return chainIdMap;
  }

  public coinNameFromChainId(chainId: number): string | undefined {
    const coinName = CoinMap.LEGACY_CHAIN_ID_MAP[chainId];
    if (coinName) {
      return coinName;
    }

    if (this._coinByChainId === null) {
      this._coinByChainId = this.buildChainIdMap();
    }
    return this._coinByChainId.get(chainId);
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
