import { CoinFamily } from './base';

export enum NetworkType {
  MAINNET = 'mainnet',
  TESTNET = 'testnet',
}

export abstract class BaseNetwork {
  public abstract readonly name: string;
  public abstract readonly type: NetworkType;
  public abstract readonly family: CoinFamily;
  public abstract readonly explorerUrl: string | undefined;
}

/*
The values for the various fork coins can be found in these files:

property       filename             varname                           notes
------------------------------------------------------------------------------------------------------------------------
messagePrefix  src/validation.cpp   strMessageMagic                   Format `${CoinName} Signed Message`
bech32_hrp     src/chainparams.cpp  bech32_hrp                        Only for some networks
bip32.public   src/chainparams.cpp  base58Prefixes[EXT_PUBLIC_KEY]    Mainnets have same value, testnets have same value
bip32.private  src/chainparams.cpp  base58Prefixes[EXT_SECRET_KEY]    Mainnets have same value, testnets have same value
pubKeyHash     src/chainparams.cpp  base58Prefixes[PUBKEY_ADDRESS]
scriptHash     src/chainparams.cpp  base58Prefixes[SCRIPT_ADDRESS]
wif            src/chainparams.cpp  base58Prefixes[SECRET_KEY]        Testnets have same value
 */
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

export interface AccountNetwork extends BaseNetwork {
  // some chains pay fees via an enterprise gas task. The account explorer url
  // is a url that can be used to look up the account for the gas tank on-chain.
  readonly accountExplorerUrl?: string;
}

export interface EthereumNetwork extends AccountNetwork {
  // unique chain id used for replay-protecting transactions
  readonly chainId: number;
  readonly batcherContractAddress?: string;
  // forwarder configuration addresses used for calculating forwarder version 1 addresses
  readonly forwarderFactoryAddress?: string;
  readonly forwarderImplementationAddress?: string;
}

