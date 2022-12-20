import { CoinFamily } from './base';
import { mainnetMetadataRpc, westendMetadataRpc } from '../resources/dot';

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
}

export interface AccountNetwork extends BaseNetwork {
  // some chains pay fees via an enterprise gas task. The account explorer url
  // is a url that can be used to look up the account for the gas tank on-chain.
  readonly accountExplorerUrl?: string;
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
  readonly metadataRpc: `0x${string}`;
  readonly txVersion: number;
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
  explorerUrl = 'https://algoexplorer.io/tx/';
}

class AlgorandTestnet extends Testnet implements AccountNetwork {
  name = 'AlgorandTestnet';
  family = CoinFamily.ALGO;
  explorerUrl = 'https://testnet.algoexplorer.io/tx/';
}

class Ada extends Mainnet implements AdaNetwork {
  name = 'AdaCardano';
  family = CoinFamily.ADA;
  utxolibName = 'cardano';
  poolDeposit = 500000000;
  stakeKeyDeposit = 2000000;
  explorerUrl = 'https://explorer.cardano.org/en';
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

class AvalancheP extends Mainnet implements AvalancheNetwork {
  name = 'AvalancheP';
  family = CoinFamily.AVAXP;
  explorerUrl = 'https://explorer-xp.avax.network/tx/';
  accountExplorerUrl = 'https://explorer-xp.avax.network/address/';
  blockchainID = '11111111111111111111111111111111LpoYY';
  cChainBlockchainID = '2q9e4r6Mu3U68nU1fYjgbR6JvwrRx36CohpAX5UQxse55x1Q5';
  avaxAssetID = 'FvwEAhmxKfeiG8SnEvq42hc6whRyY3EFYAvebMqDNDGCgxN5Z';
  networkID = 1;
  hrp = 'avax';
  alias = 'P';
  vm = 'platformvm';
  txFee = '1000000'; // 1 MILLIAVAX
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
  explorerUrl = 'https://explorer-xp.avax-test.network/tx/';
  accountExplorerUrl = 'https://explorer-xp.avax-test.network/address/';
  blockchainID = '11111111111111111111111111111111LpoYY';
  cChainBlockchainID = 'yH8D7ThNJkxmtkuv2jgBa4P1Rn3Qpr4pPr7QYNfcdoS6k6HWp';
  avaxAssetID = 'U8iRqJoiJm8xZHAacmvYyZVwqQx6uDNtQeP3CQ6fcgQk3JqnK';
  networkID = 5;
  alias = 'P';
  hrp = 'fuji';
  vm = 'platformvm';
  txFee = '1000000'; // 1 MILLIAVAX
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
  explorerUrl = 'https://www.bscscan.com/';
  accountExplorerUrl = 'https://www.bscscan.com/';
  chainId = 56;
}

class BinanceSmartChainTestnet extends Testnet implements EthereumNetwork {
  name = 'BinanceSmartChainTestnet';
  family = CoinFamily.BSC;
  explorerUrl = 'https://testnet.bscscan.com/';
  accountExplorerUrl = 'https://testnet.bscscan.com/';
  chainId = 97;
}

class Bitcoin extends Mainnet implements UtxoNetwork {
  name = 'Bitcoin';
  family = CoinFamily.BTC;
  utxolibName = 'bitcoin';
  explorerUrl = 'https://blockstream.info/tx/';
}

class BitcoinTestnet extends Testnet implements UtxoNetwork {
  name = 'BitcoinTestnet';
  family = CoinFamily.BTC;
  utxolibName = 'testnet';
  explorerUrl = 'https://blockstream.info/testnet/tx/';
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
  metadataRpc = mainnetMetadataRpc as `0x${string}`;
  txVersion = 9;
}

class PolkadotTestnet extends Testnet implements DotNetwork {
  name = 'Westend';
  family = CoinFamily.DOT;
  explorerUrl = 'https://westend.subscan.io/extrinsic/';
  specName = 'westend' as PolkadotSpecNameType;
  genesisHash = '0xe143f23803ac50e8f6f8e62695d1ce9e4e1d68aa36c1cd2cfd15340213f3423e';
  specVersion = 9320;
  chainName = 'Westend';
  metadataRpc = westendMetadataRpc as `0x${string}`;
  txVersion = 14;
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
  batcherContractAddress = '0x0c9b25dfe02b2c89cce86e1a0bd6c04a7aca01b6';
  forwarderFactoryAddress = '0xffa397285ce46fb78c588a9e993286aac68c37cd';
  forwarderImplementationAddress = '0x059ffafdc6ef594230de44f824e2bd0a51ca5ded';
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
  batcherContractAddress = '0xe8e847cf573fc8ed75621660a36affd18c543d7e';
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
  explorerUrl = 'https://explorer.kabuto.sh/mainnet/transaction/';
}

class HederaTestnet extends Testnet implements AccountNetwork {
  name = 'HederaTestnet';
  family = CoinFamily.HBAR;
  explorerUrl = 'https://explorer.kabuto.sh/testnet/transaction/';
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
  //  TODO(BG-58364): mysten is still only in devnet update to mainnet url when it's live
  explorerUrl = 'https://explorer.devnet.sui.io/transactions/';
}

class SuiTestnet extends Testnet implements AccountNetwork {
  name = 'Testnet Sui';
  family = CoinFamily.SUI;
  explorerUrl = 'https://explorer.devnet.sui.io/transactions/';
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
  explorerUrl = 'https://explorer.stacks.co/txid/?chain=testnet';
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
  explorerUrl = 'https://tezblock.io/transaction/';
  accountExplorerUrl = 'https://tezblock.io/account/';
}

class XtzTestnet extends Testnet implements AccountNetwork {
  name = 'XtzTestnet';
  family = CoinFamily.XTZ;
  explorerUrl = 'https://carthagenet.tezblock.io/transaction/';
  accountExplorerUrl = 'https://carthagenet.tezblock.io/account/';
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
  explorerUrl = 'https://explorer.testnet.near.org/transactions/';
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
}

class PolygonTestnet extends Testnet implements EthereumNetwork {
  name = 'PolygonTestnet';
  family = CoinFamily.POLYGON;
  explorerUrl = 'https://mumbai.polygonscan.com/tx/';
  accountExplorerUrl = 'https://mumbai.polygonscan.com/address/';
  chainId = 80001;
  forwarderFactoryAddress = '0x7d10cfdcb763375fb5f0a0e9101f490f0bf1b43a';
  forwarderImplementationAddress = '0xaa2216d72d7c149dfe4c3dd2154cd00994216506';
  walletFactoryAddress = '0xe37c07faec87be075ce4002b5fedbde00a4fe9d5';
  walletImplementationAddress = '0x11f8d70a4ee9d0962bb1160d776d4a996cfdff40';
}

export const Networks = {
  main: {
    ada: Object.freeze(new Ada()),
    algorand: Object.freeze(new Algorand()),
    avalancheC: Object.freeze(new AvalancheC()),
    avalancheP: Object.freeze(new AvalancheP()),
    bitcoin: Object.freeze(new Bitcoin()),
    bitcoinCash: Object.freeze(new BitcoinCash()),
    bitcoinGold: Object.freeze(new BitcoinGold()),
    bitcoinSV: Object.freeze(new BitcoinSV()),
    bsc: Object.freeze(new BinanceSmartChain()),
    casper: Object.freeze(new Casper()),
    celo: Object.freeze(new Celo()),
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
    hedera: Object.freeze(new Hedera()),
    litecoin: Object.freeze(new Litecoin()),
    polygon: Object.freeze(new Polygon()),
    ofc: Object.freeze(new Ofc()),
    rbtc: Object.freeze(new Rbtc()),
    stellar: Object.freeze(new Stellar()),
    sol: Object.freeze(new Sol()),
    sui: Object.freeze(new Sui()),
    near: Object.freeze(new Near()),
    stx: Object.freeze(new Stx()),
    susd: Object.freeze(new SUSD()),
    trx: Object.freeze(new Trx()),
    xrp: Object.freeze(new Xrp()),
    xtz: Object.freeze(new Xtz()),
    zCash: Object.freeze(new ZCash()),
  },
  test: {
    ada: Object.freeze(new AdaTestnet()),
    algorand: Object.freeze(new AlgorandTestnet()),
    avalancheC: Object.freeze(new AvalancheCTestnet()),
    avalancheP: Object.freeze(new AvalanchePTestnet()),
    bitcoin: Object.freeze(new BitcoinTestnet()),
    bitcoinCash: Object.freeze(new BitcoinCashTestnet()),
    bitcoinGold: Object.freeze(new BitcoinGoldTestnet()),
    bitcoinSV: Object.freeze(new BitcoinSVTestnet()),
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
    hedera: Object.freeze(new HederaTestnet()),
    kovan: Object.freeze(new Kovan()),
    goerli: Object.freeze(new Goerli()),
    litecoin: Object.freeze(new LitecoinTestnet()),
    polygon: Object.freeze(new PolygonTestnet()),
    ofc: Object.freeze(new OfcTestnet()),
    rbtc: Object.freeze(new RbtcTestnet()),
    stellar: Object.freeze(new StellarTestnet()),
    sol: Object.freeze(new SolTestnet()),
    sui: Object.freeze(new SuiTestnet()),
    near: Object.freeze(new NearTestnet()),
    stx: Object.freeze(new StxTestnet()),
    susd: Object.freeze(new SUSDTestnet()),
    trx: Object.freeze(new TrxTestnet()),
    xrp: Object.freeze(new XrpTestnet()),
    xtz: Object.freeze(new XtzTestnet()),
    zCash: Object.freeze(new ZCashTestnet()),
  },
};
