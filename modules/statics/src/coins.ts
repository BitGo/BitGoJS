import {
  account,
  AccountCoin,
  algoToken,
  aptNFTCollection,
  aptToken,
  arbethErc20,
  avaxErc20,
  beraErc20,
  bscToken,
  celoToken,
  coredaoErc20,
  eosToken,
  erc1155,
  erc20,
  erc20CompatibleAccountCoin,
  erc721,
  fiat,
  gasTankAccount,
  hederaCoin,
  hederaToken,
  nep141Token,
  nonstandardToken,
  opethErc20,
  polygonErc20,
  sip10Token,
  solToken,
  stellarToken,
  suiToken,
  talgoToken,
  taptNFTCollection,
  taptToken,
  tarbethErc20,
  tberaErc20,
  tceloToken,
  tcoredaoErc20,
  teosToken,
  terc1155,
  terc721,
  topethErc20,
  tronToken,
  tstellarToken,
  tsuiToken,
  ttronToken,
  txrpToken,
  tzkethErc20,
  xrpToken,
  zkethErc20,
} from './account';
import { ofcToken } from './ofc';
import { ada } from './ada';
import { avaxp } from './avaxp';
import { BaseCoin, BaseUnit, CoinFeature, KeyCurve, UnderlyingAsset } from './base';
import { AmsTokenConfig, TrimmedAmsTokenConfig } from './tokenConfig';
import { erc20Coins } from './coins/erc20Coins';
import { avaxTokens } from './coins/avaxTokens';
import { bscTokens } from './coins/bscTokens';
import { polygonTokens } from './coins/polygonTokens';
import { solTokens } from './coins/solTokens';
import { CoinMap } from './map';
import { Networks } from './networks';
import { networkFeatureMapForTokens } from './networkFeatureMapForTokens';
import { utxoCoins } from './utxo';
import { lightningCoins } from './lightning';
import { ofcErc20Coins, tOfcErc20Coins } from './coins/ofcErc20Coins';
import { ofcCoins } from './coins/ofcCoins';
import { sip10Tokens } from './coins/sip10Tokens';
import { nep141Tokens } from './coins/nep141Tokens';
import {
  ADA_FEATURES_WITH_FRANKFURT,
  ALGO_FEATURES,
  APECHAIN_FEATURES,
  APT_FEATURES,
  ARBETH_FEATURES,
  ATOM_FEATURES,
  AVAXC_FEATURES,
  BERA_BGT_FEATURES,
  BERA_FEATURES,
  CELO_FEATURES,
  COREDAO_FEATURES,
  COREUM_FEATURES,
  COSMOS_SIDECHAIN_FEATURES,
  COSMOS_SIDECHAIN_FEATURES_WITH_STAKING,
  CSPR_FEATURES,
  DOT_FEATURES,
  EOS_FEATURES,
  ETC_FEATURES,
  ETH_FEATURES,
  ETH_FEATURES_WITH_STAKING_AND_MMI,
  EVM_FEATURES,
  GENERIC_TOKEN_FEATURES,
  HBAR_FEATURES,
  ICP_FEATURES,
  INJECTIVE_FEATURES,
  NEAR_FEATURES,
  OAS_FEATURES,
  OPETH_FEATURES,
  POLYGON_FEATURES,
  POLYGON_TOKEN_FEATURES,
  POLYX_FEATURES,
  RBTC_FEATURES,
  SEI_FEATURES,
  SOL_FEATURES,
  STX_FEATURES,
  SUI_FEATURES,
  SUI_TOKEN_FEATURES,
  SUI_TOKEN_FEATURES_STAKING,
  TAO_FEATURES,
  TIA_FEATURES,
  TOKEN_FEATURES_WITH_FRANKFURT,
  TON_FEATURES,
  TRX_FEATURES,
  TSOL_FEATURES,
  VET_FEATURES,
  WCT_FEATURES,
  XLM_FEATURES,
  XLM_TOKEN_FEATURES_WITH_FRANKFURT,
  XRP_FEATURES,
  XTZ_FEATURES,
  ZETA_FEATURES,
  ZKETH_FEATURES,
} from './coinFeatures';

