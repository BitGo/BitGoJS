import { CoinFamily } from './base';

export const enum NetworkType {
  MAINNET = 'mainnet',
  TESTNET = 'testnet',
}

export abstract class BaseNetwork {
  public abstract readonly type: NetworkType;
  public abstract readonly family: CoinFamily;
}

export interface UtxoNetwork extends BaseNetwork {
  messagePrefix: string;
  bech32?: string;
  bip32: {
    public: number;
    private: number;
  };
  pubKeyHash: number;
  scriptHash: number;
  wif: number;
}

export interface AccountNetwork extends BaseNetwork {}
export interface OfcNetwork extends BaseNetwork {}

abstract class Mainnet extends BaseNetwork {
  type = NetworkType.MAINNET;
}

abstract class Testnet extends BaseNetwork {
  type = NetworkType.TESTNET;
}

/**
 * Mainnet abstract class for Bitcoin forks. These are the constants from the Bitcoin main network,
 * which are overridden to various degrees by each Bitcoin fork.
 *
 * This allows us to not redefine these properties for forks which haven't changed them from Bitcoin.
 *
 * However, if a coin network has changed one of these properties, and you accidentally forget to override,
 * you'll inherit the incorrect values from the Bitcoin network. Be wary, and double check your network constant
 * overrides to ensure you're not missing any changes.
 */
abstract class BitcoinLikeMainnet extends Mainnet implements UtxoNetwork {
  messagePrefix = '\x18Bitcoin Signed Message:\n';
  bip32 = {
    public: 0x0488b21e,
    private: 0x0488ade4,
  };
  pubKeyHash = 0x00;
  scriptHash = 0x05;
  wif = 0x80;
  type = NetworkType.MAINNET;
}

/**
 * Testnet abstract class for Bitcoin forks. Works exactly the same as `BitcoinLikeMainnet`,
 * except the constants are taken from the Bitcoin test network.
 */
abstract class BitcoinLikeTestnet extends Testnet implements UtxoNetwork {
  messagePrefix = '\x18Bitcoin Signed Message:\n';
  bip32 = {
    public: 0x043587cf,
    private: 0x04358394,
  };
  pubKeyHash = 0x6f;
  scriptHash = 0xc4;
  wif = 0xef;
  type = NetworkType.TESTNET;
}

class Ethereum extends Mainnet implements AccountNetwork {
  family = CoinFamily.ETH;
}

class Kovan extends Testnet implements AccountNetwork {
  family = CoinFamily.ETH;
}

class Bitcoin extends BitcoinLikeMainnet {
  family = CoinFamily.BTC;
  bech32 = 'bc';
}

class BitcoinTestnet extends BitcoinLikeTestnet {
  family = CoinFamily.BTC;
  bech32 = 'tb';
}

class BitcoinCash extends BitcoinLikeMainnet {
  family = CoinFamily.BCH;
}

class BitcoinCashTestnet extends BitcoinLikeTestnet {
  family = CoinFamily.BCH;
}

class BitcoinSV extends BitcoinLikeMainnet {
  family = CoinFamily.BSV;
}

class BitcoinSVTestnet extends BitcoinLikeTestnet {
  family = CoinFamily.BSV;
}

class BitcoinGold extends BitcoinLikeMainnet {
  messagePrefix = '\x18Bitcoin Gold Signed Message:\n';
  bech32 = 'btg';
  pubKeyHash = 0x26;
  scriptHash = 0x17;
  family = CoinFamily.BTG;
}

class Litecoin extends BitcoinLikeMainnet {
  messagePrefix = '\x19Litecoin Signed Message:\n';
  bech32 = 'ltc';
  pubKeyHash = 0x30;
  scriptHash = 0x32;
  wif = 0xb0;
  family = CoinFamily.LTC;
}

class LitecoinTestnet extends BitcoinLikeTestnet {
  messagePrefix = '\x19Litecoin Signed Message:\n';
  bech32 = 'tltc';
  bip32 = {
    public: 0x0488b21e,
    private: 0x0488ade4,
  };
  pubKeyHash = 0x6f;
  scriptHash = 0x3a;
  wif = 0xb0;
  family = CoinFamily.LTC;
}

class ZCash extends BitcoinLikeMainnet {
  messagePrefix = '\x18ZCash Signed Message:\n';
  pubKeyHash = 0x1cb8;
  scriptHash = 0x1cbd;
  family = CoinFamily.ZEC;
}

class ZCashTestnet extends BitcoinLikeTestnet {
  messagePrefix = '\x18ZCash Signed Message:\n';
  pubKeyHash = 0x1d25;
  scriptHash = 0x1cba;
  family = CoinFamily.ZEC;
}

class Xrp extends Mainnet implements AccountNetwork {
  family = CoinFamily.XRP;
}

class XrpTestnet extends Testnet implements AccountNetwork {
  family = CoinFamily.XRP;
}

class Stellar extends Mainnet implements AccountNetwork {
  family = CoinFamily.XLM;
}

class StellarTestnet extends Testnet implements AccountNetwork {
  family = CoinFamily.XLM;
}

class Ofc extends Mainnet implements OfcNetwork {
  family = CoinFamily.OFC;
}

class OfcTestnet extends Testnet implements OfcNetwork {
  family = CoinFamily.OFC;
}

export const Networks = {
  main: {
    bitcoin: Object.freeze(new Bitcoin()),
    bitcoinCash: Object.freeze(new BitcoinCash()),
    bitcoinSV: Object.freeze(new BitcoinSV()),
    bitcoinGold: Object.freeze(new BitcoinGold()),
    litecoin: Object.freeze(new Litecoin()),
    ethereum: Object.freeze(new Ethereum()),
    xrp: Object.freeze(new Xrp()),
    stellar: Object.freeze(new Stellar()),
    zCash: Object.freeze(new ZCash()),
    ofc: Object.freeze(new Ofc()),
  },
  test: {
    bitcoin: Object.freeze(new BitcoinTestnet()),
    bitcoinCash: Object.freeze(new BitcoinCashTestnet()),
    bitcoinSV: Object.freeze(new BitcoinSVTestnet()),
    litecoin: Object.freeze(new LitecoinTestnet()),
    kovan: Object.freeze(new Kovan()),
    xrp: Object.freeze(new XrpTestnet()),
    stellar: Object.freeze(new StellarTestnet()),
    zCash: Object.freeze(new ZCashTestnet()),
    ofc: Object.freeze(new OfcTestnet()),
  },
};
