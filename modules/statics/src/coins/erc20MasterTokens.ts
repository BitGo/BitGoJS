/* eslint-disable */
// @ts-nocheck
/**
 * Master ERC20 Token Configuration
 *
 * This file contains the combined on-chain (ERC20/tERC20) and off-chain (OFC/tOFC) token configurations.
 * Each token entry contains:
 * - underlyingAsset: The shared underlying asset identifier
 * - fullName: The human-readable token name
 * - decimalPlaces: Token decimal places
 * - isTestnet: Optional flag indicating if this is a testnet token (defaults to false/mainnet)
 * - features: Optional common features (when same for both on-chain and off-chain)
 * - onchain: Optional ERC20-specific configuration (id, name, contractAddress, features)
 * - offchain: Optional OFC-specific configuration (id, name, kind, features)
 *
 * Note: Some tokens may only have onchain or offchain configuration, not both.
 */

import { CoinFeature, UnderlyingAsset } from '../base';
import { AccountCoin } from '../account';
import { Networks, EthereumNetwork, OfcNetwork } from '../networks';
import {
  ACCOUNT_COIN_DEFAULT_FEATURES,
  ACCOUNT_COIN_DEFAULT_FEATURES_EXCLUDE_MENA_FZE,
  EIGEN_FEATURES,
  ETH_FEATURES,
  ETH_FEATURES_WITH_FRANKFURT,
  ETH_FEATURES_WITH_FRANKFURT_EXCLUDE_SINGAPORE,
  ETH_FEATURES_WITH_FRANKFURT_GERMANY,
  ETH_FEATURES_WITH_GERMANY,
  HTETH_TOKEN_FEATURES,
  MATIC_FEATURES,
  MATIC_FEATURES_WITH_FRANKFURT,
  POL_FEATURES,
  RETH_ROCKET_FEATURES,
  TOKEN_FEATURES_WITH_NY_GERMANY_FRANKFURT,
  TOKEN_FEATURES_WITH_SWISS,
  TWETH_FEATURES,
  WETH_FEATURES,
  ZETA_EVM_FEATURES,
  ACCOUNT_COIN_DEFAULT_FEATURES_EXCLUDE_SINGAPORE_AND_MENA_FZE,
  ACCOUNT_COIN_DEFAULT_FEATURES_EXCLUDE_SINGAPORE,
} from '../coinFeatures';

function underlyingAssetForSymbol(underlyingAssetValue: string): UnderlyingAsset {
  return (
    Object.values(UnderlyingAsset).find((value) => value === underlyingAssetValue) || UnderlyingAsset.INVALID_UNKNOWN
  );
}

export interface Erc20MasterTokenOnchain {
  id: string;
  name: string;
  contractAddress: string;
  features?: CoinFeature[];
  network?: EthereumNetwork;
}

export interface Erc20MasterTokenOffchain {
  id: string;
  name: string;
  kind?: string;
  features?: CoinFeature[];
  network?: OfcNetwork;
  addressCoin?: string;
}

export interface Erc20MasterToken {
  underlyingAsset: UnderlyingAsset;
  fullName: string;
  decimalPlaces: number;
  isTestnet?: boolean;
  features?: CoinFeature[];
  onchain?: Erc20MasterTokenOnchain;
  offchain?: Erc20MasterTokenOffchain;
}

export const erc20MasterTokens: Erc20MasterToken[] = [
  {
    underlyingAsset: UnderlyingAsset['eth:kava'],
    fullName: 'Kava',
    decimalPlaces: 6,
    onchain: {
      id: '3cdd1d41-b561-4c0c-aa82-72c52ebe69e5',
      name: 'eth:kava',
      contractAddress: '0x0c356b7fd36a5357e5a017ef11887ba100c9ab76',
    },
    offchain: {
      id: '2c863d38-6d3b-438a-983d-79f20aff030a',
      name: 'ofceth:kava',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:iq'],
    fullName: 'IQ',
    decimalPlaces: 18,
    onchain: {
      id: '0b22028a-fa33-47e3-9b4d-b32173b53ab6',
      name: 'eth:iq',
      contractAddress: '0x579cea1889991f68acc35ff5c3dd0621ff29b0c9',
    },
    offchain: {
      id: 'd8859661-8695-4645-a519-24063019ab82',
      name: 'ofceth:iq',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:iris'],
    fullName: 'IRISnet',
    decimalPlaces: 6,
    onchain: {
      id: '04d29dd7-7167-4f5e-83ab-5a8690e2daaf',
      name: 'eth:iris',
      contractAddress: '0x76c4a2b59523eae19594c630aab43288dbb1463f',
    },
    offchain: {
      id: 'cb202cff-d8de-4e1c-9b4f-c096fd888f72',
      name: 'ofceth:iris',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:uco'],
    fullName: 'Archethic Universal Coin',
    decimalPlaces: 8,
    onchain: {
      id: '11506670-9b97-4ade-ae56-4b9c883de952',
      name: 'eth:uco',
      contractAddress: '0x1a688d3d294ee7bcc1f59011de93d608dc21c377',
    },
    offchain: {
      id: '03fc7083-15c1-4a9f-9029-5b5342f2f11e',
      name: 'ofceth:uco',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:cet'],
    fullName: 'CoinEx Token',
    decimalPlaces: 18,
    onchain: {
      id: '28351723-6c8a-4db3-9ebf-d6a1a5f0cb17',
      name: 'eth:cet',
      contractAddress: '0x081f67afa0ccf8c7b17540767bbe95df2ba8d97f',
    },
    offchain: {
      id: '26fbd57c-e0f9-4cbe-a31a-68cfd0e341ae',
      name: 'ofceth:cet',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:unio'],
    fullName: 'UNIO Coin',
    decimalPlaces: 18,
    onchain: {
      id: '717f318f-a97d-4e12-9fa1-4f57276066de',
      name: 'eth:unio',
      contractAddress: '0x01aac2b594f7bdbec740f0f1aa22910ebb4b74ab',
    },
    offchain: {
      id: 'e6d51d14-edd1-4fe3-9a6a-4ccc8f76f1ad',
      name: 'ofceth:unio',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:hard'],
    fullName: 'Kava Lend',
    decimalPlaces: 6,
    onchain: {
      id: 'a214db0d-a25b-485f-a8fc-b7970cb4d500',
      name: 'eth:hard',
      contractAddress: '0x1c700f95df53fc31e83d89ac89e5dd778d4cd310',
    },
    offchain: {
      id: '6f9c8419-182f-4fe4-a82c-bd99939eb3b6',
      name: 'ofceth:hard',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:mon'],
    fullName: 'Mon',
    decimalPlaces: 18,
    onchain: {
      id: '2b715a62-6527-4586-9aa9-39c3ef154972',
      name: 'eth:mon',
      contractAddress: '0xc555d625828c4527d477e595ff1dd5801b4a600e',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:hegic'],
    fullName: 'Hegic',
    decimalPlaces: 18,
    onchain: {
      id: 'a9fbae2c-d9c7-47b7-9602-ff6316a1ca00',
      name: 'eth:hegic',
      contractAddress: '0x584bc13c7d411c00c01a62e8019472de68768430',
    },
    offchain: {
      id: '8ee9f243-5192-43e0-a1ea-3b6b329b1bbc',
      name: 'ofceth:hegic',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:xreth'],
    fullName: 'Constellation Staked ETH',
    decimalPlaces: 18,
    onchain: {
      id: 'e5195aca-b807-4fb9-b8c3-b4440cb24f67',
      name: 'eth:xreth',
      contractAddress: '0xbb22d59b73d7a6f3a8a83a214becc67eb3b511fe',
      features: AccountCoin.DEFAULT_FEATURES_EXCLUDE_SINGAPORE as CoinFeature[],
    },
    offchain: {
      id: '9321cc5f-623e-428c-a831-43cd381bdcda',
      name: 'ofceth:xreth',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:xy'],
    fullName: 'XY Finance',
    decimalPlaces: 18,
    onchain: {
      id: 'f1b3b3b4-1b5b-4b7b-8b3b-1b3b4b7b8b3b',
      name: 'eth:xy',
      contractAddress: '0x77777777772cf0455fb38ee0e75f38034dfa50de',
    },
    offchain: {
      id: 'c02ba49a-045d-4c11-92e0-6639dbfb639d',
      name: 'ofceth:xy',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:guild'],
    fullName: 'BlockchainSpace',
    decimalPlaces: 18,
    onchain: {
      id: '3f5f1c68-28e2-4b94-8dc1-d32d09c53183',
      name: 'eth:guild',
      contractAddress: '0x83e9f223e1edb3486f876ee888d76bfba26c475a',
      features: AccountCoin.DEFAULT_FEATURES_EXCLUDE_SINGAPORE as CoinFeature[],
    },
    offchain: {
      id: '0bdaaf36-bd01-4cce-96b5-60a9d2c82c36',
      name: 'ofceth:guild',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:rdo'],
    fullName: 'Reddio',
    decimalPlaces: 18,
    onchain: {
      id: '7f986f36-7a0c-4bc8-8c1a-90c6f1a7a5e2',
      name: 'eth:rdo',
      contractAddress: '0x57240c3e140f98abe315ca8e0213c7a77f34a334',
    },
    offchain: {
      id: 'f9bb204c-cfc7-406a-8e4e-6205efb9b187',
      name: 'ofceth:rdo',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:ryt'],
    fullName: 'Real Yield Token',
    decimalPlaces: 18,
    onchain: {
      id: '9a21174b-fb13-4a43-9e14-502d51cc5e87',
      name: 'eth:ryt',
      contractAddress: '0x1d06aa46994f2aba30f6eed46b315664460a709a',
      features: AccountCoin.DEFAULT_FEATURES_EXCLUDE_SINGAPORE as CoinFeature[],
    },
    offchain: {
      id: '42e30f8e-0e75-4e3f-bb9c-c4f8ec6d819e',
      name: 'ofceth:ryt',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:h'],
    fullName: 'Humanity Protocol',
    decimalPlaces: 18,
    onchain: {
      id: '4f09e21a-36b1-4d95-93f6-e57a0c7f96d0',
      name: 'eth:h',
      contractAddress: '0xcf5104d094e3864cfcbda43b82e1cefd26a016eb',
    },
    offchain: {
      id: '3a9b6f94-b3a5-4375-a2ad-2a53057e5c89',
      name: 'ofceth:h',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:wbt'],
    fullName: 'WhiteBIT Coin',
    decimalPlaces: 8,
    onchain: {
      id: '79a6c4f7-9874-4b7f-844a-83b9f9e93c34',
      name: 'eth:wbt',
      contractAddress: '0x925206b8a707096ed26ae47c84747fe0bb734f59',
    },
    offchain: {
      id: 'a1d91c70-7c7d-4b79-8729-9be52f2dd144',
      name: 'ofceth:wbt',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:ftn'],
    fullName: 'Fasttoken',
    decimalPlaces: 18,
    onchain: {
      id: 'c630a709-91d5-4e8d-9855-26b6277cfd32',
      name: 'eth:ftn',
      contractAddress: '0xaedf386b755465871ff874e3e37af5976e247064',
    },
    offchain: {
      id: 'f60b1ac2-2b25-4097-8679-ef746498ea86',
      name: 'ofceth:ftn',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:spx'],
    fullName: 'SPX6900',
    decimalPlaces: 8,
    onchain: {
      id: 'aba8da14-ee9a-44b0-9680-f53069495b08',
      name: 'eth:spx',
      contractAddress: '0xe0f63a424a4439cbe457d80e4f4b51ad25b2c56c',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: '509e7614-4134-4f4a-b107-cd3b4783a558',
      name: 'ofceth:spx',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:exrd'],
    fullName: 'e-RADIX',
    decimalPlaces: 18,
    onchain: {
      id: 'a6c285f4-e39b-4e67-b266-749462e95487',
      name: 'eth:exrd',
      contractAddress: '0x6468e79a80c0eab0f9a2b574c8d5bc374af59414',
    },
    offchain: {
      id: '7d38fd01-00e8-493b-9c52-cde9b65ec274',
      name: 'ofceth:exrd',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:usual'],
    fullName: 'USUAL',
    decimalPlaces: 18,
    onchain: {
      id: 'e11480f5-ad48-4255-8de0-c31351b147da',
      name: 'eth:usual',
      contractAddress: '0xc4441c2be5d8fa8126822b9929ca0b81ea0de38e',
    },
    offchain: {
      id: 'bdb004b5-4ec7-479e-905b-ee34bc8f6bea',
      name: 'ofceth:usual',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:turbo'],
    fullName: 'Turbo',
    decimalPlaces: 18,
    onchain: {
      id: '2cc8846d-8b8d-4480-b49f-026bc56fbf42',
      name: 'eth:turbo',
      contractAddress: '0xa35923162c49cf95e6bf26623385eb431ad920d3',
    },
    offchain: {
      id: 'd3f81454-874d-44a2-96e9-2fa37b5311b3',
      name: 'ofceth:turbo',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:icnt'],
    fullName: 'Impossible Cloud Network Token',
    decimalPlaces: 18,
    onchain: {
      id: 'b0ac7199-4e32-4309-a0cd-99d7465a007c',
      name: 'eth:icnt',
      contractAddress: '0xe5e0b73380181273abcfd88695f52c4d0c825661',
    },
    offchain: {
      id: '3b0efa6b-5f86-4547-9b3b-de2ab4d4194c',
      name: 'ofceth:icnt',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:audu'],
    fullName: 'Ubiquity Stablecoin AUD',
    decimalPlaces: 18,
    onchain: {
      id: '149c6c26-1c25-44b5-90a8-1b6b606f6604',
      name: 'eth:audu',
      contractAddress: '0xb749e8920b25430bd070fe859ddc84b1c99aab87',
    },
    offchain: {
      id: '7e3813c1-cc3f-416f-94e3-5f62a098a59d',
      name: 'ofceth:audu',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:wlfi'],
    fullName: 'World Liberty Financial',
    decimalPlaces: 18,
    onchain: {
      id: 'e27793c3-996c-4736-a4c9-87527136aac5',
      name: 'eth:wlfi',
      contractAddress: '0xda5e1988097297dcdc1f90d4dfe7909e847cbef6',
    },
    offchain: {
      id: '4e6fd93c-a3ae-4367-9b7f-4d8343e6a05b',
      name: 'ofceth:wlfi',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['1INCH'],
    fullName: '1inch Token',
    decimalPlaces: 18,
    onchain: {
      id: '919ba34e-c61e-4346-831f-87660586572a',
      name: '1inch',
      contractAddress: '0x111111111117dc0aa78b770fa6a738034120c302',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: '8304c497-523d-4f3f-8744-65e2e5ebd5a5',
      name: 'ofc1inch',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['1UP'],
    fullName: 'Uptrennd Token',
    decimalPlaces: 18,
    onchain: {
      id: '975396bf-376f-456c-9e0d-9aa4ecc8cb3c',
      name: '1up',
      contractAddress: '0x07597255910a51509ca469568b048f2597e72504',
    },
    offchain: {
      id: '2447d4d4-0bff-4d8b-abde-6787aaff7b41',
      name: 'ofc1up',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.AAVE,
    fullName: 'Aave',
    decimalPlaces: 18,
    onchain: {
      id: '30e50ad3-92a2-4e74-a64d-ba3f3f84de9b',
      name: 'aave',
      contractAddress: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: 'f790e63d-9785-4e98-b323-897fdc489613',
      name: 'ofcaave',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ABT,
    fullName: 'ArcBlock',
    decimalPlaces: 18,
    onchain: {
      id: 'ecc12e17-f87e-44dc-8556-5bbfe8a93f88',
      name: 'abt',
      contractAddress: '0xb98d4c97425d9908e66e53a6fdf673acca0be986',
    },
    offchain: {
      id: '8ff11c4c-e2e6-4594-b470-7db06309f6a9',
      name: 'ofcabt',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ACE,
    fullName: 'Ace Token',
    decimalPlaces: 6,
    onchain: {
      id: 'f16d3113-1a4d-4d93-b917-2363a55e7071',
      name: 'ace',
      contractAddress: '0xe17e41acd4caa3cec048837bfd1918b3c4141767',
    },
    offchain: {
      id: 'a1c32b93-fe10-4be4-8765-d8206131403a',
      name: 'ofcace',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ACXT,
    fullName: 'Ac Exchange Token',
    decimalPlaces: 18,
    onchain: {
      id: 'e988af2e-1570-4c9e-adb0-462f0d8bc359',
      name: 'acxt',
      contractAddress: '0x7be00ed6796b21656732e8f739fc1b8f1c53da0d',
    },
    offchain: {
      id: 'c37aae15-6107-4be9-8768-08ebb7e7209a',
      name: 'ofcacxt',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ACH,
    fullName: 'Alchemy Pay',
    decimalPlaces: 8,
    onchain: {
      id: 'ffdc5c18-d8f4-4c91-929e-3dd506744b43',
      name: 'ach',
      contractAddress: '0xed04915c23f00a313a544955524eb7dbd823143d',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: '104a71f2-4edf-4c27-82fd-83cea89aa6cd',
      name: 'ofcach',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ADX,
    fullName: 'AdEx Network',
    decimalPlaces: 18,
    onchain: {
      id: 'd2d3040e-5455-4d1c-b9a4-0df429280f83',
      name: 'adx',
      contractAddress: '0xade00c28244d5ce17d72e40330b1c318cd12b7c3',
    },
    offchain: {
      id: '84f17eb8-0b28-44b0-b372-30002a88ca39',
      name: 'ofcadx',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.AE,
    fullName: 'Aeternity',
    decimalPlaces: 18,
    onchain: {
      id: '2a6edc25-e290-4a2a-8ab1-300d6caa2e87',
      name: 'ae',
      contractAddress: '0x5ca9a71b1d01849c0a95490cc00559717fcf0d1d',
    },
    offchain: {
      id: '48f00374-522b-4474-a9b0-759ebb90bb07',
      name: 'ofcae',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.AERGO,
    fullName: 'Aergo',
    decimalPlaces: 18,
    onchain: {
      id: 'a05893c1-4860-4ce5-a1c8-cc9cc35e407d',
      name: 'aergo',
      contractAddress: '0xae31b85bfe62747d0836b82608b4830361a3d37a',
    },
    offchain: {
      id: '41f2cf41-3064-462b-90eb-2455461abcfd',
      name: 'ofcaergo',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.AERGO1,
    fullName: 'Aergo1',
    decimalPlaces: 18,
    onchain: {
      id: '6026cda1-7505-4ed6-97ee-191c52a5461e',
      name: 'aergo1',
      contractAddress: '0x91af0fbb28aba7e31403cb457106ce79397fd4e6',
    },
    offchain: {
      id: '5b60498b-2eff-469d-81d9-31dd5995762c',
      name: 'ofcaergo1',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.AGI,
    fullName: 'AGI Token',
    decimalPlaces: 18,
    onchain: {
      id: 'edd072d2-8472-489e-b8aa-808be352658a',
      name: 'agi',
      contractAddress: '0x7da2641000cbb407c329310c461b2cb9c70c3046',
    },
    offchain: {
      id: '1f8de530-b026-482a-a841-f53653b0b3fb',
      name: 'ofcagi',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.AGIX,
    fullName: 'SingularityNET Token',
    decimalPlaces: 8,
    onchain: {
      id: 'c66b9145-6624-45a2-aff0-3fdc49eb64d8',
      name: 'agix',
      contractAddress: '0x5b7533812759b45c2b44c19e320ba2cd2681b542',
    },
    offchain: {
      id: '6d8075ba-688b-4984-8f1b-f186fb099e68',
      name: 'ofcagix',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.AGLD,
    fullName: 'Adventure Gold',
    decimalPlaces: 18,
    onchain: {
      id: '82bf85dd-4e4d-4734-be42-a536ed35f811',
      name: 'agld',
      contractAddress: '0x32353a6c91143bfd6c7d363b546e62a9a2489a20',
    },
    offchain: {
      id: '5503225e-18cc-4030-8a1d-0fbb1088e745',
      name: 'ofcagld',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.AGWD,
    fullName: 'AGARWOOD',
    decimalPlaces: 18,
    onchain: {
      id: 'a73edf54-6e42-44e3-a2b8-de040d3eeb80',
      name: 'agwd',
      contractAddress: '0xc3e419177044c9172823f06335d5d82aaf38a5c6',
    },
    offchain: {
      id: '615f0297-eeeb-4853-8b8c-d48ee793321e',
      name: 'ofcagwd',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.AION,
    fullName: 'AION',
    decimalPlaces: 8,
    onchain: {
      id: '180f5c89-3147-432f-929e-b6256ad45fcf',
      name: 'aion',
      contractAddress: '0x4ceda7906a5ed2179785cd3a40a69ee8bc99c466',
    },
    offchain: {
      id: '0ccbc4fd-b205-412f-a84d-ed0fec2ebff9',
      name: 'ofcaion',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.AJNA,
    fullName: 'AjnaToken',
    decimalPlaces: 18,
    onchain: {
      id: 'ec5b7fdf-83ce-4a26-8c1d-e54064061b43',
      name: 'ajna',
      contractAddress: '0x9a96ec9b57fb64fbc60b423d1f4da7691bd35079',
    },
    offchain: {
      id: 'f6a09b84-e373-4118-961d-8609f3805262',
      name: 'ofcajna',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ALI,
    fullName: 'Artificial Liquid Intelligence Token',
    decimalPlaces: 18,
    onchain: {
      id: 'f34129eb-6ba1-44ad-a0a4-a55bbe375b5f',
      name: 'ali',
      contractAddress: '0x6b0b3a982b4634ac68dd83a4dbf02311ce324181',
    },
    offchain: {
      id: '13932184-363f-4602-9573-c2d56b33bacd',
      name: 'ofcali',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ALCX,
    fullName: 'Alchemix',
    decimalPlaces: 18,
    onchain: {
      id: 'a7f3cb1a-d99e-448d-86a5-64d4a92d289b',
      name: 'alcx',
      contractAddress: '0xdbdb4d16eda451d0503b854cf79d55697f90c8df',
    },
    offchain: {
      id: 'dc89a150-fc26-49b4-b0bf-8b9812380e99',
      name: 'ofcalcx',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ALEPH,
    fullName: 'aleph.im v2',
    decimalPlaces: 18,
    onchain: {
      id: '4b81bffc-1679-452d-b9a9-29239ce365a3',
      name: 'aleph',
      contractAddress: '0x27702a26126e0b3702af63ee09ac4d1a084ef628',
    },
    offchain: {
      id: '4fc8ce84-f1a2-49b7-9fe5-00d8f12bfd07',
      name: 'ofcaleph',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ALICE,
    fullName: 'ALICE',
    decimalPlaces: 6,
    onchain: {
      id: '0ee2c33e-17f2-4a0c-9cc9-d6402640a886',
      name: 'alice',
      contractAddress: '0xac51066d7bec65dc4589368da368b212745d63e8',
    },
    offchain: {
      id: '47d13a91-1930-463c-b8c8-48c7284d3d72',
      name: 'ofcalice',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ALPHA,
    fullName: 'Alpha Finance',
    decimalPlaces: 18,
    onchain: {
      id: '7ddd4fb9-9034-4946-b957-c01fd6c0142d',
      name: 'alpha',
      contractAddress: '0xa1faa113cbe53436df28ff0aee54275c13b40975',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: '3e6956da-28b9-4ddd-be1f-507ef76706c4',
      name: 'ofcalpha',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.APE,
    fullName: 'ApeCoin',
    decimalPlaces: 18,
    onchain: {
      id: '7b78fb38-142a-4987-ad25-25c6e7e579d8',
      name: 'ape',
      contractAddress: '0x4d224452801aced8b2f0aebe155379bb5d594381',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: 'a3b0e98b-3a50-4ee7-a290-696b4cbce666',
      name: 'ofcape',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.API3,
    fullName: 'API3',
    decimalPlaces: 18,
    onchain: {
      id: '59bbe1cb-55bf-4ce0-823b-47ee21112890',
      name: 'api3',
      contractAddress: '0x0b38210ea11411557c13457d4da7dc6ea731b88a',
    },
    offchain: {
      id: 'f32e05a8-d3f2-4831-829f-32be3ed5168e',
      name: 'ofcapi3',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ALTBULL,
    fullName: '3X Long Altcoin Index Token',
    decimalPlaces: 18,
    onchain: {
      id: '4006098a-9857-4a34-9b4e-4594286f8636',
      name: 'altbull',
      contractAddress: '0xd829664cdbf3195b2ce76047a65de29e7ed0a9a8',
    },
    offchain: {
      id: '2f130a46-fbfb-4320-b116-0bc5192706ea',
      name: 'ofcaltbull',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.AMKT,
    fullName: 'Alongside Crypto Market Index',
    decimalPlaces: 18,
    onchain: {
      id: '15c29af6-6589-4f63-947c-c1674f55b68d',
      name: 'amkt',
      contractAddress: '0xf17a3fe536f8f7847f1385ec1bc967b2ca9cae8d',
      features: AccountCoin.getFeaturesByTypeExcluding(
        [
          CoinFeature.CUSTODY_BITGO_SINGAPORE,
          CoinFeature.CUSTODY_BITGO_GERMANY,
          CoinFeature.CUSTODY_BITGO_EUROPE_APS,
          CoinFeature.CUSTODY_BITGO_FRANKFURT,
        ],
        ETH_FEATURES
      ) as CoinFeature[],
    },
    offchain: {
      id: '685b24ae-d2da-4a38-a2f2-7f427aed6052',
      name: 'ofcamkt',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.AMN,
    fullName: 'Amon',
    decimalPlaces: 18,
    onchain: {
      id: 'f050777a-c194-46a1-9f37-ee006b03365d',
      name: 'amn',
      contractAddress: '0x737f98ac8ca59f2c68ad658e3c3d8c8963e40a4c',
    },
    offchain: {
      id: 'b7fd4957-0c57-43ca-8a49-e6ea1c71b89f',
      name: 'ofcamn',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.AMO,
    fullName: 'AMO Token',
    decimalPlaces: 18,
    onchain: {
      id: '999c75ac-96d0-4573-a70f-3ec89956e1af',
      name: 'amo',
      contractAddress: '0x38c87aa89b2b8cd9b95b736e1fa7b612ea972169',
    },
    offchain: {
      id: '06568c9d-f99e-4d82-a099-5102ce11458e',
      name: 'ofcamo',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.AMP,
    fullName: 'AMP Token',
    decimalPlaces: 18,
    onchain: {
      id: 'de37e2a1-e487-452a-a3a0-4a9b0f7d41a2',
      name: 'amp',
      contractAddress: '0xff20817765cb7f73d4bde2e66e067e58d11095c2',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: '1985c77f-e2f2-4d83-956f-dd5846a663c4',
      name: 'ofcamp',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.AMON,
    fullName: 'AmonD',
    decimalPlaces: 18,
    onchain: {
      id: '59e2e85b-98b4-4686-bfed-5e3db18f4eda',
      name: 'amon',
      contractAddress: '0x00059ae69c1622a7542edc15e8d17b060fe307b6',
    },
    offchain: {
      id: '15c13ca9-65e2-4d71-9507-36d1683d7566',
      name: 'ofcamon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.AMPX,
    fullName: 'Amplify Exchange',
    decimalPlaces: 18,
    onchain: {
      id: '34f25acb-2810-414f-a52d-5e7ae9583b68',
      name: 'ampx',
      contractAddress: '0x735af341f2d9ce3663616cd84ff522dbf62fbc1f',
    },
    offchain: {
      id: 'a3987afe-b988-4943-9a50-a249f960316d',
      name: 'ofcampx',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.AMPL,
    fullName: 'Ampleforth',
    decimalPlaces: 9,
    onchain: {
      id: 'dcca8b47-75c6-4cb2-8c91-ed5aa26f6310',
      name: 'ampl',
      contractAddress: '0xd46ba6d942050d489dbd938a2c909a5d5039a161',
      features: [
        ...AccountCoin.DEFAULT_FEATURES,
        CoinFeature.BULK_TRANSACTION,
        CoinFeature.REBASE_TOKEN,
      ] as CoinFeature[],
    },
    offchain: {
      id: '221caa1d-72a4-4751-af88-36c5ae5f3398',
      name: 'ofcampl',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ANA,
    fullName: 'ANA',
    decimalPlaces: 18,
    onchain: {
      id: '60b37df5-c078-4d7e-b38a-6f3f7fd25ea7',
      name: 'ana',
      contractAddress: '0xfafd51641ab09dff163cd04d2eb6b7865eb83f53',
    },
    offchain: {
      id: '3dc94d52-cfbe-40a9-af62-64e3dab921d3',
      name: 'ofcana',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ANC,
    fullName: 'Anchor Protocol',
    decimalPlaces: 18,
    onchain: {
      id: 'a8ffb3b2-c53f-4579-ac54-74b6511e334f',
      name: 'anc',
      contractAddress: '0x0f3adc247e91c3c50bc08721355a41037e89bc20',
    },
    offchain: {
      id: '2fee1c3e-cd7c-490e-8a75-7f550f31f5cf',
      name: 'ofcanc',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ANKRETH,
    fullName: 'Ankr Staked ETH',
    decimalPlaces: 18,
    onchain: {
      id: '06a93c2a-c7d2-4a7d-b07d-4ac0414be6eb',
      name: 'ankreth',
      contractAddress: '0xe95a203b1a91a908f9b9ce46459d101078c2c3cb',
    },
    offchain: {
      id: '2df04477-af4f-4300-8c06-c6e8a6c732c5',
      name: 'ofcankreth',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ANT,
    fullName: 'Aragon',
    decimalPlaces: 18,
    onchain: {
      id: 'be4c1e1d-17e1-4364-a4b1-5547363ed9a6',
      name: 'ant',
      contractAddress: '0x960b236a07cf122663c4303350609a66a7b288c0',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: 'ad5d8cf4-59b5-4b82-b1ee-d5d0d6ba5944',
      name: 'ofcant',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ANTV2,
    fullName: 'Antv2',
    decimalPlaces: 18,
    onchain: {
      id: '406d6579-fee0-4f1c-9602-369b02382a40',
      name: 'antv2',
      contractAddress: '0xa117000000f279d81a1d3cc75430faa017fa5a2e',
    },
    offchain: {
      id: '3108fcb7-e5b8-484b-9e80-2b03b0da7895',
      name: 'ofcantv2',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.AOA,
    fullName: 'Aurora',
    decimalPlaces: 18,
    onchain: {
      id: '4df5ddf0-de0c-49ab-b1f8-cb3d0b8bfc09',
      name: 'aoa',
      contractAddress: '0x9ab165d795019b6d8b3e971dda91071421305e5a',
    },
    offchain: {
      id: 'a1faaea6-9718-454c-bb8c-01242ba9abed',
      name: 'ofcaoa',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.APPC,
    fullName: 'AppCoins',
    decimalPlaces: 18,
    onchain: {
      id: '950ed7e9-66e4-4da6-8b68-d942a24a18ba',
      name: 'appc',
      contractAddress: '0x1a7a8bd9106f2b8d977e08582dc7d24c723ab0db',
    },
    offchain: {
      id: '18c71263-c1fe-4534-a85e-9d6c17d6a02b',
      name: 'ofcappc',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.AQT,
    fullName: 'Alpha Quark Token',
    decimalPlaces: 18,
    onchain: {
      id: 'f5357a4a-b550-46d8-aa85-dc285ba9eff2',
      name: 'aqt',
      contractAddress: '0x2a9bdcff37ab68b95a53435adfd8892e86084f93',
    },
    offchain: {
      id: 'ac7aa2d5-8073-4eca-a737-3c64af0c79fc',
      name: 'ofcaqt',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ARCT,
    fullName: 'ArCoin US Treasury',
    decimalPlaces: 18,
    onchain: {
      id: '8dd47221-5121-49d5-92d2-4798f893370a',
      name: 'arct',
      contractAddress: '0xeb0f0df01c400fd21fb8533a68423703d22cfcc5',
    },
    offchain: {
      id: '029cdb6d-f369-41ee-813c-00e4b8ff2a3b',
      name: 'ofcarct',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ARCX,
    fullName: 'ARCx Governance Token',
    decimalPlaces: 18,
    onchain: {
      id: 'fbbeea85-9fc0-483c-9cf2-5cbcca67c51f',
      name: 'arcx',
      contractAddress: '0x1321f1f1aa541a56c31682c57b80ecfccd9bb288',
    },
    offchain: {
      id: '2d2ec540-c0b9-4c81-86cf-64b80f4f33fe',
      name: 'ofcarcx',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ARKM,
    fullName: 'Arkham',
    decimalPlaces: 18,
    onchain: {
      id: 'c80bf331-1cf5-4076-b0e3-6497efe0c313',
      name: 'arkm',
      contractAddress: '0x6e2a43be0b1d33b726f0ca3b8de60b3482b8b050',
    },
    offchain: {
      id: '72e958a1-a36c-4c77-ad1e-008f6044b09c',
      name: 'ofcarkm',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ARTEQ,
    fullName: 'arteQ NFT Investment Fund',
    decimalPlaces: 0,
    onchain: {
      id: '67af7aee-a78a-4c3a-a24c-b3ef21ea9f3c',
      name: 'arteq',
      contractAddress: '0x805c2077f3ab224d889f9c3992b41b2f4722c787',
      features: AccountCoin.DEFAULT_FEATURES_EXCLUDE_SINGAPORE as CoinFeature[],
    },
    offchain: {
      id: '6ba1b4e1-6047-4694-a90c-f3181dc6afd2',
      name: 'ofcarteq',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.AST,
    fullName: 'AirSwap',
    decimalPlaces: 4,
    onchain: {
      id: '908540ad-6793-4bb5-8712-041a4c258d26',
      name: 'ast',
      contractAddress: '0x27054b13b1b798b345b591a4d22e6562d47ea75a',
    },
    offchain: {
      id: '7b439ef5-66ef-4ec8-9571-67b302d43be1',
      name: 'ofcast',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ASTO,
    fullName: 'Altered State Token',
    decimalPlaces: 18,
    onchain: {
      id: '1c6ef07d-6f69-4618-bb5b-5f6e554d4fde',
      name: 'asto',
      contractAddress: '0x823556202e86763853b40e9cde725f412e294689',
    },
    offchain: {
      id: '8f0a4e46-5659-4f27-a5c4-88864f04ea50',
      name: 'ofcasto',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ATRI,
    fullName: 'Atari Token',
    decimalPlaces: 0,
    onchain: {
      id: 'ec4b7116-b9eb-4698-8baa-de5b333367fe',
      name: 'atri',
      contractAddress: '0xdacd69347de42babfaecd09dc88958378780fb62',
      features: [
        ...ACCOUNT_COIN_DEFAULT_FEATURES_EXCLUDE_SINGAPORE_AND_MENA_FZE,
        CoinFeature.BULK_TRANSACTION,
      ] as CoinFeature[],
    },
    offchain: {
      id: '65542086-c1a9-42d9-a496-11bf06052dec',
      name: 'ofcatri',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.AUDD,
    fullName: 'AUDD',
    decimalPlaces: 6,
    onchain: {
      id: '0d0e43eb-2bf0-474c-baf9-97dd9d05d383',
      name: 'audd',
      contractAddress: '0x4cce605ed955295432958d8951d0b176c10720d5',
    },
    offchain: {
      id: '67845151-456b-4545-9bbf-29452777daf0',
      name: 'ofcaudd',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.AUDF,
    fullName: 'Forte AUD',
    decimalPlaces: 6,
    onchain: {
      id: '20d977ec-b8a3-49e4-9491-2780ee028342',
      name: 'audf',
      contractAddress: '0xd2a530170d71a9cfe1651fb468e2b98f7ed7456b',
    },
    offchain: {
      id: '8e38727e-0bc7-4545-b586-468ee0d99391',
      name: 'ofcaudf',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.AUDIO,
    fullName: 'Audio',
    decimalPlaces: 18,
    onchain: {
      id: 'fc2c10bf-be78-4055-8ca9-5620b05d13d5',
      name: 'audio',
      contractAddress: '0x18aaa7115705e8be94bffebde57af9bfc265b998',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: '15c3f5fb-255c-4ef6-9df3-767b3aa2b36d',
      name: 'ofcaudio',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.AUDX,
    fullName: 'eToro Australian Dollar',
    decimalPlaces: 18,
    onchain: {
      id: '98321196-eb95-4edf-a021-baecab1c584f',
      name: 'audx',
      contractAddress: '0xdf1e9e1a218cff9888faef311d6fbb472e4175ce',
    },
    offchain: {
      id: '823712a8-59a8-4b4f-ae17-d2a89ffb5f65',
      name: 'ofcaudx',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.AUST,
    fullName: 'Wrapped Anchor UST Token',
    decimalPlaces: 18,
    onchain: {
      id: '24b52b48-7102-4b39-a9c8-41fbee1916a0',
      name: 'aust',
      contractAddress: '0xa8de3e3c934e2a1bb08b010104ccabbd4d6293ab',
    },
    offchain: {
      id: 'b86296b0-e594-4f59-8a53-149f8d16c298',
      name: 'ofcaust',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.AKRO,
    fullName: 'Akropolis',
    decimalPlaces: 18,
    onchain: {
      id: '8e9461c0-d4af-4f0a-8037-a4d623cc4998',
      name: 'akro',
      contractAddress: '0x8ab7404063ec4dbcfd4598215992dc3f8ec853d7',
    },
    offchain: {
      id: 'd8811a30-e948-44fc-b636-8a250fd86fae',
      name: 'ofcakro',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.AXL,
    fullName: 'Axelar',
    decimalPlaces: 6,
    onchain: {
      id: '1074ca27-fbb1-419e-a7b0-ca51e0a32783',
      name: 'axl',
      contractAddress: '0x3eacbdc6c382ea22b78acc158581a55aaf4ef3cc',
    },
    offchain: {
      id: '7ef82330-af3b-488e-9c26-ea03f34aafb7',
      name: 'ofcaxl',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.AXLV2,
    fullName: 'Axelar',
    decimalPlaces: 6,
    onchain: {
      id: 'b4927fc5-8877-433c-b323-03c823311a6c',
      name: 'axlv2',
      contractAddress: '0x467719ad09025fcc6cf6f8311755809d45a5e5f3',
    },
    offchain: {
      id: 'fb5f8f3a-339a-45fc-abed-d58e9d1d10a7',
      name: 'ofcaxlv2',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.AXPR,
    fullName: 'aXpire',
    decimalPlaces: 18,
    onchain: {
      id: 'cc1950ab-e3f0-433f-9a1c-05713c41fa0f',
      name: 'axpr',
      contractAddress: '0xc39e626a04c5971d770e319760d7926502975e47',
    },
    offchain: {
      id: 'cf929cdc-abc9-45ac-bdb6-c91af26473e0',
      name: 'ofcaxpr',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.AXS,
    fullName: 'Axie Infinity Shards',
    decimalPlaces: 18,
    onchain: {
      id: 'd826ea92-3bf9-4d1e-99df-2edb9e48938c',
      name: 'axs',
      contractAddress: '0xf5d669627376ebd411e34b98f19c868c8aba5ada',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: '2ea24af7-8b2e-400f-afee-9b11aeef141e',
      name: 'ofcaxs',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.AXSV2,
    fullName: 'Axie Infinity Shards V2',
    decimalPlaces: 18,
    onchain: {
      id: 'c99d36df-ac0c-40f0-850e-362ad57e218d',
      name: 'axsv2',
      contractAddress: '0xbb0e17ef65f82ab018d8edd776e8dd940327b28b',
    },
    offchain: {
      id: 'eaa20cea-78fe-46f5-a5f8-d29f69f5a543',
      name: 'ofcaxsv2',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BADGER,
    fullName: 'Badger',
    decimalPlaces: 18,
    onchain: {
      id: '2a731a56-c498-4647-9f07-3788f09c42c5',
      name: 'badger',
      contractAddress: '0x3472a5a71965499acd81997a54bba8d852c6e53d',
    },
    offchain: {
      id: '20274306-7e40-43ac-ae91-d7744352f4e0',
      name: 'ofcbadger',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BAL,
    fullName: 'Balancer',
    decimalPlaces: 18,
    onchain: {
      id: '8d27b35f-c398-4b6d-b5e6-684972b1d04d',
      name: 'bal',
      contractAddress: '0xba100000625a3754423978a60c9317c58a424e3d',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: 'ae72248b-19fb-4736-9430-caf68615a751',
      name: 'ofcbal',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BAND,
    fullName: 'Band Protocol',
    decimalPlaces: 18,
    onchain: {
      id: 'f510078f-007e-44ba-bf35-ed3e5da59947',
      name: 'band',
      contractAddress: '0xba11d00c5f74255f56a5e366f4f77f5a186d7f55',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: '8a73d170-28c1-48c9-8d3c-c7ea374f4414',
      name: 'ofcband',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BAO,
    fullName: 'BaoToken',
    decimalPlaces: 18,
    onchain: {
      id: 'c9dbc66b-1d4b-4ccc-8f78-78e496793a92',
      name: 'bao',
      contractAddress: '0x374cb8c27130e2c9e04f44303f3c8351b9de61c1',
    },
    offchain: {
      id: '0849ccd4-e529-4cb3-97fe-87960982c3a7',
      name: 'ofcbao',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BASIC,
    fullName: 'BASIC Token',
    decimalPlaces: 18,
    onchain: {
      id: '39cb19ba-049d-4b04-b667-58d88014be04',
      name: 'basic',
      contractAddress: '0xf25c91c87e0b1fd9b4064af0f427157aab0193a7',
      features: AccountCoin.getFeaturesByTypeExcluding(
        [
          CoinFeature.CUSTODY_BITGO_GERMANY,
          CoinFeature.CUSTODY_BITGO_EUROPE_APS,
          CoinFeature.CUSTODY_BITGO_FRANKFURT,
          CoinFeature.CUSTODY_BITGO_SINGAPORE,
        ],
        ETH_FEATURES
      ) as CoinFeature[],
    },
    offchain: {
      id: '9d4ab86e-15de-47c4-91f9-660f093cc319',
      name: 'ofcbasic',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BAT,
    fullName: 'Basic Attention Token',
    decimalPlaces: 18,
    onchain: {
      id: '769bcca4-af8e-4a1d-8758-65d79fbc4b94',
      name: 'bat',
      contractAddress: '0x0d8775f648430679a709e98d2b0cb6250d2887ef',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: '6f28e645-9f4c-4825-b97f-20e65708d464',
      name: 'ofcbat',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BAX,
    fullName: 'BABB',
    decimalPlaces: 18,
    onchain: {
      id: '3c7c1670-82ee-413c-a1bc-0e8ca002e3e6',
      name: 'bax',
      contractAddress: '0x9a0242b7a33dacbe40edb927834f96eb39f8fbcb',
    },
    offchain: {
      id: '3666c6ee-61b1-4f1c-943c-fec7c975584d',
      name: 'ofcbax',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BBTC,
    fullName: 'Binance Wrapped BTC',
    decimalPlaces: 8,
    onchain: {
      id: '4c41ed4d-c627-4703-9fe6-f4ecbf77654a',
      name: 'bbtc',
      contractAddress: '0x9be89d2a4cd102d8fecc6bf9da793be995c22541',
    },
    offchain: {
      id: 'e849fbdc-e8ef-4847-b85b-6814ff94aec7',
      name: 'ofcbbtc',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BBX,
    fullName: 'BBX',
    decimalPlaces: 18,
    onchain: {
      id: 'bd8d2723-5c4e-4cdd-852d-7a536e70660a',
      name: 'bbx',
      contractAddress: '0x71529cea068e3785efd4f18aaf59a6cb82b7e5cb',
    },
    offchain: {
      id: 'e1911280-a3d6-4422-bf14-d233c801848f',
      name: 'ofcbbx',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BCAP,
    fullName: 'BCAP',
    decimalPlaces: 0,
    onchain: {
      id: 'd129ec83-61db-4cbb-8141-7830bfb96727',
      name: 'bcap',
      contractAddress: '0x1f41e42d0a9e3c0dd3ba15b527342783b43200a9',
      features: AccountCoin.getFeaturesByTypeExcluding(
        [
          CoinFeature.CUSTODY_BITGO_SINGAPORE,
          CoinFeature.CUSTODY_BITGO_GERMANY,
          CoinFeature.CUSTODY_BITGO_EUROPE_APS,
          CoinFeature.CUSTODY_BITGO_FRANKFURT,
        ],
        ETH_FEATURES
      ) as CoinFeature[],
    },
    offchain: {
      id: '3667e048-ddf7-4e71-ab8c-a01c07551a1e',
      name: 'ofcbcap',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BCC,
    fullName: 'Basiscoin Cash',
    decimalPlaces: 18,
    onchain: {
      id: '8f3ba79b-4cf6-417f-a5bc-84c613a3c08e',
      name: 'bcc',
      contractAddress: '0xae17f4f5ca32f77ea8e3786db7c0b2fe877ac176',
      features: [
        ...ACCOUNT_COIN_DEFAULT_FEATURES_EXCLUDE_SINGAPORE_AND_MENA_FZE,
        CoinFeature.BULK_TRANSACTION,
      ] as CoinFeature[],
    },
    offchain: {
      id: 'de878b8c-ebda-4135-9272-57be07a56851',
      name: 'ofcbcc',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BCIO,
    fullName: 'Blockchain.io',
    decimalPlaces: 18,
    onchain: {
      id: '1dcb6e39-bb47-4bf3-a9c5-809a7953f7a2',
      name: 'bcio',
      contractAddress: '0xcdc412f306e0c51e3249b88c65423cd16b322673',
      features: AccountCoin.getFeaturesByTypeExcluding(
        [
          CoinFeature.CUSTODY_BITGO_GERMANY,
          CoinFeature.CUSTODY_BITGO_EUROPE_APS,
          CoinFeature.CUSTODY_BITGO_FRANKFURT,
          CoinFeature.CUSTODY_BITGO_SINGAPORE,
          CoinFeature.CUSTODY_BITGO_CUSTODY_MENA_FZE,
        ],
        ETH_FEATURES
      ) as CoinFeature[],
    },
    offchain: {
      id: 'db8f7baf-dab6-474e-8d27-1e144d021900',
      name: 'ofcbcio',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BCUT,
    fullName: 'bitsCrunch Token',
    decimalPlaces: 18,
    onchain: {
      id: '4130136a-edd2-4e1c-a546-3f467793c232',
      name: 'bcut',
      contractAddress: '0xbef26bd568e421d6708cca55ad6e35f8bfa0c406',
    },
    offchain: {
      id: '5ae8c334-d003-4126-97cb-aeaadebed9e5',
      name: 'ofcbcut',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BCT,
    fullName: 'Bitcarbon Coin',
    decimalPlaces: 0,
    onchain: {
      id: '075d5970-9167-4d0a-9ce5-38abddc85b41',
      name: 'bct',
      contractAddress: '0xb383f96d5869002136164edcad970f8dd10d4a51',
    },
    offchain: {
      id: '8ce37630-f2fc-426f-8f99-110c6fd496eb',
      name: 'ofcbct',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BDXN,
    fullName: 'Bondex Token',
    decimalPlaces: 18,
    onchain: {
      id: '10ffc090-0c82-4a0c-8907-54b1adbb8fc2',
      name: 'bdxn',
      contractAddress: '0xbdbdbdd0c22888e63cb9098ad6d68439197cb091',
    },
    offchain: {
      id: '148bef88-25ad-4e2b-85da-eb2be52a8df8',
      name: 'ofcbdxn',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BEAM,
    fullName: 'Beam',
    decimalPlaces: 18,
    onchain: {
      id: '67ecdcd6-2b5d-4be4-9173-ee92eb8f4e0c',
      name: 'beam',
      contractAddress: '0x62d0a8458ed7719fdaf978fe5929c6d342b0bfce',
      features: AccountCoin.getFeaturesByTypeExcluding(
        [
          CoinFeature.CUSTODY_BITGO_SINGAPORE,
          CoinFeature.CUSTODY_BITGO_CUSTODY_MENA_FZE,
          CoinFeature.CUSTODY_BITGO_MENA_FZE,
          CoinFeature.CUSTODY_BITGO_EUROPE_APS,
          CoinFeature.CUSTODY_BITGO_FRANKFURT,
          CoinFeature.CUSTODY_BITGO_GERMANY,
        ],
        ETH_FEATURES
      ) as CoinFeature[],
    },
    offchain: {
      id: '519ab013-f634-41f4-9d31-6f9368de5b09',
      name: 'ofcbeam',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BED,
    fullName: 'Bankless BED Index',
    decimalPlaces: 18,
    onchain: {
      id: '04c44584-c417-4fce-883f-8f316854c63e',
      name: 'bed',
      contractAddress: '0x2af1df3ab0ab157e1e2ad8f88a7d04fbea0c7dc6',
      features: AccountCoin.getFeaturesByTypeExcluding(
        [
          CoinFeature.CUSTODY_BITGO_SINGAPORE,
          CoinFeature.CUSTODY_BITGO_GERMANY,
          CoinFeature.CUSTODY_BITGO_EUROPE_APS,
          CoinFeature.CUSTODY_BITGO_FRANKFURT,
        ],
        ETH_FEATURES
      ) as CoinFeature[],
    },
    offchain: {
      id: 'efd21406-8308-4467-8abe-a3fe26f1d925',
      name: 'ofcbed',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BEPRO,
    fullName: 'BetProtocol',
    decimalPlaces: 18,
    onchain: {
      id: '6a744a2e-e6b6-4bb2-bf7a-7fee330678c3',
      name: 'bepro',
      contractAddress: '0xcf3c8be2e2c42331da80ef210e9b1b307c03d36a',
    },
    offchain: {
      id: '0022a095-a2a2-4ea5-ae97-e863bf260491',
      name: 'ofcbepro',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BICO,
    fullName: 'Biconomy',
    decimalPlaces: 18,
    onchain: {
      id: 'fe16b6c7-c10e-410a-88c6-338843fdd535',
      name: 'bico',
      contractAddress: '0xf17e65822b568b3903685a7c9f496cf7656cc6c2',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: '8541eeed-0478-45fe-bff9-4bcc63ef3f67',
      name: 'ofcbico',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BID,
    fullName: 'Blockbid',
    decimalPlaces: 2,
    onchain: {
      id: '6b636557-5397-4db6-bd5d-49f54857f237',
      name: 'bid',
      contractAddress: '0xdd5151da2ab25566e1d2a3c9a3e77396303f8a93',
    },
    offchain: {
      id: '693a4de3-a1bf-48ca-a1ad-59a51ef6d2a1',
      name: 'ofcbid',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:block'],
    fullName: 'Block Protocol',
    decimalPlaces: 18,
    onchain: {
      id: '03675fb9-f2d4-4049-a9e6-92461bd63319',
      name: 'eth:block',
      contractAddress: '0x8fc17671d853341d9e8b001f5fc3c892d09cb53a',
    },
    offchain: {
      id: '06c266d3-de33-438d-a9c5-b610b4a1de7d',
      name: 'ofceth:block',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:bito'],
    fullName: 'BitoPro Coin',
    decimalPlaces: 18,
    onchain: {
      id: 'baa60978-c470-4acc-925e-250d8acb6009',
      name: 'eth:bito',
      contractAddress: '0x93b1e78a3e652cd2e71c4a767595b77282344932',
    },
    offchain: {
      id: '593ae9a1-ab69-423a-b9a2-1980a0c50f97',
      name: 'ofceth:bito',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:ultra'],
    fullName: 'Ultra',
    decimalPlaces: 6,
    onchain: {
      id: '4a037650-323d-4361-93b1-d569976c0e30',
      name: 'eth:ultra',
      contractAddress: '0x50293dd8889b931eb3441d2664dce8396640b419',
    },
    offchain: {
      id: '29a9b457-bead-43db-86e4-2ae58ac9c9bb',
      name: 'ofceth:ultra',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:dragonx'],
    fullName: 'DragonX',
    decimalPlaces: 18,
    onchain: {
      id: 'c68804ae-fd39-4d71-8948-913fa04d0152',
      name: 'eth:dragonx',
      contractAddress: '0x96a5399d07896f757bd4c6ef56461f58db951862',
      features: AccountCoin.getFeaturesByTypeExcluding(
        [
          CoinFeature.CUSTODY_BITGO_SINGAPORE,
          CoinFeature.CUSTODY_BITGO_CUSTODY_MENA_FZE,
          CoinFeature.CUSTODY_BITGO_MENA_FZE,
        ],
        ETH_FEATURES
      ) as CoinFeature[],
    },
    offchain: {
      id: '3ffe3b72-6493-4d63-b483-19ff7a59ca53',
      name: 'ofceth:dragonx',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BIDL,
    fullName: 'Blockbid Liquidity',
    decimalPlaces: 2,
    onchain: {
      id: 'bcb2af13-b64d-403a-bb61-1990e6286fcd',
      name: 'bidl',
      contractAddress: '0x5c7ec304a60ed545518085bb4aba156e8a7596f6',
    },
    offchain: {
      id: '6d8e4e7f-4eb9-4095-97e8-bc657e336249',
      name: 'ofcbidl',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BIRD,
    fullName: 'BirdCoin',
    decimalPlaces: 18,
    onchain: {
      id: 'a1aa287e-3971-4303-823e-784149cc2dd1',
      name: 'bird',
      contractAddress: '0x026e62dded1a6ad07d93d39f96b9eabd59665e0d',
    },
    offchain: {
      id: 'aa193169-1e01-424b-a987-2863c00212f0',
      name: 'ofcbird',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BIT,
    fullName: 'BitDAO',
    decimalPlaces: 18,
    onchain: {
      id: 'f8f1ad28-9fe9-4aef-a9a9-4614cc037525',
      name: 'bit',
      contractAddress: '0x1a4b46696b2bb4794eb3d4c26f1c55f9170fa4c5',
    },
    offchain: {
      id: '48e33478-36b0-4332-a792-6b4d629c2376',
      name: 'ofcbit',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BTT,
    fullName: 'BitTorrent',
    decimalPlaces: 18,
    onchain: {
      id: '3ac1141f-6c09-476c-919b-9f5b0ef26dab',
      name: 'btt',
      contractAddress: '0xc669928185dbce49d2230cc9b0979be6dc797957',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: '9857d17e-dac4-4f18-9cd6-4d2cea6b4df2',
      name: 'ofcbtt',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BLUR,
    fullName: 'Blur',
    decimalPlaces: 18,
    onchain: {
      id: '83214bf2-eec7-4225-b398-41e065e23311',
      name: 'blur',
      contractAddress: '0x5283d291dbcf85356a21ba090e6db59121208b44',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: 'b5bfe73b-9b60-4961-914e-245c7e0dd7c3',
      name: 'ofcblur',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BLZ,
    fullName: 'Bluzelle',
    decimalPlaces: 18,
    onchain: {
      id: '76207650-917a-455e-b2f8-c9654a4d8d90',
      name: 'blz',
      contractAddress: '0x5732046a883704404f284ce41ffadd5b007fd668',
    },
    offchain: {
      id: '8897ec44-aa10-48ce-8c4c-5870459b3c15',
      name: 'ofcblz',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BNB,
    fullName: 'BNB Token (ETH Network)',
    decimalPlaces: 18,
    onchain: {
      id: '462e1878-68eb-4c2b-9346-cee992195cdc',
      name: 'bnb',
      contractAddress: '0xb8c77482e45f1f44de1745f52c74426c631bdd52',
    },
    offchain: {
      id: '4bc691c4-dcdd-4b78-be96-1e87269c3caf',
      name: 'ofcbnb',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BNK,
    fullName: 'Bankera',
    decimalPlaces: 8,
    onchain: {
      id: 'b557c9a4-16b4-4561-85cc-13b72b71aebb',
      name: 'bnk',
      contractAddress: '0xc80c5e40220172b36adee2c951f26f2a577810c5',
      features: AccountCoin.getFeaturesByTypeExcluding(
        [
          CoinFeature.CUSTODY_BITGO_SINGAPORE,
          CoinFeature.CUSTODY_BITGO_GERMANY,
          CoinFeature.CUSTODY_BITGO_EUROPE_APS,
          CoinFeature.CUSTODY_BITGO_FRANKFURT,
        ],
        ETH_FEATURES
      ) as CoinFeature[],
    },
    offchain: {
      id: '61636213-7817-47f3-b790-a2fb25b904f9',
      name: 'ofcbnk',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BNL,
    fullName: 'BitNational',
    decimalPlaces: 18,
    onchain: {
      id: 'fd39c546-52c8-4668-b30d-3397681ff9d3',
      name: 'bnl',
      contractAddress: '0xa717d0f45652fb430fd84d3d1b6b02e4510102ea',
    },
    offchain: {
      id: '3933d3e4-9202-40b6-a15f-d6a7283a4af5',
      name: 'ofcbnl',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BNT,
    fullName: 'Bancor',
    decimalPlaces: 18,
    onchain: {
      id: '6929cc50-cd76-4d10-b812-658e0af19ff8',
      name: 'bnt',
      contractAddress: '0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: '7a76184c-b4b2-4c87-81bc-0c496c605488',
      name: 'ofcbnt',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BNTY,
    fullName: 'Bounty0x',
    decimalPlaces: 18,
    onchain: {
      id: 'c8a5827b-412c-45c5-9a98-d33978cd3abb',
      name: 'bnty',
      contractAddress: '0xd2d6158683aee4cc838067727209a0aaf4359de3',
    },
    offchain: {
      id: '4f06257b-0439-4586-a304-c955d6d6b3e3',
      name: 'ofcbnty',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BOB,
    fullName: 'Bob',
    decimalPlaces: 18,
    onchain: {
      id: 'f2e76bc9-b1e6-45ac-9779-26fe217edb2e',
      name: 'bob',
      contractAddress: '0x7d8146cf21e8d7cbe46054e01588207b51198729',
    },
    offchain: {
      id: 'e0916d17-2038-4bd6-bb43-3f7e602b9c2b',
      name: 'ofcbob',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BOBA,
    fullName: 'Boba Token',
    decimalPlaces: 18,
    onchain: {
      id: 'aa42023c-f2b8-4717-adec-9e8e8322a6c7',
      name: 'boba',
      contractAddress: '0x42bbfa2e77757c645eeaad1655e0911a7553efbc',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: 'cd568cfc-ca69-4714-b8ba-a274a633f139',
      name: 'ofcboba',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BOX,
    fullName: 'ContentBox',
    decimalPlaces: 18,
    onchain: {
      id: '0f2c360d-7733-4d02-8548-e41c222115f0',
      name: 'box',
      contractAddress: '0x63f584fa56e60e4d0fe8802b27c7e6e3b33e007f',
    },
    offchain: {
      id: '41d74a1e-bead-46fa-914d-58e735e53825',
      name: 'ofcbox',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BOND,
    fullName: 'BarnBridge',
    decimalPlaces: 18,
    onchain: {
      id: '8cf96c6f-7bd3-4c2c-987c-96991c944559',
      name: 'bond',
      contractAddress: '0x0391d2021f89dc339f60fff84546ea23e337750f',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: '877e7ee6-2794-44b0-ac81-df6ca20d786e',
      name: 'ofcbond',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BONK,
    fullName: 'BONK',
    decimalPlaces: 5,
    onchain: {
      id: '6b0fabae-5d77-4f1f-ab2d-33094ef70b64',
      name: 'bonk',
      contractAddress: '0x1151cb3d861920e07a38e03eead12c32178567f6',
    },
    offchain: {
      id: '8d4b6c0d-180c-413b-82ec-ee52810f38e3',
      name: 'ofcbonk',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BORG,
    fullName: 'SwissBorg Token',
    decimalPlaces: 18,
    onchain: {
      id: 'c08b5b3c-2d6b-4eaa-aaf4-5e4aae9e741c',
      name: 'borg',
      contractAddress: '0x64d0f55cd8c7133a9d7102b13987235f486f2224',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: '179e6735-b0a8-4ca7-bd3d-04874fac907c',
      name: 'ofcborg',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BOTTO,
    fullName: 'BOTTO',
    decimalPlaces: 18,
    onchain: {
      id: '1ff8e770-33b9-4e62-9837-9eb26d67e191',
      name: 'botto',
      contractAddress: '0x9dfad1b7102d46b1b197b90095b5c4e9f5845bba',
    },
    offchain: {
      id: 'd484050e-66b3-4761-9a55-a8f4e7c9d099',
      name: 'ofcbotto',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BLOCKS,
    fullName: 'BLOCKS ',
    decimalPlaces: 18,
    onchain: {
      id: '49fefa5c-efc4-46c6-ae6f-efd7fd51ea2d',
      name: 'blocks',
      contractAddress: '0x8a6d4c8735371ebaf8874fbd518b56edd66024eb',
    },
    offchain: {
      id: '0d77619b-38cd-4f63-aae1-9f78bc8424a5',
      name: 'ofcblocks',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BRD,
    fullName: 'Bread',
    decimalPlaces: 18,
    onchain: {
      id: '46ef0f3b-c9e6-4aa6-8e61-73214cb09986',
      name: 'brd',
      contractAddress: '0x558ec3152e2eb2174905cd19aea4e34a23de9ad6',
    },
    offchain: {
      id: 'dc7aee1b-cb45-4d55-b1e5-0e155604e7c8',
      name: 'ofcbrd',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BRZ,
    fullName: 'Brazilian Digital Token',
    decimalPlaces: 4,
    onchain: {
      id: '5a1e485c-1019-4e25-bd17-c7e544ebf025',
      name: 'brz',
      contractAddress: '0x420412e765bfa6d85aaac94b4f7b708c89be2e2b',
    },
    offchain: {
      id: '86e90ab8-8bc5-45da-b887-f5a7e73b493a',
      name: 'ofcbrz',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BSGG,
    fullName: 'Betswap.gg',
    decimalPlaces: 18,
    onchain: {
      id: '406f4e39-747f-423b-ad53-91f963343a20',
      name: 'bsgg',
      contractAddress: '0xda16cf041e2780618c49dbae5d734b89a6bac9b3',
    },
    offchain: {
      id: '9ca258ea-147a-4fef-8308-7b0373f910bc',
      name: 'ofcbsgg',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BSX,
    fullName: 'Bistox Exchange Token',
    decimalPlaces: 18,
    onchain: {
      id: '8066434a-af46-4457-bf63-e5c62b006f83',
      name: 'bsx',
      contractAddress: '0x435b67f0dcae34c046720de42fcdc135b8f90e55',
    },
    offchain: {
      id: 'fd8543f1-8b0f-4ae2-a5fd-ec313a9d415d',
      name: 'ofcbsx',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BTRST,
    fullName: 'Braintrust',
    decimalPlaces: 18,
    onchain: {
      id: 'd49a7c1b-2a81-4bb4-9d58-55d5f08ea338',
      name: 'btrst',
      contractAddress: '0x799ebfabe77a6e34311eeee9825190b9ece32824',
    },
    offchain: {
      id: 'f142074d-8d94-442b-a0e3-3f09c98acaeb',
      name: 'ofcbtrst',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BKT,
    fullName: 'Blocktrade',
    decimalPlaces: 18,
    onchain: {
      id: '4e1e3c5a-315f-443d-9eea-7d0bb7bd1b94',
      name: 'bkt',
      contractAddress: '0xfa456cf55250a839088b27ee32a424d7dacb54ff',
    },
    offchain: {
      id: '637b3596-5775-4bbd-93b1-21d970511ea5',
      name: 'ofcbkt',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BTU,
    fullName: 'BTU Protocol',
    decimalPlaces: 18,
    onchain: {
      id: 'c968c10c-fd2f-4dac-b6ac-5b62d6bb0645',
      name: 'btu',
      contractAddress: '0xb683d83a532e2cb7dfa5275eed3698436371cc9f',
    },
    offchain: {
      id: '94092f73-cf17-4ef2-a5fd-aba6f5b7d71d',
      name: 'ofcbtu',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BUIDL,
    fullName: 'BlackRock USD Institutional Digital Liquidity Fund',
    decimalPlaces: 6,
    onchain: {
      id: 'b51b9935-842e-4d07-8c52-c81da372f957',
      name: 'buidl',
      contractAddress: '0x7712c34205737192402172409a8f7ccef8aa2aec',
      features: AccountCoin.getFeaturesByTypeExcluding(
        [
          CoinFeature.CUSTODY_BITGO_SINGAPORE,
          CoinFeature.CUSTODY_BITGO_GERMANY,
          CoinFeature.CUSTODY_BITGO_EUROPE_APS,
          CoinFeature.CUSTODY_BITGO_FRANKFURT,
        ],
        ETH_FEATURES
      ) as CoinFeature[],
    },
    offchain: {
      id: 'd45e7c2c-bd1f-4586-8a87-2a715824d665',
      name: 'ofcbuidl',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BULL,
    fullName: '3X Long Bitcoin Token',
    decimalPlaces: 18,
    onchain: {
      id: '43a646c7-f137-4f02-ba36-a98a5c72bf45',
      name: 'bull',
      contractAddress: '0x68eb95dc9934e19b86687a10df8e364423240e94',
    },
    offchain: {
      id: 'fb209277-7c5c-45a6-9e16-8aa94f481e14',
      name: 'ofcbull',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BURP,
    fullName: 'Big Town Chef',
    decimalPlaces: 18,
    onchain: {
      id: '6ba90277-ed4f-428e-9a9a-ae6d17f324b7',
      name: 'burp',
      contractAddress: '0x33f391f4c4fe802b70b77ae37670037a92114a7c',
    },
    offchain: {
      id: '03ff6079-6ab3-405f-9268-1bfd62a82d3a',
      name: 'ofcburp',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BUSD,
    fullName: 'Binance USD',
    decimalPlaces: 18,
    onchain: {
      id: 'e9ba7fec-7824-40ad-9d51-2b973585325c',
      name: 'busd',
      contractAddress: '0x4fabb145d64652a948d72533023f6e7a623c7c53',
      features: [...ACCOUNT_COIN_DEFAULT_FEATURES, CoinFeature.STABLECOIN] as CoinFeature[],
    },
    offchain: {
      id: '779e9fa5-e4f2-4c74-947a-5b5df61e66df',
      name: 'ofcbusd',
      features: [CoinFeature.STABLECOIN] as CoinFeature[],
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BUY,
    fullName: 'buying.com',
    decimalPlaces: 18,
    onchain: {
      id: '21ea5ea7-8660-4e68-aa17-1c9bed6f623d',
      name: 'buy',
      contractAddress: '0x0d7f0fa3a79bfedbab291da357958596c74e27d7',
    },
    offchain: {
      id: 'a18cad7d-f8e8-46d1-bd50-24ae9ce06645',
      name: 'ofcbuy',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BPT,
    fullName: 'BlackPool Token',
    decimalPlaces: 18,
    onchain: {
      id: '1f3e6a00-3c4d-4d93-8f46-863262f0f605',
      name: 'bpt',
      contractAddress: '0x0ec9f76202a7061eb9b3a7d6b59d36215a7e37da',
    },
    offchain: {
      id: '2e291978-8710-4f82-bd69-c55e9f9fef83',
      name: 'ofcbpt',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BNVDA,
    fullName: 'Backed NVIDIA Corp',
    decimalPlaces: 18,
    onchain: {
      id: '985807cc-6c4e-4d1e-83c5-b65d559d9ae5',
      name: 'bnvda',
      contractAddress: '0xa34c5e0abe843e10461e2c9586ea03e55dbcc495',
      features: AccountCoin.DEFAULT_FEATURES_EXCLUDE_SINGAPORE as CoinFeature[],
    },
    offchain: {
      id: '3be6cc4a-9bc7-4fdc-ac4e-3f8e1e644f63',
      name: 'ofcbnvda',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BXX,
    fullName: 'Baanx',
    decimalPlaces: 18,
    onchain: {
      id: '44fefbae-d835-4fb2-931a-22167f9f4894',
      name: 'bxx',
      contractAddress: '0x6b1a8f210ec6b7b6643cea3583fb0c079f367898',
    },
    offchain: {
      id: 'f806fdf8-53f5-437d-a98a-615dbb5fe492',
      name: 'ofcbxx',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BXXV1,
    fullName: 'Baanxv1',
    decimalPlaces: 18,
    onchain: {
      id: 'd6dd4bd0-204c-4ade-a221-730ce419941e',
      name: 'bxxv1',
      contractAddress: '0x54f9b4b4485543a815c51c412a9e20436a06491d',
    },
    offchain: {
      id: 'be8b87fe-70f9-4650-a2c1-918e56a560ca',
      name: 'ofcbxxv1',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BZZ,
    fullName: 'BZZ',
    decimalPlaces: 16,
    onchain: {
      id: '228af0db-63c3-4d3e-8fcf-08b2df84d740',
      name: 'bzz',
      contractAddress: '0x19062190b1925b5b6689d7073fdfc8c2976ef8cb',
    },
    offchain: {
      id: 'cb9309fa-257e-4bd1-b582-2005da706e63',
      name: 'ofcbzz',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.C8P,
    fullName: 'C8 Plus',
    decimalPlaces: 6,
    onchain: {
      id: 'f0024989-19b4-4a0e-9c0d-222f5470768c',
      name: 'c8p',
      contractAddress: '0x6930d2299964bcc81b8bcb453a522791e6488be1',
    },
    offchain: {
      id: '834c8fde-8569-4413-b027-0bd71115d4eb',
      name: 'ofcc8p',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.C98,
    fullName: 'Coin98',
    decimalPlaces: 18,
    onchain: {
      id: 'e6081e58-db09-47d3-8e9f-4cd23d376d65',
      name: 'c98',
      contractAddress: '0xae12c5930881c53715b369cec7606b70d8eb229f',
    },
    offchain: {
      id: '313b9a7c-8e6e-4706-842e-47a8c1407509',
      name: 'ofcc98',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.CACXT,
    fullName: 'Cacxt',
    decimalPlaces: 18,
    onchain: {
      id: '2e89c17d-fc36-4ec5-8e0a-c245b0381ad2',
      name: 'cacxt',
      contractAddress: '0xe2b8c4938a3103c1ab5c19a6b93d07ab6f9da2ba',
    },
    offchain: {
      id: '1aef7077-425c-40fa-a006-8d52b99225b0',
      name: 'ofccacxt',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.CADX,
    fullName: 'eToro Canadian Dollar',
    decimalPlaces: 18,
    onchain: {
      id: '5f50bb10-50b0-41cd-9894-6b29cc4e690f',
      name: 'cadx',
      contractAddress: '0x8ed876e408959643479534a21970ec023d0fb51e',
    },
    offchain: {
      id: 'd918bdf9-1173-4981-8a96-c23256e82bb5',
      name: 'ofccadx',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.CAG,
    fullName: 'Change',
    decimalPlaces: 18,
    onchain: {
      id: '49ba61c3-1395-4f2f-b880-8fa674182853',
      name: 'cag',
      contractAddress: '0x7d4b8cce0591c9044a22ee543533b72e976e36c3',
    },
    offchain: {
      id: 'ce9dd20d-37c8-4166-8702-b3d6a36b42c4',
      name: 'ofccag',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.CBAT,
    fullName: 'Compound BAT',
    decimalPlaces: 8,
    onchain: {
      id: 'afdc70d6-dbfd-46c6-9633-7af28f077662',
      name: 'cbat',
      contractAddress: '0x6c8c6b02e7b2be14d4fa6022dfd6d75921d90e4e',
      features: AccountCoin.DEFAULT_FEATURES_EXCLUDE_SINGAPORE as CoinFeature[],
    },
    offchain: {
      id: 'c44f8cfa-a040-4fc4-a13a-a5826be94371',
      name: 'ofccbat',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.CBRL,
    fullName: 'Crypto BRL',
    decimalPlaces: 6,
    onchain: {
      id: '6c9c046a-2d9e-425c-9408-5db99e0ce1a7',
      name: 'cbrl',
      contractAddress: '0xa6fa6531acdf1f9f96eddd66a0f9481e35c2e42a',
    },
    offchain: {
      id: 'ec94eafb-ad87-4883-b973-defa7b420153',
      name: 'ofccbrl',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.CBC,
    fullName: 'CashBet Coin',
    decimalPlaces: 8,
    onchain: {
      id: '1ea6337c-8dab-4b57-a42e-8178dda37105',
      name: 'cbc',
      contractAddress: '0x26db5439f651caf491a87d48799da81f191bdb6b',
    },
    offchain: {
      id: 'a72fa274-c9c3-4f21-9c25-52be0c115af3',
      name: 'ofccbc',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.CCT,
    fullName: 'Cyber Credit Token',
    decimalPlaces: 0,
    onchain: {
      id: 'a523c7df-e779-4ce2-bf68-d768d68afc5e',
      name: 'cct',
      contractAddress: '0x8469e5158fb3c043cf88ce769c94e4b9fc8d79b5',
      features: AccountCoin.DEFAULT_FEATURES_EXCLUDE_SINGAPORE as CoinFeature[],
    },
    offchain: {
      id: '2c796e59-0b65-48e1-a6a6-52a351c382ab',
      name: 'ofccct',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.CDAG,
    fullName: 'CannDollar',
    decimalPlaces: 18,
    onchain: {
      id: '3f222275-9456-4eff-840d-4fe873676619',
      name: 'cdag',
      contractAddress: '0xf43401ea8ac4b86155b929e1a5a5e46626c23842',
    },
    offchain: {
      id: '9ce18e4c-a37e-4ac1-a13b-260162b970c7',
      name: 'ofccdag',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.CDAI,
    fullName: 'Compound DAI',
    decimalPlaces: 8,
    onchain: {
      id: '41bf6a35-3f4d-4ff2-99bf-1c1c2c98c139',
      name: 'cdai',
      contractAddress: '0xf5dce57282a584d2746faf1593d3121fcac444dc',
    },
    offchain: {
      id: '3bc8af6b-7173-4f61-a8db-a0356fd956c0',
      name: 'ofccdai',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.CDT,
    fullName: 'Blox',
    decimalPlaces: 18,
    onchain: {
      id: '9e5041fe-a4c5-4c03-b1aa-360b54e939ad',
      name: 'cdt',
      contractAddress: '0x177d39ac676ed1c67a2b268ad7f1e58826e5b0af',
    },
    offchain: {
      id: 'b06b8e98-359a-4382-939b-2d515b09d771',
      name: 'ofccdt',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.CEL,
    fullName: 'Celsius',
    decimalPlaces: 4,
    onchain: {
      id: '4576b089-f249-458d-865b-d3ae4b0b142a',
      name: 'cel',
      contractAddress: '0xaaaebe6fe48e54f431b0c390cfaf0b017d09d42d',
      features: AccountCoin.getFeaturesByTypeExcluding(
        [
          CoinFeature.CUSTODY_BITGO_SINGAPORE,
          CoinFeature.CUSTODY_BITGO_CUSTODY_MENA_FZE,
          CoinFeature.CUSTODY_BITGO_MENA_FZE,
        ],
        ETH_FEATURES_WITH_FRANKFURT
      ) as CoinFeature[],
    },
    offchain: {
      id: '50dab286-6071-4298-893b-fb6c38e3442b',
      name: 'ofccel',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.CELR,
    fullName: 'Celer Network',
    decimalPlaces: 18,
    onchain: {
      id: 'a5dfdbdd-aff4-4a38-a798-37225afb2c8c',
      name: 'celr',
      contractAddress: '0x4f9254c83eb525f9fcf346490bbb3ed28a81c667',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: '94ea31eb-f35d-4075-a9fe-90a91a6b03f8',
      name: 'ofccelr',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.CETH,
    fullName: 'Compound Ether',
    decimalPlaces: 8,
    onchain: {
      id: '9f27c36b-192b-46e6-9fd6-2c2b0634edf5',
      name: 'ceth',
      contractAddress: '0x4ddc2d193948926d02f9b1fe9e1daa0718270ed5',
      features: AccountCoin.getFeaturesByTypeExcluding(
        [
          CoinFeature.CUSTODY_BITGO_SINGAPORE,
          CoinFeature.CUSTODY_BITGO_GERMANY,
          CoinFeature.CUSTODY_BITGO_EUROPE_APS,
          CoinFeature.CUSTODY_BITGO_FRANKFURT,
        ],
        ETH_FEATURES
      ) as CoinFeature[],
    },
    offchain: {
      id: '3c79156b-97aa-4a25-aafe-87a8abf71eac',
      name: 'ofcceth',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.CFX,
    fullName: 'Conflux',
    decimalPlaces: 18,
    onchain: {
      id: 'fd41106e-cf6f-4f0c-9868-a41fbcec8a49',
      name: 'cfx',
      contractAddress: '0x969faf8ca66b0d53a5196b5d3a0952cd3a88e074',
      features: [...AccountCoin.DEFAULT_FEATURES, CoinFeature.DEPRECATED] as CoinFeature[],
    },
    offchain: {
      id: 'f019a286-14bb-4e27-9c08-3c6216a59851',
      name: 'ofccfx',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.CHO,
    fullName: 'choise.com',
    decimalPlaces: 18,
    onchain: {
      id: '843616fb-63cf-42d6-9dae-f3362864bd8f',
      name: 'cho',
      contractAddress: '0xbba39fd2935d5769116ce38d46a71bde9cf03099',
    },
    offchain: {
      id: '67fb4a6f-ba00-41fd-972d-728d2226a3d5',
      name: 'ofccho',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.CHFX,
    fullName: 'eToro Swiss Frank',
    decimalPlaces: 18,
    onchain: {
      id: 'f23e7dde-44a8-49d1-9576-8fa414c13620',
      name: 'chfx',
      contractAddress: '0xe435502c85a4e7e79cfab4167af566c27a7a0784',
    },
    offchain: {
      id: '52565945-376c-4ffd-8544-9638adbf9e1b',
      name: 'ofcchfx',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.CHR,
    fullName: 'Chroma',
    decimalPlaces: 6,
    onchain: {
      id: 'ff080c26-271a-409b-9b64-cd5058f78a4f',
      name: 'chr',
      contractAddress: '0x8a2279d4a90b6fe1c4b30fa660cc9f926797baa2',
    },
    offchain: {
      id: 'b009d5c3-b5f2-4f0e-bbe2-7ef61410db93',
      name: 'ofcchr',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.CHSB,
    fullName: 'SwissBorg',
    decimalPlaces: 8,
    onchain: {
      id: '69d74774-7c2a-4ff2-97b3-d3c98963699f',
      name: 'chsb',
      contractAddress: '0xba9d4199fab4f26efe3551d490e3821486f135ba',
    },
    offchain: {
      id: '37e74937-5392-423b-a3d5-d46dfb15251c',
      name: 'ofcchsb',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.CHZ,
    fullName: 'Chiliz',
    decimalPlaces: 18,
    onchain: {
      id: '06cd4aa0-f403-424e-9802-ae6e23f21922',
      name: 'chz',
      contractAddress: '0x3506424f91fd33084466f402d5d97f05f8e3b4af',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: '603e60b6-a12b-4e8a-8a8c-44a7fe9ed613',
      name: 'ofcchz',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.CIBO,
    fullName: 'Cibola',
    decimalPlaces: 18,
    onchain: {
      id: '47586cb6-5458-458a-bc98-aa46b50bfc30',
      name: 'cibo',
      contractAddress: '0xd66a2429694446565772636a6a29bd394c07b35b',
    },
    offchain: {
      id: '747ade2c-4b74-4de6-b687-4f508ae23458',
      name: 'ofccibo',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.CIX100,
    fullName: 'Cryptoindex 100',
    decimalPlaces: 18,
    onchain: {
      id: '6e537d9d-766a-47d4-8ee5-66e7b278c0a6',
      name: 'cix100',
      contractAddress: '0x6393e822874728f8afa7e1c9944e417d37ca5878',
    },
    offchain: {
      id: '783d06f0-45ee-48bb-abb7-2c34f561eabe',
      name: 'ofccix100',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.CLIQ,
    fullName: 'DefiCliq',
    decimalPlaces: 18,
    onchain: {
      id: '6ba1d5ad-d4d3-4555-a413-d4203460afea',
      name: 'cliq',
      contractAddress: '0x0def8d8adde14c9ef7c2a986df3ea4bd65826767',
    },
    offchain: {
      id: '9560d12b-b0a8-4bc9-afa3-1b87ba3d00b6',
      name: 'ofccliq',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.CLN,
    fullName: 'Colu Local Network',
    decimalPlaces: 18,
    onchain: {
      id: 'd51eaf06-a417-43a0-b88d-ced83a8fe315',
      name: 'cln',
      contractAddress: '0x4162178b78d6985480a308b2190ee5517460406d',
      features: AccountCoin.getFeaturesByTypeExcluding(
        [
          CoinFeature.CUSTODY_BITGO_GERMANY,
          CoinFeature.CUSTODY_BITGO_EUROPE_APS,
          CoinFeature.CUSTODY_BITGO_FRANKFURT,
          CoinFeature.CUSTODY_BITGO_SINGAPORE,
        ],
        ETH_FEATURES
      ) as CoinFeature[],
    },
    offchain: {
      id: 'e43626e5-23e9-4fa2-8c1e-14a244c8174b',
      name: 'ofccln',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.CLT,
    fullName: 'CoinLoan Token',
    decimalPlaces: 8,
    onchain: {
      id: 'f53296e8-f0a8-4e16-8a3c-851980e0e619',
      name: 'clt',
      contractAddress: '0x2001f2a0cf801ecfda622f6c28fb6e10d803d969',
      features: [
        ...ACCOUNT_COIN_DEFAULT_FEATURES_EXCLUDE_SINGAPORE_AND_MENA_FZE,
        CoinFeature.BULK_TRANSACTION,
      ] as CoinFeature[],
    },
    offchain: {
      id: '8acb9d6e-9f29-40e3-9b07-2305bb79ec58',
      name: 'ofcclt',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.CLV,
    fullName: 'Clover Token',
    decimalPlaces: 18,
    onchain: {
      id: '97c1443c-de9e-43c8-ba15-fc77f948f5d7',
      name: 'clv',
      contractAddress: '0x80c62fe4487e1351b47ba49809ebd60ed085bf52',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: '95cfffad-9c22-4033-a588-426db31578b2',
      name: 'ofcclv',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.CNG,
    fullName: 'Changer',
    decimalPlaces: 18,
    onchain: {
      id: '631e1421-4e36-45a4-8fd7-6240664f0a8f',
      name: 'cng',
      contractAddress: '0x5c1d9aa868a30795f92fae903edc9eff269044bf',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: '730fcb90-75f1-4d65-9aed-8064eef0a20f',
      name: 'ofccng',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.CNYX,
    fullName: 'eToro Chinese Yuan',
    decimalPlaces: 18,
    onchain: {
      id: 'bf0522d4-d7e8-4390-af78-e983524a4ff4',
      name: 'cnyx',
      contractAddress: '0x319ad3ff82bedddb3bc85fd7943002d25cdb3cb9',
    },
    offchain: {
      id: '8047f346-0775-4be8-b276-d344456c6c8d',
      name: 'ofccnyx',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.COMP,
    fullName: 'Compound Token',
    decimalPlaces: 18,
    onchain: {
      id: 'b75a783d-1d0e-4cf7-b22e-a7960ab81624',
      name: 'comp',
      contractAddress: '0xc00e94cb662c3520282e6f5717214004a7f26888',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: 'e20ad46f-91ca-4bed-9484-74d1b4808672',
      name: 'ofccomp',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.CONV,
    fullName: 'Convergence',
    decimalPlaces: 18,
    onchain: {
      id: 'befaa1e4-fae2-4cd7-a49e-2a49b363f7aa',
      name: 'conv',
      contractAddress: '0xc834fa996fa3bec7aad3693af486ae53d8aa8b50',
    },
    offchain: {
      id: '2936e10e-19f1-4b05-aaec-ff0865d17c6b',
      name: 'ofcconv',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.COTI,
    fullName: 'COTI Token',
    decimalPlaces: 18,
    onchain: {
      id: '7f7be340-4fa6-43f6-a1c3-eeb8c8a5c588',
      name: 'coti',
      contractAddress: '0xddb3422497e61e13543bea06989c0789117555c5',
    },
    offchain: {
      id: 'd37c6a8b-ddc8-4984-b2c0-317c18a8e4e1',
      name: 'ofccoti',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.COVER,
    fullName: 'Cover',
    decimalPlaces: 18,
    onchain: {
      id: '2060e74f-1a6b-409d-8d79-755dccef17a0',
      name: 'cover',
      contractAddress: '0x5d8d9f5b96f4438195be9b99eee6118ed4304286',
      features: AccountCoin.getFeaturesByTypeExcluding(
        [
          CoinFeature.CUSTODY_BITGO_GERMANY,
          CoinFeature.CUSTODY_BITGO_EUROPE_APS,
          CoinFeature.CUSTODY_BITGO_FRANKFURT,
          CoinFeature.CUSTODY_BITGO_SINGAPORE,
          CoinFeature.CUSTODY_BITGO_CUSTODY_MENA_FZE,
        ],
        ETH_FEATURES
      ) as CoinFeature[],
    },
    offchain: {
      id: '4999dfa6-e8e4-4df6-b985-4e9f0ae2f970',
      name: 'ofccover',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.CPAY,
    fullName: 'Cryptopay',
    decimalPlaces: 0,
    onchain: {
      id: '86083e85-1847-46d8-ad81-319a351b22f0',
      name: 'cpay',
      contractAddress: '0x0ebb614204e47c09b6c3feb9aaecad8ee060e23e',
      features: ACCOUNT_COIN_DEFAULT_FEATURES_EXCLUDE_SINGAPORE as CoinFeature[],
    },
    offchain: {
      id: 'f93dc8ab-068d-4ab1-bb28-28e29ef10d9e',
      name: 'ofccpay',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.CPLT,
    fullName: 'Coineru Platinum',
    decimalPlaces: 8,
    onchain: {
      id: 'acb5348f-fea4-4b6e-950c-ca1857f42a12',
      name: 'cplt',
      contractAddress: '0xa3f7871a4b86bcc3b6e97c8fd0745e71c55e1f82',
    },
    offchain: {
      id: '21b8d4e2-bf3b-4b21-bcaf-2a5f00da571a',
      name: 'ofccplt',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.CQT,
    fullName: 'Covalent',
    decimalPlaces: 18,
    onchain: {
      id: '623bc418-63ad-4ffe-b1a9-59323b9092af',
      name: 'cqt',
      contractAddress: '0xd417144312dbf50465b1c641d016962017ef6240',
    },
    offchain: {
      id: '0c988abe-9ec4-4620-8cde-2a2861846259',
      name: 'ofccqt',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.CQX,
    fullName: 'Coinquista Coin',
    decimalPlaces: 18,
    onchain: {
      id: 'c5f33875-5134-40e4-ac88-e50682b6aed8',
      name: 'cqx',
      contractAddress: '0x618c29dd2d16475b2ae6244f9e8aaead68f0ca44',
    },
    offchain: {
      id: '4b27c0d9-c64c-4b83-b5e3-d4ad44ca45a5',
      name: 'ofccqx',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.CRA,
    fullName: 'Crabada',
    decimalPlaces: 18,
    onchain: {
      id: '315569f2-88ae-4780-bd23-9edbe108b5b8',
      name: 'cra',
      contractAddress: '0xa32608e873f9ddef944b24798db69d80bbb4d1ed',
    },
    offchain: {
      id: '85aa8d06-1d85-4409-a421-99a2609a3106',
      name: 'ofccra',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.CRDT,
    fullName: 'Crypto Daily Token',
    decimalPlaces: 18,
    onchain: {
      id: '379ec26e-01a2-46c1-aead-fc55ea9854cd',
      name: 'crdt',
      contractAddress: '0xdaab5e695bb0e8ce8384ee56ba38fa8290618e52',
    },
    offchain: {
      id: 'f8b86eab-46a2-45f5-8028-495c4d213b96',
      name: 'ofccrdt',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.CRE,
    fullName: 'CarryToken',
    decimalPlaces: 18,
    onchain: {
      id: 'a267133a-8886-4c52-8a09-6c62b108b184',
      name: 'cre',
      contractAddress: '0x115ec79f1de567ec68b7ae7eda501b406626478e',
    },
    offchain: {
      id: '40f86be7-2cc3-474a-9629-c69fdbc73f0d',
      name: 'ofccre',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.CREAM,
    fullName: 'Cream',
    decimalPlaces: 18,
    onchain: {
      id: '2ce921af-9ec0-4238-ba2f-30d916beeb59',
      name: 'cream',
      contractAddress: '0x2ba592f78db6436527729929aaf6c908497cb200',
      features: AccountCoin.getFeaturesByTypeExcluding(
        [CoinFeature.CUSTODY_BITGO_MENA_FZE, CoinFeature.CUSTODY_BITGO_SINGAPORE],
        ETH_FEATURES_WITH_FRANKFURT
      ) as CoinFeature[],
    },
    offchain: {
      id: '008e7158-3a4d-465f-922a-ec3cef6d93ca',
      name: 'ofccream',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.CREP,
    fullName: 'Compound Augur',
    decimalPlaces: 8,
    onchain: {
      id: '4bc48062-4e23-4338-9337-418eea86665d',
      name: 'crep',
      contractAddress: '0x158079ee67fce2f58472a96584a73c7ab9ac95c1',
      features: ACCOUNT_COIN_DEFAULT_FEATURES_EXCLUDE_SINGAPORE as CoinFeature[],
    },
    offchain: {
      id: 'f42c6152-5c91-4405-b5bf-9f4326774b60',
      name: 'ofccrep',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.CRO,
    fullName: 'Crypto.com Chain',
    decimalPlaces: 8,
    onchain: {
      id: '60d46b84-16ea-43c0-b36a-1234114ff69f',
      name: 'cro',
      contractAddress: '0xa0b73e1ff0b80914ab6fe0444e65848c4c34450b',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: '3a0ae54e-223c-42c9-918f-effdd297db65',
      name: 'ofccro',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.CRV,
    fullName: 'Curve DAO Token',
    decimalPlaces: 18,
    onchain: {
      id: '3e476749-4c03-4ab8-bf3a-e7353ba85a0f',
      name: 'crv',
      contractAddress: '0xd533a949740bb3306d119cc777fa900ba034cd52',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: '78f617b7-67a5-44e1-9748-b3590ee3b067',
      name: 'ofccrv',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.CRPT,
    fullName: 'Crypterium',
    decimalPlaces: 18,
    onchain: {
      id: '8b93a6ea-4c9f-4b5b-bc94-f677e2a7e402',
      name: 'crpt',
      contractAddress: '0x80a7e048f37a50500351c204cb407766fa3bae7f',
    },
    offchain: {
      id: 'a89c17c5-c666-411d-9f2d-840e201016ce',
      name: 'ofccrpt',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.CRPT1,
    fullName: 'CRPT Token',
    decimalPlaces: 18,
    onchain: {
      id: '9d3974af-dcc3-4778-85f4-0f6838353613',
      name: 'crpt1',
      contractAddress: '0x08389495d7456e1951ddf7c3a1314a4bfb646d8b',
    },
    offchain: {
      id: '04b9042e-11b3-45f1-814a-379789dcc038',
      name: 'ofccrpt1',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.CSLV,
    fullName: 'Coineru Silver',
    decimalPlaces: 8,
    onchain: {
      id: '3965ccc2-6716-4bfa-86aa-cc018f5d3aee',
      name: 'cslv',
      contractAddress: '0x6dc05497f0b087c7692816e6acaa8bdda73907fc',
    },
    offchain: {
      id: '5de47952-2e15-4bf9-9d5e-cb986f376d6f',
      name: 'ofccslv',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.CSP,
    fullName: 'Caspian Token',
    decimalPlaces: 18,
    onchain: {
      id: 'c762f33e-15a9-44af-afef-3dfe17ea8f11',
      name: 'csp',
      contractAddress: '0xa6446d655a0c34bc4f05042ee88170d056cbaf45',
    },
    offchain: {
      id: 'e7adf292-dd01-4d55-aff1-66917e1c491b',
      name: 'ofccsp',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.CTSI,
    fullName: 'Cartesi',
    decimalPlaces: 18,
    onchain: {
      id: 'c6db88ff-ec4a-431f-9640-5a324a3728d4',
      name: 'ctsi',
      contractAddress: '0x491604c0fdf08347dd1fa4ee062a822a5dd06b5d',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: 'a0eb6fcf-584c-4b9d-8872-e0c6d0e31635',
      name: 'ofcctsi',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.CTX,
    fullName: 'Cryptex',
    decimalPlaces: 18,
    onchain: {
      id: '82ddcc28-b8d3-46c7-8a0b-b738a224009e',
      name: 'ctx',
      contractAddress: '0x321c2fe4446c7c963dc41dd58879af648838f98d',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: '0120c3bd-01a5-40d5-9eb5-f0f5473ad67e',
      name: 'ofcctx',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.CUSDC,
    fullName: 'Compound USDC',
    decimalPlaces: 8,
    onchain: {
      id: 'e7550f73-fedd-4eb3-9838-d8b4f63c9a9f',
      name: 'cusdc',
      contractAddress: '0x39aa39c021dfbae8fac545936693ac917d5e7563',
      features: ACCOUNT_COIN_DEFAULT_FEATURES_EXCLUDE_SINGAPORE as CoinFeature[],
    },
    offchain: {
      id: '02e928aa-0141-4846-9ca1-a123db50da63',
      name: 'ofccusdc',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.CWBTC,
    fullName: 'Compound WBTC',
    decimalPlaces: 8,
    onchain: {
      id: '62599dbf-9953-4e99-82bd-9582f19c79de',
      name: 'cwbtc',
      contractAddress: '0xc11b1268c1a384e55c48c2391d8d480264a3a7f4',
      features: ACCOUNT_COIN_DEFAULT_FEATURES_EXCLUDE_SINGAPORE as CoinFeature[],
    },
    offchain: {
      id: '6a0189d7-92b0-402a-b9bf-29e2e445e090',
      name: 'ofccwbtc',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.CVC,
    fullName: 'Civic',
    decimalPlaces: 8,
    onchain: {
      id: '1cc20e86-1e91-49b5-98f0-48f6dd184081',
      name: 'cvc',
      contractAddress: '0x41e5560054824ea6b0732e656e3ad64e20e94e45',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: '65d62bc2-da9a-4cf4-8055-950c30cf7007',
      name: 'ofccvc',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.CVX,
    fullName: 'Convex Finance',
    decimalPlaces: 18,
    onchain: {
      id: '0c1b75bf-14fb-45e6-a794-bdb24693095d',
      name: 'cvx',
      contractAddress: '0x4e3fbd56cd56c3e72c1403e103b45db9da5b9d2b',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: 'a9da25db-54b2-4747-b689-dff98b53914b',
      name: 'ofccvx',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.CXT,
    fullName: 'Covalent X Token',
    decimalPlaces: 18,
    onchain: {
      id: '70d71dca-8065-4240-85d1-678c4902d972',
      name: 'cxt',
      contractAddress: '0x7abc8a5768e6be61a6c693a6e4eacb5b60602c4d',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: '5a2f5c86-2e19-4f6f-961d-6b0c1e1a41c2',
      name: 'ofccxt',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.CYBER,
    fullName: 'Cyber',
    decimalPlaces: 18,
    onchain: {
      id: '605c10a7-7d5e-4674-bca5-72d0e8588652',
      name: 'cyber',
      contractAddress: '0x14778860e937f509e651192a90589de711fb88a9',
    },
    offchain: {
      id: 'b3663f6e-a208-403e-99c6-c69ddcfe6f16',
      name: 'ofccyber',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.CZRX,
    fullName: 'Compound ZRX',
    decimalPlaces: 8,
    onchain: {
      id: '10aff04d-e6b5-4120-b714-8a36a86092ea',
      name: 'czrx',
      contractAddress: '0xb3319f5d18bc0d84dd1b4825dcde5d5f7266d407',
      features: ACCOUNT_COIN_DEFAULT_FEATURES_EXCLUDE_SINGAPORE as CoinFeature[],
    },
    offchain: {
      id: '81952130-ce4b-4fa6-be12-36298dda9879',
      name: 'ofcczrx',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.DACXI,
    fullName: 'Dacxi Coin',
    decimalPlaces: 18,
    onchain: {
      id: '4bf54e88-8fe8-4678-86f1-76ce0a75e641',
      name: 'dacxi',
      contractAddress: '0xefab7248d36585e2340e5d25f8a8d243e6e3193f',
    },
    offchain: {
      id: '8bc56736-ec18-4502-b1ec-4e4502648029',
      name: 'ofcdacxi',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.DAI,
    fullName: 'Dai',
    decimalPlaces: 18,
    onchain: {
      id: 'c8191d9c-bed5-4b55-99db-049ba9c47b30',
      name: 'dai',
      contractAddress: '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: '847caaf2-f113-4bea-84cd-b381f0b3a0f4',
      name: 'ofcdai',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.DAO,
    fullName: 'DAO Maker',
    decimalPlaces: 18,
    onchain: {
      id: '51ff3f92-371e-4069-85dc-7ee15836a0a5',
      name: 'dao',
      contractAddress: '0x0f51bb10119727a7e5ea3538074fb341f56b09ad',
    },
    offchain: {
      id: '3ffbfd6d-adf6-499e-a6ba-b1888b7f08db',
      name: 'ofcdao',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.DATA,
    fullName: 'Streamr DATAcoin',
    decimalPlaces: 18,
    onchain: {
      id: 'eca315ed-077a-4c1d-97de-ea82260f7b2c',
      name: 'data',
      contractAddress: '0x0cf0ee63788a0849fe5297f3407f701e122cc023',
    },
    offchain: {
      id: '04bf9bfb-bab1-4b35-8dee-d81aa61efc1d',
      name: 'ofcdata',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.DATAV2,
    fullName: 'Streamr Data',
    decimalPlaces: 18,
    onchain: {
      id: '8a6f8b46-ff6f-4373-ab90-a414fa9f5306',
      name: 'datav2',
      contractAddress: '0x8f693ca8d21b157107184d29d398a8d082b38b76',
    },
    offchain: {
      id: 'ac2618f0-70d0-4e18-ab9b-2c542e04414d',
      name: 'ofcdatav2',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.DATAECON,
    fullName: 'DATAECON',
    decimalPlaces: 18,
    onchain: {
      id: '45647b2f-0689-4b20-97cb-149ebf84ee25',
      name: 'dataecon',
      contractAddress: '0x33d63ba1e57e54779f7ddaeaa7109349344cf5f1',
      features: AccountCoin.getFeaturesByTypeExcluding(
        [
          CoinFeature.CUSTODY_BITGO_SINGAPORE,
          CoinFeature.CUSTODY_BITGO_GERMANY,
          CoinFeature.CUSTODY_BITGO_EUROPE_APS,
          CoinFeature.CUSTODY_BITGO_FRANKFURT,
        ],
        ETH_FEATURES
      ) as CoinFeature[],
    },
    offchain: {
      id: '2c699f9c-ac37-4d16-8a1b-fbf40b7c4187',
      name: 'ofcdataecon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.DAWN,
    fullName: 'Dawn',
    decimalPlaces: 18,
    onchain: {
      id: '61e56de0-9325-4f78-8c3c-0f5778929539',
      name: 'dawn',
      contractAddress: '0x580c8520deda0a441522aeae0f9f7a5f29629afa',
    },
    offchain: {
      id: '485ec940-c8e2-4f44-a5df-c2d619e43a9e',
      name: 'ofcdawn',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.DEC,
    fullName: 'Dark Energy Crystals',
    decimalPlaces: 3,
    onchain: {
      id: 'ec981505-b28d-4b1c-8a27-c52f55de54b8',
      name: 'dec',
      contractAddress: '0x9393fdc77090f31c7db989390d43f454b1a6e7f3',
    },
    offchain: {
      id: 'ae565f9d-bbdf-4548-968b-12b5b52bc851',
      name: 'ofcdec',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.DEGO,
    fullName: 'Dego Finance',
    decimalPlaces: 18,
    onchain: {
      id: '4d749bdf-3d28-42f4-b348-447564be1d1c',
      name: 'dego',
      contractAddress: '0x3da932456d082cba208feb0b096d49b202bf89c8',
    },
    offchain: {
      id: '635c0868-c8ee-4df4-8437-605e0b0c939b',
      name: 'ofcdego',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.DENT,
    fullName: 'Dent',
    decimalPlaces: 8,
    onchain: {
      id: '97281c81-79a9-4d6f-a9d9-a0665c683792',
      name: 'dent',
      contractAddress: '0x3597bfd533a99c9aa083587b074434e61eb0a258',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: '5b5f980a-d38f-431a-bfdf-0378881c0bcd',
      name: 'ofcdent',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.DEP,
    fullName: 'Deap Coin',
    decimalPlaces: 18,
    onchain: {
      id: 'ebfd93a9-bdca-4e1f-8252-bbed553fed48',
      name: 'dep',
      contractAddress: '0x1a3496c18d558bd9c6c8f609e1b129f67ab08163',
    },
    offchain: {
      id: '8a2e92c4-4808-44a0-860b-4fbfbd8ffdcb',
      name: 'ofcdep',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.DEXA,
    fullName: 'Dexa Coin',
    decimalPlaces: 18,
    onchain: {
      id: '2359e09f-968f-4b85-9592-f5ff4d43065b',
      name: 'dexa',
      contractAddress: '0x725440512cb7b78bf56b334e50e31707418231cb',
    },
    offchain: {
      id: '2f46e598-49d0-49af-a2ed-d79239457508',
      name: 'ofcdexa',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.DEXE,
    fullName: 'DeXe',
    decimalPlaces: 18,
    onchain: {
      id: '0d67fc72-9f97-4ddd-8c45-75745411c9ab',
      name: 'dexe',
      contractAddress: '0xde4ee8057785a7e8e800db58f9784845a5c2cbd6',
    },
    offchain: {
      id: '0054e435-3baa-4360-b4e8-e2f6ecb51bb9',
      name: 'ofcdexe',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.DFD,
    fullName: 'DeFiDollar DAO',
    decimalPlaces: 18,
    onchain: {
      id: '13e14a91-cdff-435d-b6a9-7bbf0b79e51c',
      name: 'dfd',
      contractAddress: '0x20c36f062a31865bed8a5b1e512d9a1a20aa333a',
    },
    offchain: {
      id: '95ba6b46-f91b-4d1f-8a43-d9a4aa755d93',
      name: 'ofcdfd',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.DFI,
    fullName: 'DeFiChain',
    decimalPlaces: 8,
    onchain: {
      id: 'cff0fd37-72ea-4f96-b595-ab204d237420',
      name: 'dfi',
      contractAddress: '0x8fc8f8269ebca376d046ce292dc7eac40c8d358a',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: '801e7818-722a-4c47-81af-69ed982c1f16',
      name: 'ofcdfi',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.DFX,
    fullName: 'DFX Token',
    decimalPlaces: 18,
    onchain: {
      id: 'a51ea723-2d14-4a1a-8e39-b688e436896d',
      name: 'dfx',
      contractAddress: '0x888888435fde8e7d4c54cab67f206e4199454c60',
    },
    offchain: {
      id: 'e37eda5c-ba46-4f05-b0c0-17aadce3a608',
      name: 'ofcdfx',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.DGCL,
    fullName: 'Dgcl',
    decimalPlaces: 18,
    onchain: {
      id: '8a3cdf12-ee74-4284-8883-3d69e83d7a01',
      name: 'dgcl',
      contractAddress: '0x63b8b7d4a3efd0735c4bffbd95b332a55e4eb851',
    },
    offchain: {
      id: '509fbf1e-133f-494b-9e00-cb75175ea5e5',
      name: 'ofcdgcl',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.DGD,
    fullName: 'Digix DAO',
    decimalPlaces: 9,
    onchain: {
      id: 'ce3cecf2-ec7c-4a0f-81dd-a06a46d524a2',
      name: 'dgd',
      contractAddress: '0xe0b7927c4af23765cb51314a0e0521a9645f0e2a',
    },
    offchain: {
      id: 'fe318b24-fb28-4cd4-a7d6-f009c9ddc206',
      name: 'ofcdgd',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.DGLD,
    fullName: 'Digital Gold',
    decimalPlaces: 18,
    onchain: {
      id: '23719fdc-416a-4f2f-b90f-7af874e98e7a',
      name: 'dgld',
      contractAddress: '0xa9299c296d7830a99414d1e5546f5171fa01e9c8',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: 'e4650916-fb5e-4dd7-8650-0762e76f822a',
      name: 'ofcdgld',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.DGX,
    fullName: 'Digix',
    decimalPlaces: 9,
    onchain: {
      id: '5847740c-8ff2-414a-ba65-e9fa48b847f6',
      name: 'dgx',
      contractAddress: '0x4f3afec4e5a3f2a6a1a411def7d7dfe50ee057bf',
    },
    offchain: {
      id: '186c3507-fdc5-4813-abdc-9e3a73d68419',
      name: 'ofcdgx',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.DIGG,
    fullName: 'Digg',
    decimalPlaces: 9,
    onchain: {
      id: '8e96f70f-6f2c-43eb-bdc1-41d7d143e956',
      name: 'digg',
      contractAddress: '0x798d1be841a82a273720ce31c822c61a67a601c3',
    },
    offchain: {
      id: '93faed38-9923-46a6-952d-011f06102075',
      name: 'ofcdigg',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.DIA,
    fullName: 'DIAToken',
    decimalPlaces: 18,
    onchain: {
      id: 'a429f318-2c26-4407-ac96-34382156b177',
      name: 'dia',
      contractAddress: '0x84ca8bc7997272c7cfb4d0cd3d55cd942b3c9419',
    },
    offchain: {
      id: 'af198c54-53d5-42b3-9e69-7fcc5887c0a0',
      name: 'ofcdia',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.DIPE,
    fullName: 'DIPE',
    decimalPlaces: 6,
    onchain: {
      id: '2c5d2806-5592-4ae2-84f6-33fd2b862d6e',
      name: 'dipe',
      contractAddress: '0x757a03cd018d020955b4324feecccf93d1c5be27',
    },
    offchain: {
      id: 'ea150c4b-4384-45ce-963c-68ef5959facd',
      name: 'ofcdipe',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.DMG,
    fullName: 'DMM: Governance',
    decimalPlaces: 18,
    onchain: {
      id: '429ed0f6-7fa8-4bcb-9573-654762805725',
      name: 'dmg',
      contractAddress: '0xed91879919b71bb6905f23af0a68d231ecf87b14',
    },
    offchain: {
      id: '49bf3174-4b13-49e2-bdea-33491779b11c',
      name: 'ofcdmg',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.DMT,
    fullName: 'DMarket',
    decimalPlaces: 8,
    onchain: {
      id: 'd0c06c93-17e3-4714-bcee-6fc7cc19560d',
      name: 'dmt',
      contractAddress: '0x2ccbff3a042c68716ed2a2cb0c544a9f1d1935e1',
    },
    offchain: {
      id: 'c9301b06-3bd2-4de3-8977-831c168328a7',
      name: 'ofcdmt',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.DODO,
    fullName: 'DODO',
    decimalPlaces: 18,
    onchain: {
      id: '2d83e31d-a673-4e63-b21b-a8304c61b3ab',
      name: 'dodo',
      contractAddress: '0x43dfc4159d86f3a37a5a4b3d4580b888ad7d4ddd',
    },
    offchain: {
      id: '2f23fc77-132b-4a30-a8ff-9320f9e7a57d',
      name: 'ofcdodo',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.DPI,
    fullName: 'DeFi Pulse Index',
    decimalPlaces: 18,
    onchain: {
      id: '419cfaf4-1418-4ae1-8ee6-86eb8e5d4c57',
      name: 'dpi',
      contractAddress: '0x1494ca1f11d487c2bbe4543e90080aeba4ba3c2b',
      features: AccountCoin.getFeaturesByTypeExcluding(
        [
          CoinFeature.CUSTODY_BITGO_SINGAPORE,
          CoinFeature.CUSTODY_BITGO_GERMANY,
          CoinFeature.CUSTODY_BITGO_EUROPE_APS,
          CoinFeature.CUSTODY_BITGO_FRANKFURT,
        ],
        ETH_FEATURES
      ) as CoinFeature[],
    },
    offchain: {
      id: '1be8da1d-c4de-4e18-8e70-9bc8fceb3ba0',
      name: 'ofcdpi',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.DRPU,
    fullName: 'DRP Utility',
    decimalPlaces: 8,
    onchain: {
      id: '1ac0596d-5b05-4c4e-b6b4-4a5eb0310944',
      name: 'drpu',
      contractAddress: '0xe30e02f049957e2a5907589e06ba646fb2c321ba',
    },
    offchain: {
      id: '4fac9127-a1c2-4f74-8de0-f399dcadc3a0',
      name: 'ofcdrpu',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.DRV,
    fullName: 'Drive',
    decimalPlaces: 18,
    onchain: {
      id: '1027d048-0821-48a1-9f15-100e836d9ff4',
      name: 'drv',
      contractAddress: '0x0b9d89a71bdabd231d4d497b7b7b879740d739c4',
    },
    offchain: {
      id: '2b70aed2-de74-4c59-b14e-342c38d3c4d3',
      name: 'ofcdrv',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.DUC,
    fullName: 'DUING COIN',
    decimalPlaces: 18,
    onchain: {
      id: '85604baa-9b67-4d4a-9022-2b3cb1a882b7',
      name: 'duc',
      contractAddress: '0xd3d84d494b24661bb4a477169bb24bc905fb55dd',
    },
    offchain: {
      id: 'a935832c-9098-44fd-8fd8-4d13c87a04b6',
      name: 'ofcduc',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.DUST,
    fullName: 'DUST Protocol',
    decimalPlaces: 9,
    onchain: {
      id: '89bba7e7-0534-4f1b-b4e7-df8ea3e83331',
      name: 'dust',
      contractAddress: '0xb5b1b659da79a2507c27aad509f15b4874edc0cc',
    },
    offchain: {
      id: 'ef7d1333-8de5-4523-85cd-6e4ee924fa83',
      name: 'ofcdust',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.DX1U,
    fullName: 'Dx1u',
    decimalPlaces: 8,
    onchain: {
      id: '679e5e93-dab6-4688-8266-c0da32d304c4',
      name: 'dx1u',
      contractAddress: '0x2d8b3bb04864754b1540e3c4758ab00764d00751',
    },
    offchain: {
      id: '492bd833-1a19-46b6-849e-a2423fdb901a',
      name: 'ofcdx1u',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.DXGT,
    fullName: 'Dacxi Gold Token',
    decimalPlaces: 18,
    onchain: {
      id: '36897e3c-674c-407f-8bd5-dec29e10aa59',
      name: 'dxgt',
      contractAddress: '0x51be9f12dd5095c5b1acf90e7e0aa4aa8023218b',
    },
    offchain: {
      id: 'f8e82f95-01b2-4bc7-9651-cfcc489c86ff',
      name: 'ofcdxgt',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.DXO,
    fullName: 'DeepSpace',
    decimalPlaces: 18,
    onchain: {
      id: '207950b2-3e52-4f74-b96a-b5b6441ffe5d',
      name: 'dxo',
      contractAddress: '0x528b3e98c63ce21c6f680b713918e0f89dfae555',
    },
    offchain: {
      id: '876183d1-e0d7-4c1a-b9cf-bf128771daeb',
      name: 'ofcdxo',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.DXPT,
    fullName: 'Dacxi Platinum Token',
    decimalPlaces: 18,
    onchain: {
      id: '70378eb7-02de-4e21-8115-474133d083fc',
      name: 'dxpt',
      contractAddress: '0x155ab266b9226525cfd5b1e7d8a80bab65b6b609',
    },
    offchain: {
      id: 'b17b369f-0720-49dc-9902-ee251fc4db11',
      name: 'ofcdxpt',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.DXST,
    fullName: 'Dacxi Silver Token',
    decimalPlaces: 18,
    onchain: {
      id: 'f60a496a-b5c6-41ef-ae15-556966d8351e',
      name: 'dxst',
      contractAddress: '0xd71bbf61079d3ea7ea7890356850d4579be304af',
    },
    offchain: {
      id: '90fc6735-200c-4f82-ac8b-4b735bd0456e',
      name: 'ofcdxst',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.DYDX,
    fullName: 'dYdX',
    decimalPlaces: 18,
    onchain: {
      id: 'a74a8c00-5e23-43a3-a114-247bb2f8219e',
      name: 'dydx',
      contractAddress: '0x92d6c1e31e14520e676a687f0a93788b716beff5',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: '8933c68b-3171-4e35-8818-7d70bca263f1',
      name: 'ofcdydx',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.DYN,
    fullName: 'DYN Token',
    decimalPlaces: 18,
    onchain: {
      id: '26e1e63e-08e3-4fd9-a1aa-9e738e20530d',
      name: 'dyn',
      contractAddress: '0x65167e381388bc803aa2f22cd99d093068e98007',
    },
    offchain: {
      id: '729e9861-4729-40c8-a20d-b1afbfb10c31',
      name: 'ofcdyn',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.EASY,
    fullName: 'Easy',
    decimalPlaces: 18,
    onchain: {
      id: '2238805b-38e8-45d9-9f3a-37d7f3a92d98',
      name: 'easy',
      contractAddress: '0x913d8adf7ce6986a8cbfee5a54725d9eea4f0729',
      features: [
        ...ACCOUNT_COIN_DEFAULT_FEATURES_EXCLUDE_SINGAPORE_AND_MENA_FZE,
        CoinFeature.BULK_TRANSACTION,
      ] as CoinFeature[],
    },
    offchain: {
      id: 'abddec03-0e38-450d-80ce-ca6d8739be69',
      name: 'ofceasy',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.EBTCQ,
    fullName: 'EmberBTCQuant',
    decimalPlaces: 18,
    onchain: {
      id: 'afc0e68f-7ed8-4f2b-b81d-a5e6436c97f6',
      name: 'ebtcq',
      contractAddress: '0x430a35baa51ddeaccf89092a5edbda47aaae78e4',
    },
    offchain: {
      id: '3aeb268d-6b1f-4ba5-8a90-54d93b7f74fa',
      name: 'ofcebtcq',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ECHT,
    fullName: 'eChat',
    decimalPlaces: 0,
    onchain: {
      id: 'f5ff4cf2-ea33-4bcf-91f0-3dabd1054d3a',
      name: 'echt',
      contractAddress: '0x1aadead0d2e0b6d888ae1d73b11db65a8447634a',
    },
    offchain: {
      id: '3dfdc742-72b7-4a68-8700-01c10c02a22c',
      name: 'ofcecht',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ECOX,
    fullName: 'ECOx',
    decimalPlaces: 18,
    onchain: {
      id: '93c2803d-7c7e-49b3-aa89-754f1506d415',
      name: 'ecox',
      contractAddress: '0xcccd1ba9f7acd6117834e0d28f25645decb1736a',
    },
    offchain: {
      id: '9ceddd4e-41a1-467f-b29a-703a9822561c',
      name: 'ofcecox',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.EDEN,
    fullName: 'Eden',
    decimalPlaces: 18,
    onchain: {
      id: 'e4aa6af6-d658-4588-ad72-9fa4ca687469',
      name: 'eden',
      contractAddress: '0x1559fa1b8f28238fd5d76d9f434ad86fd20d1559',
    },
    offchain: {
      id: 'bea5c16a-c03c-4282-b9ab-d96c6eca98b3',
      name: 'ofceden',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.EDISON,
    fullName: 'Edison',
    decimalPlaces: 8,
    onchain: {
      id: '652432f3-044b-4eb1-a9ff-aeaf0fd73de7',
      name: 'edison',
      contractAddress: '0xed58569d516a5bd37427ebd592a6619c0c581953',
    },
    offchain: {
      id: 'd81b203d-5c0b-4764-84ba-20ce85b9d41e',
      name: 'ofcedison',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.EDLC,
    fullName: 'Edelcoin',
    decimalPlaces: 6,
    onchain: {
      id: '10c38f26-de82-4662-884e-7f8b0834ef0a',
      name: 'edlc',
      contractAddress: '0xc47ef9b19c3e29317a50f5fbe594eba361dada4a',
    },
    offchain: {
      id: '926988f8-6923-4ca5-9bd6-a40eed8dc968',
      name: 'ofcedlc',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.EDN,
    fullName: 'Eden',
    decimalPlaces: 18,
    onchain: {
      id: 'cb3673da-ef47-4773-867d-77de362590fa',
      name: 'edn',
      contractAddress: '0x05860d453c7974cbf46508c06cba14e211c629ce',
    },
    offchain: {
      id: 'df3446d9-4e69-41ed-9ce1-fc75d1be8ef0',
      name: 'ofcedn',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.EDR,
    fullName: 'Endor Protocol',
    decimalPlaces: 18,
    onchain: {
      id: '8e29da90-158b-4fa1-870b-1674f344266f',
      name: 'edr',
      contractAddress: '0xc528c28fec0a90c083328bc45f587ee215760a0f',
      features: ACCOUNT_COIN_DEFAULT_FEATURES_EXCLUDE_SINGAPORE as CoinFeature[],
    },
    offchain: {
      id: '81d817b5-da65-41aa-983a-ec9619a6a46f',
      name: 'ofcedr',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.EFI,
    fullName: 'Efinity',
    decimalPlaces: 18,
    onchain: {
      id: 'd9c54049-dfd9-401f-b997-c843253ac93f',
      name: 'efi',
      contractAddress: '0x656c00e1bcd96f256f224ad9112ff426ef053733',
    },
    offchain: {
      id: 'c74b96eb-2b24-43a6-a718-936526651f3a',
      name: 'ofcefi',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.EGOLD,
    fullName: 'eGold',
    decimalPlaces: 4,
    onchain: {
      id: '87163c81-2572-4694-9e43-d80978ec3cb0',
      name: 'egold',
      contractAddress: '0x8f00458479ea850f584ed82881421f9d9eac6cb1',
    },
    offchain: {
      id: 'e925c83f-bcbd-42a6-90f0-40cc8eae54bd',
      name: 'ofcegold',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['ETH:ECASH'],
    fullName: 'Ethereum Cash',
    decimalPlaces: 18,
    onchain: {
      id: '03423ec5-a65f-428d-9a96-1affb41d583e',
      name: 'eth:ecash',
      contractAddress: '0x5d21ef5f25a985380b65c8e943a0082feda0db84',
    },
    offchain: {
      id: '570832c1-4e4f-4a68-8c0b-3085e065cd9f',
      name: 'ofceth:ecash',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.EGL,
    fullName: 'Ethereum Eagle',
    decimalPlaces: 18,
    onchain: {
      id: 'cd3628a6-9585-4964-9994-f295c65e8338',
      name: 'egl',
      contractAddress: '0x1e83916ea2ef2d7a6064775662e163b2d4c330a7',
    },
    offchain: {
      id: '8ca8c8ac-fba8-48f4-8615-5413017937f0',
      name: 'ofcegl',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.EGLD,
    fullName: 'Elrond Gold',
    decimalPlaces: 18,
    onchain: {
      id: 'ae5df7c0-e10d-444a-80ea-c07b9f49048b',
      name: 'egld',
      contractAddress: '0xe3fb646fc31ca12657b17070bc31a52e323b8543',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: 'f4fed641-f2e2-4fc7-b55b-62c0477b1301',
      name: 'ofcegld',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.EIGEN,
    fullName: 'Eigen',
    decimalPlaces: 18,
    onchain: {
      id: '43d681ad-0191-45f0-800e-b027f277e7d4',
      name: 'eigen',
      contractAddress: '0xec53bf9167f50cdeb3ae105f56099aaab9061f83',
      features: [...EIGEN_FEATURES, CoinFeature.CUSTODY_BITGO_FRANKFURT] as CoinFeature[],
    },
    offchain: {
      id: '0ee531d4-6df5-437d-aec5-aa72e33ac775',
      name: 'ofceigen',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ELF,
    fullName: 'Aelf',
    decimalPlaces: 18,
    onchain: {
      id: 'e7d90271-7d08-443a-9feb-37c83086d39c',
      name: 'elf',
      contractAddress: '0xbf2179859fc6d5bee9bf9158632dc51678a4100e',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: '66be30f3-4a5d-44fb-b5b9-633dee857479',
      name: 'ofcelf',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ERD,
    fullName: 'Elrond',
    decimalPlaces: 18,
    onchain: {
      id: 'a2f990a7-5109-4d67-8042-69c341053394',
      name: 'erd',
      contractAddress: '0xf9986d445ced31882377b5d6a5f58eaea72288c3',
    },
    offchain: {
      id: '9b8af64f-7fe5-4e86-838c-27344322a709',
      name: 'ofcerd',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ESE,
    fullName: 'Eesee',
    decimalPlaces: 18,
    onchain: {
      id: 'a5bd0bb2-d226-4974-b4fe-e086a8e28ae8',
      name: 'ese',
      contractAddress: '0x908ddb096bfb3acb19e2280aad858186ea4935c4',
    },
    offchain: {
      id: 'f08fa2d8-ef9a-4ce2-a1c3-80349758282e',
      name: 'ofcese',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.EMAID,
    fullName: 'MaidSafeCoin',
    decimalPlaces: 18,
    onchain: {
      id: 'ff3bb4e9-66d4-4bb1-9df4-875d5d787e4a',
      name: 'emaid',
      contractAddress: '0x329c6e459ffa7475718838145e5e85802db2a303',
    },
    offchain: {
      id: '8f0a792f-0961-4896-a177-d93288542342',
      name: 'ofcemaid',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.EMB,
    fullName: 'Emblem',
    decimalPlaces: 8,
    onchain: {
      id: 'b0fc73c1-bf01-4b48-9463-b08c291c5e0f',
      name: 'emb',
      contractAddress: '0xdb0acc14396d108b3c5574483acb817855c9dc8d',
    },
    offchain: {
      id: '46b24bdf-9124-48cf-b120-0e457015f839',
      name: 'ofcemb',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.EMX,
    fullName: 'EMX',
    decimalPlaces: 18,
    onchain: {
      id: '861f2c0c-6967-4cca-86a9-102fd27604bf',
      name: 'emx',
      contractAddress: '0x75a29c405bd5ab2f3b35144af937ee98d390b5ee',
    },
    offchain: {
      id: 'a5f459e7-6429-4ad7-b850-0f50cc67f295',
      name: 'ofcemx',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ENA,
    fullName: 'Ethena',
    decimalPlaces: 18,
    onchain: {
      id: '48db2e4a-f157-4b4b-8ae4-a8d65c80fef1',
      name: 'ena',
      contractAddress: '0x57e114b691db790c35207b2e685d4a43181e6061',
      features: ETH_FEATURES_WITH_FRANKFURT_GERMANY as CoinFeature[],
    },
    offchain: {
      id: '6135770b-d8a6-4998-85f4-5efc7379695c',
      name: 'ofcena',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ENG,
    fullName: 'Enigma',
    decimalPlaces: 8,
    onchain: {
      id: '44c90df7-cdb9-4a7e-a5fa-33f3e12e42d1',
      name: 'eng',
      contractAddress: '0xf0ee6b27b759c9893ce4f094b49ad28fd15a23e4',
      features: AccountCoin.getFeaturesByTypeExcluding(
        [
          CoinFeature.CUSTODY_BITGO_GERMANY,
          CoinFeature.CUSTODY_BITGO_EUROPE_APS,
          CoinFeature.CUSTODY_BITGO_FRANKFURT,
          CoinFeature.CUSTODY_BITGO_SINGAPORE,
          CoinFeature.CUSTODY_BITGO_CUSTODY_MENA_FZE,
        ],
        ETH_FEATURES
      ) as CoinFeature[],
    },
    offchain: {
      id: 'fda9d697-6e28-4836-ab73-9e3ffde73016',
      name: 'ofceng',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ENJ,
    fullName: 'Enjin Coin',
    decimalPlaces: 18,
    onchain: {
      id: '9a8a9b8d-5554-426c-8233-20970a4391f1',
      name: 'enj',
      contractAddress: '0xf629cbd94d3791c9250152bd8dfbdf380e2a3b9c',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: '7b9b62ad-fa00-468f-9b15-fe0d6db04c97',
      name: 'ofcenj',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ENS,
    fullName: 'Ethereum Name Service',
    decimalPlaces: 18,
    onchain: {
      id: '7148266c-d26d-4ad5-a337-be69af3c94df',
      name: 'ens',
      contractAddress: '0xc18360217d8f7ab5e7c516566761ea12ce7f9d72',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: '7c80fbda-ef76-4424-b52f-07b0c4a25dcb',
      name: 'ofcens',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.EQO,
    fullName: 'EQUOS Origin',
    decimalPlaces: 18,
    onchain: {
      id: 'c11b3a5b-2801-4cb2-bfb7-460af2449a94',
      name: 'eqo',
      contractAddress: '0x46e9fe43470fafd690100c86037f9e566e24d480',
    },
    offchain: {
      id: 'e5659707-ebd3-463a-b294-2861d6b54f19',
      name: 'ofceqo',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ETA,
    fullName: 'ETA Token',
    decimalPlaces: 18,
    onchain: {
      id: '7f75a983-f730-4051-b8c4-85d21d05cb26',
      name: 'eta',
      contractAddress: '0x1065bd32fc7a6683c97c2c6638ad4022d9c61c05',
    },
    offchain: {
      id: 'a74ee355-7782-4bfd-a42a-b7baef40e247',
      name: 'ofceta',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ETHBULL,
    fullName: '3X Long Ethereum Token',
    decimalPlaces: 18,
    onchain: {
      id: '73a82c7e-9bd0-48df-9181-f25c99cbeb08',
      name: 'ethbull',
      contractAddress: '0x871baed4088b863fd6407159f3672d70cd34837d',
    },
    offchain: {
      id: 'e2bc068f-e8a8-450b-b7f9-5a73f05fb362',
      name: 'ofcethbull',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ETHOS,
    fullName: 'Ethos',
    decimalPlaces: 8,
    onchain: {
      id: '154b8c77-0e4d-48a9-98d0-0911d9a47669',
      name: 'ethos',
      contractAddress: '0x5af2be193a6abca9c8817001f45744777db30756',
      features: AccountCoin.getFeaturesByTypeExcluding(
        [
          CoinFeature.CUSTODY_BITGO_GERMANY,
          CoinFeature.CUSTODY_BITGO_EUROPE_APS,
          CoinFeature.CUSTODY_BITGO_FRANKFURT,
          CoinFeature.CUSTODY_BITGO_SINGAPORE,
          CoinFeature.CUSTODY_BITGO_CUSTODY_MENA_FZE,
        ],
        ETH_FEATURES
      ) as CoinFeature[],
    },
    offchain: {
      id: '9a0d00c0-7f56-46f9-9707-4d1e14b2d5a8',
      name: 'ofcethos',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ETHX,
    fullName: 'Stader ETHx',
    decimalPlaces: 18,
    onchain: {
      id: 'acf19e82-a0f9-4cb8-a30b-a46b00a1270c',
      name: 'ethx',
      contractAddress: '0xa35b1b31ce002fbf2058d22f30f95d405200a15b',
      features: AccountCoin.DEFAULT_FEATURES_EXCLUDE_SINGAPORE as CoinFeature[],
    },
    offchain: {
      id: '8b4c7e30-40f0-44fc-927f-4e265ffc3c9d',
      name: 'ofcethx',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ETV,
    fullName: 'Ecotech Visions',
    decimalPlaces: 18,
    onchain: {
      id: 'a598f01d-06cb-4da8-88b0-31fef308d454',
      name: 'etv',
      contractAddress: '0x695f5d0692655ebf710c0003ca499323488334c6',
    },
    offchain: {
      id: '57a41ed6-a2a3-4a53-bff8-a4537be5ac87',
      name: 'ofcetv',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.EUL,
    fullName: 'Euler',
    decimalPlaces: 18,
    onchain: {
      id: 'fcdd3f2d-b712-4f74-b068-315b7c058463',
      name: 'eul',
      contractAddress: '0xd9fcd98c322942075a5c3860693e9f4f03aae07b',
    },
    offchain: {
      id: '7c5568e3-85cf-4a48-9160-336f7de7c3ab',
      name: 'ofceul',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.EURE,
    fullName: 'Monerium EUR emoney',
    decimalPlaces: 18,
    onchain: {
      id: '63dbe6a6-b738-43b6-a6aa-fee3f2bc5c1d',
      name: 'eure',
      contractAddress: '0x3231cb76718cdef2155fc47b5286d82e6eda273f',
    },
    offchain: {
      id: '07471422-ef06-4db7-842b-129cf0df3096',
      name: 'ofceure',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.EURL,
    fullName: 'LUGH',
    decimalPlaces: 6,
    onchain: {
      id: 'bc521233-45d2-443f-88b0-2fcf265b9660',
      name: 'eurl',
      contractAddress: '0xa967dd943b336680540011536e7d8c3d33333515',
      features: AccountCoin.getFeaturesByTypeExcluding(
        [
          CoinFeature.CUSTODY_BITGO_GERMANY,
          CoinFeature.CUSTODY_BITGO_EUROPE_APS,
          CoinFeature.CUSTODY_BITGO_FRANKFURT,
          CoinFeature.CUSTODY_BITGO_SINGAPORE,
          CoinFeature.CUSTODY_BITGO_MENA_FZE,
        ],
        ETH_FEATURES
      ) as CoinFeature[],
    },
    offchain: {
      id: '3aef80a6-3847-4ac3-ae79-774818e726fa',
      name: 'ofceurl',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.EUROE,
    fullName: 'EUROe Stablecoin',
    decimalPlaces: 6,
    onchain: {
      id: '5764186f-c3a1-4872-a7ec-5575d6e543de',
      name: 'euroe',
      contractAddress: '0x820802fa8a99901f52e39acd21177b0be6ee2974',
    },
    offchain: {
      id: '8a6b45ea-8b4b-4b66-b2a6-160c2c49bb45',
      name: 'ofceuroe',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.EUROP,
    fullName: 'EURØP',
    decimalPlaces: 6,
    onchain: {
      id: 'af65c573-fb5f-4d35-b942-09eb172c4415',
      name: 'europ',
      contractAddress: '0x888883b5f5d21fb10dfeb70e8f9722b9fb0e5e51',
    },
    offchain: {
      id: 'b954eac7-89c9-40ba-8cd3-876208c9544a',
      name: 'ofceurop',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.EURS,
    fullName: 'Stasis EURS',
    decimalPlaces: 2,
    onchain: {
      id: 'df6dd9e6-64bb-4289-8c58-3d7d2d288eff',
      name: 'eurs',
      contractAddress: '0xdb25f211ab05b1c97d595516f45794528a807ad8',
    },
    offchain: {
      id: '544687ae-0df4-4d5a-89a3-bcf2199077d8',
      name: 'ofceurs',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.EURST,
    fullName: 'EURST',
    decimalPlaces: 18,
    onchain: {
      id: '7b519995-7190-42af-8243-d445681c6045',
      name: 'eurst',
      contractAddress: '0xb1abd7aba7d99bbefb33d1dfc66b0dd522335350',
    },
    offchain: {
      id: 'df5cce48-2064-47fa-892c-4a999f1d4faa',
      name: 'ofceurst',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.EURT,
    fullName: 'Tether EUR',
    decimalPlaces: 6,
    onchain: {
      id: '8ca4a417-c816-42fb-8291-517e6ee1ad5d',
      name: 'eurt',
      contractAddress: '0xc581b735a1688071a1746c968e0798d642ede491',
    },
    offchain: {
      id: '5ba4f405-56df-48c7-aeb0-cac214226a29',
      name: 'ofceurt',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.EURX,
    fullName: 'eToro Euro',
    decimalPlaces: 18,
    onchain: {
      id: '0eb287bd-9b6c-44ff-bd57-aa6e53930346',
      name: 'eurx',
      contractAddress: '0x05ac103f68e05da35e78f6165b9082432fe64b58',
    },
    offchain: {
      id: 'e22f1683-925a-4cd0-ba18-57c67ed8014a',
      name: 'ofceurx',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.EURCVV0,
    fullName: 'EUR Coinvertible',
    decimalPlaces: 18,
    onchain: {
      id: 'ab3e6da9-d9b2-4ff5-a25e-e97b532b9a95',
      name: 'eurcvv0',
      contractAddress: '0xf7790914dc335b20aa19d7c9c9171e14e278a134',
    },
    offchain: {
      id: '4e56668f-ade6-4481-a9af-8a7e99677e33',
      name: 'ofceurcvv0',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.EURCV,
    fullName: 'EUR CoinVertible',
    decimalPlaces: 18,
    onchain: {
      id: '4a47b0a6-f5a4-4a74-89f0-2475fb92e191',
      name: 'eurcv',
      contractAddress: '0x5f7827fdeb7c20b443265fc2f40845b715385ff2',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: '000ffab9-b903-47fd-8e1e-edfe1fe9295b',
      name: 'ofceurcv',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.EUROC,
    fullName: 'EURC',
    decimalPlaces: 6,
    onchain: {
      id: 'fd8e59ae-d6f1-4ab6-917e-954d052cf60c',
      name: 'euroc',
      contractAddress: '0x1abaea1f7c830bd89acc67ec4af516284b1bc33c',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: '29e77c67-7c04-4c74-96c0-011df462850b',
      name: 'ofceuroc',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.EURR,
    fullName: 'StablR Euro',
    decimalPlaces: 6,
    onchain: {
      id: '2ec7511c-7794-4f79-9745-d7186ee226b9',
      name: 'eurr',
      contractAddress: '0xdac306d72f48dbad805a11cbf7a512a277c084c9',
    },
    offchain: {
      id: 'c3f12ab1-ab46-4804-9fbf-2d33c5774361',
      name: 'ofceurr',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.EUX,
    fullName: 'EUR Stable Token',
    decimalPlaces: 18,
    onchain: {
      id: '7b6c5f6c-088d-49a0-a283-2bf253fc1f8a',
      name: 'eux',
      contractAddress: '0x1b9064207e8046ec1d8e83de79380ed31283914f',
    },
    offchain: {
      id: '1f23826a-22e5-4c5c-a734-aa7aef8e2b95',
      name: 'ofceux',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.EVER,
    fullName: 'Everscale',
    decimalPlaces: 9,
    onchain: {
      id: '64d92d59-39e2-4a83-ba82-5a77d30e328b',
      name: 'ever',
      contractAddress: '0x29d578cec46b50fa5c88a99c6a4b70184c062953',
    },
    offchain: {
      id: 'b930e9f3-4476-499c-82f9-f11a3f774f41',
      name: 'ofcever',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.EVERY,
    fullName: 'Everyworld',
    decimalPlaces: 18,
    onchain: {
      id: '5a3af0ed-3233-44e3-aa80-d6c96db23818',
      name: 'every',
      contractAddress: '0x9afa9999e45484adf5d8eed8d9dfe0693bacd838',
    },
    offchain: {
      id: 'fd671b92-7f66-40ba-98e9-59c776c94463',
      name: 'ofcevery',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.EVRY,
    fullName: 'EvrynetToken',
    decimalPlaces: 18,
    onchain: {
      id: 'afdc7525-16ec-4999-9422-cfeff69c5829',
      name: 'evry',
      contractAddress: '0xd7dcd9b99787c619b4d57979521258d1a7267ad7',
    },
    offchain: {
      id: 'c99d5339-b79b-46c9-81a3-f694ef190986',
      name: 'ofcevry',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.EVX,
    fullName: 'Everex',
    decimalPlaces: 4,
    onchain: {
      id: '3c72016d-9b12-45a4-bccb-647438efcd5d',
      name: 'evx',
      contractAddress: '0xf3db5fa2c66b7af3eb0c0b782510816cbe4813b8',
    },
    offchain: {
      id: '960b3691-c881-4976-a0ba-51d4be751a54',
      name: 'ofcevx',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.EXE,
    fullName: 'EXE Token',
    decimalPlaces: 8,
    onchain: {
      id: '4bd908e7-3fbb-48a7-b0d2-59c52ae88b56',
      name: 'exe',
      contractAddress: '0x0d9a653f681168f410d14d19b7743c041eafc58a',
    },
    offchain: {
      id: '79d2905c-a12d-4046-b409-5ba16a4d2f65',
      name: 'ofcexe',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.FARM,
    fullName: 'FARM Reward Token',
    decimalPlaces: 18,
    onchain: {
      id: '562aee8f-e7c3-4ab1-b878-968669f2624e',
      name: 'farm',
      contractAddress: '0xa0246c9032bc3a600820415ae600c6388619a14d',
    },
    offchain: {
      id: '552a6d6c-9fc8-4b3c-bdab-fef3ac31bb98',
      name: 'ofcfarm',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.FEI,
    fullName: 'Fei Protocol',
    decimalPlaces: 18,
    onchain: {
      id: '6ab57a67-aa19-48f8-bd79-0d321e0d095c',
      name: 'fei',
      contractAddress: '0x956f47f50a910163d8bf957cf5846d573e7f87ca',
    },
    offchain: {
      id: '9e713b54-f46f-41a6-9792-a58964011d6b',
      name: 'ofcfei',
      features: [CoinFeature.STABLECOIN] as CoinFeature[],
    },
  },
  {
    underlyingAsset: UnderlyingAsset.FET,
    fullName: 'Fetch',
    decimalPlaces: 18,
    onchain: {
      id: '99f5825d-a90f-4455-b142-79c65fec8b48',
      name: 'fet',
      contractAddress: '0x1d287cc25dad7ccaf76a26bc660c5f7c8e2a05bd',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: '1181f8b6-1bb6-4555-a6eb-29944ad4877b',
      name: 'ofcfet',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.FET1,
    fullName: 'Artificial Superintelligence Alliance',
    decimalPlaces: 18,
    onchain: {
      id: '314c848a-c06e-47c8-8dcf-70946e6c4a6c',
      name: 'fet1',
      contractAddress: '0xaea46a60368a7bd060eec7df8cba43b7ef41ad85',
    },
    offchain: {
      id: 'b15ff97c-3153-4aa0-8d72-ecc21e7b80cb',
      name: 'ofcfet1',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.FDT,
    fullName: 'Fiat DAO',
    decimalPlaces: 18,
    onchain: {
      id: '8272da67-106c-4dfd-b717-f9f90881a585',
      name: 'fdt',
      contractAddress: '0xed1480d12be41d92f36f5f7bdd88212e381a3677',
      features: AccountCoin.getFeaturesByTypeExcluding(
        [
          CoinFeature.CUSTODY_BITGO_GERMANY,
          CoinFeature.CUSTODY_BITGO_EUROPE_APS,
          CoinFeature.CUSTODY_BITGO_FRANKFURT,
          CoinFeature.CUSTODY_BITGO_SINGAPORE,
          CoinFeature.CUSTODY_BITGO_MENA_FZE,
        ],
        ETH_FEATURES
      ) as CoinFeature[],
    },
    offchain: {
      id: '9ac0a862-28c4-4a0c-95f0-2d4c863b4bb5',
      name: 'ofcfdt',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.FDUSD,
    fullName: 'First Digital USD',
    decimalPlaces: 18,
    onchain: {
      id: '1bc29425-088d-4e24-905f-9d2afc7cd636',
      name: 'fdusd',
      contractAddress: '0xc5f0f7b66764f6ec8c8dff7ba683102295e16409',
      features: [
        ...AccountCoin.getFeaturesByTypeExcluding(
          [
            CoinFeature.CUSTODY_BITGO_GERMANY,
            CoinFeature.CUSTODY_BITGO_EUROPE_APS,
            CoinFeature.CUSTODY_BITGO_FRANKFURT,
          ],
          ETH_FEATURES
        ),
        CoinFeature.STABLECOIN,
      ] as CoinFeature[],
    },
    offchain: {
      id: '0c6e4b19-d748-477c-9507-6c0f51142b07',
      name: 'ofcfdusd',
      features: [CoinFeature.STABLECOIN] as CoinFeature[],
    },
  },
  {
    underlyingAsset: UnderlyingAsset.FF1,
    fullName: 'Two Prime FF1',
    decimalPlaces: 18,
    onchain: {
      id: '1bae0040-6e3c-4da5-bd27-a8a4818fd8c7',
      name: 'ff1',
      contractAddress: '0x59af0356cdebd1fa23ae5dadff9170bbfc31278c',
      features: AccountCoin.getFeaturesByTypeExcluding(
        [
          CoinFeature.CUSTODY_BITGO_SINGAPORE,
          CoinFeature.CUSTODY_BITGO_GERMANY,
          CoinFeature.CUSTODY_BITGO_EUROPE_APS,
          CoinFeature.CUSTODY_BITGO_FRANKFURT,
        ],
        ETH_FEATURES
      ) as CoinFeature[],
    },
    offchain: {
      id: '1dff5071-fc2a-419a-afe6-9a79418eb2ae',
      name: 'ofcff1',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.FFT,
    fullName: 'Fight to Fame Token',
    decimalPlaces: 18,
    onchain: {
      id: '7c62369d-91e6-45f0-874b-4ce43c86ffe5',
      name: 'fft',
      contractAddress: '0xdea05e09f5b0e102616bb145a0e4772a9b5ab193',
    },
    offchain: {
      id: '4801a671-00f2-49d6-83c5-9b39815c8a78',
      name: 'ofcfft',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.FIDA,
    fullName: 'Bonfida Token',
    decimalPlaces: 6,
    onchain: {
      id: 'c02422ca-603b-414c-9e38-7200313112fa',
      name: 'fida',
      contractAddress: '0xf40d9507a7d4850c52a45698c9410e2c345f7a94',
    },
    offchain: {
      id: '7e62c1e5-62dc-4e7c-aec5-7ac0cd440136',
      name: 'ofcfida',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.FIRE,
    fullName: 'Ceramic Token',
    decimalPlaces: 18,
    onchain: {
      id: '96c00737-5e16-4ff0-8ddd-0d88a58e5bfc',
      name: 'fire',
      contractAddress: '0x2033e559cddff6dd36ec204e3014faa75a01052e',
    },
    offchain: {
      id: '1ba80514-c5c3-47be-b3e6-4c11d0ab25d3',
      name: 'ofcfire',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.FLUX,
    fullName: 'Flux',
    decimalPlaces: 8,
    onchain: {
      id: '3953a61e-05ec-4424-aaf0-69003bd10a7b',
      name: 'flux',
      contractAddress: '0x720cd16b011b987da3518fbf38c3071d4f0d1495',
    },
    offchain: {
      id: '432c0f0c-3bbf-440c-885e-047b1ea75aee',
      name: 'ofcflux',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.FLY,
    fullName: 'FlyCoin',
    decimalPlaces: 18,
    onchain: {
      id: 'a872494f-02d8-4cbc-87fa-8956413a5d4f',
      name: 'fly',
      contractAddress: '0x4e568ab95f029e8df1e39b30c9d6d076eaa15945',
    },
    offchain: {
      id: '69a4d87c-bcc2-43b6-a66e-c5d3fdb40771',
      name: 'ofcfly',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.FMF,
    fullName: 'Formosa Financial',
    decimalPlaces: 18,
    onchain: {
      id: '5fe983c9-876c-4a55-a364-9f2f44523b3b',
      name: 'fmf',
      contractAddress: '0xb4d0fdfc8497aef97d3c2892ae682ee06064a2bc',
      features: AccountCoin.getFeaturesByTypeExcluding(
        [
          CoinFeature.CUSTODY_BITGO_GERMANY,
          CoinFeature.CUSTODY_BITGO_EUROPE_APS,
          CoinFeature.CUSTODY_BITGO_FRANKFURT,
          CoinFeature.CUSTODY_BITGO_SINGAPORE,
          CoinFeature.CUSTODY_BITGO_MENA_FZE,
        ],
        ETH_FEATURES
      ) as CoinFeature[],
    },
    offchain: {
      id: 'e0e67b63-2cd4-4906-b749-1d8b61cf2755',
      name: 'ofcfmf',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.FOLD,
    fullName: 'Manifold Finance',
    decimalPlaces: 18,
    onchain: {
      id: '5581778c-1e76-456d-a284-7c571a51efbb',
      name: 'fold',
      contractAddress: '0xd084944d3c05cd115c09d072b9f44ba3e0e45921',
    },
    offchain: {
      id: '017c87e8-db41-41f6-8382-c61ad8ced64b',
      name: 'ofcfold',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.FOR,
    fullName: 'ForTube',
    decimalPlaces: 18,
    onchain: {
      id: '55f7bcc9-89db-42fc-a726-dc7233ae8388',
      name: 'for',
      contractAddress: '0x1fcdce58959f536621d76f5b7ffb955baa5a672f',
    },
    offchain: {
      id: 'f84d0115-451a-4ee9-a16c-93066b3922f6',
      name: 'ofcfor',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.FORT,
    fullName: 'Forta',
    decimalPlaces: 18,
    onchain: {
      id: 'ef679437-3512-4cdf-8454-dfbed7ec1b50',
      name: 'fort',
      contractAddress: '0x41545f8b9472d758bb669ed8eaeeecd7a9c4ec29',
    },
    offchain: {
      id: '16249ef2-eeb1-4f25-93d7-de4dc8ee5459',
      name: 'ofcfort',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.FORTH,
    fullName: 'Ampleforth Governance Token',
    decimalPlaces: 18,
    onchain: {
      id: '313d09b1-0fca-4a38-94a0-6c715934d6b6',
      name: 'forth',
      contractAddress: '0x77fba179c79de5b7653f68b5039af940ada60ce0',
    },
    offchain: {
      id: 'e5238da7-b453-4234-aa77-8b9b57595b6a',
      name: 'ofcforth',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.FRONT,
    fullName: 'Frontier Token',
    decimalPlaces: 18,
    onchain: {
      id: '601f5b08-84e1-4b45-81ab-c153e752924d',
      name: 'front',
      contractAddress: '0xf8c3527cc04340b208c854e985240c02f7b7793f',
    },
    offchain: {
      id: '12678b72-a5a9-41c9-af04-d536b3197b86',
      name: 'ofcfront',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.FTM,
    fullName: 'Fantom Token',
    decimalPlaces: 18,
    onchain: {
      id: '453ba3f7-1a92-4251-b9af-16aef62ad048',
      name: 'ftm',
      contractAddress: '0x4e15361fd6b4bb609fa63c81a2be19d873717870',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: '15caf3bc-1d2e-440a-8954-1f1f8a52ac71',
      name: 'ofcftm',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.FTT,
    fullName: 'FTX Token',
    decimalPlaces: 18,
    onchain: {
      id: '9ab69a52-5bb2-4263-9c88-13aaca83b5e8',
      name: 'ftt',
      contractAddress: '0x50d1c9771902476076ecfc8b2a83ad6b9355a4c9',
      features: AccountCoin.getFeaturesByTypeExcluding(
        [
          CoinFeature.CUSTODY_BITGO_SINGAPORE,
          CoinFeature.CUSTODY_BITGO_CUSTODY_MENA_FZE,
          CoinFeature.CUSTODY_BITGO_MENA_FZE,
          CoinFeature.CUSTODY_BITGO_FRANKFURT,
          CoinFeature.CUSTODY_BITGO_EUROPE_APS,
          CoinFeature.CUSTODY_BITGO_GERMANY,
        ],
        ETH_FEATURES
      ) as CoinFeature[],
    },
    offchain: {
      id: '47ba857c-07f9-41c1-a0ea-1258ae0dfdac',
      name: 'ofcftt',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.FUN,
    fullName: 'FunFair',
    decimalPlaces: 8,
    onchain: {
      id: 'd7c330ea-7767-4737-8701-cc50c605bab9',
      name: 'fun',
      contractAddress: '0x419d0d8bdd9af5e606ae2232ed285aff190e711b',
    },
    offchain: {
      id: '222c71b9-0731-49d5-988e-0fbe1a799901',
      name: 'ofcfun',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.FWB,
    fullName: 'Friends With Benefits Pro',
    decimalPlaces: 18,
    onchain: {
      id: 'a1d2c130-1c38-44b0-8b77-303d5ce99ffd',
      name: 'fwb',
      contractAddress: '0x35bd01fc9d6d5d81ca9e055db88dc49aa2c699a8',
    },
    offchain: {
      id: '5c0a84b9-32b8-43ab-bdaa-26c0f2dcca44',
      name: 'ofcfwb',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.FXRT,
    fullName: 'FXRT',
    decimalPlaces: 3,
    onchain: {
      id: 'fdc6d00b-e6c9-4056-ac61-7f01a9fd9582',
      name: 'fxrt',
      contractAddress: '0x506742a24c54b77c5af4065b2626ab96c641f90e',
    },
    offchain: {
      id: '36609e72-76d7-448b-9289-9862a6a7e333',
      name: 'ofcfxrt',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.FXS,
    fullName: 'Frax Share',
    decimalPlaces: 18,
    onchain: {
      id: '875553e9-fd95-422d-ac60-05e6509ab81a',
      name: 'fxs',
      contractAddress: '0x3432b6a60d23ca0dfca7761b7ab56459d9c964d0',
    },
    offchain: {
      id: 'd559fab8-c9f2-4468-a573-f4d29d4e4d30',
      name: 'ofcfxs',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.G,
    fullName: 'Gravity',
    decimalPlaces: 18,
    onchain: {
      id: 'e1b8ce03-459c-4e4e-805f-414f4a48f78a',
      name: 'g',
      contractAddress: '0x9c7beba8f6ef6643abd725e45a4e8387ef260649',
    },
    offchain: {
      id: '89d2a9b0-ecab-4e41-a746-c845cac36396',
      name: 'ofcg',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.GAL,
    fullName: 'Project Galaxy',
    decimalPlaces: 18,
    onchain: {
      id: '78151ad3-fe9e-4511-88f7-6a6e2348631c',
      name: 'gal',
      contractAddress: '0x5faa989af96af85384b8a938c2ede4a7378d9875',
    },
    offchain: {
      id: 'cba66dc6-31eb-46c4-b73f-8cb77eb7ef5b',
      name: 'ofcgal',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.GALA,
    fullName: 'gala',
    decimalPlaces: 8,
    onchain: {
      id: 'd20a39c4-bcd3-4097-8d2d-32f33d51ee4e',
      name: 'gala',
      contractAddress: '0x15d4c048f83bd7e37d49ea4c83a07267ec4203da',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: 'c3dac821-88cc-4080-8417-bed0f48cc651',
      name: 'ofcgala',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.GALAV2,
    fullName: 'galav2',
    decimalPlaces: 8,
    onchain: {
      id: 'b328e2d5-ef04-445c-a927-b70d35af2d01',
      name: 'galav2',
      contractAddress: '0xd1d2eb1b1e90b638588728b4130137d262c87cae',
    },
    offchain: {
      id: '513b4670-ea9b-44f3-859d-96973e252af8',
      name: 'ofcgalav2',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.GAMMA,
    fullName: 'Gamma',
    decimalPlaces: 18,
    onchain: {
      id: '2a3b4d48-1e59-4c1d-840a-d992b484a3b2',
      name: 'gamma',
      contractAddress: '0x6bea7cfef803d1e3d5f7c0103f7ded065644e197',
      features: AccountCoin.getFeaturesByTypeExcluding(
        [
          CoinFeature.CUSTODY_BITGO_GERMANY,
          CoinFeature.CUSTODY_BITGO_EUROPE_APS,
          CoinFeature.CUSTODY_BITGO_FRANKFURT,
          CoinFeature.CUSTODY_BITGO_SINGAPORE,
          CoinFeature.CUSTODY_BITGO_MENA_FZE,
        ],
        ETH_FEATURES
      ) as CoinFeature[],
    },
    offchain: {
      id: 'c7e65955-0917-4b08-84d9-cb3d4fed116c',
      name: 'ofcgamma',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.GAS,
    fullName: 'Gas DAO',
    decimalPlaces: 18,
    onchain: {
      id: 'c2eff11c-aa3b-4a08-9600-86e102cf1489',
      name: 'gas',
      contractAddress: '0x6bba316c48b49bd1eac44573c5c871ff02958469',
      features: ACCOUNT_COIN_DEFAULT_FEATURES_EXCLUDE_SINGAPORE as CoinFeature[],
    },
    offchain: {
      id: 'f2e783d0-3278-4660-be43-82b7961c21df',
      name: 'ofcgas',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.GBPT,
    fullName: 'Poundtoken',
    decimalPlaces: 18,
    onchain: {
      id: '3c5b424e-5bac-435f-a42e-4da7c8d6ecbc',
      name: 'gbpt',
      contractAddress: '0x86b4dbe5d203e634a12364c0e428fa242a3fba98',
      features: AccountCoin.getFeaturesByTypeExcluding(
        [
          CoinFeature.CUSTODY_BITGO_GERMANY,
          CoinFeature.CUSTODY_BITGO_EUROPE_APS,
          CoinFeature.CUSTODY_BITGO_FRANKFURT,
          CoinFeature.CUSTODY_BITGO_SINGAPORE,
          CoinFeature.CUSTODY_BITGO_MENA_FZE,
        ],
        ETH_FEATURES
      ) as CoinFeature[],
    },
    offchain: {
      id: '5fcfaf16-39c1-4a33-9a35-6d1d782fa515',
      name: 'ofcgbpt',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.GBPX,
    fullName: 'eToro Pound Sterling',
    decimalPlaces: 18,
    onchain: {
      id: '9a539510-7dcc-47a3-ab2f-e9253cc2e3cf',
      name: 'gbpx',
      contractAddress: '0xf85ef57fcdb36d628d063fa663e61e44d35ae661',
    },
    offchain: {
      id: '4fbe62ee-8220-49ef-bc51-2c936c480ec8',
      name: 'ofcgbpx',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.GDT,
    fullName: 'GDT',
    decimalPlaces: 8,
    onchain: {
      id: '55f987d2-62f5-4b4d-9c09-4681e7f10fb3',
      name: 'gdt',
      contractAddress: '0xc67b12049c2d0cf6e476bc64c7f82fc6c63cffc5',
    },
    offchain: {
      id: '8d954e16-a665-40df-89b9-fe7326ceebaa',
      name: 'ofcgdt',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.GEN,
    fullName: 'DAOstack',
    decimalPlaces: 18,
    onchain: {
      id: '01f2a8e1-75e3-4c36-9f08-5f6131f4cff8',
      name: 'gen',
      contractAddress: '0x543ff227f64aa17ea132bf9886cab5db55dcaddf',
      features: [
        ...ACCOUNT_COIN_DEFAULT_FEATURES_EXCLUDE_SINGAPORE_AND_MENA_FZE,
        CoinFeature.BULK_TRANSACTION,
      ] as CoinFeature[],
    },
    offchain: {
      id: 'c8925dc5-e828-43b0-98dc-b0e14e8256e8',
      name: 'ofcgen',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.GEL,
    fullName: 'Gelato Network Token',
    decimalPlaces: 18,
    onchain: {
      id: 'b603b989-3fe0-4bbd-a1e8-84169e073d4f',
      name: 'gel',
      contractAddress: '0x15b7c0c907e4c6b9adaaaabc300c08991d6cea05',
      features: [...ACCOUNT_COIN_DEFAULT_FEATURES_EXCLUDE_MENA_FZE, CoinFeature.BULK_TRANSACTION] as CoinFeature[],
    },
    offchain: {
      id: '1721b8cf-45d8-437e-90b3-5c7c2d414620',
      name: 'ofcgel',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.GFI,
    fullName: 'Goldfinch',
    decimalPlaces: 18,
    onchain: {
      id: '29cbff1a-04bf-4906-983e-14b7fd9656a2',
      name: 'gfi',
      contractAddress: '0xdab396ccf3d84cf2d07c4454e10c8a6f5b008d2b',
    },
    offchain: {
      id: '90007187-b079-4613-91b8-02b0eb90bc1e',
      name: 'ofcgfi',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.GLDX,
    fullName: 'eToro Gold',
    decimalPlaces: 18,
    onchain: {
      id: 'd623555a-7e2e-437f-acb3-58cb8894308e',
      name: 'gldx',
      contractAddress: '0x7d2bebd6e41b05384f0a8eb8ff228daac6f39c96',
    },
    offchain: {
      id: '6a24f072-91bd-47e5-ae58-5f8a3b3d5cb0',
      name: 'ofcgldx',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.GLM,
    fullName: 'Golem',
    decimalPlaces: 18,
    onchain: {
      id: '0968a46a-4eaa-413e-8794-0c254fb7bcbc',
      name: 'glm',
      contractAddress: '0x7dd9c5cba05e151c895fde1cf355c9a1d5da6429',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: '784b50ab-a42e-4e7e-a796-867d19b4e5ac',
      name: 'ofcglm',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:gousd'],
    fullName: 'goUSD',
    decimalPlaces: 6,
    onchain: {
      id: '5552fd84-9354-4776-873e-a0e40a6b1675',
      name: 'eth:gousd',
      contractAddress: '0x04f4f7b8bb7b8aca7beb8a027603dfc6eb66af5d',
      features: [...ACCOUNT_COIN_DEFAULT_FEATURES, CoinFeature.STABLECOIN] as CoinFeature[],
    },
    offchain: {
      id: '53a414b4-cefa-4a81-936c-9ecbb2da22cc',
      name: 'ofceth:gousd',
      features: [CoinFeature.STABLECOIN] as CoinFeature[],
    },
  },
  {
    underlyingAsset: UnderlyingAsset.GEC,
    fullName: 'GECoin',
    decimalPlaces: 18,
    onchain: {
      id: '3628927c-05c7-4fba-9fc3-f3c17e261334',
      name: 'gec',
      contractAddress: '0xe304283c3e60cefaf7ea514007cf4e8fdc3d869d',
      features: ACCOUNT_COIN_DEFAULT_FEATURES_EXCLUDE_SINGAPORE as CoinFeature[],
    },
    offchain: {
      id: 'b24068a3-360f-49f5-b6a6-8057afa36c65',
      name: 'ofcgec',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.GENIE,
    fullName: 'GenieSwap',
    decimalPlaces: 18,
    onchain: {
      id: '2f78a2c7-d3ed-4b95-96e7-298006be4cea',
      name: 'genie',
      contractAddress: '0x665f77fba5975ab40ce61c90f28007fb5b09d7b1',
    },
    offchain: {
      id: 'cdbe237b-ff28-4e84-954d-64d38a38cd00',
      name: 'ofcgenie',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.GHUB,
    fullName: 'Genohub',
    decimalPlaces: 8,
    onchain: {
      id: '79d47ed4-34e8-4ba3-b576-34fd2776f9b1',
      name: 'ghub',
      contractAddress: '0xeb40045347531f06179ffb3c6be33d5b35a52ebd',
    },
    offchain: {
      id: '19f3e6f6-74be-463e-a9e1-3b5346a803af',
      name: 'ofcghub',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.GHST,
    fullName: 'aavegotchi',
    decimalPlaces: 18,
    onchain: {
      id: 'd3c6a9b2-1551-401c-b576-db429d48b895',
      name: 'ghst',
      contractAddress: '0x3f382dbd960e3a9bbceae22651e88158d2791550',
    },
    offchain: {
      id: 'b1e02bcb-187c-4e5f-9a79-61c3464629e3',
      name: 'ofcghst',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.GIGDROP,
    fullName: 'GIG-POOL-DROP',
    decimalPlaces: 18,
    onchain: {
      id: '2eb02229-65f4-46dc-9ff0-300ac647214c',
      name: 'gigdrop',
      contractAddress: '0xa08399989e77b8ce8dd68374cc7b4345304b3161',
    },
    offchain: {
      id: 'aab13fa5-19a1-48a2-bd5d-19d7b2ebab6d',
      name: 'ofcgigdrop',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.GMT,
    fullName: 'GreenMetaverseToken',
    decimalPlaces: 8,
    onchain: {
      id: '0ddc35bb-0374-4c2d-8b11-3eeec0208c76',
      name: 'gmt',
      contractAddress: '0xe3c408bd53c31c085a1746af401a4042954ff740',
    },
    offchain: {
      id: '27942d31-cf89-46bd-ab2a-9e1690ce7d7b',
      name: 'ofcgmt',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.GNO,
    fullName: 'Gnosis',
    decimalPlaces: 18,
    onchain: {
      id: 'be0fe2bf-c46e-44ef-9cbb-d70ac756461e',
      name: 'gno',
      contractAddress: '0x6810e776880c02933d47db1b9fc05908e5386b96',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: 'af0b8e78-a821-4542-958a-5c1d3ac687b1',
      name: 'ofcgno',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.GNT,
    fullName: 'Golem',
    decimalPlaces: 18,
    onchain: {
      id: '55abd6de-6eab-4dc3-9706-aa255c1d4b5f',
      name: 'gnt',
      contractAddress: '0xa74476443119a942de498590fe1f2454d7d4ac0d',
    },
    offchain: {
      id: 'b124edc2-c227-4068-8a6c-687d2be1570d',
      name: 'ofcgnt',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.GODS,
    fullName: 'Gods Unchained',
    decimalPlaces: 18,
    onchain: {
      id: '34ded9de-1545-42d5-bc17-45a70f8f743f',
      name: 'gods',
      contractAddress: '0xccc8cb5229b0ac8069c51fd58367fd1e622afd97',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: '3ed9ccb5-7dc9-46fe-8003-d19a12ffd258',
      name: 'ofcgods',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.GOG,
    fullName: 'Guild of Guardians',
    decimalPlaces: 18,
    onchain: {
      id: '7613ac09-eeb1-4aa9-8cac-b36cac79ce7e',
      name: 'gog',
      contractAddress: '0x9ab7bb7fdc60f4357ecfef43986818a2a3569c62',
    },
    offchain: {
      id: 'd92d739a-73a1-49ae-a906-47a53f3ee956',
      name: 'ofcgog',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.GOLD,
    fullName: 'XBullion Token',
    decimalPlaces: 8,
    onchain: {
      id: 'c4c78f91-0882-4097-88a6-ffda02359014',
      name: 'gold',
      contractAddress: '0x0e573fdd3c5acf3a74f1775b0f9823a1a0e2b86b',
    },
    offchain: {
      id: 'ca7e5745-af28-432a-8411-b8e3aaf38416',
      name: 'ofcgold',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.GOT,
    fullName: 'GOExchange',
    decimalPlaces: 18,
    onchain: {
      id: '973a300f-61e2-469b-8b23-9d524b3367d5',
      name: 'got',
      contractAddress: '0xf11f2550769dac4226731b7732dd4e17e72b1b01',
    },
    offchain: {
      id: '0330cfb6-43be-4cc6-b905-a09706a5e9ae',
      name: 'ofcgot',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.GRT,
    fullName: 'The Graph',
    decimalPlaces: 18,
    onchain: {
      id: '26c3357a-90c1-4897-a011-57e46a503a8e',
      name: 'grt',
      contractAddress: '0xc944e90c64b2c07662a292be6244bdf05cda44a7',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: '91c416ad-bf1d-4949-afa6-e081bc55abd1',
      name: 'ofcgrt',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.GT,
    fullName: 'GateChainToken',
    decimalPlaces: 18,
    onchain: {
      id: 'b9a52473-f4a9-491f-a59d-e642f87299ef',
      name: 'gt',
      contractAddress: '0xe66747a101bff2dba3697199dcce5b743b454759',
    },
    offchain: {
      id: '1a7fdcc6-8a6c-4780-b483-c6aaf990e461',
      name: 'ofcgt',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.GTC,
    fullName: 'Gitcoin',
    decimalPlaces: 18,
    onchain: {
      id: '0b387243-1855-49fa-b4e6-d5628f24195f',
      name: 'gtc',
      contractAddress: '0xde30da39c46104798bb5aa3fe8b9e0e1f348163f',
    },
    offchain: {
      id: 'c9ae628a-55e2-41b8-945a-dc297badc2ac',
      name: 'ofcgtc',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.GTO,
    fullName: 'Gifto',
    decimalPlaces: 5,
    onchain: {
      id: '12d2f8fd-8027-48ea-afb5-984d10e7afb4',
      name: 'gto',
      contractAddress: '0xc5bbae50781be1669306b9e001eff57a2957b09d',
    },
    offchain: {
      id: 'cccb78f7-8d8a-4b73-b915-a3754ac3d75b',
      name: 'ofcgto',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.GUSD,
    fullName: 'Gemini Dollar',
    decimalPlaces: 2,
    onchain: {
      id: '3d2bb77d-9faf-4297-aa88-1ba796c3cca4',
      name: 'gusd',
      contractAddress: '0x056fd409e1d7a124bd7017459dfea2f387b6d5cd',
      features: [...ACCOUNT_COIN_DEFAULT_FEATURES, CoinFeature.STABLECOIN] as CoinFeature[],
    },
    offchain: {
      id: '87290914-5a67-46a1-a2d6-26ba243dae33',
      name: 'ofcgusd',
      features: [CoinFeature.STABLECOIN] as CoinFeature[],
    },
  },
  {
    underlyingAsset: UnderlyingAsset.GXC,
    fullName: 'Game X Coin',
    decimalPlaces: 18,
    onchain: {
      id: '9c6ddd7f-3e3d-4a99-924a-9e522dabf27c',
      name: 'gxc',
      contractAddress: '0x953e22945b416730bad05009af05b420e598e412',
    },
    offchain: {
      id: 'c0089eb1-92d9-4775-bbf7-a0a60434c23f',
      name: 'ofcgxc',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.GYEN,
    fullName: 'Gmo JPY',
    decimalPlaces: 6,
    onchain: {
      id: 'f1e70e0e-a2e3-40d7-a1f7-2c3649f506b8',
      name: 'gyen',
      contractAddress: '0xc08512927d12348f6620a698105e1baac6ecd911',
    },
    offchain: {
      id: 'a9bc71ef-b85e-4b3a-9949-7de54626258b',
      name: 'ofcgyen',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.HCN,
    fullName: 'Himalaya Coin',
    decimalPlaces: 18,
    onchain: {
      id: '7c390987-a022-47a0-aba5-09b6385ae904',
      name: 'hcn',
      contractAddress: '0xb01b22dcd2f4b199a27ec28d8a688dd26f162067',
    },
    offchain: {
      id: '0081146a-bde1-4bf4-abe7-703d90d5e1ec',
      name: 'ofchcn',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.HDO,
    fullName: 'Himalaya Dollar',
    decimalPlaces: 18,
    onchain: {
      id: 'd9b08334-18b7-4d67-a1dd-36d9ea2fe83a',
      name: 'hdo',
      contractAddress: '0x7c197afcd8d36884309ed731424985e3ed17f018',
    },
    offchain: {
      id: '6385614f-940d-4469-b748-e21d3eda580d',
      name: 'ofchdo',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.HEDG,
    fullName: 'HedgeTrade',
    decimalPlaces: 18,
    onchain: {
      id: '42d8e588-ebe8-4b65-9720-dffac0824e6d',
      name: 'hedg',
      contractAddress: '0xf1290473e210b2108a85237fbcd7b6eb42cc654f',
    },
    offchain: {
      id: '9ed2d55e-2b97-4b6f-8d68-72cb63e0cd5d',
      name: 'ofchedg',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.HGET,
    fullName: 'Hedget',
    decimalPlaces: 6,
    onchain: {
      id: '7aed1043-e8ce-47ae-8463-bc76b7a515e7',
      name: 'hget',
      contractAddress: '0x7968bc6a03017ea2de509aaa816f163db0f35148',
    },
    offchain: {
      id: 'f227c0b5-a6ac-4353-96e8-2f2dca57fc5f',
      name: 'ofchget',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.HIGH,
    fullName: 'Highstreet',
    decimalPlaces: 18,
    onchain: {
      id: '50bc024c-f6e2-4b69-8010-be20243a1c35',
      name: 'high',
      contractAddress: '0x71ab77b7dbb4fa7e017bc15090b2163221420282',
    },
    offchain: {
      id: '1ff62f9c-4bd8-46a9-8e18-733ac1599b3c',
      name: 'ofchigh',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.HIFI,
    fullName: 'Hifi Finance',
    decimalPlaces: 18,
    onchain: {
      id: '713f7531-d5ba-4c38-9c21-64458cb1bcf9',
      name: 'hifi',
      contractAddress: '0x4b9278b94a1112cad404048903b8d343a810b07e',
    },
    offchain: {
      id: 'd21321bd-1457-4e81-bb39-003ab2bdc627',
      name: 'ofchifi',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.HKDX,
    fullName: 'eToro Hong Kong Dollar',
    decimalPlaces: 18,
    onchain: {
      id: '3e3c2765-2d55-4d18-b5a8-f5cca0d3dade',
      name: 'hkdx',
      contractAddress: '0x1af20b8d1ede928f437b3a86801796b167840d2b',
    },
    offchain: {
      id: '9c232330-ba0c-4411-925d-f3273f70865f',
      name: 'ofchkdx',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.HLC,
    fullName: 'HalalChain',
    decimalPlaces: 9,
    onchain: {
      id: '80869123-73ea-4ed7-a1b3-5dec08a998f3',
      name: 'hlc',
      contractAddress: '0x58c69ed6cd6887c0225d1fccecc055127843c69b',
    },
    offchain: {
      id: '28f78878-5230-4b59-be47-c2cfb03f56a9',
      name: 'ofchlc',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.HMT,
    fullName: 'HUMAN Token',
    decimalPlaces: 18,
    onchain: {
      id: 'f0d61799-0239-4fe8-a86c-855902f12b0a',
      name: 'hmt',
      contractAddress: '0xd1ba9bac957322d6e8c07a160a3a8da11a0d2867',
    },
    offchain: {
      id: '1422774f-adbb-4054-96ad-35b0d4e3fcce',
      name: 'ofchmt',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.HOLD,
    fullName: 'Hold',
    decimalPlaces: 18,
    onchain: {
      id: '8f5e2458-bec9-4a17-a3f9-342fafb735a8',
      name: 'hold',
      contractAddress: '0xd6e1401a079922469e9b965cb090ea6ff64c6839',
    },
    offchain: {
      id: '3d9749b2-4f30-454c-b731-0dc6e31a34ab',
      name: 'ofchold',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.HOT,
    fullName: 'Holo',
    decimalPlaces: 18,
    onchain: {
      id: '77d4d4b9-aac0-44b9-9b06-cec348377d45',
      name: 'hot',
      contractAddress: '0x6c6ee5e31d828de241282b9606c8e98ea48526e2',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: 'efa472d4-7e80-4232-9a92-4b301cb4fdb7',
      name: 'ofchot',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.HQT,
    fullName: 'HyperQuant',
    decimalPlaces: 18,
    onchain: {
      id: '4f0a0207-bf4d-4513-9cdb-0e5b015da24f',
      name: 'hqt',
      contractAddress: '0x3e1d5a855ad9d948373ae68e4fe1f094612b1322',
      features: AccountCoin.getFeaturesByTypeExcluding(
        [
          CoinFeature.CUSTODY_BITGO_GERMANY,
          CoinFeature.CUSTODY_BITGO_EUROPE_APS,
          CoinFeature.CUSTODY_BITGO_FRANKFURT,
          CoinFeature.CUSTODY_BITGO_SINGAPORE,
          CoinFeature.CUSTODY_BITGO_MENA_FZE,
        ],
        ETH_FEATURES
      ) as CoinFeature[],
    },
    offchain: {
      id: '52196e54-2f54-4389-85b3-5e2aaa03ca2a',
      name: 'ofchqt',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.HST,
    fullName: 'Decision Token',
    decimalPlaces: 18,
    onchain: {
      id: '18244a63-80c0-4436-81e1-79d65a53dc91',
      name: 'hst',
      contractAddress: '0x554c20b7c486beee439277b4540a434566dc4c02',
      features: [
        ...ACCOUNT_COIN_DEFAULT_FEATURES_EXCLUDE_SINGAPORE_AND_MENA_FZE,
        CoinFeature.BULK_TRANSACTION,
      ] as CoinFeature[],
    },
    offchain: {
      id: '1e429bcb-28da-4893-b65a-4eb6ae76b902',
      name: 'ofchst',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.HT,
    fullName: 'Huobi Token',
    decimalPlaces: 18,
    onchain: {
      id: 'cc2b7961-a970-4f88-9d0a-163512ddeff8',
      name: 'ht',
      contractAddress: '0x6f259637dcd74c767781e37bc6133cd6a68aa161',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: 'ecf9c0b3-fac4-4da6-93c6-2968c1d69742',
      name: 'ofcht',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.HUM,
    fullName: 'HumanScape',
    decimalPlaces: 18,
    onchain: {
      id: '674da130-7e33-44f6-a5d4-89fabe9fae20',
      name: 'hum',
      contractAddress: '0x174afe7a032b5a33a3270a9f6c30746e25708532',
    },
    offchain: {
      id: '35bd0f1e-ca2c-4bba-9541-7d9f5d1b0a92',
      name: 'ofchum',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.HXRO,
    fullName: 'Hxro',
    decimalPlaces: 18,
    onchain: {
      id: 'c3162ec6-848a-4e43-add9-60c959b3602d',
      name: 'hxro',
      contractAddress: '0x4bd70556ae3f8a6ec6c4080a0c327b24325438f3',
    },
    offchain: {
      id: 'dfd3425a-f8c8-47f9-896c-9f2fa8dd5a7c',
      name: 'ofchxro',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.HUSD,
    fullName: 'HUSD',
    decimalPlaces: 8,
    onchain: {
      id: '1c4ae5e2-16cb-4ebb-aa48-0264b91f42c0',
      name: 'husd',
      contractAddress: '0xdf574c24545e5ffecb9a659c229253d4111d87e1',
      features: [
        ...AccountCoin.getFeaturesByTypeExcluding(
          [
            CoinFeature.CUSTODY_BITGO_GERMANY,
            CoinFeature.CUSTODY_BITGO_EUROPE_APS,
            CoinFeature.CUSTODY_BITGO_FRANKFURT,
            CoinFeature.CUSTODY_BITGO_SINGAPORE,
            CoinFeature.CUSTODY_BITGO_MENA_FZE,
          ],
          ETH_FEATURES
        ),
        CoinFeature.STABLECOIN,
      ] as CoinFeature[],
    },
    offchain: {
      id: '640b14f3-3c4d-4d9c-8139-73e68ec0db14',
      name: 'ofchusd',
      features: [CoinFeature.STABLECOIN] as CoinFeature[],
    },
  },
  {
    underlyingAsset: UnderlyingAsset.HYB,
    fullName: 'Hybrid Block',
    decimalPlaces: 18,
    onchain: {
      id: '6a41551c-ec90-4522-b26a-b7674a0e467e',
      name: 'hyb',
      contractAddress: '0x6059f55751603ead7dc6d280ad83a7b33d837c90',
      features: [
        ...ACCOUNT_COIN_DEFAULT_FEATURES_EXCLUDE_SINGAPORE_AND_MENA_FZE,
        CoinFeature.BULK_TRANSACTION,
      ] as CoinFeature[],
    },
    offchain: {
      id: '20b3f26c-fcbf-4cc7-9ce5-195892b5db75',
      name: 'ofchyb',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.HYDRO,
    fullName: 'Hydro',
    decimalPlaces: 18,
    onchain: {
      id: 'd974e147-3232-4546-85d9-66625ecee68e',
      name: 'hydro',
      contractAddress: '0xebbdf302c940c6bfd49c6b165f457fdb324649bc',
      features: [
        ...ACCOUNT_COIN_DEFAULT_FEATURES_EXCLUDE_SINGAPORE_AND_MENA_FZE,
        CoinFeature.BULK_TRANSACTION,
      ] as CoinFeature[],
    },
    offchain: {
      id: '2c236ab8-6412-4359-b315-25366b6be662',
      name: 'ofchydro',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.I8,
    fullName: 'i8 Exchange Token',
    decimalPlaces: 18,
    onchain: {
      id: '1be67eaa-55ad-42f5-828a-46d186aae458',
      name: 'i8',
      contractAddress: '0xb61bb66bf9caba531e6bb2fb75dec389a1664dfd',
    },
    offchain: {
      id: '9b9269cf-9e89-4bf0-a37e-6b9e4e249c54',
      name: 'ofci8',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ICETH,
    fullName: 'Interest Compounding ETH Index',
    decimalPlaces: 18,
    onchain: {
      id: '09c6f4a6-f29d-42bc-96f4-ee334a984688',
      name: 'iceth',
      contractAddress: '0x7c07f7abe10ce8e33dc6c5ad68fe033085256a84',
      features: AccountCoin.getFeaturesByTypeExcluding(
        [
          CoinFeature.CUSTODY_BITGO_SINGAPORE,
          CoinFeature.CUSTODY_BITGO_GERMANY,
          CoinFeature.CUSTODY_BITGO_EUROPE_APS,
          CoinFeature.CUSTODY_BITGO_FRANKFURT,
        ],
        ETH_FEATURES
      ) as CoinFeature[],
    },
    offchain: {
      id: '778aa6db-7403-435d-bd01-8d6b8087843a',
      name: 'ofciceth',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ID,
    fullName: 'SPACE ID',
    decimalPlaces: 18,
    onchain: {
      id: '85100681-2a5c-4a36-81fa-34361c284a52',
      name: 'id',
      contractAddress: '0x2dff88a56767223a5529ea5960da7a3f5f766406',
    },
    offchain: {
      id: '403498f6-1913-4d94-9b62-feb7dbc1aa7f',
      name: 'ofcid',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.IDEX,
    fullName: 'IDEX',
    decimalPlaces: 18,
    onchain: {
      id: '45e05a1d-5cc2-48f6-abd1-ce9fce33a9cc',
      name: 'idex',
      contractAddress: '0xb705268213d593b8fd88d3fdeff93aff5cbdcfae',
    },
    offchain: {
      id: 'e4abb499-771c-4971-8720-9920f6f0213b',
      name: 'ofcidex',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.IDRC,
    fullName: 'Rupiah Coin',
    decimalPlaces: 18,
    onchain: {
      id: 'a04c7df6-8e04-4667-91b9-c707193d419b',
      name: 'idrc',
      contractAddress: '0x569f2241551011d5710c40fc61e0b3906c780b2f',
    },
    offchain: {
      id: 'aa2f15e8-a860-4a7c-acfb-bcb9e950fee6',
      name: 'ofcidrc',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.IDRT,
    fullName: 'Rupiah Token',
    decimalPlaces: 2,
    onchain: {
      id: '2df78e7b-25d1-40f1-81b8-c51bd7c88943',
      name: 'idrt',
      contractAddress: '0x998ffe1e43facffb941dc337dd0468d52ba5b48a',
    },
    offchain: {
      id: 'b7dfeff1-e50a-4e56-9e9b-5d972dcd2c89',
      name: 'ofcidrt',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.IMX,
    fullName: 'Immutable X',
    decimalPlaces: 18,
    onchain: {
      id: 'ba8d7826-21df-4be6-ab1c-a983dd2d02e5',
      name: 'imx',
      contractAddress: '0x65d0388c858acd99bdd1d44b00629d73f0ce4587',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: 'dd29dc35-a569-4c20-a116-e70bfaaa8619',
      name: 'ofcimx',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.IMXV2,
    fullName: 'Immutable X',
    decimalPlaces: 18,
    onchain: {
      id: '9ea6f559-0dc0-418c-bc06-679fa9894941',
      name: 'imxv2',
      contractAddress: '0xf57e7e7c23978c3caec3c3548e3d615c346e79ff',
      features: ETH_FEATURES_WITH_FRANKFURT_GERMANY as CoinFeature[],
    },
    offchain: {
      id: '3b4082ef-4061-495a-95f9-c405e3cb9866',
      name: 'ofcimxv2',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.INCX,
    fullName: 'InternationalCryptoX',
    decimalPlaces: 18,
    onchain: {
      id: 'b86f9330-7c00-4e1a-9432-ec965e3c14d4',
      name: 'incx',
      contractAddress: '0xa984a92731c088f1ea4d53b71a2565a399f7d8d5',
    },
    offchain: {
      id: '937db4e7-3000-4869-9666-88c1014b8a77',
      name: 'ofcincx',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.IND,
    fullName: 'Indorse',
    decimalPlaces: 18,
    onchain: {
      id: '3aed90ad-ee35-470d-a4a6-cb563b0f048d',
      name: 'ind',
      contractAddress: '0xf8e386eda857484f5a12e4b5daa9984e06e73705',
    },
    offchain: {
      id: '70be1dd9-c37a-4504-a1e4-b603e347c793',
      name: 'ofcind',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.INDEX,
    fullName: 'Index Coop',
    decimalPlaces: 18,
    onchain: {
      id: 'c48aaf32-d26b-4f72-b996-36ea90d9c82c',
      name: 'index',
      contractAddress: '0x0954906da0bf32d5479e25f46056d22f08464cab',
      features: AccountCoin.DEFAULT_FEATURES_EXCLUDE_SINGAPORE as CoinFeature[],
    },
    offchain: {
      id: '39733723-aa3b-4dea-8cc9-5b5393f59444',
      name: 'ofcindex',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.INDI,
    fullName: 'IndiGG',
    decimalPlaces: 18,
    onchain: {
      id: '7ea4ddc4-8247-4a9c-8077-fb111164840d',
      name: 'indi',
      contractAddress: '0x3392d8a60b77f8d3eaa4fb58f09d835bd31add29',
    },
    offchain: {
      id: 'd4c77d83-ea49-4ad0-8a4e-00641d54a265',
      name: 'ofcindi',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.INF,
    fullName: 'Infinitus Token',
    decimalPlaces: 18,
    onchain: {
      id: '0a292795-2efd-4c39-bb62-de4b3436f163',
      name: 'inf',
      contractAddress: '0x00e150d741eda1d49d341189cae4c08a73a49c95',
    },
    offchain: {
      id: 'd1c27020-e4a0-4535-a3ce-56605fd1662b',
      name: 'ofcinf',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.INJ,
    fullName: 'Inj',
    decimalPlaces: 18,
    onchain: {
      id: '13b88d2f-59ff-41f1-ad21-3899656865ed',
      name: 'inj',
      contractAddress: '0x84bffffd702d924c6d9b25f87151bf0fb1a8913e',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
  },
  {
    underlyingAsset: UnderlyingAsset.INJV2,
    fullName: 'Injective (ERC20)',
    decimalPlaces: 18,
    onchain: {
      id: 'fa128781-36cf-416f-bbf0-0ae247e66d51',
      name: 'injv2',
      contractAddress: '0xe28b3b32b6c345a34ff64674606124dd5aceca30',
      features: [...TOKEN_FEATURES_WITH_SWISS, CoinFeature.CUSTODY_BITGO_GERMANY] as CoinFeature[],
    },
    offchain: {
      id: '9a412bff-2dc2-43a0-bde3-bf6df401f16b',
      name: 'ofcinj',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.INST,
    fullName: 'Fluid',
    decimalPlaces: 18,
    onchain: {
      id: '108a64ac-9be8-4bf9-a683-3f30d49708de',
      name: 'inst',
      contractAddress: '0x6f40d4a6237c257fff2db00fa0510deeecd303eb',
    },
    offchain: {
      id: '6aa0fa86-ae88-408b-a79c-5a244d95ec0c',
      name: 'ofcinst',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.INX,
    fullName: 'INX Token',
    decimalPlaces: 18,
    onchain: {
      id: '9963747f-9c60-4783-9cf1-81a76ae93c99',
      name: 'inx',
      contractAddress: '0xbbc7f7a6aadac103769c66cbc69ab720f7f9eae3',
    },
    offchain: {
      id: 'db221db1-227a-438e-90ed-4e23c2c67927',
      name: 'ofcinx',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.IOST,
    fullName: 'IOSToken',
    decimalPlaces: 18,
    onchain: {
      id: 'e8763a73-0850-491d-9eda-45b2723f32d0',
      name: 'iost',
      contractAddress: '0xfa1a856cfa3409cfa145fa4e20eb270df3eb21ab',
    },
    offchain: {
      id: 'a304fb43-d234-4cf2-9269-2848b2531b0b',
      name: 'ofciost',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ISF,
    fullName: 'Susnova',
    decimalPlaces: 18,
    onchain: {
      id: '17970beb-59a7-48d0-b494-c5f0e9c4680d',
      name: 'isf',
      contractAddress: '0x3f9c0211e9ddfccabd614162ffb768f5a7a8ab38',
    },
    offchain: {
      id: 'ae4e755c-2f68-4e66-a9ed-2fc995568a6f',
      name: 'ofcisf',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ISR,
    fullName: 'Insureum',
    decimalPlaces: 18,
    onchain: {
      id: 'd3cff701-f4e8-4871-ba0b-5b151a490762',
      name: 'isr',
      contractAddress: '0xb16d3ed603d62b125c6bd45519eda40829549489',
    },
    offchain: {
      id: '71249e4f-f5c6-42f8-9a5d-8e93be9557d6',
      name: 'ofcisr',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.IVO,
    fullName: 'INVAO Token',
    decimalPlaces: 18,
    onchain: {
      id: '2ef243a9-327f-42fe-bab5-5b4899e04597',
      name: 'ivo',
      contractAddress: '0xe03df9fda489a405f5db8a919adbc9a1b931a19f',
    },
    offchain: {
      id: '84e84732-c59f-49ca-bf68-c1451871fce0',
      name: 'ofcivo',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.IVY,
    fullName: 'Ivy Koin',
    decimalPlaces: 18,
    onchain: {
      id: '1d6c64a5-9d94-4456-8ee8-d616b0e8beda',
      name: 'ivy',
      contractAddress: '0xa4ea687a2a7f29cf2dc66b39c68e4411c0d00c49',
    },
    offchain: {
      id: 'c677e2fc-7b1e-4302-8d46-c95c506ad391',
      name: 'ofcivy',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.JASMY,
    fullName: 'JasmyCoin',
    decimalPlaces: 18,
    onchain: {
      id: 'aabde9b2-1346-4732-b374-5a809301d4ad',
      name: 'jasmy',
      contractAddress: '0x7420b4b9a0110cdc71fb720908340c03f9bc03ec',
    },
    offchain: {
      id: 'afe60408-a2cd-4b4c-b4b2-5610faa8e4dd',
      name: 'ofcjasmy',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.JBC,
    fullName: 'Japan Brand Coin',
    decimalPlaces: 18,
    onchain: {
      id: '70bad6c3-d616-47f8-86b7-2293e478f7c2',
      name: 'jbc',
      contractAddress: '0x3635e381c67252405c1c0e550973155832d5e490',
    },
    offchain: {
      id: '01e85c61-2e1f-42cd-a382-5a0fc454fda9',
      name: 'ofcjbc',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.JCR,
    fullName: 'JustCarbon Removal Token',
    decimalPlaces: 18,
    onchain: {
      id: '8c9a702e-a66d-497b-b1ca-f999d25b1f47',
      name: 'jcr',
      contractAddress: '0x84f20bf5bb4be345d3ab37c565f732753435dbe3',
    },
    offchain: {
      id: 'a968151e-db16-4eec-b1d4-b4b69221f3fb',
      name: 'ofcjcr',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.JCG,
    fullName: 'JustCarbon Goverance Token',
    decimalPlaces: 18,
    onchain: {
      id: 'ba20a366-b30f-4c1c-94bd-cf0507ee4ae2',
      name: 'jcg',
      contractAddress: '0xbe601dd49da9ee1d2f64d422c4aecf8eb83c119f',
    },
    offchain: {
      id: '12cf7971-fba7-4858-b530-03ff5addf11d',
      name: 'ofcjcg',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.JFIN,
    fullName: 'JFIN Coin',
    decimalPlaces: 18,
    onchain: {
      id: 'fd13f75b-37aa-45e6-b683-b9d419870961',
      name: 'jfin',
      contractAddress: '0x940bdcb99a0ee5fb008a606778ae87ed9789f257',
    },
    offchain: {
      id: '56d14e3a-f438-4d14-a8f2-26f84b0c7959',
      name: 'ofcjfin',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.JPYX,
    fullName: 'eToro Japanese Yen',
    decimalPlaces: 18,
    onchain: {
      id: '664b9d17-ad55-4348-9e22-00b0ad205407',
      name: 'jpyx',
      contractAddress: '0x743c79f88dcadc6e7cfd7fa2bd8e2bfc68dae053',
    },
    offchain: {
      id: '68eb1c4f-bec3-44fc-9042-f9f239482b25',
      name: 'ofcjpyx',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.KARATE,
    fullName: 'Karate',
    decimalPlaces: 18,
    onchain: {
      id: '46b65f94-d279-4d42-addc-0b7254aa4eeb',
      name: 'karate',
      contractAddress: '0x80008bcd713c38af90a9930288d446bc3bd2e684',
    },
    offchain: {
      id: 'ad622157-71af-4eb9-b4cc-00c5c0e8195e',
      name: 'ofckarate',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.KEEP,
    fullName: 'Keep',
    decimalPlaces: 18,
    onchain: {
      id: '70978c3f-dd25-432d-b3d3-9f42b7905990',
      name: 'keep',
      contractAddress: '0x85eee30c52b0b379b046fb0f85f4f3dc3009afec',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: 'e1997001-ae6a-4ef4-8dc5-708d06b360e9',
      name: 'ofckeep',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.KEY,
    fullName: 'SelfKey',
    decimalPlaces: 18,
    onchain: {
      id: 'ba441f88-cd04-432c-866f-4d27ebfd4352',
      name: 'key',
      contractAddress: '0x4cc19356f2d37338b9802aa8e8fc58b0373296e7',
    },
    offchain: {
      id: 'd9299514-9dfd-4dfd-8fae-726c407b20ef',
      name: 'ofckey',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.KIN,
    fullName: 'Kin',
    decimalPlaces: 18,
    onchain: {
      id: 'b3197bbf-7885-49cb-85c7-848a40a122aa',
      name: 'kin',
      contractAddress: '0x818fc6c2ec5986bc6e2cbf00939d90556ab12ce5',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: 'c3f1ef74-8170-4c7d-afef-ac29ba32a309',
      name: 'ofckin',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.KINE,
    fullName: 'Kine Governance Token',
    decimalPlaces: 18,
    onchain: {
      id: 'dee18bce-9cd2-4d9b-8cc9-0c287a572043',
      name: 'kine',
      contractAddress: '0xcbfef8fdd706cde6f208460f2bf39aa9c785f05d',
      features: [
        ...ACCOUNT_COIN_DEFAULT_FEATURES_EXCLUDE_SINGAPORE_AND_MENA_FZE,
        CoinFeature.BULK_TRANSACTION,
      ] as CoinFeature[],
    },
    offchain: {
      id: 'c1317f3c-3fc4-4078-b271-ca8060632618',
      name: 'ofckine',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.KING,
    fullName: 'KING',
    decimalPlaces: 18,
    onchain: {
      id: 'dbbc8474-8899-48a8-b57e-28300469b856',
      name: 'king',
      contractAddress: '0x149d8290f653deb8e34c037d239d3d8eee9de5ad',
    },
    offchain: {
      id: '96f40627-8677-4d97-adb4-8f8e7736117a',
      name: 'ofcking',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.KINTO,
    fullName: 'Kinto Token',
    decimalPlaces: 18,
    onchain: {
      id: 'b408ff17-e3a4-411c-b1a5-b84100c034c4',
      name: 'kinto',
      contractAddress: '0x2367c8395a283f0285c6e312d5aa15826f1fea25',
    },
    offchain: {
      id: '1d54c16e-91de-448d-af33-fd85fd4f3a3b',
      name: 'ofckinto',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.KIRO,
    fullName: 'Kirobo',
    decimalPlaces: 18,
    onchain: {
      id: 'dc33d6df-9aed-4b6e-b10c-9874d3c2435e',
      name: 'kiro',
      contractAddress: '0xb1191f691a355b43542bea9b8847bc73e7abb137',
    },
    offchain: {
      id: '594c14ed-f146-476b-a460-2776f65ccfe6',
      name: 'ofckiro',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.KNC,
    fullName: 'Kyber Network',
    decimalPlaces: 18,
    onchain: {
      id: '4a86947d-e337-4796-81e5-4d08338035a1',
      name: 'knc',
      contractAddress: '0xdd974d5c2e2928dea5f71b9825b8b646686bd200',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
  },
  {
    underlyingAsset: UnderlyingAsset.KNC2,
    fullName: 'Kyber Network',
    decimalPlaces: 18,
    onchain: {
      id: 'a0e32a12-de20-42d9-b5f1-cd0475329a51',
      name: 'knc2',
      contractAddress: '0xdefa4e8a7bcba345f687a2f1456f5edd9ce97202',
    },
    offchain: {
      id: 'c7196c54-a262-49dd-9690-839ad1d14d9d',
      name: 'ofcknc',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.KOIN,
    fullName: 'Koin',
    decimalPlaces: 18,
    onchain: {
      id: 'cf21c36f-0286-4183-8d3d-b3b9034d6eac',
      name: 'koin',
      contractAddress: '0x1fb62df2b6ef8966161e422dbb40860b70941e50',
    },
    offchain: {
      id: 'bb37e133-93b9-4526-830f-af441205d5fa',
      name: 'ofckoin',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.KOZ,
    fullName: 'KOZJIN Token',
    decimalPlaces: 18,
    onchain: {
      id: '8da8fddc-a6d8-4815-a465-4743d993bd90',
      name: 'koz',
      contractAddress: '0xd95e7d16000cbeb66acbf70b4a843d4346ff4555',
    },
    offchain: {
      id: '428f86e5-af04-41d8-8ac5-779bcc948a27',
      name: 'ofckoz',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.KP3R,
    fullName: 'Kp3r',
    decimalPlaces: 18,
    onchain: {
      id: 'bbbab226-05c1-447f-b3ed-1af0b3bd3930',
      name: 'kp3r',
      contractAddress: '0x1ceb5cb57c4d4e2b2433641b95dd330a33185a44',
    },
    offchain: {
      id: 'bbf31494-0178-4107-9a63-b5d3f5c39e15',
      name: 'ofckp3r',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.KRO,
    fullName: 'Kroma',
    decimalPlaces: 18,
    onchain: {
      id: '9a173227-e535-43dc-b907-1452d9d2a030',
      name: 'kro',
      contractAddress: '0x25500000d700bbe27104577cccce8eabcc96c8ad',
      features: AccountCoin.getFeaturesByTypeExcluding(
        [
          CoinFeature.CUSTODY_BITGO_SINGAPORE,
          CoinFeature.CUSTODY_BITGO_GERMANY,
          CoinFeature.CUSTODY_BITGO_EUROPE_APS,
          CoinFeature.CUSTODY_BITGO_FRANKFURT,
          CoinFeature.CUSTODY_BITGO_MENA_FZE,
        ],
        ETH_FEATURES
      ) as CoinFeature[],
    },
    offchain: {
      id: 'a6144bdc-4331-412b-8cfd-0d80cc935adc',
      name: 'ofckro',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.KROM,
    fullName: 'Kromatika',
    decimalPlaces: 18,
    onchain: {
      id: 'cbcebae0-e2a8-4ebe-8da7-89983f04f917',
      name: 'krom',
      contractAddress: '0x3af33bef05c2dcb3c7288b77fe1c8d2aeba4d789',
    },
    offchain: {
      id: '31d6e17f-79ac-45cd-84ac-69cab4ff8f22',
      name: 'ofckrom',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.KZE,
    fullName: 'Almeela',
    decimalPlaces: 18,
    onchain: {
      id: 'd9a515fb-3c69-4633-876d-f236f36c55d4',
      name: 'kze',
      contractAddress: '0x8de67d55c58540807601dbf1259537bc2dffc84d',
    },
    offchain: {
      id: '007ea976-856c-4dca-bd42-ae49cb575f28',
      name: 'ofckze',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.L3,
    fullName: 'Layer3',
    decimalPlaces: 18,
    onchain: {
      id: 'fb3e5591-afb8-4849-b902-c8d70afd2542',
      name: 'l3',
      contractAddress: '0x88909d489678dd17aa6d9609f89b0419bf78fd9a',
    },
    offchain: {
      id: '4a26763d-e97e-495f-8254-c815b99fd3ae',
      name: 'ofcl3',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.LAYER,
    fullName: 'Unilayer',
    decimalPlaces: 18,
    onchain: {
      id: 'c269386c-d531-4c0b-b2fd-995e21ce8d2e',
      name: 'layer',
      contractAddress: '0x0ff6ffcfda92c53f615a4a75d982f399c989366b',
    },
    offchain: {
      id: '4e6fc42b-a1a4-41f8-9bf6-09324083231c',
      name: 'ofclayer',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.LBA,
    fullName: 'Cred',
    decimalPlaces: 18,
    onchain: {
      id: '8b8be8c7-305a-4e30-8e61-5bfcc3dec3b3',
      name: 'lba',
      contractAddress: '0xfe5f141bf94fe84bc28ded0ab966c16b17490657',
    },
    offchain: {
      id: 'bf01525d-3466-4827-953d-25e98cd6505b',
      name: 'ofclba',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.LEND,
    fullName: 'EthLend',
    decimalPlaces: 18,
    onchain: {
      id: 'b941f45d-1663-40e7-a31a-1f1a4c4148f7',
      name: 'lend',
      contractAddress: '0x80fb784b7ed66730e8b1dbd9820afd29931aab03',
    },
    offchain: {
      id: 'd90617c8-69dd-4d94-bfb8-5722fff9c0d2',
      name: 'ofclend',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.LDO,
    fullName: 'Lido DAO Token',
    decimalPlaces: 18,
    onchain: {
      id: 'b91a012c-ac18-4f0e-a3ce-dcd9e17eea6d',
      name: 'ldo',
      contractAddress: '0x5a98fcbea516cf06857215779fd812ca3bef1b32',
      features: ETH_FEATURES_WITH_FRANKFURT_GERMANY as CoinFeature[],
    },
    offchain: {
      id: '4da7f6a6-9c56-44f7-a9b2-07ae7c669e42',
      name: 'ofcldo',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.LEO,
    fullName: 'Bitfinex LEO',
    decimalPlaces: 18,
    onchain: {
      id: '5a44ae9e-c002-46cd-af8a-7e5fc91f3492',
      name: 'leo',
      contractAddress: '0x2af5d2ad76741191d15dfe7bf6ac92d4bd912ca3',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: '98af4163-68df-4877-b7a5-6c9ec00b991e',
      name: 'ofcleo',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.LGO,
    fullName: 'LGO Exchange',
    decimalPlaces: 8,
    onchain: {
      id: 'adff71d0-118d-4baa-8dfe-69174293f1ae',
      name: 'lgo',
      contractAddress: '0x0a50c93c762fdd6e56d86215c24aaad43ab629aa',
      features: AccountCoin.getFeaturesByTypeExcluding(
        [
          CoinFeature.CUSTODY_BITGO_GERMANY,
          CoinFeature.CUSTODY_BITGO_EUROPE_APS,
          CoinFeature.CUSTODY_BITGO_FRANKFURT,
          CoinFeature.CUSTODY_BITGO_MENA_FZE,
        ],
        ETH_FEATURES
      ) as CoinFeature[],
    },
    offchain: {
      id: '2a422650-e7e8-4f03-914b-b23b04681a0e',
      name: 'ofclgo',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.LINA,
    fullName: 'Linear Token',
    decimalPlaces: 18,
    onchain: {
      id: '63626e56-84f0-425d-8125-48be872967cc',
      name: 'lina',
      contractAddress: '0x3e9bc21c9b189c09df3ef1b824798658d5011937',
    },
    offchain: {
      id: '835beb77-44e1-4c46-abb0-e11a21c170c0',
      name: 'ofclina',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.LINK,
    fullName: 'ChainLink',
    decimalPlaces: 18,
    onchain: {
      id: '0296c213-48b2-4082-830c-be42302a37e6',
      name: 'link',
      contractAddress: '0x514910771af9ca656af840dff83e8264ecf986ca',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: 'b20a48eb-a9b5-4bc7-b5a1-3b6317c542f8',
      name: 'ofclink',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.LION,
    fullName: 'CoinLion',
    decimalPlaces: 18,
    onchain: {
      id: 'ca72e22a-8fd4-4f17-90f0-c44987be9dcd',
      name: 'lion',
      contractAddress: '0x2167fb82309cf76513e83b25123f8b0559d6b48f',
    },
    offchain: {
      id: '45ad85cc-96e3-4f88-a8c9-358c563e0fe8',
      name: 'ofclion',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.LIT,
    fullName: 'Litentry',
    decimalPlaces: 18,
    onchain: {
      id: '391aa5ea-43e2-4ab2-a326-e24c6879708b',
      name: 'lit',
      contractAddress: '0xb59490ab09a0f526cc7305822ac65f2ab12f9723',
    },
    offchain: {
      id: '093c7404-3f67-421e-87b2-15ee4cd0adf6',
      name: 'ofclit',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.LMWR,
    fullName: 'LimeWire Token',
    decimalPlaces: 18,
    onchain: {
      id: '0363f7f4-65dd-41d8-959c-7a62c00a84f1',
      name: 'lmwr',
      contractAddress: '0x628a3b2e302c7e896acc432d2d0dd22b6cb9bc88',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: '3fb41ea5-d475-4131-91f3-d0ec743fcf8a',
      name: 'ofclmwr',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.LNC,
    fullName: 'Linker Coin',
    decimalPlaces: 18,
    onchain: {
      id: '741a2032-0f4f-400c-8c1c-55fe33af7f5c',
      name: 'lnc',
      contractAddress: '0x6beb418fc6e1958204ac8baddcf109b8e9694966',
    },
    offchain: {
      id: 'de4dc6c3-4beb-4f83-a0d7-8ad7f09d28bd',
      name: 'ofclnc',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.LOKA,
    fullName: 'League of Kingdoms',
    decimalPlaces: 18,
    onchain: {
      id: '8b4aa7e7-6b76-4571-875f-9e2a45d690a4',
      name: 'loka',
      contractAddress: '0x61e90a50137e1f645c9ef4a0d3a4f01477738406',
    },
    offchain: {
      id: 'c228fc8d-4a95-4e10-be96-826dbfb8aa0f',
      name: 'ofcloka',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.LOOKS,
    fullName: 'LooksRare',
    decimalPlaces: 18,
    onchain: {
      id: '903f10ef-6c5a-4049-9d84-584cae7cf3a6',
      name: 'looks',
      contractAddress: '0xf4d2888d29d722226fafa5d9b24f9164c092421e',
    },
    offchain: {
      id: '733c97e2-60ba-4b00-b897-4b0c8d49367d',
      name: 'ofclooks',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.LOOM,
    fullName: 'Loom Network',
    decimalPlaces: 18,
    onchain: {
      id: '563225fa-1a76-4b35-82db-5760e2104ef9',
      name: 'loom',
      contractAddress: '0xa4e8c3ec456107ea67d3075bf9e3df3a75823db0',
      features: [
        ...ACCOUNT_COIN_DEFAULT_FEATURES_EXCLUDE_SINGAPORE_AND_MENA_FZE,
        CoinFeature.BULK_TRANSACTION,
      ] as CoinFeature[],
    },
    offchain: {
      id: '2eb92d2b-c869-4137-b5ba-c18d7bc5f4c0',
      name: 'ofcloom',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.LOOM1,
    fullName: 'Loom Token',
    decimalPlaces: 18,
    onchain: {
      id: 'd84a0737-6c44-4827-8e11-b07ac1e84d17',
      name: 'loom1',
      contractAddress: '0x42476f744292107e34519f9c357927074ea3f75d',
    },
    offchain: {
      id: '77506c23-b1ba-44e7-b8e3-4d288b553644',
      name: 'ofcloom1',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.LRC,
    fullName: 'loopring',
    decimalPlaces: 18,
    onchain: {
      id: '713440e6-432c-471a-b67d-e359aa1059f5',
      name: 'lrc',
      contractAddress: '0xef68e7c694f40c8202821edf525de3782458639f',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: '785debb3-cd34-4043-92c4-8d777c2a803b',
      name: 'ofclrc',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.LRCV2,
    fullName: 'loopring V2',
    decimalPlaces: 18,
    onchain: {
      id: '960d32da-b4da-45e8-86e9-ef8347f57ab7',
      name: 'lrcv2',
      contractAddress: '0xbbbbca6a901c926f240b89eacb641d8aec7aeafd',
    },
    offchain: {
      id: '851febfa-1b5c-4220-bf23-356debeb13fe',
      name: 'ofclrcv2',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.LSETH,
    fullName: 'Liquid Staked ETH',
    decimalPlaces: 18,
    onchain: {
      id: '084d49c5-4a8e-4f9b-bc86-4b414c7364ec',
      name: 'lseth',
      contractAddress: '0x48d93d8c45fb25125f13cdd40529bbeaa97a6565',
      features: AccountCoin.DEFAULT_FEATURES_EXCLUDE_SINGAPORE as CoinFeature[],
    },
    offchain: {
      id: '6010e752-a14c-4aa4-908f-b2339dc64b7e',
      name: 'ofclseth',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.LSK,
    fullName: 'Lisk',
    decimalPlaces: 18,
    onchain: {
      id: 'f55a200e-3eba-4336-9f95-4b0578c10d0b',
      name: 'lsk',
      contractAddress: '0x6033f7f88332b8db6ad452b7c6d5bb643990ae3f',
    },
    offchain: {
      id: '61c9dbe3-7609-4a36-a781-c057bd3ae88a',
      name: 'ofclsk',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.LTCBULL,
    fullName: '3X Long Litecoin Token',
    decimalPlaces: 18,
    onchain: {
      id: '69a336d1-d401-4efc-b613-615c6f19f450',
      name: 'ltcbull',
      contractAddress: '0xdb61354e9cf2217a29770e9811832b360a8daad3',
    },
    offchain: {
      id: '96917c5f-b397-4701-b009-1d496e7e27c0',
      name: 'ofcltcbull',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.LUA,
    fullName: 'LuaToken',
    decimalPlaces: 18,
    onchain: {
      id: '790c95fb-f5eb-421e-800f-1f32917ee9ce',
      name: 'lua',
      contractAddress: '0xb1f66997a5760428d3a87d68b90bfe0ae64121cc',
    },
    offchain: {
      id: 'c6ed9180-a457-4225-8f70-daaa5604c7ae',
      name: 'ofclua',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.LYN,
    fullName: 'Lynchpin',
    decimalPlaces: 18,
    onchain: {
      id: 'cdca2036-9cd4-4479-9904-4edfff15fd61',
      name: 'lyn',
      contractAddress: '0xb0b1685f55843d03739c7d9b0a230f1b7dcf03d5',
    },
    offchain: {
      id: '10608d21-a42a-4247-95d0-8547b55faae1',
      name: 'ofclyn',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.MAGIC,
    fullName: 'Magic',
    decimalPlaces: 18,
    onchain: {
      id: 'da39727e-150b-4995-bab7-88b60ef2dbd9',
      name: 'magic',
      contractAddress: '0xb0c7a3ba49c7a6eaba6cd4a96c55a1391070ac9a',
    },
    offchain: {
      id: '691197b6-d2e7-45ec-ae91-346eb62b9b54',
      name: 'ofcmagic',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.MANA,
    fullName: 'Decentraland',
    decimalPlaces: 18,
    onchain: {
      id: '090b4ea4-5c7f-439c-8fb5-7d4bfa901e82',
      name: 'mana',
      contractAddress: '0x0f5d2fb29fb7d3cfee444a200298f468908cc942',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: '7febf4f7-02e8-4d3d-bdef-98e44d2cab14',
      name: 'ofcmana',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.MAPS,
    fullName: 'Maps',
    decimalPlaces: 6,
    onchain: {
      id: '8b9991bf-e8f2-4e9a-a07f-8243529b6d25',
      name: 'maps',
      contractAddress: '0x2b915b505c017abb1547aa5ab355fbe69865cc6d',
    },
    offchain: {
      id: '70a49938-6321-4034-8c43-b3da631cf5ff',
      name: 'ofcmaps',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.MASA,
    fullName: 'Masa Token',
    decimalPlaces: 18,
    onchain: {
      id: 'bcdfd73d-f204-4dca-b0eb-09b804336ff7',
      name: 'masa',
      contractAddress: '0x944824290cc12f31ae18ef51216a223ba4063092',
    },
    offchain: {
      id: 'fcc0e550-ff67-4c0a-9d28-4a6e8ee32d93',
      name: 'ofcmasa',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.MASK,
    fullName: 'Mask Network',
    decimalPlaces: 18,
    onchain: {
      id: '6c8efb37-d870-4e4f-b25a-d8ef914b2c7b',
      name: 'mask',
      contractAddress: '0x69af81e73a73b40adf4f3d4223cd9b1ece623074',
    },
    offchain: {
      id: 'cf195e88-d5eb-4e20-aeca-6a02e845a561',
      name: 'ofcmask',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.MATH,
    fullName: 'MATH Token',
    decimalPlaces: 18,
    onchain: {
      id: 'a0b018d5-13b0-4f02-a4ea-388f5c56d8c1',
      name: 'math',
      contractAddress: '0x08d967bb0134f2d07f7cfb6e246680c53927dd30',
    },
    offchain: {
      id: '1a66a1f7-ad86-4959-aa9b-19891ea0e256',
      name: 'ofcmath',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.MATIC,
    fullName: 'Matic Token',
    decimalPlaces: 18,
    onchain: {
      id: '41ef8d39-72ec-4f1a-8927-53e5ea32f73b',
      name: 'matic',
      contractAddress: '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0',
      features: MATIC_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: 'c1db2b60-7bc2-4503-89d5-4d73f83e49ea',
      name: 'ofcmatic',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.MCB,
    fullName: 'MCDEX Token',
    decimalPlaces: 18,
    onchain: {
      id: 'ab8c9dac-5e2e-4a10-bb78-250203b93adf',
      name: 'mcb',
      contractAddress: '0x4e352cf164e64adcbad318c3a1e222e9eba4ce42',
    },
    offchain: {
      id: '3ef360cc-3ab6-4cfa-aa9d-f51678dbe1eb',
      name: 'ofcmcb',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.MCDAI,
    fullName: 'Dai',
    decimalPlaces: 18,
    onchain: {
      id: '49b6a7f4-0828-4a56-bc0e-dfe370152b36',
      name: 'mcdai',
      contractAddress: '0x6b175474e89094c44da98b954eedeac495271d0f',
    },
    offchain: {
      id: 'a41c3d2e-d0b3-4f9e-bebc-33f7343e51ac',
      name: 'ofcmcdai',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.MCO,
    fullName: 'Crypto.com',
    decimalPlaces: 8,
    onchain: {
      id: 'f2e6d469-60a2-4402-b167-7cf0beb46d28',
      name: 'mco',
      contractAddress: '0xb63b606ac810a52cca15e44bb630fd42d8d1d83d',
    },
    offchain: {
      id: 'c54e7e11-8e2e-493b-9119-8e2bf359aa92',
      name: 'ofcmco',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.MCO2,
    fullName: 'Moss Carbon Credit',
    decimalPlaces: 18,
    onchain: {
      id: '37c17859-e422-4d64-af33-db57938e3b95',
      name: 'mco2',
      contractAddress: '0xfc98e825a2264d890f9a1e68ed50e1526abccacd',
    },
    offchain: {
      id: 'e75640dd-d7b4-4f2d-8e6e-dab4d4dc0c4a',
      name: 'ofcmco2',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.MCS,
    fullName: 'MCS Token',
    decimalPlaces: 18,
    onchain: {
      id: 'dd05ec06-3119-4118-8037-b884929b5cb3',
      name: 'mcs',
      contractAddress: '0x2fdf40c484b1bd6f1c214acac737fedc8b03e5a8',
    },
    offchain: {
      id: '60de27b9-4767-43ba-8828-aa408fd98f1a',
      name: 'ofcmcs',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.MCX,
    fullName: 'MachiX Token',
    decimalPlaces: 18,
    onchain: {
      id: '418bd07d-6743-46fd-a7a4-100c127e1307',
      name: 'mcx',
      contractAddress: '0xd15ecdcf5ea68e3995b2d0527a0ae0a3258302f8',
    },
    offchain: {
      id: '97613a25-37f5-447f-87dd-b67b7b52c000',
      name: 'ofcmcx',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.MDFC,
    fullName: 'MDFC',
    decimalPlaces: 18,
    onchain: {
      id: 'ebe47467-b6e1-4cb8-a02a-e7f24d6b57d2',
      name: 'mdfc',
      contractAddress: '0x2810ff4092864f4b9259d05dd6da829d61bdcdab',
    },
    offchain: {
      id: '4ac19bd5-fb36-4b73-8d38-c1f6b7d14e3b',
      name: 'ofcmdfc',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.MDT,
    fullName: 'Measurable Data Token',
    decimalPlaces: 18,
    onchain: {
      id: '597b14d7-83a5-4d53-b757-f80e3e99d9a2',
      name: 'mdt',
      contractAddress: '0x814e0908b12a99fecf5bc101bb5d0b8b5cdf7d26',
    },
    offchain: {
      id: '11110753-1c19-414b-bf5c-fb236a40be61',
      name: 'ofcmdt',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.MDX,
    fullName: 'Mandala',
    decimalPlaces: 18,
    onchain: {
      id: 'dd51bf63-f120-46d8-b56d-279a2c3e2651',
      name: 'mdx',
      contractAddress: '0x9d03393d297e42c135625d450c814892505f1a84',
      features: AccountCoin.getFeaturesByTypeExcluding(
        [CoinFeature.CUSTODY_BITGO_MENA_FZE, CoinFeature.CUSTODY_BITGO_SINGAPORE],
        ETH_FEATURES_WITH_FRANKFURT
      ) as CoinFeature[],
    },
    offchain: {
      id: '75c02300-0602-4dcc-a0e8-1137962f17e7',
      name: 'ofcmdx',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.MEDX,
    fullName: 'Medibloc',
    decimalPlaces: 8,
    onchain: {
      id: '4d88bb1f-b643-41f8-87ca-e01259903393',
      name: 'medx',
      contractAddress: '0xfd1e80508f243e64ce234ea88a5fd2827c71d4b7',
      features: [
        ...ACCOUNT_COIN_DEFAULT_FEATURES_EXCLUDE_SINGAPORE_AND_MENA_FZE,
        CoinFeature.BULK_TRANSACTION,
      ] as CoinFeature[],
    },
    offchain: {
      id: '16467423-4acd-40fd-92cb-45a4f96c75b7',
      name: 'ofcmedx',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.MEME,
    fullName: 'Meme',
    decimalPlaces: 8,
    onchain: {
      id: 'f6c5793b-d6f6-46de-a7a8-5fe4283d01c9',
      name: 'meme',
      contractAddress: '0xd5525d397898e5502075ea5e830d8914f6f0affe',
    },
    offchain: {
      id: '3db3b895-756c-4c95-9dea-08d283f09a7a',
      name: 'ofcmeme',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.MEOW,
    fullName: 'MEOW',
    decimalPlaces: 18,
    onchain: {
      id: 'dd2fd2e2-339c-42ad-b1fc-744b7952eea5',
      name: 'meow',
      contractAddress: '0x0ec78ed49c2d27b315d462d43b5bab94d2c79bf8',
    },
    offchain: {
      id: '51d39caa-26b4-4763-9314-3d1a39450815',
      name: 'ofcmeow',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.MET,
    fullName: 'Metronome',
    decimalPlaces: 18,
    onchain: {
      id: 'cfe6ff8e-6033-4aa6-9b60-b6edc12cc0ae',
      name: 'met',
      contractAddress: '0xa3d58c4e56fedcae3a7c43a725aee9a71f0ece4e',
    },
    offchain: {
      id: 'b77fe6b3-c5d1-4f12-a8e4-841d16fa95fc',
      name: 'ofcmet',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.META,
    fullName: 'Metadium',
    decimalPlaces: 18,
    onchain: {
      id: 'c2746038-88bb-482c-a191-98ee0952932a',
      name: 'meta',
      contractAddress: '0xde2f7766c8bf14ca67193128535e5c7454f8387c',
      features: [...AccountCoin.DEFAULT_FEATURES, CoinFeature.DEPRECATED] as CoinFeature[],
    },
    offchain: {
      id: '06094bcc-f0a9-46ef-a96c-0e2f94e1cd54',
      name: 'ofcmeta',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.MFG,
    fullName: 'SyncFab',
    decimalPlaces: 18,
    onchain: {
      id: '4e6a9555-8eca-4843-bdfc-a57c82880b15',
      name: 'mfg',
      contractAddress: '0x6710c63432a2de02954fc0f851db07146a6c0312',
    },
    offchain: {
      id: 'f91ed73e-ca4c-4a44-b038-e365cc0f39fa',
      name: 'ofcmfg',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.MFPH,
    fullName: 'MFPH Token',
    decimalPlaces: 18,
    onchain: {
      id: '4bf94597-568d-4aef-a143-012fe5447dd3',
      name: 'mfph',
      contractAddress: '0xbc7e1056ecc72d14228a14a53815c5d3ad86c84e',
    },
    offchain: {
      id: '40ff7ca9-63e1-4d7c-b1db-54f3666db965',
      name: 'ofcmfph',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.MFT,
    fullName: 'Mainframe',
    decimalPlaces: 18,
    onchain: {
      id: 'be0efcb8-8fdb-4fd3-a250-332769a41e9a',
      name: 'mft',
      contractAddress: '0xdf2c7238198ad8b389666574f2d8bc411a4b7428',
      features: [
        ...ACCOUNT_COIN_DEFAULT_FEATURES_EXCLUDE_SINGAPORE_AND_MENA_FZE,
        CoinFeature.BULK_TRANSACTION,
      ] as CoinFeature[],
    },
    offchain: {
      id: '7eb5c190-9751-4024-8e97-c8915e7b1aeb',
      name: 'ofcmft',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.MIDBULL,
    fullName: '3X Long Midcap Index Token',
    decimalPlaces: 18,
    onchain: {
      id: '8e69cc01-e657-42dd-98a0-3398ea93549b',
      name: 'midbull',
      contractAddress: '0x59db60bd41bbc8ca4c1efee6ea2a97eae1e30cf5',
    },
    offchain: {
      id: 'c3f1eb1c-4d42-4767-a0f7-16c02fc3eaf8',
      name: 'ofcmidbull',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.MILKV2,
    fullName: 'Milkv2',
    decimalPlaces: 18,
    onchain: {
      id: 'a9f89e0a-c298-4e25-af2f-02e475de634f',
      name: 'milkv2',
      contractAddress: '0x80c8c3dcfb854f9542567c8dac3f44d709ebc1de',
    },
    offchain: {
      id: 'f7f9cb6b-48e5-407d-9ece-78f9c4038e63',
      name: 'ofcmilkv2',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.MIR,
    fullName: 'Mirror Protocol',
    decimalPlaces: 18,
    onchain: {
      id: 'a189c5bd-eb17-4ad2-a006-d390ecbb5c84',
      name: 'mir',
      contractAddress: '0x09a3ecafa817268f77be1283176b946c4ff2e608',
      features: AccountCoin.getFeaturesByTypeExcluding(
        [CoinFeature.CUSTODY_BITGO_MENA_FZE, CoinFeature.CUSTODY_BITGO_SINGAPORE],
        ETH_FEATURES_WITH_FRANKFURT
      ) as CoinFeature[],
    },
    offchain: {
      id: 'cef83c03-801b-4fd8-8947-bc060c8fa6ea',
      name: 'ofcmir',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.MITH,
    fullName: 'Mithril',
    decimalPlaces: 18,
    onchain: {
      id: '6d781cdc-3bb0-4865-afa0-0aa61ccf49b2',
      name: 'mith',
      contractAddress: '0x3893b9422cd5d70a81edeffe3d5a1c6a978310bb',
    },
    offchain: {
      id: '1b323a6e-eb6b-44d1-b6f4-5e50fd12e5e3',
      name: 'ofcmith',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.MIX,
    fullName: 'MixMarvel Token',
    decimalPlaces: 18,
    onchain: {
      id: '151d513a-4b79-461a-99ea-c006ee36df0d',
      name: 'mix',
      contractAddress: '0x5d285f735998f36631f678ff41fb56a10a4d0429',
    },
    offchain: {
      id: '2c592feb-b052-4a08-bd42-9c0c8a8b8611',
      name: 'ofcmix',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.MIZN,
    fullName: 'Miznettk',
    decimalPlaces: 18,
    onchain: {
      id: '67cecd4c-d830-41a8-9b27-abb7a255ffb7',
      name: 'mizn',
      contractAddress: '0x57fe785236542cb21747ed011be2699f43c372dc',
    },
    offchain: {
      id: '2e6f9527-d720-4079-b376-04fdcdd4c9e9',
      name: 'ofcmizn',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.MKR,
    fullName: 'Maker',
    decimalPlaces: 18,
    onchain: {
      id: 'e29a45ae-dd6d-4489-9904-eb989182d3db',
      name: 'mkr',
      contractAddress: '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: 'ca3187fa-c9f1-4d18-8556-16b9b202ce55',
      name: 'ofcmkr',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.MNS,
    fullName: 'Monnos Token',
    decimalPlaces: 18,
    onchain: {
      id: 'b2f98ccf-333c-4dfd-bd5e-875389162181',
      name: 'mns',
      contractAddress: '0x53884b61963351c283118a8e1fc05ba464a11959',
    },
    offchain: {
      id: '6174ddda-b240-4623-b391-50219c0ddc9e',
      name: 'ofcmns',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.MNT,
    fullName: 'Mantle ETH Token',
    decimalPlaces: 18,
    onchain: {
      id: '83efb059-93b4-44b6-ab68-c29d5bbc08e1',
      name: 'mnt',
      contractAddress: '0x3c3a81e81dc49a522a592e7622a7e711c06bf354',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: '37e7d659-c3a4-4761-8f42-76fb7bc5032c',
      name: 'ofcmnt',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.MLN,
    fullName: 'Enzyme',
    decimalPlaces: 18,
    onchain: {
      id: '1301f2e6-3f4c-46ab-9f21-e6e8eadb0f3c',
      name: 'mln',
      contractAddress: '0xec67005c4e498ec7f55e092bd1d35cbc47c91892',
    },
    offchain: {
      id: 'f3655b59-17b2-4e9e-914b-771d9ea1078c',
      name: 'ofcmln',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.MOC,
    fullName: 'Moss Coin',
    decimalPlaces: 18,
    onchain: {
      id: 'fb049629-1846-4bbe-b163-330940e7d03e',
      name: 'moc',
      contractAddress: '0x865ec58b06bf6305b886793aa20a2da31d034e68',
    },
    offchain: {
      id: 'aa31a241-3e24-4a17-95db-ee74a6843b70',
      name: 'ofcmoc',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.MOCA,
    fullName: 'Moca',
    decimalPlaces: 18,
    onchain: {
      id: 'dd8a03a7-ae77-4764-9405-d7f33b6d994d',
      name: 'moca',
      contractAddress: '0xf944e35f95e819e752f3ccb5faf40957d311e8c5',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: '5d0f9251-58e1-44fa-b1d6-b87ed23586da',
      name: 'ofcmoca',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.MOF,
    fullName: 'Molecular Future',
    decimalPlaces: 16,
    onchain: {
      id: 'f1654a22-81cc-4798-b815-c9faa5ad5cd0',
      name: 'mof',
      contractAddress: '0x653430560be843c4a3d143d0110e896c2ab8ac0d',
      features: [
        ...ACCOUNT_COIN_DEFAULT_FEATURES_EXCLUDE_SINGAPORE_AND_MENA_FZE,
        CoinFeature.BULK_TRANSACTION,
      ] as CoinFeature[],
    },
    offchain: {
      id: '97ebe992-de04-4917-b808-2c867fa380a0',
      name: 'ofcmof',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.MOG,
    fullName: 'Mog Coin',
    decimalPlaces: 18,
    onchain: {
      id: 'a692ffeb-4628-4014-adc9-7fb6c4b2ef65',
      name: 'mog',
      contractAddress: '0xaaee1a9723aadb7afa2810263653a34ba2c21c7a',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: '4030e0fa-fa80-4e30-8c0f-9168ec65c731',
      name: 'ofcmog',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.MPAY,
    fullName: 'MenaPay',
    decimalPlaces: 18,
    onchain: {
      id: '199e23f6-a1be-40c8-ab93-9df2d0c5f6c2',
      name: 'mpay',
      contractAddress: '0x3810a4ddf41e586fa0dba1463a7951b748cecfca',
    },
    offchain: {
      id: '9a4e4778-5188-4fbc-8365-9dc0ec667692',
      name: 'ofcmpay',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.MPL,
    fullName: 'Maple Token',
    decimalPlaces: 18,
    onchain: {
      id: '93ff950f-857a-4911-8685-0c3ca41bec3f',
      name: 'mpl',
      contractAddress: '0x33349b282065b0284d756f0577fb39c158f935e6',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: '162eff5b-36e0-4b7e-b844-381d49b9aaaa',
      name: 'ofcmpl',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.MTCN,
    fullName: 'Multiven',
    decimalPlaces: 18,
    onchain: {
      id: 'ef3fd8e2-ac69-4499-b615-59c4b3c5b674',
      name: 'mtcn',
      contractAddress: '0xf6117cc92d7247f605f11d4c942f0feda3399cb5',
    },
    offchain: {
      id: 'b6211763-0265-4b62-b611-8ed352c97516',
      name: 'ofcmtcn',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.MTA,
    fullName: 'Meta',
    decimalPlaces: 18,
    onchain: {
      id: 'c96c8f25-fa6b-4705-9770-eccc711691ce',
      name: 'mta',
      contractAddress: '0xa3bed4e1c75d00fa6f4e5e6922db7261b5e9acd2',
    },
    offchain: {
      id: 'a880c391-4c5a-4748-9bc7-1f36334562ec',
      name: 'ofcmta',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.MTL,
    fullName: 'Metal',
    decimalPlaces: 8,
    onchain: {
      id: 'd4529d4e-831e-4e1f-81b3-8d04aefba2f9',
      name: 'mtl',
      contractAddress: '0xf433089366899d83a9f26a773d59ec7ecf30355e',
    },
    offchain: {
      id: '8e1b08d6-db2f-477f-8e49-58976849638e',
      name: 'ofcmtl',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.MUSD,
    fullName: 'mStable USD',
    decimalPlaces: 18,
    onchain: {
      id: '53762490-b7af-41ef-b605-3924245c321a',
      name: 'musd',
      contractAddress: '0xe2f2a5c287993345a840db3b0845fbc70f5935a5',
      features: [...ACCOUNT_COIN_DEFAULT_FEATURES, CoinFeature.STABLECOIN] as CoinFeature[],
    },
    offchain: {
      id: 'a34f03a4-6e4f-45db-b00b-936f07127359',
      name: 'ofcmusd',
      features: [CoinFeature.STABLECOIN] as CoinFeature[],
    },
  },
  {
    underlyingAsset: UnderlyingAsset.MVL,
    fullName: 'Mass Vehicle Ledger',
    decimalPlaces: 18,
    onchain: {
      id: '3018d8a9-cd00-433b-ba52-56933bcf0171',
      name: 'mvl',
      contractAddress: '0xa849eaae994fb86afa73382e9bd88c2b6b18dc71',
    },
    offchain: {
      id: 'a56ce939-2af2-408d-80a2-c890f2b495e3',
      name: 'ofcmvl',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.MVI,
    fullName: 'Metaverse Index',
    decimalPlaces: 18,
    onchain: {
      id: '844d5b0c-2e6a-4e6a-a072-78d30770bcc5',
      name: 'mvi',
      contractAddress: '0x72e364f2abdc788b7e918bc238b21f109cd634d7',
      features: AccountCoin.DEFAULT_FEATURES_EXCLUDE_SINGAPORE as CoinFeature[],
    },
    offchain: {
      id: '8cbe862a-ce3e-4d0d-ab77-e854422d7a94',
      name: 'ofcmvi',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.MWT,
    fullName: 'Mountain Wolf Token',
    decimalPlaces: 18,
    onchain: {
      id: '95a8ea88-32de-4099-a359-603a57b3c3e8',
      name: 'mwt',
      contractAddress: '0x1bd936a1d180b5afc640ea9b2274156af0b7533b',
    },
    offchain: {
      id: '6213e9f1-19eb-4464-8353-308d0fe2c4a0',
      name: 'ofcmwt',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.MYRC,
    fullName: 'MYRC',
    decimalPlaces: 18,
    onchain: {
      id: '27f214d8-4feb-4cda-8177-876056f69536',
      name: 'myrc',
      contractAddress: '0xbed7d999f1d71ac70c263f64c7c7e009d691be2e',
    },
    offchain: {
      id: '2f014965-fc19-4fd8-85ef-c3a66c2ad798',
      name: 'ofcmyrc',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.MYTH,
    fullName: 'Mythos',
    decimalPlaces: 18,
    onchain: {
      id: 'e4ef14c9-6d7d-425d-a313-f2a536c6f513',
      name: 'myth',
      contractAddress: '0xba41ddf06b7ffd89d1267b5a93bfef2424eb2003',
    },
    offchain: {
      id: 'fd98b935-39a2-497a-a7a1-3d2f24bc23e1',
      name: 'ofcmyth',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.NAS,
    fullName: 'Nebulas',
    decimalPlaces: 18,
    onchain: {
      id: '5c73eef9-53ce-42d0-a72e-1900d1eef499',
      name: 'nas',
      contractAddress: '0x5d65d971895edc438f465c17db6992698a52318d',
    },
    offchain: {
      id: '8d773bb5-75ec-437d-aa9f-d3203ba1fdd1',
      name: 'ofcnas',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.NCT,
    fullName: 'Polyswarm',
    decimalPlaces: 18,
    onchain: {
      id: 'a92f6849-8163-4ae4-873f-771ed7e8540a',
      name: 'nct',
      contractAddress: '0x9e46a38f5daabe8683e10793b06749eef7d733d1',
    },
    offchain: {
      id: '11b74e48-dcc0-4126-99f5-2f4e794a23e5',
      name: 'ofcnct',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.NDX,
    fullName: 'Indexed Finance',
    decimalPlaces: 18,
    onchain: {
      id: '80822281-7e7f-4a8c-b2a2-de22cbc76aec',
      name: 'ndx',
      contractAddress: '0x86772b1409b61c639eaac9ba0acfbb6e238e5f83',
      features: AccountCoin.DEFAULT_FEATURES_EXCLUDE_SINGAPORE as CoinFeature[],
    },
    offchain: {
      id: '6b25d8bb-0a4e-49c8-a96c-d970b73fdddb',
      name: 'ofcndx',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.NEU,
    fullName: 'Neumark',
    decimalPlaces: 18,
    onchain: {
      id: 'f609f046-6dac-4d6f-9011-4eab449ee730',
      name: 'neu',
      contractAddress: '0xa823e6722006afe99e91c30ff5295052fe6b8e32',
      features: AccountCoin.getFeaturesByTypeExcluding(
        [
          CoinFeature.CUSTODY_BITGO_GERMANY,
          CoinFeature.CUSTODY_BITGO_EUROPE_APS,
          CoinFeature.CUSTODY_BITGO_FRANKFURT,
          CoinFeature.CUSTODY_BITGO_SINGAPORE,
          CoinFeature.CUSTODY_BITGO_MENA_FZE,
        ],
        ETH_FEATURES
      ) as CoinFeature[],
    },
    offchain: {
      id: '659398a6-8bae-439b-879d-4175da781bf0',
      name: 'ofcneu',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.NEXO,
    fullName: 'Nexo',
    decimalPlaces: 18,
    onchain: {
      id: 'e0e68b55-27a4-4111-b5fb-ee705a991b7a',
      name: 'nexo',
      contractAddress: '0xb62132e35a6c13ee1ee0f84dc5d40bad8d815206',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: '11c7e95c-fb0b-438c-963d-74b55ca04492',
      name: 'ofcnexo',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.NFTFI,
    fullName: 'NFTfi',
    decimalPlaces: 18,
    onchain: {
      id: '00df7662-904c-40a4-af71-969dd028c6ca',
      name: 'nftfi',
      contractAddress: '0x09d6f0f5a21f5be4f59e209747e2d07f50bc694c',
    },
    offchain: {
      id: 'ec2b2093-f737-4304-a638-bdc9fda53c6e',
      name: 'ofcnftfi',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.NFTX,
    fullName: 'NFTX',
    decimalPlaces: 18,
    onchain: {
      id: '1fa66c69-0b7b-4ad5-8731-1edbce501e6e',
      name: 'nftx',
      contractAddress: '0x87d73e916d7057945c9bcd8cdd94e42a6f47f776',
    },
    offchain: {
      id: '4bedacaf-41de-46a0-8181-cd1265bffb55',
      name: 'ofcnftx',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.NGNT,
    fullName: 'Naira Token',
    decimalPlaces: 2,
    onchain: {
      id: 'd71503c9-4234-47ad-8fa7-46307e55ddde',
      name: 'ngnt',
      contractAddress: '0x05bbed16620b352a7f889e23e3cf427d1d379ffe',
      features: AccountCoin.getFeaturesByTypeExcluding(
        [
          CoinFeature.CUSTODY_BITGO_GERMANY,
          CoinFeature.CUSTODY_BITGO_EUROPE_APS,
          CoinFeature.CUSTODY_BITGO_FRANKFURT,
          CoinFeature.CUSTODY_BITGO_SINGAPORE,
          CoinFeature.CUSTODY_BITGO_MENA_FZE,
        ],
        ETH_FEATURES
      ) as CoinFeature[],
    },
    offchain: {
      id: '22e60d45-012a-4eb4-829d-18f6392bacf0',
      name: 'ofcngnt',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.NIAX,
    fullName: 'IONIAX Token',
    decimalPlaces: 18,
    onchain: {
      id: '922e1952-5cb3-4199-91cd-cb13302f4f49',
      name: 'niax',
      contractAddress: '0x8cd18aface2bddd788b4e130ae374f54e43f2960',
    },
    offchain: {
      id: '0c14caa8-6cf5-4a0e-a114-533cdc88d2b6',
      name: 'ofcniax',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.NMR,
    fullName: 'Numeraire',
    decimalPlaces: 18,
    onchain: {
      id: '5b095696-c4d3-44db-a634-424684c43ffa',
      name: 'nmr',
      contractAddress: '0x1776e1f26f98b1a5df9cd347953a26dd3cb46671',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: 'bd61426f-87d8-4c52-b47d-2dc5eed84f64',
      name: 'ofcnmr',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.NOSANA,
    fullName: 'Nosana',
    decimalPlaces: 18,
    onchain: {
      id: '6da6a769-38cd-42fb-b8ae-30aa44ac3565',
      name: 'nosana',
      contractAddress: '0x7e079adaf785da025192e707b81c88980ca01f67',
    },
    offchain: {
      id: 'a801fdf0-e80d-439d-bdac-ec2d4ca0f353',
      name: 'ofcnosana',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.NU,
    fullName: 'NuCypher',
    decimalPlaces: 18,
    onchain: {
      id: '716a1eea-d9d4-41f6-a15f-76f00b210c9f',
      name: 'nu',
      contractAddress: '0x4fe83213d56308330ec302a8bd641f1d0113a4cc',
      features: AccountCoin.getFeaturesByTypeExcluding(
        [CoinFeature.CUSTODY_BITGO_GERMANY, CoinFeature.CUSTODY_BITGO_EUROPE_APS, CoinFeature.CUSTODY_BITGO_FRANKFURT],
        ETH_FEATURES
      ) as CoinFeature[],
    },
    offchain: {
      id: '1008e03a-61b2-4920-8efd-df2929249220',
      name: 'ofcnu',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.NYM,
    fullName: 'NYM',
    decimalPlaces: 6,
    onchain: {
      id: 'f3b3ea44-e236-4dd1-b005-605fff79f422',
      name: 'nym',
      contractAddress: '0x525a8f6f3ba4752868cde25164382bfbae3990e1',
      features: AccountCoin.getFeaturesByTypeExcluding(
        [CoinFeature.CUSTODY_BITGO_GERMANY, CoinFeature.CUSTODY_BITGO_EUROPE_APS, CoinFeature.CUSTODY_BITGO_FRANKFURT],
        ETH_FEATURES
      ) as CoinFeature[],
    },
    offchain: {
      id: 'f39fcfdc-0714-48c7-b84c-42db804cdac4',
      name: 'ofcnym',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.NZDX,
    fullName: 'eToro New Zealand Dollar',
    decimalPlaces: 18,
    onchain: {
      id: '1ec8d32a-47dc-4796-9896-cda036bd5200',
      name: 'nzdx',
      contractAddress: '0x6871799a4866bb9068b36b7a9bb93475ac77ac5d',
    },
    offchain: {
      id: '9d11cee7-c2e1-4681-9569-dd21059799d4',
      name: 'ofcnzdx',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.OCEAN,
    fullName: 'Ocean Token',
    decimalPlaces: 18,
    onchain: {
      id: '7b02d442-be52-41bf-8b98-71b558f48f9b',
      name: 'ocean',
      contractAddress: '0x7afebbb46fdb47ed17b22ed075cde2447694fb9e',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: 'f403394e-835e-44b9-86b4-198e920e7bb3',
      name: 'ofcocean',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.OCEANV2,
    fullName: 'Ocean Token V2',
    decimalPlaces: 18,
    onchain: {
      id: '7b8d77a2-4843-4000-a91a-79ba70cc5b96',
      name: 'oceanv2',
      contractAddress: '0x967da4048cd07ab37855c090aaf366e4ce1b9f48',
    },
    offchain: {
      id: 'f60e2aa4-0b99-40df-a316-bc1a41912ffd',
      name: 'ofcoceanv2',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:okb'],
    fullName: 'OKB ETH Token',
    decimalPlaces: 18,
    onchain: {
      id: '987fa929-39ff-40a2-9249-d7b3be9dc76d',
      name: 'eth:okb',
      contractAddress: '0x75231f58b43240c9718dd58b4967c5114342a86c',
    },
    offchain: {
      id: '8f01bcec-f576-49f8-b925-274566954017',
      name: 'ofceth:okb',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.OGN,
    fullName: 'Origin Token',
    decimalPlaces: 18,
    onchain: {
      id: '68a5e76f-cb79-4016-a35e-f88b5a391d95',
      name: 'ogn',
      contractAddress: '0x8207c1ffc5b6804f6024322ccf34f29c3541ae26',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: 'a2ef041c-8da0-444b-b41a-7b505240c84a',
      name: 'ofcogn',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.OMOLD,
    fullName: 'Om Token',
    decimalPlaces: 18,
    onchain: {
      id: 'f4a71d1f-b4df-4f76-ac39-8fab55a644e1',
      name: 'omold',
      contractAddress: '0x2baecdf43734f22fd5c152db08e3c27233f0c7d2',
    },
    offchain: {
      id: '1d355ee6-6de5-4c0d-9403-63a0d2ad99df',
      name: 'ofcomold',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.OMG,
    fullName: 'OmiseGO Token',
    decimalPlaces: 18,
    onchain: {
      id: '35f74b88-41f0-4759-a0ad-050d054a3812',
      name: 'omg',
      contractAddress: '0xd26114cd6ee289accf82350c8d8487fedb8a0c07',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: 'a67fc93e-d136-4d39-8bdb-1d786076536b',
      name: 'ofcomg',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.OMNI,
    fullName: 'Omni Network',
    decimalPlaces: 18,
    onchain: {
      id: '6c931519-f760-4651-a021-8dc0c81cccdf',
      name: 'omni',
      contractAddress: '0x36e66fbbce51e4cd5bd3c62b637eb411b18949d4',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: 'deb87ec4-0ae0-43fb-95bd-bd2ddf6a77a7',
      name: 'ofcomni',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.OMNIA,
    fullName: 'OMNIA Protocol',
    decimalPlaces: 18,
    onchain: {
      id: 'def47964-e90c-4862-a724-086e439d01de',
      name: 'omnia',
      contractAddress: '0x2e7e487d84b5baba5878a9833fb394bc89633fd7',
    },
    offchain: {
      id: '5d66b4c4-e9b0-4e1f-9abf-c6742ab38304',
      name: 'ofcomnia',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ONDO,
    fullName: 'Ondo',
    decimalPlaces: 18,
    onchain: {
      id: '2f715550-f0c3-47c7-860c-fb1a827d01a8',
      name: 'ondo',
      contractAddress: '0xfaba6f8e4a5e8ab82f62fe7c39859fa577269be3',
      features: ETH_FEATURES_WITH_FRANKFURT_GERMANY as CoinFeature[],
    },
    offchain: {
      id: 'acf53a01-3357-4095-93a2-2112a4acdcd4',
      name: 'ofcondo',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ONL,
    fullName: 'On.Live',
    decimalPlaces: 18,
    onchain: {
      id: 'fa692f6a-3491-4c7a-b512-927e6fcdd3f0',
      name: 'onl',
      contractAddress: '0x6863be0e7cf7ce860a574760e9020d519a8bdc47',
      features: AccountCoin.getFeaturesByTypeExcluding(
        [
          CoinFeature.CUSTODY_BITGO_GERMANY,
          CoinFeature.CUSTODY_BITGO_EUROPE_APS,
          CoinFeature.CUSTODY_BITGO_FRANKFURT,
          CoinFeature.CUSTODY_BITGO_SINGAPORE,
          CoinFeature.CUSTODY_BITGO_MENA_FZE,
        ],
        ETH_FEATURES
      ) as CoinFeature[],
    },
    offchain: {
      id: 'a1bcbc74-64b4-41ef-b1bb-f4ac089763ff',
      name: 'ofconl',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ONT,
    fullName: 'Ontology Token',
    decimalPlaces: 9,
    onchain: {
      id: 'b77f65d7-2ce1-497d-bf40-3f2ac936916b',
      name: 'ont',
      contractAddress: '0xcb46c550539ac3db72dc7af7c89b11c306c727c2',
    },
    offchain: {
      id: '1f5432f6-6693-43ff-95ea-e411600a31ab',
      name: 'ofcont',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.OOKI,
    fullName: 'Ooki Protocol',
    decimalPlaces: 18,
    onchain: {
      id: '6d5d9000-0fd2-4c10-b4e6-15044c327ea0',
      name: 'ooki',
      contractAddress: '0x0de05f6447ab4d22c8827449ee4ba2d5c288379b',
      features: [
        ...ACCOUNT_COIN_DEFAULT_FEATURES_EXCLUDE_SINGAPORE_AND_MENA_FZE,
        CoinFeature.BULK_TRANSACTION,
      ] as CoinFeature[],
    },
    offchain: {
      id: 'a13c7aaf-e497-4850-9422-63d3355afb7e',
      name: 'ofcooki',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.OP,
    fullName: 'Optimism',
    decimalPlaces: 18,
    onchain: {
      id: 'b308e6cc-52ff-421b-a3df-da70dac6a6a4',
      name: 'op',
      contractAddress: '0x4200000000000000000000000000000000000042',
    },
    offchain: {
      id: '30ed53e1-aed6-48a6-bfc8-7045876c7d86',
      name: 'ofcop',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.OPT,
    fullName: 'OPTin Token',
    decimalPlaces: 18,
    onchain: {
      id: 'c579afb1-f766-47c4-821f-3bc8c6cfc38c',
      name: 'opt',
      contractAddress: '0xde8893346ce8052a02606b62d13b142648e062dd',
    },
    offchain: {
      id: '24da1a34-2584-4ac7-a847-9d4391cdf67c',
      name: 'ofcopt',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ORAI,
    fullName: 'Orai Token',
    decimalPlaces: 18,
    onchain: {
      id: 'ae56f91a-f9af-4239-9cdc-f2432c572142',
      name: 'orai',
      contractAddress: '0x4c11249814f11b9346808179cf06e71ac328c1b5',
    },
    offchain: {
      id: '6ce29837-96cf-466a-acd8-9be929de3e56',
      name: 'ofcorai',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ORBS,
    fullName: 'Orbs Token',
    decimalPlaces: 18,
    onchain: {
      id: '0f800b4e-5eec-4dfe-9404-cbf3e6b8b9ca',
      name: 'orbs',
      contractAddress: '0xff56cc6b1e6ded347aa0b7676c85ab0b3d08b0fa',
    },
    offchain: {
      id: 'dec81c2a-f38c-43f9-9a3d-bbdaceaeafe6',
      name: 'ofcorbs',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.OSETH,
    fullName: 'Staked ETH',
    decimalPlaces: 18,
    onchain: {
      id: 'b7741f82-08e8-449d-9d91-924176f1cade',
      name: 'oseth',
      contractAddress: '0xf1c9acdc66974dfb6decb12aa385b9cd01190e38',
      features: AccountCoin.DEFAULT_FEATURES_EXCLUDE_SINGAPORE as CoinFeature[],
    },
    offchain: {
      id: '9e2b6d1f-d58f-4dd7-aa44-1606b1cb50ca',
      name: 'ofcoseth',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.OUSG,
    fullName: 'Ondo Short-Term U.S. Government Bond Fund',
    decimalPlaces: 18,
    onchain: {
      id: '3cdd832f-6776-4694-b8a0-90ba4fc50c89',
      name: 'ousg',
      contractAddress: '0x1b19c19393e2d034d8ff31ff34c81252fcbbee92',
      features: AccountCoin.DEFAULT_FEATURES_EXCLUDE_SINGAPORE as CoinFeature[],
    },
    offchain: {
      id: '49988981-5543-4614-9c17-6b2da51f4d69',
      name: 'ofcousg',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.OWN,
    fullName: 'OwnFund DAO',
    decimalPlaces: 18,
    onchain: {
      id: 'ddeee3d2-e34e-4bac-9587-77e4295c6fde',
      name: 'own',
      contractAddress: '0x3230eddcac29248ec4e0c37975937fe591532675',
    },
    offchain: {
      id: '8ddb3c5a-55ef-4b6f-aae2-6c0242625acb',
      name: 'ofcown',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.OXT,
    fullName: 'Orchid',
    decimalPlaces: 18,
    onchain: {
      id: '6d8d74dc-087c-499f-b7a8-c04645bef6f8',
      name: 'oxt',
      contractAddress: '0x4575f41308ec1483f3d399aa9a2826d74da13deb',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: '609fdb17-c9ee-4867-878f-d97d5acda748',
      name: 'ofcoxt',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.OXY,
    fullName: 'Oxygen Prime Brokerage',
    decimalPlaces: 6,
    onchain: {
      id: '4210fe52-b2bf-4a86-9b87-61b8679edec7',
      name: 'oxy',
      contractAddress: '0x965697b4ef02f0de01384d0d4f9f782b1670c163',
    },
    offchain: {
      id: '8fadf255-1e5b-4c3d-b08d-4708f53107e9',
      name: 'ofcoxy',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.OHM,
    fullName: 'Olympus',
    decimalPlaces: 9,
    onchain: {
      id: '03335e88-8205-4d5a-83ec-3c34df3461e6',
      name: 'ohm',
      contractAddress: '0x64aa3364f17a4d01c6f1751fd97c2bd3d7e7f1d5',
    },
    offchain: {
      id: 'e0519042-d5cb-4bc7-bd7b-e649c17d6149',
      name: 'ofcohm',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.SD,
    fullName: 'Stader',
    decimalPlaces: 18,
    onchain: {
      id: '643c3145-e650-4dec-981c-faf5e9a3a8fc',
      name: 'sd',
      contractAddress: '0x30d20208d987713f46dfd34ef128bb16c404d10f',
    },
    offchain: {
      id: 'afd3104a-e182-4800-909d-5cc44df1db7e',
      name: 'ofcsd',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.SOHM,
    fullName: 'Staked OHM',
    decimalPlaces: 9,
    onchain: {
      id: 'b238e88c-0c25-445f-8027-ca2e283553fb',
      name: 'sohm',
      contractAddress: '0x04906695d6d12cf5459975d7c3c03356e4ccd460',
      features: ACCOUNT_COIN_DEFAULT_FEATURES_EXCLUDE_SINGAPORE as CoinFeature[],
    },
    offchain: {
      id: 'c3d0c8e3-2cb7-4b93-9b17-5d0f301932dc',
      name: 'ofcsohm',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.GOHM,
    fullName: 'Governance OHM',
    decimalPlaces: 18,
    onchain: {
      id: '53d7708f-5fdf-4ca0-9f5c-caf2c23c9348',
      name: 'gohm',
      contractAddress: '0x0ab87046fbb341d058f17cbc4c1133f25a20a52f',
    },
    offchain: {
      id: '962e225a-5f64-4a18-8700-d1f7f567c304',
      name: 'ofcgohm',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.PACT,
    fullName: 'PACT community token',
    decimalPlaces: 18,
    onchain: {
      id: 'c798900d-9f86-42ef-8329-63e68bdd4c63',
      name: 'pact',
      contractAddress: '0x66e7ce35578a37209d01f99f3d2ff271f981f581',
    },
    offchain: {
      id: '97cea203-5c86-4db8-960c-bbc7a50d1fdf',
      name: 'ofcpact',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.PAR,
    fullName: 'PAR Stable Coin',
    decimalPlaces: 18,
    onchain: {
      id: 'dfc25625-418c-4958-89d6-aa8a96437f0c',
      name: 'par',
      contractAddress: '0x68037790a0229e9ce6eaa8a99ea92964106c4703',
    },
    offchain: {
      id: '9b615c0a-09d8-428c-b5ac-6e9fe5d7344e',
      name: 'ofcpar',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.PASS,
    fullName: 'Blockpass',
    decimalPlaces: 6,
    onchain: {
      id: 'bb7bf4ad-9fa6-4ab2-8299-af5a240e3c13',
      name: 'pass',
      contractAddress: '0xee4458e052b533b1aabd493b5f8c4d85d7b263dc',
    },
    offchain: {
      id: '3d454310-c962-4bac-9413-3c6c97fab4ba',
      name: 'ofcpass',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.PAU,
    fullName: 'PegGold Token',
    decimalPlaces: 8,
    onchain: {
      id: '150d79e8-b766-402d-9233-14a874196a27',
      name: 'pau',
      contractAddress: '0x57accaad359ed96a0b4d027079b6f5351b043912',
    },
    offchain: {
      id: '9ead6ee7-0cbc-4d7f-a680-9d61815444f9',
      name: 'ofcpau',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.PAX,
    fullName: 'Paxos',
    decimalPlaces: 18,
    onchain: {
      id: 'bdc9c0d4-307f-401b-b230-3307b13576d0',
      name: 'pax',
      contractAddress: '0x8e870d67f660d95d5be530380d0ec0bd388289e1',
    },
    offchain: {
      id: '55033e2e-d863-4c87-a384-298b3637ad3a',
      name: 'ofcpax',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.PAXG,
    fullName: 'Paxos Gold',
    decimalPlaces: 18,
    onchain: {
      id: '7a63e959-89df-493e-a796-d2f0583e2610',
      name: 'paxg',
      contractAddress: '0x45804880de22913dafe09f4980848ece6ecbaf78',
    },
    offchain: {
      id: 'c2f78c20-8835-480a-aa0e-3244e2114f6c',
      name: 'ofcpaxg',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.PAY,
    fullName: 'TenX',
    decimalPlaces: 18,
    onchain: {
      id: 'faa923d8-f98d-4b1f-9578-251a8c936382',
      name: 'pay',
      contractAddress: '0xb97048628db6b661d4c2aa833e95dbe1a905b280',
    },
    offchain: {
      id: '0d876c7a-f5df-4cc1-b8f7-23c3e497de92',
      name: 'ofcpay',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.PBCH,
    fullName: 'PegBitcoin Cash Token',
    decimalPlaces: 8,
    onchain: {
      id: '3e07802e-6b94-4768-8694-874b27e839e9',
      name: 'pbch',
      contractAddress: '0xb38bb9f5b9a73a3097d3a7cadd330aa6e6da8586',
    },
    offchain: {
      id: '35047e27-3bcf-4d55-9ec1-08f8180d795a',
      name: 'ofcpbch',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.PDATA,
    fullName: 'Opiria Token',
    decimalPlaces: 18,
    onchain: {
      id: '950c8d70-2ec2-49ac-b995-812a8a25d859',
      name: 'pdata',
      contractAddress: '0x0db03b6cde0b2d427c64a04feafd825938368f1f',
    },
    offchain: {
      id: '0a91df22-b1c6-4509-87af-d6c2a33ea467',
      name: 'ofcpdata',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.PDI,
    fullName: 'Phuture DeFi Index',
    decimalPlaces: 18,
    onchain: {
      id: '19a1a196-e29d-4efb-a818-2cf283af6346',
      name: 'pdi',
      contractAddress: '0x632806bf5c8f062932dd121244c9fbe7becb8b48',
      features: AccountCoin.getFeaturesByTypeExcluding(
        [
          CoinFeature.CUSTODY_BITGO_SINGAPORE,
          CoinFeature.CUSTODY_BITGO_GERMANY,
          CoinFeature.CUSTODY_BITGO_EUROPE_APS,
          CoinFeature.CUSTODY_BITGO_FRANKFURT,
        ],
        ETH_FEATURES
      ) as CoinFeature[],
    },
    offchain: {
      id: 'd042eb01-57c6-4466-8db4-72b4a69372cc',
      name: 'ofcpdi',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.PEAQ,
    fullName: 'peaq',
    decimalPlaces: 18,
    onchain: {
      id: 'ac3efe78-4921-44e9-8766-454ce2d3b522',
      name: 'peaq',
      contractAddress: '0x1eef208926667594e5136e89d0e9dd6907959197',
    },
    offchain: {
      id: '8c25dc2a-e8ee-4f7a-ab71-1f2dfc4d139a',
      name: 'ofcpeaq',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.PBTC,
    fullName: 'PegBitcoin Token',
    decimalPlaces: 8,
    onchain: {
      id: '0075d312-9842-49fb-bf4f-1023fcbf870b',
      name: 'pbtc',
      contractAddress: '0x6a7041ff8cb4da0253a00bb1e548caf77c238bda',
    },
    offchain: {
      id: '46431192-35c9-4740-a9f1-cb5611aff4a1',
      name: 'ofcpbtc',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.PDA,
    fullName: 'PlayDapp',
    decimalPlaces: 18,
    onchain: {
      id: '2b800928-2341-4481-8634-629b24d9c5e4',
      name: 'pda',
      contractAddress: '0x0d3cbed3f69ee050668adf3d9ea57241cba33a2b',
    },
    offchain: {
      id: '7ff378b8-748c-4202-a2f7-80445603de05',
      name: 'ofcpda',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.PEG,
    fullName: 'PegNet',
    decimalPlaces: 8,
    onchain: {
      id: '184a5102-2bee-4ad3-bb19-091bf6291243',
      name: 'peg',
      contractAddress: '0x996b396b88cc4a1d8df3dbd1c088cdfaee17e6d4',
    },
    offchain: {
      id: '80077ec2-76e0-48d7-b675-6b9b0d8a0a06',
      name: 'ofcpeg',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.PEOPLE,
    fullName: 'ConstitutionDAO',
    decimalPlaces: 18,
    onchain: {
      id: '236df665-09fd-4db3-9551-be8466eb635e',
      name: 'people',
      contractAddress: '0x7a58c0be72be218b41c608b7fe7c5bb630736c71',
    },
    offchain: {
      id: 'c8588e7e-0fde-4b23-be33-991d835cd728',
      name: 'ofcpeople',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.PEPE,
    fullName: 'Pepe',
    decimalPlaces: 18,
    onchain: {
      id: 'ad5a80bb-d3b0-4c8a-9b5f-dd2cab1c9999',
      name: 'pepe',
      contractAddress: '0x6982508145454ce325ddbe47a25d4ec3d2311933',
      features: ETH_FEATURES_WITH_FRANKFURT_GERMANY as CoinFeature[],
    },
    offchain: {
      id: '9af2377d-40a4-4fd7-9253-f659286d0636',
      name: 'ofcpepe',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.PERL,
    fullName: 'Perlin',
    decimalPlaces: 18,
    onchain: {
      id: '90edae14-9c2c-4245-bb90-a9062d08ef95',
      name: 'perl',
      contractAddress: '0xeca82185adce47f39c684352b0439f030f860318',
    },
    offchain: {
      id: '23eb28e6-9fa2-418f-a738-97efd2f223df',
      name: 'ofcperl',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.PERP,
    fullName: 'Perpetual Protocol',
    decimalPlaces: 18,
    onchain: {
      id: '8f767b43-c363-470a-b74b-695bb5ef629c',
      name: 'perp',
      contractAddress: '0xbc396689893d065f41bc2c6ecbee5e0085233447',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: 'd352ad2c-11a5-4816-9b88-af8ee1e4a8e7',
      name: 'ofcperp',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.PETH,
    fullName: 'PegEthereum Token',
    decimalPlaces: 8,
    onchain: {
      id: '08fefd29-ccfe-40f9-9e7a-ce410e4e4b97',
      name: 'peth',
      contractAddress: '0x6065616a4bad5ce723a5608dcb85d3dbd20b55dd',
    },
    offchain: {
      id: '78cee9d1-4a39-4182-9c4c-4ae06a259d62',
      name: 'ofcpeth',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.PHNX,
    fullName: 'Pheonix Dao',
    decimalPlaces: 18,
    onchain: {
      id: 'e631ef18-d575-4f34-83f9-b046d0df7fa2',
      name: 'phnx',
      contractAddress: '0x38a2fdc11f526ddd5a607c1f251c065f40fbf2f7',
    },
    offchain: {
      id: '7f425eae-d6ae-4d1c-8034-970b4962fbc9',
      name: 'ofcphnx',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.PIE,
    fullName: 'DeFiPie',
    decimalPlaces: 18,
    onchain: {
      id: 'efa39ce4-5948-4556-8f5e-3a1c86733346',
      name: 'pie',
      contractAddress: '0x607c794cda77efb21f8848b7910ecf27451ae842',
    },
    offchain: {
      id: '27314860-35b3-4c7b-b3e6-2acc0027523a',
      name: 'ofcpie',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.PLC,
    fullName: 'PlusCoin',
    decimalPlaces: 18,
    onchain: {
      id: '0a253872-c9a8-468d-91e1-943de9240f44',
      name: 'plc',
      contractAddress: '0xdf99c7f9e0eadd71057a801055da810985df38bd',
      features: AccountCoin.getFeaturesByTypeExcluding(
        [CoinFeature.CUSTODY_BITGO_GERMANY, CoinFeature.CUSTODY_BITGO_EUROPE_APS, CoinFeature.CUSTODY_BITGO_FRANKFURT],
        ETH_FEATURES
      ) as CoinFeature[],
    },
    offchain: {
      id: 'b341b3cb-e10d-431c-ad19-f85d7f2a857e',
      name: 'ofcplc',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.PFCT,
    fullName: 'PegFactom Token',
    decimalPlaces: 8,
    onchain: {
      id: 'c4a25ad2-fe09-4faa-b724-3b274f670db4',
      name: 'pfct',
      contractAddress: '0x069480de51cfc3a8fdc7d2338925089a3f842740',
    },
    offchain: {
      id: 'bc93bc9e-38b5-4f4c-a72d-39e529819084',
      name: 'ofcpfct',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.PLANET,
    fullName: 'Planet',
    decimalPlaces: 18,
    onchain: {
      id: '46241d3b-a37e-428e-9d24-318c97a6df42',
      name: 'planet',
      contractAddress: '0x307d45afbb7e84f82ef3d251a6bb0f00edf632e4',
    },
    offchain: {
      id: '36af444a-7829-4d78-8b34-7197ce4a34b9',
      name: 'ofcplanet',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.PLNX,
    fullName: 'eToro Polish Zloty',
    decimalPlaces: 18,
    onchain: {
      id: '1822435f-dcaf-4a85-93d6-d2132d141384',
      name: 'plnx',
      contractAddress: '0xaace6480798b4a7b596ec4ce3a26b8de9b9ae2e2',
    },
    offchain: {
      id: 'a90f18e2-9fcd-4468-b799-650f53050208',
      name: 'ofcplnx',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.PLX,
    fullName: 'PLN Stable Token',
    decimalPlaces: 18,
    onchain: {
      id: 'b3921b2b-6185-4346-b1a5-5f9a3cf632ed',
      name: 'plx',
      contractAddress: '0x8d682bc7ad206e54055c609ea1d4717caab665d0',
    },
    offchain: {
      id: '25d8358b-b25b-4f33-86fa-9b693983c1fa',
      name: 'ofcplx',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.PMA,
    fullName: 'PumaPay',
    decimalPlaces: 18,
    onchain: {
      id: '6412ae66-acc5-4794-b7ab-9972902daf59',
      name: 'pma',
      contractAddress: '0x846c66cf71c43f80403b51fe3906b3599d63336f',
      features: [
        ...ACCOUNT_COIN_DEFAULT_FEATURES_EXCLUDE_SINGAPORE_AND_MENA_FZE,
        CoinFeature.BULK_TRANSACTION,
      ] as CoinFeature[],
    },
    offchain: {
      id: '22149508-6114-422e-9c6f-735f57779a80',
      name: 'ofcpma',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.PNT,
    fullName: 'pNetwork',
    decimalPlaces: 18,
    onchain: {
      id: '03181686-ae56-45b6-86fb-9cf1969ff855',
      name: 'pnt',
      contractAddress: '0x89ab32156e46f46d02ade3fecbe5fc4243b9aaed',
    },
    offchain: {
      id: '4083d1de-5dfb-4cfd-9f61-1b2443da5db9',
      name: 'ofcpnt',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.POL,
    fullName: 'Polygon Ecosystem Token',
    decimalPlaces: 18,
    onchain: {
      id: 'a10eb871-eecd-4c63-ae23-ee1cd1098b62',
      name: 'pol',
      contractAddress: '0x455e53cbb86018ac2b8092fdcd39d8444affc3f6',
      features: POL_FEATURES as CoinFeature[],
    },
    offchain: {
      id: 'a6b6dd56-c25e-45a3-83e5-5da0f95d27d2',
      name: 'ofcpol',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.POLY,
    fullName: 'Polymath',
    decimalPlaces: 18,
    onchain: {
      id: 'c49d4a7f-17ff-424a-8c6b-18ed6b265af6',
      name: 'poly',
      contractAddress: '0x9992ec3cf6a55b00978cddf2b27bc6882d88d1ec',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: '8a427c2e-4c6a-4c9b-aa61-ecb7aebb6b7c',
      name: 'ofcpoly',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.POWR,
    fullName: 'Power Ledger',
    decimalPlaces: 6,
    onchain: {
      id: '4c6b7b60-9cd8-4d6d-9a6e-39db4b37be72',
      name: 'powr',
      contractAddress: '0x595832f8fc6bf59c85c527fec3740a1b7a361269',
    },
    offchain: {
      id: '4acfd8f7-d1c0-4c49-bf80-1dd8865b8015',
      name: 'ofcpowr',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.PPT,
    fullName: 'Populous Platform',
    decimalPlaces: 8,
    onchain: {
      id: '1219b29a-3296-4434-98cf-df276078ec56',
      name: 'ppt',
      contractAddress: '0xd4fa1460f537bb9085d22c7bccb5dd450ef28e3a',
    },
    offchain: {
      id: 'fa7b5df5-d559-4a1d-bdf6-6470a746cd51',
      name: 'ofcppt',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.PRDX,
    fullName: 'PRDX Token',
    decimalPlaces: 9,
    onchain: {
      id: 'bedc167f-6a10-47f5-9984-6b982379d4a5',
      name: 'prdx',
      contractAddress: '0xe17900f23b7ebb2791f25f1eaa63d8f5e603e9a5',
    },
    offchain: {
      id: 'f37ecda3-82e0-44ac-9e91-1d2085fe3ef3',
      name: 'ofcprdx',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.PRINTS,
    fullName: 'FingerprintsDAO',
    decimalPlaces: 18,
    onchain: {
      id: '65f79f42-54af-4fb1-852c-2cfd39d7425d',
      name: 'prints',
      contractAddress: '0x4dd28568d05f09b02220b09c2cb307bfd837cb95',
    },
    offchain: {
      id: 'a2aa3e45-ed23-4c96-9df9-dd76263eb2a6',
      name: 'ofcprints',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.PRO,
    fullName: 'Propy',
    decimalPlaces: 18,
    onchain: {
      id: '1a034210-2c75-4f16-9d33-65ccc3a9495b',
      name: 'pro',
      contractAddress: '0x9041fe5b3fdea0f5e4afdc17e75180738d877a01',
    },
    offchain: {
      id: '5f936db2-6014-4afa-b997-4e7c6b34e814',
      name: 'ofcpro',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.PROM,
    fullName: 'Token Prometeus Network',
    decimalPlaces: 18,
    onchain: {
      id: '05a23af9-6889-4c47-87d2-0704289415b8',
      name: 'prom',
      contractAddress: '0xfc82bb4ba86045af6f327323a46e80412b91b27d',
    },
    offchain: {
      id: 'cc6270f3-5464-4dc0-a2c9-d1a3fa190785',
      name: 'ofcprom',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.PRTS,
    fullName: 'Protos',
    decimalPlaces: 0,
    onchain: {
      id: '37a0307e-9806-4702-a32c-aa4505d830e0',
      name: 'prts',
      contractAddress: '0x835a44027ee4e92bbd8874e5ede9e5148b069e96',
      features: AccountCoin.getFeaturesByTypeExcluding(
        [
          CoinFeature.CUSTODY_BITGO_SINGAPORE,
          CoinFeature.CUSTODY_BITGO_GERMANY,
          CoinFeature.CUSTODY_BITGO_EUROPE_APS,
          CoinFeature.CUSTODY_BITGO_FRANKFURT,
        ],
        ETH_FEATURES
      ) as CoinFeature[],
    },
    offchain: {
      id: 'ab6b7ad5-37e2-4dab-8fd4-12f98f63c65a',
      name: 'ofcprts',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.PSTAKE,
    fullName: 'PSTAKE Finance',
    decimalPlaces: 18,
    onchain: {
      id: '5152d598-1f7a-4de1-90a1-0e14e07eed9e',
      name: 'pstake',
      contractAddress: '0xfb5c6815ca3ac72ce9f5006869ae67f18bf77006',
      features: AccountCoin.DEFAULT_FEATURES_EXCLUDE_SINGAPORE as CoinFeature[],
    },
    offchain: {
      id: '3fda894f-b9fe-4a32-be0c-a06c122c488f',
      name: 'ofcpstake',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.NPXS,
    fullName: 'Pundi X',
    decimalPlaces: 18,
    onchain: {
      id: '32123c42-32b7-4d26-a662-ae0d2270eecb',
      name: 'npxs',
      contractAddress: '0xa15c7ebe1f07caf6bff097d8a589fb8ac49ae5b3',
    },
    offchain: {
      id: 'c6774213-1a40-44f6-81d0-053ffad5e9c5',
      name: 'ofcnpxs',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.NS2DRP,
    fullName: 'New Silver Series 2 DROP',
    decimalPlaces: 18,
    onchain: {
      id: 'e186a704-8c5f-47ee-bb83-518ba2a44fdb',
      name: 'ns2drp',
      contractAddress: '0xe4c72b4de5b0f9accea880ad0b1f944f85a9daa0',
      features: AccountCoin.DEFAULT_FEATURES_EXCLUDE_SINGAPORE as CoinFeature[],
    },
    offchain: {
      id: '90f6631d-953a-4618-ba93-7c4374ee16ad',
      name: 'ofcns2drp',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.PUNDIX,
    fullName: 'Pundi X2',
    decimalPlaces: 18,
    onchain: {
      id: 'c0468531-8a6b-49b8-acc2-771d9860096e',
      name: 'pundix',
      contractAddress: '0x0fd10b9899882a6f2fcb5c371e17e70fdee00c38',
    },
    offchain: {
      id: '65055519-d950-466a-b713-f88d9b1bde7c',
      name: 'ofcpundix',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.PUSD,
    fullName: 'PegUSD Token',
    decimalPlaces: 8,
    onchain: {
      id: '4a076eb8-ce43-4573-b774-b15bd61858c2',
      name: 'pusd',
      contractAddress: '0x93d3296cac208422bf587c3597d116e809870f2b',
      features: [...ACCOUNT_COIN_DEFAULT_FEATURES, CoinFeature.STABLECOIN] as CoinFeature[],
    },
    offchain: {
      id: 'a48c13d4-387f-48f9-8ac6-add674f2dc60',
      name: 'ofcpusd',
      features: [CoinFeature.STABLECOIN] as CoinFeature[],
    },
  },
  {
    underlyingAsset: UnderlyingAsset.PUSH,
    fullName: 'Push Protocol',
    decimalPlaces: 18,
    onchain: {
      id: 'dfe5dacc-73b2-482d-a402-9aec770e4808',
      name: 'push',
      contractAddress: '0xf418588522d5dd018b425e472991e52ebbeeeeee',
    },
    offchain: {
      id: '3ed1f00c-be87-45f4-b393-4a423422361f',
      name: 'ofcpush',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.PV01,
    fullName: 'PV01',
    decimalPlaces: 18,
    onchain: {
      id: 'ebdc8de1-7b95-40d6-b16e-87298258b6de',
      name: 'pv01',
      contractAddress: '0x24969d2306d91144496636c1775e45bec39c55b8',
    },
    offchain: {
      id: '188194de-9728-4e29-997f-00dba0c224b4',
      name: 'ofcpv01',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.PXP,
    fullName: 'PointPay Crypto Banking Token V2',
    decimalPlaces: 18,
    onchain: {
      id: '33d9d059-10ba-4368-8d90-f86343b32dba',
      name: 'pxp',
      contractAddress: '0x95aa5d2dbd3c16ee3fdea82d5c6ec3e38ce3314f',
    },
    offchain: {
      id: 'dd9820ec-b26e-4f04-abf3-ae620e579185',
      name: 'ofcpxp',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.PYR,
    fullName: 'Pyr Token',
    decimalPlaces: 18,
    onchain: {
      id: '232c0ced-ef1c-4c04-a8ab-589635453ad9',
      name: 'pyr',
      contractAddress: '0x9534ad65fb398e27ac8f4251dae1780b989d136e',
    },
    offchain: {
      id: 'e3614075-c617-4202-8558-5584ca41d931',
      name: 'ofcpyr',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.PYUSD,
    fullName: 'PayPal USD',
    decimalPlaces: 6,
    onchain: {
      id: '8974a6e4-a143-4b8d-98e5-be0e63707092',
      name: 'pyusd',
      contractAddress: '0x6c3ea9036406852006290770bedfcaba0e23a0e8',
      features: [...ETH_FEATURES_WITH_FRANKFURT, CoinFeature.STABLECOIN] as CoinFeature[],
    },
    offchain: {
      id: '2092c0cc-19cf-42b2-90a0-123b1904d901',
      name: 'ofcpyusd',
      features: [CoinFeature.STABLECOIN] as CoinFeature[],
    },
  },
  {
    underlyingAsset: UnderlyingAsset.QASH,
    fullName: 'QASH',
    decimalPlaces: 6,
    onchain: {
      id: '62a385af-296f-44e7-b4f0-7a25a1e990dc',
      name: 'qash',
      contractAddress: '0x618e75ac90b12c6049ba3b27f5d5f8651b0037f6',
    },
    offchain: {
      id: '0b2c5575-d93a-46e8-bfdc-fd6ca2d247b5',
      name: 'ofcqash',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.QCAD,
    fullName: 'QCAD',
    decimalPlaces: 2,
    onchain: {
      id: 'fa153439-1189-40f5-b36a-f22750038259',
      name: 'qcad',
      contractAddress: '0x4a16baf414b8e637ed12019fad5dd705735db2e0',
    },
    offchain: {
      id: '69fd8354-0c30-4ca1-b78f-ee16cf9f3fa3',
      name: 'ofcqcad',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.QUICK,
    fullName: 'QuickSwap',
    decimalPlaces: 18,
    onchain: {
      id: 'f51860fe-7b94-4542-966a-a72749fc39f2',
      name: 'quick',
      contractAddress: '0x6c28aef8977c9b773996d0e8376d2ee379446f2f',
    },
    offchain: {
      id: '8a43e704-02af-4735-b381-6a2ddd86767d',
      name: 'ofcquick',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.QDT,
    fullName: 'Quadrans Token',
    decimalPlaces: 18,
    onchain: {
      id: 'e8d4c538-6926-4e83-9c70-2464d9cac3fc',
      name: 'qdt',
      contractAddress: '0x9adc7710e9d1b29d8a78c04d52d32532297c2ef3',
    },
    offchain: {
      id: '0824c7eb-b650-4388-b620-9f3911bc144d',
      name: 'ofcqdt',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.QNT,
    fullName: 'Quant',
    decimalPlaces: 18,
    onchain: {
      id: '17e47c3d-55f4-47f5-9068-cb3741d6050a',
      name: 'qnt',
      contractAddress: '0x4a220e6096b25eadb88358cb44068a3248254675',
      features: ETH_FEATURES_WITH_FRANKFURT_GERMANY as CoinFeature[],
    },
    offchain: {
      id: 'd43b01f7-3f87-4e75-b587-e3162c087b16',
      name: 'ofcqnt',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.QRDO,
    fullName: 'Qredo',
    decimalPlaces: 8,
    onchain: {
      id: 'c3961c7d-6788-45d0-9630-f413ce6e0889',
      name: 'qrdo',
      contractAddress: '0x4123a133ae3c521fd134d7b13a2dec35b56c2463',
    },
    offchain: {
      id: '12c299e5-6e70-4ff5-813d-36e5ab205a99',
      name: 'ofcqrdo',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.QRL,
    fullName: 'Qrl',
    decimalPlaces: 8,
    onchain: {
      id: 'f861ff17-177a-4b39-bc80-340dd3220f20',
      name: 'qrl',
      contractAddress: '0x697beac28b09e122c4332d163985e8a73121b97f',
    },
    offchain: {
      id: 'fb8cfff7-d9fc-4c8a-a92c-4773608d2846',
      name: 'ofcqrl',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.QSP,
    fullName: 'Quantstamp',
    decimalPlaces: 18,
    onchain: {
      id: 'f197eac2-17f1-400e-a771-b9930a46c3b6',
      name: 'qsp',
      contractAddress: '0x99ea4db9ee77acd40b119bd1dc4e33e1c070b80d',
    },
    offchain: {
      id: '62e70343-9c49-4997-adb4-772bfcbf2c52',
      name: 'ofcqsp',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.QKC,
    fullName: 'QuarkChain Token',
    decimalPlaces: 18,
    onchain: {
      id: 'b1ce5eb3-9790-4d77-aaa2-70f6d06beaa7',
      name: 'qkc',
      contractAddress: '0xea26c4ac16d4a5a106820bc8aee85fd0b7b2b664',
    },
    offchain: {
      id: '2b8c197e-b7ce-4069-8ab2-d75d1ba770ae',
      name: 'ofcqkc',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.QLINDO,
    fullName: 'Qlindo Realestate Investment Token',
    decimalPlaces: 0,
    onchain: {
      id: 'b184f862-4334-4027-b7cd-a0debe84eeb8',
      name: 'qlindo',
      contractAddress: '0xc18c07a18198a6340cf4d94855fe5eb6dd33b46e',
      features: AccountCoin.DEFAULT_FEATURES_EXCLUDE_SINGAPORE as CoinFeature[],
    },
    offchain: {
      id: '0915fd18-3203-423e-821b-7686d423f1fd',
      name: 'ofcqlindo',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.QVT,
    fullName: 'Qvolta',
    decimalPlaces: 18,
    onchain: {
      id: 'ced49948-7b64-4696-a1c0-2eca3a63392f',
      name: 'qvt',
      contractAddress: '0x1183f92a5624d68e85ffb9170f16bf0443b4c242',
    },
    offchain: {
      id: 'efcb83c0-cb2b-4c49-b95f-85849b96be11',
      name: 'ofcqvt',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.RAD,
    fullName: 'Radicle',
    decimalPlaces: 18,
    onchain: {
      id: '8d165186-6dbc-44db-b89b-ec12f6e52310',
      name: 'rad',
      contractAddress: '0x31c8eacbffdd875c74b94b077895bd78cf1e64a3',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: '5d068733-c632-40dd-965e-bbf1cd4f8500',
      name: 'ofcrad',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.RADAR,
    fullName: 'DappRadar',
    decimalPlaces: 18,
    onchain: {
      id: '5641e709-977d-486f-b000-842f43a2d82d',
      name: 'radar',
      contractAddress: '0x44709a920fccf795fbc57baa433cc3dd53c44dbe',
    },
    offchain: {
      id: '68a45e56-657e-423b-b1db-f808b9628ffe',
      name: 'ofcradar',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.RAIN,
    fullName: 'Rainmaker Games',
    decimalPlaces: 18,
    onchain: {
      id: '762c91d4-fd7c-4ee1-af55-a9440e1ce054',
      name: 'rain',
      contractAddress: '0x71fc1f555a39e0b698653ab0b475488ec3c34d57',
    },
    offchain: {
      id: '45477ce9-baf7-4d35-a2f3-ed88236b67c3',
      name: 'ofcrain',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.RCOIN,
    fullName: 'ArCoin',
    decimalPlaces: 8,
    onchain: {
      id: '6868686e-08e2-4afa-81be-907d663b3185',
      name: 'rcoin',
      contractAddress: '0x252739487c1fa66eaeae7ced41d6358ab2a6bca9',
    },
    offchain: {
      id: '2f504a2b-e14d-497b-8261-fea185e74d0b',
      name: 'ofcrcoin',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.RAMP,
    fullName: 'RAMP DEFI',
    decimalPlaces: 18,
    onchain: {
      id: '79f5fac7-8a4b-4469-abe0-343b7981220f',
      name: 'ramp',
      contractAddress: '0x33d0568941c0c64ff7e0fb4fba0b11bd37deed9f',
    },
    offchain: {
      id: 'bbd11732-6c74-479b-9aac-2c66a9a23f3c',
      name: 'ofcramp',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.RARE,
    fullName: 'SuperRare',
    decimalPlaces: 18,
    onchain: {
      id: '60ccf60e-bbf7-4bee-9695-9f49e4800009',
      name: 'rare',
      contractAddress: '0xba5bde662c17e2adff1075610382b9b691296350',
    },
    offchain: {
      id: 'a6696c8c-44b3-4a6f-bf6c-9ac1cb4ac8e1',
      name: 'ofcrare',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.RARI,
    fullName: 'Rarible',
    decimalPlaces: 18,
    onchain: {
      id: 'bb3a7234-e51f-4d3a-9125-9cc489e0cc96',
      name: 'rari',
      contractAddress: '0xfca59cd816ab1ead66534d82bc21e7515ce441cf',
    },
    offchain: {
      id: '32d333f8-363c-490e-8d4c-38ddf8ede123',
      name: 'ofcrari',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.RAY,
    fullName: 'Raydium',
    decimalPlaces: 6,
    onchain: {
      id: '34b4e099-9645-48e6-a2f4-128405c0dfe5',
      name: 'ray',
      contractAddress: '0x5245c0249e5eeb2a0838266800471fd32adb1089',
    },
    offchain: {
      id: 'fb602049-f477-43ea-b938-95c2484eda31',
      name: 'ofcray',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.RBX,
    fullName: 'RBX',
    decimalPlaces: 18,
    onchain: {
      id: 'd60c2f34-c96e-49e4-a319-676801d3956f',
      name: 'rbx',
      contractAddress: '0x8254e26e453eb5abd29b3c37ac9e8da32e5d3299',
    },
    offchain: {
      id: 'f5da5a80-2eb4-47d5-97a7-3fad6861d8b5',
      name: 'ofcrbx',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.RBY,
    fullName: 'Ruby X',
    decimalPlaces: 18,
    onchain: {
      id: '060238d2-f48f-41ac-b065-59a420244783',
      name: 'rby',
      contractAddress: '0xf7705dee19a63e0bc1a240f723c5c0f570c78572',
    },
    offchain: {
      id: '3515497c-afd6-45f8-98c6-efa5a29cf0c3',
      name: 'ofcrby',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.RDN,
    fullName: 'Raiden Network',
    decimalPlaces: 18,
    onchain: {
      id: 'b22a66b9-099e-4f3d-90ca-e78a3344dcf9',
      name: 'rdn',
      contractAddress: '0x255aa6df07540cb5d3d297f0d0d4d84cb52bc8e6',
    },
    offchain: {
      id: '20c1673f-8cac-43da-bd1c-51e0ada2a996',
      name: 'ofcrdn',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.RDNT,
    fullName: 'Radiant Capital',
    decimalPlaces: 18,
    onchain: {
      id: 'f215c41b-75af-4843-8b37-3f2aa602e0c6',
      name: 'rdnt',
      contractAddress: '0x137ddb47ee24eaa998a535ab00378d6bfa84f893',
    },
    offchain: {
      id: 'aaec773c-bd5b-4262-abd9-a7136c20fc59',
      name: 'ofcrdnt',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.REB,
    fullName: 'Regblo',
    decimalPlaces: 18,
    onchain: {
      id: 'f692c9be-ca7d-4e27-a554-2f0316789f0b',
      name: 'reb',
      contractAddress: '0x61383ac89988b498df5363050ff07fe5c52ecdda',
    },
    offchain: {
      id: '81091169-e882-485d-8d49-861691a15b9e',
      name: 'ofcreb',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.REBL,
    fullName: 'Rebellious',
    decimalPlaces: 18,
    onchain: {
      id: 'e403f557-0b1b-42ae-a626-229f6a1ddadf',
      name: 'rebl',
      contractAddress: '0x5f53f7a8075614b699baad0bc2c899f4bad8fbbf',
    },
    offchain: {
      id: '9dccbb13-c971-4e64-8319-42535fcc9de4',
      name: 'ofcrebl',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.REEF,
    fullName: 'REEF',
    decimalPlaces: 18,
    onchain: {
      id: '4b0648a4-ce1e-45e0-9d60-5004e9bbff02',
      name: 'reef',
      contractAddress: '0xfe3e6a25e6b192a42a44ecddcd13796471735acf',
    },
    offchain: {
      id: '1c3eec6c-c1be-4ca9-b044-6e4379be0287',
      name: 'ofcreef',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.REN,
    fullName: 'Republic',
    decimalPlaces: 18,
    onchain: {
      id: 'f381062e-b0f8-4170-80dc-ba3ffa4a1ec5',
      name: 'ren',
      contractAddress: '0x408e41876cccdc0f92210600ef50372656052a38',
    },
    offchain: {
      id: '84572a60-87ee-4a70-b0d6-cd5fd7616214',
      name: 'ofcren',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.REP,
    fullName: 'Augur',
    decimalPlaces: 18,
    onchain: {
      id: '51111b6c-71c9-484f-8104-418174aa7706',
      name: 'rep',
      contractAddress: '0x1985365e9f78359a9b6ad760e32412f4a445e862',
    },
    offchain: {
      id: '220aa19a-7b62-4132-aef2-475bbb83827d',
      name: 'ofcrep',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.REPV2,
    fullName: 'Augur V2 Token',
    decimalPlaces: 18,
    onchain: {
      id: 'c2c0da19-c473-43b7-9ecc-5d99a4efd3db',
      name: 'repv2',
      contractAddress: '0x221657776846890989a759ba2973e427dff5c9bb',
    },
    offchain: {
      id: 'eabd5fbb-b844-4991-9a71-29068a99b178',
      name: 'ofcrepv2',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['RETH-H'],
    fullName: 'Reward ETH Harbour',
    decimalPlaces: 18,
    onchain: {
      id: 'c726038b-db05-4a4a-adb6-9d28a129e3b5',
      name: 'reth-h',
      contractAddress: '0xcbe26dbc91b05c160050167107154780f36ceaab',
    },
    offchain: {
      id: '7654c1c4-bca5-4067-a004-661609e6b57a',
      name: 'ofcreth-h',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.REQ,
    fullName: 'Request',
    decimalPlaces: 18,
    onchain: {
      id: '93d78417-5ace-4945-8694-fbf578f752d7',
      name: 'req',
      contractAddress: '0x8f8221afbb33998d8584a2b05749ba73c37a938a',
    },
    offchain: {
      id: 'df7e1b01-b813-43ef-8ca4-e9d23652f976',
      name: 'ofcreq',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.RETH2,
    fullName: 'StakeWise Reward ETH2',
    decimalPlaces: 18,
    onchain: {
      id: '3bd6dff4-e073-4c61-a700-70fa4204b57f',
      name: 'reth2',
      contractAddress: '0x20bc832ca081b91433ff6c17f85701b6e92486c5',
    },
    offchain: {
      id: '3836aea4-2019-4b8e-b7fd-1da1571edac2',
      name: 'ofcreth2',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.RFR,
    fullName: 'Refereum',
    decimalPlaces: 4,
    onchain: {
      id: 'bff21512-bb1d-4d4a-b461-c6f7bb0bbf70',
      name: 'rfr',
      contractAddress: '0xd0929d411954c47438dc1d871dd6081f5c5e149c',
      features: [
        ...ACCOUNT_COIN_DEFAULT_FEATURES_EXCLUDE_SINGAPORE_AND_MENA_FZE,
        CoinFeature.BULK_TRANSACTION,
      ] as CoinFeature[],
    },
    offchain: {
      id: 'd258ccc1-37c3-4503-a4ab-d817573a6d18',
      name: 'ofcrfr',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.RFUEL,
    fullName: 'RioDeFi',
    decimalPlaces: 18,
    onchain: {
      id: 'ffa98750-a6c2-4310-9cb7-2bb301e8213e',
      name: 'rfuel',
      contractAddress: '0xaf9f549774ecedbd0966c52f250acc548d3f36e5',
    },
    offchain: {
      id: '2696285b-db75-4a6a-a38f-2170ea61125f',
      name: 'ofcrfuel',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.RGT,
    fullName: 'Rari Governance Token',
    decimalPlaces: 18,
    onchain: {
      id: 'c98d0ae1-fcca-42cb-8921-afe328f5e6f6',
      name: 'rgt',
      contractAddress: '0xd291e7a03283640fdc51b121ac401383a46cc623',
      features: AccountCoin.getFeaturesByTypeExcluding(
        [CoinFeature.CUSTODY_BITGO_MENA_FZE, CoinFeature.CUSTODY_BITGO_SINGAPORE],
        ETH_FEATURES_WITH_FRANKFURT
      ) as CoinFeature[],
    },
    offchain: {
      id: 'cd656612-ce29-4452-8c97-4e0995622b48',
      name: 'ofcrgt',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.RIF,
    fullName: 'RIF Token',
    decimalPlaces: 18,
    onchain: {
      id: '5ec84a31-9a02-4c57-9328-a8d09e9e5c61',
      name: 'rif',
      contractAddress: '0x2acc95758f8b5f583470ba265eb685a8f45fc9d5',
    },
    offchain: {
      id: '235f4026-d56a-4388-b0e8-643e06d5f25b',
      name: 'ofcrif',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.RINGX,
    fullName: 'Ringx Token',
    decimalPlaces: 18,
    onchain: {
      id: 'f93f9b54-8a50-4062-bf92-b26723ab0685',
      name: 'ringx',
      contractAddress: '0x7f86c782ec802ac402e0369d2e6d500256f7abc5',
    },
    offchain: {
      id: 'a808f5a1-fd21-40ef-8be0-ffd1c9c61015',
      name: 'ofcringx',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.RIO,
    fullName: 'Realio Network',
    decimalPlaces: 18,
    onchain: {
      id: '676dc40d-270b-40a9-b259-b68547bbb1b7',
      name: 'rio',
      contractAddress: '0xf21661d0d1d76d3ecb8e1b9f1c923dbfffae4097',
    },
    offchain: {
      id: '07268667-86cc-4ae6-a986-2c39523ad2b8',
      name: 'ofcrio',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.RLC,
    fullName: 'Iexec Rlc',
    decimalPlaces: 9,
    onchain: {
      id: 'f2908def-0fdb-4294-9ec7-ac783d9b9b4e',
      name: 'rlc',
      contractAddress: '0x607f4c5bb672230e8672085532f7e901544a7375',
    },
    offchain: {
      id: 'e6adc9cf-8125-4ff8-b34d-1a412060d88a',
      name: 'ofcrlc',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.RLUSD,
    fullName: 'Ripple USD',
    decimalPlaces: 18,
    onchain: {
      id: '38b0c82b-bded-432f-a447-26200f06c694',
      name: 'rlusd',
      contractAddress: '0x8292bb45bf1ee4d140127049757c2e0ff06317ed',
      features: [...ACCOUNT_COIN_DEFAULT_FEATURES, CoinFeature.STABLECOIN] as CoinFeature[],
    },
    offchain: {
      id: 'fd56e938-5f94-4b19-b2c5-f15a2af50595',
      name: 'ofcrlusd',
      features: [CoinFeature.STABLECOIN] as CoinFeature[],
    },
  },
  {
    underlyingAsset: UnderlyingAsset.RLY,
    fullName: 'Rally',
    decimalPlaces: 18,
    onchain: {
      id: '65e2f11f-77af-4c2e-9ecb-43962793adfc',
      name: 'rly',
      contractAddress: '0xf1f955016ecbcd7321c7266bccfb96c68ea5e49b',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: '845f503b-66ce-4f4e-b841-163578b26d41',
      name: 'ofcrly',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.RNDR,
    fullName: 'Render',
    decimalPlaces: 18,
    onchain: {
      id: '61c4e736-08a9-431c-82f5-d62447e0ed78',
      name: 'rndr',
      contractAddress: '0x6de037ef9ad2725eb40118bb1702ebb27e4aeb24',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: 'aee33f6d-ae42-4356-86a8-35d9b26633fa',
      name: 'ofcrndr',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ROOK,
    fullName: 'KeeperDAO',
    decimalPlaces: 18,
    onchain: {
      id: '18880028-ca07-4229-a39d-406812ef4380',
      name: 'rook',
      contractAddress: '0xfa5047c9c78b8877af97bdcb85db743fd7313d4a',
      features: [
        ...ACCOUNT_COIN_DEFAULT_FEATURES_EXCLUDE_SINGAPORE_AND_MENA_FZE,
        CoinFeature.BULK_TRANSACTION,
      ] as CoinFeature[],
    },
    offchain: {
      id: '8728409f-5e31-4fb1-a63e-e42a4fdd950a',
      name: 'ofcrook',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.RON,
    fullName: 'Ronin',
    decimalPlaces: 18,
    onchain: {
      id: 'a6fa8063-3065-4ce0-a02a-7973efe94a0a',
      name: 'ron',
      contractAddress: '0x23f043426b2336e723b32fb3bf4a1ca410f7c49a',
    },
    offchain: {
      id: '1929aa30-ca37-4510-8502-2b3eddda97d4',
      name: 'ofcron',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.RONC,
    fullName: 'RONCoin',
    decimalPlaces: 18,
    onchain: {
      id: '73cea436-4034-4c7e-a653-374dcb0f54ad',
      name: 'ronc',
      contractAddress: '0xf1b819fdb689f43afc161db789800ed799f18388',
    },
    offchain: {
      id: '31f7b2ab-a7bc-463f-ac87-930cf8f3e203',
      name: 'ofcronc',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ROOBEE,
    fullName: 'ROOBEE',
    decimalPlaces: 18,
    onchain: {
      id: 'bf618741-037c-4f44-9e2e-b8d18888cce7',
      name: 'roobee',
      contractAddress: '0xa31b1767e09f842ecfd4bc471fe44f830e3891aa',
    },
    offchain: {
      id: '8f5135de-5f0c-4a1c-8158-ccede1d39c30',
      name: 'ofcroobee',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.RPK,
    fullName: 'RepubliK',
    decimalPlaces: 18,
    onchain: {
      id: '740e1b33-3dbc-4a09-b5fe-12ae230e06f1',
      name: 'rpk',
      contractAddress: '0x313cae7ad4454aac7b208c1f089da2b0e5825e46',
    },
    offchain: {
      id: '42552693-c29a-4f4a-9a40-54b698cd77d4',
      name: 'ofcrpk',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.RPL,
    fullName: 'Rocket Pool',
    decimalPlaces: 18,
    onchain: {
      id: 'a72f89b9-7c43-4547-8d4e-9f6d10867347',
      name: 'rpl',
      contractAddress: '0xd33526068d116ce69f19a9ee46f0bd304f21a51f',
      features: AccountCoin.DEFAULT_FEATURES_EXCLUDE_SINGAPORE as CoinFeature[],
    },
    offchain: {
      id: 'c06fb78f-a2d8-43ef-b367-8ad18c63e0a2',
      name: 'ofcrpl',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.RSR,
    fullName: 'Reserve Rights',
    decimalPlaces: 18,
    onchain: {
      id: 'bbe17b1a-04e4-4ed8-a941-db52c61f502a',
      name: 'rsr',
      contractAddress: '0x320623b8e4ff03373931769a31fc52a4e78b5d70',
    },
    offchain: {
      id: 'c11bbf5d-49ca-4678-8909-2599b60f80be',
      name: 'ofcrsr',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.RSWETH,
    fullName: 'Restaked Swell Ethereum',
    decimalPlaces: 18,
    onchain: {
      id: 'd68ebc1e-9ae7-4586-a87d-2b9c16893eb5',
      name: 'rsweth',
      contractAddress: '0xfae103dc9cf190ed75350761e95403b7b8afa6c0',
      features: ACCOUNT_COIN_DEFAULT_FEATURES_EXCLUDE_SINGAPORE as CoinFeature[],
    },
    offchain: {
      id: '255d08aa-fdb7-461c-8e7f-57948d1d2aba',
      name: 'ofcrsweth',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.RUBX,
    fullName: 'eToro Russian Ruble',
    decimalPlaces: 18,
    onchain: {
      id: '2c06fb96-9436-4fde-b6e9-3a8aa7c775d9',
      name: 'rubx',
      contractAddress: '0xd6d69a3d5e51dbc2636dc332338765fcca71d5d5',
    },
    offchain: {
      id: '4811d25e-aa8b-40d0-a106-cd701b37e6b9',
      name: 'ofcrubx',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.RUEDATK,
    fullName: 'Ruedacoin',
    decimalPlaces: 6,
    onchain: {
      id: 'b1b1708d-1add-4e5b-8872-721774a5ff1b',
      name: 'ruedatk',
      contractAddress: '0xe2f43e8053444e764e658bab63d49f873a75ce63',
    },
    offchain: {
      id: 'd7f60f08-8e15-4487-af08-9b5ab94cb440',
      name: 'ofcruedatk',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.SAIL,
    fullName: 'SAIL Token',
    decimalPlaces: 18,
    onchain: {
      id: 'd904868d-b066-4e88-b4ff-964a3f08212a',
      name: 'sail',
      contractAddress: '0xd8f1460044925d2d5c723c7054cd9247027415b7',
    },
    offchain: {
      id: '11a90f39-42f4-4ec6-b396-8259c81c1c36',
      name: 'ofcsail',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.SALT,
    fullName: 'Salt',
    decimalPlaces: 8,
    onchain: {
      id: 'dfb1aa61-4f99-4778-949d-64246e5ccc9c',
      name: 'salt',
      contractAddress: '0x4156d3342d5c385a87d264f90653733592000581',
    },
    offchain: {
      id: 'bd4f37cb-e3d8-4768-a246-1d35d9b8d3d6',
      name: 'ofcsalt',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.SAND,
    fullName: 'Sand',
    decimalPlaces: 18,
    onchain: {
      id: '8b877568-da1d-4707-bd19-fe86a1636e61',
      name: 'sand',
      contractAddress: '0x3845badade8e6dff049820680d1f14bd3903a5d0',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: '40cee5b1-8930-4fb1-9390-5483e0732649',
      name: 'ofcsand',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.SETH2,
    fullName: 'StakeWise Staked ETH2',
    decimalPlaces: 18,
    onchain: {
      id: '2de0ecf5-f1ad-410f-900d-1843755e4b49',
      name: 'seth2',
      contractAddress: '0xfe2e637202056d30016725477c5da089ab0a043a',
    },
    offchain: {
      id: '9cb97296-3daa-48c0-946f-9d6c08eb40e7',
      name: 'ofcseth2',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.SASHIMI,
    fullName: 'SashimiToken',
    decimalPlaces: 18,
    onchain: {
      id: '33c752b5-d21a-4140-bfe8-1454a7662c8c',
      name: 'sashimi',
      contractAddress: '0xc28e27870558cf22add83540d2126da2e4b464c2',
      features: [
        ...ACCOUNT_COIN_DEFAULT_FEATURES_EXCLUDE_SINGAPORE_AND_MENA_FZE,
        CoinFeature.BULK_TRANSACTION,
      ] as CoinFeature[],
    },
    offchain: {
      id: 'e03ab8b2-d4ed-4480-ada5-215abd62d745',
      name: 'ofcsashimi',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.SBC,
    fullName: 'Sustainable Bitcoin Certificate',
    decimalPlaces: 8,
    onchain: {
      id: 'b01a005d-21b2-49af-b77c-fd513e38dd20',
      name: 'sbc',
      contractAddress: '0xae8eeb1f92f0f76d3f21d5887096999254f06ea5',
    },
    offchain: {
      id: 'c7ac234f-5fb7-4ee3-b1e9-5479ccaab28c',
      name: 'ofcsbc',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.SFI,
    fullName: 'Spice',
    decimalPlaces: 18,
    onchain: {
      id: '6327036e-357e-4d15-a01e-966215fc03d2',
      name: 'sfi',
      contractAddress: '0xb753428af26e81097e7fd17f40c88aaa3e04902c',
    },
    offchain: {
      id: '8abe87c4-6799-4233-811c-00fe8738c4c3',
      name: 'ofcsfi',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.SGA,
    fullName: 'Saga',
    decimalPlaces: 18,
    onchain: {
      id: '957ee557-c800-4846-bc18-a9d483a0d784',
      name: 'sga',
      contractAddress: '0xed0849bf46cfb9845a2d900a0a4e593f2dd3673c',
      features: [
        ...ACCOUNT_COIN_DEFAULT_FEATURES_EXCLUDE_SINGAPORE_AND_MENA_FZE,
        CoinFeature.BULK_TRANSACTION,
      ] as CoinFeature[],
    },
    offchain: {
      id: 'af62d674-4cfe-489a-be4c-58b42ea959e1',
      name: 'ofcsga',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.SGDX,
    fullName: 'eToro Singapore Dollar',
    decimalPlaces: 18,
    onchain: {
      id: '309608be-d029-4a87-bce8-c172d0bdfaac',
      name: 'sgdx',
      contractAddress: '0x0e3e965acffb719e2f5dd4309969e2debe6215dd',
    },
    offchain: {
      id: 'b67ce598-3473-4760-b04c-4020460eb65c',
      name: 'ofcsgdx',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.SGR,
    fullName: 'Sogur',
    decimalPlaces: 18,
    onchain: {
      id: '5ea3d2a3-e7e1-4088-9c77-d4cdea667d8a',
      name: 'sgr',
      contractAddress: '0xaea8e1b6cb5c05d1dac618551c76bcd578ea3524',
    },
    offchain: {
      id: 'c063c4e9-4e1b-49b4-8a9e-4e537aebb65d',
      name: 'ofcsgr',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.SGT,
    fullName: 'Suzu Governance Token',
    decimalPlaces: 8,
    onchain: {
      id: '518fe28c-87fc-4b9f-b07e-a2b8f63f4686',
      name: 'sgt',
      contractAddress: '0xf530b2eaf740cf72b8b90ca3bdbb9486b863b3ce',
    },
    offchain: {
      id: 'a035abb7-f6ff-437e-8d1b-5aae58c08efa',
      name: 'ofcsgt',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.SHK,
    fullName: 'iShook',
    decimalPlaces: 18,
    onchain: {
      id: '83bc85a6-aabb-4694-831a-e6ee548b0892',
      name: 'shk',
      contractAddress: '0xebe4a49df7885d015329c919bf43e6460a858f1e',
      features: [
        ...ACCOUNT_COIN_DEFAULT_FEATURES_EXCLUDE_SINGAPORE_AND_MENA_FZE,
        CoinFeature.BULK_TRANSACTION,
      ] as CoinFeature[],
    },
    offchain: {
      id: 'b07efb89-d404-4b0b-903f-eeeec4f939b3',
      name: 'ofcshk',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.SHOPX,
    fullName: 'Splyt Core Token',
    decimalPlaces: 18,
    onchain: {
      id: '22de4eea-4b58-4082-9651-4d8078474c45',
      name: 'shopx',
      contractAddress: '0x7bef710a5759d197ec0bf621c3df802c2d60d848',
    },
    offchain: {
      id: 'c2ad3467-54ff-4389-908f-02571801c005',
      name: 'ofcshopx',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.SHIB,
    fullName: 'Shiba Inu',
    decimalPlaces: 18,
    onchain: {
      id: '04a5354e-b982-4991-852a-07898b45aa0f',
      name: 'shib',
      contractAddress: '0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce',
      features: TOKEN_FEATURES_WITH_NY_GERMANY_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: '51a45c2d-5949-46b7-a87a-a67ec5afd98d',
      name: 'ofcshib',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.SHR,
    fullName: 'ShareToken',
    decimalPlaces: 2,
    onchain: {
      id: 'e25ca1cf-b0f4-42a0-9d7f-42b94a1e9738',
      name: 'shr',
      contractAddress: '0xd98f75b1a3261dab9eed4956c93f33749027a964',
    },
    offchain: {
      id: 'eb697fb6-f266-48b9-956c-c7cbad404b59',
      name: 'ofcshr',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.SIH,
    fullName: 'Sih',
    decimalPlaces: 18,
    onchain: {
      id: '44355fd3-9619-41bc-9776-c9ea39105ec0',
      name: 'sih',
      contractAddress: '0x6d728ff862bfe74be2aba30537e992a24f259a22',
    },
    offchain: {
      id: '51ea2cfb-4fd5-4450-8126-80df51079318',
      name: 'ofcsih',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.SILV,
    fullName: 'XBullion Silver',
    decimalPlaces: 8,
    onchain: {
      id: '6d225de0-2a88-4d4f-868f-99db49912496',
      name: 'silv',
      contractAddress: '0x628ab8b061fea2af1239b68efa5e46135d186666',
    },
    offchain: {
      id: 'c4b09ebc-8891-4cde-be18-f623b6c51f53',
      name: 'ofcsilv',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.SIPHER,
    fullName: 'Sipher Token',
    decimalPlaces: 18,
    onchain: {
      id: 'c934061a-014f-4e6d-bedf-b0d3a3366b98',
      name: 'sipher',
      contractAddress: '0x9f52c8ecbee10e00d9faaac5ee9ba0ff6550f511',
    },
    offchain: {
      id: '5d75dc0a-f398-473d-8e8d-fc9423fdb7fa',
      name: 'ofcsipher',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.SIS,
    fullName: 'Symbiosis',
    decimalPlaces: 18,
    onchain: {
      id: 'd73a9d1c-6aac-4fa1-b294-f3401ae3c9d0',
      name: 'sis',
      contractAddress: '0xd38bb40815d2b0c2d2c866e0c72c5728ffc76dd9',
    },
    offchain: {
      id: '146206c1-be45-4293-9fa1-f313bd4171dc',
      name: 'ofcsis',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.SKALE,
    fullName: 'SKALE Network',
    decimalPlaces: 18,
    onchain: {
      id: '9bcded00-b855-47f3-be0d-c7f4ca691781',
      name: 'skale',
      contractAddress: '0x00c83aecc790e8a4453e5dd3b0b4b3680501a7a7',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: 'a437b417-d955-4dc6-b15e-44dbb9da933f',
      name: 'ofcskale',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.SLAB,
    fullName: 'SLAB',
    decimalPlaces: 18,
    onchain: {
      id: 'bf1fb48c-be9e-48a9-8769-ccb034c1cffe',
      name: 'slab',
      contractAddress: '0x994466f822af45cf5db0a0f41b9af6d503bcf3d5',
    },
    offchain: {
      id: '6a309f51-32ec-4387-a23f-255000a1af20',
      name: 'ofcslab',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.SLOT,
    fullName: 'AlphaSlot',
    decimalPlaces: 18,
    onchain: {
      id: '74a93e1b-edf6-48f0-823e-0cf872b67d5a',
      name: 'slot',
      contractAddress: '0xaee7474c3713ece228aa5ec43c89c708f2ec7ed2',
    },
    offchain: {
      id: '13d80ad2-e777-41ad-b905-82f7e93ba236',
      name: 'ofcslot',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.SLP,
    fullName: 'Smooth Love Potion',
    decimalPlaces: 0,
    onchain: {
      id: '98d0403d-9d3e-4d63-bda9-b94c40f2b20a',
      name: 'slp',
      contractAddress: '0xcc8fa225d80b9c7d42f96e9570156c65d6caaa25',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: '4d4edcab-aeac-4c22-a003-b02744da1a35',
      name: 'ofcslp',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.SLVX,
    fullName: 'eToro Silver',
    decimalPlaces: 18,
    onchain: {
      id: '55631719-83ac-45af-bd7d-b69d7fef7092',
      name: 'slvx',
      contractAddress: '0x8e4d222dbd4f8f9e7c175e77d6e71715c3da78e0',
    },
    offchain: {
      id: '732478cd-119f-44b0-9378-7e9663715ca9',
      name: 'ofcslvx',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.SMT,
    fullName: 'Swarm Markets',
    decimalPlaces: 18,
    onchain: {
      id: '1289fae7-ca46-45fa-9edc-19455507b7e3',
      name: 'smt',
      contractAddress: '0xb17548c7b510427baac4e267bea62e800b247173',
      features: ETH_FEATURES_WITH_FRANKFURT_EXCLUDE_SINGAPORE as CoinFeature[],
    },
    offchain: {
      id: '07181ffb-884e-46a3-ad2b-ade72b67678b',
      name: 'ofcsmt',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.SNC,
    fullName: 'SunContract',
    decimalPlaces: 18,
    onchain: {
      id: 'd736cd6a-55d1-48a5-8cf5-6b920715cb7f',
      name: 'snc',
      contractAddress: '0xf4134146af2d511dd5ea8cdb1c4ac88c57d60404',
    },
    offchain: {
      id: '22c6e509-c91f-4513-8475-220ef29e306f',
      name: 'ofcsnc',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.SNOV,
    fullName: 'Snovio',
    decimalPlaces: 18,
    onchain: {
      id: 'adbeef83-4bdd-4d4c-b3bb-99977460c68e',
      name: 'snov',
      contractAddress: '0xbdc5bac39dbe132b1e030e898ae3830017d7d969',
    },
    offchain: {
      id: 'dc0282eb-5fd1-42db-90fc-04f4bbd4dbfc',
      name: 'ofcsnov',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.SNT,
    fullName: 'Status Network Token',
    decimalPlaces: 18,
    onchain: {
      id: '41f14a41-cafa-4f68-9536-f384304228e9',
      name: 'snt',
      contractAddress: '0x744d70fdbe2ba4cf95131626614a1763df805b9e',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: 'f2511305-0f5e-493d-93bc-f06962458b57',
      name: 'ofcsnt',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.SNX,
    fullName: 'Synthetix Network',
    decimalPlaces: 18,
    onchain: {
      id: '87d5b533-816e-4680-9695-a8509b352ee0',
      name: 'snx',
      contractAddress: '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: 'f3cfe483-3aab-4d9f-8990-08c2910c3f17',
      name: 'ofcsnx',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.SOC,
    fullName: 'SODACoin',
    decimalPlaces: 18,
    onchain: {
      id: '69a90dbc-b0cc-402d-b987-a98024bf7bbd',
      name: 'soc',
      contractAddress: '0xcad49c39b72c37b32cee8b14f33f316d3a8bc335',
      features: [
        ...ACCOUNT_COIN_DEFAULT_FEATURES_EXCLUDE_SINGAPORE_AND_MENA_FZE,
        CoinFeature.BULK_TRANSACTION,
      ] as CoinFeature[],
    },
    offchain: {
      id: '2937b6c0-9d19-4d7d-b228-3de3072aea2e',
      name: 'ofcsoc',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.SPELL,
    fullName: 'Spell Token',
    decimalPlaces: 18,
    onchain: {
      id: '38042770-b9de-497c-bce3-eb93394dca70',
      name: 'spell',
      contractAddress: '0x090185f2135308bad17527004364ebcc2d37e5f6',
    },
    offchain: {
      id: '41af8bf9-19a5-4975-9192-7e9f87718516',
      name: 'ofcspell',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.SPO,
    fullName: 'Sparrow Options',
    decimalPlaces: 18,
    onchain: {
      id: '4a7f8a3b-131f-4324-b3cc-7eba9e9918f4',
      name: 'spo',
      contractAddress: '0x89eafa06d99f0a4d816918245266800c9a0941e0',
    },
    offchain: {
      id: '5714d4a6-4ec6-47b5-94e3-07bf979b5789',
      name: 'ofcspo',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.SOLVE,
    fullName: 'Solve Token',
    decimalPlaces: 8,
    onchain: {
      id: '483b5ba9-a101-4622-bdda-6a6509d156f3',
      name: 'solve',
      contractAddress: '0x446c9033e7516d820cc9a2ce2d0b7328b579406f',
    },
    offchain: {
      id: 'cf99b22b-8389-4ab2-b3c7-acf3627d9d32',
      name: 'ofcsolve',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.SRM,
    fullName: 'Serum',
    decimalPlaces: 6,
    onchain: {
      id: '2e3040f2-3e4c-4cbd-93a8-41a608d3f5c4',
      name: 'srm',
      contractAddress: '0x476c5e26a75bd202a9683ffd34359c0cc15be0ff',
      features: AccountCoin.getFeaturesByTypeExcluding(
        [
          CoinFeature.CUSTODY_BITGO_SINGAPORE,
          CoinFeature.CUSTODY_BITGO_CUSTODY_MENA_FZE,
          CoinFeature.CUSTODY_BITGO_MENA_FZE,
          CoinFeature.CUSTODY_BITGO_EUROPE_APS,
          CoinFeature.CUSTODY_BITGO_FRANKFURT,
          CoinFeature.CUSTODY_BITGO_GERMANY,
        ],
        ETH_FEATURES
      ) as CoinFeature[],
    },
    offchain: {
      id: 'e8aef706-ad2d-4be5-8a4a-95ebcedc6e92',
      name: 'ofcsrm',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.SSV,
    fullName: 'SSV Network',
    decimalPlaces: 18,
    onchain: {
      id: '7c786a41-3527-4e87-8b7a-addfe4f4e02a',
      name: 'ssv',
      contractAddress: '0x9d65ff81a3c488d585bbfb0bfe3c7707c7917f54',
    },
    offchain: {
      id: '9f376a33-a113-4473-99f5-a38f36c64461',
      name: 'ofcssv',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.SRNT,
    fullName: 'Serenity',
    decimalPlaces: 18,
    onchain: {
      id: 'cfff10ae-b9db-47e1-a340-e5c5b0629d33',
      name: 'srnt',
      contractAddress: '0xbc7942054f77b82e8a71ace170e4b00ebae67eb6',
      features: [
        ...ACCOUNT_COIN_DEFAULT_FEATURES_EXCLUDE_SINGAPORE_AND_MENA_FZE,
        CoinFeature.BULK_TRANSACTION,
      ] as CoinFeature[],
    },
    offchain: {
      id: 'f749a2b5-b700-4f40-9e97-f2b6da6c1d15',
      name: 'ofcsrnt',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.STRK,
    fullName: 'StarkNet Token',
    decimalPlaces: 18,
    onchain: {
      id: 'bb84158f-c89c-40a4-bea5-dede449acfd2',
      name: 'strk',
      contractAddress: '0xca14007eff0db1f8135f4c25b34de49ab0d42766',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: '688725ff-e582-44bc-b42e-0de600426594',
      name: 'ofcstrk',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.STRONG,
    fullName: 'Strong',
    decimalPlaces: 18,
    onchain: {
      id: '19382390-e3cf-4597-9723-f7c91a22e798',
      name: 'strong',
      contractAddress: '0x990f341946a3fdb507ae7e52d17851b87168017c',
      features: ACCOUNT_COIN_DEFAULT_FEATURES_EXCLUDE_SINGAPORE as CoinFeature[],
    },
    offchain: {
      id: '021addfe-43c3-4e3e-b170-08d033684de1',
      name: 'ofcstrong',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.STBU,
    fullName: 'Stobox Token',
    decimalPlaces: 18,
    onchain: {
      id: 'e49ede0c-5f71-4e3e-869d-34ec64746e82',
      name: 'stbu',
      contractAddress: '0x212dd60d4bf0da8372fe8116474602d429e5735f',
      features: AccountCoin.DEFAULT_FEATURES_EXCLUDE_SINGAPORE as CoinFeature[],
    },
    offchain: {
      id: '9e0addab-1919-4d3f-a433-fda079523fdc',
      name: 'ofcstbu',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.STC,
    fullName: 'Student Coin',
    decimalPlaces: 2,
    onchain: {
      id: '189f7974-5264-4716-ad8c-bb62d364e8c6',
      name: 'stc',
      contractAddress: '0xb8b7791b1a445fb1e202683a0a329504772e0e52',
    },
    offchain: {
      id: '64ea6c88-89b6-4af8-a082-d141214910e0',
      name: 'ofcstc',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.STCV2,
    fullName: 'Student Coin V2',
    decimalPlaces: 18,
    onchain: {
      id: '67b7ab59-cd93-4f39-ad8b-58755bee1adf',
      name: 'stcv2',
      contractAddress: '0x15b543e986b8c34074dfc9901136d9355a537e7e',
    },
    offchain: {
      id: '02f39f25-45df-431a-8860-031d832f76ea',
      name: 'ofcstcv2',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['SETH-H'],
    fullName: 'Staked ETH Harbour',
    decimalPlaces: 18,
    onchain: {
      id: '6c80f7f9-656a-4456-b47b-032cf11ee707',
      name: 'seth-h',
      contractAddress: '0x65077fa7df8e38e135bd4052ac243f603729892d',
      features: AccountCoin.DEFAULT_FEATURES_EXCLUDE_SINGAPORE as CoinFeature[],
    },
    offchain: {
      id: 'e763e6ef-17e4-4326-b532-c3ddac300811',
      name: 'ofcseth-h',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.STG,
    fullName: 'StargateToken',
    decimalPlaces: 18,
    onchain: {
      id: 'af29b7af-55bd-42e1-8ef2-3a95c19744be',
      name: 'stg',
      contractAddress: '0xaf5191b0de278c7286d6c7cc6ab6bb8a73ba2cd6',
    },
    offchain: {
      id: '5564f688-af13-4a14-9b15-7058ca3d9bf2',
      name: 'ofcstg',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.STKAAVE,
    fullName: 'Staked Aave',
    decimalPlaces: 18,
    onchain: {
      id: '070adae3-3502-4c67-9b4f-10621c12057f',
      name: 'stkaave',
      contractAddress: '0x4da27a545c0c5b758a6ba100e3a049001de870f5',
      features: ACCOUNT_COIN_DEFAULT_FEATURES_EXCLUDE_SINGAPORE as CoinFeature[],
    },
    offchain: {
      id: '40b38fb3-9795-40ec-8061-0da13b28ab12',
      name: 'ofcstkaave',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.STORJ,
    fullName: 'Storj',
    decimalPlaces: 8,
    onchain: {
      id: '9404f006-322f-4475-aeb8-d2adf87c8594',
      name: 'storj',
      contractAddress: '0xb64ef51c888972c908cfacf59b47c1afbc0ab8ac',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: '3c35a09e-2cf2-475c-a5e3-a4757dca7b36',
      name: 'ofcstorj',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.STORE,
    fullName: 'Store',
    decimalPlaces: 8,
    onchain: {
      id: 'd547b13c-b916-4ad2-a01b-11f690e23df6',
      name: 'store',
      contractAddress: '0x2c0f41eb07a0635bac34bd7d11d0ca6058279601',
    },
    offchain: {
      id: 'b5078f0f-13a0-422a-b0e7-2e17d3b6e935',
      name: 'ofcstore',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.STMX,
    fullName: 'StormX',
    decimalPlaces: 18,
    onchain: {
      id: '4a1a7ca7-f66d-40eb-af4e-848cafe0df91',
      name: 'stmx',
      contractAddress: '0xbe9375c6a420d2eeb258962efb95551a5b722803',
    },
    offchain: {
      id: 'a4271420-4e1d-46f2-b237-542c7720027d',
      name: 'ofcstmx',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.STORM,
    fullName: 'Storm',
    decimalPlaces: 18,
    onchain: {
      id: '36fcd618-6eb5-42fd-a11e-71044c1536c9',
      name: 'storm',
      contractAddress: '0xd0a4b8946cb52f0661273bfbc6fd0e0c75fc6433',
    },
    offchain: {
      id: '71cbdcc4-2f1b-4dc6-ad99-9749d1c5edbc',
      name: 'ofcstorm',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.STPT,
    fullName: 'STPT',
    decimalPlaces: 18,
    onchain: {
      id: 'aa30de06-fe52-41f0-bb5e-c332a00a7ef1',
      name: 'stpt',
      contractAddress: '0xde7d85157d9714eadf595045cc12ca4a5f3e2adb',
    },
    offchain: {
      id: 'b02ee214-497c-4e2c-bcd4-90db2005cf76',
      name: 'ofcstpt',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.STZEN,
    fullName: 'stakedZEN',
    decimalPlaces: 8,
    onchain: {
      id: '97163260-0336-40d3-a2ad-6f458f76f037',
      name: 'stzen',
      contractAddress: '0x31b595e7cfdb624d10a3e7a562ed98c3567e3865',
      features: AccountCoin.DEFAULT_FEATURES_EXCLUDE_SINGAPORE as CoinFeature[],
    },
    offchain: {
      id: '8e083ed9-f053-4c1c-9aaa-37cc30656686',
      name: 'ofcstzen',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.SUPER,
    fullName: 'SuperFarm',
    decimalPlaces: 18,
    onchain: {
      id: '097330e3-2be4-4b1f-a87f-71b02e7ef564',
      name: 'super',
      contractAddress: '0xe53ec727dbdeb9e2d5456c3be40cff031ab40a55',
    },
    offchain: {
      id: 'f4daaf08-25bf-4863-b781-10096833f9d7',
      name: 'ofcsuper',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.SUSHI,
    fullName: 'SushiToken',
    decimalPlaces: 18,
    onchain: {
      id: '44713751-1276-4402-b50f-eb082a570cb1',
      name: 'sushi',
      contractAddress: '0x6b3595068778dd592e39a122f4f5a5cf09c90fe2',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: '7f591fea-dcaa-46de-88dd-7173537f4433',
      name: 'ofcsushi',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.SQUIG,
    fullName: 'Squiggle',
    decimalPlaces: 4,
    onchain: {
      id: 'e73355a3-13c5-484b-b471-8701a69b8146',
      name: 'squig',
      contractAddress: '0x373acda15ce392362e4b46ed97a7feecd7ef9eb8',
    },
    offchain: {
      id: '9027a8e2-5189-4b93-bd13-e0ae5b8f7cbd',
      name: 'ofcsquig',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.SXP,
    fullName: 'Swipe',
    decimalPlaces: 18,
    onchain: {
      id: '78f44e78-1bd8-420f-b7c4-4355662f0f42',
      name: 'sxp',
      contractAddress: '0x8ce9137d39326ad0cd6491fb5cc0cba0e089b6a9',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: 'cc429744-58ca-4c3b-abe7-1761320b76ce',
      name: 'ofcsxp',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.SYN,
    fullName: 'Synapse',
    decimalPlaces: 18,
    onchain: {
      id: 'c00e568b-ef12-4137-adbb-45f979dff1c8',
      name: 'syn',
      contractAddress: '0x0f2d719407fdbeff09d87557abb7232601fd9f29',
      features: [
        ...ACCOUNT_COIN_DEFAULT_FEATURES_EXCLUDE_SINGAPORE_AND_MENA_FZE,
        CoinFeature.BULK_TRANSACTION,
      ] as CoinFeature[],
    },
    offchain: {
      id: 'cfbd695a-b963-4c05-8b3c-622368beab42',
      name: 'ofcsyn',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.THRESHOLD,
    fullName: 'Threshold',
    decimalPlaces: 18,
    onchain: {
      id: 'be5c0f72-51cf-4e42-b373-5a7d66b86f02',
      name: 'threshold',
      contractAddress: '0xcdf7028ceab81fa0c6971208e83fa7872994bee5',
    },
    offchain: {
      id: 'c4b061d3-fe27-47b1-a524-f4e9cd2355fc',
      name: 'ofcthreshold',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TAUD,
    fullName: 'TrueAUD',
    decimalPlaces: 18,
    onchain: {
      id: '7250aaec-4d32-4dc0-ae1c-22b3b435e406',
      name: 'taud',
      contractAddress: '0x00006100f7090010005f1bd7ae6122c3c2cf0090',
      features: AccountCoin.getFeaturesByTypeExcluding(
        [
          CoinFeature.CUSTODY_BITGO_GERMANY,
          CoinFeature.CUSTODY_BITGO_EUROPE_APS,
          CoinFeature.CUSTODY_BITGO_FRANKFURT,
          CoinFeature.CUSTODY_BITGO_SINGAPORE,
          CoinFeature.CUSTODY_BITGO_CUSTODY_MENA_FZE,
        ],
        ETH_FEATURES
      ) as CoinFeature[],
    },
    offchain: {
      id: '87d0fbae-6cd1-4c6c-bea3-01b1bb05fe1c',
      name: 'ofctaud',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TBILL,
    fullName: 'OpenEden T-Bills',
    decimalPlaces: 6,
    onchain: {
      id: '18baf0af-ce4c-476f-85a7-009d07a4cf91',
      name: 'tbill',
      contractAddress: '0xdd50c053c096cb04a3e3362e2b622529ec5f2e8a',
      features: AccountCoin.DEFAULT_FEATURES_EXCLUDE_SINGAPORE as CoinFeature[],
    },
    offchain: {
      id: 'fb5ba281-b060-4e68-86c8-55da5c7e7fe9',
      name: 'ofctbill',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TBTC1,
    fullName: 'Tbtc1',
    decimalPlaces: 18,
    onchain: {
      id: '56af670b-76df-4e8e-9765-18a90e0f8b4d',
      name: 'tbtc1',
      contractAddress: '0x8daebade922df735c38c80c7ebd708af50815faa',
    },
    offchain: {
      id: '79274c02-67ca-4274-b7e5-8283ef933c2d',
      name: 'ofctbtc1',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TBTC2,
    fullName: 'Tbtc2',
    decimalPlaces: 18,
    onchain: {
      id: 'e20e9f1a-429c-40ab-a433-4c0d6ff399f2',
      name: 'tbtc2',
      contractAddress: '0x18084fba666a33d37592fa2633fd49a74dd93a88',
    },
    offchain: {
      id: '5553bb85-c514-4e7d-8bb3-2edd2195e0fc',
      name: 'ofctbtc2',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TCAD,
    fullName: 'TrueCAD',
    decimalPlaces: 18,
    onchain: {
      id: '59654e4c-21f8-4139-aa7b-93ac62852f0c',
      name: 'tcad',
      contractAddress: '0x00000100f2a2bd000715001920eb70d229700085',
      features: AccountCoin.getFeaturesByTypeExcluding(
        [
          CoinFeature.CUSTODY_BITGO_GERMANY,
          CoinFeature.CUSTODY_BITGO_EUROPE_APS,
          CoinFeature.CUSTODY_BITGO_FRANKFURT,
          CoinFeature.CUSTODY_BITGO_SINGAPORE,
          CoinFeature.CUSTODY_BITGO_CUSTODY_MENA_FZE,
        ],
        ETH_FEATURES
      ) as CoinFeature[],
    },
    offchain: {
      id: '379ec9d9-a4b1-4aec-b95d-fd8342cbc427',
      name: 'ofctcad',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TCO,
    fullName: 'Think Coin',
    decimalPlaces: 18,
    onchain: {
      id: '6ebb5497-c726-4845-8c94-2f19dd7394be',
      name: 'tco',
      contractAddress: '0x6288014d6ba425d71f5fdc1dbfb01378241d78db',
    },
    offchain: {
      id: '3c178445-68a2-499d-8aac-9278516fae03',
      name: 'ofctco',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TEL,
    fullName: 'Telcoin',
    decimalPlaces: 2,
    onchain: {
      id: 'eacb3ef0-74bf-4d13-9dd0-cab584eccd18',
      name: 'tel',
      contractAddress: '0x467bccd9d29f223bce8043b84e8c8b282827790f',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: 'dff24bf9-5999-4093-bfe4-24e74eb5ff2f',
      name: 'ofctel',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TEN,
    fullName: 'Tokenomy',
    decimalPlaces: 18,
    onchain: {
      id: '8e1d91c3-9b23-4adf-82b3-6dd0f077c7b8',
      name: 'ten',
      contractAddress: '0xdd16ec0f66e54d453e6756713e533355989040e4',
    },
    offchain: {
      id: 'e8f1a380-5fd3-4cf0-91ca-a3a354d4ff3d',
      name: 'ofcten',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TENX,
    fullName: 'TenX Token',
    decimalPlaces: 18,
    onchain: {
      id: 'f93936f8-1698-49d5-9c73-d31ec607f16f',
      name: 'tenx',
      contractAddress: '0x515ba0a2e286af10115284f151cf398688a69170',
    },
    offchain: {
      id: '4d6c5a88-c622-4482-8bc3-bba2892dd85e',
      name: 'ofctenx',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TGBP,
    fullName: 'TrueGBP',
    decimalPlaces: 18,
    onchain: {
      id: 'adc1b5bb-1fd6-4eec-b0b4-abfbdcea9a2a',
      name: 'tgbp',
      contractAddress: '0x00000000441378008ea67f4284a57932b1c000a5',
      features: AccountCoin.getFeaturesByTypeExcluding(
        [
          CoinFeature.CUSTODY_BITGO_GERMANY,
          CoinFeature.CUSTODY_BITGO_EUROPE_APS,
          CoinFeature.CUSTODY_BITGO_FRANKFURT,
          CoinFeature.CUSTODY_BITGO_SINGAPORE,
          CoinFeature.CUSTODY_BITGO_CUSTODY_MENA_FZE,
        ],
        ETH_FEATURES
      ) as CoinFeature[],
    },
  },
  {
    underlyingAsset: UnderlyingAsset.THKD,
    fullName: 'TrueHKD',
    decimalPlaces: 18,
    onchain: {
      id: '47e9763a-abdc-4e2b-8326-c8d29359e066',
      name: 'thkd',
      contractAddress: '0x0000852600ceb001e08e00bc008be620d60031f2',
    },
    offchain: {
      id: 'd9dbdb3e-2a44-4502-8b3a-43a60d9723e7',
      name: 'ofcthkd',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.THUNDER,
    fullName: 'ETH-Peg Thunder Token',
    decimalPlaces: 18,
    onchain: {
      id: 'afa4feca-c6bb-4c5b-b33f-9e5a068e9103',
      name: 'thunder',
      contractAddress: '0x1e053d89e08c24aa2ce5c5b4206744dc2d7bd8f5',
    },
    offchain: {
      id: '3048586e-02ac-409c-b1ad-f5f7bbe60c76',
      name: 'ofcthunder',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TIOX,
    fullName: 'Trade Token X',
    decimalPlaces: 18,
    onchain: {
      id: '7839585b-0bd8-4419-867f-b4cc44e7a9eb',
      name: 'tiox',
      contractAddress: '0xd947b0ceab2a8885866b9a04a06ae99de852a3d4',
      features: [
        ...ACCOUNT_COIN_DEFAULT_FEATURES_EXCLUDE_SINGAPORE_AND_MENA_FZE,
        CoinFeature.BULK_TRANSACTION,
      ] as CoinFeature[],
    },
    offchain: {
      id: '7c1ebee3-e879-4613-86a5-6a9f542bda0e',
      name: 'ofctiox',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TKNT,
    fullName: 'Tknt',
    decimalPlaces: 18,
    onchain: {
      id: 'c2144148-0460-4e44-9c4c-30367e6eb67f',
      name: 'tknt',
      contractAddress: '0xbce7bd79558dda90b261506768f265c5543a9f90',
      features: [
        ...ACCOUNT_COIN_DEFAULT_FEATURES_EXCLUDE_SINGAPORE_AND_MENA_FZE,
        CoinFeature.BULK_TRANSACTION,
      ] as CoinFeature[],
    },
    offchain: {
      id: 'b00af0a4-3d38-4231-b88f-405623647b22',
      name: 'ofctknt',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TKO,
    fullName: 'Taiko Token',
    decimalPlaces: 18,
    onchain: {
      id: '8c3744b3-f435-4a6b-91a0-346139bd2b86',
      name: 'tko',
      contractAddress: '0x10dea67478c5f8c5e2d90e5e9b26dbe60c54d800',
    },
    offchain: {
      id: '1a159648-8ca0-4bfd-979c-979f9882c2b0',
      name: 'ofctko',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TKX,
    fullName: 'Tokenize',
    decimalPlaces: 8,
    onchain: {
      id: '7416f330-7ebe-4041-ae0b-26876973b084',
      name: 'tkx',
      contractAddress: '0x667102bd3413bfeaa3dffb48fa8288819e480a88',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: 'd6d6ee90-05c1-4fdd-8621-bfaefaa703ae',
      name: 'ofctkx',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TLAB,
    fullName: 'TLAB',
    decimalPlaces: 18,
    onchain: {
      id: 'ed5b27a1-eaab-4a02-a1d1-a07ad736c5fd',
      name: 'tlab',
      contractAddress: '0x36222730e78a8656230c54f9e402a062d168d2d9',
    },
    offchain: {
      id: 'cd30cfdb-df74-47ff-b032-e38456a171f0',
      name: 'ofctlab',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TLM,
    fullName: 'Alien Worlds Trilium',
    decimalPlaces: 4,
    onchain: {
      id: 'fb05271e-c1a3-49e1-9be5-d9248d3b75d0',
      name: 'tlm',
      contractAddress: '0x888888848b652b3e3a0f34c96e00eec0f3a23f72',
    },
    offchain: {
      id: '76c7f6bd-acdf-4435-876a-a036faef7a36',
      name: 'ofctlm',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TLOS,
    fullName: 'pTokens TLOS',
    decimalPlaces: 18,
    onchain: {
      id: '6638e742-8f10-45bc-ac55-c357f98a105a',
      name: 'tlos',
      contractAddress: '0x7825e833d495f3d1c28872415a4aee339d26ac88',
    },
    offchain: {
      id: 'cab4b113-ac50-46b7-a987-072ef35bcd5a',
      name: 'ofctlos',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TNT,
    fullName: 'Tierion',
    decimalPlaces: 8,
    onchain: {
      id: '492fb412-56bb-4677-b7d3-87cf03aad7df',
      name: 'tnt',
      contractAddress: '0x08f5a9235b08173b7569f83645d2c7fb55e8ccd8',
      features: [
        ...ACCOUNT_COIN_DEFAULT_FEATURES_EXCLUDE_SINGAPORE_AND_MENA_FZE,
        CoinFeature.BULK_TRANSACTION,
      ] as CoinFeature[],
    },
    offchain: {
      id: 'de62e920-0e75-4255-8c07-be8eb983ff98',
      name: 'ofctnt',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TOK,
    fullName: 'Tokenplace',
    decimalPlaces: 8,
    onchain: {
      id: '7c18aaa3-a3e5-4bd8-8152-5c702c0bc7f5',
      name: 'tok',
      contractAddress: '0x4fb721ef3bf99e0f2c193847afa296b9257d3c30',
    },
    offchain: {
      id: 'bb8e6cba-220f-4c9f-b6f0-6917e2dcb0ef',
      name: 'ofctok',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TONCOIN,
    fullName: 'Wrapped TON Coin',
    decimalPlaces: 9,
    onchain: {
      id: '233385fb-e778-4ab9-8487-2fe5fd9c4e80',
      name: 'toncoin',
      contractAddress: '0x582d872a1b094fc48f5de31d3b73f2d9be47def1',
    },
    offchain: {
      id: '0e825a82-ebc6-4f03-936f-edf2c09aea3e',
      name: 'ofctoncoin',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TRAC,
    fullName: 'OriginTrails',
    decimalPlaces: 18,
    onchain: {
      id: '3bcedaff-f9bd-4abd-8cd6-18b57efa0207',
      name: 'trac',
      contractAddress: '0xaa7a9ca87d3694b5755f213b5d04094b8d0f0a6f',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: '3635900a-d77b-4725-8385-909245c60b35',
      name: 'ofctrac',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TRAXX,
    fullName: 'TokenTrax',
    decimalPlaces: 18,
    onchain: {
      id: '00aec019-d10f-48c3-af0b-ef742832a803',
      name: 'traxx',
      contractAddress: '0xd43be54c1aedf7ee4099104f2dae4ea88b18a249',
    },
    offchain: {
      id: '9aea30d3-fa87-4831-80c1-09dee2c0a112',
      name: 'ofctraxx',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TRB,
    fullName: 'Tellor',
    decimalPlaces: 18,
    onchain: {
      id: 'b3219173-9075-4e3a-ad84-ec4ad4bfd59a',
      name: 'trb',
      contractAddress: '0x88df592f8eb5d7bd38bfef7deb0fbc02cf3778a0',
    },
    offchain: {
      id: '1542131e-e86c-47a5-b425-c71d777a73ee',
      name: 'ofctrb',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TRIBE,
    fullName: 'Tribe',
    decimalPlaces: 18,
    onchain: {
      id: 'c101171e-8104-4052-84d5-f192a63d4b7a',
      name: 'tribe',
      contractAddress: '0xc7283b66eb1eb5fb86327f08e1b5816b0720212b',
    },
    offchain: {
      id: '764937cd-464b-4a49-88a4-836e39f8e7d3',
      name: 'ofctribe',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TRIBL,
    fullName: 'Tribal Finance',
    decimalPlaces: 18,
    onchain: {
      id: '5a182906-c091-411f-aa39-c707c5214338',
      name: 'tribl',
      contractAddress: '0x6988a804c74fd04f37da1ea4781cea68c9c00f86',
    },
    offchain: {
      id: 'de1e5df2-b206-4146-9f8b-fee26d51f49c',
      name: 'ofctribl',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TRL,
    fullName: 'Triall Token',
    decimalPlaces: 18,
    onchain: {
      id: '459b364d-d2c2-4df1-a1d5-0bbb63eb75b7',
      name: 'trl',
      contractAddress: '0x58f9102bf53cf186682bd9a281d3cd3c616eec41',
    },
    offchain: {
      id: '1dbb1a1b-2980-43d0-aab5-be1dcc24a504',
      name: 'ofctrl',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TROY,
    fullName: 'TROY',
    decimalPlaces: 18,
    onchain: {
      id: 'fac46d15-780b-4dbd-b04e-07f34570584f',
      name: 'troy',
      contractAddress: '0x4574562e9310a94f9ca962bd23168d8a06875b1a',
    },
    offchain: {
      id: '8ff7bccb-0d19-46d6-9137-21a7bd8c4281',
      name: 'ofctroy',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TRST,
    fullName: 'WeTrust',
    decimalPlaces: 6,
    onchain: {
      id: '2ade9e63-63bc-45cd-b824-7c91a559ed55',
      name: 'trst',
      contractAddress: '0xcb94be6f13a1182e4a4b6140cb7bf2025d28e41b',
      features: [
        ...ACCOUNT_COIN_DEFAULT_FEATURES_EXCLUDE_SINGAPORE_AND_MENA_FZE,
        CoinFeature.BULK_TRANSACTION,
      ] as CoinFeature[],
    },
    offchain: {
      id: '72508452-eb6f-40c9-b326-662b324071f4',
      name: 'ofctrst',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TRU,
    fullName: 'Tru',
    decimalPlaces: 8,
    onchain: {
      id: '89749307-fd2a-4705-898d-077c49b2e4ec',
      name: 'tru',
      contractAddress: '0x4c19596f5aaff459fa38b0f7ed92f11ae6543784',
      features: [
        ...ACCOUNT_COIN_DEFAULT_FEATURES_EXCLUDE_SINGAPORE_AND_MENA_FZE,
        CoinFeature.BULK_TRANSACTION,
      ] as CoinFeature[],
    },
    offchain: {
      id: '3c0f5c3b-3bac-4cfb-8732-986dbd0636e3',
      name: 'ofctru',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TRUF,
    fullName: 'Truflation',
    decimalPlaces: 18,
    onchain: {
      id: '8385ecb0-1053-4630-a46e-417bad13584f',
      name: 'truf',
      contractAddress: '0x38c2a4a7330b22788374b8ff70bba513c8d848ca',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: 'ac7ab00a-3e9f-4338-aa7e-2d477c0ecfb3',
      name: 'ofctruf',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TRUFV2,
    fullName: 'Truflation (v2)',
    decimalPlaces: 18,
    onchain: {
      id: '1c022222-9173-4136-8438-49cbac3c645c',
      name: 'trufv2',
      contractAddress: '0x243c9be13faba09f945ccc565547293337da0ad7',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: 'fb11d6c3-49b2-4b22-8a23-b153b43ac305',
      name: 'ofctrufv2',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TRYB,
    fullName: 'Bilira Token',
    decimalPlaces: 6,
    onchain: {
      id: '800b8416-6928-4adf-b291-5016760e740b',
      name: 'tryb',
      contractAddress: '0x2c537e5624e4af88a7ae4060c022609376c8d0eb',
    },
    offchain: {
      id: 'afd07a2d-4833-4fef-99b1-e27d70f9f5ae',
      name: 'ofctryb',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TRYX,
    fullName: 'eToro Turkish Lira',
    decimalPlaces: 18,
    onchain: {
      id: '9e95bd8e-30b9-4ff1-8e98-e168135f4edb',
      name: 'tryx',
      contractAddress: '0x6faff971d9248e7d398a98fdbe6a81f6d7489568',
    },
    offchain: {
      id: '0c9b6d42-dc5f-4d65-83dd-29b8e36a192e',
      name: 'ofctryx',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TST,
    fullName: 'Teleport System Token',
    decimalPlaces: 18,
    onchain: {
      id: 'a655736c-7625-4eeb-9fc3-6c13b0f7a600',
      name: 'tst',
      contractAddress: '0x0828096494ad6252f0f853abfc5b6ec9dfe9fdad',
    },
    offchain: {
      id: 'c559b7ca-121b-44fc-be68-eba8f81e0c99',
      name: 'ofctst',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TUSD,
    fullName: 'TrueUSD',
    decimalPlaces: 18,
    onchain: {
      id: '461b6246-659b-4bb4-ab78-c68ccc446c40',
      name: 'tusd',
      contractAddress: '0x0000000000085d4780b73119b644ae5ecd22b376',
      features: [...ACCOUNT_COIN_DEFAULT_FEATURES, CoinFeature.STABLECOIN] as CoinFeature[],
    },
    offchain: {
      id: 'dbaf70b2-e159-4c67-9dd9-39ef886a2390',
      name: 'ofctrueusd',
      features: [...AccountCoin.DEFAULT_FEATURES, CoinFeature.STABLECOIN] as CoinFeature[],
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TXL,
    fullName: 'Tixl',
    decimalPlaces: 18,
    onchain: {
      id: 'd1aae34f-d448-449c-91c3-fbfd9983eabf',
      name: 'txl',
      contractAddress: '0x8eef5a82e6aa222a60f009ac18c24ee12dbf4b41',
    },
    offchain: {
      id: 'c8dc3f1e-c5ea-469d-b90a-24ad6ffc9bad',
      name: 'ofctxl',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.UAIR,
    fullName: 'Unicorn AIR Security Token',
    decimalPlaces: 0,
    onchain: {
      id: 'a1ba311c-962a-4b3f-8aab-6d04055c1e44',
      name: 'uair',
      contractAddress: '0xac47fbb90458695044d9b08d6de285148db4daff',
    },
    offchain: {
      id: 'e718022f-3646-49d5-b48b-db48131d174e',
      name: 'ofcuair',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.UBXT,
    fullName: 'UpBots',
    decimalPlaces: 18,
    onchain: {
      id: '2e906f20-5aa0-4511-ac22-e7d4cd4a902e',
      name: 'ubxt',
      contractAddress: '0x8564653879a18c560e7c0ea0e084c516c62f5653',
    },
    offchain: {
      id: 'e9f9fa6c-899b-4394-b06e-33d857fbbc5a',
      name: 'ofcubxt',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.UCO,
    fullName: 'UnirisToken',
    decimalPlaces: 18,
    onchain: {
      id: '243053c9-e331-48f8-9f99-7af4e4f080c6',
      name: 'uco',
      contractAddress: '0x8a3d77e9d6968b780564936d15b09805827c21fa',
    },
    offchain: {
      id: '82f9a021-0c10-47d4-8096-c63b948ba663',
      name: 'ofcuco',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.UFT,
    fullName: 'UniLend Finance Token',
    decimalPlaces: 18,
    onchain: {
      id: '2cf7089d-ff32-4489-8a86-b48e0b7e4f1b',
      name: 'uft',
      contractAddress: '0x0202be363b8a4820f3f4de7faf5224ff05943ab1',
    },
    offchain: {
      id: '127119dd-e4f8-48c5-a094-be883599ac00',
      name: 'ofcuft',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.UKG,
    fullName: 'UnikoinGold',
    decimalPlaces: 18,
    onchain: {
      id: '74304d72-9239-4f35-8b88-cd3d265c7516',
      name: 'ukg',
      contractAddress: '0x24692791bc444c5cd0b81e3cbcaba4b04acd1f3b',
    },
    offchain: {
      id: '77b5490c-a164-4c67-9588-21e50a51906e',
      name: 'ofcukg',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.UMA,
    fullName: 'UMA Voting Token V1',
    decimalPlaces: 18,
    onchain: {
      id: 'a1cc009e-373a-4c33-a75f-aecb3fc49eeb',
      name: 'uma',
      contractAddress: '0x04fa0d235c4abf4bcf4787af4cf447de572ef828',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: '2566f816-47de-481c-b4b9-f31989861388',
      name: 'ofcuma',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.UMEE,
    fullName: 'Umee',
    decimalPlaces: 6,
    onchain: {
      id: '71d2dfa3-6032-4ad2-8a1f-f503030e9690',
      name: 'umee',
      contractAddress: '0xc0a4df35568f116c370e6a6a6022ceb908eeddac',
    },
    offchain: {
      id: '04b86e42-ba9b-4575-b2d8-081e0e8f787e',
      name: 'ofcumee',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.UNB,
    fullName: 'Unbound Protocol',
    decimalPlaces: 18,
    onchain: {
      id: 'a5714a57-ac56-4901-9e0d-1e1130278189',
      name: 'unb',
      contractAddress: '0x8db253a1943dddf1af9bcf8706ac9a0ce939d922',
    },
    offchain: {
      id: 'c7b8491e-27b2-4a43-bfd3-fd99d78c934a',
      name: 'ofcunb',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.UNI,
    fullName: 'Uniswap Token',
    decimalPlaces: 18,
    onchain: {
      id: 'c93c3c60-7c91-4194-88cd-a9181ac2301f',
      name: 'uni',
      contractAddress: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: 'f15ddadd-5b35-4fa0-bcf6-68e3254d3bb1',
      name: 'ofcuni',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.UP,
    fullName: 'UpToken',
    decimalPlaces: 8,
    onchain: {
      id: 'c0210f3b-f053-4a5b-b375-2abe8c013e29',
      name: 'up',
      contractAddress: '0x6ba460ab75cd2c56343b3517ffeba60748654d26',
      features: [
        ...ACCOUNT_COIN_DEFAULT_FEATURES_EXCLUDE_SINGAPORE_AND_MENA_FZE,
        CoinFeature.BULK_TRANSACTION,
      ] as CoinFeature[],
    },
    offchain: {
      id: 'c3460889-b529-470b-a1db-10a186960f48',
      name: 'ofcup',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.UPBTC,
    fullName: 'Universal Bitcoin',
    decimalPlaces: 8,
    onchain: {
      id: '3ad008a2-b1b6-4e77-b338-8bccfce4f5ef',
      name: 'upbtc',
      contractAddress: '0xc7461b398005e50bcc43c8e636378c6722e76c01',
      features: [
        ...ACCOUNT_COIN_DEFAULT_FEATURES_EXCLUDE_SINGAPORE_AND_MENA_FZE,
        CoinFeature.BULK_TRANSACTION,
      ] as CoinFeature[],
    },
    offchain: {
      id: '72e1b2fd-e4e3-4c76-ad23-6435fa68c087',
      name: 'ofcupbtc',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.UPP,
    fullName: 'Sentinel Protocol',
    decimalPlaces: 18,
    onchain: {
      id: 'fc3e297a-a707-4f36-b5a9-42c54cdeaef1',
      name: 'upp',
      contractAddress: '0xc86d054809623432210c107af2e3f619dcfbf652',
    },
    offchain: {
      id: '14fc5da9-af5d-456a-893c-d7faa7395fd1',
      name: 'ofcupp',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.UPT,
    fullName: 'Universal Protocol Token',
    decimalPlaces: 18,
    onchain: {
      id: '610b03d8-09e4-45c8-a5db-0f13f17294ba',
      name: 'upt',
      contractAddress: '0x6ca88cc8d9288f5cad825053b6a1b179b05c76fc',
    },
    offchain: {
      id: 'a2dd5984-3b5e-471d-9e0c-097dbfe15d1f',
      name: 'ofcupt',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.UPUSD,
    fullName: 'Universal US Dollar',
    decimalPlaces: 2,
    onchain: {
      id: '20f76742-f678-4760-922c-0dacb20d1d11',
      name: 'upusd',
      contractAddress: '0x86367c0e517622dacdab379f2de389c3c9524345',
      features: [
        ...AccountCoin.getFeaturesByTypeExcluding(
          [
            CoinFeature.CUSTODY_BITGO_GERMANY,
            CoinFeature.CUSTODY_BITGO_EUROPE_APS,
            CoinFeature.CUSTODY_BITGO_FRANKFURT,
            CoinFeature.CUSTODY_BITGO_SINGAPORE,
            CoinFeature.CUSTODY_BITGO_MENA_FZE,
          ],
          ETH_FEATURES
        ),
        CoinFeature.STABLECOIN,
      ] as CoinFeature[],
    },
    offchain: {
      id: '2b18fff0-9981-4762-866e-d8be9c6ecc00',
      name: 'ofcupusd',
      features: [CoinFeature.STABLECOIN] as CoinFeature[],
    },
  },
  {
    underlyingAsset: UnderlyingAsset.UQC,
    fullName: 'Uquid Coin',
    decimalPlaces: 18,
    onchain: {
      id: 'a3e31214-0c47-4329-a56c-c7539b0d7906',
      name: 'uqc',
      contractAddress: '0x8806926ab68eb5a7b909dcaf6fdbe5d93271d6e2',
    },
    offchain: {
      id: 'c8dbdc91-4fff-4548-8238-9fa7948b51b9',
      name: 'ofcuqc',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.URHD,
    fullName: 'Unicorn Tokenization Robinhood Shares',
    decimalPlaces: 0,
    onchain: {
      id: '7e34c27f-b2e0-407c-add6-40ac04b49c8d',
      name: 'urhd',
      contractAddress: '0xe1d24266ff2a981f886548cdb3fd4ac3b4a76167',
    },
    offchain: {
      id: '24415d14-0397-45b7-87c8-1aa680d11b79',
      name: 'ofcurhd',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.USDC,
    fullName: 'USD Coin',
    decimalPlaces: 6,
    onchain: {
      id: 'cea3a2da-db32-4e0a-a086-cadc85bc0e05',
      name: 'usdc',
      contractAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
      features: [
        ...TOKEN_FEATURES_WITH_SWISS,
        CoinFeature.CUSTODY_BITGO_NEW_YORK,
        CoinFeature.CUSTODY_BITGO_FRANKFURT,
        CoinFeature.STABLECOIN,
      ] as CoinFeature[],
    },
    offchain: {
      id: '28024a59-6fbb-4156-96e4-2ba7747e8581',
      name: 'ofcusdc',
      features: [CoinFeature.STABLECOIN] as CoinFeature[],
    },
  },
  {
    underlyingAsset: UnderlyingAsset.USDD,
    fullName: 'USDD',
    decimalPlaces: 18,
    onchain: {
      id: 'd2b0daf7-c664-4e97-a9b3-48c2fe4e6b30',
      name: 'usdd',
      contractAddress: '0x0c10bf8fcb7bf5412187a595ab97a3609160b5c6',
      features: [...ACCOUNT_COIN_DEFAULT_FEATURES, CoinFeature.STABLECOIN] as CoinFeature[],
    },
    offchain: {
      id: 'ba2c8abb-6375-4207-9262-8b907a1dbf1b',
      name: 'ofcusdd',
      features: [CoinFeature.STABLECOIN] as CoinFeature[],
    },
  },
  {
    underlyingAsset: UnderlyingAsset.USDE,
    fullName: 'USDe',
    decimalPlaces: 18,
    onchain: {
      id: '7ab504b3-eecc-45ca-8f33-7957cb9e774d',
      name: 'usde',
      contractAddress: '0x4c9edd5852cd905f086c759e8383e09bff1e68b3',
      features: [...ACCOUNT_COIN_DEFAULT_FEATURES, CoinFeature.STABLECOIN] as CoinFeature[],
    },
    offchain: {
      id: 'fb61c76b-ee66-48b6-a0a2-6ec37d03c542',
      name: 'ofcusde',
      features: [CoinFeature.STABLECOIN] as CoinFeature[],
    },
  },
  {
    underlyingAsset: UnderlyingAsset.USDT,
    fullName: 'Tether',
    decimalPlaces: 6,
    onchain: {
      id: 'e1d609f1-eb3f-4b3f-8ef6-87f434a6de83',
      name: 'usdt',
      contractAddress: '0xdac17f958d2ee523a2206206994597c13d831ec7',
      features: [
        ...TOKEN_FEATURES_WITH_SWISS,
        CoinFeature.CUSTODY_BITGO_FRANKFURT,
        CoinFeature.STABLECOIN,
      ] as CoinFeature[],
    },
    offchain: {
      id: 'e30203cd-99c0-4b98-b101-e0cd95a455a9',
      name: 'ofcusdt',
      features: [CoinFeature.STABLECOIN] as CoinFeature[],
    },
  },
  {
    underlyingAsset: UnderlyingAsset.USDX,
    fullName: 'eToro United States Dollar',
    decimalPlaces: 18,
    onchain: {
      id: '7eab6610-5fa7-4a92-8317-c4d143cd58c0',
      name: 'usdx',
      contractAddress: '0x4e3856c37b2fe7ff2fe34510cda82a1dffd63cd0',
      features: [...ACCOUNT_COIN_DEFAULT_FEATURES, CoinFeature.STABLECOIN] as CoinFeature[],
    },
    offchain: {
      id: '64167d0d-e8a5-4f2a-9a0b-98632bcd8816',
      name: 'ofcusdx',
      features: [CoinFeature.STABLECOIN] as CoinFeature[],
    },
  },
  {
    underlyingAsset: UnderlyingAsset.USDY,
    fullName: 'Ondo U.S. Dollar Yield',
    decimalPlaces: 18,
    onchain: {
      id: '28a848d3-0490-4fd6-a1e8-4d1b5dc10966',
      name: 'usdy',
      contractAddress: '0x96f6ef951840721adbf46ac996b59e0235cb985c',
      features: [
        ...AccountCoin.getFeaturesByTypeExcluding(
          [
            CoinFeature.CUSTODY_BITGO_SINGAPORE,
            CoinFeature.CUSTODY_BITGO_GERMANY,
            CoinFeature.CUSTODY_BITGO_EUROPE_APS,
            CoinFeature.CUSTODY_BITGO_FRANKFURT,
          ],
          ETH_FEATURES
        ),
        CoinFeature.STABLECOIN,
      ] as CoinFeature[],
    },
    offchain: {
      id: 'bbe911d8-c900-401c-8dfb-febd98256e75',
      name: 'ofcusdy',
      features: [CoinFeature.STABLECOIN] as CoinFeature[],
    },
  },
  {
    underlyingAsset: UnderlyingAsset.USG,
    fullName: 'US Gold',
    decimalPlaces: 9,
    onchain: {
      id: 'fd8d8929-ebd3-4d12-81bf-5b8183206741',
      name: 'usg',
      contractAddress: '0x4000369acfa25c8fe5d17fe3312e30c332bef633',
    },
    offchain: {
      id: 'fd6f7e4e-3a5e-4868-91af-399b8e4d76dd',
      name: 'ofcusg',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.USPX,
    fullName: 'USPX Token',
    decimalPlaces: 0,
    onchain: {
      id: 'e0a1a19a-82b1-4344-b535-7b44b8f16feb',
      name: 'uspx',
      contractAddress: '0x38d3d9abbdba8305ebb8b72996efe55bf785aed0',
    },
    offchain: {
      id: '7e1bc370-f226-4111-b51b-a3dd8ed54fb7',
      name: 'ofcuspx',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.UST,
    fullName: 'TerraUSD',
    decimalPlaces: 18,
    onchain: {
      id: '9a985e38-8965-445a-8ca3-94ce5193645f',
      name: 'ust',
      contractAddress: '0xa47c8bf37f92abed4a126bda807a7b7498661acd',
      features: [
        ...AccountCoin.getFeaturesByTypeExcluding(
          [
            CoinFeature.CUSTODY_BITGO_GERMANY,
            CoinFeature.CUSTODY_BITGO_EUROPE_APS,
            CoinFeature.CUSTODY_BITGO_FRANKFURT,
            CoinFeature.CUSTODY_BITGO_SINGAPORE,
          ],
          ETH_FEATURES
        ),
        CoinFeature.STABLECOIN,
      ] as CoinFeature[],
    },
    offchain: {
      id: 'd5b18be0-8263-4729-84fe-57501c848e29',
      name: 'ofcust',
      features: [CoinFeature.STABLECOIN] as CoinFeature[],
    },
  },
  {
    underlyingAsset: UnderlyingAsset.USTB,
    fullName: 'Superstate Short Duration US Government Securities Fund',
    decimalPlaces: 6,
    onchain: {
      id: 'dee69d23-5898-45e4-89e7-ea90e02856e0',
      name: 'ustb',
      contractAddress: '0x43415eb6ff9db7e26a15b704e7a3edce97d31c4e',
      features: AccountCoin.getFeaturesByTypeExcluding(
        [
          CoinFeature.CUSTODY_BITGO_SINGAPORE,
          CoinFeature.CUSTODY_BITGO_GERMANY,
          CoinFeature.CUSTODY_BITGO_EUROPE_APS,
          CoinFeature.CUSTODY_BITGO_FRANKFURT,
        ],
        ETH_FEATURES
      ) as CoinFeature[],
    },
    offchain: {
      id: 'baded9c2-d530-4188-b35d-2fd00cf6ee2e',
      name: 'ofcustb',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.USX,
    fullName: 'USD Stable Token',
    decimalPlaces: 18,
    onchain: {
      id: '072bda2d-3c21-40a8-8581-0518b75bace1',
      name: 'usx',
      contractAddress: '0xe72f4c4ff9d294fc34829947e4371da306f90465',
      features: [...ACCOUNT_COIN_DEFAULT_FEATURES, CoinFeature.STABLECOIN] as CoinFeature[],
    },
    offchain: {
      id: 'f55ca795-c8ed-4e8f-b137-bf74b5868503',
      name: 'ofcusx',
      features: [CoinFeature.STABLECOIN] as CoinFeature[],
    },
  },
  {
    underlyingAsset: UnderlyingAsset.USYC,
    fullName: 'US Yield Coin',
    decimalPlaces: 6,
    onchain: {
      id: '4fa85b68-95e3-4c92-a921-fe86d3bdc4c0',
      name: 'usyc',
      contractAddress: '0x136471a34f6ef19fe571effc1ca711fdb8e49f2b',
      features: AccountCoin.getFeaturesByTypeExcluding(
        [
          CoinFeature.CUSTODY_BITGO_SINGAPORE,
          CoinFeature.CUSTODY_BITGO_GERMANY,
          CoinFeature.CUSTODY_BITGO_EUROPE_APS,
          CoinFeature.CUSTODY_BITGO_FRANKFURT,
        ],
        ETH_FEATURES
      ) as CoinFeature[],
    },
    offchain: {
      id: 'e0142e63-a344-49df-a671-bca12013d88c',
      name: 'ofcusyc',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.UTK,
    fullName: 'UTrust',
    decimalPlaces: 18,
    onchain: {
      id: 'ef825ff6-4304-415b-a202-5cfe60e343b4',
      name: 'utk',
      contractAddress: '0x70a72833d6bf7f508c8224ce59ea1ef3d0ea3a38',
    },
    offchain: {
      id: 'c7f9e986-8eb8-445f-b2d2-b029428024c5',
      name: 'ofcutk',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.UTK1,
    fullName: 'UTrust Token',
    decimalPlaces: 18,
    onchain: {
      id: '246960dd-2735-4b13-8fe1-cc5aa8c8e4b0',
      name: 'utk1',
      contractAddress: '0xdc9ac3c20d1ed0b540df9b1fedc10039df13f99c',
    },
    offchain: {
      id: '59815a51-0298-43bf-9e7c-8aa58ba4d725',
      name: 'ofcutk1',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.VCORE,
    fullName: 'VCORE',
    decimalPlaces: 18,
    onchain: {
      id: 'cb6fd4f8-b74b-4ecc-94ef-6c233781f9b4',
      name: 'vcore',
      contractAddress: '0x733b5056a0697e7a4357305fe452999a0c409feb',
    },
    offchain: {
      id: '2291a3a1-5dff-4009-9315-f1ba8ae55c8e',
      name: 'ofcvcore',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.VALOR,
    fullName: 'ValorToken',
    decimalPlaces: 18,
    onchain: {
      id: '999583a7-19e0-41b6-86a6-aa115a03b29d',
      name: 'valor',
      contractAddress: '0x297e4e5e59ad72b1b0a2fd446929e76117be0e0a',
    },
    offchain: {
      id: '6a6e8f2b-4656-4ec8-9ebb-2b11c5cc065a',
      name: 'ofcvalor',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.VANRY,
    fullName: 'Vanar Chain Token',
    decimalPlaces: 18,
    onchain: {
      id: '6ea2a622-6a9e-4d85-a22b-c2d6878661e5',
      name: 'vanry',
      contractAddress: '0x8de5b80a0c1b02fe4976851d030b36122dbb8624',
    },
    offchain: {
      id: 'bdf9f83a-a062-46ef-9a7e-fcc595b9840e',
      name: 'ofcvanry',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.VDX,
    fullName: 'Vodi X',
    decimalPlaces: 18,
    onchain: {
      id: 'aa407842-9b87-4589-b96d-be3872c59b98',
      name: 'vdx',
      contractAddress: '0x91e64f39c1fe14492e8fdf5a8b0f305bd218c8a1',
    },
    offchain: {
      id: 'fa37f138-e9c7-480a-8fe6-97f1fdee3c37',
      name: 'ofcvdx',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.VEC,
    fullName: 'Vector',
    decimalPlaces: 9,
    onchain: {
      id: '484816ec-2954-4c05-bd33-2ec940c08260',
      name: 'vec',
      contractAddress: '0x1bb9b64927e0c5e207c9db4093b3738eef5d8447',
      features: [
        ...ACCOUNT_COIN_DEFAULT_FEATURES_EXCLUDE_SINGAPORE_AND_MENA_FZE,
        CoinFeature.BULK_TRANSACTION,
      ] as CoinFeature[],
    },
    offchain: {
      id: '3f539d23-cb30-46f7-9e4a-43abd107473b',
      name: 'ofcvec',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.VEGA,
    fullName: 'Vega Protocol',
    decimalPlaces: 18,
    onchain: {
      id: 'c0fe9fe3-a242-452e-95e2-56ba38a40d56',
      name: 'vega',
      contractAddress: '0xcb84d72e61e383767c4dfeb2d8ff7f4fb89abc6e',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: '5ba751a3-23c1-47d7-a8c1-0f5a94866fc8',
      name: 'ofcvega',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.VEXT,
    fullName: 'Veloce',
    decimalPlaces: 18,
    onchain: {
      id: '2afb510c-8932-4baf-822d-fb1b3a70a5bd',
      name: 'vext',
      contractAddress: '0xb2492e97a68a6e4b9e9a11b99f6c42e5accd38c7',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: '29122cf0-be81-407c-87bc-8b323928cb22',
      name: 'ofcvext',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.VGX,
    fullName: 'Voyager Token',
    decimalPlaces: 8,
    onchain: {
      id: '00dd6c84-9651-45ba-9f05-f3c15cf83554',
      name: 'vgx',
      contractAddress: '0x3c4b6e6e1ea3d4863700d7f76b36b7f3d3f13e3d',
    },
    offchain: {
      id: '9e95f66e-9cc8-4f0e-9e7b-efd9d16e3ea9',
      name: 'ofcvgx',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.VIB,
    fullName: 'VIB',
    decimalPlaces: 18,
    onchain: {
      id: 'eb33dfaa-0dd8-45c4-91a3-5d4b16016ceb',
      name: 'vib',
      contractAddress: '0x2c974b2d0ba1716e644c1fc59982a89ddd2ff724',
    },
    offchain: {
      id: 'ff6abefd-3d65-46e8-b9e7-68041f528aaa',
      name: 'ofcvib',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.VIC,
    fullName: 'Viction',
    decimalPlaces: 18,
    onchain: {
      id: 'b1e84e84-96f9-4ac0-8f01-37a20202802d',
      name: 'vic',
      contractAddress: '0x05d3606d5c81eb9b7b18530995ec9b29da05faba',
    },
    offchain: {
      id: 'f287d703-f0a1-436b-a273-324937cf78ba',
      name: 'ofcvic',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.VIDT,
    fullName: 'VIDT DAO',
    decimalPlaces: 18,
    onchain: {
      id: 'd97452e6-3fcb-45ea-8301-e71f795d2667',
      name: 'vidt',
      contractAddress: '0x3be7bf1a5f23bd8336787d0289b70602f1940875',
    },
    offchain: {
      id: '89cc6c4a-f33a-4c49-bf14-68d324f105e1',
      name: 'ofcvidt',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.VISR,
    fullName: 'Visor.Finance',
    decimalPlaces: 18,
    onchain: {
      id: '2bea7a06-1fcb-4936-bd4c-5f175a8bf9ff',
      name: 'visr',
      contractAddress: '0xf938424f7210f31df2aee3011291b658f872e91e',
    },
    offchain: {
      id: 'e38da79f-1e7c-441b-a6ff-08a489230a02',
      name: 'ofcvisr',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.VRGX,
    fullName: 'VroomGo',
    decimalPlaces: 8,
    onchain: {
      id: '2dfd512a-5b00-41be-be9f-86c16bea158a',
      name: 'vrgx',
      contractAddress: '0x4861b1a0ead261897174fd849ca0f5154fcf2442',
      features: [
        ...ACCOUNT_COIN_DEFAULT_FEATURES_EXCLUDE_SINGAPORE_AND_MENA_FZE,
        CoinFeature.BULK_TRANSACTION,
      ] as CoinFeature[],
    },
    offchain: {
      id: 'a74faf6f-8639-4b4b-860d-37116b1b7db6',
      name: 'ofcvrgx',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.VRTX,
    fullName: 'Vertex Protocol',
    decimalPlaces: 18,
    onchain: {
      id: '2e3fa047-1765-480b-ab11-87618c3d78a4',
      name: 'vrtx',
      contractAddress: '0xbbee07b3e8121227afcfe1e2b82772246226128e',
    },
    offchain: {
      id: 'bc97ec5a-cdba-48aa-a76b-911830a39ab1',
      name: 'ofcvrtx',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.VXC,
    fullName: 'Vinx Coin',
    decimalPlaces: 18,
    onchain: {
      id: '56e5abc8-a5d5-4383-9c5c-c5f680538d77',
      name: 'vxc',
      contractAddress: '0x14f0a12a43c36c49d4b403dd6e1a9b8222be456c',
      features: AccountCoin.getFeaturesByTypeExcluding(
        [
          CoinFeature.CUSTODY_BITGO_SINGAPORE,
          CoinFeature.CUSTODY_BITGO_GERMANY,
          CoinFeature.CUSTODY_BITGO_EUROPE_APS,
          CoinFeature.CUSTODY_BITGO_FRANKFURT,
        ],
        ETH_FEATURES
      ) as CoinFeature[],
    },
    offchain: {
      id: '6a8cef77-6375-4dfa-aba9-9ef10c1cc98f',
      name: 'ofcvxc',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.VSP,
    fullName: 'Vesper Token',
    decimalPlaces: 18,
    onchain: {
      id: '7733a50f-b06b-4ea2-94bb-d5a6c2999dc2',
      name: 'vsp',
      contractAddress: '0x1b40183efb4dd766f11bda7a7c3ad8982e998421',
    },
    offchain: {
      id: '7a7813eb-7b28-4942-bf8d-1075c2b9b3b1',
      name: 'ofcvsp',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.WAFL,
    fullName: 'Wafl Token',
    decimalPlaces: 18,
    onchain: {
      id: '6b40eeee-158c-4bc7-bbcd-dd5f03a7401e',
      name: 'wafl',
      contractAddress: '0x3fee076a0f0218899b89fe7e3f54dd2dc18917e0',
      features: [
        ...ACCOUNT_COIN_DEFAULT_FEATURES_EXCLUDE_SINGAPORE_AND_MENA_FZE,
        CoinFeature.BULK_TRANSACTION,
      ] as CoinFeature[],
    },
    offchain: {
      id: 'bd372f7d-04a1-44ee-b52b-3abef056d439',
      name: 'ofcwafl',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.WAX,
    fullName: 'Wax',
    decimalPlaces: 8,
    onchain: {
      id: '4c479a99-bd52-44fa-a5b1-155e0c921743',
      name: 'wax',
      contractAddress: '0x39bb259f66e1c59d5abef88375979b4d20d98022',
    },
    offchain: {
      id: '598eee5a-d3ce-4196-aa7f-6637da58a22a',
      name: 'ofcwax',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.WABI,
    fullName: 'Tael Token',
    decimalPlaces: 18,
    onchain: {
      id: '2e1295ca-e60d-4d57-a2f9-89a3a12240da',
      name: 'wabi',
      contractAddress: '0x286bda1413a2df81731d4930ce2f862a35a609fe',
    },
    offchain: {
      id: 'd3688a11-e089-4304-838c-187add59ab14',
      name: 'ofcwabi',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.WAVES,
    fullName: 'WAVES',
    decimalPlaces: 18,
    onchain: {
      id: '549d68f1-19f1-442e-bb53-a6c543582fd1',
      name: 'waves',
      contractAddress: '0x1cf4592ebffd730c7dc92c1bdffdfc3b9efcf29a',
    },
    offchain: {
      id: '803d6e89-510f-4cca-b501-135fd4494574',
      name: 'ofcwaves',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.WTK,
    fullName: 'WadzPay Token',
    decimalPlaces: 18,
    onchain: {
      id: 'babb1679-d799-42c5-ae23-3923b2818f5a',
      name: 'wtk',
      contractAddress: '0x4cff49d0a19ed6ff845a9122fa912abcfb1f68a6',
    },
    offchain: {
      id: '3338c016-91bc-494a-ab32-152ed5198e1b',
      name: 'ofcwtk',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.WBNB,
    fullName: 'Wrapped BNB',
    decimalPlaces: 18,
    onchain: {
      id: '528f2bdf-3081-4efc-a01d-ddec9d1e2805',
      name: 'wbnb',
      contractAddress: '0x418d75f65a02b3d53b2418fb8e1fe493759c7605',
    },
    offchain: {
      id: '363db052-19c5-4d6c-95bf-c3ef0eee2ee0',
      name: 'ofcwbnb',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.WECAN,
    fullName: 'Wecan Group',
    decimalPlaces: 18,
    onchain: {
      id: 'e2da899c-48f5-4ae6-a890-9a71eaff138c',
      name: 'wecan',
      contractAddress: '0xea60cd69f2b9fd6eb067bddbbf86a5bdeffbbc55',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: '15f874d0-6d1d-471d-9a43-f1a899c28d20',
      name: 'ofcwecan',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.WBTC,
    fullName: 'Wrapped Bitcoin',
    decimalPlaces: 8,
    onchain: {
      id: 'c758d712-e38f-41e5-aee9-db575fce7c73',
      name: 'wbtc',
      contractAddress: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: 'dec90842-ca08-417e-9cb0-89723cc50b77',
      name: 'ofcwbtc',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.WDOGE,
    fullName: 'Wrapped DOGE',
    decimalPlaces: 8,
    onchain: {
      id: 'f8a56e2b-55ae-4dc2-9fbc-2b1b162536a2',
      name: 'wdoge',
      contractAddress: '0x8aa9381b2544b48c26f3b850f6e07e2c5161eb3e',
    },
    offchain: {
      id: '614455ea-8188-4060-a422-0e5d48cec391',
      name: 'ofcwdoge',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.WCFG,
    fullName: 'Wrapped Centrifuge',
    decimalPlaces: 18,
    onchain: {
      id: '4c9d49e9-80aa-4291-b5b3-ff87d4b6c214',
      name: 'wcfg',
      contractAddress: '0xc221b7e65ffc80de234bbb6667abdd46593d34f0',
    },
    offchain: {
      id: '0d1b2c19-140b-4d5c-876d-985641b35665',
      name: 'ofcwcfg',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.WEC,
    fullName: 'Whole Earth Coin ',
    decimalPlaces: 18,
    onchain: {
      id: '425b0685-1b90-4dd8-a013-2176d0612418',
      name: 'wec',
      contractAddress: '0xcc1a8bd438bebc4b2a885a34475bb974f2124317',
    },
    offchain: {
      id: '616d4bcf-1b88-4da0-a810-ddb8ec0f5c40',
      name: 'ofcwec',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.WET,
    fullName: 'We Show Token',
    decimalPlaces: 18,
    onchain: {
      id: 'c6f4c964-69e1-47ac-938e-9d67683a8ea0',
      name: 'wet',
      contractAddress: '0x36d10c6800d569bb8c4fe284a05ffe3b752f972c',
      features: [
        ...ACCOUNT_COIN_DEFAULT_FEATURES_EXCLUDE_SINGAPORE_AND_MENA_FZE,
        CoinFeature.BULK_TRANSACTION,
      ] as CoinFeature[],
    },
    offchain: {
      id: '18fcc015-544d-4d6a-967f-0f97796e82ec',
      name: 'ofcwet',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.WETH,
    fullName: 'Wrapped Ether',
    decimalPlaces: 18,
    onchain: {
      id: '77303c92-c191-41aa-aafb-0515dafb149e',
      name: 'weth',
      contractAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
      features: WETH_FEATURES as CoinFeature[],
    },
    offchain: {
      id: 'b73b5bc1-1738-439b-a0d4-2c1880898ac5',
      name: 'ofcweth',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.WEETH,
    fullName: 'Wrapped eETH',
    decimalPlaces: 18,
    onchain: {
      id: 'e59ca3be-86ac-4aa5-8732-c9a3adb3219f',
      name: 'weeth',
      contractAddress: '0xcd5fe23c85820f7b72d0926fc9b05b43e359b7ee',
      features: AccountCoin.DEFAULT_FEATURES_EXCLUDE_SINGAPORE as CoinFeature[],
    },
    offchain: {
      id: 'ac9dbbca-a180-48f1-9c01-afc5446bd7f0',
      name: 'ofcweeth',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.WFLOW,
    fullName: 'Wrapped Flow',
    decimalPlaces: 18,
    onchain: {
      id: '7292b88e-0a4d-4044-ba0a-caea267a0bea',
      name: 'wflow',
      contractAddress: '0x5c147e74d63b1d31aa3fd78eb229b65161983b2b',
    },
    offchain: {
      id: '4bf68602-cbba-41a8-bdbc-6db4fc1b66a6',
      name: 'ofcwflow',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.WHALE,
    fullName: 'WHALE',
    decimalPlaces: 4,
    onchain: {
      id: 'b3cf801c-5724-4581-9013-2c3650350d52',
      name: 'whale',
      contractAddress: '0x9355372396e3f6daf13359b7b607a3374cc638e0',
    },
    offchain: {
      id: '6f31d5d3-8707-4262-b46d-aeafce299053',
      name: 'ofcwhale',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.WHT,
    fullName: 'Whatshalal',
    decimalPlaces: 18,
    onchain: {
      id: '301ce00f-322b-4856-9bea-23636d626b56',
      name: 'wht',
      contractAddress: '0xae8d4da01658dd0ac118dde60f5b78042d0da7f2',
      features: [
        ...ACCOUNT_COIN_DEFAULT_FEATURES_EXCLUDE_SINGAPORE_AND_MENA_FZE,
        CoinFeature.BULK_TRANSACTION,
      ] as CoinFeature[],
    },
    offchain: {
      id: 'a26f71d5-1c28-4b5d-adc0-a1f18fdea0f6',
      name: 'ofcwht',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.WILD,
    fullName: 'Wilder World',
    decimalPlaces: 18,
    onchain: {
      id: '451d4bb5-e7c3-4899-8838-b71b33375cee',
      name: 'wild',
      contractAddress: '0x2a3bff78b79a009976eea096a51a948a3dc00e34',
    },
    offchain: {
      id: '3dd7a8b9-01d4-4ca3-9d18-0128a70333ef',
      name: 'ofcwild',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.WING,
    fullName: 'Wing Finance',
    decimalPlaces: 9,
    onchain: {
      id: 'b385c519-0625-4ea8-9cb1-88413720cc41',
      name: 'wing',
      contractAddress: '0xdb0f18081b505a7de20b18ac41856bcb4ba86a1a',
    },
    offchain: {
      id: 'bc77ca4c-d207-48a9-9910-2f82a616b7d6',
      name: 'ofcwing',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.WNXM,
    fullName: 'Wrapped NXM',
    decimalPlaces: 18,
    onchain: {
      id: '75d07bfd-5d77-47df-a151-d2ee8dddb170',
      name: 'wnxm',
      contractAddress: '0x0d438f3b5175bebc262bf23753c1e53d03432bde',
    },
    offchain: {
      id: '1794e700-4c78-4f84-a421-dc0efe2b8505',
      name: 'ofcwnxm',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.WLD,
    fullName: 'Worldcoin',
    decimalPlaces: 18,
    onchain: {
      id: '90575654-b796-4ba5-8acf-dd381f7b3e9b',
      name: 'wld',
      contractAddress: '0x163f8c2467924be0ae7b5347228cabf260318753',
      features: [...ETH_FEATURES_WITH_FRANKFURT, CoinFeature.BULK_TRANSACTION] as CoinFeature[],
    },
    offchain: {
      id: 'c93ded62-7a1a-4dd1-8398-0e68106f5009',
      name: 'ofcwld',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.WLUNA,
    fullName: 'Wrapped Luna',
    decimalPlaces: 18,
    onchain: {
      id: '9a5fada5-5f91-494b-bab5-8781d831fcd0',
      name: 'wluna',
      contractAddress: '0xd2877702675e6ceb975b4a1dff9fb7baf4c91ea9',
      features: AccountCoin.getFeaturesByTypeExcluding(
        [
          CoinFeature.CUSTODY_BITGO_GERMANY,
          CoinFeature.CUSTODY_BITGO_EUROPE_APS,
          CoinFeature.CUSTODY_BITGO_FRANKFURT,
          CoinFeature.CUSTODY_BITGO_SINGAPORE,
          CoinFeature.CUSTODY_BITGO_CUSTODY_MENA_FZE,
        ],
        ETH_FEATURES
      ) as CoinFeature[],
    },
    offchain: {
      id: '46605bd9-b8ec-43ef-ba20-d4637cf87081',
      name: 'ofcwluna',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.WLXT,
    fullName: 'Wallex Token',
    decimalPlaces: 18,
    onchain: {
      id: '85b43771-485b-499d-ae2b-209c398497b5',
      name: 'wlxt',
      contractAddress: '0x1fd389ac8e6c958b0f01067540fdff8a11488201',
    },
    offchain: {
      id: 'c07fbda0-c47e-4311-a918-e58450569e32',
      name: 'ofcwlxt',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.WROSE,
    fullName: 'Wrapped ROSE (Wormhole)',
    decimalPlaces: 18,
    onchain: {
      id: '383ecdfb-4098-44f0-8485-d67aa9ad1d24',
      name: 'wrose',
      contractAddress: '0x26b80fbfc01b71495f477d5237071242e0d959d7',
      features: AccountCoin.getFeaturesByTypeExcluding(
        [CoinFeature.CUSTODY_BITGO_GERMANY, CoinFeature.CUSTODY_BITGO_EUROPE_APS, CoinFeature.CUSTODY_BITGO_FRANKFURT],
        ETH_FEATURES
      ) as CoinFeature[],
    },
    offchain: {
      id: '89bcb9b8-5f24-404a-8172-361af081f786',
      name: 'ofcwrose',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.WOO,
    fullName: 'Wootrade Network',
    decimalPlaces: 18,
    onchain: {
      id: '0886bf8b-507e-459f-a38c-bdcd3f492190',
      name: 'woo',
      contractAddress: '0x4691937a7508860f876c9c0a2a617e7d9e945d4b',
    },
    offchain: {
      id: '442030fc-5b0d-4678-8c7f-d266f363e31a',
      name: 'ofcwoo',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.WSTETH,
    fullName: 'Wrapped stETH',
    decimalPlaces: 18,
    onchain: {
      id: 'c24f557c-ac40-4846-aa8f-15501032dadc',
      name: 'wsteth',
      contractAddress: '0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0',
      features: AccountCoin.DEFAULT_FEATURES_EXCLUDE_SINGAPORE as CoinFeature[],
    },
    offchain: {
      id: 'd46dc5ab-9c36-4591-b973-0175c2f4cdb5',
      name: 'ofcwsteth',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.WPX,
    fullName: 'WalletPlusX',
    decimalPlaces: 18,
    onchain: {
      id: '2caacc37-cebc-488a-9367-5aa501add555',
      name: 'wpx',
      contractAddress: '0x4bb0a085db8cedf43344bd2fbec83c2c79c4e76b',
      features: [
        ...ACCOUNT_COIN_DEFAULT_FEATURES_EXCLUDE_SINGAPORE_AND_MENA_FZE,
        CoinFeature.BULK_TRANSACTION,
      ] as CoinFeature[],
    },
    offchain: {
      id: 'f770ed88-ae62-4af2-a995-ed11ee078e7b',
      name: 'ofcwpx',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.WTAO,
    fullName: 'Wrapped BitTensor',
    decimalPlaces: 9,
    onchain: {
      id: '5d8b899f-bc1b-4ec2-88e6-d946cbb8d476',
      name: 'wtao',
      contractAddress: '0x77e06c9eccf2e797fd462a92b6d7642ef85b0a44',
    },
    offchain: {
      id: 'adee2169-99da-4092-aa07-04090b2dbb83',
      name: 'ofcwtao',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.WTC,
    fullName: 'Walton Token',
    decimalPlaces: 18,
    onchain: {
      id: '30de14a3-4caa-462d-a7d2-8756f6921165',
      name: 'wtc',
      contractAddress: '0xb7cb1c96db6b22b0d3d9536e0108d062bd488f74',
    },
    offchain: {
      id: '04446d12-fae2-4312-81f4-b3ada702bd04',
      name: 'ofcwtc',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.WTGXX,
    fullName: 'WisdomTree Government Money Market Digital Fund',
    decimalPlaces: 18,
    onchain: {
      id: '60eded7e-3aac-4cb8-943c-c3c3d88dfe5c',
      name: 'wtgxx',
      contractAddress: '0x1fecf3d9d4fee7f2c02917a66028a48c6706c179',
      features: AccountCoin.DEFAULT_FEATURES_EXCLUDE_SINGAPORE as CoinFeature[],
    },
    offchain: {
      id: '11fcfe02-bb25-4900-9600-6749dffb1f60',
      name: 'ofcwtgxx',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.WUSDM,
    fullName: 'Wrapped Mountain USD',
    decimalPlaces: 18,
    onchain: {
      id: 'acf1b526-75e0-47f8-b812-32893f85b180',
      name: 'wusdm',
      contractAddress: '0x57f5e098cad7a3d1eed53991d4d66c45c9af7812',
    },
    offchain: {
      id: 'b0206d79-8113-4d3a-a72f-0a50117aa628',
      name: 'ofcwusdm',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.WXRPV0,
    fullName: 'Wrapped XRP',
    decimalPlaces: 6,
    onchain: {
      id: '5e335386-e4db-45bc-b743-97fd6085330d',
      name: 'wxrpv0',
      contractAddress: '0xda7e5a3841550a5ba271dcc76a885af902142dfc',
    },
    offchain: {
      id: '1dfdd971-82b3-42c9-a552-219a81d8ea8b',
      name: 'ofcwxrpv0',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.WXRP,
    fullName: 'Wrapped XRP',
    decimalPlaces: 18,
    onchain: {
      id: 'aef8b450-02d8-49a9-b049-f47da7a18704',
      name: 'wxrp',
      contractAddress: '0x39fbbabf11738317a448031930706cd3e612e1b9',
    },
    offchain: {
      id: '8b4910cd-ea72-498d-88f9-f1859f818d24',
      name: 'ofcwxrp',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.WXT,
    fullName: 'Wirex',
    decimalPlaces: 18,
    onchain: {
      id: 'bd13fd1e-149d-493a-ac72-85adc650f681',
      name: 'wxt',
      contractAddress: '0xa02120696c7b8fe16c09c749e4598819b2b0e915',
    },
    offchain: {
      id: 'c6a7a05d-c4bf-44e6-b8e8-21ee1c0d2aa7',
      name: 'ofcwxt',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.XAUD,
    fullName: 'XAUD Token',
    decimalPlaces: 5,
    onchain: {
      id: '7608346d-fd5b-461e-b19a-6110f84f5d8e',
      name: 'xaud',
      contractAddress: '0x1185a1b58bdd774a36cc9598c5e3531dfeb1b736',
    },
    offchain: {
      id: '2c6403f7-098d-40f8-8643-928597974c29',
      name: 'ofcxaud',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.XAUT,
    fullName: 'Tether Gold',
    decimalPlaces: 6,
    onchain: {
      id: '404d340e-d914-40d1-9cf8-2d79d2e2c6dd',
      name: 'xaut',
      contractAddress: '0x68749665ff8d2d112fa859aa293f07a622782f38',
    },
    offchain: {
      id: 'bb36fbf3-ec3a-4233-80c1-18091d215756',
      name: 'ofcxaut',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.XBGOLD,
    fullName: 'XBullion Token',
    decimalPlaces: 8,
    onchain: {
      id: 'cc4b086a-c821-455f-9db6-783e072015fd',
      name: 'xbgold',
      contractAddress: '0x670f9d9a26d3d42030794ff035d35a67aa092ead',
      features: AccountCoin.getFeaturesByTypeExcluding(
        [
          CoinFeature.CUSTODY_BITGO_GERMANY,
          CoinFeature.CUSTODY_BITGO_EUROPE_APS,
          CoinFeature.CUSTODY_BITGO_FRANKFURT,
          CoinFeature.CUSTODY_BITGO_SINGAPORE,
          CoinFeature.CUSTODY_BITGO_MENA_FZE,
        ],
        ETH_FEATURES
      ) as CoinFeature[],
    },
    offchain: {
      id: '9b700833-b6eb-4d7f-9b78-2a79783a8c7c',
      name: 'ofcxbgold',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.XCD,
    fullName: 'CapdaxToken',
    decimalPlaces: 18,
    onchain: {
      id: 'fd1bfef9-39d0-40eb-b15a-f9eccc1824e5',
      name: 'xcd',
      contractAddress: '0xca00bc15f67ebea4b20dfaaa847cace113cc5501',
      features: [
        ...ACCOUNT_COIN_DEFAULT_FEATURES_EXCLUDE_SINGAPORE_AND_MENA_FZE,
        CoinFeature.BULK_TRANSACTION,
      ] as CoinFeature[],
    },
    offchain: {
      id: 'c0813fc1-8921-4746-ac1d-460cdaad4529',
      name: 'ofcxcd',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.XCHNG,
    fullName: 'Chainge',
    decimalPlaces: 18,
    onchain: {
      id: '458bbf8e-6996-4a8c-8d33-612c2b8c8abe',
      name: 'xchng',
      contractAddress: '0xb712d62fe84258292d1961b5150a19bc4ab49026',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: '84640b02-7ee6-4015-85f6-2439b9e1401e',
      name: 'ofcxchng',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.XEX,
    fullName: 'Cross Exchange Token',
    decimalPlaces: 18,
    onchain: {
      id: '9d696529-40f9-4b59-9960-447cc85d4663',
      name: 'xex',
      contractAddress: '0xbf68b3756f82b522588511da682dfd7e3bf34dee',
    },
    offchain: {
      id: 'f6daf404-8e26-49bd-aca1-fd7a1c8aff6e',
      name: 'ofcxex',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.XRL,
    fullName: 'Rialto',
    decimalPlaces: 9,
    onchain: {
      id: '93591245-c3c3-45b3-a81c-edd6168fb929',
      name: 'xrl',
      contractAddress: '0xb24754be79281553dc1adc160ddf5cd9b74361a4',
      features: AccountCoin.getFeaturesByTypeExcluding(
        [
          CoinFeature.CUSTODY_BITGO_SINGAPORE,
          CoinFeature.CUSTODY_BITGO_GERMANY,
          CoinFeature.CUSTODY_BITGO_EUROPE_APS,
          CoinFeature.CUSTODY_BITGO_FRANKFURT,
        ],
        ETH_FEATURES
      ) as CoinFeature[],
    },
    offchain: {
      id: '5e76958b-e2d0-4016-adb7-edb4760e1e06',
      name: 'ofcxrl',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.XSGD,
    fullName: 'StraitsX',
    decimalPlaces: 6,
    onchain: {
      id: '0ef88852-b8d7-4260-818d-e626c913e56f',
      name: 'xsgd',
      contractAddress: '0x70e8de73ce538da2beed35d14187f6959a8eca96',
    },
    offchain: {
      id: '5ad50deb-a5ae-4fd9-b838-805542074cb1',
      name: 'ofcxsgd',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.XSUSHI,
    fullName: 'xSUSHI',
    decimalPlaces: 18,
    onchain: {
      id: 'ed158420-8c18-4e3d-9763-766b3e7b450f',
      name: 'xsushi',
      contractAddress: '0x8798249c2e607446efb7ad49ec89dd1865ff4272',
      features: AccountCoin.getFeaturesByTypeExcluding(
        [
          CoinFeature.CUSTODY_BITGO_SINGAPORE,
          CoinFeature.CUSTODY_BITGO_GERMANY,
          CoinFeature.CUSTODY_BITGO_EUROPE_APS,
          CoinFeature.CUSTODY_BITGO_FRANKFURT,
        ],
        ETH_FEATURES
      ) as CoinFeature[],
    },
    offchain: {
      id: '08da24cf-1420-4361-b10f-5060673ab949',
      name: 'ofcxsushi',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.XTP,
    fullName: 'Tap',
    decimalPlaces: 18,
    onchain: {
      id: '119a1bdc-5571-4945-b4a1-82301758619a',
      name: 'xtp',
      contractAddress: '0x6368e1e18c4c419ddfc608a0bed1ccb87b9250fc',
    },
    offchain: {
      id: '178dd1b9-5c3e-4f86-8997-1ad19cabc41b',
      name: 'ofcxtp',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.YFDAI,
    fullName: 'Yfdai.Finance',
    decimalPlaces: 18,
    onchain: {
      id: 'bccd3d36-f4c0-4906-adf2-3254fdd05ceb',
      name: 'yfdai',
      contractAddress: '0xf4cd3d3fda8d7fd6c5a500203e38640a70bf9577',
    },
    offchain: {
      id: 'ecabb76e-d990-4ce4-bc19-d6261f47fa34',
      name: 'ofcyfdai',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.YFI,
    fullName: 'Yearn.Finance',
    decimalPlaces: 18,
    onchain: {
      id: '9f72cad4-4726-4986-b925-d51d8460b2b6',
      name: 'yfi',
      contractAddress: '0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: '9e836a7c-cbe5-4671-885f-a11a8d66a47e',
      name: 'ofcyfi',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.YFII,
    fullName: 'YFII.Finance',
    decimalPlaces: 18,
    onchain: {
      id: 'f530db9e-112d-4170-bf0f-92b0b377a66f',
      name: 'yfii',
      contractAddress: '0xa1d0e215a23d7030842fc67ce582a6afa3ccab83',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: '56949b83-235e-4791-a9e6-524e0187c777',
      name: 'ofcyfii',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.YGG,
    fullName: 'Yield Guild Games',
    decimalPlaces: 18,
    onchain: {
      id: '5ec6eeae-88b2-41b4-9232-f1d1fe8cc3f8',
      name: 'ygg',
      contractAddress: '0x25f8087ead173b73d6e8b84329989a8eea16cf73',
    },
    offchain: {
      id: '6e11614a-e393-45fb-aa95-30251229a0d6',
      name: 'ofcygg',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.YLD,
    fullName: 'Yld',
    decimalPlaces: 18,
    onchain: {
      id: 'd8bbf2d7-f0d0-48b2-915e-4e98e708d966',
      name: 'yld',
      contractAddress: '0xf94b5c5651c888d928439ab6514b93944eee6f48',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: '7ddee7dc-e6ad-45d6-bdd7-194394c389ff',
      name: 'ofcyld',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.YNG,
    fullName: 'Young Token',
    decimalPlaces: 18,
    onchain: {
      id: '82ebedfd-3f92-4ef9-854b-38be7d506d76',
      name: 'yng',
      contractAddress: '0xa26cbb76156090f4b40a1799a220fc4c946afb3c',
    },
    offchain: {
      id: '7aeba7c3-4a3f-44d4-9b5e-a329869a892f',
      name: 'ofcyng',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.YSEY,
    fullName: 'YSEY Utility Token',
    decimalPlaces: 3,
    onchain: {
      id: '5b2d802c-63fa-4aeb-9504-e805379fe2b9',
      name: 'ysey',
      contractAddress: '0x1358efe5d9bfc2005918c0b2f220a4345c9ee7a3',
    },
    offchain: {
      id: '2bea9868-d2fb-4dab-b072-302f63964bc4',
      name: 'ofcysey',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ZARX,
    fullName: 'eToro South African Rand',
    decimalPlaces: 18,
    onchain: {
      id: 'b25fc59e-d48f-435d-8845-5f1a737ef709',
      name: 'zarx',
      contractAddress: '0x29ec3ff4e1dcad5a207dbd5d14e48073abba0bd3',
    },
    offchain: {
      id: '9ece8154-166e-482e-8bb2-47eb5af48bb9',
      name: 'ofczarx',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ZBU,
    fullName: 'ZEEBU',
    decimalPlaces: 18,
    onchain: {
      id: '17abefe6-d618-4724-be13-8ef13749c2b1',
      name: 'zbu',
      contractAddress: '0x8f9b4525681f3ea6e43b8e0a57bfff86c0a1dd2e',
    },
    offchain: {
      id: '04888613-b8e8-4b41-a274-4795eb7b6ce2',
      name: 'ofczbu',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ZBUV2,
    fullName: 'Zeebu (v2)',
    decimalPlaces: 18,
    onchain: {
      id: '9224cc18-b067-4502-a23a-d5c3c4d15da2',
      name: 'zbuv2',
      contractAddress: '0xe77f6acd24185e149e329c1c0f479201b9ec2f4b',
    },
    offchain: {
      id: 'cfe9cf73-0212-4ebb-96a9-e3c01a9d9360',
      name: 'ofczbuv2',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ZCO,
    fullName: 'Zebi Coin',
    decimalPlaces: 8,
    onchain: {
      id: 'c0c239c6-484f-46a9-8454-06c19504ddea',
      name: 'zco',
      contractAddress: '0x2008e3057bd734e10ad13c9eae45ff132abc1722',
      features: AccountCoin.getFeaturesByTypeExcluding(
        [CoinFeature.CUSTODY_BITGO_GERMANY, CoinFeature.CUSTODY_BITGO_EUROPE_APS, CoinFeature.CUSTODY_BITGO_FRANKFURT],
        ETH_FEATURES
      ) as CoinFeature[],
    },
    offchain: {
      id: '8892c6d4-dcd8-4087-abb7-24790f69583e',
      name: 'ofczco',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ZIL,
    fullName: 'Zilliqa',
    decimalPlaces: 12,
    onchain: {
      id: 'dc67e349-0ccd-4eb5-a756-91144c731e73',
      name: 'zil',
      contractAddress: '0x05f4a42e251f2d52b8ed15e9fedaacfcef1fad27',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: 'e05ffecf-2384-4728-af20-2d31c3abf509',
      name: 'ofczil',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ZIX,
    fullName: 'Zeex Token',
    decimalPlaces: 18,
    onchain: {
      id: '33f1ad20-0e5e-439b-bf8e-dee2e0bf42b1',
      name: 'zix',
      contractAddress: '0xf3c092ca8cd6d3d4ca004dc1d0f1fe8ccab53599',
    },
    offchain: {
      id: 'f959717e-8626-4ca4-8c03-6ee0ad6bb364',
      name: 'ofczix',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ZKL,
    fullName: 'ZKLink',
    decimalPlaces: 18,
    onchain: {
      id: '273ff2f7-c89b-4baf-ab0a-10f0e228d7f4',
      name: 'zkl',
      contractAddress: '0xfc385a1df85660a7e041423db512f779070fcede',
    },
    offchain: {
      id: '6ed057ff-a065-444a-931e-f0ff2ecaeac6',
      name: 'ofczkl',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ZLW,
    fullName: 'Zelwin',
    decimalPlaces: 18,
    onchain: {
      id: '209dfdfa-1549-4251-8eaa-efb70dbf24ce',
      name: 'zlw',
      contractAddress: '0x5319e86f0e41a06e49eb37046b8c11d78bcad68c',
    },
    offchain: {
      id: 'a528f520-dc66-4154-a368-904c9914ff3f',
      name: 'ofczlw',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ZMT,
    fullName: 'Zipmex Token',
    decimalPlaces: 18,
    onchain: {
      id: '02b0a4de-b58c-4965-a55e-b0b75feacac8',
      name: 'zmt',
      contractAddress: '0xaa602de53347579f86b996d2add74bb6f79462b2',
      features: [
        ...ACCOUNT_COIN_DEFAULT_FEATURES_EXCLUDE_SINGAPORE_AND_MENA_FZE,
        CoinFeature.BULK_TRANSACTION,
      ] as CoinFeature[],
    },
    offchain: {
      id: 'e669308b-14c0-4c3e-8c3a-4e12ac9701cf',
      name: 'ofczmt',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ZOOM,
    fullName: 'CoinZoom',
    decimalPlaces: 18,
    onchain: {
      id: 'efbeb8d6-2cc9-46a9-8525-07f934a7f145',
      name: 'zoom',
      contractAddress: '0x69cf3091c91eb72db05e45c76e58225177dea742',
    },
    offchain: {
      id: 'd1ef8829-7f82-4697-8f5e-4430e1c3c851',
      name: 'ofczoom',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ZRX,
    fullName: '0x Token',
    decimalPlaces: 18,
    onchain: {
      id: 'b55c4903-af4c-4c7c-ad43-d4dd68791e25',
      name: 'zrx',
      contractAddress: '0xe41d2489571d322189246dafa5ebde1f4699f498',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: 'd7568822-87a9-475a-8228-479e0efeca41',
      name: 'ofczrx',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ZUSD,
    fullName: 'Z.com Usd',
    decimalPlaces: 6,
    onchain: {
      id: '995b03df-cf87-4ad1-a0c2-32a9d9e6f49d',
      name: 'zusd',
      contractAddress: '0xc56c2b7e71b54d38aab6d52e94a04cbfa8f604fa',
      features: [...ACCOUNT_COIN_DEFAULT_FEATURES, CoinFeature.STABLECOIN] as CoinFeature[],
    },
    offchain: {
      id: '41930258-22df-4edb-80db-912b097c92ec',
      name: 'ofczusd',
      features: [CoinFeature.STABLECOIN] as CoinFeature[],
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ADABEAR,
    fullName: '3X Short Cardano Token',
    decimalPlaces: 18,
    onchain: {
      id: '2795af7b-6e14-46af-85e6-8f794f15b6a3',
      name: 'adabear',
      contractAddress: '0xb3299d4bab93bf04d5b11bc49cd6dfad1f77d23f',
    },
    offchain: {
      id: '5246d956-3dfb-4de2-a5e4-f5d683c451ab',
      name: 'ofcadabear',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ADABULL,
    fullName: '3X Long Cardano Token',
    decimalPlaces: 18,
    onchain: {
      id: '5a4c0d59-404b-4418-a898-403449f56546',
      name: 'adabull',
      contractAddress: '0x43de1145cd22f0a9cc99e51c205e6e81161df6b9',
    },
    offchain: {
      id: 'b7f28fc4-68dd-44f5-a9df-98285cd98dba',
      name: 'ofcadabull',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ALGOBEAR,
    fullName: '3X Short Algorand Token',
    decimalPlaces: 18,
    onchain: {
      id: 'fa1ef7ed-4105-4468-b23c-803ddf628ccb',
      name: 'algobear',
      contractAddress: '0x057fb10e3fec001a40e6b75d3a30b99e23e54107',
    },
    offchain: {
      id: '118308e2-df1c-4f11-92cb-71e552c010ff',
      name: 'ofcalgobear',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ALGOBULL,
    fullName: '3X Long Algorand Token',
    decimalPlaces: 18,
    onchain: {
      id: '59338813-51b5-495d-9765-f68dccb498ff',
      name: 'algobull',
      contractAddress: '0x584936357d68f5143f12e2e64f0089db93814dad',
    },
    offchain: {
      id: 'a47bf413-921b-4c39-ace1-7699efe23812',
      name: 'ofcalgobull',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ALGOHEDGE,
    fullName: '1X Short Algorand Token',
    decimalPlaces: 18,
    onchain: {
      id: '0d44ab31-5182-4533-8296-e79328990034',
      name: 'algohedge',
      contractAddress: '0xfdc3d57eb7839ca68a2fad7a93799c8e8afa61b7',
    },
    offchain: {
      id: 'a1215b18-643d-4bc2-affa-f948ab96de05',
      name: 'ofcalgohedge',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ALTBEAR,
    fullName: '3X Short Altcoin Index Token',
    decimalPlaces: 18,
    onchain: {
      id: '1cd54466-66e4-4c91-a97e-d040b7b42d04',
      name: 'altbear',
      contractAddress: '0x90b417ab462440cf59767bcf72d0d91ca42f21ed',
    },
    offchain: {
      id: '7b653610-f239-44d3-862f-01667fc9a791',
      name: 'ofcaltbear',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ALTHEDGE,
    fullName: '1X Short Altcoin Index Token',
    decimalPlaces: 18,
    onchain: {
      id: 'add6dcdb-1421-437d-99ff-c6d5a9083cf8',
      name: 'althedge',
      contractAddress: '0x258fec90b7788e60da3bc6f81d5839dc5b36a110',
    },
    offchain: {
      id: 'c1485ecf-8cbe-48cb-875b-b7c21013ad70',
      name: 'ofcalthedge',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ASD,
    fullName: 'AscendEX token',
    decimalPlaces: 18,
    onchain: {
      id: 'f7cd8344-7248-4e40-a06c-258bc23db833',
      name: 'asd',
      contractAddress: '0xff742d05420b6aca4481f635ad8341f81a6300c2',
    },
    offchain: {
      id: 'b8bd240f-cd53-4a43-a59c-7d0c7b56fd3e',
      name: 'ofcasd',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ATOMBEAR,
    fullName: '3X Short Cosmos Token',
    decimalPlaces: 18,
    onchain: {
      id: '924791ae-e688-4106-8637-20786689afb7',
      name: 'atombear',
      contractAddress: '0x3b834a620751a811f65d8f599b3b72617a4418d0',
    },
    offchain: {
      id: 'e3de348e-16a3-434b-a7f5-1a15cb7a5cdb',
      name: 'ofcatombear',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ATOMBULL,
    fullName: '3X Long Cosmos Token',
    decimalPlaces: 18,
    onchain: {
      id: '084e7345-8e13-4fba-84ad-a5a7eba0f129',
      name: 'atombull',
      contractAddress: '0x75f0038b8fbfccafe2ab9a51431658871ba5182c',
    },
    offchain: {
      id: '1f13cd60-9625-4abc-af2a-37a563c32f23',
      name: 'ofcatombull',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BCHBEAR,
    fullName: '3X Short Bitcoin Cash Token',
    decimalPlaces: 18,
    onchain: {
      id: '86a84988-5fd9-40d2-9738-1bef3cca4630',
      name: 'bchbear',
      contractAddress: '0xa9fc65da36064ce545e87690e06f5de10c52c690',
    },
    offchain: {
      id: '827b42c5-7409-4438-9e7e-213abba39978',
      name: 'ofcbchbear',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BCHBULL,
    fullName: '3X Long Bitcoin Cash Token',
    decimalPlaces: 18,
    onchain: {
      id: '4e0e6dd9-e9b8-43b7-ab58-f96676f8200a',
      name: 'bchbull',
      contractAddress: '0x4c133e081dfb5858e39cca74e69bf603d409e57a',
    },
    offchain: {
      id: '8d5d75b3-a6b6-41e4-b5f0-4de84720589a',
      name: 'ofcbchbull',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BCHHEDGE,
    fullName: '1X Short Bitcoin Cash Token',
    decimalPlaces: 18,
    onchain: {
      id: 'a5c78ea2-324c-4841-b433-fc22b0a21067',
      name: 'bchhedge',
      contractAddress: '0x02e88a689fdfb920e7aa6174fb7ab72add3c5694',
    },
    offchain: {
      id: 'a46b8b9c-156b-4a42-895a-53878384370f',
      name: 'ofcbchhedge',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BEAR,
    fullName: '3X Short Bitcoin Token',
    decimalPlaces: 18,
    onchain: {
      id: '869b0ace-820b-43b0-9ed9-d80f7070fa41',
      name: 'bear',
      contractAddress: '0x016ee7373248a80bde1fd6baa001311d233b3cfa',
    },
    offchain: {
      id: 'b3465abb-51db-4d6c-999d-9a8a227c7432',
      name: 'ofcbear',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BNBBEAR,
    fullName: '3X Short BNB Token',
    decimalPlaces: 18,
    onchain: {
      id: '842c7ebc-c894-41d0-97a1-8645c8d7f37a',
      name: 'bnbbear',
      contractAddress: '0x6febdfc0a9d9502c45343fce0df08828def44795',
    },
    offchain: {
      id: '88f19f23-1b6f-4986-9991-be44997940c1',
      name: 'ofcbnbbear',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BNBBULL,
    fullName: '3X Long BNB Token',
    decimalPlaces: 18,
    onchain: {
      id: 'e3df0e0b-399d-46d7-a306-429a68fd0efb',
      name: 'bnbbull',
      contractAddress: '0x9d1a62c2ad99019768b9126fda004a9952853f6e',
    },
    offchain: {
      id: 'b4ef7e18-2c41-4558-8f5d-035f72c06df1',
      name: 'ofcbnbbull',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BNBHEDGE,
    fullName: '1X Short BNB Token',
    decimalPlaces: 18,
    onchain: {
      id: '5da90a3e-1958-4765-bb6d-25d55c72c71e',
      name: 'bnbhedge',
      contractAddress: '0x2840ad41cf25ad58303ba24c416e79dce4161b4f',
    },
    offchain: {
      id: '42a11724-d052-4413-93cf-63533a81b975',
      name: 'ofcbnbhedge',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BSVBEAR,
    fullName: '3X Short Bitcoin SV Token',
    decimalPlaces: 18,
    onchain: {
      id: '1c3c8dd3-0a9d-484b-a603-f7f742626bba',
      name: 'bsvbear',
      contractAddress: '0xce49c3c92b33a1653f34811a9d7e34502bf12b89',
    },
    offchain: {
      id: '40adcad7-8b67-45d1-a7a0-0a46a00b7bc0',
      name: 'ofcbsvbear',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BSVBULL,
    fullName: '3X Long Bitcoin SV Token',
    decimalPlaces: 18,
    onchain: {
      id: 'd3017ad0-5015-41a8-b691-407c121514c3',
      name: 'bsvbull',
      contractAddress: '0x6e13a9e4ae3d0678e511fb6d2ad531fcf0e247bf',
    },
    offchain: {
      id: '755117a4-6715-4a98-a6ad-4ba406be30e4',
      name: 'ofcbsvbull',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BSVHEDGE,
    fullName: '1X Short Bitcoin SV Token',
    decimalPlaces: 18,
    onchain: {
      id: '1a573bb4-d4de-4f2a-aed9-7c0201697054',
      name: 'bsvhedge',
      contractAddress: '0xf6254cd565c5e78dfb0030b0b14d1e6f482a2413',
    },
    offchain: {
      id: '248ffe68-acf9-4263-814b-d18e0eb08a51',
      name: 'ofcbsvhedge',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BTMXBEAR,
    fullName: '3X Short BitMax Token Token',
    decimalPlaces: 18,
    onchain: {
      id: '41a078e2-f679-49e1-b11c-b05110b42f2d',
      name: 'btmxbear',
      contractAddress: '0xdbf637f78624f896b92f801e81f6031b7865ed20',
    },
    offchain: {
      id: '5d187437-9b2c-44f9-a11c-8817c73abebb',
      name: 'ofcbtmxbear',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BVOL,
    fullName: 'Bitcoin Volatility Token',
    decimalPlaces: 18,
    onchain: {
      id: '8e2e24a4-5a3e-4b22-8a91-744f516b8aec',
      name: 'bvol',
      contractAddress: '0x81824663353a9d29b01b2de9dd9a2bb271d298cd',
    },
    offchain: {
      id: '59db6c39-0f40-4990-83c6-1d8fa043d80d',
      name: 'ofcbvol',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.DOGEBEAR,
    fullName: '3X Short Dogecoin Token',
    decimalPlaces: 18,
    onchain: {
      id: '69472dbd-4bbe-478c-b743-b899c0d8f0fc',
      name: 'dogebear',
      contractAddress: '0xf1d32952e2fbb1a91e620b0fd7fbc8a8879a47f3',
    },
    offchain: {
      id: 'b42e553f-3d64-4c42-806b-73057778cdca',
      name: 'ofcdogebear',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.DOGEBULL,
    fullName: '3X Long Dogecoin Token',
    decimalPlaces: 18,
    onchain: {
      id: '54ab08e4-47c2-4b84-bcaf-4b4e40fca492',
      name: 'dogebull',
      contractAddress: '0x7aa6b33fb7f395ddbca7b7a33264a3c799fa626f',
    },
    offchain: {
      id: 'f19be6f1-2bde-4245-8c7a-5e7b06142962',
      name: 'ofcdogebull',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.DRAM,
    fullName: 'DRAM',
    decimalPlaces: 18,
    onchain: {
      id: '1f44b90a-7e1f-4c51-a867-7b5acace0bfd',
      name: 'dram',
      contractAddress: '0x5216409e5266cf520868545d6674d1f0046fdd9e',
    },
    offchain: {
      id: '499d9972-3f3e-4355-b62d-985fb2c7f939',
      name: 'ofcdram',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.DRGNBEAR,
    fullName: '3X Short Dragon Index Token',
    decimalPlaces: 18,
    onchain: {
      id: 'bc888484-f826-4a4c-b99d-e84561c4c5d5',
      name: 'drgnbear',
      contractAddress: '0x223fb5c14c00cfb70cf56bb63c2eef2d74fe1a78',
    },
    offchain: {
      id: '946f2cd3-e188-4a2c-919e-816b4a880746',
      name: 'ofcdrgnbear',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.DRGNBULL,
    fullName: '3X Long Dragon Index Token',
    decimalPlaces: 18,
    onchain: {
      id: '8cdb2a04-0845-4594-86e9-94ae42381743',
      name: 'drgnbull',
      contractAddress: '0x3335f16af9008bfd32f1ee6c2be5d4f84fa0b9da',
    },
    offchain: {
      id: '980a995a-0393-4c68-9b25-5ef2870c10b6',
      name: 'ofcdrgnbull',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.EOSBEAR,
    fullName: '3X Short EOS Token',
    decimalPlaces: 18,
    onchain: {
      id: 'd485f779-a644-4f65-8e8e-b16726776840',
      name: 'eosbear',
      contractAddress: '0x3d3dd61b0f9a558759a21da42166042b114e12d5',
    },
    offchain: {
      id: '80ea04b1-fc40-4938-bd88-322abad68a98',
      name: 'ofceosbear',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.EOSBULL,
    fullName: '3X Long EOS Token',
    decimalPlaces: 18,
    onchain: {
      id: '7f2464a1-f586-4651-9849-0dec1769be20',
      name: 'eosbull',
      contractAddress: '0xead7f3ae4e0bb0d8785852cc37cc9d0b5e75c06a',
    },
    offchain: {
      id: '3bcafe53-72b8-4ef2-a4f7-67ec2e752947',
      name: 'ofceosbull',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.EOSHEDGE,
    fullName: '1X Short EOS Token',
    decimalPlaces: 18,
    onchain: {
      id: 'e9006121-148a-4f59-8b0f-a211fe8c9d4f',
      name: 'eoshedge',
      contractAddress: '0xb38f206615325306dddeb0794a6482486b6b78b8',
    },
    offchain: {
      id: '9658ce33-7bd0-47b0-aff0-ffed61a74145',
      name: 'ofceoshedge',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ETCBEAR,
    fullName: '3X Short Ethereum Classic Token',
    decimalPlaces: 18,
    onchain: {
      id: 'bf025c6f-ff33-49b6-b22e-f0e9209e73ca',
      name: 'etcbear',
      contractAddress: '0xa340f0937a8c00db11c83cc16cec12310160f0b6',
    },
    offchain: {
      id: '6bad0ee5-c484-4258-b21f-5d3eae9915ba',
      name: 'ofcetcbear',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ETCBULL,
    fullName: '3X Long Ethereum Classic Token',
    decimalPlaces: 18,
    onchain: {
      id: 'aaa13733-fc88-4d90-9894-ec18da5ada48',
      name: 'etcbull',
      contractAddress: '0x974c98bc2e82fa18de92b7e697a1d9bd25682e80',
    },
    offchain: {
      id: '6859568c-20a4-4da3-b30a-ec90173e2a44',
      name: 'ofcetcbull',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ETHBEAR,
    fullName: '3X Short Ethereum Token',
    decimalPlaces: 18,
    onchain: {
      id: 'ac25f717-8e8b-4312-90bc-1603d8005feb',
      name: 'ethbear',
      contractAddress: '0x2f5e2c9002c058c063d21a06b6cabb50950130c8',
    },
    offchain: {
      id: '353f2c2d-f8e9-40b0-be8f-3374a2ee740c',
      name: 'ofcethbear',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ETHHEDGE,
    fullName: '1X Short Ethereum Token',
    decimalPlaces: 18,
    onchain: {
      id: '629cc61f-b2ba-4d6d-9786-8c864d94013c',
      name: 'ethhedge',
      contractAddress: '0x10e1e953ddba597011f8bfa806ab0cc3415a622b',
    },
    offchain: {
      id: 'd4edd7d8-749b-4f1a-8ba2-c4d125ecad27',
      name: 'ofcethhedge',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.HEDGE,
    fullName: '1X Short Bitcoin Token',
    decimalPlaces: 18,
    onchain: {
      id: 'e8e152b3-5dcc-4fe9-8aea-77d41ced6939',
      name: 'hedge',
      contractAddress: '0x1fa3bc860bf823d792f04f662f3aa3a500a68814',
    },
    offchain: {
      id: '3d6d4ccd-ffe3-4744-84e0-4d79aca6b431',
      name: 'ofchedge',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.HTBULL,
    fullName: '3X Long Huobi Token Token',
    decimalPlaces: 18,
    onchain: {
      id: '6d304208-8818-4c77-ba02-8caf97a4937e',
      name: 'htbull',
      contractAddress: '0x0d5e2681d2aadc91f7da4146740180a2190f0c79',
    },
    offchain: {
      id: 'd8cc2ee1-3f93-4794-ac95-f037cdf8c738',
      name: 'ofchtbull',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.IBVOL,
    fullName: 'Inverse Bitcoin Volatility Token',
    decimalPlaces: 18,
    onchain: {
      id: '3cc31873-4155-4b74-ad5d-f5a7c65f1e60',
      name: 'ibvol',
      contractAddress: '0x627e2ee3dbda546e168eaaff25a2c5212e4a95a0',
    },
    offchain: {
      id: '34af91bc-61f5-499a-9c1c-d9109c445de1',
      name: 'ofcibvol',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.LINKBEAR,
    fullName: '3X Short Chainlink Token',
    decimalPlaces: 18,
    onchain: {
      id: '5fa9a1be-9d4a-4ab4-b289-ad9407a9f219',
      name: 'linkbear',
      contractAddress: '0xa209ba34c01a2713a4453a656630cc9de8a362bc',
    },
    offchain: {
      id: 'fdca8e6e-8aeb-4a92-862c-a4a435439c99',
      name: 'ofclinkbear',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.LINKBULL,
    fullName: '3X Long Chainlink Token',
    decimalPlaces: 18,
    onchain: {
      id: '6588d885-d2dd-47b3-931c-78eb3c91a9af',
      name: 'linkbull',
      contractAddress: '0x83ad87c988ac0c6277c0c6234cc8108b20bb5d9b',
    },
    offchain: {
      id: 'f46fcb60-7b30-4db1-867d-c63e9881e1b9',
      name: 'ofclinkbull',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.LOWB,
    fullName: 'loser coin',
    decimalPlaces: 18,
    onchain: {
      id: '72dd4fdf-285b-4bb3-96e2-75d8fc4485eb',
      name: 'lowb',
      contractAddress: '0x69e5c11a7c30f0bf84a9faecbd5161aa7a94deca',
    },
    offchain: {
      id: '4a83402c-0861-4c48-bc8b-876a8ef84332',
      name: 'ofclowb',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.LTCBEAR,
    fullName: '3X Short Litecoin Token',
    decimalPlaces: 18,
    onchain: {
      id: 'b6be1f09-3fb7-45bd-8c56-a6dca4d7f2a0',
      name: 'ltcbear',
      contractAddress: '0xb422e605fbd765b80d2c4b5d8196c2f94144438b',
    },
    offchain: {
      id: 'e9efb231-f41b-4c9c-a00e-00e959861ad2',
      name: 'ofcltcbear',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.MATICBEAR,
    fullName: '3X Short Matic Token',
    decimalPlaces: 18,
    onchain: {
      id: '3bd92d36-c8fc-479c-b98e-4c8d1d740a15',
      name: 'maticbear',
      contractAddress: '0xbe893b4c214dbffc17ef1e338fbdb7061ff09237',
    },
    offchain: {
      id: 'f010cee9-f591-4aaf-95a9-9f1df286bc43',
      name: 'ofcmaticbear',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.MATICBULL,
    fullName: '3X Long Matic Token',
    decimalPlaces: 18,
    onchain: {
      id: 'dee3579f-2269-49ab-b6df-7e8519e824aa',
      name: 'maticbull',
      contractAddress: '0x7e03521b9da891ca3f79a8728e2eaeb24886c5f9',
    },
    offchain: {
      id: 'c6568b05-2f30-4773-a556-9925559f78fc',
      name: 'ofcmaticbull',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.OKBBULL,
    fullName: '3X Long OKB Token',
    decimalPlaces: 18,
    onchain: {
      id: '407d26c3-87d2-4336-b11e-d5f77559e621',
      name: 'okbbull',
      contractAddress: '0x8af785687ee8d75114b028997c9ca36b5cc67bc4',
    },
    offchain: {
      id: '653d5e25-3b21-405f-9402-e60dc890605f',
      name: 'ofcokbbull',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.PTU,
    fullName: 'Pintu Token',
    decimalPlaces: 18,
    onchain: {
      id: 'fc2a6b28-33c8-4c23-9313-3bdb64fd91f1',
      name: 'ptu',
      contractAddress: '0xc229c69eb3bb51828d0caa3509a05a51083898dd',
    },
    offchain: {
      id: '9d9a0656-15ab-4f8b-9b46-86e5ce49eec0',
      name: 'ofcptu',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.SOS,
    fullName: 'SOS',
    decimalPlaces: 18,
    onchain: {
      id: '149874e9-6d58-4801-aaca-dbd907bfe289',
      name: 'sos',
      contractAddress: '0x3b484b82567a09e2588a13d54d032153f0c0aee0',
    },
    offchain: {
      id: 'e88792dc-47ad-4afb-9114-cd2968c7c81c',
      name: 'ofcsos',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TOMOBEAR,
    fullName: '3X Short TomoChain Token',
    decimalPlaces: 18,
    onchain: {
      id: 'ace4628a-54b9-49fb-9979-4cc266fd627a',
      name: 'tomobear',
      contractAddress: '0xa1653cb37852249e4f18dfbc473a5ce3f88fa6ad',
    },
    offchain: {
      id: '90429a33-02a0-4902-ac95-79f5dbac0174',
      name: 'ofctomobear',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TOMOBULL,
    fullName: '3X Long TomoChain Token',
    decimalPlaces: 18,
    onchain: {
      id: 'fd48d65c-aba0-4f68-8ad4-790b69227376',
      name: 'tomobull',
      contractAddress: '0xa38920c00d1a5303db538a3ea08da7a779e1f751',
    },
    offchain: {
      id: '21715b3e-c1b0-4cfc-81c1-f67f2d2a0fca',
      name: 'ofctomobull',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TRXBEAR,
    fullName: '3X Short TRX Token',
    decimalPlaces: 18,
    onchain: {
      id: '02623d03-8ba7-4262-8b91-78a3e2715ccb',
      name: 'trxbear',
      contractAddress: '0x86807da5b92d31f67e128771cacb85f3579646ea',
    },
    offchain: {
      id: '271815b0-57ad-4b5d-a9d3-319b06c6b148',
      name: 'ofctrxbear',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TRXBULL,
    fullName: '3X Long TRX Token',
    decimalPlaces: 18,
    onchain: {
      id: '6b3f7848-b2e5-4df7-b10a-83e86f9322b1',
      name: 'trxbull',
      contractAddress: '0xc175e77b04f2341517334ea3ed0b198a01a97383',
    },
    offchain: {
      id: '7835c3bd-95d4-4aa3-ad9b-1dde140cd9ba',
      name: 'ofctrxbull',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TRXHEDGE,
    fullName: '1X Short TRX Token',
    decimalPlaces: 18,
    onchain: {
      id: 'a1f9f92d-c6a5-4de4-a2c9-9a7365013a3e',
      name: 'trxhedge',
      contractAddress: '0xe58c8df0088cf27b26c7d546a9835deacc29496c',
    },
    offchain: {
      id: '21d4f559-8c8a-480c-bdd4-ac7eac3c3ab9',
      name: 'ofctrxhedge',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.XAUTBEAR,
    fullName: '3X Short Tether Gold Token',
    decimalPlaces: 18,
    onchain: {
      id: '0d85c81f-e12f-4efa-895c-ef9f9b5a1a7c',
      name: 'xautbear',
      contractAddress: '0x31cbf205e26ba63296fdbd254a6b1be3ed28ce47',
    },
    offchain: {
      id: '46387ca7-8a96-46e9-89fe-70c21f67e5bf',
      name: 'ofcxautbear',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.XAUTBULL,
    fullName: '3X Long Tether Gold Token',
    decimalPlaces: 18,
    onchain: {
      id: '74050e8d-b504-4f09-a1ba-9aec0d60e79b',
      name: 'xautbull',
      contractAddress: '0xc9287623832668432099cef2ffdef3ced14f4315',
    },
    offchain: {
      id: '6a5e41e2-68f1-4426-b152-4f60cb084287',
      name: 'ofcxautbull',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.XLMBEAR,
    fullName: '3X Short Stellar Token',
    decimalPlaces: 18,
    onchain: {
      id: '86d80481-41b0-4401-b995-48b9510f762b',
      name: 'xlmbear',
      contractAddress: '0x960efd63ae895f165d874e6cc62501fd0e7dc50a',
    },
    offchain: {
      id: 'e607980b-00f9-45a1-b01d-d85bd8d22769',
      name: 'ofcxlmbear',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.XLMBULL,
    fullName: '3X Long Stellar Token',
    decimalPlaces: 18,
    onchain: {
      id: '771b1bd2-e2a7-42d9-9a0d-e35cda3cda03',
      name: 'xlmbull',
      contractAddress: '0x3a43a04d80f9881d88080bf9fa8bb720afb6c966',
    },
    offchain: {
      id: 'c0fc1437-7d5b-436b-b61b-2e796bb1bee4',
      name: 'ofcxlmbull',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.XRPBEAR,
    fullName: '3X Short XRP Token',
    decimalPlaces: 18,
    onchain: {
      id: '110ae681-4741-4ed3-9bbb-baa014a43674',
      name: 'xrpbear',
      contractAddress: '0x94fc5934cf5970e944a67de806eeb5a4b493c6e6',
    },
    offchain: {
      id: '4cecb06b-507e-4faf-afc3-346f3258a428',
      name: 'ofcxrpbear',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.XRPBULL,
    fullName: '3X Long XRP Token',
    decimalPlaces: 18,
    onchain: {
      id: 'f672a329-7a21-4c7e-bc8d-a1f9c8beea46',
      name: 'xrpbull',
      contractAddress: '0x27c1ba4f85b8dc1c150157816623a6ce80b7f187',
    },
    offchain: {
      id: '6ebae74d-7081-4445-945e-a134067fdd68',
      name: 'ofcxrpbull',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.XRPHEDGE,
    fullName: '1X Short XRP Token',
    decimalPlaces: 18,
    onchain: {
      id: 'd129c598-c0b7-43ce-976b-81d1373dfc59',
      name: 'xrphedge',
      contractAddress: '0x55b54d8fb1640d1321d5164590e7b020ba43def2',
    },
    offchain: {
      id: 'cc19efd0-8bc6-4efa-8b97-cf1073d3c1b5',
      name: 'ofcxrphedge',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.XTZBEAR,
    fullName: '3X Short Tezos Token',
    decimalPlaces: 18,
    onchain: {
      id: '3905b504-6238-4d1f-b2c2-28c5cbc0a5b2',
      name: 'xtzbear',
      contractAddress: '0xbc41d05287498dec58129560de6bd1b8d4e3ac1d',
    },
    offchain: {
      id: '5f60d431-d48e-4ad9-8ab7-b89ae36d91c3',
      name: 'ofcxtzbear',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.XTZBULL,
    fullName: '3X Long Tezos Token',
    decimalPlaces: 18,
    onchain: {
      id: '66c8dd59-4373-4701-942c-7b31f1128c03',
      name: 'xtzbull',
      contractAddress: '0x8af17a6396c8f315f6b6dbc6aa686c85f9b3e554',
    },
    offchain: {
      id: 'a32b8b2e-965c-418c-bfad-e461aec5346d',
      name: 'ofcxtzbull',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.XUSD,
    fullName: 'XUSD',
    decimalPlaces: 6,
    onchain: {
      id: 'fec45ebe-80a0-4cfa-8fb3-7c4100517f18',
      name: 'xusd',
      contractAddress: '0xc08e7e23c235073c6807c2efe7021304cb7c2815',
      features: [...ACCOUNT_COIN_DEFAULT_FEATURES, CoinFeature.STABLECOIN] as CoinFeature[],
    },
    offchain: {
      id: '0844dddc-d125-460d-b23b-e098d7d4ed98',
      name: 'ofcxusd',
      features: [CoinFeature.STABLECOIN] as CoinFeature[],
    },
  },
  {
    underlyingAsset: UnderlyingAsset.XVS,
    fullName: 'Venus XVS',
    decimalPlaces: 18,
    onchain: {
      id: '42010c6a-380b-4b11-983d-4b736172340d',
      name: 'xvs',
      contractAddress: '0xd3cc9d8f3689b83c91b7b59cab4946b063eb894a',
    },
    offchain: {
      id: '22e95bde-0569-4cc0-991d-275fa548e792',
      name: 'ofcxvs',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.XZK,
    fullName: 'Mystiko Token',
    decimalPlaces: 18,
    onchain: {
      id: '2b9ec367-e156-4431-ba24-ba2b9ef670d8',
      name: 'xzk',
      contractAddress: '0xe8fc52b1bb3a40fd8889c0f8f75879676310ddf0',
    },
    offchain: {
      id: '522523cd-0716-4a10-a785-06d424286bed',
      name: 'ofcxzk',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ZECBEAR,
    fullName: '3X Short Zcash Token',
    decimalPlaces: 18,
    onchain: {
      id: '54f3b3be-016f-43b7-b460-61caeed82e27',
      name: 'zecbear',
      contractAddress: '0x78a8c84b4c23563be4518e7045016d3170130823',
    },
    offchain: {
      id: '1fb6c586-3b97-4570-b3e9-48546dc10be6',
      name: 'ofczecbear',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ZECBULL,
    fullName: '3X Long Zcash Token',
    decimalPlaces: 18,
    onchain: {
      id: 'a2822e40-6e67-496d-8450-80f1908b7e5d',
      name: 'zecbull',
      contractAddress: '0xd437d88153daef4784cacd2084b1d8cc2d3312b8',
    },
    offchain: {
      id: '85f446a4-af2f-4614-9cc6-9e917977d49a',
      name: 'ofczecbull',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ZETAEVM,
    fullName: 'Zeta (ERC20)',
    decimalPlaces: 18,
    onchain: {
      id: '68e5a5eb-e51c-4dba-b3ba-3823bd450f49',
      name: 'zetaevm',
      contractAddress: '0xf091867ec603a6628ed83d274e835539d82e9cc8',
      features: ZETA_EVM_FEATURES as CoinFeature[],
    },
    offchain: {
      id: 'd55a47fe-364e-45d4-a759-d0b2c4294d62',
      name: 'ofczetaevm',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.COW,
    fullName: 'CoW Protocol Token',
    decimalPlaces: 18,
    onchain: {
      id: '0e6832b9-9ff6-47b9-9250-5e0cd1e69614',
      name: 'cow',
      contractAddress: '0xdef1ca1fb7fbcdc777520aa7f396b4e015f497ab',
    },
    offchain: {
      id: '4fb1262d-ae7e-4348-b1ae-53eb8a7f5dbe',
      name: 'ofccow',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.CPOOL,
    fullName: 'Clearpool',
    decimalPlaces: 18,
    onchain: {
      id: '7f0b2596-e0ca-46c0-bcd1-a9da08d00ac5',
      name: 'cpool',
      contractAddress: '0x66761fa41377003622aee3c7675fc7b5c1c2fac5',
    },
    offchain: {
      id: 'be43e360-e946-43ff-9b7a-a7d2f524146e',
      name: 'ofccpool',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.EOS,
    fullName: 'EOS ERC20 Token',
    decimalPlaces: 18,
    onchain: {
      id: 'f4ec1004-ab92-433e-a27f-8ee47541d06d',
      name: 'eoserc20',
      contractAddress: '0x86fa049857e0209aa7d9e616f7eb3b3b78ecfdb0',
      features: [...AccountCoin.DEFAULT_FEATURES, CoinFeature.DEPRECATED] as CoinFeature[],
    },
  },
  {
    underlyingAsset: UnderlyingAsset.FRAX,
    fullName: 'Frax',
    decimalPlaces: 18,
    onchain: {
      id: 'daf6857f-e2c7-45ad-a73f-a031567b26b8',
      name: 'frax',
      contractAddress: '0x853d955acef822db058eb8505911ed77f175b99e',
    },
    offchain: {
      id: 'fa9b68a2-9d09-40a9-a1d1-db5ef44a75c2',
      name: 'ofcfrax',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.INV,
    fullName: 'Inverse DAO',
    decimalPlaces: 18,
    onchain: {
      id: '12f3df9c-6f8b-4868-bb84-2f8d255da10a',
      name: 'inv',
      contractAddress: '0x41d5d79431a913c4ae7d69a668ecdfe5ff9dfb68',
    },
    offchain: {
      id: '74fbfefb-c542-4c1e-bc09-ce26d72176e4',
      name: 'ofcinv',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.MATTER,
    fullName: 'Antimatter.Finance Governance Token',
    decimalPlaces: 18,
    onchain: {
      id: 'c6af2d8f-196f-44bc-bfa8-d10fbaeaeb2f',
      name: 'matter',
      contractAddress: '0x9b99cca871be05119b2012fd4474731dd653febe',
    },
    offchain: {
      id: '24dfabb9-7544-4e6c-b856-53a3d261f376',
      name: 'ofcmatter',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.MAV,
    fullName: 'Maverick Token',
    decimalPlaces: 18,
    onchain: {
      id: '7525c5cc-9ad1-4e46-bb83-1aedc89e8e73',
      name: 'mav',
      contractAddress: '0x7448c7456a97769f6cd04f1e83a4a23ccdc46abd',
    },
    offchain: {
      id: '4780ed58-0b21-4cd8-8c68-84b1d8dca83b',
      name: 'ofcmav',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.METIS,
    fullName: 'Metis Token',
    decimalPlaces: 18,
    onchain: {
      id: 'd774f533-4eb0-43d8-9d0d-2beac9b045c4',
      name: 'metis',
      contractAddress: '0x9e32b13ce7f2e80a01932b42553652e053d6ed8e',
    },
    offchain: {
      id: '635c75f9-9c8d-402a-98c3-b71271f5bb29',
      name: 'ofcmetis',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.MEW,
    fullName: 'MEW coin',
    decimalPlaces: 18,
    onchain: {
      id: '477dbd05-a976-410b-93ce-971c8663975e',
      name: 'mew',
      contractAddress: '0xfa61f23943dad7d3ad69c0fa80e3c47f110778e9',
    },
    offchain: {
      id: 'a4e0613e-1d1b-477c-9da5-7c553ff787b7',
      name: 'ofcmew',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.MIM,
    fullName: 'Magic Internet Money',
    decimalPlaces: 18,
    onchain: {
      id: 'c641f0b2-359d-4ea4-afd7-0e959d4dd7f8',
      name: 'mim',
      contractAddress: '0x99d8a9c45b2eca8864373a26d1459e3dff1e17f3',
    },
    offchain: {
      id: '5e4fc04d-f0af-46ad-aa26-b214d469555e',
      name: 'ofcmim',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.STETH,
    fullName: 'stETH',
    decimalPlaces: 18,
    onchain: {
      id: '6cdfa52e-3623-41df-a867-ee64995de233',
      name: 'steth',
      contractAddress: '0xae7ab96520de3a18e5e111b5eaab095312d7fe84',
      features: [
        ...AccountCoin.DEFAULT_FEATURES,
        CoinFeature.BULK_TRANSACTION,
        CoinFeature.REBASE_TOKEN,
      ] as CoinFeature[],
    },
    offchain: {
      id: 'a5ca3a15-c832-4b37-9f35-e0060fc2df2e',
      name: 'ofcsteth',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['SYNTH-SUSD'],
    fullName: 'Synth sUSD',
    decimalPlaces: 18,
    onchain: {
      id: '8e23a447-d5e7-49e9-b7a0-5b23058971db',
      name: 'synth-susd',
      contractAddress: '0x57ab1ec28d129707052df4df418d58a2d46d5f51',
    },
    offchain: {
      id: '204aa3b7-8281-44ac-a239-7a6293b934fa',
      name: 'ofcsynth-susd',
      features: [CoinFeature.STABLECOIN] as CoinFeature[],
    },
  },
  {
    underlyingAsset: UnderlyingAsset.SUSDE,
    fullName: 'Staked USDe',
    decimalPlaces: 18,
    onchain: {
      id: '55110305-8a28-4b0b-9f93-191902a22080',
      name: 'susde',
      contractAddress: '0x9d39a5de30e57443bff2a8307a4256c8797a3497',
    },
    offchain: {
      id: '2c14c22a-cdc9-4f5e-b6a4-6201f4fc48d9',
      name: 'ofcsusde',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.SWAG,
    fullName: 'Swag Token',
    decimalPlaces: 18,
    onchain: {
      id: 'fd4d284b-f3eb-4890-ad1f-2d698979b291',
      name: 'swag',
      contractAddress: '0x87edffde3e14c7a66c9b9724747a1c5696b742e6',
    },
    offchain: {
      id: '39a6d9e6-9f64-4c66-b6d2-22c4982cb488',
      name: 'ofcswag',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.SWAP,
    fullName: 'TrustSwap Token',
    decimalPlaces: 18,
    onchain: {
      id: 'd6933358-6f99-48d0-9776-73c38917daec',
      name: 'swap',
      contractAddress: '0xcc4304a31d09258b0029ea7fe63d032f52e44efe',
    },
    offchain: {
      id: '14236918-1dd1-4597-9bc7-2e819c859cc8',
      name: 'ofcswap',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.UOS,
    fullName: 'Ultra Token',
    decimalPlaces: 4,
    onchain: {
      id: '232f1a4c-1e4c-4122-bb44-d5dd39389650',
      name: 'uos',
      contractAddress: '0xd13c7342e1ef687c5ad21b27c2b65d772cab5c8c',
    },
    offchain: {
      id: '4296793d-bb5a-4156-8fa3-de065d2b3d94',
      name: 'ofcuos',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.XCN,
    fullName: 'Onyxcoin',
    decimalPlaces: 18,
    onchain: {
      id: '228e67fe-3974-432a-833c-c8369113016b',
      name: 'xcn',
      contractAddress: '0xa2cd3d43c775978a96bdbf12d733d5a1ed94fb18',
    },
    offchain: {
      id: '53c43c96-4622-4459-91df-1e80bea7ba7d',
      name: 'ofcxcn',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.XDEFI,
    fullName: 'XDEFI',
    decimalPlaces: 18,
    onchain: {
      id: 'f13e3fea-7da6-4954-950d-ae5774f103cb',
      name: 'xdefi',
      contractAddress: '0x72b886d09c117654ab7da13a14d603001de0b777',
    },
    offchain: {
      id: '94f3e140-6652-4c4a-8b18-b8e56a28258c',
      name: 'ofcxdefi',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.GATE,
    fullName: 'GATENet',
    decimalPlaces: 18,
    onchain: {
      id: '8c3142c8-0cd9-42f2-8849-3aca3da1a214',
      name: 'gate',
      contractAddress: '0x9d7630adf7ab0b0cb00af747db76864df0ec82e4',
      features: AccountCoin.DEFAULT_FEATURES_EXCLUDE_SINGAPORE as CoinFeature[],
    },
    offchain: {
      id: 'db12970d-9be6-4399-9657-705a984661a6',
      name: 'ofcgate',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.LCX,
    fullName: 'LCX',
    decimalPlaces: 18,
    onchain: {
      id: 'e173c7c3-106b-4572-9c6c-e56c2f06c9c4',
      name: 'lcx',
      contractAddress: '0x037a54aab062628c9bbae1fdb1583c195585fe41',
    },
    offchain: {
      id: '7949daf7-305c-47bd-9e08-f85a4972b002',
      name: 'ofclcx',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.FLIP,
    fullName: 'Chainflip',
    decimalPlaces: 18,
    onchain: {
      id: '4beb03af-6838-42a4-9996-9516217afd29',
      name: 'flip',
      contractAddress: '0x826180541412d574cf1336d22c0c0a287822678a',
    },
    offchain: {
      id: '1fa78af9-e888-4863-a11c-576cc611fc3c',
      name: 'ofcflip',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.FLOKI,
    fullName: 'FLOKI',
    decimalPlaces: 9,
    onchain: {
      id: 'd66b743b-8101-46e4-a3a9-8a32e47f8cda',
      name: 'floki',
      contractAddress: '0xcf0c122c6b73ff809c693db761e7baebe62b6a2e',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: 'ced76323-8aa0-4dfc-a2c9-eee788615963',
      name: 'ofcfloki',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.RFOX,
    fullName: 'RFOX',
    decimalPlaces: 18,
    onchain: {
      id: '2504fe5b-37d1-4db3-8829-ba4c5b649163',
      name: 'rfox',
      contractAddress: '0xa1d6df714f91debf4e0802a542e13067f31b8262',
    },
    offchain: {
      id: 'a2872b71-b5d1-4ac9-bcaa-5a0c18062b44',
      name: 'ofcrfox',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.SWISE,
    fullName: 'StakeWise',
    decimalPlaces: 18,
    onchain: {
      id: 'aa2e357c-9bbf-444c-bf83-dea86bdcbc44',
      name: 'swise',
      contractAddress: '0x48c3399719b582dd63eb5aadf12a40b4c3f52fa2',
      features: AccountCoin.DEFAULT_FEATURES_EXCLUDE_SINGAPORE as CoinFeature[],
    },
    offchain: {
      id: '8dfdb813-b1e7-4975-9b14-a862906563b5',
      name: 'ofcswise',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ANKR,
    fullName: 'Ankr Network',
    decimalPlaces: 18,
    onchain: {
      id: 'ea58f25e-a0dc-4202-804e-9b62741a6e94',
      name: 'ankr',
      contractAddress: '0x8290333cef9e6d528dd5618fb97a76f268f3edd4',
    },
    offchain: {
      id: 'ee9a090d-d67e-4ec5-99da-257da77f0cfd',
      name: 'ofcankr',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.DAMM,
    fullName: 'dAMM',
    decimalPlaces: 18,
    onchain: {
      id: '38c6dfc8-169e-42b5-b89b-c8af59859de9',
      name: 'damm',
      contractAddress: '0xb3207935ff56120f3499e8ad08461dd403bf16b8',
    },
    offchain: {
      id: 'c8224deb-4439-4fa1-8472-bb84c9852736',
      name: 'ofcdamm',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.CERE,
    fullName: 'CERE Network',
    decimalPlaces: 10,
    onchain: {
      id: '72242a5e-0895-4a17-87a5-d124ff319e78',
      name: 'cere',
      contractAddress: '0x2da719db753dfa10a62e140f436e1d67f2ddb0d6',
    },
    offchain: {
      id: '8303eadb-7732-4b60-9c5e-2699aed58111',
      name: 'ofccere',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.DPX,
    fullName: 'Dopex Governance Token',
    decimalPlaces: 18,
    onchain: {
      id: '86591854-a0f9-4f8b-8164-472d7b2d6428',
      name: 'dpx',
      contractAddress: '0xeec2be5c91ae7f8a338e1e5f3b5de49d07afdc81',
    },
    offchain: {
      id: '06365fb8-6b98-4388-9f9d-84df93bf8234',
      name: 'ofcdpx',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.YFL,
    fullName: 'YFLink',
    decimalPlaces: 18,
    onchain: {
      id: '424e2da6-d3de-4fcd-a003-4a3e55bf3e3c',
      name: 'yfl',
      contractAddress: '0x28cb7e841ee97947a86b06fa4090c8451f64c0be',
    },
    offchain: {
      id: '6039533d-152a-4ae1-8408-50397e35f638',
      name: 'ofcyfl',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.HFT,
    fullName: 'Hashflow',
    decimalPlaces: 18,
    onchain: {
      id: 'c60376d7-5e59-4ae5-8db3-3035e23b463e',
      name: 'hft',
      contractAddress: '0xb3999f658c0391d94a37f7ff328f3fec942bcadc',
    },
    offchain: {
      id: '8e0876a0-5edb-4985-80d2-eab09d91d790',
      name: 'ofchft',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ALK,
    fullName: 'Alkemi_Network_DAO_Tokenhflow',
    decimalPlaces: 18,
    onchain: {
      id: 'eaa444e6-bf86-4e45-bf11-4375e9942e5a',
      name: 'alk',
      contractAddress: '0x6c16119b20fa52600230f074b349da3cb861a7e3',
    },
    offchain: {
      id: 'd3eece51-f4ab-471b-838a-cb5ccd3be112',
      name: 'ofcalk',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.FOX,
    fullName: 'FOX',
    decimalPlaces: 18,
    onchain: {
      id: 'f7fb83ee-0489-4854-abb4-51da6692d8ac',
      name: 'fox',
      contractAddress: '0xc770eefad204b5180df6a14ee197d99d808ee52d',
    },
    offchain: {
      id: 'f0fcb47a-57df-40fc-b12d-97a6b4f5c92b',
      name: 'ofcfox',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.CUBE,
    fullName: 'CUBE',
    decimalPlaces: 18,
    onchain: {
      id: '523d92b8-5fc8-4d13-8359-b69f3ac64382',
      name: 'cube',
      contractAddress: '0x622dffcc4e83c64ba959530a5a5580687a57581b',
    },
    offchain: {
      id: '656b5c53-33e4-4e23-81f2-639e348e114b',
      name: 'ofccube',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.XX,
    fullName: 'XX',
    decimalPlaces: 8,
    onchain: {
      id: 'ae798fd0-30cc-47de-af7d-cae0e3db15ad',
      name: 'xx',
      contractAddress: '0x47f33feb70ec153fc22755908a4061777d22c2da',
    },
    offchain: {
      id: '33fb3e94-ca61-447d-87a1-f606982f5c5a',
      name: 'ofcxx',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.LITv2,
    fullName: 'LIT',
    decimalPlaces: 18,
    onchain: {
      id: 'd340bbfc-1215-418d-8e57-64ffc954e2d7',
      name: 'litv2',
      contractAddress: '0xc5b3d3231001a776123194cf1290068e8b0c783b',
    },
    offchain: {
      id: '1851e4ac-167c-4d87-97f6-460d720b8172',
      name: 'ofclitv2',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.MEDIAv2,
    fullName: 'Media Network Token',
    decimalPlaces: 6,
    onchain: {
      id: 'fdaf03ca-1177-4284-81f3-b931721e0208',
      name: 'mediav2',
      contractAddress: '0xdb726152680ece3c9291f1016f1d36f3995f6941',
    },
    offchain: {
      id: '231650ab-f6ad-4ee3-8044-d4846c0c792c',
      name: 'ofcmediav2',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BLUR0xb93,
    fullName: 'BLUR',
    decimalPlaces: 18,
    onchain: {
      id: '2b2800aa-42f3-4bf4-9f15-35f76aace2a8',
      name: 'blur0xb93',
      contractAddress: '0xb9340fb0f8f93f4857eb3012b4f85db2d632e154',
    },
    offchain: {
      id: 'db20f471-cf6d-4eae-8a89-a909b87902bc',
      name: 'ofcblur0xb93',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.FT,
    fullName: 'FriendTech',
    decimalPlaces: 8,
    onchain: {
      id: 'c49d33f3-8f3b-4c97-9601-61363635615f',
      name: 'ft',
      contractAddress: '0x5079aca02ed583b8a7235442a6455d3f3289997b',
    },
    offchain: {
      id: '5a52abec-85b9-4c99-ab0d-2e1f707cf4c8',
      name: 'ofcft',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.GF,
    fullName: 'GuildFi Token',
    decimalPlaces: 18,
    onchain: {
      id: '17e2c6a0-72e5-412d-bb11-80ea14ad922c',
      name: 'gf',
      contractAddress: '0xaaef88cea01475125522e117bfe45cf32044e238',
    },
    offchain: {
      id: 'd459f96e-9e88-4686-b395-521e239968af',
      name: 'ofcgf',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.LQTY,
    fullName: 'LQTY',
    decimalPlaces: 18,
    onchain: {
      id: 'f34ecc46-631d-44e8-930d-96ef48a8522c',
      name: 'lqty',
      contractAddress: '0x6dea81c8171d0ba574754ef6f8b412f2ed88c54d',
    },
    offchain: {
      id: '7c96e702-a5c4-4871-a399-4b40e8b551aa',
      name: 'ofclqty',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['$Evmosia.com'],
    fullName: 'Evmosia.com',
    decimalPlaces: 0,
    onchain: {
      id: '7b77a4b6-4eef-4b5f-b0d5-e804432cec4a',
      name: 'evmosia',
      contractAddress: '0x525fc44cbe181c1108c209091b5eec5a5028190d',
    },
    offchain: {
      id: 'af2406b0-2fef-42b2-a5f8-2360a574c2b8',
      name: 'ofcevmosia',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['0xREVIEW'],
    fullName: '0xREVIEW',
    decimalPlaces: 9,
    onchain: {
      id: '0717bd0c-84ee-49a5-80a8-f29669acf421',
      name: '0xreview',
      contractAddress: '0xcc14452dbdb814bf277e69962f1de7b7f2674b8b',
    },
    offchain: {
      id: '3a30bf45-3550-47dd-8512-0407484da501',
      name: 'ofc0xreview',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['3CRV'],
    fullName: 'Curve.fi DAI/USDC/USDT',
    decimalPlaces: 18,
    onchain: {
      id: '0f2175c0-b059-4799-96d8-0a3b621aab87',
      name: '3crv',
      contractAddress: '0x6c3f90f043a72fa612cbac8115ee7e52bde6e490',
    },
    offchain: {
      id: '86f0ea16-69fc-4417-addc-73fd65c22147',
      name: 'ofc3crv',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ACEV2,
    fullName: 'ACE',
    decimalPlaces: 0,
    onchain: {
      id: '19f03fd2-22d6-4a82-9c7d-7e02a05019e7',
      name: 'acev2',
      contractAddress: '0x06147110022b768ba8f99a8f385df11a151a9cc8',
    },
    offchain: {
      id: 'db8759b9-8ba1-4b47-91ea-c3919707e42f',
      name: 'ofcacev2',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ACX,
    fullName: 'Across Protocol',
    decimalPlaces: 18,
    onchain: {
      id: '33c99c6f-8375-4370-bc40-65317aa5ff3f',
      name: 'acx',
      contractAddress: '0x44108f0223a3c3028f5fe7aec7f9bb2e66bef82f',
    },
    offchain: {
      id: '94fcd19b-6dd6-4a8c-8fea-11c73ba9fa48',
      name: 'ofcacx',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.AGEUR,
    fullName: 'agEUR',
    decimalPlaces: 18,
    onchain: {
      id: '17c7eb1b-c1e5-4223-b3ff-f77446ada7c9',
      name: 'ageur',
      contractAddress: '0x1a7e4e63778b4f12a199c062f3efdd288afcbce8',
    },
    offchain: {
      id: 'db4dfde5-d3f7-4deb-9b70-72aaeb8ce02b',
      name: 'ofcageur',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ALD,
    fullName: 'AladdinDAO',
    decimalPlaces: 18,
    onchain: {
      id: 'f0d670d3-a735-4004-9b23-fac5a97c0b0c',
      name: 'ald',
      contractAddress: '0xb26c4b3ca601136daf98593feaeff9e0ca702a8d',
    },
    offchain: {
      id: '78bd5573-a13b-4dc9-8b06-a8d49c365a10',
      name: 'ofcald',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ALGODOOM,
    fullName: '10X Short Algo token',
    decimalPlaces: 18,
    onchain: {
      id: 'a8f13113-9f9d-413b-975a-61692f309bbc',
      name: 'algodoom',
      contractAddress: '0x9281c548c6d107aea807b87a776da045f71fa193',
    },
    offchain: {
      id: 'fae2a567-c995-4dce-83a8-e8fea72214ba',
      name: 'ofcalgodoom',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ALGOMOON,
    fullName: '10X Long Algo Token',
    decimalPlaces: 18,
    onchain: {
      id: '305da3a1-c893-4251-a7da-792bba95a3b3',
      name: 'algomoon',
      contractAddress: '0xa386e04f0fb641869accd582c1b76eaa7d7087fe',
    },
    offchain: {
      id: '3f4b7d5c-d35a-4de7-8cfc-5fae65ca2825',
      name: 'ofcalgomoon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ALTDOOM,
    fullName: '10X Short Altcoin index token',
    decimalPlaces: 18,
    onchain: {
      id: '1356617f-7afa-42f7-8c8b-b27ef28b3698',
      name: 'altdoom',
      contractAddress: '0xc1915a97fd75818d3e10570b7613eda8636720bb',
    },
    offchain: {
      id: '11de7fe4-bd6c-4b51-84af-78122bbe2548',
      name: 'ofcaltdoom',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ALTMOON,
    fullName: '10X Long Altcoin index token',
    decimalPlaces: 18,
    onchain: {
      id: '414856fb-a4c8-40ed-a540-7f20cfacee8b',
      name: 'altmoon',
      contractAddress: '0x7574c09a26e781df694755cec8ac04af9d1e1cc0',
    },
    offchain: {
      id: 'a03cbf9f-de8e-477c-8591-aa289e7b024e',
      name: 'ofcaltmoon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ANGLE,
    fullName: 'ANGLE',
    decimalPlaces: 18,
    onchain: {
      id: 'dc0c4a58-4e54-4a9f-8e1b-875fc259ac80',
      name: 'angle',
      contractAddress: '0x31429d1856ad1377a8a0079410b297e1a9e214c2',
    },
    offchain: {
      id: '9e1e4f99-75c9-4d00-95c5-fe983c47fcc6',
      name: 'ofcangle',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ANML,
    fullName: 'Animal Concerts Token',
    decimalPlaces: 18,
    onchain: {
      id: 'c89510bb-d022-4043-969a-da7e1d2ad2d3',
      name: 'anml',
      contractAddress: '0x38b0e3a59183814957d83df2a97492aed1f003e2',
    },
    offchain: {
      id: 'dcff3ec9-8d3a-4759-bc01-008657e2dffc',
      name: 'ofcanml',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ARMOR,
    fullName: 'Armor',
    decimalPlaces: 18,
    onchain: {
      id: '336067e2-f06f-4dfd-ade5-1ea1f2940c05',
      name: 'armor',
      contractAddress: '0x1337def16f9b486faed0293eb623dc8395dfe46a',
    },
    offchain: {
      id: '798aa07a-5956-46e7-a5bb-01a6712d34e2',
      name: 'ofcarmor',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ARPA,
    fullName: 'ARPA Token',
    decimalPlaces: 18,
    onchain: {
      id: 'cf354bed-ed58-48e5-a032-783405e1aaaf',
      name: 'arpa',
      contractAddress: '0xba50933c268f567bdc86e1ac131be072c6b0b71a',
    },
    offchain: {
      id: '8eadb31e-2323-42fa-988c-a0a6ac71e512',
      name: 'ofcarpa',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ATA,
    fullName: 'Automata',
    decimalPlaces: 18,
    onchain: {
      id: '2f121a90-9e17-49f3-ad4c-c23141ef0d5b',
      name: 'ata',
      contractAddress: '0xa2120b9e674d3fc3875f415a7df52e382f141225',
    },
    offchain: {
      id: 'f30ade9f-aeba-4c67-8c13-be5411cd0853',
      name: 'ofcata',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ATF,
    fullName: 'AntFarm Finance',
    decimalPlaces: 9,
    onchain: {
      id: '9a2fc9a8-e198-4d9e-92d7-b6b899bb3507',
      name: 'atf',
      contractAddress: '0x61e74556a9f4eee6db88081136bff2246675c7c9',
    },
    offchain: {
      id: '947b3b4e-280b-45be-9455-aabd7138c075',
      name: 'ofcatf',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ATH,
    fullName: 'Aethir Token',
    decimalPlaces: 18,
    onchain: {
      id: 'db883e8c-37e3-4a26-b736-b1fb4769d01b',
      name: 'ath',
      contractAddress: '0xbe0ed4138121ecfc5c0e56b40517da27e6c5226b',
    },
    offchain: {
      id: '68a59406-9c61-497e-9aaf-8d3312ff233a',
      name: 'ofcath',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ATL,
    fullName: 'ATLANT',
    decimalPlaces: 18,
    onchain: {
      id: '46756498-7522-4f13-9444-bcd15fa284ac',
      name: 'atl',
      contractAddress: '0x78b7fada55a64dd895d8c8c35779dd8b67fa8a05',
    },
    offchain: {
      id: 'c8428197-606c-4950-89fc-97e8adcd74a5',
      name: 'ofcatl',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ATLAS,
    fullName: 'Star Atlas',
    decimalPlaces: 8,
    onchain: {
      id: '70a215f6-355a-44bc-b27b-6644c062496b',
      name: 'atlas',
      contractAddress: '0xb9f747162ab1e95d07361f9048bcdf6edda9eea7',
    },
    offchain: {
      id: 'a368ec29-3204-4699-9815-c0d7a8683d50',
      name: 'ofcatlas',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.AUSD,
    fullName: 'AUSD₮',
    decimalPlaces: 6,
    onchain: {
      id: '92de2240-586a-4208-a646-9c5aba262ab4',
      name: 'ausd',
      contractAddress: '0x9eead9ce15383caeed975427340b3a369410cfbf',
      features: [...ACCOUNT_COIN_DEFAULT_FEATURES, CoinFeature.STABLECOIN] as CoinFeature[],
    },
    offchain: {
      id: 'ad394bb6-3c1e-4c0d-9502-a13b23f69fc1',
      name: 'ofcausd',
      features: [CoinFeature.STABLECOIN] as CoinFeature[],
    },
  },
  {
    underlyingAsset: UnderlyingAsset.AUSDT,
    fullName: 'Aave Interest bearing USDT',
    decimalPlaces: 6,
    onchain: {
      id: 'e26974ca-1494-4c13-8b8d-ce155d246253',
      name: 'ausdt',
      contractAddress: '0x71fc860f7d3a592a4a98740e39db31d25db65ae8',
    },
    offchain: {
      id: 'a7a5e765-af73-4769-a10b-88379386656b',
      name: 'ofcausdt',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.AVT,
    fullName: 'AVT',
    decimalPlaces: 18,
    onchain: {
      id: '8d9c0c6b-0ab7-4d98-8b9a-83ae3b77914c',
      name: 'avt',
      contractAddress: '0x0d88ed6e74bbfd96b831231638b66c05571e824f',
    },
    offchain: {
      id: '288fd300-0fdd-4581-a079-7d58a82c6e94',
      name: 'ofcavt',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.AWBTC,
    fullName: 'Aave interest bearing WBTC',
    decimalPlaces: 8,
    onchain: {
      id: '4e8b9925-bea8-4eaa-a226-67137e6a6889',
      name: 'awbtc',
      contractAddress: '0x9ff58f4ffb29fa2266ab25e75e2a8b3503311656',
      features: [
        ...AccountCoin.DEFAULT_FEATURES,
        CoinFeature.BULK_TRANSACTION,
        CoinFeature.REBASE_TOKEN,
      ] as CoinFeature[],
    },
    offchain: {
      id: 'f72222f3-09f6-447d-8c32-c9126efbeab1',
      name: 'ofcawbtc',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.AYFI,
    fullName: 'Aave interest bearing YFI',
    decimalPlaces: 18,
    onchain: {
      id: 'fbd1d2af-b3c9-4272-aa92-30c1594fc626',
      name: 'ayfi',
      contractAddress: '0x5165d24277cd063f5ac44efd447b27025e888f37',
    },
    offchain: {
      id: '3f93cbbc-93bd-4d21-9ef8-198083e20ce1',
      name: 'ofcayfi',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.AZUKI,
    fullName: 'AzukiDAO.org',
    decimalPlaces: 18,
    onchain: {
      id: '0ff6ec5b-ebff-47b8-aa60-0b02e4ce4de8',
      name: 'azuki',
      contractAddress: '0xeae943f5f51e9ea36ee8bf4e955cf00bdde3da12',
    },
    offchain: {
      id: '2cfc4c4b-f4c5-459b-a23b-ed3ee75f673c',
      name: 'ofcazuki',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.AZUKI2,
    fullName: 'AZUKI 2.0',
    decimalPlaces: 18,
    onchain: {
      id: 'daed5784-855c-4b7b-8761-600d7f6dc71d',
      name: 'azuki2',
      contractAddress: '0x88804ac32e36bba3fa9efb951f96bc9bc694fef0',
    },
    offchain: {
      id: '38e77523-d6d6-4386-aa51-a3b611cb4f97',
      name: 'ofcazuki2',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.AZUKIPEPE,
    fullName: 'AZUKI PEPE',
    decimalPlaces: 18,
    onchain: {
      id: 'c38c7cf0-5d33-438b-a0d2-d9b5099522a0',
      name: 'azukipepe',
      contractAddress: '0xcdf6d021dc97f4eb26d69013725447082ac9568f',
    },
    offchain: {
      id: 'f4821408-ca60-40af-8c2b-2afef30e08f2',
      name: 'ofcazukipepe',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BAI,
    fullName: 'BodyAi',
    decimalPlaces: 9,
    onchain: {
      id: '5b74d3f6-7dc0-4134-a227-b6b3d516c70c',
      name: 'bai',
      contractAddress: '0xdb30a3949483c5469fb1207acf2fdec7af5c1215',
    },
    offchain: {
      id: '46a059a2-983d-469d-947b-35d3e23b5ec3',
      name: 'ofcbai',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BANK,
    fullName: 'First Crypto Bank',
    decimalPlaces: 9,
    onchain: {
      id: '19584e3b-bad9-4411-a687-0420e4688f0d',
      name: 'bank',
      contractAddress: '0x30a8dd4729747032a0cb2554b343da2f0af8fc76',
    },
    offchain: {
      id: '38bc2c0f-6de8-4308-a164-8ce929e2dcdd',
      name: 'ofcbank',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BBANK,
    fullName: 'BlockBank',
    decimalPlaces: 18,
    onchain: {
      id: '5521fc84-4ff8-41ef-a9f9-29741c7bf852',
      name: 'bbank',
      contractAddress: '0xf4b5470523ccd314c6b9da041076e7d79e0df267',
    },
    offchain: {
      id: '7ee61945-c1ff-4d25-afce-2e5c542b643e',
      name: 'ofcbbank',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BCHDOOM,
    fullName: '10X Short BCH Token',
    decimalPlaces: 18,
    onchain: {
      id: 'dd848021-3d22-47ff-8774-d9e59b445676',
      name: 'bchdoom',
      contractAddress: '0x2e185ef6684d2d0fe9d311782e0ef738d63861e0',
    },
    offchain: {
      id: 'cae2e0c3-9872-4816-b996-7b47dda082c1',
      name: 'ofcbchdoom',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BCHMOON,
    fullName: '10X Long BCH Token',
    decimalPlaces: 18,
    onchain: {
      id: '2ff29294-8469-42ae-9c5a-174fa54cccaa',
      name: 'bchmoon',
      contractAddress: '0x9003ce9e92e1105f235ca59e2bf65abd36dfdc01',
    },
    offchain: {
      id: '3dad463a-cde2-4e06-a1ef-0261ae44ec35',
      name: 'ofcbchmoon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BEARSHIT,
    fullName: '3X Short Shitcoin Index Token',
    decimalPlaces: 18,
    onchain: {
      id: 'a4adea1a-6b0e-4de4-8c65-096dcf6b0fe4',
      name: 'bearshit',
      contractAddress: '0x48dee19c81b89a9ab473361bae7a19210f2deaa4',
    },
    offchain: {
      id: 'da8987e8-7caa-42a9-a204-248051aae946',
      name: 'ofcbearshit',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BEND,
    fullName: 'Bend Token',
    decimalPlaces: 18,
    onchain: {
      id: '24bdc967-29f9-4e37-81a9-29f3b8ac6a80',
      name: 'bend',
      contractAddress: '0x0d02755a5700414b26ff040e1de35d337df56218',
    },
    offchain: {
      id: '8a825f77-ec44-473b-9f04-12897f70bae0',
      name: 'ofcbend',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BGBG,
    fullName: 'BigMouthFrog',
    decimalPlaces: 18,
    onchain: {
      id: '3cda6380-e5f6-4c4e-8885-5fc47608b2f1',
      name: 'bgbg',
      contractAddress: '0x53fffb19bacd44b82e204d036d579e86097e5d09',
    },
    offchain: {
      id: '1da178e5-ffcc-48a0-a7e6-8e8e0f4db2e9',
      name: 'ofcbgbg',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BKX,
    fullName: 'BANKEX',
    decimalPlaces: 18,
    onchain: {
      id: 'c7b298fb-0f38-4295-a312-375d4ceab8d5',
      name: 'bkx',
      contractAddress: '0x45245bc59219eeaaf6cd3f382e078a461ff9de7b',
    },
    offchain: {
      id: 'edb7043a-fe38-47cd-bae9-63ad70f10480',
      name: 'ofcbkx',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BLCT,
    fullName: 'Bloomzed Loyalty Club Ticket',
    decimalPlaces: 18,
    onchain: {
      id: '8cfd6db6-2fd5-4f06-91ee-2d6223940d61',
      name: 'blct',
      contractAddress: '0x6d2c508fc4a588a41713ff59212f85489291d244',
    },
    offchain: {
      id: 'a79cb684-3d97-4a7e-aced-57e6cf47fe09',
      name: 'ofcblct',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BLUR0x083,
    fullName: 'Blur',
    decimalPlaces: 18,
    onchain: {
      id: '2d876f7c-851f-40c1-9150-02588dff53b7',
      name: 'blur-0x083',
      contractAddress: '0x08364b301177f8d05670a8034a0e644abc40230c',
    },
    offchain: {
      id: '0831bf9e-6812-4e98-9cd9-9ce4790d8628',
      name: 'ofcblur-0x083',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BNBDOOM,
    fullName: '10X Short BNB Token',
    decimalPlaces: 18,
    onchain: {
      id: '2d997d99-62f2-4f0a-807f-be1a2b9db930',
      name: 'bnbdoom',
      contractAddress: '0xc8e69913c0ea5d45bf67e52412eb8bcab5b9875e',
    },
    offchain: {
      id: 'dc7aba12-8f28-49c4-9123-ba139faa10ba',
      name: 'ofcbnbdoom',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BNBMOON,
    fullName: '10X Long BNB Token',
    decimalPlaces: 18,
    onchain: {
      id: 'd709046e-d8d6-4ebf-bd1a-8e9db04ac439',
      name: 'bnbmoon',
      contractAddress: '0x7a5ce2b56dc00cb7b369ad2e1b3309abdc145bef',
    },
    offchain: {
      id: 'a27dd0bf-09ae-4b92-aa8b-dbd1776d45fa',
      name: 'ofcbnbmoon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BONE,
    fullName: 'BONE SHIBASWAP',
    decimalPlaces: 18,
    onchain: {
      id: 'bc33de31-c4e6-49b1-8765-9cea0686e583',
      name: 'bone',
      contractAddress: '0x9813037ee2218799597d83d4a5b6f3b6778218d9',
    },
    offchain: {
      id: 'ff51feb3-7531-4fda-93d2-c8a5f8941dcd',
      name: 'ofcbone',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BRIBE,
    fullName: 'Bribe Token',
    decimalPlaces: 18,
    onchain: {
      id: '69b7eddd-2308-4bb7-87d1-53b30cc2b8cd',
      name: 'bribe',
      contractAddress: '0xd4e12b224c316664ebb647f69abc1fb8bb2697c7',
    },
    offchain: {
      id: 'd8eaf965-c69b-4928-9382-d3ad1fcf13c9',
      name: 'ofcbribe',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BSVDOOM,
    fullName: '10X Short Bitcoin SV Token',
    decimalPlaces: 18,
    onchain: {
      id: 'f3c2bcf5-f6ec-4dad-8d51-144ddc48b934',
      name: 'bsvdoom',
      contractAddress: '0x91371b9bc6e90f6db3c4f4d630cf5f7700ab917c',
    },
    offchain: {
      id: '9d4ff7dd-a602-40c8-aedf-206c74e4aaef',
      name: 'ofcbsvdoom',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BSVMOON,
    fullName: '10X Long Bitcoin SV Token',
    decimalPlaces: 18,
    onchain: {
      id: '6cc03884-1d7d-45f5-b95e-616e5a08ebc9',
      name: 'bsvmoon',
      contractAddress: '0x875ef445e0873b6c2d5e58f68113e0937ba8a441',
    },
    offchain: {
      id: '99991b04-fb1a-48a8-ba00-e81d3fec3db2',
      name: 'ofcbsvmoon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BTC2XFLI,
    fullName: 'BTC 2x Flexible Leverage Index',
    decimalPlaces: 18,
    onchain: {
      id: '0e20185f-69c0-4d9c-807b-753bc0c50f71',
      name: 'btc2x-fli',
      contractAddress: '0x0b498ff89709d3838a063f1dfa463091f9801c2b',
    },
    offchain: {
      id: '8a460a17-2c18-42b5-b845-de2f59c53919',
      name: 'ofcbtc2x-fli',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BTMXBULL,
    fullName: '3X Long BTMX Token',
    decimalPlaces: 18,
    onchain: {
      id: '8cb4ef5c-fa8e-4f24-815e-1b65fc9ad7e1',
      name: 'btmxbull',
      contractAddress: '0x9885ca101dfd8f23d364874f799554c52bfee820',
    },
    offchain: {
      id: '0688653e-b1b8-4bb5-8277-15d22e62a3f7',
      name: 'ofcbtmxbull',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BTSG,
    fullName: 'BitSong',
    decimalPlaces: 18,
    onchain: {
      id: '6647929a-6b30-44e2-a420-3e3c3dbc16f6',
      name: 'btsg',
      contractAddress: '0x05079687d35b93538cbd59fe5596380cae9054a9',
    },
    offchain: {
      id: '8d5b4517-82ca-410c-ba45-68cb1cb4d595',
      name: 'ofcbtsg',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BULLSHIT,
    fullName: '3X Long Shitcoin Index Token',
    decimalPlaces: 18,
    onchain: {
      id: 'f3c333d4-f894-479e-8b7c-8de59e73736a',
      name: 'bullshit',
      contractAddress: '0xd06b25f67a17f12b41f615b34d87ecd716ff55a0',
    },
    offchain: {
      id: 'a36573fc-c050-4362-acf1-7bc773e18ae4',
      name: 'ofcbullshit',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.C3,
    fullName: 'C3 Finance',
    decimalPlaces: 9,
    onchain: {
      id: '5040c3d4-f0f1-4431-8a0f-edd66e747352',
      name: 'c3',
      contractAddress: '0x7d0807e767c82f419a5a01df8eb948f674cb4114',
    },
    offchain: {
      id: '43109998-f801-43b7-ba0b-7db10537d127',
      name: 'ofcc3',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.C6P,
    fullName: 'C6Protocol',
    decimalPlaces: 9,
    onchain: {
      id: '04d8c382-941f-4e5f-bd0d-8291c6728464',
      name: 'c6p',
      contractAddress: '0xb682ce4a2dfe2eb83bcf2cc5d468e5580cf1fa8d',
    },
    offchain: {
      id: '9f307ab4-e400-4d33-ac64-1cbfd59bfcf2',
      name: 'ofcc6p',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.CANTO,
    fullName: 'CANTO',
    decimalPlaces: 18,
    onchain: {
      id: '1d2a9f8d-d8f8-4011-806f-539a021b6892',
      name: 'canto',
      contractAddress: '0xc4a8bee93ba7f2979cfdf59754993c248bc056cc',
    },
    offchain: {
      id: 'a8ee55a0-205d-4c6a-bbf2-b7c35074211e',
      name: 'ofccanto',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.CAPS,
    fullName: 'Capsule Coin',
    decimalPlaces: 18,
    onchain: {
      id: '43ae6925-0be2-4a2b-a3b6-028b0f636cf4',
      name: 'caps',
      contractAddress: '0x03be5c903c727ee2c8c4e9bc0acc860cca4715e2',
    },
    offchain: {
      id: '239c5fae-14b2-478b-93c1-ee72f2e12f26',
      name: 'ofccaps',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.CARV,
    fullName: 'CARV',
    decimalPlaces: 18,
    onchain: {
      id: '71a358ae-77c2-4f9c-bdcb-b8a5487169d8',
      name: 'carv',
      contractAddress: '0xc08cd26474722ce93f4d0c34d16201461c10aa8c',
    },
    offchain: {
      id: '4d7ed89a-f7ef-4ccd-9fa8-3e7b6e68f1ab',
      name: 'ofccarv',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.CBETH,
    fullName: 'Coinbase Wrapped ETH',
    decimalPlaces: 18,
    onchain: {
      id: '758dd66e-dfe4-4eb2-ab83-c7784f4c9392',
      name: 'cbeth',
      contractAddress: '0xbe9895146f7af43049ca1c1ae358b0541ea49704',
      features: AccountCoin.DEFAULT_FEATURES_EXCLUDE_SINGAPORE as CoinFeature[],
    },
    offchain: {
      id: '4e3fbedd-36f1-4670-8a62-fde56ffcf91e',
      name: 'ofccbeth',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.CDAIV2,
    fullName: 'Compound Dai',
    decimalPlaces: 8,
    onchain: {
      id: 'f0ff60a3-c5d0-47ac-bde3-f69cee288b6f',
      name: 'cdaiv2',
      contractAddress: '0x5d3a536e4d6dbd6114cc1ead35777bab948e3643',
    },
    offchain: {
      id: '95449ee1-23c6-4fe0-839a-10ad3d96c5e4',
      name: 'ofccdaiv2',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.CELLS,
    fullName: 'Dead Cells',
    decimalPlaces: 18,
    onchain: {
      id: '7a01ceff-fe46-4e24-b501-99ca9a6c1ee5',
      name: 'cells',
      contractAddress: '0xa29005798187a4793534f2d4d1b82fdc504c7c20',
    },
    offchain: {
      id: '097a1f2e-3514-406e-87bc-3b4ffdf365b1',
      name: 'ofccells',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.CHAINLINK,
    fullName: 'ChainLink Token',
    decimalPlaces: 18,
    onchain: {
      id: '34e58b09-e439-4fa9-a943-edefd24e1cda',
      name: 'chainlink',
      contractAddress: '0x126c9f453f67e3b3ab51a9f606e540f495e6238d',
    },
    offchain: {
      id: '5c3738af-0741-4fc1-b132-be262597a8fd',
      name: 'ofcchainlink',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.CHART,
    fullName: 'ChartEx',
    decimalPlaces: 18,
    onchain: {
      id: '59ee087c-5bff-4ea9-acbd-747c9c6fca28',
      name: 'chart',
      contractAddress: '0x1d37986f252d0e349522ea6c3b98cb935495e63e',
    },
    offchain: {
      id: 'ae1e9792-7cc8-4f79-aeb6-b0ac8331f814',
      name: 'ofcchart',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.CNFI,
    fullName: 'Connect Finance',
    decimalPlaces: 18,
    onchain: {
      id: '33a27b5a-dc72-470b-b652-edd07ec1bdf2',
      name: 'cnfi',
      contractAddress: '0xeabb8996ea1662cad2f7fb715127852cd3262ae9',
    },
    offchain: {
      id: '74c70236-33ce-4f28-a437-a748e090339f',
      name: 'ofccnfi',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.COLLAR,
    fullName: 'DOG COLLAR',
    decimalPlaces: 18,
    onchain: {
      id: 'aa6c623f-538c-4ce6-b86e-8d9b6af048b8',
      name: 'collar',
      contractAddress: '0x9783b81438c24848f85848f8df31845097341771',
    },
    offchain: {
      id: '8dcefa77-fe16-4b8e-8396-1dcf28e74abb',
      name: 'ofccollar',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.COMBO,
    fullName: 'Combo',
    decimalPlaces: 18,
    onchain: {
      id: 'd09bb715-35f0-4df5-a92e-2201263568d0',
      name: 'combo',
      contractAddress: '0xffffffff2ba8f66d4e51811c5190992176930278',
    },
    offchain: {
      id: '0adac8a6-33a9-4b6f-be55-65ca17ea5086',
      name: 'ofccombo',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.CORE,
    fullName: 'cVault.finance',
    decimalPlaces: 18,
    onchain: {
      id: 'e015ea18-e731-4148-adc1-ab9443459c82',
      name: 'core',
      contractAddress: '0x62359ed7505efc61ff1d56fef82158ccaffa23d7',
    },
    offchain: {
      id: '8f0d3af0-8f99-4860-88db-e9b52855262f',
      name: 'ofccore',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.COS,
    fullName: 'Contentos',
    decimalPlaces: 18,
    onchain: {
      id: '2352b468-b85b-4c09-b0b6-8f27e0e8b789',
      name: 'cos',
      contractAddress: '0x589891a198195061cb8ad1a75357a3b7dbadd7bc',
    },
    offchain: {
      id: 'd7721a78-95be-44fc-b0c0-9b008c9f822e',
      name: 'ofccos',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.COVAL,
    fullName: 'CircuitsOfValue',
    decimalPlaces: 8,
    onchain: {
      id: '6645f7fc-34a3-4ea2-8931-de96f69b5e01',
      name: 'coval',
      contractAddress: '0x3d658390460295fb963f54dc0899cfb1c30776df',
    },
    offchain: {
      id: '51fa985a-0c14-48b0-af3d-a4bba0468187',
      name: 'ofccoval',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.COVERPROTOCOL,
    fullName: 'Cover Protocol Governance Token',
    decimalPlaces: 18,
    onchain: {
      id: 'ccbe1263-bcbb-438f-b620-7c6c205a1aee',
      name: 'cover-protocol',
      contractAddress: '0x4688a8b1f292fdab17e9a90c8bc379dc1dbd8713',
    },
    offchain: {
      id: 'c105d8df-69d5-46b4-9cbd-b3f9d46149b0',
      name: 'ofccover-protocol',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.CRI,
    fullName: 'Crypto International',
    decimalPlaces: 18,
    onchain: {
      id: 'c66d7977-f9e2-43de-9cc7-88926eb1eeec',
      name: 'cri',
      contractAddress: '0x12e951934246186f50146235d541d3bd1d463e4d',
    },
    offchain: {
      id: '94e72805-f3a2-440a-9934-d2d91330ca46',
      name: 'ofccri',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.CVXFXS,
    fullName: 'Convex FXS',
    decimalPlaces: 18,
    onchain: {
      id: '8011000f-01b2-4cd8-89f1-706b95d75b89',
      name: 'cvxfxs',
      contractAddress: '0xfeef77d3f69374f66429c91d732a244f074bdf74',
    },
    offchain: {
      id: 'b63fa39b-e000-4419-a04c-fb22d87c098f',
      name: 'ofccvxfxs',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.DADI,
    fullName: 'DADI',
    decimalPlaces: 18,
    onchain: {
      id: '53d5e303-90ec-467f-9622-439fcc448db1',
      name: 'dadi',
      contractAddress: '0xfb2f26f266fb2805a387230f2aa0a331b4d96fba',
    },
    offchain: {
      id: '7c9996c1-aa2e-447f-98f7-b4a2ac05800e',
      name: 'ofcdadi',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.DAOLANG,
    fullName: 'Daolang Coin',
    decimalPlaces: 8,
    onchain: {
      id: '186c81d5-fd6d-4201-bd07-4a9079a15502',
      name: 'daolang',
      contractAddress: '0x7176b713d8ff26a0b754dc3c79b6b393038be246',
    },
    offchain: {
      id: 'fd5d35ee-5e15-4e5a-8d3c-bcb67a6e2b78',
      name: 'ofcdaolang',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.DAR,
    fullName: 'Dalarnia',
    decimalPlaces: 6,
    onchain: {
      id: '70f9acdf-324d-4b72-b249-5d01acca6a00',
      name: 'dar',
      contractAddress: '0x081131434f93063751813c619ecca9c4dc7862a3',
    },
    offchain: {
      id: 'c8783afd-f756-4095-bac9-6feb26be20b4',
      name: 'ofcdar',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.DEPAY,
    fullName: 'DePay',
    decimalPlaces: 18,
    onchain: {
      id: '697a74c7-5aaa-484a-b046-ddf501dba213',
      name: 'depay',
      contractAddress: '0xa0bed124a09ac2bd941b10349d8d224fe3c955eb',
    },
    offchain: {
      id: 'f19703bc-860e-4b01-8987-0029a19f6b4a',
      name: 'ofcdepay',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.DHT,
    fullName: 'dHedge DAO Token',
    decimalPlaces: 18,
    onchain: {
      id: '3ed31ef4-6f65-4630-af4c-274e163fbe6b',
      name: 'dht',
      contractAddress: '0xca1207647ff814039530d7d35df0e1dd2e91fa84',
    },
    offchain: {
      id: '9d1a8b7a-92e6-4e97-83d4-b6381b5cc132',
      name: 'ofcdht',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.DNA,
    fullName: 'DNA',
    decimalPlaces: 18,
    onchain: {
      id: '2aced575-47d2-4632-ba04-dcbac4e12100',
      name: 'dna',
      contractAddress: '0x82b0e50478eeafde392d45d1259ed1071b6fda81',
    },
    offchain: {
      id: '7976bf1b-6629-4870-ad71-e956678de8a4',
      name: 'ofcdna',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.DNT,
    fullName: 'district0x',
    decimalPlaces: 18,
    onchain: {
      id: 'f33ce135-6539-41fb-9a3a-4d2eafffcf38',
      name: 'dnt',
      contractAddress: '0x0abdace70d3790235af448c88547603b945604ea',
    },
    offchain: {
      id: 'dada1b8f-7d32-49c7-abdc-7884d11fa242',
      name: 'ofcdnt',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.DOG,
    fullName: 'The Doge NFT',
    decimalPlaces: 18,
    onchain: {
      id: '39925ab0-cd3e-4770-a8cb-650e9074564e',
      name: 'dog',
      contractAddress: '0xbaac2b4491727d78d2b78815144570b9f2fe8899',
    },
    offchain: {
      id: 'b973f3ee-9de5-40f0-99e4-684ea954eb21',
      name: 'ofcdog',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.DOGEBEAR2021,
    fullName: '3X Short Doge Coin',
    decimalPlaces: 18,
    onchain: {
      id: '5b1ded8d-b3b6-40ea-b693-79c4517ccd27',
      name: 'dogebear2021',
      contractAddress: '0x5f0559b8de5b111560fe7faa31fe8135d9885169',
    },
    offchain: {
      id: '953bc747-9b4f-42a7-af86-0a32ad3405bd',
      name: 'ofcdogebear2021',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.DOMI,
    fullName: 'Domi Online',
    decimalPlaces: 18,
    onchain: {
      id: 'f3ff2add-9f21-48bf-ae1f-1ccd36413953',
      name: 'domi',
      contractAddress: '0x45c2f8c9b4c0bdc76200448cc26c48ab6ffef83f',
    },
    offchain: {
      id: 'b995b167-698e-4ed6-b201-1853e0b0c8ca',
      name: 'ofcdomi',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.DOOM,
    fullName: '10X Short Bitcoin',
    decimalPlaces: 18,
    onchain: {
      id: 'a5383490-708c-4dcb-b142-0d38fcbe8c90',
      name: 'doom',
      contractAddress: '0xe1403e2972145d86f66299380ade23169580beca',
    },
    offchain: {
      id: '9c75fc66-00b3-4e86-ab2f-2b062007d517',
      name: 'ofcdoom',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.DOOMSHIT,
    fullName: '10X Short Shitcoin Index Token',
    decimalPlaces: 18,
    onchain: {
      id: '60db11f3-b6c2-4ef0-8db0-b320e41bda74',
      name: 'doomshit',
      contractAddress: '0x7350383f6367de8b2e042209ad1ae7e66c863a2c',
    },
    offchain: {
      id: '5116180f-56af-4173-8e76-70f26a38c19a',
      name: 'ofcdoomshit',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.DOSE,
    fullName: 'DOSE',
    decimalPlaces: 18,
    onchain: {
      id: '940fa6b2-0653-45fb-ad49-b0f0ffd829b6',
      name: 'dose',
      contractAddress: '0xb31ef9e52d94d4120eb44fe1ddfde5b4654a6515',
    },
    offchain: {
      id: '5335744a-6e3b-460e-bbcf-04428cb499e6',
      name: 'ofcdose',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.DOTK,
    fullName: 'DOTK',
    decimalPlaces: 10,
    onchain: {
      id: '259f4ed8-4efb-473e-be61-aec8f2e8cf56',
      name: 'dotk',
      contractAddress: '0xbd456a9a8e364b205171341243ce29ddadfefef9',
    },
    offchain: {
      id: '9c9df6ab-9def-4beb-9174-d4f1384b647a',
      name: 'ofcdotk',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.DPAY,
    fullName: 'Devour',
    decimalPlaces: 18,
    onchain: {
      id: 'f1472f12-b48c-4b81-9842-734769c7c00e',
      name: 'dpay',
      contractAddress: '0xe5a733681bbe6cd8c764bb8078ef8e13a576dd78',
    },
    offchain: {
      id: 'd784d184-4b55-4f37-aa71-437987f8d06e',
      name: 'ofcdpay',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.DPY,
    fullName: 'Delphy Token',
    decimalPlaces: 18,
    onchain: {
      id: '5d38a031-0d6f-41fb-bfc0-fabd941a794b',
      name: 'dpy',
      contractAddress: '0x6c2adc2073994fb2ccc5032cc2906fa221e9b391',
    },
    offchain: {
      id: '102f8abb-9056-4054-839e-55d428df50b0',
      name: 'ofcdpy',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.DUCK,
    fullName: 'Unit Protocol',
    decimalPlaces: 18,
    onchain: {
      id: 'b11785f7-926a-4776-9e84-d794aa73eed2',
      name: 'duck',
      contractAddress: '0x92e187a03b6cd19cb6af293ba17f2745fd2357d5',
    },
    offchain: {
      id: '4d47235c-36d5-4930-931a-7ab830d23dd8',
      name: 'ofcduck',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.DUSD,
    fullName: 'DefiDollar',
    decimalPlaces: 18,
    onchain: {
      id: '1c4a8c66-7237-469b-a588-06128c094ea9',
      name: 'dusd',
      contractAddress: '0x5bc25f649fc4e26069ddf4cf4010f9f706c23831',
      features: [...ACCOUNT_COIN_DEFAULT_FEATURES, CoinFeature.STABLECOIN] as CoinFeature[],
    },
    offchain: {
      id: '25b6d6b9-9f82-43ca-b245-c578c9dbac87',
      name: 'ofcdusd',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.DUSK,
    fullName: 'Dusk Network',
    decimalPlaces: 18,
    onchain: {
      id: '51750f69-0e78-4954-996c-bd9da846f759',
      name: 'dusk',
      contractAddress: '0x940a2db1b7008b6c776d4faaca729d6d4a4aa551',
    },
    offchain: {
      id: '7ef5b16b-27e7-40d6-9a46-6a293c980551',
      name: 'ofcdusk',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.EDO,
    fullName: 'Eidoo',
    decimalPlaces: 18,
    onchain: {
      id: 'd657ed48-ccc5-4cc8-ad36-4a3b331a139b',
      name: 'edo',
      contractAddress: '0xced4e93198734ddaff8492d525bd258d49eb388e',
    },
    offchain: {
      id: '3fe3222f-e6b1-4268-b2ee-9829c869b2cf',
      name: 'ofcedo',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ELON,
    fullName: 'Dogelon',
    decimalPlaces: 18,
    onchain: {
      id: 'fe5cafad-304b-4619-9729-f9f263039876',
      name: 'elon',
      contractAddress: '0x761d38e5ddf6ccf6cf7c55759d5210750b5d60f3',
    },
    offchain: {
      id: '3f73b96f-78f9-4856-8998-0438521a7c72',
      name: 'ofcelon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.EON,
    fullName: 'EOS Network',
    decimalPlaces: 18,
    onchain: {
      id: '3957c960-e422-43d8-9262-12f368d698c2',
      name: 'eon',
      contractAddress: '0x3032b9e916a575db2d5a0c865f413a82891bd260',
    },
    offchain: {
      id: '16cf118f-512d-4a04-ad7c-65b76592fbd8',
      name: 'ofceon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.EOP,
    fullName: 'EOSpace',
    decimalPlaces: 18,
    onchain: {
      id: '818912d9-f769-48d1-8501-3f35501e3a4f',
      name: 'eop',
      contractAddress: '0xb562ec0261a9cb550a5fbcb46030088f1d6a53cf',
    },
    offchain: {
      id: '367188a4-31c0-4018-9a06-4660f9a99014',
      name: 'ofceop',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.EOSDOOM,
    fullName: '10X Short EOS Token',
    decimalPlaces: 18,
    onchain: {
      id: '66aa4409-057d-4132-9b01-63557ecfb14f',
      name: 'eosdoom',
      contractAddress: '0x50f044bf65cc7cf0d4814cfda69748539f6c4fa3',
    },
    offchain: {
      id: '213cc554-b7b0-4f3e-b854-35da400e0865',
      name: 'ofceosdoom',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.EOSMOON,
    fullName: '10X Long EOS Token',
    decimalPlaces: 18,
    onchain: {
      id: '27c3c7bc-0111-46cb-a41a-0d55b948765f',
      name: 'eosmoon',
      contractAddress: '0x4aaff81cfe81523b1c4f6b6c075ebf9bbdb094c9',
    },
    offchain: {
      id: '547cae62-dd52-446a-a652-3ed3eb02934d',
      name: 'ofceosmoon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ETCDOOM,
    fullName: '10X Short ETC Token',
    decimalPlaces: 18,
    onchain: {
      id: '26fad4f0-1f51-486b-80b2-0ffe07afc74b',
      name: 'etcdoom',
      contractAddress: '0x7d1234e0b45acb7dadc321325ba113a6f7caa7ee',
    },
    offchain: {
      id: '6709186d-b36d-466e-a6ef-94a4a3f002d2',
      name: 'ofcetcdoom',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ETCHEDOOM,
    fullName: '1X Short Ethereum Classic Token',
    decimalPlaces: 18,
    onchain: {
      id: 'f84db1de-5ef1-4fd1-bac5-cbe2b73aac4d',
      name: 'etchedoom',
      contractAddress: '0x57e2b08e74b2b2c041e8b7bbb48bf1cdc6b8afb6',
    },
    offchain: {
      id: '8b0a3edd-65f6-44a4-8000-3f275b1f83c6',
      name: 'ofcetchedoom',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ETCMOON,
    fullName: '10X Long ETC token',
    decimalPlaces: 18,
    onchain: {
      id: '8452498e-1c70-4293-b9b2-9239ef4808fa',
      name: 'etcmoon',
      contractAddress: '0x827e75a2c5f3cc0b2fef9273f6ae4518551ecafb',
    },
    offchain: {
      id: '049f582c-7252-4e92-9e78-6e0e0644748b',
      name: 'ofcetcmoon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ETHDOOM,
    fullName: '10X Short ETH',
    decimalPlaces: 18,
    onchain: {
      id: '9a858558-496a-4898-bb67-b7763aabd460',
      name: 'ethdoom',
      contractAddress: '0x03fdf7faddabebd21abf7185d205320d78622b56',
    },
    offchain: {
      id: 'f2ab1638-e5be-435a-a180-996ef866d0d7',
      name: 'ofcethdoom',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ETHFI,
    fullName: 'ether.fi governance token',
    decimalPlaces: 18,
    onchain: {
      id: 'ff133d14-b9a2-4279-9ee3-2ab0867d24ab',
      name: 'ethfi',
      contractAddress: '0xfe0c30065b384f05761f15d0cc899d4f9f9cc0eb',
    },
    offchain: {
      id: '567b571f-6f79-40e4-adff-3e0e3c6ba959',
      name: 'ofcethfi',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ETHMOON,
    fullName: '10X Long ETH',
    decimalPlaces: 18,
    onchain: {
      id: '01123699-1a1c-4d62-8089-af171d4d63b7',
      name: 'ethmoon',
      contractAddress: '0x5dcfa62f81b43ce7a3632454d327dee1f1d93b28',
    },
    offchain: {
      id: '257eba8c-259e-4555-bd6b-e3a1555db7f0',
      name: 'ofcethmoon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ETHOPT,
    fullName: 'ethopt.io',
    decimalPlaces: 18,
    onchain: {
      id: 'a010b57a-4ba9-4fc5-a311-7aacf487a335',
      name: 'ethopt',
      contractAddress: '0x7d25d9f10cd224ecce0bc824a2ec800db81c01d7',
    },
    offchain: {
      id: '67d4cc4d-8dae-451c-8fd4-7aba83e10d07',
      name: 'ofcethopt',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ETHTON,
    fullName: 'TON Token',
    decimalPlaces: 18,
    onchain: {
      id: 'cee3c700-5770-4161-bfe9-52b0bb7de833',
      name: 'ethton',
      contractAddress: '0x6a6c2ada3ce053561c2fbc3ee211f23d9b8c520a',
    },
    offchain: {
      id: 'bf0f703c-8077-4846-9464-3c9395da4808',
      name: 'ofcethton',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ETX,
    fullName: 'Ethereum Dex',
    decimalPlaces: 18,
    onchain: {
      id: '008145a9-f2d1-44d1-9eec-758d64b6b353',
      name: 'etx',
      contractAddress: '0x2a69219523a3c3372b26de059352302a30efe982',
    },
    offchain: {
      id: 'fa082195-e23f-44d2-ac9e-b6180c32de31',
      name: 'ofcetx',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.EXCHBEAR,
    fullName: '3X Short Exchange Token Index Token',
    decimalPlaces: 18,
    onchain: {
      id: 'bd850e5e-a524-4ed0-a3ee-ec3d5b183b8a',
      name: 'exchbear',
      contractAddress: '0x6baa91cd8aa07431760ef2eedfedcef662a6b8b3',
    },
    offchain: {
      id: '4a9e364c-4604-47d0-9844-8cb829b3bfe1',
      name: 'ofcexchbear',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.EXCHBULL,
    fullName: '3X Long Exchange Token Index Token',
    decimalPlaces: 18,
    onchain: {
      id: '0bc8e068-a0a3-4f61-accc-47d6eabee6b6',
      name: 'exchbull',
      contractAddress: '0x592ef68c18f05a22c5890263dea5d952dd140d2a',
    },
    offchain: {
      id: 'b5451294-582b-4253-bfd7-caf5564c46b8',
      name: 'ofcexchbull',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.EXCHDOOM,
    fullName: '10X Short Exchange Token Index Token',
    decimalPlaces: 18,
    onchain: {
      id: '475bcb2b-bdc7-4935-acb2-a275c1ea1928',
      name: 'exchdoom',
      contractAddress: '0xc3f206e06b33c3f5df9b95b8294a5e71f09480ab',
    },
    offchain: {
      id: 'ec224f9b-e704-482d-8992-bd786b63b788',
      name: 'ofcexchdoom',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.EXCHHEDGE,
    fullName: '1X Short Exchange Token Index Token',
    decimalPlaces: 18,
    onchain: {
      id: 'ba4cb219-2c73-41c8-9b28-59c37203f821',
      name: 'exchhedge',
      contractAddress: '0xf8cc67e304f8e1a351ed83b4dbbe6b4076d51376',
    },
    offchain: {
      id: 'ffc366d0-5c5a-4691-b2b5-42554f0e119f',
      name: 'ofcexchhedge',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.EXCHMOON,
    fullName: '10X Long EXCH token',
    decimalPlaces: 18,
    onchain: {
      id: 'ddb30411-5996-4f84-82b8-c4fc765848eb',
      name: 'exchmoon',
      contractAddress: '0x456bd836910b3853dc22529dbc2cbe072d967141',
    },
    offchain: {
      id: 'ce59ab28-9689-4490-ac1c-8aa5d8a46aeb',
      name: 'ofcexchmoon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.FF6000,
    fullName: 'FF6000',
    decimalPlaces: 18,
    onchain: {
      id: 'dd5f8544-3127-47ce-bfdf-356ef5371236',
      name: 'ff6000',
      contractAddress: '0x71f0e3a967be5fd797c543464b1d652dd4f9b480',
    },
    offchain: {
      id: 'dfca5ed5-1d12-44de-a6b0-e4df5368a7f0',
      name: 'ofcff6000',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.FIDU,
    fullName: 'Fidu',
    decimalPlaces: 18,
    onchain: {
      id: 'a48a7080-55a7-45d3-8f55-a9dd5cda9daa',
      name: 'fidu',
      contractAddress: '0x6a445e9f40e0b97c92d0b8a3366cef1d67f700bf',
    },
    offchain: {
      id: 'eaa0432b-5bb5-4345-8d19-1656cf435082',
      name: 'ofcfidu',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.FIN,
    fullName: 'DeFiner Protocol',
    decimalPlaces: 9,
    onchain: {
      id: 'bd719efc-d0d9-4300-8387-1f2e541097d4',
      name: 'fin',
      contractAddress: '0x8604099ddda943fe46087daf52175970c980a352',
    },
    offchain: {
      id: '9bda5e25-eb04-4c73-8d3f-4393a05202f4',
      name: 'ofcfin',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.FIRSTBLOOD,
    fullName: 'FirstBlood',
    decimalPlaces: 18,
    onchain: {
      id: '187b1dcf-2ba0-46d8-9e48-6ffbf47d1fab',
      name: 'firstblood',
      contractAddress: '0xaf30d2a7e90d7dc361c8c4585e9bb7d2f6f15bc7',
    },
    offchain: {
      id: '4df2cac6-ed03-4cf9-9e2d-405c40820532',
      name: 'ofcfirstblood',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.FIS,
    fullName: 'StaFi',
    decimalPlaces: 18,
    onchain: {
      id: '94c8346a-d212-475a-b646-3770ab0996f0',
      name: 'fis',
      contractAddress: '0xef3a930e1ffffacd2fc13434ac81bd278b0ecc8d',
    },
    offchain: {
      id: '07630bd3-db0c-4d32-b4b8-989cde82ccde',
      name: 'ofcfis',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.FOREX,
    fullName: 'handleFOREX',
    decimalPlaces: 18,
    onchain: {
      id: '951f8e8f-b0c6-46b5-8268-56e89d01786a',
      name: 'forex',
      contractAddress: '0xdb298285fe4c5410b05390ca80e8fbe9de1f259b',
    },
    offchain: {
      id: 'f6a3c08a-7cdb-4ff3-9b7b-d204bb56d557',
      name: 'ofcforex',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.FPIS,
    fullName: 'Frax Price Index Share',
    decimalPlaces: 18,
    onchain: {
      id: 'fafa98f4-914e-4f95-b23d-f3cb101ea2fb',
      name: 'fpis',
      contractAddress: '0xc2544a32872a91f4a553b404c6950e89de901fdb',
    },
    offchain: {
      id: 'ad155975-4cda-47cd-916d-61a317a5cc51',
      name: 'ofcfpis',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.FTT20,
    fullName: 'FTX Token v2.0',
    decimalPlaces: 18,
    onchain: {
      id: '3f5eab61-886c-407e-9441-a6e2efe82c1e',
      name: 'fttv2',
      contractAddress: '0x30b008432f90ce1c0f5333e0599b7644b5c12307',
    },
    offchain: {
      id: 'de9d8cc3-f406-4eec-983b-c6ecaf8427c3',
      name: 'ofcfttv2',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.FTX2,
    fullName: 'FTX 2.0',
    decimalPlaces: 18,
    onchain: {
      id: '6a9e697f-60c7-4c36-9448-937777c36bbf',
      name: 'ftx2',
      contractAddress: '0x0a835974ca6e9e6364393f1832777efa55abb682',
    },
    offchain: {
      id: '132ba088-3411-4ca8-bde2-c1a5a27c6a1f',
      name: 'ofcftx2',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.FUCKFTX,
    fullName: 'Fuck FTX',
    decimalPlaces: 9,
    onchain: {
      id: 'e3b62915-c63c-4520-9a3b-58d7f118bde6',
      name: 'fuckftx',
      contractAddress: '0x5df16ba228b6cc7bc7933f1e419635ad2b998f17',
    },
    offchain: {
      id: '312072c2-f6fc-41eb-8fb8-330148808dc9',
      name: 'ofcfuckftx',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.FX,
    fullName: 'Function X',
    decimalPlaces: 18,
    onchain: {
      id: 'ebca8d18-9620-4251-9a85-5ebcbf472857',
      name: 'fx',
      contractAddress: '0x8c15ef5b4b21951d50e53e4fbda8298ffad25057',
    },
    offchain: {
      id: '21b88fd9-fc2a-4a4e-8b97-b715b6c2ec06',
      name: 'ofcfx',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['GAME.COM'],
    fullName: 'Game.com Token',
    decimalPlaces: 18,
    onchain: {
      id: 'd21a8de0-b00e-4433-b79c-303c7e3bb02d',
      name: 'gamecom',
      contractAddress: '0xb70835d7822ebb9426b56543e391846c107bd32c',
    },
    offchain: {
      id: '4953faac-8882-4ff2-b184-95fd7d233b6d',
      name: 'ofcgamecom',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.GEAR,
    fullName: 'Gearbox',
    decimalPlaces: 18,
    onchain: {
      id: '6188efd6-30da-4365-8304-dafab92d0ddb',
      name: 'gear',
      contractAddress: '0xba3335588d9403515223f109edc4eb7269a9ab5d',
    },
    offchain: {
      id: '067355ca-f43a-4c42-832b-c90e787c8e9a',
      name: 'ofcgear',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.GIV,
    fullName: 'GIVToken',
    decimalPlaces: 8,
    onchain: {
      id: '5a2d0e56-364e-4597-89c7-3eaa7848ac03',
      name: 'giv',
      contractAddress: '0xf6537fe0df7f0cc0985cf00792cc98249e73efa0',
    },
    offchain: {
      id: 'b7fd3d04-6d35-4b65-8053-73570f827d8a',
      name: 'ofcgiv',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.GOM,
    fullName: 'Gomics',
    decimalPlaces: 18,
    onchain: {
      id: 'aea7e782-d738-46b9-8210-74fac383bd09',
      name: 'gom',
      contractAddress: '0xb8c6ad2586bb71d518c2aaf510efe91f82022f58',
    },
    offchain: {
      id: 'db0701be-d754-4c1a-a13a-91bed2ebe6e3',
      name: 'ofcgom',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.GOMINING,
    fullName: 'GoMining Token',
    decimalPlaces: 18,
    onchain: {
      id: 'cf6b9c8e-2036-44bf-8fb8-fd753e81a5da',
      name: 'gomining',
      contractAddress: '0x7ddc52c4de30e94be3a6a0a2b259b2850f421989',
    },
    offchain: {
      id: '67fddb3a-4330-47e4-9204-437bc7579607',
      name: 'ofcgomining',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.GRID,
    fullName: 'GRID',
    decimalPlaces: 12,
    onchain: {
      id: 'b0f523d5-ee4f-4c61-b9a7-a09fbd826b7b',
      name: 'grid',
      contractAddress: '0x12b19d3e2ccc14da04fae33e63652ce469b3f2fd',
    },
    offchain: {
      id: 'b0722ade-d88a-4982-b2aa-17069641482d',
      name: 'ofcgrid',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.GXT,
    fullName: 'Gem Exchange',
    decimalPlaces: 18,
    onchain: {
      id: 'f3f48ca8-ee68-4e84-9f20-48327d33340c',
      name: 'gxt',
      contractAddress: '0x4674672bcddda2ea5300f5207e1158185c944bc0',
    },
    offchain: {
      id: '7e4b8f6d-0d10-4303-9fc8-b6eb69c99cfa',
      name: 'ofcgxt',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.HBTC,
    fullName: 'Huobi BTC',
    decimalPlaces: 18,
    onchain: {
      id: '18e24c56-99cc-41ca-bfd9-2fcb7b5fc4c8',
      name: 'hbtc',
      contractAddress: '0x0316eb71485b0ab14103307bf65a021042c6d380',
    },
    offchain: {
      id: '33e34da9-c892-42c0-b62a-21e87aa5c31a',
      name: 'ofchbtc',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.HEDGESHIT,
    fullName: '1X Short Shitcoin Index Token',
    decimalPlaces: 18,
    onchain: {
      id: '79f20b87-2c7e-4bc8-8c0c-79af273372c8',
      name: 'hedgeshit',
      contractAddress: '0x1d9cd2180fd4e9771fca28681034d02390b14e4c',
    },
    offchain: {
      id: '44926a26-1866-46b8-91ff-6e9e2d02bafb',
      name: 'ofchedgeshit',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.HEX,
    fullName: 'HEX',
    decimalPlaces: 8,
    onchain: {
      id: 'cd51cd62-1909-49f7-9f07-9f6af36bccfc',
      name: 'hex',
      contractAddress: '0x2b591e99afe9f32eaa6214f7b7629768c40eeb39',
      features: [
        ...ACCOUNT_COIN_DEFAULT_FEATURES_EXCLUDE_SINGAPORE_AND_MENA_FZE,
        CoinFeature.BULK_TRANSACTION,
      ] as CoinFeature[],
    },
    offchain: {
      id: '80e70941-c7c4-4680-b6c5-43b589825ee5',
      name: 'ofchex',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.HIT,
    fullName: 'HitchainCoin',
    decimalPlaces: 6,
    onchain: {
      id: 'a4334b0a-f28c-4e7d-9f36-2c2f239ad7ac',
      name: 'hit',
      contractAddress: '0x7995ab36bb307afa6a683c24a25d90dc1ea83566',
    },
    offchain: {
      id: '6c70feed-ae27-4f75-ae54-3c52209ef01c',
      name: 'ofchit',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.HOP,
    fullName: 'Hop',
    decimalPlaces: 18,
    onchain: {
      id: '2cf4fcb3-bbc2-4808-aef8-c1da770f2fcf',
      name: 'hop',
      contractAddress: '0xc5102fe9359fd9a28f877a67e36b0f050d81a3cc',
    },
    offchain: {
      id: '599e6f14-858d-4b3a-9991-ddd56bac2706',
      name: 'ofchop',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.HPO,
    fullName: 'Hippocrat',
    decimalPlaces: 18,
    onchain: {
      id: 'abe06a07-48f0-4af1-a474-43b8300a00c5',
      name: 'hpo',
      contractAddress: '0xfe39c384d702914127a005523f9915addb9bd59b',
    },
    offchain: {
      id: '92c79140-aa46-4be0-9a72-9fc0dfdbb717',
      name: 'ofchpo',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.HQG,
    fullName: 'HQG',
    decimalPlaces: 6,
    onchain: {
      id: '189e3443-3bde-4644-ac66-c7b068463c4f',
      name: 'hqg',
      contractAddress: '0x57b9d10157f66d8c00a815b5e289a152dedbe7ed',
    },
    offchain: {
      id: '5cbfbde5-960a-499e-b3e8-f36c133afcd8',
      name: 'ofchqg',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.HTBEAR,
    fullName: '3X Short HT token',
    decimalPlaces: 18,
    onchain: {
      id: 'a4fb8090-20de-4eeb-9213-0408fc5cb618',
      name: 'htbear',
      contractAddress: '0x86eb791495be777db763142a2c547d1112554fb8',
    },
    offchain: {
      id: '16835e11-04cf-40a2-b9c3-317621762e56',
      name: 'ofchtbear',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.HTDOOM,
    fullName: '10X Short HT token',
    decimalPlaces: 18,
    onchain: {
      id: '974cadb8-897a-41f9-8ec4-e2edcd3e05c8',
      name: 'htdoom',
      contractAddress: '0xeef85c9d7486748aae4a26aa55eeb82a62e631c3',
    },
    offchain: {
      id: '973f849d-12bb-4f42-a508-508817920887',
      name: 'ofchtdoom',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.HTHEDGE,
    fullName: '1X Short HT token',
    decimalPlaces: 18,
    onchain: {
      id: '627cc067-393d-4d4f-9c4f-b748f6007e07',
      name: 'hthedge',
      contractAddress: '0x3008186fe6e3bca6d1362105a48ec618672ce5b3',
    },
    offchain: {
      id: '03f480c9-d674-40f6-83d0-d469c5a51ab2',
      name: 'ofchthedge',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.HTMOON,
    fullName: '10X Long HT token',
    decimalPlaces: 18,
    onchain: {
      id: 'bc7351c5-2a37-43de-88ad-ef2b9d9e745b',
      name: 'htmoon',
      contractAddress: '0xb621bb8064a1b2b2d6c2fd4330293f3e7acbc15f',
    },
    offchain: {
      id: 'de8921be-3ac5-4281-af50-4713c30bb348',
      name: 'ofchtmoon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.HUMV2,
    fullName: 'Humanscape',
    decimalPlaces: 18,
    onchain: {
      id: 'cd3e2201-4d04-45af-a57d-31683ebdef3f',
      name: 'humv2',
      contractAddress: '0x07327a00ba28d413f745c931bbe6be053b0ad2a6',
    },
    offchain: {
      id: '99c606be-05af-4a13-afeb-04d602917abf',
      name: 'ofchumv2',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.HYDROPROTOCOL,
    fullName: 'Hydro Protocol',
    decimalPlaces: 18,
    onchain: {
      id: '41fdb26b-701f-4b0b-a156-083b58292829',
      name: 'hydroprotocol',
      contractAddress: '0x9af839687f6c94542ac5ece2e317daae355493a1',
    },
    offchain: {
      id: '51c6dce1-2cb6-4583-9d84-da64a71a0998',
      name: 'ofchydroprotocol',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.IBEUR,
    fullName: 'Iron Bank EUR',
    decimalPlaces: 18,
    onchain: {
      id: '6b31316f-9b23-487b-88a8-0bc7c341c3a7',
      name: 'ibeur',
      contractAddress: '0x96e61422b6a9ba0e068b6c5add4ffabc6a4aae27',
    },
    offchain: {
      id: 'dfaf28d5-68fc-465f-85f9-bec29fe4ecf3',
      name: 'ofcibeur',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.IBOX,
    fullName: 'IBOX TOKEN',
    decimalPlaces: 18,
    onchain: {
      id: '4260dbbf-0bc3-44d4-8f73-ec2a1e89c75d',
      name: 'ibox',
      contractAddress: '0xc04323308419b10a5929ffcfd577f88629222222',
    },
    offchain: {
      id: '2b8a5f56-38a9-4a55-b68f-3a38b76847d6',
      name: 'ofcibox',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ILV,
    fullName: 'Illuvium',
    decimalPlaces: 18,
    onchain: {
      id: 'c676e5f1-302e-4acf-a765-0ab130a25154',
      name: 'ilv',
      contractAddress: '0x767fe9edc9e0df98e07454847909b5e959d7ca0e',
    },
    offchain: {
      id: 'a9a34973-5399-4fd6-93c2-8407d2875490',
      name: 'ofcilv',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.INSUR,
    fullName: 'InsurChain2',
    decimalPlaces: 18,
    onchain: {
      id: 'ff2c12c2-56ac-4c9e-b647-28aaac333fc5',
      name: 'insur',
      contractAddress: '0x51fb3da8a67861361281ac56fe2ad8c3b4539ffa',
    },
    offchain: {
      id: 'a86e9f45-af3f-4df0-bd2b-9d7958e88dd8',
      name: 'ofcinsur',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.IOTX,
    fullName: 'IoTeX Network',
    decimalPlaces: 18,
    onchain: {
      id: 'd87cc72a-8375-4b8e-adfc-86e0d9789cbd',
      name: 'iotx',
      contractAddress: '0x6fb3e0a217407efff7ca062d46c26e5d60a14d69',
    },
    offchain: {
      id: '309379dd-9a5a-47e4-b491-fdba4305b60f',
      name: 'ofciotx',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.KARMA,
    fullName: 'Karma',
    decimalPlaces: 4,
    onchain: {
      id: 'cdb93766-f5e8-4a87-9275-f4a408638c43',
      name: 'karma',
      contractAddress: '0xdfe691f37b6264a90ff507eb359c45d55037951c',
    },
    offchain: {
      id: 'd47cfa7b-5e71-4cae-b490-8b1ec396b892',
      name: 'ofckarma',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.KAS,
    fullName: 'Kaspa',
    decimalPlaces: 8,
    onchain: {
      id: '9d42fc1c-27f9-4d20-bab9-6ffdc8087fd2',
      name: 'kas',
      contractAddress: '0x112b08621e27e10773ec95d250604a041f36c582',
    },
    offchain: {
      id: '969180cc-5af9-49c5-ad19-d8e8de755467',
      name: 'ofckas',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.KCASH,
    fullName: 'Kcash',
    decimalPlaces: 18,
    onchain: {
      id: 'bf153900-e902-41c2-a774-3609172928a9',
      name: 'kcash',
      contractAddress: '0x32d74896f05204d1b6ae7b0a3cebd7fc0cd8f9c7',
    },
    offchain: {
      id: 'f19236e7-5c84-459d-9a07-086a05b9acbd',
      name: 'ofckcash',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.KCS,
    fullName: 'KuCoin',
    decimalPlaces: 6,
    onchain: {
      id: '4e68ff9f-a423-4a8b-af31-34969178ce53',
      name: 'kcs',
      contractAddress: '0xf34960d9d60be18cc1d5afc1a6f012a723a28811',
    },
    offchain: {
      id: 'db35feb4-9cdb-447a-a698-e0e944ca6869',
      name: 'ofckcs',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.KILL0,
    fullName: 'Killerof0',
    decimalPlaces: 18,
    onchain: {
      id: 'f82b2f31-3437-46a1-bca8-35a991551a1c',
      name: 'kill0',
      contractAddress: '0x770c6eee2da5d23ecb27cc09dbb0243e3dc40418',
    },
    offchain: {
      id: '85d36477-3bb2-436f-926e-fcbe55ee920b',
      name: 'ofckill0',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.KISHUI,
    fullName: 'Kishui.org',
    decimalPlaces: 0,
    onchain: {
      id: '470a8b14-32a0-43e7-b2b1-a1b821e8dcc4',
      name: 'kishui',
      contractAddress: '0xe9e00b759378fe58c16e7fb49ff3de6cf1ec1adb',
    },
    offchain: {
      id: '1f0c355d-f7d7-4417-9005-7a3cd912ba9e',
      name: 'ofckishui',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.KOL,
    fullName: 'Kollect',
    decimalPlaces: 18,
    onchain: {
      id: '468d158e-dc8c-4cda-b687-c509711bb2d2',
      name: 'kol',
      contractAddress: '0x1cc30e2eac975416060ec6fe682041408420d414',
    },
    offchain: {
      id: '7d7bfcc5-5bf5-4521-af6d-7af2c0401439',
      name: 'ofckol',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.L3USD,
    fullName: 'L3USD',
    decimalPlaces: 18,
    onchain: {
      id: 'ce0d0ac5-006b-471e-adaa-038e82d27906',
      name: 'l3usd',
      contractAddress: '0x2c2d8a078b33bf7782a16acce2c5ba6653a90d5f',
    },
    offchain: {
      id: 'cfa9a270-9b9c-4a71-b54e-5b2d5e6cdbc1',
      name: 'ofcl3usd',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.LA,
    fullName: 'LAtoken',
    decimalPlaces: 18,
    onchain: {
      id: '704e5fc2-e25d-4772-918b-42b70c5a71c5',
      name: 'la',
      contractAddress: '0xe50365f5d679cb98a1dd62d6f6e58e59321bcddf',
    },
    offchain: {
      id: '28c47c8a-3c81-499a-91b3-6a6b1537d02a',
      name: 'ofcla',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.LADYS,
    fullName: 'Milady',
    decimalPlaces: 18,
    onchain: {
      id: '99b6d10c-74c9-41dd-8a98-0cc35f8e006a',
      name: 'ladys',
      contractAddress: '0x12970e6868f88f6557b76120662c1b3e50a646bf',
    },
    offchain: {
      id: 'af6189bc-20c4-4f67-a5bb-50914d9b06db',
      name: 'ofcladys',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.LAYERZERO,
    fullName: 'LAYER ZERO',
    decimalPlaces: 18,
    onchain: {
      id: '2071f805-1e50-4d6a-a5e8-4022341cdb12',
      name: 'layerzero',
      contractAddress: '0x4656f822010a29543d1b5f67f9fe577f51a67260',
    },
    offchain: {
      id: '5965b592-cd81-4a26-8766-7f252b8b2e12',
      name: 'ofclayerzero',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.LEOBEAR,
    fullName: '3X Short LEO token',
    decimalPlaces: 18,
    onchain: {
      id: '2ab324f6-2b9d-4bd5-8fe4-5aed1d52a047',
      name: 'leobear',
      contractAddress: '0x3c955e35b6da1ff623d38d750c85b3aed89a10c1',
    },
    offchain: {
      id: '62877ac5-c89c-459c-a596-def8916e330f',
      name: 'ofcleobear',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.LEOBULL,
    fullName: '3X Long LEO Token',
    decimalPlaces: 18,
    onchain: {
      id: '5830d5f1-4a70-4872-9dde-60e01b99c224',
      name: 'leobull',
      contractAddress: '0xc2685307ef2b8842fbf3def432408c46bd0420fd',
    },
    offchain: {
      id: 'c69021f4-d1f2-47b7-87e3-c3addf9b1046',
      name: 'ofcleobull',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.LEODOOM,
    fullName: '10X Short LEO Token',
    decimalPlaces: 18,
    onchain: {
      id: 'bdb470a3-93c9-4a2f-908a-01c0af737dbf',
      name: 'leodoom',
      contractAddress: '0x22f39b18d17665177f1ac88d6da4861b13be07df',
    },
    offchain: {
      id: 'b3703a05-74ba-4fe8-b01c-385d6d712ec2',
      name: 'ofcleodoom',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.LEOHEDGE,
    fullName: '1X Short LEO Token',
    decimalPlaces: 18,
    onchain: {
      id: '80c066f2-8298-4c29-9e9a-c14dc680ec76',
      name: 'leohedge',
      contractAddress: '0xd83c5c357969628272def87dcdb5b66352dfd794',
    },
    offchain: {
      id: '1424b32b-95f3-4ad7-be10-941cbc1cbaaa',
      name: 'ofcleohedge',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.LEOMOON,
    fullName: '10X Long LEO Token',
    decimalPlaces: 18,
    onchain: {
      id: '2d97c3c3-9ff6-4706-b2bd-3096ecd4d32a',
      name: 'leomoon',
      contractAddress: '0xcfeb236743bd4b3789d28bbea9dc4ef0792c87f9',
    },
    offchain: {
      id: 'e38d065c-c4b8-4fd3-b3d1-b61dc3236c4a',
      name: 'ofcleomoon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.LEV,
    fullName: 'Leverj',
    decimalPlaces: 9,
    onchain: {
      id: 'd3b7776c-764c-4741-b956-67cd7ca86b35',
      name: 'lev',
      contractAddress: '0x0f4ca92660efad97a9a70cb0fe969c755439772c',
    },
    offchain: {
      id: '2d67faee-64d4-4c3f-a623-1d53ecf20ecf',
      name: 'ofclev',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.LEVER,
    fullName: 'LeverFI',
    decimalPlaces: 18,
    onchain: {
      id: '5d760978-16f0-4575-85d9-2cc7a5d359fe',
      name: 'lever',
      contractAddress: '0x4b5f49487ea7b3609b1ad05459be420548789f1f',
    },
    offchain: {
      id: '424dca0a-2737-43a6-bbc6-a09cca601939',
      name: 'ofclever',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.LIEN,
    fullName: 'lien',
    decimalPlaces: 8,
    onchain: {
      id: '2963170f-2c71-489a-b772-7e571b2683cb',
      name: 'lien',
      contractAddress: '0xab37e1358b639fd877f015027bb62d3ddaa7557e',
    },
    offchain: {
      id: 'ef6f38b5-3784-45f8-85a3-bbfd429ee505',
      name: 'ofclien',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.LIF3,
    fullName: 'LIF3',
    decimalPlaces: 18,
    onchain: {
      id: '85bce310-6d8f-4864-9db2-4c248d4e8e75',
      name: 'lif3',
      contractAddress: '0x7138eb0d563f3f6722500936a11dcae99d738a2c',
    },
    offchain: {
      id: '9a47c704-e7ec-42a5-95a2-617962f810c9',
      name: 'ofclif3',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.LITH,
    fullName: 'Lithium',
    decimalPlaces: 18,
    onchain: {
      id: '618813cf-6c14-431b-aa37-3018d8ca1ca0',
      name: 'lith',
      contractAddress: '0x188e817b02e635d482ae4d81e25dda98a97c4a42',
    },
    offchain: {
      id: '63064105-8d4f-4bbb-b487-4ec3a1b95c3b',
      name: 'ofclith',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.LKR,
    fullName: 'Polkalokr',
    decimalPlaces: 18,
    onchain: {
      id: '6efdcefd-fe21-4e85-962d-aa869e6eec6c',
      name: 'lkr',
      contractAddress: '0x80ce3027a70e0a928d9268994e9b85d03bd4cdcf',
    },
    offchain: {
      id: 'a77e443b-c26b-416e-8860-55568cda396c',
      name: 'ofclkr',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.LOVE,
    fullName: 'UkraineDAO Flag',
    decimalPlaces: 18,
    onchain: {
      id: 'ce92918a-54ab-4d78-9b2d-dbc1b6a58b02',
      name: 'love',
      contractAddress: '0x5380442d3c4ec4f5777f551f5edd2fa0f691a27c',
    },
    offchain: {
      id: 'c78971f4-5e16-4c8a-bb64-98b18e3327de',
      name: 'ofclove',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.LOVELY,
    fullName: 'Lovely Finance',
    decimalPlaces: 18,
    onchain: {
      id: '67a93874-3c56-4ed9-9d85-c591e05bd0c9',
      name: 'lovely',
      contractAddress: '0x0f6d4d4643a514132f84f4a270946db3c7cb701c',
    },
    offchain: {
      id: 'ed06b792-9a30-4b5e-b216-5f1b7a6a7b85',
      name: 'ofclovely',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.LPT,
    fullName: 'Livepeer Token',
    decimalPlaces: 18,
    onchain: {
      id: '24929a4b-d237-4224-8580-b425bcf0cfaa',
      name: 'lpt',
      contractAddress: '0x58b6a8a3302369daec383334672404ee733ab239',
    },
    offchain: {
      id: 'b5f3afea-f69a-4a05-87f9-965476ad77de',
      name: 'ofclpt',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.LTCDOOM,
    fullName: '10X Short Litecoin',
    decimalPlaces: 18,
    onchain: {
      id: '1a28e2bc-3b45-45fd-a116-7bc6ed625835',
      name: 'ltcdoom',
      contractAddress: '0x31e15a071a5340f0393ea98dde3a095d64206a02',
    },
    offchain: {
      id: '25c35d3f-4967-4b4d-9d21-198a7dc87cde',
      name: 'ofcltcdoom',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.LTCHEDGE,
    fullName: '1X Short Litecoin',
    decimalPlaces: 18,
    onchain: {
      id: '5aa02f95-1fd6-4a59-9971-028cc7db646c',
      name: 'ltchedge',
      contractAddress: '0xd0c64d6c0e9aa53fffd8b80313e035f7b83083f3',
    },
    offchain: {
      id: '782254af-f786-4eb1-82d9-b445b1b27855',
      name: 'ofcltchedge',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.LTCMOON,
    fullName: '10X Long Litecoin token',
    decimalPlaces: 18,
    onchain: {
      id: 'c2c7ef39-49d7-425f-badc-fcf21dca9dda',
      name: 'ltcmoon',
      contractAddress: '0x08da69ca2bfe378f384cb76c84d6ded701ec65c7',
    },
    offchain: {
      id: '4aa4d02e-5213-48c5-8efc-2f3530a87f91',
      name: 'ofcltcmoon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.LTO,
    fullName: 'LTO Network',
    decimalPlaces: 8,
    onchain: {
      id: 'ad6681c9-a517-4592-9aed-994804b133ce',
      name: 'lto',
      contractAddress: '0xd01409314acb3b245cea9500ece3f6fd4d70ea30',
    },
    offchain: {
      id: '7d17265c-3f19-483f-a1bb-1bf0369bb7ad',
      name: 'ofclto',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.LUNAWORMHOLE,
    fullName: 'LUNA (Wormhole)',
    decimalPlaces: 6,
    onchain: {
      id: '7189b0aa-b4be-4fe9-8ad6-c02a948a21c3',
      name: 'luna-wormhole',
      contractAddress: '0xbd31ea8212119f94a611fa969881cba3ea06fa3d',
    },
    offchain: {
      id: '12139488-d699-4008-8af4-30231d7faa55',
      name: 'ofcluna-wormhole',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.LYXE,
    fullName: 'LUKSO',
    decimalPlaces: 18,
    onchain: {
      id: '1997e4ed-06ce-40f0-bddf-5352676a5b04',
      name: 'lyxe',
      contractAddress: '0xa8b919680258d369114910511cc87595aec0be6d',
    },
    offchain: {
      id: 'e3b13702-c295-4fc6-ae1c-2fa73d7b0969',
      name: 'ofclyxe',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.OM,
    fullName: 'MANTRA DAO',
    decimalPlaces: 18,
    onchain: {
      id: 'd9371bee-e3f9-4a3b-8c59-209b39e92587',
      name: 'om',
      contractAddress: '0x3593d125a4f7849a1b059e64f4517a86dd60c95d',
    },
    offchain: {
      id: '4efe4036-6528-45f8-9a3f-d4175103da72',
      name: 'ofcom',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.MATICBEAR2021,
    fullName: '3X Short Matic Token',
    decimalPlaces: 18,
    onchain: {
      id: '528e1b1a-d94d-46a3-8854-ba243c89cc81',
      name: 'maticbear2021',
      contractAddress: '0xc96bfa5517dad3c9c9575411b51f93fde98607bc',
    },
    offchain: {
      id: 'b4e5a6cc-a62d-4a00-995f-8965ccb435e6',
      name: 'ofcmaticbear2021',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.MIDBEAR,
    fullName: '3X Short Midcap Index Token',
    decimalPlaces: 18,
    onchain: {
      id: '2c8a98da-1928-481f-8cb7-9ee6164e6758',
      name: 'midbear',
      contractAddress: '0xc82abb524257c8ee4790bfdefb452b2d6a395e21',
    },
    offchain: {
      id: '3125a295-1693-4232-9f4b-3a413c863409',
      name: 'ofcmidbear',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.MIDDOOM,
    fullName: '10X Short Midcap Index Token',
    decimalPlaces: 18,
    onchain: {
      id: '6fffdca9-d9b0-4935-84e0-583cd71da346',
      name: 'middoom',
      contractAddress: '0xfbccadbe483adfac499c82ac31d17965043f6174',
    },
    offchain: {
      id: '88138033-1060-4580-ab6a-c3b5484aaaa7',
      name: 'ofcmiddoom',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.MIDHEDGE,
    fullName: '1X Short Midcap Index Token',
    decimalPlaces: 18,
    onchain: {
      id: 'cec977c0-1756-4dbe-aa22-3f83e5cc2677',
      name: 'midhedge',
      contractAddress: '0xbed04d5ba351fb2a93470bee04babb32d7f6817c',
    },
    offchain: {
      id: 'fa1ac4ee-449d-4524-9465-f622ae860105',
      name: 'ofcmidhedge',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.MIDMOON,
    fullName: '10X Long Midcap Index Token',
    decimalPlaces: 18,
    onchain: {
      id: 'ccf29ebe-e5fc-4ff0-9aed-d10df2fae39d',
      name: 'midmoon',
      contractAddress: '0x24982f160803daca0233661d1860de77046519a4',
    },
    offchain: {
      id: '3557841d-32f3-4b98-a3c6-dfa71d0d64ff',
      name: 'ofcmidmoon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.MOCHI,
    fullName: 'Mochi Inu',
    decimalPlaces: 18,
    onchain: {
      id: '59eaadcd-9bf9-4986-8eb7-9c2a8b1c85d5',
      name: 'mochi',
      contractAddress: '0x60ef10edff6d600cd91caeca04caed2a2e605fe5',
    },
    offchain: {
      id: '87f46300-26b2-484c-a10a-2015ff4c91ab',
      name: 'ofcmochi',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.MOH,
    fullName: 'Medal of Honour',
    decimalPlaces: 18,
    onchain: {
      id: '3bc25fbf-bad2-48cf-aa68-2775c04dfed8',
      name: 'moh',
      contractAddress: '0xa59e341e8047498700ed244814b01b34547fb21b',
    },
    offchain: {
      id: '375cfaa9-b651-4b12-90df-ca121d73231e',
      name: 'ofcmoh',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.MOON,
    fullName: '10X Long Bitcoin Token',
    decimalPlaces: 18,
    onchain: {
      id: 'd10fca6c-314b-4d7a-9ea2-fd85455c7c8a',
      name: 'moon',
      contractAddress: '0xba7cdd0953e8f950317dda347a716f162713b226',
    },
    offchain: {
      id: '068f9fee-b2ec-462a-996f-dbc4432a0e60',
      name: 'ofcmoon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.MOONSHIT,
    fullName: '10X Long Shitcoin Index Token',
    decimalPlaces: 18,
    onchain: {
      id: '4900872b-62dc-49b9-932c-9e4004f6ebfe',
      name: 'moonshit',
      contractAddress: '0xf5312da58ab6c1706d651ed9fcd3ca000c3a25b7',
    },
    offchain: {
      id: 'c572f556-2abb-4b1a-9e80-b9cca7e60684',
      name: 'ofcmoonshit',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.MOTHER,
    fullName: 'MOTHER IGGY',
    decimalPlaces: 9,
    onchain: {
      id: '7bc4cf02-2f5c-46d0-a985-576063747b4b',
      name: 'mother',
      contractAddress: '0x5c927767264cf7ee038ed5b84ef760b96c7843a6',
    },
    offchain: {
      id: 'd3b061d2-5d0a-41fb-9f4d-8c196c353c52',
      name: 'ofcmother',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.MRTWEET,
    fullName: 'Mr. Tweet',
    decimalPlaces: 18,
    onchain: {
      id: '280e08c8-616e-4b57-8ebc-d012142be0ae',
      name: 'mrtweet',
      contractAddress: '0x9822dcbbc139947dd7bb684033855365078c32fc',
    },
    offchain: {
      id: '86a71a82-77cc-40cb-a426-f2d84c8b9ae6',
      name: 'ofcmrtweet',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.MSN,
    fullName: 'meson.network',
    decimalPlaces: 18,
    onchain: {
      id: 'd86e597c-a00f-45f0-9fb6-37c203379761',
      name: 'msn',
      contractAddress: '0xaa247c0d81b83812e1abf8bab078e4540d87e3fb',
    },
    offchain: {
      id: '9c8763ec-fb2a-4365-ae7c-1725f574b7aa',
      name: 'ofcmsn',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.MTH,
    fullName: 'Monetha',
    decimalPlaces: 5,
    onchain: {
      id: '54e22bcd-9cc4-41b8-b737-e87e916f92a4',
      name: 'mth',
      contractAddress: '0xaf4dce16da2877f8c9e00544c93b62ac40631f16',
    },
    offchain: {
      id: '6d3e9aa1-f067-437e-b174-1720d8fd9d80',
      name: 'ofcmth',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.MTV,
    fullName: 'MultiVAC',
    decimalPlaces: 18,
    onchain: {
      id: '3984e08f-46e3-4fd9-9ca2-36773506ae39',
      name: 'mtv',
      contractAddress: '0x6226e00bcac68b0fe55583b90a1d727c14fab77f',
    },
    offchain: {
      id: '532864a9-1ffc-409f-a769-fc259719409b',
      name: 'ofcmtv',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.NAAI,
    fullName: 'NeoAudit AI',
    decimalPlaces: 9,
    onchain: {
      id: '15bf51c0-4755-4e2c-a79c-77c4fb22710d',
      name: 'naai',
      contractAddress: '0xf4a7b9aa94a637573dd01a8ba0be08418cefe7a1',
    },
    offchain: {
      id: '54d3ebd3-6c3d-4519-8eef-9cee96d80c71',
      name: 'ofcnaai',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['NEAR-ERC20'],
    fullName: 'NEAR (ERC20 token)',
    decimalPlaces: 24,
    onchain: {
      id: '74b4c98d-9a8f-4023-92a6-84e590a23b91',
      name: 'near-erc20',
      contractAddress: '0x85f17cf997934a597031b2e18a9ab6ebd4b9f6a4',
    },
    offchain: {
      id: '4a59c525-9998-4a55-9563-0086ab95e252',
      name: 'ofcnear-erc20',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.NEWO,
    fullName: 'New Order',
    decimalPlaces: 18,
    onchain: {
      id: '112cdedc-bef9-4671-a94b-8d822d85fed8',
      name: 'newo',
      contractAddress: '0x1b890fd37cd50bea59346fc2f8ddb7cd9f5fabd5',
    },
    offchain: {
      id: '01541544-0977-4e3e-ba36-addf7709dd8e',
      name: 'ofcnewo',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['NFCWIN-SB-2021'],
    fullName: 'National Football Conference Wins Superbowl 2021',
    decimalPlaces: 18,
    onchain: {
      id: 'a79873a3-c5bb-4736-a73c-190e98c51626',
      name: 'nfcwin-sb-2021',
      contractAddress: '0xc00eac79f7e9afa63906b2cff42caf97a9bc7bd8',
    },
    offchain: {
      id: '2aa68545-8b42-4781-af4c-e1a15261b4cf',
      name: 'ofcnfcwin-sb-2021',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.NKN,
    fullName: 'NKN',
    decimalPlaces: 18,
    onchain: {
      id: 'b209e34c-b6e4-4fe2-91ba-44c176c69595',
      name: 'nkn',
      contractAddress: '0x5cf04716ba20127f1e2297addcf4b5035000c9eb',
    },
    offchain: {
      id: '0421a05c-2d3d-4216-a18e-073aa5dede7f',
      name: 'ofcnkn',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.NOTE,
    fullName: 'Notional',
    decimalPlaces: 18,
    onchain: {
      id: '9d5c57ac-1f0d-4934-875d-a91c60110122',
      name: 'note',
      contractAddress: '0xcfeaead4947f0705a14ec42ac3d44129e1ef3ed5',
    },
    offchain: {
      id: 'bcdb48b5-05b0-4e89-ba5c-83a063ea24ae',
      name: 'ofcnote',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.NPT,
    fullName: 'NEOPIN Token',
    decimalPlaces: 18,
    onchain: {
      id: '79296e45-2a32-4115-a24b-a3666572630b',
      name: 'npt',
      contractAddress: '0x306ee01a6ba3b4a8e993fa2c1adc7ea24462000c',
    },
    offchain: {
      id: '66c1eac0-fe4d-46ff-bfa9-e4afc591202e',
      name: 'ofcnpt',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.NULS,
    fullName: 'Nuls',
    decimalPlaces: 8,
    onchain: {
      id: 'a39b01d9-584f-4912-9d08-32ddcc3dd9c0',
      name: 'nuls',
      contractAddress: '0xa2791bdf2d5055cda4d46ec17f9f429568275047',
    },
    offchain: {
      id: '1d44a2ca-4bb2-4622-96cd-d833683ef0b2',
      name: 'ofcnuls',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.NUTS,
    fullName: 'NutsDAO',
    decimalPlaces: 18,
    onchain: {
      id: 'b46508f0-6b95-47f6-93d3-afc6d7fb25bf',
      name: 'nuts',
      contractAddress: '0x981dc247745800bd2ca28a4bf147f0385eaa0bc0',
    },
    offchain: {
      id: '92f9e35f-b2b4-4211-9165-8e0157914785',
      name: 'ofcnuts',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.NXM,
    fullName: 'Nexus Mutual',
    decimalPlaces: 18,
    onchain: {
      id: '235910f9-350d-4c30-a2ee-7cbd2bbf1d5b',
      name: 'nxm',
      contractAddress: '0xd7c49cee7e9188cca6ad8ff264c1da2e69d4cf3b',
    },
    offchain: {
      id: 'd5ca1da1-8632-42f2-8cf9-4d7ec43ddd61',
      name: 'ofcnxm',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.OAX,
    fullName: 'OpenANX',
    decimalPlaces: 18,
    onchain: {
      id: 'f54c530a-be45-4e47-a210-5196d961e4ad',
      name: 'oax',
      contractAddress: '0x701c244b988a513c945973defa05de933b23fe1d',
    },
    offchain: {
      id: '9bfaa103-e53b-4697-8927-6234661de55c',
      name: 'ofcoax',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.OCTAV,
    fullName: 'Octav',
    decimalPlaces: 9,
    onchain: {
      id: '5976d607-e3cf-47f2-b214-a77c0a0e53f2',
      name: 'octav',
      contractAddress: '0x8bc8eddd7eddd80ec96320a3500cb84310c3c1f5',
    },
    offchain: {
      id: '62af8c1d-877f-4469-9b6d-e6ccd62129d9',
      name: 'ofcoctav',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.OGV,
    fullName: 'Origin Dollar',
    decimalPlaces: 18,
    onchain: {
      id: '16b0558b-e0ec-4447-9f92-6c421c77d70b',
      name: 'ogv',
      contractAddress: '0x9c354503c38481a7a7a51629142963f98ecc12d0',
    },
    offchain: {
      id: '3650c561-0cf3-425d-bd1a-d30ae3098f92',
      name: 'ofcogv',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.OKBBEAR,
    fullName: '3X Short OKB token',
    decimalPlaces: 18,
    onchain: {
      id: '0f56f27d-2e1c-4411-95ae-543c5af3499b',
      name: 'okbbear',
      contractAddress: '0x053e5ba7cb9669dcc2feb2d0e1d3d4a0ad6aae39',
    },
    offchain: {
      id: 'a953fe3e-ccd1-4950-8edc-f24797ad6d29',
      name: 'ofcokbbear',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.OKBDOOM,
    fullName: '10X Short OKB token',
    decimalPlaces: 18,
    onchain: {
      id: '3edc602e-3dd8-459e-93de-e840448769a7',
      name: 'okbdoom',
      contractAddress: '0x2474ca2e5a1ce0ca904ca512530c2555048603be',
    },
    offchain: {
      id: 'cac5236f-5903-497f-95eb-2b5febe99b2b',
      name: 'ofcokbdoom',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.OKBHEDGE,
    fullName: '1X Short OKB token',
    decimalPlaces: 18,
    onchain: {
      id: 'a47f48a2-bd1b-4a39-9e4c-a3ed2a910e25',
      name: 'okbhedge',
      contractAddress: '0x889bc62e94bb6902d022bb82b38f7fcd637df28c',
    },
    offchain: {
      id: '4632a9c1-8408-4f64-8424-4cc4e48a62c0',
      name: 'ofcokbhedge',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.OKBMOON,
    fullName: '10X Long OKB Token',
    decimalPlaces: 18,
    onchain: {
      id: 'b18846e8-1780-4568-bd94-25fc26559888',
      name: 'okbmoon',
      contractAddress: '0xa160d857fced9436a57c6a405b2f379aceb83186',
    },
    offchain: {
      id: 'f410342f-4136-4fd1-b232-93d92036d5ab',
      name: 'ofcokbmoon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.OPIUM,
    fullName: 'Opium Governance Token',
    decimalPlaces: 18,
    onchain: {
      id: '8c90ecef-9a98-4bbf-95df-92994488a363',
      name: 'opium',
      contractAddress: '0x888888888889c00c67689029d7856aac1065ec11',
    },
    offchain: {
      id: 'cb2a8ead-03e7-41be-b504-6d494d71f4be',
      name: 'ofcopium',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ORC,
    fullName: 'Orbit Chain',
    decimalPlaces: 18,
    onchain: {
      id: '4287bdbf-8771-48a9-ace5-b3657abb312a',
      name: 'orc',
      contractAddress: '0x662b67d00a13faf93254714dd601f5ed49ef2f51',
    },
    offchain: {
      id: 'dce641ae-8a76-4212-9dfc-a5ba981259c8',
      name: 'ofcorc',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ORN,
    fullName: 'Orion Protocol',
    decimalPlaces: 8,
    onchain: {
      id: '9d8e758e-2812-4471-956e-510579d9c9c6',
      name: 'orn',
      contractAddress: '0x0258f474786ddfd37abce6df6bbb1dd5dfc4434a',
    },
    offchain: {
      id: '8c5c434b-3ffa-46fc-8fb9-bc88d73a9363',
      name: 'ofcorn',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.OS,
    fullName: 'OpenSea',
    decimalPlaces: 18,
    onchain: {
      id: 'd9aab455-040e-4032-b9bb-1d2b0d0aa1e2',
      name: 'os',
      contractAddress: '0x9e90dbfbf397aabbbdb99cfdd793ea62bcbddb2c',
    },
    offchain: {
      id: '9d4c639f-29f1-4941-be3e-dfc23291b379',
      name: 'ofcos',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.OUSD,
    fullName: 'OpenSea',
    decimalPlaces: 18,
    onchain: {
      id: '41484126-a598-4ebb-a175-145bf5c09f47',
      name: 'ousd',
      contractAddress: '0x2a8e1e676ec238d8a992307b495b45b3feaa5e86',
      features: [...ACCOUNT_COIN_DEFAULT_FEATURES, CoinFeature.STABLECOIN] as CoinFeature[],
    },
    offchain: {
      id: '24daf055-c62a-43dc-844d-cb85361294e1',
      name: 'ofcousd',
      features: [CoinFeature.STABLECOIN] as CoinFeature[],
    },
  },
  {
    underlyingAsset: UnderlyingAsset.PAXGBEAR,
    fullName: '3X Short PAX Gold Token',
    decimalPlaces: 18,
    onchain: {
      id: '980dfde9-6849-43aa-8e49-d4fd527e622c',
      name: 'paxgbear',
      contractAddress: '0x3c4a46f0c075a7f191a7459bb51eb1f81ac36f8a',
    },
    offchain: {
      id: '015fe891-e2b9-4f89-949e-7b0682e0c163',
      name: 'ofcpaxgbear',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.PAXGBULL,
    fullName: '3X Long PAX Gold Token',
    decimalPlaces: 18,
    onchain: {
      id: '1e0ae184-26d8-4aa4-9ef0-a173d229f493',
      name: 'paxgbull',
      contractAddress: '0x81f09ed4b98b1c8e99b1fa838b72acb842afe94c',
    },
    offchain: {
      id: '71fe58df-3f44-4d03-91db-6d5e1347456f',
      name: 'ofcpaxgbull',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.PEBBLE,
    fullName: 'Etherrock #72',
    decimalPlaces: 18,
    onchain: {
      id: '96a766b4-6164-4a71-a368-cdf641cbcc2a',
      name: 'pebble',
      contractAddress: '0xdc98c5543f3004debfaad8966ec403093d0aa4a8',
    },
    offchain: {
      id: '1b89904f-3d83-426f-92ab-1e5e9c2bf36e',
      name: 'ofcpebble',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.PENDLE,
    fullName: 'Pendle',
    decimalPlaces: 18,
    onchain: {
      id: '8eda6522-c57a-40ea-a059-95f8ebaa4c91',
      name: 'pendle',
      contractAddress: '0x808507121b80c02388fad14726482e061b8da827',
    },
    offchain: {
      id: 'd0efbafb-f9c7-4eb9-83b2-cf137f49e458',
      name: 'ofcpendle',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.PHA,
    fullName: 'Phala',
    decimalPlaces: 18,
    onchain: {
      id: 'ea142e4d-82c9-49a0-afc0-68b47e18091f',
      name: 'pha',
      contractAddress: '0x6c5ba91642f10282b576d91922ae6448c9d52f4e',
    },
    offchain: {
      id: 'e145b8b0-e16b-4691-a20b-b154c23bbf7a',
      name: 'ofcpha',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.PICK,
    fullName: 'PICK',
    decimalPlaces: 18,
    onchain: {
      id: '096f173b-d9f8-4cfd-84b1-b57866c6ea54',
      name: 'pick',
      contractAddress: '0x1250c8f5099902ddfb574474612436b0b5db0a15',
    },
    offchain: {
      id: 'ed74c5d6-5112-44f6-acfe-61e9fbfeaf27',
      name: 'ofcpick',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.PICKLE,
    fullName: 'PickleToken',
    decimalPlaces: 18,
    onchain: {
      id: 'f77ed2df-bad2-4300-b1d2-a1f6871081ac',
      name: 'pickle',
      contractAddress: '0x429881672b9ae42b8eba0e26cd9c73711b891ca5',
    },
    offchain: {
      id: 'c0a90971-296a-4108-9e8e-360fa8a96033',
      name: 'ofcpickle',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.PINE,
    fullName: 'Pine Token',
    decimalPlaces: 18,
    onchain: {
      id: '5662dc67-faa9-4359-bca7-57d6d40585f1',
      name: 'pine',
      contractAddress: '0x569424c5ee13884a193773fdc5d1c5f79c443a51',
    },
    offchain: {
      id: '3d1ab8f5-187b-4e2c-997d-c4b658eabb28',
      name: 'ofcpine',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.PIXEL,
    fullName: 'Pixels',
    decimalPlaces: 18,
    onchain: {
      id: 'f362fea8-d01f-4a22-ad4a-7ef0264fdf47',
      name: 'pixel',
      contractAddress: '0x3429d03c6f7521aec737a0bbf2e5ddcef2c3ae31',
    },
    offchain: {
      id: '615704c8-5f15-4ac9-9767-6dfc48b376ef',
      name: 'ofcpixel',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.PIRATE,
    fullName: 'Pirate Nation Token',
    decimalPlaces: 18,
    onchain: {
      id: '92fd332f-4fd4-4346-9e24-12446d595abe',
      name: 'pirate',
      contractAddress: '0x7613c48e0cd50e42dd9bf0f6c235063145f6f8dc',
    },
    offchain: {
      id: '04fd8ad3-228e-49c6-bcd0-09a0fd0b8e0f',
      name: 'ofcpirate',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.PLAY,
    fullName: 'PLAY',
    decimalPlaces: 18,
    onchain: {
      id: '37a72660-61e8-42c8-b486-d966d9ce8c85',
      name: 'play',
      contractAddress: '0x7404ac09adf614603d9c16a7ce85a1101f3514ba',
    },
    offchain: {
      id: '7e972fa6-ea28-4f82-9bcf-e4f3585b35da',
      name: 'ofcplay',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.POLS,
    fullName: 'Polkastarter',
    decimalPlaces: 18,
    onchain: {
      id: '94e47b5b-c0ac-4634-bcdb-b321f12d6953',
      name: 'pols',
      contractAddress: '0x83e6f1e41cdd28eaceb20cb649155049fac3d5aa',
    },
    offchain: {
      id: '35584c00-814f-47ee-82cd-fffe218c0fa3',
      name: 'ofcpols',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.POND,
    fullName: 'Marlin POND',
    decimalPlaces: 18,
    onchain: {
      id: '4121e2f0-b112-4edb-a451-71960e234b4a',
      name: 'pond',
      contractAddress: '0x57b946008913b82e4df85f501cbaed910e58d26c',
    },
    offchain: {
      id: '3a49ad66-92c3-417b-a590-1aaa1b46afa0',
      name: 'ofcpond',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.PONYS,
    fullName: 'My Little Pony',
    decimalPlaces: 9,
    onchain: {
      id: '7735bd50-ad70-4413-ad6a-d69ea3d66d10',
      name: 'ponys',
      contractAddress: '0x350463c9ff85f33fe85ee13342b16012161103ff',
    },
    offchain: {
      id: '658fa66e-262b-4eb9-b88d-4100f5e17c61',
      name: 'ofcponys',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.PROS,
    fullName: 'Prosper',
    decimalPlaces: 18,
    onchain: {
      id: 'd0f912da-e629-4bad-8481-0f74719ef21e',
      name: 'pros',
      contractAddress: '0x8642a849d0dcb7a15a974794668adcfbe4794b56',
    },
    offchain: {
      id: 'fc28f6a4-0a4a-41bf-af8c-908f19f97c61',
      name: 'ofcpros',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.PSP,
    fullName: 'ParaSwap',
    decimalPlaces: 18,
    onchain: {
      id: '4706c998-8d2a-43ae-b1ac-84a7944f4b36',
      name: 'psp',
      contractAddress: '0xcafe001067cdef266afb7eb5a286dcfd277f3de5',
    },
    offchain: {
      id: '87f17a44-a6cc-447f-80a7-b05a97ec3bca',
      name: 'ofcpsp',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.QOM,
    fullName: 'Shiba Predator',
    decimalPlaces: 18,
    onchain: {
      id: 'bbf37c93-425b-4c92-963b-370819e61455',
      name: 'qom',
      contractAddress: '0xa71d0588eaf47f12b13cf8ec750430d21df04974',
    },
    offchain: {
      id: 'caf682e1-6e61-4fc8-ac2a-e3f5fe94f881',
      name: 'ofcqom',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.RALPH,
    fullName: 'Rekt Ralph',
    decimalPlaces: 18,
    onchain: {
      id: '54c88c22-a645-4153-8e3f-ad69ae1504e5',
      name: 'ralph',
      contractAddress: '0x60f99e81d7e9634d1de93af5301e3321c960a575',
    },
    offchain: {
      id: 'e07efdb0-45af-4b50-bf06-eca4c2b84709',
      name: 'ofcralph',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.RAZOR,
    fullName: 'RAZOR',
    decimalPlaces: 18,
    onchain: {
      id: '788e5fa3-b67b-49e8-9f4f-0e34fd54a25d',
      name: 'razor',
      contractAddress: '0x50de6856358cc35f3a9a57eaaa34bd4cb707d2cd',
    },
    offchain: {
      id: 'e3b7d68d-5444-4638-98f0-af05dc121311',
      name: 'ofcrazor',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.RBANK,
    fullName: 'Rural Bank',
    decimalPlaces: 9,
    onchain: {
      id: '80349ac1-7290-473a-bb2c-241bd058a042',
      name: 'rbank',
      contractAddress: '0x3ebfab65b8e233ae6f53d8baf9104af5a49c060d',
    },
    offchain: {
      id: 'd91e97f9-0c2c-4ce5-840f-791ba907c427',
      name: 'ofcrbank',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.RBN,
    fullName: 'Ribbon',
    decimalPlaces: 18,
    onchain: {
      id: 'd90f15af-3ca4-4ca3-9e74-8ad860779a69',
      name: 'rbn',
      contractAddress: '0x6123b0049f904d730db3c36a31167d9d4121fa6b',
    },
    offchain: {
      id: '9998869a-b403-45e7-b522-1459d9f73e3c',
      name: 'ofcrbn',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.RCT,
    fullName: 'realchain',
    decimalPlaces: 18,
    onchain: {
      id: '47d812d2-3641-475a-9839-6507b20f8441',
      name: 'rct',
      contractAddress: '0x13f25cd52b21650caa8225c9942337d914c9b030',
    },
    offchain: {
      id: '3d0d4f0e-4837-42e9-a62c-1e14dfa78a11',
      name: 'ofcrct',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.REF,
    fullName: 'RefToken',
    decimalPlaces: 8,
    onchain: {
      id: 'c77cccc8-fbfb-4892-bb42-c0decda21acf',
      name: 'ref',
      contractAddress: '0x89303500a7abfb178b274fd89f2469c264951e1f',
    },
    offchain: {
      id: 'c317ea90-3bad-4179-ae65-f1575c00add7',
      name: 'ofcref',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.REKTTOKEN,
    fullName: '$REKT',
    decimalPlaces: 18,
    onchain: {
      id: '066ebf64-043a-4cc8-9b72-1f8b11a8bc32',
      name: 'rekttoken',
      contractAddress: '0x4f8b986ecffe7bed5dbeb2b49310fb00ca85a539',
    },
    offchain: {
      id: '439d353b-65c9-4513-85cf-cb8e2a73bc62',
      name: 'ofcrekttoken',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.REKTGAME,
    fullName: 'RektGAME',
    decimalPlaces: 18,
    onchain: {
      id: '3c5ebcde-83d7-4211-9bf2-44dfb3ff6c23',
      name: 'rektgame',
      contractAddress: '0xe627b9cda8398859f5f8d3f7e1cb48ec262aa4a6',
    },
    offchain: {
      id: '786786a2-98cb-425a-8746-9c16a9f46d33',
      name: 'ofcrektgame',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.RENBTC,
    fullName: 'renBTC',
    decimalPlaces: 8,
    onchain: {
      id: '4741e5c2-30c7-4c31-813a-8102b87b49cd',
      name: 'renbtc',
      contractAddress: '0xeb4c2781e4eba804ce9a9803c67d0893436bb27d',
    },
    offchain: {
      id: 'fb6b9335-680a-4c7f-afd3-aed4dd63e9ca',
      name: 'ofcrenbtc',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['RETH-ROCKET'],
    fullName: 'Rocket Pool ETH',
    decimalPlaces: 18,
    onchain: {
      id: 'df2d7e93-5c21-4074-8785-c42e018c14b6',
      name: 'reth-rocket',
      contractAddress: '0xae78736cd615f374d3085123a210448e74fc6393',
      features: [...RETH_ROCKET_FEATURES, CoinFeature.CUSTODY_BITGO_FRANKFURT] as CoinFeature[],
    },
    offchain: {
      id: 'd1025ac5-2adb-41cb-a611-80faff84c344',
      name: 'ofcreth-rocket',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['RETH-STAFI'],
    fullName: 'StaFi (rETH)',
    decimalPlaces: 18,
    onchain: {
      id: '588c7eb4-02fa-4a80-9a0d-158e53d10320',
      name: 'reth-stafi',
      contractAddress: '0x9559aaa82d9649c7a7b220e7c461d2e74c9a3593',
    },
    offchain: {
      id: '5d83bf9b-febd-463b-884d-4866501eef62',
      name: 'ofcreth-stafi',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.REVV,
    fullName: 'REVV',
    decimalPlaces: 18,
    onchain: {
      id: 'b2e16c4e-9e9d-4af2-a6a0-0227297be2ec',
      name: 'revv',
      contractAddress: '0x557b933a7c2c45672b610f8954a3deb39a51a8ca',
    },
    offchain: {
      id: 'b27bb221-9086-414c-b2da-9b8d53c20fbf',
      name: 'ofcrevv',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.REZ,
    fullName: 'Renzo',
    decimalPlaces: 18,
    onchain: {
      id: '9f545c6f-8d3e-4eef-876d-e08dad944a28',
      name: 'rez',
      contractAddress: '0x3b50805453023a91a8bf641e279401a0b23fa6f9',
    },
    offchain: {
      id: '31dc2bdd-31c3-4977-884c-20d035796e17',
      name: 'ofcrez',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.RN,
    fullName: 'Rio Network',
    decimalPlaces: 18,
    onchain: {
      id: 'f596f1a4-530c-46fe-9021-f401655dd870',
      name: 'rn',
      contractAddress: '0x3c61297e71e9bb04b9fbfead72a6d3c70e4f1e4a',
      features: AccountCoin.DEFAULT_FEATURES_EXCLUDE_SINGAPORE as CoinFeature[],
    },
    offchain: {
      id: '2ef897cc-735f-45ec-97fc-b3859c17ee1d',
      name: 'ofcrn',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.RND,
    fullName: 'random',
    decimalPlaces: 18,
    onchain: {
      id: '9f0bb336-b6a9-4a58-9841-333b836ef186',
      name: 'rnd',
      contractAddress: '0x1c7e83f8c581a967940dbfa7984744646ae46b29',
    },
    offchain: {
      id: '7a49dfac-1943-420a-aa20-7649f48eb73f',
      name: 'ofcrnd',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.RUNE,
    fullName: 'THORChain ETH.RUNE',
    decimalPlaces: 18,
    onchain: {
      id: '82982f0a-743f-40da-9f5a-c1ece6af7a4c',
      name: 'rune',
      contractAddress: '0x3155ba85d5f96b2d030a4966af206230e46849cb',
    },
    offchain: {
      id: '80c3e860-f589-4227-a0f5-2aa6b18293c5',
      name: 'ofcrune',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.RVR,
    fullName: 'River',
    decimalPlaces: 18,
    onchain: {
      id: '7bab731c-ba74-4d03-9eb3-d74db3148cfe',
      name: 'rvr',
      contractAddress: '0x53319181e003e7f86fb79f794649a2ab680db244',
    },
    offchain: {
      id: 'd9a34606-691c-4c8e-b549-045f019f3eb8',
      name: 'ofcrvr',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.RYOSHI,
    fullName: 'Ryoshis Vision',
    decimalPlaces: 18,
    onchain: {
      id: '5e2c5e7d-ee76-4a1f-8d2f-2825c65df156',
      name: 'ryoshi',
      contractAddress: '0x777e2ae845272a2f540ebf6a3d03734a5a8f618e',
    },
    offchain: {
      id: 'bb6e751e-17c8-425e-a3e0-8cb34b12a633',
      name: 'ofcryoshi',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.SAFE,
    fullName: 'SAFE',
    decimalPlaces: 18,
    onchain: {
      id: '07d7d3e9-22ad-42fd-a406-f97266df79f2',
      name: 'safe',
      contractAddress: '0x5afe3855358e112b5647b952709e6165e1c1eeee',
    },
    offchain: {
      id: '799795f1-0294-4bb7-9ed1-d5d43fd03e8b',
      name: 'ofcsafe',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.SAITABIT,
    fullName: 'SAITABIT',
    decimalPlaces: 18,
    onchain: {
      id: '76db084a-0a7d-4cf3-a717-80d7f0294c19',
      name: 'saitabit',
      contractAddress: '0x927402ab67c0cda3c187e9dfe34554ac581441f2',
    },
    offchain: {
      id: 'ddbdb518-73f4-4cd9-988b-0ee0e3482aec',
      name: 'ofcsaitabit',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.SBF,
    fullName: 'SAM BANKMAN FRAUD',
    decimalPlaces: 18,
    onchain: {
      id: 'd8eb63ae-e952-46d7-9813-dc5151048a89',
      name: 'sbf',
      contractAddress: '0x74d4f4cb4fdaf47ae4d713470690440133b26086',
    },
    offchain: {
      id: 'd230143b-f052-4b50-9194-2bfd216ad795',
      name: 'ofcsbf',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.SDL,
    fullName: 'Saddle DAO',
    decimalPlaces: 18,
    onchain: {
      id: 'd93761b5-616c-486a-b02b-22f5ff9683ba',
      name: 'sdl',
      contractAddress: '0xf1dc500fde233a4055e25e5bbf516372bc4f6871',
    },
    offchain: {
      id: 'a00ed57b-e421-45f9-a7dd-99e09073f8eb',
      name: 'ofcsdl',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.SETH,
    fullName: 'Shethereum Coin',
    decimalPlaces: 9,
    onchain: {
      id: '2247fe1f-85f4-4db9-b2a8-102f342c5d0c',
      name: 'seth',
      contractAddress: '0xf9062eddfc82aa2c72bb1ec219763a846a6ef828',
    },
    offchain: {
      id: 'e63a3788-05c5-43aa-a996-a7521c1b302c',
      name: 'ofcseth',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.SEWERCOIN,
    fullName: 'SewerCoin',
    decimalPlaces: 18,
    onchain: {
      id: '38b2bf46-3bc2-4156-8197-6dfb389eb393',
      name: 'sewercoin',
      contractAddress: '0x66e286804d8955d7aa8a8a7d529c53f0c82d6a45',
    },
    offchain: {
      id: 'acb0b8ce-1e68-48af-a0bd-c30cf6e47739',
      name: 'ofcsewercoin',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.SHEESH,
    fullName: 'Sheesha Finance',
    decimalPlaces: 18,
    onchain: {
      id: '0debe83f-4be4-4c3f-82b7-6ab4c75c5251',
      name: 'sheesh',
      contractAddress: '0x232fb065d9d24c34708eedbf03724f2e95abe768',
    },
    offchain: {
      id: 'fbbe28fe-03d7-4adf-bf9e-d9b310470517',
      name: 'ofcsheesh',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.SHIDO,
    fullName: 'Shido',
    decimalPlaces: 18,
    onchain: {
      id: 'a9311a0c-a5c8-454e-a7f9-3eaf1e437127',
      name: 'shido',
      contractAddress: '0x72c60bfffef18dca51db32b52b819a951b6ddbed',
    },
    offchain: {
      id: 'a951ccaa-af2f-44f2-8898-4b64a5560581',
      name: 'ofcshido',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.SHOW,
    fullName: 'ShowCoin2.0',
    decimalPlaces: 18,
    onchain: {
      id: 'd734e190-f350-4474-9688-e68c47183605',
      name: 'show',
      contractAddress: '0xf41861f194e7ba8de95144a89e0c6ed16ee0b3a0',
    },
    offchain: {
      id: '1a99998b-5446-46e5-90b9-69cb3e221288',
      name: 'ofcshow',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.SNM,
    fullName: 'SONM',
    decimalPlaces: 18,
    onchain: {
      id: '910e9128-ff83-43d4-9290-82b93659f439',
      name: 'snm',
      contractAddress: '0x983f6d60db79ea8ca4eb9968c6aff8cfa04b3c63',
    },
    offchain: {
      id: '1f4c9655-0cbb-4f22-82c7-c68a06d1a80a',
      name: 'ofcsnm',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.SOMM,
    fullName: 'somm',
    decimalPlaces: 6,
    onchain: {
      id: 'dfa85355-02c5-412e-8d3c-354081b48b97',
      name: 'somm',
      contractAddress: '0xa670d7237398238de01267472c6f13e5b8010fd1',
    },
    offchain: {
      id: '1e2c0fe3-f890-4e47-ad72-d9777e4c2367',
      name: 'ofcsomm',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.SPA,
    fullName: 'Sperax',
    decimalPlaces: 18,
    onchain: {
      id: 'dc0b24fc-2522-4a86-999b-0e9d366a428c',
      name: 'spa',
      contractAddress: '0xb4a3b0faf0ab53df58001804dda5bfc6a3d59008',
    },
    offchain: {
      id: '0c7c1a61-3618-4273-a0e5-610f0da518fe',
      name: 'ofcspa',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.SPF,
    fullName: 'SPF',
    decimalPlaces: 18,
    onchain: {
      id: 'd2c05076-087e-45dc-8c3c-3f0093739b4b',
      name: 'spf',
      contractAddress: '0x85089389c14bd9c77fc2b8f0c3d1dc3363bf06ef',
    },
    offchain: {
      id: '672330fd-69ef-4a67-af85-18ecec643d2b',
      name: 'ofcspf',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['SQUID2.0'],
    fullName: 'Squid Game 2.0',
    decimalPlaces: 18,
    onchain: {
      id: 'c9f821cf-ad0d-44fe-b584-2e9b29bfef59',
      name: 'squidv2',
      contractAddress: '0x2c056f9402a0627bc0e580365bb12979fc011e2c',
    },
    offchain: {
      id: '5898f30a-f352-46bb-b903-04126db323c6',
      name: 'ofcsquidv2',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.STATE,
    fullName: 'ParaState Governance Token',
    decimalPlaces: 18,
    onchain: {
      id: 'f4263d4d-e19f-4658-9491-d91aabc53ab1',
      name: 'state',
      contractAddress: '0xdc6104b7993e997ca5f08acab7d3ae86e13d20a6',
    },
    offchain: {
      id: '6cba0b10-355b-4374-99e7-740d2d9911a7',
      name: 'ofcstate',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.STRIKE,
    fullName: 'Strike Token',
    decimalPlaces: 18,
    onchain: {
      id: 'eb08e7e2-aab1-44ae-94cf-0c803d138404',
      name: 'strike',
      contractAddress: '0x74232704659ef37c08995e386a2e26cc27a8d7b1',
    },
    offchain: {
      id: '5e480856-9469-4b9d-a4f6-197a2b319327',
      name: 'ofcstrike',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['SUI-ERC20'],
    fullName: 'Sui (ERC20 token)',
    decimalPlaces: 18,
    onchain: {
      id: '0b920a54-5a6e-4b18-8f29-1f9ef18ba6b9',
      name: 'sui-erc20',
      contractAddress: '0xa6bbcca6cc125ec53c495db672892b2e2a42bb87',
    },
    offchain: {
      id: '8379fcca-6014-4fd0-bf6e-5977a54f18f6',
      name: 'ofcsui-erc20',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.SUPERPERIO,
    fullName: 'SUPER PERIO',
    decimalPlaces: 9,
    onchain: {
      id: '4a0d9346-11e7-49b5-b264-ffc1f950c697',
      name: 'superperio',
      contractAddress: '0x06be9ff320bc83e9d4c85fe2b3b98d028d3dbf03',
    },
    offchain: {
      id: 'e452a225-5699-49e4-b01a-deebb9a29138',
      name: 'ofcsuperperio',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.SWEAT,
    fullName: 'SWEAT',
    decimalPlaces: 18,
    onchain: {
      id: '6a3a4276-9050-4798-8eb3-ab731e3eca11',
      name: 'sweat',
      contractAddress: '0xb4b9dc1c77bdbb135ea907fd5a08094d98883a35',
    },
    offchain: {
      id: '9071d758-55c3-4aea-b0ce-6ffdb9368c46',
      name: 'ofcsweat',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.SWETH,
    fullName: 'Swell Ethereum',
    decimalPlaces: 18,
    onchain: {
      id: '98618b8f-ce85-4c78-8b9a-7cd001c11873',
      name: 'sweth',
      contractAddress: '0xf951e335afb289353dc249e82926178eac7ded78',
      features: ACCOUNT_COIN_DEFAULT_FEATURES_EXCLUDE_SINGAPORE as CoinFeature[],
    },
    offchain: {
      id: 'd64580ff-c720-4f84-8625-f1df825fc507',
      name: 'ofcsweth',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.SWITCH,
    fullName: 'Switch',
    decimalPlaces: 8,
    onchain: {
      id: '868974cb-029a-4166-8d43-5cab2dadef13',
      name: 'switch',
      contractAddress: '0xb10cc888cb2cce7036f4c7ecad8a57da16161338',
    },
    offchain: {
      id: 'ca808dbd-aec7-4f16-b6fe-a851daed5d34',
      name: 'ofcswitch',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.SWRV,
    fullName: 'Swerve DAO',
    decimalPlaces: 18,
    onchain: {
      id: 'b59d1baf-ca98-43a3-9895-6378496e0447',
      name: 'swrv',
      contractAddress: '0xb8baa0e4287890a5f79863ab62b7f175cecbd433',
    },
    offchain: {
      id: '030491f3-0f3c-4726-b13c-5f7c0b0a18d9',
      name: 'ofcswrv',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.SYNCH,
    fullName: 'Synapse Chain',
    decimalPlaces: 18,
    onchain: {
      id: '8cf6fcd8-7873-4a93-b091-346853ef7575',
      name: 'synch',
      contractAddress: '0xea12642633b5cf03d9111efb13512d46502a7597',
    },
    offchain: {
      id: '8c827f97-b076-4bc3-b6c7-35689f488d0f',
      name: 'ofcsynch',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.SYRUP,
    fullName: 'Syrup',
    decimalPlaces: 18,
    onchain: {
      id: 'bd5084b8-a566-4ff9-ae0e-42ed6d5a9f70',
      name: 'syrup',
      contractAddress: '0x643c4e15d7d62ad0abec4a9bd4b001aa3ef52d66',
      features: ETH_FEATURES_WITH_FRANKFURT as CoinFeature[],
    },
    offchain: {
      id: '9f0dc3ae-3a8a-4b81-aef6-ba41fd9530bb',
      name: 'ofcsyrup',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TELEGRAMDAO,
    fullName: 'Telegram Dao',
    decimalPlaces: 18,
    onchain: {
      id: '31e842ac-eaa8-438d-a779-138183ae502e',
      name: 'telegramdao',
      contractAddress: '0x07e5580ab895022e004b039941b9e775ea631d95',
    },
    offchain: {
      id: '015436ee-9dce-4e7a-99be-c79e0d156160',
      name: 'ofctelegramdao',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TERM,
    fullName: 'Term Finance',
    decimalPlaces: 18,
    onchain: {
      id: '1dc901bc-9146-418e-ba18-8f9f84e33859',
      name: 'term',
      contractAddress: '0xc3d21f79c3120a4ffda7a535f8005a7c297799bf',
    },
    offchain: {
      id: '80ebeef2-36f7-4dc4-a868-0f9c575a1374',
      name: 'ofcterm',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TIO,
    fullName: 'Trade',
    decimalPlaces: 18,
    onchain: {
      id: '2e9e9cf0-b33b-4929-8016-172329bb4a99',
      name: 'tio',
      contractAddress: '0x80bc5512561c7f85a3a9508c7df7901b370fa1df',
    },
    offchain: {
      id: 'fd7fc0ef-e53c-44fd-bbbc-9d61922c50a9',
      name: 'ofctio',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TOKAMAK,
    fullName: 'Tokamak Network Token',
    decimalPlaces: 18,
    onchain: {
      id: '1577a911-4428-44ea-9509-ba31ab7d75e1',
      name: 'tokamak',
      contractAddress: '0x2be5e8c109e2197d077d13a82daead6a9b3433c5',
    },
    offchain: {
      id: 'ad9a68f5-fc6f-4335-9a17-142091deb488',
      name: 'ofctokamak',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TOKE,
    fullName: 'Tokemak',
    decimalPlaces: 18,
    onchain: {
      id: '946d2073-ca47-470f-af4e-dd640a24c57b',
      name: 'toke',
      contractAddress: '0x2e9d63788249371f1dfc918a52f8d799f4a38c94',
    },
    offchain: {
      id: 'b8e243c4-0116-4f4b-a78e-4479a84277e1',
      name: 'ofctoke',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TOKEN,
    fullName: 'TokenFi',
    decimalPlaces: 9,
    onchain: {
      id: '9f81ef58-a9ef-44fb-9e51-e57a526921d1',
      name: 'token',
      contractAddress: '0x4507cef57c46789ef8d1a19ea45f4216bae2b528',
    },
    offchain: {
      id: 'b2fbba50-e18f-40b1-a0cf-747ad284f39d',
      name: 'ofctoken',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TOMI,
    fullName: 'tomi Token',
    decimalPlaces: 18,
    onchain: {
      id: '2a831eb5-a7b1-44ab-9cdb-626d21ab6d03',
      name: 'tomi',
      contractAddress: '0x4385328cc4d643ca98dfea734360c0f596c83449',
    },
    offchain: {
      id: '9e6923a4-2183-44eb-b758-c748bbc5778c',
      name: 'ofctomi',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TOMOBEAR2,
    fullName: '3X Short TomoChain Token',
    decimalPlaces: 18,
    onchain: {
      id: 'b8c1d4ce-eac5-4a31-b092-8769f72dddae',
      name: 'tomobear2',
      contractAddress: '0x345208c513fff0b1b0768cd12b6123033995e19e',
    },
    offchain: {
      id: 'c8bb5f7c-c670-4ba2-9fd1-be12a41f6624',
      name: 'ofctomobear2',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TRUMPLOSE,
    fullName: 'Trump Loses Token',
    decimalPlaces: 18,
    onchain: {
      id: '097682c2-bae8-4952-8391-70eb5b9b8ce0',
      name: 'trumplose',
      contractAddress: '0x70878b693a57a733a79560e33cf6a828e685d19a',
    },
    offchain: {
      id: '5dc64bcf-5f16-483e-ac53-d840a49ddc7f',
      name: 'ofctrumplose',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TRUMPWIN,
    fullName: 'Trump Wins Token',
    decimalPlaces: 18,
    onchain: {
      id: '609aa3fd-c1b4-4ab2-8769-98075e21407c',
      name: 'trumpwin',
      contractAddress: '0x073af3f70516380654ba7c5812c4ab0255f081bc',
    },
    offchain: {
      id: '0d8bbab0-0faa-4654-b9d1-e2dd5c203036',
      name: 'ofctrumpwin',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['TRX-ERC20'],
    fullName: 'Tron (ERC20 token)',
    decimalPlaces: 6,
    onchain: {
      id: '84d9310d-6b1f-46ca-b6d7-7675161c5d14',
      name: 'trx-erc20',
      contractAddress: '0x50327c6c5a14dcade707abad2e27eb517df87ab5',
    },
    offchain: {
      id: '29edb007-079c-4f45-997b-d320ecc19c43',
      name: 'ofctrx-erc20',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TRXDOOM,
    fullName: '10X Short TRX Token',
    decimalPlaces: 18,
    onchain: {
      id: 'e399738e-6443-448c-9df7-3d136fd573d3',
      name: 'trxdoom',
      contractAddress: '0xc58432a1969a2cb15f14dae6dcca736cfa60285a',
    },
    offchain: {
      id: '0662519b-d563-4b43-a0b1-168239718e00',
      name: 'ofctrxdoom',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TRXMOON,
    fullName: '10X Long TRX Token',
    decimalPlaces: 18,
    onchain: {
      id: '7caf62e7-48b3-4e57-9c7b-f23c4f388638',
      name: 'trxmoon',
      contractAddress: '0x681f1a3761384109e5bc52f7d479ef27540a5641',
    },
    offchain: {
      id: '1de3597a-21c5-4d3b-9249-27d1ff379a01',
      name: 'ofctrxmoon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TRYBBEAR,
    fullName: '3X Short BiLira Token',
    decimalPlaces: 18,
    onchain: {
      id: '8fcf6afb-0f7a-40b1-a4dc-d5696de5aa65',
      name: 'trybbear',
      contractAddress: '0xa5ddfca8b837ccd0cf80fe6c24e2a9018fb50dba',
    },
    offchain: {
      id: 'c501e2e3-5a5c-445a-bbc3-b42c8c8c8e52',
      name: 'ofctrybbear',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TRYBBULL,
    fullName: '3X Long BiLira Token',
    decimalPlaces: 18,
    onchain: {
      id: '24ca3fda-75ea-42f1-8d6e-568ec15533a7',
      name: 'trybbull',
      contractAddress: '0xc7038ccf60e48c5b7119e55566a6ad9f2d66c7c2',
    },
    offchain: {
      id: '86adc424-5f18-48fb-b21c-5de69c17b5d5',
      name: 'ofctrybbull',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TSUKA,
    fullName: 'Dejitaru Tsuka',
    decimalPlaces: 9,
    onchain: {
      id: '0ef99a81-db3d-401f-b906-80cde4087a07',
      name: 'tsuka',
      contractAddress: '0xc5fb36dd2fb59d3b98deff88425a3f425ee469ed',
    },
    offchain: {
      id: '35cca048-0ad4-42f8-8a67-dc423ed99c6b',
      name: 'ofctsuka',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['USDC-POS-WORMHOLE'],
    fullName: 'USD Coin (PoS) (Wormhole) (USDC)',
    decimalPlaces: 6,
    onchain: {
      id: '11c19bba-3a20-41f8-bc91-4f5d8a68c33b',
      name: 'usdc-pos-wormhole',
      contractAddress: '0x566957ef80f9fd5526cd2bef8be67035c0b81130',
    },
    offchain: {
      id: 'fe098f77-ef5a-4ea8-b85f-1e813b60d9fd',
      name: 'ofcusdc-pos-wormhole',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.USCC,
    fullName: 'USCC',
    decimalPlaces: 8,
    onchain: {
      id: 'f44d9e6d-1c64-429a-8e45-7f973b5bff5f',
      name: 'uscc',
      contractAddress: '0x7b13abb88eb01aa0cd9739b91d4d4f273262eacf',
      features: AccountCoin.getFeaturesByTypeExcluding(
        [
          CoinFeature.CUSTODY_BITGO_SINGAPORE,
          CoinFeature.CUSTODY_BITGO_GERMANY,
          CoinFeature.CUSTODY_BITGO_EUROPE_APS,
          CoinFeature.CUSTODY_BITGO_FRANKFURT,
        ],
        ETH_FEATURES
      ) as CoinFeature[],
    },
    offchain: {
      id: '6eea1886-280f-4fef-b392-8d0299437dfd',
      name: 'ofcuscc',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.USDGLO,
    fullName: 'Glo Dollar',
    decimalPlaces: 18,
    onchain: {
      id: 'efae2e71-10b8-4461-8e84-51390f6e77df',
      name: 'usdglo',
      contractAddress: '0x4f604735c1cf31399c6e711d5962b2b3e0225ad3',
      features: [...ACCOUNT_COIN_DEFAULT_FEATURES, CoinFeature.STABLECOIN] as CoinFeature[],
    },
    offchain: {
      id: '1bc9f8be-81ea-4d1f-b55d-80c1986743f9',
      name: 'ofcusdglo',
      features: [CoinFeature.STABLECOIN] as CoinFeature[],
    },
  },
  {
    underlyingAsset: UnderlyingAsset.USDK,
    fullName: 'USDK',
    decimalPlaces: 18,
    onchain: {
      id: 'b775f7f9-268f-457a-8476-bc64d832425a',
      name: 'usdk',
      contractAddress: '0x1c48f86ae57291f7686349f12601910bd8d470bb',
      features: [...ACCOUNT_COIN_DEFAULT_FEATURES, CoinFeature.STABLECOIN] as CoinFeature[],
    },
    offchain: {
      id: '930506e9-5672-4a26-bc09-58df72267cac',
      name: 'ofcusdk',
      features: [CoinFeature.STABLECOIN] as CoinFeature[],
    },
  },
  {
    underlyingAsset: UnderlyingAsset.USDTBEAR,
    fullName: '3X Short Tether Token',
    decimalPlaces: 18,
    onchain: {
      id: '29a77428-7ddf-4dce-8845-2296cb1fc305',
      name: 'usdtbear',
      contractAddress: '0x0cd6c8161f1638485a1a2f5bf1a0127e45913c2f',
    },
    offchain: {
      id: '1c891223-1ffb-409d-89b9-52e57c7fc02a',
      name: 'ofcusdtbear',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.USDTBULL,
    fullName: '3X Long Tether token',
    decimalPlaces: 18,
    onchain: {
      id: '2645fe2b-e0c9-42e5-864c-13bfc80d0737',
      name: 'usdtbull',
      contractAddress: '0x8cce19943a01e78b7c277794fb081816f6151bab',
    },
    offchain: {
      id: '6a8aadfe-1f75-4a62-9b17-980cd4712bfa',
      name: 'ofcusdtbull',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.USDTDOOM,
    fullName: '10X Short Tether Token',
    decimalPlaces: 18,
    onchain: {
      id: 'a06496d1-af4e-4532-9a92-2ae1e28243a1',
      name: 'usdtdoom',
      contractAddress: '0xc2d3d1cbab16f0e77acd96b08edd3c4dd4129763',
    },
    offchain: {
      id: '476af32f-614f-405c-a5e8-060922cd3190',
      name: 'ofcusdtdoom',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.USDTHEDGE,
    fullName: '1X Short Tether Token',
    decimalPlaces: 18,
    onchain: {
      id: 'e2a99e6a-2b82-4db8-933b-7c877a46e9ed',
      name: 'usdthedge',
      contractAddress: '0xf3b8d4b2607a39114dacb902bacd4ddde7182560',
    },
    offchain: {
      id: '0b89f0e8-8c9e-405e-8ede-51a8ef5aa012',
      name: 'ofcusdthedge',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.USDTMOON,
    fullName: '10X Long Tether Token',
    decimalPlaces: 18,
    onchain: {
      id: '16987603-d552-4e13-8a67-dd560b39bcf1',
      name: 'usdtmoon',
      contractAddress: '0x1deabd4df1df41f68dba1811c2eb5f4fff033ba9',
    },
    offchain: {
      id: '21bdd40f-f401-4180-8054-3587053e7aed',
      name: 'ofcusdtmoon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['UST-WORMHOLE'],
    fullName: 'UST (Wormhole)',
    decimalPlaces: 6,
    onchain: {
      id: '9450e353-266b-480d-912e-b96525fd0f91',
      name: 'ust-wormhole',
      contractAddress: '0xa693b19d2931d498c5b318df961919bb4aee87a5',
    },
    offchain: {
      id: '9f390b5e-8c96-4cea-92d4-98b7805a6d35',
      name: 'ofcust-wormhole',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.VBNT,
    fullName: 'Bancor Governance Token',
    decimalPlaces: 18,
    onchain: {
      id: '21bee20f-e2da-43f8-a9f9-315d1b0851f2',
      name: 'vbnt',
      contractAddress: '0x48fb253446873234f2febbf9bdeaa72d9d387f94',
    },
    offchain: {
      id: 'b2a31271-1178-4ee3-80a8-962a0d07b722',
      name: 'ofcvbnt',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.VEE,
    fullName: 'BLOCKv',
    decimalPlaces: 18,
    onchain: {
      id: '2171f08d-5c93-4544-865d-447443a0a6c6',
      name: 'vee',
      contractAddress: '0x340d2bde5eb28c1eed91b2f790723e3b160613b7',
    },
    offchain: {
      id: '9432e2e7-44c0-409f-bc9f-f2b6aaef0ec7',
      name: 'ofcvee',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.VIU,
    fullName: 'VIU',
    decimalPlaces: 18,
    onchain: {
      id: 'ba71e7f2-180a-4c01-b76e-cc90a0006536',
      name: 'viu',
      contractAddress: '0x519475b31653e46d20cd09f9fdcf3b12bdacb4f5',
    },
    offchain: {
      id: 'b006f6f1-9ce1-42f5-8b85-2af5e5d3898d',
      name: 'ofcviu',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.VOLT,
    fullName: 'Volt Inu',
    decimalPlaces: 9,
    onchain: {
      id: 'a7766e88-63d8-4aae-a819-b1c5cf56b4ce',
      name: 'volt',
      contractAddress: '0x7f792db54b0e580cdc755178443f0430cf799aca',
      features: [
        ...ACCOUNT_COIN_DEFAULT_FEATURES_EXCLUDE_SINGAPORE_AND_MENA_FZE,
        CoinFeature.BULK_TRANSACTION,
      ] as CoinFeature[],
    },
    offchain: {
      id: '2b092ac7-690a-4d1a-b361-7efb0c6eb23f',
      name: 'ofcvolt',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.VRA,
    fullName: 'VERA',
    decimalPlaces: 18,
    onchain: {
      id: '30a19a96-87c5-494c-bda6-ff98b065f35b',
      name: 'vra',
      contractAddress: '0xf411903cbc70a74d22900a5de66a2dda66507255',
    },
    offchain: {
      id: '24a6e11b-b944-408c-82bb-0ce5b9fb5ba8',
      name: 'ofcvra',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.VXV,
    fullName: 'VectorspaceAI',
    decimalPlaces: 18,
    onchain: {
      id: '2ac24a6b-3525-4981-a6a3-cae48b5d072a',
      name: 'vxv',
      contractAddress: '0x7d29a64504629172a429e64183d6673b9dacbfce',
    },
    offchain: {
      id: '502741b0-5215-450f-bc32-e44c65d7795c',
      name: 'ofcvxv',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.W,
    fullName: 'Wormhole Token',
    decimalPlaces: 18,
    onchain: {
      id: 'ff69a200-eea1-4708-abef-69b6920700f8',
      name: 'w',
      contractAddress: '0xb0ffa8000886e57f86dd5264b9582b2ad87b2b91',
    },
    offchain: {
      id: 'cbb73d46-ce0d-4045-822b-8aa0d6fb8ad4',
      name: 'ofcw',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.WAGMI,
    fullName: 'WAGMI GAMES',
    decimalPlaces: 18,
    onchain: {
      id: '68355bfb-c8c4-49bd-ba3b-bb58195e55a0',
      name: 'wagmi',
      contractAddress: '0x3b604747ad1720c01ded0455728b62c0d2f100f0',
    },
    offchain: {
      id: 'f5bd9bff-64ea-4922-9cec-0f6ddfb27689',
      name: 'ofcwagmi',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.WAVAX,
    fullName: 'Wrapped AVAX (Wormhole)',
    decimalPlaces: 18,
    onchain: {
      id: 'c365bfe3-4b97-4f89-b616-fd05570b705e',
      name: 'wavax',
      contractAddress: '0x85f138bfee4ef8e540890cfb48f620571d67eda3',
    },
    offchain: {
      id: '579c6c11-07a5-465d-a773-ed07000eda44',
      name: 'ofcwavax',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.WAXP,
    fullName: 'WAXP Token',
    decimalPlaces: 8,
    onchain: {
      id: 'b2d89322-7696-4ee8-92bd-ede82c3cac43',
      name: 'waxp',
      contractAddress: '0x2a79324c19ef2b89ea98b23bc669b7e7c9f8a517',
    },
    offchain: {
      id: 'e2645598-d669-4c47-a51d-8e6b71d7fa3f',
      name: 'ofcwaxp',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.WFEE,
    fullName: 'WFee',
    decimalPlaces: 18,
    onchain: {
      id: '8b4f0b71-4c47-4c14-bb91-38a5b89ffd1d',
      name: 'wfee',
      contractAddress: '0xa37adde3ba20a396338364e2ddb5e0897d11a91d',
    },
    offchain: {
      id: 'd51457b6-2608-45cf-a4b2-8c51f9f711e7',
      name: 'ofcwfee',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.WHAT,
    fullName: 'What',
    decimalPlaces: 18,
    onchain: {
      id: 'db5c2f96-249d-418e-a35c-5f09d9400e04',
      name: 'what',
      contractAddress: '0x8df566cb30994babc1bf4702b811a7afae47e043',
    },
    offchain: {
      id: 'b8f4ad6c-0937-46d4-b094-a56e3d7e5ebe',
      name: 'ofcwhat',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.XDOGE,
    fullName: 'XDoge',
    decimalPlaces: 18,
    onchain: {
      id: '7c208f9b-225d-4d2f-aeda-188ba92bf536',
      name: 'xdoge',
      contractAddress: '0xe99d37ac2b9ca7cef35db75d0a094f260578ffda',
    },
    offchain: {
      id: 'c6ec2c4e-9069-49f1-ade3-87d4efb928b2',
      name: 'ofcxdoge',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.XRPDOOM,
    fullName: '10X Short XRP Token',
    decimalPlaces: 18,
    onchain: {
      id: 'f4c4c2c5-78d9-48a5-9ba5-a8df9a7ab7c0',
      name: 'xrpdoom',
      contractAddress: '0x526664ca8ff5e5b924270bd6bd89bf5d58fc79cd',
    },
    offchain: {
      id: '6c76b3c0-7ad9-42cb-aade-ce3c431bfec9',
      name: 'ofcxrpdoom',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.XRPMOON,
    fullName: '10X Long XRP Token',
    decimalPlaces: 18,
    onchain: {
      id: '1de1c1a4-cc9a-4843-bc6c-91fe59beb9ff',
      name: 'xrpmoon',
      contractAddress: '0x574a37b7244dabb08ce1618193f818f1c85180e6',
    },
    offchain: {
      id: '6c513005-5a49-4d8b-bc54-2089b4bb0fdd',
      name: 'ofcxrpmoon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.YAMV2,
    fullName: 'YAMv2',
    decimalPlaces: 24,
    onchain: {
      id: 'c178bb57-4b6c-4374-aee3-258516d2be78',
      name: 'yamv2',
      contractAddress: '0xaba8cac6866b83ae4eec97dd07ed254282f6ad8a',
    },
    offchain: {
      id: '92f47bc9-4575-4c75-b83e-2b7ccdd8f53a',
      name: 'ofcyamv2',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ZIP,
    fullName: 'Zipper',
    decimalPlaces: 18,
    onchain: {
      id: '7661f84d-f69b-4327-b51a-278e8210c21a',
      name: 'zip',
      contractAddress: '0xa9d2927d3a04309e008b6af6e2e282ae2952e7fd',
    },
    offchain: {
      id: '9e642e16-960c-4229-8ceb-18675800639d',
      name: 'ofczip',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ZKS,
    fullName: 'Zks',
    decimalPlaces: 18,
    onchain: {
      id: '6891998d-d9ae-4387-9965-3fba8564f4a1',
      name: 'zks',
      contractAddress: '0xe4815ae53b124e7263f08dcdbbb757d41ed658c6',
    },
    offchain: {
      id: '5398d0d2-5241-4946-b67a-5b39d6815c83',
      name: 'ofczks',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.ZRO,
    fullName: 'LayerZero',
    decimalPlaces: 18,
    onchain: {
      id: '946ce16a-d989-4931-a7e2-8ef5b7578e2d',
      name: 'zro',
      contractAddress: '0x6985884c4392d348587b19cb9eaaf157f13271cd',
    },
    offchain: {
      id: '4419a432-b655-4941-92f6-a8a8a405ee97',
      name: 'ofczro',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['ZRO-0x320'],
    fullName: 'LayerZero',
    decimalPlaces: 18,
    onchain: {
      id: 'faf84fca-7709-48e2-94c3-9d1a2b8a9893',
      name: 'zro-0x320',
      contractAddress: '0x32002658029da06fffcfbad58706aa325b3e236e',
    },
    offchain: {
      id: '961291d9-6ed8-4f7e-8c67-f8a24763e076',
      name: 'ofczro-0x320',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['ZRO-0xFCF'],
    fullName: 'LayerZero',
    decimalPlaces: 18,
    onchain: {
      id: '17aed51c-c4fb-4b9c-9010-f612e0384041',
      name: 'zro-0xfcf',
      contractAddress: '0xfcf5aab1508b526130ffd3d202481f4d3529ea2e',
    },
    offchain: {
      id: 'a259fa17-57f7-45bb-93f5-ec1c384ce408',
      name: 'ofczro-0xfcf',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['ZRO-0xE5C'],
    fullName: 'LayerZero',
    decimalPlaces: 18,
    onchain: {
      id: '9599b1b4-822a-4abd-908e-672a22569eaa',
      name: 'zro-0xe5c',
      contractAddress: '0xe5c5ae39b98efd9d3c9e0f2a5457d98ffa4b0b46',
    },
    offchain: {
      id: '5758aed7-9e32-4ed4-9d47-4eb41556ea14',
      name: 'ofczro-0xe5c',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.AUCTION,
    fullName: 'Bounce Token',
    decimalPlaces: 18,
    onchain: {
      id: 'd5c9b134-1b24-4f0b-b93e-079b79ee90ef',
      name: 'auction',
      contractAddress: '0xa9b1eb5908cfc3cdf91f9b8b3a74108598009096',
    },
    offchain: {
      id: '60627e77-87a8-49bb-aaaf-069e6630640b',
      name: 'ofcauction',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.AVA,
    fullName: 'AVA',
    decimalPlaces: 18,
    onchain: {
      id: '921a26e2-d8b9-43b8-84d5-ebfef8a543c9',
      name: 'ava',
      contractAddress: '0xa6c0c097741d55ecd9a3a7def3a8253fd022ceb9',
    },
    offchain: {
      id: '9a997c54-90e3-4cd0-a79f-5f5de0aed3d1',
      name: 'ofcava',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BETA,
    fullName: 'Beta Token',
    decimalPlaces: 18,
    onchain: {
      id: '33d10d7a-1495-4e64-b724-88f34e93c383',
      name: 'beta',
      contractAddress: '0xbe1a001fe942f96eea22ba08783140b9dcc09d28',
    },
    offchain: {
      id: 'b63364df-1fef-43a8-84b8-1f1202377ee6',
      name: 'ofcbeta',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BGB,
    fullName: 'Bitget',
    decimalPlaces: 18,
    onchain: {
      id: '59b135f2-77f9-4c6e-b97d-a5eb11c225ee',
      name: 'bgb',
      contractAddress: '0x54d2252757e1672eead234d27b1270728ff90581',
    },
    offchain: {
      id: 'eb54ecb6-7312-42c0-926a-1600d61a50dc',
      name: 'ofcbgb',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BIGTIME,
    fullName: 'Big Time',
    decimalPlaces: 18,
    onchain: {
      id: '4cd37e4b-bb0f-449f-84d7-7c6dd4031dc3',
      name: 'bigtime',
      contractAddress: '0x64bc2ca1be492be7185faa2c8835d9b824c8a194',
    },
    offchain: {
      id: '242d03f9-34b9-4ed6-8fd3-de343b1c532e',
      name: 'ofcbigtime',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:aevo'],
    fullName: 'Aevo',
    decimalPlaces: 18,
    onchain: {
      id: 'a6a075b1-5e85-4f06-9ca0-6ba9d3a67994',
      name: 'eth:aevo',
      contractAddress: '0xb528edbef013aff855ac3c50b381f253af13b997',
    },
    offchain: {
      id: 'c98091ab-9744-4705-9567-cc15f383c573',
      name: 'ofceth:aevo',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:alt'],
    fullName: 'AltLayer',
    decimalPlaces: 18,
    onchain: {
      id: '0d952130-c891-4b01-a84a-a523c19bda4f',
      name: 'eth:alt',
      contractAddress: '0x8457ca5040ad67fdebbcc8edce889a335bc0fbfb',
    },
    offchain: {
      id: 'b3590232-8360-4c0b-ab0e-c48c4e541d49',
      name: 'ofceth:alt',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:rtbl'],
    fullName: 'Rolling T-bill',
    decimalPlaces: 6,
    onchain: {
      id: '64c0c7cb-aee4-42cf-9d9c-5258c9551ba7',
      name: 'eth:rtbl',
      contractAddress: '0x526be1c610616be0e8e69893fc6766fddfbada61',
      features: AccountCoin.DEFAULT_FEATURES_EXCLUDE_SINGAPORE as CoinFeature[],
    },
    offchain: {
      id: 'b75bff33-9720-469c-9ad7-f9f3c7b27f4d',
      name: 'ofceth:rtbl',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:usdg'],
    fullName: 'Global Dollar',
    decimalPlaces: 6,
    onchain: {
      id: '147e1c0b-20a4-4862-9038-42a6fb7894d0',
      name: 'eth:usdg',
      contractAddress: '0xe343167631d89b6ffc58b88d6b7fb0228795491d',
      features: [...ACCOUNT_COIN_DEFAULT_FEATURES, CoinFeature.STABLECOIN] as CoinFeature[],
    },
    offchain: {
      id: '80bfa43e-f01c-42bd-bd14-269b88948bbf',
      name: 'ofceth:usdg',
      features: [CoinFeature.STABLECOIN] as CoinFeature[],
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:spxux'],
    fullName: 'WisdomTree 500 Digital Fund',
    decimalPlaces: 18,
    onchain: {
      id: '36ec9ba1-359b-4a05-addb-ada12ced8371',
      name: 'eth:spxux',
      contractAddress: '0x873d589f38abbcdd1fca27261aba2f1aa0661d44',
    },
    offchain: {
      id: '2af4bdb7-18eb-46d5-a31a-22e297f12de9',
      name: 'ofceth:spxux',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:aleo'],
    fullName: 'Aleo',
    decimalPlaces: 3,
    onchain: {
      id: 'cd21be23-a0f4-4706-8b00-cee136e1188a',
      name: 'eth:aleo',
      contractAddress: '0xa8162a07efa81602c3803772d18d1789a44fd87a',
    },
    offchain: {
      id: '830c6c0f-b601-406b-a853-3a88ff85533d',
      name: 'ofceth:aleo',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:dbusd'],
    fullName: 'Deep Blue USD',
    decimalPlaces: 6,
    onchain: {
      id: '4ce3341b-4811-47fd-a2d0-127e30a60d66',
      name: 'eth:dbusd',
      contractAddress: '0x32bdd8b97868acf7014cfe6eb49bf4f2936c8f02',
      features: [...ACCOUNT_COIN_DEFAULT_FEATURES, CoinFeature.STABLECOIN] as CoinFeature[],
    },
    offchain: {
      id: 'c35c457f-2741-41aa-9c33-3a41f5ce6b1b',
      name: 'ofceth:dbusd',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:edu'],
    fullName: 'Open Campus',
    decimalPlaces: 18,
    onchain: {
      id: '6418f63b-3c9b-4880-9034-e286d3abd1ac',
      name: 'eth:edu',
      contractAddress: '0xf8173a39c56a554837c4c7f104153a005d284d11',
    },
    offchain: {
      id: 'fe2f5c57-90e4-49e0-a635-b6f1cec0c750',
      name: 'ofceth:edu',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:telos'],
    fullName: 'Telos',
    decimalPlaces: 18,
    onchain: {
      id: '58738d34-bed7-4c34-aa51-472fe83b3a33',
      name: 'eth:telos',
      contractAddress: '0x193f4a4a6ea24102f49b931deeeb931f6e32405d',
    },
    offchain: {
      id: 'b1466e8d-179e-491e-a25f-d6af291f0ee2',
      name: 'ofceth:telos',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:cusdo'],
    fullName: 'Compounding Open Dollar',
    decimalPlaces: 18,
    onchain: {
      id: '56ef1e13-8f49-4a1d-8e43-623880fa9a10',
      name: 'eth:cusdo',
      contractAddress: '0xad55aebc9b8c03fc43cd9f62260391c13c23e7c0',
    },
    offchain: {
      id: '7ed9a25b-86e8-49a8-932f-3c6b38ad2d42',
      name: 'ofceth:cusdo',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:virtual'],
    fullName: 'Virtual Protocol',
    decimalPlaces: 18,
    onchain: {
      id: '1fe2a541-8cf8-4634-9404-8945042edd68',
      name: 'eth:virtual',
      contractAddress: '0x44ff8620b8ca30902395a7bd3f2407e1a091bf73',
    },
    offchain: {
      id: '03a02e79-f604-4b79-96da-fb4a21456566',
      name: 'ofceth:virtual',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:vice'],
    fullName: 'VICE',
    decimalPlaces: 18,
    onchain: {
      id: '8970dd16-3fa8-409b-b17c-d06ea9a7a900',
      name: 'eth:vice',
      contractAddress: '0xfd409bc96d126bc8a56479d4c7672015d539f96c',
    },
    offchain: {
      id: '48851a8f-ed7b-4623-af1a-5c3c44258484',
      name: 'ofceth:vice',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:god'],
    fullName: 'GOD Coin',
    decimalPlaces: 18,
    onchain: {
      id: '60b28982-4036-448f-b449-597e0889a7b5',
      name: 'eth:god',
      contractAddress: '0xb5130f4767ab0acc579f25a76e8f9e977cb3f948',
      features: AccountCoin.getFeaturesByTypeExcluding(
        [
          CoinFeature.CUSTODY_BITGO_GERMANY,
          CoinFeature.CUSTODY_BITGO_EUROPE_APS,
          CoinFeature.CUSTODY_BITGO_FRANKFURT,
          CoinFeature.CUSTODY_BITGO_SINGAPORE,
          CoinFeature.CUSTODY_BITGO_MENA_FZE,
        ],
        ETH_FEATURES
      ) as CoinFeature[],
    },
    offchain: {
      id: 'b9ba422b-d02a-4722-8b35-140cccb28ab0',
      name: 'ofceth:god',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:sky'],
    fullName: 'Sky',
    decimalPlaces: 18,
    onchain: {
      id: 'f106b4aa-1c9a-4d81-b580-1a02dabb8680',
      name: 'eth:sky',
      contractAddress: '0x56072c95faa701256059aa122697b133aded9279',
      features: ETH_FEATURES_WITH_GERMANY as CoinFeature[],
    },
    offchain: {
      id: '6d34cd07-5676-4d5e-b117-f7d152cf7131',
      name: 'ofceth:sky',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:fuel'],
    fullName: 'Fuel',
    decimalPlaces: 9,
    onchain: {
      id: 'c6ea07a4-4fda-4018-b2cf-967d4bf41255',
      name: 'eth:fuel',
      contractAddress: '0x675b68aa4d9c2d3bb3f0397048e62e6b7192079c',
    },
    offchain: {
      id: '098c9adb-469b-44e8-a327-b7099797888e',
      name: 'ofceth:fuel',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:move'],
    fullName: 'Movement Network',
    decimalPlaces: 8,
    onchain: {
      id: '1edeae93-293e-4883-b007-83b5ae1ba3d4',
      name: 'eth:move',
      contractAddress: '0x3073f7aaa4db83f95e9fff17424f71d4751a3073',
    },
    offchain: {
      id: '393b3e93-e9d1-4c86-bf00-9d453be41758',
      name: 'ofceth:move',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:usd1'],
    fullName: 'USD1',
    decimalPlaces: 18,
    onchain: {
      id: 'af4043a2-3944-4194-877f-553fe2c8be75',
      name: 'eth:usd1',
      contractAddress: '0x8d0d000ee44948fc98c9b98a4fa4921476f08b0d',
      features: [...ACCOUNT_COIN_DEFAULT_FEATURES, CoinFeature.STABLECOIN] as CoinFeature[],
    },
    offchain: {
      id: '2bd66ef0-5767-4739-baf4-0eb862e5675e',
      name: 'ofceth:usd1',
      features: [CoinFeature.STABLECOIN] as CoinFeature[],
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:sofid'],
    fullName: 'SoFiUSD',
    decimalPlaces: 6,
    onchain: {
      id: '4400af90-30d8-43fb-98b6-ca6791c94aa2',
      name: 'eth:sofid',
      contractAddress: '0x0cb6d03b0ac88a463f67b7ad99f9f3ec4678092e',
      features: [...ACCOUNT_COIN_DEFAULT_FEATURES, CoinFeature.STABLECOIN] as CoinFeature[],
    },
    offchain: {
      id: 'dc5d090c-6677-4e6c-9b2c-da42ed1cf3fb',
      name: 'ofceth:sofid',
      features: [CoinFeature.STABLECOIN] as CoinFeature[],
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:ibtc'],
    fullName: 'Token iBTC',
    decimalPlaces: 8,
    onchain: {
      id: 'e811d594-de4f-48b0-9b6b-47e8b4ba7dda',
      name: 'eth:ibtc',
      contractAddress: '0x20157dbabb84e3bbfe68c349d0d44e48ae7b5ad2',
    },
    offchain: {
      id: 'f93561d5-8e67-4165-bf92-34d97d6f96a5',
      name: 'ofceth:ibtc',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['ETH:OORT'],
    fullName: 'OORT',
    decimalPlaces: 18,
    onchain: {
      id: 'ece250d3-eb11-4981-ba26-8db4c7680f00',
      name: 'eth:oort',
      contractAddress: '0x5651fa7a726b9ec0cad00ee140179912b6e73599',
    },
    offchain: {
      id: 'ac3f2b43-0ea1-4692-994c-4adac50bb86a',
      name: 'ofceth:oort',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:pyr'],
    fullName: 'Vulcan Forged ',
    decimalPlaces: 18,
    onchain: {
      id: 'e036704f-1b00-4d9c-83ac-da4cf0452a8a',
      name: 'eth:pyr',
      contractAddress: '0x430ef9263e76dae63c84292c3409d61c598e9682',
    },
    offchain: {
      id: '12ef69e3-a6a2-484b-9977-615c7dab9ef3',
      name: 'ofceth:pyr',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:una'],
    fullName: 'Unagi Token',
    decimalPlaces: 18,
    onchain: {
      id: 'c3387e50-42fc-4d90-b879-5362e37993c4',
      name: 'eth:una',
      contractAddress: '0x0b6f3ea2814f3fff804ba5d5c237aebbc364fba9',
    },
    offchain: {
      id: 'a696dd96-77e2-483e-b8ff-057bc3332ff9',
      name: 'ofceth:una',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:ads'],
    fullName: 'Alkimi',
    decimalPlaces: 18,
    onchain: {
      id: 'c5db8504-58ee-49ec-bc63-791222e2439b',
      name: 'eth:ads',
      contractAddress: '0x3106a0a076bedae847652f42ef07fd58589e001f',
    },
    offchain: {
      id: '5a894d9e-6b32-4b61-992b-cc684dcc01dd',
      name: 'ofceth:ads',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:fuelv1'],
    fullName: 'Fuel v1',
    decimalPlaces: 18,
    onchain: {
      id: '2d048dbf-d629-46d0-9d9d-10cf2eecbef1',
      name: 'eth:fuelv1',
      contractAddress: '0x56ebdae96d179549f279ea0cfea3b3432b8cd2bc',
    },
    offchain: {
      id: '223902a4-2c32-4366-9164-6bd8dc338569',
      name: 'ofceth:fuelv1',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:flttx'],
    fullName: 'WisdomTree Floating Rate Treasury Digital Fund',
    decimalPlaces: 18,
    onchain: {
      id: '40cc0406-57aa-4310-b0fa-155f3c0d4477',
      name: 'eth:flttx',
      contractAddress: '0x98f865bd2e5a3e289b8cca54f24a7eeb2bba56ce',
      features: AccountCoin.DEFAULT_FEATURES_EXCLUDE_SINGAPORE as CoinFeature[],
    },
    offchain: {
      id: '07c75048-fc9a-4d5f-841e-6d9c40fcc8ba',
      name: 'ofceth:flttx',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:wtsix'],
    fullName: 'WisdomTree Short-Duration Income Digital Fund',
    decimalPlaces: 18,
    onchain: {
      id: 'b3aa443c-30f3-4369-9a09-c5cd51f1789d',
      name: 'eth:wtsix',
      contractAddress: '0x518fb6afefea9bb0a5135014d8032edee4a8b1ec',
      features: AccountCoin.DEFAULT_FEATURES_EXCLUDE_SINGAPORE as CoinFeature[],
    },
    offchain: {
      id: 'b6b2477c-0b79-413e-8669-3c999715fef8',
      name: 'ofceth:wtsix',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:modrx'],
    fullName: 'WisdomTree Siegel Moderate Digital Fund',
    decimalPlaces: 18,
    onchain: {
      id: '69c59d2c-2e9a-4fea-9cdc-18e89d1e8df6',
      name: 'eth:modrx',
      contractAddress: '0xfb20015fb2047320a0f1c209f35c6432147770e8',
      features: AccountCoin.DEFAULT_FEATURES_EXCLUDE_SINGAPORE as CoinFeature[],
    },
    offchain: {
      id: '08411905-993b-4c48-b206-bdfb6f022eb3',
      name: 'ofceth:modrx',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:techx'],
    fullName: 'WisdomTree Technology & Innovation 100 Digital Fund',
    decimalPlaces: 18,
    onchain: {
      id: '88baf298-5ed4-4767-a44c-6312a4ce4c3f',
      name: 'eth:techx',
      contractAddress: '0x1a17f2bdb023e516f1b32b121f332fa931802a9f',
      features: AccountCoin.DEFAULT_FEATURES_EXCLUDE_SINGAPORE as CoinFeature[],
    },
    offchain: {
      id: '77696898-511c-43eb-9dac-094fd6009b4b',
      name: 'ofceth:techx',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:wtsyx'],
    fullName: 'WisdomTree Short-Term Treasury Digital Fund',
    decimalPlaces: 18,
    onchain: {
      id: 'c8d27e15-dc81-490a-9bbf-20e051ff8e4a',
      name: 'eth:wtsyx',
      contractAddress: '0x3340e2c0ddcc4a035737bc1f5445c7d0fa6cbf5c',
      features: AccountCoin.DEFAULT_FEATURES_EXCLUDE_SINGAPORE as CoinFeature[],
    },
    offchain: {
      id: '7baa22a4-909c-49b1-a81e-d462a5b2d787',
      name: 'ofceth:wtsyx',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:wtlgx'],
    fullName: 'WisdomTree Long Term Treasury Digital Fund',
    decimalPlaces: 18,
    onchain: {
      id: '3dc5f6ed-ca1a-45e6-9b1c-c4085c25900e',
      name: 'eth:wtlgx',
      contractAddress: '0x4d682cbd74a67b1ffe97a2bb78475a16efe23e8a',
      features: AccountCoin.DEFAULT_FEATURES_EXCLUDE_SINGAPORE as CoinFeature[],
    },
    offchain: {
      id: 'dfd5e05b-c2ed-4d2f-bb57-b0ab8da7e11f',
      name: 'ofceth:wtlgx',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:wttsx'],
    fullName: 'WisdomTree 3-7 Year Treasury Digital Fund',
    decimalPlaces: 18,
    onchain: {
      id: 'bd6c8c3a-9253-40eb-915e-20e01735be32',
      name: 'eth:wttsx',
      contractAddress: '0xe7d2e561b8e3b1a0125f45da596706110f8953be',
      features: AccountCoin.DEFAULT_FEATURES_EXCLUDE_SINGAPORE as CoinFeature[],
    },
    offchain: {
      id: '2a630a07-4208-42b6-bd93-d5c81e4dfaed',
      name: 'ofceth:wttsx',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:tipsx'],
    fullName: 'WisdomTree TIPS Digital Fund',
    decimalPlaces: 18,
    onchain: {
      id: '843ed917-4fc7-4e2c-97a5-4c9f293aac4b',
      name: 'eth:tipsx',
      contractAddress: '0xa4964a2fe606f1d445e36006bcb7f7faee580042',
      features: AccountCoin.DEFAULT_FEATURES_EXCLUDE_SINGAPORE as CoinFeature[],
    },
    offchain: {
      id: '2738802a-3d4f-43bf-9b33-e57f4ee80502',
      name: 'ofceth:tipsx',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:wtstx'],
    fullName: 'WisdomTree 7-10 Year Treasury Digital Fund',
    decimalPlaces: 18,
    onchain: {
      id: 'b0164bbb-757b-4973-b54d-a2f751946c98',
      name: 'eth:wtstx',
      contractAddress: '0xa58b23027cdeb442854bb8063164d1fd48f37707',
      features: AccountCoin.DEFAULT_FEATURES_EXCLUDE_SINGAPORE as CoinFeature[],
    },
    offchain: {
      id: '036bc1fa-211a-40b4-bbbf-0441fe2a9818',
      name: 'ofceth:wtstx',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:lngvx'],
    fullName: 'WisdomTree Siegel Longevity Digital Fund',
    decimalPlaces: 18,
    onchain: {
      id: '49f8d4e5-995f-453b-a4c0-77867e304702',
      name: 'eth:lngvx',
      contractAddress: '0x2ecad4280b7720ba4f3830b47ab8ef2da4763f04',
      features: AccountCoin.DEFAULT_FEATURES_EXCLUDE_SINGAPORE as CoinFeature[],
    },
    offchain: {
      id: '6a713449-fbdd-423c-8bb1-f73d2ca4c23f',
      name: 'ofceth:lngvx',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:eqtyx'],
    fullName: 'WisdomTree Siegel Global Equity Digital Fund',
    decimalPlaces: 18,
    onchain: {
      id: '894ec30f-10c6-479b-8291-fac4af4a44a3',
      name: 'eth:eqtyx',
      contractAddress: '0xa14669a76b12f94d6ad09304ad15905e900a6e25',
      features: AccountCoin.DEFAULT_FEATURES_EXCLUDE_SINGAPORE as CoinFeature[],
    },
    offchain: {
      id: '21a84f93-d828-423b-8644-432e0e49f2e7',
      name: 'ofceth:eqtyx',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:deuro'],
    fullName: 'DecentralizedEURO',
    decimalPlaces: 18,
    onchain: {
      id: '23e6a094-16ee-4604-88c2-42b73b765fd6',
      name: 'eth:deuro',
      contractAddress: '0xba3f535bbcccca2a154b573ca6c5a49baae0a3ea',
      features: AccountCoin.getFeaturesByTypeExcluding(
        [
          CoinFeature.CUSTODY_BITGO_SINGAPORE,
          CoinFeature.CUSTODY_BITGO_CUSTODY_MENA_FZE,
          CoinFeature.CUSTODY_BITGO_MENA_FZE,
        ],
        ETH_FEATURES
      ) as CoinFeature[],
    },
    offchain: {
      id: 'd3f1c5b2-8a6e-4c9b-9f3e-7d2a4e5b6c8d',
      name: 'ofceth:deuro',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:usdf'],
    fullName: 'Falcon USD',
    decimalPlaces: 18,
    onchain: {
      id: 'ad73ed49-cbce-4809-a2e1-9d66c7f7a8d8',
      name: 'eth:usdf',
      contractAddress: '0xfa2b947eec368f42195f24f36d2af29f7c24cec2',
      features: [
        ...AccountCoin.getFeaturesByTypeExcluding(
          [
            CoinFeature.CUSTODY_BITGO_SINGAPORE,
            CoinFeature.CUSTODY_BITGO_CUSTODY_MENA_FZE,
            CoinFeature.CUSTODY_BITGO_MENA_FZE,
          ],
          ETH_FEATURES
        ),
        CoinFeature.STABLECOIN,
      ] as CoinFeature[],
    },
    offchain: {
      id: 'e7b1c5d2-9e6e-4c9b-9f3e-2d2a4e5b6c8d',
      name: 'ofceth:usdf',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:ausd'],
    fullName: 'Agora Dollar',
    decimalPlaces: 6,
    onchain: {
      id: 'f3ae12cd-6181-46af-9444-6acd605f123e',
      name: 'eth:ausd',
      contractAddress: '0x00000000efe302beaa2b3e6e1b18d08d69a9012a',
      features: [...ACCOUNT_COIN_DEFAULT_FEATURES, CoinFeature.STABLECOIN] as CoinFeature[],
    },
    offchain: {
      id: 'f9d2c5d2-8a6e-4c9b-9f3e-3d2a4e5b6c8d',
      name: 'ofceth:ausd',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:gaia'],
    fullName: 'Gaia Token',
    decimalPlaces: 18,
    onchain: {
      id: 'cc2e9fd4-f2a7-4501-837d-9d0912001ed1',
      name: 'eth:gaia',
      contractAddress: '0x2ee7097bfdd98fce2ac08a1896038a7cd9aaed81',
    },
    offchain: {
      id: 'a1e3c5d2-7b6e-4c9b-9f3e-4d2a4e5b6c8d',
      name: 'ofceth:gaia',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:usds'],
    fullName: 'USDS Stablecoin',
    decimalPlaces: 18,
    onchain: {
      id: '5d3311f4-2f92-450a-9b7f-ac9a8fc62765',
      name: 'eth:usds',
      contractAddress: '0xdc035d45d973e3ec169d2276ddab16f1e407384f',
      features: [...ACCOUNT_COIN_DEFAULT_FEATURES, CoinFeature.STABLECOIN] as CoinFeature[],
    },
    offchain: {
      id: 'c3a5c5d2-5d6e-4c9b-9f3e-6d2a4e5b6c8d',
      name: 'ofceth:usds',
      features: [CoinFeature.STABLECOIN] as CoinFeature[],
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:perc'],
    fullName: 'Perion',
    decimalPlaces: 18,
    onchain: {
      id: 'dfe67820-c659-4dfb-b699-26795d0ec543',
      name: 'eth:perc',
      contractAddress: '0x60be1e1fe41c1370adaf5d8e66f07cf1c2df2268',
    },
    offchain: {
      id: 'b4aed05b-b667-4b1e-b88e-19219989c1e4',
      name: 'ofceth:perc',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:cfg'],
    fullName: 'Centrifuge',
    decimalPlaces: 18,
    onchain: {
      id: 'ae39386d-8295-4f11-ac5c-f6fee81cdc48',
      name: 'eth:cfg',
      contractAddress: '0xcccccccccc33d538dbc2ee4feab0a7a1ff4e8a94',
    },
    offchain: {
      id: 'd6ba9776-1b5b-4364-8afd-594363a01ec1',
      name: 'ofceth:cfg',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:plume'],
    fullName: 'Plume',
    decimalPlaces: 18,
    onchain: {
      id: '693e94a9-c9ae-4910-b64e-397d7bf8151d',
      name: 'eth:plume',
      contractAddress: '0x4c1746a800d224393fe2470c70a35717ed4ea5f1',
    },
    offchain: {
      id: 'd3ec2f84-fa4d-42a7-85f2-7d0e932b3bb0',
      name: 'ofceth:plume',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:vbill'],
    fullName: 'VanEck Treasury Fund',
    decimalPlaces: 6,
    onchain: {
      id: '04628406-9ab1-4022-9ebd-a8c01eec9ae6',
      name: 'eth:vbill',
      contractAddress: '0x2255718832bc9fd3be1caf75084f4803da14ff01',
    },
    offchain: {
      id: 'c9d7345b-11e7-40df-9795-942149b393bd',
      name: 'ofceth:vbill',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:la'],
    fullName: 'Lagrange',
    decimalPlaces: 18,
    onchain: {
      id: 'ce3abc01-0515-4c88-b14b-ce670b68e49d',
      name: 'eth:la',
      contractAddress: '0x0fc2a55d5bd13033f1ee0cdd11f60f7efe66f467',
    },
    offchain: {
      id: 'cfac6025-2aa2-429a-b144-9ea5c952a93a',
      name: 'ofceth:la',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:es'],
    fullName: 'Eclipse',
    decimalPlaces: 6,
    onchain: {
      id: '8292e195-0275-4a40-9ca3-4adb7ab04518',
      name: 'eth:es',
      contractAddress: '0x6055dc6ff1077eebe5e6d2ba1a1f53d7ef8430de',
    },
    offchain: {
      id: '395fa727-b5eb-4fd8-ba91-1c257b94624d',
      name: 'ofceth:es',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:ctrl'],
    fullName: 'Ctrl Wallet',
    decimalPlaces: 18,
    onchain: {
      id: '47029442-483d-415c-bc0f-9a61f6aeaf9e',
      name: 'eth:ctrl',
      contractAddress: '0xe50e009ddb1a4d8ec668eac9d8b2df1f96348707',
    },
    offchain: {
      id: '2270befd-a97d-4e6e-a540-6d19bd0a08e7',
      name: 'ofceth:ctrl',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:benji'],
    fullName: 'Franklin OnChain U.S. Government Money Fund',
    decimalPlaces: 18,
    onchain: {
      id: '7e3c6735-2da3-42a3-aa60-fad6e267e335',
      name: 'eth:benji',
      contractAddress: '0x3ddc84940ab509c11b20b76b466933f40b750dc9',
    },
    offchain: {
      id: '282045b5-9394-4995-990d-a14b08931ea6',
      name: 'ofceth:benji',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:ibenji'],
    fullName: 'Franklin OnChain Institutional Liquidity Fund Ltd.',
    decimalPlaces: 18,
    onchain: {
      id: '9fe1912f-a981-4041-91ea-d756576b2e02',
      name: 'eth:ibenji',
      contractAddress: '0x90276e9d4a023b5229e0c2e9d4b2a83fe3a2b48c',
    },
    offchain: {
      id: '6d17f939-52f6-4aee-9f2d-201fa4464f4c',
      name: 'ofceth:ibenji',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:aztec'],
    fullName: 'Aztec',
    decimalPlaces: 18,
    onchain: {
      id: 'a184ee20-3d70-4029-83fa-6d44728313ca',
      name: 'eth:aztec',
      contractAddress: '0xa27ec0006e59f245217ff08cd52a7e8b169e62d2',
    },
    offchain: {
      id: '60f825f0-ed18-46b2-a03f-fd93b5e94f43',
      name: 'ofceth:aztec',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:bard'],
    fullName: 'Lombard',
    decimalPlaces: 18,
    onchain: {
      id: '03886beb-b737-400e-bb44-eb613e65e1d9',
      name: 'eth:bard',
      contractAddress: '0xf0db65d17e30a966c2ae6a21f6bba71cea6e9754',
    },
    offchain: {
      id: '14912a5e-254c-4c6f-9f9c-f9ce11b7b293',
      name: 'ofceth:bard',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:sfp'],
    fullName: 'SafePal Token',
    decimalPlaces: 18,
    onchain: {
      id: 'd62ef973-49e6-4d7c-8c67-ec112d6062a0',
      name: 'eth:sfp',
      contractAddress: '0x12e2b8033420270db2f3b328e32370cb5b2ca134',
    },
    offchain: {
      id: 'a31a6330-cbd6-49b0-b8b1-a7f9a48e770c',
      name: 'ofceth:sfp',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:towns'],
    fullName: 'Towns',
    decimalPlaces: 18,
    onchain: {
      id: '4f8f73d3-d264-4d4b-a150-885fdcbae600',
      name: 'eth:towns',
      contractAddress: '0x000000fa00b200406de700041cfc6b19bbfb4d13',
    },
    offchain: {
      id: '4d2f98ef-557c-42d6-bf60-8831a0221a5c',
      name: 'ofceth:towns',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:route'],
    fullName: 'Router Protocol (New)',
    decimalPlaces: 18,
    onchain: {
      id: '7905c0fa-a284-4995-a994-abd7050d9523',
      name: 'eth:route',
      contractAddress: '0x60f67e1015b3f069dd4358a78c38f83fe3a667a9',
    },
    offchain: {
      id: 'd91868c4-f7c3-42ca-a954-06e4fb69b26c',
      name: 'ofceth:route',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:sc'],
    fullName: 'SteelCoin',
    decimalPlaces: 18,
    onchain: {
      id: 'ea5587fc-c76b-4203-8364-185814210c75',
      name: 'eth:sc',
      contractAddress: '0x6d4e7931944dc1a78256570a073d410a71cc312f',
    },
    offchain: {
      id: '8d778a3b-7537-4333-97b4-9244078ae37c',
      name: 'ofceth:sc',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:chex'],
    fullName: 'Chintai Exchange Token',
    decimalPlaces: 18,
    onchain: {
      id: 'bef92a29-449e-4c8b-99cc-ffa355fe4b8b',
      name: 'eth:chex',
      contractAddress: '0x9ce84f6a69986a83d92c324df10bc8e64771030f',
      features: AccountCoin.DEFAULT_FEATURES_EXCLUDE_SINGAPORE as CoinFeature[],
    },
    offchain: {
      id: 'f87db929-734f-4482-8c4c-eddcdf25ac59',
      name: 'ofceth:chex',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:gho'],
    fullName: 'GHO',
    decimalPlaces: 18,
    onchain: {
      id: '81579a85-7339-45ba-9f95-6dc8a43e1afa',
      name: 'eth:gho',
      contractAddress: '0x40d16fc0246ad3160ccc09b8d0d3a2cd28ae6c2f',
    },
    offchain: {
      id: '0c2aab6d-ae2b-45a0-920e-5daa17951d62',
      name: 'ofceth:gho',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:npc'],
    fullName: 'Non-Playable Coin',
    decimalPlaces: 18,
    onchain: {
      id: '3bf4dce0-d17b-4f98-9e7a-933e6a767aa4',
      name: 'eth:npc',
      contractAddress: '0x8ed97a637a790be1feff5e888d43629dc05408f6',
    },
    offchain: {
      id: 'bacfffac-926a-41e9-95e2-23f354548dea',
      name: 'ofceth:npc',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:umint'],
    fullName: 'UBS uMINT',
    decimalPlaces: 18,
    onchain: {
      id: '89776872-d6f0-443b-89ca-abf4e6868779',
      name: 'eth:umint',
      contractAddress: '0xc06036793272219179f846ef6bfc3b16e820df0b',
      features: AccountCoin.DEFAULT_FEATURES_EXCLUDE_SINGAPORE as CoinFeature[],
    },
    offchain: {
      id: '9081e77f-ccca-48b6-8b51-de73849042dc',
      name: 'ofceth:umint',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:arb'],
    fullName: 'Arbitrum',
    decimalPlaces: 18,
    onchain: {
      id: '627ba0d4-29e6-48ec-b72b-e1124fcc5079',
      name: 'eth:arb',
      contractAddress: '0xb50721bcf8d664c30412cfbc6cf7a15145234ad1',
    },
    offchain: {
      id: 'f89abeb4-6566-4a16-9cb6-54c607467602',
      name: 'ofceth:arb',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:ez'],
    fullName: 'EasyFi',
    decimalPlaces: 18,
    onchain: {
      id: 'a721ce40-56ed-4767-8fd5-87ef45b39dc3',
      name: 'eth:ez',
      contractAddress: '0x00aba6fe5557de1a1d565658cbddddf7c710a1eb',
      features: AccountCoin.DEFAULT_FEATURES_EXCLUDE_SINGAPORE as CoinFeature[],
    },
    offchain: {
      id: '6aa08f88-50ef-4fd9-b386-bd9cf10a12c7',
      name: 'ofceth:ez',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:ncash'],
    fullName: 'Nucleus Vision',
    decimalPlaces: 18,
    onchain: {
      id: '93678c40-bc4d-4d06-be96-71b13ae7d7ec',
      name: 'eth:ncash',
      contractAddress: '0x809826cceab68c387726af962713b64cb5cb3cca',
    },
    offchain: {
      id: '76c39793-f54e-427c-b7f7-0be1cf0960d9',
      name: 'ofceth:ncash',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:sub'],
    fullName: 'Substratum',
    decimalPlaces: 18,
    onchain: {
      id: 'd89c82a0-3515-407b-92d8-282163588028',
      name: 'eth:sub',
      contractAddress: '0x8d75959f1e61ec2571aa72798237101f084de63a',
    },
    offchain: {
      id: '490d7928-cb00-4b38-81ce-99778e0c1e15',
      name: 'ofceth:sub',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:poe'],
    fullName: 'Po.et',
    decimalPlaces: 8,
    onchain: {
      id: '00833124-dc5d-4afa-b63e-8afc0196ec1b',
      name: 'eth:poe',
      contractAddress: '0x0e0989b1f9b8a38983c2ba8053269ca62ec9b195',
    },
    offchain: {
      id: '109574cf-0eba-40c8-a988-0d990e2d1936',
      name: 'ofceth:poe',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:ocn'],
    fullName: 'Odyssey',
    decimalPlaces: 18,
    onchain: {
      id: '83695557-5a68-43ca-a3c7-a49f3ccb383b',
      name: 'eth:ocn',
      contractAddress: '0x4092678e4e78230f46a1534c0fbc8fa39780892b',
    },
    offchain: {
      id: '0cb66151-195b-4e3e-b6f8-e9fa953fb5dc',
      name: 'ofceth:ocn',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:banca'],
    fullName: 'Banca',
    decimalPlaces: 18,
    onchain: {
      id: '7c33dc29-ee47-4697-bcec-b07d446e37e9',
      name: 'eth:banca',
      contractAddress: '0x998b3b82bc9dba173990be7afb772788b5acb8bd',
    },
    offchain: {
      id: '1d5bea63-7976-48be-b557-7644631e13d3',
      name: 'ofceth:banca',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:stq'],
    fullName: 'Storiqa',
    decimalPlaces: 18,
    onchain: {
      id: 'ef3b5c95-db85-453a-b66e-4ea023db63d8',
      name: 'eth:stq',
      contractAddress: '0x5c3a228510d246b78a3765c20221cbf3082b44a4',
      features: [
        ...ACCOUNT_COIN_DEFAULT_FEATURES_EXCLUDE_SINGAPORE_AND_MENA_FZE,
        CoinFeature.BULK_TRANSACTION,
      ] as CoinFeature[],
    },
    offchain: {
      id: 'a5f7e552-54b6-4dde-b070-b3c42ce09d5d',
      name: 'ofceth:stq',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:lf'],
    fullName: 'LF labs',
    decimalPlaces: 18,
    onchain: {
      id: '289b4eb1-e109-48de-a016-09d9172b688c',
      name: 'eth:lf',
      contractAddress: '0x957c7fa189a408e78543113412f6ae1a9b4022c4',
    },
    offchain: {
      id: '827a39b3-0124-4667-b1ed-f939dc7bb86f',
      name: 'ofceth:lf',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:usdcv'],
    fullName: 'USD CoinVertible',
    decimalPlaces: 18,
    onchain: {
      id: '1fbbb0b4-63bf-40a6-9aba-9a0a5ffba1cd',
      name: 'eth:usdcv',
      contractAddress: '0x5422374b27757da72d5265cc745ea906e0446634',
      features: [...ACCOUNT_COIN_DEFAULT_FEATURES, CoinFeature.STABLECOIN] as CoinFeature[],
    },
    offchain: {
      id: '6386ef1a-db83-419b-be2f-0a7a3626e259',
      name: 'ofceth:usdcv',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:eco'],
    fullName: 'ECO',
    decimalPlaces: 18,
    onchain: {
      id: '12fdbdb5-1e93-4a70-b651-8017959e12da',
      name: 'eth:eco',
      contractAddress: '0x892e0aea725d365c2619282ea7a974e1ddaec821',
    },
    offchain: {
      id: '45824966-9b29-4805-8c98-f0f21b63668f',
      name: 'ofceth:eco',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:cake'],
    fullName: 'PancakeSwap Token',
    decimalPlaces: 18,
    onchain: {
      id: 'e18703e9-f9d7-4454-baea-737a5469f37e',
      name: 'eth:cake',
      contractAddress: '0x152649ea73beab28c5b49b26eb48f7ead6d4c898',
    },
    offchain: {
      id: '597fa9d6-2cc5-451e-b964-c18ca41ef3df',
      name: 'ofceth:cake',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:nft'],
    fullName: 'APENFT',
    decimalPlaces: 6,
    onchain: {
      id: '474629ab-83ea-4d28-b021-72b3d3e91034',
      name: 'eth:nft',
      contractAddress: '0x198d14f2ad9ce69e76ea330b374de4957c3f850a',
    },
    offchain: {
      id: '82276898-2553-4cc7-b656-63d65ce72276',
      name: 'ofceth:nft',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:morpho'],
    fullName: 'Morpho Token',
    decimalPlaces: 18,
    onchain: {
      id: 'd4e33a82-915c-466f-99d1-e23f95098ce4',
      name: 'eth:morpho',
      contractAddress: '0x58d97b57bb95320f9a05dc918aef65434969c2b2',
      features: ETH_FEATURES_WITH_FRANKFURT_GERMANY as CoinFeature[],
    },
    offchain: {
      id: '6ee6e08d-4bf3-4f6e-9505-9fd1a7931858',
      name: 'ofceth:morpho',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:usdd'],
    fullName: 'Decentralized USD',
    decimalPlaces: 18,
    onchain: {
      id: '784858c8-c97d-490b-b035-7d22b8a4afb6',
      name: 'eth:usdd',
      contractAddress: '0x3d7975eccfc61a2102b08925cbba0a4d4dbb6555',
      features: [...ACCOUNT_COIN_DEFAULT_FEATURES, CoinFeature.STABLECOIN] as CoinFeature[],
    },
    offchain: {
      id: 'c60b56e8-68ea-4b4c-83a5-4c18116c66fa',
      name: 'ofceth:usdd',
      features: [CoinFeature.STABLECOIN] as CoinFeature[],
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:mx'],
    fullName: 'MX Token',
    decimalPlaces: 18,
    onchain: {
      id: '46761c18-9a0d-4482-9abe-83415b79572f',
      name: 'eth:mx',
      contractAddress: '0x11eef04c884e24d9b7b4760e7476d06ddf797f36',
    },
    offchain: {
      id: '2732c732-1c77-4638-92a2-b2a6771e584b',
      name: 'ofceth:mx',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:flz'],
    fullName: 'Fellaz Token',
    decimalPlaces: 18,
    onchain: {
      id: 'be74b6ca-6f79-4310-9a9a-d53fbfe9c61b',
      name: 'eth:flz',
      contractAddress: '0x8e964e35a76103af4c7d7318e1b1a82c682ae296',
    },
    offchain: {
      id: '46b59c47-1d86-4532-a1a3-c1f144219665',
      name: 'ofceth:flz',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:usd0'],
    fullName: 'Usual USD',
    decimalPlaces: 18,
    onchain: {
      id: '34dc5d74-1bce-4fd4-85e1-acb7d2f942a4',
      name: 'eth:usd0',
      contractAddress: '0x73a15fed60bf67631dc6cd7bc5b6e8da8190acf5',
      features: [...ACCOUNT_COIN_DEFAULT_FEATURES, CoinFeature.STABLECOIN] as CoinFeature[],
    },
    offchain: {
      id: '58fbf8bd-21c0-471e-9fea-738c74f876ea',
      name: 'ofceth:usd0',
      features: [CoinFeature.STABLECOIN] as CoinFeature[],
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:white'],
    fullName: 'WhiteRock',
    decimalPlaces: 18,
    onchain: {
      id: 'b23d4371-84a8-4780-bb51-f41813e8cda0',
      name: 'eth:white',
      contractAddress: '0x9cdf242ef7975d8c68d5c1f5b6905801699b1940',
    },
    offchain: {
      id: 'f0c97bb2-a778-4605-94d6-e3c82bf68821',
      name: 'ofceth:white',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:upc'],
    fullName: 'UPCX',
    decimalPlaces: 5,
    onchain: {
      id: '2eff8c63-59e2-4adc-9f24-b729e5a17d78',
      name: 'eth:upc',
      contractAddress: '0x487d62468282bd04ddf976631c23128a425555ee',
    },
    offchain: {
      id: '1e6d4305-17fa-4384-90c8-2ead39487fa1',
      name: 'ofceth:upc',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:lgct'],
    fullName: 'Legacy Token',
    decimalPlaces: 18,
    onchain: {
      id: 'f969b983-b5fb-4e0c-9235-5c9f4147df4f',
      name: 'eth:lgct',
      contractAddress: '0xd38b305cac06990c0887032a02c03d6839f770a8',
    },
    offchain: {
      id: 'ea9767c2-c853-40e3-9c13-996e9ba08773',
      name: 'ofceth:lgct',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:usdtb'],
    fullName: 'Ethena Labs USDtb',
    decimalPlaces: 18,
    onchain: {
      id: '661a0b40-5b11-4995-87b6-3ccaf29fd688',
      name: 'eth:usdtb',
      contractAddress: '0xc139190f447e929f090edeb554d95abb8b18ac1c',
    },
    offchain: {
      id: '291d2479-dfc5-4b20-bc64-bfeb8678e2e2',
      name: 'ofceth:usdtb',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:deusd'],
    fullName: 'Elixir deUSD',
    decimalPlaces: 18,
    onchain: {
      id: '5b4eb27a-d409-42e4-8c29-d3eda4386ca2',
      name: 'eth:deusd',
      contractAddress: '0x15700b564ca08d9439c58ca5053166e8317aa138',
    },
    offchain: {
      id: '4f5f7e1e-b595-4fab-897b-a9293e9578e6',
      name: 'ofceth:deusd',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:neiro'],
    fullName: 'Neiro (First Neiro On Ethereum)',
    decimalPlaces: 9,
    onchain: {
      id: 'ae350e14-b74b-4b2f-8b78-b578d6075bf6',
      name: 'eth:neiro',
      contractAddress: '0x812ba41e071c7b7fa4ebcfb62df5f45f6fa853ee',
    },
    offchain: {
      id: '62f1cd68-6ded-4bc8-8741-d15714f8d3c6',
      name: 'ofceth:neiro',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:vana'],
    fullName: 'Vana',
    decimalPlaces: 18,
    onchain: {
      id: '7e5551ab-08b2-4ec0-b8a3-a68d0fd2fe33',
      name: 'eth:vana',
      contractAddress: '0x7ff7fa94b8b66ef313f7970d4eebd2cb3103a2c0',
      features: [...ACCOUNT_COIN_DEFAULT_FEATURES_EXCLUDE_MENA_FZE, CoinFeature.BULK_TRANSACTION] as CoinFeature[],
    },
    offchain: {
      id: '390fe96c-4b5c-4420-85d7-2dcfa9613bd5',
      name: 'ofceth:vana',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:eurau'],
    fullName: 'AllUnity EUR',
    decimalPlaces: 6,
    onchain: {
      id: '65e96474-3e1f-433a-990b-db78f4de7a97',
      name: 'eth:eurau',
      contractAddress: '0x4933a85b5b5466fbaf179f72d3de273c287ec2c2',
    },
    offchain: {
      id: 'a3c19279-9fb5-41b5-ad01-4562fdbd6d33',
      name: 'ofceth:eurau',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:insur'],
    fullName: 'InsurAce',
    decimalPlaces: 18,
    onchain: {
      id: 'e2c62e37-fc8e-43c1-9a1c-47395c51fc61',
      name: 'eth:insur',
      contractAddress: '0x544c42fbb96b39b21df61cf322b5edc285ee7429',
    },
    offchain: {
      id: '650f3a39-cbee-48e7-8aeb-eaa181d3f11c',
      name: 'ofceth:insur',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:xyo'],
    fullName: 'XY Oracle',
    decimalPlaces: 18,
    onchain: {
      id: '57e56eb9-5e56-4dba-a8f4-42dd45913b9b',
      name: 'eth:xyo',
      contractAddress: '0x55296f69f40ea6d20e478533c15a6b08b654e758',
    },
    offchain: {
      id: 'c425f078-b338-454c-90bb-b0221df909db',
      name: 'ofceth:xyo',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:zig'],
    fullName: 'ZigChain',
    decimalPlaces: 18,
    onchain: {
      id: 'd349812b-833a-4358-a061-5b8d1549a1e9',
      name: 'eth:zig',
      contractAddress: '0xb2617246d0c6c0087f18703d576831899ca94f01',
    },
    offchain: {
      id: '54852e5b-e999-42e1-a912-ecd38bf98462',
      name: 'ofceth:zig',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:swftc'],
    fullName: 'SwftCoin',
    decimalPlaces: 8,
    onchain: {
      id: '42205617-6e50-4f2f-a77b-0c68dbd04bd7',
      name: 'eth:swftc',
      contractAddress: '0x0bb217e40f8a5cb79adf04e1aab60e5abd0dfc1e',
    },
    offchain: {
      id: 'ff192a0b-98b5-426c-98eb-f37f0ae1be55',
      name: 'ofceth:swftc',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:dsync'],
    fullName: 'Destra Network',
    decimalPlaces: 18,
    onchain: {
      id: '018fbebd-b082-4bca-a14d-666361b7d36f',
      name: 'eth:dsync',
      contractAddress: '0xf94e7d0710709388bce3161c32b4eea56d3f91cc',
    },
    offchain: {
      id: '53616a73-ad08-489d-89be-836db39241d9',
      name: 'ofceth:dsync',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:orbr'],
    fullName: 'Orbler',
    decimalPlaces: 18,
    onchain: {
      id: 'f8c2a984-f1ad-43b4-aef7-d996a69c3ad0',
      name: 'eth:orbr',
      contractAddress: '0xda30f261a962d5aae94c9ecd170544600d193766',
    },
    offchain: {
      id: '06e2e41d-999e-4875-bcb0-023720be67b3',
      name: 'ofceth:orbr',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:sxt'],
    fullName: 'Space and Time',
    decimalPlaces: 18,
    onchain: {
      id: '2b06fe46-2023-47dc-bf90-bb12fd04cdb4',
      name: 'eth:sxt',
      contractAddress: '0xe6bfd33f52d82ccb5b37e16d3dd81f9ffdabb195',
    },
    offchain: {
      id: '2b60bae4-3f71-4f8f-8013-9c2f18128e7f',
      name: 'ofceth:sxt',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:paal'],
    fullName: 'PAAL AI',
    decimalPlaces: 9,
    onchain: {
      id: '83bb1689-5f6e-4b31-b88d-9b2cec24c05c',
      name: 'eth:paal',
      contractAddress: '0x14fee680690900ba0cccfc76ad70fd1b95d10e16',
    },
    offchain: {
      id: '47325d7e-bb7f-44fe-8153-6754b7aac296',
      name: 'ofceth:paal',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:wmtx'],
    fullName: 'WorldMobile Token',
    decimalPlaces: 6,
    onchain: {
      id: 'f74f17f3-d178-4184-bb2d-066d33918fd8',
      name: 'eth:wmtx',
      contractAddress: '0xdbb5cf12408a3ac17d668037ce289f9ea75439d7',
    },
    offchain: {
      id: '76ca0cbc-8fef-4214-8376-f18142bd9ba7',
      name: 'ofceth:wmtx',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:anime'],
    fullName: 'Animecoin',
    decimalPlaces: 18,
    onchain: {
      id: '8e37e725-c72c-49e1-a076-9e6bba17daf3',
      name: 'eth:anime',
      contractAddress: '0x4dc26fc5854e7648a064a4abd590bbe71724c277',
    },
    offchain: {
      id: 'cbf90de8-530b-4844-b443-6017e5b03868',
      name: 'ofceth:anime',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:newt'],
    fullName: 'Newton',
    decimalPlaces: 18,
    onchain: {
      id: '42a4bc3f-2853-49dd-975f-487dbf028774',
      name: 'eth:newt',
      contractAddress: '0xd0ec028a3d21533fdd200838f39c85b03679285d',
    },
    offchain: {
      id: '7b243fe0-983b-4c6c-a781-b1cc4ad410cc',
      name: 'ofceth:newt',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:hsk'],
    fullName: 'HashKey Platform Token',
    decimalPlaces: 18,
    onchain: {
      id: '7c95a1da-dcdc-4305-83fc-761b49822955',
      name: 'eth:hsk',
      contractAddress: '0xe7c6bf469e97eeb0bfb74c8dbff5bd47d4c1c98a',
    },
    offchain: {
      id: '12bad7a8-28d4-4d5d-9481-eeb90d9b08a2',
      name: 'ofceth:hsk',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:0x0'],
    fullName: '0x0.ai',
    decimalPlaces: 9,
    onchain: {
      id: 'e9f861f1-90db-43a1-a148-bedb8c1da99f',
      name: 'eth:0x0',
      contractAddress: '0x5a3e6a77ba2f983ec0d371ea3b475f8bc0811ad5',
      features: [
        ...AccountCoin.getFeaturesByTypeExcluding(
          [CoinFeature.CUSTODY_BITGO_SINGAPORE, CoinFeature.CUSTODY_BITGO_MENA_FZE],
          ACCOUNT_COIN_DEFAULT_FEATURES
        ),
        CoinFeature.BULK_TRANSACTION,
      ] as CoinFeature[],
    },
    offchain: {
      id: 'cc2a92cf-d799-463b-b08c-e9a4d5e87934',
      name: 'ofceth:0x0',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:vvs'],
    fullName: 'VVS',
    decimalPlaces: 18,
    onchain: {
      id: '7839148f-7b3b-4926-a9d4-bdfe2e009abc',
      name: 'eth:vvs',
      contractAddress: '0x839e71613f9aa06e5701cf6de63e303616b0dde3',
    },
    offchain: {
      id: '007227e5-8762-4f9c-b152-85caf62e34a7',
      name: 'ofceth:vvs',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:bmx'],
    fullName: 'BitMart Token',
    decimalPlaces: 18,
    onchain: {
      id: 'a59b4f14-248b-4556-9975-93a2fe14ab58',
      name: 'eth:bmx',
      contractAddress: '0x986ee2b944c42d017f52af21c4c69b84dbea35d8',
    },
    offchain: {
      id: '509f5815-1db1-4a59-8cc2-da4d5a1eabee',
      name: 'ofceth:bmx',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:pro'],
    fullName: 'Propy',
    decimalPlaces: 8,
    onchain: {
      id: '28beb513-7190-4dd3-b73f-32289d07de23',
      name: 'eth:pro',
      contractAddress: '0x226bb599a12c826476e3a771454697ea52e9e220',
    },
    offchain: {
      id: '3aa503a5-d559-4b87-b6b9-defc277e8e33',
      name: 'ofceth:pro',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:prime'],
    fullName: 'Echelon Prime',
    decimalPlaces: 18,
    onchain: {
      id: 'b447f1db-9f57-4b7d-b372-2abcb0db873b',
      name: 'eth:prime',
      contractAddress: '0xb23d80f5fefcddaa212212f028021b41ded428cf',
    },
    offchain: {
      id: '8865c4a5-a4a6-4256-b0a0-71e0fb25ee32',
      name: 'ofceth:prime',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:pokt'],
    fullName: 'Pocket Network',
    decimalPlaces: 6,
    onchain: {
      id: '356456e1-5b20-4f77-bfb5-799f78af4225',
      name: 'eth:pokt',
      contractAddress: '0x764a726d9ced0433a8d7643335919deb03a9a935',
    },
    offchain: {
      id: '2c4ec5c2-9403-486d-b389-c2d034650653',
      name: 'ofceth:pokt',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:lon'],
    fullName: 'Tokenlon Network',
    decimalPlaces: 18,
    onchain: {
      id: '648bf099-cefc-4ed3-9af8-14feecc89503',
      name: 'eth:lon',
      contractAddress: '0x0000000000095413afc295d19edeb1ad7b71c952',
    },
    offchain: {
      id: 'de8fe485-c227-4ee3-a7c4-09ddea2ee81b',
      name: 'ofceth:lon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:rlb'],
    fullName: 'Rollbit Coin',
    decimalPlaces: 18,
    onchain: {
      id: 'e691dbd8-840b-4ef1-8745-29f83fe091fb',
      name: 'eth:rlb',
      contractAddress: '0x046eee2cc3188071c02bfc1745a6b17c656e3f3d',
      features: [
        ...AccountCoin.getFeaturesByTypeExcluding(
          [CoinFeature.CUSTODY_BITGO_SINGAPORE, CoinFeature.CUSTODY_BITGO_MENA_FZE],
          ACCOUNT_COIN_DEFAULT_FEATURES
        ),
        CoinFeature.BULK_TRANSACTION,
      ] as CoinFeature[],
    },
    offchain: {
      id: '5397b444-803e-4344-9556-c8ab5305994e',
      name: 'ofceth:rlb',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:neiro2'],
    fullName: 'Neiro Ethereum',
    decimalPlaces: 9,
    onchain: {
      id: '5ef3ded1-1a49-45f6-80a5-7e4a6f397bcf',
      name: 'eth:neiro2',
      contractAddress: '0xee2a03aa6dacf51c18679c516ad5283d8e7c2637',
    },
    offchain: {
      id: '6e606723-cf78-4a5c-90c0-c1925dc88094',
      name: 'ofceth:neiro2',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:sign'],
    fullName: 'Sign',
    decimalPlaces: 18,
    onchain: {
      id: '3af75d75-0d80-4490-a92d-a52f0285fbfc',
      name: 'eth:sign',
      contractAddress: '0x868fced65edbf0056c4163515dd840e9f287a4c3',
    },
    offchain: {
      id: '20011fd9-162a-4534-b4be-f0088f4b51a0',
      name: 'ofceth:sign',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:rog'],
    fullName: 'ROGIN.AI',
    decimalPlaces: 18,
    onchain: {
      id: '4deb5f7f-12de-4ffa-9d91-6703c11e1c9c',
      name: 'eth:rog',
      contractAddress: '0x5d43b66da68706d39f6c97f7f1415615672b446b',
    },
    offchain: {
      id: 'a96cc1dd-59ea-464f-9530-64cc5fc2af34',
      name: 'ofceth:rog',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:xaum'],
    fullName: 'Matrixdock Gold',
    decimalPlaces: 18,
    onchain: {
      id: '5edf68cf-c988-4973-bf33-adf25372313a',
      name: 'eth:xaum',
      contractAddress: '0x2103e845c5e135493bb6c2a4f0b8651956ea8682',
    },
    offchain: {
      id: 'ff07a861-2241-46e5-ae71-3507750ba6a7',
      name: 'ofceth:xaum',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:avail'],
    fullName: 'Avail',
    decimalPlaces: 18,
    onchain: {
      id: '573d94ea-2231-4e36-bdda-5bf84c7987e5',
      name: 'eth:avail',
      contractAddress: '0xeeb4d8400aeefafc1b2953e0094134a887c76bd8',
    },
    offchain: {
      id: 'a820df78-51fd-4918-b155-2518b7c21409',
      name: 'ofceth:avail',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:dolo'],
    fullName: 'Dolomite',
    decimalPlaces: 18,
    onchain: {
      id: '5a15f0d3-53b3-4453-937c-c244d3aa5836',
      name: 'eth:dolo',
      contractAddress: '0x0f81001ef0a83ecce5ccebf63eb302c70a39a654',
    },
    offchain: {
      id: '4dc35e5d-2f92-49de-a873-f61b0712290a',
      name: 'ofceth:dolo',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:era'],
    fullName: 'Caldera',
    decimalPlaces: 18,
    onchain: {
      id: 'b75f8df6-3ba3-4009-a030-674c3391ea19',
      name: 'eth:era',
      contractAddress: '0xe2ad0bf751834f2fbdc62a41014f84d67ca1de2a',
    },
    offchain: {
      id: '0ca74cc5-fc6f-4119-9678-bbed45f5040d',
      name: 'ofceth:era',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:ugold'],
    fullName: 'UGOLD Inc.',
    decimalPlaces: 18,
    onchain: {
      id: 'dda22f9a-f2c1-453b-a45b-008da115351e',
      name: 'eth:ugold',
      contractAddress: '0xa6089dbfed19d1bcd43146bbdca2b8f9d9f84a9a',
    },
    offchain: {
      id: '4139c3f1-31ff-44b8-b503-893ee4d76242',
      name: 'ofceth:ugold',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:seda'],
    fullName: 'SEDA Protocol',
    decimalPlaces: 18,
    onchain: {
      id: '5e8fbbd9-1696-4f60-90f3-0f8032614476',
      name: 'eth:seda',
      contractAddress: '0x14862c03a0caccc1ab328b062e64e31b2a1afcd7',
    },
    offchain: {
      id: 'e6765d71-3200-45a4-9314-354e67443dfa',
      name: 'ofceth:seda',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:enso'],
    fullName: 'Enso',
    decimalPlaces: 18,
    onchain: {
      id: 'd9a7e07c-7aaf-4cc4-b87d-da11aa65c401',
      name: 'eth:enso',
      contractAddress: '0x699f088b5dddcafb7c4824db5b10b57b37cb0c66',
    },
    offchain: {
      id: '2c3f951e-952e-4ed1-8f09-0af36092b29e',
      name: 'ofceth:enso',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:hpp'],
    fullName: 'House Party Protocol',
    decimalPlaces: 18,
    onchain: {
      id: '3be7024f-0209-4621-8165-fb1ded16a5b6',
      name: 'eth:hpp',
      contractAddress: '0xe33fbe7584eb79e2673abe576b7ac8c0de62565c',
    },
    offchain: {
      id: '1ffe161e-0388-4e6b-9f4e-84a855349563',
      name: 'ofceth:hpp',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:usdo'],
    fullName: 'OpenEden Open Dollar',
    decimalPlaces: 18,
    onchain: {
      id: '0947f572-1617-43e5-b065-5bb064e27566',
      name: 'eth:usdo',
      contractAddress: '0x8238884ec9668ef77b90c6dff4d1a9f4f4823bfe',
      features: [
        ...AccountCoin.DEFAULT_FEATURES_EXCLUDE_SINGAPORE,
        CoinFeature.BULK_TRANSACTION,
        CoinFeature.REBASE_TOKEN,
      ] as CoinFeature[],
    },
    offchain: {
      id: '281ef8e9-d67f-4a53-9d43-88dd9c812803',
      name: 'ofceth:usdo',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:vsn'],
    fullName: 'Vision',
    decimalPlaces: 18,
    onchain: {
      id: '9577010b-3c51-4f02-a284-fdff7837e407',
      name: 'eth:vsn',
      contractAddress: '0x699ccf919c1dfdfa4c374292f42cadc9899bf753',
      features: AccountCoin.DEFAULT_FEATURES_EXCLUDE_SINGAPORE as CoinFeature[],
    },
    offchain: {
      id: 'c099e464-f464-4d7c-8e6b-3dee55d95837',
      name: 'ofceth:vsn',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:shx'],
    fullName: 'Stronghold SHx',
    decimalPlaces: 7,
    onchain: {
      id: 'c51774c4-c9fd-4cfc-886e-36e084ce7b48',
      name: 'eth:shx',
      contractAddress: '0xee7527841a932d2912224e20a405e1a1ff747084',
    },
    offchain: {
      id: '42f3a70b-2070-45d4-ac52-9fb676d3337b',
      name: 'ofceth:shx',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:slay'],
    fullName: 'SatLayer',
    decimalPlaces: 6,
    onchain: {
      id: '88e2f52d-d582-4ab5-9151-cca02572b5d8',
      name: 'eth:slay',
      contractAddress: '0x51477a3002ee04b7542adfe63ccdb50c00ee5147',
      features: AccountCoin.DEFAULT_FEATURES_EXCLUDE_SINGAPORE as CoinFeature[],
    },
    offchain: {
      id: '6ad8cc28-3c63-4d77-9488-87c6935b3cf8',
      name: 'ofceth:slay',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:mxnb'],
    fullName: 'MXNB',
    decimalPlaces: 6,
    onchain: {
      id: '0eb44459-7e38-4974-8847-e2fa8a510478',
      name: 'eth:mxnb',
      contractAddress: '0xf197ffc28c23e0309b5559e7a166f2c6164c80aa',
    },
    offchain: {
      id: 'e1a2fff8-5a33-4873-9231-6289eec23a9d',
      name: 'ofceth:mxnb',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:hwhlp'],
    fullName: 'Hyperwave HLP',
    decimalPlaces: 6,
    onchain: {
      id: '76563af3-10a6-40f2-9109-4afb40284912',
      name: 'eth:hwhlp',
      contractAddress: '0x9fd7466f987fd4c45a5bbde22ed8aba5bc8d72d1',
      features: AccountCoin.DEFAULT_FEATURES_EXCLUDE_SINGAPORE as CoinFeature[],
    },
    offchain: {
      id: '7ea68985-aaff-4094-affa-4a421f7734fb',
      name: 'ofceth:hwhlp',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:mxnd'],
    fullName: 'Mexican Digital Peso',
    decimalPlaces: 6,
    onchain: {
      id: 'e732528b-2c63-4fd0-b15d-290f831a7e92',
      name: 'eth:mxnd',
      contractAddress: '0xc60bca6bd5790611b8a302d4c5df37d769c81121',
    },
    offchain: {
      id: '9af2408f-111a-4876-83be-49e46863b7b5',
      name: 'ofceth:mxnd',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:bio'],
    fullName: 'Bio Protocol',
    decimalPlaces: 18,
    onchain: {
      id: '978d92c0-454d-45d5-a869-f025737d6467',
      name: 'eth:bio',
      contractAddress: '0xcb1592591996765ec0efc1f92599a19767ee5ffa',
    },
    offchain: {
      id: 'e77c2162-3927-4194-b525-fe79895dd314',
      name: 'ofceth:bio',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:prove'],
    fullName: 'Succinct',
    decimalPlaces: 18,
    onchain: {
      id: '71738095-97de-4404-9b10-e9dcd1bc8cbf',
      name: 'eth:prove',
      contractAddress: '0x6bef15d938d4e72056ac92ea4bdd0d76b1c4ad29',
    },
    offchain: {
      id: 'e2f6955d-7c74-4459-9e8d-738d692fa3d1',
      name: 'ofceth:prove',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:zrc'],
    fullName: 'Zircuit',
    decimalPlaces: 18,
    onchain: {
      id: 'ea6c2d04-77c9-4a20-9523-9f310a1a6545',
      name: 'eth:zrc',
      contractAddress: '0xfd418e42783382e86ae91e445406600ba144d162',
    },
    offchain: {
      id: 'bbe4893d-be4d-4126-b5e7-21bee4341c3b',
      name: 'ofceth:zrc',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:open'],
    fullName: 'OpenLedger',
    decimalPlaces: 18,
    onchain: {
      id: 'f3c300a4-2591-47f1-8d42-0e216ec6a938',
      name: 'eth:open',
      contractAddress: '0xa227cc36938f0c9e09ce0e64dfab226cad739447',
    },
    offchain: {
      id: '8da43f86-4bf5-48ef-bf80-3c81b604c3e4',
      name: 'ofceth:open',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:mbg'],
    fullName: 'MultiBank Group',
    decimalPlaces: 18,
    onchain: {
      id: 'f0ca4c8c-79fa-435b-9f7b-d8c6fd99f775',
      name: 'eth:mbg',
      contractAddress: '0x45e02bc2875a2914c4f585bbf92a6f28bc07cb70',
      features: AccountCoin.DEFAULT_FEATURES_EXCLUDE_SINGAPORE as CoinFeature[],
    },
    offchain: {
      id: '8ab7252f-a586-4d18-8631-d5dedf2a8024',
      name: 'ofceth:mbg',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:rekt'],
    fullName: 'Rekt',
    decimalPlaces: 18,
    onchain: {
      id: 'e2650199-e114-4abd-9086-46d77ee1ee0f',
      name: 'eth:rekt',
      contractAddress: '0xdd3b11ef34cd511a2da159034a05fcb94d806686',
    },
    offchain: {
      id: 'c2b381d1-795f-4c27-bc3a-322757dd7938',
      name: 'ofceth:rekt',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:align'],
    fullName: 'Aligned',
    decimalPlaces: 18,
    onchain: {
      id: 'af9ecc6e-beb1-4f80-8f2e-bf0f0f1cce9f',
      name: 'eth:align',
      contractAddress: '0x50614cc8e44f7814549c223aa31db9296e58057c',
    },
    offchain: {
      id: 'abeefced-cfda-4afa-8f9c-aebfcadbecfd',
      name: 'ofceth:align',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:xan'],
    fullName: 'Anoma',
    decimalPlaces: 18,
    onchain: {
      id: 'bf0edd7e-cfb2-4f81-8f3e-cf1f1f2ddfaf',
      name: 'eth:xan',
      contractAddress: '0xcedbea37c8872c4171259cdfd5255cb8923cf8e7',
      features: [...ACCOUNT_COIN_DEFAULT_FEATURES_EXCLUDE_MENA_FZE, CoinFeature.BULK_TRANSACTION] as CoinFeature[],
    },
    offchain: {
      id: 'bcfffdee-daeb-4bfb-9fad-bfcadbecfdae',
      name: 'ofceth:xan',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:frxusd'],
    fullName: 'Frax USD',
    decimalPlaces: 18,
    onchain: {
      id: '9f52bfe6-847d-4f39-bad8-9d62d33e347d',
      name: 'eth:frxusd',
      contractAddress: '0xcacd6fd266af91b8aed52accc382b4e165586e29',
    },
    offchain: {
      id: 'c1776148-7f04-43b4-9ec9-74ea082111bd',
      name: 'ofceth:frxusd',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:red'],
    fullName: 'Redstone',
    decimalPlaces: 18,
    onchain: {
      id: 'cceea05f-3dc5-4511-b92a-0ae64a3cab6a',
      name: 'eth:red',
      contractAddress: '0xc43c6bfeda065fe2c4c11765bf838789bd0bb5de',
    },
    offchain: {
      id: '47f8db6a-d983-4a4b-b43a-fcd83d473a52',
      name: 'ofceth:red',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:aioz'],
    fullName: 'AIOZ Network',
    decimalPlaces: 18,
    onchain: {
      id: '49de3bf9-834b-487d-9f83-0bb22a345cba',
      name: 'eth:aioz',
      contractAddress: '0x626e8036deb333b408be468f951bdb42433cbf18',
    },
    offchain: {
      id: '768025b4-e38d-435c-af69-799522cda202',
      name: 'ofceth:aioz',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:lit'],
    fullName: 'Lighter',
    decimalPlaces: 18,
    onchain: {
      id: '2f4c46e8-9e30-4ecd-bcf1-1b50447c6f26',
      name: 'eth:lit',
      contractAddress: '0x232ce3bd40fcd6f80f3d55a522d03f25df784ee2',
    },
    offchain: {
      id: 'd1fa53cb-7868-4699-9e86-853d9e017bfd',
      name: 'ofceth:lit',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:aedz'],
    fullName: 'Zand AED',
    decimalPlaces: 6,
    onchain: {
      id: 'b0e5f4a9-6d1c-4b7e-a2f8-3c9d5e0b7a6f',
      name: 'eth:aedz',
      contractAddress: '0xfc347c996bd66c1d92e2045c80b413ef3fc84a90',
    },
    offchain: {
      id: 'a5d0e9f4-1b6c-4a7e-b2f8-3c9d5e0b7a6f',
      name: 'ofceth:aedz',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:arm-susde-usde'],
    fullName: 'Ethena Staked USDe ARM',
    decimalPlaces: 18,
    onchain: {
      id: 'c1f6a5b0-7e2d-4c8f-b3a9-4d0e6f1c8b7a',
      name: 'eth:arm-susde-usde',
      contractAddress: '0xceda2d856238aa0d12f6329de20b9115f07c366d',
    },
    offchain: {
      id: 'b6e1f0a5-2c7d-4b8f-83a9-4d0e6f1c8b7a',
      name: 'ofceth:arm-susde-usde',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:arm-weth-eeth'],
    fullName: 'Ether.fi ARM',
    decimalPlaces: 18,
    onchain: {
      id: 'd2a7b6c1-8f3e-4d9a-84b0-5e1f7a2d9c8b',
      name: 'eth:arm-weth-eeth',
      contractAddress: '0xfb0a3cf9b019bfd8827443d131b235b3e0fc58d2',
    },
    offchain: {
      id: 'c7f2a1b6-3d8e-4c9a-a4b0-5e1f7a2d9c8b',
      name: 'ofceth:arm-weth-eeth',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:job'],
    fullName: 'Jobchain',
    decimalPlaces: 8,
    onchain: {
      id: '3b5398f9-9c76-4508-8e9a-bf114506025c',
      name: 'eth:job',
      contractAddress: '0xdfbc9050f5b01df53512dcc39b4f2b2bbacd517a',
    },
    offchain: {
      id: '63f1d5de-5729-4a71-ba6e-dcd7095c20da',
      name: 'ofceth:job',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:irys'],
    fullName: 'IRYS',
    decimalPlaces: 18,
    onchain: {
      id: '88be6052-9142-478a-b53b-173777a4c72b',
      name: 'eth:irys',
      contractAddress: '0x50f41f589afaca2ef41fdf590fe7b90cd26dee64',
    },
    offchain: {
      id: '90169666-a3ee-4ff6-b447-0553a1a4cbb8',
      name: 'ofceth:irys',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:kpk'],
    fullName: 'KPK',
    decimalPlaces: 18,
    onchain: {
      id: 'c738d87d-45f8-4380-8ed3-e88be175f29e',
      name: 'eth:kpk',
      contractAddress: '0xbf3f63d8ac133b16d7d50c015036b33219dd8d23',
    },
    offchain: {
      id: '42fc787e-bd51-4ba0-915f-14b7cdae1bf3',
      name: 'ofceth:kpk',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:devve'],
    fullName: 'DEVVE',
    decimalPlaces: 18,
    onchain: {
      id: 'fadee72c-b4ca-4fb6-b985-4cf119dfa49f',
      name: 'eth:devve',
      contractAddress: '0x8248270620aa532e4d64316017be5e873e37cc09',
      features: AccountCoin.DEFAULT_FEATURES_EXCLUDE_SINGAPORE as CoinFeature[],
    },
    offchain: {
      id: '20e090cf-d2ca-404d-9e14-2f8795b9fed6',
      name: 'ofceth:devve',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:dka'],
    fullName: 'dKargo',
    decimalPlaces: 18,
    onchain: {
      id: 'facb8d7f-36f4-45f2-be14-b53895e641ad',
      name: 'eth:dka',
      contractAddress: '0x5dc60c4d5e75d22588fa17ffeb90a63e535efce0',
    },
    offchain: {
      id: '1eb11077-5b2d-4f17-9da7-93df043c1bd6',
      name: 'ofceth:dka',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:cgpt'],
    fullName: 'ChainGPT',
    decimalPlaces: 18,
    onchain: {
      id: 'bfdc9a33-3ae7-44bd-99b1-2eabde2a90d7',
      name: 'eth:cgpt',
      contractAddress: '0x25931894a86d47441213199621f1f2994e1c39aa',
    },
    offchain: {
      id: '5a3e3177-e3ee-43cb-bd39-567bb9022a16',
      name: 'ofceth:cgpt',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:apu'],
    fullName: 'Apu Apustaja',
    decimalPlaces: 18,
    onchain: {
      id: 'd1942ff9-8462-4781-9d1f-86d0bba231c4',
      name: 'eth:apu',
      contractAddress: '0x594daad7d77592a2b97b725a7ad59d7e188b5bfa',
    },
    offchain: {
      id: '2e1671ee-1306-483b-b330-dbf52167121f',
      name: 'ofceth:apu',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:shfl'],
    fullName: 'Shuffle',
    decimalPlaces: 18,
    onchain: {
      id: '8798b6ed-a590-45a1-b7c2-d0859c50baaa',
      name: 'eth:shfl',
      contractAddress: '0x8881562783028f5c1bcb985d2283d5e170d88888',
    },
    offchain: {
      id: '9ce1f6d0-6a9a-45ec-b4ea-2e8d94d0b76d',
      name: 'ofceth:shfl',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:banana'],
    fullName: 'Banana Gun',
    decimalPlaces: 18,
    onchain: {
      id: '3b42592a-86d7-4537-a052-5048a006982d',
      name: 'eth:banana',
      contractAddress: '0x38e68a37e401f7271568cecaac63c6b1e19130b4',
    },
    offchain: {
      id: '6b77a796-cb3b-4654-bd93-0d28db22e641',
      name: 'ofceth:banana',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:zkj'],
    fullName: 'Polyhedra Network',
    decimalPlaces: 18,
    onchain: {
      id: '63d2a1ee-1202-485a-ab2a-7b831578f136',
      name: 'eth:zkj',
      contractAddress: '0xc71b5f631354be6853efe9c3ab6b9590f8302e81',
    },
    offchain: {
      id: '0d6a51be-34d0-4e91-b8a6-b79004c44bc3',
      name: 'ofceth:zkj',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:spk'],
    fullName: 'Spark',
    decimalPlaces: 18,
    onchain: {
      id: '3d19f94a-c8bc-4db4-a6c6-39d96e7cb641',
      name: 'eth:spk',
      contractAddress: '0xc20059e0317de91738d13af027dfc4a50781b066',
    },
    offchain: {
      id: '42da0317-adf3-4645-99d5-e731ccc0070d',
      name: 'ofceth:spk',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:merl'],
    fullName: 'Merlin Chain',
    decimalPlaces: 18,
    onchain: {
      id: '58fd27ad-fc3e-4c1f-8797-a41191621ee7',
      name: 'eth:merl',
      contractAddress: '0x0f3a12b78fee11ee088e454a0547bdbc5a253a6d',
    },
    offchain: {
      id: '4383dfcc-35b9-4754-aeda-120a36637cb9',
      name: 'ofceth:merl',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:aeur'],
    fullName: 'Anchored Coins AEUR',
    decimalPlaces: 18,
    onchain: {
      id: '984a891d-9d3c-4c2d-bd70-9dfc503cb08c',
      name: 'eth:aeur',
      contractAddress: '0xa40640458fbc27b6eefedea1e9c9e17d4cee7a21',
    },
    offchain: {
      id: 'e5449864-d826-4369-83e0-e46ffc6bc4fd',
      name: 'ofceth:aeur',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:soso'],
    fullName: 'SoSoValue',
    decimalPlaces: 18,
    onchain: {
      id: 'a2090636-3133-4e07-8636-3eccbc3f6e73',
      name: 'eth:soso',
      contractAddress: '0x76a0e27618462bdac7a29104bdcfff4e6bfcea2d',
    },
    offchain: {
      id: '405d2275-a38f-4172-bf7b-e055ff4d5871',
      name: 'ofceth:soso',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:bfc'],
    fullName: 'Bifrost',
    decimalPlaces: 18,
    onchain: {
      id: 'fc0df2e2-27a9-4997-bb8a-b6a761776720',
      name: 'eth:bfc',
      contractAddress: '0x0c7d5ae016f806603cb1782bea29ac69471cab9c',
    },
    offchain: {
      id: '44875f8c-c9fb-4af5-a3d2-79c25b3504d6',
      name: 'ofceth:bfc',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:osak'],
    fullName: 'Osaka Protocol',
    decimalPlaces: 18,
    onchain: {
      id: '9c060fb4-d5dc-445e-aca7-dcc90211b389',
      name: 'eth:osak',
      contractAddress: '0xa21af1050f7b26e0cff45ee51548254c41ed6b5c',
    },
    offchain: {
      id: '3caa6640-e667-49c0-904c-a08deb1d6f03',
      name: 'ofceth:osak',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:uds'],
    fullName: 'Undeads Games',
    decimalPlaces: 18,
    onchain: {
      id: '23a6d0b6-0898-4ae9-b54c-a1d10762bfdc',
      name: 'eth:uds',
      contractAddress: '0x712bd4beb54c6b958267d9db0259abdbb0bff606',
    },
    offchain: {
      id: '8088356c-ea7f-40ce-8984-c23adca25ed7',
      name: 'ofceth:uds',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:zent'],
    fullName: 'Zentry',
    decimalPlaces: 18,
    onchain: {
      id: 'a4d992db-27e2-4a8b-a6a8-e6f82e4c8eda',
      name: 'eth:zent',
      contractAddress: '0xdbb7a34bf10169d6d2d0d02a6cbb436cf4381bfa',
    },
    offchain: {
      id: '34f3593c-07bc-4b92-8ed4-33b5a5f01762',
      name: 'ofceth:zent',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:euri'],
    fullName: 'Eurite',
    decimalPlaces: 18,
    onchain: {
      id: 'f3adcc31-26ba-498e-b848-f3189f1f41ff',
      name: 'eth:euri',
      contractAddress: '0x9d1a7a3191102e9f900faa10540837ba84dcbae7',
    },
    offchain: {
      id: 'cad5301f-d294-41eb-84fc-1e9a1b3592c7',
      name: 'ofceth:euri',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:al'],
    fullName: 'ArchLoot',
    decimalPlaces: 18,
    onchain: {
      id: '82296bc8-f00e-4f83-b6f0-8ae9b7984249',
      name: 'eth:al',
      contractAddress: '0x046bad07658f3b6cad9a396cfcbc1243af452ec1',
    },
    offchain: {
      id: '6dd31724-eab3-4667-8748-04da88349e17',
      name: 'ofceth:al',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:wct'],
    fullName: 'WalletConnect',
    decimalPlaces: 18,
    onchain: {
      id: '0fa109c4-cd42-4226-ace2-f3c48250e682',
      name: 'eth:wct',
      contractAddress: '0xef4461891dfb3ac8572ccf7c794664a8dd927945',
    },
    offchain: {
      id: 'c9d9f397-2fda-4418-8362-0c4f9a6d1aad',
      name: 'ofceth:wct',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:pundiai'],
    fullName: 'Pundi AI',
    decimalPlaces: 18,
    onchain: {
      id: '80e72eaf-b84f-4cf8-a515-140b154e253b',
      name: 'eth:pundiai',
      contractAddress: '0x075f23b9cdfce2cc0ca466f4ee6cb4bd29d83bef',
    },
    offchain: {
      id: '8125e1e5-8305-4fc2-834f-f859b81b918c',
      name: 'ofceth:pundiai',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:anon'],
    fullName: 'HeyAnon',
    decimalPlaces: 18,
    onchain: {
      id: 'e42c9030-4863-46d7-bae2-abb1ac5238de',
      name: 'eth:anon',
      contractAddress: '0x79bbf4508b1391af3a0f4b30bb5fc4aa9ab0e07c',
      features: [...ACCOUNT_COIN_DEFAULT_FEATURES_EXCLUDE_MENA_FZE, CoinFeature.BULK_TRANSACTION] as CoinFeature[],
    },
    offchain: {
      id: '17251954-61a5-4f5a-a594-a287b6864a25',
      name: 'ofceth:anon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:omi'],
    fullName: 'ECOMI',
    decimalPlaces: 18,
    onchain: {
      id: '82a853ca-67c9-43d1-95fc-61716a7b18fe',
      name: 'eth:omi',
      contractAddress: '0xed35af169af46a02ee13b9d79eb57d6d68c1749e',
    },
    offchain: {
      id: '3ad9b598-11bd-4dba-9a42-a74eae4c6b43',
      name: 'ofceth:omi',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:andy'],
    fullName: 'ANDY',
    decimalPlaces: 18,
    onchain: {
      id: '7d56d20c-fdf6-4ed3-ad75-b5b874780058',
      name: 'eth:andy',
      contractAddress: '0x68bbed6a47194eff1cf514b50ea91895597fc91e',
    },
    offchain: {
      id: 'bf7b99fe-d666-4db7-a775-c05e5bff98ce',
      name: 'ofceth:andy',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:meme'],
    fullName: 'Memecoin',
    decimalPlaces: 18,
    onchain: {
      id: 'ecb5fc4f-cf1d-4037-928a-a10517091fd6',
      name: 'eth:meme',
      contractAddress: '0xb131f4a55907b10d1f0a50d8ab8fa09ec342cd74',
    },
    offchain: {
      id: 'acf1a5a3-4555-4aa2-8c80-4e2cd4cdb61c',
      name: 'ofceth:meme',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:yu'],
    fullName: 'Yala Stablecoin',
    decimalPlaces: 18,
    onchain: {
      id: '29fe91f5-bf1e-41e3-982e-78c7e0bb2f0a',
      name: 'eth:yu',
      contractAddress: '0xe868084cf08f3c3db11f4b73a95473762d9463f7',
    },
    offchain: {
      id: 'c71454e2-c51c-40df-8605-e57f2d97ed53',
      name: 'ofceth:yu',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:qqqon'],
    fullName: 'Invesco QQQ (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: '1c2ed80e-c485-4c67-9dc3-22b7d23219f1',
      name: 'eth:qqqon',
      contractAddress: '0x0e397938c1aa0680954093495b70a9f5e2249aba',
    },
    offchain: {
      id: 'e92a9558-f1d8-4293-9fc6-449d7e5a4e3e',
      name: 'ofceth:qqqon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:spyon'],
    fullName: 'SPDR S&P 500 ETF (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: 'e13d7445-f465-4a45-aef1-3e32d4bd0f9c',
      name: 'eth:spyon',
      contractAddress: '0xfedc5f4a6c38211c1338aa411018dfaf26612c08',
    },
    offchain: {
      id: 'a485d7b9-21c6-4d2f-8c1a-9bc123b6d742',
      name: 'ofceth:spyon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:nvdaon'],
    fullName: 'NVIDIA (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: 'f5d7b0b3-42de-4555-8b14-82430b6ac372',
      name: 'eth:nvdaon',
      contractAddress: '0x2d1f7226bd1f780af6b9a49dcc0ae00e8df4bdee',
    },
    offchain: {
      id: '37b8f45c-6e9d-4821-a938-2d765b6fecd3',
      name: 'ofceth:nvdaon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:tslaon'],
    fullName: 'Tesla (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: '70493e8f-4ee7-4eaf-b115-f7f64c7cbb9c',
      name: 'eth:tslaon',
      contractAddress: '0xf6b1117ec07684d3958cad8beb1b302bfd21103f',
    },
    offchain: {
      id: 'c3a1e8d7-5f4b-412c-8a8d-7b9c4e3f2d1a',
      name: 'ofceth:tslaon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:aaplon'],
    fullName: 'Apple (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: 'c7a9ac82-3d84-4e88-86d6-0c5c69b717d5',
      name: 'eth:aaplon',
      contractAddress: '0x14c3abf95cb9c93a8b82c1cdcb76d72cb87b2d4c',
    },
    offchain: {
      id: 'f8a7e6d5-c4b3-4a1d-8e8f-7b6c5a4d3e2b',
      name: 'ofceth:aaplon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:mstron'],
    fullName: 'MicroStrategy (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: 'bcead26f-3bba-4fa4-bf4a-f3cb93a5c1d7',
      name: 'eth:mstron',
      contractAddress: '0xcabd955322dfbf94c084929ac5e9eca3feb5556f',
    },
    offchain: {
      id: '9e8d7c6b-5a4f-42cd-9b0a-9c8f7e6d5a4b',
      name: 'ofceth:mstron',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:pltron'],
    fullName: 'Palantir Technologies (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: '47ece7cd-2e8c-4ca7-8e7b-3c40c54d9e24',
      name: 'eth:pltron',
      contractAddress: '0x0c666485b02f7a87d21add7aeb9f5e64975aa490',
    },
    offchain: {
      id: 'b1a9c8d7-e6f5-43ab-8c1d-0e9f8a7b6c5d',
      name: 'ofceth:pltron',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:hoodon'],
    fullName: 'Robinhood Markets (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: 'a9f5d8e4-28b0-4f89-9b7a-c8c75e415f9e',
      name: 'eth:hoodon',
      contractAddress: '0x998f02a9e343ef6e3e6f28700d5a20f839fd74e6',
    },
    offchain: {
      id: 'd7c6b5a4-3e2f-40db-8a8c-7e6f5d4c3b2a',
      name: 'ofceth:hoodon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:crclon'],
    fullName: 'Circle Internet Group (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: 'e6b47c58-fb0a-4b92-a2c6-7f1c3d5b11d6',
      name: 'eth:crclon',
      contractAddress: '0x3632dea96a953c11dac2f00b4a05a32cd1063fae',
    },
    offchain: {
      id: '7f6e5d4c-3b2a-40fe-8d8c-7b6a5f4e3d2c',
      name: 'ofceth:crclon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:coinon'],
    fullName: 'Coinbase (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: 'c13df8a2-eb9b-4c5c-92bd-68a73abb19e0',
      name: 'eth:coinon',
      contractAddress: '0xf042cfa86cf1d598a75bdb55c3507a1f39f9493b',
    },
    offchain: {
      id: 'a9b8c7d6-e5f4-4d2c-8b0a-9e8d7f6c5b4a',
      name: 'ofceth:coinon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:amznon'],
    fullName: 'Amazon (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: '93ba482c-0152-48d1-96c4-678d8a1a3c7f',
      name: 'eth:amznon',
      contractAddress: '0xbb8774fb97436d23d74c1b882e8e9a69322cfd31',
    },
    offchain: {
      id: '5d4c3b2a-1f0e-4d8c-8b6a-5f4e3d2c1b0a',
      name: 'ofceth:amznon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:googlon'],
    fullName: 'Alphabet Class A (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: '16a4d879-62ca-4f20-a8d0-2c8d7e2a25a9',
      name: 'eth:googlon',
      contractAddress: '0xba47214edd2bb43099611b208f75e4b42fdcfedc',
    },
    offchain: {
      id: 'e3d2c1b0-a9f8-46ed-8c4b-3a2f1d0e9c8b',
      name: 'ofceth:googlon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:metaon'],
    fullName: 'Meta Platforms (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: '29fb5687-d0f9-4ccd-8fa9-6b3e2d83695a',
      name: 'eth:metaon',
      contractAddress: '0x59644165402b611b350645555b50afb581c71eb2',
    },
    offchain: {
      id: '2c1b0a9e-8d7f-45ed-9c3b-2a1f0e9d8c7b',
      name: 'ofceth:metaon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:babaon'],
    fullName: 'Alibaba (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: '452b7183-a1d2-4d6c-aad7-5e2b5f3e076d',
      name: 'eth:babaon',
      contractAddress: '0x41765f0fcddc276309195166c7a62ae522fa09ef',
    },
    offchain: {
      id: 'c7b6a5f4-e3d2-41b0-a9e8-d7f6e5d4c3b2',
      name: 'ofceth:babaon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:msfton'],
    fullName: 'Microsoft (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: 'bff5ad0c-cb1c-4a15-ba6e-45f3af5b9aea',
      name: 'eth:msfton',
      contractAddress: '0xb812837b81a3a6b81d7cd74cfb19a7f2784555e5',
    },
    offchain: {
      id: '1b0a9e8d-7f6e-4d4c-8b2a-1f0e9d8c7b6a',
      name: 'ofceth:msfton',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:spgion'],
    fullName: 'S&P Global (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: '8d7c3e9f-6ae4-4f8a-9d17-d1c3a4f72ae9',
      name: 'eth:spgion',
      contractAddress: '0xbc843b147db4c7e00721d76037b8b92e13afe13f',
    },
    offchain: {
      id: 'f4e3d2c1-b0a9-48d7-96e5-d4c3b2a1f0e9',
      name: 'ofceth:spgion',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:tsmon'],
    fullName: 'Taiwan Semiconductor Manufacturing (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: '7a2be40d-1f5e-45d3-81a9-3642c57a9f8b',
      name: 'eth:tsmon',
      contractAddress: '0x3cafdbfe682aec17d5ace2f97a2f3ab3dcf6a4a9',
    },
    offchain: {
      id: 'a1f0e9d8-c7b6-45f4-93d2-c1b0a9e8d7f6',
      name: 'ofceth:tsmon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:amdon'],
    fullName: 'AMD (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: '6a9e0c2f-1d7a-4b83-ba5e-9fd3e78a4d5e',
      name: 'eth:amdon',
      contractAddress: '0x0c1f3412a44ff99e40bf14e06e5ea321ae7b3938',
    },
    offchain: {
      id: '3b2a1f0e-9d8c-4b6a-8f4e-3d2c1b0a9e8d',
      name: 'ofceth:amdon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:unhon'],
    fullName: 'UnitedHealth (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: 'b9c12a83-4e5f-47d2-a8b6-2c9e3d8c4f7e',
      name: 'eth:unhon',
      contractAddress: '0x075756f3b6381a79633438faa8964946bf40163d',
    },
    offchain: {
      id: 'd7f6e5d4-c3b2-41f0-99d8-c7b6a5f4e3d2',
      name: 'ofceth:unhon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:jpmon'],
    fullName: 'JPMorgan Chase (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: 'e8f5a7c2-d3b9-41e6-9c8a-7d0f2e9b1a5c',
      name: 'eth:jpmon',
      contractAddress: '0x03c1ec4ca9dbb168e6db0def827c085999cbffaf',
    },
    offchain: {
      id: '5f4e3d2c-1b0a-4e8d-8f6e-5d4c3b2a1f0e',
      name: 'ofceth:jpmon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:orclon'],
    fullName: 'Oracle (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: '2f7d9e6a-1c4b-48a3-9e5d-7b8c3f2a1d9e',
      name: 'eth:orclon',
      contractAddress: '0x8a23c6baadb88512b30475c83df6a63881e33e1e',
    },
    offchain: {
      id: 'e5d4c3b2-a1f0-49d8-87b6-a5f4e3d2c1b0',
      name: 'ofceth:orclon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:von'],
    fullName: 'Visa (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: 'c1a9e7d8-3f5b-42e6-8d7a-9c4f2e3b1d5a',
      name: 'eth:von',
      contractAddress: '0xac37c20c1d0e5285035e056101a64e263ff94a41',
    },
    offchain: {
      id: '9e8d7f6e-5d4c-4b2a-8f0e-9d8c7b6a5f4e',
      name: 'ofceth:von',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:maon'],
    fullName: 'Mastercard (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: 'd7e9a6c2-4f8b-4e3d-8a1c-9b8e7a4f6d3c',
      name: 'eth:maon',
      contractAddress: '0xa29dc2102dfc2a0a4a5dcb84af984315567c9858',
    },
    offchain: {
      id: '7b6a5f4e-3d2c-40ba-8e8d-7f6e5d4c3b2a',
      name: 'ofceth:maon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:llyon'],
    fullName: 'Eli Lilly (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: '3e8f7c9a-6d2b-4a5c-9e1d-8f7a6b3c2e9d',
      name: 'eth:llyon',
      contractAddress: '0xf192957ae52db3eb088654403cc2eded014ae556',
    },
    offchain: {
      id: 'c1b0a9e8-d7f6-45d4-83b2-a1f0e9d8c7b6',
      name: 'ofceth:llyon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:nflxon'],
    fullName: 'Netflix (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: 'f6a9d8c7-3e5b-4a2d-9f7c-1e8a6d9b3c5f',
      name: 'eth:nflxon',
      contractAddress: '0x032dec3372f25c41ea8054b4987a7c4832cdb338',
    },
    offchain: {
      id: '3d2c1b0a-9e8d-46fe-8d4c-3b2a1f0e9d8c',
      name: 'ofceth:nflxon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:coston'],
    fullName: 'Costco (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: '9d8e7f6a-5c4b-4e2d-9a9f-8b7c6e5d4a3b',
      name: 'eth:coston',
      contractAddress: '0x0c8276e4fec072cf7854be69c70f7773d1610857',
    },
    offchain: {
      id: 'a5f4e3d2-c1b0-49e8-87f6-e5d4c3b2a1f0',
      name: 'ofceth:coston',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:iauon'],
    fullName: 'iShares Gold Trust (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: 'a3b9c8d7-6e5f-4a2d-9c9e-8f7b6a5d4c3e',
      name: 'eth:iauon',
      contractAddress: '0x4f0ca3df1c2e6b943cf82e649d576ffe7b2fabcf',
    },
    offchain: {
      id: 'f0e9d8c7-b6a5-44e3-82c1-b0a9e8d7f6e5',
      name: 'ofceth:iauon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:ivvon'],
    fullName: 'iShares Core S&P 500 ETF (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: 'e7d9c8b6-5a4f-4e2d-9b9a-7c6f5e4d3b2a',
      name: 'eth:ivvon',
      contractAddress: '0x62ca254a363dc3c748e7e955c20447ab5bf06ff7',
    },
    offchain: {
      id: 'd4c3b2a1-f0e9-48c7-86a5-f4e3d2c1b0a9',
      name: 'ofceth:ivvon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:slvon'],
    fullName: 'iShares Silver Trust (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: 'c9b8a7d6-5e4f-4a2d-9b9c-8e7f6a5d4b3c',
      name: 'eth:slvon',
      contractAddress: '0xf3e4872e6a4cf365888d93b6146a2baa7348f1a4',
    },
    offchain: {
      id: '8c7b6a5f-4e3d-4c1b-9a9e-8d7f6e5d4c3b',
      name: 'ofceth:slvon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:ulon'],
    fullName: 'Unilever (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: '1e1f447e-b5ab-4cf9-90ac-d677280c788f',
      name: 'eth:ulon',
      contractAddress: '0x1598f7d25d0b0e1261eab9bd2ad7924291eb26bb',
    },
    offchain: {
      id: '09c745df-8cc6-42bc-9599-237fd8adfc93',
      name: 'ofceth:ulon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:iwnon'],
    fullName: 'iShares Russell 2000 Value ETF (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: 'e32ea649-043c-46f1-8dec-b5e573bc6e87',
      name: 'eth:iwnon',
      contractAddress: '0x9dcf7f739b8c0270e2fc0cc8d0dabe355a150dba',
    },
    offchain: {
      id: 'e638abf5-a930-4f75-81b2-f82680bb2db6',
      name: 'ofceth:iwnon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:itoton'],
    fullName: 'iShares Core S&amp;P Total US Stock Market ETF (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: '48efa2ef-1cea-40e1-a130-561976d1bb8e',
      name: 'eth:itoton',
      contractAddress: '0x0692481c369e2bdc728a69ae31b848343a4567be',
    },
    offchain: {
      id: '4ac0b4ca-2475-429d-b268-53925969190a',
      name: 'ofceth:itoton',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:tipon'],
    fullName: 'iShares TIPS Bond ETF (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: '3fdf54c2-5032-4856-8185-4f4e235be08d',
      name: 'eth:tipon',
      contractAddress: '0x2df38ca485d01fc15e4fd85847ed26b7ef871c1c',
    },
    offchain: {
      id: '059109b6-0f62-46d0-b28a-951c7ff67834',
      name: 'ofceth:tipon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:qbtson'],
    fullName: 'D-Wave Quantum (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: 'e6b97fee-44c3-4726-ada0-2a700e08bb53',
      name: 'eth:qbtson',
      contractAddress: '0x3807562a482b824c08a564dfefcc471806d3e00a',
    },
    offchain: {
      id: '4d1766ca-13c8-4eb3-afcf-a63d9123bec1',
      name: 'ofceth:qbtson',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:eqixon'],
    fullName: 'Equinix (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: '712afbc4-ff86-4bae-ba5b-3d37f2d9e2d3',
      name: 'eth:eqixon',
      contractAddress: '0x73d2ccee12c120e7da265a2de9d9f952a0101b4f',
    },
    offchain: {
      id: '4a056743-f3c6-422b-8dd7-b50bbe7594bf',
      name: 'ofceth:eqixon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:gmeon'],
    fullName: 'GameStop (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: '61647067-392a-4aae-952a-45e7ded39a7b',
      name: 'eth:gmeon',
      contractAddress: '0x71d24baeb0a033ec5f90ff65c4210545af378d97',
    },
    offchain: {
      id: 'ade4c12f-b822-4f4c-91ce-2bf30b7f1781',
      name: 'ofceth:gmeon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:hygon'],
    fullName: 'iBoxx $ High Yield Corporate Bond ETF (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: 'd6189e7e-e198-4d28-b229-f35ff99f2f68',
      name: 'eth:hygon',
      contractAddress: '0xed3618bb8778f8ebbe2f241da532227591771d04',
    },
    offchain: {
      id: '07bb44b2-7f40-45d1-8af6-e02f504f098c',
      name: 'ofceth:hygon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:pbron'],
    fullName: 'Petrobras (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: '41b406e4-009b-4aa8-b04d-b1feed854d27',
      name: 'eth:pbron',
      contractAddress: '0xd08ddb436e731f32455fe302723ee0fd2e9e8706',
    },
    offchain: {
      id: '5c660285-f305-4d1e-b024-1f63bb0839b4',
      name: 'ofceth:pbron',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:maraon'],
    fullName: 'MARA Holdings (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: '2fcf389c-59a0-4bbd-a93f-3008a13dd480',
      name: 'eth:maraon',
      contractAddress: '0x4604b0b581269843ac7a6b70a5fc019e7762e511',
    },
    offchain: {
      id: '4240efd6-92f8-4c33-9fec-e59d5a333468',
      name: 'ofceth:maraon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:cmcsaon'],
    fullName: 'Comcast (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: '9df0207e-f45b-4580-acc0-a5e65c9feb36',
      name: 'eth:cmcsaon',
      contractAddress: '0x85fd8dfd987988ede1777935d9d09c7ac7f09f0b',
    },
    offchain: {
      id: '90daae9b-bd26-4e65-a77e-8bdcb59e3024',
      name: 'ofceth:cmcsaon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:pfeon'],
    fullName: 'Pfizer (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: '19e98277-beb1-41f1-8cbf-b24a492c3c59',
      name: 'eth:pfeon',
      contractAddress: '0x06954faa913fa14c28eb1b2e459594f22f33f3de',
    },
    offchain: {
      id: '5e83f933-dad9-48b0-8a01-88a9bd9cf384',
      name: 'ofceth:pfeon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:sonyon'],
    fullName: 'Sony (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: 'aa08d2d5-69f5-4e36-b09a-0ed3fc4dfbad',
      name: 'eth:sonyon',
      contractAddress: '0xaf1382692f9927fd6a6c25add60285628a1879e5',
    },
    offchain: {
      id: '55e52e9c-23e7-44f6-8b92-df96e8efc719',
      name: 'ofceth:sonyon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:eemon'],
    fullName: 'iShares MSCI Emerging Markets ETF (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: '5069ef9b-de44-4c9f-a053-f1331863aee7',
      name: 'eth:eemon',
      contractAddress: '0x77a1a02e4a888ada8620b93c30de8a41e621126c',
    },
    offchain: {
      id: '98b73768-2337-42a9-8211-f4af6f56f42c',
      name: 'ofceth:eemon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:abton'],
    fullName: 'Abbott (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: '65dcb76e-1f0c-4c5e-8ea5-73673787dede',
      name: 'eth:abton',
      contractAddress: '0x3859385363f7bb4dfe42811ccf3f294fcd41dd1d',
    },
    offchain: {
      id: '65c4a6a8-d833-4f56-9c6d-16f0bea34a24',
      name: 'ofceth:abton',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:rioton'],
    fullName: 'Riot Platforms (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: '8c603a12-50b6-4f88-a5bb-91352b142951',
      name: 'eth:rioton',
      contractAddress: '0x21deafd91116fce9fe87c8f15bde03f99a309b72',
    },
    offchain: {
      id: '97b8b652-1309-4a30-ac19-82f6d699b993',
      name: 'ofceth:rioton',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:nvoon'],
    fullName: 'Novo Nordisk (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: '9ed93514-eb96-4423-a52f-a11caf522861',
      name: 'eth:nvoon',
      contractAddress: '0x28151f5888833d3d767c4d6945a0ee50d1b193e3',
    },
    offchain: {
      id: '4ece3a34-6067-405c-9eab-a6f856766630',
      name: 'ofceth:nvoon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:efaon'],
    fullName: 'iShares MSCI EAFE ETF (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: '27c879cb-a2a4-47bc-beb8-106144d24b93',
      name: 'eth:efaon',
      contractAddress: '0x4111b60bc87f2bd1e81e783e271d7f0ec6ee088b',
    },
    offchain: {
      id: '1abe3ec2-ed00-4409-8338-e73482e235fa',
      name: 'ofceth:efaon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:nkeon'],
    fullName: 'Nike (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: '2e26002f-b72f-4d05-93d8-5c94ccb82acd',
      name: 'eth:nkeon',
      contractAddress: '0xd8e26fcc879b30cb0a0b543925a2b3500f074d81',
    },
    offchain: {
      id: 'b7e9dd59-8c38-4150-a78f-ce326a93e833',
      name: 'ofceth:nkeon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:intcon'],
    fullName: 'Intel (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: '79da38a1-0cbe-4c07-99f7-2cddae006c08',
      name: 'eth:intcon',
      contractAddress: '0xfda09936dbd717368de0835ba441d9e62069d36f',
    },
    offchain: {
      id: '8f12c91a-aebc-40fc-a419-e2566c7286da',
      name: 'ofceth:intcon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:iefaon'],
    fullName: 'iShares Core MSCI EAFE ETF (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: 'e8a4d8a1-23b2-4ea2-8b41-45e50c9af5dc',
      name: 'eth:iefaon',
      contractAddress: '0xfeff7a377a86462f5a2a872009722c154707f09e',
    },
    offchain: {
      id: '6acba325-02bf-427e-bcc3-8c5ab2475a8a',
      name: 'ofceth:iefaon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:smcion'],
    fullName: 'Super Micro Computer (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: '7c399746-d8fe-4f2e-aeef-4a5f768d3c88',
      name: 'eth:smcion',
      contractAddress: '0x2ca12a3f9635fd69c21580def14f25c210ca9612',
    },
    offchain: {
      id: '17ccb3f4-5274-4e1d-9cfc-4422870e4bf6',
      name: 'ofceth:smcion',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:mrvlon'],
    fullName: 'Marvell Technology (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: '45104057-7344-44a1-96f3-1c34c89d9593',
      name: 'eth:mrvlon',
      contractAddress: '0xf404e5f887dbd5508e16a1198fcdd5de1a4296b8',
    },
    offchain: {
      id: 'd7cc3111-8b74-4e24-9af0-2bb64d423dda',
      name: 'ofceth:mrvlon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:aggon'],
    fullName: 'iShares Core US Aggregate Bond ETF (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: 'e00196a2-869d-4826-b3ad-94a048247ede',
      name: 'eth:aggon',
      contractAddress: '0xff7cf16aa2ffc463b996db2f7b7cf0130336899d',
    },
    offchain: {
      id: 'e7cf3596-e6b7-417e-b5b8-8d30abff31b4',
      name: 'ofceth:aggon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:uberon'],
    fullName: 'Uber (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: '12fe5e16-9f63-420d-8ed2-6643f8a421d6',
      name: 'eth:uberon',
      contractAddress: '0x5bcd8195e3ef58f677aef9ebc276b5087c027050',
    },
    offchain: {
      id: 'c267fc24-7996-42f0-831e-cd9ebf9ea401',
      name: 'ofceth:uberon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:himson'],
    fullName: 'Hims &amp; Hers Health (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: 'd9beb283-2672-474c-be26-efa5732c1fc8',
      name: 'eth:himson',
      contractAddress: '0xca468554e5c0423ee858fe3942c9568c51fcaa79',
    },
    offchain: {
      id: '61e9a3be-9d3f-409e-9d97-21b9cc7a575d',
      name: 'ofceth:himson',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:abnbon'],
    fullName: 'Airbnb (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: 'a0050ace-b59c-479e-9ff9-546f7edfeb2b',
      name: 'eth:abnbon',
      contractAddress: '0xb035c3d5083bdc80074f380aebc9fcb68aba0a28',
    },
    offchain: {
      id: '570b96f3-aec0-4b8c-9915-325adb9a1f1c',
      name: 'ofceth:abnbon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:cscoon'],
    fullName: 'Cisco Systems (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: '12af47e3-ace4-446f-b06a-3566a2b5812f',
      name: 'eth:cscoon',
      contractAddress: '0x980a1001ee94e54142b231f44c7ca7c9df71fbe1',
    },
    offchain: {
      id: 'b5a5153a-f3a8-428a-9934-1d87e4175dcc',
      name: 'ofceth:cscoon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:qcomon'],
    fullName: 'Qualcomm (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: 'fb349c8f-95a8-4936-9ce3-2da12606682f',
      name: 'eth:qcomon',
      contractAddress: '0xe3419710c1f77d44b4dab02316d3f048818c4e59',
    },
    offchain: {
      id: 'd73c922d-9b73-4299-b5bc-618ac1f26ec4',
      name: 'ofceth:qcomon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:sbuxon'],
    fullName: 'Starbucks (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: '8c2fe23c-78dc-4bcb-aebb-ba673539a9de',
      name: 'eth:sbuxon',
      contractAddress: '0xf15fbc1349ab99abad63db3f9a510bf413be3bef',
    },
    offchain: {
      id: 'b7e1369f-0491-42c3-9734-5a3fac89fd45',
      name: 'ofceth:sbuxon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:futuon'],
    fullName: 'Futu Holdings (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: 'fca01660-6bad-41fd-a941-9ecab72b60f5',
      name: 'eth:futuon',
      contractAddress: '0x5ce215d9c37a195df88e294a06b8396c296b4e15',
    },
    offchain: {
      id: '8ddc4745-10a5-4d22-a604-ffe50605b70a',
      name: 'ofceth:futuon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:cmgon'],
    fullName: 'Chipotle (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: 'e537c47d-5061-4d56-9859-f7c1c9890b48',
      name: 'eth:cmgon',
      contractAddress: '0x25018520138bbab60684ad7983d4432e8b8e926b',
    },
    offchain: {
      id: '623afdd7-f270-466c-b363-dfd4679f7fde',
      name: 'ofceth:cmgon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:koon'],
    fullName: 'Coca-Cola (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: '1016eb17-7614-4212-870b-2b5ef66e33fa',
      name: 'eth:koon',
      contractAddress: '0x74a03d741226f738098c35da8188e57aca50d146',
    },
    offchain: {
      id: 'a04afcd4-14b2-47e6-8fa8-38043e55c5e0',
      name: 'ofceth:koon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:iwfon'],
    fullName: 'iShares Russell 1000 Growth ETF (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: 'c195a542-99e1-4fdc-9c69-a78f6a46bbda',
      name: 'eth:iwfon',
      contractAddress: '0x8d05432c2786e3f93f1a9a62b9572dbf54f3ea06',
    },
    offchain: {
      id: 'e9158ed1-f4a0-48ed-b84d-79e906f89fbe',
      name: 'ofceth:iwfon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:armon'],
    fullName: 'Arm Holdings plc (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: 'c45d816e-22fe-431c-a926-78e2929fcae5',
      name: 'eth:armon',
      contractAddress: '0x5bf1b2a808598c0ef4af1673a5457d86fe6d7b3d',
    },
    offchain: {
      id: '1ba451ea-c9b5-401d-b161-87cd18fb2419',
      name: 'ofceth:armon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:linon'],
    fullName: 'Linde plc (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: '72afc4ad-8c34-41eb-bf42-46b5a815c237',
      name: 'eth:linon',
      contractAddress: '0x01b19c68f8a9ee3a480da788ba401cfabdf19b93',
    },
    offchain: {
      id: 'aa74a050-a8e0-4cd6-aa64-18468f7560d3',
      name: 'ofceth:linon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:jdon'],
    fullName: 'JD.com (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: '2f67edfe-8c54-4210-b55f-00ceb31f580a',
      name: 'eth:jdon',
      contractAddress: '0xdeb6b89088ca9b7d7756087c8a0f7c6df46f319c',
    },
    offchain: {
      id: '2e57c654-fb08-4869-b545-bcb50d4431e4',
      name: 'ofceth:jdon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:pyplon'],
    fullName: 'PayPal (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: 'daa15dbd-3081-4c68-94ee-36f78569837d',
      name: 'eth:pyplon',
      contractAddress: '0x4efd92f372898b57f292de69fce377dd7d912bdd',
    },
    offchain: {
      id: 'e29d537b-7494-414c-b21e-ec0ef6c67190',
      name: 'ofceth:pyplon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:muon'],
    fullName: 'Micron Technology (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: '76f74843-fb90-4a3c-9f02-276d70bd22d7',
      name: 'eth:muon',
      contractAddress: '0x050362ab1072cb2ce74d74770e22a3203ad04ee5',
    },
    offchain: {
      id: 'e60e89f0-7d14-4815-9501-6720e67a04a7',
      name: 'ofceth:muon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:wmton'],
    fullName: 'Walmart (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: '0bd21792-82ae-444d-9eaa-10f7d3cdee3f',
      name: 'eth:wmton',
      contractAddress: '0x82106347ddbb23ce44cf4ce4053ef1adf8b9323b',
    },
    offchain: {
      id: '661c66fe-eb3b-4f43-b440-216e10a7bc38',
      name: 'ofceth:wmton',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:shopon'],
    fullName: 'Shopify (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: '2749a3ff-d426-43e5-b636-74c84b83f545',
      name: 'eth:shopon',
      contractAddress: '0x908266c1192628371cff7ad2f5eba4de061a0ac5',
    },
    offchain: {
      id: 'b1e56388-b03c-409a-8a77-74dba67ce079',
      name: 'ofceth:shopon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:rddton'],
    fullName: 'Reddit (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: '62afa416-5852-4eab-ba30-c278bf2b2d6c',
      name: 'eth:rddton',
      contractAddress: '0xa9431d354cfad3c6b76e50f0e73b43d48be80cd0',
    },
    offchain: {
      id: '619804f7-9c43-444a-81a1-91832344f2d3',
      name: 'ofceth:rddton',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:tmon'],
    fullName: 'Toyota (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: 'c7f0576d-0223-4ddb-afb2-393fccb8b84e',
      name: 'eth:tmon',
      contractAddress: '0xab02fc332e9278ebcbbc6b4a8038050c01d15f69',
    },
    offchain: {
      id: '3970ce50-fea4-4635-803a-6aa63b2a662a',
      name: 'ofceth:tmon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:dison'],
    fullName: 'Disney (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: '78f3865e-6b4d-40c2-b4ea-a3831949202a',
      name: 'eth:dison',
      contractAddress: '0xc3d93b45249e8e06cfeb01d25a96337e8893265d',
    },
    offchain: {
      id: 'ea02c6fe-ded0-4da9-bc7b-684c97e21321',
      name: 'ofceth:dison',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:wfcon'],
    fullName: 'Wells Fargo (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: 'e85ce98e-75ec-4616-a8d5-0ad7c9be810f',
      name: 'eth:wfcon',
      contractAddress: '0x4ad2118da8a65eaa81402a3d583fef6ee76bdf3f',
    },
    offchain: {
      id: 'e82d49b1-f4dd-4edc-9a2b-0a2e6e75691e',
      name: 'ofceth:wfcon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:apoon'],
    fullName: 'Apollo Global Management (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: '5d109a80-d831-43a7-adee-079f1dbaed4f',
      name: 'eth:apoon',
      contractAddress: '0x4d21affd27183b07335935f81a5c26b6a5a15355',
    },
    offchain: {
      id: 'd531c9c3-54de-4fa6-b317-6128492b771d',
      name: 'ofceth:apoon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:pepon'],
    fullName: 'PepsiCo (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: 'e6e5499c-38b1-4af7-befb-bea5397257db',
      name: 'eth:pepon',
      contractAddress: '0x3ce219d498d807317f840f4cb0f03fa27dd65046',
    },
    offchain: {
      id: 'e7f18334-7e08-46a4-88f0-db5848d2b831',
      name: 'ofceth:pepon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:biduon'],
    fullName: 'Baidu (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: 'b207f5fc-7ed3-41d4-9286-ec1e35593688',
      name: 'eth:biduon',
      contractAddress: '0x9d4c6ad12b55e4645b585209f90cc26614061e91',
    },
    offchain: {
      id: 'a67c4f0a-71b8-4cf9-8060-ed5180cae497',
      name: 'ofceth:biduon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:mson'],
    fullName: 'Morgan Stanley (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: 'c154401e-847c-4961-a165-70e49abed89d',
      name: 'eth:mson',
      contractAddress: '0xb7cba7593baafffc96f9bbc86e578026369dec55',
    },
    offchain: {
      id: '1d1928f4-5ec8-414c-9820-abcb870d0a8e',
      name: 'ofceth:mson',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:avgoon'],
    fullName: 'Broadcom (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: '14b26633-6e15-48e2-acad-a02716e5027b',
      name: 'eth:avgoon',
      contractAddress: '0x0d54d4279b9e8c54cd8547c2c75a8ee81a0bcae8',
    },
    offchain: {
      id: 'd387be04-c260-47ca-b9c4-dad2dc343dab',
      name: 'ofceth:avgoon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:pgon'],
    fullName: 'Procter &amp; Gamble (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: '380318d1-1796-4bc2-a6f8-18f04ae308b6',
      name: 'eth:pgon',
      contractAddress: '0x339ce23a355ed6d513dd3e1462975c4ecd86823a',
    },
    offchain: {
      id: '60fbfe73-555c-4f0e-8d94-ffd01ba448b9',
      name: 'ofceth:pgon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:cvxon'],
    fullName: 'Chevron (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: '605022fb-532d-44ac-993e-0d447a3f6264',
      name: 'eth:cvxon',
      contractAddress: '0x8f3e41b378ae010c46d255f36bfc1d303b52dceb',
    },
    offchain: {
      id: '2f45e033-f268-434b-b36b-fef009693803',
      name: 'ofceth:cvxon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:panwon'],
    fullName: 'Palo Alto Networks (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: '5d7a8901-e72e-4c83-bac9-01cc4b6b766b',
      name: 'eth:panwon',
      contractAddress: '0x34bfdff25f0fda6d3ad0c33f1e06c0d40bd68885',
    },
    offchain: {
      id: '0b6b3fb7-3756-4dad-80c1-581f7ae68f29',
      name: 'ofceth:panwon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:crmon'],
    fullName: 'Salesforce (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: 'f3550164-57ce-422f-bf33-8aee82a635cf',
      name: 'eth:crmon',
      contractAddress: '0x55720ef5b023fd043ae5f8d2e526030207978950',
    },
    offchain: {
      id: '1532bd6c-2a38-429f-b834-d93329ffd3b3',
      name: 'ofceth:crmon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:snowon'],
    fullName: 'Snowflake (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: 'f9d1f755-f0b2-47e5-935c-85fee23fba9a',
      name: 'eth:snowon',
      contractAddress: '0x5d1a9a9b118ff19721e0111f094f2360b6ef7a2f',
    },
    offchain: {
      id: 'e7905f90-f2c7-4887-a5e4-d494c450332d',
      name: 'ofceth:snowon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:dashon'],
    fullName: 'DoorDash (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: '2e656f29-7f6a-44ea-95e0-80953395670c',
      name: 'eth:dashon',
      contractAddress: '0x241958c86c7744d15d5f6314ba1ea4c81dda2896',
    },
    offchain: {
      id: 'ba298da8-7595-4a3b-8854-ac0681c13a65',
      name: 'ofceth:dashon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:acnon'],
    fullName: 'Accenture (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: 'ac1d349c-0439-4dd9-9c1c-d92ffcb61204',
      name: 'eth:acnon',
      contractAddress: '0xaba9ae731aad63335c604e5f6e6a5db2e05f549d',
    },
    offchain: {
      id: '0d7b9f0e-cc0b-4d58-bed6-32d26c04a2f8',
      name: 'ofceth:acnon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:axpon'],
    fullName: 'American Express (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: '46dc2ab6-451b-462f-8276-293a66c31ba7',
      name: 'eth:axpon',
      contractAddress: '0x2bc7ff0c5da9f1a4a51f96e77c5b0f7165dc06d2',
    },
    offchain: {
      id: '2be0986b-ccf7-4d2e-a010-120007e48484',
      name: 'ofceth:axpon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:ibmon'],
    fullName: 'IBM (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: '99b78bcd-dffa-45fc-aeea-8f68d381c834',
      name: 'eth:ibmon',
      contractAddress: '0x25d3f236b2d61656eebdea86ac6d42168e340011',
    },
    offchain: {
      id: '36123a80-cf03-4a09-a316-a5aefb0f2b33',
      name: 'ofceth:ibmon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:ijhon'],
    fullName: 'iShares Core S&amp;P MidCap ETF (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: '70145616-c086-4cbf-bc1e-0264584e5f7a',
      name: 'eth:ijhon',
      contractAddress: '0xfd50fc4e3686a8da814c5c3d6121d8ab98a537f0',
    },
    offchain: {
      id: '5c93f80e-c39d-4d0e-bb45-0c9c6158232f',
      name: 'ofceth:ijhon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:baon'],
    fullName: 'Boeing (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: 'fe4d3d43-f44b-473b-9e18-77411f8e839a',
      name: 'eth:baon',
      contractAddress: '0x57270d35a840bc5c094da6fbeca033fb71ea6ab0',
    },
    offchain: {
      id: 'd668c146-c055-47a9-ae95-b73d529e72d4',
      name: 'ofceth:baon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:geon'],
    fullName: 'General Electric (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: 'c61e0441-a67c-4c84-a983-d681030dc18c',
      name: 'eth:geon',
      contractAddress: '0xd904bcf89b7cedf5c89f9df7e829191d695f847e',
    },
    offchain: {
      id: '6244ebde-d917-4a86-b783-c07212613032',
      name: 'ofceth:geon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:lmton'],
    fullName: 'Lockheed (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: '985db1b9-1444-44fe-a815-99b15c6b65b0',
      name: 'eth:lmton',
      contractAddress: '0x691b126cf619707ed5d16cab1b27c000aa8de300',
    },
    offchain: {
      id: '9c19f271-f66c-4892-809d-38566043a06d',
      name: 'ofceth:lmton',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:intuon'],
    fullName: 'Intuit (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: 'cfb1300d-6636-45b0-aefb-645a3fe36038',
      name: 'eth:intuon',
      contractAddress: '0x6cc0afd51ce4cb6920b775f3d6376ab82b9a93bb',
    },
    offchain: {
      id: 'b76c6d3d-952c-432e-94b0-2fd47fdb5191',
      name: 'ofceth:intuon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:mcdon'],
    fullName: 'McDonald&#39;s (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: '875cbb70-0458-4ea2-9062-9449b56d6d01',
      name: 'eth:mcdon',
      contractAddress: '0x4c82c8cd9a218612dce60b156b73a36705645e3b',
    },
    offchain: {
      id: '978ae967-2911-4cf9-b086-62a2e3faaa21',
      name: 'ofceth:mcdon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:gson'],
    fullName: 'Goldman Sachs (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: '74ff3971-5004-4ab2-bcce-28a6ecadc6eb',
      name: 'eth:gson',
      contractAddress: '0xdb57d9c14e357fc01e49035a808779df41e9b4e2',
    },
    offchain: {
      id: '24552561-2fb5-4b17-9afa-9755826390dc',
      name: 'ofceth:gson',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:adbeon'],
    fullName: 'Adobe (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: '7d4055fd-4a0f-4f03-8cd4-925ea6109247',
      name: 'eth:adbeon',
      contractAddress: '0x7042a8ffc7c7049684bfbc2fcb41b72380755a43',
    },
    offchain: {
      id: '94ead874-a4d4-4453-a5aa-cdb5d6bb50d7',
      name: 'ofceth:adbeon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:appon'],
    fullName: 'AppLovin (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: 'df689060-b30d-44c0-b556-10c0a3c2380b',
      name: 'eth:appon',
      contractAddress: '0xd5c5b2883735fa9b658dd52e2fcc8d7c0f1a42ce',
    },
    offchain: {
      id: '5ec5f233-52df-40b2-bee4-23da396344e4',
      name: 'ofceth:appon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:asmlon'],
    fullName: 'ASML Holding NV (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: 'b5b0eeab-bb72-4721-bda7-04eb97c72a76',
      name: 'eth:asmlon',
      contractAddress: '0xe51ba774ebf6392c45bf1d9e6b334d07992460d3',
    },
    offchain: {
      id: 'e1e741ff-290d-4551-9a73-c6a445207dc9',
      name: 'ofceth:asmlon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:spoton'],
    fullName: 'Spotify (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: '01a63604-29ed-4c25-a67c-3c9eb7883adb',
      name: 'eth:spoton',
      contractAddress: '0x590f21186489ca1612f49a4b1ff5c66acd6796a9',
    },
    offchain: {
      id: '11506e59-d46b-4115-bd3d-f74405acb85a',
      name: 'ofceth:spoton',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:iwmon'],
    fullName: 'iShares Russell 2000 ETF (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: 'bf720fa6-769f-4b65-9165-7f94cb7f863f',
      name: 'eth:iwmon',
      contractAddress: '0x070d79021dd7e841123cb0cf554993bf683c511d',
    },
    offchain: {
      id: '10ae4d3b-eb79-47ac-a232-15fbd9d2661b',
      name: 'ofceth:iwmon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:nowon'],
    fullName: 'ServiceNow (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: '1e3711d4-7f08-4b3a-abbc-da84eda80b27',
      name: 'eth:nowon',
      contractAddress: '0x8bcf9012f4b0c1c3d359edb7133c294f82f80790',
    },
    offchain: {
      id: '288e693a-741b-4798-9bb5-22a97419a605',
      name: 'ofceth:nowon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:blkon'],
    fullName: 'Blackrock, Inc. (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: 'c04d12f3-c130-46c4-9011-dbb64cbe1ead',
      name: 'eth:blkon',
      contractAddress: '0x7a0f89c1606f71499950aa2590d547c3975b728e',
    },
    offchain: {
      id: '05897dcf-f29c-47c7-8de1-5ed010b704e4',
      name: 'ofceth:blkon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:tlton'],
    fullName: 'iShares 20+ Year Treasury Bond ETF (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: 'b62da56f-c040-44c4-9bbb-f422579290ba',
      name: 'eth:tlton',
      contractAddress: '0x992651bfeb9a0dcc4457610e284ba66d86489d4d',
    },
    offchain: {
      id: '63baa5b0-79f2-480e-8cf3-6f869fd250b6',
      name: 'ofceth:tlton',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:grndon'],
    fullName: 'Grindr (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: 'b74d8bd3-b305-44d1-a4e8-6be5f82227f0',
      name: 'eth:grndon',
      contractAddress: '0xe5b26ba77e6a4d79a7c54a5296d81254269d9700',
    },
    offchain: {
      id: 'b3b4286f-98b0-4d40-8658-c79222ed0482',
      name: 'ofceth:grndon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:figon'],
    fullName: 'Figma (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: 'b8dee336-29aa-4eab-9abd-1811826cb02b',
      name: 'eth:figon',
      contractAddress: '0x073e7a0669833d356fa88ca65cc6d454efaaa3c5',
    },
    offchain: {
      id: '2b881a22-4137-4240-ba6d-ebf29973d081',
      name: 'ofceth:figon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:iemgon'],
    fullName: 'iShares Core MSCI Emerging Markets ETF (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: 'e2b8e122-a4e2-496f-83b3-c248d97f6a40',
      name: 'eth:iemgon',
      contractAddress: '0xcdd60d15125bf3362b6838d2506b0fa33bc1a515',
    },
    offchain: {
      id: '3ec95730-e1b5-4636-9045-d1e339472160',
      name: 'ofceth:iemgon',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:sbeton'],
    fullName: 'SharpLink Gaming (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: '190ba601-e63e-40b8-8464-0851e30bc4dc',
      name: 'eth:sbeton',
      contractAddress: '0xfdb46864a7c476f0914c5e82cded3364a9f56f8a',
    },
    offchain: {
      id: 'e8657df3-8052-440d-ad01-715ae8dc007c',
      name: 'ofceth:sbeton',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:melion'],
    fullName: 'MercadoLibre (Ondo Tokenized)',
    decimalPlaces: 18,
    onchain: {
      id: '170b1b32-6aac-4535-b1a8-fd6307b34a3f',
      name: 'eth:melion',
      contractAddress: '0x2816169a49953c548bfeb3948dcf05c4a0e4657d',
    },
    offchain: {
      id: 'ebdce5e2-5f30-4d09-9df2-e42d799165bf',
      name: 'ofceth:melion',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:six'],
    fullName: 'SIX Token',
    decimalPlaces: 18,
    onchain: {
      id: '6e7f1a86-e938-42ed-afe8-b58364a7f498',
      name: 'eth:six',
      contractAddress: '0x61c6ebf443ad613c9648762585b3cfd3ba1f3fa8',
    },
    offchain: {
      id: '5994291e-2d1b-4334-b7ae-0e361be85503',
      name: 'ofceth:six',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:eden'],
    fullName: 'OpenEden',
    decimalPlaces: 18,
    onchain: {
      id: '8769e8e2-7a34-465b-815d-4afe1b05746c',
      name: 'eth:eden',
      contractAddress: '0x24a3d725c37a8d1a66eb87f0e5d07fe67c120035',
    },
    offchain: {
      id: '5cbbbf49-81ba-44cb-b317-05e2b5489ec3',
      name: 'ofceth:eden',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:xeden'],
    fullName: 'Staked EDEN',
    decimalPlaces: 18,
    onchain: {
      id: 'ef73881d-b94d-45e1-884f-1409e3b1a10e',
      name: 'eth:xeden',
      contractAddress: '0x7e6c274e9f57b0f052647c37084d372ed665af23',
    },
    offchain: {
      id: 'cbc6cf70-7f40-46e1-bbe9-86e181714da8',
      name: 'ofceth:xeden',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:linea'],
    fullName: 'Linea',
    decimalPlaces: 18,
    onchain: {
      id: '6cf912d4-ea34-4e06-8a76-9a8067e826c6',
      name: 'eth:linea',
      contractAddress: '0x1789e0043623282d5dcc7f213d703c6d8bafbb04',
    },
    offchain: {
      id: '40a579f5-f630-4898-82de-9fc3fd555747',
      name: 'ofceth:linea',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:ff'],
    fullName: 'Falcon Finance',
    decimalPlaces: 18,
    onchain: {
      id: '2b2318f4-11f1-416a-a75c-d755cc8c997c',
      name: 'eth:ff',
      contractAddress: '0xfa1c09fc8b491b6a4d3ff53a10cad29381b3f949',
    },
    offchain: {
      id: '1bf5a8c6-fad7-47ff-87a1-56129d3b4c15',
      name: 'ofceth:ff',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:mavia'],
    fullName: 'Heroes of Mavia',
    decimalPlaces: 18,
    onchain: {
      id: 'b4b9fd5d-3830-4651-abda-667b59c865ac',
      name: 'eth:mavia',
      contractAddress: '0x24fcfc492c1393274b6bcd568ac9e225bec93584',
    },
    offchain: {
      id: '9cfc5cf7-0a6b-40ec-936c-04be24e196c0',
      name: 'ofceth:mavia',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:lm'],
    fullName: 'LeisureMeta',
    decimalPlaces: 18,
    onchain: {
      id: 'c4c0adf4-adcf-436a-bc40-33c151f283aa',
      name: 'eth:lm',
      contractAddress: '0xc064f4f215b6a1e4e7f39bd8530c4de0fc43ee9d',
    },
    offchain: {
      id: '9ec6f38f-ce0e-4f8c-94f8-69d182f9c25e',
      name: 'ofceth:lm',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:kub'],
    fullName: 'KUB',
    decimalPlaces: 18,
    onchain: {
      id: '3ded7589-7211-484a-8a76-1eace1d7dcb6',
      name: 'eth:kub',
      contractAddress: '0x0649cef6d11ed6f88535462e147304d3fe5ae14d',
      features: [...ACCOUNT_COIN_DEFAULT_FEATURES_EXCLUDE_MENA_FZE, CoinFeature.BULK_TRANSACTION] as CoinFeature[],
    },
    offchain: {
      id: '259c73b2-7c63-4522-96ee-9711442b45c8',
      name: 'ofceth:kub',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:fidd'],
    fullName: 'Fidelity Digital Dollar',
    decimalPlaces: 18,
    onchain: {
      id: '379c0ab5-7729-456b-b0b6-db74c3bd6a03',
      name: 'eth:fidd',
      contractAddress: '0x7c135549504245b5eae64fc0e99fa5ebabb8e35d',
    },
    offchain: {
      id: 'a9d3645d-4a42-4e9d-999b-83e4785b3f57',
      name: 'ofceth:fidd',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:fbtc'],
    fullName: 'Function Bitcoin',
    decimalPlaces: 8,
    onchain: {
      id: 'd74622eb-c7cb-4d3f-b10f-6f4dad930b3d',
      name: 'eth:fbtc',
      contractAddress: '0xc96de26018a54d51c097160568752c4e3bd6c364',
    },
    offchain: {
      id: '72427813-ec17-4100-8d6d-844a3f71f34e',
      name: 'ofceth:fbtc',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:byzusd'],
    fullName: 'Byzantine Prime USD',
    decimalPlaces: 18,
    onchain: {
      id: 'f2327bcc-41a0-446d-b482-4d1148c24343',
      name: 'eth:byzusd',
      contractAddress: '0x30cacd22f178c9e57b0b010e1f9432881aa530c4',
    },
    offchain: {
      id: 'e050aeab-a9c9-4962-b42f-d350c88efb37',
      name: 'ofceth:byzusd',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:audm'],
    fullName: 'Macropod Stablecoin',
    decimalPlaces: 18,
    onchain: {
      id: '17d33c86-258a-47b7-abab-486b5e349965',
      name: 'eth:audm',
      contractAddress: '0x081599e4936d12c46bd48913b2329115cd26cbdd',
    },
    offchain: {
      id: 'c3bbb0f5-a0d8-4651-ac4b-3727383f59ec',
      name: 'ofceth:audm',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:usdi'],
    fullName: 'USDi',
    decimalPlaces: 6,
    onchain: {
      id: 'bb874b3f-8844-4d92-82cf-c3dcfdcfebd0',
      name: 'eth:usdi',
      contractAddress: '0xaf1157149ff040dad186a0142a796d901bef1cf1',
    },
    offchain: {
      id: '884a97f2-5808-4614-814e-2cd1d17d29df',
      name: 'ofceth:usdi',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:tea'],
    fullName: 'Tea',
    decimalPlaces: 18,
    onchain: {
      id: '4ff37854-c686-4114-bbf2-6bfeeb7e14b1',
      name: 'eth:tea',
      contractAddress: '0x7ea7ea50ed58bc4d0a9194bcd328e21f7be80c2b',
    },
    offchain: {
      id: 'f4e98148-b703-4608-b416-67cd89c8a9f0',
      name: 'ofceth:tea',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:ofc'],
    fullName: 'OneFootball Club',
    decimalPlaces: 18,
    onchain: {
      id: 'c72cb819-15bc-4265-8efb-c0421edda866',
      name: 'eth:ofc',
      contractAddress: '0x9cb7a4ef0cae65b07362bc679a0b874041e3da53',
    },
    offchain: {
      id: '727298fe-56c5-477a-92af-5b4139e792ea',
      name: 'ofceth:ofc',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:wxm'],
    fullName: 'WeatherXM',
    decimalPlaces: 18,
    onchain: {
      id: '23b21214-3fe0-4785-8324-46a6814a334e',
      name: 'eth:wxm',
      contractAddress: '0xde654f497a563dd7a121c176a125dd2f11f13a83',
    },
    offchain: {
      id: '10c41a70-8bd2-4415-af52-fefe3af01132',
      name: 'ofceth:wxm',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:jpyc'],
    fullName: 'JPY Coin',
    decimalPlaces: 18,
    onchain: {
      id: 'd7bcd1cc-3109-481e-abf3-baf2c3926fb1',
      name: 'eth:jpyc',
      contractAddress: '0xe7c3d8c9a439fede00d2600032d5db0be71c3c29',
    },
    offchain: {
      id: 'c574d2de-42be-488f-afc0-71e2691eb900',
      name: 'ofceth:jpyc',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:ten'],
    fullName: 'TEN',
    decimalPlaces: 18,
    onchain: {
      id: 'bbe358df-256a-45bf-a184-ebfcdffd19d3',
      name: 'eth:ten',
      contractAddress: '0xea9bb54fc76bfd5dd2ff2f6da641e78c230bb683',
    },
    offchain: {
      id: '8465f646-73f8-4818-b890-c953f4423c89',
      name: 'ofceth:ten',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:camp'],
    fullName: 'Camp',
    decimalPlaces: 18,
    onchain: {
      id: '4a083157-205b-4769-8ecd-e71f40f94021',
      name: 'eth:camp',
      contractAddress: '0x84eaac1b2dc3f84d92ff84c3ec205b1fa74671fc',
    },
    offchain: {
      id: '9c1aaba6-e190-4be5-a477-f7db7d0f07ef',
      name: 'ofceth:camp',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:f'],
    fullName: 'SynFutures',
    decimalPlaces: 18,
    onchain: {
      id: '152ae10b-384a-48f2-9f3a-936776d05fd0',
      name: 'eth:f',
      contractAddress: '0x6e15a54b5ecac17e58dadeddbe8506a7560252f9',
    },
    offchain: {
      id: '2c28b184-614a-427f-bf5c-37dadee8985b',
      name: 'ofceth:f',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:turtle'],
    fullName: 'Turtle',
    decimalPlaces: 18,
    onchain: {
      id: 'b742d8e7-aaf6-4c86-87d4-f430e39ca951',
      name: 'eth:turtle',
      contractAddress: '0x66fd8de541c0594b4dccdfc13bf3a390e50d3afd',
    },
    offchain: {
      id: 'f8e6404b-2adc-4f74-b957-d9cbd7228d7e',
      name: 'ofceth:turtle',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:order'],
    fullName: 'Orderly Network',
    decimalPlaces: 18,
    onchain: {
      id: '6a4d3d5e-8934-442b-9929-9b1c0b6e9e2b',
      name: 'eth:order',
      contractAddress: '0xabd4c63d2616a5201454168269031355f4764337',
    },
    offchain: {
      id: 'a6e121e6-6563-4d2c-818d-91e9bd4af7ed',
      name: 'ofceth:order',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['eth:puffer'],
    fullName: 'Puffer',
    decimalPlaces: 18,
    onchain: {
      id: 'b54da6ed-2724-4293-84aa-ae65d7e7162b',
      name: 'eth:puffer',
      contractAddress: '0x4d1c297d39c5c1277964d0e3f8aa901493664530',
    },
    offchain: {
      id: '7192609e-c255-4da8-b1a5-e40cabbf4f2e',
      name: 'ofceth:puffer',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['baseeth:spec'],
    fullName: 'Spectral',
    decimalPlaces: 18,
    offchain: {
      id: 'd2b5f3e4-3c4e-4f1e-9f0a-1b2c3d4e5f6a',
      name: 'ofcbaseeth:spec',
      features: [...AccountCoin.DEFAULT_FEATURES_EXCLUDE_SINGAPORE, CoinFeature.EIP1559],
    },
  },
  {
    underlyingAsset: UnderlyingAsset['baseeth:soon'],
    fullName: 'Soon Token',
    decimalPlaces: 18,
    offchain: {
      id: 'bc7be60b-7eb8-4512-9675-d804f540962a',
      name: 'ofcbaseeth:soon',
      addressCoin: 'baseeth',
      features: [...ACCOUNT_COIN_DEFAULT_FEATURES, CoinFeature.EIP1559],
    },
  },
  {
    underlyingAsset: UnderlyingAsset['baseeth:wave'],
    fullName: 'Waveform',
    decimalPlaces: 18,
    offchain: {
      id: 'c2c6b14c-62e8-4dc1-9b8e-63e8fc5c7ab6',
      name: 'ofcbaseeth:wave',
      addressCoin: 'baseeth',
      features: [...ACCOUNT_COIN_DEFAULT_FEATURES, CoinFeature.EIP1559],
    },
  },
  {
    underlyingAsset: UnderlyingAsset['hypeevm:hwhype'],
    fullName: 'Hyperwave HYPE',
    decimalPlaces: 18,
    offchain: {
      id: 'd20cc76e-1384-4261-9d90-df2d6a87b3d0',
      name: 'ofchypeevm:hwhype',
      features: [...ACCOUNT_COIN_DEFAULT_FEATURES, CoinFeature.EIP1559],
    },
  },
  {
    underlyingAsset: UnderlyingAsset['baseeth:tig'],
    fullName: 'The Innovation Game',
    decimalPlaces: 18,
    offchain: {
      id: 'e3c6f4e5-4d5e-4f2e-8f1a-2c3d4e5f6a7b',
      name: 'ofcbaseeth:tig',
      addressCoin: 'baseeth',
      features: [...ACCOUNT_COIN_DEFAULT_FEATURES, CoinFeature.EIP1559],
    },
  },
  {
    underlyingAsset: UnderlyingAsset['baseeth:virtual'],
    fullName: 'Virtual Protocol',
    decimalPlaces: 18,
    offchain: {
      id: 'f4d7f5e6-5e6f-4f3f-8f2b-3d4e5f6a7b8c',
      name: 'ofcbaseeth:virtual',
      addressCoin: 'baseeth',
      features: [...ACCOUNT_COIN_DEFAULT_FEATURES, CoinFeature.EIP1559],
    },
  },
  {
    underlyingAsset: UnderlyingAsset['baseeth:zora'],
    fullName: 'Zora',
    decimalPlaces: 18,
    offchain: {
      id: 'a5e8f6e7-6f7a-4f4a-8f3c-4e5f6a7b8c9d',
      name: 'ofcbaseeth:zora',
      addressCoin: 'baseeth',
      features: [...ACCOUNT_COIN_DEFAULT_FEATURES, CoinFeature.EIP1559],
    },
  },
  {
    underlyingAsset: UnderlyingAsset['baseeth:toshi'],
    fullName: 'Toshi',
    decimalPlaces: 18,
    offchain: {
      id: 'b6f9f7e8-7a8b-4f5b-8f4d-5f6a7b8c9dae',
      name: 'ofcbaseeth:toshi',
      addressCoin: 'baseeth',
      features: [...ACCOUNT_COIN_DEFAULT_FEATURES, CoinFeature.EIP1559],
    },
  },
  {
    underlyingAsset: UnderlyingAsset['baseeth:creator'],
    fullName: 'CreatorDAO',
    decimalPlaces: 18,
    offchain: {
      id: 'c7aaf8e9-8b9c-4f6c-8f5e-6a7b8c9daebf',
      name: 'ofcbaseeth:creator',
      addressCoin: 'baseeth',
      features: [...ACCOUNT_COIN_DEFAULT_FEATURES, CoinFeature.EIP1559],
    },
  },
  {
    underlyingAsset: UnderlyingAsset['baseeth:avnt'],
    fullName: 'Avantis',
    decimalPlaces: 18,
    offchain: {
      id: 'd8bbf9ea-9cad-4f7d-8f6f-7b8c9daebfca',
      name: 'ofcbaseeth:avnt',
      addressCoin: 'baseeth',
      features: [...ACCOUNT_COIN_DEFAULT_FEATURES, CoinFeature.EIP1559],
    },
  },
  {
    underlyingAsset: UnderlyingAsset['baseeth:mira'],
    fullName: 'Mira Network',
    decimalPlaces: 18,
    offchain: {
      id: 'e9ccfaeb-adbe-4f8e-8f7a-8c9daebfcadb',
      name: 'ofcbaseeth:mira',
      addressCoin: 'baseeth',
      features: [...ACCOUNT_COIN_DEFAULT_FEATURES, CoinFeature.EIP1559],
    },
  },
  {
    underlyingAsset: UnderlyingAsset['baseeth:towns'],
    fullName: 'Towns',
    decimalPlaces: 18,
    offchain: {
      id: 'faddfbec-becf-4f9f-8f8b-9daebfcadbec',
      name: 'ofcbaseeth:towns',
      addressCoin: 'baseeth',
      features: [...ACCOUNT_COIN_DEFAULT_FEATURES, CoinFeature.EIP1559],
    },
  },
  {
    underlyingAsset: UnderlyingAsset['baseeth:recall'],
    fullName: 'Recall',
    decimalPlaces: 18,
    offchain: {
      id: 'f6bebafa-7934-4ca2-9195-1f4543c2ce0c',
      name: 'ofcbaseeth:recall',
      addressCoin: 'baseeth',
      features: [...ACCOUNT_COIN_DEFAULT_FEATURES, CoinFeature.EIP1559],
    },
  },
  {
    underlyingAsset: UnderlyingAsset['baseeth:brlv'],
    fullName: 'BRL Velocity',
    decimalPlaces: 18,
    offchain: {
      id: '088adddd-d75d-416f-94f0-05b686ffc424',
      name: 'ofcbaseeth:brlv',
      addressCoin: 'baseeth',
      features: [...ACCOUNT_COIN_DEFAULT_FEATURES, CoinFeature.EIP1559],
    },
  },
  {
    underlyingAsset: UnderlyingAsset['baseeth:wbrly'],
    fullName: 'Wrapped BRLY',
    decimalPlaces: 24,
    offchain: {
      id: '72d1eb99-3882-42db-abdd-c3a02f3829b4',
      name: 'ofcbaseeth:wbrly',
      addressCoin: 'baseeth',
      features: [...ACCOUNT_COIN_DEFAULT_FEATURES, CoinFeature.EIP1559],
    },
  },
  {
    underlyingAsset: UnderlyingAsset['baseeth:sapien'],
    fullName: 'Sapien',
    decimalPlaces: 18,
    offchain: {
      id: 'bfda6989-f5d4-4cc4-a80f-6b88e8da5198',
      name: 'ofcbaseeth:sapien',
      addressCoin: 'baseeth',
      features: [...ACCOUNT_COIN_DEFAULT_FEATURES, CoinFeature.EIP1559],
    },
  },
  {
    underlyingAsset: UnderlyingAsset['baseeth:aixbt'],
    fullName: 'Aixbt by Virtuals',
    decimalPlaces: 18,
    offchain: {
      id: 'bdfff799-1623-4847-93c0-c1a040c13d3f',
      name: 'ofcbaseeth:aixbt',
      addressCoin: 'baseeth',
      features: [...ACCOUNT_COIN_DEFAULT_FEATURES, CoinFeature.EIP1559],
    },
  },
  {
    underlyingAsset: UnderlyingAsset['baseeth:brett'],
    fullName: 'Brett',
    decimalPlaces: 18,
    offchain: {
      id: '3ce0c7b4-7043-4309-8493-7809001ad410',
      name: 'ofcbaseeth:brett',
      addressCoin: 'baseeth',
      features: [...ACCOUNT_COIN_DEFAULT_FEATURES, CoinFeature.EIP1559],
    },
  },
  {
    underlyingAsset: UnderlyingAsset['baseeth:argt'],
    fullName: 'ARG Token',
    decimalPlaces: 18,
    offchain: {
      id: 'd8a3b2c7-4e9f-4d6a-95e0-6c1f7b3d8a5e',
      name: 'ofcbaseeth:argt',
      addressCoin: 'baseeth',
      features: [...ACCOUNT_COIN_DEFAULT_FEATURES, CoinFeature.EIP1559],
    },
  },
  {
    underlyingAsset: UnderlyingAsset['baseeth:brat'],
    fullName: 'BRA Token',
    decimalPlaces: 18,
    offchain: {
      id: 'e9b4c3d8-5f0a-4e7b-86f1-7d2a8c4e9b6f',
      name: 'ofcbaseeth:brat',
      addressCoin: 'baseeth',
      features: [...ACCOUNT_COIN_DEFAULT_FEATURES, CoinFeature.EIP1559],
    },
  },
  {
    underlyingAsset: UnderlyingAsset['baseeth:mext'],
    fullName: 'Mexican Peso Token',
    decimalPlaces: 18,
    offchain: {
      id: 'f0c5d4e9-6a1b-4f8c-a7a2-8e3b9d5f0c7a',
      name: 'ofcbaseeth:mext',
      addressCoin: 'baseeth',
      features: [...ACCOUNT_COIN_DEFAULT_FEATURES, CoinFeature.EIP1559],
    },
  },
  {
    underlyingAsset: underlyingAssetForSymbol('mon:usdc'),
    fullName: 'MON:USDC',
    decimalPlaces: 6,
    offchain: {
      id: '1458bca6-e0d3-455e-81c7-55862dc5af52',
      name: 'ofcmon:usdc',
      addressCoin: 'mon',
      features: [...ACCOUNT_COIN_DEFAULT_FEATURES, CoinFeature.STABLECOIN],
    },
  },
  {
    underlyingAsset: underlyingAssetForSymbol('mon:wmon'),
    fullName: 'Wrapped MON',
    decimalPlaces: 18,
    offchain: {
      id: '7a8631a5-deed-43c5-92a0-13e3322429ba',
      name: 'ofcmon:wmon',
      addressCoin: 'mon',
      features: [...ACCOUNT_COIN_DEFAULT_FEATURES, CoinFeature.EIP1559],
    },
  },
  {
    underlyingAsset: underlyingAssetForSymbol('xdc:usdc'),
    fullName: 'USD Coin (XDC)',
    decimalPlaces: 6,
    offchain: {
      id: '517ca4d1-a2c4-4606-914f-4c4b5b4943ff',
      name: 'ofcxdc:usdc',
      addressCoin: 'xdc',
      features: [...ACCOUNT_COIN_DEFAULT_FEATURES, CoinFeature.STABLECOIN],
    },
  },
  {
    underlyingAsset: underlyingAssetForSymbol('xdc:lbt'),
    fullName: 'Law Block Token',
    decimalPlaces: 18,
    offchain: {
      id: 'b4666353-81d0-491b-a554-bdd8e677be24',
      name: 'ofcxdc:lbt',
      addressCoin: 'xdc',
      features: [...ACCOUNT_COIN_DEFAULT_FEATURES, CoinFeature.EIP1559],
    },
  },
  {
    underlyingAsset: underlyingAssetForSymbol('xdc:gama'),
    fullName: 'Gama Token',
    decimalPlaces: 18,
    offchain: {
      id: '086883c7-f7e9-458e-a0a1-ed3ec525f9c6',
      name: 'ofcxdc:gama',
      addressCoin: 'xdc',
      features: [...ACCOUNT_COIN_DEFAULT_FEATURES, CoinFeature.EIP1559],
    },
  },
  {
    underlyingAsset: underlyingAssetForSymbol('xdc:srx'),
    fullName: 'STORX',
    decimalPlaces: 18,
    offchain: {
      id: '0c8b533c-1929-4de8-af36-9cf4b4409c0d',
      name: 'ofcxdc:srx',
      addressCoin: 'xdc',
      features: [...ACCOUNT_COIN_DEFAULT_FEATURES, CoinFeature.EIP1559],
    },
  },
  {
    underlyingAsset: underlyingAssetForSymbol('xdc:weth'),
    fullName: 'Wrapped Ether (XDC)',
    decimalPlaces: 18,
    offchain: {
      id: '3c7ec48a-ba51-47c9-9044-f29d9c0daf35',
      name: 'ofcxdc:weth',
      addressCoin: 'xdc',
      features: [...ACCOUNT_COIN_DEFAULT_FEATURES, CoinFeature.EIP1559],
    },
  },
  {
    underlyingAsset: underlyingAssetForSymbol('ip:aria'),
    fullName: 'Aria',
    decimalPlaces: 18,
    offchain: {
      id: '452cc4f6-3c77-4193-a572-4b0d0f838c3c',
      name: 'ofcip:aria',
      addressCoin: 'ip',
      features: [...ACCOUNT_COIN_DEFAULT_FEATURES, CoinFeature.EIP1559],
    },
  },
  {
    underlyingAsset: UnderlyingAsset.FIXED,
    fullName: 'Goerli Example Fixed Supply Token',
    decimalPlaces: 18,
    isTestnet: true,
    onchain: {
      id: '0205f0d6-0647-47c9-ad8b-c48d048e54f3',
      name: 'fixed',
      contractAddress: '0xa13de8df4ef9d6016f0826858d48045848429390',
      network: Networks.test.goerli,
    },
  },
  {
    underlyingAsset: UnderlyingAsset.GUSDT,
    fullName: 'Goerli USDT',
    decimalPlaces: 18,
    isTestnet: true,
    onchain: {
      id: 'cf52b96c-a89c-4db4-aadd-92f4a78edbbf',
      name: 'gusdt',
      contractAddress: '0x64d081854fad45e64db52cd28ba78ae1ecfee59b',
      features: [...ACCOUNT_COIN_DEFAULT_FEATURES, CoinFeature.STABLECOIN] as CoinFeature[],
      network: Networks.test.goerli,
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TEUROC,
    fullName: 'Test Euro Coin',
    decimalPlaces: 6,
    isTestnet: true,
    onchain: {
      id: '56be4cee-9a5f-4580-a3ed-480d1baac5c0',
      name: 'teuroc',
      contractAddress: '0xa683d909e996052955500ddc45ca13e25c76e286',
      network: Networks.test.goerli,
    },
  },
  {
    underlyingAsset: UnderlyingAsset.HDO,
    fullName: 'Himalayan Dollar',
    decimalPlaces: 18,
    isTestnet: true,
    onchain: {
      id: 'af91abaf-8811-4e8c-a396-fe484f968538',
      name: 'ghdo',
      contractAddress: '0x5426635915740813092eeff72158bc492799da5f',
      network: Networks.test.goerli,
    },
  },
  {
    underlyingAsset: UnderlyingAsset.GTERC2DP,
    fullName: 'Goerli Test ERC Token 2 Decimals',
    decimalPlaces: 2,
    isTestnet: true,
    onchain: {
      id: '05bb6085-b6c5-4c61-867d-71284842512c',
      name: 'gterc2dp',
      contractAddress: '0xe19e232e942cde4320b6354646cbb1336ae732c7',
      network: Networks.test.goerli,
    },
  },
  {
    underlyingAsset: UnderlyingAsset.GTERC6DP,
    fullName: 'Goerli Test ERC Token 6 Decimals',
    decimalPlaces: 6,
    isTestnet: true,
    onchain: {
      id: '26ce3a69-2c52-475b-b12f-1efe96da820f',
      name: 'gterc6dp',
      contractAddress: '0xe7afa17e6e5257806d2309b01e6de320668ec3dc',
      network: Networks.test.goerli,
    },
  },
  {
    underlyingAsset: UnderlyingAsset.HCN,
    fullName: 'Himalayan Coin',
    decimalPlaces: 18,
    isTestnet: true,
    onchain: {
      id: '39a3d88c-0bf8-4e54-96ad-1a4829d26bba',
      name: 'ghcn',
      contractAddress: '0xa05e3efe2771cd04191f3eadb9a99ba3b4bf9d26',
      network: Networks.test.goerli,
    },
  },
  {
    underlyingAsset: UnderlyingAsset.GTERC18DP,
    fullName: 'Goerli Test ERC Token 18 Decimals',
    decimalPlaces: 18,
    isTestnet: true,
    onchain: {
      id: 'c1623fdb-5cfb-43c3-9c4f-8ef073ac50d8',
      name: 'gterc18dp',
      contractAddress: '0x61d54356be035944a3868eaa9556353b7150699d',
      network: Networks.test.goerli,
    },
  },
  {
    underlyingAsset: UnderlyingAsset.GTAAVE18DP,
    fullName: 'Goerli Test AAVE Token 18 Decimals',
    decimalPlaces: 18,
    isTestnet: true,
    onchain: {
      id: '95b5dadf-faa7-43f3-8fa4-59998879c842',
      name: 'gtaave18dp',
      contractAddress: '0x631d5e3c45a459e8f98b9d6a2734fce7b051f845',
      network: Networks.test.goerli,
    },
  },
  {
    underlyingAsset: UnderlyingAsset.GTBAT18DP,
    fullName: 'Goerli Test BAT Token 18 Decimals',
    decimalPlaces: 18,
    isTestnet: true,
    onchain: {
      id: '46115188-73f0-44c5-bdd2-cce85b4599a7',
      name: 'gtbat18dp',
      contractAddress: '0x95458b26c8b524eb5ef92c7a1759ede6224bef2e',
      network: Networks.test.goerli,
    },
  },
  {
    underlyingAsset: UnderlyingAsset.GTCOMP18DP,
    fullName: 'Goerli Test COMP Token 18 Decimals',
    decimalPlaces: 18,
    isTestnet: true,
    onchain: {
      id: 'e9cd18db-4eb5-496c-8828-42a7a4af9c06',
      name: 'gtcomp18dp',
      contractAddress: '0xa1ff97c394b25926acb09d12bacf0613055a2727',
      network: Networks.test.goerli,
    },
  },
  {
    underlyingAsset: UnderlyingAsset.GTGRT18DP,
    fullName: 'Goerli Test GRT Token 18 Decimals',
    decimalPlaces: 18,
    isTestnet: true,
    onchain: {
      id: 'd6b54ae4-505b-412f-93f9-3c0b5893b1ba',
      name: 'gtgrt18dp',
      contractAddress: '0x1441f298d1f15084a0e5c714c966033e39597de7',
      network: Networks.test.goerli,
    },
  },
  {
    underlyingAsset: UnderlyingAsset.GTLINK18DP,
    fullName: 'Goerli Test LINK Token 18 Decimals',
    decimalPlaces: 18,
    isTestnet: true,
    onchain: {
      id: 'aabf7c6b-4b40-41e6-acc5-7d0ad184ea2d',
      name: 'gtlink18dp',
      contractAddress: '0xfe4537ff71aef28592c5c7331ed4b20f276d770b',
      network: Networks.test.goerli,
    },
  },
  {
    underlyingAsset: UnderlyingAsset.GTMKR18DP,
    fullName: 'Goerli Test MKR Token 18 Decimals',
    decimalPlaces: 18,
    isTestnet: true,
    onchain: {
      id: '0cef34dc-2416-4338-89b5-bf9c53c35a9e',
      name: 'gtmkr18dp',
      contractAddress: '0xf84e8207e4dc846e250208a6e4b05aa3e7ab00c6',
      network: Networks.test.goerli,
    },
  },
  {
    underlyingAsset: UnderlyingAsset.GTSNX18DP,
    fullName: 'Goerli Test SNX Token 18 Decimals',
    decimalPlaces: 18,
    isTestnet: true,
    onchain: {
      id: '47f6c65d-9c7d-4236-98ef-766a55933815',
      name: 'gtsnx18dp',
      contractAddress: '0x50608a26bff103290a4a47b152395047801e9280',
      network: Networks.test.goerli,
    },
  },
  {
    underlyingAsset: UnderlyingAsset.GTUNI18DP,
    fullName: 'Goerli Test UNI Token 18 Decimals',
    decimalPlaces: 18,
    isTestnet: true,
    onchain: {
      id: 'a0c58c0d-ffe0-4ec9-98f6-3ea3efaf84c8',
      name: 'gtuni18dp',
      contractAddress: '0x6be1a99c215872cea33217b0f4bad63f186ddfac',
      network: Networks.test.goerli,
    },
  },
  {
    underlyingAsset: UnderlyingAsset.GTUSDT6DP,
    fullName: 'Goerli Test USDT Token 6 Decimals',
    decimalPlaces: 6,
    isTestnet: true,
    onchain: {
      id: '59a9c99e-ab23-48f8-b0d9-a7db531f682a',
      name: 'gtusdt6dp',
      contractAddress: '0x51445dcddf5246229bae8c0ba3ea462e63038641',
      network: Networks.test.goerli,
    },
  },
  {
    underlyingAsset: UnderlyingAsset.GTYFI18DP,
    fullName: 'Goerli Test YFI Token 18 Decimals',
    decimalPlaces: 18,
    isTestnet: true,
    onchain: {
      id: '6d895aef-5294-4758-9521-ef04cc60f22b',
      name: 'gtyfi18dp',
      contractAddress: '0xf4755c1a9aaad9d6b919edb8346ce9b46d066be4',
      network: Networks.test.goerli,
    },
  },
  {
    underlyingAsset: UnderlyingAsset.GTWBTC8DP,
    fullName: 'Goerli Test WBTC Token 8 Decimals',
    decimalPlaces: 8,
    isTestnet: true,
    onchain: {
      id: '378bf9a7-9cbf-483b-9222-5a6c9d14552d',
      name: 'gtwbtc18dp',
      contractAddress: '0xd4bccebe77b7c1da89818f8889e3ea09046e7e38',
      network: Networks.test.goerli,
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TERC,
    fullName: 'Test ERC Token',
    decimalPlaces: 18,
    isTestnet: true,
    onchain: {
      id: '6a589d24-2053-4c04-ab8a-e66bde0a6f96',
      name: 'terc',
      contractAddress: '0x945ac907cf021a6bcd07852bb3b8c087051706a9',
    },
    offchain: {
      id: '055ebe86-72cc-4f0e-b46f-c517d8e3687a',
      name: 'ofcterc',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TERC2DP,
    fullName: 'TERC2DP',
    decimalPlaces: 2,
    isTestnet: true,
    onchain: {
      id: 'c316d8ef-20d6-40b7-b0c1-e3cc278d0c17',
      name: 'hterc2dp',
      contractAddress: '0x335f0741c9be939bc8226b31b79df9ca633f4559',
      network: Networks.test.hoodi,
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TERC6DP,
    fullName: 'TERC6DP',
    decimalPlaces: 6,
    isTestnet: true,
    onchain: {
      id: 'e09792d6-87f9-412e-9394-03ececf56232',
      name: 'hterc6dp',
      contractAddress: '0x76c57d19bd3529dadf4bb66e75f0808bc8264a5e',
      network: Networks.test.hoodi,
    },
    offchain: {
      id: 'e34cd75e-62dc-4453-a282-577e407bdb95',
      name: 'ofchterc6dp',
      addressCoin: 'hteth',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TERC18DP,
    fullName: 'TERC18DP',
    decimalPlaces: 18,
    isTestnet: true,
    onchain: {
      id: '95f5bf48-f2bb-4c64-a851-4f95ddce2fcf',
      name: 'hterc18dp',
      contractAddress: '0x21782ccd72a67223df0d5a7dfa4db2343e4ee6aa',
      network: Networks.test.hoodi,
    },
    offchain: {
      id: '4144a64f-eacd-4df1-a482-72e9c0d976ff',
      name: 'ofchterc18dp',
      addressCoin: 'hteth',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TERC2DP1,
    fullName: 'Test ERC Token 2 Decimals',
    decimalPlaces: 2,
    isTestnet: true,
    onchain: {
      id: 'd713305d-f1e9-4481-b541-9f72ba3d3e58',
      name: 'terc2dp1',
      contractAddress: '0xceef48d58cc3a51d8b6df155633007415b9bae01',
      network: Networks.test.goerli,
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TERC2DP2,
    fullName: 'Test ERC Token 2 Decimals',
    decimalPlaces: 2,
    isTestnet: true,
    onchain: {
      id: 'a49b74dc-c43c-4c67-bc0d-ff596b46e0d1',
      name: 'terc2dp2',
      contractAddress: '0x168ae5b381f7c317ac6ef2161c6e5fcc0e0de41e',
      network: Networks.test.goerli,
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TERC2DP3,
    fullName: 'Test ERC Token 2 Decimals',
    decimalPlaces: 2,
    isTestnet: true,
    onchain: {
      id: 'fe7dd8ef-a7d1-41a9-9b6e-fffacef0d94a',
      name: 'terc2dp3',
      contractAddress: '0x12cb9d6127ac74847cc444e6661cfd1b5107bd26',
      network: Networks.test.goerli,
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TERC2DP4,
    fullName: 'Test ERC Token 2 Decimals',
    decimalPlaces: 2,
    isTestnet: true,
    onchain: {
      id: '4ef44d49-ba21-42f9-a202-147dbfe7ea98',
      name: 'terc2dp4',
      contractAddress: '0x458fdef6e1e58614d82f3116d8ca1f23419cb8c0',
      network: Networks.test.goerli,
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TERC2DP5,
    fullName: 'Test ERC Token 2 Decimals',
    decimalPlaces: 2,
    isTestnet: true,
    onchain: {
      id: '2d4c3457-e8be-44c4-bf0e-ee8c90f69253',
      name: 'terc2dp5',
      contractAddress: '0xf44c85bf1d556a8268a1212cf0b9248af4f238bd',
      network: Networks.test.goerli,
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TERC6DP1,
    fullName: 'Test ERC Token 6 Decimals',
    decimalPlaces: 6,
    isTestnet: true,
    onchain: {
      id: '8cc596b9-6ec6-4b0f-bbd0-9a895d92ce04',
      name: 'terc6dp1',
      contractAddress: '0x3b9f958f0ba34aa103fabb054f29400703470bac',
      network: Networks.test.goerli,
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TERC6DP2,
    fullName: 'Test ERC Token 6 Decimals',
    decimalPlaces: 6,
    isTestnet: true,
    onchain: {
      id: 'aa750c4e-fe1d-436a-9971-d596bfe66a44',
      name: 'terc6dp2',
      contractAddress: '0x2508d109a0cd87e597a1de071325f5cf56d4639a',
      network: Networks.test.goerli,
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TERC6DP3,
    fullName: 'Test ERC Token 6 Decimals',
    decimalPlaces: 6,
    isTestnet: true,
    onchain: {
      id: '3828d10b-cf43-4d75-9f41-3b993a37ad98',
      name: 'terc6dp3',
      contractAddress: '0xdda2375104ee9a97e1d7aa4bc48ede2c4c6ddf48',
      network: Networks.test.goerli,
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TERC6DP4,
    fullName: 'Test ERC Token 6 Decimals',
    decimalPlaces: 6,
    isTestnet: true,
    onchain: {
      id: '0d848049-97af-435c-b454-46bffb270352',
      name: 'terc6dp4',
      contractAddress: '0x06c1f1195c59ec5f318d12d4cc2d1f9d45261756',
      network: Networks.test.goerli,
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TERC6DP5,
    fullName: 'Test ERC Token 6 Decimals',
    decimalPlaces: 6,
    isTestnet: true,
    onchain: {
      id: '2e202e23-4e87-4c0d-8e06-4d5eb0f32ffc',
      name: 'terc6dp5',
      contractAddress: '0x3326af8eeb6d4ce1f1f0652fcb3d5e07cd9c1039',
      network: Networks.test.goerli,
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TERC18DP1,
    fullName: 'Test ERC Token 18 Decimals',
    decimalPlaces: 18,
    isTestnet: true,
    onchain: {
      id: '6bdf7935-cfb0-4a8f-9204-2e87df2bdd89',
      name: 'terc18dp1',
      contractAddress: '0x9f77b76e6866b3f5dd99382c96f16eddabc0b78e',
      network: Networks.test.goerli,
    },
  },
  {
    underlyingAsset: UnderlyingAsset.THEU,
    fullName: 'Goerli Test Himalaya Euro Token',
    decimalPlaces: 18,
    isTestnet: true,
    onchain: {
      id: 'c28caef6-1312-49ad-9aad-fff8fdb63c6c',
      name: 'theu',
      contractAddress: '0xbd6bb9f5364fe1408233204b82c3acfb4ce2b9d5',
      network: Networks.test.goerli,
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TUSDS,
    fullName: 'Holesky Testnet USD Standard',
    decimalPlaces: 6,
    isTestnet: true,
    onchain: {
      id: '5e4f0e5e-b8ce-431c-8a62-62e54e32bb82',
      name: 'tusds',
      contractAddress: '0x399ae63d3fd23da82109fc8b632c19a1810f657e',
      features: [...ACCOUNT_COIN_DEFAULT_FEATURES, CoinFeature.STABLECOIN] as CoinFeature[],
      network: Networks.test.holesky,
    },
    offchain: {
      id: '5f83eaf5-9ba2-4aee-8d6a-b97bf2669edb',
      name: 'ofctusds',
      features: [CoinFeature.STABLECOIN] as CoinFeature[],
      addressCoin: 'hteth',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TGOUSD,
    fullName: 'Hoodi Testnet GoUSD',
    decimalPlaces: 6,
    isTestnet: true,
    onchain: {
      id: '17377290-40ff-47a3-8346-ba03885f7cc3',
      name: 'tgousd',
      contractAddress: '0xdbb7a34ea6859d307c4f2bb5be266e2d32356f5c',
      features: [...ACCOUNT_COIN_DEFAULT_FEATURES, CoinFeature.STABLECOIN] as CoinFeature[],
      network: Networks.test.hoodi,
    },
    offchain: {
      id: '0c90af13-2b65-4c13-ae1f-101531aa8e9b',
      name: 'ofctgousd',
      features: [CoinFeature.STABLECOIN] as CoinFeature[],
      addressCoin: 'hteth',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['hteth:stgusd1'],
    fullName: 'Test USD1 Token',
    decimalPlaces: 18,
    isTestnet: true,
    onchain: {
      id: '3502002c-0f27-46d0-9967-d34cd9290476',
      name: 'hteth:stgusd1',
      contractAddress: '0xe4cf91a5bf7cc3d75ac85639e591e51d34948954',
      features: [...ACCOUNT_COIN_DEFAULT_FEATURES, CoinFeature.STABLECOIN] as CoinFeature[],
      network: Networks.test.hoodi,
    },
    offchain: {
      id: 'c1d2c09d-ac71-4cf6-9683-90d93b6afa09',
      name: 'ofchteth:stgusd1',
      features: [CoinFeature.STABLECOIN] as CoinFeature[],
      addressCoin: 'hteth',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['hteth:stgsofid'],
    fullName: 'Test SoFiUSD',
    decimalPlaces: 6,
    isTestnet: true,
    onchain: {
      id: 'a0660bd4-c508-4704-ac2b-c7ead1f6ad43',
      name: 'hteth:stgsofid',
      contractAddress: '0x5ce9c87a0b7208491f9fe52bcc8e919eb43c58b2',
      features: [...ACCOUNT_COIN_DEFAULT_FEATURES, CoinFeature.STABLECOIN] as CoinFeature[],
      network: Networks.test.hoodi,
    },
    offchain: {
      id: '145b2e09-453d-4861-8f54-5791d295bd96',
      name: 'ofchteth:stgsofid',
      features: [CoinFeature.STABLECOIN] as CoinFeature[],
      addressCoin: 'hteth',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['hteth:tsteth'],
    fullName: 'Hoodi Testnet STETH',
    decimalPlaces: 18,
    isTestnet: true,
    onchain: {
      id: '31eedb6e-3bd1-4407-b924-7136c4dc0483',
      name: 'hteth:tsteth',
      contractAddress: '0x3508a952176b3c15387c97be809eaffb1982176a',
      features: [
        ...AccountCoin.DEFAULT_FEATURES,
        CoinFeature.BULK_TRANSACTION,
        CoinFeature.REBASE_TOKEN,
      ] as CoinFeature[],
      network: Networks.test.hoodi,
    },
    offchain: {
      id: '72358644-ece4-41fd-9269-8d0bce6ff8cd',
      name: 'ofchteth:tsteth',
      addressCoin: 'hteth',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['hteth:gousd'],
    fullName: 'Hoodi Testnet GoUSD',
    decimalPlaces: 6,
    isTestnet: true,
    onchain: {
      id: '49ff49ea-3355-4717-bbb0-5e8f5cae2202',
      name: 'hteth:gousd',
      contractAddress: '0xb09d446d962498842bbcfd1e919373b3a2585fbb',
      features: [...ACCOUNT_COIN_DEFAULT_FEATURES, CoinFeature.STABLECOIN] as CoinFeature[],
      network: Networks.test.hoodi,
    },
    offchain: {
      id: 'f0fdaaaa-7587-4cc4-a2b3-875085d81ac8',
      name: 'ofchteth:gousd',
      features: [CoinFeature.STABLECOIN] as CoinFeature[],
      addressCoin: 'hteth',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['hteth:usd1'],
    fullName: 'Test USD1 Token',
    decimalPlaces: 18,
    isTestnet: true,
    onchain: {
      id: '0354c858-912b-4a65-b3e1-9b29a5f8573a',
      name: 'hteth:usd1',
      contractAddress: '0xed9e025fc3fd4ab704378ff5486b596f00dbef1b',
      features: [...ACCOUNT_COIN_DEFAULT_FEATURES, CoinFeature.STABLECOIN] as CoinFeature[],
      network: Networks.test.hoodi,
    },
    offchain: {
      id: '4dc4534c-72b8-4a68-a914-210dae1e5d4d',
      name: 'ofchteth:usd1',
      features: [CoinFeature.STABLECOIN] as CoinFeature[],
      addressCoin: 'hteth',
    },
  },
  {
    underlyingAsset: UnderlyingAsset['hteth:sofid'],
    fullName: 'Test SoFiUSD',
    decimalPlaces: 6,
    isTestnet: true,
    onchain: {
      id: '8e4f9c4c-2b03-4ad4-8019-ace4bbda3acd',
      name: 'hteth:sofid',
      contractAddress: '0x5572728e36b5510010ade1db6bbaea1c402411cc',
      features: [...ACCOUNT_COIN_DEFAULT_FEATURES, CoinFeature.STABLECOIN] as CoinFeature[],
      network: Networks.test.hoodi,
    },
    offchain: {
      id: '8e8028cb-855e-4cd7-8f7e-a00c63f0727c',
      name: 'ofchteth:sofid',
      features: [CoinFeature.STABLECOIN] as CoinFeature[],
      addressCoin: 'hteth',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TMSN,
    fullName: 'meson.network-testnet',
    decimalPlaces: 18,
    isTestnet: true,
    onchain: {
      id: '30179af0-ca75-4cb1-99d9-028bc56bf10e',
      name: 'tmsn',
      contractAddress: '0xde939833ed21fe3833d3d9e545dc7faa9f161d06',
      network: Networks.test.goerli,
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TXSGD,
    fullName: 'XSGD',
    decimalPlaces: 6,
    isTestnet: true,
    onchain: {
      id: '13ff20df-fde8-478e-919b-eff8ea7169ab',
      name: 'txsgd',
      contractAddress: '0x63681558c1b680e43bbcadc0ced21075854bba87',
      network: Networks.test.hoodi,
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TXUSD,
    fullName: 'XUSD Hoodi',
    decimalPlaces: 6,
    isTestnet: true,
    onchain: {
      id: 'd48aae8b-3a3c-46b7-a98f-ea7347dc5b45',
      name: 'txusd',
      contractAddress: '0x37557a96ea4415af2d96a6f896fa8281a22802ce',
      features: [...ACCOUNT_COIN_DEFAULT_FEATURES, CoinFeature.STABLECOIN] as CoinFeature[],
      network: Networks.test.hoodi,
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TWETH,
    fullName: 'Wrapped Ether',
    decimalPlaces: 18,
    isTestnet: true,
    onchain: {
      id: '346e3e87-1ac6-45fd-afa6-cad66872ebc1',
      name: 'tweth',
      contractAddress: '0x2387fd72c1da19f6486b843f5da562679fbb4057',
      features: TWETH_FEATURES as CoinFeature[],
      network: Networks.test.hoodi,
    },
  },
  {
    underlyingAsset: UnderlyingAsset['hteth:bgerchv2'],
    fullName: 'BG Test Token',
    decimalPlaces: 18,
    isTestnet: true,
    onchain: {
      id: '9d5730cf-a1c2-4d0e-9ee9-922add38a11e',
      name: 'hteth:bgerchv2',
      contractAddress: '0xd9327fd36c3312466efed23ff0493453ee32f551',
      features: HTETH_TOKEN_FEATURES as CoinFeature[],
      network: Networks.test.hoodi,
    },
  },
  {
    underlyingAsset: UnderlyingAsset['hteth:aut'],
    fullName: 'Holesky Testnet AllUnity',
    decimalPlaces: 6,
    isTestnet: true,
    onchain: {
      id: '29c9cb44-00a9-4740-8de0-abf0a321b830',
      name: 'hteth:aut',
      contractAddress: '0x63d0b467059a10b365aa18f441684ed154628f4e',
      features: HTETH_TOKEN_FEATURES as CoinFeature[],
      network: Networks.test.holesky,
    },
    offchain: {
      id: 'bf6a1c7b-eed7-46af-85ec-0adc09aa72d6',
      name: 'ofchteth:aut',
      addressCoin: 'hteth',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TOPM,
    fullName: 'Goerli Test OPM',
    decimalPlaces: 18,
    isTestnet: true,
    onchain: {
      id: 'f49e8632-7cd9-4e0b-a576-7e9cd12bcf82',
      name: 'topm',
      contractAddress: '0xfffad1676f1da8dfa7691db388a5d20d3b50c438',
      network: Networks.test.goerli,
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TERC18DP2,
    fullName: 'Test ERC Token 18 Decimals',
    decimalPlaces: 18,
    isTestnet: true,
    onchain: {
      id: '7ac2ea4c-e856-4495-b727-0e0dde011cab',
      name: 'terc18dp2',
      contractAddress: '0x18b17853ff62122c60f113b8b8967243c39ad30e',
      network: Networks.test.goerli,
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TERC18DP3,
    fullName: 'Test ERC Token 18 Decimals',
    decimalPlaces: 18,
    isTestnet: true,
    onchain: {
      id: 'a4c6431f-7709-4f54-a883-d0312229a603',
      name: 'terc18dp3',
      contractAddress: '0x96f13e2ea4b738380922dd9f5cd8fcf0416e5f2d',
      network: Networks.test.goerli,
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TERC18DP4,
    fullName: 'Test ERC Token 18 Decimals',
    decimalPlaces: 18,
    isTestnet: true,
    onchain: {
      id: '77f4057f-93d0-40e1-b0ec-21230a9e1ef6',
      name: 'terc18dp4',
      contractAddress: '0xbecf20f89b6898bd8bbf3fa93fb4bcda367b9594',
      network: Networks.test.goerli,
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TERC18DP5,
    fullName: 'Test ERC Token 18 Decimals',
    decimalPlaces: 18,
    isTestnet: true,
    onchain: {
      id: '141a2360-97c3-4289-8fbb-a7a5d9d5fdf9',
      name: 'terc18dp5',
      contractAddress: '0x4464fe55f9a8aea46e02c4a22b4d74661805ec26',
      network: Networks.test.goerli,
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TERC18DP6,
    fullName: 'Test ERC Token 18 Decimals',
    decimalPlaces: 18,
    isTestnet: true,
    onchain: {
      id: '7f2e9245-1676-4fd3-b4f3-4784927eec1b',
      name: 'terc18dp6',
      contractAddress: '0x998ddfd1ac3ed76fc163528c5fc69b8d67fa5395',
      network: Networks.test.goerli,
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TERC18DP7,
    fullName: 'Test ERC Token 18 Decimals',
    decimalPlaces: 18,
    isTestnet: true,
    onchain: {
      id: '7e6b255d-60d7-4580-820f-989ab52e36c8',
      name: 'terc18dp7',
      contractAddress: '0xf2555ac243ab2606fa71e2f2728117054dd1867b',
      network: Networks.test.goerli,
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TERC18DP8,
    fullName: 'Test ERC Token 18 Decimals',
    decimalPlaces: 18,
    isTestnet: true,
    onchain: {
      id: '32aab7d1-ee13-435d-bd49-4cc84cb71440',
      name: 'terc18dp8',
      contractAddress: '0xd9da1e909e3b4b2c1ec31b702bef0bf1e42533e4',
      network: Networks.test.goerli,
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TERC18DP9,
    fullName: 'Test ERC Token 18 Decimals',
    decimalPlaces: 18,
    isTestnet: true,
    onchain: {
      id: '4f9dd243-0991-4ad0-b089-92bcbb718ed0',
      name: 'terc18dp9',
      contractAddress: '0xb91be6a36b60c4576aff75a50d2b7c762349ddec',
      network: Networks.test.goerli,
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TERC18DP10,
    fullName: 'Test ERC Token 18 Decimals',
    decimalPlaces: 18,
    isTestnet: true,
    onchain: {
      id: 'd7797d54-3283-40c4-94ed-94ef24ce9ab0',
      name: 'terc18dp10',
      contractAddress: '0xc53d2c04795a1cef22a91c9d52c04f5082bb5631',
      network: Networks.test.goerli,
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TERC18DP11,
    fullName: 'Test ERC Token 18 Decimals',
    decimalPlaces: 18,
    isTestnet: true,
    onchain: {
      id: '942598b2-017a-499a-a67e-768225adcf03',
      name: 'terc18dp11',
      contractAddress: '0xc325d7f188dc6015f45d3d39e58c5404e79b5cb9',
      network: Networks.test.goerli,
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TERC18DP12,
    fullName: 'Test ERC Token 18 Decimals',
    decimalPlaces: 18,
    isTestnet: true,
    onchain: {
      id: '627b587f-baaa-4c48-bb26-0df90177abb5',
      name: 'terc18dp12',
      contractAddress: '0x7a8f375798284920cd27d1c757ceca3675603ab1',
      network: Networks.test.goerli,
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TERC18DP13,
    fullName: 'Test ERC Token 18 Decimals',
    decimalPlaces: 18,
    isTestnet: true,
    onchain: {
      id: '1986455a-152d-4b3e-a763-033361a57edc',
      name: 'terc18dp13',
      contractAddress: '0x2e3f4bf47e4ea53a7a94f0597b47fe3caab78b0d',
      network: Networks.test.goerli,
    },
    offchain: {
      id: '67b3f68b-a0bd-4bd7-b67e-36e8220bf67e',
      name: 'ofcterc18dp13',
      addressCoin: 'gteth',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TERC18DP14,
    fullName: 'Test ERC Token 18 Decimals',
    decimalPlaces: 18,
    isTestnet: true,
    onchain: {
      id: '5b60d468-219a-4d4d-ad29-847872564636',
      name: 'terc18dp14',
      contractAddress: '0x4f369aa78b9f299cb50ad4d96e13bdfbd8be7239',
      network: Networks.test.goerli,
    },
    offchain: {
      id: '3abd55f9-c3c7-4810-8ff4-bc31a3d0fc69',
      name: 'ofcterc18dp14',
      addressCoin: 'gteth',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TERC18DP15,
    fullName: 'Test ERC Token 18 Decimals',
    decimalPlaces: 18,
    isTestnet: true,
    onchain: {
      id: '771c1862-0bef-4ac1-9c4d-8668e3dc0891',
      name: 'terc18dp15',
      contractAddress: '0x0fcb9bc4c67d502a45a07f514638ca8f83ba2912',
      network: Networks.test.goerli,
    },
    offchain: {
      id: 'bffc55db-1f40-4e9e-857e-b591ac86d9b3',
      name: 'ofcterc18dp15',
      addressCoin: 'gteth',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TWDOGE,
    fullName: 'Test Wrapped DOGE',
    decimalPlaces: 8,
    isTestnet: true,
    onchain: {
      id: '43dac49b-4b58-44a5-bd22-3c7598698a63',
      name: 'twdoge',
      contractAddress: '0x9338e875972294cf04b275c17828807d01375085',
      network: Networks.test.goerli,
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TMATIC,
    fullName: 'Test Polygon',
    decimalPlaces: 18,
    isTestnet: true,
    onchain: {
      id: 'b286edf7-ca6f-4431-a6fd-7c0ec9be0b49',
      name: 'tmatic',
      contractAddress: '0x499d11e0b6eac7c0593d8fb292dcbbf815fb29ae',
      features: MATIC_FEATURES as CoinFeature[],
      network: Networks.test.goerli,
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TEST,
    fullName: 'Test Mintable ERC20 Token',
    decimalPlaces: 18,
    isTestnet: true,
    onchain: {
      id: '36e702ef-e0af-43f4-bec7-3b922ebd46ac',
      name: 'test',
      contractAddress: '0x1fb879581f31687b905653d4bbcbe3af507bed37',
    },
    offchain: {
      id: 'ac822eb1-4aa0-40d2-836d-7a24db24d47a',
      name: 'ofctest',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BST,
    fullName: 'Test BitGo Shield Token',
    decimalPlaces: 0,
    isTestnet: true,
    onchain: {
      id: '3afd1592-ffd4-4bee-99e7-2baeda333fdc',
      name: 'tbst',
      contractAddress: '0xe5cdf77835ca2095881dd0803a77e844c87483cd',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.SCHZ,
    fullName: 'SchnauzerCoin',
    decimalPlaces: 18,
    isTestnet: true,
    onchain: {
      id: 'b589727c-4993-45e9-afe1-d6ec52cfc1b3',
      name: 'schz',
      contractAddress: '0x050e25a2630b2aee94546589fd39785254de112c',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.CAT,
    fullName: 'Test CAT-20 Token',
    decimalPlaces: 18,
    isTestnet: true,
    onchain: {
      id: '5c7e28b8-0154-4400-9e67-3cc0b5f72e0c',
      name: 'tcat',
      contractAddress: '0x63137319f3a14a985eb31547370e0e3bd39b03b8',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.FMF,
    fullName: 'Test Formosa Financial Token',
    decimalPlaces: 18,
    isTestnet: true,
    onchain: {
      id: 'e972b57a-bf75-4e1a-9b7f-e90829c5a85f',
      name: 'tfmf',
      contractAddress: '0xd8463d2f8c5b3be9de95c63b73a0ae4c79423452',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TERC20,
    fullName: 'Test DAI',
    decimalPlaces: 18,
    isTestnet: true,
    onchain: {
      id: '669f7e23-a952-40cd-9d4b-2d2f4d4723a5',
      name: 'tdai',
      contractAddress: '0x4f96fe3b7a6cf9725f59d353f723c1bdb64ca6aa',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.RIF,
    fullName: 'Test RIF Token',
    decimalPlaces: 18,
    isTestnet: true,
    onchain: {
      id: 'e834a04c-a7bf-4c45-916a-dd03ad164afd',
      name: 'trif',
      contractAddress: '0x19f64674d8a5b4e652319f5e239efd3bc969a1fe',
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TUSDC,
    fullName: 'Goerli USDC',
    decimalPlaces: 6,
    isTestnet: true,
    onchain: {
      id: '23c7cdff-0a0d-4414-9cda-fb841344f712',
      name: 'tusdc',
      contractAddress: '0x07865c6e87b9f70255377e024ace6630c1eaa37f',
      features: [...ACCOUNT_COIN_DEFAULT_FEATURES, CoinFeature.STABLECOIN] as CoinFeature[],
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TUSDT,
    fullName: 'Goerli USDT',
    decimalPlaces: 6,
    isTestnet: true,
    onchain: {
      id: '891e4428-82b1-4970-8bad-a2cece698066',
      name: 'tusdt',
      contractAddress: '0xc2c527c0cacf457746bd31b2a698fe89de2b6d49',
      features: [...ACCOUNT_COIN_DEFAULT_FEATURES, CoinFeature.STABLECOIN] as CoinFeature[],
    },
  },
  {
    underlyingAsset: UnderlyingAsset.RLUSD,
    fullName: 'Test Ripple USD',
    decimalPlaces: 18,
    isTestnet: true,
    onchain: {
      id: '6b43e702-d0ba-44c8-af93-c10cd9c2e730',
      name: 'trlusd',
      contractAddress: '0xe101fb315a64cda9944e570a7bffafe60b994b1d',
      features: [...ACCOUNT_COIN_DEFAULT_FEATURES, CoinFeature.STABLECOIN] as CoinFeature[],
      network: Networks.test.holesky,
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TEIGEN,
    fullName: 'Test Eigen',
    decimalPlaces: 18,
    isTestnet: true,
    onchain: {
      id: '34dd36d9-18f9-4c99-b96e-d5c29ae2a4cd',
      name: 'teigen',
      contractAddress: '0x15d7d3408b2d5a1e6bcfae9e121d1ddacea8d7f8',
      network: Networks.test.hoodi,
    },
  },
  {
    underlyingAsset: UnderlyingAsset.TEINU,
    fullName: 'Test EigenInu',
    decimalPlaces: 18,
    isTestnet: true,
    onchain: {
      id: '49fde5ac-1204-4c5c-b62b-cc1363592193',
      name: 'teinu',
      contractAddress: '0xdeeeee2b48c121e6728ed95c860e296177849932',
      network: Networks.test.holesky,
    },
  },
  {
    underlyingAsset: UnderlyingAsset.BGERCH,
    fullName: 'Test ERC Token on Hoodi',
    decimalPlaces: 18,
    isTestnet: true,
    onchain: {
      id: '031e6052-ed7a-42cf-a6e6-2107d8e448ed',
      name: 'bgerch',
      contractAddress: '0xe0111b7941adb4ef6c3ac0b86cbccbd23d23062f',
      network: Networks.test.hoodi,
    },
  },
  {
    underlyingAsset: UnderlyingAsset.AMSTEST,
    fullName: 'AMS test token',
    decimalPlaces: 18,
    isTestnet: true,
    onchain: {
      id: '3b18a3d7-4a10-41ce-b763-42925da720f4',
      name: 'hteth:amstest',
      contractAddress: '0x6cab19bb0b986c252da86f859feb048ad8994ae3',
      network: Networks.test.hoodi,
    },
  },
  {
    underlyingAsset: UnderlyingAsset['tip:tmt'],
    fullName: 'TMT',
    decimalPlaces: 6,
    isTestnet: true,
    offchain: {
      id: '94eb6074-b01f-43b4-81ed-d53fb5c2566d',
      name: 'ofctip:tmt',
      addressCoin: 'tip',
      features: AccountCoin.DEFAULT_FEATURES,
    },
  },
  {
    underlyingAsset: UnderlyingAsset['xpl:syzusd'],
    fullName: 'Stake Yuzu USD',
    decimalPlaces: 18,
    isTestnet: false,
    offchain: {
      id: 'e46e4acc-5014-4dad-ba7d-660bae9299a4',
      name: 'ofcxpl:syzusd',
      addressCoin: 'xpl',
      features: AccountCoin.DEFAULT_FEATURES,
    },
  },
  {
    underlyingAsset: UnderlyingAsset['xpl:usdto'],
    fullName: 'USDTO',
    decimalPlaces: 6,
    isTestnet: false,
    offchain: {
      id: '94b84642-620e-496c-b43e-d532adacedce',
      name: 'ofcxpl:usdto',
      addressCoin: 'xpl',
      features: AccountCoin.DEFAULT_FEATURES,
    },
  },
];