export const coins = CoinMap.fromCoins([
  ...lightningCoins,
  ...utxoCoins,
  ...erc20Coins,
  ...ofcErc20Coins,
  ...tOfcErc20Coins,
  ...ofcCoins,
  ...avaxTokens,
  ...bscTokens,
  ...polygonTokens,
  ...solTokens,
  ...sip10Tokens,
  ...nep141Tokens,
  avaxp(
    '5436386e-9e4d-4d82-92df-59d9720d1738',
    'avaxp',
    'Avalanche P-Chain',
    Networks.main.avalancheP,
    UnderlyingAsset.AVAXP
  ),
  avaxp(
    'ea330a11-3814-4b74-994b-e61e05b34ec3',
    'tavaxp',
    'Testnet Avalanche P-Chain',
    Networks.test.avalancheP,
    UnderlyingAsset.AVAXP
  ),
  ada(
    'fd4d125e-f14f-414b-bd17-6cb1393265f0',
    'ada',
    'Cardano ADA',
    Networks.main.ada,
    UnderlyingAsset.ADA,
    ADA_FEATURES_WITH_FRANKFURT
  ),
  ada(
    '1cbfb5aa-94ba-415b-b5c2-c51e801e21b3',
    'tada',
    'Testnet Cardano ADA',
    Networks.test.ada,
    UnderlyingAsset.ADA,
    ADA_FEATURES_WITH_FRANKFURT
  ),
  account(
    'ec41e62a-cc57-4aa0-9b9e-217da1226817',
    'algo',
    'Algorand',
    Networks.main.algorand,
    6,
    UnderlyingAsset.ALGO,
    BaseUnit.ALGO,
    ALGO_FEATURES,
    KeyCurve.Ed25519
  ),
  account(
    '9595aa8c-7add-4ede-a61b-b176cadade81',
    'talgo',
    'Testnet Algorand',
    Networks.test.algorand,
    6,
    UnderlyingAsset.ALGO,
    BaseUnit.ALGO,
    ALGO_FEATURES,
    KeyCurve.Ed25519
  ),
  account(
    'd716be0f-d8e7-4f1e-962e-e11c79ec4381',
    'avaxc',
    'Avalanche C-Chain',
    Networks.main.avalancheC,
    18,
    UnderlyingAsset.AVAXC,
    BaseUnit.ETH,
    AVAXC_FEATURES
  ),
  account(
    '91a971d1-1dc1-4953-8828-82bef859acfa',
    'tavaxc',
    'Testnet Avalanche C-Chain',
    Networks.test.avalancheC,
    18,
    UnderlyingAsset.AVAXC,
    BaseUnit.ETH,
    AVAXC_FEATURES
  ),
  account(
    'f3f0f790-fc53-40ba-a9cc-71909fc50566',
    'cspr',
    'Casper',
    Networks.main.casper,
    9,
    UnderlyingAsset.CSPR,
    BaseUnit.CSPR,
    CSPR_FEATURES
  ),
  account(
    'bd8f0b27-d13b-41c8-9f60-84fc1f201d89',
    'tcspr',
    'Testnet Casper',
    Networks.test.casper,
    9,
    UnderlyingAsset.CSPR,
    BaseUnit.CSPR,
    CSPR_FEATURES
  ),
  account(
    'aa1fc03b-c499-4240-a703-f6510517f97f',
    'dot',
    'Polkadot',
    Networks.main.dot,
    10,
    UnderlyingAsset.DOT,
    BaseUnit.DOT,
    DOT_FEATURES,
    KeyCurve.Ed25519
  ),
  account(
    '85b966bd-d1cc-4a86-a937-b1afab659e7b',
    'tdot',
    'Testnet Polkadot',
    Networks.test.dot,
    12,
    UnderlyingAsset.DOT,
    BaseUnit.DOT,
    DOT_FEATURES,
    KeyCurve.Ed25519
  ),
  account(
    '39dbafaf-02d0-42c9-95fb-f676f92dc039',
    'eth',
    'Ethereum',
    Networks.main.ethereum,
    18,
    UnderlyingAsset.ETH,
    BaseUnit.ETH,
    [
      ...ETH_FEATURES_WITH_STAKING_AND_MMI,
      CoinFeature.TSS,
      CoinFeature.TSS_COLD,
      CoinFeature.MPCV2,
      CoinFeature.MULTISIG_COLD,
      CoinFeature.EVM_WALLET,
      CoinFeature.CUSTODY_BITGO_GERMANY,
      CoinFeature.CUSTODY_BITGO_NEW_YORK,
      CoinFeature.CUSTODY_BITGO_SWITZERLAND,
      CoinFeature.CUSTODY_BITGO_FRANKFURT,
      CoinFeature.CUSTODY_BITGO_SINGAPORE,
      CoinFeature.BULK_TRANSACTION,
      CoinFeature.STUCK_TRANSACTION_MANAGEMENT_ONCHAIN,
      CoinFeature.STUCK_TRANSACTION_MANAGEMENT_TSS,
      CoinFeature.EIP1559,
      CoinFeature.ERC20_BULK_TRANSACTION,
    ]
  ), // we should probably refactor this into a eth() method
  account(
    '25f9ade1-d768-45ec-8b44-e55c2e5f472d',
    'teth',
    'Kovan Testnet Ethereum (Deprecated)',
    Networks.test.kovan,
    18,
    UnderlyingAsset.ETH,
    BaseUnit.ETH,
    [...ETH_FEATURES, CoinFeature.DEPRECATED, CoinFeature.EIP1559]
  ),
  account(
    '41b75ac4-46d6-4dac-b741-bf11406b142f',
    'gteth',
    'Goerli Testnet Ethereum',
    Networks.test.goerli,
    18,
    UnderlyingAsset.ETH,
    BaseUnit.ETH,
    [
      ...ETH_FEATURES_WITH_STAKING_AND_MMI,
      CoinFeature.TSS,
      CoinFeature.TSS_COLD,
      CoinFeature.MULTISIG_COLD,
      CoinFeature.EVM_WALLET,
      CoinFeature.CUSTODY_BITGO_GERMANY,
      CoinFeature.CUSTODY_BITGO_NEW_YORK,
      CoinFeature.CUSTODY_BITGO_SWITZERLAND,
      CoinFeature.CUSTODY_BITGO_FRANKFURT,
      CoinFeature.CUSTODY_BITGO_SINGAPORE,
      CoinFeature.EIP1559,
      CoinFeature.DEPRECATED,
    ]
  ),
  account(
    '68aec0bd-1d9a-40fa-bcef-7fa9538f65d3',
    'hteth',
    'Holesky Testnet Ethereum',
    Networks.test.holesky,
    18,
    UnderlyingAsset.ETH,
    BaseUnit.ETH,
    [
      ...ETH_FEATURES_WITH_STAKING_AND_MMI,
      CoinFeature.TSS,
      CoinFeature.TSS_COLD,
      CoinFeature.MPCV2,
      CoinFeature.MULTISIG_COLD,
      CoinFeature.EVM_WALLET,
      CoinFeature.CUSTODY_BITGO_GERMANY,
      CoinFeature.CUSTODY_BITGO_NEW_YORK,
      CoinFeature.CUSTODY_BITGO_SWITZERLAND,
      CoinFeature.CUSTODY_BITGO_FRANKFURT,
      CoinFeature.CUSTODY_BITGO_SINGAPORE,
      CoinFeature.BULK_TRANSACTION,
      CoinFeature.STUCK_TRANSACTION_MANAGEMENT_ONCHAIN,
      CoinFeature.STUCK_TRANSACTION_MANAGEMENT_TSS,
      CoinFeature.EIP1559,
      CoinFeature.ERC20_BULK_TRANSACTION,
    ]
  ),
  account(
    '33712672-8cb9-444e-be92-b8c9e84050d5',
    'ethw',
    'Ethereum PoW',
    Networks.main.ethereumW,
    18,
    UnderlyingAsset.ETHW,
    BaseUnit.ETH,
    [...AccountCoin.DEFAULT_FEATURES]
  ),
  account(
    '2660f6f6-1980-4584-a0b3-487d4a832b9f',
    'tbaseeth',
    'Base Sepolia Chain',
    Networks.test.basechain,
    18,
    UnderlyingAsset.BASEETH,
    BaseUnit.ETH,
    [...ETH_FEATURES, CoinFeature.USES_NON_PACKED_ENCODING_FOR_TXDATA, CoinFeature.EIP1559]
  ),
  account(
    'd51fe324-1e01-4630-9b04-c724fe495a1c',
    'baseeth',
    'Base Chain',
    Networks.main.basechain,
    18,
    UnderlyingAsset.BASEETH,
    BaseUnit.ETH,
    [...ETH_FEATURES, CoinFeature.USES_NON_PACKED_ENCODING_FOR_TXDATA, CoinFeature.EIP1559]
  ),
  account(
    'ffc472f5-27c6-49f8-ad9a-f57659258fb9',
    'etc',
    'Ethereum Classic',
    Networks.main.ethereumClassic,
    18,
    UnderlyingAsset.ETC,
    BaseUnit.ETH,
    ETC_FEATURES
  ),
  account(
    '49c048a1-40b3-4c85-8bbd-adf7ef9393be',
    'tetc',
    'Testnet Ethereum Classic',
    Networks.test.ethereumClassicTestnet,
    18,
    UnderlyingAsset.ETC,
    BaseUnit.ETH,
    ETC_FEATURES
  ),
  account(
    '4d1f8b5c-ae96-42b9-94b9-a310c655779e',
    'eos',
    'Eos',
    Networks.main.eos,
    4,
    UnderlyingAsset.EOS,
    BaseUnit.EOS,
    EOS_FEATURES
  ),
  account(
    '024af1f1-41d8-4df9-b8a1-df74dac5907a',
    'teos',
    'Testnet Eos',
    Networks.test.eos,
    4,
    UnderlyingAsset.EOS,
    BaseUnit.EOS,
    EOS_FEATURES
  ),
  account(
    'f465c617-752d-4f6a-b9e7-528bf38f62c3',
    'rbtc',
    'Rootstock RSK',
    Networks.main.rbtc,
    18,
    UnderlyingAsset.RBTC,
    BaseUnit.ETH,
    RBTC_FEATURES
  ),
  account(
    '626b060b-597e-499b-88dd-414f931a743e',
    'trbtc',
    'Testnet Rootstock RSK',
    Networks.test.rbtc,
    18,
    UnderlyingAsset.RBTC,
    BaseUnit.ETH,
    RBTC_FEATURES
  ),
  account(
    '9cf6d137-6c6b-4fc0-acc0-8e78a1599c15',
    'trx',
    'Tron',
    Networks.main.trx,
    6,
    UnderlyingAsset.TRX,
    BaseUnit.TRX,
    TRX_FEATURES
  ),
  account(
    '7e0c65f7-dfdc-4d22-8c31-37936a39d717',
    'ttrx',
    'Testnet Tron',
    Networks.test.trx,
    6,
    UnderlyingAsset.TRX,
    BaseUnit.TRX,
    TRX_FEATURES
  ),
  account(
    'a4578c23-8e01-4d13-bc17-7bf8b529fbef',
    'xrp',
    'Ripple',
    Networks.main.xrp,
    6,
    UnderlyingAsset.XRP,
    BaseUnit.XRP,
    XRP_FEATURES
  ),
  account(
    'cdf3b41b-176a-4b48-859b-88b7869c51e9',
    'txrp',
    'Testnet Ripple',
    Networks.test.xrp,
    6,
    UnderlyingAsset.XRP,
    BaseUnit.XRP,
    XRP_FEATURES
  ),
  account(
    '5beda85f-32fc-4c72-9051-ddcdfb3166a2',
    'xlm',
    'Stellar',
    Networks.main.stellar,
    7,
    UnderlyingAsset.XLM,
    BaseUnit.XLM,
    XLM_FEATURES,
    KeyCurve.Ed25519
  ),
  account(
    'dea5261e-dbe1-4870-b1db-5db9ed0ce63d',
    'txlm',
    'Testnet Stellar',
    Networks.test.stellar,
    7,
    UnderlyingAsset.XLM,
    BaseUnit.XLM,
    XLM_FEATURES,
    KeyCurve.Ed25519
  ),
  account(
    'a789797d-b740-43ad-a347-f19b17353651',
    'xtz',
    'Tezos',
    Networks.main.xtz,
    6,
    UnderlyingAsset.XTZ,
    BaseUnit.XTZ,
    XTZ_FEATURES
  ),
  account(
    '1792f953-c4be-4842-97b3-69efb4f0832c',
    'txtz',
    'Testnet Tezos',
    Networks.test.xtz,
    6,
    UnderlyingAsset.XTZ,
    BaseUnit.XTZ,
    XTZ_FEATURES
  ),
  account(
    '954184e5-ef74-45a5-8513-240f2baabaf6',
    'susd',
    'Silvergate USD',
    Networks.main.susd,
    2,
    UnderlyingAsset.USD,
    BaseUnit.USD
  ),
  account(
    'e424034a-22e6-4bcf-bd04-c598507afe3d',
    'tsusd',
    'Testnet Silvergate USD',
    Networks.test.susd,
    2,
    UnderlyingAsset.USD,
    BaseUnit.USD
  ),
  account(
    '4a903d2c-6487-41fc-bede-77947b80efbb',
    'stx',
    'Stacks',
    Networks.main.stx,
    6,
    UnderlyingAsset.STX,
    BaseUnit.STX,
    STX_FEATURES
  ),
  account(
    '287fc055-e1f6-4ab9-8f2c-97cad4b0f328',
    'tstx',
    'Testnet Stacks',
    Networks.test.stx,
    6,
    UnderlyingAsset.STX,
    BaseUnit.STX,
    STX_FEATURES
  ),
  account(
    '92185a03-356f-4b75-9213-af1c92fe5393',
    'sol',
    'Solana',
    Networks.main.sol,
    9,
    UnderlyingAsset.SOL,
    BaseUnit.SOL,
    SOL_FEATURES,
    KeyCurve.Ed25519
  ),
  account(
    '16445f37-624c-4343-90f2-c62429551871',
    'tsol',
    'Testnet Solana',
    Networks.test.sol,
    9,
    UnderlyingAsset.SOL,
    BaseUnit.SOL,
    TSOL_FEATURES,
    KeyCurve.Ed25519
  ),
  account(
    '8979b9a7-c2ea-4154-b4ae-4b905afe6c4a',
    'sui',
    'Sui',
    Networks.main.sui,
    9,
    UnderlyingAsset.SUI,
    BaseUnit.SUI,
    SUI_FEATURES,
    KeyCurve.Ed25519
  ),
  account(
    '2eb07d12-3a42-49d7-ae98-bf559849b334',
    'tsui',
    'Testnet Sui',
    Networks.test.sui,
    9,
    UnderlyingAsset.SUI,
    BaseUnit.SUI,
    SUI_FEATURES,
    KeyCurve.Ed25519
  ),
  account(
    'a605eecf-f1ff-4230-a856-197cd227832a',
    'atom',
    'Cosmos Hub ATOM',
    Networks.main.atom,
    6,
    UnderlyingAsset.ATOM,
    BaseUnit.ATOM,
    ATOM_FEATURES
  ),
  account(
    '9869004c-d372-42e1-bdd5-9ac8716c86cb',
    'tatom',
    'Testnet Cosmos Hub ATOM',
    Networks.test.atom,
    6,
    UnderlyingAsset.ATOM,
    BaseUnit.ATOM,
    ATOM_FEATURES
  ),
  account(
    '8352bdf2-71e7-4ff1-a5b0-9b88c61aef1d',
    'osmo',
    'Osmosis',
    Networks.main.osmo,
    6,
    UnderlyingAsset.OSMO,
    BaseUnit.OSMO,
    COSMOS_SIDECHAIN_FEATURES_WITH_STAKING
  ),
  account(
    'd813e9c9-f9b9-4d10-a4e2-57d9e3b65e2c',
    'tosmo',
    'Testnet Osmosis',
    Networks.test.osmo,
    6,
    UnderlyingAsset.OSMO,
    BaseUnit.OSMO,
    COSMOS_SIDECHAIN_FEATURES_WITH_STAKING
  ),
  account(
    '6e35c0dc-7ee8-4273-985d-254aa3641c9d',
    'tia',
    'Celestia',
    Networks.main.tia,
    6,
    UnderlyingAsset.TIA,
    BaseUnit.TIA,
    TIA_FEATURES
  ),
  account(
    '6ea4f120-6d26-4070-a12a-a0cac39ea552',
    'ttia',
    'Testnet Celestia',
    Networks.test.tia,
    6,
    UnderlyingAsset.TIA,
    BaseUnit.TIA,
    TIA_FEATURES
  ),
  account(
    '2e20e302-d743-457c-a023-58b80e8d3a15',
    'hash',
    'Provenance',
    Networks.main.hash,
    9,
    UnderlyingAsset.HASH,
    BaseUnit.HASH,
    COSMOS_SIDECHAIN_FEATURES_WITH_STAKING
  ),
  account(
    'feadf3d5-5a9a-427e-8144-7a5085b4d258',
    'thash',
    'Testnet Provenance',
    Networks.test.hash,
    9,
    UnderlyingAsset.HASH,
    BaseUnit.HASH,
    COSMOS_SIDECHAIN_FEATURES_WITH_STAKING
  ),
  account(
    '36700514-fa3c-42d8-9503-98cdcab0b3c3',
    'bld',
    'Agoric',
    Networks.main.bld,
    6,
    UnderlyingAsset.BLD,
    BaseUnit.BLD,
    COSMOS_SIDECHAIN_FEATURES_WITH_STAKING
  ),
  account(
    'e093184f-4134-455f-b870-da0bac213f00',
    'tbld',
    'Testnet Agoric',
    Networks.test.bld,
    6,
    UnderlyingAsset.BLD,
    BaseUnit.BLD,
    COSMOS_SIDECHAIN_FEATURES_WITH_STAKING
  ),
  account(
    '4777265e-37f4-44d8-bccd-13e56189fcae',
    'sei',
    'Sei',
    Networks.main.sei,
    6,
    UnderlyingAsset.SEI,
    BaseUnit.SEI,
    SEI_FEATURES
  ),
  account(
    '5be8a3f3-5c71-41ff-8d87-1ade63ce2543',
    'tsei',
    'Testnet Sei',
    Networks.test.sei,
    6,
    UnderlyingAsset.SEI,
    BaseUnit.SEI,
    SEI_FEATURES
  ),
  account(
    '9fbfb875-fb80-4a37-b844-48b9e48dfcdd',
    'zeta',
    'Zeta',
    Networks.main.zeta,
    18,
    UnderlyingAsset.ZETA,
    BaseUnit.ZETA,
    [...ZETA_FEATURES, CoinFeature.CUSTODY_BITGO_FRANKFURT]
  ),
  account(
    '1aeb7754-1518-4aac-8cc0-e4bb07713a31',
    'tzeta',
    'Testnet Zeta',
    Networks.test.zeta,
    18,
    UnderlyingAsset.ZETA,
    BaseUnit.ZETA,
    [...ZETA_FEATURES, CoinFeature.CUSTODY_BITGO_FRANKFURT]
  ),
  account(
    '5f9506c5-f10a-43c2-92d3-52941083bbc7',
    'injective',
    'Injective',
    Networks.main.injective,
    18,
    UnderlyingAsset.INJECTIVE,
    BaseUnit.INJECTIVE,
    INJECTIVE_FEATURES
  ),
  account(
    '6ae81d6a-011c-499c-a3c8-15ac7dcac48a',
    'tinjective',
    'Testnet Injective',
    Networks.test.injective,
    18,
    UnderlyingAsset.INJECTIVE,
    BaseUnit.INJECTIVE,
    INJECTIVE_FEATURES
  ),
  account(
    'c592d110-cf6d-4630-b6e8-cfe044db0be2',
    'kava',
    'Kava',
    Networks.main.kava,
    6,
    UnderlyingAsset.KAVA,
    BaseUnit.KAVA,
    COSMOS_SIDECHAIN_FEATURES
  ),
  account(
    '62895d6b-6e99-4eba-82f1-9ce4e7658998',
    'tkava',
    'Testnet Kava',
    Networks.test.kava,
    6,
    UnderlyingAsset.KAVA,
    BaseUnit.KAVA,
    COSMOS_SIDECHAIN_FEATURES
  ),
  account(
    '7df858d5-9da3-4071-ab06-399962ea87b7',
    'coreum',
    'Coreum',
    Networks.main.coreum,
    6,
    UnderlyingAsset.COREUM,
    BaseUnit.COREUM,
    COREUM_FEATURES
  ),
  account(
    'df2f040b-89f3-4bb3-8da7-2445c7fdefca',
    'tcoreum',
    'Testnet Coreum',
    Networks.test.coreum,
    6,
    UnderlyingAsset.COREUM,
    BaseUnit.TCOREUM,
    COREUM_FEATURES
  ),
  account(
    '9fa0f191-4eed-4030-864a-d14bbd98c8af',
    'thorchain:rune',
    'Rune',
    Networks.main.rune,
    8,
    UnderlyingAsset.RUNE,
    BaseUnit.RUNE,
    COSMOS_SIDECHAIN_FEATURES
  ),
  account(
    '7281ab3b-0451-4ef9-b367-8623d9bcfd87',
    'tthorchain:rune',
    'Testnet Rune',
    Networks.test.rune,
    8,
    UnderlyingAsset.RUNE,
    BaseUnit.RUNE,
    COSMOS_SIDECHAIN_FEATURES
  ),
  account(
    '12194de6-b68f-4dfb-b74c-b18b1fbb29d6',
    'baby',
    'Babylon',
    Networks.main.baby,
    6,
    UnderlyingAsset.BABY,
    BaseUnit.BABY,
    COSMOS_SIDECHAIN_FEATURES_WITH_STAKING
  ),
  account(
    'ee22282b-c307-4861-b706-d9a178326ad5',
    'tbaby',
    'Testnet Babylon',
    Networks.test.baby,
    6,
    UnderlyingAsset.BABY,
    BaseUnit.BABY,
    COSMOS_SIDECHAIN_FEATURES_WITH_STAKING
  ),
  account(
    '08ff6b77-4cfb-4dcd-9182-dd1cc6f92f70',
    'mantra',
    'Mantra',
    Networks.main.mantra,
    6,
    UnderlyingAsset.MANTRA,
    BaseUnit.MANTRA,
    COSMOS_SIDECHAIN_FEATURES
  ),
  account(
    'cc900f12-f229-4eb3-9ca7-2a05a445f362',
    'tmantra',
    'Testnet Mantra',
    Networks.test.mantra,
    6,
    UnderlyingAsset.MANTRA,
    BaseUnit.MANTRA,
    COSMOS_SIDECHAIN_FEATURES
  ),
  account(
    '507492ba-d127-4fd8-b07d-9461f5887a26',
    'cronos',
    'Cronos POS',
    Networks.main.cronos,
    8,
    UnderlyingAsset.CRONOS,
    BaseUnit.CRONOS,
    COSMOS_SIDECHAIN_FEATURES
  ),
  account(
    '49d56512-bddb-41aa-ac7f-f4a4c494b412',
    'tcronos',
    'Testnet Cronos POS',
    Networks.test.cronos,
    8,
    UnderlyingAsset.CRONOS,
    BaseUnit.CRONOS,
    COSMOS_SIDECHAIN_FEATURES
  ),
  account(
    '854513b2-cf1a-44b4-879b-e3aae0b5f227',
    'fetchai',
    'Fetch',
    Networks.main.fetchai,
    18,
    UnderlyingAsset.FETCHAI,
    BaseUnit.FETCHAI,
    COSMOS_SIDECHAIN_FEATURES
  ),
  account(
    'e285caf3-e9b8-407a-aa72-ee4094d1cf9f',
    'tfetchai',
    'Testnet Fetch',
    Networks.test.fetchai,
    18,
    UnderlyingAsset.FETCHAI,
    BaseUnit.FETCHAI,
    COSMOS_SIDECHAIN_FEATURES
  ),
  account(
    '2ec91758-fd84-44d5-92d3-7158903de278',
    'initia',
    'Initia',
    Networks.main.initia,
    6,
    UnderlyingAsset.INITIA,
    BaseUnit.INITIA,
    COSMOS_SIDECHAIN_FEATURES
  ),
  account(
    '2d10a918-01f4-40a5-b1db-a5e5247d21d7',
    'tinitia',
    'Testnet Initia',
    Networks.test.initia,
    6,
    UnderlyingAsset.INITIA,
    BaseUnit.INITIA,
    COSMOS_SIDECHAIN_FEATURES
  ),
  account(
    '2999b6e6-c30e-4089-a67a-2012df2adfa0',
    'asi',
    'Fetch Native',
    Networks.main.asi,
    18,
    UnderlyingAsset.ASI,
    BaseUnit.ASI,
    COSMOS_SIDECHAIN_FEATURES
  ),
  account(
    '1b7dfc3e-3431-48ca-883a-e9e8e32b17f2',
    'tasi',
    'Testnet Fetch Native',
    Networks.test.asi,
    18,
    UnderlyingAsset.ASI,
    BaseUnit.ASI,
    COSMOS_SIDECHAIN_FEATURES
  ),
  account(
    'b473d5f0-1590-4edf-bc9f-813aff515a23',
    'islm',
    'Islamic Coin',
    Networks.main.islm,
    18,
    UnderlyingAsset.ISLM,
    BaseUnit.ISLM,
    COSMOS_SIDECHAIN_FEATURES.filter((f) => f !== CoinFeature.SHA256_WITH_ECDSA_TSS)
  ),
  account(
    '02eced2c-cf1d-4660-832c-858685ae7107',
    'tislm',
    'Testnet Islamic Coin',
    Networks.test.islm,
    18,
    UnderlyingAsset.ISLM,
    BaseUnit.ISLM,
    COSMOS_SIDECHAIN_FEATURES.filter((f) => f !== CoinFeature.SHA256_WITH_ECDSA_TSS)
  ),
  account(
    'e48baabf-5cc9-4011-b67e-6f6425753df2',
    'near',
    'Near',
    Networks.main.near,
    24,
    UnderlyingAsset.NEAR,
    BaseUnit.NEAR,
    NEAR_FEATURES,
    KeyCurve.Ed25519
  ),
  account(
    '5f076cd2-fbb6-4ef6-9aa6-adc0d8851b4b',
    'tnear',
    'Testnet Near',
    Networks.test.near,
    24,
    UnderlyingAsset.NEAR,
    BaseUnit.NEAR,
    NEAR_FEATURES,
    KeyCurve.Ed25519
  ),
  account(
    'd0d44124-c7e9-4214-96ae-fbc6856ee3c2',
    'bsc',
    'Binance Smart Chain',
    Networks.main.bsc,
    18,
    UnderlyingAsset.BSC,
    BaseUnit.BSC,
    [
      ...ETH_FEATURES_WITH_STAKING_AND_MMI,
      CoinFeature.TSS,
      CoinFeature.TSS_COLD,
      CoinFeature.EVM_WALLET,
      CoinFeature.MPCV2,
      CoinFeature.USES_NON_PACKED_ENCODING_FOR_TXDATA,
      CoinFeature.STUCK_TRANSACTION_MANAGEMENT_TSS,
      CoinFeature.CUSTODY_BITGO_FRANKFURT,
      CoinFeature.BULK_TRANSACTION,
    ]
  ),
  account(
    '0a205427-f7c9-48a4-a238-c4b33ba6384d',
    'tbsc',
    'Testnet Binance Smart Chain',
    Networks.test.bsc,
    18,
    UnderlyingAsset.BSC,
    BaseUnit.BSC,
    [
      ...ETH_FEATURES_WITH_STAKING_AND_MMI,
      CoinFeature.TSS,
      CoinFeature.TSS_COLD,
      CoinFeature.EVM_WALLET,
      CoinFeature.MPCV2,
      CoinFeature.USES_NON_PACKED_ENCODING_FOR_TXDATA,
      CoinFeature.STUCK_TRANSACTION_MANAGEMENT_TSS,
      CoinFeature.CUSTODY_BITGO_FRANKFURT,
      CoinFeature.BULK_TRANSACTION,
    ]
  ),
  account(
    'f0e226b6-6cd8-4384-b0a5-ba8e4148a049',
    'polygon',
    'Polygon',
    Networks.main.polygon,
    18,
    UnderlyingAsset.POLYGON,
    BaseUnit.ETH,
    [...POLYGON_FEATURES, CoinFeature.EIP1559]
  ),
  account(
    'aa7b72d1-9197-492d-b2ca-2c9c9732115d',
    'tpolygon',
    'Testnet Polygon',
    Networks.test.polygon,
    18,
    UnderlyingAsset.POLYGON,
    BaseUnit.ETH,
    [...POLYGON_FEATURES, CoinFeature.EIP1559]
  ),
  account(
    'b5ba2fc6-706b-433f-9bcf-4ea4aaa09281',
    'ton',
    'Ton',
    Networks.main.ton,
    9,
    UnderlyingAsset.TON,
    BaseUnit.TON,
    TON_FEATURES,
    KeyCurve.Ed25519
  ),
  account(
    '8244f85f-943c-4520-8e68-9e7f4361a13f',
    'tton',
    'Testnet Ton',
    Networks.test.ton,
    9,
    UnderlyingAsset.TON,
    BaseUnit.TON,
    TON_FEATURES,
    KeyCurve.Ed25519
  ),
  account(
    '020b57ce-bff0-4e25-95ce-0f3a94086db4',
    'arbeth',
    'Arbitrum Ethereum (L2 Chain)',
    Networks.main.arbitrum,
    18,
    UnderlyingAsset.ARBETH,
    BaseUnit.ETH,
    ARBETH_FEATURES
  ),
  account(
    '1c51d919-9a1a-48b6-ac6d-ec3c593af949',
    'tarbeth',
    'Testnet Arbitrum Ethereum (L2 Chain)',
    Networks.test.arbitrum,
    18,
    UnderlyingAsset.ARBETH,
    BaseUnit.ETH,
    ARBETH_FEATURES
  ),
  account(
    '1d1cd251-88e1-4d0a-81a9-3e080de8757b',
    'opeth',
    'Optimism Ethereum (L2 Chain)',
    Networks.main.optimism,
    18,
    UnderlyingAsset.OPETH,
    BaseUnit.ETH,
    OPETH_FEATURES
  ),
  account(
    'efe943c4-1144-44d2-ae34-acdbe469cfcd',
    'topeth',
    'Testnet Optimism Ethereum (L2 Chain)',
    Networks.test.optimism,
    18,
    UnderlyingAsset.OPETH,
    BaseUnit.ETH,
    OPETH_FEATURES
  ),
  account(
    '53b1e350-f907-45ec-abf7-11d132547055',
    'zketh',
    'zkSync Ethereum',
    Networks.main.zkSync,
    18,
    UnderlyingAsset.ZKETH,
    BaseUnit.ETH,
    ZKETH_FEATURES
  ),
  account(
    'e34d835d-5730-4b66-96f1-cace79e2bc88',
    'tzketh',
    'Testnet zkSync Ethereum',
    Networks.test.zkSync,
    18,
    UnderlyingAsset.ZKETH,
    BaseUnit.ETH,
    ZKETH_FEATURES
  ),
  account(
    'ac3c225e-55a9-4236-b907-a4cccc30a2fd',
    'bera',
    'Bera',
    Networks.main.bera,
    18,
    UnderlyingAsset.BERA,
    BaseUnit.ETH,
    BERA_FEATURES
  ),
  account(
    '038522b7-9ebf-492f-9e51-81756f8a354a',
    'tbera',
    'Testnet Berachain',
    Networks.test.bera,
    18,
    UnderlyingAsset.BERA,
    BaseUnit.ETH,
    BERA_FEATURES
  ),
  account(
    '7482e3f1-5bf8-45a6-9d98-69e0506602d2',
    'oas',
    'Oasys',
    Networks.main.oas,
    18,
    UnderlyingAsset.OAS,
    BaseUnit.ETH,
    OAS_FEATURES
  ),
  account(
    'b5316b57-8aa3-4f0b-9736-96b7838dbde8',
    'toas',
    'Testnet Oasys',
    Networks.test.oas,
    18,
    UnderlyingAsset.OAS,
    BaseUnit.ETH,
    OAS_FEATURES
  ),
  account(
    'bac24d8c-0f8f-4530-a63c-bc52458acf95',
    'coredao',
    'Core',
    Networks.main.coredao,
    18,
    UnderlyingAsset.COREDAO,
    BaseUnit.ETH,
    COREDAO_FEATURES
  ),
  account(
    'd1d5e492-be8c-4b60-b2ab-3ed26b7dd8c8',
    'tcoredao',
    'Testnet Core',
    Networks.test.coredao,
    18,
    UnderlyingAsset.COREDAO,
    BaseUnit.ETH,
    COREDAO_FEATURES
  ),
  account(
    'd308ba34-557a-43f2-84f3-5775f1f1a779',
    'apechain',
    'Ape Chain',
    Networks.main.apechain,
    18,
    UnderlyingAsset.APECHAIN,
    BaseUnit.ETH,
    APECHAIN_FEATURES
  ),
  account(
    'b3610694-f960-4ef4-a714-c3cb9e02f4b6',
    'tapechain',
    'Testnet Ape Chain',
    Networks.test.apechain,
    18,
    UnderlyingAsset.APECHAIN,
    BaseUnit.ETH,
    APECHAIN_FEATURES
  ),
  account(
    '0cdd9089-9ca6-41ea-ab2b-20211da4ac06',
    'xdc',
    'XDC',
    Networks.main.xdc,
    18,
    UnderlyingAsset.XDC,
    BaseUnit.ETH,
    EVM_FEATURES.filter((feature) => feature !== CoinFeature.EIP1559)
  ),
  account(
    'e6ecb22e-0ae8-463a-b2fb-61502fd54240',
    'txdc',
    'Testnet XDC',
    Networks.test.xdc,
    18,
    UnderlyingAsset.XDC,
    BaseUnit.ETH,
    EVM_FEATURES.filter((feature) => feature !== CoinFeature.EIP1559)
  ),
  account(
    '297edf01-b166-45fb-be6f-da6680635f72',
    'wemix',
    'Wemix',
    Networks.main.wemix,
    18,
    UnderlyingAsset.WEMIX,
    BaseUnit.ETH,
    EVM_FEATURES
  ),
  account(
    'b18517e3-2fba-44df-be39-7ba062d14895',
    'twemix',
    'Testnet wemix',
    Networks.test.wemix,
    18,
    UnderlyingAsset.WEMIX,
    BaseUnit.ETH,
    EVM_FEATURES
  ),
  account(
    'c315bdbb-4e77-4eeb-a625-92f4defc3e42',
    'mon',
    'Monad',
    Networks.main.mon,
    18,
    UnderlyingAsset.MON,
    BaseUnit.ETH,
    [...EVM_FEATURES, CoinFeature.SHARED_EVM_SIGNING]
  ),
  account(
    '5c5ebe50-fa27-4312-ae3d-7032520aedb5',
    'tmon',
    'Testnet Monad',
    Networks.test.mon,
    18,
    UnderlyingAsset.MON,
    BaseUnit.ETH,
    [...EVM_FEATURES, CoinFeature.SHARED_EVM_SIGNING]
  ),
  account(
    'd4f8e4f5-7060-44e3-aca1-e3ac11597ecb',
    'world',
    'Worldchain',
    Networks.main.world,
    18,
    UnderlyingAsset.WORLD,
    BaseUnit.ETH,
    [...EVM_FEATURES, CoinFeature.SHARED_EVM_SIGNING]
  ),
  account(
    '1cd29730-f70b-4c7d-a19c-eb3345f01acb',
    'tworld',
    'Worldchain Testnet',
    Networks.test.world,
    18,
    UnderlyingAsset.WORLD,
    BaseUnit.ETH,
    [...EVM_FEATURES, CoinFeature.SHARED_EVM_SIGNING]
  ),
  account(
    '251b78df-90c5-4ff5-b07a-8cc23f27c5ff',
    'soneium',
    'Soneium',
    Networks.main.soneium,
    18,
    UnderlyingAsset.SONEIUM,
    BaseUnit.ETH,
    [...EVM_FEATURES, CoinFeature.SHARED_EVM_SIGNING]
  ),
  account(
    'a4587ed1-a4a6-4bbe-b965-3119b52e76cf',
    'tsoneium',
    'Soneium Testnet',
    Networks.test.soneium,
    18,
    UnderlyingAsset.SONEIUM,
    BaseUnit.ETH,
    [...EVM_FEATURES, CoinFeature.SHARED_EVM_SIGNING]
  ),
  account(
    '87c104ca-6b49-479e-87fb-9253b095158c',
    'stt',
    'Somnia',
    Networks.main.stt,
    18,
    UnderlyingAsset.STT,
    BaseUnit.ETH,
    [...EVM_FEATURES, CoinFeature.SHARED_EVM_SIGNING]
  ),
  account(
    '1bf486a9-47ed-4bea-8e9a-a23a074cdc9a',
    'tstt',
    'Somnia Testnet',
    Networks.test.stt,
    18,
    UnderlyingAsset.STT,
    BaseUnit.ETH,
    [...EVM_FEATURES, CoinFeature.SHARED_EVM_SIGNING]
  ),
  account(
    '202caf8f-4d43-4208-b206-8231f555c518',
    'flr',
    'Flare',
    Networks.main.flr,
    18,
    UnderlyingAsset.FLR,
    BaseUnit.ETH,
    EVM_FEATURES
  ),
  account(
    '338fc340-08be-4796-9c04-96e5a5078393',
    'tflr',
    'Testnet flare',
    Networks.test.flr,
    18,
    UnderlyingAsset.FLR,
    BaseUnit.ETH,
    [...EVM_FEATURES, CoinFeature.SHARED_EVM_SIGNING]
  ),
  account(
    '321a3168-4669-4ed0-a767-8f35111bb576',
    'sgb',
    'Songbird',
    Networks.main.sgb,
    18,
    UnderlyingAsset.SGB,
    BaseUnit.ETH,
    EVM_FEATURES
  ),
  account(
    'c6b8f90b-1f89-4d26-b296-4097927f6b30',
    'tsgb',
    'Testnet songbird',
    Networks.test.sgb,
    18,
    UnderlyingAsset.SGB,
    BaseUnit.ETH,
    [...EVM_FEATURES, CoinFeature.SHARED_EVM_SIGNING]
  ),
  gasTankAccount(
    '75a71e9c-e3a0-4852-8e4b-9613ffed2a4c',
    'apt',
    'Aptos',
    Networks.main.apt,
    8,
    UnderlyingAsset.APT,
    BaseUnit.APT,
    APT_FEATURES,
    KeyCurve.Ed25519,
    80,
    200
  ),
  gasTankAccount(
    '7aca10bf-79dd-428b-aeb6-54f03f9aec0f',
    'tapt',
    'Testnet Aptos',
    Networks.test.apt,
    8,
    UnderlyingAsset.APT,
    BaseUnit.APT,
    APT_FEATURES,
    KeyCurve.Ed25519,
    80,
    200
  ),
  account(
    'a08453f0-a3be-4875-b82b-6b0c9bfa53e6',
    'tao',
    'Bittensor',
    Networks.main.tao,
    9,
    UnderlyingAsset.TAO,
    BaseUnit.TAO,
    TAO_FEATURES,
    KeyCurve.Ed25519
  ),
  account(
    '0f7a1a5b-7f34-4593-80bc-2fb4ea15ebfc',
    'ttao',
    'Testnet Bittensor',
    Networks.test.tao,
    9,
    UnderlyingAsset.TAO,
    BaseUnit.TAO,
    TAO_FEATURES,
    KeyCurve.Ed25519
  ),
  account(
    '35254b6a-5370-4e22-844b-be504b510103',
    'icp',
    'Internet Computer',
    Networks.main.icp,
    8,
    UnderlyingAsset.ICP,
    BaseUnit.ICP,
    ICP_FEATURES,
    KeyCurve.Secp256k1
  ),
  account(
    'ce572773-26c2-4038-a96d-26649a9a96df',
    'ticp',
    'Testnet Internet Computer',
    Networks.test.icp,
    8,
    UnderlyingAsset.ICP,
    BaseUnit.ICP,
    ICP_FEATURES,
    KeyCurve.Secp256k1
  ),
  account(
    'd348f38d-bff6-4936-842a-c9721e5027c1',
    'polyx',
    'Polymesh',
    Networks.main.polyx,
    6,
    UnderlyingAsset.POLYX,
    BaseUnit.POLYX,
    POLYX_FEATURES,
    KeyCurve.Ed25519
  ),
  account(
    '74af0095-b6bd-427a-a7ca-d0e5888f6417',
    'tpolyx',
    'Testnet Polymesh',
    Networks.test.polyx,
    6,
    UnderlyingAsset.POLYX,
    BaseUnit.POLYX,
    [...POLYX_FEATURES, CoinFeature.STAKING],
    KeyCurve.Ed25519
  ),
  account(
    '98071460-1488-4edd-857f-0899bc5eee4f',
    'vet',
    'Mainnet VET',
    Networks.main.vet,
    18, // 1 VET = 10^18 wei
    UnderlyingAsset.VET,
    BaseUnit.ETH, // The smallest unit of VET, similar to Ethereum, is called 'wei'.
    VET_FEATURES,
    KeyCurve.Secp256k1
  ),
  account(
    'b3158e80-f6ea-4922-98ab-d773a680ce76',
    'tvet',
    'Testnet VET',
    Networks.test.vet,
    18,
    UnderlyingAsset.VET,
    BaseUnit.ETH,
    VET_FEATURES,
    KeyCurve.Secp256k1
  ),
  erc20CompatibleAccountCoin(
    'bfae821b-cf3a-4190-b1a8-a54af51d730e',
    'celo',
    'Celo Gold',
    Networks.main.celo,
    18,
    '0x471ece3750da237f93b8e339c536989b8978a438',
    UnderlyingAsset.CELO,
    BaseUnit.ETH,
    CELO_FEATURES
  ),
  erc20CompatibleAccountCoin(
    'dd0fc389-1292-4845-b9c8-f560514593e4',
    'tcelo',
    'Testnet Celo Gold',
    Networks.test.celo,
    18,
    '0xf194afdf50b03e69bd7d057c1aa9e10c9954e4c9',
    UnderlyingAsset.CELO,
    BaseUnit.ETH,
    CELO_FEATURES
  ),
  hederaCoin(
    '98aad956-27ee-45dd-aa43-6a23c9a1d1d0',
    'hbar',
    'Mainnet Hedera HBAR',
    Networks.main.hedera,
    8,
    UnderlyingAsset.HBAR,
    HBAR_FEATURES
  ),
  hederaCoin(
    '0d251e8d-5c95-49d2-a505-db66ff5440ba',
    'thbar',
    'Testnet Hedera HBAR',
    Networks.test.hedera,
    8,
    UnderlyingAsset.HBAR,
    HBAR_FEATURES
  ),
  hederaToken(
    'ca62d9eb-be67-4d63-b3b6-319d7182f691',
    'hbar:usdc',
    'Mainnet Hedera USD Coin',
    Networks.main.hedera,
    6,
    UnderlyingAsset.USDC,
    '0.0.456858',
    AccountCoin.DEFAULT_FEATURES
  ),

  hederaToken(
    '221fb1c9-0fb0-4b06-8dd1-ed857a804d58',
    'hbar:xsgd',
    'XSGD',
    Networks.main.hedera,
    6,
    UnderlyingAsset.XSGD,
    '0.0.1985922',
    AccountCoin.DEFAULT_FEATURES
  ),
  hederaToken(
    '2ea6a6d8-7d14-4bbf-a869-a99ba61bebda',
    'hbar:bct',
    'Mainnet Hedera Bitcarbon Beta Coin',
    Networks.main.hedera,
    2,
    UnderlyingAsset.BCT,
    '0.0.1958126',
    AccountCoin.DEFAULT_FEATURES
  ),
  hederaToken(
    '44beb5f1-7581-4b0d-a09a-bae78d8c266f',
    'hbar:clxy',
    'Calaxy Tokens',
    Networks.main.hedera,
    6,
    UnderlyingAsset.CLXY,
    '0.0.859814',
    AccountCoin.DEFAULT_FEATURES
  ),
  hederaToken(
    'e92938d6-6b8b-4c4f-9e38-3eee24810925',
    'hbar:karate',
    'Karate Combat',
    Networks.main.hedera,
    8,
    UnderlyingAsset['hbar:karate'],
    '0.0.2283230',
    AccountCoin.DEFAULT_FEATURES
  ),
  hederaToken(
    '9826ce8f-5679-4ba0-94d3-5ee74d2a349b',
    'hbar:sauce',
    'SaucerSwap',
    Networks.main.hedera,
    6,
    UnderlyingAsset['hbar:sauce'],
    '0.0.731861',
    AccountCoin.DEFAULT_FEATURES
  ),
  hederaToken(
    'bf69c3c4-9180-48d6-9e64-a605918a15dc',
    'hbar:dovu',
    'DOVU',
    Networks.main.hedera,
    8,
    UnderlyingAsset['hbar:dovu'],
    '0.0.3716059',
    AccountCoin.DEFAULT_FEATURES
  ),
  hederaToken(
    'e2c50b47-6343-4a01-a21c-9e666bdd1693',
    'hbar:pack',
    'HashPack',
    Networks.main.hedera,
    6,
    UnderlyingAsset['hbar:pack'],
    '0.0.4794920',
    AccountCoin.DEFAULT_FEATURES
  ),
  hederaToken(
    'a7085ea0-9ad7-40fb-b2bd-44e31c156e84',
    'hbar:jam',
    'Tune.Fm',
    Networks.main.hedera,
    8,
    UnderlyingAsset['hbar:jam'],
    '0.0.127877',
    AccountCoin.DEFAULT_FEATURES
  ),
  hederaToken(
    '36caaf39-fd90-4bad-a197-d36cfaa9c8aa',
    'hbar:berry',
    'Berry',
    Networks.main.hedera,
    6,
    UnderlyingAsset['hbar:berry'],
    '0.0.7496578',
    AccountCoin.DEFAULT_FEATURES
  ),
  hederaToken(
    '0cb81a9b-248e-4d41-b596-700fe0bf93b8',
    'hbar:bonzo',
    'Bonzo Finance',
    Networks.main.hedera,
    8,
    UnderlyingAsset['hbar:bonzo'],
    '0.0.8279134',
    AccountCoin.DEFAULT_FEATURES
  ),
  hederaToken(
    '842c2119-3071-409d-b86f-49f0b46b676e',
    'thbar:usdc',
    'Testnet Hedera USD Coin',
    Networks.test.hedera,
    6,
    UnderlyingAsset.USDC,
    '0.0.429274',
    AccountCoin.DEFAULT_FEATURES
  ),
  hederaToken(
    '77bc438b-7206-4cb1-bee8-dc900e5915be',
    'thbar:txsgd',
    'Testnet Fungible Token',
    Networks.test.hedera,
    6,
    UnderlyingAsset['thbar:txsgd'],
    '0.0.5894751',
    AccountCoin.DEFAULT_FEATURES
  ),
  // End FTX missing ERC20 tokens
  celoToken(
    '1a9935a6-54d2-4988-97ff-d871338e29b5',
    'cusd',
    'Celo USD',
    18,
    '0x765de816845861e75a25fca122bb6898b8b1282a',
    UnderlyingAsset.CUSD
  ),
  celoToken(
    '8aaeda16-50fa-49cf-beb8-80077b408eb0',
    'celo:pact',
    'Pact',
    18,
    '0x2b9018ceb303d540bbf08de8e7de64fddd63396c',
    UnderlyingAsset['celo:pact']
  ),
  erc721(
    'b744b184-ae07-42e1-9585-f4a65fe96d11',
    'erc721:bsctoken',
    'Generic BSC ERC721',
    '0xerc721:bsctoken',
    GENERIC_TOKEN_FEATURES,
    '',
    '',
    Networks.main.bsc,
    KeyCurve.Secp256k1
  ),
  erc1155(
    '93289b8a-751e-4fab-a747-8edb913ba852',
    'erc1155:bsctoken',
    'Generic BSC ERC1155',
    '0xerc1155:bsctoken',
    GENERIC_TOKEN_FEATURES,
    '',
    '',
    Networks.main.bsc,
    KeyCurve.Secp256k1
  ),
  stellarToken(
    '21549d80-c335-4d00-9ef2-86c3da3fcd46',
    'xlm:BST-GADDFE4R72YUP2AOEL67OHZN3GJQYPC3VE734N2XFMEGRR2L32CZ3XYZ',
    'BitGo Shield Token',
    7,
    UnderlyingAsset['xlm:BST-GADDFE4R72YUP2AOEL67OHZN3GJQYPC3VE734N2XFMEGRR2L32CZ3XYZ'],
    'bitgo.com',
    AccountCoin.DEFAULT_FEATURES,
    '',
    'BST'
  ),
  stellarToken(
    '3c72d612-d3bb-482b-8f0e-e541c5f13ea0',
    'xlm:VELO-GDM4RQUQQUVSKQA7S6EM7XBZP3FCGH4Q7CL6TABQ7B2BEJ5ERARM2M5M',
    'Velo Token',
    7,
    UnderlyingAsset['xlm:VELO-GDM4RQUQQUVSKQA7S6EM7XBZP3FCGH4Q7CL6TABQ7B2BEJ5ERARM2M5M'],
    'velo.org',
    AccountCoin.DEFAULT_FEATURES,
    '',
    'VELO'
  ),
  stellarToken(
    '3589f447-9f9e-4964-a1cd-57266ed77320',
    'xlm:SLT-GCKA6K5PCQ6PNF5RQBF7PQDJWRHO6UOGFMRLK3DYHDOI244V47XKQ4GP',
    'Smartlands Token',
    7,
    UnderlyingAsset['xlm:SLT-GCKA6K5PCQ6PNF5RQBF7PQDJWRHO6UOGFMRLK3DYHDOI244V47XKQ4GP'],
    'smartlands.io',
    AccountCoin.DEFAULT_FEATURES,
    '',
    'SLT'
  ),
  stellarToken(
    'd5e3ef15-5e13-4dbe-b6f4-68deaa9aa45b',
    'xlm:USD-GDUKMGUGDZQK6YHYA5Z6AY2G4XDSZPSZ3SW5UN3ARVMO6QSRDWP5YLEX',
    'AnchorUSD',
    7,
    UnderlyingAsset['xlm:USD-GDUKMGUGDZQK6YHYA5Z6AY2G4XDSZPSZ3SW5UN3ARVMO6QSRDWP5YLEX'],
    'anchorusd.com',
    AccountCoin.DEFAULT_FEATURES,
    '',
    'USD'
  ),
  stellarToken(
    '36dc0757-8583-4f42-bf62-8eea12cb5268',
    'xlm:ETH-GBVOL67TMUQBGL4TZYNMY3ZQ5WGQYFPFD5VJRWXR72VA33VFNL225PL5',
    'Stellar ETH',
    7,
    UnderlyingAsset['xlm:ETH-GBVOL67TMUQBGL4TZYNMY3ZQ5WGQYFPFD5VJRWXR72VA33VFNL225PL5'],
    'stellarport.io',
    AccountCoin.DEFAULT_FEATURES,
    '',
    'ETH'
  ),
  stellarToken(
    '13ddfca0-1d8b-457e-b465-b6ca2da24148',
    'xlm:WXT-GASBLVHS5FOABSDNW5SPPH3QRJYXY5JHA2AOA2QHH2FJLZBRXSG4SWXT',
    'Wirex Token',
    7,
    UnderlyingAsset['xlm:WXT-GASBLVHS5FOABSDNW5SPPH3QRJYXY5JHA2AOA2QHH2FJLZBRXSG4SWXT'],
    'wxt.wirexapp.com',
    AccountCoin.DEFAULT_FEATURES,
    '',
    'WXT'
  ),
  stellarToken(
    'd64a43e4-8b3d-448c-a292-b5222b61a3ed',
    'xlm:USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
    'Stellar USDC',
    7,
    UnderlyingAsset['xlm:USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN'],
    'centre.io',
    XLM_TOKEN_FEATURES_WITH_FRANKFURT,
    '',
    'USDC'
  ),
  stellarToken(
    '8b30dc19-aad7-426b-a98b-ee05f2e6dd71',
    'xlm:SIX-GDMS6EECOH6MBMCP3FYRYEVRBIV3TQGLOFQIPVAITBRJUMTI6V7A2X6Z',
    'Stellar SIX Network',
    7,
    UnderlyingAsset['xlm:SIX-GDMS6EECOH6MBMCP3FYRYEVRBIV3TQGLOFQIPVAITBRJUMTI6V7A2X6Z'],
    'six.network',
    AccountCoin.DEFAULT_FEATURES,
    '',
    'SIX'
  ),
  stellarToken(
    '62e2dab9-5d6b-416b-a6fd-88aaedd5677a',
    'xlm:ARST-GCSAZVWXZKWS4XS223M5F54H2B6XPIIXZZGP7KEAIU6YSL5HDRGCI3DG',
    'Argentine Stable coin',
    7,
    UnderlyingAsset['xlm:ARST-GCSAZVWXZKWS4XS223M5F54H2B6XPIIXZZGP7KEAIU6YSL5HDRGCI3DG'],
    'anchors.stablex.org',
    AccountCoin.DEFAULT_FEATURES,
    '',
    'ARST'
  ),
  stellarToken(
    '2b1ced39-0aee-4d35-b109-aa03e44768cb',
    'xlm:BRLT-GCHQ3F2BF5P74DMDNOOGHT5DUCKC773AW5DTOFINC26W4KGYFPYDPRSO',
    'Brazilian Stable coin',
    7,
    UnderlyingAsset['xlm:BRLT-GCHQ3F2BF5P74DMDNOOGHT5DUCKC773AW5DTOFINC26W4KGYFPYDPRSO'],
    'anchors.stablex.org',
    AccountCoin.DEFAULT_FEATURES,
    '',
    'BRLT'
  ),
  stellarToken(
    '13820800-a6e0-4a09-95e9-76df0313c5ed',
    'xlm:AQUA-GBNZILSTVQZ4R7IKQDGHYGY2QXL5QOFJYQMXPKWRRM5PAV7Y4M67AQUA',
    'Aqua Token',
    7,
    UnderlyingAsset['xlm:AQUA-GBNZILSTVQZ4R7IKQDGHYGY2QXL5QOFJYQMXPKWRRM5PAV7Y4M67AQUA'],
    'aqua.network',
    AccountCoin.DEFAULT_FEATURES,
    '',
    'AQUA'
  ),
  stellarToken(
    '9ed420a6-3da6-4b3f-984b-19b03f3098ec',
    'xlm:EURC-GDHU6WRG4IEQXM5NZ4BMPKOXHW76MZM4Y2IEMFDVXBSDP6SJY4ITNPP2',
    'EURC',
    7,
    UnderlyingAsset['xlm:EURC-GDHU6WRG4IEQXM5NZ4BMPKOXHW76MZM4Y2IEMFDVXBSDP6SJY4ITNPP2'],
    'circle.com',
    AccountCoin.DEFAULT_FEATURES,
    '',
    'EURC'
  ),
  stellarToken(
    'f41ca148-3c44-48e2-aabf-0e1ab5f0bf3e',
    'xlm:GYEN-GDF6VOEGRWLOZ64PQQGKD2IYWA22RLT37GJKS2EJXZHT2VLAGWLC5TOB',
    'GMO JPY',
    7,
    UnderlyingAsset['xlm:GYEN-GDF6VOEGRWLOZ64PQQGKD2IYWA22RLT37GJKS2EJXZHT2VLAGWLC5TOB'],
    'stablecoin.z.com',
    XLM_TOKEN_FEATURES_WITH_FRANKFURT,
    '',
    'GYEN'
  ),
  stellarToken(
    '2f654247-3708-4e20-978b-af896fd910d3',
    'xlm:ZUSD-GDF6VOEGRWLOZ64PQQGKD2IYWA22RLT37GJKS2EJXZHT2VLAGWLC5TOB',
    'Z.com USD',
    7,
    UnderlyingAsset['xlm:ZUSD-GDF6VOEGRWLOZ64PQQGKD2IYWA22RLT37GJKS2EJXZHT2VLAGWLC5TOB'],
    'stablecoin.z.com',
    XLM_TOKEN_FEATURES_WITH_FRANKFURT,
    '',
    'ZUSD'
  ),
  stellarToken(
    'bde64255-0065-4e01-add4-3226325d512e',
    'xlm:EURS-GC5FGCDEOGOGSNWCCNKS3OMEVDHTE3Q5A5FEQWQKV3AXA7N6KDQ2CUZJ',
    'STASIS EURS',
    7,
    UnderlyingAsset['xlm:EURS-GC5FGCDEOGOGSNWCCNKS3OMEVDHTE3Q5A5FEQWQKV3AXA7N6KDQ2CUZJ'],
    'stasis.net',
    AccountCoin.DEFAULT_FEATURES,
    '',
    'EURS'
  ),
  stellarToken(
    '86841e89-011e-486d-bd29-1474cca0dd65',
    'xlm:VEUR-GDXLSLCOPPHTWOQXLLKSVN4VN3G67WD2ENU7UMVAROEYVJLSPSEWXIZN',
    'VNX Euro',
    7,
    UnderlyingAsset['xlm:VEUR-GDXLSLCOPPHTWOQXLLKSVN4VN3G67WD2ENU7UMVAROEYVJLSPSEWXIZN'],
    'vnx.li',
    XLM_TOKEN_FEATURES_WITH_FRANKFURT,
    '',
    'VEUR'
  ),
  stellarToken(
    '2bcb06ec-8043-4568-a236-274ddad2335f',
    'xlm:VCHF-GDXLSLCOPPHTWOQXLLKSVN4VN3G67WD2ENU7UMVAROEYVJLSPSEWXIZN',
    'VNX Franc',
    7,
    UnderlyingAsset['xlm:VCHF-GDXLSLCOPPHTWOQXLLKSVN4VN3G67WD2ENU7UMVAROEYVJLSPSEWXIZN'],
    'vnx.li',
    XLM_TOKEN_FEATURES_WITH_FRANKFURT,
    '',
    'VCHF'
  ),
  stellarToken(
    'ea901538-9adf-485f-82d1-3a80b94359aa',
    'xlm:AUDD-GDC7X2MXTYSAKUUGAIQ7J7RPEIM7GXSAIWFYWWH4GLNFECQVJJLB2EEU',
    'AUDD',
    7,
    UnderlyingAsset['xlm:AUDD-GDC7X2MXTYSAKUUGAIQ7J7RPEIM7GXSAIWFYWWH4GLNFECQVJJLB2EEU'],
    'audd.digital',
    XLM_TOKEN_FEATURES_WITH_FRANKFURT,
    '',
    'AUDD'
  ),
  stellarToken(
    '10a1aeb5-c738-4ff2-9924-58b0aabaf6e4',
    'xlm:BENJI-GBHNGLLIE3KWGKCHIKMHJ5HVZHYIK7WTBE4QF5PLAKL4CJGSEU7HZIW5',
    'BENJI',
    7,
    UnderlyingAsset['xlm:BENJI-GBHNGLLIE3KWGKCHIKMHJ5HVZHYIK7WTBE4QF5PLAKL4CJGSEU7HZIW5'],
    'www.franklintempleton.com',
    AccountCoin.DEFAULT_FEATURES,
    '',
    'BENJI'
  ),
  stellarToken(
    '4afce14d-e061-4008-8ef6-ef13c42d667a',
    'xlm:gBENJI-GD5J73EKK5IYL5XS3FBTHHX7CZIYRP7QXDL57XFWGC2WVYWT326OBXRP',
    'GBENJI',
    7,
    UnderlyingAsset['xlm:gBENJI-GD5J73EKK5IYL5XS3FBTHHX7CZIYRP7QXDL57XFWGC2WVYWT326OBXRP'],
    'www.franklintempleton.com',
    AccountCoin.DEFAULT_FEATURES,
    '',
    'GBENJI'
  ),
  tronToken(
    '5f3266f8-252c-492a-90d7-bb6d3bf550fb',
    'trx:btt',
    'BitTorrent',
    18,
    'TAFjULxiVgT4qWk6UZwjqwZXTSaGaqnVp4',
    UnderlyingAsset.BTT
  ),
  tronToken(
    'd8d505d2-f525-4922-b538-317b879bd316',
    'trx:btc',
    'Bitcoin (TRC20)',
    8,
    'TN3W4H6rK2ce4vX9YnFQHwKENnHjoxb3m9',
    UnderlyingAsset.BTC
  ),
  tronToken(
    '85d99eb6-84a1-4525-a9df-db82bcc21568',
    'trx:wbtc',
    'Tron Wrapped Bitcoin',
    8,
    'TXpw8XeWYeTUd4quDskoUqeQPowRh4jY65',
    UnderlyingAsset.WBTC
  ),
  tronToken(
    '2fab33a1-0a7b-4935-82c2-b0b5c22540ee',
    'trx:weth',
    'Tron Wrapped Ether',
    18,
    'TXWkP3jLBqRGojUih1ShzNyDaN5Csnebok',
    UnderlyingAsset.WETH
  ),
  tronToken(
    'f950c2f5-508f-49e5-88a7-9de3da1f5cf9',
    'trx:usdc',
    'USD Coin',
    6,
    'TEkxiTehnzSmSe2XqrBj4w32RUN966rdz8',
    UnderlyingAsset.USDC
  ),
  tronToken(
    'f96fda99-cf5a-4ac4-885e-fa95292a7135',
    'trx:usdt',
    'Tether USD',
    6,
    'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
    UnderlyingAsset['trx:usdt']
  ),
  tronToken(
    '77fe25dc-7871-4d9d-9cc0-2e5cba6250ff',
    'trx:sun',
    'SUN',
    18,
    'TSSMHYeV2uE9qYH95DqyoCuNCzEL1NvU3S',
    UnderlyingAsset.SUN
  ),
  tronToken(
    'dd0e0950-ff1a-4302-b12d-d661d59602d8',
    'trx:htx',
    'HTX',
    18,
    'TUPM7K8REVzD2UdV4R5fe5M8XbnR2DdoJ6',
    UnderlyingAsset['trx:htx']
  ),
  tronToken(
    '888fb35c-1b3d-425d-af65-e6aa7453edce',
    'trx:jst',
    'Just',
    18,
    'TCFLL5dx5ZJdKnWuesXxi1VPwjLVmWZZy9',
    UnderlyingAsset['trx:jst']
  ),
  tronToken(
    'c2607e31-8da7-4b73-bbf3-f9f0209b73eb',
    'trx:tusd',
    'TrueUSD',
    18,
    'TUpMhErZL2fhh4sVNULAbNKLokS4GjC1F4',
    UnderlyingAsset['trx:tusd']
  ),
  tronToken(
    '649c3a89-6064-4131-8eb7-087d65207cdc',
    'trx:win',
    'WINkLink',
    6,
    'TLa2f6VPqDgRE67v1736s7bJ8Ray5wYjU7',
    UnderlyingAsset['trx:win']
  ),
  tronToken(
    '972e50a5-f513-469a-a4b7-f0776d3ab608',
    'trx:usdd',
    'USDD',
    18,
    'TPYmHEhy5n8TCEfYGqW2rPxsghSfzghPDn',
    UnderlyingAsset['trx:usdd']
  ),
  tronToken(
    '6d37a333-c09b-44b8-bd2b-f07f12b838cd',
    'trx:usd1',
    'USD1',
    18,
    'TPFqcBAaaUMCSVRCqPaQ9QnzKhmuoLR6Rc',
    UnderlyingAsset['trx:usd1']
  ),
  algoToken(
    'bf444e89-e762-48a9-a27d-8efa2aed7867',
    'algo:USDC-31566704',
    'algo:31566704',
    'USDC',
    6,
    UnderlyingAsset['algo:USDC-31566704'],
    AccountCoin.DEFAULT_FEATURES,
    '',
    'USDC'
  ),
  algoToken(
    '4d9eee7f-68ac-4ce4-8c83-e673f996215d',
    'algo:USDt-312769',
    'algo:312769',
    'Algorand USDT',
    6,
    UnderlyingAsset['algo:USDt-312769'],
    AccountCoin.DEFAULT_FEATURES,
    '',
    'USDt'
  ),
  algoToken(
    '4d3ec83f-a3ad-4b76-89de-a1b7134a39d4',
    'algo:MCAU-6547014',
    'algo:6547014',
    'MCAU',
    5,
    UnderlyingAsset['algo:MCAU-6547014'],
    AccountCoin.DEFAULT_FEATURES,
    '',
    'MCAU'
  ),
  algoToken(
    '4a4cdf2b-e01e-4ee8-b3d6-5ac471309ae1',
    'algo:VCAD-438505559',
    'algo:438505559',
    'VCAD',
    2,
    UnderlyingAsset['algo:VCAD-438505559'],
    AccountCoin.DEFAULT_FEATURES,
    '',
    'VCAD'
  ),
  algoToken(
    'abe2e04e-d53b-4a23-9a68-08eaeb8b028e',
    'algo:QCAD-84507107',
    'algo:84507107',
    'QCAD',
    2,
    UnderlyingAsset['algo:QCAD-84507107'],
    AccountCoin.DEFAULT_FEATURES,
    '',
    'QCAD'
  ),

  tceloToken(
    'a7fb510c-de32-4cd5-9215-4e55c81d5489',
    'tcusd',
    'Test Celo USD Token',
    18,
    '0x874069fa1eb16d44d622f2e0ca25eea172369bc1',
    UnderlyingAsset.CUSD
  ),
  terc721(
    'd92c7b1c-0c54-45cb-9b8a-1326c747bf58',
    'terc721:bsctoken',
    'Generic BSC ERC721',
    '0xterc721:bsctoken',
    GENERIC_TOKEN_FEATURES,
    '',
    '',
    Networks.test.bsc,
    KeyCurve.Secp256k1
  ),
  terc721(
    'f1506cf6-7949-4f2b-b87c-56d3483c7eea',
    'terc1155:bsctoken',
    'Generic BSC ERC1155',
    '0xterc1155:bsctoken',
    GENERIC_TOKEN_FEATURES,
    '',
    '',
    Networks.test.bsc,
    KeyCurve.Secp256k1
  ),
  erc721(
    '0745cd72-9108-4ac0-80db-7c9418d55b79',
    'erc721:witch',
    'Crypto Coven',
    '0x5180db8f5c931aae63c74266b211f580155ecac8'
  ),
  erc721(
    '64dfc2da-97b9-4228-a991-847148bcde5e',
    'erc721:token',
    'Generic ETH ERC721',
    '0xerc721:token',
    GENERIC_TOKEN_FEATURES
  ),
  erc1155(
    'c1f23de0-a0d1-47fd-97da-c5e4df96d2e8',
    'erc1155:token',
    'Generic ETH ERC1155',
    '0xerc1155:token',
    GENERIC_TOKEN_FEATURES
  ),
  nonstandardToken(
    'a24443ec-12a7-4046-9c5d-5a4dccf9d0a5',
    'nonstandard:token',
    'Generic ETH Nonstandard',
    '0xnonstandard:token',
    GENERIC_TOKEN_FEATURES
  ),
  terc721(
    '442628d0-c24b-4ae2-9bf9-48c2c0ab085e',
    'terc721:token',
    'Generic ETH ERC721',
    '0xterc721:token',
    GENERIC_TOKEN_FEATURES
  ),
  terc1155(
    'ff757312-8ad1-442a-b5b9-edcba2849727',
    'terc1155:token',
    'Generic ETH ERC1155',
    '0xterc1155:token',
    GENERIC_TOKEN_FEATURES
  ),
  nonstandardToken(
    'a3399087-9d39-49cb-9fc3-11b49fb10f48',
    'tnonstandard:token',
    'Generic ETH Nonstandard',
    '0xtnonstandard:token',
    GENERIC_TOKEN_FEATURES,
    '',
    '',
    Networks.test.holesky
  ),
  terc721(
    'e795fc78-b8a7-47a1-8294-5ecbe8a74c3a',
    'terc721:bitgoerc721',
    'Test BITGO ERC 721 Token',
    '0x8397b091514c1f7bebb9dea6ac267ea23b570605'
  ),
  terc721(
    'b87c9dfa-2c25-446b-9a30-44c0743dc0e5',
    'terc1155:bitgoerc1155',
    'Test BITGO ERC 1155 Token',
    '0x87cd6a40640befdd96e563b788a6b1fb3e07a186'
  ),
  tstellarToken(
    '47887cb5-98bb-4942-bd25-3ccca0847f36',
    'txlm:BST-GBQTIOS3XGHB7LVYGBKQVJGCZ3R4JL5E4CBSWJ5ALIJUHBKS6263644L',
    'BitGo Shield Token',
    7,
    UnderlyingAsset['txlm:BST-GBQTIOS3XGHB7LVYGBKQVJGCZ3R4JL5E4CBSWJ5ALIJUHBKS6263644L'],
    'bitgo.com',
    AccountCoin.DEFAULT_FEATURES,
    '',
    'BST'
  ),
  tstellarToken(
    '9e1d4f1a-661b-4a51-b647-71f8c1330201',
    'txlm:TST-GBQTIOS3XGHB7LVYGBKQVJGCZ3R4JL5E4CBSWJ5ALIJUHBKS6263644L',
    'BitGo Test Token',
    7,
    UnderlyingAsset['txlm:TST-GBQTIOS3XGHB7LVYGBKQVJGCZ3R4JL5E4CBSWJ5ALIJUHBKS6263644L'],
    'bitgo.com',
    AccountCoin.DEFAULT_FEATURES,
    '',
    'TST'
  ),
  ttronToken(
    '4ece7f15-a5c9-4302-8c82-787d7eb7e3c9',
    'ttrx:wbtc',
    'Test Tron Wrapped Bitcoin',
    8,
    'TGkfUshdbAiNj5G1mynp2meq2BfF6XSGPf',
    UnderlyingAsset.WBTC
  ),
  ttronToken(
    'a3651b75-1781-4521-87a9-30bb8aed5183',
    'ttrx:weth',
    'Test Tron Wrapped Ether',
    18,
    'TCA8tecECSMwjg5jFz1J1V64k9ULZRSx7g',
    UnderlyingAsset.WETH
  ),
  ttronToken(
    'd21a5b8b-c8c2-4635-a2ce-7d37c59da76e',
    'ttrx:usdc',
    'USD Coin',
    6,
    'TSdZwNqpHofzP6BsBKGQUWdBeJphLmF6id',
    UnderlyingAsset.USDC
  ),
  ttronToken(
    '85a60a5a-88e3-45df-9e2c-dc6161b4c6b1',
    'ttrx:usdt',
    'Tether USD',
    6,
    'TG3XXyExBkPp9nzdajDZsozEu4BkaSJozs',
    UnderlyingAsset['ttrx:usdt']
  ),
  talgoToken(
    '0e20b757-3e62-4400-887d-caff117481c8',
    'talgo:USDC-10458941',
    'talgo:10458941',
    'USDC',
    6,
    UnderlyingAsset['talgo:USDC-10458941'],
    AccountCoin.DEFAULT_FEATURES,
    '',
    'USDC'
  ),
  talgoToken(
    'dd48a295-4f59-4a36-bc40-801998b9ff90',
    'talgo:USDt-180447',
    'talgo:180447',
    'Testnet Algorand USDT',
    6,
    UnderlyingAsset['talgo:USDt-180447'],
    AccountCoin.DEFAULT_FEATURES,
    '',
    'USDt'
  ),
  talgoToken(
    '3cfccea1-9946-4de1-abe2-f9ab6411a14b',
    'talgo:USON-16026728',
    'talgo:16026728',
    'Unison',
    2,
    UnderlyingAsset['talgo:USON-16026728'],
    AccountCoin.DEFAULT_FEATURES,
    '',
    'USON'
  ),
  talgoToken(
    '02f2ed81-83ba-4c6c-931e-2ce1aacfd57f',
    'talgo:SPRW-16026732',
    'talgo:16026732',
    'Sparrow',
    4,
    UnderlyingAsset['talgo:SPRW-16026732'],
    AccountCoin.DEFAULT_FEATURES,
    '',
    'SPRW'
  ),
  talgoToken(
    '0c642b43-157a-475b-b6dc-d20ae76c71fc',
    'talgo:KAL-16026733',
    'talgo:16026733',
    'Kalki',
    8,
    UnderlyingAsset['talgo:KAL-16026733'],
    AccountCoin.DEFAULT_FEATURES,
    '',
    'KAL'
  ),
  talgoToken(
    '857994b1-3198-4649-a7a0-724a8620eb67',
    'talgo:JPT-162085446',
    'talgo:162085446',
    'JPT',
    6,
    UnderlyingAsset['talgo:JPT-162085446'],
    AccountCoin.DEFAULT_FEATURES,
    '',
    'JPT'
  ),
  eosToken(
    'c6e34428-3c32-4db6-b51e-7edee3bb0b1e',
    'eos:CHEX',
    'Chintai',
    8,
    'chexchexchex',
    'chexchexchex',
    UnderlyingAsset.CHEX,
    AccountCoin.DEFAULT_FEATURES,
    '',
    'CHEX'
  ),
  eosToken(
    '76a1517e-ec5d-4467-84bf-7a6f15bb0348',
    'eos:IQ',
    'Everipedia',
    3,
    'everipediaiq',
    'everipediaiq',
    UnderlyingAsset.IQ,
    AccountCoin.DEFAULT_FEATURES,
    '',
    'IQ'
  ),
  eosToken(
    'dcf97761-3e4c-430f-b618-c6f16baf5d0f',
    'eos:BOX',
    'Box',
    6,
    'token.defi',
    'token.defi',
    UnderlyingAsset.EOS_BOX,
    AccountCoin.DEFAULT_FEATURES,
    '',
    'BOX'
  ),
  eosToken(
    'b91390e4-f297-4d03-8bc8-5703184419dc',
    'eos:USDT',
    'EOS USDT',
    4,
    'tethertether',
    'tethertether',
    UnderlyingAsset.USDT,
    AccountCoin.DEFAULT_FEATURES,
    '',
    'USDT'
  ),
  eosToken(
    'a6420670-287b-4ac0-bf54-052149ffe180',
    'eos:VAULTA',
    'Vaulta',
    4,
    'core.vaulta',
    'core.vaulta',
    UnderlyingAsset.VAULTA,
    AccountCoin.DEFAULT_FEATURES,
    '',
    'VAULTA'
  ),
  teosToken(
    '1c627bb5-4bee-4ab0-8bb6-3d535e17a769',
    'teos:CHEX',
    'Chintai',
    8,
    'testtoken113',
    'testtoken113',
    UnderlyingAsset.CHEX,
    AccountCoin.DEFAULT_FEATURES,
    '',
    'CHEX'
  ),
  teosToken(
    '63837b29-db2e-4d09-b51b-ba93681fc9fe',
    'teos:IQ',
    'Everipedia',
    3,
    'testtoken112',
    'testtoken112',
    UnderlyingAsset.IQ,
    AccountCoin.DEFAULT_FEATURES,
    '',
    'IQ'
  ),
  teosToken(
    'cae14351-7797-4704-aa84-70ae0e414d72',
    'teos:BOX',
    'Box',
    6,
    'kvszn1xyz1bu',
    'kvszn1xyz1bu',
    UnderlyingAsset.EOS_BOX,
    AccountCoin.DEFAULT_FEATURES,
    '',
    'BOX'
  ),
  teosToken(
    '7c420890-c271-49ef-b3a3-73893bffcc55',
    'teos:USDT',
    'Testnet EOS USDT',
    4,
    'lionteste212',
    'lionteste212',
    UnderlyingAsset.USDT,
    AccountCoin.DEFAULT_FEATURES,
    '',
    'USDT'
  ),
  teosToken(
    '9c830ef9-2f1d-4fea-8f38-8f4bb9170b68',
    'teos:VAULTA',
    'Testnet Vaulta',
    4,
    'core.vaulta',
    'core.vaulta',
    UnderlyingAsset.VAULTA,
    AccountCoin.DEFAULT_FEATURES,
    '',
    'VAULTA'
  ),
  erc721(
    'dd743064-09e6-4028-9e61-ebf7c24ff40b',
    'erc721:polygontoken',
    'Generic Polygon ERC721',
    '0xerc721:polygontoken',
    GENERIC_TOKEN_FEATURES,
    '',
    '',
    Networks.main.polygon,
    KeyCurve.Secp256k1
  ),
  erc1155(
    '296f4fa6-d98b-4bee-801a-154892a97efe',
    'erc1155:polygontoken',
    'Generic Polygon ERC1155',
    '0xerc1155:polygontoken',
    GENERIC_TOKEN_FEATURES,
    '',
    '',
    Networks.main.polygon,
    KeyCurve.Secp256k1
  ),
  terc721(
    '54d98031-6ebc-428a-b47c-b6ec7d6ad28a',
    'tpolygon:name',
    'Polygon Test NAME',
    '0xba4bfed386dac111866aa2369319f2c2daf454af',
    POLYGON_TOKEN_FEATURES,
    '',
    '',
    Networks.test.polygon,
    KeyCurve.Secp256k1
  ),
  terc721(
    '323f811c-d8b2-4363-8e4c-ebbf64160d4d',
    'terc721:polygontoken',
    'Generic Polygon ERC721',
    '0xterc721:polygontoken',
    GENERIC_TOKEN_FEATURES,
    '',
    '',
    Networks.test.polygon,
    KeyCurve.Secp256k1
  ),
  terc1155(
    '757c1444-887b-427a-95d4-ea87fa035473',
    'terc1155:polygontoken',
    'Generic Polygon ERC1155',
    '0xterc1155:polygontoken',
    GENERIC_TOKEN_FEATURES,
    '',
    '',
    Networks.test.polygon,
    KeyCurve.Secp256k1
  ),
  erc721(
    '7c8a60a0-8ced-4429-b868-02106b3a478d',
    'erc721:soneiumtoken',
    'Generic Soneium ERC721',
    '0xerc721:soneiumtoken',
    GENERIC_TOKEN_FEATURES,
    '',
    '',
    Networks.main.soneium,
    KeyCurve.Secp256k1
  ),
  erc1155(
    '64b57b9f-3aaf-4518-95fb-4458abc828fd',
    'erc1155:soneiumtoken',
    'Generic Soneium ERC1155',
    '0xerc1155:soneiumtoken',
    GENERIC_TOKEN_FEATURES,
    '',
    '',
    Networks.main.soneium,
    KeyCurve.Secp256k1
  ),
  terc721(
    'c3fd9b27-b7df-4287-8991-58c15d004e83',
    'terc721:soneiumtoken',
    'Generic Soneium ERC721',
    '0xterc721:soneiumtoken',
    GENERIC_TOKEN_FEATURES,
    '',
    '',
    Networks.test.soneium,
    KeyCurve.Secp256k1
  ),
  terc1155(
    '8c27076a-c84b-4735-a263-8c47f604df69',
    'terc1155:soneiumtoken',
    'Generic Soneium ERC1155',
    '0xterc1155:soneiumtoken',
    GENERIC_TOKEN_FEATURES,
    '',
    '',
    Networks.test.soneium,
    KeyCurve.Secp256k1
  ),
  arbethErc20(
    '14a21e93-b123-4437-b99f-0489947d0379',
    'arbeth:link',
    'Chainlink Token',
    18,
    '0xf97f4df75117a78c1a5a0dbb814af92458539fb4',
    UnderlyingAsset['arbeth:link']
  ),
  arbethErc20(
    '67c9fa5c-e9e0-4586-abe2-f2921d7a83cd',
    'arbeth:spxux',
    'WisdomTree 500 Digital Fund (SPXUX)',
    18,
    '0x4122047076a1106618e984a8776a3f7bbcb1d429',
    UnderlyingAsset['arbeth:spxux']
  ),
  arbethErc20(
    '42ae1f1a-95df-40b7-a584-fe52b2cf08c6',
    'arbeth:xsgdv2',
    'XSGD (Bridged)',
    6,
    '0xa05245ade25cc1063ee50cf7c083b4524c1c4302',
    UnderlyingAsset['arbeth:xsgdv2']
  ),
  arbethErc20(
    '0606676c-1e6b-488a-abe1-ab46c697c4b9',
    'arbeth:usdc',
    'USD Coin',
    6,
    '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8',
    UnderlyingAsset['arbeth:usdc']
  ),
  arbethErc20(
    '8deaaaf0-f81f-4697-bba6-77f4cfcd4efc',
    'arbeth:usdcv2',
    'USD Coin (native)',
    6,
    '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
    UnderlyingAsset['arbeth:usdcv2'],
    TOKEN_FEATURES_WITH_FRANKFURT
  ),
  arbethErc20(
    'a49b04e6-5a1b-4d55-9187-4d41c41f8f1e',
    'arbeth:usdt',
    'Tether USD',
    6,
    '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9',
    UnderlyingAsset['arbeth:usdt']
  ),
  arbethErc20(
    '7dfbdd2b-efd6-45ab-90bd-9c3bc16d1397',
    'arbeth:arb',
    'Arbitrum',
    18,
    '0x912ce59144191c1204e64559fe8253a0e49e6548',
    UnderlyingAsset['arbeth:arb'],
    TOKEN_FEATURES_WITH_FRANKFURT
  ),
  arbethErc20(
    '65668b2e-6560-4749-a965-4d03eaeffaec',
    'arbeth:sqd',
    'Subsquid',
    18,
    '0x1337420ded5adb9980cfc35f8f2b054ea86f8ab1',
    UnderlyingAsset['arbeth:sqd']
  ),
  arbethErc20(
    'e3c7b25e-d9e4-45cd-a3c2-4abec8483489',
    'arbeth:cbl',
    'Credbull',
    18,
    '0xd6b3d81868770083307840f513a3491960b95cb6',
    UnderlyingAsset['arbeth:cbl']
  ),
  arbethErc20(
    '5a160655-9d96-4fdd-a362-224026b7c1e8',
    'arbeth:w',
    'Wormhole Token',
    18,
    '0xb0ffa8000886e57f86dd5264b9582b2ad87b2b91',
    UnderlyingAsset['arbeth:w']
  ),
  arbethErc20(
    'a7137632-43d0-4bfb-a0d4-252244d00ad6',
    'arbeth:comp',
    'Compound',
    18,
    '0x354a6da3fcde098f8389cad84b0182725c6c91de',
    UnderlyingAsset['arbeth:comp']
  ),
  arbethErc20(
    '12483bbb-b76c-4e77-ba8f-2a9fcb68ddd9',
    'arbeth:coti',
    'COTI Token',
    18,
    '0x6fe14d3cc2f7bddffba5cdb3bbe7467dd81ea101',
    UnderlyingAsset['arbeth:coti']
  ),
  arbethErc20(
    'af28367c-f1e3-4b4a-84ed-a23d71e72314',
    'arbeth:gno',
    'Gnosis Token',
    18,
    '0xa0b862f60edef4452f25b4160f177db44deb6cf1',
    UnderlyingAsset['arbeth:gno']
  ),
  arbethErc20(
    '45853143-95ab-4ebf-a9f9-493625216d15',
    'arbeth:gohm',
    'Governance OHM',
    18,
    '0x8d9ba570d6cb60c7e3e0f31343efe75ab8e65fb1',
    UnderlyingAsset['arbeth:gohm']
  ),
  arbethErc20(
    'e118fa19-9f3d-4297-8983-12d1e43a14ab',
    'arbeth:grt',
    'Graph Token',
    18,
    '0x9623063377ad1b27544c965ccd7342f7ea7e88c7',
    UnderlyingAsset['arbeth:grt']
  ),
  arbethErc20(
    '77d73c2e-f9be-4c66-96e3-76c4169d55d7',
    'arbeth:knc',
    'Kyber Network Crystal v2',
    18,
    '0xe4dddfe67e7164b0fe14e218d80dc4c08edc01cb',
    UnderlyingAsset['arbeth:knc']
  ),
  arbethErc20(
    '89917127-2f82-49fa-9f3c-737ca9f5be4a',
    'arbeth:myrc',
    'Blox MYRC',
    18,
    '0x3ed03e95dd894235090b3d4a49e0c3239edce59e',
    UnderlyingAsset['arbeth:myrc']
  ),
  arbethErc20(
    '230c1576-d591-4123-bac0-756eb9446fbd',
    'arbeth:trb',
    'Tellor Tributes',
    18,
    '0xd58d345fd9c82262e087d2d0607624b410d88242',
    UnderlyingAsset['arbeth:trb']
  ),
  arbethErc20(
    '4561ae66-de18-407b-966b-ae9681dec318',
    'arbeth:tusd',
    'TrueUSD',
    18,
    '0x4d15a3a2286d883af0aa1b3f21367843fac63e07',
    UnderlyingAsset['arbeth:tusd']
  ),
  arbethErc20(
    'eb721759-6da6-46c3-b0d2-a7e9d939c527',
    'arbeth:uma',
    'UMA Voting Token v1',
    18,
    '0xd693ec944a85eeca4247ec1c3b130dca9b0c3b22',
    UnderlyingAsset['arbeth:uma']
  ),
  arbethErc20(
    'df8223b3-f766-412a-bb59-769e4e47138d',
    'arbeth:uni',
    'Uniswap',
    18,
    '0xfa7f8980b0f1e64a2062791cc3b0871572f1f7f0',
    UnderlyingAsset['arbeth:uni']
  ),
  arbethErc20(
    'a87e11ae-51cd-406c-b87b-98abb6ae3386',
    'arbeth:weth',
    'Wrapped Ether',
    18,
    '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
    UnderlyingAsset['arbeth:weth']
  ),
  arbethErc20(
    '769735f8-8788-4d11-98ef-9723e04eee85',
    'arbeth:woo',
    'Woo',
    18,
    '0xcafcd85d8ca7ad1e1c6f82f651fa15e33aefd07b',
    UnderlyingAsset['arbeth:woo']
  ),
  arbethErc20(
    'c8dbdec7-124b-41a0-98a2-88949dbefa72',
    'arbeth:yfi',
    'yearn.finance',
    18,
    '0x82e3a8f066a6989666b031d916c43672085b1582',
    UnderlyingAsset['arbeth:yfi']
  ),
  arbethErc20(
    '5846be2e-06c5-4ce9-a630-f67a60cbc019',
    'arbeth:xsgd',
    'XSGD',
    6,
    '0xe333e7754a2dc1e020a162ecab019254b9dab653',
    UnderlyingAsset['arbeth:xsgd']
  ),
  arbethErc20(
    '32210989-1ce4-4175-b3ca-2acd95ba58ea',
    'arbeth:ztx',
    'ZepetoX',
    18,
    '0x1c43d05be7e5b54d506e3ddb6f0305e8a66cd04e',
    UnderlyingAsset['arbeth:ztx']
  ),
  arbethErc20(
    '0aa284a4-f7cc-4b9c-8564-c305e113e456',
    'arbeth:ldo',
    'LIDO DAO',
    18,
    '0x13ad51ed4f1b7e9dc168d8a00cb3f4ddd85efa60',
    UnderlyingAsset['arbeth:ldo']
  ),
  arbethErc20(
    '64d7ee44-d212-499f-bd2a-4e958f7583ed',
    'arbeth:egp',
    'Eigenpie',
    18,
    '0x7e7a7c916c19a45769f6bdaf91087f93c6c12f78',
    UnderlyingAsset['arbeth:egp']
  ),
  arbethErc20(
    '8bd85fd9-cb21-4e9c-8dea-94a898062131',
    'arbeth:gs',
    'GammaSwap',
    18,
    '0xb08d8becab1bf76a9ce3d2d5fa946f65ec1d3e83',
    UnderlyingAsset['arbeth:gs']
  ),
  arbethErc20(
    'e4e52bd4-33f0-4fdd-9fc7-5b2fe232e8ae',
    'arbeth:vchf',
    'VNX Franc',
    18,
    '0x02cea97794d2cfb5f560e1ff4e9c59d1bec75969',
    UnderlyingAsset['arbeth:vchf']
  ),
  arbethErc20(
    'b6d3265c-fd83-4e75-b46a-db3f068536c4',
    'arbeth:veur',
    'VNX Euro',
    18,
    '0x4883c8f0529f37e40ebea870f3c13cdfad5d01f8',
    UnderlyingAsset['arbeth:veur']
  ),
  arbethErc20(
    '1a5481b2-67c1-4872-9b81-478773cc10c6',
    'arbeth:tbill',
    'OpenEden T-Bills',
    6,
    '0xf84d28a8d28292842dd73d1c5f99476a80b6666a',
    UnderlyingAsset['arbeth:tbill'],
    AccountCoin.DEFAULT_FEATURES_EXCLUDE_SINGAPORE
  ),
  tarbethErc20(
    'd6a8869d-3da4-4b95-a9af-f2a059ca651f',
    'tarbeth:link',
    'Arbitrum Test LINK',
    18,
    '0x143e1dae4f018ff86051a01d44a1b49b13704056',
    UnderlyingAsset['tarbeth:link']
  ),
  tarbethErc20(
    '64477af2-65cb-44d2-a3fd-aed07cfe6bfd',
    'tarbeth:xsgd',
    'XSGD',
    6,
    '0x63681558c1b680e43bbcadc0ced21075854bba87',
    UnderlyingAsset['tarbeth:xsgd']
  ),
  arbethErc20(
    '6a69ea1d-ce7d-4603-89df-cf2f6490d1f9',
    'arbeth:xai',
    'Xai',
    18,
    '0x4cb9a7ae498cedcbb5eae9f25736ae7d428c9d66',
    UnderlyingAsset['arbeth:xai']
  ),
  arbethErc20(
    'f7ea881b-bc17-4948-a315-3f00f680f650',
    'arbeth:flttx',
    'WisdomTree Floating Rate Treasury Digital Fund',
    18,
    '0x3b9c11cb16b4c9eeb1408dad409afbe800abde3f',
    UnderlyingAsset['arbeth:flttx']
  ),
  arbethErc20(
    '5f1c54f1-3cc5-48b4-9aa4-668d84cca4fb',
    'arbeth:wtsix',
    'WisdomTree Short-Duration Income Digital Fund',
    18,
    '0xf414bfbe375941b1ba91b1a5683fe2c59d2c7b9b',
    UnderlyingAsset['arbeth:wtsix']
  ),
  arbethErc20(
    '84d61096-de69-4bc6-857c-a7f9c850c4bd',
    'arbeth:modrx',
    'WisdomTree Siegel Moderate Digital Fund',
    18,
    '0x496d35292d68c988ba37668ca92aafdaf5c35415',
    UnderlyingAsset['arbeth:modrx']
  ),
  arbethErc20(
    '59c4e660-9d23-458f-81fc-69456aefb811',
    'arbeth:techx',
    'WisdomTree Technology & Innovation 100 Digital Fund',
    18,
    '0x5ef799dce2e8272b4a72a62c0d34250ef7e42ac0',
    UnderlyingAsset['arbeth:techx']
  ),
  arbethErc20(
    '99cdac69-d7d9-46ec-adc3-374643983f40',
    'arbeth:wtsyx',
    'WisdomTree Short-Term Treasury Digital Fund',
    18,
    '0xeac8180e6c03bb5e8ed11b1c09e06d4a7a6fecc4',
    UnderlyingAsset['arbeth:wtsyx']
  ),
  arbethErc20(
    '10fda1b7-4d07-47ba-996b-f8c9bca4c128',
    'arbeth:wtlgx',
    'WisdomTree Long Term Treasury Digital Fund',
    18,
    '0xf9cbf82f5a609a59fb53864fe1b01e010daf6c27',
    UnderlyingAsset['arbeth:wtlgx']
  ),
  arbethErc20(
    '36548ee4-dacb-49ac-9319-779679ed5c47',
    'arbeth:wttsx',
    'WisdomTree 3-7 Year Treasury Digital Fund',
    18,
    '0xc66bb5e302e6948a5a902cc17f1894250ca82500',
    UnderlyingAsset['arbeth:wttsx']
  ),
  arbethErc20(
    '7de0b5db-c86b-4330-b3d4-6e5106dd496c',
    'arbeth:tipsx',
    'WisdomTree TIPS Digital Fund',
    18,
    '0x4e933c45e1cfdd309eeef439bf0ec481c38849da',
    UnderlyingAsset['arbeth:tipsx']
  ),
  arbethErc20(
    '6dc4cf2d-2c69-4334-a66d-95be36633f09',
    'arbeth:wtstx',
    'WisdomTree 7-10 Year Treasury Digital Fund',
    18,
    '0x19842916b4f346d48526d5bc3ebbc540b408a647',
    UnderlyingAsset['arbeth:wtstx']
  ),
  arbethErc20(
    'aae6325b-573f-47bc-9e5b-98d5223aaf80',
    'arbeth:wtgxx',
    'WisdomTree Government Money Market Digital Fund',
    18,
    '0xfeb26f0943c3885b2cb85a9f933975356c81c33d',
    UnderlyingAsset['arbeth:wtgxx']
  ),
  arbethErc20(
    '54f5fdda-954e-4296-994b-a89247ad311f',
    'arbeth:lngvx',
    'WisdomTree Siegel Longevity Digital Fund',
    18,
    '0x777a4d310cf66c1d272c7cd17bd054a456a26d34',
    UnderlyingAsset['arbeth:lngvx']
  ),
  arbethErc20(
    '4d3dce6a-3829-44bd-90a1-0c172dadbb1f',
    'arbeth:eqtyx',
    'WisdomTree Siegel Global Equity Digital Fund',
    18,
    '0x6bb04085922d08d1c7de0cfe95f7626a6f54be95',
    UnderlyingAsset['arbeth:eqtyx']
  ),
  arbethErc20(
    'd915f6a3-f37e-4da1-b38e-c8c08cae8365',
    'arbeth:anime',
    'Animecoin',
    18,
    '0x37a645648df29205c6261289983fb04ecd70b4b3',
    UnderlyingAsset['arbeth:anime']
  ),
  arbethErc20(
    '383eadb6-1ea6-4784-8791-3a01bc055dac',
    'arbeth:benji',
    'Franklin OnChain U.S. Government Money Fund',
    18,
    '0xb9e4765bce2609bc1949592059b17ea72fee6c6a',
    UnderlyingAsset['arbeth:benji']
  ),
  opethErc20(
    '8d80fac6-4cbc-447c-b49b-4229cb8aa89d',
    'opeth:link',
    'Chainlink Token',
    18,
    '0x350a791bfc2c21f9ed5d10980dad2e2638ffa7f6',
    UnderlyingAsset['opeth:link']
  ),
  opethErc20(
    'ff6b3a6a-0cfa-419c-a815-31ea72dd7cb9',
    'opeth:usdc',
    'USD Coin',
    6,
    '0x7f5c764cbc14f9669b88837ca1490cca17c31607',
    UnderlyingAsset['opeth:usdc']
  ),
  opethErc20(
    '00abc58e-c1fb-4b9b-8b9a-d609071bb7be',
    'opeth:usdcv2',
    'USD Coin (native)',
    6,
    '0x0b2c639c533813f4aa9d7837caf62653d097ff85',
    UnderlyingAsset['opeth:usdcv2']
  ),
  opethErc20(
    '634d052e-8c1c-47ed-aded-d0a2399439b0',
    'opeth:usdt',
    'Tether USD',
    6,
    '0x94b008aa00579c1307b0ef2c499ad98a8ce58e58',
    UnderlyingAsset['opeth:usdt']
  ),
  opethErc20(
    '949c4e1f-83b8-4ca0-a6dc-72817a8a86e7',
    'opeth:op',
    'Optimism',
    18,
    '0x4200000000000000000000000000000000000042',
    UnderlyingAsset['opeth:op'],
    TOKEN_FEATURES_WITH_FRANKFURT
  ),
  opethErc20(
    '0d045493-8667-4d86-b5c2-d90d2dd38ae5',
    'opeth:exa',
    'Exactly Protocol',
    18,
    '0x1e925de1c68ef83bd98ee3e130ef14a50309c01b',
    UnderlyingAsset['opeth:exa']
  ),
  opethErc20(
    '555ec04f-1149-4f20-be11-2b97cfa4a833',
    'opeth:wld',
    'Worldcoin',
    18,
    '0xdc6ff44d5d932cbd77b52e5612ba0529dc6226f1',
    UnderlyingAsset['opeth:wld']
  ),
  opethErc20(
    'cceb569d-38fe-48f2-a7f5-8d2e414f80a0',
    'opeth:wct',
    'WalletConnect',
    18,
    '0xef4461891dfb3ac8572ccf7c794664a8dd927945',
    UnderlyingAsset['opeth:wct'],
    WCT_FEATURES
  ),
  opethErc20(
    '19dc7cc3-614a-43e7-97f6-986aefbc958f',
    'opeth:spxux',
    'WisdomTree 500 Digital Fund (SPXUX)',
    18,
    '0x1a149e21bd3e74b7018db79c988b4ba3bbc1873d',
    UnderlyingAsset['opeth:spxux']
  ),
  opethErc20(
    '7427c1fe-ad4c-41a6-84c5-2666e7baa20f',
    'opeth:flttx',
    'WisdomTree Floating Rate Treasury Digital Fund',
    18,
    '0xdc8e5a4954b1b4245e910fc17c9b4e4aa407595d',
    UnderlyingAsset['opeth:flttx']
  ),
  opethErc20(
    '1066c0f3-4aab-4e5c-8ca2-a52da00d7b36',
    'opeth:wtsix',
    'WisdomTree Short-Duration Income Digital Fund',
    18,
    '0x69690e156ab458901a4b71c3fc5f5b8a598b931d',
    UnderlyingAsset['opeth:wtsix']
  ),
  opethErc20(
    '616f0a07-84c8-411f-9fa0-301e2ec2fa40',
    'opeth:modrx',
    'WisdomTree Siegel Moderate Digital Fund',
    18,
    '0x06ee92531ff2c8fdb5348b31b41df0f9a3a1ca97',
    UnderlyingAsset['opeth:modrx']
  ),
  opethErc20(
    '31caf4ac-34e3-4da4-afef-16461632821d',
    'opeth:techx',
    'WisdomTree Technology & Innovation 100 Digital Fund',
    18,
    '0x7f259541089253a037e1367ac09beed98f1a7974',
    UnderlyingAsset['opeth:techx']
  ),
  opethErc20(
    'c5ad389e-ce78-4e31-befc-3f380ba36987',
    'opeth:wtsyx',
    'WisdomTree Short-Term Treasury Digital Fund',
    18,
    '0xbe310315ef22d0eb8a91c211a7286b10d21be7fc',
    UnderlyingAsset['opeth:wtsyx']
  ),
  opethErc20(
    'd668023a-aee7-4415-9aec-235c4864368b',
    'opeth:wtlgx',
    'WisdomTree Long Term Treasury Digital Fund',
    18,
    '0x449331e1f93b0dbe0d54a7ce8bb3a5585f27848a',
    UnderlyingAsset['opeth:wtlgx']
  ),
  opethErc20(
    '52fcc1be-29cd-4244-b8a2-0b0a4e4be160',
    'opeth:wttsx',
    'WisdomTree 3-7 Year Treasury Digital Fund',
    18,
    '0x401e7e6558507764805a545f61c049361aa7a7cb',
    UnderlyingAsset['opeth:wttsx']
  ),
  opethErc20(
    'a93b6916-2d6e-4034-9b2e-59f9da648447',
    'opeth:tipsx',
    'WisdomTree TIPS Digital Fund',
    18,
    '0xbe0917f9d9d8a97e5ee0796831e0b05a1edc8437',
    UnderlyingAsset['opeth:tipsx']
  ),
  opethErc20(
    'ceb36c00-87b1-4617-8380-a744bbf21dea',
    'opeth:wtstx',
    'WisdomTree 7-10 Year Treasury Digital Fund',
    18,
    '0x15f0fb408097ce442482a127edc23371b0201964',
    UnderlyingAsset['opeth:wtstx']
  ),
  opethErc20(
    '669694f3-94ed-43da-a35a-cb03a721e9da',
    'opeth:wtgxx',
    'WisdomTree Government Money Market Digital Fund',
    18,
    '0x870fd36b3bf7f5abeeea2c8d4abdf1dc4e33109d',
    UnderlyingAsset['opeth:wtgxx']
  ),
  opethErc20(
    '42729d3e-e010-43a9-91ea-378565b0aa51',
    'opeth:lngvx',
    'WisdomTree Siegel Longevity Digital Fund',
    18,
    '0xf5fe77f469e598ecd2c08e5f874c206f8cfee807',
    UnderlyingAsset['opeth:lngvx']
  ),
  opethErc20(
    '3b200233-f137-4b3c-80fe-16e7beb637b6',
    'opeth:eqtyx',
    'WisdomTree Siegel Global Equity Digital Fund',
    18,
    '0x8ac0d6b94ae23ad40407bc4dc16d74f09131eb48',
    UnderlyingAsset['opeth:eqtyx']
  ),
  topethErc20(
    '3c06bc28-1af2-4869-a632-bd081376fb46',
    'topeth:terc18dp',
    'Optimism Test ERC Token 18 Decimals',
    18,
    '0xe9df68a54bba438c8a6192e95f0f2c53ac93d997',
    UnderlyingAsset['topeth:terc18dp']
  ),
  topethErc20(
    'fa6bc0a9-49f8-4516-88b7-cad6a62f1dc2',
    'topeth:wct',
    'Wallet Connect',
    18,
    '0x75bb6dca2cd6f9a0189c478bbb8f7ee2fef07c78',
    UnderlyingAsset['topeth:wct'],
    WCT_FEATURES
  ),
  zkethErc20(
    '53f0e845-f415-44d3-8517-7565dc346390',
    'zketh:link',
    'Chainlink Token',
    18,
    '0x082fade8b84b18c441d506e1d3a43a387cc59d20',
    UnderlyingAsset['zketh:link']
  ),
  tzkethErc20(
    'ef49b6d1-b7a7-4c5c-8c53-43d22c15cc17',
    'tzketh:link',
    'zkSync Test LINK',
    18,
    '0xcccb29bac5ad81290383643c6fb38130cda9d881',
    UnderlyingAsset['tzketh:link']
  ),
  beraErc20(
    'ef833f4e-7617-4c6d-8a1f-1fef0dd1dd0e',
    'bera:bgt',
    'BGT Token',
    18,
    '0x656b95e550c07a9ffe548bd4085c72418ceb1dba',
    UnderlyingAsset['bera:bgt'],
    BERA_BGT_FEATURES
  ),
  beraErc20(
    'a2b9e15b-4196-494c-b86a-f4fa9dcee13b',
    'bera:dolo',
    'Dolomite',
    18,
    '0x0f81001ef0a83ecce5ccebf63eb302c70a39a654',
    UnderlyingAsset['bera:dolo']
  ),
  beraErc20(
    'ca86baf8-fcc6-40ff-9d65-08db513a131e',
    'bera:honey',
    'Honey Token',
    18,
    '0xfcbd14dc51f0a4d49d5e53c2e0950e0bc26d0dce',
    UnderlyingAsset['bera:honey'],
    BERA_BGT_FEATURES
  ),
  beraErc20(
    '31cdb51f-3bcc-489e-8b35-8e074169c573',
    'bera:usdc',
    'USDC Token',
    18,
    // TODO: the mainnet contract address is still not available, adding placeholder here, WIN-3597
    '0xbda130737bdd9618301681329bf2e46a016ff9a0',
    UnderlyingAsset['bera:usdc']
  ),
  beraErc20(
    'd7b6efe9-4ce2-4f23-9a31-adba41900716',
    'bera:ibera',
    'Infrared Bera',
    18,
    '0x9b6761bf2397bb5a6624a856cc84a3a14dcd3fe5',
    UnderlyingAsset['bera:ibera']
  ),
  tberaErc20(
    '24af5e18-ab4b-43e5-80db-0ddb9beb01b3',
    'tbera:bgt',
    'Bera Testnet BGT',
    18,
    '0xbda130737bdd9618301681329bf2e46a016ff9ad',
    UnderlyingAsset['tbera:bgt']
  ),
  tberaErc20(
    '5fb4ca32-0bce-4f29-bef3-aebff61ed00c',
    'tbera:honey',
    'Bera Testnet Honey',
    18,
    '0x0e4aaf1351de4c0264c5c7056ef3777b41bd8e03',
    UnderlyingAsset['tbera:honey']
  ),
  tberaErc20(
    '7319878e-96ca-4a97-bad8-b4b9d040b94b',
    'tbera:usdc',
    'Bera Testnet USDC',
    18,
    '0xd6d83af58a19cd14ef3cf6fe848c9a4d21e5727c',
    UnderlyingAsset['tbera:usdc']
  ),
  tberaErc20(
    'f46242ce-dd4a-44c9-8b52-ef6dfaae1d79',
    'tbera:ibera',
    'Testnet Infrared Bera',
    18,
    '0x5bdc3cae6fb270ef07579c428bb630e73c8d623b',
    UnderlyingAsset['tbera:ibera']
  ),
  coredaoErc20(
    '7dfd048f-7718-46e7-8cdb-864a3fc27b1b',
    'coredao:stcore',
    'stCore Token',
    18,
    '0xb3a8f0f0da9ffc65318aa39e55079796093029ad',
    UnderlyingAsset['coredao:stcore']
  ),
  tcoredaoErc20(
    'b4448868-8beb-4dd8-b607-3b36e11f1df4',
    'tcoredao:stcore',
    'Testnet stCore token',
    18,
    '0x6401f24ef7c54032f4f54e67492928973ab87650',
    UnderlyingAsset['tcoredao:stcore']
  ),
  txrpToken(
    '8ef16158-1015-4a67-b6fe-db669c18ab2b',
    'txrp:tst-rP9jPyP5kyvFRb6ZiRghAGw5u8SGAmU4bd',
    'XRPL Testnet Token',
    15,
    'rP9jPyP5kyvFRb6ZiRghAGw5u8SGAmU4bd',
    'TST',
    'rP9jPyP5kyvFRb6ZiRghAGw5u8SGAmU4bd::TST',
    'xrpl.org',
    UnderlyingAsset['txrp:tst-rP9jPyP5kyvFRb6ZiRghAGw5u8SGAmU4bd']
  ),
  txrpToken(
    '4c472d5f-0b9f-4086-9ff6-dcce51fce7fc',
    'txrp:rlusd',
    'RLUSD',
    15,
    'rQhWct2fv4Vc4KRjRgMrxa8xPN9Zx9iLKV',
    '524C555344000000000000000000000000000000',
    'rQhWct2fv4Vc4KRjRgMrxa8xPN9Zx9iLKV::524C555344000000000000000000000000000000',
    'ripple.com',
    UnderlyingAsset['txrp:rlusd']
  ),
  xrpToken(
    'a5e3e409-4cde-443d-9000-22bfc99ad456',
    'xrp:rlusd',
    'Ripple USD',
    15,
    'rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De',
    '524C555344000000000000000000000000000000',
    'rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De::524C555344000000000000000000000000000000',
    'ripple.com',
    UnderlyingAsset['xrp:rlusd']
  ),
  xrpToken(
    'd6d5ff31-c539-4ea7-ae62-a6d986190234',
    'xrp:tbill',
    'OpenEden T-Bills',
    15,
    'rJNE2NNz83GJYtWVLwMvchDWEon3huWnFn',
    'TBL',
    'rJNE2NNz83GJYtWVLwMvchDWEon3huWnFn::TBL',
    'openeden.com',
    UnderlyingAsset['xrp:tbill'],
    AccountCoin.DEFAULT_FEATURES_EXCLUDE_SINGAPORE
  ),
  txrpToken(
    '155818c4-efda-4758-bb25-37c093b6dc02',
    'txrp:xat',
    'XRP ATL Token',
    15,
    'rHy7UVhwM7Xgo4SoUTf5hE5yWKZKPEkxcL',
    '5841540000000000000000000000000000000000',
    'rHy7UVhwM7Xgo4SoUTf5hE5yWKZKPEkxcL::5841540000000000000000000000000000000000',
    'xat.com',
    UnderlyingAsset['txrp:xat']
  ),
  xrpToken(
    '88a010ca-8666-493e-b534-725fa6851da3',
    'xrp:xsgd',
    'XSGD',
    15,
    'rK67JczCpaYXVtfw3qJVmqwpSfa1bYTptw',
    '5853474400000000000000000000000000000000',
    'rK67JczCpaYXVtfw3qJVmqwpSfa1bYTptw::5853474400000000000000000000000000000000',
    'straitsx.com',
    UnderlyingAsset['xrp:xsgd']
  ),
  xrpToken(
    'a47c9171-6cb5-487a-a467-7bc131b93ed3',
    'xrp:veur',
    'VNX Euro',
    15,
    'rLPtwF4FZi8bNVmbQ8JgoDUooozhwMNXr3',
    '5645555200000000000000000000000000000000',
    'rLPtwF4FZi8bNVmbQ8JgoDUooozhwMNXr3::5645555200000000000000000000000000000000',
    'vnx.li',
    UnderlyingAsset['xrp:veur']
  ),
  xrpToken(
    '09517f5b-06b8-438a-bdb8-af3f62089ba9',
    'xrp:vchf',
    'VNX Swiss Frank',
    15,
    'rLPtwF4FZi8bNVmbQ8JgoDUooozhwMNXr3',
    '5643484600000000000000000000000000000000',
    'rLPtwF4FZi8bNVmbQ8JgoDUooozhwMNXr3::5643484600000000000000000000000000000000',
    'vnx.li',
    UnderlyingAsset['xrp:vchf']
  ),
  xrpToken(
    '78e89b34-dfc8-4122-918c-0b05281f76cc',
    'xrp:vgbp',
    'VNX Pound',
    15,
    'rLPtwF4FZi8bNVmbQ8JgoDUooozhwMNXr3',
    '5647425000000000000000000000000000000000',
    'rLPtwF4FZi8bNVmbQ8JgoDUooozhwMNXr3::5647425000000000000000000000000000000000',
    'vnx.li',
    UnderlyingAsset['xrp:vgbp']
  ),
  xrpToken(
    'a2ae3eef-a5b3-4140-b971-5090798fed3a',
    'xrp:solo',
    'Sologenic',
    15,
    'rsoLo2S1kiGeCcn6hCUXVrCpGMWLrRrLZz',
    '534F4C4F00000000000000000000000000000000',
    'rsoLo2S1kiGeCcn6hCUXVrCpGMWLrRrLZz::534F4C4F00000000000000000000000000000000',
    'sologenic.com',
    UnderlyingAsset['xrp:solo']
  ),
  xrpToken(
    'b8b52e22-257d-4c47-95be-1b2aff2d8b35',
    'xrp:aau',
    'Archax',
    15,
    'rKCu4CucpepQ6N89c8T5GuX2jkxzCST18Q',
    'AAU',
    'rKCu4CucpepQ6N89c8T5GuX2jkxzCST18Q::AAU',
    'archax.com',
    UnderlyingAsset['xrp:aau']
  ),
  txrpToken(
    '80cbaecf-b1ea-4811-97ae-213c1ffc9175',
    'txrp:xsgd',
    'XSGD',
    15,
    'rKgjEa9gEyyumaJsfkPq9uSAyaecQRmvYD',
    '5853474400000000000000000000000000000000',
    'rKgjEa9gEyyumaJsfkPq9uSAyaecQRmvYD::5853474400000000000000000000000000000000',
    'straitsx.com',
    UnderlyingAsset['txrp:xsgd']
  ),
  suiToken(
    'f26941b7-1110-4aa7-a2bc-29807297a51c',
    'sui:deep',
    'Deepbook',
    6,
    '0xdeeb7a4662eec9f2f3def03fb937a663dddaa2e215b8078a284d026b7946c270',
    'deep',
    'DEEP',
    '0xdeeb7a4662eec9f2f3def03fb937a663dddaa2e215b8078a284d026b7946c270::deep::DEEP',
    UnderlyingAsset['sui:deep'],
    SUI_TOKEN_FEATURES
  ),
  suiToken(
    'd868246d-a0e4-4ed3-ac9b-54ff45cf49c1',
    'sui:suins',
    'SuiNS',
    6,
    '0x5145494a5f5100e645e4b0aa950fa6b68f614e8c59e17bc5ded3495123a79178',
    'ns',
    'NS',
    '0x5145494a5f5100e645e4b0aa950fa6b68f614e8c59e17bc5ded3495123a79178::ns::NS',
    UnderlyingAsset['sui:suins'],
    SUI_TOKEN_FEATURES
  ),
  suiToken(
    '6ba90645-42ba-47d8-ba09-8b00228bfe33',
    'sui:fdusd',
    'First Digital USD',
    6,
    '0xf16e6b723f242ec745dfd7634ad072c42d5c1d9ac9d62a39c381303eaa57693a',
    'fdusd',
    'FDUSD',
    '0xf16e6b723f242ec745dfd7634ad072c42d5c1d9ac9d62a39c381303eaa57693a::fdusd::FDUSD',
    UnderlyingAsset['sui:fdusd'],
    SUI_TOKEN_FEATURES
  ),
  suiToken(
    'e78941b5-9c34-4198-9c2c-cb9e27d4dde7',
    'sui:usdc',
    'USDC',
    6,
    '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7',
    'usdc',
    'USDC',
    '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC',
    UnderlyingAsset['sui:usdc'],
    SUI_TOKEN_FEATURES
  ),
  suiToken(
    'b3729af5-033b-495f-bab6-b5225c8f27e7',
    'sui:wusdc',
    'Wormhole USDC',
    6,
    '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf',
    'wusdc',
    'WUSDC',
    '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::wusdc::WUSDC',
    UnderlyingAsset['sui:wusdc'],
    SUI_TOKEN_FEATURES
  ),
  suiToken(
    '97617c48-004c-4222-9eff-d77d10ce8443',
    'sui:sca',
    'Scallop',
    9,
    '0x7016aae72cfc67f2fadf55769c0a7dd54291a583b63051a5ed71081cce836ac6',
    'sca',
    'SCA',
    '0x7016aae72cfc67f2fadf55769c0a7dd54291a583b63051a5ed71081cce836ac6::sca::SCA',
    UnderlyingAsset['sui:sca'],
    SUI_TOKEN_FEATURES
  ),
  suiToken(
    'a4e5ab0e-5051-4ccc-a04c-c43ae3d9dcfa',
    'sui:times',
    'Darktimes',
    5,
    '0x46fbe54691b27d7abd2c9e5a01088913531f241b98f3c2351f8215e45cc17a4c',
    'times',
    'TIMES',
    '0x46fbe54691b27d7abd2c9e5a01088913531f241b98f3c2351f8215e45cc17a4c::times::TIMES',
    UnderlyingAsset['sui:times'],
    SUI_TOKEN_FEATURES
  ),
  suiToken(
    'a7b13b4a-60b3-4167-b2db-5bbb46f8f603',
    'sui:fud',
    'Fud',
    5,
    '0x76cb819b01abed502bee8a702b4c2d547532c12f25001c9dea795a5e631c26f1',
    'fud',
    'FUD',
    '0x76cb819b01abed502bee8a702b4c2d547532c12f25001c9dea795a5e631c26f1::fud::FUD',
    UnderlyingAsset['sui:fud'],
    SUI_TOKEN_FEATURES
  ),
  suiToken(
    '0d35b697-01f6-4694-a5b1-283ecfd733ac',
    'sui:afsui',
    'afSUI',
    9,
    '0xf325ce1300e8dac124071d3152c5c5ee6174914f8bc2161e88329cf579246efc',
    'afsui',
    'AFSUI',
    '0xf325ce1300e8dac124071d3152c5c5ee6174914f8bc2161e88329cf579246efc::afsui::AFSUI',
    UnderlyingAsset['sui:afsui'],
    SUI_TOKEN_FEATURES
  ),
  suiToken(
    'af864118-e9ec-47b2-896c-735f0530fb8f',
    'sui:navx',
    'navx',
    9,
    '0xa99b8952d4f7d947ea77fe0ecdcc9e5fc0bcab2841d6e2a5aa00c3044e5544b5',
    'navx',
    'NAVX',
    '0xa99b8952d4f7d947ea77fe0ecdcc9e5fc0bcab2841d6e2a5aa00c3044e5544b5::navx::NAVX',
    UnderlyingAsset['sui:navx'],
    SUI_TOKEN_FEATURES
  ),
  suiToken(
    '4f2ad1be-7c21-4e15-b8c6-d2329d6b7ffc',
    'sui:vsui',
    'vsui',
    9,
    '0x549e8b69270defbfafd4f94e17ec44cdbdd99820b33bda2278dea3b9a32d3f55',
    'vsui',
    'VSUI',
    '0x549e8b69270defbfafd4f94e17ec44cdbdd99820b33bda2278dea3b9a32d3f55::vsui::VSUI',
    UnderlyingAsset['sui:vsui'],
    SUI_TOKEN_FEATURES
  ),
  suiToken(
    '705d1458-d5e6-4eaa-8a34-51e65cc68dec',
    'sui:send',
    'Suilend',
    6,
    '0xb45fcfcc2cc07ce0702cc2d229621e046c906ef14d9b25e8e4d25f6e8763fef7',
    'send',
    'SEND',
    '0xb45fcfcc2cc07ce0702cc2d229621e046c906ef14d9b25e8e4d25f6e8763fef7::send::SEND',
    UnderlyingAsset['sui:send'],
    SUI_TOKEN_FEATURES
  ),
  suiToken(
    '08eb85c1-19e6-41aa-9b16-8964d6aeba31',
    'sui:cetus',
    'Cetus',
    9,
    '0x06864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b',
    'cetus',
    'CETUS',
    '0x06864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b::cetus::CETUS',
    UnderlyingAsset['sui:cetus'],
    SUI_TOKEN_FEATURES
  ),
  suiToken(
    '9b6a8372-5d8a-41d1-8074-d53e59b2e513',
    'sui:wal',
    'Walrus',
    9,
    '0x356a26eb9e012a68958082340d4c4116e7f55615cf27affcff209cf0ae544f59',
    'wal',
    'WAL',
    '0x356a26eb9e012a68958082340d4c4116e7f55615cf27affcff209cf0ae544f59::wal::WAL',
    UnderlyingAsset['sui:wal'],
    SUI_TOKEN_FEATURES_STAKING
  ),
  tsuiToken(
    '0b8a7919-c37e-4be8-8338-7fc13c6c875e',
    'tsui:deep',
    'Deepbook',
    6,
    '0x36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8',
    'deep',
    'DEEP',
    '0x36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8::deep::DEEP',
    UnderlyingAsset['tsui:deep'],
    SUI_TOKEN_FEATURES
  ),
  tsuiToken(
    '6ecd0f49-96dd-42eb-83d6-519e7dcddee2',
    'tsui:wal',
    'Walrus',
    9,
    '0x8190b041122eb492bf63cb464476bd68c6b7e570a4079645a8b28732b6197a82',
    'wal',
    'WAL',
    '0x8190b041122eb492bf63cb464476bd68c6b7e570a4079645a8b28732b6197a82::wal::WAL',
    UnderlyingAsset['tsui:wal'],
    SUI_TOKEN_FEATURES_STAKING
  ),
  aptToken(
    'e8bfdab3-4ef6-4b39-9450-d9cb59593f7a',
    'apt:usdt',
    'USD Tether',
    6,
    '0x357b0b74bc833e95a115ad22604854d6b0fca151cecd94111770e5d6ffc9dc2b',
    UnderlyingAsset['apt:usdt'],
    APT_FEATURES
  ),
  aptToken(
    'bf82aa75-88a8-4010-91cf-b8811cf4b763',
    'apt:usdc',
    'USD Coin',
    6,
    '0xbae207659db88bea0cbead6da0ed00aac12edcdda169e591cd41c94180b46f3b',
    UnderlyingAsset['apt:usdc'],
    APT_FEATURES
  ),
  aptToken(
    '3d29adfb-7df5-4295-a3c2-acdf3f23adc2',
    'apt:pact',
    'PACT',
    8,
    '0xc546cc2dd26d9e9a4516b4514288bedf1085259fcb106b84b6469337f527fb92',
    UnderlyingAsset['apt:pact'],
    APT_FEATURES
  ),
  aptToken(
    '8127e6cf-7255-4351-b5da-cce6eca9a5aa',
    'apt:benji',
    'Frk OnChain US Gov Mon Fd',
    9,
    '0x7b5e9cac3433e9202f28527f707c89e1e47b19de2c33e4db9521a63ad219b739',
    UnderlyingAsset['apt:benji'],
    APT_FEATURES
  ),
  taptToken(
    '2695e728-96dd-46e6-9d01-bd0fdbe1ff38',
    'tapt:usdt',
    'USD Tether',
    6,
    '0xd5d0d561493ea2b9410f67da804653ae44e793c2423707d4f11edb2e38192050',
    UnderlyingAsset['tapt:usdt'],
    APT_FEATURES
  ),
  aptNFTCollection(
    '3672e359-d96d-46fc-9a37-9c87c1d52a86',
    'apt:h00ts',
    'H00ts',
    '0x1093cde390746ccb86d1d8440b9fe8e812322714226b11618ea42e572d23128c',
    UnderlyingAsset['apt:h00ts'],
    APT_FEATURES
  ),
  taptNFTCollection(
    '8f222afb-99b5-4811-b7d0-3a0753b8be74',
    'tapt:nftcollection1',
    'BitGo Apt NFT Collection (Test) #1',
    '0xbbc561fbfa5d105efd8dfb06ae3e7e5be46331165b99d518f094c701e40603b5',
    UnderlyingAsset['tapt:nftcollection1'],
    APT_FEATURES
  ),
  taptNFTCollection(
    'f4230725-6add-4a54-b5be-61b3c2d29566',
    'tapt:beta3loanbook',
    'beta 3 Loan Book',
    '0x14d44152cb1050277338ab6c58416e074d4a34ddf431978b41b5a9d14f9884f2',
    UnderlyingAsset['tapt:beta3loanbook'],
    APT_FEATURES
  ),
  fiat('3f89b1f5-4ada-49c0-a613-15e484d42426', 'fiatusd', 'US Dollar', Networks.main.fiat, 2, UnderlyingAsset.USD),
  fiat(
    '8691cc4f-a425-4192-b6cb-3b0b6f646cbc',
    'tfiatusd',
    'Testnet US Dollar',
    Networks.test.fiat,
    2,
    UnderlyingAsset.USD
  ),
  fiat(
    '298702fc-1bea-4c8a-95d2-ca49c2895d8e',
    'fiateur',
    'European Union Euro',
    Networks.main.fiat,
    2,
    UnderlyingAsset.EUR
  ),
  fiat(
    '5d22d71c-49a7-42ff-8367-744b59b5fe88',
    'tfiateur',
    'Testnet European Union Euro',
    Networks.test.fiat,
    2,
    UnderlyingAsset.EUR
  ),
  fiat(
    '4718054b-894c-431c-9339-43aa1620acdd',
    'fiatgbp',
    'British Pound Sterling',
    Networks.main.fiat,
    2,
    UnderlyingAsset.GBP
  ),
  fiat(
    'c32e8edc-ec51-4084-9b81-3426605f13b9',
    'tfiatgbp',
    'Testnet British Pound Sterling',
    Networks.test.fiat,
    2,
    UnderlyingAsset.GBP
  ),
  fiat(
    '414d69c3-8da1-460a-add3-ef26453fc76c',
    'fiataed',
    'United Arab Emirates Dirham',
    Networks.main.fiat,
    2,
    UnderlyingAsset.AED
  ),
  fiat(
    '47f21e91-c2e0-4aaf-a0c8-e8bb3126688c',
    'tfiataed',
    'Testnet United Arab Emirates Dirham',
    Networks.test.fiat,
    2,
    UnderlyingAsset.AED
  ),
  fiat(
    'd5f087f0-acc8-4cc3-aaff-dd7f183099db',
    'fiatsgd',
    'Singapore Dollar',
    Networks.main.fiat,
    2,
    UnderlyingAsset.SGD
  ),
  fiat(
    '61c863bc-9e22-457c-b6f2-dcab35f32ff6',
    'tfiatsgd',
    'Testnet Singapore Dollar',
    Networks.test.fiat,
    2,
    UnderlyingAsset.SGD
  ),
]);

