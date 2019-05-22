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

export abstract class Mainnet extends BaseNetwork {
  type = NetworkType.MAINNET;
}

export abstract class Testnet extends BaseNetwork {
  type = NetworkType.TESTNET;
}

class Ethereum extends Mainnet implements AccountNetwork {
  family = CoinFamily.ETH;
}

class Kovan extends Testnet implements AccountNetwork {
  family = Ethereum.prototype.family;
}

class Bitcoin extends Mainnet implements UtxoNetwork {
  messagePrefix = '\x18Bitcoin Signed Message:\n';
  bech32 = 'bc';
  bip32 = {
    public: 0x0488b21e,
    private: 0x0488ade4,
  };
  pubKeyHash = 0x00;
  scriptHash = 0x05;
  wif = 0x80;
  family = CoinFamily.BTC;
}

class BitcoinTestnet extends Testnet implements UtxoNetwork {
  messagePrefix = Bitcoin.prototype.messagePrefix;
  bech32 = 'tb';
  bip32 = {
    public: 0x043587cf,
    private: 0x04358394,
  };
  pubKeyHash = 0x6f;
  scriptHash = 0xc4;
  wif = 0xef;
  family = Bitcoin.prototype.family;
}

// BCH inherits a fair bit of config from Bitcoin
class BitcoinCash extends Mainnet implements UtxoNetwork {
  messagePrefix = Bitcoin.prototype.messagePrefix;
  bip32 = Bitcoin.prototype.bip32;
  pubKeyHash = Bitcoin.prototype.pubKeyHash;
  scriptHash = Bitcoin.prototype.scriptHash;
  wif = Bitcoin.prototype.wif;
  family = CoinFamily.BCH;
}

// TBCH inherits a fair bit of config from BitcoinTestnet
class BitcoinCashTestnet extends Testnet implements UtxoNetwork {
  messagePrefix = Bitcoin.prototype.messagePrefix;
  bip32 = BitcoinTestnet.prototype.bip32;
  pubKeyHash = BitcoinTestnet.prototype.pubKeyHash;
  scriptHash = BitcoinTestnet.prototype.scriptHash;
  wif = BitcoinTestnet.prototype.wif;
  family = BitcoinCash.prototype.family;
}

// BSV inherits a fair bit of config from Bitcoin
class BitcoinSV extends Mainnet implements UtxoNetwork {
  messagePrefix = Bitcoin.prototype.messagePrefix;
  bip32 = Bitcoin.prototype.bip32;
  pubKeyHash = Bitcoin.prototype.pubKeyHash;
  scriptHash = Bitcoin.prototype.scriptHash;
  wif = Bitcoin.prototype.wif;
  family = CoinFamily.BSV;
}

// TBSV inherits a fair bit of config from BitcoinTestnet
class BitcoinSVTestnet extends Testnet implements UtxoNetwork {
  messagePrefix = Bitcoin.prototype.messagePrefix;
  bip32 = BitcoinTestnet.prototype.bip32;
  pubKeyHash = BitcoinTestnet.prototype.pubKeyHash;
  scriptHash = BitcoinTestnet.prototype.scriptHash;
  wif = BitcoinTestnet.prototype.wif;
  family = BitcoinSV.prototype.family;
}

class BitcoinGold extends Mainnet implements UtxoNetwork {
  messagePrefix = '\x18Bitcoin Gold Signed Message:\n';
  bech32 = 'btg';
  bip32 = {
    public: 0x0488b21e,
    private: 0x0488ade4,
  };
  pubKeyHash = 0x26;
  scriptHash = 0x17;
  wif = 0x80;
  family = CoinFamily.BTG;
}

class Litecoin extends Mainnet implements UtxoNetwork {
  messagePrefix = '\x19Litecoin Signed Message:\n';
  bech32 = 'ltc';
  // clarify these constants - they are different between BitGoJS and bitgo-utxo-lib
  bip32 = {
    public: 0x0488b21e,
    private: 0x0488ade4,
  };
  pubKeyHash = 0x30;
  scriptHash = 0x32;
  wif = 0xb0;
  family = CoinFamily.LTC;
}

class LitecoinTestnet extends Testnet implements UtxoNetwork {
  bech32 = 'tltc';
  // clarify these constants - they are different between BitGoJS and bitgo-utxo-lib
  bip32 = {
    public: 0x0488b21e,
    private: 0x0488ade4,
  };
  pubKeyHash = 0x6f;
  scriptHash = 0x3a;
  wif = 0xb0;

  // fields "inherited" from the Litecoin mainnet
  messagePrefix = Litecoin.prototype.messagePrefix;
  family = Litecoin.prototype.family;
}

class Ripple extends Mainnet implements AccountNetwork {
  family = CoinFamily.XRP;
}

class RippleTestnet extends Testnet implements AccountNetwork {
  family = Ripple.prototype.family;
}

class Stellar extends Mainnet implements AccountNetwork {
  family = CoinFamily.XLM;
}

class StellarTestnet extends Testnet implements AccountNetwork {
  family = Stellar.prototype.family;
}

export const Networks = {
  main: {
    bitcoin: Object.freeze(new Bitcoin()),
    bitcoinCash: Object.freeze(new BitcoinCash()),
    bitcoinCashSV: Object.freeze(new BitcoinSV()),
    bitcoinGold: Object.freeze(new BitcoinGold()),
    litecoin: Object.freeze(new Litecoin()),
    ethereum: Object.freeze(new Ethereum()),
    ripple: Object.freeze(new Ripple()),
    stellar: Object.freeze(new Stellar()),
  },
  test: {
    bitcoin: Object.freeze(new BitcoinTestnet()),
    bitcoinCash: Object.freeze(new BitcoinCashTestnet()),
    bitcoinCashSV: Object.freeze(new BitcoinSVTestnet()),
    litecoin: Object.freeze(new LitecoinTestnet()),
    kovan: Object.freeze(new Kovan()),
    ripple: Object.freeze(new RippleTestnet()),
    stellar: Object.freeze(new StellarTestnet()),
  },
};
