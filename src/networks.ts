import { CoinFamily } from './base';

export const enum NetworkType {
  MAINNET = 'mainnet',
  TESTNET = 'testnet',
}

export interface UtxoNetwork {
  messagePrefix: string;
  bech32: string;
  bip32: {
    public: number;
    private: number;
  };
  pubKeyHash: number;
  scriptHash: number;
  wif: number;
  family: CoinFamily;
  type: NetworkType;
}

export interface AccountNetwork {
  family: CoinFamily;
  type: NetworkType;
}

export class Mainnet {
  type = NetworkType.MAINNET;
}

export class Testnet {
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
  bech32 = Bitcoin.prototype.bech32;
  bip32 = {
    public: Bitcoin.prototype.bip32.public,
    private: Bitcoin.prototype.bip32.private,
  };
  pubKeyHash = Bitcoin.prototype.pubKeyHash;
  scriptHash = Bitcoin.prototype.scriptHash;
  wif = Bitcoin.prototype.wif;
  family = CoinFamily.BCH;
}

// TBCH inherits a fair bit of config from BitcoinTestnet
class BitcoinCashTestnet extends Testnet implements UtxoNetwork {
  messagePrefix = Bitcoin.prototype.messagePrefix;
  bech32 = BitcoinTestnet.prototype.bech32;
  bip32 = {
    public: BitcoinTestnet.prototype.bip32.public,
    private: BitcoinTestnet.prototype.bip32.private,
  };
  pubKeyHash = BitcoinTestnet.prototype.pubKeyHash;
  scriptHash = BitcoinTestnet.prototype.scriptHash;
  wif = BitcoinTestnet.prototype.wif;
  family = BitcoinCash.prototype.family;
}

// BSV inherits a fair bit of config from Bitcoin
class BitcoinCashSatoshisVision extends Mainnet implements UtxoNetwork {
  messagePrefix = Bitcoin.prototype.messagePrefix;
  bech32 = Bitcoin.prototype.bech32;
  bip32 = {
    public: Bitcoin.prototype.bip32.public,
    private: Bitcoin.prototype.bip32.private,
  };
  pubKeyHash = Bitcoin.prototype.pubKeyHash;
  scriptHash = Bitcoin.prototype.scriptHash;
  wif = Bitcoin.prototype.wif;
  family = CoinFamily.BCH;
}

// TBSV inherits a fair bit of config from BitcoinTestnet
class BitcoinCashSatoshisVisionTestnet extends Testnet implements UtxoNetwork {
  messagePrefix = Bitcoin.prototype.messagePrefix;
  bech32 = BitcoinTestnet.prototype.bech32;
  bip32 = {
    public: BitcoinTestnet.prototype.bip32.public,
    private: BitcoinTestnet.prototype.bip32.private,
  };
  pubKeyHash = BitcoinTestnet.prototype.pubKeyHash;
  scriptHash = BitcoinTestnet.prototype.scriptHash;
  wif = BitcoinTestnet.prototype.wif;
  family = BitcoinCashSatoshisVision.prototype.family;
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

// zCash inherits a fair bit of config from Bitcoin
class zCash extends Mainnet implements UtxoNetwork {
  messagePrefix = '\x18ZCash Signed Message:\n';
  bech32 = Bitcoin.prototype.bech32;
  bip32 = {
    public: Bitcoin.prototype.bip32.public,
    private: Bitcoin.prototype.bip32.private,
  };
  pubKeyHash = 0x1cb8;
  scriptHash = 0x1cbd;
  wif = Bitcoin.prototype.wif;
  family = CoinFamily.ZEC;
}

// TZEC inherits a fair bit of config from BitcoinTestnet
class zCashTestnet extends Testnet implements UtxoNetwork {
  messagePrefix = zCash.prototype.messagePrefix;
  bech32 = BitcoinTestnet.prototype.bech32;
  bip32 = {
    public: BitcoinTestnet.prototype.bip32.public,
    private: BitcoinTestnet.prototype.bip32.private,
  };
  pubKeyHash = 0x1d25;
  scriptHash = 0x1cba;
  wif = BitcoinTestnet.prototype.wif;
  family = zCash.prototype.family;
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
    bitcoinCashSV: Object.freeze(new BitcoinCashSatoshisVision()),
    bitcoinGold: Object.freeze(new BitcoinGold()),
    litecoin: Object.freeze(new Litecoin()),
    ethereum: Object.freeze(new Ethereum()),
    ripple: Object.freeze(new Ripple()),
    stellar: Object.freeze(new Stellar()),
    zCash: Object.freeze(new zCash()),
  },
  test: {
    bitcoin: Object.freeze(new BitcoinTestnet()),
    bitcoinCash: Object.freeze(new BitcoinCashTestnet()),
    bitcoinCashSV: Object.freeze(new BitcoinCashSatoshisVisionTestnet()),
    litecoin: Object.freeze(new LitecoinTestnet()),
    kovan: Object.freeze(new Kovan()),
    ripple: Object.freeze(new RippleTestnet()),
    stellar: Object.freeze(new StellarTestnet()),
    zCash: Object.freeze(new zCashTestnet()),
  },
};
