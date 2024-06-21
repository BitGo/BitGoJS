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

export interface UtxoNetwork extends BaseNetwork {
  // Network name as defined in @bitgo/utxo-lib networks.ts
  utxolibName: string;
}

export interface LightningNetwork extends BaseNetwork {
  // Network name as defined in @bitgo/utxo-lib networks.ts
  utxolibName: string;
}

export interface AdaNetwork extends BaseNetwork {
  // Network name as defined in @bitgo/utxo-lib networks.ts
  // maybe add network identifier / magic network number
  utxolibName: string;
  poolDeposit: number;
  stakeKeyDeposit: number;
  maxValueSize: number;
  maxTransactionSize: number;
  coinsPerUtxoWord: number;
}

export interface AvalancheNetwork extends BaseNetwork {
  readonly alias: string;
  readonly blockchainID: string;
  readonly cChainBlockchainID: string;
  readonly networkID: number;
  readonly hrp: string;
  readonly vm: string;
  readonly creationTxFee: string;
  readonly createSubnetTx: string;
  readonly createChainTx: string;
  readonly minConsumption: string;
  readonly maxConsumption: string;
  readonly maxSupply: string;
  readonly minStake: string;
  readonly minStakeDuration: string;
  readonly maxStakeDuration: string;
  readonly minDelegationStake: string;
  readonly minDelegationFee: string;
  // current valid asset id is AVAX
  readonly avaxAssetID: string;
  readonly txFee: string;
  readonly maxImportFee: string; // 0.01 AVAX
}

export interface AccountNetwork extends BaseNetwork {
  // some chains pay fees via an enterprise gas task. The account explorer url
  // is a url that can be used to look up the account for the gas tank on-chain.
  readonly accountExplorerUrl?: string;
  readonly blockExplorerUrl?: string;
}

/**
 * Specification name type of the chain. Used in setting up the registry
 */
export type PolkadotSpecNameType = 'kusama' | 'polkadot' | 'westend' | 'statemint' | 'statemine';

export interface DotNetwork extends AccountNetwork {
  // some chains pay fees via an enterprise gas task. The account explorer url
  // is a url that can be used to look up the account for the gas tank on-chain.
  readonly specName: PolkadotSpecNameType;
  readonly genesisHash: string;
  readonly specVersion: number;
  readonly chainName: string;
  readonly txVersion: number;
}

export interface EthereumNetwork extends AccountNetwork {
  // unique chain id used for replay-protecting transactions
  readonly chainId: number;
  readonly batcherContractAddress?: string;
  // forwarder configuration addresses used for calculating forwarder version 1 addresses
  readonly forwarderFactoryAddress?: string;
  readonly forwarderImplementationAddress?: string;
  readonly nativeCoinOperationHashPrefix?: string;
  readonly tokenOperationHashPrefix?: string;
}

export interface TronNetwork extends AccountNetwork {
  maxFeeLimit: string;
  contractCallFeeLimit: string;
}