export function createToken(token: AmsTokenConfig): Readonly<BaseCoin> | undefined {
  const initializerMap: Record<string, unknown> = {
    algo: algoToken,
    apt: aptToken,
    arbeth: arbethErc20,
    avaxc: avaxErc20,
    bera: beraErc20,
    bsc: bscToken,
    celo: celoToken,
    eth: erc20,
    eos: eosToken,
    hbar: hederaToken,
    near: nep141Token,
    opeth: opethErc20,
    polygon: polygonErc20,
    sol: solToken,
    stx: sip10Token,
    sui: suiToken,
    trx: tronToken,
    xlm: stellarToken,
    xrp: xrpToken,
    ofc: ofcToken,
  };

  const family = token.family;
  const initializer = initializerMap[family] as (...args: unknown[]) => Readonly<BaseCoin>;
  if (!initializer) {
    return undefined;
  }

  const commonArgs = [
    token.id,
    token.name,
    token.fullName,
    token.decimalPlaces,
    token.asset,
    token.features,
    token.prefix,
    token.suffix,
    token.network,
    token.primaryKeyCurve,
  ];

  switch (family) {
    case 'arbeth':
    case 'avax':
    case 'bera':
    case 'bsc':
    case 'celo':
    case 'eth':
    case 'opeth':
    case 'polygon':
    case 'trx':
      return initializer(
        ...commonArgs.slice(0, 4), // id, name, fullName, decimalPlaces
        token.contractAddress || token.tokenAddress, // contractAddress
        ...commonArgs.slice(4) // asset, features, prefix, suffix, network, primaryKeyCurve
      );

    case 'apt':
      const { initFunc, objectId } = getAptTokenInitializer(token);
      return initFunc(
        ...commonArgs.slice(0, 4), // id, name, fullName, decimalPlaces
        objectId,
        ...commonArgs.slice(4) // asset, features, prefix, suffix, network, primaryKeyCurve
      );

    case 'stx':
      return initializer(
        ...commonArgs.slice(0, 4), // id, name, fullName, decimalPlaces
        token.assetId, // assetId
        ...commonArgs.slice(4) // asset, features, prefix, suffix, network, primaryKeyCurve
      );

    case 'algo':
      return initializer(
        ...commonArgs.slice(0, 2), // id, name
        token.alias, // alias
        ...commonArgs.slice(2) // fullName, decimal, asset, features, prefix, suffix, network, primaryKeyCurve
      );

    case 'eos':
      return initializer(
        ...commonArgs.slice(0, 4), // id, name, fullName, decimalPlaces
        token.contractName, // contractName
        token.contractAddress, // contractAddress
        ...commonArgs.slice(4) // asset, features, prefix, suffix, network, primaryKeyCurve
      );

    case 'hbar':
      return initializer(
        ...commonArgs.slice(0, 3), // id, name, fullName
        token.network, // network
        token.decimalPlaces,
        token.asset,
        token.tokenId, // tokenId
        token.contractAddress, // contractAddress
        ...commonArgs.slice(5, 8), // features, prefix, suffix
        token.primaryKeyCurve
      );

    case 'sol':
      return initializer(
        ...commonArgs.slice(0, 4), // id, name, fullName, decimalPlaces
        token.tokenAddress, // tokenAddress
        token.contractAddress, // contractAddress
        ...commonArgs.slice(4) // asset, features, prefix, suffix, network, primaryKeyCurve
      );

    case 'sui':
      return initializer(
        ...commonArgs.slice(0, 4), // id, name, fullName, decimalPlaces
        token.packageId, // packageId
        token.module, // module
        token.symbol, // symbol
        token.contractAddress, // contractAddress
        ...commonArgs.slice(4) // asset, features, prefix, suffix, network, primaryKeyCurve
      );

    case 'xlm':
      return initializer(
        ...commonArgs.slice(0, 5), // id, name, fullName, decimalPlaces, asset
        token.domain, // domain
        ...commonArgs.slice(5) // features, prefix, suffix, network, primaryKeyCurve
      );

    case 'xrp':
      return initializer(
        ...commonArgs.slice(0, 4), // id, name, fullName, decimalPlaces
        token.issuerAddress, // issuerAddress
        token.currecnycode, // currencyCode
        token.contractAddress, // contractAddress
        token.domain, // domain
        ...commonArgs.slice(4) // asset, features, prefix, suffix, network, primaryKeyCurve
      );
    case 'ofc':
      return initializer(
        ...commonArgs, // id, name, fullName, decimalPlaces, asset, prefix, suffix, network, primaryKeyCurve
        token.baseUnit, // baseUnit
        token.isToken, // isToken
        token.kind // kind
      );
    default:
      return undefined;
  }
}