export interface TronNetwork extends AccountNetwork {
  maxFeeLimit: string;
  contractCallFeeLimit: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
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
  // https://github.com/bitcoin/bitcoin/blob/master/src/validation.cpp
  // https://github.com/bitcoin/bitcoin/blob/master/src/chainparams.cpp
  messagePrefix = '\x18Bitcoin Signed Message:\n';
  bip32 = {
    // base58 'xpub'
    public: 0x0488b21e,
    // base58 'xprv'
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
  // https://github.com/bitcoin/bitcoin/blob/master/src/validation.cpp
  // https://github.com/bitcoin/bitcoin/blob/master/src/chainparams.cpp
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

class Algorand extends Mainnet implements AccountNetwork {
  name = 'Algorand';
  family = CoinFamily.ALGO;
  explorerUrl = 'https://algoexplorer.io/tx/';
}

class AlgorandTestnet extends Testnet implements AccountNetwork {
  name = 'AlgorandTestnet';
  family = CoinFamily.ALGO;
  explorerUrl = 'https://testnet.algoexplorer.io/tx/';
}

class AvalancheC extends Mainnet implements AccountNetwork {
  // https://docs.avax.network/build/tutorials/smart-contracts/deploy-a-smart-contract-on-avalanche-using-remix-and-metamask#avalanche-mainnet-settings
  name = 'AvalancheC';
  family = CoinFamily.AVAXC;
  explorerUrl = 'https://cchain.explorer.avax.network/tx/';
  accountExplorerUrl = 'https://cchain.explorer.avax.network/address/';
  chainId = 43114;
}

class AvalancheCTestnet extends Testnet implements AccountNetwork {
  // https://docs.avax.network/build/tutorials/smart-contracts/deploy-a-smart-contract-on-avalanche-using-remix-and-metamask#avalanche-mainnet-settings
  name = 'AvalancheCTestnet';
  family = CoinFamily.AVAXC;
  explorerUrl = 'https://cchain.explorer.avax-test.network/tx/';
  accountExplorerUrl = 'https://cchain.explorer.avax-test.network/address/';
  chainId = 43113;
}

class Bitcoin extends BitcoinLikeMainnet {
  name = 'Bitcoin';
  family = CoinFamily.BTC;
  explorerUrl = 'https://blockstream.info/tx/';
  bech32 = 'bc';
}

class BitcoinTestnet extends BitcoinLikeTestnet {
  name = 'BitcoinTestnet';
  family = CoinFamily.BTC;
  explorerUrl = 'https://blockstream.info/testnet/tx/';
  bech32 = 'tb';
}

// https://github.com/Bitcoin-ABC/bitcoin-abc/blob/master/src/validation.cpp
// https://github.com/Bitcoin-ABC/bitcoin-abc/blob/master/src/chainparams.cpp
class BitcoinCash extends BitcoinLikeMainnet {
  name = 'BitcoinCash';
  family = CoinFamily.BCH;
  explorerUrl = 'http://blockdozer.com/tx/';
}

class BitcoinCashTestnet extends BitcoinLikeTestnet {
  name = 'BitcoinCashTestnet';
  family = CoinFamily.BCH;
  explorerUrl = 'https://tbch.blockdozer.com/tx/';
}

class BitcoinABC extends BitcoinLikeMainnet {
  name = 'BitcoinABC';
  family = CoinFamily.BCHA;
  explorerUrl = 'https://api.blockchair.com/bitcoin-abc';
}

class BitcoinABCTestnet extends BitcoinLikeTestnet {
  name = 'BitcoinABCTestnet';
  family = CoinFamily.BCHA;
  explorerUrl = undefined;
}

// https://github.com/bitcoin-sv/bitcoin-sv/blob/master/src/validation.cpp
// https://github.com/bitcoin-sv/bitcoin-sv/blob/master/src/chainparams.cpp
class BitcoinSV extends BitcoinLikeMainnet {
  name = 'BitcoinSV';
  family = CoinFamily.BSV;
  explorerUrl = 'https://blockchair.com/bitcoin-sv/transaction/';
}

class BitcoinSVTestnet extends BitcoinLikeTestnet {
  name = 'BitcoinSVTestnet';
  family = CoinFamily.BSV;
  explorerUrl = undefined;
}

// https://github.com/BTCGPU/BTCGPU/blob/master/src/validation.cpp
// https://github.com/BTCGPU/BTCGPU/blob/master/src/chainparams.cpp
class BitcoinGold extends BitcoinLikeMainnet {
  name = 'BitcoinGold';
  messagePrefix = '\x18Bitcoin Gold Signed Message:\n';
  bech32 = 'btg';
  pubKeyHash = 0x26;
  scriptHash = 0x17;
  family = CoinFamily.BTG;
  explorerUrl = 'https://btgexplorer.com/tx/';
}

// https://github.com/dashpay/dash/blob/master/src/validation.cpp
// https://github.com/dashpay/dash/blob/master/src/chainparams.cpp
class Dash extends BitcoinLikeMainnet {
  name = 'Dash';
  messagePrefix = '\x19DarkCoin Signed Message:\n';
  pubKeyHash = 0x4c;
  scriptHash = 0x10;
  wif = 0xcc;
  family = CoinFamily.DASH;
  explorerUrl = 'https://insight.dashevo.org/insight/tx/';
}

class DashTestnet extends BitcoinLikeTestnet {
  name = 'DashTestnet';
  messagePrefix = '\x19DarkCoin Signed Message:\n';
  pubKeyHash = 0x8c;
  scriptHash = 0x13;
  family = CoinFamily.DASH;
  explorerUrl = 'https://testnet-insight.dashevo.org/insight/tx/';
}
class Celo extends Mainnet implements EthereumNetwork {
  name = 'Celo';
  family = CoinFamily.CELO;
  explorerUrl = 'https://explorer.celo.org/tx/';
  accountExplorerUrl = 'https://explorer.celo.org/address/';
  chainId = 42220;
}

class CeloTestnet extends Testnet implements EthereumNetwork {
  name = 'CeloTestnet';
  family = CoinFamily.CELO;
  explorerUrl = 'https://alfajores-blockscout.celo-testnet.org/tx/';
  accountExplorerUrl = 'https://alfajores-blockscout.celo-testnet.org/address/';
  chainId = 44787;
}

// TODO update explorerUrl STLX-1657
class Casper extends Mainnet implements AccountNetwork {
  name = 'Casper';
  family = CoinFamily.CSPR;
  explorerUrl = 'https://cspr.live/deploy/';
  accountExplorerUrl = 'https://cspr.live/account/';
}

// TODO update explorerUrl STLX-1657
class CasperTestnet extends Testnet implements AccountNetwork {
  name = 'CasperTestnet';
  family = CoinFamily.CSPR;
  explorerUrl = 'https://testnet.cspr.live/deploy/';
  accountExplorerUrl = 'https://testnet.cspr.live/account/';
}

class Ethereum extends Mainnet implements EthereumNetwork {
  name = 'Ethereum';
  family = CoinFamily.ETH;
  explorerUrl = 'https://etherscan.io/tx/';
  accountExplorerUrl = 'https://etherscan.io/address/';
  // from https://github.com/ethereumjs/ethereumjs-common/blob/a978f630858f6843176bb20b277569785914e899/src/chains/index.ts
  chainId = 1;
  batcherContractAddress = '0x92c44c271a53f5cec699549c531d595c9692f663';
  forwarderFactoryAddress = '0xffa397285ce46fb78c588a9e993286aac68c37cd';
  forwarderImplementationAddress = '0x059ffafdc6ef594230de44f824e2bd0a51ca5ded';
}

class Ethereum2 extends Mainnet implements AccountNetwork {
  name = 'Ethereum2';
  family = CoinFamily.ETH2;
  explorerUrl = 'https://beaconscan.com/tx';
  accountExplorerUrl = 'https://beaconscan.com/address';
}

class Pyrmont extends Testnet implements AccountNetwork {
  name = 'Pyrmont';
  family = CoinFamily.ETH2;
  explorerUrl = 'https://beaconscan.com/pyrmont/tx';
  accountExplorerUrl = 'https://beaconscan.com/pyrmont/address';
}

class Kovan extends Testnet implements EthereumNetwork {
  name = 'Kovan';
  family = CoinFamily.ETH;
  explorerUrl = 'https://kovan.etherscan.io/tx/';
  accountExplorerUrl = 'https://kovan.etherscan.io/address/';
  // from https://github.com/ethereumjs/ethereumjs-common/blob/a978f630858f6843176bb20b277569785914e899/src/chains/index.ts
  chainId = 42;
  batcherContractAddress = '0xc0aaf2649e7b0f3950164681eca2b1a8f654a478';
  forwarderFactoryAddress = '0xa79a485294d226075ee65410bc94ea454f3e409d';
  forwarderImplementationAddress = '0xa946e748f25a5ec6878eb1a9f2e902028174c0b3';
}

class Goerli extends Testnet implements EthereumNetwork {
  name = 'Goerli';
  family = CoinFamily.ETH;
  explorerUrl = 'https://goerli.etherscan.io/tx/';
  accountExplorerUrl = 'https://goerli.etherscan.io/address/';
  // from https://github.com/ethereumjs/ethereumjs-common/blob/a978f630858f6843176bb20b277569785914e899/src/chains/index.ts
  chainId = 5;
  batcherContractAddress = '0xc0aaf2649e7b0f3950164681eca2b1a8f654a478';
  forwarderFactoryAddress = '0xf5caa5e3e93afbc21bd19ef4f2691a37121f7917';
  forwarderImplementationAddress = '0x80d5c91e8cc21df69fc4d64f21dc2d83121c3999';
}

class EthereumClassic extends Mainnet implements EthereumNetwork {
  name = 'EthereumClassic';
  family = CoinFamily.ETC;
  explorerUrl = 'https://blockscout.com/etc/mainnet/tx/';
  accountExplorerUrl = 'https://blockscout.com/etc/mainnet/address/';
  // from  https://chainid.network/chains/
  chainId = 61;
}

class EthereumClassicTestnet extends Testnet implements EthereumNetwork {
  name = 'EthereumClassicTestnet';
  family = CoinFamily.ETC;
  explorerUrl = 'https://blockscout.com/etc/mordor/tx/';
  accountExplorerUrl = 'https://blockscout.com/etc/mordor/address/';
  // from  https://chainid.network/chains/
  chainId = 63;
}

class Eos extends Mainnet implements AccountNetwork {
  name = 'Eos';
  family = CoinFamily.EOS;
  explorerUrl = 'https://bloks.io/transaction/';
}

class EosTestnet extends Testnet implements AccountNetwork {
  name = 'EosTestnet';
  family = CoinFamily.EOS;
  explorerUrl = 'https://local.bloks.io/transaction/';
}

class Hedera extends Mainnet implements AccountNetwork {
  name = 'Hedera';
  family = CoinFamily.HBAR;
  explorerUrl = 'https://explorer.kabuto.sh/mainnet/transaction/';
}

class HederaTestnet extends Testnet implements AccountNetwork {
  name = 'HederaTestnet';
  family = CoinFamily.HBAR;
  explorerUrl = 'https://explorer.kabuto.sh/testnet/transaction/';
}

// https://github.com/litecoin-project/litecoin/blob/master/src/validation.cpp
// https://github.com/litecoin-project/litecoin/blob/master/src/chainparams.cpp
class Litecoin extends BitcoinLikeMainnet {
  name = 'Litecoin';
  messagePrefix = '\x19Litecoin Signed Message:\n';
  bech32 = 'ltc';
  pubKeyHash = 0x30;
  scriptHash = 0x32;
  wif = 0xb0;
  family = CoinFamily.LTC;
  explorerUrl = 'https://live.blockcypher.com/ltc/tx/';
}

class LitecoinTestnet extends BitcoinLikeTestnet {
  name = 'LitecoinTestnet';
  messagePrefix = '\x19Litecoin Signed Message:\n';
  bech32 = 'tltc';
  pubKeyHash = 0x6f;
  scriptHash = 0x3a;
  family = CoinFamily.LTC;
  explorerUrl = 'http://explorer.litecointools.com/tx/';
}

class Ofc extends Mainnet implements OfcNetwork {
  name = 'Ofc';
  family = CoinFamily.OFC;
  explorerUrl = undefined;
}

class OfcTestnet extends Testnet implements OfcNetwork {
  name = 'OfcTestnet';
  family = CoinFamily.OFC;
  explorerUrl = undefined;
}

class Rbtc extends Mainnet implements EthereumNetwork {
  name = 'Rbtc';
  family = CoinFamily.RBTC;
  explorerUrl = 'https://explorer.rsk.co/tx/';
  accountExplorerUrl = 'https://explorer.rsk.co/address/';
  chainId = 30;
}

class RbtcTestnet extends Testnet implements EthereumNetwork {
  name = 'RbtcTestnet';
  family = CoinFamily.RBTC;
  explorerUrl = 'https://explorer.testnet.rsk.co/tx/';
  accountExplorerUrl = 'https://explorer.testnet.rsk.co/address/';
  chainId = 31;
}

class Stellar extends Mainnet implements AccountNetwork {
  name = 'Stellar';
  family = CoinFamily.XLM;
  explorerUrl = 'https://stellar.expert/explorer/public/tx/';
}

class StellarTestnet extends Testnet implements AccountNetwork {
  name = 'StellarTestnet';
  family = CoinFamily.XLM;
  explorerUrl = 'https://stellar.expert/explorer/testnet/tx/';
}

class Stx extends Mainnet implements AccountNetwork {
  name = 'Stx';
  family = CoinFamily.STX;
  explorerUrl = 'https://explorer.stacks.co/';
}

class StxTestnet extends Testnet implements AccountNetwork {
  name = 'StxTestnet';
  family = CoinFamily.STX;
  explorerUrl = 'https://explorer.stacks.co/?chain=testnet';
}

class SUSD extends Mainnet implements AccountNetwork {
  name = 'SUSD';
  family = CoinFamily.SUSD;
  explorerUrl = undefined;
}

class SUSDTestnet extends Testnet implements AccountNetwork {
  name = 'SUSDTestnet';
  family = CoinFamily.SUSD;
  explorerUrl = undefined;
}

class Trx extends Mainnet implements TronNetwork {
  name = 'Trx';
  family = CoinFamily.TRX;
  explorerUrl = 'https://tronscan.org/#/transaction/';
  maxFeeLimit = '5000000000';
  contractCallFeeLimit = '100000000';
}

class TrxTestnet extends Testnet implements TronNetwork {
  name = 'TrxTestnet';
  family = CoinFamily.TRX;
  explorerUrl = 'https://shasta.tronscan.org/#/transaction/';
  maxFeeLimit = '5000000000';
  contractCallFeeLimit = '100000000';
}

class Xrp extends Mainnet implements AccountNetwork {
  name = 'Xrp';
  family = CoinFamily.XRP;
  explorerUrl = 'https://xrpcharts.ripple.com/#/transactions/';
}

class XrpTestnet extends Testnet implements AccountNetwork {
  name = 'XrpTestnet';
  family = CoinFamily.XRP;
  explorerUrl = 'https://test.bithomp.com/explorer/';
}

class Xtz extends Mainnet implements AccountNetwork {
  name = 'Xtz';
  family = CoinFamily.XTZ;
  explorerUrl = 'https://tezblock.io/transaction/';
  accountExplorerUrl = 'https://tezblock.io/account/';
}

class XtzTestnet extends Testnet implements AccountNetwork {
  name = 'XtzTestnet';
  family = CoinFamily.XTZ;
  explorerUrl = 'https://carthagenet.tezblock.io/transaction/';
  accountExplorerUrl = 'https://carthagenet.tezblock.io/account/';
}

// https://github.com/zcash/zcash/blob/master/src/validation.cpp
// https://github.com/zcash/zcash/blob/master/src/chainparams.cpp
class ZCash extends BitcoinLikeMainnet {
  name = 'ZCash';
  messagePrefix = '\x18ZCash Signed Message:\n';
  pubKeyHash = 0x1cb8;
  scriptHash = 0x1cbd;
  family = CoinFamily.ZEC;
  explorerUrl = 'https://zcash.blockexplorer.com/tx/';
}

class ZCashTestnet extends BitcoinLikeTestnet {
  name = 'ZCashTestnet';
  messagePrefix = '\x18ZCash Signed Message:\n';
  pubKeyHash = 0x1d25;
  scriptHash = 0x1cba;
  family = CoinFamily.ZEC;
  explorerUrl = 'https://explorer.testnet.z.cash/tx/';
}

export const Networks = {
  main: {
    algorand: Object.freeze(new Algorand()),
    avalancheC: Object.freeze(new AvalancheC()),
    bitcoin: Object.freeze(new Bitcoin()),
    bitcoinCash: Object.freeze(new BitcoinCash()),
    bitcoinABC: Object.freeze(new BitcoinABC()),
    bitcoinGold: Object.freeze(new BitcoinGold()),
    bitcoinSV: Object.freeze(new BitcoinSV()),
    casper: Object.freeze(new Casper()),
    celo: Object.freeze(new Celo()),
    dash: Object.freeze(new Dash()),
    eos: Object.freeze(new Eos()),
    ethereum: Object.freeze(new Ethereum()),
    ethereum2: Object.freeze(new Ethereum2()),
    ethereumClassic: Object.freeze(new EthereumClassic()),
    hedera: Object.freeze(new Hedera()),
    litecoin: Object.freeze(new Litecoin()),
    ofc: Object.freeze(new Ofc()),
    rbtc: Object.freeze(new Rbtc()),
    stellar: Object.freeze(new Stellar()),
    stx: Object.freeze(new Stx()),
    susd: Object.freeze(new SUSD()),
    trx: Object.freeze(new Trx()),
    xrp: Object.freeze(new Xrp()),
    xtz: Object.freeze(new Xtz()),
    zCash: Object.freeze(new ZCash()),
  },
  test: {
    algorand: Object.freeze(new AlgorandTestnet()),
    avalancheC: Object.freeze(new AvalancheCTestnet()),
    bitcoin: Object.freeze(new BitcoinTestnet()),
    bitcoinCash: Object.freeze(new BitcoinCashTestnet()),
    bitcoinABC: Object.freeze(new BitcoinABCTestnet()),
    bitcoinSV: Object.freeze(new BitcoinSVTestnet()),
    casper: Object.freeze(new CasperTestnet()),
    celo: Object.freeze(new CeloTestnet()),
    dash: Object.freeze(new DashTestnet()),
    eos: Object.freeze(new EosTestnet()),
    pyrmont: Object.freeze(new Pyrmont()),
    ethereumClassicTestnet: Object.freeze(new EthereumClassicTestnet()),
    hedera: Object.freeze(new HederaTestnet()),
    kovan: Object.freeze(new Kovan()),
    goerli: Object.freeze(new Goerli()),
    litecoin: Object.freeze(new LitecoinTestnet()),
    ofc: Object.freeze(new OfcTestnet()),
    rbtc: Object.freeze(new RbtcTestnet()),
    stellar: Object.freeze(new StellarTestnet()),
    stx: Object.freeze(new StxTestnet()),
    susd: Object.freeze(new SUSDTestnet()),
    trx: Object.freeze(new TrxTestnet()),
    xrp: Object.freeze(new XrpTestnet()),
    xtz: Object.freeze(new XtzTestnet()),
    zCash: Object.freeze(new ZCashTestnet()),
  },
};