export interface StacksNetwork extends AccountNetwork {
  readonly sendmanymemoContractAddress: string;
  readonly stakingContractAddress: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface OfcNetwork extends BaseNetwork {}

abstract class Mainnet extends BaseNetwork {
  type = NetworkType.MAINNET;
}

abstract class Testnet extends BaseNetwork {
  type = NetworkType.TESTNET;
}

class Algorand extends Mainnet implements AccountNetwork {
  name = 'Algorand';
  family = CoinFamily.ALGO;
  explorerUrl = 'https://allo.info/tx/';
}

class AlgorandTestnet extends Testnet implements AccountNetwork {
  name = 'AlgorandTestnet';
  family = CoinFamily.ALGO;
  explorerUrl = 'https://explorer.bitquery.io/algorand_testnet/tx/';
}

class Ada extends Mainnet implements AdaNetwork {
  name = 'AdaCardano';
  family = CoinFamily.ADA;
  utxolibName = 'cardano';
  poolDeposit = 500000000;
  stakeKeyDeposit = 2000000;
  explorerUrl = 'https://beta.explorer.cardano.org/en/transactions/';
  coinsPerUtxoWord = 34482;
  maxTransactionSize = 8000;
  maxValueSize = 4000;
}

class AdaTestnet extends Testnet implements AdaNetwork {
  name = 'AdaCardanoTestnet';
  family = CoinFamily.ADA;
  utxolibName = 'cardanoTestnet';
  explorerUrl = 'https://preprod.cexplorer.io/';
  coinsPerUtxoWord = 34482;
  maxTransactionSize = 8000;
  maxValueSize = 4000;
  poolDeposit = 500000000;
  stakeKeyDeposit = 2000000;
}

class Arbitrum extends Mainnet implements EthereumNetwork {
  name = 'Arbitrum';
  family = CoinFamily.ARBETH;
  explorerUrl = 'https://arbiscan.io/tx/';
  accountExplorerUrl = 'https://arbiscan.io/address/';
  chainId = 42161;
  nativeCoinOperationHashPrefix = '42161';
  tokenOperationHashPrefix = '42161-ERC20';
  forwarderFactoryAddress = '0x37996e762fa8b671869740c79eb33f625b3bf92a';
  forwarderImplementationAddress = '0xd5fe1c1f216b775dfd30638fa7164d41321ef79b';
  walletFactoryAddress = '0x809ee567e413543af1caebcdb247f6a67eafc8dd';
  walletImplementationAddress = '0x944fef03af368414f29dc31a72061b8d64f568d2';
}

class ArbitrumTestnet extends Testnet implements EthereumNetwork {
  name = 'ArbitrumTestnet';
  family = CoinFamily.ARBETH;
  explorerUrl = 'https://sepolia.arbiscan.io/tx/';
  accountExplorerUrl = 'https://sepolia.arbiscan.io/address/';
  chainId = 421614;
  nativeCoinOperationHashPrefix = '421614';
  tokenOperationHashPrefix = '421614-ERC20';
  forwarderFactoryAddress = '0x37996e762fa8b671869740c79eb33f625b3bf92a';
  forwarderImplementationAddress = '0xd5fe1c1f216b775dfd30638fa7164d41321ef79b';
  walletFactoryAddress = '0x809ee567e413543af1caebcdb247f6a67eafc8dd';
  walletImplementationAddress = '0x944fef03af368414f29dc31a72061b8d64f568d2';
}

class AvalancheC extends Mainnet implements AccountNetwork {
  // https://docs.avax.network/build/tutorials/smart-contracts/deploy-a-smart-contract-on-avalanche-using-remix-and-metamask#avalanche-mainnet-settings
  name = 'AvalancheC';
  family = CoinFamily.AVAXC;
  explorerUrl = 'https://subnets.avax.network/c-chain/tx/';
  accountExplorerUrl = 'https://subnets.avax.network/c-chain/address/';
  chainId = 43114;
}

class AvalancheCTestnet extends Testnet implements AccountNetwork {
  // https://docs.avax.network/build/tutorials/smart-contracts/deploy-a-smart-contract-on-avalanche-using-remix-and-metamask#avalanche-mainnet-settings
  name = 'AvalancheCTestnet';
  family = CoinFamily.AVAXC;
  explorerUrl = 'https://subnets-test.avax.network/c-chain/tx/';
  accountExplorerUrl = 'https://subnets-test.avax.network/c-chain/address/';
  chainId = 43113;
}

class AvalancheP extends Mainnet implements AvalancheNetwork {
  name = 'AvalancheP';
  family = CoinFamily.AVAXP;
  explorerUrl = 'https://subnets.avax.network/p-chain/tx/';
  accountExplorerUrl = 'https://subnets.avax.network/p-chain/address/';
  blockchainID = '11111111111111111111111111111111LpoYY';
  cChainBlockchainID = '2q9e4r6Mu3U68nU1fYjgbR6JvwrRx36CohpAX5UQxse55x1Q5';
  avaxAssetID = 'FvwEAhmxKfeiG8SnEvq42hc6whRyY3EFYAvebMqDNDGCgxN5Z';
  networkID = 1;
  hrp = 'avax';
  alias = 'P';
  vm = 'platformvm';
  txFee = '1000000'; // 1 MILLIAVAX
  maxImportFee = '10000000'; // 0.01 AVAX
  createSubnetTx = '1000000000'; // 1 AVAX
  createChainTx = '1000000000'; // 1 AVAX
  creationTxFee = '10000000'; // 1 CENTIAVAX
  minConsumption = '0.1';
  maxConsumption = '0.12';
  maxSupply = '720000000000000000'; // 720 mil tokens
  minStake = '2000000000000'; // 2000 AVAX
  minStakeDuration = '1209600'; // 2 weeks
  maxStakeDuration = '31536000'; // 1 year
  minDelegationStake = '25000000000'; // 25 AVAX
  minDelegationFee = '2';
}

class AvalanchePTestnet extends Testnet implements AvalancheNetwork {
  name = 'AvalanchePTestnet';
  family = CoinFamily.AVAXP;
  explorerUrl = 'https://subnets-test.avax.network/p-chain/tx/';
  accountExplorerUrl = 'https://subnets-test.avax.network/p-chain/address/';
  blockchainID = '11111111111111111111111111111111LpoYY';
  cChainBlockchainID = 'yH8D7ThNJkxmtkuv2jgBa4P1Rn3Qpr4pPr7QYNfcdoS6k6HWp';
  avaxAssetID = 'U8iRqJoiJm8xZHAacmvYyZVwqQx6uDNtQeP3CQ6fcgQk3JqnK';
  networkID = 5;
  alias = 'P';
  hrp = 'fuji';
  vm = 'platformvm';
  txFee = '1000000'; // 1 MILLIAVAX
  maxImportFee = '10000000'; // 0.01 AVAX
  createSubnetTx = '1000000000'; // 1 AVAX
  createChainTx = '1000000000'; // 1 AVAX
  creationTxFee = '10000000'; // 1 CENTIAVAX
  minConsumption = '0.1';
  maxConsumption = '0.12';
  maxSupply = '720000000000000000'; // 720 mil tokens
  minStake = '1000000000'; // 1 AVAX
  minStakeDuration = '86400'; // 1 day
  maxStakeDuration = '31536000'; // 1 year
  minDelegationStake = '1000000000'; // 1 AVAX
  minDelegationFee = '2';
}

class BinanceSmartChain extends Mainnet implements EthereumNetwork {
  name = 'BinanceSmartChain';
  family = CoinFamily.BSC;
  explorerUrl = 'https://www.bscscan.com/tx/';
  accountExplorerUrl = 'https://www.bscscan.com/address/';
  chainId = 56;
}

class BinanceSmartChainTestnet extends Testnet implements EthereumNetwork {
  name = 'BinanceSmartChainTestnet';
  family = CoinFamily.BSC;
  explorerUrl = 'https://testnet.bscscan.com/tx/';
  accountExplorerUrl = 'https://testnet.bscscan.com/address/';
  chainId = 97;
}

class LightningBitcoin extends Mainnet implements LightningNetwork {
  name = 'LightningBitcoin';
  family = CoinFamily.LNBTC;
  utxolibName = 'bitcoin';
  explorerUrl = 'https://mempool.space/lightning';
}

class LightningBitcoinTestnet extends Testnet implements LightningNetwork {
  name = 'TestnetLightningBitcoin';
  family = CoinFamily.LNBTC;
  utxolibName = 'bitcoin';
  explorerUrl = 'https://mempool.space/lightning';
}

class Bitcoin extends Mainnet implements UtxoNetwork {
  name = 'Bitcoin';
  family = CoinFamily.BTC;
  utxolibName = 'bitcoin';
  explorerUrl = 'https://mempool.space/tx/';
}

class BitcoinTestnet extends Testnet implements UtxoNetwork {
  name = 'BitcoinTestnet';
  family = CoinFamily.BTC;
  utxolibName = 'testnet';
  explorerUrl = 'https://mempool.space/testnet/tx/';
}

class BitcoinCash extends Mainnet implements UtxoNetwork {
  name = 'BitcoinCash';
  family = CoinFamily.BCH;
  utxolibName = 'bitcoincash';
  explorerUrl = 'https://www.blockchain.com/bch/tx/';
}

class BitcoinCashTestnet extends Testnet implements UtxoNetwork {
  name = 'BitcoinCashTestnet';
  family = CoinFamily.BCH;
  utxolibName = 'bitcoincashTestnet';
  explorerUrl = 'https://www.blockchain.com/bch-testnet/tx/';
}
class BitcoinSV extends Mainnet implements UtxoNetwork {
  name = 'BitcoinSV';
  family = CoinFamily.BSV;
  utxolibName = 'bitcoinsv';
  explorerUrl = 'https://blockchair.com/bitcoin-sv/transaction/';
}

class BitcoinSVTestnet extends Testnet implements UtxoNetwork {
  name = 'BitcoinSVTestnet';
  family = CoinFamily.BSV;
  utxolibName = 'bitcoinsvTestnet';
  explorerUrl = undefined;
}

class BitcoinGold extends Mainnet implements UtxoNetwork {
  name = 'BitcoinGold';
  family = CoinFamily.BTG;
  utxolibName = 'bitcoingold';
  explorerUrl = 'https://btgexplorer.com/tx/';
}

class BitcoinGoldTestnet extends Testnet implements UtxoNetwork {
  name = 'BitcoinGoldTestnet';
  family = CoinFamily.BTG;
  utxolibName = 'bitcoingoldTestnet';
  explorerUrl = undefined;
}

class Dash extends Mainnet implements UtxoNetwork {
  name = 'Dash';
  family = CoinFamily.DASH;
  utxolibName = 'dash';
  explorerUrl = 'https://insight.dashevo.org/insight/tx/';
}

class DashTestnet extends Testnet implements UtxoNetwork {
  name = 'DashTestnet';
  family = CoinFamily.DASH;
  utxolibName = 'dashTest';
  explorerUrl = 'https://testnet-insight.dashevo.org/insight/tx/';
}

class Dogecoin extends Mainnet implements UtxoNetwork {
  name = 'Dogecoin';
  family = CoinFamily.DOGE;
  utxolibName = 'dogecoin';
  explorerUrl = 'https://blockchair.com/dogecoin/transaction/';
}

class DogecoinTestnet extends Testnet implements UtxoNetwork {
  name = 'DogecoinTestnet';
  family = CoinFamily.DOGE;
  utxolibName = 'dogecoinTest';
  explorerUrl = 'https://blockexplorer.one/dogecoin/testnet/tx/';
}

class ECash extends Mainnet implements UtxoNetwork {
  name = 'ECash';
  family = CoinFamily.BCHA;
  utxolibName = 'ecash';
  explorerUrl = 'https://blockchair.com/ecash';
}

class ECashTestnet extends Testnet implements UtxoNetwork {
  name = 'ECashTestnet';
  family = CoinFamily.BCHA;
  utxolibName = 'ecashTest';
  explorerUrl = undefined;
}

class Polkadot extends Mainnet implements DotNetwork {
  name = 'Polkadot';
  family = CoinFamily.DOT;
  explorerUrl = 'https://polkadot.subscan.io/extrinsic/';
  specName = 'polkadot' as PolkadotSpecNameType;
  genesisHash = '0x91b171bb158e2d3848fa23a9f1c25182fb8e20313b2c1eb49219da7a70ce90c3';
  specVersion = 9140;
  chainName = 'Polkadot';
  txVersion = 9;
}

class PolkadotTestnet extends Testnet implements DotNetwork {
  name = 'Westend';
  family = CoinFamily.DOT;
  explorerUrl = 'https://westend.subscan.io/extrinsic/';
  specName = 'westend' as PolkadotSpecNameType;
  genesisHash = '0xe143f23803ac50e8f6f8e62695d1ce9e4e1d68aa36c1cd2cfd15340213f3423e';
  specVersion = 9430;
  chainName = 'Westend';
  txVersion = 22;
}

class Celo extends Mainnet implements EthereumNetwork {
  name = 'Celo';
  family = CoinFamily.CELO;
  explorerUrl = 'https://explorer.celo.org/tx/';
  accountExplorerUrl = 'https://explorer.celo.org/address/';
  chainId = 42220;
  nativeCoinOperationHashPrefix = 'CELO';
  tokenOperationHashPrefix = 'CELO-ERC20';
}

class CeloTestnet extends Testnet implements EthereumNetwork {
  name = 'CeloTestnet';
  family = CoinFamily.CELO;
  explorerUrl = 'https://alfajores-blockscout.celo-testnet.org/tx/';
  accountExplorerUrl = 'https://alfajores-blockscout.celo-testnet.org/address/';
  chainId = 44787;
  nativeCoinOperationHashPrefix = 'CELO';
  tokenOperationHashPrefix = 'CELO-ERC20';
}

// TODO update explorerUrl STLX-1657
class Casper extends Mainnet implements AccountNetwork {
  name = 'Casper';
  family = CoinFamily.CSPR;
  explorerUrl = 'https://cspr.live/deploy/';
  accountExplorerUrl = 'https://cspr.live/account/';
}

class CasperTestnet extends Testnet implements AccountNetwork {
  name = 'CasperTestnet';
  family = CoinFamily.CSPR;
  explorerUrl = 'https://integration.cspr.live/deploy/';
  accountExplorerUrl = 'https://integration.cspr.live/account/';
}

class Ethereum extends Mainnet implements EthereumNetwork {
  name = 'Ethereum';
  family = CoinFamily.ETH;
  explorerUrl = 'https://etherscan.io/tx/';
  accountExplorerUrl = 'https://etherscan.io/address/';
  blockExplorerUrl = 'https://etherscan.io/block/';
  // from https://github.com/ethereumjs/ethereumjs-common/blob/a978f630858f6843176bb20b277569785914e899/src/chains/index.ts
  chainId = 1;
  batcherContractAddress = '0x0c9b25dfe02b2c89cce86e1a0bd6c04a7aca01b6';
  forwarderFactoryAddress = '0xffa397285ce46fb78c588a9e993286aac68c37cd';
  forwarderImplementationAddress = '0x059ffafdc6ef594230de44f824e2bd0a51ca5ded';
  nativeCoinOperationHashPrefix = 'ETHER';
  tokenOperationHashPrefix = 'ERC20';
}

class Ethereum2 extends Mainnet implements AccountNetwork {
  name = 'Ethereum2';
  family = CoinFamily.ETH2;
  explorerUrl = 'https://beaconscan.com/tx';
  accountExplorerUrl = 'https://beaconscan.com/address';
}

class EthereumW extends Mainnet implements EthereumNetwork {
  name = 'Ethereum PoW';
  family = CoinFamily.ETHW;
  explorerUrl = '';
  accountExplorerUrl = '';
  chainId = 10001;
  batcherContractAddress = '';
  forwarderFactoryAddress = '';
  forwarderImplementationAddress = '';
  nativeCoinOperationHashPrefix = 'ETHER';
  tokenOperationHashPrefix = 'ERC20';
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
  nativeCoinOperationHashPrefix = 'ETHER';
  tokenOperationHashPrefix = 'ERC20';
}

class Goerli extends Testnet implements EthereumNetwork {
  name = 'Goerli';
  family = CoinFamily.ETH;
  explorerUrl = 'https://goerli.etherscan.io/tx/';
  accountExplorerUrl = 'https://goerli.etherscan.io/address/';
  blockExplorerUrl = 'https://goerli.etherscan.io/block/';
  // from https://github.com/ethereumjs/ethereumjs-common/blob/a978f630858f6843176bb20b277569785914e899/src/chains/index.ts
  chainId = 5;
  batcherContractAddress = '0xe8e847cf573fc8ed75621660a36affd18c543d7e';
  forwarderFactoryAddress = '0xf5caa5e3e93afbc21bd19ef4f2691a37121f7917';
  forwarderImplementationAddress = '0x80d5c91e8cc21df69fc4d64f21dc2d83121c3999';
  nativeCoinOperationHashPrefix = 'ETHER';
  tokenOperationHashPrefix = 'ERC20';
}

class Holesky extends Testnet implements EthereumNetwork {
  name = 'Holesky';
  family = CoinFamily.ETH;
  explorerUrl = 'https://holesky.etherscan.io/tx/';
  accountExplorerUrl = 'https://holesky.etherscan.io/address/';
  blockExplorerUrl = 'https://holesky.etherscan.io/block/';
  // https://chainlist.org/chain/17000
  chainId = 17000;
  batcherContractAddress = '0x8ae286c75a339ffabaed3a22088c52eb4f589780';
  forwarderFactoryAddress = '0x23223fd7cfc5f34b20f38ebb9a489e1ff3c084d1';
  forwarderImplementationAddress = '0xd4c24325b5ef514fbb1ecc76a9bb4dcb57a8341e';
  nativeCoinOperationHashPrefix = 'ETHER';
  tokenOperationHashPrefix = 'ERC20';
}

class EthereumClassic extends Mainnet implements EthereumNetwork {
  name = 'EthereumClassic';
  family = CoinFamily.ETC;
  explorerUrl = 'https://blockscout.com/etc/mainnet/tx/';
  accountExplorerUrl = 'https://blockscout.com/etc/mainnet/address/';
  // from  https://chainid.network/chains/
  chainId = 61;
  nativeCoinOperationHashPrefix = 'ETC';
  tokenOperationHashPrefix = 'ETC-ERC20';
}

class EthereumClassicTestnet extends Testnet implements EthereumNetwork {
  name = 'EthereumClassicTestnet';
  family = CoinFamily.ETC;
  explorerUrl = 'https://blockscout.com/etc/mordor/tx/';
  accountExplorerUrl = 'https://blockscout.com/etc/mordor/address/';
  // from  https://chainid.network/chains/
  chainId = 63;
  nativeCoinOperationHashPrefix = 'ETC';
  tokenOperationHashPrefix = 'ETC-ERC20';
}

class Eos extends Mainnet implements AccountNetwork {
  name = 'Eos';
  family = CoinFamily.EOS;
  explorerUrl = 'https://explorer.eosnetwork.com/transaction/';
}

class EosTestnet extends Testnet implements AccountNetwork {
  name = 'EosTestnet';
  family = CoinFamily.EOS;
  explorerUrl = 'https://kylin.eosx.io/tx/';
}

class Hedera extends Mainnet implements AccountNetwork {
  name = 'Hedera';
  family = CoinFamily.HBAR;
  explorerUrl = 'https://hashscan.io/mainnet/transaction/';
}

class HederaTestnet extends Testnet implements AccountNetwork {
  name = 'HederaTestnet';
  family = CoinFamily.HBAR;
  explorerUrl = 'https://testnet.dragonglass.me/hedera/search?q=';
}

class Litecoin extends Mainnet implements UtxoNetwork {
  name = 'Litecoin';
  family = CoinFamily.LTC;
  utxolibName = 'litecoin';
  explorerUrl = 'https://blockchair.com/litecoin/transaction/';
}

class LitecoinTestnet extends Testnet implements UtxoNetwork {
  name = 'LitecoinTestnet';
  family = CoinFamily.LTC;
  utxolibName = 'litecoinTest';
  explorerUrl = 'https://blockexplorer.one/litecoin/testnet/tx/';
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
  nativeCoinOperationHashPrefix = 'RSK';
  tokenOperationHashPrefix = 'RSK-ERC20';
}

class RbtcTestnet extends Testnet implements EthereumNetwork {
  name = 'RbtcTestnet';
  family = CoinFamily.RBTC;
  explorerUrl = 'https://explorer.testnet.rsk.co/tx/';
  accountExplorerUrl = 'https://explorer.testnet.rsk.co/address/';
  chainId = 31;
  nativeCoinOperationHashPrefix = 'RSK';
  tokenOperationHashPrefix = 'RSK-ERC20';
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

class Sol extends Mainnet implements AccountNetwork {
  name = 'Sol';
  family = CoinFamily.SOL;
  explorerUrl = 'https://explorer.solana.com/tx/';
}

class SolTestnet extends Testnet implements AccountNetwork {
  name = 'SolTestnet';
  family = CoinFamily.SOL;
  explorerUrl = 'https://explorer.solana.com/tx/?cluster=devnet';
}

class Sui extends Mainnet implements AccountNetwork {
  name = 'Sui';
  family = CoinFamily.SUI;
  explorerUrl = 'https://explorer.sui.io/txblock/?network=mainnet';
}

class SuiTestnet extends Testnet implements AccountNetwork {
  name = 'Testnet Sui';
  family = CoinFamily.SUI;
  explorerUrl = 'https://explorer.sui.io/txblock/?network=testnet';
}

class Atom extends Mainnet implements AccountNetwork {
  name = 'Cosmos Hub ATOM';
  family = CoinFamily.ATOM;
  explorerUrl = 'https://atomscan.com/transactions/';
}

class AtomTestnet extends Testnet implements AccountNetwork {
  name = 'Testnet Cosmos Hub ATOM';
  family = CoinFamily.ATOM;
  explorerUrl = 'https://explorer.polypore.xyz/theta-testnet-001/tx/';
}

class Osmo extends Mainnet implements AccountNetwork {
  name = 'Osmosis';
  family = CoinFamily.OSMO;
  explorerUrl = 'https://www.mintscan.io/osmosis/txs/';
}

class OsmoTestnet extends Testnet implements AccountNetwork {
  name = 'Testnet Osmosis';
  family = CoinFamily.OSMO;
  explorerUrl = 'https://testnet.osmosis.explorers.guru/transaction/';
}

class Tia extends Mainnet implements AccountNetwork {
  name = 'Celestia';
  family = CoinFamily.TIA;
  explorerUrl = 'https://www.mintscan.io/celestia/tx/';
}

class TiaTestnet extends Testnet implements AccountNetwork {
  name = 'Testnet Celestia';
  family = CoinFamily.TIA;
  explorerUrl = 'https://testnet.celestia.explorers.guru/transaction/';
}

class Hash extends Mainnet implements AccountNetwork {
  name = 'Provenance';
  family = CoinFamily.HASH;
  explorerUrl = 'https://explorer.provenance.io/tx/';
}

class HashTestnet extends Testnet implements AccountNetwork {
  name = 'Testnet Provenance';
  family = CoinFamily.HASH;
  explorerUrl = 'https://explorer.test.provenance.io/tx/';
}

class Bld extends Mainnet implements AccountNetwork {
  name = 'Agoric';
  family = CoinFamily.BLD;
  explorerUrl = 'https://bigdipper.live/agoric/transactions/';
}

class BldTestnet extends Testnet implements AccountNetwork {
  name = 'Testnet Agoric';
  family = CoinFamily.BLD;
  explorerUrl = 'https://emerynet.explorer.agoric.net/agoric/tx/';
}

class Sei extends Mainnet implements AccountNetwork {
  name = 'Sei';
  family = CoinFamily.SEI;
  //  TODO(BG-78997): Sei is still only in testnet update to mainnet url when it's live
  explorerUrl = 'https://sei.explorers.guru/transaction/';
}

class SeiTestnet extends Testnet implements AccountNetwork {
  name = 'Testnet Sei';
  family = CoinFamily.SEI;
  explorerUrl = 'https://www.seiscan.app/atlantic-2/txs/';
}

class Zeta extends Mainnet implements AccountNetwork {
  name = 'Zeta';
  family = CoinFamily.ZETA;
  explorerUrl = 'https://explorer.zetachain.com/cosmos/tx/';
}

class ZetaTestnet extends Testnet implements AccountNetwork {
  name = 'Testnet Zeta';
  family = CoinFamily.ZETA;
  explorerUrl = 'https://athens.explorer.zetachain.com/cosmos/tx/';
}

class Injective extends Mainnet implements AccountNetwork {
  name = 'Injective';
  family = CoinFamily.INJECTIVE;
  explorerUrl = 'https://explorer.injective.network/transaction/';
}

class InjectiveTestnet extends Testnet implements AccountNetwork {
  name = 'InjectiveTestnet';
  family = CoinFamily.INJECTIVE;
  explorerUrl = 'https://testnet.explorer.injective.network/transaction/';
}

class Kava extends Mainnet implements AccountNetwork {
  name = 'Kava';
  family = CoinFamily.KAVA;
  explorerUrl = 'https://www.mintscan.io/kava/transactions/';
}

class KavaTestnet extends Testnet implements AccountNetwork {
  name = 'KavaTestnet';
  family = CoinFamily.KAVA;
  explorerUrl = 'https://testnet.mintscan.io/kava-testnet/txs/';
}

class Ton extends Mainnet implements AccountNetwork {
  name = 'Ton';
  family = CoinFamily.TON;
  explorerUrl = 'https://tonscan.org/tx/';
}

class TonTestnet extends Testnet implements AccountNetwork {
  name = 'Testnet Ton';
  family = CoinFamily.TON;
  explorerUrl = 'https://testnet.tonscan.org/tx/';
}

class Coreum extends Mainnet implements AccountNetwork {
  name = 'Coreum';
  family = CoinFamily.COREUM;
  explorerUrl = 'https://explorer.coreum.com/coreum/transactions/';
}

class CoreumTestnet extends Testnet implements AccountNetwork {
  name = 'CoreumTestnet';
  family = CoinFamily.COREUM;
  explorerUrl = 'https://explorer.testnet-1.coreum.dev/coreum/transactions/';
}

class Bera extends Mainnet implements AccountNetwork {
  name = 'Berachain';
  family = CoinFamily.BERA;
  explorerUrl = undefined;
}

class BeraTestnet extends Testnet implements AccountNetwork {
  name = 'BerachainTestnet';
  family = CoinFamily.BERA;
  explorerUrl = undefined;
}

class Islm extends Mainnet implements AccountNetwork {
  name = 'Haqq';
  family = CoinFamily.ISLM;
  explorerUrl = 'https://ping.pub/haqq/tx/';
}

class IslmTestnet extends Testnet implements AccountNetwork {
  name = 'HaqqTestnet';
  family = CoinFamily.ISLM;
  explorerUrl = 'https://testnet.ping.pub/haqq/tx/';
}

class Stx extends Mainnet implements StacksNetwork {
  name = 'Stx';
  family = CoinFamily.STX;
  explorerUrl = 'https://explorer.stacks.co/txid/';
  sendmanymemoContractAddress = 'SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE';
  stakingContractAddress = 'SP000000000000000000002Q6VF78';
}

class StxTestnet extends Testnet implements StacksNetwork {
  name = 'StxTestnet';
  family = CoinFamily.STX;
  explorerUrl = 'https://explorer.stacks.co/txid/?chain=testnet&api=https://api.nakamoto.testnet.hiro.so';
  sendmanymemoContractAddress = 'ST3F1X4QGV2SM8XD96X45M6RTQXKA1PZJZZCQAB4B';
  stakingContractAddress = 'ST000000000000000000002AMW42H';
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

class FiatTestnet extends Testnet implements BaseNetwork {
  name = 'FiatTestnet';
  family = CoinFamily.FIAT;
  explorerUrl = undefined;
}

class Fiat extends Mainnet implements BaseNetwork {
  name = 'Fiat';
  family = CoinFamily.FIAT;
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
  explorerUrl = 'https://livenet.xrpl.org/transactions/';
}

class XrpTestnet extends Testnet implements AccountNetwork {
  name = 'XrpTestnet';
  family = CoinFamily.XRP;
  explorerUrl = 'https://test.bithomp.com/explorer/';
}

class Xtz extends Mainnet implements AccountNetwork {
  name = 'Xtz';
  family = CoinFamily.XTZ;
  explorerUrl = 'https://tzstats.com/';
  accountExplorerUrl = 'https://tzstats.com/';
}

class XtzTestnet extends Testnet implements AccountNetwork {
  name = 'XtzTestnet';
  family = CoinFamily.XTZ;
  explorerUrl = 'https://ghostnet.tzkt.io/';
  accountExplorerUrl = 'https://ghostnet.tzkt.io/';
}

class ZCash extends Mainnet implements UtxoNetwork {
  name = 'ZCash';
  family = CoinFamily.ZEC;
  utxolibName = 'zcash';
  explorerUrl = 'https://chain.so/tx/ZEC/';
}

class ZCashTestnet extends Testnet implements UtxoNetwork {
  name = 'ZCashTestnet';
  family = CoinFamily.ZEC;
  utxolibName = 'zcashTest';
  explorerUrl = 'https://chain.so/tx/ZECTEST/';
}

class Near extends Mainnet implements AccountNetwork {
  name = 'Near';
  family = CoinFamily.NEAR;
  explorerUrl = 'https://explorer.near.org/transactions/';
  feeReserve = '50000000000000000000000';
  storageReserve = '2000000000000000000000'; // feeReserve + storageReserve is minimum account balance for a NEAR wallet https://docs.near.org/integrator/faq#is-there-a-minimum-account-balance
}

class NearTestnet extends Testnet implements AccountNetwork {
  name = 'NearTestnet';
  family = CoinFamily.NEAR;
  explorerUrl = 'https://testnet.nearblocks.io/txns/';
  feeReserve = '50000000000000000000000';
  storageReserve = '2000000000000000000000'; // feeReserve + storageReserve is minimum account balance for a NEAR wallet https://docs.near.org/integrator/faq#is-there-a-minimum-account-balance
}

class Polygon extends Mainnet implements EthereumNetwork {
  name = 'Polygon';
  family = CoinFamily.POLYGON;
  explorerUrl = 'https://polygonscan.com/tx/';
  accountExplorerUrl = 'https://polygonscan.com/address/';
  chainId = 137;
  forwarderFactoryAddress = '0x29ef46035e9fa3d570c598d3266424ca11413b0c';
  forwarderImplementationAddress = '0x5397d0869aba0d55e96d5716d383f6e1d8695ed7';
  walletFactoryAddress = '0xa7198f48c58e91f01317e70cd24c5cce475c1555';
  walletImplementationAddress = '0xe5dcdc13b628c2df813db1080367e929c1507ca0';
  batcherContractAddress = '0x7adc9b3d7521710321bec7dd6897d337e53c2493';
  nativeCoinOperationHashPrefix = 'POLYGON';
  tokenOperationHashPrefix = 'POLYGON-ERC20';
}

class PolygonTestnet extends Testnet implements EthereumNetwork {
  name = 'PolygonTestnet';
  family = CoinFamily.POLYGON;
  explorerUrl = 'https://amoy.polygonscan.com/tx/';
  accountExplorerUrl = 'https://amoy.polygonscan.com/address/';
  chainId = 80002;
  forwarderFactoryAddress = '0x23223fd7cfc5f34b20f38ebb9a489e1ff3c084d1';
  forwarderImplementationAddress = '0xd4c24325b5ef514fbb1ecc76a9bb4dcb57a8341e';
  walletFactoryAddress = '0xe9c16033e01bf9f94bf9f99fc0fefcfb8b124992';
  walletImplementationAddress = '0xf8360c213e4f44cce03e48cb9281254de2a7a566';
  batcherContractAddress = '0xcdf01a31ea2a1d62951aac3a5743c4416f9da3fb';
  nativeCoinOperationHashPrefix = 'POLYGON';
  tokenOperationHashPrefix = 'POLYGON-ERC20';
}

class Optimism extends Mainnet implements EthereumNetwork {
  name = 'Optimism';
  family = CoinFamily.OPETH;
  explorerUrl = 'https://optimistic.etherscan.io/tx/';
  accountExplorerUrl = 'https://optimistic.etherscan.io/address/';
  chainId = 10;
  nativeCoinOperationHashPrefix = '10';
  tokenOperationHashPrefix = '10-ERC20';
  forwarderFactoryAddress = '0x37996e762fa8b671869740c79eb33f625b3bf92a';
  forwarderImplementationAddress = '0xd5fe1c1f216b775dfd30638fa7164d41321ef79b';
  walletFactoryAddress = '0x809ee567e413543af1caebcdb247f6a67eafc8dd';
  walletImplementationAddress = '0x944fef03af368414f29dc31a72061b8d64f568d2';
}

class OptimismTestnet extends Testnet implements EthereumNetwork {
  name = 'OptimismTestnet';
  family = CoinFamily.OPETH;
  explorerUrl = 'https://sepolia-optimism.etherscan.io/tx/';
  accountExplorerUrl = 'https://sepolia-optimism.etherscan.io/address/';
  chainId = 11155420;
  nativeCoinOperationHashPrefix = '11155420';
  tokenOperationHashPrefix = '11155420-ERC20';
  forwarderFactoryAddress = '0x37996e762fa8b671869740c79eb33f625b3bf92a';
  forwarderImplementationAddress = '0xd5fe1c1f216b775dfd30638fa7164d41321ef79b';
  walletFactoryAddress = '0x809ee567e413543af1caebcdb247f6a67eafc8dd';
  walletImplementationAddress = '0x944fef03af368414f29dc31a72061b8d64f568d2';
}

class ZkSync extends Mainnet implements EthereumNetwork {
  name = 'ZkSync';
  family = CoinFamily.ZKETH;
  explorerUrl = 'https://explorer.zksync.io/tx/';
  accountExplorerUrl = 'https://explorer.zksync.io/address/';
  chainId = 324;
  nativeCoinOperationHashPrefix = '324';
  tokenOperationHashPrefix = '324-ERC20';
}

class ZkSyncTestnet extends Testnet implements EthereumNetwork {
  name = 'ZkSyncTestnet';
  family = CoinFamily.ZKETH;
  explorerUrl = 'https://sepolia.explorer.zksync.io/tx/';
  accountExplorerUrl = 'https://sepolia.explorer.zksync.io/address/';
  chainId = 300;
  nativeCoinOperationHashPrefix = '300';
  tokenOperationHashPrefix = '300-ERC20';
  forwarderFactoryAddress = '0xdd498702f44c4da08eb9e08d3f015eefe5cb71fc';
  forwarderImplementationAddress = '0xbe69cae311191fb45e648ed20847f06fad2dbab4';
  walletFactoryAddress = '0x4550e1e7616d3364877fc6c9324938dab678621a';
  walletImplementationAddress = '0x92db2759d1dca129a0d9d46877f361be819184c4';
}

class BaseChainTestnet extends Testnet implements EthereumNetwork {
  name = 'BaseChainTestnet';
  family = CoinFamily.BASEETH;
  explorerUrl = 'https://sepolia.basescan.org/tx/';
  accountExplorerUrl = 'https://sepolia.basescan.org/address/';
  chainId = 84532;
  nativeCoinOperationHashPrefix = '84532';
  tokenOperationHashPrefix = '84532-ERC20';
  forwarderFactoryAddress = '0xdd498702f44c4da08eb9e08d3f015eefe5cb71fc';
  forwarderImplementationAddress = '0xbe69cae311191fb45e648ed20847f06fad2dbab4';
  walletFactoryAddress = '0x4550e1e7616d3364877fc6c9324938dab678621a';
  walletImplementationAddress = '0x92db2759d1dca129a0d9d46877f361be819184c4';
}

class BaseChain extends Mainnet implements EthereumNetwork {
  name = 'BaseChain';
  family = CoinFamily.BASEETH;
  explorerUrl = 'https://basescan.org/tx/';
  accountExplorerUrl = 'https://basescan.org/address/';
  chainId = 8453;
  nativeCoinOperationHashPrefix = '8453';
  tokenOperationHashPrefix = '8453-ERC20';
  forwarderFactoryAddress = '0xdd498702f44c4da08eb9e08d3f015eefe5cb71fc';
  forwarderImplementationAddress = '0xbe69cae311191fb45e648ed20847f06fad2dbab4';
  walletFactoryAddress = '0x4550e1e7616d3364877fc6c9324938dab678621a';
  walletImplementationAddress = '0x92db2759d1dca129a0d9d46877f361be819184c4';
}

export const Networks = {
  main: {
    ada: Object.freeze(new Ada()),
    algorand: Object.freeze(new Algorand()),
    arbitrum: Object.freeze(new Arbitrum()),
    atom: Object.freeze(new Atom()),
    avalancheC: Object.freeze(new AvalancheC()),
    avalancheP: Object.freeze(new AvalancheP()),
    basechain: Object.freeze(new BaseChain()),
    bitcoin: Object.freeze(new Bitcoin()),
    bitcoinCash: Object.freeze(new BitcoinCash()),
    bitcoinGold: Object.freeze(new BitcoinGold()),
    bitcoinSV: Object.freeze(new BitcoinSV()),
    bera: Object.freeze(new Bera()),
    bld: Object.freeze(new Bld()),
    bsc: Object.freeze(new BinanceSmartChain()),
    casper: Object.freeze(new Casper()),
    celo: Object.freeze(new Celo()),
    coreum: Object.freeze(new Coreum()),
    dash: Object.freeze(new Dash()),
    dogecoin: Object.freeze(new Dogecoin()),
    dot: Object.freeze(new Polkadot()),
    eCash: Object.freeze(new ECash()),
    eos: Object.freeze(new Eos()),
    ethereum: Object.freeze(new Ethereum()),
    ethereum2: Object.freeze(new Ethereum2()),
    ethereumClassic: Object.freeze(new EthereumClassic()),
    ethereumW: Object.freeze(new EthereumW()),
    fiat: Object.freeze(new Fiat()),
    hash: Object.freeze(new Hash()),
    hedera: Object.freeze(new Hedera()),
    injective: Object.freeze(new Injective()),
    islm: Object.freeze(new Islm()),
    kava: Object.freeze(new Kava()),
    lnbtc: Object.freeze(new LightningBitcoin()),
    litecoin: Object.freeze(new Litecoin()),
    polygon: Object.freeze(new Polygon()),
    ofc: Object.freeze(new Ofc()),
    optimism: Object.freeze(new Optimism()),
    osmo: Object.freeze(new Osmo()),
    rbtc: Object.freeze(new Rbtc()),
    stellar: Object.freeze(new Stellar()),
    sei: Object.freeze(new Sei()),
    sol: Object.freeze(new Sol()),
    sui: Object.freeze(new Sui()),
    near: Object.freeze(new Near()),
    stx: Object.freeze(new Stx()),
    susd: Object.freeze(new SUSD()),
    tia: Object.freeze(new Tia()),
    ton: Object.freeze(new Ton()),
    trx: Object.freeze(new Trx()),
    xrp: Object.freeze(new Xrp()),
    xtz: Object.freeze(new Xtz()),
    zCash: Object.freeze(new ZCash()),
    zeta: Object.freeze(new Zeta()),
    zkSync: Object.freeze(new ZkSync()),
  },
  test: {
    ada: Object.freeze(new AdaTestnet()),
    algorand: Object.freeze(new AlgorandTestnet()),
    arbitrum: Object.freeze(new ArbitrumTestnet()),
    atom: Object.freeze(new AtomTestnet()),
    avalancheC: Object.freeze(new AvalancheCTestnet()),
    avalancheP: Object.freeze(new AvalanchePTestnet()),
    basechain: Object.freeze(new BaseChainTestnet()),
    bitcoin: Object.freeze(new BitcoinTestnet()),
    bitcoinCash: Object.freeze(new BitcoinCashTestnet()),
    bitcoinGold: Object.freeze(new BitcoinGoldTestnet()),
    bitcoinSV: Object.freeze(new BitcoinSVTestnet()),
    bera: Object.freeze(new BeraTestnet()),
    bld: Object.freeze(new BldTestnet()),
    bsc: Object.freeze(new BinanceSmartChainTestnet()),
    casper: Object.freeze(new CasperTestnet()),
    celo: Object.freeze(new CeloTestnet()),
    dash: Object.freeze(new DashTestnet()),
    dogecoin: Object.freeze(new DogecoinTestnet()),
    dot: Object.freeze(new PolkadotTestnet()),
    eCash: Object.freeze(new ECashTestnet()),
    eos: Object.freeze(new EosTestnet()),
    fiat: Object.freeze(new FiatTestnet()),
    pyrmont: Object.freeze(new Pyrmont()),
    ethereumClassicTestnet: Object.freeze(new EthereumClassicTestnet()),
    hash: Object.freeze(new HashTestnet()),
    hedera: Object.freeze(new HederaTestnet()),
    injective: Object.freeze(new InjectiveTestnet()),
    islm: Object.freeze(new IslmTestnet()),
    kava: Object.freeze(new KavaTestnet()),
    kovan: Object.freeze(new Kovan()),
    goerli: Object.freeze(new Goerli()),
    holesky: Object.freeze(new Holesky()),
    lnbtc: Object.freeze(new LightningBitcoinTestnet()),
    litecoin: Object.freeze(new LitecoinTestnet()),
    polygon: Object.freeze(new PolygonTestnet()),
    ofc: Object.freeze(new OfcTestnet()),
    optimism: Object.freeze(new OptimismTestnet()),
    osmo: Object.freeze(new OsmoTestnet()),
    rbtc: Object.freeze(new RbtcTestnet()),
    stellar: Object.freeze(new StellarTestnet()),
    sei: Object.freeze(new SeiTestnet()),
    sol: Object.freeze(new SolTestnet()),
    sui: Object.freeze(new SuiTestnet()),
    near: Object.freeze(new NearTestnet()),
    stx: Object.freeze(new StxTestnet()),
    susd: Object.freeze(new SUSDTestnet()),
    coreum: Object.freeze(new CoreumTestnet()),
    tia: Object.freeze(new TiaTestnet()),
    ton: Object.freeze(new TonTestnet()),
    trx: Object.freeze(new TrxTestnet()),
    xrp: Object.freeze(new XrpTestnet()),
    xtz: Object.freeze(new XtzTestnet()),
    zCash: Object.freeze(new ZCashTestnet()),
    zeta: Object.freeze(new ZetaTestnet()),
    zkSync: Object.freeze(new ZkSyncTestnet()),
  },
};