function getAptTokenInitializer(token: AmsTokenConfig) {
  if (token.assetId) {
    // used for fungible-assets / legacy coins etc.
    return {
      initFunc: aptToken as (...args: unknown[]) => Readonly<BaseCoin>,
      objectId: token.assetId,
    };
  }
  // used for non-fungible token (NFT) collections
  return {
    initFunc: aptNFTCollection as (...args: unknown[]) => Readonly<BaseCoin>,
    objectId: token.nftCollectionId,
  };
}

export function isCoinPresentInCoinMap({ name, id, alias }: { name: string; id?: string; alias?: string }): boolean {
  return Boolean(coins.has(name) || (id && coins.has(id)) || (alias && coins.has(alias)));
}

export function createTokenMapUsingConfigDetails(tokenConfigMap: Record<string, AmsTokenConfig[]>): CoinMap {
  const BaseCoins: Map<string, Readonly<BaseCoin>> = new Map();

  const nftAndOtherTokens = new Set([
    'erc721:bsctoken',
    'terc721:bsctoken',
    'erc1155:bsctoken',
    'terc1155:bsctoken',
    'erc721:witch',
    'erc721:token',
    'erc1155:token',
    'nonstandard:token',
    'terc721:token',
    'terc1155:token',
    'tnonstandard:token',
    'terc721:bitgoerc721',
    'terc1155:bitgoerc1155',
    'erc721:polygontoken',
    'erc1155:polygontoken',
    'terc721:polygontoken',
    'terc1155:polygontoken',
    'erc721:soneiumtoken',
    'erc1155:soneiumtoken',
    'terc721:soneiumtoken',
    'terc1155:soneiumtoken',
  ]);

  // Add all the coins from statics coin map first
  coins.forEach((coin, coinName) => {
    BaseCoins.set(coinName, coin);
  });

  // add the tokens not present in the static coin map
  for (const tokenConfigs of Object.values(tokenConfigMap)) {
    const tokenConfig = tokenConfigs[0];

    if (
      !isCoinPresentInCoinMap({ ...tokenConfig }) &&
      tokenConfig.isToken &&
      !nftAndOtherTokens.has(tokenConfig.name)
    ) {
      const token = createToken(tokenConfig);
      if (token) {
        BaseCoins.set(token.name, token);
      }
    }
  }

  return CoinMap.fromCoins(Array.from(BaseCoins.values()));
}

export function createTokenMapUsingTrimmedConfigDetails(
  reducedTokenConfigMap: Record<string, TrimmedAmsTokenConfig[]>
): CoinMap {
  const amsTokenConfigMap: Record<string, AmsTokenConfig[]> = {};
  const networkNameMap = new Map(
    Object.values(Networks).flatMap((networkType) =>
      Object.values(networkType).map((network) => [network.name, network])
    )
  );

  for (const tokenConfigs of Object.values(reducedTokenConfigMap)) {
    const tokenConfig = tokenConfigs[0];
    const network = networkNameMap.get(tokenConfig.network.name);
    if (
      !isCoinPresentInCoinMap({ ...tokenConfig }) &&
      network &&
      tokenConfig.isToken &&
      networkFeatureMapForTokens[network.family]
    ) {
      const features = new Set([
        ...(networkFeatureMapForTokens[network.family] || []),
        ...(tokenConfig.additionalFeatures || []),
      ]);
      tokenConfig.excludedFeatures?.forEach((feature) => features.delete(feature));
      amsTokenConfigMap[tokenConfig.name] = [{ ...tokenConfig, features: Array.from(features), network }];
    }
  }

  return createTokenMapUsingConfigDetails(amsTokenConfigMap);
}
