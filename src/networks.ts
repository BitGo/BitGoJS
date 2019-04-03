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

class Mainnet {
  type = NetworkType.MAINNET;
}

class Testnet {
  type = NetworkType.TESTNET;
}

export class Bitcoin extends Mainnet implements UtxoNetwork {
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
  bech32 = 'tb';
  bip32 = {
    public: 0x043587cf,
    private: 0x04358394,
  };
  pubKeyHash = 0x6f;
  scriptHash = 0xc4;
  wif = 0xef;

  // fields "inherited" from the Bitcoin mainnet
  messagePrefix = Bitcoin.prototype.messagePrefix;
  family = Bitcoin.prototype.family;
}

export const Network: {
  [index: string]: UtxoNetwork;
} = {
  bitcoin: new Bitcoin(),
  bitcoinTestnet: new BitcoinTestnet(),
};
