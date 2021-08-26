/**
 * @prettier
 */

/**
 * @deprecated
 */
export const coins = {
  BCH: 'bch',
  BSV: 'bsv',
  BTC: 'btc',
  BTG: 'btg',
  LTC: 'ltc',
  ZEC: 'zec',
  DASH: 'dash',
} as const;

/** @deprecated */
export type CoinKey = keyof typeof coins;
/** @deprecated */
export type Coin = typeof coins[CoinKey];

export type NetworkName =
  | 'bitcoin'
  | 'testnet'
  | 'bitcoincash'
  | 'bitcoincashTestnet'
  | 'bitcoingold'
  | 'bitcoingoldTestnet'
  | 'bitcoinsv'
  | 'bitcoinsvTestnet'
  | 'dash'
  | 'dashTest'
  | 'litecoin'
  | 'litecoinTest'
  | 'zcash'
  | 'zcashTest';

export type Network = {
  messagePrefix: string;
  pubKeyHash: number;
  scriptHash: number;
  wif: number;
  bip32: {
    public: number;
    private: number;
  };
  bech32?: string;
  /**
   * @deprecated
   */
  coin: Coin;
  forkId?: number;
};

export type ZcashNetwork = Network & {
  consensusBranchId: Record<number, number>;
};

export type BitcoinCashNetwork = Network & {
  cashAddr: {
    prefix: string;
    pubKeyHash: number;
    scriptHash: number;
  };
};
